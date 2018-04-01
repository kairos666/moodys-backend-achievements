const assert = require('assert');
const app = require('../../src/app');

describe('\'special-events-achievements\' service', () => {
  it('registered the service', () => {
    const service = app.service('special-events-achievements');

    assert.ok(service, 'Registered the service');
  });
});
