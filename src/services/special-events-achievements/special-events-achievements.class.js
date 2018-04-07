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
      let newAchievementsStatuses = Object.assign({}, this.app.get('achievements').defaultAchievementsStatuses, currentAchievementsStatuses);

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
      let newAchievementsStatuses = Object.assign({}, this.app.get('achievements').defaultAchievementsStatuses, currentAchievementsStatuses);
      newAchievementsStatuses[achievementID]++;

      // update DB & trigger calculations
      await this.app.service('firebase-achievements').update(uid, newAchievementsStatuses);
      return this.app.service('mood-updates-achievements').get(uid);
    };
    const notifActionHandler = async (achievementID, originUID, targetUID, timestamp) => {
      logger.info(`${achievementID} for user ${targetUID} - notif-action trigger`);
      // each notification click generate 3 sub actions
      let bothAchievementsStatuses = await Promise.all([
        this.app.service('firebase-achievements').get(targetUID),
        this.app.service('firebase-achievements').get(originUID)
      ]);
      let currentAchievementsStatusesTarget = bothAchievementsStatuses[0];
      let currentAchievementsStatusesOrigin = bothAchievementsStatuses[1];
      let newAchievementsStatusesTarget = Object.assign({}, this.app.get('achievements').defaultAchievementsStatuses, currentAchievementsStatusesTarget);
      let newAchievementsStatusesOrigin = Object.assign({}, this.app.get('achievements').defaultAchievementsStatuses, currentAchievementsStatusesOrigin);
      // exchange null for object (deep nesting)
      if (newAchievementsStatusesTarget['pushReactions'] === null) newAchievementsStatusesTarget['pushReactions'] = {};
      if (newAchievementsStatusesOrigin['pushReactions'] === null) newAchievementsStatusesOrigin['pushReactions'] = {};

      // 1. special achievement fast hand
      let pFastHand = Promise.resolve(`fast hand for user: ${targetUID} is already achieved`);
      if (newAchievementsStatusesTarget['fast hand']) {
        logger.debug(`${achievementID} for user: ${targetUID} is already achieved`);
      } else {
        newAchievementsStatusesTarget['fast hand'] = true;

        // update DB
        pFastHand = this.app.service('firebase-achievements').update(targetUID, newAchievementsStatusesTarget);
      }

      // 2. clean old entries for push notif counter (originUID, sender of the notif)
      let olderThreshold = new Date().getTime() - (1000 * 60 * 60);
      let toBeDeletedEntries = Object.keys(newAchievementsStatusesOrigin['pushReactions']).filter(notifTimestamp => (notifTimestamp < olderThreshold));
      toBeDeletedEntries.forEach(notifTimestamp => {
        delete newAchievementsStatusesOrigin['pushReactions'][notifTimestamp];
      });
      
      // 3. counter notif calculation (tchintchin & chain reaction) for origin sender
      let pPushCounts = Promise.resolve(`tchin tchin and chain reaction for user: ${originUID} are already achieved`);
      if (timestamp) {
        let pushReactions = newAchievementsStatusesOrigin['pushReactions'];
        if (newAchievementsStatusesOrigin['tchin tchin'] && newAchievementsStatusesOrigin['chain reaction']) {
          logger.debug(`tchin tchin and chain reaction for user: ${originUID} are already achieved`);
        } else if(!pushReactions[timestamp]) {
          // new counter entry
          pushReactions[timestamp] = 1;
          newAchievementsStatusesOrigin['tchin tchin'] = true;
        } else {
          // increment counter
          pushReactions[timestamp]++;
          if (pushReactions[timestamp] >= 2) newAchievementsStatusesOrigin['chain reaction'] = true;
        }
      }

      // update DB
      pPushCounts = this.app.service('firebase-achievements').update(originUID, newAchievementsStatusesOrigin);
      
      return Promise.all([
        pFastHand,
        pPushCounts
      ]).then(() => {
        return {
          target: { uid: targetUID, achievements: newAchievementsStatusesTarget },
          origin: { uid: originUID, achievements: newAchievementsStatusesOrigin }
        }
      }).catch(err => {
        return new errors.GeneralError(`couldn't update achievements for user ${targetUID} & user ${originUID}`);
      });
    };

    let handlerFunction;

    // sort events depending on update Type and apply action
    if (data && data.updateType && data.achievementID && data.originUID) {
      switch (data.updateType) {
        case 'counter': handlerFunction = counterAchievementHandler; break;
        case 'behavior': handlerFunction = behaviorAchievementHandler; break;
        case 'calculation': handlerFunction = calculationHandler; break;
        case 'notif-action': handlerFunction = notifActionHandler; break;
      }
    } else {
      // invalid achievement event
      return Promise.reject(new errors.Unprocessable(`achievement special event malformed`));
    }

    // execute handler function, returns a promise
    return handlerFunction(data.achievementID, data.originUID, data.targetUID, data.pushTimestamp);
  }
}

module.exports = function (options) {
  return new Service(options);
};

module.exports.Service = Service;
