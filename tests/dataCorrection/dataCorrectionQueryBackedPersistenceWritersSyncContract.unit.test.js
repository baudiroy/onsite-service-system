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
  createDataCorrectionQueryBackedPersistenceWriters,
} = require('../../src/dataCorrection/dataCorrectionQueryBackedPersistenceWriters');

const repoRoot = path.resolve(__dirname, '../..');
const adapterFile = path.join(
  repoRoot,
  'src/dataCorrection/dataCorrectionQueryBackedPersistenceWriters.js',
);

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
    organizationId: 'org_data_correction_sync_contract_001',
    caseId: 'case_data_correction_sync_contract_001',
    appointmentId: 'apt_data_correction_sync_contract_001',
    actorUserId: 'user_data_correction_sync_contract_001',
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
    organizationId: 'org_data_correction_sync_contract_001',
    timestamp: '2026-05-21T12:30:00.000Z',
    actor: {
      userId: 'user_data_correction_sync_contract_001',
      role: 'dispatch_assistant',
      permissions: ['data_correction.apply'],
    },
    caseContext: {
      caseId: 'case_data_correction_sync_contract_001',
      organizationId: 'org_data_correction_sync_contract_001',
    },
    appointmentContext: {
      appointmentId: 'apt_data_correction_sync_contract_001',
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
      internalNote: 'internal_note_should_not_leak',
      auditRawPayload: 'audit_log_should_not_leak',
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

function isPromiseLike(value) {
  return Boolean(value) && (
    typeof value === 'object'
    || typeof value === 'function'
  ) && typeof value.then === 'function';
}

function assertPlainObject(value) {
  assert.equal(isPlainObject(value), true);
  assert.equal(isPromiseLike(value), false);
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

test('all high-level query-backed writers return plain objects, not promises', () => {
  const writerSet = createDataCorrectionQueryBackedPersistenceWriters();

  assert.deepEqual(Object.keys(writerSet).sort(), [...EXPECTED_HIGH_LEVEL_WRITERS].sort());

  for (const writerName of EXPECTED_HIGH_LEVEL_WRITERS) {
    const result = writerSet[writerName](safePayload());

    assertPlainObject(result);
    assert.equal(result.ok, false);
    assert.equal(result.persisted, false);
    assert.equal(result.reasonCode, 'QUERY_SPEC_NOT_EXECUTABLE');
  }
});

test('default non-executable specs fail synchronously and do not call executor', () => {
  let called = false;
  const writerSet = createDataCorrectionQueryBackedPersistenceWriters({
    executor() {
      called = true;
      return { ok: true };
    },
  });
  const result = writerSet.auditWriter(safePayload());

  assertPlainObject(result);
  assert.deepEqual(result, {
    ok: false,
    persisted: false,
    writerType: 'audit',
    recordType: 'audit',
    reasonCode: 'QUERY_SPEC_NOT_EXECUTABLE',
  });
  assert.equal(called, false);
});

test('allowNonExecutableForTest=true allows sync synthetic function executor', () => {
  let called = false;
  const writerSet = createDataCorrectionQueryBackedPersistenceWriters({
    allowNonExecutableForTest: true,
    executor() {
      called = true;
      return { ok: true };
    },
  });
  const result = writerSet.auditWriter(safePayload());

  assertPlainObject(result);
  assert.deepEqual(result, {
    ok: true,
    persisted: true,
    writerType: 'audit',
    recordType: 'audit',
  });
  assert.equal(called, true);
});

test('object executor execute method is supported when sync', () => {
  const seen = [];
  const writerSet = createDataCorrectionQueryBackedPersistenceWriters({
    allowNonExecutableForTest: true,
    executor: {
      execute(querySpec) {
        seen.push(querySpec.recordType);
        return { ok: true };
      },
    },
  });
  const result = writerSet.contactLogWriter(safePayload());

  assertPlainObject(result);
  assert.equal(result.ok, true);
  assert.deepEqual(seen, ['contact_log']);
});

test('async or promise executor is rejected safely instead of returning promise', () => {
  const writerSet = createDataCorrectionQueryBackedPersistenceWriters({
    allowNonExecutableForTest: true,
    executor() {
      return Promise.resolve({
        ok: true,
        token: 'token_should_not_leak',
      });
    },
  });
  const result = writerSet.auditWriter(safePayload());

  assertPlainObject(result);
  assert.deepEqual(result, {
    ok: false,
    persisted: false,
    writerType: 'audit',
    recordType: 'audit',
    reasonCode: 'ASYNC_EXECUTOR_NOT_SUPPORTED',
  });
  assertSafeOutput(result);
});

test('executor throw returns safe failure without raw error leak', () => {
  const writerSet = createDataCorrectionQueryBackedPersistenceWriters({
    allowNonExecutableForTest: true,
    executor() {
      throw new Error('token_should_not_leak DATABASE_URL_should_not_leak');
    },
  });
  const result = writerSet.auditWriter(safePayload());

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
  const writerSet = createDataCorrectionQueryBackedPersistenceWriters({
    allowNonExecutableForTest: true,
    executor() {
      return {
        ok: false,
        rawPhone: 'raw_phone_should_not_leak',
      };
    },
  });
  const result = writerSet.auditWriter(safePayload());

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

test('success returns ok persisted plain object', () => {
  const writerSet = createDataCorrectionQueryBackedPersistenceWriters({
    allowNonExecutableForTest: true,
    executor() {
      return { ok: true };
    },
  });
  const result = writerSet.correctionWriter(safePayload());

  assertPlainObject(result);
  assert.deepEqual(result, {
    ok: true,
    persisted: true,
    writerType: 'correction_application',
    recordType: 'correction_application',
  });
});

test('downstream pre-departure service treats default non-executable writer as failure', () => {
  let called = false;
  const writerSet = createDataCorrectionQueryBackedPersistenceWriters({
    executor() {
      called = true;
      return { ok: true };
    },
  });
  const result = applyPreDepartureCorrection(preDepartureInput(), {
    correctionWriter: writerSet.correctionWriter,
  });

  assert.equal(called, false);
  assert.equal(result.status, APPLICATION_STATUSES.FAILED);
  assert.equal(result.allowed, false);
  assert.equal(result.correctionApplied, false);
  assert.deepEqual(result.writerResults.correction, {
    status: 'failed',
    reasonCode: 'WRITER_FAILED',
    safeMessageKey: 'dataCorrection.writerFailed',
  });
  assertSafeOutput(result);
});

test('downstream pre-departure service treats sync synthetic executor success as recorded', () => {
  let called = false;
  const writerSet = createDataCorrectionQueryBackedPersistenceWriters({
    allowNonExecutableForTest: true,
    executor() {
      called = true;
      return { ok: true };
    },
  });
  const result = applyPreDepartureCorrection(preDepartureInput(), {
    correctionWriter: writerSet.correctionWriter,
  });

  assert.equal(called, true);
  assert.equal(result.status, APPLICATION_STATUSES.APPLIED);
  assert.equal(result.allowed, true);
  assert.equal(result.correctionApplied, true);
  assert.equal(result.writerResults.correction.status, 'recorded');
  assertSafeOutput(result);
});

test('phone correction still does not call correction executor', () => {
  let executorCalls = 0;
  const writerSet = createDataCorrectionQueryBackedPersistenceWriters({
    allowNonExecutableForTest: true,
    executor() {
      executorCalls += 1;
      return { ok: true };
    },
  });
  const result = applyPreDepartureCorrection(preDepartureInput({
    correction: {
      fieldKey: 'phoneNumber',
      fieldGroup: CORRECTION_FIELD_GROUPS.PHONE_IDENTITY,
      fromValue: 'raw_phone_should_not_leak',
      toValue: 'raw_phone_should_not_leak',
    },
  }), {
    correctionWriter: writerSet.correctionWriter,
  });

  assert.equal(executorCalls, 0);
  assert.equal(result.status, APPLICATION_STATUSES.BLOCKED);
  assert.equal(result.decision, DATA_CORRECTION_DECISIONS.PHONE_REVERIFICATION_REQUIRED);
  assert.equal(result.phoneReverificationRequired, true);
  assertSafeOutput(result);
});

test('executor receives sanitized frozen querySpec only', () => {
  let capturedSpec;
  const writerSet = createDataCorrectionQueryBackedPersistenceWriters({
    allowNonExecutableForTest: true,
    executor(querySpec) {
      capturedSpec = querySpec;
      return { ok: true };
    },
  });
  const result = writerSet.contactLogWriter(safePayload(unsafeFields()));

  assert.equal(result.ok, true);
  assert.equal(capturedSpec.recordType, 'contact_log');
  assert.equal(Object.isFrozen(capturedSpec), true);
  assert.equal(Object.isFrozen(capturedSpec.fields), true);
  assert.equal(Object.isFrozen(capturedSpec.values), true);
  assertSafeOutput(capturedSpec);
  assert.equal(capturedSpec.sql.includes('raw_phone_should_not_leak'), false);
});

test('executor cannot mutate original input payload', () => {
  const payload = safePayload(unsafeFields());
  const before = clone(payload);
  const writerSet = createDataCorrectionQueryBackedPersistenceWriters({
    allowNonExecutableForTest: true,
    executor(querySpec) {
      assert.throws(() => {
        querySpec.values.push('mutation');
      }, TypeError);
      return { ok: true };
    },
  });
  const result = writerSet.auditWriter(payload);

  assert.equal(result.ok, true);
  assert.deepEqual(payload, before);
});

test('query-backed writer has no logging side effects', () => {
  const capturedConsole = captureConsoleCalls();
  const writerSet = createDataCorrectionQueryBackedPersistenceWriters({
    allowNonExecutableForTest: true,
    executor() {
      return { ok: true };
    },
  });

  try {
    writerSet.auditWriter(safePayload());
  } finally {
    capturedConsole.restore();
  }

  assert.deepEqual(capturedConsole.calls, []);
});

test('module import boundary avoids DB repository provider AI route controller app server imports', () => {
  const source = fs.readFileSync(adapterFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, [
    './dataCorrectionPersistenceWriters',
    './dataCorrectionPersistenceRecordMapper',
  ]);
  assert.equal(specifiers.some((specifier) => (
    /(^|\/)(db|pool|repositories?|services?|providers?|ai|rag|vector|openai|routes?|controllers?|app|server)(\/|$)/i
      .test(specifier)
  )), false);
  assert.doesNotMatch(source, /process\.env|console\.(log|info|warn|error|debug)/);
});
