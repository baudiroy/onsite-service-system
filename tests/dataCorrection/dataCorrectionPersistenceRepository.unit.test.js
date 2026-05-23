'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  CORRECTION_FIELD_GROUPS,
  DATA_CORRECTION_DECISIONS,
} = require('../../src/dataCorrection/dataCorrectionPolicyEngine');
const {
  APPLICATION_STATUSES,
  applyPreDepartureCorrection,
} = require('../../src/dataCorrection/preDepartureCorrectionApplicationService');
const {
  DATA_CORRECTION_PERSISTENCE_REPOSITORY_METHODS,
  DATA_CORRECTION_PERSISTENCE_REPOSITORY_METHOD_TO_WRITER_KEY,
  DATA_CORRECTION_PERSISTENCE_REPOSITORY_MODE_FLAGS,
  DATA_CORRECTION_PERSISTENCE_REPOSITORY_READ_METHODS,
  DATA_CORRECTION_PERSISTENCE_REPOSITORY_WRITE_METHODS,
  DATA_CORRECTION_PERSISTENCE_REPOSITORY_WRITER_KEYS,
  createDataCorrectionPersistenceRepository,
} = require('../../src/dataCorrection/dataCorrectionPersistenceRepository');
const {
  DATA_CORRECTION_QUERY_BACKED_HIGH_LEVEL_WRITER_KEYS,
} = require('../../src/dataCorrection/dataCorrectionQueryBackedPersistenceWriters');

const repoRoot = path.resolve(__dirname, '../..');
const repositoryPath = path.join(
  repoRoot,
  'src/dataCorrection/dataCorrectionPersistenceRepository.js',
);

const EXPECTED_METHODS = Object.freeze([
  'getWriterSet',
  'writeAudit',
  'writeContactLog',
  'writeDispatchNote',
  'writeEngineerNotificationIntent',
  'writeAppointmentResult',
  'writeEvidence',
  'writeFollowUpDraft',
  'writeCorrectionApplication',
]);

const EXPECTED_WRITER_KEYS = Object.freeze([
  'appointmentResultWriter',
  'auditWriter',
  'contactLogWriter',
  'correctionWriter',
  'dispatchNoteWriter',
  'engineerNotificationWriter',
  'evidenceWriter',
  'followUpDraftWriter',
]);

const METHOD_EXPECTATIONS = Object.freeze({
  writeAppointmentResult: 'appointment_result',
  writeAudit: 'audit',
  writeContactLog: 'contact_log',
  writeCorrectionApplication: 'correction_application',
  writeDispatchNote: 'dispatch_note',
  writeEngineerNotificationIntent: 'engineer_notification_intent',
  writeEvidence: 'evidence',
  writeFollowUpDraft: 'follow_up_draft',
});

const EXPECTED_METHOD_TO_WRITER_KEY = Object.freeze({
  writeAppointmentResult: 'appointmentResultWriter',
  writeAudit: 'auditWriter',
  writeContactLog: 'contactLogWriter',
  writeCorrectionApplication: 'correctionWriter',
  writeDispatchNote: 'dispatchNoteWriter',
  writeEngineerNotificationIntent: 'engineerNotificationWriter',
  writeEvidence: 'evidenceWriter',
  writeFollowUpDraft: 'followUpDraftWriter',
});

function safePayload(overrides = {}) {
  return {
    organizationId: 'org_data_correction_repository_001',
    caseId: 'case_data_correction_repository_001',
    appointmentId: 'apt_data_correction_repository_001',
    actorUserId: 'user_data_correction_repository_001',
    actorRole: 'dispatch_assistant',
    actionType: 'pre_departure_apply',
    fieldKey: 'issueSummary',
    fieldGroup: CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL,
    decision: DATA_CORRECTION_DECISIONS.ALLOW_PRE_DEPARTURE_CORRECTION,
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
  };
}

function preDepartureInput(overrides = {}) {
  return {
    organizationId: 'org_data_correction_repository_001',
    timestamp: '2026-05-21T12:30:00.000Z',
    actor: {
      userId: 'user_data_correction_repository_001',
      role: 'dispatch_assistant',
      permissions: ['data_correction.apply'],
    },
    caseContext: {
      caseId: 'case_data_correction_repository_001',
      organizationId: 'org_data_correction_repository_001',
    },
    appointmentContext: {
      appointmentId: 'apt_data_correction_repository_001',
      engineerReceivedTask: false,
      engineerDeparted: false,
      routeStarted: false,
      arrived: false,
    },
    correction: {
      fieldKey: 'issueSummary',
      fieldGroup: CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL,
      fromValue: 'old_value_should_not_leak',
      toValue: 'updated issue summary',
      rawPhone: 'raw_phone_should_not_leak',
      rawAddress: 'raw_address_should_not_leak',
      rawLineUserId: 'line_user_should_not_leak',
      token: 'token_should_not_leak',
      secret: 'secret_should_not_leak',
      aiRawPayload: 'ai_raw_payload_should_not_leak',
      finalAppointmentId: 'final_appointment_should_not_leak',
    },
    ...overrides,
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function assertPlainObject(value) {
  assert.equal(isPlainObject(value), true);
  assert.equal(Boolean(value && typeof value.then === 'function'), false);
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

test('exports repository factory and constants', () => {
  assert.equal(typeof createDataCorrectionPersistenceRepository, 'function');
  assert.deepEqual([...DATA_CORRECTION_PERSISTENCE_REPOSITORY_METHODS].sort(), [...EXPECTED_METHODS].sort());
  assert.deepEqual([...DATA_CORRECTION_PERSISTENCE_REPOSITORY_WRITER_KEYS].sort(), [...EXPECTED_WRITER_KEYS].sort());
  assert.deepEqual(
    DATA_CORRECTION_PERSISTENCE_REPOSITORY_WRITER_KEYS,
    DATA_CORRECTION_QUERY_BACKED_HIGH_LEVEL_WRITER_KEYS,
  );
});

test('exported repository method-to-writer-key contract covers every write method and is immutable', () => {
  assert.equal(Object.isFrozen(DATA_CORRECTION_PERSISTENCE_REPOSITORY_METHOD_TO_WRITER_KEY), true);
  assert.deepEqual(DATA_CORRECTION_PERSISTENCE_REPOSITORY_METHOD_TO_WRITER_KEY, EXPECTED_METHOD_TO_WRITER_KEY);

  const writeMethods = DATA_CORRECTION_PERSISTENCE_REPOSITORY_METHODS
    .filter((methodName) => methodName !== 'getWriterSet')
    .sort();
  const mappedMethods = Object.keys(DATA_CORRECTION_PERSISTENCE_REPOSITORY_METHOD_TO_WRITER_KEY).sort();

  assert.deepEqual(mappedMethods, writeMethods);

  for (const writerKey of Object.values(DATA_CORRECTION_PERSISTENCE_REPOSITORY_METHOD_TO_WRITER_KEY)) {
    assert.equal(
      DATA_CORRECTION_PERSISTENCE_REPOSITORY_WRITER_KEYS.includes(writerKey),
      true,
      `${writerKey} missing from repository writer keys`,
    );
  }

  assert.throws(() => {
    DATA_CORRECTION_PERSISTENCE_REPOSITORY_METHOD_TO_WRITER_KEY.writeAudit = 'contactLogWriter';
  }, TypeError);
  assert.equal(DATA_CORRECTION_PERSISTENCE_REPOSITORY_METHOD_TO_WRITER_KEY.writeAudit, 'auditWriter');
});

test('exports immutable repository write-method-only contract', () => {
  assert.equal(Object.isFrozen(DATA_CORRECTION_PERSISTENCE_REPOSITORY_WRITE_METHODS), true);
  assert.equal(DATA_CORRECTION_PERSISTENCE_REPOSITORY_WRITE_METHODS.includes('getWriterSet'), false);
  assert.deepEqual(
    DATA_CORRECTION_PERSISTENCE_REPOSITORY_METHODS,
    [
      ...DATA_CORRECTION_PERSISTENCE_REPOSITORY_READ_METHODS,
      ...DATA_CORRECTION_PERSISTENCE_REPOSITORY_WRITE_METHODS,
    ],
  );
  assert.deepEqual(
    [...DATA_CORRECTION_PERSISTENCE_REPOSITORY_WRITE_METHODS].sort(),
    Object.keys(DATA_CORRECTION_PERSISTENCE_REPOSITORY_METHOD_TO_WRITER_KEY).sort(),
  );
  assert.deepEqual(
    [...DATA_CORRECTION_PERSISTENCE_REPOSITORY_WRITE_METHODS].sort(),
    DATA_CORRECTION_PERSISTENCE_REPOSITORY_METHODS
      .filter((methodName) => methodName !== 'getWriterSet')
      .sort(),
  );

  assert.throws(() => {
    DATA_CORRECTION_PERSISTENCE_REPOSITORY_WRITE_METHODS.push('unexpectedWriteMethod');
  }, TypeError);
});

test('exports immutable repository read-method-only contract', () => {
  assert.equal(Object.isFrozen(DATA_CORRECTION_PERSISTENCE_REPOSITORY_READ_METHODS), true);
  assert.deepEqual(DATA_CORRECTION_PERSISTENCE_REPOSITORY_READ_METHODS, ['getWriterSet']);

  for (const methodName of DATA_CORRECTION_PERSISTENCE_REPOSITORY_READ_METHODS) {
    assert.equal(DATA_CORRECTION_PERSISTENCE_REPOSITORY_WRITE_METHODS.includes(methodName), false);
    assert.equal(DATA_CORRECTION_PERSISTENCE_REPOSITORY_METHODS.includes(methodName), true);
  }

  assert.throws(() => {
    DATA_CORRECTION_PERSISTENCE_REPOSITORY_READ_METHODS.push('unexpectedReadMethod');
  }, TypeError);
});

test('exports immutable repository mode flag contract', () => {
  assert.equal(Object.isFrozen(DATA_CORRECTION_PERSISTENCE_REPOSITORY_MODE_FLAGS), true);
  assert.deepEqual(DATA_CORRECTION_PERSISTENCE_REPOSITORY_MODE_FLAGS, {
    ASYNC_WRITERS: 'asyncWriters',
    USE_ASYNC_WRITERS: 'useAsyncWriters',
  });

  assert.throws(() => {
    DATA_CORRECTION_PERSISTENCE_REPOSITORY_MODE_FLAGS.ASYNC_WRITERS = 'unexpected';
  }, TypeError);
  assert.equal(DATA_CORRECTION_PERSISTENCE_REPOSITORY_MODE_FLAGS.ASYNC_WRITERS, 'asyncWriters');
});

test('repository exposes all expected methods', () => {
  const repository = createDataCorrectionPersistenceRepository();

  assert.equal(Object.isFrozen(repository), true);

  for (const methodName of EXPECTED_METHODS) {
    assert.equal(typeof repository[methodName], 'function', `${methodName} missing`);
  }
});

test('getWriterSet returns all app compatible writer names', () => {
  const repository = createDataCorrectionPersistenceRepository();
  const writerSet = repository.getWriterSet();

  assert.deepEqual(Object.keys(writerSet).sort(), [...EXPECTED_WRITER_KEYS].sort());

  for (const writerKey of EXPECTED_WRITER_KEYS) {
    assert.equal(typeof writerSet[writerKey], 'function', `${writerKey} missing`);
  }
});

test('default non-executable mode returns safe failure and executor is not called', () => {
  let called = false;
  const repository = createDataCorrectionPersistenceRepository({
    executor() {
      called = true;
      return { ok: true };
    },
  });
  const result = repository.writeAudit(safePayload());

  assertPlainObject(result);
  assert.equal(called, false);
  assert.deepEqual(result, {
    ok: false,
    persisted: false,
    writerType: 'audit',
    recordType: 'audit',
    reasonCode: 'QUERY_SPEC_NOT_EXECUTABLE',
  });
});

test('allowNonExecutableForTest sync executor succeeds for writeAudit', () => {
  const seen = [];
  const repository = createDataCorrectionPersistenceRepository({
    allowNonExecutableForTest: true,
    executor(querySpec) {
      seen.push(querySpec.recordType);
      return { ok: true };
    },
  });
  const result = repository.writeAudit(safePayload());

  assertPlainObject(result);
  assert.equal(result.ok, true);
  assert.equal(result.persisted, true);
  assert.deepEqual(seen, ['audit']);
});

test('queryExecutor option aliases executor for sync repository methods', () => {
  const seen = [];
  const repository = createDataCorrectionPersistenceRepository({
    allowNonExecutableForTest: true,
    queryExecutor(querySpec) {
      seen.push(querySpec.recordType);
      return { ok: true };
    },
  });
  const result = repository.writeDispatchNote(safePayload());

  assertPlainObject(result);
  assert.deepEqual(result, {
    ok: true,
    persisted: true,
    writerType: 'dispatch_note',
    recordType: 'dispatch_note',
  });
  assert.deepEqual(seen, ['dispatch_note']);
});

test('asyncWriters option returns awaitable repository methods for async executors', async () => {
  const seen = [];
  const repository = createDataCorrectionPersistenceRepository({
    allowNonExecutableForTest: true,
    asyncWriters: true,
    async executor(querySpec) {
      seen.push(querySpec.recordType);
      return { ok: true };
    },
  });
  const resultPromise = repository.writeAudit(safePayload());

  assert.equal(Boolean(resultPromise && typeof resultPromise.then === 'function'), true);

  const result = await resultPromise;

  assert.deepEqual(result, {
    ok: true,
    persisted: true,
    writerType: 'audit',
    recordType: 'audit',
  });
  assert.deepEqual(seen, ['audit']);
});

test('queryExecutor option aliases executor for async repository methods', async () => {
  const seen = [];
  const repository = createDataCorrectionPersistenceRepository({
    allowNonExecutableForTest: true,
    asyncWriters: true,
    async queryExecutor(querySpec) {
      seen.push(querySpec.recordType);
      return { ok: true };
    },
  });
  const result = await repository.writeFollowUpDraft(safePayload());

  assert.deepEqual(result, {
    ok: true,
    persisted: true,
    writerType: 'follow_up_draft',
    recordType: 'follow_up_draft',
  });
  assert.deepEqual(seen, ['follow_up_draft']);
});

test('useAsyncWriters option returns async app-compatible writer set', async () => {
  const seen = [];
  const repository = createDataCorrectionPersistenceRepository({
    allowNonExecutableForTest: true,
    useAsyncWriters: true,
    executor: {
      async execute(querySpec) {
        seen.push(querySpec.recordType);
        return { ok: true };
      },
    },
  });
  const writerSet = repository.getWriterSet();
  const resultPromise = writerSet.followUpDraftWriter(safePayload());

  assert.equal(Boolean(resultPromise && typeof resultPromise.then === 'function'), true);

  const result = await resultPromise;

  assert.equal(result.ok, true);
  assert.equal(result.persisted, true);
  assert.deepEqual(seen, ['follow_up_draft']);
});

test('writeCorrectionApplication succeeds with sync synthetic executor', () => {
  const repository = createDataCorrectionPersistenceRepository({
    allowNonExecutableForTest: true,
    executor() {
      return { ok: true };
    },
  });
  const result = repository.writeCorrectionApplication(safePayload());

  assert.deepEqual(result, {
    ok: true,
    persisted: true,
    writerType: 'correction_application',
    recordType: 'correction_application',
  });
});

test('all repository write methods delegate to matching writer types', () => {
  const seen = [];
  const repository = createDataCorrectionPersistenceRepository({
    allowNonExecutableForTest: true,
    executor(querySpec) {
      seen.push(querySpec.recordType);
      return { ok: true };
    },
  });

  for (const [methodName, expectedRecordType] of Object.entries(METHOD_EXPECTATIONS)) {
    const result = repository[methodName](safePayload());

    assert.equal(result.ok, true, methodName);
    assert.equal(result.recordType, expectedRecordType, methodName);
  }

  assert.deepEqual(seen.sort(), Object.values(METHOD_EXPECTATIONS).sort());
});

test('executor throw returns safe failure without raw error leak', () => {
  const repository = createDataCorrectionPersistenceRepository({
    allowNonExecutableForTest: true,
    executor() {
      throw new Error('token_should_not_leak DATABASE_URL_should_not_leak');
    },
  });
  const result = repository.writeAudit(safePayload());

  assertPlainObject(result);
  assert.deepEqual(result, {
    ok: false,
    persisted: false,
    writerType: 'audit',
    recordType: 'audit',
    reasonCode: 'EXECUTOR_FAILED',
  });
  assertSafeOutput(result);
});

test('malformed executor result returns safe failure', () => {
  const repository = createDataCorrectionPersistenceRepository({
    allowNonExecutableForTest: true,
    executor() {
      return {
        ok: false,
        rawPhone: 'raw_phone_should_not_leak',
      };
    },
  });
  const result = repository.writeAudit(safePayload());

  assertPlainObject(result);
  assert.deepEqual(result, {
    ok: false,
    persisted: false,
    writerType: 'audit',
    recordType: 'audit',
    reasonCode: 'EXECUTOR_RESULT_MALFORMED',
  });
  assertSafeOutput(result);
});

test('repository writer set can be passed downstream and success propagates', () => {
  const repository = createDataCorrectionPersistenceRepository({
    allowNonExecutableForTest: true,
    executor() {
      return { ok: true };
    },
  });
  const result = applyPreDepartureCorrection(preDepartureInput(), repository.getWriterSet());

  assert.equal(result.status, APPLICATION_STATUSES.APPLIED);
  assert.equal(result.allowed, true);
  assert.equal(result.correctionApplied, true);
  assert.equal(result.writerResults.correction.status, 'recorded');
  assertSafeOutput(result);
});

test('repository writer set propagates downstream failure', () => {
  const repository = createDataCorrectionPersistenceRepository();
  const result = applyPreDepartureCorrection(preDepartureInput(), repository.getWriterSet());

  assert.equal(result.status, APPLICATION_STATUSES.FAILED);
  assert.equal(result.allowed, false);
  assert.equal(result.correctionApplied, false);
  assert.equal(result.writerResults.correction.status, 'failed');
  assert.equal(result.writerResults.correction.reasonCode, 'WRITER_FAILED');
  assertSafeOutput(result);
});

test('payload sanitization prevents raw sensitive values from reaching executor', () => {
  let capturedSpec;
  const repository = createDataCorrectionPersistenceRepository({
    allowNonExecutableForTest: true,
    executor(querySpec) {
      capturedSpec = querySpec;
      return { ok: true };
    },
  });
  const result = repository.writeContactLog(safePayload(unsafeFields()));

  assert.equal(result.ok, true);
  assert.equal(capturedSpec.recordType, 'contact_log');
  assertSafeOutput(capturedSpec);
});

test('input payload and executor object are not mutated', () => {
  const payload = safePayload(unsafeFields());
  const beforePayload = clone(payload);
  const executor = {
    marker: 'unchanged',
    execute() {
      return { ok: true };
    },
  };
  const beforeExecute = executor.execute;
  const repository = createDataCorrectionPersistenceRepository({
    allowNonExecutableForTest: true,
    executor,
  });
  const result = repository.writeEvidence(payload);

  assert.equal(result.ok, true);
  assert.deepEqual(payload, beforePayload);
  assert.equal(executor.marker, 'unchanged');
  assert.equal(executor.execute, beforeExecute);
});

test('repository has no logging side effects', () => {
  const capturedConsole = captureConsoleCalls();
  const repository = createDataCorrectionPersistenceRepository({
    allowNonExecutableForTest: true,
    executor() {
      return { ok: true };
    },
  });

  try {
    repository.writeAudit(safePayload());
  } finally {
    capturedConsole.restore();
  }

  assert.deepEqual(capturedConsole.calls, []);
});

test('module import boundary avoids DB repository provider AI route app server imports', () => {
  const source = fs.readFileSync(repositoryPath, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, ['./dataCorrectionQueryBackedPersistenceWriters']);
  assert.equal(specifiers.some((specifier) => (
    /(^|\/)(db|pool|repositories?|services?|providers?|ai|rag|vector|openai|routes?|controllers?|app|server)(\/|$)/i
      .test(specifier)
  )), false);
  assert.doesNotMatch(source, /process\.env|console\.(log|info|warn|error|debug)/);
});
