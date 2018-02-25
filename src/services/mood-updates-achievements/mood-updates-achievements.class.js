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
    let userMoodEntries = await promiseHelpers.achievementsCalculators.consecutiveMoods(allData[0]);
    let userAchievements = allData[1];

    return {
      moods: userMoodEntries,
      achievements: userAchievements
    }
  }
}

module.exports = function (options) {
  return new Service(options);
};

module.exports.Service = Service;
