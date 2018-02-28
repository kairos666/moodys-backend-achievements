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
 * filter out all entries older than threshold timestamp
 * @param {*} moodsArray 
 * @param {Integer} thresholdTimestamp 
 */
let takeOnlyEntriesAfter = function(moodsArray, thresholdTimestamp) {
    return new Promise((resolve, reject) => {
        async.filter(
            moodsArray, 
            async (item) => (item.timestamp >= thresholdTimestamp),
            (error, processedArray) => { 
                if (error) {
                    // couldn't process all the data
                    reject(error);
                } else {
                    // success removing older entries
                    resolve(processedArray);
                }
            }
        );
    });
}

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
    // groupBy some criteria (ex: dayTimestamp for array of same day entries)
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
        .then(removeSameDayOverwrittenEntries)
        .then(moodsArray2 => {
            return new Promise((resolve, reject) => {
                // output only the max count of consecutive entries
                async.transform(
                    moodsArray2,
                    { maxConsecutiveCount: 0, currentConsecutiveCount: 0 },
                    async (acc, item, key) => {
                        // skip first item
                        if (key === 0) return;

                        // consecutive entries are 24h between work days, 72h between friday and monday (+/- 1 hour to account for seasonal hour changes)
                        let timeDiff = (item.dayTimestamp - moodsArray2[key - 1].dayTimestamp)/1000;
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
        .then(removeSameDayOverwrittenEntries)
        .then(removeSpecialEntries)
        .then(moodsArray2 => {
            return new Promise((resolve, reject) => {
                // output only the max count of positive streak
                async.transform(
                    moodsArray2,
                    { maxPositiveMoodStreak: 0, currentPositiveMoodStreak: 0 },
                    async (acc, item, key) => {
                        // skip first item
                        if (key === 0) return;

                        // calculate if two following entries are positive
                        let isPositiveStreak = (parseInt(item.value) > 0 && parseInt(moodsArray2[key - 1].value) > 0);

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
        .then(removeSameDayOverwrittenEntries)
        .then(removeSpecialEntries)
        .then(moodsArray2 => {
            return new Promise((resolve, reject) => {
                // output only the max count of negative streak
                async.transform(
                    moodsArray2,
                    { maxNegativeMoodStreak: 0, currentNegativeMoodStreak: 0 },
                    async (acc, item, key) => {
                        // skip first item
                        if (key === 0) return;

                        // calculate if two following entries are negative
                        let isNegativeStreak = (parseInt(item.value) < 0 && parseInt(moodsArray2[key - 1].value) < 0);

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
        .then(removeSameDayOverwrittenEntries)
        .then(removeSpecialEntries)
        .then(moodsArray2 => {
            return new Promise((resolve, reject) => {
                // output only the max count of neutral streak
                async.transform(
                    moodsArray2,
                    { maxNeutralMoodStreak: 0, currentNeutralMoodStreak: 0 },
                    async (acc, item, key) => {
                        // skip first item
                        if (key === 0) return;

                        // calculate if two following entries are negative
                        let isNeutralStreak = (parseInt(item.value) === 0 && parseInt(moodsArray2[key - 1].value) === 0);

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

/**
 * return a boolean depending on mood entries containing at least one value corresponding to score
 * @param {*} moodsArray 
 * @param {*} score 
 */
let someSpecificScore = function(moodsArray, score) {
    return removeSameDayOverwrittenEntries(moodsArray)
        .then(moodArray2 => {
            return new Promise((resolve, reject) => {
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

/**
 * given a mood array - returns a boolean depending of having or not entries for both positive and negative scores
 * @param {*} moodsArray 
 */
let hasBothPositiveAndNegativeEntries = function(moodsArray) {
    let hasPositiveEntries = new Promise((resolve, reject) => {
        async.some(
            moodsArray, 
            async (item) => (parseInt(item.value) > 0),
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
    let hasNegativeEntries = new Promise((resolve, reject) => {
        async.some(
            moodsArray, 
            async (item) => (parseInt(item.value) < 0),
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

    return Promise.all([hasPositiveEntries, hasNegativeEntries])
        .then(results => (results[0] && results[1]));
}

/**
 * return max number of mood entries for a single day
 * @param {*} moodsArray 
 */
let sameDayMoodChange = function(moodsArray) {
    return fillMissingDayTimeStamps(moodsArray)
        .then(moodsArray3 => moodEntriesGroupBy(moodsArray3, 'dayTimestamp'))
        .then(moodsArray4 => {
            return new Promise((resolve, reject) => {
                async.transform(
                    moodsArray4,
                    { maxSameDayMoodChanges: 0 },
                    async (acc, item) => {
                        // count if there are multiple entries for the same day
                        let currentMoodChangesCount = item.length;
                        if (currentMoodChangesCount > acc.maxSameDayMoodChanges) acc.maxSameDayMoodChanges = currentMoodChangesCount;
                    },
                    (error, acc) => { 
                        if (error) {
                            // couldn't process all the data
                            reject(error);
                        } else {
                            // success reducing entries (offset if only 1 then it is not a same day multiple entry)
                            if (acc.maxSameDayMoodChanges === 1) acc.maxSameDayMoodChanges = 0;
                            resolve(acc.maxSameDayMoodChanges);
                        }
                    }
                );
            });
        });
};

/**
 * find mood swings in same day entries
 * @param {*} moodsArray 
 */
let sameDayMoodPolarityChange = function(moodsArray) {
    return fillMissingDayTimeStamps(moodsArray)
        .then(removeSpecialEntries)
        .then(moodsArray2 => moodEntriesGroupBy(moodsArray2, 'dayTimestamp'))
        .then(moodsArray3 => {
            return new Promise((resolve, reject) => {
                // output only the latest value from all entries for a single day
                async.transform(
                    moodsArray3,
                    { maxSameDayPolarityChanges: 0 },
                    async (acc, item, key) => {
                        // for each days evaluate if we have both negative and positive mood entries
                        let currentDayResult = await hasBothPositiveAndNegativeEntries(item);
                        if (currentDayResult) acc.maxSameDayPolarityChanges++;
                    },
                    (error, acc) => { 
                        if (error) {
                            // couldn't process all the data
                            reject(error);
                        } else {
                            // success reducing entries
                            resolve(acc.maxSameDayPolarityChanges);
                        }
                    }
                );
            });
        });
};

/**
 * evaluate number of mood swing (from negative mood to positive or reverse) depending on direction
 * @param {*} moodsArray 
 * @param {Integer} direction 
 */
let moodPolarityChange = function(moodsArray, direction) {
    return removeSameDayOverwrittenEntries(moodsArray)
        .then(removeSpecialEntries)
        .then(moodsArray2 => {
            return new Promise((resolve, reject) => {
                // output only the latest value from all entries for a single day
                async.transform(
                    moodsArray2,
                    { maxGlobalPolarityChanges: 0 },
                    async (acc, item, key) => {
                        // skip first item
                        if (key === 0) return;

                        // for each following days evaluate if we have both negative and positive mood entries
                        // from negative to positive
                        if (direction === 1 && parseInt(item.value) > 0 && parseInt(moodsArray2[key - 1].value) < 0) acc.maxGlobalPolarityChanges++;
                        // from positive to negative
                        if (direction === -1 && parseInt(item.value) < 0 && parseInt(moodsArray2[key - 1].value) > 0) acc.maxGlobalPolarityChanges++;
                    },
                    (error, acc) => { 
                        if (error) {
                            // couldn't process all the data
                            reject(error);
                        } else {
                            // success reducing entries
                            resolve(acc.maxGlobalPolarityChanges);
                        }
                    }
                );
            });
        });
}

/**
 * evaluate number of following mood entries that satisfies span distance and direction
 * @param {*} moodsArray 
 * @param {Float} spanDiff 
 */
let moodSpanChange = function(moodsArray, spanDiff) {
    return removeSameDayOverwrittenEntries(moodsArray)
        .then(removeSpecialEntries)
        .then(moodsArray2 => {
            return new Promise((resolve, reject) => {
                // output only the latest value from all entries for a single day
                async.transform(
                    moodsArray2,
                    { maxSpanDiffChanges: 0 },
                    async (acc, item, key) => {
                        // skip first item
                        if (key === 0) return;

                        // for each following days evaluate gap is sufficient to count + sign is valid
                        let previousDayScore = parseInt(moodsArray2[key - 1].value);
                        let currentDayScore = parseInt(item.value);
                        let absoluteDistance = Math.abs(currentDayScore - previousDayScore);
                        let isSignMatching = ((previousDayScore < currentDayScore && spanDiff >= 0) || (previousDayScore > currentDayScore && spanDiff <= 0));
                        if (isSignMatching && absoluteDistance >= Math.abs(spanDiff)) acc.maxSpanDiffChanges++;
                    },
                    (error, acc) => { 
                        if (error) {
                            // couldn't process all the data
                            reject(error);
                        } else {
                            // success reducing entries
                            resolve(acc.maxSpanDiffChanges);
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
        hasEntries,
        consecutiveMoods,
        sequencePositiveMoods,
        sequenceNegativeMoods,
        sequenceNeutralMoods,
        someSpecificScore,
        sameDayMoodChange,
        sameDayMoodPolarityChange,
        moodPolarityChange,
        moodSpanChange,
        takeOnlyEntriesAfter
    }
};