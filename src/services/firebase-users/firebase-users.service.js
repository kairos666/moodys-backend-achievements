// Initializes the `firebase-users` service on path `/firebase-users`
const createService = require('./firebase-users.class.js');
const hooks = require('./firebase-users.hooks');
const firebaseAdapter = require('../../adapters/firebase-adapter');

module.exports = function (app) {
  const firebaseDBInstance = firebaseAdapter.getFirebaseDBInstance(app);
  const paginate = app.get('paginate');

  const options = {
    name: 'firebase-users',
    paginate,
    firebaseDBInstance
  };

  // Initialize our service with any options it requires
  app.use('/firebase-users', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('firebase-users');

  service.hooks(hooks);
};
