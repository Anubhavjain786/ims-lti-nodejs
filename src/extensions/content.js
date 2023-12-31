(function () {
  var ContentExtension,
    FILE_RETURN_TYPE,
    IFRAME_RETURN_TYPE,
    IMAGE_URL_RETURN_TYPE,
    LTI_LAUNCH_URL_RETURN_TYPE,
    OEMBED_RETURN_TYPE,
    URL_RETURN_TYPE,
    errors,
    optional_url_property_setter,
    parse_url,
    url;

  url = require("url");

  errors = require("../errors");

  FILE_RETURN_TYPE = "file";

  IFRAME_RETURN_TYPE = "iframe";

  IMAGE_URL_RETURN_TYPE = "image_url";

  LTI_LAUNCH_URL_RETURN_TYPE = "lti_launch_url";

  OEMBED_RETURN_TYPE = "oembed";

  URL_RETURN_TYPE = "url";

  parse_url = function (raw_url) {
    var return_url;
    return_url = url.parse(raw_url, true);
    delete return_url.path;
    return return_url;
  };

  optional_url_property_setter = function (return_url) {
    return function (property, value) {
      if (typeof value !== "undefined") {
        return (return_url.query[property] = value);
      }
    };
  };

  ContentExtension = (function () {
    function ContentExtension(params) {
      this.return_types = params.ext_content_return_types.split(",");
      this.return_url =
        params.ext_content_return_url || params.launch_presentation_return_url;
      this.file_extensions =
        (params.ext_content_file_extensions &&
          params.ext_content_file_extensions.split(",")) ||
        [];
    }

    ContentExtension.prototype.has_return_type = function (return_type) {
      return this.return_types.indexOf(return_type) !== -1;
    };

    ContentExtension.prototype.has_file_extension = function (extension) {
      return this.file_extensions.indexOf(extension) !== -1;
    };

    ContentExtension.prototype.send_file = function (
      res,
      file_url,
      text,
      content_type
    ) {
      var return_url, set_if_exists;
      this._validate_return_type(FILE_RETURN_TYPE);
      return_url = parse_url(this.return_url, true);
      set_if_exists = optional_url_property_setter(return_url);
      return_url.query.return_type = FILE_RETURN_TYPE;
      return_url.query.url = file_url;
      return_url.query.text = text;
      set_if_exists("content_type", content_type);
      return exports.redirector(res, url.format(return_url));
    };

    ContentExtension.prototype.send_iframe = function (
      res,
      iframe_url,
      title,
      width,
      height
    ) {
      var return_url, set_if_exists;
      this._validate_return_type(IFRAME_RETURN_TYPE);
      return_url = parse_url(this.return_url, true);
      set_if_exists = optional_url_property_setter(return_url);
      return_url.query.return_type = IFRAME_RETURN_TYPE;
      return_url.query.url = iframe_url;
      set_if_exists("title", title);
      set_if_exists("width", width);
      set_if_exists("height", height);
      return exports.redirector(res, url.format(return_url));
    };

    ContentExtension.prototype.send_image_url = function (
      res,
      image_url,
      text,
      width,
      height
    ) {
      var return_url, set_if_exists;
      this._validate_return_type(IMAGE_URL_RETURN_TYPE);
      return_url = parse_url(this.return_url, true);
      set_if_exists = optional_url_property_setter(return_url);
      return_url.query.return_type = IMAGE_URL_RETURN_TYPE;
      return_url.query.url = image_url;
      set_if_exists("text", text);
      set_if_exists("width", width);
      set_if_exists("height", height);
      return exports.redirector(res, url.format(return_url));
    };

    ContentExtension.prototype.send_lti_launch_url = function (
      res,
      launch_url,
      title,
      text
    ) {
      var return_url, set_if_exists;
      this._validate_return_type(LTI_LAUNCH_URL_RETURN_TYPE);
      return_url = parse_url(this.return_url, true);
      set_if_exists = optional_url_property_setter(return_url);
      return_url.query.return_type = LTI_LAUNCH_URL_RETURN_TYPE;
      return_url.query.url = launch_url;
      set_if_exists("title", title);
      set_if_exists("text", text);
      return exports.redirector(res, url.format(return_url));
    };

    ContentExtension.prototype.send_oembed = function (
      res,
      oembed_url,
      endpoint
    ) {
      var return_url, set_if_exists;
      this._validate_return_type(OEMBED_RETURN_TYPE);
      return_url = parse_url(this.return_url, true);
      set_if_exists = optional_url_property_setter(return_url);
      return_url.query.return_type = OEMBED_RETURN_TYPE;
      return_url.query.url = oembed_url;
      set_if_exists("endpoint", endpoint);
      return exports.redirector(res, url.format(return_url));
    };

    ContentExtension.prototype.send_url = function (
      res,
      hyperlink,
      text,
      title,
      target
    ) {
      var return_url, set_if_exists;
      this._validate_return_type(URL_RETURN_TYPE);
      return_url = parse_url(this.return_url, true);
      set_if_exists = optional_url_property_setter(return_url);
      return_url.query.return_type = URL_RETURN_TYPE;
      return_url.query.url = hyperlink;
      set_if_exists("text", text);
      set_if_exists("title", title);
      set_if_exists("target", target);
      return exports.redirector(res, url.format(return_url));
    };

    ContentExtension.prototype._validate_return_type = function (return_type) {
      if (this.has_return_type(return_type) === false) {
        throw new errors.ExtensionError(
          "Invalid return type, valid options are " +
            this.return_types.join(", ")
        );
      }
    };

    return ContentExtension;
  })();

  exports.init = function (provider) {
    if (provider.body.ext_content_return_types) {
      return (provider.ext_content = new ContentExtension(provider.body));
    } else {
      return (provider.ext_content = false);
    }
  };

  exports.redirector = function (res, url) {
    return res.redirect(303, url);
  };
}).call(this);
