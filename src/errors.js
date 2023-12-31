(function () {
  var ConsumerError,
    ExtensionError,
    NonceError,
    OutcomeResponseError,
    ParameterError,
    SignatureError,
    StoreError,
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

  ConsumerError = (function (superClass) {
    extend(ConsumerError, superClass);

    function ConsumerError(message) {
      this.message = message;
      ConsumerError.__super__.constructor.apply(this, arguments);
    }

    return ConsumerError;
  })(Error);

  ExtensionError = (function (superClass) {
    extend(ExtensionError, superClass);

    function ExtensionError(message) {
      this.message = message;
      ExtensionError.__super__.constructor.apply(this, arguments);
    }

    return ExtensionError;
  })(Error);

  StoreError = (function (superClass) {
    extend(StoreError, superClass);

    function StoreError(message) {
      this.message = message;
      StoreError.__super__.constructor.apply(this, arguments);
    }

    return StoreError;
  })(Error);

  ParameterError = (function (superClass) {
    extend(ParameterError, superClass);

    function ParameterError(message) {
      this.message = message;
      ParameterError.__super__.constructor.apply(this, arguments);
    }

    return ParameterError;
  })(Error);

  SignatureError = (function (superClass) {
    extend(SignatureError, superClass);

    function SignatureError(message) {
      this.message = message;
      SignatureError.__super__.constructor.apply(this, arguments);
    }

    return SignatureError;
  })(Error);

  NonceError = (function (superClass) {
    extend(NonceError, superClass);

    function NonceError(message) {
      this.message = message;
      NonceError.__super__.constructor.apply(this, arguments);
    }

    return NonceError;
  })(Error);

  OutcomeResponseError = (function (superClass) {
    extend(OutcomeResponseError, superClass);

    function OutcomeResponseError(message) {
      this.message = message;
      OutcomeResponseError.__super__.constructor.apply(this, arguments);
    }

    return OutcomeResponseError;
  })(Error);

  module.exports = {
    ConsumerError: ConsumerError,
    ExtensionError: ExtensionError,
    StoreError: StoreError,
    ParameterError: ParameterError,
    SignatureError: SignatureError,
    NonceError: NonceError,
    OutcomeResponseError: OutcomeResponseError,
  };
}).call(this);
