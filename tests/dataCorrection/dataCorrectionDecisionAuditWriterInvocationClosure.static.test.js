'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  callInjectedDecisionAuditWriter,
  callInjectedDecisionAuditWriterAsync,
} = require('../../src/dataCorrection/dataCorrectionDecisionAuditWriterInvocation');
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
  inputBuilder: 'src/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilder.js',
  helper: 'src/dataCorrection/dataCorrectionDecisionAuditWriterInvocation.js',
  normalizer: 'src/dataCorrection/dataCorrectionDecisionAuditWriterResultNormalizer.js',
  requestService: 'src/dataCorrection/dataCorrectionRequestService.js',
  applyService: 'src/dataCorrection/preDepartureCorrectionApplicationService.js',
  route: 'src/routes/dataCorrectionRoutes.js',
  controller: 'src/controllers/dataCorrectionController.js',
  task900Doc: 'docs/task-900-data-correction-decision-audit-writer-result-normalizer-no-db-no-api-shape-change.md',
  task901Doc: 'docs/task-901-data-correction-decision-audit-writer-result-normalizer-closure-guard-no-db-no-api-shape-change.md',
  task902UnitTest: 'tests/dataCorrection/dataCorrectionDecisionAuditWriterInvocation.unit.test.js',
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
    organizationId: 'org_decision_audit_invocation_closure_001',
    timestamp: '2026-05-22T12:00:00.000Z',
    actor: {
      userId: 'user_decision_audit_invocation_closure_001',
      role: 'dispatch_assistant',
      permissions: ['data_correction.request', 'data_correction.apply'],
    },
    caseContext: {
      caseId: 'case_decision_audit_invocation_closure_001',
      organizationId: 'org_decision_audit_invocation_closure_001',
    },
    appointmentContext: {
      appointmentId: 'apt_decision_audit_invocation_closure_001',
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
    writerInternals: baseInput(),
    ...overrides,
  };
}

test('Task900 through Task902 evidence files exist before invocation closure', () => {
  [
    FILES.helper,
    FILES.inputBuilder,
    FILES.normalizer,
    FILES.task900Doc,
    FILES.task901Doc,
    FILES.task902UnitTest,
  ].forEach((relativePath) => {
    assert.equal(exists(relativePath), true, `${relativePath} is missing`);
  });
});

test('invocation helper imports only the pure normalizer and no side-effect runtime', () => {
  const source = read(FILES.helper);

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
    assert.equal(pattern.test(source), false, `forbidden helper source pattern: ${pattern}`);
  });

  const forbiddenImportPattern = /(?:^|\/)(?:db|database|pg|repositories?|providers?|routes?|controllers?|ai|rag|vector|billing|settlement|admin|config|logger|permission)(?:\/|$)|transaction|line|sms|email|push|webhook|process\.env/i;

  for (const specifier of requireSpecifiers(source)) {
    assert.equal(forbiddenImportPattern.test(specifier), false, `forbidden import: ${specifier}`);
  }
});

test('request and apply services delegate decision audit writer invocation to helper', () => {
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
    assert.doesNotMatch(source, /process\.env|client\.query|pool\.query|INSERT\s+INTO|UPDATE\s+|DELETE\s+/i);
  });
});

test('helper normalizes missing non-function success failure throw and async rejection safely', async () => {
  const results = [
    callInjectedDecisionAuditWriter(undefined, baseInput()),
    callInjectedDecisionAuditWriter({ write: 'not a function' }, baseInput()),
    callInjectedDecisionAuditWriter(() => unsafeWriterResult(), baseInput()),
    callInjectedDecisionAuditWriter(() => unsafeWriterResult({ auditWritten: false }), baseInput()),
    callInjectedDecisionAuditWriter(() => {
      throw new Error('writer raw detail should not leak');
    }, baseInput()),
    await callInjectedDecisionAuditWriterAsync(async () => unsafeWriterResult(), baseInput()),
    await callInjectedDecisionAuditWriterAsync(async () => unsafeWriterResult({ ok: false }), baseInput()),
    await callInjectedDecisionAuditWriterAsync(async () => {
      throw new Error('writer raw detail should not leak');
    }, baseInput()),
  ];

  assert.deepEqual(results.map((result) => result.status), [
    'skipped',
    'skipped',
    'recorded',
    'failed',
    'failed',
    'recorded',
    'failed',
    'failed',
  ]);
  results.forEach(assertSafe);
});

test('default response shape remains closed and writer result does not alter request/apply outcome', () => {
  const requestDefault = processDataCorrectionRequest(baseInput());
  const requestFailed = processDataCorrectionRequest(baseInput(), {
    decisionAuditWriter: () => unsafeWriterResult({ ok: false }),
    includeDecisionAuditIntent: true,
  });
  const applyDefault = applyPreDepartureCorrection(baseInput(), {
    correctionWriter() {},
  });
  const applyFailed = applyPreDepartureCorrection(baseInput(), {
    correctionWriter() {},
    decisionAuditWriter: () => unsafeWriterResult({ ok: false }),
    includeDecisionAuditIntent: true,
  });

  assert.equal(requestDefault.auditIntent, undefined);
  assert.equal(requestDefault.decisionAuditWriterResult, undefined);
  assert.equal(requestDefault.response, undefined);
  assert.equal(requestDefault.allowed, true);
  assert.equal(requestFailed.response.allowed, true);
  assert.equal(requestFailed.decisionAuditWriterResult.status, 'failed');
  assert.equal(applyDefault.auditIntent, undefined);
  assert.equal(applyDefault.decisionAuditWriterResult, undefined);
  assert.equal(applyDefault.response, undefined);
  assert.equal(applyDefault.correctionApplied, true);
  assert.equal(applyFailed.response.correctionApplied, true);
  assert.equal(applyFailed.decisionAuditWriterResult.status, 'failed');
  assertSafe([requestDefault, requestFailed, applyDefault, applyFailed]);
});

test('data correction request remains non-applying and route/controller expose no side-channel fields', () => {
  let correctionWriterCalls = 0;
  const request = processDataCorrectionRequest(baseInput(), {
    correctionWriter() {
      correctionWriterCalls += 1;
    },
    decisionAuditWriter: () => unsafeWriterResult(),
    includeDecisionAuditIntent: true,
  });

  assert.equal(request.response.allowed, true);
  assert.equal(request.correctionApplied, undefined);
  assert.equal(correctionWriterCalls, 0);
  assertSafe(request);

  for (const relativePath of [FILES.route, FILES.controller]) {
    const source = read(relativePath);

    assert.doesNotMatch(source, /includeDecisionAuditIntent/);
    assert.doesNotMatch(source, /includeAuditIntent/);
    assert.doesNotMatch(source, /auditIntent/);
    assert.doesNotMatch(source, /decisionAuditWriterResult/);
    assert.doesNotMatch(source, /dataCorrectionDecisionAuditWriterInvocation/);
  }
});
