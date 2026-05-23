'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  processDataCorrectionRequest,
} = require('../../src/dataCorrection/dataCorrectionRequestService');
const {
  applyPreDepartureCorrection,
} = require('../../src/dataCorrection/preDepartureCorrectionApplicationService');
const {
  handlePostDepartureCorrectionFreeze,
} = require('../../src/dataCorrection/postDepartureCorrectionFreezeService');
const {
  recordUnableToCompleteAppointmentResult,
} = require('../../src/dataCorrection/unableToCompleteAppointmentResultService');
const {
  proposeFollowUpAppointment,
} = require('../../src/dataCorrection/followUpAppointmentProposalService');

const repoRoot = path.resolve(__dirname, '../..');

const SERVICE_FILES = [
  'src/dataCorrection/dataCorrectionRequestService.js',
  'src/dataCorrection/preDepartureCorrectionApplicationService.js',
  'src/dataCorrection/postDepartureCorrectionFreezeService.js',
  'src/dataCorrection/unableToCompleteAppointmentResultService.js',
  'src/dataCorrection/followUpAppointmentProposalService.js',
];

function actor(overrides = {}) {
  return {
    userId: 'user_data_correction_writer_failure_001',
    role: 'dispatch_assistant',
    permissions: ['case.correction.apply', 'case.correction.request'],
    ...overrides,
  };
}

function correctionInput(overrides = {}) {
  return {
    organizationId: 'org_data_correction_writer_failure_001',
    actor: actor(),
    caseContext: {
      caseId: 'case_data_correction_writer_failure_001',
      organizationId: 'org_data_correction_writer_failure_001',
    },
    appointmentContext: {
      appointmentId: 'apt_data_correction_writer_failure_001',
      engineerReceivedTask: true,
      engineerDeparted: false,
      routeStarted: false,
      arrived: false,
    },
    correction: {
      fieldKey: 'issueSummary',
      fieldGroup: 'dispatch_operational',
      fromValue: 'old_value_should_not_leak',
      toValue: 'safe updated issue',
      rawPhone: 'raw_phone_should_not_leak',
      rawAddress: 'raw_address_should_not_leak',
      rawLineUserId: 'line_user_should_not_leak',
      token: 'token_should_not_leak',
      secret: 'secret_should_not_leak',
      DATABASE_URL: 'DATABASE_URL_should_not_leak',
      internalNote: 'internal_note_should_not_leak',
      aiRawPayload: 'ai_raw_payload_should_not_leak',
      finalAppointmentId: 'final_appointment_should_not_leak',
    },
    ...overrides,
  };
}

function postDepartureInput() {
  return correctionInput({
    appointmentContext: {
      appointmentId: 'apt_data_correction_writer_failure_001',
      engineerReceivedTask: true,
      engineerDeparted: true,
      routeStarted: false,
      arrived: false,
    },
  });
}

function unableInput(overrides = {}) {
  return {
    organizationId: 'org_data_correction_writer_failure_001',
    actor: actor({
      userId: 'engineer_data_correction_writer_failure_001',
      role: 'engineer',
      permissions: ['appointment.result.record'],
    }),
    caseContext: {
      caseId: 'case_data_correction_writer_failure_001',
      organizationId: 'org_data_correction_writer_failure_001',
    },
    appointmentContext: {
      appointmentId: 'apt_data_correction_writer_failure_001',
      organizationId: 'org_data_correction_writer_failure_001',
      assignedEngineerId: 'engineer_data_correction_writer_failure_001',
      arrived: true,
    },
    result: {
      reasonCode: 'unable_to_complete',
      terminalState: 'unable_to_complete',
      note: 'site condition mismatch',
      evidenceRefs: ['photo_ref_test_001'],
      finalAppointmentId: 'final_appointment_should_not_leak',
    },
    ...overrides,
  };
}

function followUpInput() {
  return {
    organizationId: 'org_data_correction_writer_failure_001',
    actor: actor({
      permissions: ['appointment.follow_up.propose'],
    }),
    caseContext: {
      caseId: 'case_data_correction_writer_failure_001',
      organizationId: 'org_data_correction_writer_failure_001',
    },
    appointmentContext: {
      appointmentId: 'apt_data_correction_writer_failure_001',
      organizationId: 'org_data_correction_writer_failure_001',
      terminalState: 'follow_up_required',
    },
    proposal: {
      proposalType: 'follow_up_appointment',
      reasonCode: 'follow_up_required',
      note: 'schedule follow up',
      requiredPartsRefs: ['part_ref_test_001'],
      finalAppointmentId: 'final_appointment_should_not_leak',
    },
  };
}

function failureWriter(result = {}) {
  return () => ({
    ok: false,
    reasonCode: 'WRITER_FAILED',
    rawMessage: 'token_should_not_leak DATABASE_URL_should_not_leak',
    ...result,
  });
}

function successWriter(result = undefined) {
  return () => result;
}

function throwingWriter() {
  return () => {
    throw new Error('secret_should_not_leak raw_phone_should_not_leak');
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
    'DATABASE_URL_should_not_leak',
    'internal_note_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'final_appointment_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbiddenValue), false, `leaked ${forbiddenValue}`);
  }

  assert.equal(serialized.includes('"finalAppointmentId"'), false);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
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

test('request service treats auditWriter { ok:false } as writer failure', () => {
  const result = processDataCorrectionRequest(correctionInput(), {
    auditWriter: failureWriter({ ok: false }),
  });

  assert.equal(result.writerResults.audit.status, 'failed');
  assert.equal(result.writerResults.audit.reasonCode, 'WRITER_FAILED');
  assertSafeOutput(result);
});

test('request service treats auditWriter { persisted:false } as writer failure', () => {
  const result = processDataCorrectionRequest(correctionInput(), {
    auditWriter: failureWriter({ persisted: false }),
  });

  assert.equal(result.writerResults.audit.status, 'failed');
  assert.equal(result.writerResults.audit.safeMessageKey, 'dataCorrection.writerFailed');
  assertSafeOutput(result);
});

test('pre-departure service treats correctionWriter { ok:false } as writer failure', () => {
  const result = applyPreDepartureCorrection(correctionInput(), {
    auditWriter: successWriter({ ok: true }),
    correctionWriter: failureWriter({ ok: false }),
  });

  assert.equal(result.status, 'failed');
  assert.equal(result.correctionApplied, false);
  assert.equal(result.writerResults.correction.status, 'failed');
  assert.equal(result.safeMessageKey, 'dataCorrection.writerFailed');
  assertSafeOutput(result);
});

test('pre-departure service treats engineerNotificationWriter { recorded:false } as writer failure', () => {
  const result = applyPreDepartureCorrection(correctionInput(), {
    auditWriter: successWriter({ ok: true }),
    correctionWriter: successWriter({ ok: true }),
    engineerNotificationWriter: failureWriter({ recorded: false }),
  });

  assert.equal(result.status, 'applied');
  assert.equal(result.correctionApplied, true);
  assert.equal(result.engineerNotificationQueued, false);
  assert.equal(result.writerResults.engineerNotification.status, 'failed');
  assert.equal(result.writerResults.engineerNotification.reasonCode, 'WRITER_FAILED');
  assertSafeOutput(result);
});

test('post-departure freeze treats contactLogWriter failure result as failure', () => {
  const result = handlePostDepartureCorrectionFreeze(postDepartureInput(), {
    auditWriter: successWriter({ ok: true }),
    contactLogWriter: failureWriter({ ok: false }),
    dispatchNoteWriter: successWriter({ ok: true }),
  });

  assert.equal(result.status, 'failed');
  assert.equal(result.writerResults.contactLog.status, 'failed');
  assert.equal(result.safeMessageKey, 'dataCorrection.writerFailed');
  assertSafeOutput(result);
});

test('post-departure freeze treats dispatchNoteWriter failure result as failure', () => {
  const result = handlePostDepartureCorrectionFreeze(postDepartureInput(), {
    auditWriter: successWriter({ ok: true }),
    contactLogWriter: successWriter({ ok: true }),
    dispatchNoteWriter: failureWriter({ persisted: false }),
  });

  assert.equal(result.status, 'failed');
  assert.equal(result.writerResults.dispatchNote.status, 'failed');
  assertSafeOutput(result);
});

test('post-departure freeze treats auditWriter failure result as failure', () => {
  const result = handlePostDepartureCorrectionFreeze(postDepartureInput(), {
    auditWriter: failureWriter({ recorded: false }),
    contactLogWriter: successWriter({ ok: true }),
    dispatchNoteWriter: successWriter({ ok: true }),
  });

  assert.equal(result.status, 'failed');
  assert.equal(result.writerResults.audit.status, 'failed');
  assertSafeOutput(result);
});

test('unable-to-complete service treats appointmentResultWriter failure result as failure', () => {
  const result = recordUnableToCompleteAppointmentResult(unableInput(), {
    appointmentResultWriter: failureWriter({ ok: false }),
    evidenceWriter: successWriter({ ok: true }),
    auditWriter: successWriter({ ok: true }),
  });

  assert.equal(result.status, 'failed');
  assert.equal(result.allowed, false);
  assert.equal(result.appointmentResultRecorded, false);
  assert.equal(result.writerResults.appointmentResult.status, 'failed');
  assert.equal(result.safeMessageKey, 'appointmentResult.writerFailed');
  assertSafeOutput(result);
});

test('unable-to-complete service treats evidenceWriter failure result as failure', () => {
  const result = recordUnableToCompleteAppointmentResult(unableInput(), {
    appointmentResultWriter: successWriter({ ok: true }),
    evidenceWriter: failureWriter({ persisted: false }),
    auditWriter: successWriter({ ok: true }),
  });

  assert.equal(result.status, 'failed');
  assert.equal(result.writerResults.evidence.status, 'failed');
  assertSafeOutput(result);
});

test('follow-up proposal service treats followUpDraftWriter failure result as failure', () => {
  const result = proposeFollowUpAppointment(followUpInput(), {
    followUpDraftWriter: failureWriter({ ok: false }),
    dispatchNoteWriter: successWriter({ ok: true }),
    auditWriter: successWriter({ ok: true }),
  });

  assert.equal(result.status, 'failed');
  assert.equal(result.followUpDraftRecorded, false);
  assert.equal(result.writerResults.followUpDraft.status, 'failed');
  assert.equal(result.safeMessageKey, 'followUpProposal.writerFailed');
  assertSafeOutput(result);
});

test('follow-up proposal service treats dispatchNoteWriter failure result as failure', () => {
  const result = proposeFollowUpAppointment(followUpInput(), {
    followUpDraftWriter: successWriter({ ok: true }),
    dispatchNoteWriter: failureWriter({ persisted: false }),
    auditWriter: successWriter({ ok: true }),
  });

  assert.equal(result.status, 'failed');
  assert.equal(result.writerResults.dispatchNote.status, 'failed');
  assertSafeOutput(result);
});

test('follow-up proposal service treats auditWriter failure result as failure', () => {
  const result = proposeFollowUpAppointment(followUpInput(), {
    followUpDraftWriter: successWriter({ ok: true }),
    dispatchNoteWriter: successWriter({ ok: true }),
    auditWriter: failureWriter({ recorded: false }),
  });

  assert.equal(result.status, 'failed');
  assert.equal(result.writerResults.audit.status, 'failed');
  assertSafeOutput(result);
});

test('writer throw behavior remains safe', () => {
  const result = applyPreDepartureCorrection(correctionInput(), {
    auditWriter: successWriter({ ok: true }),
    correctionWriter: throwingWriter(),
  });

  assert.equal(result.status, 'failed');
  assert.equal(result.writerResults.correction.status, 'failed');
  assertSafeOutput(result);
});

test('writer success { ok:true } and undefined return remain compatible', () => {
  const resultWithOk = applyPreDepartureCorrection(correctionInput(), {
    auditWriter: successWriter({ ok: true }),
    correctionWriter: successWriter({ ok: true }),
    engineerNotificationWriter: successWriter({ ok: true }),
  });
  const resultWithUndefined = applyPreDepartureCorrection(correctionInput(), {
    auditWriter: successWriter(),
    correctionWriter: successWriter(),
    engineerNotificationWriter: successWriter(),
  });

  assert.equal(resultWithOk.status, 'applied');
  assert.equal(resultWithOk.correctionApplied, true);
  assert.equal(resultWithUndefined.status, 'applied');
  assert.equal(resultWithUndefined.correctionApplied, true);
  assertSafeOutput([resultWithOk, resultWithUndefined]);
});

test('input object is not mutated', () => {
  const input = correctionInput();
  const before = clone(input);

  applyPreDepartureCorrection(input, {
    auditWriter: successWriter({ ok: true }),
    correctionWriter: failureWriter({ ok: false }),
  });

  assert.deepEqual(input, before);
});

test('service import boundaries remain unchanged and avoid DB repository provider AI imports', () => {
  for (const relativePath of SERVICE_FILES) {
    const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

    for (const specifier of requireSpecifiers(source)) {
      assert.equal(
        /(?:^|\/)(?:db|pool|repositories?|providers?|ai|rag|vector|openai|routes?|controllers?|app|server)(?:\/|$)|transaction|lineProvider|sms|email|push/i.test(specifier),
        false,
        `${relativePath} imports forbidden dependency ${specifier}`,
      );
    }
  }
});
