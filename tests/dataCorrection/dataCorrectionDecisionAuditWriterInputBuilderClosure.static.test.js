'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  buildDataCorrectionDecisionAuditWriterInput,
} = require('../../src/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilder');
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
  builder: 'src/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilder.js',
  helper: 'src/dataCorrection/dataCorrectionDecisionAuditWriterInvocation.js',
  requestService: 'src/dataCorrection/dataCorrectionRequestService.js',
  applyService: 'src/dataCorrection/preDepartureCorrectionApplicationService.js',
  route: 'src/routes/dataCorrectionRoutes.js',
  controller: 'src/controllers/dataCorrectionController.js',
  task902Doc: 'docs/task-902-data-correction-decision-audit-writer-invocation-boundary-helper-no-db-no-api-shape-change.md',
  task903Doc: 'docs/task-903-data-correction-decision-audit-writer-input-builder-sensitive-field-exclusion-no-db-no-api-shape-change.md',
  unitTest: 'tests/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilder.unit.test.js',
});

const UNSAFE_VALUES = Object.freeze([
  'before value should not leak',
  'after value should not leak',
  '0912-345-678',
  'raw address should not leak',
  'LINE-RAW-USER-ID',
  'token-value',
  'secret-value',
  'password-value',
  'api-key-value',
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
  'phone',
  'mobile',
  'tel',
  'rawPhone',
  'rawAddress',
  'address',
  'rawLineUserId',
  'line_user_id',
  'lineUserId',
  'token',
  'secret',
  'password',
  'apiKey',
  'dbUrl',
  'connectionString',
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
  'rawPayload',
  'rawWriterResult',
  'writerInternals',
]);

function filePath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(filePath(relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(filePath(relativePath));
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
    organizationId: 'org_decision_audit_input_closure_001',
    timestamp: '2026-05-22T12:00:00.000Z',
    actor: {
      userId: 'user_decision_audit_input_closure_001',
      role: 'dispatch_assistant',
      permissions: ['data_correction.request', 'data_correction.apply'],
    },
    caseContext: {
      caseId: 'case_decision_audit_input_closure_001',
      organizationId: 'org_decision_audit_input_closure_001',
    },
    appointmentContext: {
      appointmentId: 'apt_decision_audit_input_closure_001',
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
    phone: '0912-345-678',
    address: 'raw address should not leak',
    lineUserId: 'LINE-RAW-USER-ID',
    fullPayload: 'full payload should not leak',
    rawPayload: 'full payload should not leak',
    token: 'token-value',
    secret: 'secret-value',
    password: 'password-value',
    apiKey: 'api-key-value',
    dbUrl: 'postgres://unsafe',
    connectionString: 'postgres://unsafe',
    rawSql: 'SELECT * FROM unsafe',
    stack: 'Error: unsafe stack',
    ...overrides,
  };
}

function unsafeAuditIntent(overrides = {}) {
  return {
    action: 'pre_departure_apply',
    auditWritten: false,
    eventType: 'data_correction_apply_allowed',
    organizationId: 'org_decision_audit_input_closure_001',
    resultStatus: 'allowed',
    actorId: 'user_decision_audit_input_closure_001',
    actorRole: 'dispatch_assistant',
    caseId: 'case_decision_audit_input_closure_001',
    appointmentId: 'apt_decision_audit_input_closure_001',
    fieldKey: 'issueSummary',
    fieldGroup: CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL,
    decision: 'allow_pre_departure_correction',
    reasonCode: 'PRE_DEPARTURE_CORRECTION_ALLOWED',
    safeMessageKey: 'dataCorrection.allowed',
    timestamp: '2026-05-22T12:00:00.000Z',
    requestId: 'req_decision_audit_input_closure_001',
    rawPhone: '0912-345-678',
    rawAddress: 'raw address should not leak',
    lineUserId: 'LINE-RAW-USER-ID',
    finalAppointmentId: 'apt_final_unsafe_001',
    fieldServiceReportId: 'fsr_unsafe_001',
    reportId: 'report_unsafe_001',
    rawPayload: {
      fullPayload: 'full payload should not leak',
      token: 'token-value',
    },
    internalNote: 'internal note should not leak',
    aiRawPayload: 'ai raw payload should not leak',
    billingInternalData: 'billing internal should not leak',
    settlementInternalData: 'settlement internal should not leak',
    ...overrides,
  };
}

test('Task902 and Task903 evidence files exist before input builder closure', () => {
  [
    FILES.builder,
    FILES.helper,
    FILES.task902Doc,
    FILES.task903Doc,
    FILES.unitTest,
  ].forEach((relativePath) => {
    assert.equal(exists(relativePath), true, `${relativePath} is missing`);
  });
});

test('input builder is pure and imports no side-effect runtime', () => {
  const source = read(FILES.builder);

  assert.deepEqual(requireSpecifiers(source), []);

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
    assert.equal(pattern.test(source), false, `forbidden builder source pattern: ${pattern}`);
  });
});

test('input builder keeps safe metadata and excludes sensitive top-level and nested fields', () => {
  const result = buildDataCorrectionDecisionAuditWriterInput(unsafeAuditIntent());

  assert.deepEqual(result, {
    action: 'pre_departure_apply',
    actorId: 'user_decision_audit_input_closure_001',
    actorRole: 'dispatch_assistant',
    appointmentId: 'apt_decision_audit_input_closure_001',
    caseId: 'case_decision_audit_input_closure_001',
    decision: 'allow_pre_departure_correction',
    eventType: 'data_correction_apply_allowed',
    fieldGroup: CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL,
    fieldKey: 'issueSummary',
    organizationId: 'org_decision_audit_input_closure_001',
    reasonCode: 'PRE_DEPARTURE_CORRECTION_ALLOWED',
    requestId: 'req_decision_audit_input_closure_001',
    resultStatus: 'allowed',
    safeMessageKey: 'dataCorrection.allowed',
    timestamp: '2026-05-22T12:00:00.000Z',
    auditWritten: false,
  });
  assertSafe(result);
});

test('invocation helper sends sanitized writer input rather than raw audit intent', async () => {
  const syncCalls = [];
  const asyncCalls = [];

  const syncResult = callInjectedDecisionAuditWriter((writerInput) => {
    syncCalls.push(writerInput);

    return { ok: true };
  }, unsafeAuditIntent());
  const asyncResult = await callInjectedDecisionAuditWriterAsync(async (writerInput) => {
    asyncCalls.push(writerInput);

    return { persisted: true };
  }, unsafeAuditIntent({
    fieldKey: 'customerPhone',
    reasonCode: 'postgres://unsafe',
  }));

  assert.deepEqual(syncResult, { status: 'recorded' });
  assert.deepEqual(asyncResult, { status: 'recorded' });
  assert.equal(syncCalls.length, 1);
  assert.equal(asyncCalls.length, 1);
  assert.equal(syncCalls[0].organizationId, 'org_decision_audit_input_closure_001');
  assert.equal(syncCalls[0].fieldKey, 'issueSummary');
  assert.equal(asyncCalls[0].fieldKey, undefined);
  assert.equal(asyncCalls[0].reasonCode, undefined);
  assertSafe([syncCalls, asyncCalls]);
});

test('request and apply services pass only sanitized decision audit writer input', () => {
  const requestCalls = [];
  const applyCalls = [];

  const request = processDataCorrectionRequest(baseInput(), {
    decisionAuditWriter: (writerInput) => {
      requestCalls.push(writerInput);

      return { recorded: true };
    },
    includeDecisionAuditIntent: true,
  });
  const apply = applyPreDepartureCorrection(baseInput(), {
    correctionWriter() {
      return { recorded: true };
    },
    decisionAuditWriter: (writerInput) => {
      applyCalls.push(writerInput);

      return { recorded: true };
    },
    includeDecisionAuditIntent: true,
  });

  assert.equal(request.response.allowed, true);
  assert.equal(apply.response.correctionApplied, true);
  assert.equal(requestCalls.length, 1);
  assert.equal(applyCalls.length, 1);
  assert.equal(requestCalls[0].action, 'data_correction_request');
  assert.equal(applyCalls[0].action, 'pre_departure_apply');
  assertSafe([requestCalls, applyCalls, request, apply]);
});

test('default public response shape remains closed and request path remains non-applying', () => {
  let correctionWriterCalls = 0;
  const requestDefault = processDataCorrectionRequest(baseInput(), {
    decisionAuditWriter: () => ({ ok: true }),
  });
  const requestOptIn = processDataCorrectionRequest(baseInput(), {
    correctionWriter() {
      correctionWriterCalls += 1;
    },
    decisionAuditWriter: () => ({ ok: true }),
    includeDecisionAuditIntent: true,
  });

  assert.equal(requestDefault.auditIntent, undefined);
  assert.equal(requestDefault.decisionAuditWriterResult, undefined);
  assert.equal(requestDefault.response, undefined);
  assert.equal(requestDefault.allowed, true);
  assert.equal(requestOptIn.response.allowed, true);
  assert.equal(requestOptIn.response.correctionApplied, undefined);
  assert.equal(correctionWriterCalls, 0);
  assertSafe([requestDefault, requestOptIn]);
});

test('source boundaries include builder but no public route/controller side-channel', () => {
  const helperSource = read(FILES.helper);

  assert.deepEqual(requireSpecifiers(helperSource), [
    './dataCorrectionDecisionAuditWriterInputBuilder',
    './dataCorrectionDecisionAuditWriterResultNormalizer',
  ]);

  for (const relativePath of [FILES.requestService, FILES.applyService]) {
    const source = read(relativePath);

    assert.match(source, /dataCorrectionDecisionAuditWriterInvocation/);
    assert.doesNotMatch(source, /rawPayload/);
    assert.doesNotMatch(source, /lineUserId/);
    assert.doesNotMatch(source, /finalAppointmentId/);
  }

  for (const relativePath of [FILES.route, FILES.controller]) {
    const source = read(relativePath);

    assert.doesNotMatch(source, /includeDecisionAuditIntent/);
    assert.doesNotMatch(source, /includeAuditIntent/);
    assert.doesNotMatch(source, /auditIntent/);
    assert.doesNotMatch(source, /decisionAuditWriterResult/);
    assert.doesNotMatch(source, /dataCorrectionDecisionAuditWriterInputBuilder/);
  }
});
