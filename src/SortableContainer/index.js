import React, {Component, PropTypes} from 'react';
import ReactDOM from 'react-dom';
import Manager from '../Manager';
import {closest, events, touchSupport, vendorPrefix} from '../utils';
import invariant from 'invariant';

// Export Higher Order Sortable Container Component
export default function SortableContainer(WrappedComponent, config = {withRef: false}) {
	const manager = new Manager();

	return class extends Component {
		constructor() {
			super();
			this.events = {
				[events.start]: this.handleStart,
				[events.move]: this.cancel,
				[events.end]: this.cancel
			};
		}
		static displayName = (WrappedComponent.displayName) ? `SortableList(${WrappedComponent.displayName})` : 'SortableList';
        static WrappedComponent = WrappedComponent;
		static defaultProps = {
			axis: 'y',
			transitionDuration: 300,
			pressDelay: 0,
			useWindowAsScrollContainer: false,
			hideSortableGhost: true,
			contentWindow:  (typeof(window) == 'undefined') ? new Object() : window,
			lockToContainerEdges: false
		};
		static propTypes = {
			axis: PropTypes.string,
			lockAxis: PropTypes.string,
			helperClass: PropTypes.string,
			transitionDuration: PropTypes.number,
			contentWindow: PropTypes.any,
			onSortStart: PropTypes.func,
			onSortMove: PropTypes.func,
			onSortEnd: PropTypes.func,
			pressDelay: PropTypes.number,
			useDragHandle: PropTypes.bool,
			useWindowAsScrollContainer: PropTypes.bool,
			hideSortableGhost: PropTypes.bool,
			lockToContainerEdges: PropTypes.bool
		};
		static childContextTypes = {
			manager: PropTypes.object.isRequired
		};
		state = {};
		getChildContext() {
			return {
				manager
			};
		}
		componentDidMount() {
			let {contentWindow} = this.props;

			this.container = ReactDOM.findDOMNode(this);
			this.document = this.container.ownerDocument || document;
			this.scrollContainer = (this.props.useWindowAsScrollContainer) ? this.document.body : this.container;
			this.contentWindow = (typeof contentWindow == 'function') ? contentWindow() : contentWindow;

			for (let key in this.events) {
				this.document.addEventListener(key, this.events[key]);
			}
		}
		componentWillUnmount() {
			for (let key in this.events) {
				this.document.removeEventListener(key, this.events[key]);
			}
		}
		handleStart = (e) => {
			let node = closest(e.target, (el) => el.sortableInfo != null);

			if (node) {
				let {useDragHandle} = this.props;
				let {index, collection} = node.sortableInfo;

				if (useDragHandle && !e.target.sortableHandle) return;

				manager.active = {index, collection};
				this.pressTimer = setTimeout(() => this.handlePress(e), this.props.pressDelay);
			}
		};
		cancel = () => {
			if (!this.state.sorting) {
				clearTimeout(this.pressTimer);
				manager.active = null;
			}
		};
		handlePress = (e) => {
			let active = manager.getActive();

			if (active) {
				let {axis, onSortStart, helperClass, useWindowAsScrollContainer} = this.props;
				let {node, index, collection} = active;

				let containerBoundingRect = this.container.getBoundingClientRect();

				this.node = node;
				this.width = node.offsetWidth;
				this.height = node.offsetHeight;
				this.dimension = (axis == 'x') ? this.width : this.height;
				this.boundingClientRect = node.getBoundingClientRect();
				this.index = index;

				let edge = this.edge = (axis == 'x') ? 'Left' : 'Top';
				this.offsetEdge = this.getEdgeOffset(edge, node);
				this.initialOffset = this.getOffset(e);
				this.initialScroll = this.scrollContainer[`scroll${edge}`];

				this.helper = this.document.body.appendChild(node.cloneNode(true));
				this.helper.style.position = 'fixed';
				this.helper.style.top = `${this.boundingClientRect.top}px`;
				this.helper.style.left = `${this.boundingClientRect.left}px`;
				this.helper.style.width = `${this.width}px`;

				if (axis == 'x') {
					this.minTranslate = ((useWindowAsScrollContainer) ? 0 : containerBoundingRect.left) - this.boundingClientRect.left - this.width/2;
					this.maxTranslate = ((useWindowAsScrollContainer) ? this.contentWindow.innerWidth : containerBoundingRect.left + containerBoundingRect.width) - this.boundingClientRect.left - this.width/2;
				} else {
					this.minTranslate = ((useWindowAsScrollContainer) ? 0 : containerBoundingRect.top) - this.boundingClientRect.top - this.height/2;
					this.maxTranslate = ((useWindowAsScrollContainer) ? this.contentWindow.innerHeight : containerBoundingRect.top + containerBoundingRect.height) - this.boundingClientRect.top - this.height/2;
				}

				if (helperClass) {
					this.helper.classList.add(helperClass.split(' '));
				}

				this.listenerNode = (touchSupport) ? node : this.contentWindow;
				this.listenerNode.addEventListener(events.move, this.handleSortMove);
				this.listenerNode.addEventListener(events.end, this.handleSortEnd);

				this.setState({
					sorting: true,
					sortingIndex: index
				});

				if (onSortStart) onSortStart({node, index, collection}, e);
			}
		}
		handleSortMove = (e) => {
			let {onSortMove} = this.props;
			e.preventDefault(); // Prevent scrolling on mobile

			this.updatePosition(e);
			this.animateNodes();
			this.autoscroll();

			if (onSortMove) onSortMove(e);
		}
		handleSortEnd = (e) => {
			let {hideSortableGhost, onSortEnd} = this.props;
			let {collection} = manager.active;

			// Remove the event listeners if the node is still in the DOM
			if (this.listenerNode) {
				this.listenerNode.removeEventListener(events.move, this.handleSortMove);
				this.listenerNode.removeEventListener(events.end, this.handleSortEnd);
			}

			// Remove the helper from the DOM
			this.helper.parentNode.removeChild(this.helper);

			if (hideSortableGhost && this.node) {
				this.node.style.visibility = '';
			}

			let nodes = manager.refs[collection];
			for (let i = 0, len = nodes.length; i < len; i++) {
				let node = nodes[i];
				let {node: el} = node;
				node.edgeOffset = null; // Clear the cached offsetTop / offsetLeft value

				// Remove the transforms / transitions
				el.style[`${vendorPrefix}Transform`] = '';
				el.style[`${vendorPrefix}TransitionDuration`] = '';
			}

			if (typeof onSortEnd == 'function') {
				onSortEnd({
					oldIndex: this.index,
					newIndex: this.newIndex,
					collection: collection
				}, e);
			}

			// Stop autoscroll
			clearInterval(this.autoscrollInterval);
			this.autoscrollInterval = null;

			// Update state
			manager.active = null;
			this.setState({
				sorting: false,
				sortingIndex: null
			});
		}
		getEdgeOffset(edge, node, offset = 0) {
			// Get the actual offsetTop / offsetLeft value, no matter how deep the node is nested
			if (node) {
				if (node.parentNode !== this.container) {
					return this.getEdgeOffset(edge, node.parentNode, offset + node[`offset${edge}`]);
				} else {
					return node[`offset${edge}`] + offset;
				}
			}
		}
		getOffset(e) {
			return {
				x: (touchSupport) ? e.touches[0].clientX : e.clientX,
				y: (touchSupport) ? e.touches[0].clientY : e.clientY
			}
		}
		updatePosition(e) {
			let {axis, lockAxis, lockToContainerEdges} = this.props;
			let offset = this.getOffset(e);
			let translate = {
				x: offset.x - this.initialOffset.x,
				y: offset.y - this.initialOffset.y
			};

			this.translate = translate[axis];

			if (lockToContainerEdges) {
				if (translate[axis] < this.minTranslate) {
					translate[axis] = this.minTranslate;
				} else if (translate[axis] > this.maxTranslate) {
					translate[axis] = this.maxTranslate;
				}
			}

			switch (lockAxis) {
				case 'x':
					translate.y = 0;
					break;
				case 'y':
					translate.x = 0;
					break;
			}

			this.helper.style[`${vendorPrefix}Transform`] = `translate3d(${translate.x}px,${translate.y}px, 0)`;
		}
		animateNodes() {
			let {axis, transitionDuration, hideSortableGhost} = this.props;
			let nodes = manager.getOrderedRefs();
			let deltaScroll = this.scrollContainer[`scroll${this.edge}`] - this.initialScroll;
			let sortingOffset = this.offsetEdge + this.translate + deltaScroll;
			this.newIndex = null;

			for (let i = 0, len = nodes.length; i < len; i++) {
				let {node, index, edgeOffset} = nodes[i];
				let dimension = (axis == 'x') ? node.offsetWidth : node.offsetHeight;
				let offset = (this.dimension > dimension) ? dimension / 2 : this.dimension / 2;
				let translate = 0;
				let translateX = 0;
				let translateY = 0;

				// If we haven't cached the node's offsetTop / offsetLeft value
				if (edgeOffset == null) {
					nodes[i].edgeOffset = edgeOffset = this.getEdgeOffset(this.edge, node);
				}

				// If the node is the one we're currently animating, skip it
				if (index === this.index) {
					if (hideSortableGhost) {
						node.style.visibility = 'hidden';
					}
					continue;
				}

				if (transitionDuration) {
					node.style[`${vendorPrefix}TransitionDuration`] = `${transitionDuration}ms`;
				}
				if (index > this.index && (sortingOffset + offset >= edgeOffset)) {
					translate = -this.dimension;
					this.newIndex = index;
				}
				else if (index < this.index && (sortingOffset <= edgeOffset + offset)) {
					translate = this.dimension;

					if (this.newIndex == null) {
						this.newIndex = index;
					}
				}

				if (axis == 'x') {
					translateX = translate;
				} else {
					translateY = translate;
				}

				node.style[`${vendorPrefix}Transform`] = `translate3d(${translateX}px,${translateY}px,0)`;
			}
			if (this.newIndex == null) {
				this.newIndex = this.index;
			}
		}
		autoscroll = () => {
			let translate = this.translate;
			let direction;
			let speed = 1;
			let acceleration = 10;

			if (translate >= this.maxTranslate - this.dimension/2) {
				direction = 1; // Scroll Down
				speed = acceleration * Math.abs((this.maxTranslate - this.dimension/2 - translate) / this.dimension);
			} else if (translate <= this.minTranslate + this.dimension/2) {
				direction = -1; // Scroll Up
				speed = acceleration * Math.abs((translate - this.dimension/2 - this.minTranslate) / this.dimension);
			}

			if (this.autoscrollInterval) {
				clearTimeout(this.autoscrollInterval);
				this.autoscrollInterval = null;
				this.isAutoScrolling = false;
			}

			if (direction) {
				this.autoscrollInterval = setInterval(() => {
					this.isAutoScrolling = true;
					let offset = 1 * speed * direction;
					this.scrollContainer[`scroll${this.edge}`] += offset;
					this.translate += offset;
					this.animateNodes();
				}, 5);
			}
		};
		getWrappedInstance() {
            invariant(config.withRef, 'To access the wrapped instance, you need to pass in {withRef: true} as the second argument of the SortableContainer() call');
            return this.refs.wrappedInstance;
        }
        render() {
            const ref = (config.withRef) ? 'wrappedInstance' : null;

			return <WrappedComponent ref={ref} {...this.props} {...this.state} />;
		}
	}
}
