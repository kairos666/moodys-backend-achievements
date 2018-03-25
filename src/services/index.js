const moodUpdatesAchievements = require('./mood-updates-achievements/mood-updates-achievements.service.js');
const firebaseAchievements = require('./firebase-achievements/firebase-achievements.service.js');
const firebaseMoods = require('./firebase-moods/firebase-moods.service.js');
const specialEventsAchievements = require('./special-events-achievements/special-events-achievements.service.js');
const firebaseSubscriptions = require('./firebase-subscriptions/firebase-subscriptions.service.js');
// eslint-disable-next-line no-unused-vars
module.exports = function (app) {
  app.configure(moodUpdatesAchievements);
  app.configure(firebaseAchievements);
  app.configure(firebaseMoods);
  app.configure(specialEventsAchievements);
  app.configure(firebaseSubscriptions);
};
