'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
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

function baseInput(overrides = {}) {
  return {
    organizationId: 'org_dc_side_channel_001',
    timestamp: '2026-05-22T11:00:00.000Z',
    actor: {
      userId: 'user_dc_side_channel_001',
      role: 'dispatch_assistant',
      permissions: ['data_correction.request', 'data_correction.apply'],
    },
    caseContext: {
      caseId: 'case_dc_side_channel_001',
      organizationId: 'org_dc_side_channel_001',
    },
    appointmentContext: {
      appointmentId: 'appt_dc_side_channel_001',
      arrived: false,
      engineerDeparted: false,
      engineerReceivedTask: false,
      routeStarted: false,
    },
    correction: {
      fieldGroup: CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL,
      fieldKey: 'issueSummary',
      fromValue: 'from_value_should_not_leak',
      toValue: 'safe issue summary',
      rawPhone: '0912-345-678',
      rawAddress: '新北市板橋區文化路一段88號5樓',
      rawLineUserId: 'LINE-RAW-USER-ID',
      internalNote: 'internal note should not leak',
      auditRawPayload: 'audit raw payload should not leak',
      aiRawPayload: 'ai raw payload should not leak',
      billingInternalData: 'billing internal should not leak',
      settlementInternalData: 'settlement internal should not leak',
      finalAppointmentId: 'apt_final_unsafe_001',
    },
    fullPayload: 'full payload should not leak',
    token: 'token-value',
    secret: 'secret-value',
    dbUrl: 'postgres://unsafe',
    stack: 'Error: unsafe stack',
    rawSql: 'SELECT * FROM unsafe',
    ...overrides,
  };
}

function createWriter(calls, result) {
  const safeCalls = Array.isArray(calls) ? calls : [];

  return function writer(payload) {
    safeCalls.push(payload);

    return result;
  };
}

function assertNoUnsafeValue(value) {
  const serialized = JSON.stringify(value);

  [
    'from_value_should_not_leak',
    '0912-345-678',
    '新北市板橋區文化路一段88號5樓',
    'LINE-RAW-USER-ID',
    'internal note should not leak',
    'audit raw payload should not leak',
    'ai raw payload should not leak',
    'billing internal should not leak',
    'settlement internal should not leak',
    'full payload should not leak',
    'apt_final_unsafe_001',
    'finalAppointmentId',
    'token-value',
    'secret-value',
    'postgres://unsafe',
    'Error: unsafe stack',
    'SELECT * FROM unsafe',
    'fromValue',
    'toValue',
    'rawPhone',
    'rawAddress',
  ].forEach((needle) => {
    assert.equal(serialized.includes(needle), false, `unexpected leaked value: ${needle}`);
  });
}

test('default request response shape remains unchanged without audit side-channel option', () => {
  const response = processDataCorrectionRequest(baseInput());

  assert.equal(response.status, 'allowed');
  assert.equal(response.auditIntent, undefined);
  assert.equal(response.response, undefined);
  assert.equal(response.allowed, true);
  assertNoUnsafeValue(response);
});

test('request accepted side-channel returns response and safe audit intent only when requested', () => {
  const result = processDataCorrectionRequest(baseInput(), {
    includeDecisionAuditIntent: true,
  });

  assert.equal(result.response.status, 'allowed');
  assert.equal(result.auditIntent.eventType, DATA_CORRECTION_AUDIT_EVENT_TYPES.REQUEST_ACCEPTED);
  assert.equal(result.auditIntent.resultStatus, DATA_CORRECTION_AUDIT_RESULTS.ALLOWED);
  assert.equal(result.auditIntent.auditWritten, false);
  assert.equal(result.auditIntent.organizationId, 'org_dc_side_channel_001');
  assert.equal(result.auditIntent.caseId, 'case_dc_side_channel_001');
  assert.equal(result.auditIntent.appointmentId, 'appt_dc_side_channel_001');
  assert.equal(result.auditIntent.actorId, 'user_dc_side_channel_001');
  assert.equal(result.auditIntent.fieldKey, 'issueSummary');
  assert.equal(result.auditIntent.fieldGroup, CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL);
  assertNoUnsafeValue(result);
});

test('request manual-handling and denied decisions produce safe side-channel intents', () => {
  const manual = processDataCorrectionRequest(baseInput({
    appointmentContext: {
      appointmentId: 'appt_dc_side_channel_001',
      arrived: false,
      engineerDeparted: true,
      engineerReceivedTask: true,
      routeStarted: false,
    },
  }), {
    includeDecisionAuditIntent: true,
  });
  const denied = processDataCorrectionRequest(baseInput({
    actor: {
      role: 'dispatch_assistant',
      userId: 'user_dc_side_channel_001',
      permissions: [],
    },
  }), {
    includeDecisionAuditIntent: true,
  });

  assert.equal(manual.response.manualHandlingRequired, true);
  assert.equal(manual.auditIntent.eventType, DATA_CORRECTION_AUDIT_EVENT_TYPES.REQUEST_MANUAL_HANDLING);
  assert.equal(denied.response.allowed, false);
  assert.equal(denied.auditIntent.eventType, DATA_CORRECTION_AUDIT_EVENT_TYPES.REQUEST_DENIED);
  assertNoUnsafeValue([manual, denied]);
});

test('request validation-failed and writer-failed decisions produce safe side-channel intents', () => {
  const invalid = processDataCorrectionRequest(baseInput({
    correction: {
      rawPhone: '0912-345-678',
    },
  }), {
    includeDecisionAuditIntent: true,
  });
  const writerFailed = processDataCorrectionRequest(baseInput({
    appointmentContext: {
      appointmentId: 'appt_dc_side_channel_001',
      engineerDeparted: true,
      engineerReceivedTask: true,
    },
  }), {
    auditWriter: createWriter([], { ok: false, error: 'secret-value' }),
    includeDecisionAuditIntent: true,
  });

  assert.equal(invalid.auditIntent.eventType, DATA_CORRECTION_AUDIT_EVENT_TYPES.REQUEST_VALIDATION_FAILED);
  assert.equal(invalid.auditIntent.resultStatus, DATA_CORRECTION_AUDIT_RESULTS.VALIDATION_FAILED);
  assert.equal(writerFailed.response.status, 'failed');
  assert.equal(writerFailed.auditIntent.eventType, DATA_CORRECTION_AUDIT_EVENT_TYPES.REQUEST_WRITER_FAILED);
  assertNoUnsafeValue([invalid, writerFailed]);
});

test('apply allowed side-channel returns response and safe audit intent only when requested', () => {
  const correctionCalls = [];
  const response = applyPreDepartureCorrection(baseInput(), {
    correctionWriter: createWriter(correctionCalls),
  });
  const result = applyPreDepartureCorrection(baseInput(), {
    correctionWriter: createWriter(correctionCalls),
    includeDecisionAuditIntent: true,
  });

  assert.equal(response.auditIntent, undefined);
  assert.equal(response.response, undefined);
  assert.equal(result.response.status, 'applied');
  assert.equal(result.auditIntent.eventType, DATA_CORRECTION_AUDIT_EVENT_TYPES.APPLY_ALLOWED);
  assert.equal(result.auditIntent.resultStatus, DATA_CORRECTION_AUDIT_RESULTS.ALLOWED);
  assert.equal(result.auditIntent.auditWritten, false);
  assert.equal(correctionCalls.length, 2);
  assertNoUnsafeValue(result);
});

test('apply denied validation-failed and writer-failed decisions produce safe side-channel intents', () => {
  const denied = applyPreDepartureCorrection(baseInput({
    correction: {
      fieldGroup: CORRECTION_FIELD_GROUPS.PHONE_IDENTITY,
      fieldKey: 'phone',
      toValue: '0912-345-678',
    },
  }), {
    includeDecisionAuditIntent: true,
  });
  const validationFailed = applyPreDepartureCorrection(baseInput({
    correction: {
      fieldGroup: CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL,
      fieldKey: 'issueSummary',
      toValue: '0912345678',
    },
  }), {
    includeDecisionAuditIntent: true,
  });
  const writerFailed = applyPreDepartureCorrection(baseInput(), {
    correctionWriter: createWriter([], { ok: false, error: 'secret-value' }),
    includeDecisionAuditIntent: true,
  });

  assert.equal(denied.auditIntent.eventType, DATA_CORRECTION_AUDIT_EVENT_TYPES.APPLY_DENIED);
  assert.equal(validationFailed.auditIntent.eventType, DATA_CORRECTION_AUDIT_EVENT_TYPES.APPLY_VALIDATION_FAILED);
  assert.equal(writerFailed.auditIntent.eventType, DATA_CORRECTION_AUDIT_EVENT_TYPES.APPLY_WRITER_FAILED);
  assertNoUnsafeValue([denied, validationFailed, writerFailed]);
});

test('async request and apply side-channel paths preserve safe envelopes', async () => {
  const request = await processDataCorrectionRequestAsync(baseInput(), {
    includeDecisionAuditIntent: true,
  });
  const apply = await applyPreDepartureCorrectionAsync(baseInput(), {
    correctionWriter: async () => ({ ok: true }),
    includeDecisionAuditIntent: true,
  });

  assert.equal(request.auditIntent.eventType, DATA_CORRECTION_AUDIT_EVENT_TYPES.REQUEST_ACCEPTED);
  assert.equal(apply.auditIntent.eventType, DATA_CORRECTION_AUDIT_EVENT_TYPES.APPLY_ALLOWED);
  assert.equal(request.response.auditIntent, undefined);
  assert.equal(apply.response.auditIntent, undefined);
  assertNoUnsafeValue([request, apply]);
});

test('side-channel source imports only pure local builder and existing service dependencies', () => {
  const requestSource = fs.readFileSync(
    path.join(repoRoot, 'src/dataCorrection/dataCorrectionRequestService.js'),
    'utf8',
  );
  const applySource = fs.readFileSync(
    path.join(repoRoot, 'src/dataCorrection/preDepartureCorrectionApplicationService.js'),
    'utf8',
  );
  const combined = `${requestSource}\n${applySource}`;

  [
    /require\(['"].*db/i,
    /require\(['"].*repository/i,
    /require\(['"].*routes?/i,
    /require\(['"].*controllers?/i,
    /require\(['"].*provider/i,
    /require\(['"].*ai/i,
    /require\(['"].*rag/i,
    /require\(['"].*billing/i,
    /require\(['"].*settlement/i,
    /process\.env/,
    /console\./,
    /fetch\(/,
    /createServer/,
    /app\.listen/,
  ].forEach((pattern) => {
    assert.equal(pattern.test(combined), false, `forbidden pattern found: ${pattern}`);
  });
});
