// Initializes the `firebase-moods` service on path `/firebase-moods`
const createService = require('./firebase-moods.class.js');
const hooks = require('./firebase-moods.hooks');
const firebaseAdapter = require('../../adapters/firebase-adapter');

module.exports = function (app) {
  const firebaseDBInstance = firebaseAdapter(app);
  const paginate = app.get('paginate');

  const options = {
    name: 'firebase-moods',
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/firebase-moods', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('firebase-moods');

  service.hooks(hooks);
};
