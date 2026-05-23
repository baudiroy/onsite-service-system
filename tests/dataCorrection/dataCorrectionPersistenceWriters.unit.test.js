'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  DATA_CORRECTION_PERSISTENCE_LOW_LEVEL_WRITER_KEYS,
  DATA_CORRECTION_PERSISTENCE_WRITER_TYPES,
  createDataCorrectionPersistenceWriterContract,
  createDataCorrectionPersistenceWriterSet,
} = require('../../src/dataCorrection/dataCorrectionPersistenceWriters');

const repoRoot = path.resolve(__dirname, '../..');
const writerFile = path.join(repoRoot, 'src/dataCorrection/dataCorrectionPersistenceWriters.js');

function safePayload(overrides = {}) {
  return {
    organizationId: 'org_data_correction_persistence_001',
    caseId: 'case_data_correction_persistence_001',
    appointmentId: 'apt_data_correction_persistence_001',
    actorUserId: 'user_data_correction_persistence_001',
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
    req: {
      secret: 'secret_should_not_leak',
    },
    body: {
      rawPhone: 'raw_phone_should_not_leak',
    },
    headers: {
      cookie: 'token_should_not_leak',
    },
    cookies: {
      session: 'secret_should_not_leak',
    },
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
    'req',
    'body',
    'headers',
    'cookies',
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

function assertCallsSanitized(calls) {
  assert.equal(calls.length, 1);
  assert.equal(calls[0].organizationId, 'org_data_correction_persistence_001');
  assert.equal(calls[0].caseId, 'case_data_correction_persistence_001');
  assertSafeOutput(calls);
}

test('exports persistence writer factory functions and constants', () => {
  assert.equal(typeof createDataCorrectionPersistenceWriterSet, 'function');
  assert.equal(typeof createDataCorrectionPersistenceWriterContract, 'function');
  assert.equal(DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.AUDIT, 'audit');
  assert.equal(
    DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.CORRECTION_APPLICATION,
    'correction_application',
  );
  assert.equal(
    DATA_CORRECTION_PERSISTENCE_LOW_LEVEL_WRITER_KEYS.audit,
    'auditPersistenceWriter',
  );
});

test('exported low-level writer keys cover every persistence writer type and are immutable', () => {
  assert.equal(Object.isFrozen(DATA_CORRECTION_PERSISTENCE_LOW_LEVEL_WRITER_KEYS), true);
  assert.deepEqual(
    Object.keys(DATA_CORRECTION_PERSISTENCE_LOW_LEVEL_WRITER_KEYS).sort(),
    Object.values(DATA_CORRECTION_PERSISTENCE_WRITER_TYPES).sort(),
  );
  assert.deepEqual(DATA_CORRECTION_PERSISTENCE_LOW_LEVEL_WRITER_KEYS, {
    appointment_result: 'appointmentResultPersistenceWriter',
    audit: 'auditPersistenceWriter',
    contact_log: 'contactLogPersistenceWriter',
    correction_application: 'correctionApplicationPersistenceWriter',
    dispatch_note: 'dispatchNotePersistenceWriter',
    engineer_notification_intent: 'engineerNotificationIntentPersistenceWriter',
    evidence: 'evidencePersistenceWriter',
    follow_up_draft: 'followUpDraftPersistenceWriter',
  });
  assert.throws(() => {
    DATA_CORRECTION_PERSISTENCE_LOW_LEVEL_WRITER_KEYS.audit = 'unsafeMutation';
  }, TypeError);
  assert.equal(
    DATA_CORRECTION_PERSISTENCE_LOW_LEVEL_WRITER_KEYS.audit,
    'auditPersistenceWriter',
  );
});

test('create writer set returns all high-level writer functions', () => {
  const writerSet = createDataCorrectionPersistenceWriterSet();

  for (const writerName of [
    'auditWriter',
    'contactLogWriter',
    'dispatchNoteWriter',
    'engineerNotificationWriter',
    'appointmentResultWriter',
    'evidenceWriter',
    'followUpDraftWriter',
    'correctionWriter',
  ]) {
    assert.equal(typeof writerSet[writerName], 'function');
  }
});

test('missing low-level writer fail-closes without persistence', () => {
  const writerSet = createDataCorrectionPersistenceWriterSet();
  const result = writerSet.auditWriter(safePayload());

  assert.deepEqual(result, {
    ok: false,
    writerType: DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.AUDIT,
    persisted: false,
    reasonCode: 'WRITER_NOT_CONFIGURED',
  });
  assertSafeOutput(result);
});

test('auditWriter calls injected low-level writer with sanitized payload', () => {
  const calls = [];
  const writerSet = createDataCorrectionPersistenceWriterSet({
    auditPersistenceWriter(payload) {
      calls.push(payload);
    },
  });
  const result = writerSet.auditWriter(safePayload(unsafeFields()));

  assert.deepEqual(result, {
    ok: true,
    writerType: DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.AUDIT,
    persisted: true,
  });
  assertCallsSanitized(calls);
});

test('contactLogWriter calls injected low-level writer with sanitized payload', () => {
  const calls = [];
  const writerSet = createDataCorrectionPersistenceWriterSet({
    contactLogPersistenceWriter(payload) {
      calls.push(payload);
    },
  });
  const result = writerSet.contactLogWriter(safePayload(unsafeFields()));

  assert.equal(result.ok, true);
  assert.equal(result.writerType, DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.CONTACT_LOG);
  assertCallsSanitized(calls);
});

test('dispatchNoteWriter calls injected low-level writer with sanitized payload', () => {
  const calls = [];
  const writerSet = createDataCorrectionPersistenceWriterSet({
    dispatchNotePersistenceWriter(payload) {
      calls.push(payload);
    },
  });
  const result = writerSet.dispatchNoteWriter(safePayload(unsafeFields()));

  assert.equal(result.ok, true);
  assert.equal(result.writerType, DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.DISPATCH_NOTE);
  assertCallsSanitized(calls);
});

test('correctionWriter calls injected low-level writer with sanitized payload', () => {
  const calls = [];
  const writerSet = createDataCorrectionPersistenceWriterSet({
    correctionApplicationPersistenceWriter(payload) {
      calls.push(payload);
    },
  });
  const result = writerSet.correctionWriter(safePayload(unsafeFields()));

  assert.equal(result.ok, true);
  assert.equal(result.writerType, DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.CORRECTION_APPLICATION);
  assertCallsSanitized(calls);
});

test('appointmentResultWriter calls injected low-level writer with sanitized payload', () => {
  const calls = [];
  const writerSet = createDataCorrectionPersistenceWriterSet({
    appointmentResultPersistenceWriter(payload) {
      calls.push(payload);
    },
  });
  const result = writerSet.appointmentResultWriter(safePayload(unsafeFields()));

  assert.equal(result.ok, true);
  assert.equal(result.writerType, DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.APPOINTMENT_RESULT);
  assertCallsSanitized(calls);
});

test('evidenceWriter allows only safe evidence refs into low-level writer', () => {
  const calls = [];
  const writerSet = createDataCorrectionPersistenceWriterSet({
    evidencePersistenceWriter(payload) {
      calls.push(payload);
    },
  });
  const result = writerSet.evidenceWriter(safePayload({
    evidenceRefs: ['photo_ref_test_001', 'signature_ref_test_002'],
  }));

  assert.equal(result.ok, true);
  assert.deepEqual(calls[0].evidenceRefs, ['photo_ref_test_001', 'signature_ref_test_002']);
  assertSafeOutput(calls);
});

test('followUpDraftWriter allows only safe required parts refs into low-level writer', () => {
  const calls = [];
  const writerSet = createDataCorrectionPersistenceWriterSet({
    followUpDraftPersistenceWriter(payload) {
      calls.push(payload);
    },
  });
  const result = writerSet.followUpDraftWriter(safePayload({
    requiredPartsRefs: ['part_ref_test_001', 'part_ref_test_002'],
  }));

  assert.equal(result.ok, true);
  assert.deepEqual(calls[0].requiredPartsRefs, ['part_ref_test_001', 'part_ref_test_002']);
  assertSafeOutput(calls);
});

test('engineerNotificationWriter calls injected low-level writer with sanitized payload', () => {
  const calls = [];
  const writerSet = createDataCorrectionPersistenceWriterSet({
    engineerNotificationIntentPersistenceWriter(payload) {
      calls.push(payload);
    },
  });
  const result = writerSet.engineerNotificationWriter(safePayload(unsafeFields()));

  assert.equal(result.ok, true);
  assert.equal(
    result.writerType,
    DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.ENGINEER_NOTIFICATION_INTENT,
  );
  assertCallsSanitized(calls);
});

test('object writer with write method is supported without mutation', () => {
  const calls = [];
  const lowLevelWriter = {
    marker: 'object_writer_marker',
    write(payload) {
      calls.push({
        marker: this.marker,
        payload,
      });
    },
  };
  const originalKeys = Object.keys(lowLevelWriter);
  const writer = createDataCorrectionPersistenceWriterContract({
    writerType: DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.AUDIT,
    writer: lowLevelWriter,
  });
  const result = writer(safePayload(unsafeFields()));

  assert.equal(result.ok, true);
  assert.deepEqual(Object.keys(lowLevelWriter), originalKeys);
  assert.equal(calls[0].marker, 'object_writer_marker');
  assertSafeOutput(calls);
});

test('low-level writer throw fail-closes without leaking raw error details', () => {
  const writer = createDataCorrectionPersistenceWriterContract({
    writerType: DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.AUDIT,
    writer() {
      throw new Error('raw_phone_should_not_leak token_should_not_leak');
    },
  });
  const result = writer(safePayload());

  assert.deepEqual(result, {
    ok: false,
    writerType: DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.AUDIT,
    persisted: false,
    reasonCode: 'WRITER_FAILED',
  });
  assertSafeOutput(result);
});

test('unsafe scalar fields are stripped before low-level writer is called', () => {
  const calls = [];
  const writer = createDataCorrectionPersistenceWriterContract({
    writerType: DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.AUDIT,
    writer(payload) {
      calls.push(payload);
    },
  });
  const result = writer(safePayload(unsafeFields()));

  assert.equal(result.ok, true);
  assertCallsSanitized(calls);
});

test('unsafe request-like containers are stripped before low-level writer is called', () => {
  const calls = [];
  const writerSet = createDataCorrectionPersistenceWriterSet({
    correctionApplicationPersistenceWriter(payload) {
      calls.push(payload);
    },
  });
  const result = writerSet.correctionWriter(safePayload(unsafeFields()));

  assert.equal(result.ok, true);
  assertCallsSanitized(calls);
});

test('unsafe evidence refs are rejected and low-level writer is not called', () => {
  const calls = [];
  const writerSet = createDataCorrectionPersistenceWriterSet({
    evidencePersistenceWriter(payload) {
      calls.push(payload);
    },
  });
  const result = writerSet.evidenceWriter(safePayload({
    evidenceRefs: ['photo_ref_test_001', 'https://signed.example.invalid/photo?token=secret'],
  }));

  assert.deepEqual(result, {
    ok: false,
    writerType: DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.EVIDENCE,
    persisted: false,
    reasonCode: 'UNSAFE_PAYLOAD',
  });
  assert.deepEqual(calls, []);
  assertSafeOutput(result);
});

test('unsafe required parts refs are rejected and low-level writer is not called', () => {
  const calls = [];
  const writerSet = createDataCorrectionPersistenceWriterSet({
    followUpDraftPersistenceWriter(payload) {
      calls.push(payload);
    },
  });
  const result = writerSet.followUpDraftWriter(safePayload({
    requiredPartsRefs: ['part_ref_test_001', '../raw/part/path'],
  }));

  assert.deepEqual(result, {
    ok: false,
    writerType: DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.FOLLOW_UP_DRAFT,
    persisted: false,
    reasonCode: 'UNSAFE_PAYLOAD',
  });
  assert.deepEqual(calls, []);
  assertSafeOutput(result);
});

test('input payload is not mutated', () => {
  const calls = [];
  const payload = safePayload(unsafeFields());
  const before = JSON.parse(JSON.stringify(payload));
  const writerSet = createDataCorrectionPersistenceWriterSet({
    auditPersistenceWriter(persistedPayload) {
      calls.push(persistedPayload);
    },
  });
  const result = writerSet.auditWriter(payload);

  assert.equal(result.ok, true);
  assert.deepEqual(payload, before);
  assertCallsSanitized(calls);
});

test('unsupported writer type fail-closes before low-level writer is called', () => {
  const calls = [];
  const writer = createDataCorrectionPersistenceWriterContract({
    writerType: 'unknown_writer_type',
    writer(payload) {
      calls.push(payload);
    },
  });
  const result = writer(safePayload());

  assert.deepEqual(result, {
    ok: false,
    writerType: 'unknown_writer_type',
    persisted: false,
    reasonCode: 'WRITER_TYPE_NOT_SUPPORTED',
  });
  assert.deepEqual(calls, []);
  assertSafeOutput(result);
});

test('writer failures do not log sensitive payload or error details', () => {
  const calls = [];
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  console.error = (...args) => calls.push(args);
  console.warn = (...args) => calls.push(args);

  try {
    const writer = createDataCorrectionPersistenceWriterContract({
      writerType: DATA_CORRECTION_PERSISTENCE_WRITER_TYPES.AUDIT,
      writer() {
        throw new Error('secret_should_not_leak');
      },
    });

    const result = writer(safePayload(unsafeFields()));

    assert.equal(result.ok, false);
    assert.deepEqual(calls, []);
    assertSafeOutput(result);
  } finally {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  }
});

test('source boundary imports only sanitizer/constants and no DB SQL provider AI route layers', () => {
  const source = fs.readFileSync(writerFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, ['./dataCorrectionSafeWriters']);
  assert.doesNotMatch(source, /createInMemoryDataCorrectionWriterStore/);
  assert.doesNotMatch(source, /createDataCorrectionSafeWriterSet/);
  assert.doesNotMatch(source, /require\(['"][^'"]*(db|pool|repositories?|services?|providers?|ai|rag|vector|openai|routes?|controllers?|app|server)[^'"]*['"]\)/i);
  assert.doesNotMatch(source, /\b(SELECT|INSERT|UPDATE|DELETE|CREATE TABLE|ALTER TABLE)\b/i);
  assert.doesNotMatch(source, /process\.env|console\.(log|info|warn|error|debug)/);
});
