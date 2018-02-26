/* eslint-disable no-unused-vars */
const promiseHelpers = require('../../utils/promise-helpers');

class Service {
  constructor (options) {
    this.options = options || {};
  }

  setup(app) { this.app = app; }

  async get (uid) {
    // retrieve relevant data for targeted user
    let allData = await Promise.all([this.app.service('firebase-moods').get(uid), this.app.service('firebase-achievements').get(uid)]);
    let userMoodEntries = await allData[0];
    let userAchievements = allData[1];

    // calculus
    let hasMoodEntries = await promiseHelpers.achievementsCalculators.hasEntries(userMoodEntries);
    let consecutiveMoodEntries = await promiseHelpers.achievementsCalculators.consecutiveMoods(userMoodEntries);
    let positiveMoodStreak = await promiseHelpers.achievementsCalculators.sequencePositiveMoods(userMoodEntries);
    let negativeMoodStreak = await promiseHelpers.achievementsCalculators.sequenceNegativeMoods(userMoodEntries);
    let neutralMoodStreak = await promiseHelpers.achievementsCalculators.sequenceNeutralMoods(userMoodEntries);
    let highestMoodScoreReached = await promiseHelpers.achievementsCalculators.someSpecificScore(userMoodEntries, 5);
    let lowestMoodScoreReached = await promiseHelpers.achievementsCalculators.someSpecificScore(userMoodEntries, -5);
    let maxSameDayMoodChanges = await promiseHelpers.achievementsCalculators.sameDayMoodChange(userMoodEntries);
    let maxSameDayPolarityChanges = await promiseHelpers.achievementsCalculators.sameDayMoodPolarityChange(userMoodEntries);

    return {
      moods: userMoodEntries,
      achievements: userAchievements,
      calculated: {
        hasMoodEntries,
        consecutiveMoodEntries,
        positiveMoodStreak,
        negativeMoodStreak,
        neutralMoodStreak,
        highestMoodScoreReached,
        lowestMoodScoreReached,
        maxSameDayMoodChanges,
        maxSameDayPolarityChanges
      }
    }
  }
}

module.exports = function (options) {
  return new Service(options);
};

module.exports.Service = Service;
