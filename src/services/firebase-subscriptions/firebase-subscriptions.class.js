/* eslint-disable no-unused-vars */
const firebaseAdapter = require('../../adapters/firebase-adapter');
const promiseHelpers = require('../../utils/promise-helpers');

class Service {
  constructor (options) {
    this.options = options || {};
  }

  /**
   * Return subscriptions entries from firebase DB
   * from all users
   */
  async find () {
    let dbRef = this.options.firebaseDBInstance.ref('notifsSubscriptionEntries');

    return firebaseAdapter.pfirebaseDBSnapshot(dbRef).then(rawObject => {
      return promiseHelpers.async.pObjectToArray(rawObject);
    });
  }

  /**
   * Return subscription entries from firebase DB
   * from specific user
   */
  async get (uid) {
    let dbRef = this.options.firebaseDBInstance.ref('notifsSubscriptionEntries').orderByChild('uid').equalTo(uid);
    
    return firebaseAdapter.pfirebaseDBSnapshot(dbRef).then(rawObject => {
      return promiseHelpers.async.pObjectToArray(rawObject);
    });
  }
}

module.exports = function (options) {
  return new Service(options);
};

module.exports.Service = Service;
