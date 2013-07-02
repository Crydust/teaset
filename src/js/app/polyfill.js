if (!Array.prototype.forEach) {
    Array.prototype.forEach = function(fun /*, thisp */) {
        "use strict";

        if (this === void 0 || this === null) {
            throw "TypeError";
        }

        var t = Object(this);
        var len = t.length >>> 0;
        if (typeof fun !== "function") {
            throw "TypeError";
        }

        var thisp = arguments[1];
        for (var i = 0; i < len; i++) {
            if (i in t) {
                fun.call(thisp, t[i], i, t);
            }
        }
    };
}

if (!Array.prototype.map) {
    Array.prototype.map = function(fun /*, thisp */) {
        "use strict";

        if (this === void 0 || this === null) {
            throw "TypeError";
        }

        var t = Object(this);
        var len = t.length >>> 0;
        if (typeof fun !== "function") {
            throw "TypeError";
        }

        var res = new Array(len);
        var thisp = arguments[1];
        for (var i = 0; i < len; i++) {
            if (i in t) {
                res[i] = fun.call(thisp, t[i], i, t);
            }
        }

        return res;
    };
}

if (!String.prototype.trim) {
    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g,'');
    };
}

(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelRequestAnimationFrame = window[vendors[x]+
          'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());
