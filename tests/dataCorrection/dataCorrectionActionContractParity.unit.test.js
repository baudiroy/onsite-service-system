'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DATA_CORRECTION_CONTROLLER_ASYNC_ACTIONS,
  DATA_CORRECTION_CONTROLLER_ASYNC_ACTION_ORDER,
} = require('../../src/controllers/dataCorrectionController');
const {
  DATA_CORRECTION_GOVERNANCE_ACTIONS,
  DATA_CORRECTION_GOVERNANCE_ACTION_ORDER,
  DATA_CORRECTION_GOVERNANCE_WRITER_BACKED_ACTION_ORDER,
} = require('../../src/dataCorrection/dataCorrectionGovernanceOrchestrator');
const {
  DATA_CORRECTION_ACTION_PERMISSION_MAP,
  DATA_CORRECTION_PERMISSION_ACTIONS,
  DATA_CORRECTION_PERMISSION_ACTION_ORDER,
} = require('../../src/dataCorrection/dataCorrectionPermissionMiddleware');

test('Data Correction governance and permission action sets stay aligned', () => {
  assert.deepEqual(
    Object.values(DATA_CORRECTION_GOVERNANCE_ACTIONS).sort(),
    Object.values(DATA_CORRECTION_PERMISSION_ACTIONS).sort(),
  );
  assert.deepEqual(
    [...DATA_CORRECTION_GOVERNANCE_ACTION_ORDER].sort(),
    [...DATA_CORRECTION_PERMISSION_ACTION_ORDER].sort(),
  );
  assert.deepEqual(
    [...DATA_CORRECTION_GOVERNANCE_ACTION_ORDER].sort(),
    Object.keys(DATA_CORRECTION_ACTION_PERMISSION_MAP).sort(),
  );
});

test('Data Correction controller async action routing stays limited to writer-backed actions', () => {
  const writerBackedGovernanceActions = Object.values(DATA_CORRECTION_GOVERNANCE_ACTIONS).sort();

  assert.deepEqual(
    [...DATA_CORRECTION_CONTROLLER_ASYNC_ACTION_ORDER].sort(),
    [...DATA_CORRECTION_GOVERNANCE_WRITER_BACKED_ACTION_ORDER].sort(),
  );
  assert.deepEqual([...DATA_CORRECTION_GOVERNANCE_WRITER_BACKED_ACTION_ORDER].sort(), writerBackedGovernanceActions);
  assert.deepEqual(
    Object.values(DATA_CORRECTION_CONTROLLER_ASYNC_ACTIONS).sort(),
    [...DATA_CORRECTION_CONTROLLER_ASYNC_ACTION_ORDER].sort(),
  );
  assert.equal(DATA_CORRECTION_CONTROLLER_ASYNC_ACTION_ORDER.includes(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST,
  ), true);
});

test('Data Correction action parity contracts are immutable', () => {
  assert.equal(Object.isFrozen(DATA_CORRECTION_CONTROLLER_ASYNC_ACTIONS), true);
  assert.equal(Object.isFrozen(DATA_CORRECTION_CONTROLLER_ASYNC_ACTION_ORDER), true);
  assert.equal(Object.isFrozen(DATA_CORRECTION_GOVERNANCE_ACTIONS), true);
  assert.equal(Object.isFrozen(DATA_CORRECTION_GOVERNANCE_ACTION_ORDER), true);
  assert.equal(Object.isFrozen(DATA_CORRECTION_GOVERNANCE_WRITER_BACKED_ACTION_ORDER), true);
  assert.equal(Object.isFrozen(DATA_CORRECTION_PERMISSION_ACTIONS), true);
  assert.equal(Object.isFrozen(DATA_CORRECTION_PERMISSION_ACTION_ORDER), true);
  assert.equal(Object.isFrozen(DATA_CORRECTION_ACTION_PERMISSION_MAP), true);

  assert.throws(() => {
    DATA_CORRECTION_CONTROLLER_ASYNC_ACTIONS.PRE_DEPARTURE_APPLY = 'unsafe_action';
  }, TypeError);
  assert.throws(() => {
    DATA_CORRECTION_CONTROLLER_ASYNC_ACTION_ORDER.push('unsafe_action');
  }, TypeError);
  assert.throws(() => {
    DATA_CORRECTION_GOVERNANCE_ACTION_ORDER.push('unsafe_action');
  }, TypeError);
  assert.throws(() => {
    DATA_CORRECTION_GOVERNANCE_WRITER_BACKED_ACTION_ORDER.push('unsafe_action');
  }, TypeError);
  assert.throws(() => {
    DATA_CORRECTION_PERMISSION_ACTION_ORDER.push('unsafe_action');
  }, TypeError);
  assert.throws(() => {
    DATA_CORRECTION_ACTION_PERMISSION_MAP.unsafe_action = 'unsafe.permission';
  }, TypeError);
});
