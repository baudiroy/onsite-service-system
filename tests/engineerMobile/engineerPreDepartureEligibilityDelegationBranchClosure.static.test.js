'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const EVALUATOR_FILE = 'src/engineerMobile/engineerPreDepartureActionEligibility.js';
const LIST_SERVICE_FILE = 'src/engineerMobile/engineerAssignedAppointmentsProjectionService.js';
const DETAIL_SERVICE_FILE = 'src/engineerMobile/engineerAssignedAppointmentDetailProjectionService.js';
const TASK930_UNIT_TEST_FILE = 'tests/engineerMobile/engineerPreDepartureActionEligibility.unit.test.js';
const TASK930_CLOSURE_TEST_FILE = 'tests/engineerMobile/engineerPreDepartureActionEligibilityClosure.static.test.js';
const TASK931_DELEGATION_TEST_FILE = 'tests/engineerMobile/engineerPreDepartureEligibilityProjectionDelegation.static.test.js';
const TASK932_CLOSURE_TEST_FILE = 'tests/engineerMobile/engineerPreDepartureEligibilityDelegationBranchClosure.static.test.js';
const TASK930_DOC = 'docs/task-930-engineer-mobile-pre-departure-action-eligibility-evaluator-pure-helper-no-state-change.md';
const TASK931_DOC = 'docs/task-931-engineer-mobile-pre-departure-eligibility-projection-delegation-no-state-change.md';
const TASK932_DOC = 'docs/task-932-engineer-mobile-pre-departure-eligibility-delegation-closure-patch-inclusion-no-runtime-change.md';

const PROJECTION_UNIT_TEST_FILES = [
  'tests/engineerMobile/engineerAssignedAppointmentsProjectionService.unit.test.js',
  'tests/engineerMobile/engineerAssignedAppointmentDetailProjectionService.unit.test.js',
];

const PROJECTION_COMPATIBILITY_TEST_FILES = [
  'tests/engineerMobile/engineerAssignedAppointmentsProjectionServiceClosure.static.test.js',
  'tests/engineerMobile/engineerAssignedAppointmentDetailProjectionServiceClosure.static.test.js',
  'tests/engineerMobile/engineerAssignedAppointmentsBranchClosure.static.test.js',
  'tests/engineerMobile/engineerAssignedAppointmentDetailBranchClosure.static.test.js',
  'tests/engineerMobile/engineerAssignedAppointmentsProjectionHandler.http-behavior.unit.test.js',
  'tests/engineerMobile/engineerAssignedAppointmentsAppAdapter.unit.test.js',
  'tests/engineerMobile/engineerAssignedAppointmentDetailProjectionHandler.http-behavior.unit.test.js',
];

const FINAL_PATCH_CANDIDATES = [
  EVALUATOR_FILE,
  LIST_SERVICE_FILE,
  DETAIL_SERVICE_FILE,
  TASK930_UNIT_TEST_FILE,
  TASK930_CLOSURE_TEST_FILE,
  TASK931_DELEGATION_TEST_FILE,
  TASK932_CLOSURE_TEST_FILE,
  ...PROJECTION_UNIT_TEST_FILES,
  ...PROJECTION_COMPATIBILITY_TEST_FILES,
  TASK930_DOC,
  TASK931_DOC,
  TASK932_DOC,
];

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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function productionSources() {
  return [
    read(EVALUATOR_FILE),
    read(LIST_SERVICE_FILE),
    read(DETAIL_SERVICE_FILE),
  ].join('\n');
}

test('Task930 through Task932 files exist for branch closure', () => {
  for (const file of FINAL_PATCH_CANDIDATES) {
    assert.equal(exists(file), true, `${file} should exist`);
  }
});

test('Task930 evaluator and Task931 delegation guard are present', () => {
  assert.match(read(EVALUATOR_FILE), /function evaluateEngineerPreDepartureActionEligibility/);
  assert.match(read(TASK931_DELEGATION_TEST_FILE), /projection display hints delegate to helper/);
  assert.match(read(TASK930_DOC), /Pure Helper/);
  assert.match(read(TASK931_DOC), /Projection Delegation/);
});

test('list and detail projections import and delegate to the Task930 helper only', () => {
  for (const file of [LIST_SERVICE_FILE, DETAIL_SERVICE_FILE]) {
    const source = read(file);

    assert.deepEqual(requireSpecifiers(source), ['./engineerPreDepartureActionEligibility']);
    assert.match(source, /evaluateEngineerPreDepartureActionEligibility\(\{/);
    assert.match(source, /engineerContext/);
    assert.match(source, /appointment/);
  }

  assert.deepEqual(requireSpecifiers(read(EVALUATOR_FILE)), []);
});

test('projection services expose only safe eligibility booleans and no helper reasons', () => {
  for (const file of [LIST_SERVICE_FILE, DETAIL_SERVICE_FILE]) {
    const source = read(file);

    assert.match(source, /canStartTravel:\s*eligibility\.canStartTravel === true/);
    assert.match(source, /canRecordArrival:\s*eligibility\.canRecordArrival === true/);
    assert.match(source, /canPrepareCompletionDraft:\s*eligibility\.canPrepareCompletionDraft === true/);
    assert.doesNotMatch(source, /Object\.assign\(\s*appointment\s*,\s*eligibility\s*\)/);
    assert.doesNotMatch(source, /\.reasons\b|reasons:/);
  }
});

test('evaluator and projections contain no workflow action execution or mutation paths', () => {
  const source = productionSources();

  assert.doesNotMatch(source, /\binsert\s+into\b|\bupdate\s+\w+\s+set\b|\bdelete\s+from\b|BEGIN|COMMIT|ROLLBACK/i);
  assert.doesNotMatch(source, /\.save\s*\(|\.create\s*\(|\.insert\s*\(|\.update\s*\(|\.delete\s*\(|\.destroy\s*\(/i);
  assert.doesNotMatch(source, /startTravel\s*\(|recordArrival\s*\(|checkIn\s*\(|markArrived\s*\(|markStarted\s*\(/i);
  assert.doesNotMatch(source, /submitCompletion\s*\(|completeAppointment\s*\(|createReport\s*\(|publishReport\s*\(/i);
  assert.doesNotMatch(source, /finalAppointmentId\s*=|final_appointment_id\s*=|caseStatus\s*=|appointmentStatus\s*=/);
});

test('evaluator and projections do not expose or mutate finalAppointmentId', () => {
  for (const file of [EVALUATOR_FILE, LIST_SERVICE_FILE, DETAIL_SERVICE_FILE]) {
    const source = read(file);

    assert.doesNotMatch(source, /finalAppointmentId|final_appointment_id/);
  }
});

test('evaluator and projections import no forbidden runtime dependencies', () => {
  const allowedSpecifiersByFile = {
    [EVALUATOR_FILE]: [],
    [LIST_SERVICE_FILE]: ['./engineerPreDepartureActionEligibility'],
    [DETAIL_SERVICE_FILE]: ['./engineerPreDepartureActionEligibility'],
  };

  for (const file of [EVALUATOR_FILE, LIST_SERVICE_FILE, DETAIL_SERVICE_FILE]) {
    const source = read(file);

    assert.deepEqual(requireSpecifiers(source), allowedSpecifiersByFile[file]);
    assert.doesNotMatch(
      source,
      /require\(['"].*(?:pg|database|pool|repositories?|transaction|baseRepository|routes?|controllers?|server|app|listen|bootstrap|auth|session|jwt|provider|line|sms|email|push|webhook|openai|ai|rag|vector|search|billing|settlement|env|config|credential|logger|network|smoke|migration|admin)['"]\)/i,
    );
    assert.doesNotMatch(source, /process\.env|console\.|fetch\(|axios|http\.request|https\.request|new Pool|createPool/i);
    assert.doesNotMatch(source, /\.listen\s*\(|express\s*\(|Router\s*\(|createServer\(/i);
  }
});

test('Task932 evidence doc lists final patch candidates and local status', () => {
  const doc = read(TASK932_DOC);

  for (const file of FINAL_PATCH_CANDIDATES) {
    assert.match(doc, new RegExp(escapeRegExp(file)));
    assert.match(doc, new RegExp('\\?\\? `' + escapeRegExp(file) + '`'));
  }

  assert.match(doc, /Task930-Task932 Final Patch Candidates/);
  assert.match(doc, /No Runtime Change/);
  assert.match(doc, /No workflow action execution/);
  assert.match(doc, /No route\/controller\/API rollout/);
  assert.match(doc, /No DB\/repository changes/);
  assert.match(doc, /No auth\/session\/JWT runtime/);
  assert.match(doc, /No provider\/AI\/RAG\/billing/);
  assert.match(doc, /No migration/);
  assert.match(doc, /No smoke\/shared runtime/);
  assert.match(doc, /finalAppointmentId/);
});
