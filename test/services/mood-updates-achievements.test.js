const assert = require('assert');
const app = require('../../src/app');

describe('\'mood-updates-achievements\' service', () => {
  it('registered the service', () => {
    const service = app.service('mood-updates-achievements');

    assert.ok(service, 'Registered the service');
  });
});
