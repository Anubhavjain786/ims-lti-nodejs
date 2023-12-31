(function () {
  var EXPIRE_IN_SEC,
    NonceStore,
    RedisNonceStore,
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

  RedisNonceStore = (function (superClass) {
    extend(RedisNonceStore, superClass);

    function RedisNonceStore(redisClient) {
      if (typeof redisClient === "string" && arguments.length === 2) {
        redisClient = arguments[1];
      }
      this.redis = redisClient;
    }

    RedisNonceStore.prototype.isNew = function (nonce, timestamp, next) {
      var currentTime, freshTimestamp;
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
      if (typeof timestamp === "undefined" || timestamp === null) {
        return next(new Error("Timestamp required"), false);
      }
      currentTime = Math.round(Date.now() / 1000);
      freshTimestamp = currentTime - parseInt(timestamp, 10) <= EXPIRE_IN_SEC;
      if (!freshTimestamp) {
        return next(new Error("Expired timestamp"), false);
      }
      return this.redis.get(
        nonce,
        (function (_this) {
          return function (err, seen) {
            if (seen) {
              return next(new Error("Nonce already seen"), false);
            }
            _this.setUsed(nonce, timestamp);
            return next(null, true);
          };
        })(this)
      );
    };

    RedisNonceStore.prototype.setUsed = function (nonce, timestamp, next) {
      if (next == null) {
        next = function () {};
      }
      this.redis.set(nonce, timestamp);
      this.redis.expire(nonce, EXPIRE_IN_SEC);
      return next(null);
    };

    return RedisNonceStore;
  })(NonceStore);

  exports = module.exports = RedisNonceStore;
}).call(this);
