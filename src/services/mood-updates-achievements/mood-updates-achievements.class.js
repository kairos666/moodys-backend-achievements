/* eslint-disable no-unused-vars */
const promiseHelpers = require('../../utils/promise-helpers');

class Service {
  constructor (options) {
    this.options = options || {};
  }

  setup(app) { this.app = app; }

  async get (uid) {
    // retrieve relevant data for targeted user
    let allData = await Promise.all([
      this.app.service('firebase-moods').get(uid), 
      this.app.service('firebase-achievements').get(uid),
      this.app.service('firebase-subscriptions').get(uid)
    ]);
    let userMoodEntries = allData[0];
    let userAchievements = allData[1];
    let userSubscriptions = allData[2];

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

    return {
      moods: userMoodEntries,
      achievements: userAchievements,
      calculated: {
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
        "mood alert": (allMoodScores[12] >= 1),
        "mood monitor": (allMoodScores[12] >= 2)
      }
    }
  }
}

module.exports = function (options) {
  return new Service(options);
};

module.exports.Service = Service;
