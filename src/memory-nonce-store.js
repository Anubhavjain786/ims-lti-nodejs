(function () {
  var EXPIRE_IN_SEC,
    MemoryNonceStore,
    NonceStore,
    exports,
    extend = function (child, parent) {
      for (var key in parent) {
        if (hasProp.call(parent, key)) child[key] = parent[key];
      }
      function ctor() {
        this.constructor = child;
      }
      ctor.prototype = parent.prototype;
      child.prototype = new ctor();
      child.__super__ = parent.prototype;
      return child;
    },
    hasProp = {}.hasOwnProperty;

  NonceStore = require("./nonce-store");

  EXPIRE_IN_SEC = 5 * 60;

  MemoryNonceStore = (function (superClass) {
    extend(MemoryNonceStore, superClass);

    function MemoryNonceStore() {
      this.used = Object.create(null);
    }

    MemoryNonceStore.prototype.isNew = function (nonce, timestamp, next) {
      var firstTimeSeen;
      if (next == null) {
        next = function () {};
      }
      if (
        typeof nonce === "undefined" ||
        nonce === null ||
        typeof nonce === "function" ||
        typeof timestamp === "function" ||
        typeof timestamp === "undefined"
      ) {
        return next(new Error("Invalid parameters"), false);
      }
      this._clearNonces();
      firstTimeSeen = this.used[nonce] === void 0;
      if (!firstTimeSeen) {
        return next(new Error("Nonce already seen"), false);
      }
      return this.setUsed(nonce, timestamp, function (err) {
        var currentTime, timestampIsFresh;
        if (typeof timestamp !== "undefined" && timestamp !== null) {
          timestamp = parseInt(timestamp, 10);
          currentTime = Math.round(Date.now() / 1000);
          timestampIsFresh = currentTime - timestamp <= EXPIRE_IN_SEC;
          if (timestampIsFresh) {
            return next(null, true);
          } else {
            return next(new Error("Expired timestamp"), false);
          }
        } else {
          return next(new Error("Timestamp required"), false);
        }
      });
    };

    MemoryNonceStore.prototype.setUsed = function (nonce, timestamp, next) {
      if (next == null) {
        next = function () {};
      }
      this.used[nonce] = timestamp + EXPIRE_IN_SEC;
      return next(null);
    };

    MemoryNonceStore.prototype._clearNonces = function () {
      var expiry, nonce, now, ref;
      now = Math.round(Date.now() / 1000);
      ref = this.used;
      for (nonce in ref) {
        expiry = ref[nonce];
        if (expiry <= now) {
          delete this.used[nonce];
        }
      }
    };

    return MemoryNonceStore;
  })(NonceStore);

  exports = module.exports = MemoryNonceStore;
}).call(this);
