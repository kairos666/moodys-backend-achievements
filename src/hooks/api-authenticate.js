// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
const commonHooks = require('feathers-hooks-common');
const auth = require('@feathersjs/authentication');
const errors = require('@feathersjs/errors'); 
const logger = require('winston');

// eslint-disable-next-line no-unused-vars
module.exports = function (options = {}) {
  return async context => {
    let authConfig = context.app.get('authentication');
    let externalCallWithApiKey = function() {
      logger.debug('external call - authorization check');
      return auth.hooks.authenticate('apiKey')(context).then(() => {
        // api key passed check
        return Promise.resolve(context);
      }).catch(() => {
        // api key failed check
        context.result = null; 
        context.error = new errors.Forbidden(`no valid api key found in header - ${authConfig.apiKey.header}`);
        return Promise.reject(context.error);
      });
    };
    let externalCallWithoutApiKey = function() {
      // missing authorization header - api key failed check
      logger.debug('external call - missing authorization header');
      context.result = null; 
      context.error = new errors.Forbidden(`no authorization header found - ${authConfig.apiKey.header}`); 
      return Promise.reject(context.error);
    };
    let internalCall = function() {
      // internal, no need for api key check
      logger.debug('internal call - no authorization check');
      return Promise.resolve(context);
    };

    return commonHooks.iffElse(
      commonHooks.isProvider('rest'),
      commonHooks.iffElse(
        ctx => ctx.params.headers[authConfig.apiKey.header],
        externalCallWithApiKey,
        externalCallWithoutApiKey
      ),
      internalCall
    ).call(this, context);
  };
};
