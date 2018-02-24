// Initializes the `firebase-achievements` service on path `/firebase-achievements`
const createService = require('./firebase-achievements.class.js');
const hooks = require('./firebase-achievements.hooks');
const firebaseAdapter = require('../../adapters/firebase-adapter');

module.exports = function (app) {
  const firebaseDBInstance = firebaseAdapter(app);
  const paginate = app.get('paginate');

  const options = {
    name: 'firebase-achievements',
    paginate,
    firebaseDBInstance
  };

  // Initialize our service with any options it requires
  app.use('/firebase-achievements', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('firebase-achievements');

  service.hooks(hooks);
};
