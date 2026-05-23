'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  DECISION_AUDIT_WRITER_RESULT_STATUSES,
  normalizeDecisionAuditWriterFailureResult,
  normalizeDecisionAuditWriterRecordedResult,
  normalizeDecisionAuditWriterResult,
  normalizeDecisionAuditWriterSkippedResult,
} = require('../../src/dataCorrection/dataCorrectionDecisionAuditWriterResultNormalizer');

const repoRoot = path.resolve(__dirname, '../..');

const UNSAFE_VALUES = Object.freeze([
  'raw writer internals should not leak',
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
]);

const UNSAFE_KEYS = Object.freeze([
  'rawWriterResult',
  'writerInternals',
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

function unsafeWriterResult(overrides = {}) {
  return {
    ok: true,
    persisted: true,
    recorded: true,
    auditWritten: true,
    rawWriterResult: 'raw writer internals should not leak',
    writerInternals: {
      rawPhone: '0912-345-678',
      rawAddress: 'raw address should not leak',
      rawLineUserId: 'LINE-RAW-USER-ID',
      token: 'token-value',
      secret: 'secret-value',
      dbUrl: 'postgres://unsafe',
      sql: 'SELECT * FROM unsafe',
      stack: 'Error: unsafe stack',
      finalAppointmentId: 'apt_final_unsafe_001',
      fieldServiceReportId: 'fsr_unsafe_001',
      reportId: 'report_unsafe_001',
      internalNote: 'internal note should not leak',
      aiRawPayload: 'ai raw payload should not leak',
      billingInternalData: 'billing internal should not leak',
      settlementInternalData: 'settlement internal should not leak',
      fullPayload: 'full payload should not leak',
    },
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

test('exports frozen status constants and safe result helpers', () => {
  assert.deepEqual(DECISION_AUDIT_WRITER_RESULT_STATUSES, {
    FAILED: 'failed',
    RECORDED: 'recorded',
    SKIPPED: 'skipped',
  });
  assert.deepEqual(normalizeDecisionAuditWriterRecordedResult(), {
    status: 'recorded',
  });
  assert.deepEqual(normalizeDecisionAuditWriterSkippedResult(), {
    status: 'skipped',
  });
  assert.deepEqual(normalizeDecisionAuditWriterFailureResult(), {
    status: 'failed',
    reasonCode: 'DECISION_AUDIT_WRITER_FAILED',
    safeMessageKey: 'dataCorrection.decisionAuditWriterFailed',
  });
  assertSafe([
    normalizeDecisionAuditWriterRecordedResult(),
    normalizeDecisionAuditWriterSkippedResult(),
    normalizeDecisionAuditWriterFailureResult(),
  ]);
});

test('success-like writer results normalize to recorded without echoing writer internals', () => {
  [
    undefined,
    null,
    true,
    'recorded',
    unsafeWriterResult(),
    { ok: true },
    { persisted: true },
    { recorded: true },
    { auditWritten: true },
    { status: 'unexpected_status', rawWriterResult: 'raw writer internals should not leak' },
  ].forEach((input) => {
    const result = normalizeDecisionAuditWriterResult(input);

    assert.deepEqual(result, {
      status: 'recorded',
    });
    assertSafe(result);
  });
});

test('writer failure flags normalize to safe failed metadata only', () => {
  [
    { ok: false },
    { persisted: false },
    { recorded: false },
    { auditWritten: false },
    unsafeWriterResult({ ok: false }),
    unsafeWriterResult({ persisted: false }),
    unsafeWriterResult({ recorded: false }),
    unsafeWriterResult({ auditWritten: false }),
  ].forEach((input) => {
    const result = normalizeDecisionAuditWriterResult(input);

    assert.deepEqual(result, {
      status: 'failed',
      reasonCode: 'DECISION_AUDIT_WRITER_FAILED',
      safeMessageKey: 'dataCorrection.decisionAuditWriterFailed',
    });
    assertSafe(result);
  });
});

test('normalizer result objects are detached safe objects', () => {
  const recorded = normalizeDecisionAuditWriterRecordedResult();
  const skipped = normalizeDecisionAuditWriterSkippedResult();
  const failed = normalizeDecisionAuditWriterFailureResult();

  recorded.status = 'mutated';
  skipped.status = 'mutated';
  failed.status = 'mutated';

  assert.deepEqual(normalizeDecisionAuditWriterRecordedResult(), {
    status: 'recorded',
  });
  assert.deepEqual(normalizeDecisionAuditWriterSkippedResult(), {
    status: 'skipped',
  });
  assert.deepEqual(normalizeDecisionAuditWriterFailureResult(), {
    status: 'failed',
    reasonCode: 'DECISION_AUDIT_WRITER_FAILED',
    safeMessageKey: 'dataCorrection.decisionAuditWriterFailed',
  });
});

test('normalizer source has no side-effect runtime imports or sensitive output patterns', () => {
  const source = fs.readFileSync(
    path.join(repoRoot, 'src/dataCorrection/dataCorrectionDecisionAuditWriterResultNormalizer.js'),
    'utf8',
  );

  assert.deepEqual(requireSpecifiers(source), []);
  [
    /process\.env/,
    /console\./,
    /require\(['"][^'"]*(?:db|database|pg|repository|provider|line|sms|webhook|email|push|ai|rag|billing|settlement|route|controller|app|server|config|logger)[^'"]*['"]\)/i,
    /fetch\(/,
    /axios/,
    /createServer/,
    /listen\s*\(/,
    /client\.query/,
    /pool\.query/,
  ].forEach((pattern) => {
    assert.equal(pattern.test(source), false, `forbidden normalizer pattern: ${pattern}`);
  });
});
