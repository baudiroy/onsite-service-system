'use strict';

const assert = require('node:assert/strict');
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

const UNSAFE_VALUES = Object.freeze([
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
  'rawSql',
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

function baseInput(overrides = {}) {
  return {
    organizationId: 'org_decision_audit_matrix_001',
    timestamp: '2026-05-22T12:00:00.000Z',
    actor: {
      userId: 'user_decision_audit_matrix_001',
      role: 'dispatch_assistant',
      permissions: ['data_correction.request', 'data_correction.apply'],
    },
    caseContext: {
      caseId: 'case_decision_audit_matrix_001',
      organizationId: 'org_decision_audit_matrix_001',
    },
    appointmentContext: {
      appointmentId: 'apt_decision_audit_matrix_001',
      arrived: false,
      engineerDeparted: false,
      engineerReceivedTask: false,
      routeStarted: false,
    },
    correction: {
      fieldGroup: CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL,
      fieldKey: 'issueSummary',
      fromValue: 'before value should not leak',
      toValue: 'safe issue summary',
      beforeValue: 'before value should not leak',
      afterValue: 'after value should not leak',
      phone: '0912-345-678',
      mobile: '0912-345-678',
      tel: '0912-345-678',
      rawPhone: '0912-345-678',
      rawAddress: 'raw address should not leak',
      rawLineUserId: 'LINE-RAW-USER-ID',
      line_user_id: 'LINE-RAW-USER-ID',
      lineUserId: 'LINE-RAW-USER-ID',
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

function createDecisionAuditWriter(calls, behavior = {}) {
  return function decisionAuditWriter(writerInput) {
    calls.push(writerInput);

    if (behavior.throwError) {
      throw new Error('writer raw detail should not leak');
    }

    if (behavior.reject) {
      return Promise.reject(new Error('writer raw detail should not leak'));
    }

    return behavior.result || { ok: true, persisted: true };
  };
}

function createCorrectionWriter(calls, result = { ok: true }) {
  return function correctionWriter(payload) {
    calls.push(payload);

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

function assertWriterReceivedOnlySanitizedInput(writerInput, expected) {
  assert.equal(Object.prototype.hasOwnProperty.call(writerInput, 'response'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(writerInput, 'decisionResult'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(writerInput, 'actor'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(writerInput, 'caseContext'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(writerInput, 'appointmentContext'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(writerInput, 'correction'), false);
  assert.equal(writerInput.action, expected.action);
  assert.equal(writerInput.eventType, expected.eventType);
  assert.equal(writerInput.resultStatus, expected.resultStatus);
  assert.equal(writerInput.organizationId, expected.organizationId || 'org_decision_audit_matrix_001');

  if (expected.caseId !== undefined) {
    assert.equal(writerInput.caseId, expected.caseId);
  }

  if (expected.appointmentId !== undefined) {
    assert.equal(writerInput.appointmentId, expected.appointmentId);
  }

  if (expected.actorId !== undefined) {
    assert.equal(writerInput.actorId, expected.actorId);
  }

  if (expected.fieldKey !== undefined) {
    assert.equal(writerInput.fieldKey, expected.fieldKey);
  }

  assertSafe(writerInput);
}

test('matrix: successful apply path sends sanitized writer input through actual service invocation', () => {
  const auditCalls = [];
  const correctionCalls = [];
  const result = applyPreDepartureCorrection(baseInput(), {
    correctionWriter: createCorrectionWriter(correctionCalls),
    decisionAuditWriter: createDecisionAuditWriter(auditCalls),
    includeDecisionAuditIntent: true,
  });

  assert.equal(result.response.status, 'applied');
  assert.equal(result.response.correctionApplied, true);
  assert.deepEqual(result.decisionAuditWriterResult, { status: 'recorded' });
  assert.equal(correctionCalls.length, 1);
  assert.equal(auditCalls.length, 1);
  assertWriterReceivedOnlySanitizedInput(auditCalls[0], {
    action: DATA_CORRECTION_AUDIT_ACTIONS.APPLY,
    eventType: DATA_CORRECTION_AUDIT_EVENT_TYPES.APPLY_ALLOWED,
    resultStatus: DATA_CORRECTION_AUDIT_RESULTS.ALLOWED,
    caseId: 'case_decision_audit_matrix_001',
    appointmentId: 'apt_decision_audit_matrix_001',
    actorId: 'user_decision_audit_matrix_001',
    fieldKey: 'issueSummary',
  });
  assertSafe([result, auditCalls]);
});

test('matrix: writer failure-like result is normalized without changing apply outcome', () => {
  const auditCalls = [];
  const correctionCalls = [];
  const result = applyPreDepartureCorrection(baseInput(), {
    correctionWriter: createCorrectionWriter(correctionCalls),
    decisionAuditWriter: createDecisionAuditWriter(auditCalls, {
      result: {
        ok: false,
        persisted: false,
        rawWriterResult: 'writer raw detail should not leak',
        writerInternals: baseInput(),
      },
    }),
    includeDecisionAuditIntent: true,
  });

  assert.equal(result.response.status, 'applied');
  assert.equal(result.response.correctionApplied, true);
  assert.deepEqual(result.decisionAuditWriterResult, {
    status: 'failed',
    reasonCode: 'DECISION_AUDIT_WRITER_FAILED',
    safeMessageKey: 'dataCorrection.decisionAuditWriterFailed',
  });
  assert.equal(correctionCalls.length, 1);
  assert.equal(auditCalls.length, 1);
  assertWriterReceivedOnlySanitizedInput(auditCalls[0], {
    action: DATA_CORRECTION_AUDIT_ACTIONS.APPLY,
    eventType: DATA_CORRECTION_AUDIT_EVENT_TYPES.APPLY_ALLOWED,
    resultStatus: DATA_CORRECTION_AUDIT_RESULTS.ALLOWED,
    caseId: 'case_decision_audit_matrix_001',
    appointmentId: 'apt_decision_audit_matrix_001',
    actorId: 'user_decision_audit_matrix_001',
    fieldKey: 'issueSummary',
  });
  assertSafe([result, auditCalls]);
});

test('matrix: writer throw is normalized without changing apply outcome', () => {
  const auditCalls = [];
  const correctionCalls = [];
  const result = applyPreDepartureCorrection(baseInput(), {
    correctionWriter: createCorrectionWriter(correctionCalls),
    decisionAuditWriter: createDecisionAuditWriter(auditCalls, { throwError: true }),
    includeDecisionAuditIntent: true,
  });

  assert.equal(result.response.status, 'applied');
  assert.equal(result.response.correctionApplied, true);
  assert.deepEqual(result.decisionAuditWriterResult, {
    status: 'failed',
    reasonCode: 'DECISION_AUDIT_WRITER_FAILED',
    safeMessageKey: 'dataCorrection.decisionAuditWriterFailed',
  });
  assert.equal(correctionCalls.length, 1);
  assert.equal(auditCalls.length, 1);
  assertWriterReceivedOnlySanitizedInput(auditCalls[0], {
    action: DATA_CORRECTION_AUDIT_ACTIONS.APPLY,
    eventType: DATA_CORRECTION_AUDIT_EVENT_TYPES.APPLY_ALLOWED,
    resultStatus: DATA_CORRECTION_AUDIT_RESULTS.ALLOWED,
    caseId: 'case_decision_audit_matrix_001',
    appointmentId: 'apt_decision_audit_matrix_001',
    actorId: 'user_decision_audit_matrix_001',
    fieldKey: 'issueSummary',
  });
  assertSafe([result, auditCalls]);
});

test('matrix: async writer rejection is normalized without changing apply outcome', async () => {
  const auditCalls = [];
  const correctionCalls = [];
  const result = await applyPreDepartureCorrectionAsync(baseInput(), {
    correctionWriter: createCorrectionWriter(correctionCalls),
    decisionAuditWriter: createDecisionAuditWriter(auditCalls, { reject: true }),
    includeDecisionAuditIntent: true,
  });

  assert.equal(result.response.status, 'applied');
  assert.equal(result.response.correctionApplied, true);
  assert.deepEqual(result.decisionAuditWriterResult, {
    status: 'failed',
    reasonCode: 'DECISION_AUDIT_WRITER_FAILED',
    safeMessageKey: 'dataCorrection.decisionAuditWriterFailed',
  });
  assert.equal(correctionCalls.length, 1);
  assert.equal(auditCalls.length, 1);
  assertWriterReceivedOnlySanitizedInput(auditCalls[0], {
    action: DATA_CORRECTION_AUDIT_ACTIONS.APPLY,
    eventType: DATA_CORRECTION_AUDIT_EVENT_TYPES.APPLY_ALLOWED,
    resultStatus: DATA_CORRECTION_AUDIT_RESULTS.ALLOWED,
    caseId: 'case_decision_audit_matrix_001',
    appointmentId: 'apt_decision_audit_matrix_001',
    actorId: 'user_decision_audit_matrix_001',
    fieldKey: 'issueSummary',
  });
  assertSafe([result, auditCalls]);
});

test('matrix: manual request path remains non-applying and sends sanitized minimal input', () => {
  const auditCalls = [];
  let correctionWriterCalls = 0;
  const result = processDataCorrectionRequest(baseInput(), {
    correctionWriter() {
      correctionWriterCalls += 1;
    },
    decisionAuditWriter: createDecisionAuditWriter(auditCalls),
    includeDecisionAuditIntent: true,
  });

  assert.equal(result.response.allowed, true);
  assert.equal(result.response.correctionApplicationReady, true);
  assert.equal(result.response.correctionApplied, undefined);
  assert.equal(correctionWriterCalls, 0);
  assert.deepEqual(result.decisionAuditWriterResult, { status: 'recorded' });
  assert.equal(auditCalls.length, 1);
  assertWriterReceivedOnlySanitizedInput(auditCalls[0], {
    action: DATA_CORRECTION_AUDIT_ACTIONS.REQUEST,
    eventType: DATA_CORRECTION_AUDIT_EVENT_TYPES.REQUEST_ACCEPTED,
    resultStatus: DATA_CORRECTION_AUDIT_RESULTS.ALLOWED,
    caseId: 'case_decision_audit_matrix_001',
    appointmentId: 'apt_decision_audit_matrix_001',
    actorId: 'user_decision_audit_matrix_001',
    fieldKey: 'issueSummary',
  });
  assertSafe([result, auditCalls]);
});

test('matrix: partial request metadata produces safe writer input without raw audit intent object', () => {
  const auditCalls = [];
  const result = processDataCorrectionRequest({
    organizationId: 'org_decision_audit_matrix_partial_001',
    timestamp: '2026-05-22T12:00:00.000Z',
    correction: {
      fieldGroup: CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL,
      fieldKey: 'issueSummary',
      rawPhone: '0912-345-678',
      rawAddress: 'raw address should not leak',
    },
    rawPayload: 'full payload should not leak',
  }, {
    decisionAuditWriter: createDecisionAuditWriter(auditCalls),
    includeDecisionAuditIntent: true,
  });

  assert.equal(result.response.allowed, false);
  assert.equal(result.response.correctionApplied, undefined);
  assert.equal(auditCalls.length, 1);
  assertWriterReceivedOnlySanitizedInput(auditCalls[0], {
    action: DATA_CORRECTION_AUDIT_ACTIONS.REQUEST,
    eventType: DATA_CORRECTION_AUDIT_EVENT_TYPES.REQUEST_DENIED,
    resultStatus: DATA_CORRECTION_AUDIT_RESULTS.DENIED,
    organizationId: 'org_decision_audit_matrix_partial_001',
    caseId: undefined,
    appointmentId: undefined,
    actorId: undefined,
    fieldKey: 'issueSummary',
  });
  assertSafe([result, auditCalls]);
});

test('matrix: unsafe-looking allowlisted values are dropped before writer invocation', async () => {
  const auditCalls = [];
  const result = await processDataCorrectionRequestAsync(baseInput({
    timestamp: '0912-345-678',
    actor: {
      userId: 'token-value',
      role: 'dispatch_assistant',
      permissions: ['data_correction.request'],
    },
    caseContext: {
      caseId: 'case_decision_audit_matrix_unsafe_001',
      organizationId: 'org_decision_audit_matrix_001',
    },
    appointmentContext: {
      appointmentId: 'apt_decision_audit_matrix_unsafe_001',
      engineerDeparted: true,
    },
    correction: {
      fieldGroup: CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL,
      fieldKey: 'customerPhone',
      rawPhone: '0912-345-678',
      rawPayload: 'full payload should not leak',
    },
  }), {
    decisionAuditWriter: createDecisionAuditWriter(auditCalls),
    includeDecisionAuditIntent: true,
  });

  assert.equal(result.response.allowed, false);
  assert.equal(result.response.phoneReverificationRequired, true);
  assert.equal(auditCalls.length, 1);
  assert.equal(auditCalls[0].timestamp, undefined);
  assert.equal(auditCalls[0].actorId, undefined);
  assert.equal(auditCalls[0].fieldKey, undefined);
  assertWriterReceivedOnlySanitizedInput(auditCalls[0], {
    action: DATA_CORRECTION_AUDIT_ACTIONS.REQUEST,
    eventType: DATA_CORRECTION_AUDIT_EVENT_TYPES.REQUEST_DENIED,
    resultStatus: DATA_CORRECTION_AUDIT_RESULTS.DENIED,
    caseId: 'case_decision_audit_matrix_unsafe_001',
    appointmentId: 'apt_decision_audit_matrix_unsafe_001',
    actorId: undefined,
    fieldKey: undefined,
  });
  assertSafe([result.response, result.decisionAuditWriterResult, auditCalls]);
});

test('matrix: default public responses remain closed without opt-in side channels', () => {
  const requestCalls = [];
  const applyCalls = [];
  const correctionCalls = [];
  const request = processDataCorrectionRequest(baseInput(), {
    decisionAuditWriter: createDecisionAuditWriter(requestCalls),
  });
  const apply = applyPreDepartureCorrection(baseInput(), {
    correctionWriter: createCorrectionWriter(correctionCalls),
    decisionAuditWriter: createDecisionAuditWriter(applyCalls),
  });

  assert.equal(request.auditIntent, undefined);
  assert.equal(request.decisionAuditWriterResult, undefined);
  assert.equal(request.response, undefined);
  assert.equal(request.allowed, true);
  assert.equal(request.correctionApplied, undefined);
  assert.equal(apply.auditIntent, undefined);
  assert.equal(apply.decisionAuditWriterResult, undefined);
  assert.equal(apply.response, undefined);
  assert.equal(apply.correctionApplied, true);
  assert.equal(requestCalls.length, 1);
  assert.equal(applyCalls.length, 1);
  assert.equal(correctionCalls.length, 1);
  assertSafe([request, apply, requestCalls, applyCalls]);
});
