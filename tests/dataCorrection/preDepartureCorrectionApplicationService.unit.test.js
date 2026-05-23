'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  CORRECTION_FIELD_GROUPS,
  DATA_CORRECTION_DECISIONS,
} = require('../../src/dataCorrection/dataCorrectionPolicyEngine');
const {
  APPLICATION_STATUSES,
  applyPreDepartureCorrection,
} = require('../../src/dataCorrection/preDepartureCorrectionApplicationService');

const repoRoot = path.resolve(__dirname, '../..');
const serviceFile = path.join(repoRoot, 'src/dataCorrection/preDepartureCorrectionApplicationService.js');

function baseInput(overrides = {}) {
  return {
    organizationId: 'org_pre_departure_correction_001',
    timestamp: '2026-05-21T12:30:00.000Z',
    actor: {
      userId: 'user_pre_departure_correction_001',
      role: 'dispatch_assistant',
      permissions: ['data_correction.apply'],
    },
    caseContext: {
      caseId: 'case_pre_departure_correction_001',
      organizationId: 'org_pre_departure_correction_001',
    },
    appointmentContext: {
      engineerReceivedTask: false,
      engineerDeparted: false,
      routeStarted: false,
      arrived: false,
    },
    correction: {
      fieldKey: 'issueSummary',
      fieldGroup: CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL,
      fromValue: 'old_value_should_not_leak',
      toValue: 'updated issue summary',
      rawPhone: 'raw_phone_should_not_leak',
      rawAddress: 'raw_address_should_not_leak',
      rawLineUserId: 'line_user_should_not_leak',
      token: 'token_should_not_leak',
      secret: 'secret_should_not_leak',
      internalNote: 'internal_note_should_not_leak',
      auditRawPayload: 'audit_log_should_not_leak',
      aiRawPayload: 'ai_raw_payload_should_not_leak',
      finalAppointmentId: 'final_appointment_should_not_leak',
    },
    ...overrides,
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createWriter(calls) {
  return function writer(payload) {
    calls.push(payload);
  };
}

function assertSafeOutput(value) {
  const serialized = JSON.stringify(value);

  for (const forbiddenValue of [
    'old_value_should_not_leak',
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'internal_note_should_not_leak',
    'audit_log_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'final_appointment_should_not_leak',
    'writer_failure_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbiddenValue), false, `leaked ${forbiddenValue}`);
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

test('missing input safe-denies and does not call correction writer', () => {
  const correctionCalls = [];
  const result = applyPreDepartureCorrection(undefined, {
    correctionWriter: createWriter(correctionCalls),
  });

  assert.equal(result.status, APPLICATION_STATUSES.BLOCKED);
  assert.equal(result.allowed, false);
  assert.equal(result.decision, DATA_CORRECTION_DECISIONS.SAFE_DENY);
  assert.equal(correctionCalls.length, 0);
  assertSafeOutput(result);
});

test('allowed pre-departure non-phone correction calls correctionWriter', () => {
  const correctionCalls = [];
  const result = applyPreDepartureCorrection(baseInput(), {
    correctionWriter: createWriter(correctionCalls),
  });

  assert.equal(result.status, APPLICATION_STATUSES.APPLIED);
  assert.equal(result.allowed, true);
  assert.equal(result.correctionApplied, true);
  assert.equal(result.writerResults.correction.status, 'recorded');
  assert.equal(correctionCalls.length, 1);
  assertSafeOutput([result, correctionCalls]);
});

test('correctionWriter receives safe metadata only', () => {
  const correctionCalls = [];
  applyPreDepartureCorrection(baseInput(), {
    correctionWriter: createWriter(correctionCalls),
  });

  assert.deepEqual(Object.keys(correctionCalls[0]).sort(), [
    'actor',
    'appointmentId',
    'caseId',
    'correction',
    'decision',
    'organizationId',
    'reasonCode',
  ]);
  assert.deepEqual(correctionCalls[0].actor, {
    userId: 'user_pre_departure_correction_001',
    role: 'dispatch_assistant',
  });
  assert.deepEqual(correctionCalls[0].correction, {
    fieldKey: 'issueSummary',
    fieldGroup: CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL,
    toValue: 'updated issue summary',
  });
  assertSafeOutput(correctionCalls);
});

test('appointment or engineer received task triggers engineer reconfirm metadata', () => {
  const result = applyPreDepartureCorrection(baseInput({
    appointmentContext: {
      appointmentId: 'apt_pre_departure_correction_001',
      engineerReceivedTask: true,
      engineerDeparted: false,
      routeStarted: false,
      arrived: false,
    },
  }), {
    correctionWriter() {},
  });

  assert.equal(result.status, APPLICATION_STATUSES.APPLIED);
  assert.equal(result.engineerReconfirmRequired, true);
  assert.equal(result.engineerNotificationQueued, false);
});

test('engineerNotificationWriter is called only when reconfirm is required and injected', () => {
  const correctionCalls = [];
  const notificationCalls = [];
  const noReconfirmResult = applyPreDepartureCorrection(baseInput(), {
    correctionWriter: createWriter(correctionCalls),
    engineerNotificationWriter: createWriter(notificationCalls),
  });

  assert.equal(noReconfirmResult.engineerReconfirmRequired, false);
  assert.equal(notificationCalls.length, 0);

  const reconfirmResult = applyPreDepartureCorrection(baseInput({
    appointmentContext: {
      appointmentId: 'apt_pre_departure_correction_001',
      engineerReceivedTask: true,
      engineerDeparted: false,
      routeStarted: false,
      arrived: false,
    },
  }), {
    correctionWriter: createWriter(correctionCalls),
    engineerNotificationWriter: createWriter(notificationCalls),
  });

  assert.equal(reconfirmResult.engineerReconfirmRequired, true);
  assert.equal(reconfirmResult.engineerNotificationQueued, true);
  assert.equal(notificationCalls.length, 1);
  assertSafeOutput(notificationCalls);
});

test('phone correction never calls correctionWriter and requires re-verification', () => {
  const correctionCalls = [];
  const result = applyPreDepartureCorrection(baseInput({
    correction: {
      fieldKey: 'phoneNumber',
      fieldGroup: CORRECTION_FIELD_GROUPS.PHONE_IDENTITY,
      fromValue: 'raw_phone_should_not_leak',
      toValue: 'raw_phone_should_not_leak',
    },
  }), {
    correctionWriter: createWriter(correctionCalls),
  });

  assert.equal(result.status, APPLICATION_STATUSES.BLOCKED);
  assert.equal(result.decision, DATA_CORRECTION_DECISIONS.PHONE_REVERIFICATION_REQUIRED);
  assert.equal(result.phoneReverificationRequired, true);
  assert.equal(correctionCalls.length, 0);
  assertSafeOutput(result);
});

test('line or channel identity correction never calls correctionWriter', () => {
  const correctionCalls = [];
  const result = applyPreDepartureCorrection(baseInput({
    correction: {
      fieldKey: 'line_user_id',
      fieldGroup: CORRECTION_FIELD_GROUPS.CUSTOMER_CHANNEL_IDENTITY,
      fromValue: 'line_user_should_not_leak',
      toValue: 'line_user_should_not_leak',
    },
  }), {
    correctionWriter: createWriter(correctionCalls),
  });

  assert.equal(result.status, APPLICATION_STATUSES.BLOCKED);
  assert.equal(result.phoneReverificationRequired, true);
  assert.equal(correctionCalls.length, 0);
  assertSafeOutput(result);
});

test('post-departure correction never calls correctionWriter and requires manual handling', () => {
  const correctionCalls = [];
  const result = applyPreDepartureCorrection(baseInput({
    appointmentContext: {
      appointmentId: 'apt_pre_departure_correction_001',
      engineerReceivedTask: true,
      engineerDeparted: true,
      routeStarted: false,
      arrived: false,
    },
  }), {
    correctionWriter: createWriter(correctionCalls),
  });

  assert.equal(result.status, APPLICATION_STATUSES.BLOCKED);
  assert.equal(result.decision, DATA_CORRECTION_DECISIONS.MANUAL_DISPATCH_CONTACT_REQUIRED);
  assert.equal(result.manualHandlingRequired, true);
  assert.equal(correctionCalls.length, 0);
});

test('route-started correction never calls correctionWriter', () => {
  const correctionCalls = [];
  const result = applyPreDepartureCorrection(baseInput({
    appointmentContext: {
      appointmentId: 'apt_pre_departure_correction_001',
      engineerReceivedTask: true,
      engineerDeparted: false,
      routeStarted: true,
      arrived: false,
    },
  }), {
    correctionWriter: createWriter(correctionCalls),
  });

  assert.equal(result.status, APPLICATION_STATUSES.BLOCKED);
  assert.equal(result.manualHandlingRequired, true);
  assert.equal(correctionCalls.length, 0);
});

test('arrived correction never calls correctionWriter and returns engineer evidence required', () => {
  const correctionCalls = [];
  const result = applyPreDepartureCorrection(baseInput({
    appointmentContext: {
      appointmentId: 'apt_pre_departure_correction_001',
      engineerReceivedTask: true,
      engineerDeparted: true,
      routeStarted: true,
      arrived: true,
    },
  }), {
    correctionWriter: createWriter(correctionCalls),
  });

  assert.equal(result.status, APPLICATION_STATUSES.BLOCKED);
  assert.equal(result.decision, DATA_CORRECTION_DECISIONS.ENGINEER_EVIDENCE_REQUIRED);
  assert.equal(result.engineerEvidenceRequired, true);
  assert.equal(correctionCalls.length, 0);
});

test('writer throw returns safe failure metadata without raw error leak', () => {
  const result = applyPreDepartureCorrection(baseInput(), {
    correctionWriter() {
      throw new Error('writer_failure_should_not_leak');
    },
  });

  assert.equal(result.status, APPLICATION_STATUSES.FAILED);
  assert.equal(result.correctionApplied, false);
  assert.equal(result.writerResults.correction.status, 'failed');
  assert.equal(result.writerResults.correction.safeMessageKey, 'dataCorrection.writerFailed');
  assertSafeOutput(result);
});

test('correctionWriter payload excludes finalAppointmentId', () => {
  const correctionCalls = [];
  const result = applyPreDepartureCorrection(baseInput(), {
    correctionWriter: createWriter(correctionCalls),
  });

  assert.equal(JSON.stringify(result).includes('finalAppointmentId'), false);
  assert.equal(JSON.stringify(correctionCalls).includes('finalAppointmentId'), false);
});

test('unsafe raw address-like correction fails closed and does not call correctionWriter', () => {
  const correctionCalls = [];
  const result = applyPreDepartureCorrection(baseInput({
    correction: {
      fieldKey: 'serviceAddress',
      fieldGroup: CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL,
      fromValue: 'raw_address_should_not_leak',
      toValue: '台北市信義區松仁路100號5樓 raw_address_should_not_leak',
    },
  }), {
    correctionWriter: createWriter(correctionCalls),
  });

  assert.equal(result.status, APPLICATION_STATUSES.BLOCKED);
  assert.equal(result.reasonCode, 'UNSAFE_CORRECTION_VALUE');
  assert.equal(correctionCalls.length, 0);
  assertSafeOutput(result);
});

test('input object is not mutated', () => {
  const input = baseInput();
  const before = clone(input);

  applyPreDepartureCorrection(input, {
    correctionWriter() {},
  });

  assert.deepEqual(input, before);
});

test('module import boundary has only data correction service and policy imports', () => {
  const source = fs.readFileSync(serviceFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, [
    './dataCorrectionRequestService',
    './dataCorrectionDecisionAuditIntentBuilder',
    './dataCorrectionDecisionAuditWriterInvocation',
    './dataCorrectionPolicyEngine',
  ]);
  assert.equal(specifiers.some((specifier) => /db|pool|repository|transaction|provider|line|sms|email|push|ai|rag|vector/i.test(specifier)), false);
});
