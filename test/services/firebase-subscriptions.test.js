const assert = require('assert');
const app = require('../../src/app');

describe('\'firebase-subscriptions\' service', () => {
  it('registered the service', () => {
    const service = app.service('firebase-subscriptions');

    assert.ok(service, 'Registered the service');
  });
});
