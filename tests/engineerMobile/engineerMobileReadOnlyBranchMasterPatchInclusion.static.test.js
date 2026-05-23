'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const TASK929_DOC = 'docs/task-929-engineer-mobile-read-only-branch-master-patch-inclusion-checkpoint-no-runtime-change.md';
const TASK929_TEST = 'tests/engineerMobile/engineerMobileReadOnlyBranchMasterPatchInclusion.static.test.js';

const TASK921_FILES = [
  'src/engineerMobile/engineerAssignedAppointmentsProjectionService.js',
  'tests/engineerMobile/engineerAssignedAppointmentsProjectionService.unit.test.js',
  'tests/engineerMobile/engineerAssignedAppointmentsProjectionServiceClosure.static.test.js',
  'docs/task-921-engineer-mobile-read-only-assigned-appointments-projection-injected-db-client-no-route-no-migration.md',
];

const TASK922_FILES = [
  'src/engineerMobile/engineerAssignedAppointmentsProjectionHandler.js',
  'tests/engineerMobile/engineerAssignedAppointmentsProjectionHandler.http-behavior.unit.test.js',
  'tests/engineerMobile/engineerAssignedAppointmentsProjectionHandlerClosure.static.test.js',
  'docs/task-922-engineer-mobile-assigned-appointments-http-handler-injected-db-client-no-route-no-real-db.md',
];

const TASK923_FILES = [
  'src/engineerMobile/engineerAssignedAppointmentsAppAdapter.js',
  'tests/engineerMobile/engineerAssignedAppointmentsAppAdapter.unit.test.js',
  'tests/engineerMobile/engineerAssignedAppointmentsAppAdapterClosure.static.test.js',
  'docs/task-923-engineer-mobile-assigned-appointments-app-adapter-synthetic-app-only-no-public-route-no-listen.md',
];

const TASK924_FILES = [
  'tests/engineerMobile/engineerAssignedAppointmentsBranchClosure.static.test.js',
  'docs/task-924-engineer-mobile-assigned-appointments-branch-closure-patch-inclusion-no-runtime-change.md',
];

const TASK925_FILES = [
  'src/engineerMobile/engineerAssignedAppointmentDetailProjectionService.js',
  'tests/engineerMobile/engineerAssignedAppointmentDetailProjectionService.unit.test.js',
  'tests/engineerMobile/engineerAssignedAppointmentDetailProjectionServiceClosure.static.test.js',
  'docs/task-925-engineer-mobile-assigned-appointment-detail-projection-injected-db-client-no-route-no-workflow.md',
];

const TASK926_FILES = [
  'src/engineerMobile/engineerAssignedAppointmentDetailProjectionHandler.js',
  'tests/engineerMobile/engineerAssignedAppointmentDetailProjectionHandler.http-behavior.unit.test.js',
  'tests/engineerMobile/engineerAssignedAppointmentDetailProjectionHandlerClosure.static.test.js',
  'docs/task-926-engineer-mobile-assigned-appointment-detail-http-handler-injected-db-client-no-route-no-workflow.md',
];

const TASK927_FILES = [
  'src/engineerMobile/engineerAssignedAppointmentDetailAppAdapter.js',
  'tests/engineerMobile/engineerAssignedAppointmentDetailAppAdapter.unit.test.js',
  'tests/engineerMobile/engineerAssignedAppointmentDetailAppAdapterClosure.static.test.js',
  'docs/task-927-engineer-mobile-assigned-appointment-detail-app-adapter-synthetic-app-only-no-public-route-no-listen.md',
];

const TASK928_FILES = [
  'tests/engineerMobile/engineerAssignedAppointmentDetailBranchClosure.static.test.js',
  'docs/task-928-engineer-mobile-assigned-appointment-detail-branch-closure-patch-inclusion-no-runtime-change.md',
];

const TASK929_FILES = [
  TASK929_DOC,
  TASK929_TEST,
];

const ALL_TARGET_FILES = [
  ...TASK921_FILES,
  ...TASK922_FILES,
  ...TASK923_FILES,
  ...TASK924_FILES,
  ...TASK925_FILES,
  ...TASK926_FILES,
  ...TASK927_FILES,
  ...TASK928_FILES,
  ...TASK929_FILES,
];

function absolutePath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function exists(relativePath) {
  return fs.existsSync(absolutePath(relativePath));
}

function read(relativePath) {
  return fs.readFileSync(absolutePath(relativePath), 'utf8');
}

function escaped(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function gitStatusFor(files) {
  return execFileSync('git', ['status', '--short', '--', ...files], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
    .split('\n')
    .map((line) => line.trimEnd())
    .filter(Boolean);
}

test('Task921 through Task929 read-only branch target files are present', () => {
  for (const file of ALL_TARGET_FILES) {
    assert.equal(exists(file), true, `${file} should exist`);
  }
});

test('Task929 checkpoint doc lists every target file and current git status line', () => {
  const doc = read(TASK929_DOC);
  const statusLines = gitStatusFor(ALL_TARGET_FILES);

  assert.equal(statusLines.length, ALL_TARGET_FILES.length);

  for (const file of ALL_TARGET_FILES) {
    assert.match(doc, new RegExp(escaped(file)), `${file} should be listed`);
  }

  for (const line of statusLines) {
    assert.match(doc, new RegExp(escaped(line)), `${line} should be recorded`);
  }
});

test('Task929 checkpoint doc preserves no-runtime no-staging branch closure boundary', () => {
  const doc = read(TASK929_DOC);

  assert.match(doc, /No production runtime source was modified/);
  assert.match(doc, /unrelated dirty files are not claimed/i);
  assert.match(doc, /No staging\/commit is authorized/);
  assert.match(doc, /No production route/);
  assert.match(doc, /No listen/);
  assert.match(doc, /No real DB/);
  assert.match(doc, /No auth\/session\/JWT runtime/);
  assert.match(doc, /No provider/);
  assert.match(doc, /No AI\/RAG/);
  assert.match(doc, /No billing\/settlement/);
  assert.match(doc, /No migration/);
  assert.match(doc, /No smoke\/shared runtime/);
  assert.match(doc, /No workflow expansion/);
  assert.match(doc, /closed \/ paused at synthetic app adapter boundary/);
});
