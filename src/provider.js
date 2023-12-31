(function () {
  var HMAC_SHA1,
    MemoryNonceStore,
    Provider,
    errors,
    exports,
    extensions,
    bind = function (fn, me) {
      return function () {
        return fn.apply(me, arguments);
      };
    };

  HMAC_SHA1 = require("./hmac-sha1");

  MemoryNonceStore = require("./memory-nonce-store");

  errors = require("./errors");

  extensions = require("./extensions");

  Provider = (function () {
    function Provider(
      consumer_key,
      consumer_secret,
      nonceStore,
      signature_method
    ) {
      if (signature_method == null) {
        signature_method = new HMAC_SHA1();
      }
      this.parse_request = bind(this.parse_request, this);
      this.valid_request = bind(this.valid_request, this);
      if (typeof consumer_key === "undefined" || consumer_key === null) {
        throw new errors.ConsumerError("Must specify consumer_key");
      }
      if (typeof consumer_secret === "undefined" || consumer_secret === null) {
        throw new errors.ConsumerError("Must specify consumer_secret");
      }
      if (!nonceStore) {
        nonceStore = new MemoryNonceStore();
      }
      if (
        !(typeof nonceStore.isNonceStore === "function"
          ? nonceStore.isNonceStore()
          : void 0)
      ) {
        throw new errors.ParameterError(
          "Fourth argument must be a nonceStore object"
        );
      }
      this.consumer_key = consumer_key;
      this.consumer_secret = consumer_secret;
      this.signer = signature_method;
      this.nonceStore = nonceStore;
      this.body = {};
    }

    Provider.prototype.valid_request = function (req, body, callback) {
      if (!callback) {
        callback = body;
        body = void 0;
      }
      body = body || req.body || req.payload;
      callback = callback || function () {};
      this.parse_request(req, body);
      if (!this._valid_parameters(body)) {
        return callback(
          new errors.ParameterError("Invalid LTI parameters"),
          false
        );
      }
      return this._valid_oauth(req, body, callback);
    };

    Provider.prototype._valid_parameters = function (body) {
      var correct_version, has_resource_link_id, omits_content_item_params;
      if (!body) {
        return false;
      }
      correct_version =
        require("./ims-lti").supported_versions.indexOf(body.lti_version) !==
        -1;
      has_resource_link_id = body.hasOwnProperty("resource_link_id")
        ? body.resource_link_id != null
        : true;
      omits_content_item_params =
        body.resource_link_id == null &&
        body.resource_link_title == null &&
        body.resource_link_description == null &&
        body.launch_presentation_return_url == null &&
        body.lis_result_sourcedid == null;
      return (
        (correct_version &&
          body.lti_message_type === "basic-lti-launch-request" &&
          has_resource_link_id) ||
        (body.lti_message_type === "ContentItemSelectionRequest" &&
          omits_content_item_params)
      );
    };

    Provider.prototype._valid_oauth = function (req, body, callback) {
      var generated, valid_signature;
      generated = this.signer.build_signature(req, body, this.consumer_secret);
      valid_signature = generated === body.oauth_signature;
      if (!valid_signature) {
        return callback(new errors.SignatureError("Invalid Signature"), false);
      }
      return this.nonceStore.isNew(
        body.oauth_nonce,
        body.oauth_timestamp,
        function (err, valid) {
          if (!valid) {
            return callback(new errors.NonceError("Expired nonce"), false);
          } else {
            return callback(null, true);
          }
        }
      );
    };

    Provider.prototype.parse_request = function (req, body) {
      var extension, extension_name, id, key, results, val;
      body = body || req.body || req.payload;
      for (key in body) {
        val = body[key];
        if (key.match(/^oauth_/)) {
          continue;
        }
        this.body[key] = val;
      }
      if (typeof this.body.roles === "string") {
        this.body.roles = this.body.roles.split(",");
      }
      this.admin = this.has_role("Administrator");
      this.alumni = this.has_role("Alumni");
      this.content_developer = this.has_role("ContentDeveloper");
      this.guest = this.has_role("Guest");
      this.instructor =
        this.has_role("Instructor") ||
        this.has_role("Faculty") ||
        this.has_role("Staff");
      this.manager = this.has_role("Manager");
      this.member = this.has_role("Member");
      this.mentor = this.has_role("Mentor");
      this.none = this.has_role("None");
      this.observer = this.has_role("Observer");
      this.other = this.has_role("Other");
      this.prospective_student = this.has_role("ProspectiveStudent");
      this.student = this.has_role("Learner") || this.has_role("Student");
      this.ta = this.has_role("TeachingAssistant");
      this.launch_request =
        this.body.lti_message_type === "basic-lti-launch-request";
      this.username =
        this.body.lis_person_name_given ||
        this.body.lis_person_name_family ||
        this.body.lis_person_name_full ||
        "";
      this.userId = this.body.user_id;
      if (typeof this.body.role_scope_mentor === "string") {
        this.mentor_user_ids = function () {
          var i, len, ref, results;
          ref = this.body.role_scope_mentor.split(",");
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            id = ref[i];
            results.push(decodeURIComponent(id));
          }
          return results;
        }.call(this);
      }
      this.context_id = this.body.context_id;
      this.context_label = this.body.context_label;
      this.context_title = this.body.context_title;
      results = [];
      for (extension_name in extensions) {
        extension = extensions[extension_name];
        results.push(extension.init(this));
      }
      return results;
    };

    Provider.prototype.has_role = function (role) {
      var regex;
      regex = new RegExp(
        "^(urn:lti:(sys|inst)?role:ims/lis/)?" + role + "(/.+)?$",
        "i"
      );
      return (
        this.body.roles &&
        this.body.roles.some(function (r) {
          return regex.test(r);
        })
      );
    };

    return Provider;
  })();

  exports = module.exports = Provider;
}).call(this);
