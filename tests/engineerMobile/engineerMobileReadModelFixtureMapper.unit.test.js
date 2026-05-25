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
const testFile = path.join(repoRoot, 'tests/engineerMobile/engineerMobileReadModelFixtureMapper.unit.test.js');

function requireSpecifiers(source) {
  const specifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers;
}

function assertNoSensitiveOutput(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'postgres://',
    'postgresql://',
    'mysql://',
    'mongodb://',
    'Bearer ',
    'raw_line_user_id',
    'line_user_id',
    'full_customer_payload',
    'field_service_report_id',
    'internal_note',
    'audit_log',
    'ai_raw_payload',
    'billing_internal',
    'settlement_internal',
    'token',
    'secret',
    'password',
    'credential',
  ]) {
    assert.equal(serialized.toLowerCase().includes(forbidden.toLowerCase()), false, `leaked ${forbidden}`);
  }

  assert.equal(/09\d{2}[-\s]?\d{3}[-\s]?\d{3}/.test(serialized), false);
}

test('unit test imports only fixture and existing mapper modules besides node builtins', () => {
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
  assert.equal(specifiers.some((specifier) => /db|pool|repositories?|transaction|provider|routes?|controllers?|services?|(^|\/|\.)app($|\.|\/)|(^|\/|\.)server($|\.|\/)|migration|psql|openai|rag|vector/i.test(specifier)), false);
});

test('fixture list rows map for assigned engineer without DB access', () => {
  const mapped = mapEngineerMobileTaskListRows(engineerMobileReadModelRows, {
    organizationId: 'org_fixture_engineer_mobile',
    engineerId: 'eng_fixture_primary',
  });

  assert.deepEqual(mapped.map((row) => row.appointmentId), [
    'apt_fixture_multi_visit_001',
    'apt_fixture_multi_visit_002',
    'apt_fixture_note_exclusion_001',
  ]);
  assert.equal(mapped.every((row) => row.organizationId === 'org_fixture_engineer_mobile'), true);
  assert.equal(mapped.every((row) => row.assignedEngineerId === 'eng_fixture_primary'), true);
  assertNoSensitiveOutput(mapped);
});

test('multiple appointments for one case do not create formal completion report fields', () => {
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
  assert.equal(JSON.stringify(sameCaseRows).includes('fieldServiceReportId'), false);
  assert.equal(JSON.stringify(sameCaseRows).includes('field_service_report_id'), false);
});

test('completed fixture row does not let fixture decide finalAppointmentId', () => {
  const readModel = mapEngineerMobileTaskDetailRowsToReadModel({
    appointmentId: 'apt_fixture_multi_visit_002',
    engineerId: 'eng_fixture_primary',
    organizationId: 'org_fixture_engineer_mobile',
    rows: engineerMobileReadModelRows,
  });

  assert.equal(readModel.task.status, 'completed');
  assert.equal(Object.prototype.hasOwnProperty.call(readModel.task, 'finalAppointmentId'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(readModel.task, 'final_appointment_id'), false);
  assert.equal(JSON.stringify(readModel).includes('finalAppointmentId'), false);
  assertNoSensitiveOutput(readModel);
});

test('source-excluded and internal-note-excluded concepts remain safe in mapper output', () => {
  const primaryMapped = mapEngineerMobileTaskListRows(engineerMobileReadModelRows, {
    organizationId: 'org_fixture_engineer_mobile',
    engineerId: 'eng_fixture_primary',
  });
  const assignmentReviewMapped = mapEngineerMobileTaskListRows(engineerMobileReadModelRows, {
    organizationId: 'org_fixture_engineer_mobile',
    engineerId: 'eng_fixture_assignment_review',
  });
  const followUpDetail = mapEngineerMobileTaskDetailRowsToReadModel({
    appointmentId: 'apt_fixture_note_exclusion_001',
    engineerId: 'eng_fixture_primary',
    organizationId: 'org_fixture_engineer_mobile',
    rows: engineerMobileReadModelRows,
  });

  assert.equal(primaryMapped.some((row) => row.appointmentId === 'apt_fixture_pending_assignment_001'), false);
  assert.equal(assignmentReviewMapped.length, 1);
  assert.equal(assignmentReviewMapped[0].status, 'pending_assignment_review');
  assert.equal(followUpDetail.task.siteNoteSafe.includes('internal'), false);
  assertNoSensitiveOutput({ primaryMapped, assignmentReviewMapped, followUpDetail });
});
