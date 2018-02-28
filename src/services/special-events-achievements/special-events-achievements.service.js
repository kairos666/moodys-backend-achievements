// Initializes the `special-events-achievements` service on path `/special-events-achievements`
const createService = require('./special-events-achievements.class.js');
const hooks = require('./special-events-achievements.hooks');

module.exports = function (app) {
  
  const paginate = app.get('paginate');

  const options = {
    name: 'special-events-achievements',
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/special-events-achievements', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('special-events-achievements');

  service.hooks(hooks);
};
