const Strategy = require('passport-custom');

module.exports = opts => {
  return function() {
    const app = this;
    const verifier = (req, done) => {
      // get the key from the request header supplied in opts
      const key = req.params.headers[opts.header];

      // check if the key is in the allowed keys supplied in opts
      const match = opts.allowedKeys.includes(key);

      // user will default to false if no key is present
      // and the authorization will fail
      const user = match ? 'api' : match;

      return done(null, user);
    };

    // register the strategy in the app.passport instance
    app.passport.use('apiKey', new Strategy(verifier));
  };
};