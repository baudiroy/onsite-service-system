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
  FREEZE_STATUSES,
  handlePostDepartureCorrectionFreeze,
  handlePostDepartureCorrectionFreezeAsync,
} = require('../../src/dataCorrection/postDepartureCorrectionFreezeService');

const repoRoot = path.resolve(__dirname, '../..');
const serviceFile = path.join(repoRoot, 'src/dataCorrection/postDepartureCorrectionFreezeService.js');

function baseInput(overrides = {}) {
  return {
    organizationId: 'org_post_departure_freeze_001',
    timestamp: '2026-05-21T13:00:00.000Z',
    actor: {
      userId: 'user_post_departure_freeze_001',
      role: 'customer_service',
      permissions: ['data_correction.request'],
    },
    caseContext: {
      caseId: 'case_post_departure_freeze_001',
      organizationId: 'org_post_departure_freeze_001',
    },
    appointmentContext: {
      appointmentId: 'apt_post_departure_freeze_001',
      engineerReceivedTask: true,
      engineerDeparted: true,
      routeStarted: false,
      arrived: false,
    },
    correction: {
      fieldKey: 'siteNotes',
      fieldGroup: CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL,
      fromValue: 'old_value_should_not_leak',
      toValue: 'new_value_should_not_leak',
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
    'new_value_should_not_leak',
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

test('missing input returns safe not-applicable and no writers are called', () => {
  const auditCalls = [];
  const contactLogCalls = [];
  const dispatchNoteCalls = [];
  const result = handlePostDepartureCorrectionFreeze(undefined, {
    auditWriter: createWriter(auditCalls),
    contactLogWriter: createWriter(contactLogCalls),
    dispatchNoteWriter: createWriter(dispatchNoteCalls),
  });

  assert.equal(result.status, FREEZE_STATUSES.NOT_APPLICABLE);
  assert.equal(result.decision, DATA_CORRECTION_DECISIONS.SAFE_DENY);
  assert.equal(auditCalls.length, 0);
  assert.equal(contactLogCalls.length, 0);
  assert.equal(dispatchNoteCalls.length, 0);
  assertSafeOutput(result);
});

test('pre-departure allowed correction does not call freeze writers', () => {
  const auditCalls = [];
  const contactLogCalls = [];
  const dispatchNoteCalls = [];
  const result = handlePostDepartureCorrectionFreeze(baseInput({
    appointmentContext: {
      appointmentId: 'apt_post_departure_freeze_001',
      engineerReceivedTask: true,
      engineerDeparted: false,
      routeStarted: false,
      arrived: false,
    },
  }), {
    auditWriter: createWriter(auditCalls),
    contactLogWriter: createWriter(contactLogCalls),
    dispatchNoteWriter: createWriter(dispatchNoteCalls),
  });

  assert.equal(result.status, FREEZE_STATUSES.NOT_APPLICABLE);
  assert.equal(result.decision, DATA_CORRECTION_DECISIONS.ALLOW_PRE_DEPARTURE_CORRECTION);
  assert.equal(auditCalls.length, 0);
  assert.equal(contactLogCalls.length, 0);
  assert.equal(dispatchNoteCalls.length, 0);
});

test('engineer departed correction returns frozen manual handling metadata', () => {
  const result = handlePostDepartureCorrectionFreeze(baseInput());

  assert.equal(result.status, FREEZE_STATUSES.MANUAL_HANDLING_REQUIRED);
  assert.equal(result.decision, DATA_CORRECTION_DECISIONS.MANUAL_DISPATCH_CONTACT_REQUIRED);
  assert.equal(result.manualHandlingRequired, true);
  assert.equal(result.engineerEvidenceRequired, false);
});

test('route started correction returns frozen manual handling metadata', () => {
  const result = handlePostDepartureCorrectionFreeze(baseInput({
    appointmentContext: {
      appointmentId: 'apt_post_departure_freeze_001',
      engineerReceivedTask: true,
      engineerDeparted: false,
      routeStarted: true,
      arrived: false,
    },
  }));

  assert.equal(result.status, FREEZE_STATUSES.MANUAL_HANDLING_REQUIRED);
  assert.equal(result.decision, DATA_CORRECTION_DECISIONS.MANUAL_DISPATCH_CONTACT_REQUIRED);
  assert.equal(result.manualHandlingRequired, true);
});

test('departed correction calls contactLogWriter, dispatchNoteWriter, and auditWriter when injected', () => {
  const auditCalls = [];
  const contactLogCalls = [];
  const dispatchNoteCalls = [];
  const result = handlePostDepartureCorrectionFreeze(baseInput(), {
    auditWriter: createWriter(auditCalls),
    contactLogWriter: createWriter(contactLogCalls),
    dispatchNoteWriter: createWriter(dispatchNoteCalls),
  });

  assert.equal(result.status, FREEZE_STATUSES.MANUAL_HANDLING_RECORDED);
  assert.equal(result.writerResults.audit.status, 'recorded');
  assert.equal(result.writerResults.contactLog.status, 'recorded');
  assert.equal(result.writerResults.dispatchNote.status, 'recorded');
  assert.equal(auditCalls.length, 1);
  assert.equal(contactLogCalls.length, 1);
  assert.equal(dispatchNoteCalls.length, 1);
  assertSafeOutput([result, auditCalls, contactLogCalls, dispatchNoteCalls]);
});

test('engineerNotificationWriter receives only safe notification intent metadata when injected', () => {
  const notificationCalls = [];
  const result = handlePostDepartureCorrectionFreeze(baseInput(), {
    engineerNotificationWriter: createWriter(notificationCalls),
  });

  assert.equal(result.engineerNotificationQueued, true);
  assert.equal(notificationCalls.length, 1);
  assert.deepEqual(Object.keys(notificationCalls[0]).sort(), [
    'actor',
    'appointmentId',
    'caseId',
    'decision',
    'manualHandlingType',
    'notificationIntentType',
    'organizationId',
    'reasonCode',
    'safeMessageKey',
    'timestamp',
  ]);
  assert.equal(notificationCalls[0].notificationIntentType, 'post_departure_correction_manual_reconfirm');
  assertSafeOutput(notificationCalls);
});

test('phone correction remains phoneReverificationRequired and does not call freeze writers', () => {
  const auditCalls = [];
  const contactLogCalls = [];
  const dispatchNoteCalls = [];
  const result = handlePostDepartureCorrectionFreeze(baseInput({
    correction: {
      fieldKey: 'customerPhone',
      fieldGroup: CORRECTION_FIELD_GROUPS.PHONE_IDENTITY,
      fromValue: 'raw_phone_should_not_leak',
      toValue: 'raw_phone_should_not_leak',
    },
  }), {
    auditWriter: createWriter(auditCalls),
    contactLogWriter: createWriter(contactLogCalls),
    dispatchNoteWriter: createWriter(dispatchNoteCalls),
  });

  assert.equal(result.status, FREEZE_STATUSES.NOT_APPLICABLE);
  assert.equal(result.phoneReverificationRequired, true);
  assert.equal(auditCalls.length, 0);
  assert.equal(contactLogCalls.length, 0);
  assert.equal(dispatchNoteCalls.length, 0);
  assertSafeOutput(result);
});

test('arrived correction returns engineerEvidenceRequired and does not call freeze writers', () => {
  const auditCalls = [];
  const contactLogCalls = [];
  const dispatchNoteCalls = [];
  const result = handlePostDepartureCorrectionFreeze(baseInput({
    appointmentContext: {
      appointmentId: 'apt_post_departure_freeze_001',
      engineerReceivedTask: true,
      engineerDeparted: true,
      routeStarted: true,
      arrived: true,
    },
  }), {
    auditWriter: createWriter(auditCalls),
    contactLogWriter: createWriter(contactLogCalls),
    dispatchNoteWriter: createWriter(dispatchNoteCalls),
  });

  assert.equal(result.status, FREEZE_STATUSES.NOT_APPLICABLE);
  assert.equal(result.decision, DATA_CORRECTION_DECISIONS.ENGINEER_EVIDENCE_REQUIRED);
  assert.equal(result.engineerEvidenceRequired, true);
  assert.equal(auditCalls.length, 0);
  assert.equal(contactLogCalls.length, 0);
  assert.equal(dispatchNoteCalls.length, 0);
});

test('writer throw returns safe failure metadata with no raw error leak', () => {
  const result = handlePostDepartureCorrectionFreeze(baseInput(), {
    auditWriter() {
      throw new Error('writer_failure_should_not_leak');
    },
  });

  assert.equal(result.status, FREEZE_STATUSES.FAILED);
  assert.equal(result.writerResults.audit.status, 'failed');
  assert.equal(result.writerResults.audit.safeMessageKey, 'dataCorrection.writerFailed');
  assertSafeOutput(result);
});

test('async departed correction awaits contact log dispatch note and audit writers', async () => {
  const auditCalls = [];
  const contactLogCalls = [];
  const dispatchNoteCalls = [];
  const result = await handlePostDepartureCorrectionFreezeAsync(baseInput(), {
    async auditWriter(payload) {
      auditCalls.push(payload);
      return { recorded: true };
    },
    contactLogWriter: {
      async write(payload) {
        contactLogCalls.push(payload);
        return { persisted: true };
      },
    },
    async dispatchNoteWriter(payload) {
      dispatchNoteCalls.push(payload);
      return { ok: true };
    },
  });

  assert.equal(result.status, FREEZE_STATUSES.MANUAL_HANDLING_RECORDED);
  assert.equal(result.writerResults.audit.status, 'recorded');
  assert.equal(result.writerResults.contactLog.status, 'recorded');
  assert.equal(result.writerResults.dispatchNote.status, 'recorded');
  assert.equal(auditCalls.length, 1);
  assert.equal(contactLogCalls.length, 1);
  assert.equal(dispatchNoteCalls.length, 1);
  assertSafeOutput([result, auditCalls, contactLogCalls, dispatchNoteCalls]);
});

test('async departed correction honors writer failure safely', async () => {
  const result = await handlePostDepartureCorrectionFreezeAsync(baseInput(), {
    async contactLogWriter() {
      return { recorded: false, rawError: 'writer_failure_should_not_leak' };
    },
  });

  assert.equal(result.status, FREEZE_STATUSES.FAILED);
  assert.equal(result.writerResults.contactLog.status, 'failed');
  assert.equal(result.writerResults.contactLog.safeMessageKey, 'dataCorrection.writerFailed');
  assertSafeOutput(result);
});

test('writer payload excludes raw values and finalAppointmentId', () => {
  const auditCalls = [];
  handlePostDepartureCorrectionFreeze(baseInput(), {
    auditWriter: createWriter(auditCalls),
  });

  assert.deepEqual(Object.keys(auditCalls[0]).sort(), [
    'actor',
    'appointmentId',
    'caseId',
    'correction',
    'decision',
    'manualHandlingType',
    'organizationId',
    'reasonCode',
    'safeMessageKey',
    'timestamp',
  ]);
  assert.deepEqual(auditCalls[0].correction, {
    fieldKey: 'siteNotes',
    fieldGroup: CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL,
  });
  assert.equal(JSON.stringify(auditCalls).includes('finalAppointmentId'), false);
  assertSafeOutput(auditCalls);
});

test('input object is not mutated', () => {
  const input = baseInput();
  const before = clone(input);

  handlePostDepartureCorrectionFreeze(input, {
    auditWriter() {},
  });

  assert.deepEqual(input, before);
});

test('service has no correctionWriter or data application behavior', () => {
  const source = fs.readFileSync(serviceFile, 'utf8');

  assert.equal(source.includes('correctionWriter'), false);
  assert.equal(source.includes('applyPreDepartureCorrection'), false);
});

test('module import boundary has no DB, repository, provider, notification, AI, or RAG imports', () => {
  const source = fs.readFileSync(serviceFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, [
    './dataCorrectionRequestService',
    './dataCorrectionPolicyEngine',
  ]);
  assert.equal(specifiers.some((specifier) => /db|pool|repository|transaction|provider|line|sms|email|push|ai|rag|vector/i.test(specifier)), false);
});
