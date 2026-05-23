'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  normalizeDecisionAuditWriterFailureResult,
  normalizeDecisionAuditWriterRecordedResult,
  normalizeDecisionAuditWriterResult,
  normalizeDecisionAuditWriterSkippedResult,
} = require('../../src/dataCorrection/dataCorrectionDecisionAuditWriterResultNormalizer');
const {
  CORRECTION_FIELD_GROUPS,
} = require('../../src/dataCorrection/dataCorrectionPolicyEngine');
const {
  processDataCorrectionRequest,
} = require('../../src/dataCorrection/dataCorrectionRequestService');
const {
  applyPreDepartureCorrection,
} = require('../../src/dataCorrection/preDepartureCorrectionApplicationService');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  normalizer: 'src/dataCorrection/dataCorrectionDecisionAuditWriterResultNormalizer.js',
  requestService: 'src/dataCorrection/dataCorrectionRequestService.js',
  applyService: 'src/dataCorrection/preDepartureCorrectionApplicationService.js',
  controller: 'src/controllers/dataCorrectionController.js',
  route: 'src/routes/dataCorrectionRoutes.js',
  task900Doc: 'docs/task-900-data-correction-decision-audit-writer-result-normalizer-no-db-no-api-shape-change.md',
  task900NormalizerTest: 'tests/dataCorrection/dataCorrectionDecisionAuditWriterResultNormalizer.unit.test.js',
  task900InjectedWriterTest: 'tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriter.unit.test.js',
  task900HttpBehaviorTest: 'tests/dataCorrection/dataCorrectionDecisionAuditInjectedWriter.http-behavior.unit.test.js',
});

const UNSAFE_VALUES = Object.freeze([
  'before value should not leak',
  'after value should not leak',
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
  'audit raw payload should not leak',
  'ai raw payload should not leak',
  'billing internal should not leak',
  'settlement internal should not leak',
  'full payload should not leak',
  'writer raw detail should not leak',
]);

const UNSAFE_KEYS = Object.freeze([
  'fromValue',
  'toValue',
  'beforeValue',
  'afterValue',
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
  'auditRawPayload',
  'aiRawPayload',
  'billingInternalData',
  'settlementInternalData',
  'fullPayload',
  'rawWriterResult',
  'writerInternals',
]);

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
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

function assertContains(source, phrases) {
  for (const phrase of phrases) {
    assert.match(
      source,
      new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
      `missing phrase: ${phrase}`,
    );
  }
}

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

function baseInput(overrides = {}) {
  return {
    organizationId: 'org_decision_audit_normalizer_closure_001',
    timestamp: '2026-05-22T12:00:00.000Z',
    actor: {
      userId: 'user_decision_audit_normalizer_closure_001',
      role: 'dispatch_assistant',
      permissions: ['data_correction.request', 'data_correction.apply'],
    },
    caseContext: {
      caseId: 'case_decision_audit_normalizer_closure_001',
      organizationId: 'org_decision_audit_normalizer_closure_001',
    },
    appointmentContext: {
      appointmentId: 'apt_decision_audit_normalizer_closure_001',
      engineerReceivedTask: false,
      engineerDeparted: false,
      routeStarted: false,
      arrived: false,
    },
    correction: {
      fieldGroup: CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL,
      fieldKey: 'issueSummary',
      fromValue: 'before value should not leak',
      toValue: 'after value should not leak',
      beforeValue: 'before value should not leak',
      afterValue: 'after value should not leak',
      rawPhone: '0912-345-678',
      rawAddress: 'raw address should not leak',
      rawLineUserId: 'LINE-RAW-USER-ID',
      finalAppointmentId: 'apt_final_unsafe_001',
      fieldServiceReportId: 'fsr_unsafe_001',
      reportId: 'report_unsafe_001',
      internalNote: 'internal note should not leak',
      auditRawPayload: 'audit raw payload should not leak',
      aiRawPayload: 'ai raw payload should not leak',
      billingInternalData: 'billing internal should not leak',
      settlementInternalData: 'settlement internal should not leak',
    },
    fullPayload: 'full payload should not leak',
    token: 'token-value',
    secret: 'secret-value',
    dbUrl: 'postgres://unsafe',
    rawSql: 'SELECT * FROM unsafe',
    stack: 'Error: unsafe stack',
    ...overrides,
  };
}

function unsafeWriterResult(overrides = {}) {
  return {
    ok: true,
    persisted: true,
    recorded: true,
    auditWritten: true,
    rawWriterResult: 'writer raw detail should not leak',
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

test('Task900 evidence exists before normalizer closure guard', () => {
  [
    FILES.normalizer,
    FILES.task900Doc,
    FILES.task900NormalizerTest,
    FILES.task900InjectedWriterTest,
    FILES.task900HttpBehaviorTest,
  ].forEach((relativePath) => {
    assert.equal(exists(relativePath), true, `${relativePath} is missing`);
  });
});

test('Task900 document records accepted boundaries and verification results', () => {
  const doc = read(FILES.task900Doc);

  assertContains(doc, [
    'Status: completed',
    'No `admin/src/`, `migrations/`, package, env/config',
    'Public/default response body remains unchanged',
    'data_correction_request` remains manual-handling',
    'official correction application remains limited to valid `pre_departure_apply`',
    'Writer success/failure does not change request/apply outcome',
    'No Case / Appointment / Field Service Report / `finalAppointmentId` behavior changed',
    'node --test tests/dataCorrection/*.js`: PASS, 910 passed / 0 failed',
    'npm run check`: PASS',
    'find tests -type f -name',
    'PASS, 2790 passed / 0 failed',
    'git diff --check',
    'PASS',
  ]);
});

test('normalizer remains pure and imports no side-effect runtime', () => {
  const source = read(FILES.normalizer);

  assert.deepEqual(requireSpecifiers(source), []);

  [
    /process\.env/,
    /console\./,
    /require\(['"][^'"]*(?:db|database|pg|repository|provider|line|sms|webhook|email|push|ai|rag|billing|settlement|route|controller|app|server|config|logger|permission|audit)[^'"]*['"]\)/i,
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
    assert.equal(pattern.test(source), false, `forbidden normalizer source pattern: ${pattern}`);
  });

  assert.match(source, /normalizeDecisionAuditWriterResult/);
  assert.match(source, /normalizeDecisionAuditWriterSkippedResult/);
  assert.match(source, /normalizeDecisionAuditWriterFailureResult/);
});

test('normalizer supports success failure thrown missing skipped and malformed writer shapes safely', () => {
  const normalizedResults = [
    normalizeDecisionAuditWriterRecordedResult(),
    normalizeDecisionAuditWriterSkippedResult(),
    normalizeDecisionAuditWriterFailureResult(),
    normalizeDecisionAuditWriterResult(undefined),
    normalizeDecisionAuditWriterResult(null),
    normalizeDecisionAuditWriterResult('malformed writer result'),
    normalizeDecisionAuditWriterResult(unsafeWriterResult()),
    normalizeDecisionAuditWriterResult(unsafeWriterResult({ ok: false })),
    normalizeDecisionAuditWriterResult(unsafeWriterResult({ persisted: false })),
    normalizeDecisionAuditWriterResult(unsafeWriterResult({ recorded: false })),
    normalizeDecisionAuditWriterResult(unsafeWriterResult({ auditWritten: false })),
  ];

  assert.deepEqual(normalizedResults.slice(0, 5).map((result) => result.status), [
    'recorded',
    'skipped',
    'failed',
    'recorded',
    'recorded',
  ]);
  assert.equal(normalizedResults[5].status, 'recorded');
  assert.equal(normalizedResults[6].status, 'recorded');
  assert.deepEqual(normalizedResults.slice(7).map((result) => result.status), [
    'failed',
    'failed',
    'failed',
    'failed',
  ]);

  normalizedResults.forEach(assertSafe);
});

test('request and apply services delegate writer invocation to the dedicated helper only', () => {
  const requestSource = read(FILES.requestService);
  const applySource = read(FILES.applyService);

  assert.deepEqual(requireSpecifiers(requestSource), [
    './dataCorrectionDecisionAuditIntentBuilder',
    './dataCorrectionDecisionAuditWriterInvocation',
    './dataCorrectionPolicyEngine',
  ]);
  assert.deepEqual(requireSpecifiers(applySource), [
    './dataCorrectionDecisionAuditIntentBuilder',
    './dataCorrectionDecisionAuditWriterInvocation',
    './dataCorrectionPolicyEngine',
    './dataCorrectionRequestService',
  ]);

  [
    requestSource,
    applySource,
  ].forEach((source) => {
    assert.match(source, /callInjectedDecisionAuditWriter/);
    assert.match(source, /callInjectedDecisionAuditWriterAsync/);
    assert.doesNotMatch(source, /normalizeDecisionAuditWriterResult/);
    assert.doesNotMatch(source, /normalizeDecisionAuditWriterSkippedResult/);
    assert.doesNotMatch(source, /normalizeDecisionAuditWriterFailureResult/);
    assert.doesNotMatch(source, /require\(['"][^'"]*dataCorrectionDecisionAuditWriter['"]\)/);
    assert.doesNotMatch(source, /require\(['"][^'"]*dataCorrectionDecisionAuditRepository['"]\)/);
    assert.doesNotMatch(source, /require\(['"][^'"]*(?:db|database|pg|provider|line|sms|webhook|email|push|ai|rag|billing|settlement|config|logger)['"]\)/i);
    assert.doesNotMatch(source, /process\.env/);
    assert.doesNotMatch(source, /client\.query|pool\.query|INSERT\s+INTO|UPDATE\s+|DELETE\s+/i);
  });
});

test('default response shape remains closed and injected writer outcome does not alter request/apply decisions', () => {
  const requestDefault = processDataCorrectionRequest(baseInput());
  const requestRecorded = processDataCorrectionRequest(baseInput(), {
    decisionAuditWriter: () => unsafeWriterResult(),
    includeDecisionAuditIntent: true,
  });
  const requestFailed = processDataCorrectionRequest(baseInput(), {
    decisionAuditWriter: () => unsafeWriterResult({ ok: false }),
    includeDecisionAuditIntent: true,
  });
  const requestThrown = processDataCorrectionRequest(baseInput(), {
    decisionAuditWriter: () => {
      throw new Error('writer raw detail should not leak');
    },
    includeDecisionAuditIntent: true,
  });

  const applyDefault = applyPreDepartureCorrection(baseInput(), {
    correctionWriter() {},
  });
  const applyRecorded = applyPreDepartureCorrection(baseInput(), {
    correctionWriter() {},
    decisionAuditWriter: () => unsafeWriterResult(),
    includeDecisionAuditIntent: true,
  });
  const applyFailed = applyPreDepartureCorrection(baseInput(), {
    correctionWriter() {},
    decisionAuditWriter: () => unsafeWriterResult({ recorded: false }),
    includeDecisionAuditIntent: true,
  });
  const applyThrown = applyPreDepartureCorrection(baseInput(), {
    correctionWriter() {},
    decisionAuditWriter: () => {
      throw new Error('writer raw detail should not leak');
    },
    includeDecisionAuditIntent: true,
  });

  assert.equal(requestDefault.auditIntent, undefined);
  assert.equal(requestDefault.decisionAuditWriterResult, undefined);
  assert.equal(requestDefault.response, undefined);
  assert.equal(requestDefault.allowed, true);
  assert.equal(applyDefault.auditIntent, undefined);
  assert.equal(applyDefault.decisionAuditWriterResult, undefined);
  assert.equal(applyDefault.response, undefined);
  assert.equal(applyDefault.correctionApplied, true);

  assert.equal(requestRecorded.response.allowed, true);
  assert.equal(requestRecorded.decisionAuditWriterResult.status, 'recorded');
  assert.equal(requestFailed.response.allowed, true);
  assert.equal(requestFailed.decisionAuditWriterResult.status, 'failed');
  assert.equal(requestThrown.response.allowed, true);
  assert.equal(requestThrown.decisionAuditWriterResult.status, 'failed');
  assert.equal(applyRecorded.response.correctionApplied, true);
  assert.equal(applyRecorded.decisionAuditWriterResult.status, 'recorded');
  assert.equal(applyFailed.response.correctionApplied, true);
  assert.equal(applyFailed.decisionAuditWriterResult.status, 'failed');
  assert.equal(applyThrown.response.correctionApplied, true);
  assert.equal(applyThrown.decisionAuditWriterResult.status, 'failed');

  [
    requestDefault,
    requestRecorded,
    requestFailed,
    requestThrown,
    applyDefault,
    applyRecorded,
    applyFailed,
    applyThrown,
  ].forEach(assertSafe);
});

test('request path remains manual-handling and apply path remains explicit pre-departure only', () => {
  let correctionWriterCalls = 0;
  const request = processDataCorrectionRequest(baseInput(), {
    correctionWriter() {
      correctionWriterCalls += 1;
    },
    decisionAuditWriter: () => ({ recorded: false }),
    includeDecisionAuditIntent: true,
  });

  assert.equal(request.response.allowed, true);
  assert.equal(request.correctionApplied, undefined);
  assert.equal(correctionWriterCalls, 0);

  const apply = applyPreDepartureCorrection(baseInput(), {
    correctionWriter() {
      correctionWriterCalls += 1;
    },
    decisionAuditWriter: () => ({ recorded: false }),
    includeDecisionAuditIntent: true,
  });

  assert.equal(apply.response.correctionApplied, true);
  assert.equal(correctionWriterCalls, 1);
  assertSafe([request, apply]);
});

test('route and controller sources still do not expose audit side-channel fields publicly', () => {
  for (const relativePath of [FILES.route, FILES.controller]) {
    const source = read(relativePath);

    assert.doesNotMatch(source, /includeDecisionAuditIntent/);
    assert.doesNotMatch(source, /includeAuditIntent/);
    assert.doesNotMatch(source, /auditIntent/);
    assert.doesNotMatch(source, /decisionAuditWriterResult/);
    assert.doesNotMatch(source, /dataCorrectionDecisionAuditWriterResultNormalizer/);
  }
});
