const async = require('async');
const moment = require('moment');

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

/**
 * remove mood entries made sunday or saturday
 * @param {*} moodsArray 
 */
let removeWeekEndEntries = function(moodsArray) {
    // filter out week-end days
    return new Promise((resolve, reject) => {
        async.filter(
            moodsArray, 
            async (item) => (moment(item.timestamp).day() !== 0 && moment(item.timestamp).day() !== 6),
            (error, processedArray) => { 
                if (error) {
                    // couldn't process all the data
                    reject(error);
                } else {
                    // success removing entries
                    resolve(processedArray);
                }
            }
        );
    });
};

/**
 * add dayTimeStamp property that may be missing on some entries
 * @param {*} moodsArray 
 */
let fillMissingDayTimeStamps = function(moodsArray) {
    // add missing dayTimestamps
    return new Promise((resolve, reject) => {
        async.map(
            moodsArray, 
            async (item) => {
                item.date = moment(item.timestamp).format();
                if (item.dayTimestamp) return item;

                item.dayTimestamp = moment(item.timestamp).startOf('date').unix() * 1000;
                return item;
            },
            (error, processedArray) => { 
                if (error) {
                    // couldn't process all the data
                    reject(error);
                } else {
                    // success extending entries
                    resolve(processedArray);
                }
            }
        );
    });
};

/**
 * regroup mood entries depending on some property
 * @param {*} moodsArray 
 * @param {*} groupByCriteria 
 */
let moodEntriesGroupBy = function(moodsArray, groupByCriteria) {
    // groupBy some criteria (ex: dayTimestamp for rray of same day entries)
    return new Promise((resolve, reject) => {
        async.groupBy(
            moodsArray, 
            async (item) => {
                return item[groupByCriteria];
            },
            (error, processedArray) => { 
                if (error) {
                    // couldn't process all the data
                    reject(error);
                } else {
                    // success grouping entries
                    resolve(processedArray);
                }
            }
        );
    });
};

let removeSameDayOverwrittenEntries = function(moodsArray) {
    return fillMissingDayTimeStamps(moodsArray)
        .then(moodsArray2 => moodEntriesGroupBy(moodsArray2, 'dayTimestamp'))
        .then(moodsArray3 => {
            return new Promise((resolve, reject) => {
                // output only the latest value from all entries for a single day
                async.map(
                    moodsArray3, 
                    async (item) => item.pop(),
                    (error, processedArray) => { 
                        if (error) {
                            // couldn't process all the data
                            reject(error);
                        } else {
                            // success reducing entries
                            resolve(processedArray);
                        }
                    }
                );
            });
        });
};

let consecutiveMoods = function (moodsArray) {
    return removeWeekEndEntries(moodsArray)
        .then(moodsArray2 => removeSameDayOverwrittenEntries(moodsArray2))
        .then(moodsArray3 => {
            return new Promise((resolve, reject) => {
                // output only the max count of consecutive entries
                async.transform(
                    moodsArray3,
                    { maxConsecutiveCount: 0, currentConsecutiveCount: 0 },
                    async (acc, item, key) => {
                        // skip first item
                        if (key === 0) return;

                        // consecutive entries are 24h between work days, 72h between friday and monday
                        let isTimeDiffConsecutive = (moment(item.timestamp).day() === 1)
                            ? ((item.dayTimestamp - moodsArray3[key - 1].dayTimestamp)/1000 === 72*3600)
                            : ((item.dayTimestamp - moodsArray3[key - 1].dayTimestamp)/1000 === 24*3600);

                        if (isTimeDiffConsecutive) {
                            // increment relative counter
                            acc.currentConsecutiveCount++
                            // update max counter if necessary
                            if (acc.maxConsecutiveCount < acc.currentConsecutiveCount) acc.maxConsecutiveCount = acc.currentConsecutiveCount;
                        } else {
                            // reset counter
                            acc.currentConsecutiveCount = 0;
                        }
                    },
                    (error, acc) => { 
                        if (error) {
                            // couldn't process all the data
                            reject(error);
                        } else {
                            // success reducing entries
                            resolve(acc.maxConsecutiveCount);
                        }
                    }
                );
            });
        });
};

module.exports = {
    async: {
        pObjectToArray: pObjectToArray
    },
    achievementsCalculators: {
        consecutiveMoods: consecutiveMoods
    }
};