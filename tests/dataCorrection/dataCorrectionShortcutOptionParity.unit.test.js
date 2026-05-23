'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP,
  DATA_CORRECTION_APP_SHORTCUT_OPTION_KEYS,
} = require('../../src/app');
const {
  DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP,
  DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEYS,
} = require('../../src/server');

test('Data Correction app and server shortcut option key maps stay aligned', () => {
  assert.deepEqual(
    DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP,
    DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP,
  );
  assert.deepEqual(
    DATA_CORRECTION_APP_SHORTCUT_OPTION_KEYS,
    DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEYS,
  );
});

test('Data Correction app and server shortcut option contracts are frozen', () => {
  assert.equal(Object.isFrozen(DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP), true);
  assert.equal(Object.isFrozen(DATA_CORRECTION_APP_SHORTCUT_OPTION_KEYS), true);
  assert.equal(Object.isFrozen(DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP), true);
  assert.equal(Object.isFrozen(DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEYS), true);

  assert.throws(() => {
    DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP.WRITER_SET = 'unsafeWriterSet';
  }, TypeError);
  assert.throws(() => {
    DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEYS.push('unsafeShortcutOption');
  }, TypeError);
});
