'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  callInjectedDecisionAuditWriter,
  callInjectedDecisionAuditWriterAsync,
  resolveInjectedDecisionAuditWriter,
} = require('../../src/dataCorrection/dataCorrectionDecisionAuditWriterInvocation');

const repoRoot = path.resolve(__dirname, '../..');

const UNSAFE_VALUES = Object.freeze([
  '0912-345-678',
  'raw address should not leak',
  'LINE-RAW-USER-ID',
  'token-value',
  'secret-value',
  'postgres://unsafe',
  'SELECT * FROM unsafe',
  'Error: unsafe stack',
  'apt_final_unsafe_001',
  'fsr_unsafe_001',
  'report_unsafe_001',
  'internal note should not leak',
  'ai raw payload should not leak',
  'billing internal should not leak',
  'settlement internal should not leak',
  'full payload should not leak',
  'writer raw detail should not leak',
]);

const UNSAFE_KEYS = Object.freeze([
  'rawPhone',
  'rawAddress',
  'rawLineUserId',
  'token',
  'secret',
  'dbUrl',
  'sql',
  'stack',
  'finalAppointmentId',
  'fieldServiceReportId',
  'reportId',
  'internalNote',
  'aiRawPayload',
  'billingInternalData',
  'settlementInternalData',
  'fullPayload',
  'rawWriterResult',
  'writerInternals',
]);

function assertSafe(value) {
  const serialized = JSON.stringify(value);

  for (const unsafe of UNSAFE_VALUES) {
    assert.equal(serialized.includes(unsafe), false, `unsafe value leaked: ${unsafe}`);
  }

  for (const key of UNSAFE_KEYS) {
    assert.equal(serialized.includes(`"${key}"`), false, `unsafe key leaked: ${key}`);
  }

  [
    /postgres(?:ql)?:\/\/[^\s"')]+/i,
    /09\d{2}[-\s]?\d{3}[-\s]?\d{3}/,
    /SELECT\s+\*\s+FROM/i,
    /Bearer\s+[A-Za-z0-9._-]+/i,
  ].forEach((pattern) => {
    assert.equal(pattern.test(serialized), false, `unsafe pattern leaked: ${pattern}`);
  });
}

function unsafeAuditIntent() {
  return {
    organizationId: 'org_decision_audit_invocation_001',
    caseId: 'case_decision_audit_invocation_001',
    appointmentId: 'apt_decision_audit_invocation_001',
    rawPhone: '0912-345-678',
    rawAddress: 'raw address should not leak',
    rawLineUserId: 'LINE-RAW-USER-ID',
    finalAppointmentId: 'apt_final_unsafe_001',
    fieldServiceReportId: 'fsr_unsafe_001',
    reportId: 'report_unsafe_001',
    internalNote: 'internal note should not leak',
    aiRawPayload: 'ai raw payload should not leak',
    billingInternalData: 'billing internal should not leak',
    settlementInternalData: 'settlement internal should not leak',
    token: 'token-value',
    secret: 'secret-value',
    dbUrl: 'postgres://unsafe',
    sql: 'SELECT * FROM unsafe',
    stack: 'Error: unsafe stack',
    fullPayload: 'full payload should not leak',
  };
}

function unsafeWriterResult(overrides = {}) {
  return {
    ok: true,
    persisted: true,
    recorded: true,
    auditWritten: true,
    rawWriterResult: 'writer raw detail should not leak',
    writerInternals: unsafeAuditIntent(),
    ...overrides,
  };
}

function requireSpecifiers(source) {
  const specifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers.sort();
}

test('resolves only explicitly injected function or object writer', () => {
  function fnWriter() {}
  const objectWriter = {
    write() {},
  };

  assert.equal(resolveInjectedDecisionAuditWriter(undefined), null);
  assert.equal(resolveInjectedDecisionAuditWriter(null), null);
  assert.equal(resolveInjectedDecisionAuditWriter({}), null);
  assert.equal(resolveInjectedDecisionAuditWriter({ write: 'not a function' }), null);
  assert.equal(resolveInjectedDecisionAuditWriter(fnWriter), fnWriter);
  assert.equal(typeof resolveInjectedDecisionAuditWriter(objectWriter), 'function');
});

test('missing or non-function writer returns skipped without leaking audit intent', () => {
  [
    undefined,
    null,
    {},
    { write: 'not a function' },
  ].forEach((writer) => {
    const result = callInjectedDecisionAuditWriter(writer, unsafeAuditIntent());

    assert.deepEqual(result, {
      status: 'skipped',
    });
    assertSafe(result);
  });
});

test('sync writer success returns recorded and never echoes writer internals', () => {
  const calls = [];
  const result = callInjectedDecisionAuditWriter((payload) => {
    calls.push(payload);

    return unsafeWriterResult();
  }, unsafeAuditIntent());

  assert.deepEqual(result, {
    status: 'recorded',
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].organizationId, 'org_decision_audit_invocation_001');
  assertSafe(result);
});

test('sync object writer success is supported through explicit write method', () => {
  const writer = {
    calls: 0,
    write(payload) {
      this.calls += 1;
      assert.equal(payload.organizationId, 'org_decision_audit_invocation_001');

      return { auditWritten: true };
    },
  };
  const result = callInjectedDecisionAuditWriter(writer, unsafeAuditIntent());

  assert.deepEqual(result, {
    status: 'recorded',
  });
  assert.equal(writer.calls, 1);
  assertSafe(result);
});

test('failure-like writer result returns safe failed metadata', () => {
  [
    { ok: false },
    { persisted: false },
    { recorded: false },
    { auditWritten: false },
    unsafeWriterResult({ ok: false }),
  ].forEach((writerResult) => {
    const result = callInjectedDecisionAuditWriter(() => writerResult, unsafeAuditIntent());

    assert.deepEqual(result, {
      status: 'failed',
      reasonCode: 'DECISION_AUDIT_WRITER_FAILED',
      safeMessageKey: 'dataCorrection.decisionAuditWriterFailed',
    });
    assertSafe(result);
  });
});

test('sync writer throw returns safe failed metadata', () => {
  const result = callInjectedDecisionAuditWriter(() => {
    throw new Error('writer raw detail should not leak');
  }, unsafeAuditIntent());

  assert.deepEqual(result, {
    status: 'failed',
    reasonCode: 'DECISION_AUDIT_WRITER_FAILED',
    safeMessageKey: 'dataCorrection.decisionAuditWriterFailed',
  });
  assertSafe(result);
});

test('sync invocation treats promise-like writer as recorded compatibility path', async () => {
  const result = callInjectedDecisionAuditWriter(() => Promise.reject(
    new Error('writer raw detail should not leak'),
  ), unsafeAuditIntent());

  assert.deepEqual(result, {
    status: 'recorded',
  });
  assertSafe(result);

  await new Promise((resolve) => {
    setImmediate(resolve);
  });
});

test('async invocation awaits success failure and rejection safely', async () => {
  assert.deepEqual(await callInjectedDecisionAuditWriterAsync(
    async () => unsafeWriterResult(),
    unsafeAuditIntent(),
  ), {
    status: 'recorded',
  });
  assert.deepEqual(await callInjectedDecisionAuditWriterAsync(
    async () => unsafeWriterResult({ auditWritten: false }),
    unsafeAuditIntent(),
  ), {
    status: 'failed',
    reasonCode: 'DECISION_AUDIT_WRITER_FAILED',
    safeMessageKey: 'dataCorrection.decisionAuditWriterFailed',
  });
  assert.deepEqual(await callInjectedDecisionAuditWriterAsync(
    async () => {
      throw new Error('writer raw detail should not leak');
    },
    unsafeAuditIntent(),
  ), {
    status: 'failed',
    reasonCode: 'DECISION_AUDIT_WRITER_FAILED',
    safeMessageKey: 'dataCorrection.decisionAuditWriterFailed',
  });
  assertSafe(await callInjectedDecisionAuditWriterAsync(async () => unsafeWriterResult(), unsafeAuditIntent()));
});

test('helper imports only the normalizer and no side-effect runtime', () => {
  const source = fs.readFileSync(
    path.join(repoRoot, 'src/dataCorrection/dataCorrectionDecisionAuditWriterInvocation.js'),
    'utf8',
  );

  assert.deepEqual(requireSpecifiers(source), [
    './dataCorrectionDecisionAuditWriterInputBuilder',
    './dataCorrectionDecisionAuditWriterResultNormalizer',
  ]);

  [
    /process\.env/,
    /console\./,
    /fetch\(/,
    /axios/,
    /createServer/,
    /listen\s*\(/,
    /client\.query/,
    /pool\.query/,
    /INSERT\s+INTO/i,
    /UPDATE\s+/i,
    /DELETE\s+/i,
  ].forEach((pattern) => {
    assert.equal(pattern.test(source), false, `forbidden invocation helper pattern: ${pattern}`);
  });

  const forbiddenImportPattern = /(?:^|\/)(?:db|database|pg|repositories?|providers?|routes?|controllers?|ai|rag|vector|billing|settlement|admin|config|logger|permission)(?:\/|$)|transaction|line|sms|email|push|webhook|process\.env/i;

  for (const specifier of requireSpecifiers(source)) {
    assert.equal(forbiddenImportPattern.test(specifier), false, `forbidden import: ${specifier}`);
  }
});
