'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DATA_CORRECTION_CONTROLLER_REQUEST_CONTEXT_KEYS,
} = require('../../src/controllers/dataCorrectionController');
const {
  DATA_CORRECTION_PERMISSION_REQUEST_CONTEXT_KEYS,
} = require('../../src/dataCorrection/dataCorrectionPermissionMiddleware');

test('Data Correction request context keys stay aligned across permission and controller layers', () => {
  assert.deepEqual(
    DATA_CORRECTION_CONTROLLER_REQUEST_CONTEXT_KEYS,
    DATA_CORRECTION_PERMISSION_REQUEST_CONTEXT_KEYS,
  );
  assert.deepEqual(DATA_CORRECTION_CONTROLLER_REQUEST_CONTEXT_KEYS, {
    AUTH: 'auth',
    PERMISSION_CONTEXT: 'dataCorrectionPermissionContext',
  });
});

test('Data Correction request context key contracts are immutable', () => {
  assert.equal(Object.isFrozen(DATA_CORRECTION_CONTROLLER_REQUEST_CONTEXT_KEYS), true);
  assert.equal(Object.isFrozen(DATA_CORRECTION_PERMISSION_REQUEST_CONTEXT_KEYS), true);

  assert.throws(() => {
    DATA_CORRECTION_CONTROLLER_REQUEST_CONTEXT_KEYS.AUTH = 'session';
  }, TypeError);
  assert.throws(() => {
    DATA_CORRECTION_PERMISSION_REQUEST_CONTEXT_KEYS.PERMISSION_CONTEXT = 'headers';
  }, TypeError);
});
