'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  DATA_CORRECTION_APPOINTMENT_REQUIRED_RECORD_TYPES,
  DATA_CORRECTION_PERSISTENCE_FIELDS,
  DATA_CORRECTION_PERSISTENCE_QUERY_NAME,
  DATA_CORRECTION_PERSISTENCE_RECORD_TYPES,
  DATA_CORRECTION_PERSISTENCE_TABLE_HINTS,
  buildDataCorrectionPersistenceQuerySpec,
  mapDataCorrectionWriterPayloadToRecord,
} = require('../../src/dataCorrection/dataCorrectionPersistenceRecordMapper');

const repoRoot = path.resolve(__dirname, '../..');
const mapperFile = path.join(repoRoot, 'src/dataCorrection/dataCorrectionPersistenceRecordMapper.js');

function safePayload(overrides = {}) {
  return {
    organizationId: 'org_data_correction_record_mapper_001',
    caseId: 'case_data_correction_record_mapper_001',
    appointmentId: 'apt_data_correction_record_mapper_001',
    actorUserId: 'user_data_correction_record_mapper_001',
    actorRole: 'dispatch_assistant',
    actionType: 'post_departure_freeze',
    fieldKey: 'issueSummary',
    fieldGroup: 'dispatch_operational',
    decision: 'manual_dispatch_contact_required',
    reasonCode: 'CORRECTION_FROZEN_AFTER_DEPARTURE',
    safeMessageKey: 'dataCorrection.manualDispatchContactRequired',
    terminalState: 'follow_up_required',
    proposalType: 'follow_up_appointment',
    timestamp: '2026-05-21T10:00:00.000Z',
    ...overrides,
  };
}

function unsafeFields() {
  return {
    fromValue: 'old_value_should_not_leak',
    toValue: 'new_value_should_not_leak',
    rawPhone: 'raw_phone_should_not_leak',
    rawAddress: 'raw_address_should_not_leak',
    rawLineUserId: 'line_user_should_not_leak',
    lineUserId: 'line_user_should_not_leak',
    line_user_id: 'line_user_should_not_leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    password: 'password_should_not_leak',
    DATABASE_URL: 'DATABASE_URL_should_not_leak',
    DB_URL: 'DB_URL_should_not_leak',
    POSTGRES_URL: 'POSTGRES_URL_should_not_leak',
    internalNote: 'internal_note_should_not_leak',
    auditLog: 'audit_log_should_not_leak',
    aiRawPayload: 'ai_raw_payload_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    request: {
      token: 'token_should_not_leak',
    },
    body: {
      rawPhone: 'raw_phone_should_not_leak',
    },
  };
}

function input(writerType, payloadOverrides = {}) {
  return {
    writerType,
    payload: safePayload(payloadOverrides),
  };
}

function assertSafeOutput(value) {
  const serialized = JSON.stringify(value);

  for (const forbiddenValue of [
    'old_value_should_not_leak',
    'new_value_should_not_leak',
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'password_should_not_leak',
    'DATABASE_URL_should_not_leak',
    'DB_URL_should_not_leak',
    'POSTGRES_URL_should_not_leak',
    'internal_note_should_not_leak',
    'audit_log_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'final_appointment_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbiddenValue), false, `leaked ${forbiddenValue}`);
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
    'password',
    'DATABASE_URL',
    'DB_URL',
    'POSTGRES_URL',
    'internalNote',
    'auditLog',
    'aiRawPayload',
    'finalAppointmentId',
    'request',
    'body',
  ]) {
    assert.equal(serialized.includes(`"${forbiddenKey}"`), false, `leaked key ${forbiddenKey}`);
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
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

test('exports mapper, query spec functions, and constants', () => {
  assert.equal(typeof mapDataCorrectionWriterPayloadToRecord, 'function');
  assert.equal(typeof buildDataCorrectionPersistenceQuerySpec, 'function');
  assert.equal(DATA_CORRECTION_PERSISTENCE_RECORD_TYPES.AUDIT, 'audit');
  assert.equal(DATA_CORRECTION_PERSISTENCE_FIELDS.organizationId, 'organization_id');
  assert.equal(DATA_CORRECTION_PERSISTENCE_QUERY_NAME, 'dataCorrectionPersistenceInsert');
  assert.equal(DATA_CORRECTION_PERSISTENCE_TABLE_HINTS.audit, 'data_correction_audit_events');
  assert.equal(DATA_CORRECTION_APPOINTMENT_REQUIRED_RECORD_TYPES.includes('audit'), false);
});

test('exported persistence table hints cover every supported record type', () => {
  const recordTypes = Object.values(DATA_CORRECTION_PERSISTENCE_RECORD_TYPES);

  assert.deepEqual(Object.keys(DATA_CORRECTION_PERSISTENCE_TABLE_HINTS).sort(), recordTypes.sort());
  for (const recordType of recordTypes) {
    assert.match(DATA_CORRECTION_PERSISTENCE_TABLE_HINTS[recordType], /^data_correction_/);
  }
});

test('exported appointment-required record types match appointment-scoped persistence records', () => {
  assert.deepEqual(new Set(DATA_CORRECTION_APPOINTMENT_REQUIRED_RECORD_TYPES), new Set([
    'appointment_result',
    'contact_log',
    'correction_application',
    'dispatch_note',
    'engineer_notification_intent',
    'evidence',
    'follow_up_draft',
  ]));
  assert.equal(DATA_CORRECTION_APPOINTMENT_REQUIRED_RECORD_TYPES.includes('audit'), false);
});

test('exported persistence metadata constants are immutable', () => {
  assert.equal(Object.isFrozen(DATA_CORRECTION_PERSISTENCE_TABLE_HINTS), true);
  assert.equal(Object.isFrozen(DATA_CORRECTION_APPOINTMENT_REQUIRED_RECORD_TYPES), true);
  assert.throws(() => {
    DATA_CORRECTION_PERSISTENCE_TABLE_HINTS.audit = 'unsafe_mutation';
  }, TypeError);
  assert.throws(() => {
    DATA_CORRECTION_APPOINTMENT_REQUIRED_RECORD_TYPES.push('audit');
  }, TypeError);
  assert.equal(DATA_CORRECTION_PERSISTENCE_TABLE_HINTS.audit, 'data_correction_audit_events');
  assert.equal(DATA_CORRECTION_APPOINTMENT_REQUIRED_RECORD_TYPES.includes('audit'), false);
});

test('valid audit writer payload maps to safe audit record', () => {
  const result = mapDataCorrectionWriterPayloadToRecord(input('audit'));

  assert.equal(result.ok, true);
  assert.equal(result.recordType, 'audit');
  assert.equal(result.tableHint, 'data_correction_audit_events');
  assert.equal(result.record.organizationId, 'org_data_correction_record_mapper_001');
  assert.equal(result.record.safeMetadata.fieldKey, 'issueSummary');
  assertSafeOutput(result);
});

test('valid contact log payload maps to safe contact record', () => {
  const result = mapDataCorrectionWriterPayloadToRecord(input('contact_log'));

  assert.equal(result.ok, true);
  assert.equal(result.tableHint, 'data_correction_contact_logs');
  assert.equal(result.record.appointmentId, 'apt_data_correction_record_mapper_001');
  assertSafeOutput(result);
});

test('valid dispatch note payload maps to safe dispatch record', () => {
  const result = mapDataCorrectionWriterPayloadToRecord(input('dispatch_note'));

  assert.equal(result.ok, true);
  assert.equal(result.tableHint, 'data_correction_dispatch_notes');
  assert.equal(result.record.reasonCode, 'CORRECTION_FROZEN_AFTER_DEPARTURE');
  assertSafeOutput(result);
});

test('valid correction application payload maps to safe correction record', () => {
  const result = mapDataCorrectionWriterPayloadToRecord(input('correction_application'));

  assert.equal(result.ok, true);
  assert.equal(result.tableHint, 'data_correction_application_records');
  assert.equal(result.record.safeMetadata.fieldGroup, 'dispatch_operational');
  assertSafeOutput(result);
});

test('valid appointment result payload maps to safe appointment result record', () => {
  const result = mapDataCorrectionWriterPayloadToRecord(input('appointment_result', {
    terminalState: 'unable_to_complete',
  }));

  assert.equal(result.ok, true);
  assert.equal(result.tableHint, 'data_correction_appointment_results');
  assert.equal(result.record.safeMetadata.terminalState, 'unable_to_complete');
  assertSafeOutput(result);
});

test('valid evidence payload maps to safe evidence metadata record', () => {
  const result = mapDataCorrectionWriterPayloadToRecord(input('evidence', {
    evidenceRefs: ['photo_ref_test_001', 'signature_ref_test_002'],
  }));

  assert.equal(result.ok, true);
  assert.equal(result.tableHint, 'data_correction_evidence_refs');
  assert.deepEqual(result.record.safeMetadata.evidenceRefs, [
    'photo_ref_test_001',
    'signature_ref_test_002',
  ]);
  assertSafeOutput(result);
});

test('valid follow-up draft payload maps to safe follow-up draft record', () => {
  const result = mapDataCorrectionWriterPayloadToRecord(input('follow_up_draft', {
    requiredPartsRefs: ['part_ref_test_001'],
  }));

  assert.equal(result.ok, true);
  assert.equal(result.tableHint, 'data_correction_follow_up_drafts');
  assert.deepEqual(result.record.safeMetadata.requiredPartsRefs, ['part_ref_test_001']);
  assertSafeOutput(result);
});

test('valid engineer notification intent payload maps to safe notification intent record', () => {
  const result = mapDataCorrectionWriterPayloadToRecord(input('engineer_notification_intent'));

  assert.equal(result.ok, true);
  assert.equal(result.tableHint, 'data_correction_engineer_notification_intents');
  assert.equal(result.record.actorRole, 'dispatch_assistant');
  assertSafeOutput(result);
});

test('missing organizationId fail-closes', () => {
  const result = mapDataCorrectionWriterPayloadToRecord(input('audit', {
    organizationId: undefined,
  }));

  assert.deepEqual(result, {
    ok: false,
    recordType: 'audit',
    reasonCode: 'MISSING_ORGANIZATION_ID',
  });
});

test('unsupported writerType fail-closes without echoing raw type', () => {
  const result = mapDataCorrectionWriterPayloadToRecord(input('token_should_not_leak', unsafeFields()));

  assert.deepEqual(result, {
    ok: false,
    recordType: 'unknown',
    reasonCode: 'UNSUPPORTED_RECORD_TYPE',
  });
  assertSafeOutput(result);
});

test('unsafe raw phone address LINE id token secret DB URL and finalAppointmentId are stripped', () => {
  const result = mapDataCorrectionWriterPayloadToRecord(input('audit', unsafeFields()));

  assert.equal(result.ok, true);
  assert.equal(result.record.organizationId, 'org_data_correction_record_mapper_001');
  assertSafeOutput(result);
});

test('raw fromValue and toValue are not included in record', () => {
  const result = mapDataCorrectionWriterPayloadToRecord(input('correction_application', unsafeFields()));

  assert.equal(result.ok, true);
  assert.equal(JSON.stringify(result.record).includes('fromValue'), false);
  assert.equal(JSON.stringify(result.record).includes('toValue'), false);
  assertSafeOutput(result);
});

test('unsafe evidence refs are rejected', () => {
  const result = mapDataCorrectionWriterPayloadToRecord(input('evidence', {
    evidenceRefs: ['photo_ref_test_001', 'https://signed.example.invalid/photo?token=secret'],
  }));

  assert.deepEqual(result, {
    ok: false,
    recordType: 'evidence',
    reasonCode: 'UNSAFE_OR_INVALID_PAYLOAD',
  });
  assertSafeOutput(result);
});

test('unsafe required parts refs are rejected', () => {
  const result = mapDataCorrectionWriterPayloadToRecord(input('follow_up_draft', {
    requiredPartsRefs: ['part_ref_test_001', '../raw/part/path'],
  }));

  assert.deepEqual(result, {
    ok: false,
    recordType: 'follow_up_draft',
    reasonCode: 'UNSAFE_OR_INVALID_PAYLOAD',
  });
  assertSafeOutput(result);
});

test('query spec is non-executable and parameterized without raw values in SQL', () => {
  const spec = buildDataCorrectionPersistenceQuerySpec(input('audit', unsafeFields()));

  assert.equal(spec.ok, true);
  assert.equal(spec.executable, false);
  assert.equal(spec.name, DATA_CORRECTION_PERSISTENCE_QUERY_NAME);
  assert.equal(spec.recordType, 'audit');
  assert.equal(spec.fields.length, spec.values.length);
  assert.equal(spec.params.length, spec.values.length);
  assert.match(spec.sql, /^INSERT INTO data_correction_audit_events/);
  assert.equal(spec.sql.includes('org_data_correction_record_mapper_001'), false);
  assert.equal(spec.sql.includes('case_data_correction_record_mapper_001'), false);
  assert.equal(spec.sql.includes('safe updated issue'), false);
  assertSafeOutput(spec);
});

test('query spec fail-closes when mapped record is invalid', () => {
  const spec = buildDataCorrectionPersistenceQuerySpec(input('appointment_result', {
    appointmentId: undefined,
  }));

  assert.deepEqual(spec, {
    ok: false,
    recordType: 'appointment_result',
    reasonCode: 'MISSING_APPOINTMENT_ID',
    executable: false,
  });
});

test('input object is not mutated', () => {
  const payload = input('audit', unsafeFields());
  const before = clone(payload);

  mapDataCorrectionWriterPayloadToRecord(payload);
  buildDataCorrectionPersistenceQuerySpec(payload);

  assert.deepEqual(payload, before);
});

test('module import boundary avoids DB repository provider AI route controller app server imports', () => {
  const source = fs.readFileSync(mapperFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, ['./dataCorrectionSafeWriters']);
  assert.doesNotMatch(source, /require\(['"][^'"]*(db|pool|repositories?|services?|providers?|ai|rag|vector|openai|routes?|controllers?|app|server)[^'"]*['"]\)/i);
  assert.doesNotMatch(source, /process\.env|console\.(log|info|warn|error|debug)/);
});
