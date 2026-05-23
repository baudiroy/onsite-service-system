'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  DATA_CORRECTION_PERSISTENCE_QUERY_EXECUTOR_REASON_CODES,
  createDataCorrectionPersistenceQueryExecutor,
  executeDataCorrectionPersistenceQuery,
} = require('../../src/dataCorrection/dataCorrectionPersistenceQueryExecutor');

const repoRoot = path.resolve(__dirname, '../..');
const executorFile = path.join(
  repoRoot,
  'src/dataCorrection/dataCorrectionPersistenceQueryExecutor.js',
);

function safePayload(overrides = {}) {
  return {
    organizationId: 'org_data_correction_query_executor_001',
    caseId: 'case_data_correction_query_executor_001',
    appointmentId: 'apt_data_correction_query_executor_001',
    actorUserId: 'user_data_correction_query_executor_001',
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

function input(writerType = 'audit', payloadOverrides = {}) {
  return {
    writerType,
    payload: safePayload(payloadOverrides),
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

test('exports executor factory and direct execution function', () => {
  assert.equal(typeof createDataCorrectionPersistenceQueryExecutor, 'function');
  assert.equal(typeof executeDataCorrectionPersistenceQuery, 'function');
});

test('exports immutable executor-level reason code contract', () => {
  assert.equal(Object.isFrozen(DATA_CORRECTION_PERSISTENCE_QUERY_EXECUTOR_REASON_CODES), true);
  assert.deepEqual(DATA_CORRECTION_PERSISTENCE_QUERY_EXECUTOR_REASON_CODES, {
    EXECUTOR_FAILED: 'EXECUTOR_FAILED',
    EXECUTOR_RESULT_MALFORMED: 'EXECUTOR_RESULT_MALFORMED',
    INVALID_QUERY_SPEC: 'INVALID_QUERY_SPEC',
    MISSING_EXECUTOR: 'MISSING_EXECUTOR',
    QUERY_SPEC_NOT_EXECUTABLE: 'QUERY_SPEC_NOT_EXECUTABLE',
  });

  assert.throws(() => {
    DATA_CORRECTION_PERSISTENCE_QUERY_EXECUTOR_REASON_CODES.MISSING_EXECUTOR = 'changed';
  }, TypeError);
  assert.equal(DATA_CORRECTION_PERSISTENCE_QUERY_EXECUTOR_REASON_CODES.MISSING_EXECUTOR, 'MISSING_EXECUTOR');
});

test('invalid payload fail-closes and executor is not called', async () => {
  let called = false;
  const result = await executeDataCorrectionPersistenceQuery(input('appointment_result', {
    appointmentId: undefined,
  }), {
    allowNonExecutableForTest: true,
    executor() {
      called = true;
      return { ok: true };
    },
  });

  assert.deepEqual(result, {
    ok: false,
    persisted: false,
    writerType: 'appointment_result',
    recordType: 'appointment_result',
    reasonCode: 'MISSING_APPOINTMENT_ID',
  });
  assert.equal(called, false);
  assertSafeOutput(result);
});

test('non-executable query spec default fail-closes and executor is not called', async () => {
  let called = false;
  const result = await executeDataCorrectionPersistenceQuery(input('audit'), {
    executor() {
      called = true;
      return { ok: true };
    },
  });

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
  const result = await executeDataCorrectionPersistenceQuery(input('audit'), {
    allowNonExecutableForTest: true,
    executor(querySpec) {
      called = true;
      assert.equal(querySpec.executable, false);
      return { ok: true };
    },
  });

  assert.deepEqual(result, {
    ok: true,
    persisted: true,
    writerType: 'audit',
    recordType: 'audit',
  });
  assert.equal(called, true);
});

test('missing executor fail-closes', async () => {
  const result = await executeDataCorrectionPersistenceQuery(input('audit'), {
    allowNonExecutableForTest: true,
  });

  assert.deepEqual(result, {
    ok: false,
    persisted: false,
    writerType: 'audit',
    recordType: 'audit',
    reasonCode: 'MISSING_EXECUTOR',
  });
});

test('function executor success returns safe persisted result', async () => {
  const result = await executeDataCorrectionPersistenceQuery(input('contact_log'), {
    allowNonExecutableForTest: true,
    executor() {
      return {
        ok: true,
        rawPhone: 'raw_phone_should_not_leak',
        token: 'token_should_not_leak',
      };
    },
  });

  assert.deepEqual(result, {
    ok: true,
    persisted: true,
    writerType: 'contact_log',
    recordType: 'contact_log',
  });
  assertSafeOutput(result);
});

test('queryExecutor option aliases executor for direct execution function', async () => {
  const calls = [];
  const result = await executeDataCorrectionPersistenceQuery(input('dispatch_note'), {
    allowNonExecutableForTest: true,
    queryExecutor(querySpec) {
      calls.push(querySpec.recordType);
      return { ok: true };
    },
  });

  assert.deepEqual(result, {
    ok: true,
    persisted: true,
    writerType: 'dispatch_note',
    recordType: 'dispatch_note',
  });
  assert.deepEqual(calls, ['dispatch_note']);
  assertSafeOutput(result);
});

test('queryExecutor option has priority over executor for direct execution function', async () => {
  const calls = [];
  const result = await executeDataCorrectionPersistenceQuery(input('audit'), {
    allowNonExecutableForTest: true,
    executor(querySpec) {
      calls.push(`executor:${querySpec.recordType}`);
      return { ok: false };
    },
    queryExecutor(querySpec) {
      calls.push(`queryExecutor:${querySpec.recordType}`);
      return { ok: true };
    },
  });

  assert.deepEqual(result, {
    ok: true,
    persisted: true,
    writerType: 'audit',
    recordType: 'audit',
  });
  assert.deepEqual(calls, ['queryExecutor:audit']);
});

test('object executor .execute() success returns safe persisted result', async () => {
  const executor = {
    callCount: 0,
    execute(querySpec) {
      this.callCount += 1;
      assert.equal(querySpec.recordType, 'dispatch_note');
      return { ok: true };
    },
  };
  const before = executor.callCount;
  const result = await executeDataCorrectionPersistenceQuery(input('dispatch_note'), {
    allowNonExecutableForTest: true,
    executor,
  });

  assert.deepEqual(result, {
    ok: true,
    persisted: true,
    writerType: 'dispatch_note',
    recordType: 'dispatch_note',
  });
  assert.equal(before, 0);
  assert.equal(executor.callCount, 1);
});

test('executor throw returns safe failure and does not leak raw error', async () => {
  const result = await executeDataCorrectionPersistenceQuery(input('audit'), {
    allowNonExecutableForTest: true,
    executor() {
      throw new Error('token_should_not_leak DATABASE_URL_should_not_leak');
    },
  });

  assert.deepEqual(result, {
    ok: false,
    persisted: false,
    writerType: 'audit',
    recordType: 'audit',
    reasonCode: 'EXECUTOR_FAILED',
  });
  assertSafeOutput(result);
});

test('executor malformed result fail-closes', async () => {
  const result = await executeDataCorrectionPersistenceQuery(input('audit'), {
    allowNonExecutableForTest: true,
    executor() {
      return {
        ok: false,
        rawPhone: 'raw_phone_should_not_leak',
      };
    },
  });

  assert.deepEqual(result, {
    ok: false,
    persisted: false,
    writerType: 'audit',
    recordType: 'audit',
    reasonCode: 'EXECUTOR_RESULT_MALFORMED',
  });
  assertSafeOutput(result);
});

test('executor receives static parameterized query spec without raw SQL interpolation', async () => {
  let capturedSpec;
  const result = await executeDataCorrectionPersistenceQuery(input('audit', unsafeFields()), {
    allowNonExecutableForTest: true,
    executor(querySpec) {
      capturedSpec = querySpec;
      return { ok: true };
    },
  });

  assert.equal(result.ok, true);
  assert.equal(capturedSpec.name, 'dataCorrectionPersistenceInsert');
  assert.equal(capturedSpec.recordType, 'audit');
  assert.equal(capturedSpec.tableHint, 'data_correction_audit_events');
  assert.deepEqual(capturedSpec.fields, [
    'organization_id',
    'case_id',
    'appointment_id',
    'actor_user_id',
    'actor_role',
    'action_type',
    'decision',
    'reason_code',
    'safe_message_key',
    'occurred_at',
    'record_type',
    'safe_metadata',
  ]);
  assert.equal(capturedSpec.fields.length, capturedSpec.values.length);
  assert.equal(capturedSpec.params.length, capturedSpec.values.length);
  assert.match(capturedSpec.sql, /^INSERT INTO data_correction_audit_events/);
  assert.equal(capturedSpec.sql.includes('org_data_correction_query_executor_001'), false);
  assert.equal(capturedSpec.sql.includes('case_data_correction_query_executor_001'), false);
  assertSafeOutput(capturedSpec);
});

test('input object is not mutated', async () => {
  const request = input('audit', unsafeFields());
  const before = clone(request);

  await executeDataCorrectionPersistenceQuery(request, {
    allowNonExecutableForTest: true,
    executor() {
      return { ok: true };
    },
  });

  assert.deepEqual(request, before);
});

test('executor object is not mutated by adapter setup', async () => {
  const executor = {
    marker: 'unchanged',
    execute() {
      return { ok: true };
    },
  };
  const before = { marker: executor.marker, keys: Object.keys(executor) };

  await executeDataCorrectionPersistenceQuery(input('audit'), {
    allowNonExecutableForTest: true,
    executor,
  });

  assert.deepEqual({ marker: executor.marker, keys: Object.keys(executor) }, before);
});

test('query spec passed to executor is isolated from adapter internals', async () => {
  let capturedSpec;
  let mutationRejected = false;
  const result = await executeDataCorrectionPersistenceQuery(input('audit'), {
    allowNonExecutableForTest: true,
    executor(querySpec) {
      capturedSpec = querySpec;
      try {
        querySpec.values.push('mutated_value_should_not_leak');
      } catch (error) {
        mutationRejected = true;
      }
      return { ok: true };
    },
  });

  assert.deepEqual(result, {
    ok: true,
    persisted: true,
    writerType: 'audit',
    recordType: 'audit',
  });
  assert.equal(mutationRejected, true);
  assert.equal(capturedSpec.values.includes('mutated_value_should_not_leak'), false);
});

test('created executor reuses injected executor and runtime options can override it', async () => {
  const calls = [];
  const defaultExecutor = createDataCorrectionPersistenceQueryExecutor({
    allowNonExecutableForTest: true,
    executor(querySpec) {
      calls.push(`default:${querySpec.recordType}`);
      return { ok: true };
    },
  });

  const defaultResult = await defaultExecutor(input('audit'));
  const overrideResult = await defaultExecutor(input('evidence'), {
    executor(querySpec) {
      calls.push(`override:${querySpec.recordType}`);
      return { ok: true };
    },
  });

  assert.equal(defaultResult.ok, true);
  assert.equal(overrideResult.ok, true);
  assert.deepEqual(calls, ['default:audit', 'override:evidence']);
});

test('created executor supports queryExecutor default and runtime override aliases', async () => {
  const calls = [];
  const defaultExecutor = createDataCorrectionPersistenceQueryExecutor({
    allowNonExecutableForTest: true,
    queryExecutor(querySpec) {
      calls.push(`default:${querySpec.recordType}`);
      return { ok: true };
    },
  });

  const defaultResult = await defaultExecutor(input('audit'));
  const overrideResult = await defaultExecutor(input('evidence'), {
    queryExecutor(querySpec) {
      calls.push(`override:${querySpec.recordType}`);
      return { ok: true };
    },
  });

  assert.equal(defaultResult.ok, true);
  assert.equal(overrideResult.ok, true);
  assert.deepEqual(calls, ['default:audit', 'override:evidence']);
});

test('created executor gives queryExecutor priority over executor defaults and runtime overrides', async () => {
  const calls = [];
  const defaultExecutor = createDataCorrectionPersistenceQueryExecutor({
    allowNonExecutableForTest: true,
    executor(querySpec) {
      calls.push(`defaultExecutor:${querySpec.recordType}`);
      return { ok: false };
    },
    queryExecutor(querySpec) {
      calls.push(`defaultQueryExecutor:${querySpec.recordType}`);
      return { ok: true };
    },
  });

  const defaultResult = await defaultExecutor(input('audit'));
  const overrideResult = await defaultExecutor(input('evidence'), {
    executor(querySpec) {
      calls.push(`overrideExecutor:${querySpec.recordType}`);
      return { ok: false };
    },
    queryExecutor(querySpec) {
      calls.push(`overrideQueryExecutor:${querySpec.recordType}`);
      return { ok: true };
    },
  });

  assert.equal(defaultResult.ok, true);
  assert.equal(overrideResult.ok, true);
  assert.deepEqual(calls, [
    'defaultQueryExecutor:audit',
    'overrideQueryExecutor:evidence',
  ]);
});

test('no logging side effects', async () => {
  const capturedConsole = captureConsoleCalls();

  try {
    await executeDataCorrectionPersistenceQuery(input('audit'), {
      allowNonExecutableForTest: true,
      executor() {
        return { ok: true };
      },
    });
  } finally {
    capturedConsole.restore();
  }

  assert.deepEqual(capturedConsole.calls, []);
});

test('module import boundary avoids DB repository provider AI route controller app server imports', () => {
  const source = fs.readFileSync(executorFile, 'utf8');
  const specifiers = requireSpecifiers(source);
  const unexpectedSpecifiers = specifiers.filter((specifier) => (
    specifier !== './dataCorrectionPersistenceRecordMapper'
  ));

  assert.deepEqual(specifiers, ['./dataCorrectionPersistenceRecordMapper']);
  assert.equal(unexpectedSpecifiers.some((specifier) => (
    /(db|pool|repositories?|services?|providers?|ai|rag|vector|openai|routes?|controllers?|app|server)/i
      .test(specifier)
  )), false);
  assert.doesNotMatch(source, /process\.env|console\.(log|info|warn|error|debug)/);
});
