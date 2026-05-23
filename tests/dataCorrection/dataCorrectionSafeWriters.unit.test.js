'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  DATA_CORRECTION_WRITER_TYPES,
  createDataCorrectionSafeWriterSet,
  createInMemoryDataCorrectionWriterStore,
  sanitizeDataCorrectionWriterPayload,
} = require('../../src/dataCorrection/dataCorrectionSafeWriters');

const repoRoot = path.resolve(__dirname, '../..');
const safeWritersFile = path.join(repoRoot, 'src/dataCorrection/dataCorrectionSafeWriters.js');

function safePayload(overrides = {}) {
  return {
    organizationId: 'org_data_correction_safe_writer_001',
    caseId: 'case_data_correction_safe_writer_001',
    appointmentId: 'apt_data_correction_safe_writer_001',
    actorUserId: 'user_data_correction_safe_writer_001',
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

function lastWrite(store) {
  const writes = store.list();

  return writes[writes.length - 1];
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

test('exports writer factory functions and constants', () => {
  assert.equal(typeof createDataCorrectionSafeWriterSet, 'function');
  assert.equal(typeof createInMemoryDataCorrectionWriterStore, 'function');
  assert.equal(typeof sanitizeDataCorrectionWriterPayload, 'function');
  assert.equal(DATA_CORRECTION_WRITER_TYPES.AUDIT, 'audit');
  assert.equal(DATA_CORRECTION_WRITER_TYPES.CORRECTION_APPLICATION, 'correction_application');
});

test('create writer set returns all expected writers', () => {
  const writerSet = createDataCorrectionSafeWriterSet();

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

  assert.equal(typeof writerSet.store.add, 'function');
  assert.equal(typeof writerSet.store.list, 'function');
});

test('auditWriter stores sanitized payload', () => {
  const writerSet = createDataCorrectionSafeWriterSet();
  const result = writerSet.auditWriter(safePayload(unsafeFields()));

  assert.deepEqual(result, {
    ok: true,
    writerType: DATA_CORRECTION_WRITER_TYPES.AUDIT,
    id: 'data_correction_write_000001',
  });
  assert.equal(lastWrite(writerSet.store).writerType, DATA_CORRECTION_WRITER_TYPES.AUDIT);
  assertSafeOutput(writerSet.store.list());
});

test('contactLogWriter stores sanitized payload', () => {
  const writerSet = createDataCorrectionSafeWriterSet();
  const result = writerSet.contactLogWriter(safePayload(unsafeFields()));

  assert.equal(result.ok, true);
  assert.equal(lastWrite(writerSet.store).writerType, DATA_CORRECTION_WRITER_TYPES.CONTACT_LOG);
  assertSafeOutput(writerSet.store.list());
});

test('dispatchNoteWriter stores sanitized payload', () => {
  const writerSet = createDataCorrectionSafeWriterSet();
  const result = writerSet.dispatchNoteWriter(safePayload(unsafeFields()));

  assert.equal(result.ok, true);
  assert.equal(lastWrite(writerSet.store).writerType, DATA_CORRECTION_WRITER_TYPES.DISPATCH_NOTE);
  assertSafeOutput(writerSet.store.list());
});

test('correctionWriter stores sanitized payload', () => {
  const writerSet = createDataCorrectionSafeWriterSet();
  const result = writerSet.correctionWriter(safePayload(unsafeFields()));

  assert.equal(result.ok, true);
  assert.equal(lastWrite(writerSet.store).writerType, DATA_CORRECTION_WRITER_TYPES.CORRECTION_APPLICATION);
  assertSafeOutput(writerSet.store.list());
});

test('appointmentResultWriter stores sanitized payload', () => {
  const writerSet = createDataCorrectionSafeWriterSet();
  const result = writerSet.appointmentResultWriter(safePayload(unsafeFields()));

  assert.equal(result.ok, true);
  assert.equal(lastWrite(writerSet.store).writerType, DATA_CORRECTION_WRITER_TYPES.APPOINTMENT_RESULT);
  assertSafeOutput(writerSet.store.list());
});

test('evidenceWriter stores only safe evidence refs', () => {
  const writerSet = createDataCorrectionSafeWriterSet();
  const result = writerSet.evidenceWriter(safePayload({
    evidenceRefs: ['photo_ref_test_001', 'signature_ref_test_002'],
  }));

  assert.equal(result.ok, true);
  assert.deepEqual(lastWrite(writerSet.store).payload.evidenceRefs, [
    'photo_ref_test_001',
    'signature_ref_test_002',
  ]);
  assertSafeOutput(writerSet.store.list());
});

test('followUpDraftWriter stores only safe requiredPartsRefs', () => {
  const writerSet = createDataCorrectionSafeWriterSet();
  const result = writerSet.followUpDraftWriter(safePayload({
    requiredPartsRefs: ['part_ref_test_001', 'part_ref_test_002'],
  }));

  assert.equal(result.ok, true);
  assert.deepEqual(lastWrite(writerSet.store).payload.requiredPartsRefs, [
    'part_ref_test_001',
    'part_ref_test_002',
  ]);
  assertSafeOutput(writerSet.store.list());
});

test('unsafe payload with raw phone, address, LINE id, token, secret, DB URL, and finalAppointmentId is stripped', () => {
  const sanitized = sanitizeDataCorrectionWriterPayload(safePayload(unsafeFields()));

  assert.equal(sanitized.ok, true);
  assert.equal(sanitized.payload.organizationId, 'org_data_correction_safe_writer_001');
  assertSafeOutput(sanitized);
});

test('unsafe payload with full req, body, headers, and cookies dump is stripped', () => {
  const writerSet = createDataCorrectionSafeWriterSet();
  const result = writerSet.correctionWriter(safePayload(unsafeFields()));

  assert.equal(result.ok, true);
  assertSafeOutput([result, writerSet.store.list()]);
});

test('raw storage path evidence ref is rejected', () => {
  const writerSet = createDataCorrectionSafeWriterSet();
  const result = writerSet.evidenceWriter(safePayload({
    evidenceRefs: ['photo_ref_test_001', '/private/tmp/raw-photo.jpg'],
  }));

  assert.deepEqual(result, {
    ok: false,
    writerType: DATA_CORRECTION_WRITER_TYPES.EVIDENCE,
    reasonCode: 'UNSAFE_PAYLOAD',
  });
  assert.deepEqual(writerSet.store.list(), []);
  assertSafeOutput(result);
});

test('signed URL evidence ref is rejected', () => {
  const writerSet = createDataCorrectionSafeWriterSet();
  const result = writerSet.evidenceWriter(safePayload({
    evidenceRefs: ['https://storage.example.test/file?token=token_should_not_leak'],
  }));

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'UNSAFE_PAYLOAD');
  assert.deepEqual(writerSet.store.list(), []);
  assertSafeOutput(result);
});

test('unsafe requiredPartsRefs are rejected', () => {
  const writerSet = createDataCorrectionSafeWriterSet();
  const result = writerSet.followUpDraftWriter(safePayload({
    requiredPartsRefs: ['part_ref_test_001', '../raw/part.csv'],
  }));

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'UNSAFE_PAYLOAD');
  assert.deepEqual(writerSet.store.list(), []);
});

test('malformed payload fails closed', () => {
  const writerSet = createDataCorrectionSafeWriterSet();
  const result = writerSet.auditWriter(null);

  assert.deepEqual(result, {
    ok: false,
    writerType: DATA_CORRECTION_WRITER_TYPES.AUDIT,
    reasonCode: 'UNSAFE_PAYLOAD',
  });
  assert.deepEqual(writerSet.store.list(), []);
});

test('writer result does not expose unsafe input', () => {
  const writerSet = createDataCorrectionSafeWriterSet();
  const result = writerSet.correctionWriter(safePayload(unsafeFields()));

  assert.equal(result.ok, true);
  assertSafeOutput(result);
});

test('store list returns copy and cannot mutate internal writes', () => {
  const writerSet = createDataCorrectionSafeWriterSet();

  writerSet.auditWriter(safePayload());

  const writes = writerSet.store.list();
  writes[0].payload.organizationId = 'mutated';
  writes.push({ id: 'external_mutation' });

  assert.equal(writerSet.store.list().length, 1);
  assert.equal(writerSet.store.list()[0].payload.organizationId, 'org_data_correction_safe_writer_001');

  const getterWrites = writerSet.store.writes;
  getterWrites[0].payload.caseId = 'mutated_case';

  assert.equal(writerSet.store.list()[0].payload.caseId, 'case_data_correction_safe_writer_001');
});

test('writer store is not global singleton', () => {
  const first = createDataCorrectionSafeWriterSet();
  const second = createDataCorrectionSafeWriterSet();

  first.auditWriter(safePayload());

  assert.equal(first.store.list().length, 1);
  assert.equal(second.store.list().length, 0);
});

test('no logging side effects', () => {
  const calls = [];
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  console.log = (...args) => calls.push(['log', ...args]);
  console.warn = (...args) => calls.push(['warn', ...args]);
  console.error = (...args) => calls.push(['error', ...args]);

  try {
    const writerSet = createDataCorrectionSafeWriterSet();
    writerSet.auditWriter(safePayload(unsafeFields()));
    writerSet.evidenceWriter(safePayload({
      evidenceRefs: ['https://storage.example.test/file?token=token_should_not_leak'],
    }));
  } finally {
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
  }

  assert.deepEqual(calls, []);
});

test('module import boundary has no DB, repository, provider, AI, route, or controller imports', () => {
  const source = fs.readFileSync(safeWritersFile, 'utf8');
  const specifiers = requireSpecifiers(source);
  const importedSpecifiers = specifiers.join('\n');

  assert.deepEqual(specifiers, []);
  assert.doesNotMatch(source, /require\(/);
  assert.doesNotMatch(source, /console\./);
  assert.doesNotMatch(importedSpecifiers, /db|pool|repositories?|transaction|provider|lineProvider|sms|email|push|rag|vector|openai|aiProvider|routes?|controllers?/i);
});
