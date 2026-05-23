'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const HELPER_FILE = 'src/engineerMobile/engineerPreDepartureActionEligibility.js';
const UNIT_TEST_FILE = 'tests/engineerMobile/engineerPreDepartureActionEligibility.unit.test.js';
const CLOSURE_TEST_FILE = 'tests/engineerMobile/engineerPreDepartureActionEligibilityClosure.static.test.js';
const TASK_DOC = 'docs/task-930-engineer-mobile-pre-departure-action-eligibility-evaluator-pure-helper-no-state-change.md';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

function requireSpecifiers(source) {
  const specifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers;
}

test('Task930 source test and doc files exist', () => {
  for (const file of [HELPER_FILE, UNIT_TEST_FILE, CLOSURE_TEST_FILE, TASK_DOC]) {
    assert.equal(exists(file), true, `${file} should exist`);
  }
});

test('pre-departure eligibility helper imports no forbidden runtime dependencies', () => {
  const source = read(HELPER_FILE);

  assert.deepEqual(requireSpecifiers(source), []);
  assert.doesNotMatch(source, /process\.env|console\.|fetch\(|axios|http\.request|https\.request|new Pool|createPool/i);
  assert.doesNotMatch(source, /\.listen\s*\(|express\s*\(|Router\s*\(|createServer\(/i);
});

test('pre-departure eligibility helper has no state mutation SQL or workflow action execution', () => {
  const source = read(HELPER_FILE);

  assert.doesNotMatch(source, /\binsert\s+into\b|\bupdate\s+\w+\s+set\b|\bdelete\s+from\b|BEGIN|COMMIT|ROLLBACK/i);
  assert.doesNotMatch(source, /\.save\s*\(|\.create\s*\(|\.insert\s*\(|\.update\s*\(|\.delete\s*\(|\.destroy\s*\(/i);
  assert.doesNotMatch(source, /startTravel\s*\(|recordArrival\s*\(|markArrived\s*\(|markStarted\s*\(/i);
  assert.doesNotMatch(source, /submitCompletion\s*\(|completeAppointment\s*\(|createReport\s*\(|publishReport\s*\(/i);
  assert.doesNotMatch(source, /finalAppointmentId\s*=|final_appointment_id\s*=|appointmentStatus\s*=|caseStatus\s*=|fieldServiceReport\s*=/);
});

test('unit coverage locks safe eligibility behavior without sensitive leaks', () => {
  const source = read(UNIT_TEST_FILE);

  assert.match(source, /missing context denies safely/);
  assert.match(source, /missing organizationId denies safely/);
  assert.match(source, /missing engineerId denies safely/);
  assert.match(source, /missing appointment denies safely/);
  assert.match(source, /organization mismatch denies safely/);
  assert.match(source, /assigned engineer mismatch denies safely/);
  assert.match(source, /missing permission denies safely/);
  assert.match(source, /safe pre-departure statuses allow canStartTravel only as display hint/);
  assert.match(source, /travel-started arrived completed cancelled and closed statuses deny canStartTravel/);
  assert.match(source, /input context and appointment are not mutated/);
  assert.doesNotMatch(source, /DATABASE_URL|npm run db:migrate|psql|OpenAI|LINE_CHANNEL_ACCESS_TOKEN/i);
});

test('Task930 evidence doc records pure helper and no-state-change boundaries', () => {
  const doc = read(TASK_DOC);

  for (const file of [HELPER_FILE, UNIT_TEST_FILE, CLOSURE_TEST_FILE]) {
    assert.match(doc, new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(doc, /Pure Helper/);
  assert.match(doc, /No State Change/);
  assert.match(doc, /No DB/);
  assert.match(doc, /No repository/);
  assert.match(doc, /No route\/controller\/API rollout/);
  assert.match(doc, /No auth\/session\/JWT runtime/);
  assert.match(doc, /No provider sending/);
  assert.match(doc, /No AI\/RAG/);
  assert.match(doc, /No billing\/settlement/);
  assert.match(doc, /No migration/);
  assert.match(doc, /No smoke\/shared runtime/);
  assert.match(doc, /No start travel action execution/);
  assert.match(doc, /finalAppointmentId/);
});
