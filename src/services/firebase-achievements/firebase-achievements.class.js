/* eslint-disable no-unused-vars */
const firebaseAdapter = require('../../adapters/firebase-adapter');
const promiseHelpers = require('../../utils/promise-helpers');
const logger = require('winston');

class Service {
  constructor (options) {
    this.options = options || {};
  }

  async find () {
    let dbRef = this.options.firebaseDBInstance.ref('achievements');
    
    return firebaseAdapter.pfirebaseDBSnapshot(dbRef);
  }

  async get (id) {
    let dbRef = this.options.firebaseDBInstance.ref(`achievements/${id}`);
    
    return firebaseAdapter.pfirebaseDBSnapshot(dbRef);
  }
 
  async update (uid, data) {
    logger.info(`updating achievements records for user ${uid} - DB write operation`);
    let dbRef = this.options.firebaseDBInstance.ref(`achievements/${uid}`);
    
    return firebaseAdapter.pSetFirebaseDBRecord(dbRef, data).then(() => {
      return `user: ${uid} - achievements updated`;
    }).catch(error => {
      return error;
    });
  }
}

module.exports = function (options) {
  return new Service(options);
};

module.exports.Service = Service;
