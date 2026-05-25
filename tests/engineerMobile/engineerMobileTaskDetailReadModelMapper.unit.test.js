'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  ENGINEER_MOBILE_TASK_DETAIL_FIELDS,
  buildEngineerMobileTaskDetailQuerySpec,
  mapEngineerMobileTaskDetailRow,
  mapEngineerMobileTaskDetailRowsToReadModel,
} = require('../../src/engineerMobile/engineerMobileTaskDetailReadModelMapper');

const repoRoot = path.resolve(__dirname, '../..');
const mapperFile = path.join(repoRoot, 'src/engineerMobile/engineerMobileTaskDetailReadModelMapper.js');

function input(overrides = {}) {
  return {
    appointmentId: 'apt_engineer_mobile_mapper_001',
    engineerId: 'eng_engineer_mobile_mapper_001',
    organizationId: 'org_engineer_mobile_mapper_001',
    rows: [row()],
    ...overrides,
  };
}

function row(overrides = {}) {
  return {
    organization_id: 'org_engineer_mobile_mapper_001',
    case_id: 'case_engineer_mobile_mapper_001',
    appointment_id: 'apt_engineer_mobile_mapper_001',
    assigned_engineer_id: 'eng_engineer_mobile_mapper_001',
    scheduled_start: '2026-05-21T09:00:00+08:00',
    scheduled_end: '2026-05-21T10:00:00+08:00',
    status: 'confirmed',
    customer_name_masked: '王○○',
    customer_phone_masked: '09xx-xxx-123',
    address_summary: '台北市大安區',
    product_summary: '冷氣',
    issue_summary: '不冷',
    service_type: 'repair',
    site_note_safe: '請從側門進入',
    checklist_summary: ['confirm_power', 'take_photo'],
    evidence_refs: [
      {
        id: 'photo_ref_test_001',
        type: 'photo',
        label: '故障照片',
      },
      {
        id: 'unsafe_signed_url',
        type: 'photo',
        url: 'https://example.invalid/signed-url',
      },
      'photo_ref_test_002',
      'https://example.invalid/raw-photo',
    ],
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
    'signed-url',
    'raw-photo',
  ]) {
    assert.equal(serialized.includes(forbiddenValue), false, `leaked ${forbiddenValue}`);
  }

  assert.equal(serialized.includes('internal_note'), false);
  assert.equal(serialized.includes('audit_log'), false);
  assert.equal(serialized.includes('ai_raw_payload'), false);
  assert.equal(serialized.includes('billing_internal'), false);
  assert.equal(serialized.includes('settlement_internal'), false);
  assert.equal(serialized.includes('raw_phone'), false);
  assert.equal(serialized.includes('raw_address'), false);
  assert.equal(serialized.includes('raw_line_user_id'), false);
  assert.equal(serialized.includes('final_appointment_id'), false);
  assert.equal(serialized.includes('finalAppointmentId'), false);
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

test('exports mapper query spec functions and fields', () => {
  assert.equal(typeof mapEngineerMobileTaskDetailRow, 'function');
  assert.equal(typeof mapEngineerMobileTaskDetailRowsToReadModel, 'function');
  assert.equal(typeof buildEngineerMobileTaskDetailQuerySpec, 'function');
  assert.ok(Array.isArray(ENGINEER_MOBILE_TASK_DETAIL_FIELDS));
  assert.ok(ENGINEER_MOBILE_TASK_DETAIL_FIELDS.includes('appointment_id'));
});

test('missing input or rows fail closed', () => {
  assert.deepEqual(mapEngineerMobileTaskDetailRowsToReadModel(), { task: null });
  assert.deepEqual(mapEngineerMobileTaskDetailRowsToReadModel({}), { task: null });
  assert.deepEqual(mapEngineerMobileTaskDetailRowsToReadModel(input({ rows: [] })), { task: null });
});

test('valid synthetic row maps to safe detail read model without mutating input', () => {
  const source = input();
  const before = clone(source);
  const result = mapEngineerMobileTaskDetailRowsToReadModel(source);

  assert.deepEqual(source, before);
  assert.equal(result.task.organizationId, 'org_engineer_mobile_mapper_001');
  assert.equal(result.task.caseId, 'case_engineer_mobile_mapper_001');
  assert.equal(result.task.appointmentId, 'apt_engineer_mobile_mapper_001');
  assert.equal(result.task.assignedEngineerId, 'eng_engineer_mobile_mapper_001');
  assert.equal(result.task.customerNameMasked, '王○○');
  assert.equal(result.task.customerPhoneMasked, '09xx-xxx-123');
  assert.deepEqual(result.task.evidenceRefs, [
    {
      id: 'photo_ref_test_001',
      type: 'photo',
      label: '故障照片',
    },
    {
      id: 'photo_ref_test_002',
      type: 'reference',
    },
  ]);
  assertNoForbiddenOutput(result);
});

test('rows missing required identities are excluded', () => {
  for (const missingField of [
    'organization_id',
    'case_id',
    'appointment_id',
    'assigned_engineer_id',
  ]) {
    const sourceRow = row();
    delete sourceRow[missingField];

    assert.deepEqual(mapEngineerMobileTaskDetailRowsToReadModel(input({
      rows: [sourceRow],
    })), { task: null });
  }
});

test('organization engineer and appointment filters are enforced', () => {
  for (const sourceRow of [
    row({ organization_id: 'org_other' }),
    row({ assigned_engineer_id: 'eng_other' }),
    row({ appointment_id: 'apt_other' }),
  ]) {
    assert.deepEqual(mapEngineerMobileTaskDetailRowsToReadModel(input({
      rows: [sourceRow],
    })), { task: null });
  }

  assert.equal(mapEngineerMobileTaskDetailRowsToReadModel(input({
    rows: [
      row({ appointment_id: 'apt_other' }),
      row({ case_id: 'case_allowed_after_filter' }),
    ],
  })).task.caseId, 'case_allowed_after_filter');
});

test('row mapper strips internal billing settlement raw identity and final appointment fields', () => {
  const mapped = mapEngineerMobileTaskDetailRow(row());

  assert.equal(mapped.caseId, 'case_engineer_mobile_mapper_001');
  assertNoForbiddenOutput(mapped);
});

test('unsafe evidence refs are stripped and safe metadata remains', () => {
  const mapped = mapEngineerMobileTaskDetailRow(row({
    evidence_refs: [
      {
        id: 'safe_ref',
        type: 'photo',
        label: '安全照片',
        storage_path: 'storage_path_should_not_leak',
      },
      {
        id: 'safe_ref_2',
        type: 'photo',
        label: '安全照片二',
      },
      'safe_ref_3',
      'https://example.invalid/signed-url',
    ],
  }));

  assert.deepEqual(mapped.evidenceRefs, [
    {
      id: 'safe_ref_2',
      type: 'photo',
      label: '安全照片二',
    },
    {
      id: 'safe_ref_3',
      type: 'reference',
    },
  ]);
  assertNoForbiddenOutput(mapped);
});

test('query spec requires organization engineer and appointment params', () => {
  for (const queryInput of [
    {},
    { organizationId: 'org_engineer_mobile_mapper_001' },
    { organizationId: 'org_engineer_mobile_mapper_001', engineerId: 'eng_engineer_mobile_mapper_001' },
  ]) {
    const spec = buildEngineerMobileTaskDetailQuerySpec(queryInput);

    assert.equal(spec.ok, false);
    assert.equal(spec.executable, false);
    assert.equal(spec.reason, 'missing_required_params');
  }
});

test('query spec is static placeholder based and non executable', () => {
  const spec = buildEngineerMobileTaskDetailQuerySpec({
    appointmentId: 'apt_engineer_mobile_mapper_001',
    engineerId: 'eng_engineer_mobile_mapper_001',
    organizationId: 'org_engineer_mobile_mapper_001',
  });

  assert.equal(spec.ok, true);
  assert.equal(spec.executable, false);
  assert.deepEqual(spec.requiredParams, ['organizationId', 'engineerId', 'appointmentId']);
  assert.deepEqual(spec.params, {
    appointmentId: 'apt_engineer_mobile_mapper_001',
    engineerId: 'eng_engineer_mobile_mapper_001',
    organizationId: 'org_engineer_mobile_mapper_001',
  });
  assert.match(spec.sql, /\$1/);
  assert.match(spec.sql, /\$2/);
  assert.match(spec.sql, /\$3/);
  assert.equal(spec.sql.includes('org_engineer_mobile_mapper_001'), false);
  assert.equal(spec.sql.includes('eng_engineer_mobile_mapper_001'), false);
  assert.equal(spec.sql.includes('apt_engineer_mobile_mapper_001'), false);
  assertNoForbiddenOutput(spec);
});

test('query fields avoid raw customer payload and final appointment id', () => {
  const spec = buildEngineerMobileTaskDetailQuerySpec({
    appointmentId: 'apt_engineer_mobile_mapper_001',
    engineerId: 'eng_engineer_mobile_mapper_001',
    organizationId: 'org_engineer_mobile_mapper_001',
  });
  const serializedFields = JSON.stringify(spec.fields);

  assert.equal(serializedFields.includes('customer_payload'), false);
  assert.equal(serializedFields.includes('raw_phone'), false);
  assert.equal(serializedFields.includes('raw_address'), false);
  assert.equal(serializedFields.includes('raw_line_user_id'), false);
  assert.equal(serializedFields.includes('final_appointment_id'), false);
});

test('module import boundary has no dependencies', () => {
  const source = fs.readFileSync(mapperFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, []);
  assert.equal(specifiers.some((specifier) => /db|pool|transaction|repositories?/i.test(specifier)), false);
  assert.equal(specifiers.some((specifier) => /lineProvider|sms|email|push|rag|vector|openai/i.test(specifier)), false);
  assert.equal(specifiers.some((specifier) => /routes?|controllers?|app|server/i.test(specifier)), false);
});
