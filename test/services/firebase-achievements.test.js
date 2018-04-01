const assert = require('assert');
const app = require('../../src/app');

describe('\'firebase-achievements\' service', () => {
  it('registered the service', () => {
    const service = app.service('firebase-achievements');

    assert.ok(service, 'Registered the service');
  });
});
