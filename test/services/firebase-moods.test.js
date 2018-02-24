const assert = require('assert');
const app = require('../../src/app');

describe('\'firebase-moods\' service', () => {
  it('registered the service', () => {
    const service = app.service('firebase-moods');

    assert.ok(service, 'Registered the service');
  });
});
