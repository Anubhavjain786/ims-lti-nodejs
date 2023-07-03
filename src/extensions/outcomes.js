(function () {
  var HMAC_SHA1,
    OutcomeDocument,
    OutcomeService,
    crypto,
    errors,
    http,
    https,
    navigateXml,
    url,
    utils,
    uuid,
    xml2js,
    xml_builder;

  crypto = require("crypto");

  http = require("http");

  https = require("https");

  url = require("url");

  uuid = require("node-uuid");

  xml2js = require("xml2js");

  xml_builder = require("xmlbuilder");

  errors = require("../errors");

  HMAC_SHA1 = require("../hmac-sha1");

  utils = require("../utils");

  navigateXml = function (xmlObject, path) {
    var i, len, part, ref, ref1;
    ref = path.split(".");
    for (i = 0, len = ref.length; i < len; i++) {
      part = ref[i];
      xmlObject =
        xmlObject != null
          ? (ref1 = xmlObject[part]) != null
            ? ref1[0]
            : void 0
          : void 0;
    }
    return xmlObject;
  };

  OutcomeDocument = (function () {
    function OutcomeDocument(type, source_did, outcome_service) {
      var xmldec;
      this.outcome_service = outcome_service;
      xmldec = {
        version: "1.0",
        encoding: "UTF-8",
      };
      this.doc = xml_builder.create("imsx_POXEnvelopeRequest", xmldec);
      this.doc.attribute(
        "xmlns",
        "http://www.imsglobal.org/services/ltiv1p1/xsd/imsoms_v1p0"
      );
      this.head = this.doc
        .ele("imsx_POXHeader")
        .ele("imsx_POXRequestHeaderInfo");
      this.body = this.doc
        .ele("imsx_POXBody")
        .ele(type + "Request")
        .ele("resultRecord");
      this.head.ele("imsx_version", "V1.0");
      this.head.ele("imsx_messageIdentifier", uuid.v1());
      this.body.ele("sourcedGUID").ele("sourcedId", source_did);
    }

    OutcomeDocument.prototype.add_score = function (score, language) {
      var eScore;
      if (typeof score !== "number" || score < 0 || score > 1.0) {
        throw new errors.ParameterError(
          "Score must be a floating point number >= 0 and <= 1"
        );
      }
      eScore = this._result_ele().ele("resultScore");
      eScore.ele("language", language);
      return eScore.ele("textString", score);
    };

    OutcomeDocument.prototype.add_text = function (text) {
      return this._add_payload("text", text);
    };

    OutcomeDocument.prototype.add_url = function (url) {
      return this._add_payload("url", url);
    };

    OutcomeDocument.prototype.finalize = function () {
      return this.doc.end({
        pretty: true,
      });
    };

    OutcomeDocument.prototype._result_ele = function () {
      return this.result || (this.result = this.body.ele("result"));
    };

    OutcomeDocument.prototype._add_payload = function (type, value) {
      if (this.has_payload) {
        throw new errors.ExtensionError(
          "Result data payload has already been set"
        );
      }
      if (!this.outcome_service.supports_result_data(type)) {
        throw new errors.ExtensionError("Result data type is not supported");
      }
      this._result_ele().ele("resultData").ele(type, value);
      return (this.has_payload = true);
    };

    return OutcomeDocument;
  })();

  OutcomeService = (function () {
    OutcomeService.prototype.REQUEST_REPLACE = "replaceResult";

    OutcomeService.prototype.REQUEST_READ = "readResult";

    OutcomeService.prototype.REQUEST_DELETE = "deleteResult";

    function OutcomeService(options) {
      var parts;
      if (options == null) {
        options = {};
      }
      this.consumer_key = options.consumer_key;
      this.consumer_secret = options.consumer_secret;
      this.service_url = options.service_url;
      this.source_did = options.source_did;
      this.result_data_types = options.result_data_types || [];
      this.signer = options.signer || new HMAC_SHA1();
      this.cert_authority = options.cert_authority || null;
      this.language = options.language || "en";
      parts = this.service_url_parts = url.parse(this.service_url, true);
      this.service_url_oauth =
        parts.protocol + "//" + parts.host + parts.pathname;
    }

    OutcomeService.prototype.send_replace_result = function (score, callback) {
      var doc, err;
      doc = new OutcomeDocument(this.REQUEST_REPLACE, this.source_did, this);
      try {
        doc.add_score(score, this.language);
        return this._send_request(doc, callback);
      } catch (error) {
        err = error;
        return callback(err, false);
      }
    };

    OutcomeService.prototype.send_replace_result_with_text = function (
      score,
      text,
      callback
    ) {
      var doc, err;
      doc = new OutcomeDocument(this.REQUEST_REPLACE, this.source_did, this);
      try {
        doc.add_score(score, this.language, doc.add_text(text));
        return this._send_request(doc, callback);
      } catch (error) {
        err = error;
        return callback(err, false);
      }
    };

    OutcomeService.prototype.send_replace_result_with_url = function (
      score,
      url,
      callback
    ) {
      var doc, err;
      doc = new OutcomeDocument(this.REQUEST_REPLACE, this.source_did, this);
      try {
        doc.add_score(score, this.language, doc.add_url(url));
        return this._send_request(doc, callback);
      } catch (error) {
        err = error;
        return callback(err, false);
      }
    };

    OutcomeService.prototype.send_read_result = function (callback) {
      var doc;
      doc = new OutcomeDocument(this.REQUEST_READ, this.source_did, this);
      return this._send_request(
        doc,
        (function (_this) {
          return function (err, result, xml) {
            var score;
            if (err) {
              return callback(err, result);
            }
            score = parseFloat(
              navigateXml(
                xml,
                "imsx_POXBody.readResultResponse.result.resultScore.textString"
              ),
              10
            );
            if (isNaN(score)) {
              return callback(
                new errors.OutcomeResponseError("Invalid score response"),
                false
              );
            } else {
              return callback(null, score);
            }
          };
        })(this)
      );
    };

    OutcomeService.prototype.send_delete_result = function (callback) {
      var doc;
      doc = new OutcomeDocument(this.REQUEST_DELETE, this.source_did, this);
      return this._send_request(doc, callback);
    };

    OutcomeService.prototype.supports_result_data = function (type) {
      return (
        this.result_data_types.length &&
        (!type || this.result_data_types.indexOf(type) !== -1)
      );
    };

    OutcomeService.prototype._send_request = function (doc, callback) {
      var body, is_ssl, options, req, xml;
      xml = doc.finalize();
      body = "";
      is_ssl = this.service_url_parts.protocol === "https:";
      options = {
        hostname: this.service_url_parts.hostname,
        path: this.service_url_parts.path,
        method: "POST",
        headers: this._build_headers(xml),
      };
      if (this.cert_authority && is_ssl) {
        options.ca = this.cert_authority;
      } else {
        options.agent = is_ssl ? https.globalAgent : http.globalAgent;
      }
      if (this.service_url_parts.port) {
        options.port = this.service_url_parts.port;
      }
      req = (is_ssl ? https : http).request(
        options,
        (function (_this) {
          return function (res) {
            res.setEncoding("utf8");
            res.on("data", function (chunk) {
              return (body += chunk);
            });
            return res.on("end", function () {
              return _this._process_response(body, callback);
            });
          };
        })(this)
      );
      req.on(
        "error",
        (function (_this) {
          return function (err) {
            return callback(err, false);
          };
        })(this)
      );
      req.write(xml);
      return req.end();
    };

    OutcomeService.prototype._build_headers = function (body) {
      var headers, key, val;
      headers = {
        oauth_version: "1.0",
        oauth_nonce: uuid.v4(),
        oauth_timestamp: Math.round(Date.now() / 1000),
        oauth_consumer_key: this.consumer_key,
        oauth_body_hash: crypto
          .createHash("sha1")
          .update(body)
          .digest("base64"),
        oauth_signature_method: "HMAC-SHA1",
      };
      headers.oauth_signature = this.signer.build_signature_raw(
        this.service_url_oauth,
        this.service_url_parts,
        "POST",
        headers,
        this.consumer_secret
      );
      return {
        Authorization:
          'OAuth realm="",' +
          (function () {
            var results;
            results = [];
            for (key in headers) {
              val = headers[key];
              results.push(key + '="' + utils.special_encode(val) + '"');
            }
            return results;
          })().join(","),
        "Content-Type": "application/xml",
        "Content-Length": body.length,
      };
    };

    OutcomeService.prototype._process_response = function (body, callback) {
      return xml2js.parseString(
        body,
        {
          trim: true,
        },
        (function (_this) {
          return function (err, result) {
            var code, msg, response;
            if (err) {
              return callback(
                new errors.OutcomeResponseError(
                  "The server responsed with an invalid XML document"
                ),
                false
              );
            }
            response =
              result != null ? result.imsx_POXEnvelopeResponse : void 0;
            code = navigateXml(
              response,
              "imsx_POXHeader.imsx_POXResponseHeaderInfo.imsx_statusInfo.imsx_codeMajor"
            );
            if (code !== "success") {
              msg = navigateXml(
                response,
                "imsx_POXHeader.imsx_POXResponseHeaderInfo.imsx_statusInfo.imsx_description"
              );
              return callback(new errors.OutcomeResponseError(msg), false);
            } else {
              return callback(null, true, response);
            }
          };
        })(this)
      );
    };

    return OutcomeService;
  })();

  exports.init = function (provider) {
    var accepted_vals;
    if (
      provider.body.lis_outcome_service_url &&
      provider.body.lis_result_sourcedid
    ) {
      accepted_vals = provider.body.ext_outcome_data_values_accepted;
      return (provider.outcome_service = new OutcomeService({
        consumer_key: provider.consumer_key,
        consumer_secret: provider.consumer_secret,
        service_url: provider.body.lis_outcome_service_url,
        source_did: provider.body.lis_result_sourcedid,
        result_data_types: (accepted_vals && accepted_vals.split(",")) || [],
        signer: provider.signer,
      }));
    } else {
      return (provider.outcome_service = false);
    }
  };

  exports.OutcomeService = OutcomeService;
}).call(this);
