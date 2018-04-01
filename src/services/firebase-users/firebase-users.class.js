/* eslint-disable no-unused-vars */
const firebaseAdapter = require('../../adapters/firebase-adapter');
const promiseHelpers = require('../../utils/promise-helpers');

class Service {
  constructor (options) {
    this.options = options || {};
  }

  /**
   * Return users entries from firebase DB
   */
  async find () {
    let dbRef = this.options.firebaseDBInstance.ref('users');

    return firebaseAdapter.pfirebaseDBSnapshot(dbRef);
  }

  /**
   * Return specific user entry from firebase DB
   */
  async get (uid) {
    let dbRef = this.options.firebaseDBInstance.ref(`users/${uid}`);
    
    return firebaseAdapter.pfirebaseDBSnapshot(dbRef);
  }
}

module.exports = function (options) {
  return new Service(options);
};

module.exports.Service = Service;
