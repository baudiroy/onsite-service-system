'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP,
} = require('../../src/app');
const {
  DATA_CORRECTION_CONTROLLER_WRITER_OPTION_KEYS,
} = require('../../src/controllers/dataCorrectionController');
const {
  DATA_CORRECTION_PERSISTENCE_REPOSITORY_WRITER_KEYS,
} = require('../../src/dataCorrection/dataCorrectionPersistenceRepository');
const {
  DATA_CORRECTION_QUERY_BACKED_HIGH_LEVEL_WRITER_KEYS,
} = require('../../src/dataCorrection/dataCorrectionQueryBackedPersistenceWriters');
const {
  DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP,
} = require('../../src/server');

function sorted(values) {
  return [...values].sort();
}

function normalizeShortcutWriterKey(value) {
  const withoutPrefix = String(value).replace(/^dataCorrection/, '');

  return withoutPrefix
    ? withoutPrefix.charAt(0).toLowerCase() + withoutPrefix.slice(1)
    : withoutPrefix;
}

const CONTROLLER_WRITER_OPTION_VALUES = Object.freeze(
  Object.values(DATA_CORRECTION_CONTROLLER_WRITER_OPTION_KEYS),
);

const APP_SHORTCUT_WRITER_VALUES = Object.freeze([
  DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP.APPOINTMENT_RESULT_WRITER,
  DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP.AUDIT_WRITER,
  DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP.CONTACT_LOG_WRITER,
  DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP.CORRECTION_WRITER,
  DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP.DISPATCH_NOTE_WRITER,
  DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP.ENGINEER_NOTIFICATION_WRITER,
  DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP.EVIDENCE_WRITER,
  DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP.FOLLOW_UP_DRAFT_WRITER,
]);

const SERVER_SHORTCUT_WRITER_VALUES = Object.freeze([
  DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP.APPOINTMENT_RESULT_WRITER,
  DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP.AUDIT_WRITER,
  DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP.CONTACT_LOG_WRITER,
  DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP.CORRECTION_WRITER,
  DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP.DISPATCH_NOTE_WRITER,
  DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP.ENGINEER_NOTIFICATION_WRITER,
  DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP.EVIDENCE_WRITER,
  DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP.FOLLOW_UP_DRAFT_WRITER,
]);

test('Data Correction writer option keys stay aligned across controller app server and persistence layers', () => {
  const expectedWriterKeys = sorted(DATA_CORRECTION_QUERY_BACKED_HIGH_LEVEL_WRITER_KEYS);

  assert.deepEqual(sorted(CONTROLLER_WRITER_OPTION_VALUES), expectedWriterKeys);
  assert.deepEqual(sorted(DATA_CORRECTION_PERSISTENCE_REPOSITORY_WRITER_KEYS), expectedWriterKeys);
  assert.deepEqual(sorted(APP_SHORTCUT_WRITER_VALUES.map(normalizeShortcutWriterKey)), expectedWriterKeys);
  assert.deepEqual(sorted(SERVER_SHORTCUT_WRITER_VALUES.map(normalizeShortcutWriterKey)), expectedWriterKeys);
});

test('Data Correction writer option parity contracts are immutable', () => {
  assert.equal(Object.isFrozen(DATA_CORRECTION_CONTROLLER_WRITER_OPTION_KEYS), true);
  assert.equal(Object.isFrozen(DATA_CORRECTION_PERSISTENCE_REPOSITORY_WRITER_KEYS), true);
  assert.equal(Object.isFrozen(DATA_CORRECTION_QUERY_BACKED_HIGH_LEVEL_WRITER_KEYS), true);
  assert.equal(Object.isFrozen(DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP), true);
  assert.equal(Object.isFrozen(DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP), true);
  assert.equal(Object.isFrozen(CONTROLLER_WRITER_OPTION_VALUES), true);
  assert.equal(Object.isFrozen(APP_SHORTCUT_WRITER_VALUES), true);
  assert.equal(Object.isFrozen(SERVER_SHORTCUT_WRITER_VALUES), true);

  assert.throws(() => {
    DATA_CORRECTION_CONTROLLER_WRITER_OPTION_KEYS.AUDIT_WRITER = 'unsafeWriter';
  }, TypeError);
  assert.throws(() => {
    DATA_CORRECTION_PERSISTENCE_REPOSITORY_WRITER_KEYS.push('unsafeWriter');
  }, TypeError);
  assert.throws(() => {
    DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP.AUDIT_WRITER = 'unsafeWriter';
  }, TypeError);
  assert.throws(() => {
    DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP.AUDIT_WRITER = 'unsafeWriter';
  }, TypeError);
});
