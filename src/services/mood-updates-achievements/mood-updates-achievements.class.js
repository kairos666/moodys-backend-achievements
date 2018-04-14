/* eslint-disable no-unused-vars */
const promiseHelpers = require('../../utils/promise-helpers');
const moment = require('moment');
const logger = require('winston');

class Service {
  constructor (options) {
    this.options = options || {};
  }

  setup(app) { this.app = app; }

  async get (uid, params) {
    // retrieve relevant data for targeted user
    let allData = await Promise.all([
      this.app.service('firebase-moods').get(uid), 
      this.app.service('firebase-achievements').get(uid),
      this.app.service('firebase-subscriptions').get(uid)
    ]);
    let userMoodEntries = (allData[0] !== null) ? allData[0] : [];
    let userAchievements = (allData[1] !== null) ? allData[1] : {};
    let userSubscriptions = (allData[2] !== null) ? allData[2] : [];

    // enforce time boundaries
    const configQueryParamsName = this.app.get('achievements').queryParamsName;
    const lowerTimeBoundaryTimestamp = (params.query && params.query[configQueryParamsName.lowerDateBoundary]) ? parseInt(params.query[configQueryParamsName.lowerDateBoundary]) : false;
    const upperTimeBoundaryTimestamp = (params.query && params.query[configQueryParamsName.upperDateBoundary]) ? parseInt(params.query[configQueryParamsName.upperDateBoundary]) : false;
    const preTimeFilteringEntriesCount = userMoodEntries.length;
    if (lowerTimeBoundaryTimestamp && upperTimeBoundaryTimestamp) {
      // both time boundaries exists
      userMoodEntries = await promiseHelpers.achievementsCalculators.takeOnlyEntriesBetween(userMoodEntries, lowerTimeBoundaryTimestamp, upperTimeBoundaryTimestamp);
      logger.debug(`only moods between ${moment(lowerTimeBoundaryTimestamp).format('MMMM Do YYYY')} & ${moment(upperTimeBoundaryTimestamp).format('MMMM Do YYYY')} | ${preTimeFilteringEntriesCount} entries --> after filtering ${userMoodEntries.length} entries`);
    } else if(lowerTimeBoundaryTimestamp) {
      // only lower time boundary exists
      userMoodEntries = await promiseHelpers.achievementsCalculators.takeOnlyEntriesAfter(userMoodEntries, lowerTimeBoundaryTimestamp);
      logger.debug(`only moods after ${moment(lowerTimeBoundaryTimestamp).format('MMMM Do YYYY')} | ${preTimeFilteringEntriesCount} entries --> after filtering ${userMoodEntries.length} entries`);
    } else if(upperTimeBoundaryTimestamp) {
      // only upper time boundary exists
      userMoodEntries = await promiseHelpers.achievementsCalculators.takeOnlyEntriesBefore(userMoodEntries, upperTimeBoundaryTimestamp);
      logger.debug(`only moods before ${moment(upperTimeBoundaryTimestamp).format('MMMM Do YYYY')} | ${preTimeFilteringEntriesCount} entries --> after filtering ${userMoodEntries.length} entries`);
    }

    // actual mood entries time boundaries
    let userMoodOldestEntryDate = (userMoodEntries.length > 0) ? moment(userMoodEntries[0].timestamp).format('MMMM Do YYYY, h:mm:ss') : 'no date available';
    let userMoodNewestEntryDate = (userMoodEntries.length > 0) ? moment(userMoodEntries[userMoodEntries.length - 1].timestamp).format('MMMM Do YYYY, h:mm:ss') : 'no date available';

    // calculus
    let allMoodScores = await Promise.all([
      promiseHelpers.achievementsCalculators.hasEntries(userMoodEntries),
      promiseHelpers.achievementsCalculators.consecutiveMoods(userMoodEntries),
      promiseHelpers.achievementsCalculators.sequencePositiveMoods(userMoodEntries),
      promiseHelpers.achievementsCalculators.sequenceNeutralMoods(userMoodEntries),
      promiseHelpers.achievementsCalculators.sequenceNegativeMoods(userMoodEntries),
      promiseHelpers.achievementsCalculators.someSpecificScore(userMoodEntries, 5),
      promiseHelpers.achievementsCalculators.someSpecificScore(userMoodEntries, -5),
      promiseHelpers.achievementsCalculators.sameDayMoodChange(userMoodEntries),
      promiseHelpers.achievementsCalculators.sameDayMoodPolarityChange(userMoodEntries),
      promiseHelpers.achievementsCalculators.moodPolarityChange(userMoodEntries, 1),
      promiseHelpers.achievementsCalculators.moodPolarityChange(userMoodEntries, -1),
      promiseHelpers.achievementsCalculators.moodSpanChange(userMoodEntries, 5),
      promiseHelpers.achievementsCalculators.moodSpanChange(userMoodEntries, -5),
      promiseHelpers.achievementsCalculators.subscriptionsCount(userSubscriptions)
    ]);

    // build full response
    let results = {
      timeSpan: {
        lowerTimeLimit: (lowerTimeBoundaryTimestamp) ? moment(lowerTimeBoundaryTimestamp).format('MMMM Do YYYY') : 'not set',
        upperTimeLimit: (upperTimeBoundaryTimestamp) ? moment(upperTimeBoundaryTimestamp).format('MMMM Do YYYY') : 'not set',
        oldestMoodEntry: userMoodOldestEntryDate,
        newestMoodEntry: userMoodNewestEntryDate
      },
      calculatedUsageStats: {
        hasMoodEntries: allMoodScores[0],
        consecutiveMoodEntries: allMoodScores[1],
        positiveMoodStreak: allMoodScores[2],
        neutralMoodStreak: allMoodScores[3],
        negativeMoodStreak: allMoodScores[4],
        highestMoodScoreReached: allMoodScores[5],
        lowestMoodScoreReached: allMoodScores[6],
        maxSameDayMoodChanges: allMoodScores[7],
        maxSameDayPolarityChanges: allMoodScores[8],
        maxGlobalNegativeToPositiveChanges: allMoodScores[9],
        maxGlobalPositiveToNegativeChanges: allMoodScores[10],
        maxSpanChangePositive: allMoodScores[11],
        maxSpanChangeNegative: allMoodScores[12],
        subscriptionsCount: allMoodScores[13]
      },
      achievementsStatuses: {
        "noob moodist": allMoodScores[0],
        "baron moodist": (allMoodScores[1] >= 3),
        "duke moodist": (allMoodScores[1] >= 5),
        "archduke moodist": (allMoodScores[1] >= 22),
        "king moodist": (allMoodScores[1] >= 66),
        "emperor moodist": (allMoodScores[1] >= 260),
        "happy days": (allMoodScores[2] >= 5),
        "zen & balanced": (allMoodScores[3] >= 3),
        "depression": (allMoodScores[4] >= 5),
        "blissed": (allMoodScores[5] >= 1),
        "suicidal tendencies": (allMoodScores[6] >= 1),
        "mood swings meds": (allMoodScores[7] >= 3),
        "mood roller coaster": (allMoodScores[8] >= 1),
        "come back": (allMoodScores[9] >= 1),
        "mood swing": (allMoodScores[10] >= 1),
        "stairway to heaven": (allMoodScores[11] >= 1),
        "nuclear disaster": (allMoodScores[12] >= 1),
        "mood alert": (allMoodScores[13] >= 1),
        "mood monitor": (allMoodScores[13] >= 2),
        "goldfish": (Number.isInteger(userAchievements.forgotPasswordCounter) && userAchievements.forgotPasswordCounter > 0),
        "alzeihmer": (Number.isInteger(userAchievements.forgotPasswordCounter) && userAchievements.forgotPasswordCounter >= 3)
      }
    };

    // check provider (internal call = register update, external call = just display statistics) 
    const isInternalCall = (params.provider === undefined);
    if (isInternalCall) {
      // build new achievements object (default, oldValues, newValues)
      const updatedAchievements = Object.assign(
        {},
        this.app.get('achievements').defaultAchievementsStatuses,
        userAchievements,
        results.achievementsStatuses
      );

      // update user achievements status in DB
      this.app.service('firebase-achievements').update(uid, updatedAchievements).then(() => {
        logger.debug('achievements registration in DB - successful');
      }).catch(() => {
        logger.debug('achievements registration in DB - failed');
      });
    }

    return results
  }
}

module.exports = function (options) {
  return new Service(options);
};

module.exports.Service = Service;
