export function arrayMove(array, previousIndex, newIndex) {
    if (newIndex >= array.length) {
        var k = newIndex - array.length;
        while (k-- + 1) {
            array.push(undefined);
        }
    }
    array.splice(newIndex, 0, array.splice(previousIndex, 1)[0]);
    return array;
}

export var touchSupport = typeof window == 'undefined' ? false : Boolean('ontouchstart' in window || window.DocumentTouch && document instanceof window.DocumentTouch);

export var events = {
    start: touchSupport ? 'touchstart' : 'mousedown',
    move: touchSupport ? 'touchmove' : 'mousemove',
    end: touchSupport ? 'touchend' : 'mouseup'
};

export var vendorPrefix = function () {
    if (typeof window == 'undefined') {
        return '';
    } else {
        var styles = window.getComputedStyle(document.documentElement, '');
        var pre = (Array.prototype.slice.call(styles).join('').match(/-(moz|webkit|ms)-/) || styles.OLink === '' && ['', 'o'])[1];
        return pre[0].toUpperCase() + pre.substr(1);
    }
}();

export function closest(el, fn) {
    while (el) {
        if (fn(el)) return el;
        el = el.parentNode;
    }
}