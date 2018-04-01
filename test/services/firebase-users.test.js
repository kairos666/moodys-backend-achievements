const assert = require('assert');
const app = require('../../src/app');

describe('\'firebase-users\' service', () => {
  it('registered the service', () => {
    const service = app.service('firebase-users');

    assert.ok(service, 'Registered the service');
  });
});
