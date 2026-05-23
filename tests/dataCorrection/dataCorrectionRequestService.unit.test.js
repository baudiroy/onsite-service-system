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
  processDataCorrectionRequest,
  processDataCorrectionRequestAsync,
} = require('../../src/dataCorrection/dataCorrectionRequestService');
const {
  applyPreDepartureCorrection,
  applyPreDepartureCorrectionAsync,
} = require('../../src/dataCorrection/preDepartureCorrectionApplicationService');

const repoRoot = path.resolve(__dirname, '../..');
const serviceFile = path.join(repoRoot, 'src/dataCorrection/dataCorrectionRequestService.js');

function baseInput(overrides = {}) {
  return {
    organizationId: 'org_data_correction_service_001',
    timestamp: '2026-05-21T12:00:00.000Z',
    actor: {
      userId: 'user_data_correction_service_001',
      role: 'customer_service',
      permissions: ['case.correction.request'],
    },
    caseContext: {
      caseId: 'case_data_correction_service_001',
      organizationId: 'org_data_correction_service_001',
    },
    appointmentContext: {
      appointmentId: 'apt_data_correction_service_001',
      engineerReceivedTask: false,
      engineerDeparted: false,
      routeStarted: false,
      arrived: false,
    },
    correction: {
      fieldKey: 'issueSummary',
      fieldGroup: CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL,
      fromValue: 'old_value_should_not_leak',
      toValue: 'new_value_should_not_leak',
      rawPhone: 'raw_phone_should_not_leak',
      rawAddress: 'raw_address_should_not_leak',
      rawLineUserId: 'line_user_should_not_leak',
      token: 'token_should_not_leak',
      secret: 'secret_should_not_leak',
      internalNote: 'internal_note_should_not_leak',
      aiRawPayload: 'ai_raw_payload_should_not_leak',
      finalAppointmentId: 'final_appointment_should_not_leak',
    },
    ...overrides,
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertSafeOutput(value) {
  const serialized = JSON.stringify(value);

  for (const forbiddenValue of [
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

function assertSafePreDepartureApplyAuditMetadata(payload, expected = {}) {
  const expectedAppointmentId = Object.prototype.hasOwnProperty.call(expected, 'appointmentId')
    ? expected.appointmentId
    : 'apt_data_correction_service_001';

  assert.equal(payload.organizationId, expected.organizationId || 'org_data_correction_service_001');
  assert.equal(payload.caseId, expected.caseId || 'case_data_correction_service_001');
  assert.equal(payload.appointmentId, expectedAppointmentId);
  assert.deepEqual(payload.actor, {
    userId: expected.userId || 'user_data_correction_service_001',
    role: expected.role || 'customer_service',
  });
  assert.deepEqual(payload.correction, {
    fieldKey: expected.fieldKey || 'issueSummary',
    fieldGroup: expected.fieldGroup || CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL,
  });
  assert.equal(payload.decision, expected.decision);
  assert.equal(payload.reasonCode, expected.reasonCode);
  assert.equal(payload.safeMessageKey, expected.safeMessageKey);
  assert.equal(payload.correction.fromValue, undefined);
  assert.equal(payload.correction.toValue, undefined);
  assert.equal(payload.correction.rawPhone, undefined);
  assert.equal(payload.correction.rawAddress, undefined);
  assert.equal(payload.correction.finalAppointmentId, undefined);
  assert.equal(payload.rawPayload, undefined);
  assert.equal(payload.stack, undefined);
  assertSafeOutput(payload);
  assert.equal(JSON.stringify(payload).includes('old_value_should_not_leak'), false);
  assert.equal(JSON.stringify(payload).includes('new_value_should_not_leak'), false);
  assert.equal(JSON.stringify(payload).includes('validation_internal_should_not_leak'), false);
}

function createWriter(calls) {
  const safeCalls = Array.isArray(calls) ? calls : [];

  return function writer(payload) {
    safeCalls.push(payload);
  };
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

test('missing input returns safe deny', () => {
  const result = processDataCorrectionRequest();

  assert.equal(result.allowed, false);
  assert.equal(result.decision, DATA_CORRECTION_DECISIONS.SAFE_DENY);
  assertSafeOutput(result);
});

test('permission-denied request path does not call manual writers or correctionWriter', () => {
  const auditCalls = [];
  const contactLogCalls = [];
  const dispatchNoteCalls = [];
  const correctionCalls = [];
  const result = processDataCorrectionRequest(baseInput({
    actor: {
      userId: 'user_data_correction_service_001',
      role: 'customer_service',
      permissions: [],
      permissionDebug: 'case.correction.request_should_not_leak',
    },
    appointmentContext: {
      appointmentId: 'apt_data_correction_service_001',
      engineerReceivedTask: true,
      engineerDeparted: true,
      routeStarted: false,
      arrived: false,
    },
  }), {
    auditWriter: createWriter(auditCalls),
    contactLogWriter: createWriter(contactLogCalls),
    dispatchNoteWriter: createWriter(dispatchNoteCalls),
    correctionWriter: createWriter(correctionCalls),
  });

  assert.equal(result.allowed, false);
  assert.equal(result.status, 'blocked');
  assert.equal(result.decision, DATA_CORRECTION_DECISIONS.SAFE_DENY);
  assert.equal(result.reasonCode, 'MISSING_PERMISSION');
  assert.equal(result.manualHandlingRequired, false);
  assert.equal(result.correctionApplicationReady, false);
  assert.deepEqual(result.writerResults, {});
  assert.equal(auditCalls.length, 0);
  assert.equal(contactLogCalls.length, 0);
  assert.equal(dispatchNoteCalls.length, 0);
  assert.equal(correctionCalls.length, 0);
  assertSafeOutput([result, auditCalls, contactLogCalls, dispatchNoteCalls, correctionCalls]);
  assert.equal(JSON.stringify(result).includes('case.correction.request_should_not_leak'), false);
});

test('invalid request correction fail-closes before manual writers', () => {
  const auditCalls = [];
  const contactLogCalls = [];
  const dispatchNoteCalls = [];
  const correctionCalls = [];
  const result = processDataCorrectionRequest(baseInput({
    appointmentContext: {
      appointmentId: 'apt_data_correction_service_001',
      engineerReceivedTask: true,
      engineerDeparted: true,
      routeStarted: false,
      arrived: false,
    },
    correction: {
      fromValue: 'old_value_should_not_leak',
      toValue: 'new_value_should_not_leak',
      rawPhone: 'raw_phone_should_not_leak',
      rawAddress: 'raw_address_should_not_leak',
      token: 'token_should_not_leak',
      secret: 'secret_should_not_leak',
      validationDebug: 'validation_internal_should_not_leak',
    },
  }), {
    auditWriter: createWriter(auditCalls),
    contactLogWriter: createWriter(contactLogCalls),
    dispatchNoteWriter: createWriter(dispatchNoteCalls),
    correctionWriter: createWriter(correctionCalls),
  });

  assert.equal(result.allowed, false);
  assert.equal(result.status, 'blocked');
  assert.equal(result.decision, DATA_CORRECTION_DECISIONS.SAFE_DENY);
  assert.equal(result.reasonCode, 'FIELD_GROUP_NOT_ALLOWED');
  assert.equal(result.manualHandlingRequired, false);
  assert.equal(result.correctionApplicationReady, false);
  assert.deepEqual(result.writerResults, {});
  assert.equal(auditCalls.length, 0);
  assert.equal(contactLogCalls.length, 0);
  assert.equal(dispatchNoteCalls.length, 0);
  assert.equal(correctionCalls.length, 0);
  assertSafeOutput([result, auditCalls, contactLogCalls, dispatchNoteCalls, correctionCalls]);
  assert.equal(JSON.stringify(result).includes('validation_internal_should_not_leak'), false);
});

test('service calls policy engine and returns decision', () => {
  const result = processDataCorrectionRequest(baseInput());

  assert.equal(result.allowed, true);
  assert.equal(result.decision, DATA_CORRECTION_DECISIONS.ALLOW_PRE_DEPARTURE_CORRECTION);
  assert.equal(result.correctionApplicationReady, true);
  assert.equal(result.auditRequired, true);
});

test('phone change returns re-verification required and does not call provider-like writers', () => {
  const auditCalls = [];
  const result = processDataCorrectionRequest(baseInput({
    correction: {
      fieldKey: 'customerPhone',
      fieldGroup: CORRECTION_FIELD_GROUPS.REPAIR_OPERATIONAL,
      fromValue: 'raw_phone_should_not_leak',
      toValue: 'raw_phone_should_not_leak',
    },
  }), {
    auditWriter: createWriter(auditCalls),
  });

  assert.equal(result.allowed, false);
  assert.equal(result.decision, DATA_CORRECTION_DECISIONS.PHONE_REVERIFICATION_REQUIRED);
  assert.equal(result.phoneReverificationRequired, true);
  assert.equal(result.writerResults.audit.status, 'recorded');
  assert.equal(auditCalls.length, 1);
  assertSafeOutput(result);
  assertSafeOutput(auditCalls);
});

test('phone change audit writer receives safe metadata only', () => {
  const auditCalls = [];
  processDataCorrectionRequest(baseInput({
    correction: {
      fieldKey: 'phoneNumber',
      fieldGroup: CORRECTION_FIELD_GROUPS.PHONE_IDENTITY,
      fromValue: 'raw_phone_should_not_leak',
      toValue: 'raw_phone_should_not_leak',
    },
  }), {
    auditWriter: createWriter(auditCalls),
  });

  assert.deepEqual(Object.keys(auditCalls[0]).sort(), [
    'actor',
    'appointmentId',
    'caseId',
    'correction',
    'decision',
    'organizationId',
    'reasonCode',
    'safeMessageKey',
    'timestamp',
  ]);
  assert.deepEqual(auditCalls[0].correction, {
    fieldKey: 'phoneNumber',
    fieldGroup: CORRECTION_FIELD_GROUPS.PHONE_IDENTITY,
  });
  assertSafeOutput(auditCalls);
});

test('pre-departure allowed correction returns ready metadata and does not mutate input', () => {
  const input = baseInput();
  const before = clone(input);
  const result = processDataCorrectionRequest(input);

  assert.equal(result.allowed, true);
  assert.equal(result.correctionApplicationReady, true);
  assert.deepEqual(input, before);
  assertSafeOutput(result);
});

test('successful manual-handling request envelope redacts writer success internals', () => {
  const auditCalls = [];
  const contactLogCalls = [];
  const dispatchNoteCalls = [];
  const correctionCalls = [];
  const result = processDataCorrectionRequest(baseInput({
    appointmentContext: {
      appointmentId: 'apt_data_correction_service_001',
      engineerReceivedTask: true,
      engineerDeparted: true,
      routeStarted: false,
      arrived: false,
    },
  }), {
    auditWriter(payload) {
      auditCalls.push(payload);
      return {
        recorded: true,
        rawPayload: 'audit_log_should_not_leak',
        token: 'token_should_not_leak',
      };
    },
    contactLogWriter(payload) {
      contactLogCalls.push(payload);
      return {
        recorded: true,
        fullPhone: 'raw_phone_should_not_leak',
      };
    },
    dispatchNoteWriter(payload) {
      dispatchNoteCalls.push(payload);
      return {
        persisted: true,
        internalNote: 'internal_note_should_not_leak',
      };
    },
    correctionWriter(payload) {
      correctionCalls.push(payload);
      return {
        persisted: true,
        rawAddress: 'raw_address_should_not_leak',
      };
    },
  });

  assert.equal(result.status, 'blocked');
  assert.equal(result.allowed, false);
  assert.equal(result.manualHandlingRequired, true);
  assert.equal(result.correctionApplicationReady, false);
  assert.deepEqual(result.writerResults, {
    audit: {
      status: 'recorded',
    },
    contactLog: {
      status: 'recorded',
    },
    dispatchNote: {
      status: 'recorded',
    },
  });
  assert.equal(correctionCalls.length, 0);
  assert.equal(auditCalls.length, 1);
  assert.equal(contactLogCalls.length, 1);
  assert.equal(dispatchNoteCalls.length, 1);
  assertSafeOutput([result, auditCalls, contactLogCalls, dispatchNoteCalls, correctionCalls]);
});

test('engineer received task before departure sets engineerReconfirmRequired', () => {
  const result = processDataCorrectionRequest(baseInput({
    appointmentContext: {
      appointmentId: 'apt_data_correction_service_001',
      engineerReceivedTask: true,
      engineerDeparted: false,
      routeStarted: false,
      arrived: false,
    },
  }));

  assert.equal(result.allowed, true);
  assert.equal(result.engineerReconfirmRequired, true);
});

test('post-departure decision calls injected audit, contact log, and dispatch note writers', () => {
  const auditCalls = [];
  const contactLogCalls = [];
  const dispatchNoteCalls = [];
  const result = processDataCorrectionRequest(baseInput({
    appointmentContext: {
      appointmentId: 'apt_data_correction_service_001',
      engineerReceivedTask: true,
      engineerDeparted: true,
      routeStarted: false,
      arrived: false,
    },
  }), {
    auditWriter: createWriter(auditCalls),
    contactLogWriter: createWriter(contactLogCalls),
    dispatchNoteWriter: createWriter(dispatchNoteCalls),
  });

  assert.equal(result.allowed, false);
  assert.equal(result.decision, DATA_CORRECTION_DECISIONS.MANUAL_DISPATCH_CONTACT_REQUIRED);
  assert.equal(result.manualHandlingRequired, true);
  assert.equal(result.writerResults.audit.status, 'recorded');
  assert.equal(result.writerResults.contactLog.status, 'recorded');
  assert.equal(result.writerResults.dispatchNote.status, 'recorded');
  assert.equal(auditCalls.length, 1);
  assert.equal(contactLogCalls.length, 1);
  assert.equal(dispatchNoteCalls.length, 1);
  assertSafeOutput([result, auditCalls, contactLogCalls, dispatchNoteCalls]);
});

test('post-departure apply attempt is blocked before correction application and manual writers', () => {
  const auditCalls = [];
  const contactLogCalls = [];
  const dispatchNoteCalls = [];
  const correctionCalls = [];
  const result = applyPreDepartureCorrection(baseInput({
    appointmentContext: {
      appointmentId: 'apt_data_correction_service_001',
      engineerReceivedTask: true,
      engineerDeparted: true,
      routeStarted: false,
      arrived: false,
    },
  }), {
    auditWriter: createWriter(auditCalls),
    contactLogWriter: createWriter(contactLogCalls),
    dispatchNoteWriter: createWriter(dispatchNoteCalls),
    correctionWriter: createWriter(correctionCalls),
  });

  assert.equal(result.status, 'blocked');
  assert.equal(result.allowed, false);
  assert.equal(result.decision, DATA_CORRECTION_DECISIONS.MANUAL_DISPATCH_CONTACT_REQUIRED);
  assert.equal(result.reasonCode, 'CORRECTION_FROZEN_AFTER_DEPARTURE');
  assert.equal(result.manualHandlingRequired, true);
  assert.equal(result.correctionApplicationReady, false);
  assert.equal(result.correctionApplied, false);
  assert.equal(result.writerResults.audit.status, 'recorded');
  assert.equal(result.writerResults.contactLog.status, 'skipped');
  assert.equal(result.writerResults.dispatchNote.status, 'skipped');
  assert.equal(result.writerResults.correction, undefined);
  assert.equal(auditCalls.length, 1);
  assert.equal(contactLogCalls.length, 0);
  assert.equal(dispatchNoteCalls.length, 0);
  assert.equal(correctionCalls.length, 0);
  assertSafePreDepartureApplyAuditMetadata(auditCalls[0], {
    decision: DATA_CORRECTION_DECISIONS.MANUAL_DISPATCH_CONTACT_REQUIRED,
    reasonCode: 'CORRECTION_FROZEN_AFTER_DEPARTURE',
    safeMessageKey: 'dataCorrection.unavailable',
  });
  assertSafeOutput([result, auditCalls, contactLogCalls, dispatchNoteCalls, correctionCalls]);
});

test('pre-departure apply calls only correction writer and safe audit writer', () => {
  const auditCalls = [];
  const contactLogCalls = [];
  const dispatchNoteCalls = [];
  const correctionCalls = [];
  const engineerNotificationCalls = [];
  const result = applyPreDepartureCorrection(baseInput({
    appointmentContext: {
      engineerReceivedTask: false,
      engineerDeparted: false,
      routeStarted: false,
      arrived: false,
    },
  }), {
    auditWriter: createWriter(auditCalls),
    contactLogWriter: createWriter(contactLogCalls),
    dispatchNoteWriter: createWriter(dispatchNoteCalls),
    correctionWriter: createWriter(correctionCalls),
    engineerNotificationWriter: createWriter(engineerNotificationCalls),
  });

  assert.equal(result.status, 'applied');
  assert.equal(result.allowed, true);
  assert.equal(result.decision, DATA_CORRECTION_DECISIONS.ALLOW_PRE_DEPARTURE_CORRECTION);
  assert.equal(result.reasonCode, 'PRE_DEPARTURE_CORRECTION_ALLOWED');
  assert.equal(result.manualHandlingRequired, false);
  assert.equal(result.correctionApplicationReady, true);
  assert.equal(result.correctionApplied, true);
  assert.equal(result.writerResults.audit.status, 'recorded');
  assert.equal(result.writerResults.correction.status, 'recorded');
  assert.equal(result.writerResults.contactLog, undefined);
  assert.equal(result.writerResults.dispatchNote, undefined);
  assert.equal(auditCalls.length, 1);
  assert.equal(correctionCalls.length, 1);
  assert.equal(contactLogCalls.length, 0);
  assert.equal(dispatchNoteCalls.length, 0);
  assert.equal(engineerNotificationCalls.length, 0);
  assertSafePreDepartureApplyAuditMetadata(auditCalls[0], {
    appointmentId: undefined,
    decision: DATA_CORRECTION_DECISIONS.ALLOW_PRE_DEPARTURE_CORRECTION,
    reasonCode: 'PRE_DEPARTURE_CORRECTION_ALLOWED',
    safeMessageKey: 'dataCorrection.allowed',
  });
  assertSafeOutput([
    result,
    auditCalls,
    contactLogCalls,
    dispatchNoteCalls,
    correctionCalls,
    engineerNotificationCalls,
  ]);
});

test('permission-denied pre-departure apply blocks before correction or manual writers', () => {
  const auditCalls = [];
  const contactLogCalls = [];
  const dispatchNoteCalls = [];
  const correctionCalls = [];
  const engineerNotificationCalls = [];
  const result = applyPreDepartureCorrection(baseInput({
    actor: {
      userId: 'user_data_correction_service_001',
      role: 'customer_service',
      permissions: [],
      permissionDebug: 'case.correction.apply_should_not_leak',
    },
    appointmentContext: {
      engineerReceivedTask: false,
      engineerDeparted: false,
      routeStarted: false,
      arrived: false,
    },
  }), {
    auditWriter: createWriter(auditCalls),
    contactLogWriter: createWriter(contactLogCalls),
    dispatchNoteWriter: createWriter(dispatchNoteCalls),
    correctionWriter: createWriter(correctionCalls),
    engineerNotificationWriter: createWriter(engineerNotificationCalls),
  });
  const serialized = JSON.stringify(result);

  assert.equal(result.status, 'blocked');
  assert.equal(result.allowed, false);
  assert.equal(result.decision, DATA_CORRECTION_DECISIONS.SAFE_DENY);
  assert.equal(result.reasonCode, 'MISSING_PERMISSION');
  assert.equal(result.correctionApplicationReady, false);
  assert.equal(result.correctionApplied, false);
  assert.equal(result.manualHandlingRequired, false);
  assert.deepEqual(result.writerResults, {});
  assert.equal(auditCalls.length, 0);
  assert.equal(contactLogCalls.length, 0);
  assert.equal(dispatchNoteCalls.length, 0);
  assert.equal(correctionCalls.length, 0);
  assert.equal(engineerNotificationCalls.length, 0);
  assert.equal(serialized.includes('case.correction.apply_should_not_leak'), false);
  assert.equal(serialized.includes('case.correction.apply'), false);
  assert.equal(auditCalls.length, 0);
  assertSafeOutput([
    result,
    auditCalls,
    contactLogCalls,
    dispatchNoteCalls,
    correctionCalls,
    engineerNotificationCalls,
  ]);
});

test('invalid pre-departure apply correction fail-closes before correction or manual writers', async () => {
  const malformedCorrections = [
    {
      name: 'missing fieldKey',
      correction: {
        fieldGroup: CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL,
        fromValue: 'old_value_should_not_leak',
        toValue: 'new_value_should_not_leak',
        rawPhone: 'raw_phone_should_not_leak',
        rawAddress: 'raw_address_should_not_leak',
        token: 'token_should_not_leak',
        secret: 'secret_should_not_leak',
        validationDebug: 'validation_internal_should_not_leak',
      },
    },
    {
      name: 'blank fieldGroup',
      correction: {
        fieldKey: 'issueSummary',
        fieldGroup: '   ',
        fromValue: 'old_value_should_not_leak',
        toValue: 'new_value_should_not_leak',
        rawPhone: 'raw_phone_should_not_leak',
        rawAddress: 'raw_address_should_not_leak',
        token: 'token_should_not_leak',
        secret: 'secret_should_not_leak',
        validationDebug: 'validation_internal_should_not_leak',
      },
    },
  ];

  for (const { name, correction } of malformedCorrections) {
    const auditCalls = [];
    const contactLogCalls = [];
    const dispatchNoteCalls = [];
    const correctionCalls = [];
    const engineerNotificationCalls = [];
    const result = applyPreDepartureCorrection(baseInput({
      appointmentContext: {
        engineerReceivedTask: false,
        engineerDeparted: false,
        routeStarted: false,
        arrived: false,
      },
      correction,
    }), {
      auditWriter: createWriter(auditCalls),
      contactLogWriter: createWriter(contactLogCalls),
      dispatchNoteWriter: createWriter(dispatchNoteCalls),
      correctionWriter: createWriter(correctionCalls),
      engineerNotificationWriter: createWriter(engineerNotificationCalls),
    });
    const asyncResult = await applyPreDepartureCorrectionAsync(baseInput({
      appointmentContext: {
        engineerReceivedTask: false,
        engineerDeparted: false,
        routeStarted: false,
        arrived: false,
      },
      correction,
    }), {
      auditWriter: createWriter(auditCalls),
      contactLogWriter: createWriter(contactLogCalls),
      dispatchNoteWriter: createWriter(dispatchNoteCalls),
      correctionWriter: createWriter(correctionCalls),
      engineerNotificationWriter: createWriter(engineerNotificationCalls),
    });

    for (const output of [result, asyncResult]) {
      assert.equal(output.status, 'blocked', name);
      assert.equal(output.allowed, false, name);
      assert.equal(output.decision, DATA_CORRECTION_DECISIONS.SAFE_DENY, name);
      assert.equal(output.reasonCode, 'FIELD_GROUP_NOT_ALLOWED', name);
      assert.equal(output.correctionApplicationReady, false, name);
      assert.equal(output.correctionApplied, false, name);
      assert.equal(output.manualHandlingRequired, false, name);
      assert.deepEqual(output.writerResults, {}, name);
    }

    assert.equal(auditCalls.length, 0, name);
    assert.equal(contactLogCalls.length, 0, name);
    assert.equal(dispatchNoteCalls.length, 0, name);
    assert.equal(correctionCalls.length, 0, name);
    assert.equal(engineerNotificationCalls.length, 0, name);
    assert.equal(JSON.stringify([result, asyncResult]).includes('validation_internal_should_not_leak'), false, name);
    assertSafeOutput([
      result,
      asyncResult,
      auditCalls,
      contactLogCalls,
      dispatchNoteCalls,
      correctionCalls,
      engineerNotificationCalls,
    ]);
  }
});

test('pre-departure apply correction writer throw returns safe failed envelope without manual fallback', () => {
  const auditCalls = [];
  const contactLogCalls = [];
  const dispatchNoteCalls = [];
  const engineerNotificationCalls = [];
  const result = applyPreDepartureCorrection(baseInput({
    appointmentContext: {
      engineerReceivedTask: false,
      engineerDeparted: false,
      routeStarted: false,
      arrived: false,
    },
  }), {
    auditWriter: createWriter(auditCalls),
    contactLogWriter: createWriter(contactLogCalls),
    dispatchNoteWriter: createWriter(dispatchNoteCalls),
    correctionWriter() {
      throw new Error('writer_failure_should_not_leak');
    },
    engineerNotificationWriter: createWriter(engineerNotificationCalls),
  });

  assert.equal(result.status, 'failed');
  assert.equal(result.allowed, false);
  assert.equal(result.safeMessageKey, 'dataCorrection.writerFailed');
  assert.equal(result.correctionApplicationReady, false);
  assert.equal(result.correctionApplied, false);
  assert.equal(result.writerResults.audit.status, 'recorded');
  assert.equal(result.writerResults.correction.status, 'failed');
  assert.equal(result.writerResults.contactLog, undefined);
  assert.equal(result.writerResults.dispatchNote, undefined);
  assert.equal(result.writerResults.engineerNotification, undefined);
  assert.equal(auditCalls.length, 1);
  assert.equal(contactLogCalls.length, 0);
  assert.equal(dispatchNoteCalls.length, 0);
  assert.equal(engineerNotificationCalls.length, 0);
  assertSafePreDepartureApplyAuditMetadata(auditCalls[0], {
    appointmentId: undefined,
    decision: DATA_CORRECTION_DECISIONS.ALLOW_PRE_DEPARTURE_CORRECTION,
    reasonCode: 'PRE_DEPARTURE_CORRECTION_ALLOWED',
    safeMessageKey: 'dataCorrection.allowed',
  });
  assert.equal(JSON.stringify(auditCalls[0]).includes('writer_failure_should_not_leak'), false);
  assertSafeOutput([
    result,
    auditCalls,
    contactLogCalls,
    dispatchNoteCalls,
    engineerNotificationCalls,
  ]);
});

test('async pre-departure apply correction writer failed result returns safe failed envelope without manual fallback', async () => {
  const auditCalls = [];
  const contactLogCalls = [];
  const dispatchNoteCalls = [];
  const engineerNotificationCalls = [];
  const result = await applyPreDepartureCorrectionAsync(baseInput({
    appointmentContext: {
      engineerReceivedTask: false,
      engineerDeparted: false,
      routeStarted: false,
      arrived: false,
    },
  }), {
    auditWriter: createWriter(auditCalls),
    contactLogWriter: createWriter(contactLogCalls),
    dispatchNoteWriter: createWriter(dispatchNoteCalls),
    async correctionWriter() {
      return { recorded: false, rawError: 'writer_failure_should_not_leak' };
    },
    engineerNotificationWriter: createWriter(engineerNotificationCalls),
  });

  assert.equal(result.status, 'failed');
  assert.equal(result.allowed, false);
  assert.equal(result.safeMessageKey, 'dataCorrection.writerFailed');
  assert.equal(result.correctionApplicationReady, false);
  assert.equal(result.correctionApplied, false);
  assert.equal(result.writerResults.audit.status, 'recorded');
  assert.equal(result.writerResults.correction.status, 'failed');
  assert.equal(result.writerResults.contactLog, undefined);
  assert.equal(result.writerResults.dispatchNote, undefined);
  assert.equal(result.writerResults.engineerNotification, undefined);
  assert.equal(auditCalls.length, 1);
  assert.equal(contactLogCalls.length, 0);
  assert.equal(dispatchNoteCalls.length, 0);
  assert.equal(engineerNotificationCalls.length, 0);
  assertSafePreDepartureApplyAuditMetadata(auditCalls[0], {
    appointmentId: undefined,
    decision: DATA_CORRECTION_DECISIONS.ALLOW_PRE_DEPARTURE_CORRECTION,
    reasonCode: 'PRE_DEPARTURE_CORRECTION_ALLOWED',
    safeMessageKey: 'dataCorrection.allowed',
  });
  assert.equal(JSON.stringify(auditCalls[0]).includes('writer_failure_should_not_leak'), false);
  assertSafeOutput([
    result,
    auditCalls,
    contactLogCalls,
    dispatchNoteCalls,
    engineerNotificationCalls,
  ]);
});

test('request service ignores correctionWriter and never creates correction application', () => {
  const auditCalls = [];
  const contactLogCalls = [];
  const dispatchNoteCalls = [];
  const correctionCalls = [];
  const result = processDataCorrectionRequest(baseInput({
    appointmentContext: {
      appointmentId: 'apt_data_correction_service_001',
      engineerReceivedTask: true,
      engineerDeparted: true,
      routeStarted: false,
      arrived: false,
    },
  }), {
    auditWriter: createWriter(auditCalls),
    contactLogWriter: createWriter(contactLogCalls),
    dispatchNoteWriter: createWriter(dispatchNoteCalls),
    correctionWriter: createWriter(correctionCalls),
  });

  assert.equal(result.allowed, false);
  assert.equal(result.manualHandlingRequired, true);
  assert.equal(result.correctionApplicationReady, false);
  assert.equal(result.writerResults.audit.status, 'recorded');
  assert.equal(result.writerResults.contactLog.status, 'recorded');
  assert.equal(result.writerResults.dispatchNote.status, 'recorded');
  assert.equal(result.writerResults.correction, undefined);
  assert.equal(auditCalls.length, 1);
  assert.equal(contactLogCalls.length, 1);
  assert.equal(dispatchNoteCalls.length, 1);
  assert.equal(correctionCalls.length, 0);
  assertSafeOutput([result, auditCalls, contactLogCalls, dispatchNoteCalls, correctionCalls]);
});

test('request service returns safe failed envelope when manual-handling writers fail', () => {
  const correctionCalls = [];
  const result = processDataCorrectionRequest(baseInput({
    appointmentContext: {
      appointmentId: 'apt_data_correction_service_001',
      engineerReceivedTask: true,
      engineerDeparted: true,
      routeStarted: false,
      arrived: false,
    },
  }), {
    auditWriter() {
      return { recorded: false, rawError: 'writer_failure_should_not_leak' };
    },
    contactLogWriter() {
      throw new Error('writer_failure_should_not_leak');
    },
    dispatchNoteWriter() {
      return { ok: false, rawSql: 'writer_failure_should_not_leak' };
    },
    correctionWriter: createWriter(correctionCalls),
  });

  assert.equal(result.status, 'failed');
  assert.equal(result.safeMessageKey, 'dataCorrection.writerFailed');
  assert.equal(result.allowed, false);
  assert.equal(result.manualHandlingRequired, true);
  assert.equal(result.correctionApplicationReady, false);
  assert.equal(result.writerResults.audit.status, 'failed');
  assert.equal(result.writerResults.contactLog.status, 'failed');
  assert.equal(result.writerResults.dispatchNote.status, 'failed');
  assert.equal(result.writerResults.correction, undefined);
  assert.equal(correctionCalls.length, 0);
  assertSafeOutput([result, correctionCalls]);
});

test('async request service awaits audit contact log and dispatch note writers', async () => {
  const auditCalls = [];
  const contactLogCalls = [];
  const dispatchNoteCalls = [];
  const result = await processDataCorrectionRequestAsync(baseInput({
    appointmentContext: {
      appointmentId: 'apt_data_correction_service_001',
      engineerReceivedTask: true,
      engineerDeparted: true,
      routeStarted: false,
      arrived: false,
    },
  }), {
    async auditWriter(payload) {
      await Promise.resolve();
      auditCalls.push(payload);
      return { recorded: true };
    },
    async contactLogWriter(payload) {
      await Promise.resolve();
      contactLogCalls.push(payload);
      return { recorded: true };
    },
    async dispatchNoteWriter(payload) {
      await Promise.resolve();
      dispatchNoteCalls.push(payload);
      return { recorded: true };
    },
  });

  assert.equal(result.allowed, false);
  assert.equal(result.manualHandlingRequired, true);
  assert.equal(result.writerResults.audit.status, 'recorded');
  assert.equal(result.writerResults.contactLog.status, 'recorded');
  assert.equal(result.writerResults.dispatchNote.status, 'recorded');
  assert.equal(auditCalls.length, 1);
  assert.equal(contactLogCalls.length, 1);
  assert.equal(dispatchNoteCalls.length, 1);
  assertSafeOutput([result, auditCalls, contactLogCalls, dispatchNoteCalls]);
});

test('async request service ignores correctionWriter and keeps request path side-effect bounded', async () => {
  const auditCalls = [];
  const contactLogCalls = [];
  const dispatchNoteCalls = [];
  const correctionCalls = [];
  const result = await processDataCorrectionRequestAsync(baseInput({
    appointmentContext: {
      appointmentId: 'apt_data_correction_service_001',
      engineerReceivedTask: true,
      engineerDeparted: true,
      routeStarted: false,
      arrived: false,
    },
  }), {
    async auditWriter(payload) {
      await Promise.resolve();
      auditCalls.push(payload);
      return { recorded: true };
    },
    async contactLogWriter(payload) {
      await Promise.resolve();
      contactLogCalls.push(payload);
      return { recorded: true };
    },
    async dispatchNoteWriter(payload) {
      await Promise.resolve();
      dispatchNoteCalls.push(payload);
      return { recorded: true };
    },
    async correctionWriter(payload) {
      await Promise.resolve();
      correctionCalls.push(payload);
      return { recorded: true };
    },
  });

  assert.equal(result.allowed, false);
  assert.equal(result.manualHandlingRequired, true);
  assert.equal(result.correctionApplicationReady, false);
  assert.equal(result.writerResults.audit.status, 'recorded');
  assert.equal(result.writerResults.contactLog.status, 'recorded');
  assert.equal(result.writerResults.dispatchNote.status, 'recorded');
  assert.equal(result.writerResults.correction, undefined);
  assert.equal(auditCalls.length, 1);
  assert.equal(contactLogCalls.length, 1);
  assert.equal(dispatchNoteCalls.length, 1);
  assert.equal(correctionCalls.length, 0);
  assertSafeOutput([result, auditCalls, contactLogCalls, dispatchNoteCalls, correctionCalls]);
});

test('async request service supports object writers with write method', async () => {
  const calls = [];
  const result = await processDataCorrectionRequestAsync(baseInput({
    correction: {
      fieldKey: 'phone',
      fieldGroup: CORRECTION_FIELD_GROUPS.PHONE_IDENTITY,
    },
  }), {
    auditWriter: {
      async write(payload) {
        await Promise.resolve();
        calls.push(payload);
        return { recorded: true };
      },
    },
  });

  assert.equal(result.writerResults.audit.status, 'recorded');
  assert.equal(calls.length, 1);
  assertSafeOutput([result, calls]);
});

test('async request service writer rejection stays safe and does not leak raw error', async () => {
  const result = await processDataCorrectionRequestAsync(baseInput({
    correction: {
      fieldKey: 'phone',
      fieldGroup: CORRECTION_FIELD_GROUPS.PHONE_IDENTITY,
    },
  }), {
    async auditWriter() {
      await Promise.resolve();
      throw new Error('writer_failure_should_not_leak');
    },
  });

  assert.equal(result.writerResults.audit.status, 'failed');
  assert.equal(result.writerResults.audit.reasonCode, 'WRITER_FAILED');
  assert.equal(result.writerResults.audit.safeMessageKey, 'dataCorrection.writerFailed');
  assertSafeOutput(result);
});

test('async request service writer false result stays safe and does not leak raw payload', async () => {
  const result = await processDataCorrectionRequestAsync(baseInput({
    correction: {
      fieldKey: 'phone',
      fieldGroup: CORRECTION_FIELD_GROUPS.PHONE_IDENTITY,
    },
  }), {
    async auditWriter() {
      await Promise.resolve();
      return {
        recorded: false,
        rawPhone: 'raw_phone_should_not_leak',
        error: 'writer_failure_should_not_leak',
      };
    },
  });

  assert.equal(result.writerResults.audit.status, 'failed');
  assert.equal(result.writerResults.audit.reasonCode, 'WRITER_FAILED');
  assertSafeOutput(result);
});

test('route started decision requires manual contact and dispatch note metadata', () => {
  const result = processDataCorrectionRequest(baseInput({
    appointmentContext: {
      appointmentId: 'apt_data_correction_service_001',
      engineerReceivedTask: true,
      engineerDeparted: false,
      routeStarted: true,
      arrived: false,
    },
  }));

  assert.equal(result.allowed, false);
  assert.equal(result.contactLogRequired, true);
  assert.equal(result.dispatchNoteRequired, true);
  assert.equal(result.auditRequired, true);
});

test('arrived decision returns engineer evidence required', () => {
  const result = processDataCorrectionRequest(baseInput({
    appointmentContext: {
      appointmentId: 'apt_data_correction_service_001',
      engineerReceivedTask: true,
      engineerDeparted: true,
      routeStarted: true,
      arrived: true,
    },
  }));

  assert.equal(result.allowed, false);
  assert.equal(result.decision, DATA_CORRECTION_DECISIONS.ENGINEER_EVIDENCE_REQUIRED);
  assert.equal(result.engineerEvidenceRequired, true);
});

test('writer throw does not throw raw error or leak writer error message', () => {
  const result = processDataCorrectionRequest(baseInput({
    correction: {
      fieldKey: 'phone',
      fieldGroup: CORRECTION_FIELD_GROUPS.PHONE_IDENTITY,
    },
  }), {
    auditWriter() {
      throw new Error('writer_failure_should_not_leak');
    },
  });

  assert.equal(result.writerResults.audit.status, 'failed');
  assert.equal(result.writerResults.audit.safeMessageKey, 'dataCorrection.writerFailed');
  assertSafeOutput(result);
});

test('no writers injected still returns safe decision', () => {
  const result = processDataCorrectionRequest(baseInput({
    appointmentContext: {
      appointmentId: 'apt_data_correction_service_001',
      engineerReceivedTask: true,
      engineerDeparted: true,
      routeStarted: false,
      arrived: false,
    },
  }));

  assert.equal(result.allowed, false);
  assert.equal(result.writerResults.audit.status, 'skipped');
  assert.equal(result.writerResults.contactLog.status, 'skipped');
  assert.equal(result.writerResults.dispatchNote.status, 'skipped');
  assertSafeOutput(result);
});

test('object writer with write method is supported with safe payload', () => {
  const calls = [];
  const result = processDataCorrectionRequest(baseInput({
    correction: {
      fieldKey: 'phone',
      fieldGroup: CORRECTION_FIELD_GROUPS.PHONE_IDENTITY,
    },
  }), {
    auditWriter: {
      write(payload) {
        calls.push(payload);
      },
    },
  });

  assert.equal(result.writerResults.audit.status, 'recorded');
  assert.equal(calls.length, 1);
  assertSafeOutput(calls);
});

test('response and writer payload exclude finalAppointmentId', () => {
  const auditCalls = [];
  const result = processDataCorrectionRequest(baseInput(), {
    auditWriter: createWriter(auditCalls),
  });

  assert.equal(JSON.stringify(result).includes('finalAppointmentId'), false);
  assert.equal(JSON.stringify(auditCalls).includes('finalAppointmentId'), false);
});

test('module import boundary has no DB, repository, provider, notification, AI, or RAG imports', () => {
  const source = fs.readFileSync(serviceFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, [
    './dataCorrectionPolicyEngine',
    './dataCorrectionDecisionAuditIntentBuilder',
    './dataCorrectionDecisionAuditWriterInvocation',
  ]);
  assert.equal(specifiers.some((specifier) => /db|pool|repository|transaction|provider|line|sms|email|push|ai|rag|vector/i.test(specifier)), false);
});
