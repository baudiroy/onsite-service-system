'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DATA_CORRECTION_CONTROLLER_ACTION_SOURCE_PATHS,
} = require('../../src/controllers/dataCorrectionController');
const {
  DATA_CORRECTION_GOVERNANCE_ACTION_SOURCE_PATHS,
} = require('../../src/dataCorrection/dataCorrectionGovernanceOrchestrator');
const {
  DATA_CORRECTION_PERMISSION_ACTION_SOURCE_PATHS,
} = require('../../src/dataCorrection/dataCorrectionPermissionMiddleware');

function normalizeControllerPathForGovernance(path) {
  return String(path).replace(/^body\./, '');
}

test('Data Correction action source paths stay aligned across permission controller and governance layers', () => {
  assert.deepEqual(
    DATA_CORRECTION_CONTROLLER_ACTION_SOURCE_PATHS,
    DATA_CORRECTION_PERMISSION_ACTION_SOURCE_PATHS,
  );
  assert.deepEqual(
    DATA_CORRECTION_CONTROLLER_ACTION_SOURCE_PATHS.map(normalizeControllerPathForGovernance),
    DATA_CORRECTION_GOVERNANCE_ACTION_SOURCE_PATHS,
  );
});

test('Data Correction action source path contracts are immutable', () => {
  assert.equal(Object.isFrozen(DATA_CORRECTION_CONTROLLER_ACTION_SOURCE_PATHS), true);
  assert.equal(Object.isFrozen(DATA_CORRECTION_GOVERNANCE_ACTION_SOURCE_PATHS), true);
  assert.equal(Object.isFrozen(DATA_CORRECTION_PERMISSION_ACTION_SOURCE_PATHS), true);

  assert.throws(() => {
    DATA_CORRECTION_CONTROLLER_ACTION_SOURCE_PATHS.push('query.actionType');
  }, TypeError);
  assert.throws(() => {
    DATA_CORRECTION_GOVERNANCE_ACTION_SOURCE_PATHS.push('query.actionType');
  }, TypeError);
  assert.throws(() => {
    DATA_CORRECTION_PERMISSION_ACTION_SOURCE_PATHS.push('headers.x-action-type');
  }, TypeError);
});
