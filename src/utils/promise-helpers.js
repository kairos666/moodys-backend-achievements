const async = require('async');

/**
 * Take Object, Array or Iterable and map it asynchronously into array
 * @param {Object|Array|Iterable} rawObject 
 */
let pObjectToArray = function(rawObject) {
    return new Promise((resolve, reject) => {
        // process object to array asynchroneously
        async.map(
            rawObject, 
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
    });
};

module.exports = {
    async: {
        pObjectToArray: pObjectToArray
    }
};