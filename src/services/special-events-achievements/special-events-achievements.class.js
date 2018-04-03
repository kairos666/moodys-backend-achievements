/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const logger = require('winston');

class Service {
  constructor (options) {
    this.options = options || {};
  }

  setup(app) { this.app = app; }

  async create (data, params) {
    const behaviorAchievementHandler = async (achievementID, uid) => {
      logger.info(`${achievementID} for user ${uid} - behavior trigger`);
      // merge status object
      let currentAchievementsStatuses = await this.app.service('firebase-achievements').get(uid);
      let newAchievementsStatuses = Object.assign(this.app.get('achievements').defaultAchievementsStatuses, currentAchievementsStatuses);

      // update achievement status if possible and necessary
      if (!newAchievementsStatuses.hasOwnProperty(achievementID)) return Promise.reject(new errors.Unprocessable(`achievement special event malformed`));
      if (newAchievementsStatuses[achievementID]) logger.debug(`${achievementID} for user: ${uid} is already achieved`);
      newAchievementsStatuses[achievementID] = true;

      // update DB
      return this.app.service('firebase-achievements').update(uid, newAchievementsStatuses);
    };
    const calculationHandler = (achievementID, uid) => { 
      logger.info(`achievement calculations for user ${uid} - calculations trigger`);
      return this.app.service('mood-updates-achievements').get(uid);
    };
    const counterAchievementHandler = async (achievementID, uid) => {
      logger.info(`${achievementID} for user ${uid} - counter trigger`);
      // calculate uid for specific achievements (forgot password provides only email)
      let userUID = false;
      if (achievementID === 'forgotPasswordCounter') {
        const userEmail = uid;
        let users = await this.app.service('firebase-users').find();
        // find matching UID for user email
        Object.keys(users).some(uid => {
          if (users[uid].email === userEmail) {
            userUID = uid;
            return true;
          } else {
            return false;
          }
        });
      }
      // assign calculated UID or throw error depending on the above
      if (!userUID) {
        return Promise.reject(new errors.Unprocessable(`no corresponding UID was found`));
      } else {
        uid = userUID;
      }

      // merge status object & update achievement counter
      let currentAchievementsStatuses = await this.app.service('firebase-achievements').get(uid);
      let newAchievementsStatuses = Object.assign(this.app.get('achievements').defaultAchievementsStatuses, currentAchievementsStatuses);
      newAchievementsStatuses[achievementID]++;

      // update DB & trigger calculations
      await this.app.service('firebase-achievements').update(uid, newAchievementsStatuses);
      return this.app.service('mood-updates-achievements').get(uid);
    };
    let handlerFunction;

    // sort events depending on update Type and apply action
    if (data && data.updateType && data.achievementID && data.originUID) {
      switch (data.updateType) {
        case 'counter': handlerFunction = counterAchievementHandler; break;
        case 'behavior': handlerFunction = behaviorAchievementHandler; break;
        case 'calculation': handlerFunction = calculationHandler; break;
      }
    } else {
      // invalid achievement event
      return Promise.reject(new errors.Unprocessable(`achievement special event malformed`));
    }

    // execute handler function, returns a promise
    return handlerFunction(data.achievementID, data.originUID);
  }
}

module.exports = function (options) {
  return new Service(options);
};

module.exports.Service = Service;
