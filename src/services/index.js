const moodUpdatesAchievements = require('./mood-updates-achievements/mood-updates-achievements.service.js');
// eslint-disable-next-line no-unused-vars
module.exports = function (app) {
  app.configure(moodUpdatesAchievements);
};
