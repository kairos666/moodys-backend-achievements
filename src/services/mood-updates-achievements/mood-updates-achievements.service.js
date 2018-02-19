// Initializes the `mood-updates-achievements` service on path `/mood-updates-achievements`
const createService = require('./mood-updates-achievements.class.js');
const hooks = require('./mood-updates-achievements.hooks');

module.exports = function (app) {
  
  const paginate = app.get('paginate');

  const options = {
    name: 'mood-updates-achievements',
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/mood-updates-achievements', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('mood-updates-achievements');

  service.hooks(hooks);
};
