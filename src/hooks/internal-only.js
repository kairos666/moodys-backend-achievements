// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
const commonHooks = require('feathers-hooks-common');
const errors = require('@feathersjs/errors'); 

// eslint-disable-next-line no-unused-vars
module.exports = function (options = {}) {
  return async context => {
    // forbidden call - external
    let externalCall = function() {
      context.result = null; 
      context.error = new errors.Forbidden('external call - forbidden'); 
      return Promise.reject(context.error);
    };

    // authorized call - internal
    let internalCall = function() {
      return Promise.resolve(context);
    };

    return commonHooks.iffElse(
      commonHooks.isProvider('external'),
      externalCall,
      internalCall
    ).call(this, context);
  };
};
