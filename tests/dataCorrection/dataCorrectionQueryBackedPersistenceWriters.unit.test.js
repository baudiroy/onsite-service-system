'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  DATA_CORRECTION_QUERY_BACKED_HIGH_LEVEL_WRITER_KEYS,
  DATA_CORRECTION_QUERY_BACKED_LOW_LEVEL_WRITER_KEYS,
  DATA_CORRECTION_QUERY_BACKED_WRITER_TYPES,
  DATA_CORRECTION_QUERY_BACKED_WRITER_REASON_CODES,
  QUERY_BACKED_WRITER_BINDINGS,
  createDataCorrectionAsyncQueryBackedLowLevelWriters,
  createDataCorrectionAsyncQueryBackedPersistenceWriters,
  createDataCorrectionQueryBackedLowLevelWriters,
  createDataCorrectionQueryBackedPersistenceWriters,
} = require('../../src/dataCorrection/dataCorrectionQueryBackedPersistenceWriters');
const {
  DATA_CORRECTION_PERSISTENCE_WRITER_TYPES,
} = require('../../src/dataCorrection/dataCorrectionPersistenceWriters');

const repoRoot = path.resolve(__dirname, '../..');
const adapterFile = path.join(
  repoRoot,
  'src/dataCorrection/dataCorrectionQueryBackedPersistenceWriters.js',
);

const EXPECTED_LOW_LEVEL_WRITERS = Object.freeze([
  'appointmentResultPersistenceWriter',
  'auditPersistenceWriter',
  'contactLogPersistenceWriter',
  'correctionApplicationPersistenceWriter',
  'dispatchNotePersistenceWriter',
  'engineerNotificationIntentPersistenceWriter',
  'evidencePersistenceWriter',
  'followUpDraftPersistenceWriter',
]);

const EXPECTED_HIGH_LEVEL_WRITERS = Object.freeze([
  'appointmentResultWriter',
  'auditWriter',
  'contactLogWriter',
  'correctionWriter',
  'dispatchNoteWriter',
  'engineerNotificationWriter',
  'evidenceWriter',
  'followUpDraftWriter',
]);

function safePayload(overrides = {}) {
  return {
    organizationId: 'org_data_correction_query_backed_001',
    caseId: 'case_data_correction_query_backed_001',
    appointmentId: 'apt_data_correction_query_backed_001',
    actorUserId: 'user_data_correction_query_backed_001',
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
    body: {
      rawPhone: 'raw_phone_should_not_leak',
    },
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
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

function requireSpecifiers(source) {
  const specifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers;
}

function captureConsoleCalls() {
  const original = {
    debug: console.debug,
    error: console.error,
    info: console.info,
    log: console.log,
    warn: console.warn,
  };
  const calls = [];

  for (const method of Object.keys(original)) {
    console[method] = (...args) => {
      calls.push({ method, args });
    };
  }

  return {
    calls,
    restore() {
      for (const [method, fn] of Object.entries(original)) {
        console[method] = fn;
      }
    },
  };
}

test('exports query-backed persistence writer factory functions', () => {
  assert.equal(typeof createDataCorrectionQueryBackedLowLevelWriters, 'function');
  assert.equal(typeof createDataCorrectionQueryBackedPersistenceWriters, 'function');
  assert.equal(typeof createDataCorrectionAsyncQueryBackedLowLevelWriters, 'function');
  assert.equal(typeof createDataCorrectionAsyncQueryBackedPersistenceWriters, 'function');
  assert.equal(Array.isArray(QUERY_BACKED_WRITER_BINDINGS), true);
});

test('exports immutable query-backed writer reason code contract', () => {
  assert.equal(Object.isFrozen(DATA_CORRECTION_QUERY_BACKED_WRITER_REASON_CODES), true);
  assert.deepEqual(DATA_CORRECTION_QUERY_BACKED_WRITER_REASON_CODES, {
    ASYNC_EXECUTOR_NOT_SUPPORTED: 'ASYNC_EXECUTOR_NOT_SUPPORTED',
    EXECUTOR_FAILED: 'EXECUTOR_FAILED',
    EXECUTOR_RESULT_MALFORMED: 'EXECUTOR_RESULT_MALFORMED',
    INVALID_QUERY_SPEC: 'INVALID_QUERY_SPEC',
    MISSING_EXECUTOR: 'MISSING_EXECUTOR',
    QUERY_SPEC_NOT_EXECUTABLE: 'QUERY_SPEC_NOT_EXECUTABLE',
  });

  assert.throws(() => {
    DATA_CORRECTION_QUERY_BACKED_WRITER_REASON_CODES.MISSING_EXECUTOR = 'changed';
  }, TypeError);
  assert.equal(DATA_CORRECTION_QUERY_BACKED_WRITER_REASON_CODES.MISSING_EXECUTOR, 'MISSING_EXECUTOR');
});

test('exports immutable query-backed writer key contracts derived from bindings', () => {
  assert.equal(Object.isFrozen(DATA_CORRECTION_QUERY_BACKED_HIGH_LEVEL_WRITER_KEYS), true);
  assert.equal(Object.isFrozen(DATA_CORRECTION_QUERY_BACKED_LOW_LEVEL_WRITER_KEYS), true);

  assert.deepEqual(
    [...DATA_CORRECTION_QUERY_BACKED_HIGH_LEVEL_WRITER_KEYS].sort(),
    [...EXPECTED_HIGH_LEVEL_WRITERS].sort(),
  );
  assert.deepEqual(
    [...DATA_CORRECTION_QUERY_BACKED_LOW_LEVEL_WRITER_KEYS].sort(),
    [...EXPECTED_LOW_LEVEL_WRITERS].sort(),
  );
  assert.deepEqual(
    DATA_CORRECTION_QUERY_BACKED_HIGH_LEVEL_WRITER_KEYS,
    QUERY_BACKED_WRITER_BINDINGS.map((binding) => binding.highLevelKey),
  );
  assert.deepEqual(
    DATA_CORRECTION_QUERY_BACKED_LOW_LEVEL_WRITER_KEYS,
    QUERY_BACKED_WRITER_BINDINGS.map((binding) => binding.lowLevelKey),
  );

  assert.throws(() => {
    DATA_CORRECTION_QUERY_BACKED_HIGH_LEVEL_WRITER_KEYS.push('unexpectedWriter');
  }, TypeError);
  assert.throws(() => {
    DATA_CORRECTION_QUERY_BACKED_LOW_LEVEL_WRITER_KEYS[0] = 'unexpectedPersistenceWriter';
  }, TypeError);
});

test('exports immutable query-backed writer type contract derived from bindings', () => {
  assert.equal(Object.isFrozen(DATA_CORRECTION_QUERY_BACKED_WRITER_TYPES), true);
  assert.deepEqual(
    [...DATA_CORRECTION_QUERY_BACKED_WRITER_TYPES].sort(),
    Object.values(DATA_CORRECTION_PERSISTENCE_WRITER_TYPES).sort(),
  );
  assert.deepEqual(
    DATA_CORRECTION_QUERY_BACKED_WRITER_TYPES,
    QUERY_BACKED_WRITER_BINDINGS.map((binding) => binding.writerType),
  );
  assert.equal(
    new Set(DATA_CORRECTION_QUERY_BACKED_WRITER_TYPES).size,
    DATA_CORRECTION_QUERY_BACKED_WRITER_TYPES.length,
  );

  assert.throws(() => {
    DATA_CORRECTION_QUERY_BACKED_WRITER_TYPES.push('unexpected_writer_type');
  }, TypeError);
});

test('exported query-backed writer bindings are immutable and cover expected writer keys', () => {
  assert.equal(Object.isFrozen(QUERY_BACKED_WRITER_BINDINGS), true);
  assert.equal(QUERY_BACKED_WRITER_BINDINGS.every((binding) => Object.isFrozen(binding)), true);

  assert.deepEqual(
    QUERY_BACKED_WRITER_BINDINGS.map((binding) => binding.highLevelKey).sort(),
    [...EXPECTED_HIGH_LEVEL_WRITERS].sort(),
  );
  assert.deepEqual(
    QUERY_BACKED_WRITER_BINDINGS.map((binding) => binding.lowLevelKey).sort(),
    [...EXPECTED_LOW_LEVEL_WRITERS].sort(),
  );
  assert.equal(
    new Set(QUERY_BACKED_WRITER_BINDINGS.map((binding) => binding.writerType)).size,
    QUERY_BACKED_WRITER_BINDINGS.length,
  );

  assert.throws(() => {
    QUERY_BACKED_WRITER_BINDINGS[0].highLevelKey = 'auditWriter';
  }, TypeError);
  assert.equal(QUERY_BACKED_WRITER_BINDINGS[0].highLevelKey, 'appointmentResultWriter');
});

test('creates low-level writer set with all expected low-level writers', () => {
  const lowLevelWriters = createDataCorrectionQueryBackedLowLevelWriters();

  assert.deepEqual(Object.keys(lowLevelWriters).sort(), [...EXPECTED_LOW_LEVEL_WRITERS].sort());

  for (const writerName of EXPECTED_LOW_LEVEL_WRITERS) {
    assert.equal(typeof lowLevelWriters[writerName], 'function');
  }
});

test('creates high-level writer set with all expected writers', () => {
  const writerSet = createDataCorrectionQueryBackedPersistenceWriters();

  assert.deepEqual(Object.keys(writerSet).sort(), [...EXPECTED_HIGH_LEVEL_WRITERS].sort());

  for (const writerName of EXPECTED_HIGH_LEVEL_WRITERS) {
    assert.equal(typeof writerSet[writerName], 'function');
  }
});

test('creates async low-level and high-level writer sets with all expected writers', () => {
  const lowLevelWriters = createDataCorrectionAsyncQueryBackedLowLevelWriters();
  const writerSet = createDataCorrectionAsyncQueryBackedPersistenceWriters();

  assert.deepEqual(Object.keys(lowLevelWriters).sort(), [...EXPECTED_LOW_LEVEL_WRITERS].sort());
  assert.deepEqual(Object.keys(writerSet).sort(), [...EXPECTED_HIGH_LEVEL_WRITERS].sort());

  for (const writerName of EXPECTED_HIGH_LEVEL_WRITERS) {
    assert.equal(typeof writerSet[writerName], 'function');
  }
});

test('default non-executable specs do not call executor and return safe failure', async () => {
  let called = false;
  const writerSet = createDataCorrectionQueryBackedPersistenceWriters({
    executor() {
      called = true;
      return { ok: true };
    },
  });
  const result = await writerSet.auditWriter(safePayload());

  assert.deepEqual(result, {
    ok: false,
    persisted: false,
    writerType: 'audit',
    recordType: 'audit',
    reasonCode: 'QUERY_SPEC_NOT_EXECUTABLE',
  });
  assert.equal(called, false);
});

test('allowNonExecutableForTest=true allows synthetic executor call', async () => {
  let called = false;
  const writerSet = createDataCorrectionQueryBackedPersistenceWriters({
    allowNonExecutableForTest: true,
    executor() {
      called = true;
      return { ok: true };
    },
  });
  const result = await writerSet.auditWriter(safePayload());

  assert.deepEqual(result, {
    ok: true,
    persisted: true,
    writerType: 'audit',
    recordType: 'audit',
  });
  assert.equal(called, true);
});

test('queryExecutor option aliases executor for sync query-backed writer set', async () => {
  const seen = [];
  const writerSet = createDataCorrectionQueryBackedPersistenceWriters({
    allowNonExecutableForTest: true,
    queryExecutor(querySpec) {
      seen.push(querySpec.recordType);
      return { ok: true };
    },
  });
  const result = await writerSet.auditWriter(safePayload());

  assert.deepEqual(result, {
    ok: true,
    persisted: true,
    writerType: 'audit',
    recordType: 'audit',
  });
  assert.deepEqual(seen, ['audit']);
});

test('queryExecutor option has priority over executor for sync query-backed writer set', async () => {
  const seen = [];
  const writerSet = createDataCorrectionQueryBackedPersistenceWriters({
    allowNonExecutableForTest: true,
    executor(querySpec) {
      seen.push(`executor:${querySpec.recordType}`);
      return { ok: false };
    },
    queryExecutor(querySpec) {
      seen.push(`queryExecutor:${querySpec.recordType}`);
      return { ok: true };
    },
  });
  const result = await writerSet.auditWriter(safePayload());

  assert.deepEqual(result, {
    ok: true,
    persisted: true,
    writerType: 'audit',
    recordType: 'audit',
  });
  assert.deepEqual(seen, ['queryExecutor:audit']);
});

test('async query-backed writer set awaits async synthetic executor', async () => {
  let capturedSpec;
  const writerSet = createDataCorrectionAsyncQueryBackedPersistenceWriters({
    allowNonExecutableForTest: true,
    async executor(querySpec) {
      capturedSpec = querySpec;
      return { ok: true };
    },
  });
  const result = await writerSet.auditWriter(safePayload());

  assert.deepEqual(result, {
    ok: true,
    persisted: true,
    writerType: 'audit',
    recordType: 'audit',
  });
  assert.equal(capturedSpec.recordType, 'audit');
  assertSafeOutput(capturedSpec);
});

test('queryExecutor option aliases executor for async query-backed writer set', async () => {
  const seen = [];
  const writerSet = createDataCorrectionAsyncQueryBackedPersistenceWriters({
    allowNonExecutableForTest: true,
    async queryExecutor(querySpec) {
      seen.push(querySpec.recordType);
      return { ok: true };
    },
  });
  const result = await writerSet.followUpDraftWriter(safePayload());

  assert.deepEqual(result, {
    ok: true,
    persisted: true,
    writerType: 'follow_up_draft',
    recordType: 'follow_up_draft',
  });
  assert.deepEqual(seen, ['follow_up_draft']);
});

test('queryExecutor option has priority over executor for async query-backed writer set', async () => {
  const seen = [];
  const writerSet = createDataCorrectionAsyncQueryBackedPersistenceWriters({
    allowNonExecutableForTest: true,
    async executor(querySpec) {
      seen.push(`executor:${querySpec.recordType}`);
      return { ok: false };
    },
    async queryExecutor(querySpec) {
      seen.push(`queryExecutor:${querySpec.recordType}`);
      return { ok: true };
    },
  });
  const result = await writerSet.followUpDraftWriter(safePayload());

  assert.deepEqual(result, {
    ok: true,
    persisted: true,
    writerType: 'follow_up_draft',
    recordType: 'follow_up_draft',
  });
  assert.deepEqual(seen, ['queryExecutor:follow_up_draft']);
});

test('async query-backed writer set supports object executor execute method', async () => {
  const seen = [];
  const writerSet = createDataCorrectionAsyncQueryBackedPersistenceWriters({
    allowNonExecutableForTest: true,
    executor: {
      async execute(querySpec) {
        seen.push(querySpec.recordType);
        return { ok: true };
      },
    },
  });
  const result = await writerSet.followUpDraftWriter(safePayload());

  assert.equal(result.ok, true);
  assert.deepEqual(seen, ['follow_up_draft']);
});

test('async query-backed writer set fails safely for executor rejection', async () => {
  const writerSet = createDataCorrectionAsyncQueryBackedPersistenceWriters({
    allowNonExecutableForTest: true,
    async executor() {
      throw new Error('token_should_not_leak DATABASE_URL_should_not_leak');
    },
  });
  const result = await writerSet.auditWriter(safePayload());

  assert.deepEqual(result, {
    ok: false,
    persisted: false,
    writerType: 'audit',
    recordType: 'audit',
    reasonCode: 'EXECUTOR_FAILED',
  });
  assertSafeOutput(result);
});

test('async query-backed writer set fails safely for malformed executor result', async () => {
  const writerSet = createDataCorrectionAsyncQueryBackedPersistenceWriters({
    allowNonExecutableForTest: true,
    async executor() {
      return {
        ok: false,
        rawPhone: 'raw_phone_should_not_leak',
      };
    },
  });
  const result = await writerSet.auditWriter(safePayload());

  assert.deepEqual(result, {
    ok: false,
    persisted: false,
    writerType: 'audit',
    recordType: 'audit',
    reasonCode: 'EXECUTOR_RESULT_MALFORMED',
  });
  assertSafeOutput(result);
});

test('audit high-level writer reaches executor with writerType audit', async () => {
  let capturedSpec;
  const writerSet = createDataCorrectionQueryBackedPersistenceWriters({
    allowNonExecutableForTest: true,
    executor(querySpec) {
      capturedSpec = querySpec;
      return { ok: true };
    },
  });
  const result = await writerSet.auditWriter(safePayload());

  assert.equal(result.ok, true);
  assert.equal(capturedSpec.recordType, 'audit');
});

test('correction high-level writer reaches executor with writerType correction_application', async () => {
  let capturedSpec;
  const writerSet = createDataCorrectionQueryBackedPersistenceWriters({
    allowNonExecutableForTest: true,
    executor(querySpec) {
      capturedSpec = querySpec;
      return { ok: true };
    },
  });
  const result = await writerSet.correctionWriter(safePayload());

  assert.equal(result.ok, true);
  assert.equal(capturedSpec.recordType, 'correction_application');
});

test('contact dispatch follow-up appointment evidence paths map to correct writerTypes', async () => {
  const seen = [];
  const writerSet = createDataCorrectionQueryBackedPersistenceWriters({
    allowNonExecutableForTest: true,
    executor(querySpec) {
      seen.push(querySpec.recordType);
      return { ok: true };
    },
  });

  assert.equal((await writerSet.contactLogWriter(safePayload())).ok, true);
  assert.equal((await writerSet.dispatchNoteWriter(safePayload())).ok, true);
  assert.equal((await writerSet.followUpDraftWriter(safePayload())).ok, true);
  assert.equal((await writerSet.appointmentResultWriter(safePayload())).ok, true);
  assert.equal((await writerSet.evidenceWriter(safePayload())).ok, true);
  assert.equal((await writerSet.engineerNotificationWriter(safePayload())).ok, true);
  assert.deepEqual(seen, [
    'contact_log',
    'dispatch_note',
    'follow_up_draft',
    'appointment_result',
    'evidence',
    'engineer_notification_intent',
  ]);
});

test('executor throw returns safe failure without raw error leak', async () => {
  const writerSet = createDataCorrectionQueryBackedPersistenceWriters({
    allowNonExecutableForTest: true,
    executor() {
      throw new Error('token_should_not_leak DATABASE_URL_should_not_leak');
    },
  });
  const result = await writerSet.auditWriter(safePayload());

  assert.deepEqual(result, {
    ok: false,
    persisted: false,
    writerType: 'audit',
    recordType: 'audit',
    reasonCode: 'EXECUTOR_FAILED',
  });
  assertSafeOutput(result);
});

test('executor malformed result returns safe failure', async () => {
  const writerSet = createDataCorrectionQueryBackedPersistenceWriters({
    allowNonExecutableForTest: true,
    executor() {
      return {
        ok: false,
        rawPhone: 'raw_phone_should_not_leak',
      };
    },
  });
  const result = await writerSet.auditWriter(safePayload());

  assert.deepEqual(result, {
    ok: false,
    persisted: false,
    writerType: 'audit',
    recordType: 'audit',
    reasonCode: 'EXECUTOR_RESULT_MALFORMED',
  });
  assertSafeOutput(result);
});

test('unsafe payload is sanitized before executor', async () => {
  let capturedSpec;
  const writerSet = createDataCorrectionQueryBackedPersistenceWriters({
    allowNonExecutableForTest: true,
    executor(querySpec) {
      capturedSpec = querySpec;
      return { ok: true };
    },
  });
  const result = await writerSet.auditWriter(safePayload(unsafeFields()));

  assert.equal(result.ok, true);
  assert.equal(capturedSpec.recordType, 'audit');
  assertSafeOutput(capturedSpec);
});

test('executor does not receive raw phone address LINE id token secret DB URL or finalAppointmentId', async () => {
  let capturedSpec;
  const writerSet = createDataCorrectionQueryBackedPersistenceWriters({
    allowNonExecutableForTest: true,
    executor(querySpec) {
      capturedSpec = querySpec;
      return { ok: true };
    },
  });

  await writerSet.contactLogWriter(safePayload(unsafeFields()));

  assertSafeOutput(capturedSpec);
  assert.equal(capturedSpec.sql.includes('raw_phone_should_not_leak'), false);
});

test('high-level writer set uses downstream writer contract shape', async () => {
  const writerSet = createDataCorrectionQueryBackedPersistenceWriters({
    allowNonExecutableForTest: true,
    executor() {
      return { ok: true };
    },
  });
  const result = await writerSet.auditWriter(safePayload());

  assert.deepEqual(Object.keys(writerSet).sort(), [...EXPECTED_HIGH_LEVEL_WRITERS].sort());
  assert.deepEqual(result, {
    ok: true,
    persisted: true,
    writerType: 'audit',
    recordType: 'audit',
  });
});

test('input payload is not mutated', async () => {
  const payload = safePayload(unsafeFields());
  const before = clone(payload);
  const writerSet = createDataCorrectionQueryBackedPersistenceWriters({
    allowNonExecutableForTest: true,
    executor() {
      return { ok: true };
    },
  });

  await writerSet.auditWriter(payload);

  assert.deepEqual(payload, before);
});

test('executor object is not mutated', async () => {
  const executor = {
    marker: 'unchanged',
    execute() {
      return { ok: true };
    },
  };
  const before = { marker: executor.marker, keys: Object.keys(executor) };
  const writerSet = createDataCorrectionQueryBackedPersistenceWriters({
    allowNonExecutableForTest: true,
    executor,
  });

  await writerSet.auditWriter(safePayload());

  assert.deepEqual({ marker: executor.marker, keys: Object.keys(executor) }, before);
});

test('no logging side effects', async () => {
  const capturedConsole = captureConsoleCalls();
  const writerSet = createDataCorrectionQueryBackedPersistenceWriters({
    allowNonExecutableForTest: true,
    executor() {
      return { ok: true };
    },
  });

  try {
    await writerSet.auditWriter(safePayload());
  } finally {
    capturedConsole.restore();
  }

  assert.deepEqual(capturedConsole.calls, []);
});

test('module import boundary avoids DB repository provider AI route controller app server imports', () => {
  const source = fs.readFileSync(adapterFile, 'utf8');
  const specifiers = requireSpecifiers(source);
  const unexpectedSpecifiers = specifiers.filter((specifier) => ![
    './dataCorrectionPersistenceWriters',
    './dataCorrectionPersistenceRecordMapper',
  ].includes(specifier));

  assert.deepEqual(specifiers, [
    './dataCorrectionPersistenceWriters',
    './dataCorrectionPersistenceRecordMapper',
  ]);
  assert.equal(unexpectedSpecifiers.some((specifier) => (
    /(db|pool|repositories?|services?|providers?|ai|rag|vector|openai|routes?|controllers?|app|server)/i
      .test(specifier)
  )), false);
  assert.doesNotMatch(source, /process\.env|console\.(log|info|warn|error|debug)/);
});
