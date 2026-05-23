'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const LIST_SERVICE_FILE = 'src/engineerMobile/engineerAssignedAppointmentsProjectionService.js';
const DETAIL_SERVICE_FILE = 'src/engineerMobile/engineerAssignedAppointmentDetailProjectionService.js';
const HELPER_FILE = 'src/engineerMobile/engineerPreDepartureActionEligibility.js';
const LIST_UNIT_TEST_FILE = 'tests/engineerMobile/engineerAssignedAppointmentsProjectionService.unit.test.js';
const DETAIL_UNIT_TEST_FILE = 'tests/engineerMobile/engineerAssignedAppointmentDetailProjectionService.unit.test.js';
const STATIC_TEST_FILE = 'tests/engineerMobile/engineerPreDepartureEligibilityProjectionDelegation.static.test.js';
const TASK_DOC = 'docs/task-931-engineer-mobile-pre-departure-eligibility-projection-delegation-no-state-change.md';

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

function projectionMapperSource(source, startName, endName) {
  const start = source.indexOf(`function ${startName}`);
  const end = source.indexOf(`function ${endName}`);

  assert.notEqual(start, -1, `${startName} should exist`);
  assert.notEqual(end, -1, `${endName} should exist`);

  return source.slice(start, end);
}

test('Task931 source test and doc files exist', () => {
  for (const file of [
    LIST_SERVICE_FILE,
    DETAIL_SERVICE_FILE,
    HELPER_FILE,
    LIST_UNIT_TEST_FILE,
    DETAIL_UNIT_TEST_FILE,
    STATIC_TEST_FILE,
    TASK_DOC,
  ]) {
    assert.equal(exists(file), true, `${file} should exist`);
  }
});

test('list and detail projections import only the pure Task930 eligibility helper', () => {
  for (const file of [LIST_SERVICE_FILE, DETAIL_SERVICE_FILE]) {
    const source = read(file);

    assert.deepEqual(requireSpecifiers(source), ['./engineerPreDepartureActionEligibility']);
    assert.match(source, /evaluateEngineerPreDepartureActionEligibility/);
    assert.doesNotMatch(
      source,
      /require\(['"].*(?:pg|database|pool|repositories?|transaction|baseRepository|routes?|controllers?|server|app|listen|bootstrap|auth|session|jwt|provider|line|sms|email|push|webhook|openai|ai|rag|vector|search|billing|settlement|env|config|credential|logger|network|smoke|migration|admin)['"]\)/i,
    );
    assert.doesNotMatch(source, /process\.env|console\.|fetch\(|axios|http\.request|https\.request|new Pool|createPool/i);
  }
});

test('projection display hints delegate to helper and do not expose helper reasons', () => {
  for (const file of [LIST_SERVICE_FILE, DETAIL_SERVICE_FILE]) {
    const source = read(file);

    assert.match(source, /function preDepartureEligibilityHints/);
    assert.match(source, /canStartTravel:\s*eligibility\.canStartTravel === true/);
    assert.match(source, /canRecordArrival:\s*eligibility\.canRecordArrival === true/);
    assert.match(source, /canPrepareCompletionDraft:\s*eligibility\.canPrepareCompletionDraft === true/);
    assert.doesNotMatch(source, /\.reasons\b|reasons:/);
  }

  assert.doesNotMatch(read(LIST_SERVICE_FILE), /function canStartTravelHint/);
  assert.doesNotMatch(read(DETAIL_SERVICE_FILE), /function canStartTravelHint|function canRecordArrivalHint|function canPrepareCompletionDraftHint/);
});

test('projection mappers remain allowlist-only and exclude finalAppointmentId and sensitive fields', () => {
  const listMapperSource = projectionMapperSource(
    read(LIST_SERVICE_FILE),
    'mapAppointmentProjection',
    'sortAppointment',
  );
  const detailMapperSource = projectionMapperSource(
    read(DETAIL_SERVICE_FILE),
    'mapAppointmentDetailProjection',
    'queryAssignedAppointmentDetail',
  );

  for (const source of [listMapperSource, detailMapperSource]) {
    for (const field of [
      'phone',
      'mobile',
      'tel',
      'address',
      'line_user_id',
      'lineUserId',
      'providerRawPayload',
      'provider_raw_payload',
      'token',
      'secret',
      'internalNote',
      'internal_note',
      'dispatcherNote',
      'dispatcher_note',
      'billingInternal',
      'billing_internal',
      'settlementInternal',
      'settlement_internal',
      'aiRawPayload',
      'ai_raw_payload',
      'finalAppointmentId',
      'final_appointment_id',
      'fieldServiceReportId',
      'completionReportId',
      'rawCasePayload',
      'rawAppointmentPayload',
      'rawReportPayload',
      'sql',
      'stack',
    ]) {
      assert.equal(source.includes(field), false, `projection mapper must not expose ${field}`);
    }
  }
});

test('projection services remain read-only and introduce no workflow action execution', () => {
  for (const file of [LIST_SERVICE_FILE, DETAIL_SERVICE_FILE]) {
    const source = read(file);

    assert.match(source, /readOnly:\s*true/);
    assert.match(source, /dbClient\.query/);
    assert.doesNotMatch(source, /\binsert\s+into\b|\bupdate\s+\w+\s+set\b|\bdelete\s+from\b|BEGIN|COMMIT|ROLLBACK/i);
    assert.doesNotMatch(source, /\.save\s*\(|\.create\s*\(|\.insert\s*\(|\.update\s*\(|\.delete\s*\(|\.destroy\s*\(/i);
    assert.doesNotMatch(source, /startTravel\s*\(|recordArrival\s*\(|markArrived\s*\(|markStarted\s*\(/i);
    assert.doesNotMatch(source, /submitCompletion\s*\(|completeAppointment\s*\(|createReport\s*\(|publishReport\s*\(/i);
    assert.doesNotMatch(source, /finalAppointmentId\s*=|final_appointment_id\s*=|caseStatus\s*=|appointmentStatus\s*=/);
  }
});

test('unit coverage locks delegated hint values and no sensitive leakage', () => {
  const listTestSource = read(LIST_UNIT_TEST_FILE);
  const detailTestSource = read(DETAIL_UNIT_TEST_FILE);

  assert.match(listTestSource, /display eligibility hints are delegated to pre-departure helper/);
  assert.match(detailTestSource, /detail display eligibility hints are delegated to pre-departure helper/);
  assert.match(listTestSource, /canStartTravel/);
  assert.match(listTestSource, /canRecordArrival/);
  assert.match(listTestSource, /canPrepareCompletionDraft/);
  assert.match(detailTestSource, /canStartTravel/);
  assert.match(detailTestSource, /canRecordArrival/);
  assert.match(detailTestSource, /canPrepareCompletionDraft/);
  assert.match(listTestSource, /assertNoSensitiveLeak/);
  assert.match(detailTestSource, /assertNoSensitiveLeak/);
});

test('Task931 evidence doc records projection delegation and no-state-change boundaries', () => {
  const doc = read(TASK_DOC);

  for (const file of [
    LIST_SERVICE_FILE,
    DETAIL_SERVICE_FILE,
    HELPER_FILE,
    LIST_UNIT_TEST_FILE,
    DETAIL_UNIT_TEST_FILE,
    STATIC_TEST_FILE,
  ]) {
    assert.match(doc, new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(doc, /Projection Delegation/);
  assert.match(doc, /No State Change/);
  assert.match(doc, /No DB\/repository changes/);
  assert.match(doc, /No route\/controller\/API rollout/);
  assert.match(doc, /No auth\/session\/JWT runtime/);
  assert.match(doc, /No provider sending/);
  assert.match(doc, /No AI\/RAG/);
  assert.match(doc, /No billing\/settlement/);
  assert.match(doc, /No migration/);
  assert.match(doc, /No smoke\/shared runtime/);
  assert.match(doc, /No start travel action/);
  assert.match(doc, /No arrival action/);
  assert.match(doc, /No completion\/report action/);
  assert.match(doc, /finalAppointmentId/);
});
