/* eslint-disable no-unused-vars */
const async = require('async');

class Service {
  constructor (options) {
    this.options = options || {};
  }

  async find () {
    let dbRef = this.options.firebaseDBInstance.ref('achievements');
    
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

  async get (id) {
    let dbRef = this.options.firebaseDBInstance.ref(`achievements/${id}`);
    
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
