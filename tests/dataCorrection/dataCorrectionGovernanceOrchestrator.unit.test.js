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
  FOLLOW_UP_PROPOSAL_TYPES,
  FOLLOW_UP_TERMINAL_STATES,
} = require('../../src/dataCorrection/followUpAppointmentProposalService');
const {
  TERMINAL_STATES,
} = require('../../src/dataCorrection/unableToCompleteAppointmentResultService');
const {
  DATA_CORRECTION_GOVERNANCE_ACTIONS,
  DATA_CORRECTION_GOVERNANCE_ACTION_ORDER,
  DATA_CORRECTION_GOVERNANCE_ACTION_SOURCE_PATHS,
  DATA_CORRECTION_GOVERNANCE_ENVELOPE_STATUSES,
  DATA_CORRECTION_GOVERNANCE_WRITER_BACKED_ACTION_ORDER,
  runDataCorrectionGovernanceAction,
  runDataCorrectionGovernanceActionAsync,
} = require('../../src/dataCorrection/dataCorrectionGovernanceOrchestrator');

const repoRoot = path.resolve(__dirname, '../..');
const serviceFile = path.join(repoRoot, 'src/dataCorrection/dataCorrectionGovernanceOrchestrator.js');

function baseCorrectionPayload(overrides = {}) {
  return {
    organizationId: 'org_orchestrator_001',
    timestamp: '2026-05-21T14:00:00.000Z',
    actor: {
      userId: 'dispatcher_orchestrator_001',
      role: 'dispatch_assistant',
      permissions: ['data_correction.apply', 'data_correction.request'],
    },
    caseContext: {
      caseId: 'case_orchestrator_001',
      organizationId: 'org_orchestrator_001',
    },
    appointmentContext: {
      appointmentId: 'apt_orchestrator_001',
      engineerReceivedTask: false,
      engineerDeparted: false,
      routeStarted: false,
      arrived: false,
    },
    correction: {
      fieldKey: 'issueSummary',
      fieldGroup: CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL,
      fromValue: 'old_value_should_not_leak',
      toValue: 'safe updated summary',
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

function baseUnablePayload(overrides = {}) {
  return {
    organizationId: 'org_orchestrator_001',
    actor: {
      userId: 'engineer_orchestrator_001',
      role: 'engineer',
      permissions: [],
    },
    caseContext: {
      caseId: 'case_orchestrator_001',
      organizationId: 'org_orchestrator_001',
    },
    appointmentContext: {
      appointmentId: 'apt_orchestrator_001',
      organizationId: 'org_orchestrator_001',
      assignedEngineerId: 'engineer_orchestrator_001',
      arrived: true,
    },
    result: {
      reasonCode: 'unable_to_complete',
      terminalState: TERMINAL_STATES.UNABLE_TO_COMPLETE,
      note: 'site condition mismatch',
      finalAppointmentId: 'final_appointment_should_not_leak',
    },
    ...overrides,
  };
}

function baseFollowUpPayload(overrides = {}) {
  return {
    organizationId: 'org_orchestrator_001',
    actor: {
      userId: 'dispatcher_orchestrator_001',
      role: 'dispatch_assistant',
      permissions: ['dispatch.follow_up.propose'],
    },
    caseContext: {
      caseId: 'case_orchestrator_001',
      organizationId: 'org_orchestrator_001',
    },
    appointmentContext: {
      appointmentId: 'apt_orchestrator_001',
      organizationId: 'org_orchestrator_001',
      terminalState: FOLLOW_UP_TERMINAL_STATES.FOLLOW_UP_REQUIRED,
    },
    proposal: {
      proposalType: FOLLOW_UP_PROPOSAL_TYPES.FOLLOW_UP_APPOINTMENT,
      reasonCode: 'follow_up_required',
      note: 'schedule follow-up',
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
    'ai_raw_payload_should_not_leak',
    'final_appointment_should_not_leak',
    'writer_failure_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbiddenValue), false, `leaked ${forbiddenValue}`);
  }
  assert.equal(serialized.includes('"finalAppointmentId"'), false);
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

test('exports immutable governance envelope status contract', () => {
  assert.equal(Object.isFrozen(DATA_CORRECTION_GOVERNANCE_ENVELOPE_STATUSES), true);
  assert.deepEqual(DATA_CORRECTION_GOVERNANCE_ENVELOPE_STATUSES, {
    DENY: 'deny',
    FAILED: 'failed',
    OK: 'ok',
  });

  assert.throws(() => {
    DATA_CORRECTION_GOVERNANCE_ENVELOPE_STATUSES.OK = 'unexpected';
  }, TypeError);
});

test('exports immutable governance action source contract', () => {
  assert.equal(Object.isFrozen(DATA_CORRECTION_GOVERNANCE_ACTION_ORDER), true);
  assert.deepEqual(DATA_CORRECTION_GOVERNANCE_ACTION_ORDER, Object.values(DATA_CORRECTION_GOVERNANCE_ACTIONS));
  assert.deepEqual(
    [...DATA_CORRECTION_GOVERNANCE_ACTION_ORDER].sort(),
    Object.values(DATA_CORRECTION_GOVERNANCE_ACTIONS).sort(),
  );
  assert.equal(Object.isFrozen(DATA_CORRECTION_GOVERNANCE_WRITER_BACKED_ACTION_ORDER), true);
  assert.deepEqual(DATA_CORRECTION_GOVERNANCE_WRITER_BACKED_ACTION_ORDER, [
    DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST,
    DATA_CORRECTION_GOVERNANCE_ACTIONS.FOLLOW_UP_PROPOSAL,
    DATA_CORRECTION_GOVERNANCE_ACTIONS.POST_DEPARTURE_FREEZE,
    DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
    DATA_CORRECTION_GOVERNANCE_ACTIONS.UNABLE_TO_COMPLETE_RESULT,
  ]);
  assert.equal(Object.isFrozen(DATA_CORRECTION_GOVERNANCE_ACTION_SOURCE_PATHS), true);
  assert.deepEqual(DATA_CORRECTION_GOVERNANCE_ACTION_SOURCE_PATHS, [
    'actionType',
    'payload.actionType',
  ]);

  assert.throws(() => {
    DATA_CORRECTION_GOVERNANCE_ACTION_ORDER.push('unsafe_action');
  }, TypeError);
  assert.throws(() => {
    DATA_CORRECTION_GOVERNANCE_WRITER_BACKED_ACTION_ORDER.push('unsafe_action');
  }, TypeError);
  assert.throws(() => {
    DATA_CORRECTION_GOVERNANCE_ACTION_SOURCE_PATHS.push('query.actionType');
  }, TypeError);
});

test('missing input safe denies', () => {
  const result = runDataCorrectionGovernanceAction();

  assert.equal(result.handled, false);
  assert.equal(result.status, DATA_CORRECTION_GOVERNANCE_ENVELOPE_STATUSES.DENY);
  assert.equal(result.decision, 'safe_deny');
  assert.equal(result.safeMessageKey, 'dataCorrection.unavailable');
});

test('unknown actionType safe denies', () => {
  const result = runDataCorrectionGovernanceAction({
    actionType: 'unknown_action',
    payload: baseCorrectionPayload(),
  });

  assert.equal(result.handled, false);
  assert.equal(result.status, 'deny');
  assert.equal(result.reasonCode, 'UNKNOWN_ACTION_TYPE');
});

test('payload actionType fallback is accepted without query or header action source', () => {
  const result = runDataCorrectionGovernanceAction({
    actionType: undefined,
    payload: {
      actionType: DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST,
      ...baseCorrectionPayload(),
    },
    query: {
      actionType: DATA_CORRECTION_GOVERNANCE_ACTIONS.FOLLOW_UP_PROPOSAL,
    },
    headers: {
      'x-action-type': DATA_CORRECTION_GOVERNANCE_ACTIONS.POST_DEPARTURE_FREEZE,
    },
  });

  assert.equal(result.handled, true);
  assert.equal(result.status, DATA_CORRECTION_GOVERNANCE_ENVELOPE_STATUSES.OK);
  assert.equal(result.actionType, DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST);
  assert.equal(result.result.decision, DATA_CORRECTION_DECISIONS.ALLOW_PRE_DEPARTURE_CORRECTION);
  assertSafeOutput(result);
});

test('data_correction_request routes to request service behavior', () => {
  const result = runDataCorrectionGovernanceAction({
    actionType: DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST,
    payload: baseCorrectionPayload(),
  });

  assert.equal(result.handled, true);
  assert.equal(result.status, 'ok');
  assert.equal(result.actionType, DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST);
  assert.equal(result.result.decision, DATA_CORRECTION_DECISIONS.ALLOW_PRE_DEPARTURE_CORRECTION);
  assertSafeOutput(result);
});

test('async data_correction_request awaits request writers through async orchestrator', async () => {
  const auditCalls = [];
  const result = await runDataCorrectionGovernanceActionAsync({
    actionType: DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST,
    payload: baseCorrectionPayload(),
  }, {
    async auditWriter(payload) {
      await Promise.resolve();
      auditCalls.push(payload);
      return { recorded: true };
    },
  });

  assert.equal(result.handled, true);
  assert.equal(result.actionType, DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST);
  assert.equal(auditCalls.length, 1);
  assertSafeOutput([result, auditCalls]);
});

test('data_correction_request does not call correctionWriter even when manual handling writers run', () => {
  const auditCalls = [];
  const contactLogCalls = [];
  const dispatchNoteCalls = [];
  const correctionCalls = [];
  const result = runDataCorrectionGovernanceAction({
    actionType: DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST,
    payload: baseCorrectionPayload({
      appointmentContext: {
        appointmentId: 'apt_orchestrator_001',
        engineerReceivedTask: true,
        engineerDeparted: true,
        routeStarted: false,
        arrived: false,
      },
    }),
  }, {
    auditWriter: createWriter(auditCalls),
    contactLogWriter: createWriter(contactLogCalls),
    dispatchNoteWriter: createWriter(dispatchNoteCalls),
    correctionWriter: createWriter(correctionCalls),
  });

  assert.equal(result.handled, true);
  assert.equal(result.status, DATA_CORRECTION_GOVERNANCE_ENVELOPE_STATUSES.OK);
  assert.equal(result.actionType, DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST);
  assert.equal(result.result.manualHandlingRequired, true);
  assert.equal(result.result.writerResults.audit.status, 'recorded');
  assert.equal(result.result.writerResults.contactLog.status, 'recorded');
  assert.equal(result.result.writerResults.dispatchNote.status, 'recorded');
  assert.equal(result.result.writerResults.correction, undefined);
  assert.equal(auditCalls.length, 1);
  assert.equal(contactLogCalls.length, 1);
  assert.equal(dispatchNoteCalls.length, 1);
  assert.equal(correctionCalls.length, 0);
  assertSafeOutput([result, auditCalls, contactLogCalls, dispatchNoteCalls, correctionCalls]);
});

test('pre_departure_apply routes to pre-departure service and calls correctionWriter for allowed non-phone correction', () => {
  const correctionCalls = [];
  const result = runDataCorrectionGovernanceAction({
    actionType: DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
    payload: baseCorrectionPayload(),
  }, {
    correctionWriter: createWriter(correctionCalls),
  });

  assert.equal(result.handled, true);
  assert.equal(result.status, 'ok');
  assert.equal(result.result.correctionApplied, true);
  assert.equal(correctionCalls.length, 1);
  assertSafeOutput([result, correctionCalls]);
});

test('pre_departure_apply phone correction does not call correctionWriter and returns re-verification required', () => {
  const correctionCalls = [];
  const result = runDataCorrectionGovernanceAction({
    actionType: DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
    payload: baseCorrectionPayload({
      correction: {
        fieldKey: 'phoneNumber',
        fieldGroup: CORRECTION_FIELD_GROUPS.PHONE_IDENTITY,
        toValue: 'raw_phone_should_not_leak',
      },
    }),
  }, {
    correctionWriter: createWriter(correctionCalls),
  });

  assert.equal(result.handled, false);
  assert.equal(result.status, 'deny');
  assert.equal(result.result.phoneReverificationRequired, true);
  assert.equal(correctionCalls.length, 0);
  assertSafeOutput(result);
});

test('pre_departure_apply after departure does not call correctionWriter and routes to manual handling metadata', () => {
  const correctionCalls = [];
  const result = runDataCorrectionGovernanceAction({
    actionType: DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
    payload: baseCorrectionPayload({
      appointmentContext: {
        appointmentId: 'apt_orchestrator_001',
        engineerReceivedTask: true,
        engineerDeparted: true,
        routeStarted: false,
        arrived: false,
      },
    }),
  }, {
    correctionWriter: createWriter(correctionCalls),
  });

  assert.equal(result.status, 'ok');
  assert.equal(result.result.manualHandlingRequired, true);
  assert.equal(correctionCalls.length, 0);
});

test('post_departure_freeze calls freeze writers for departed correction', () => {
  const contactLogCalls = [];
  const dispatchNoteCalls = [];
  const auditCalls = [];
  const result = runDataCorrectionGovernanceAction({
    actionType: DATA_CORRECTION_GOVERNANCE_ACTIONS.POST_DEPARTURE_FREEZE,
    payload: baseCorrectionPayload({
      appointmentContext: {
        appointmentId: 'apt_orchestrator_001',
        engineerReceivedTask: true,
        engineerDeparted: true,
        routeStarted: false,
        arrived: false,
      },
    }),
  }, {
    contactLogWriter: createWriter(contactLogCalls),
    dispatchNoteWriter: createWriter(dispatchNoteCalls),
    auditWriter: createWriter(auditCalls),
  });

  assert.equal(result.status, 'ok');
  assert.equal(contactLogCalls.length, 1);
  assert.equal(dispatchNoteCalls.length, 1);
  assert.equal(auditCalls.length, 1);
  assertSafeOutput([result, contactLogCalls, dispatchNoteCalls, auditCalls]);
});

test('async post_departure_freeze awaits freeze writers through async orchestrator', async () => {
  const contactLogCalls = [];
  const dispatchNoteCalls = [];
  const auditCalls = [];
  const result = await runDataCorrectionGovernanceActionAsync({
    actionType: DATA_CORRECTION_GOVERNANCE_ACTIONS.POST_DEPARTURE_FREEZE,
    payload: baseCorrectionPayload({
      appointmentContext: {
        appointmentId: 'apt_orchestrator_001',
        engineerReceivedTask: true,
        engineerDeparted: true,
        routeStarted: false,
        arrived: false,
      },
    }),
  }, {
    async contactLogWriter(payload) {
      contactLogCalls.push(payload);
      return { recorded: true };
    },
    async dispatchNoteWriter(payload) {
      dispatchNoteCalls.push(payload);
      return { persisted: true };
    },
    async auditWriter(payload) {
      auditCalls.push(payload);
      return { ok: true };
    },
  });

  assert.equal(result.status, 'ok');
  assert.equal(result.result.manualHandlingRequired, true);
  assert.equal(result.result.writerResults.contactLog.status, 'recorded');
  assert.equal(result.result.writerResults.dispatchNote.status, 'recorded');
  assert.equal(result.result.writerResults.audit.status, 'recorded');
  assert.equal(contactLogCalls.length, 1);
  assert.equal(dispatchNoteCalls.length, 1);
  assert.equal(auditCalls.length, 1);
  assertSafeOutput([result, contactLogCalls, dispatchNoteCalls, auditCalls]);
});

test('async post_departure_freeze honors async writer failure safely', async () => {
  const result = await runDataCorrectionGovernanceActionAsync({
    actionType: DATA_CORRECTION_GOVERNANCE_ACTIONS.POST_DEPARTURE_FREEZE,
    payload: baseCorrectionPayload({
      appointmentContext: {
        appointmentId: 'apt_orchestrator_001',
        engineerReceivedTask: true,
        engineerDeparted: true,
        routeStarted: false,
        arrived: false,
      },
    }),
  }, {
    async contactLogWriter() {
      return { persisted: false, rawError: 'writer_failure_should_not_leak' };
    },
  });

  assert.equal(result.status, 'failed');
  assert.equal(result.safeMessageKey, 'dataCorrection.writerFailed');
  assertSafeOutput(result);
});

test('unable_to_complete_result calls appointment result writer for arrived assigned engineer', () => {
  const appointmentResultCalls = [];
  const result = runDataCorrectionGovernanceAction({
    actionType: DATA_CORRECTION_GOVERNANCE_ACTIONS.UNABLE_TO_COMPLETE_RESULT,
    payload: baseUnablePayload(),
  }, {
    appointmentResultWriter: createWriter(appointmentResultCalls),
  });

  assert.equal(result.status, 'ok');
  assert.equal(result.result.fieldServiceReportCreated, false);
  assert.equal(appointmentResultCalls.length, 1);
  assertSafeOutput([result, appointmentResultCalls]);
});

test('async unable_to_complete_result awaits appointment result evidence and audit writers', async () => {
  const appointmentResultCalls = [];
  const evidenceCalls = [];
  const auditCalls = [];
  const result = await runDataCorrectionGovernanceActionAsync({
    actionType: DATA_CORRECTION_GOVERNANCE_ACTIONS.UNABLE_TO_COMPLETE_RESULT,
    payload: baseUnablePayload({
      result: {
        reasonCode: 'unable_to_complete',
        terminalState: TERMINAL_STATES.UNABLE_TO_COMPLETE,
        note: 'site condition mismatch',
        evidenceRefs: ['photo_ref_test_001'],
        finalAppointmentId: 'final_appointment_should_not_leak',
      },
    }),
  }, {
    async appointmentResultWriter(payload) {
      appointmentResultCalls.push(payload);
      return { recorded: true };
    },
    async evidenceWriter(payload) {
      evidenceCalls.push(payload);
      return { persisted: true };
    },
    async auditWriter(payload) {
      auditCalls.push(payload);
      return { ok: true };
    },
  });

  assert.equal(result.status, 'ok');
  assert.equal(result.result.fieldServiceReportCreated, false);
  assert.equal(result.result.writerResults.appointmentResult.status, 'recorded');
  assert.equal(result.result.writerResults.evidence.status, 'recorded');
  assert.equal(result.result.writerResults.audit.status, 'recorded');
  assert.equal(appointmentResultCalls.length, 1);
  assert.equal(evidenceCalls.length, 1);
  assert.equal(auditCalls.length, 1);
  assertSafeOutput([result, appointmentResultCalls, evidenceCalls, auditCalls]);
});

test('async unable_to_complete_result honors async writer failure safely', async () => {
  const result = await runDataCorrectionGovernanceActionAsync({
    actionType: DATA_CORRECTION_GOVERNANCE_ACTIONS.UNABLE_TO_COMPLETE_RESULT,
    payload: baseUnablePayload(),
  }, {
    async appointmentResultWriter() {
      return { recorded: false, rawError: 'writer_failure_should_not_leak' };
    },
  });

  assert.equal(result.status, 'failed');
  assert.equal(result.safeMessageKey, 'appointmentResult.writerFailed');
  assertSafeOutput(result);
});

test('follow_up_proposal calls follow-up draft writer for supported terminal source appointment', () => {
  const draftCalls = [];
  const result = runDataCorrectionGovernanceAction({
    actionType: DATA_CORRECTION_GOVERNANCE_ACTIONS.FOLLOW_UP_PROPOSAL,
    payload: baseFollowUpPayload(),
  }, {
    followUpDraftWriter: createWriter(draftCalls),
  });

  assert.equal(result.status, 'ok');
  assert.equal(result.result.formalAppointmentCreated, false);
  assert.equal(draftCalls.length, 1);
  assertSafeOutput([result, draftCalls]);
});

test('async follow_up_proposal awaits draft dispatch note and audit writers', async () => {
  const draftCalls = [];
  const dispatchNoteCalls = [];
  const auditCalls = [];
  const result = await runDataCorrectionGovernanceActionAsync({
    actionType: DATA_CORRECTION_GOVERNANCE_ACTIONS.FOLLOW_UP_PROPOSAL,
    payload: baseFollowUpPayload({
      proposal: {
        proposalType: FOLLOW_UP_PROPOSAL_TYPES.FOLLOW_UP_APPOINTMENT,
        reasonCode: 'follow_up_required',
        note: 'schedule follow up',
        requiredPartsRefs: ['part_ref_test_001'],
        finalAppointmentId: 'final_appointment_should_not_leak',
      },
    }),
  }, {
    async followUpDraftWriter(payload) {
      draftCalls.push(payload);
      return { recorded: true };
    },
    async dispatchNoteWriter(payload) {
      dispatchNoteCalls.push(payload);
      return { persisted: true };
    },
    async auditWriter(payload) {
      auditCalls.push(payload);
      return { ok: true };
    },
  });

  assert.equal(result.status, 'ok');
  assert.equal(result.result.formalAppointmentCreated, false);
  assert.equal(result.result.writerResults.followUpDraft.status, 'recorded');
  assert.equal(result.result.writerResults.dispatchNote.status, 'recorded');
  assert.equal(result.result.writerResults.audit.status, 'recorded');
  assert.equal(draftCalls.length, 1);
  assert.equal(dispatchNoteCalls.length, 1);
  assert.equal(auditCalls.length, 1);
  assertSafeOutput([result, draftCalls, dispatchNoteCalls, auditCalls]);
});

test('async follow_up_proposal honors async writer failure safely', async () => {
  const result = await runDataCorrectionGovernanceActionAsync({
    actionType: DATA_CORRECTION_GOVERNANCE_ACTIONS.FOLLOW_UP_PROPOSAL,
    payload: baseFollowUpPayload(),
  }, {
    async followUpDraftWriter() {
      return { recorded: false, rawError: 'writer_failure_should_not_leak' };
    },
  });

  assert.equal(result.status, 'failed');
  assert.equal(result.safeMessageKey, 'followUpProposal.writerFailed');
  assertSafeOutput(result);
});

test('writer throw in downstream service does not leak raw error through orchestrator', () => {
  const result = runDataCorrectionGovernanceAction({
    actionType: DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
    payload: baseCorrectionPayload(),
  }, {
    correctionWriter() {
      throw new Error('writer_failure_should_not_leak');
    },
  });

  assert.equal(result.status, 'failed');
  assertSafeOutput(result);
});

test('async pre_departure_apply awaits correction writer through async orchestrator', async () => {
  const correctionCalls = [];
  const result = await runDataCorrectionGovernanceActionAsync({
    actionType: DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
    payload: baseCorrectionPayload(),
  }, {
    async correctionWriter(payload) {
      correctionCalls.push(payload);
      return { recorded: true };
    },
  });

  assert.equal(result.status, 'ok');
  assert.equal(result.result.correctionApplied, true);
  assert.equal(correctionCalls.length, 1);
  assertSafeOutput([result, correctionCalls]);
});

test('async pre_departure_apply honors async correction writer failure safely', async () => {
  const result = await runDataCorrectionGovernanceActionAsync({
    actionType: DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
    payload: baseCorrectionPayload(),
  }, {
    async correctionWriter() {
      return { recorded: false, rawError: 'writer_failure_should_not_leak' };
    },
  });

  assert.equal(result.status, 'failed');
  assert.equal(result.safeMessageKey, 'dataCorrection.writerFailed');
  assertSafeOutput(result);
});

test('output excludes raw sensitive values', () => {
  const result = runDataCorrectionGovernanceAction({
    actionType: DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST,
    payload: baseCorrectionPayload({
      correction: {
        fieldKey: 'issueSummary',
        fieldGroup: CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL,
        toValue: 'raw_phone_should_not_leak token_should_not_leak',
        finalAppointmentId: 'final_appointment_should_not_leak',
      },
    }),
  });

  assertSafeOutput(result);
});

test('input object is not mutated', () => {
  const input = {
    actionType: DATA_CORRECTION_GOVERNANCE_ACTIONS.FOLLOW_UP_PROPOSAL,
    payload: baseFollowUpPayload(),
  };
  const before = clone(input);

  runDataCorrectionGovernanceAction(input, {
    followUpDraftWriter() {},
  });

  assert.deepEqual(input, before);
});

test('module import boundary has no DB, repository, provider, notification, AI, or RAG imports', () => {
  const source = fs.readFileSync(serviceFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, [
    './dataCorrectionRequestService',
    './preDepartureCorrectionApplicationService',
    './postDepartureCorrectionFreezeService',
    './unableToCompleteAppointmentResultService',
    './followUpAppointmentProposalService',
  ]);
  assert.equal(specifiers.some((specifier) => /db|pool|repository|transaction|provider|line|sms|email|push|ai|rag|vector/i.test(specifier)), false);
});
