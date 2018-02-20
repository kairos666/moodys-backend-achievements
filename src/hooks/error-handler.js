// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
const logger = require('winston');

// eslint-disable-next-line no-unused-vars
module.exports = function (options = {}) {
  return async context => {
    logger.error(`Error in '${context.path}' service method '${context.method}'`, (context.error) ? context.error.stack : 'no error stack');

    return context;
  };
};
