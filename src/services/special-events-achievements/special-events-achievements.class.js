/* eslint-disable no-unused-vars */
class Service {
  constructor (options) {
    this.options = options || {};
  }

  async create (data, params) {
    console.log(data);
    return `AchievementEvt registered`;
  }
}

module.exports = function (options) {
  return new Service(options);
};

module.exports.Service = Service;
