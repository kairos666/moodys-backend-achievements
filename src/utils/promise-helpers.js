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
 * remove special values from mood entries
 * @param {*} moodsArray 
 */
let removeSpecialEntries = function(moodsArray) {
    // filter out special moods (holiday, sick)
    return new Promise((resolve, reject) => {
        async.filter(
            moodsArray, 
            async (item) => (item.value !== 'sick' && item.value !== 'holiday'),
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
}

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
                item.date = moment(item.timestamp).format('DD-MM-YYYY');
                item.weekDay = moment(item.timestamp).format('dddd');
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

/**
 * keep only relevant entry for each day
 * @param {*} moodsArray 
 */
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

/**
 * calculate how many consecutive entries were scored
 * @param {*} moodsArray 
 */
let consecutiveMoods = function(moodsArray) {
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

                        // consecutive entries are 24h between work days, 72h between friday and monday (+/- 1 hour to account for seasonal hour changes)
                        let timeDiff = (item.dayTimestamp - moodsArray3[key - 1].dayTimestamp)/1000;
                        let isTimeDiffConsecutive = (moment(item.timestamp).day() === 1)
                            ? (71*3600 <= timeDiff && timeDiff <= 73*3600)
                            : (23*3600 <= timeDiff && timeDiff <= 25*3600);

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
                            // success counting entries (couples to individual entry - offset +1)
                            if (acc.maxConsecutiveCount > 0) acc.maxConsecutiveCount++;
                            resolve(acc.maxConsecutiveCount);
                        }
                    }
                );
            });
        });
};

/**
 * calculate if user have some mood entries
 * @param {*} moodsArray 
 */
let hasEntries = function(moodsArray) { return (moodsArray.length !== 0) };

/**
 * count max positive moods streak
 * @param {*} moodsArray 
 */
let sequencePositiveMoods = function(moodsArray) {
    return removeWeekEndEntries(moodsArray)
        .then(moodsArray2 => removeSameDayOverwrittenEntries(moodsArray2))
        .then(moodsArray3 => removeSpecialEntries(moodsArray3))
        .then(moodsArray4 => {
            return new Promise((resolve, reject) => {
                // output only the max count of positive streak
                async.transform(
                    moodsArray4,
                    { maxPositiveMoodStreak: 0, currentPositiveMoodStreak: 0 },
                    async (acc, item, key) => {
                        // skip first item
                        if (key === 0) return;

                        // calculate if two following entries are positive
                        let isPositiveStreak = (parseInt(item.value) > 0 && parseInt(moodsArray4[key - 1].value) > 0);

                        if (isPositiveStreak) {
                            // increment relative counter
                            acc.currentPositiveMoodStreak++
                            // update max counter if necessary
                            if (acc.maxPositiveMoodStreak < acc.currentPositiveMoodStreak) acc.maxPositiveMoodStreak = acc.currentPositiveMoodStreak;
                        } else {
                            // reset counter
                            acc.currentPositiveMoodStreak = 0;
                        }
                    },
                    (error, acc) => { 
                        if (error) {
                            // couldn't process all the data
                            reject(error);
                        } else {
                            // success reducing entries (couples to individual entry - offset +1)
                            if (acc.maxPositiveMoodStreak > 0) acc.maxPositiveMoodStreak++;
                            resolve(acc.maxPositiveMoodStreak);
                        }
                    }
                );
            });
        });
}

/**
 * count max negative moods streak
 * @param {*} moodsArray 
 */
let sequenceNegativeMoods = function(moodsArray) {
    return removeWeekEndEntries(moodsArray)
        .then(moodsArray2 => removeSameDayOverwrittenEntries(moodsArray2))
        .then(moodsArray3 => removeSpecialEntries(moodsArray3))
        .then(moodsArray4 => {
            return new Promise((resolve, reject) => {
                // output only the max count of negative streak
                async.transform(
                    moodsArray4,
                    { maxNegativeMoodStreak: 0, currentNegativeMoodStreak: 0 },
                    async (acc, item, key) => {
                        // skip first item
                        if (key === 0) return;

                        // calculate if two following entries are negative
                        let isNegativeStreak = (parseInt(item.value) < 0 && parseInt(moodsArray4[key - 1].value) < 0);

                        if (isNegativeStreak) {
                            // increment relative counter
                            acc.currentNegativeMoodStreak++
                            // update max counter if necessary
                            if (acc.maxNegativeMoodStreak < acc.currentNegativeMoodStreak) acc.maxNegativeMoodStreak = acc.currentNegativeMoodStreak;
                        } else {
                            // reset counter
                            acc.currentNegativeMoodStreak = 0;
                        }
                    },
                    (error, acc) => { 
                        if (error) {
                            // couldn't process all the data
                            reject(error);
                        } else {
                            // success reducing entries (couples to individual entry - offset +1)
                            if (acc.maxNegativeMoodStreak > 0) acc.maxNegativeMoodStreak++;
                            resolve(acc.maxNegativeMoodStreak);
                        }
                    }
                );
            });
        });
}

/**
 * count max neutral moods streak
 * @param {*} moodsArray 
 */
let sequenceNeutralMoods = function(moodsArray) {
    return removeWeekEndEntries(moodsArray)
        .then(moodsArray2 => removeSameDayOverwrittenEntries(moodsArray2))
        .then(moodsArray3 => removeSpecialEntries(moodsArray3))
        .then(moodsArray4 => {
            return new Promise((resolve, reject) => {
                // output only the max count of neutral streak
                async.transform(
                    moodsArray4,
                    { maxNeutralMoodStreak: 0, currentNeutralMoodStreak: 0 },
                    async (acc, item, key) => {
                        // skip first item
                        if (key === 0) return;

                        // calculate if two following entries are negative
                        let isNeutralStreak = (parseInt(item.value) === 0 && parseInt(moodsArray4[key - 1].value) === 0);

                        if (isNeutralStreak) {
                            // increment relative counter
                            acc.currentNeutralMoodStreak++
                            // update max counter if necessary
                            if (acc.maxNeutralMoodStreak < acc.currentNeutralMoodStreak) acc.maxNeutralMoodStreak = acc.currentNeutralMoodStreak;
                        } else {
                            // reset counter
                            acc.currentNeutralMoodStreak = 0;
                        }
                    },
                    (error, acc) => { 
                        if (error) {
                            // couldn't process all the data
                            reject(error);
                        } else {
                            // success reducing entries (couples to individual entry - offset +1)
                            if (acc.maxNeutralMoodStreak > 0) acc.maxNeutralMoodStreak++;
                            resolve(acc.maxNeutralMoodStreak);
                        }
                    }
                );
            });
        });
}

let someSpecificScore = function(moodsArray, score) {
    return removeSameDayOverwrittenEntries(moodsArray)
        .then(moodArray2 => {
            return new Promise((resolve, reject) => {
            // output only the latest value from all entries for a single day
            async.some(
                moodsArray, 
                async (item) => (item.value === `${score}`),
                (error, processedArray) => { 
                    if (error) {
                        // couldn't process all the data
                        reject(error);
                    } else {
                        // success evaluating existence of score
                        resolve(processedArray);
                    }
                }
            );
        });
    });
}

module.exports = {
    async: {
        pObjectToArray: pObjectToArray
    },
    achievementsCalculators: {
        hasEntries: hasEntries,
        consecutiveMoods: consecutiveMoods,
        sequencePositiveMoods: sequencePositiveMoods,
        sequenceNegativeMoods: sequenceNegativeMoods,
        sequenceNeutralMoods: sequenceNeutralMoods,
        someSpecificScore
    }
};