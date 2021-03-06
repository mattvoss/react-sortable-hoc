import find from 'lodash/find';
import sortBy from 'lodash/sortBy';

var Manager = function () {
	function Manager() {
		babelHelpers.classCallCheck(this, Manager);
		this.refs = {};
	}

	babelHelpers.createClass(Manager, [{
		key: 'add',
		value: function add(collection, ref) {
			if (!this.refs[collection]) this.refs[collection] = [];

			this.refs[collection].push(ref);
		}
	}, {
		key: 'getIndex',
		value: function getIndex(collection, ref) {
			return this.refs[collection].indexOf(ref);
		}
	}, {
		key: 'getOrderedRefs',
		value: function getOrderedRefs() {
			var collection = arguments.length <= 0 || arguments[0] === undefined ? this.active.collection : arguments[0];

			return sortBy(this.refs[collection], 'index');
		}
	}, {
		key: 'remove',
		value: function remove(collection, ref) {
			var index = this.getIndex(collection, ref);

			if (index !== -1) {
				this.refs[collection].splice(index, 1);
			}
		}
	}, {
		key: 'getActive',
		value: function getActive() {
			var _this = this;

			return find(this.refs[this.active.collection], function (ref) {
				return ref.index == _this.active.index;
			});
		}
	}]);
	return Manager;
}();

export default Manager;