/* eslint-disable no-unused-vars */
class Service {
  constructor (options) {
    this.options = options || {};
  }

  async find (params) {
    console.log(params)
    return [];
  }
}

module.exports = function (options) {
  return new Service(options);
};

module.exports.Service = Service;
