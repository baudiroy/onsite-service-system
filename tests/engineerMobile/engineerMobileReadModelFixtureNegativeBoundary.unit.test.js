'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  engineerMobileReadModelRows,
} = require('./fixtures/engineerMobileReadModelRows.fixture');
const {
  mapEngineerMobileTaskListRows,
} = require('../../src/engineerMobile/engineerMobileTaskListReadModelMapper');
const {
  mapEngineerMobileTaskDetailRowsToReadModel,
} = require('../../src/engineerMobile/engineerMobileTaskDetailReadModelMapper');

const repoRoot = path.resolve(__dirname, '../..');
const testFile = path.join(repoRoot, 'tests/engineerMobile/engineerMobileReadModelFixtureNegativeBoundary.unit.test.js');

const FORBIDDEN_SUBSTRINGS = Object.freeze([
  'postgres://',
  'postgresql://',
  'mysql://',
  'mongodb://',
  'DATABASE_URL',
  'Bearer ',
  'raw_line_user_id',
  'line_user_id',
  'full_customer_payload',
  'full_payload',
  'field_service_report_id',
  'fieldServiceReportId',
  'service_report_id',
  'serviceReportId',
  'completion_report_id',
  'completionReportId',
  'finalAppointmentId',
  'final_appointment_id',
  'internal_note',
  'internalNote',
  'audit_log',
  'auditLog',
  'ai_raw_payload',
  'aiRawPayload',
  'billing_internal',
  'billingInternal',
  'settlement_internal',
  'settlementInternal',
  'token',
  'secret',
  'password',
  'credential',
  'signed_url',
  'storage_path',
]);

function requireSpecifiers(source) {
  const specifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers;
}

function assertNoForbiddenOutput(value) {
  const serialized = JSON.stringify(value);
  const lower = serialized.toLowerCase();

  for (const forbidden of FORBIDDEN_SUBSTRINGS) {
    assert.equal(lower.includes(forbidden.toLowerCase()), false, `leaked ${forbidden}`);
  }

  assert.equal(/09\d{2}[-\s]?\d{3}[-\s]?\d{3}/.test(serialized), false);
  assert.equal(/台北市.+\d+號/.test(serialized), false);
}

function withUnsafeUnknownFields(row, suffix) {
  return Object.freeze({
    ...row,
    raw_line_user_id: `raw_line_user_should_not_leak_${suffix}`,
    line_user_id: `line_user_should_not_leak_${suffix}`,
    phone: '0912-345-678',
    customer_phone: '0912-345-678',
    address: '台北市測試區測試路一段88號',
    full_address: '台北市測試區測試路一段88號',
    internal_note: `internal note should not leak ${suffix}`,
    audit_log: `audit log should not leak ${suffix}`,
    ai_raw_payload: `ai raw payload should not leak ${suffix}`,
    billing_internal: `billing internal should not leak ${suffix}`,
    settlement_internal: `settlement internal should not leak ${suffix}`,
    full_customer_payload: `full customer payload should not leak ${suffix}`,
    full_payload: `full payload should not leak ${suffix}`,
    field_service_report_id: `fsr_should_not_leak_${suffix}`,
    service_report_id: `service_report_should_not_leak_${suffix}`,
    completion_report_id: `completion_report_should_not_leak_${suffix}`,
    finalAppointmentId: `final_appointment_should_not_leak_${suffix}`,
    final_appointment_id: `final_appointment_should_not_leak_${suffix}`,
    database_url: 'postgres://user:pass@example.invalid/db',
    token: `token_should_not_leak_${suffix}`,
    secret: `secret_should_not_leak_${suffix}`,
    signed_url: `https://example.invalid/signed-url-token-${suffix}`,
    storage_path: `/unsafe/storage/path/${suffix}`,
  });
}

function buildUnsafeRows() {
  return engineerMobileReadModelRows.map((row, index) => withUnsafeUnknownFields(row, index + 1));
}

test('negative boundary unit test imports only fixture and existing mapper modules', () => {
  const specifiers = requireSpecifiers(fs.readFileSync(testFile, 'utf8'));
  const allowed = [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
    './fixtures/engineerMobileReadModelRows.fixture',
    '../../src/engineerMobile/engineerMobileTaskListReadModelMapper',
    '../../src/engineerMobile/engineerMobileTaskDetailReadModelMapper',
  ];

  assert.deepEqual(specifiers.sort(), allowed.sort());
  assert.equal(
    specifiers.some((specifier) => /db|pool|repositories?|transaction|provider|routes?|controllers?|services?|(^|\/|\.)app($|\.|\/)|(^|\/|\.)server($|\.|\/)|migration|psql|openai|rag|vector|smoke|browser/i.test(specifier)),
    false,
  );
});

test('sanitized fixture list mapping exposes no customer-sensitive or internal fields', () => {
  const mapped = mapEngineerMobileTaskListRows(engineerMobileReadModelRows, {
    organizationId: 'org_fixture_engineer_mobile',
    engineerId: 'eng_fixture_primary',
  });

  assert.equal(mapped.length, 3);
  assertNoForbiddenOutput(mapped);
});

test('unknown sensitive row fields are stripped by list mapper allow-list', () => {
  const mapped = mapEngineerMobileTaskListRows(buildUnsafeRows(), {
    organizationId: 'org_fixture_engineer_mobile',
    engineerId: 'eng_fixture_primary',
  });

  assert.equal(mapped.length, 3);
  assert.deepEqual(Object.keys(mapped[0]).sort(), [
    'addressSummary',
    'appointmentId',
    'assignedEngineerId',
    'caseId',
    'customerNameMasked',
    'customerPhoneMasked',
    'issueSummary',
    'organizationId',
    'productSummary',
    'scheduledEnd',
    'scheduledStart',
    'serviceType',
    'status',
  ].sort());
  assertNoForbiddenOutput(mapped);
});

test('detail mapper output does not expose FSR, completion report, or finalAppointmentId ownership', () => {
  const readModel = mapEngineerMobileTaskDetailRowsToReadModel({
    appointmentId: 'apt_fixture_multi_visit_002',
    engineerId: 'eng_fixture_primary',
    organizationId: 'org_fixture_engineer_mobile',
    rows: buildUnsafeRows(),
  });

  assert.equal(readModel.task.status, 'completed');
  assert.equal(Object.prototype.hasOwnProperty.call(readModel.task, 'fieldServiceReportId'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(readModel.task, 'serviceReportId'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(readModel.task, 'completionReportId'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(readModel.task, 'finalAppointmentId'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(readModel.task, 'final_appointment_id'), false);
  assertNoForbiddenOutput(readModel);
});

test('multi-appointment same-case fixture remains allowed without multiple formal reports', () => {
  const mapped = mapEngineerMobileTaskListRows(engineerMobileReadModelRows, {
    organizationId: 'org_fixture_engineer_mobile',
    engineerId: 'eng_fixture_primary',
  });
  const sameCaseRows = mapped.filter((row) => row.caseId === 'case_fixture_multi_visit_001');

  assert.equal(sameCaseRows.length, 2);
  assert.deepEqual(sameCaseRows.map((row) => row.appointmentId), [
    'apt_fixture_multi_visit_001',
    'apt_fixture_multi_visit_002',
  ]);
  assert.equal(sameCaseRows.some((row) => row.status === 'completed'), true);
  assertNoForbiddenOutput(sameCaseRows);
});

test('sanitized fixture mapping does not mutate source fixture rows', () => {
  const before = JSON.stringify(engineerMobileReadModelRows);

  mapEngineerMobileTaskListRows(buildUnsafeRows(), {
    organizationId: 'org_fixture_engineer_mobile',
    engineerId: 'eng_fixture_primary',
  });
  mapEngineerMobileTaskDetailRowsToReadModel({
    appointmentId: 'apt_fixture_note_exclusion_001',
    engineerId: 'eng_fixture_primary',
    organizationId: 'org_fixture_engineer_mobile',
    rows: buildUnsafeRows(),
  });

  assert.equal(JSON.stringify(engineerMobileReadModelRows), before);
});
