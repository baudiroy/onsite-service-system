'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  DATA_CORRECTION_PERSISTENCE_QUERY_NAME,
  DATA_CORRECTION_PERSISTENCE_RECORD_TYPES,
  DATA_CORRECTION_PERSISTENCE_TABLE_HINTS,
  buildDataCorrectionPersistenceQuerySpec,
  mapDataCorrectionWriterPayloadToRecord,
} = require('../../src/dataCorrection/dataCorrectionPersistenceRecordMapper');

const repoRoot = path.resolve(__dirname, '../..');
const mapperPath = path.join(repoRoot, 'src/dataCorrection/dataCorrectionPersistenceRecordMapper.js');
const migrationPath = path.join(repoRoot, 'migrations/021_create_data_correction_persistence_schema.sql');
const proposalPath = path.join(repoRoot, 'docs/design/data-correction-persistence-schema-proposal.md');

const EXPECTED_MAPPING = DATA_CORRECTION_PERSISTENCE_TABLE_HINTS;

const COMMON_FIELDS = Object.freeze([
  'organization_id',
  'case_id',
  'appointment_id',
  'actor_user_id',
  'actor_role',
  'action_type',
  'decision',
  'reason_code',
  'safe_message_key',
  'record_type',
  'safe_metadata',
  'occurred_at',
  'created_at',
]);

const FORBIDDEN_PATTERNS = Object.freeze([
  /raw_phone_should_not_leak/i,
  /raw_address_should_not_leak/i,
  /line_user_should_not_leak/i,
  /token_should_not_leak/i,
  /secret_should_not_leak/i,
  /DATABASE_URL_should_not_leak/i,
  /old_value_should_not_leak/i,
  /new_value_should_not_leak/i,
  /ai_raw_payload_should_not_leak/i,
  /final_appointment_should_not_leak/i,
]);

function safePayload(overrides = {}) {
  return {
    organizationId: 'org_data_correction_alignment_001',
    caseId: 'case_data_correction_alignment_001',
    appointmentId: 'apt_data_correction_alignment_001',
    actorUserId: 'user_data_correction_alignment_001',
    actorRole: 'dispatch_assistant',
    actionType: 'pre_departure_apply',
    fieldKey: 'issueSummary',
    fieldGroup: 'dispatch_operational',
    decision: 'allowed',
    reasonCode: 'PRE_DEPARTURE_CORRECTION_ALLOWED',
    safeMessageKey: 'dataCorrection.ok',
    terminalState: 'follow_up_required',
    proposalType: 'follow_up_appointment',
    timestamp: '2026-05-21T00:00:00.000Z',
    fromValue: 'old_value_should_not_leak',
    toValue: 'new_value_should_not_leak',
    rawPhone: 'raw_phone_should_not_leak',
    rawAddress: 'raw_address_should_not_leak',
    rawLineUserId: 'line_user_should_not_leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    DATABASE_URL: 'DATABASE_URL_should_not_leak',
    aiRawPayload: 'ai_raw_payload_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    ...overrides,
  };
}

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function buildSpec(recordType, payloadOverrides = {}) {
  return buildDataCorrectionPersistenceQuerySpec({
    writerType: recordType,
    payload: safePayload(payloadOverrides),
  });
}

function assertNoForbidden(value) {
  const serialized = JSON.stringify(value);

  for (const pattern of FORBIDDEN_PATTERNS) {
    assert.doesNotMatch(serialized, pattern);
  }

  for (const forbiddenKey of [
    'fromValue',
    'toValue',
    'rawPhone',
    'rawAddress',
    'rawLineUserId',
    'lineUserId',
    'line_user_id',
    'token',
    'secret',
    'DATABASE_URL',
    'aiRawPayload',
    'finalAppointmentId',
  ]) {
    assert.equal(serialized.includes(`"${forbiddenKey}"`), false, `leaked key ${forbiddenKey}`);
  }
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

test('mapper exports record and query spec functions', () => {
  assert.equal(typeof mapDataCorrectionWriterPayloadToRecord, 'function');
  assert.equal(typeof buildDataCorrectionPersistenceQuerySpec, 'function');
  assert.equal(DATA_CORRECTION_PERSISTENCE_QUERY_NAME, 'dataCorrectionPersistenceInsert');
  assert.deepEqual(new Set(Object.values(DATA_CORRECTION_PERSISTENCE_RECORD_TYPES)), new Set(Object.keys(EXPECTED_MAPPING)));
});

test('mapper record types align with migration and design proposal table names', () => {
  const migration = read(migrationPath);
  const proposal = read(proposalPath);

  for (const [recordType, tableName] of Object.entries(EXPECTED_MAPPING)) {
    const mapped = mapDataCorrectionWriterPayloadToRecord({
      writerType: recordType,
      payload: safePayload(),
    });

    assert.equal(mapped.ok, true, recordType);
    assert.equal(mapped.tableHint, tableName, recordType);
    assert.equal(migration.includes(`CREATE TABLE IF NOT EXISTS ${tableName}`), true, `${tableName} missing from migration`);
    assert.equal(proposal.includes(tableName), true, `${tableName} missing from proposal`);
  }
});

test('required common fields align between migration and mapper query specs', () => {
  const migration = read(migrationPath);

  for (const [recordType, tableName] of Object.entries(EXPECTED_MAPPING)) {
    const spec = buildSpec(recordType);

    assert.equal(spec.ok, true, recordType);
    assert.equal(spec.name, DATA_CORRECTION_PERSISTENCE_QUERY_NAME);
    assert.equal(spec.tableHint, tableName);
    assert.equal(spec.executable, false);
    assert.equal(spec.params.includes('safeMetadata'), true);

    for (const field of COMMON_FIELDS) {
      assert.equal(migration.includes(field), true, `migration missing ${field}`);
    }

    for (const field of spec.fields) {
      assert.match(migration, new RegExp(`\\b${field}\\b`, 'i'), `${field} missing from migration`);
    }
  }
});

test('query spec SQL remains parameterized and does not interpolate raw values', () => {
  for (const recordType of Object.keys(EXPECTED_MAPPING)) {
    const spec = buildSpec(recordType);

    assert.equal(spec.executable, false);
    assert.match(spec.sql, /\$1/);
    assert.doesNotMatch(spec.sql, /raw_phone_should_not_leak|token_should_not_leak|DATABASE_URL_should_not_leak/i);
    assertNoForbidden(spec);
  }
});

test('forbidden fields are absent from mapper output query spec and migration', () => {
  const migration = read(migrationPath);

  for (const recordType of Object.keys(EXPECTED_MAPPING)) {
    const mapped = mapDataCorrectionWriterPayloadToRecord({
      writerType: recordType,
      payload: safePayload(),
    });
    const spec = buildSpec(recordType);

    assertNoForbidden(mapped);
    assertNoForbidden(spec);
  }

  for (const forbiddenColumn of [
    'raw_phone',
    'raw_address',
    'line_user_id',
    'token',
    'secret',
    'password',
    'database_url',
    'from_value',
    'to_value',
    'ai_raw',
    'final_appointment_id',
    'field_service_report_id',
  ]) {
    assert.doesNotMatch(migration, new RegExp(`(^|\\n)\\s*${forbiddenColumn}\\s+`, 'i'));
  }
});

test('sourceAppointmentId normalizes to appointmentId for follow-up path', () => {
  const spec = buildDataCorrectionPersistenceQuerySpec({
    writerType: 'follow_up_draft',
    payload: safePayload({
      appointmentId: undefined,
      sourceAppointmentId: 'apt_data_correction_alignment_001',
    }),
  });

  assert.equal(spec.ok, true);
  assert.equal(spec.tableHint, 'data_correction_follow_up_drafts');
  assert.equal(spec.params.includes('appointmentId'), true);
  assert.equal(spec.params.includes('sourceAppointmentId'), false);
  assert.equal(spec.values.includes('apt_data_correction_alignment_001'), true);
  assertNoForbidden(spec);
});

test('mapper module import boundary remains no DB repository provider or AI', () => {
  const source = read(mapperPath);
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, ['./dataCorrectionSafeWriters']);
  assert.doesNotMatch(source, /require\(['"][^'"]*(db|pool|repositories?|providers?|ai|rag|vector|openai|routes?|controllers?|server)[^'"]*['"]\)/i);
  assert.doesNotMatch(source, /process\.env|console\.(log|info|warn|error|debug)/);
});
