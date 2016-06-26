'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = SortableContainer;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _Manager = require('../Manager');

var _Manager2 = _interopRequireDefault(_Manager);

var _utils = require('../utils');

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// Export Higher Order Sortable Container Component
function SortableContainer(WrappedComponent) {
	var _class, _temp;

	var config = arguments.length <= 1 || arguments[1] === undefined ? { withRef: false } : arguments[1];

	var manager = new _Manager2.default();

	return _temp = _class = function (_Component) {
		_inherits(_class, _Component);

		function _class() {
			var _this$events;

			_classCallCheck(this, _class);

			var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(_class).call(this));

			_this.state = {};

			_this.handleStart = function (e) {
				var node = (0, _utils.closest)(e.target, function (el) {
					return el.sortableInfo != null;
				});

				if (node) {
					var useDragHandle = _this.props.useDragHandle;
					var _node$sortableInfo = node.sortableInfo;
					var index = _node$sortableInfo.index;
					var collection = _node$sortableInfo.collection;


					if (useDragHandle && !e.target.sortableHandle) return;

					manager.active = { index: index, collection: collection };
					_this.pressTimer = setTimeout(function () {
						return _this.handlePress(e);
					}, _this.props.pressDelay);
				}
			};

			_this.cancel = function () {
				if (!_this.state.sorting) {
					clearTimeout(_this.pressTimer);
					manager.active = null;
				}
			};

			_this.handlePress = function (e) {
				var active = manager.getActive();

				if (active) {
					var _this$props = _this.props;
					var axis = _this$props.axis;
					var onSortStart = _this$props.onSortStart;
					var helperClass = _this$props.helperClass;
					var useWindowAsScrollContainer = _this$props.useWindowAsScrollContainer;
					var node = active.node;
					var index = active.index;
					var collection = active.collection;


					var containerBoundingRect = _this.container.getBoundingClientRect();

					_this.node = node;
					_this.width = node.offsetWidth;
					_this.height = node.offsetHeight;
					_this.dimension = axis == 'x' ? _this.width : _this.height;
					_this.boundingClientRect = node.getBoundingClientRect();
					_this.index = index;

					var edge = _this.edge = axis == 'x' ? 'Left' : 'Top';
					_this.offsetEdge = _this.getEdgeOffset(edge, node);
					_this.initialOffset = _this.getOffset(e);
					_this.initialScroll = _this.scrollContainer['scroll' + edge];

					_this.helper = _this.document.body.appendChild(node.cloneNode(true));
					_this.helper.style.position = 'fixed';
					_this.helper.style.top = _this.boundingClientRect.top + 'px';
					_this.helper.style.left = _this.boundingClientRect.left + 'px';
					_this.helper.style.width = _this.width + 'px';

					if (axis == 'x') {
						_this.minTranslate = (useWindowAsScrollContainer ? 0 : containerBoundingRect.left) - _this.boundingClientRect.left - _this.width / 2;
						_this.maxTranslate = (useWindowAsScrollContainer ? _this.contentWindow.innerWidth : containerBoundingRect.left + containerBoundingRect.width) - _this.boundingClientRect.left - _this.width / 2;
					} else {
						_this.minTranslate = (useWindowAsScrollContainer ? 0 : containerBoundingRect.top) - _this.boundingClientRect.top - _this.height / 2;
						_this.maxTranslate = (useWindowAsScrollContainer ? _this.contentWindow.innerHeight : containerBoundingRect.top + containerBoundingRect.height) - _this.boundingClientRect.top - _this.height / 2;
					}

					if (helperClass) {
						_this.helper.classList.add(helperClass.split(' '));
					}

					_this.listenerNode = _utils.touchSupport ? node : _this.contentWindow;
					_this.listenerNode.addEventListener(_utils.events.move, _this.handleSortMove);
					_this.listenerNode.addEventListener(_utils.events.end, _this.handleSortEnd);

					_this.setState({
						sorting: true,
						sortingIndex: index
					});

					if (onSortStart) onSortStart({ node: node, index: index, collection: collection }, e);
				}
			};

			_this.handleSortMove = function (e) {
				var onSortMove = _this.props.onSortMove;

				e.preventDefault(); // Prevent scrolling on mobile

				_this.updatePosition(e);
				_this.animateNodes();
				_this.autoscroll();

				if (onSortMove) onSortMove(e);
			};

			_this.handleSortEnd = function (e) {
				var _this$props2 = _this.props;
				var hideSortableGhost = _this$props2.hideSortableGhost;
				var onSortEnd = _this$props2.onSortEnd;
				var collection = manager.active.collection;

				// Remove the event listeners if the node is still in the DOM

				if (_this.listenerNode) {
					_this.listenerNode.removeEventListener(_utils.events.move, _this.handleSortMove);
					_this.listenerNode.removeEventListener(_utils.events.end, _this.handleSortEnd);
				}

				// Remove the helper from the DOM
				_this.helper.parentNode.removeChild(_this.helper);

				if (hideSortableGhost && _this.node) {
					_this.node.style.visibility = '';
				}

				var nodes = manager.refs[collection];
				for (var i = 0, len = nodes.length; i < len; i++) {
					var node = nodes[i];
					var el = node.node;

					node.edgeOffset = null; // Clear the cached offsetTop / offsetLeft value

					// Remove the transforms / transitions
					el.style[_utils.vendorPrefix + 'Transform'] = '';
					el.style[_utils.vendorPrefix + 'TransitionDuration'] = '';
				}

				if (typeof onSortEnd == 'function') {
					onSortEnd({
						oldIndex: _this.index,
						newIndex: _this.newIndex,
						collection: collection
					}, e);
				}

				// Stop autoscroll
				clearInterval(_this.autoscrollInterval);
				_this.autoscrollInterval = null;

				// Update state
				manager.active = null;
				_this.setState({
					sorting: false,
					sortingIndex: null
				});
			};

			_this.autoscroll = function () {
				var translate = _this.translate;
				var direction = void 0;
				var speed = 1;
				var acceleration = 10;

				if (translate >= _this.maxTranslate - _this.dimension / 2) {
					direction = 1; // Scroll Down
					speed = acceleration * Math.abs((_this.maxTranslate - _this.dimension / 2 - translate) / _this.dimension);
				} else if (translate <= _this.minTranslate + _this.dimension / 2) {
					direction = -1; // Scroll Up
					speed = acceleration * Math.abs((translate - _this.dimension / 2 - _this.minTranslate) / _this.dimension);
				}

				if (_this.autoscrollInterval) {
					clearTimeout(_this.autoscrollInterval);
					_this.autoscrollInterval = null;
					_this.isAutoScrolling = false;
				}

				if (direction) {
					_this.autoscrollInterval = setInterval(function () {
						_this.isAutoScrolling = true;
						var offset = 1 * speed * direction;
						_this.scrollContainer['scroll' + _this.edge] += offset;
						_this.translate += offset;
						_this.animateNodes();
					}, 5);
				}
			};

			_this.events = (_this$events = {}, _defineProperty(_this$events, _utils.events.start, _this.handleStart), _defineProperty(_this$events, _utils.events.move, _this.cancel), _defineProperty(_this$events, _utils.events.end, _this.cancel), _this$events);
			return _this;
		}

		_createClass(_class, [{
			key: 'getChildContext',
			value: function getChildContext() {
				return {
					manager: manager
				};
			}
		}, {
			key: 'componentDidMount',
			value: function componentDidMount() {
				var contentWindow = this.props.contentWindow;


				this.container = _reactDom2.default.findDOMNode(this);
				this.document = this.container.ownerDocument || document;
				this.scrollContainer = this.props.useWindowAsScrollContainer ? this.document.body : this.container;
				this.contentWindow = typeof contentWindow == 'function' ? contentWindow() : contentWindow;

				for (var key in this.events) {
					this.document.addEventListener(key, this.events[key]);
				}
			}
		}, {
			key: 'componentWillUnmount',
			value: function componentWillUnmount() {
				for (var key in this.events) {
					this.document.removeEventListener(key, this.events[key]);
				}
			}
		}, {
			key: 'getEdgeOffset',
			value: function getEdgeOffset(edge, node) {
				var offset = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

				// Get the actual offsetTop / offsetLeft value, no matter how deep the node is nested
				if (node) {
					if (node.parentNode !== this.container) {
						return this.getEdgeOffset(edge, node.parentNode, offset + node['offset' + edge]);
					} else {
						return node['offset' + edge] + offset;
					}
				}
			}
		}, {
			key: 'getOffset',
			value: function getOffset(e) {
				return {
					x: _utils.touchSupport ? e.touches[0].clientX : e.clientX,
					y: _utils.touchSupport ? e.touches[0].clientY : e.clientY
				};
			}
		}, {
			key: 'updatePosition',
			value: function updatePosition(e) {
				var _props = this.props;
				var axis = _props.axis;
				var lockAxis = _props.lockAxis;
				var lockToContainerEdges = _props.lockToContainerEdges;

				var offset = this.getOffset(e);
				var translate = {
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

				this.helper.style[_utils.vendorPrefix + 'Transform'] = 'translate3d(' + translate.x + 'px,' + translate.y + 'px, 0)';
			}
		}, {
			key: 'animateNodes',
			value: function animateNodes() {
				var _props2 = this.props;
				var axis = _props2.axis;
				var transitionDuration = _props2.transitionDuration;
				var hideSortableGhost = _props2.hideSortableGhost;

				var nodes = manager.getOrderedRefs();
				var deltaScroll = this.scrollContainer['scroll' + this.edge] - this.initialScroll;
				var sortingOffset = this.offsetEdge + this.translate + deltaScroll;
				this.newIndex = null;

				for (var i = 0, len = nodes.length; i < len; i++) {
					var _nodes$i = nodes[i];
					var node = _nodes$i.node;
					var index = _nodes$i.index;
					var edgeOffset = _nodes$i.edgeOffset;

					var dimension = axis == 'x' ? node.offsetWidth : node.offsetHeight;
					var offset = this.dimension > dimension ? dimension / 2 : this.dimension / 2;
					var translate = 0;
					var translateX = 0;
					var translateY = 0;

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
						node.style[_utils.vendorPrefix + 'TransitionDuration'] = transitionDuration + 'ms';
					}
					if (index > this.index && sortingOffset + offset >= edgeOffset) {
						translate = -this.dimension;
						this.newIndex = index;
					} else if (index < this.index && sortingOffset <= edgeOffset + offset) {
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

					node.style[_utils.vendorPrefix + 'Transform'] = 'translate3d(' + translateX + 'px,' + translateY + 'px,0)';
				}
				if (this.newIndex == null) {
					this.newIndex = this.index;
				}
			}
		}, {
			key: 'getWrappedInstance',
			value: function getWrappedInstance() {
				(0, _invariant2.default)(config.withRef, 'To access the wrapped instance, you need to pass in {withRef: true} as the second argument of the SortableContainer() call');
				return this.refs.wrappedInstance;
			}
		}, {
			key: 'render',
			value: function render() {
				var ref = config.withRef ? 'wrappedInstance' : null;

				return _react2.default.createElement(WrappedComponent, _extends({ ref: ref }, this.props, this.state));
			}
		}]);

		return _class;
	}(_react.Component), _class.displayName = WrappedComponent.displayName ? 'SortableList(' + WrappedComponent.displayName + ')' : 'SortableList', _class.WrappedComponent = WrappedComponent, _class.defaultProps = {
		axis: 'y',
		transitionDuration: 300,
		pressDelay: 0,
		useWindowAsScrollContainer: false,
		hideSortableGhost: true,
		contentWindow: typeof window == 'undefined' ? new Object() : window,
		lockToContainerEdges: false
	}, _class.propTypes = {
		axis: _react.PropTypes.string,
		lockAxis: _react.PropTypes.string,
		helperClass: _react.PropTypes.string,
		transitionDuration: _react.PropTypes.number,
		contentWindow: _react.PropTypes.any,
		onSortStart: _react.PropTypes.func,
		onSortMove: _react.PropTypes.func,
		onSortEnd: _react.PropTypes.func,
		pressDelay: _react.PropTypes.number,
		useDragHandle: _react.PropTypes.bool,
		useWindowAsScrollContainer: _react.PropTypes.bool,
		hideSortableGhost: _react.PropTypes.bool,
		lockToContainerEdges: _react.PropTypes.bool
	}, _class.childContextTypes = {
		manager: _react.PropTypes.object.isRequired
	}, _temp;
}