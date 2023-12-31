(function () {
  var exports, extensions;

  extensions = require("./extensions");

  exports = module.exports = {
    version: "0.0.0",
    Provider: require("./provider"),
    Consumer: require("./consumer"),
    OutcomeService: extensions.Outcomes.OutcomeService,
    Errors: require("./errors"),
    Stores: {
      RedisStore: require("./redis-nonce-store"),
      MemoryStore: require("./memory-nonce-store"),
      NonceStore: require("./nonce-store"),
    },
    Extensions: extensions,
    supported_versions: ["LTI-1p0"],
  };
}).call(this);
