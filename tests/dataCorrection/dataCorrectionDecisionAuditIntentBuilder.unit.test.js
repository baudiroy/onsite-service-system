'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DATA_CORRECTION_AUDIT_ACTIONS,
  DATA_CORRECTION_AUDIT_EVENT_TYPES,
  DATA_CORRECTION_AUDIT_RESULTS,
  buildDataCorrectionDecisionAuditIntent,
} = require('../../src/dataCorrection/dataCorrectionDecisionAuditIntentBuilder');

function baseInput(overrides = {}) {
  return {
    action: DATA_CORRECTION_AUDIT_ACTIONS.REQUEST,
    actor: {
      role: 'dispatch_assistant',
      userId: 'user_dispatch_001',
    },
    caseContext: {
      caseId: 'case_dc_001',
      organizationId: 'org_dc_001',
    },
    appointmentContext: {
      appointmentId: 'appt_dc_001',
    },
    correction: {
      fieldGroup: 'dispatch_operational',
      fieldKey: 'floor_level',
    },
    decisionResult: {
      allowed: true,
      decision: 'allow_pre_departure_correction',
      reasonCode: 'PRE_DEPARTURE_CORRECTION_ALLOWED',
      safeMessageKey: 'dataCorrection.allowed',
    },
    timestamp: '2026-05-22T10:00:00.000Z',
    ...overrides,
  };
}

function assertNoUnsafeValue(value) {
  const serialized = JSON.stringify(value);

  [
    '0912-345-678',
    'LINE-RAW-USER-ID',
    '新北市板橋區文化路一段88號5樓',
    'internal note should not leak',
    'audit raw payload should not leak',
    'ai raw payload should not leak',
    'billing internal should not leak',
    'settlement internal should not leak',
    'full payload should not leak',
    'fsr_unsafe_001',
    'report_unsafe_001',
    'finalAppointmentId',
    'apt_final_unsafe_001',
    'secret-value',
    'token-value',
    'postgres://unsafe',
    'SELECT * FROM unsafe',
    'Error: unsafe stack',
    'beforeValue',
    'afterValue',
    'toValue',
    'fromValue',
  ].forEach((needle) => {
    assert.equal(serialized.includes(needle), false, `unexpected leaked value: ${needle}`);
  });
}

test('exports constants and pure builder', () => {
  assert.equal(DATA_CORRECTION_AUDIT_ACTIONS.REQUEST, 'data_correction_request');
  assert.equal(DATA_CORRECTION_AUDIT_ACTIONS.APPLY, 'pre_departure_apply');
  assert.equal(typeof buildDataCorrectionDecisionAuditIntent, 'function');
});

test('builds request accepted audit intent from safe service metadata', () => {
  const intent = buildDataCorrectionDecisionAuditIntent(baseInput());

  assert.deepEqual(intent, {
    action: 'data_correction_request',
    actorId: 'user_dispatch_001',
    actorRole: 'dispatch_assistant',
    appointmentId: 'appt_dc_001',
    auditWritten: false,
    caseId: 'case_dc_001',
    decision: 'allow_pre_departure_correction',
    eventType: DATA_CORRECTION_AUDIT_EVENT_TYPES.REQUEST_ACCEPTED,
    fieldGroup: 'dispatch_operational',
    fieldKey: 'floor_level',
    organizationId: 'org_dc_001',
    reasonCode: 'PRE_DEPARTURE_CORRECTION_ALLOWED',
    resultStatus: DATA_CORRECTION_AUDIT_RESULTS.ALLOWED,
    safeMessageKey: 'dataCorrection.allowed',
    timestamp: '2026-05-22T10:00:00.000Z',
  });
});

test('builds request denied audit intent', () => {
  const intent = buildDataCorrectionDecisionAuditIntent(baseInput({
    decisionResult: {
      allowed: false,
      decision: 'safe_deny',
      reasonCode: 'MISSING_PERMISSION',
      safeMessageKey: 'dataCorrection.unavailable',
    },
  }));

  assert.equal(intent.eventType, DATA_CORRECTION_AUDIT_EVENT_TYPES.REQUEST_DENIED);
  assert.equal(intent.resultStatus, DATA_CORRECTION_AUDIT_RESULTS.DENIED);
  assert.equal(intent.reasonCode, 'MISSING_PERMISSION');
  assert.equal(intent.auditWritten, false);
});

test('builds request manual-handling audit intent', () => {
  const intent = buildDataCorrectionDecisionAuditIntent(baseInput({
    decisionResult: {
      decision: 'manual_dispatch_contact_required',
      manualHandlingRequired: true,
      reasonCode: 'CORRECTION_FROZEN_AFTER_DEPARTURE',
      safeMessageKey: 'dataCorrection.postDepartureManualContactRequired',
    },
  }));

  assert.equal(intent.eventType, DATA_CORRECTION_AUDIT_EVENT_TYPES.REQUEST_MANUAL_HANDLING);
  assert.equal(intent.resultStatus, DATA_CORRECTION_AUDIT_RESULTS.MANUAL_HANDLING);
});

test('builds request writer-failed audit intent without raw error data', () => {
  const intent = buildDataCorrectionDecisionAuditIntent(baseInput({
    decisionResult: {
      reasonCode: 'WRITER_FAILED',
      safeMessageKey: 'dataCorrection.writerFailed',
      status: 'writer_failed',
    },
    error: {
      message: 'secret-value',
      stack: 'Error: unsafe stack',
    },
    rawSql: 'SELECT * FROM unsafe',
  }));

  assert.equal(intent.eventType, DATA_CORRECTION_AUDIT_EVENT_TYPES.REQUEST_WRITER_FAILED);
  assert.equal(intent.resultStatus, DATA_CORRECTION_AUDIT_RESULTS.WRITER_FAILED);
  assertNoUnsafeValue(intent);
});

test('builds apply allowed audit intent', () => {
  const intent = buildDataCorrectionDecisionAuditIntent(baseInput({
    action: DATA_CORRECTION_AUDIT_ACTIONS.APPLY,
    decisionResult: {
      allowed: true,
      decision: 'allow_pre_departure_correction',
      reasonCode: 'PRE_DEPARTURE_CORRECTION_ALLOWED',
      safeMessageKey: 'dataCorrection.applied',
      status: 'applied',
    },
  }));

  assert.equal(intent.eventType, DATA_CORRECTION_AUDIT_EVENT_TYPES.APPLY_ALLOWED);
  assert.equal(intent.resultStatus, DATA_CORRECTION_AUDIT_RESULTS.ALLOWED);
});

test('builds apply denied audit intent', () => {
  const intent = buildDataCorrectionDecisionAuditIntent(baseInput({
    action: DATA_CORRECTION_AUDIT_ACTIONS.APPLY,
    decisionResult: {
      allowed: false,
      decision: 'phone_reverification_required',
      reasonCode: 'PHONE_CHANGE_REQUIRES_REVERIFICATION',
      safeMessageKey: 'dataCorrection.phoneReverificationRequired',
      status: 'blocked',
    },
  }));

  assert.equal(intent.eventType, DATA_CORRECTION_AUDIT_EVENT_TYPES.APPLY_DENIED);
  assert.equal(intent.resultStatus, DATA_CORRECTION_AUDIT_RESULTS.DENIED);
});

test('builds apply writer-failed audit intent', () => {
  const intent = buildDataCorrectionDecisionAuditIntent(baseInput({
    action: DATA_CORRECTION_AUDIT_ACTIONS.APPLY,
    decisionResult: {
      reasonCode: 'WRITER_FAILED',
      safeMessageKey: 'dataCorrection.writerFailed',
      status: 'writer_failed',
    },
  }));

  assert.equal(intent.eventType, DATA_CORRECTION_AUDIT_EVENT_TYPES.APPLY_WRITER_FAILED);
  assert.equal(intent.resultStatus, DATA_CORRECTION_AUDIT_RESULTS.WRITER_FAILED);
});

test('builds validation-failed audit intents for request and apply', () => {
  const requestIntent = buildDataCorrectionDecisionAuditIntent(baseInput({
    decisionResult: {
      reasonCode: 'FIELD_GROUP_NOT_ALLOWED',
      safeMessageKey: 'dataCorrection.unavailable',
      status: 'validation_failed',
    },
  }));
  const applyIntent = buildDataCorrectionDecisionAuditIntent(baseInput({
    action: DATA_CORRECTION_AUDIT_ACTIONS.APPLY,
    decisionResult: {
      reasonCode: 'FIELD_GROUP_NOT_ALLOWED',
      safeMessageKey: 'dataCorrection.unavailable',
      status: 'validation_failed',
    },
  }));

  assert.equal(requestIntent.eventType, DATA_CORRECTION_AUDIT_EVENT_TYPES.REQUEST_VALIDATION_FAILED);
  assert.equal(applyIntent.eventType, DATA_CORRECTION_AUDIT_EVENT_TYPES.APPLY_VALIDATION_FAILED);
});

test('malformed input returns safe minimal intent without throwing', () => {
  assert.deepEqual(buildDataCorrectionDecisionAuditIntent(null), {
    auditWritten: false,
    eventType: DATA_CORRECTION_AUDIT_EVENT_TYPES.DECISION_MALFORMED,
    reasonCode: 'MALFORMED_INPUT',
    resultStatus: DATA_CORRECTION_AUDIT_RESULTS.MALFORMED,
    safeMessageKey: 'dataCorrection.unavailable',
  });

  assert.deepEqual(buildDataCorrectionDecisionAuditIntent({
    action: 'unknown',
    timestamp: '2026-05-22T10:01:00.000Z',
  }), {
    auditWritten: false,
    eventType: DATA_CORRECTION_AUDIT_EVENT_TYPES.DECISION_MALFORMED,
    reasonCode: 'MALFORMED_INPUT',
    resultStatus: DATA_CORRECTION_AUDIT_RESULTS.MALFORMED,
    safeMessageKey: 'dataCorrection.unavailable',
    timestamp: '2026-05-22T10:01:00.000Z',
  });
});

test('unsafe extras and raw correction payload are ignored', () => {
  const intent = buildDataCorrectionDecisionAuditIntent(baseInput({
    afterValue: '0912-345-678',
    aiRawPayload: 'ai raw payload should not leak',
    auditRawPayload: 'audit raw payload should not leak',
    beforeValue: '新北市板橋區文化路一段88號5樓',
    billingInternalData: 'billing internal should not leak',
    correction: {
      afterValue: '0912-345-678',
      beforeValue: '新北市板橋區文化路一段88號5樓',
      fieldGroup: 'repair_operational',
      fieldKey: 'problem_description',
      fromValue: 'internal note should not leak',
      toValue: 'LINE-RAW-USER-ID',
    },
    dbUrl: 'postgres://unsafe',
    finalAppointmentId: 'apt_final_unsafe_001',
    fullPayload: 'full payload should not leak',
    internalNote: 'internal note should not leak',
    reportId: 'report_unsafe_001',
    serviceReportId: 'fsr_unsafe_001',
    settlementInternalData: 'settlement internal should not leak',
    token: 'token-value',
    secret: 'secret-value',
  }));

  assert.equal(intent.fieldKey, 'problem_description');
  assert.equal(intent.fieldGroup, 'repair_operational');
  assertNoUnsafeValue(intent);
});

test('source import boundary avoids runtime sinks', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const source = fs.readFileSync(
    path.join(__dirname, '../../src/dataCorrection/dataCorrectionDecisionAuditIntentBuilder.js'),
    'utf8',
  );

  [
    /require\(['"].*db/i,
    /require\(['"].*repository/i,
    /require\(['"].*routes?/i,
    /require\(['"].*provider/i,
    /require\(['"].*ai/i,
    /require\(['"].*rag/i,
    /require\(['"].*audit.*writer/i,
    /require\(['"].*billing/i,
    /require\(['"].*settlement/i,
    /process\.env/,
    /console\./,
    /\.write\(/,
    /\.query\(/,
    /fetch\(/,
    /http\./,
    /https\./,
    /createServer/,
    /app\.listen/,
  ].forEach((pattern) => {
    assert.equal(pattern.test(source), false, `forbidden pattern found: ${pattern}`);
  });
});
