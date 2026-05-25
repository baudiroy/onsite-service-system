'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  ENGINEER_MOBILE_TASK_LIST_QUERY_FIELDS,
  ENGINEER_MOBILE_TASK_LIST_QUERY_NAME,
  ENGINEER_MOBILE_TASK_LIST_REQUIRED_PARAMS,
  buildEngineerMobileTaskListQuerySpec,
  mapEngineerMobileTaskListRows,
  mapEngineerMobileTaskRow,
} = require('../../src/engineerMobile/engineerMobileTaskListReadModelMapper');

const repoRoot = path.resolve(__dirname, '../..');
const mapperFile = path.join(repoRoot, 'src/engineerMobile/engineerMobileTaskListReadModelMapper.js');

function row(overrides = {}) {
  return {
    case_id: 'case_engineer_mobile_mapper_001',
    appointment_id: 'apt_engineer_mobile_mapper_001',
    organization_id: 'org_engineer_mobile_mapper_001',
    assigned_engineer_id: 'eng_engineer_mobile_mapper_001',
    scheduled_start: '2026-05-21T09:00:00+08:00',
    scheduled_end: '2026-05-21T10:00:00+08:00',
    appointment_status: 'confirmed',
    customer_name_masked: '王○○',
    customer_phone_masked: '09xx-xxx-123',
    address_summary: '台北市大安區',
    product_summary: '冷氣',
    issue_summary: '不冷',
    service_type: 'repair',
    internal_note: 'internal_note_should_not_leak',
    audit_log: 'audit_log_should_not_leak',
    ai_raw_payload: 'ai_raw_payload_should_not_leak',
    billing_internal: 'billing_internal_should_not_leak',
    settlement_internal: 'settlement_internal_should_not_leak',
    raw_phone: 'raw_phone_should_not_leak',
    raw_address: 'raw_address_should_not_leak',
    raw_line_user_id: 'line_user_should_not_leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    DATABASE_URL: 'DATABASE_URL_should_not_leak',
    final_appointment_id: 'final_appointment_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    ...overrides,
  };
}

function input(overrides = {}) {
  return {
    organizationId: 'org_test',
    engineerId: 'eng_test',
    dateRange: {
      from: '2026-05-21',
      to: '2026-05-28',
    },
    ...overrides,
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertNoForbiddenOutput(value) {
  const serialized = JSON.stringify(value);

  for (const forbiddenValue of [
    'internal_note_should_not_leak',
    'audit_log_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'billing_internal_should_not_leak',
    'settlement_internal_should_not_leak',
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'DATABASE_URL_should_not_leak',
    'final_appointment_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbiddenValue), false, `leaked ${forbiddenValue}`);
  }

  assert.equal(serialized.includes('"rawPhone"'), false);
  assert.equal(serialized.includes('"rawAddress"'), false);
  assert.equal(serialized.includes('"rawLineUserId"'), false);
  assert.equal(serialized.includes('"finalAppointmentId"'), false);
  assert.equal(serialized.includes('"final_appointment_id"'), false);
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

test('exports mapper and query spec functions/constants', () => {
  assert.equal(typeof mapEngineerMobileTaskRow, 'function');
  assert.equal(typeof mapEngineerMobileTaskListRows, 'function');
  assert.equal(typeof buildEngineerMobileTaskListQuerySpec, 'function');
  assert.equal(ENGINEER_MOBILE_TASK_LIST_QUERY_NAME, 'engineerMobileTaskListReadModel');
  assert.deepEqual(ENGINEER_MOBILE_TASK_LIST_REQUIRED_PARAMS, ['organizationId', 'engineerId']);
  assert.equal(Array.isArray(ENGINEER_MOBILE_TASK_LIST_QUERY_FIELDS), true);
});

test('missing input returns empty tasks', () => {
  assert.deepEqual(mapEngineerMobileTaskListRows(), []);
  assert.deepEqual(mapEngineerMobileTaskListRows(null), []);
  assert.deepEqual(mapEngineerMobileTaskListRows({}), []);
});

test('valid synthetic rows map to service readModel shape', () => {
  const [mapped] = mapEngineerMobileTaskListRows([row()]);

  assert.deepEqual(mapped, {
    assignedEngineerId: 'eng_engineer_mobile_mapper_001',
    appointmentId: 'apt_engineer_mobile_mapper_001',
    caseId: 'case_engineer_mobile_mapper_001',
    organizationId: 'org_engineer_mobile_mapper_001',
    scheduledStart: '2026-05-21T09:00:00+08:00',
    scheduledEnd: '2026-05-21T10:00:00+08:00',
    status: 'confirmed',
    customerNameMasked: '王○○',
    customerPhoneMasked: '09xx-xxx-123',
    addressSummary: '台北市大安區',
    productSummary: '冷氣',
    issueSummary: '不冷',
    serviceType: 'repair',
  });
  assertNoForbiddenOutput(mapped);
});

test('row missing organization_id is excluded', () => {
  assert.deepEqual(mapEngineerMobileTaskListRows([row({ organization_id: '' })]), []);
});

test('row missing case_id is excluded', () => {
  assert.deepEqual(mapEngineerMobileTaskListRows([row({ case_id: '' })]), []);
});

test('row missing appointment_id is excluded', () => {
  assert.deepEqual(mapEngineerMobileTaskListRows([row({ appointment_id: '' })]), []);
});

test('row missing assigned_engineer_id is excluded', () => {
  assert.deepEqual(mapEngineerMobileTaskListRows([row({ assigned_engineer_id: '' })]), []);
});

test('rows filter by organization and engineer when filters are provided', () => {
  const mapped = mapEngineerMobileTaskListRows([
    row({ case_id: 'case_allowed', organization_id: 'org_test', assigned_engineer_id: 'eng_test' }),
    row({ case_id: 'case_wrong_org', organization_id: 'org_other', assigned_engineer_id: 'eng_test' }),
    row({ case_id: 'case_wrong_engineer', organization_id: 'org_test', assigned_engineer_id: 'eng_other' }),
  ], {
    organizationId: 'org_test',
    engineerId: 'eng_test',
  });

  assert.deepEqual(mapped.map((entry) => entry.caseId), ['case_allowed']);
  assertNoForbiddenOutput(mapped);
});

test('multiple rows sort deterministically', () => {
  const mapped = mapEngineerMobileTaskListRows([
    row({
      case_id: 'case_c',
      appointment_id: 'apt_c',
      scheduled_start: '2026-05-21T13:00:00+08:00',
    }),
    row({
      case_id: 'case_b',
      appointment_id: 'apt_b',
      scheduled_start: '2026-05-21T09:00:00+08:00',
    }),
    row({
      case_id: 'case_a',
      appointment_id: 'apt_a',
      scheduled_start: '2026-05-21T09:00:00+08:00',
    }),
  ]);

  assert.deepEqual(mapped.map((entry) => entry.appointmentId), ['apt_a', 'apt_b', 'apt_c']);
});

test('internal, billing, raw identity, token, secret, and final appointment fields are stripped', () => {
  const mapped = mapEngineerMobileTaskListRows([row()]);

  assert.equal(mapped.length, 1);
  assertNoForbiddenOutput(mapped);
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
  ]);
});

test('input row bundle is not mutated', () => {
  const rows = [row()];
  const before = clone(rows);

  mapEngineerMobileTaskListRows(rows);

  assert.deepEqual(rows, before);
});

test('query spec requires organizationId and engineerId', () => {
  const spec = buildEngineerMobileTaskListQuerySpec(input());

  assert.equal(spec.ok, true);
  assert.equal(spec.executable, false);
  assert.equal(spec.name, 'engineerMobileTaskListReadModel');
  assert.deepEqual(spec.requiredParams, ['organizationId', 'engineerId']);
  assert.equal(spec.params.organizationId, 'org_test');
  assert.equal(spec.params.engineerId, 'eng_test');
  assert.equal(spec.params.from, '2026-05-21');
  assert.equal(spec.params.to, '2026-05-28');
  assert.equal(Array.isArray(spec.fields), true);
});

test('query spec missing required params fail-closes', () => {
  assert.deepEqual(buildEngineerMobileTaskListQuerySpec({ organizationId: 'org_test' }), {
    ok: false,
    executable: false,
    name: 'engineerMobileTaskListReadModel',
    requiredParams: ['organizationId', 'engineerId'],
    params: {
      organizationId: 'org_test',
      engineerId: null,
      from: null,
      to: null,
    },
    sql: null,
    fields: [],
    messageKey: 'engineerMobileTaskListQuerySpec.missingRequiredParams',
  });
});

test('query spec executable=false by default and SQL uses placeholders without raw interpolation', () => {
  const spec = buildEngineerMobileTaskListQuerySpec(input());

  assert.equal(spec.executable, false);
  assert.equal(spec.sql.includes('$1'), true);
  assert.equal(spec.sql.includes('$2'), true);
  assert.equal(spec.sql.includes('$3'), true);
  assert.equal(spec.sql.includes('$4'), true);
  assert.equal(spec.sql.includes('org_test'), false);
  assert.equal(spec.sql.includes('eng_test'), false);
  assert.equal(spec.sql.includes('2026-05-21'), false);
  assert.equal(spec.sql.includes('2026-05-28'), false);
  assertNoForbiddenOutput(spec);
});

test('query spec fields do not request raw customer payload or final appointment id', () => {
  const spec = buildEngineerMobileTaskListQuerySpec(input());
  const serialized = JSON.stringify([spec.fields, spec.sql]);

  assert.equal(serialized.includes('raw_phone'), false);
  assert.equal(serialized.includes('raw_address'), false);
  assert.equal(serialized.includes('line_user'), false);
  assert.equal(serialized.includes('token'), false);
  assert.equal(serialized.includes('secret'), false);
  assert.equal(serialized.includes('final_appointment'), false);
});

test('module import boundary has no DB, repository, provider, AI, route, app, or server imports', () => {
  const source = fs.readFileSync(mapperFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, []);
  assert.doesNotMatch(source, /require\(/);
  assert.doesNotMatch(source, /from ['"][^'"]*(db|pool|repository|transaction|provider|line|sms|email|push|ai|rag|vector|routes?|app|server)[^'"]*['"]/i);
});
