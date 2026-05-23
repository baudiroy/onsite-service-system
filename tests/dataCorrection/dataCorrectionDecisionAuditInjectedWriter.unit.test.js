'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  DATA_CORRECTION_AUDIT_ACTIONS,
  DATA_CORRECTION_AUDIT_EVENT_TYPES,
  DATA_CORRECTION_AUDIT_RESULTS,
} = require('../../src/dataCorrection/dataCorrectionDecisionAuditIntentBuilder');
const {
  CORRECTION_FIELD_GROUPS,
} = require('../../src/dataCorrection/dataCorrectionPolicyEngine');
const {
  processDataCorrectionRequest,
  processDataCorrectionRequestAsync,
} = require('../../src/dataCorrection/dataCorrectionRequestService');
const {
  applyPreDepartureCorrection,
  applyPreDepartureCorrectionAsync,
} = require('../../src/dataCorrection/preDepartureCorrectionApplicationService');

const repoRoot = path.resolve(__dirname, '../..');

const UNSAFE_VALUES = Object.freeze([
  'from value should not leak',
  'after value should not leak',
  '0912-345-678',
  'raw address should not leak',
  'LINE-RAW-USER-ID',
  'token-value',
  'secret-value',
  'postgres://unsafe',
  'Error: unsafe stack',
  'SELECT * FROM unsafe',
  'apt_final_unsafe_001',
  'fsr_unsafe_001',
  'internal note should not leak',
  'audit raw payload should not leak',
  'ai raw payload should not leak',
  'billing internal should not leak',
  'settlement internal should not leak',
  'full payload should not leak',
  'provider payload should not leak',
  'customer report should not leak',
  'file bytes should not leak',
  'decision writer raw failure should not leak',
]);

const UNSAFE_KEYS = Object.freeze([
  'fromValue',
  'toValue',
  'beforeValue',
  'afterValue',
  'rawCorrectionPayload',
  'rawPhone',
  'rawAddress',
  'rawLineUserId',
  'token',
  'secret',
  'dbUrl',
  'stack',
  'rawSql',
  'finalAppointmentId',
  'fieldServiceReportId',
  'reportId',
  'internalNote',
  'auditRawPayload',
  'aiRawPayload',
  'billingInternalData',
  'settlementInternalData',
  'fullPayload',
  'providerPayload',
  'customerVisibleReportBody',
  'photoContents',
  'signatureContents',
  'fileContents',
]);

function baseInput(overrides = {}) {
  return {
    organizationId: 'org_decision_audit_injected_001',
    timestamp: '2026-05-22T12:00:00.000Z',
    actor: {
      userId: 'user_decision_audit_injected_001',
      role: 'dispatch_assistant',
      permissions: ['data_correction.request', 'data_correction.apply'],
    },
    caseContext: {
      caseId: 'case_decision_audit_injected_001',
      organizationId: 'org_decision_audit_injected_001',
    },
    appointmentContext: {
      appointmentId: 'appt_decision_audit_injected_001',
      arrived: false,
      engineerDeparted: false,
      engineerReceivedTask: false,
      routeStarted: false,
    },
    correction: {
      fieldGroup: CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL,
      fieldKey: 'issueSummary',
      fromValue: 'from value should not leak',
      toValue: 'safe issue summary',
      beforeValue: 'from value should not leak',
      afterValue: 'after value should not leak',
      rawCorrectionPayload: 'raw correction payload should not leak',
      rawPhone: '0912-345-678',
      rawAddress: 'raw address should not leak',
      rawLineUserId: 'LINE-RAW-USER-ID',
      internalNote: 'internal note should not leak',
      auditRawPayload: 'audit raw payload should not leak',
      aiRawPayload: 'ai raw payload should not leak',
      billingInternalData: 'billing internal should not leak',
      settlementInternalData: 'settlement internal should not leak',
      finalAppointmentId: 'apt_final_unsafe_001',
      fieldServiceReportId: 'fsr_unsafe_001',
    },
    fullPayload: 'full payload should not leak',
    providerPayload: 'provider payload should not leak',
    customerVisibleReportBody: 'customer report should not leak',
    photoContents: 'file bytes should not leak',
    signatureContents: 'file bytes should not leak',
    fileContents: 'file bytes should not leak',
    token: 'token-value',
    secret: 'secret-value',
    dbUrl: 'postgres://unsafe',
    stack: 'Error: unsafe stack',
    rawSql: 'SELECT * FROM unsafe',
    ...overrides,
  };
}

function createDecisionAuditWriter(calls, result) {
  const safeCalls = Array.isArray(calls) ? calls : [];

  return function decisionAuditWriter(payload) {
    safeCalls.push(payload);

    return result;
  };
}

function createCorrectionWriter(calls, result) {
  const safeCalls = Array.isArray(calls) ? calls : [];

  return function correctionWriter(payload) {
    safeCalls.push(payload);

    return result;
  };
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
    /Bearer\s+[A-Za-z0-9._-]+/i,
    /09\d{2}[-\s]?\d{3}[-\s]?\d{3}/,
    /SELECT\s+\*\s+FROM/i,
  ].forEach((pattern) => {
    assert.equal(pattern.test(serialized), false, `unsafe pattern leaked: ${pattern}`);
  });
}

function assertSafeRequestIntent(payload, expectedEventType) {
  assert.equal(payload.action, DATA_CORRECTION_AUDIT_ACTIONS.REQUEST);
  assert.equal(payload.eventType, expectedEventType);
  assert.equal(payload.auditWritten, false);
  assert.equal(payload.organizationId, 'org_decision_audit_injected_001');
  assert.equal(payload.caseId, 'case_decision_audit_injected_001');
  assert.equal(payload.appointmentId, 'appt_decision_audit_injected_001');
  assert.equal(payload.actorId, 'user_decision_audit_injected_001');
  assert.equal(payload.actorRole, 'dispatch_assistant');
  assert.equal(payload.fieldKey, 'issueSummary');
  assert.equal(payload.fieldGroup, CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL);
  assertSafe(payload);
}

function assertSafeApplyIntent(payload, expectedEventType) {
  assert.equal(payload.action, DATA_CORRECTION_AUDIT_ACTIONS.APPLY);
  assert.equal(payload.eventType, expectedEventType);
  assert.equal(payload.auditWritten, false);
  assert.equal(payload.organizationId, 'org_decision_audit_injected_001');
  assert.equal(payload.caseId, 'case_decision_audit_injected_001');
  assert.equal(payload.appointmentId, 'appt_decision_audit_injected_001');
  assert.equal(payload.actorId, 'user_decision_audit_injected_001');
  assert.equal(payload.actorRole, 'dispatch_assistant');
  assert.equal(payload.fieldKey, 'issueSummary');
  assert.equal(payload.fieldGroup, CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL);
  assertSafe(payload);
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

test('default request and apply shapes remain unchanged without decisionAuditWriter', () => {
  const request = processDataCorrectionRequest(baseInput());
  const apply = applyPreDepartureCorrection(baseInput(), {
    correctionWriter: createCorrectionWriter([]),
  });

  assert.equal(request.auditIntent, undefined);
  assert.equal(request.decisionAuditWriterResult, undefined);
  assert.equal(request.response, undefined);
  assert.equal(request.allowed, true);
  assert.equal(apply.auditIntent, undefined);
  assert.equal(apply.decisionAuditWriterResult, undefined);
  assert.equal(apply.response, undefined);
  assert.equal(apply.correctionApplied, true);
  assertSafe([request, apply]);
});

test('request service calls explicitly injected decisionAuditWriter without changing default public shape', () => {
  const auditCalls = [];
  const result = processDataCorrectionRequest(baseInput(), {
    decisionAuditWriter: createDecisionAuditWriter(auditCalls),
  });

  assert.equal(result.auditIntent, undefined);
  assert.equal(result.decisionAuditWriterResult, undefined);
  assert.equal(result.response, undefined);
  assert.equal(result.allowed, true);
  assert.equal(auditCalls.length, 1);
  assertSafeRequestIntent(auditCalls[0], DATA_CORRECTION_AUDIT_EVENT_TYPES.REQUEST_ACCEPTED);
  assertSafe([result, auditCalls]);
});

test('request side-channel exposes only safe writer result when explicitly requested', () => {
  const auditCalls = [];
  const result = processDataCorrectionRequest(baseInput(), {
    decisionAuditWriter: createDecisionAuditWriter(auditCalls, { ok: true, persisted: true }),
    includeDecisionAuditIntent: true,
  });

  assert.equal(result.response.allowed, true);
  assert.equal(result.auditIntent.eventType, DATA_CORRECTION_AUDIT_EVENT_TYPES.REQUEST_ACCEPTED);
  assert.deepEqual(result.decisionAuditWriterResult, {
    status: 'recorded',
  });
  assert.equal(auditCalls.length, 1);
  assertSafeRequestIntent(auditCalls[0], DATA_CORRECTION_AUDIT_EVENT_TYPES.REQUEST_ACCEPTED);
  assertSafe(result);
});

test('request decisionAuditWriter failure is safe internal metadata and does not change request outcome', () => {
  const auditCalls = [];
  const result = processDataCorrectionRequest(baseInput(), {
    decisionAuditWriter: createDecisionAuditWriter(auditCalls, {
      ok: false,
      persisted: false,
      error: 'decision writer raw failure should not leak',
    }),
    includeDecisionAuditIntent: true,
  });

  assert.equal(result.response.status, 'allowed');
  assert.equal(result.response.allowed, true);
  assert.deepEqual(result.decisionAuditWriterResult, {
    status: 'failed',
    reasonCode: 'DECISION_AUDIT_WRITER_FAILED',
    safeMessageKey: 'dataCorrection.decisionAuditWriterFailed',
  });
  assert.equal(auditCalls.length, 1);
  assertSafe([result, auditCalls]);
});

test('async request service awaits explicitly injected decisionAuditWriter', async () => {
  const auditCalls = [];
  const result = await processDataCorrectionRequestAsync(baseInput(), {
    decisionAuditWriter: async (payload) => {
      auditCalls.push(payload);

      return { ok: true, auditWritten: true };
    },
    includeDecisionAuditIntent: true,
  });

  assert.equal(result.response.allowed, true);
  assert.deepEqual(result.decisionAuditWriterResult, {
    status: 'recorded',
  });
  assert.equal(auditCalls.length, 1);
  assertSafeRequestIntent(auditCalls[0], DATA_CORRECTION_AUDIT_EVENT_TYPES.REQUEST_ACCEPTED);
  assertSafe(result);
});

test('apply service calls decisionAuditWriter for successful apply without changing correction outcome', () => {
  const auditCalls = [];
  const correctionCalls = [];
  const result = applyPreDepartureCorrection(baseInput(), {
    correctionWriter: createCorrectionWriter(correctionCalls, { ok: true }),
    decisionAuditWriter: createDecisionAuditWriter(auditCalls, { ok: true, persisted: true }),
    includeDecisionAuditIntent: true,
  });

  assert.equal(result.response.status, 'applied');
  assert.equal(result.response.correctionApplied, true);
  assert.equal(result.auditIntent.eventType, DATA_CORRECTION_AUDIT_EVENT_TYPES.APPLY_ALLOWED);
  assert.equal(result.auditIntent.resultStatus, DATA_CORRECTION_AUDIT_RESULTS.ALLOWED);
  assert.deepEqual(result.decisionAuditWriterResult, {
    status: 'recorded',
  });
  assert.equal(correctionCalls.length, 1);
  assert.equal(auditCalls.length, 1);
  assertSafeApplyIntent(auditCalls[0], DATA_CORRECTION_AUDIT_EVENT_TYPES.APPLY_ALLOWED);
  assertSafe([result, auditCalls]);
});

test('apply decisionAuditWriter failure does not change official correction application result', () => {
  const auditCalls = [];
  const correctionCalls = [];
  const result = applyPreDepartureCorrection(baseInput(), {
    correctionWriter: createCorrectionWriter(correctionCalls, { ok: true }),
    decisionAuditWriter: createDecisionAuditWriter(auditCalls, {
      ok: false,
      persisted: false,
      error: 'decision writer raw failure should not leak',
    }),
    includeDecisionAuditIntent: true,
  });

  assert.equal(result.response.status, 'applied');
  assert.equal(result.response.correctionApplied, true);
  assert.equal(correctionCalls.length, 1);
  assert.equal(auditCalls.length, 1);
  assert.deepEqual(result.decisionAuditWriterResult, {
    status: 'failed',
    reasonCode: 'DECISION_AUDIT_WRITER_FAILED',
    safeMessageKey: 'dataCorrection.decisionAuditWriterFailed',
  });
  assertSafe([result, auditCalls]);
});

test('apply writer receives validation failed intent without changing blocked response', () => {
  const auditCalls = [];
  const result = applyPreDepartureCorrection(baseInput({
    correction: {
      fieldGroup: CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL,
      fieldKey: 'issueSummary',
      toValue: '0912345678',
    },
  }), {
    decisionAuditWriter: createDecisionAuditWriter(auditCalls, { ok: true }),
    includeDecisionAuditIntent: true,
  });

  assert.equal(result.response.status, 'blocked');
  assert.equal(result.response.correctionApplied, false);
  assert.equal(result.auditIntent.eventType, DATA_CORRECTION_AUDIT_EVENT_TYPES.APPLY_VALIDATION_FAILED);
  assert.equal(auditCalls.length, 1);
  assertSafeApplyIntent(auditCalls[0], DATA_CORRECTION_AUDIT_EVENT_TYPES.APPLY_VALIDATION_FAILED);
  assertSafe([result, auditCalls]);
});

test('async apply service awaits decisionAuditWriter and keeps official outcome independent', async () => {
  const auditCalls = [];
  const correctionCalls = [];
  const result = await applyPreDepartureCorrectionAsync(baseInput(), {
    correctionWriter: async (payload) => {
      correctionCalls.push(payload);

      return { ok: true };
    },
    decisionAuditWriter: async (payload) => {
      auditCalls.push(payload);

      return { ok: true, persisted: true };
    },
    includeDecisionAuditIntent: true,
  });

  assert.equal(result.response.status, 'applied');
  assert.equal(result.response.correctionApplied, true);
  assert.deepEqual(result.decisionAuditWriterResult, {
    status: 'recorded',
  });
  assert.equal(correctionCalls.length, 1);
  assert.equal(auditCalls.length, 1);
  assertSafeApplyIntent(auditCalls[0], DATA_CORRECTION_AUDIT_EVENT_TYPES.APPLY_ALLOWED);
  assertSafe([result, auditCalls]);
});

test('decision audit service path imports no repository DB provider AI API app billing settlement or permission runtime', () => {
  const requestSource = fs.readFileSync(path.join(repoRoot, 'src/dataCorrection/dataCorrectionRequestService.js'), 'utf8');
  const applySource = fs.readFileSync(path.join(repoRoot, 'src/dataCorrection/preDepartureCorrectionApplicationService.js'), 'utf8');
  const combined = `${requestSource}\n${applySource}`;

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
    /require\(['"][^'"]*(?:db|database|pool|pg|repository|config|env|provider|line|sms|webhook|email|push|ai|rag|billing|settlement|permission|route|controller|app|server|FieldServiceReport|AppointmentService|CaseService)[^'"]*['"]\)/i,
    /process\.env/,
    /console\./,
    /fetch\(/,
    /axios/,
    /createServer/,
    /app\.listen/,
    /new\s+Pool/,
    /pool\.query/,
    /client\.query/,
  ].forEach((pattern) => {
    assert.equal(pattern.test(combined), false, `forbidden service pattern: ${pattern}`);
  });
});

test('Task887 unit test imports only services and safe constants', () => {
  const imports = requireSpecifiers(fs.readFileSync(__filename, 'utf8'));

  assert.deepEqual(imports, [
    '../../src/dataCorrection/dataCorrectionDecisionAuditIntentBuilder',
    '../../src/dataCorrection/dataCorrectionPolicyEngine',
    '../../src/dataCorrection/dataCorrectionRequestService',
    '../../src/dataCorrection/preDepartureCorrectionApplicationService',
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ].sort());
});
