# ims-lti-nodejs

## Install
```
npm install ims-lti-nodejs --save
```

## Supported LTI Versions

* 1.0 - [Implementation Guide](http://www.imsglobal.org/lti/blti/bltiv1p0/ltiBLTIimgv1p0.html)
* 1.1 - [Implementation Guide](http://www.imsglobal.org/LTI/v1p1/ltiIMGv1p1.html)
* 1.1.1 - [Implementation Guide](http://www.imsglobal.org/LTI/v1p1p1/ltiIMGv1p1p1.html)

## Usage

The LTI standard won't be covered here, but it would be good to familiarize yourself with the specs. [LTI documentation](http://www.imsglobal.org/lti/index.html)

This library doesn't help you manage or distribute the consumer keys and secrets. The POST
parameters will contain the `oauth_consumer_key` and your application should use that to look up the consumer secret from your own datastore.

This library offers a few interfaces to use for managing the OAuth nonces to make sure the same nonce
isn't used twice with the same timestamp. [Read the LTI documentation on OAuth](http://www.imsglobal.org/LTI/v1p1pd/ltiIMGv1p1pd.html#_Toc309649687)