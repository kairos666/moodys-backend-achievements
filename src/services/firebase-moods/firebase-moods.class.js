/* eslint-disable no-unused-vars */
const async = require('async');

class Service {
  constructor (options) {
    this.options = options || {};
  }

  /**
   * Return mood entries from firebase DB
   * from all users
   */
  async find () {
    // apply filterByUid if present
    let dbRef = this.options.firebaseDBInstance.ref('moods');

    return new Promise((resolve, reject) => {
      dbRef.once('value', snapshot => {
        let rawObjectResult = snapshot.val();

        // process object to array asynchroneously
        async.map(
          rawObjectResult, 
          async (item) => item,
          (error, processedArray) => { 
            if (error) {
              // couldn't process all the data
              reject(error);
            } else {
              // success converting object to array
              resolve(processedArray);
            }
          }
        );
      }, error => {
        // couldn't retrieve data from firebase
        reject(error);
      });
    });
  }

  /**
   * Return mood entries from firebase DB
   * from specific user
   */
  async get (uid) {
    let dbRef = this.options.firebaseDBInstance.ref('moods').orderByChild('uid').equalTo(uid);
    
    return new Promise((resolve, reject) => {
      dbRef.once('value', snapshot => {
        let rawObjectResult = snapshot.val();

        // process object to array asynchroneously
        async.map(
          rawObjectResult, 
          async (item) => item,
          (error, processedArray) => { 
            if (error) {
              // couldn't process all the data
              reject(error);
            } else {
              // success converting object to array
              resolve(processedArray);
            }
          }
        );
      }, error => {
        // couldn't retrieve data from firebase
        reject(error);
      });
    });
  }
}

module.exports = function (options) {
  return new Service(options);
};

module.exports.Service = Service;
