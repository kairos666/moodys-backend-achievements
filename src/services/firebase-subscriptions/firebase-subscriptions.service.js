// Initializes the `firebase-subscriptions` service on path `/firebase-subscriptions`
const createService = require('./firebase-subscriptions.class.js');
const hooks = require('./firebase-subscriptions.hooks');
const firebaseAdapter = require('../../adapters/firebase-adapter');

module.exports = function (app) {
  const firebaseDBInstance = firebaseAdapter.getFirebaseDBInstance(app);
  const paginate = app.get('paginate');

  const options = {
    name: 'firebase-subscriptions',
    paginate,
    firebaseDBInstance
  };

  // Initialize our service with any options it requires
  app.use('/firebase-subscriptions', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('firebase-subscriptions');

  service.hooks(hooks);
};
