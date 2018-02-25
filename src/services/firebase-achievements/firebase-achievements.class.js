/* eslint-disable no-unused-vars */
const firebaseAdapter = require('../../adapters/firebase-adapter');
const promiseHelpers = require('../../utils/promise-helpers');

class Service {
  constructor (options) {
    this.options = options || {};
  }

  async find () {
    let dbRef = this.options.firebaseDBInstance.ref('achievements');
    
    return firebaseAdapter.pfirebaseDBSnapshot(dbRef).then(rawObject => {
      return promiseHelpers.async.pObjectToArray(rawObject);
    });
  }

  async get (id) {
    let dbRef = this.options.firebaseDBInstance.ref(`achievements/${id}`);
    
    return firebaseAdapter.pfirebaseDBSnapshot(dbRef).then(rawObject => {
      return promiseHelpers.async.pObjectToArray(rawObject);
    });
  }
}

module.exports = function (options) {
  return new Service(options);
};

module.exports.Service = Service;
