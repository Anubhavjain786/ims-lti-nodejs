(function () {
  var NonceStore,
    exports,
    bind = function (fn, me) {
      return function () {
        return fn.apply(me, arguments);
      };
    };

  NonceStore = (function () {
    function NonceStore() {
      this.setUsed = bind(this.setUsed, this);
      this.isNew = bind(this.isNew, this);
    }

    NonceStore.prototype.isNonceStore = function () {
      return true;
    };

    NonceStore.prototype.isNew = function () {
      var arg, i;
      for (i in arguments) {
        arg = arguments[i];
        if (typeof arg === "function") {
          return arg(new Error("NOT IMPLEMENTED"), false);
        }
      }
    };

    NonceStore.prototype.setUsed = function () {
      var arg, i;
      for (i in arguments) {
        arg = arguments[i];
        if (typeof arg === "function") {
          return arg(new Error("NOT IMPLEMENTED"), false);
        }
      }
    };

    return NonceStore;
  })();

  exports = module.exports = NonceStore;
}).call(this);
