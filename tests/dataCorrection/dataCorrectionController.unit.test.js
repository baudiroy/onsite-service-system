'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  DATA_CORRECTION_CONTROLLER_ACTION_SOURCE_PATHS,
  DATA_CORRECTION_CONTROLLER_ASYNC_ACTIONS,
  DATA_CORRECTION_CONTROLLER_ASYNC_ACTION_ORDER,
  DATA_CORRECTION_CONTROLLER_DECISIONS,
  DATA_CORRECTION_CONTROLLER_REQUEST_CONTEXT_KEYS,
  DATA_CORRECTION_CONTROLLER_SANITIZER_PATTERNS,
  DATA_CORRECTION_CONTROLLER_SAFE_MESSAGE_KEYS,
  DATA_CORRECTION_CONTROLLER_STATUS_CODES,
  DATA_CORRECTION_CONTROLLER_WRITER_OPTION_KEYS,
  buildDataCorrectionGovernanceResponse,
  buildDataCorrectionGovernanceResponseAsync,
  createDataCorrectionGovernanceHandler,
  handleDataCorrectionGovernanceRequest,
  handleDataCorrectionGovernanceRequestAsync,
} = require('../../src/controllers/dataCorrectionController');
const {
  CORRECTION_FIELD_GROUPS,
} = require('../../src/dataCorrection/dataCorrectionPolicyEngine');
const {
  DATA_CORRECTION_GOVERNANCE_ACTIONS,
} = require('../../src/dataCorrection/dataCorrectionGovernanceOrchestrator');
const {
  FOLLOW_UP_PROPOSAL_TYPES,
  FOLLOW_UP_TERMINAL_STATES,
} = require('../../src/dataCorrection/followUpAppointmentProposalService');
const {
  TERMINAL_STATES,
} = require('../../src/dataCorrection/unableToCompleteAppointmentResultService');

const repoRoot = path.resolve(__dirname, '../..');
const controllerFile = path.join(repoRoot, 'src/controllers/dataCorrectionController.js');

function auth(overrides = {}) {
  return {
    organizationId: 'org_data_correction_controller_001',
    userId: 'user_data_correction_controller_001',
    role: 'dispatch_assistant',
    permissions: ['data_correction.apply', 'data_correction.request', 'dispatch.follow_up.propose'],
    ...overrides,
  };
}

function baseCorrectionPayload(overrides = {}) {
  return {
    caseContext: {
      caseId: 'case_data_correction_controller_001',
      organizationId: 'org_data_correction_controller_001',
    },
    appointmentContext: {
      appointmentId: 'apt_data_correction_controller_001',
      engineerReceivedTask: false,
      engineerDeparted: false,
      routeStarted: false,
      arrived: false,
    },
    correction: {
      fieldKey: 'issueSummary',
      fieldGroup: CORRECTION_FIELD_GROUPS.DISPATCH_OPERATIONAL,
      fromValue: 'old_value_should_not_leak',
      toValue: 'safe updated issue',
      rawPhone: 'raw_phone_should_not_leak',
      rawAddress: 'raw_address_should_not_leak',
      rawLineUserId: 'line_user_should_not_leak',
      token: 'token_should_not_leak',
      secret: 'secret_should_not_leak',
      internalNote: 'internal_note_should_not_leak',
      auditRawPayload: 'audit_raw_should_not_leak',
      aiRawPayload: 'ai_raw_payload_should_not_leak',
      finalAppointmentId: 'final_appointment_should_not_leak',
    },
    ...overrides,
  };
}

function unablePayload(overrides = {}) {
  return {
    caseContext: {
      caseId: 'case_data_correction_controller_001',
      organizationId: 'org_data_correction_controller_001',
    },
    appointmentContext: {
      appointmentId: 'apt_data_correction_controller_001',
      organizationId: 'org_data_correction_controller_001',
      assignedEngineerId: 'engineer_data_correction_controller_001',
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

function followUpPayload(overrides = {}) {
  return {
    caseContext: {
      caseId: 'case_data_correction_controller_001',
      organizationId: 'org_data_correction_controller_001',
    },
    appointmentContext: {
      appointmentId: 'apt_data_correction_controller_001',
      organizationId: 'org_data_correction_controller_001',
      terminalState: FOLLOW_UP_TERMINAL_STATES.FOLLOW_UP_REQUIRED,
    },
    proposal: {
      proposalType: FOLLOW_UP_PROPOSAL_TYPES.FOLLOW_UP_APPOINTMENT,
      reasonCode: 'follow_up_required',
      note: 'schedule follow up',
      finalAppointmentId: 'final_appointment_should_not_leak',
    },
    ...overrides,
  };
}

function req(actionType, payload, authOverrides = {}) {
  return {
    auth: auth(authOverrides),
    body: {
      actionType,
      payload,
    },
  };
}

function createResponse() {
  return {
    statusCalls: [],
    jsonCalls: [],
    status(statusCode) {
      this.statusCalls.push(statusCode);
      return this;
    },
    json(body) {
      this.jsonCalls.push(body);
      return this;
    },
  };
}

function createWriter(calls) {
  return function writer(payload) {
    calls.push(payload);
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
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
    'DATABASE_URL',
    'DB_URL',
    'POSTGRES_URL',
    'internal_note_should_not_leak',
    'audit_raw_should_not_leak',
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

test('exports controller helpers', () => {
  assert.equal(Object.isFrozen(DATA_CORRECTION_CONTROLLER_ACTION_SOURCE_PATHS), true);
  assert.equal(Object.isFrozen(DATA_CORRECTION_CONTROLLER_ASYNC_ACTIONS), true);
  assert.equal(Object.isFrozen(DATA_CORRECTION_CONTROLLER_ASYNC_ACTION_ORDER), true);
  assert.equal(Object.isFrozen(DATA_CORRECTION_CONTROLLER_DECISIONS), true);
  assert.equal(Object.isFrozen(DATA_CORRECTION_CONTROLLER_REQUEST_CONTEXT_KEYS), true);
  assert.equal(Object.isFrozen(DATA_CORRECTION_CONTROLLER_SANITIZER_PATTERNS), true);
  assert.equal(Object.isFrozen(DATA_CORRECTION_CONTROLLER_SANITIZER_PATTERNS.FORBIDDEN_KEY), true);
  assert.equal(Object.isFrozen(DATA_CORRECTION_CONTROLLER_SANITIZER_PATTERNS.SENSITIVE_STRING), true);
  assert.equal(Object.isFrozen(DATA_CORRECTION_CONTROLLER_SAFE_MESSAGE_KEYS), true);
  assert.equal(Object.isFrozen(DATA_CORRECTION_CONTROLLER_STATUS_CODES), true);
  assert.equal(Object.isFrozen(DATA_CORRECTION_CONTROLLER_WRITER_OPTION_KEYS), true);
  assert.equal(typeof buildDataCorrectionGovernanceResponse, 'function');
  assert.equal(typeof buildDataCorrectionGovernanceResponseAsync, 'function');
  assert.equal(typeof handleDataCorrectionGovernanceRequest, 'function');
  assert.equal(typeof handleDataCorrectionGovernanceRequestAsync, 'function');
  assert.equal(typeof createDataCorrectionGovernanceHandler, 'function');
});

test('exports immutable controller request context and action source contracts', () => {
  assert.deepEqual(DATA_CORRECTION_CONTROLLER_ACTION_SOURCE_PATHS, [
    'body.actionType',
    'body.payload.actionType',
  ]);
  assert.deepEqual(DATA_CORRECTION_CONTROLLER_REQUEST_CONTEXT_KEYS, {
    AUTH: 'auth',
    PERMISSION_CONTEXT: 'dataCorrectionPermissionContext',
  });

  assert.throws(() => {
    DATA_CORRECTION_CONTROLLER_ACTION_SOURCE_PATHS.push('headers.x-action-type');
  }, TypeError);
  assert.throws(() => {
    DATA_CORRECTION_CONTROLLER_REQUEST_CONTEXT_KEYS.AUTH = 'session';
  }, TypeError);
});

test('exports immutable controller writer option key contract', () => {
  assert.deepEqual(DATA_CORRECTION_CONTROLLER_WRITER_OPTION_KEYS, {
    APPOINTMENT_RESULT_WRITER: 'appointmentResultWriter',
    AUDIT_WRITER: 'auditWriter',
    CONTACT_LOG_WRITER: 'contactLogWriter',
    CORRECTION_WRITER: 'correctionWriter',
    DISPATCH_NOTE_WRITER: 'dispatchNoteWriter',
    ENGINEER_NOTIFICATION_WRITER: 'engineerNotificationWriter',
    EVIDENCE_WRITER: 'evidenceWriter',
    FOLLOW_UP_DRAFT_WRITER: 'followUpDraftWriter',
  });

  assert.throws(() => {
    DATA_CORRECTION_CONTROLLER_WRITER_OPTION_KEYS.CORRECTION_WRITER = 'unsafeWriter';
  }, TypeError);
});

test('exports immutable controller sanitizer pattern contract', () => {
  assert.equal(DATA_CORRECTION_CONTROLLER_SANITIZER_PATTERNS.FORBIDDEN_KEY.test('finalAppointmentId'), true);
  assert.equal(DATA_CORRECTION_CONTROLLER_SANITIZER_PATTERNS.FORBIDDEN_KEY.test('line_channel_id'), true);
  assert.equal(DATA_CORRECTION_CONTROLLER_SANITIZER_PATTERNS.FORBIDDEN_KEY.test('displayName'), false);
  assert.equal(DATA_CORRECTION_CONTROLLER_SANITIZER_PATTERNS.SENSITIVE_STRING.test('raw_phone_should_not_leak'), true);
  assert.equal(DATA_CORRECTION_CONTROLLER_SANITIZER_PATTERNS.SENSITIVE_STRING.test('safe updated issue'), false);

  assert.throws(() => {
    DATA_CORRECTION_CONTROLLER_SANITIZER_PATTERNS.FORBIDDEN_KEY = /unsafe/;
  }, TypeError);
});

test('exports immutable controller decision contract', () => {
  assert.deepEqual(DATA_CORRECTION_CONTROLLER_DECISIONS, {
    SAFE_DENY: 'safe_deny',
  });

  assert.throws(() => {
    DATA_CORRECTION_CONTROLLER_DECISIONS.SAFE_DENY = 'unsafe_decision';
  }, TypeError);
});

test('exports immutable controller safe message key contract', () => {
  assert.deepEqual(DATA_CORRECTION_CONTROLLER_SAFE_MESSAGE_KEYS, {
    BAD_REQUEST: 'dataCorrection.badRequest',
    FORBIDDEN: 'dataCorrection.forbidden',
  });

  assert.throws(() => {
    DATA_CORRECTION_CONTROLLER_SAFE_MESSAGE_KEYS.FORBIDDEN = 'unsafe.message';
  }, TypeError);
});

test('exports immutable controller async action routing contract', () => {
  assert.deepEqual(DATA_CORRECTION_CONTROLLER_ASYNC_ACTIONS, {
    DATA_CORRECTION_REQUEST: DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST,
    FOLLOW_UP_PROPOSAL: DATA_CORRECTION_GOVERNANCE_ACTIONS.FOLLOW_UP_PROPOSAL,
    POST_DEPARTURE_FREEZE: DATA_CORRECTION_GOVERNANCE_ACTIONS.POST_DEPARTURE_FREEZE,
    PRE_DEPARTURE_APPLY: DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
    UNABLE_TO_COMPLETE_RESULT: DATA_CORRECTION_GOVERNANCE_ACTIONS.UNABLE_TO_COMPLETE_RESULT,
  });
  assert.deepEqual(DATA_CORRECTION_CONTROLLER_ASYNC_ACTION_ORDER, [
    DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST,
    DATA_CORRECTION_GOVERNANCE_ACTIONS.FOLLOW_UP_PROPOSAL,
    DATA_CORRECTION_GOVERNANCE_ACTIONS.POST_DEPARTURE_FREEZE,
    DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
    DATA_CORRECTION_GOVERNANCE_ACTIONS.UNABLE_TO_COMPLETE_RESULT,
  ]);

  assert.throws(() => {
    DATA_CORRECTION_CONTROLLER_ASYNC_ACTIONS.PRE_DEPARTURE_APPLY = 'unsafe_action';
  }, TypeError);
  assert.throws(() => {
    DATA_CORRECTION_CONTROLLER_ASYNC_ACTION_ORDER.push('unsafe_action');
  }, TypeError);
});

test('exports immutable controller status code contract', () => {
  assert.deepEqual(DATA_CORRECTION_CONTROLLER_STATUS_CODES, {
    BAD_REQUEST: 400,
    FORBIDDEN: 403,
    OK: 200,
  });

  assert.throws(() => {
    DATA_CORRECTION_CONTROLLER_STATUS_CODES.OK = 299;
  }, TypeError);
});

test('missing auth returns generic 403 safe deny', () => {
  const response = buildDataCorrectionGovernanceResponse({
    body: {
      actionType: DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST,
      payload: baseCorrectionPayload(),
    },
  });

  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, {
    status: 'deny',
    decision: 'safe_deny',
    safeMessageKey: 'dataCorrection.forbidden',
  });
  assertSafeOutput(response.body);
});

test('controller ignores header and session auth-like sources', () => {
  const response = buildDataCorrectionGovernanceResponse({
    headers: {
      authorization: 'Bearer token_should_not_leak',
    },
    session: {
      auth: auth(),
    },
    body: {
      actionType: DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST,
      payload: baseCorrectionPayload(),
    },
  });

  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, {
    status: 'deny',
    decision: 'safe_deny',
    safeMessageKey: 'dataCorrection.forbidden',
  });
  assertSafeOutput(response.body);
});

test('pre-departure apply request calls orchestrator through controller and returns safe 200 envelope', () => {
  const correctionCalls = [];
  const response = buildDataCorrectionGovernanceResponse(
    req(DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY, baseCorrectionPayload()),
    { correctionWriter: createWriter(correctionCalls) },
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.result.correctionApplied, true);
  assert.equal(correctionCalls.length, 1);
  assertSafeOutput([response.body, correctionCalls]);
});

test('controller accepts payload actionType fallback but ignores query and header action sources', () => {
  const correctionCalls = [];
  const response = buildDataCorrectionGovernanceResponse(
    {
      auth: auth({ permissions: ['data_correction.apply'] }),
      query: {
        actionType: DATA_CORRECTION_GOVERNANCE_ACTIONS.FOLLOW_UP_PROPOSAL,
      },
      headers: {
        'x-action-type': DATA_CORRECTION_GOVERNANCE_ACTIONS.UNABLE_TO_COMPLETE_RESULT,
      },
      body: {
        actionType: undefined,
        payload: {
          actionType: DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
          ...baseCorrectionPayload(),
        },
      },
    },
    { correctionWriter: createWriter(correctionCalls) },
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(correctionCalls.length, 1);
  assertSafeOutput([response.body, correctionCalls]);
});

test('controller can use route permission context as safe governance auth source', () => {
  const correctionCalls = [];
  const response = buildDataCorrectionGovernanceResponse(
    {
      dataCorrectionPermissionContext: {
        organizationId: 'org_data_correction_controller_001',
        userId: 'user_permission_context_001',
        role: 'dispatch_assistant',
        permissions: ['data_correction.apply'],
      },
      body: {
        actionType: DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
        payload: {
          ...baseCorrectionPayload(),
          actor: {
            userId: 'payload_actor_should_not_win',
            role: 'ai',
            permissions: [],
          },
          organizationId: 'payload_org_should_not_win',
        },
      },
    },
    { correctionWriter: createWriter(correctionCalls) },
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(correctionCalls.length, 1);
  assert.equal(correctionCalls[0].organizationId, 'org_data_correction_controller_001');
  assert.equal(correctionCalls[0].actor.userId, 'user_permission_context_001');
  assert.equal(correctionCalls[0].actor.role, 'dispatch_assistant');
  assertSafeOutput([response.body, correctionCalls]);
});

test('controller denies action not present in route permission context allowedActionTypes', () => {
  const correctionCalls = [];
  const response = buildDataCorrectionGovernanceResponse(
    {
      dataCorrectionPermissionContext: {
        organizationId: 'org_data_correction_controller_001',
        userId: 'user_permission_context_001',
        role: 'dispatch_assistant',
        permissions: ['data_correction.request'],
        allowedActionTypes: [DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST],
      },
      body: {
        actionType: DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
        payload: baseCorrectionPayload(),
      },
    },
    { correctionWriter: createWriter(correctionCalls) },
  );

  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, {
    status: 'deny',
    decision: 'safe_deny',
    safeMessageKey: 'dataCorrection.forbidden',
  });
  assert.equal(correctionCalls.length, 0);
  assertSafeOutput(response.body);
});

test('phone correction returns re-verification response and does not expose phone raw value', () => {
  const correctionCalls = [];
  const response = buildDataCorrectionGovernanceResponse(
    req(DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY, baseCorrectionPayload({
      correction: {
        fieldKey: 'phoneNumber',
        fieldGroup: CORRECTION_FIELD_GROUPS.PHONE_IDENTITY,
        toValue: 'raw_phone_should_not_leak',
      },
    })),
    { correctionWriter: createWriter(correctionCalls) },
  );

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.phoneReverificationRequired, true);
  assert.equal(correctionCalls.length, 0);
  assertSafeOutput(response.body);
});

test('post-departure freeze request returns manual handling safe response', () => {
  const contactLogCalls = [];
  const dispatchNoteCalls = [];
  const response = buildDataCorrectionGovernanceResponse(
    req(DATA_CORRECTION_GOVERNANCE_ACTIONS.POST_DEPARTURE_FREEZE, baseCorrectionPayload({
      appointmentContext: {
        appointmentId: 'apt_data_correction_controller_001',
        engineerReceivedTask: true,
        engineerDeparted: true,
        routeStarted: false,
        arrived: false,
      },
    })),
    {
      contactLogWriter: createWriter(contactLogCalls),
      dispatchNoteWriter: createWriter(dispatchNoteCalls),
    },
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.result.manualHandlingRequired, true);
  assert.equal(contactLogCalls.length, 1);
  assert.equal(dispatchNoteCalls.length, 1);
  assertSafeOutput([response.body, contactLogCalls, dispatchNoteCalls]);
});

test('async controller response awaits post-departure freeze writers', async () => {
  const contactLogCalls = [];
  const dispatchNoteCalls = [];
  const auditCalls = [];
  const response = await buildDataCorrectionGovernanceResponseAsync(
    req(DATA_CORRECTION_GOVERNANCE_ACTIONS.POST_DEPARTURE_FREEZE, baseCorrectionPayload({
      appointmentContext: {
        appointmentId: 'apt_data_correction_controller_001',
        engineerReceivedTask: true,
        engineerDeparted: true,
        routeStarted: false,
        arrived: false,
      },
    })),
    {
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
    },
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.result.manualHandlingRequired, true);
  assert.equal(response.body.result.writerResults.contactLog.status, 'recorded');
  assert.equal(response.body.result.writerResults.dispatchNote.status, 'recorded');
  assert.equal(response.body.result.writerResults.audit.status, 'recorded');
  assert.equal(contactLogCalls.length, 1);
  assert.equal(dispatchNoteCalls.length, 1);
  assert.equal(auditCalls.length, 1);
  assertSafeOutput([response.body, contactLogCalls, dispatchNoteCalls, auditCalls]);
});

test('async controller response honors async post-departure writer failure safely', async () => {
  const response = await buildDataCorrectionGovernanceResponseAsync(
    req(DATA_CORRECTION_GOVERNANCE_ACTIONS.POST_DEPARTURE_FREEZE, baseCorrectionPayload({
      appointmentContext: {
        appointmentId: 'apt_data_correction_controller_001',
        engineerReceivedTask: true,
        engineerDeparted: true,
        routeStarted: false,
        arrived: false,
      },
    })),
    {
      async contactLogWriter() {
        return { recorded: false, rawError: 'writer_failure_should_not_leak' };
      },
    },
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'failed');
  assert.equal(response.body.safeMessageKey, 'dataCorrection.writerFailed');
  assertSafeOutput(response.body);
});

test('unable-to-complete result request returns safe response without FSR or finalAppointmentId', () => {
  const appointmentResultCalls = [];
  const response = buildDataCorrectionGovernanceResponse(
    req(DATA_CORRECTION_GOVERNANCE_ACTIONS.UNABLE_TO_COMPLETE_RESULT, unablePayload(), {
      userId: 'engineer_data_correction_controller_001',
      role: 'engineer',
      permissions: [],
    }),
    { appointmentResultWriter: createWriter(appointmentResultCalls) },
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.result.fieldServiceReportCreated, false);
  assert.equal(appointmentResultCalls.length, 1);
  assertSafeOutput([response.body, appointmentResultCalls]);
});

test('async controller response awaits unable-to-complete writers', async () => {
  const appointmentResultCalls = [];
  const evidenceCalls = [];
  const auditCalls = [];
  const response = await buildDataCorrectionGovernanceResponseAsync(
    req(DATA_CORRECTION_GOVERNANCE_ACTIONS.UNABLE_TO_COMPLETE_RESULT, unablePayload({
      result: {
        reasonCode: 'unable_to_complete',
        terminalState: TERMINAL_STATES.UNABLE_TO_COMPLETE,
        note: 'site condition mismatch',
        evidenceRefs: ['photo_ref_test_001'],
        finalAppointmentId: 'final_appointment_should_not_leak',
      },
    }), {
      userId: 'engineer_data_correction_controller_001',
      role: 'engineer',
      permissions: [],
    }),
    {
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
    },
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.result.fieldServiceReportCreated, false);
  assert.equal(response.body.result.writerResults.appointmentResult.status, 'recorded');
  assert.equal(response.body.result.writerResults.evidence.status, 'recorded');
  assert.equal(response.body.result.writerResults.audit.status, 'recorded');
  assert.equal(appointmentResultCalls.length, 1);
  assert.equal(evidenceCalls.length, 1);
  assert.equal(auditCalls.length, 1);
  assertSafeOutput([response.body, appointmentResultCalls, evidenceCalls, auditCalls]);
});

test('async controller response honors async unable-to-complete writer failure safely', async () => {
  const response = await buildDataCorrectionGovernanceResponseAsync(
    req(DATA_CORRECTION_GOVERNANCE_ACTIONS.UNABLE_TO_COMPLETE_RESULT, unablePayload(), {
      userId: 'engineer_data_correction_controller_001',
      role: 'engineer',
      permissions: [],
    }),
    {
      async appointmentResultWriter() {
        return { recorded: false, rawError: 'writer_failure_should_not_leak' };
      },
    },
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'failed');
  assert.equal(response.body.safeMessageKey, 'appointmentResult.writerFailed');
  assertSafeOutput(response.body);
});

test('follow-up proposal request returns safe response without formal appointment creation', () => {
  const followUpCalls = [];
  const response = buildDataCorrectionGovernanceResponse(
    req(DATA_CORRECTION_GOVERNANCE_ACTIONS.FOLLOW_UP_PROPOSAL, followUpPayload()),
    { followUpDraftWriter: createWriter(followUpCalls) },
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.result.formalAppointmentCreated, false);
  assert.equal(followUpCalls.length, 1);
  assertSafeOutput([response.body, followUpCalls]);
});

test('async controller response awaits follow-up proposal writers', async () => {
  const followUpCalls = [];
  const dispatchNoteCalls = [];
  const auditCalls = [];
  const response = await buildDataCorrectionGovernanceResponseAsync(
    req(DATA_CORRECTION_GOVERNANCE_ACTIONS.FOLLOW_UP_PROPOSAL, followUpPayload({
      proposal: {
        proposalType: FOLLOW_UP_PROPOSAL_TYPES.FOLLOW_UP_APPOINTMENT,
        reasonCode: 'follow_up_required',
        note: 'schedule follow up',
        requiredPartsRefs: ['part_ref_test_001'],
        finalAppointmentId: 'final_appointment_should_not_leak',
      },
    })),
    {
      async followUpDraftWriter(payload) {
        followUpCalls.push(payload);
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
    },
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.result.formalAppointmentCreated, false);
  assert.equal(response.body.result.writerResults.followUpDraft.status, 'recorded');
  assert.equal(response.body.result.writerResults.dispatchNote.status, 'recorded');
  assert.equal(response.body.result.writerResults.audit.status, 'recorded');
  assert.equal(followUpCalls.length, 1);
  assert.equal(dispatchNoteCalls.length, 1);
  assert.equal(auditCalls.length, 1);
  assertSafeOutput([response.body, followUpCalls, dispatchNoteCalls, auditCalls]);
});

test('async controller response honors async follow-up proposal writer failure safely', async () => {
  const response = await buildDataCorrectionGovernanceResponseAsync(
    req(DATA_CORRECTION_GOVERNANCE_ACTIONS.FOLLOW_UP_PROPOSAL, followUpPayload()),
    {
      async followUpDraftWriter() {
        return { recorded: false, rawError: 'writer_failure_should_not_leak' };
      },
    },
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'failed');
  assert.equal(response.body.safeMessageKey, 'followUpProposal.writerFailed');
  assertSafeOutput(response.body);
});

test('injected writer options are passed through and can be called by downstream orchestrator', () => {
  const auditCalls = [];
  const response = buildDataCorrectionGovernanceResponse(
    req(DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST, baseCorrectionPayload({
      correction: {
        fieldKey: 'phone',
        fieldGroup: CORRECTION_FIELD_GROUPS.PHONE_IDENTITY,
        toValue: 'raw_phone_should_not_leak',
      },
    })),
    { auditWriter: createWriter(auditCalls) },
  );

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.phoneReverificationRequired, true);
  assert.equal(auditCalls.length, 1);
  assertSafeOutput([response.body, auditCalls]);
});

test('data correction request controller path does not call correctionWriter when request writers run', () => {
  const auditCalls = [];
  const contactLogCalls = [];
  const dispatchNoteCalls = [];
  const correctionCalls = [];
  const response = buildDataCorrectionGovernanceResponse(
    req(DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST, baseCorrectionPayload({
      appointmentContext: {
        appointmentId: 'apt_data_correction_controller_001',
        engineerReceivedTask: true,
        engineerDeparted: true,
        routeStarted: false,
        arrived: false,
      },
    })),
    {
      auditWriter: createWriter(auditCalls),
      contactLogWriter: createWriter(contactLogCalls),
      dispatchNoteWriter: createWriter(dispatchNoteCalls),
      correctionWriter: createWriter(correctionCalls),
    },
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.result.manualHandlingRequired, true);
  assert.equal(response.body.result.writerResults.audit.status, 'recorded');
  assert.equal(response.body.result.writerResults.contactLog.status, 'recorded');
  assert.equal(response.body.result.writerResults.dispatchNote.status, 'recorded');
  assert.equal(response.body.result.writerResults.correction, undefined);
  assert.equal(auditCalls.length, 1);
  assert.equal(contactLogCalls.length, 1);
  assert.equal(dispatchNoteCalls.length, 1);
  assert.equal(correctionCalls.length, 0);
  assertSafeOutput([
    response.body,
    auditCalls,
    contactLogCalls,
    dispatchNoteCalls,
    correctionCalls,
  ]);
});

test('writer throw does not leak raw error to response', () => {
  const response = buildDataCorrectionGovernanceResponse(
    req(DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY, baseCorrectionPayload()),
    {
      correctionWriter() {
        throw new Error('writer_failure_should_not_leak');
      },
    },
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'failed');
  assertSafeOutput(response.body);
});

test('malformed request body returns safe generic response', () => {
  const response = buildDataCorrectionGovernanceResponse({
    auth: auth(),
    body: 'token_should_not_leak',
  });

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, {
    status: 'deny',
    decision: 'safe_deny',
    safeMessageKey: 'dataCorrection.badRequest',
  });
  assertSafeOutput(response.body);
});

test('handler calls res.status(...).json(...) once', () => {
  const res = createResponse();

  handleDataCorrectionGovernanceRequest(
    req(DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY, baseCorrectionPayload()),
    res,
    { correctionWriter() {} },
  );

  assert.deepEqual(res.statusCalls, [200]);
  assert.equal(res.jsonCalls.length, 1);
  assert.equal(res.jsonCalls[0].status, 'ok');
});

test('handler safely returns response when res is malformed', () => {
  const response = handleDataCorrectionGovernanceRequest(
    req(DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY, baseCorrectionPayload()),
    {},
    { correctionWriter() {} },
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
});

test('create handler returns callable function and preserves injected options', async () => {
  const correctionCalls = [];
  const handler = createDataCorrectionGovernanceHandler({
    correctionWriter: createWriter(correctionCalls),
  });
  const res = createResponse();

  await handler(req(DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY, baseCorrectionPayload()), res);

  assert.equal(typeof handler, 'function');
  assert.deepEqual(res.statusCalls, [200]);
  assert.equal(correctionCalls.length, 1);
});

test('create handler awaits async data correction request writers when needed', async () => {
  const auditCalls = [];
  const handler = createDataCorrectionGovernanceHandler({
    async auditWriter(payload) {
      await Promise.resolve();
      auditCalls.push(payload);
      return { recorded: true };
    },
  });
  const res = createResponse();

  await handler(req(DATA_CORRECTION_GOVERNANCE_ACTIONS.DATA_CORRECTION_REQUEST, baseCorrectionPayload()), res);

  assert.deepEqual(res.statusCalls, [200]);
  assert.equal(res.jsonCalls[0].status, 'ok');
  assert.equal(auditCalls.length, 1);
  assertSafeOutput([res.jsonCalls, auditCalls]);
});

test('create handler awaits async post-departure writer when needed', async () => {
  const contactLogCalls = [];
  const handler = createDataCorrectionGovernanceHandler({
    async contactLogWriter(payload) {
      contactLogCalls.push(payload);
      return { recorded: true };
    },
  });
  const res = createResponse();

  await handler(req(DATA_CORRECTION_GOVERNANCE_ACTIONS.POST_DEPARTURE_FREEZE, baseCorrectionPayload({
    appointmentContext: {
      appointmentId: 'apt_data_correction_controller_001',
      engineerReceivedTask: true,
      engineerDeparted: true,
      routeStarted: false,
      arrived: false,
    },
  })), res);

  assert.deepEqual(res.statusCalls, [200]);
  assert.equal(res.jsonCalls[0].status, 'ok');
  assert.equal(res.jsonCalls[0].result.manualHandlingRequired, true);
  assert.equal(contactLogCalls.length, 1);
  assertSafeOutput([res.jsonCalls, contactLogCalls]);
});

test('create handler awaits async unable-to-complete writer when needed', async () => {
  const appointmentResultCalls = [];
  const handler = createDataCorrectionGovernanceHandler({
    async appointmentResultWriter(payload) {
      appointmentResultCalls.push(payload);
      return { recorded: true };
    },
  });
  const res = createResponse();

  await handler(req(DATA_CORRECTION_GOVERNANCE_ACTIONS.UNABLE_TO_COMPLETE_RESULT, unablePayload(), {
    userId: 'engineer_data_correction_controller_001',
    role: 'engineer',
    permissions: [],
  }), res);

  assert.deepEqual(res.statusCalls, [200]);
  assert.equal(res.jsonCalls[0].status, 'ok');
  assert.equal(res.jsonCalls[0].result.fieldServiceReportCreated, false);
  assert.equal(appointmentResultCalls.length, 1);
  assertSafeOutput([res.jsonCalls, appointmentResultCalls]);
});

test('create handler awaits async follow-up proposal writer when needed', async () => {
  const followUpCalls = [];
  const handler = createDataCorrectionGovernanceHandler({
    async followUpDraftWriter(payload) {
      followUpCalls.push(payload);
      return { recorded: true };
    },
  });
  const res = createResponse();

  await handler(req(DATA_CORRECTION_GOVERNANCE_ACTIONS.FOLLOW_UP_PROPOSAL, followUpPayload()), res);

  assert.deepEqual(res.statusCalls, [200]);
  assert.equal(res.jsonCalls[0].status, 'ok');
  assert.equal(res.jsonCalls[0].result.formalAppointmentCreated, false);
  assert.equal(followUpCalls.length, 1);
  assertSafeOutput([res.jsonCalls, followUpCalls]);
});

test('async controller response awaits pre-departure correction writer', async () => {
  const correctionCalls = [];
  const response = await buildDataCorrectionGovernanceResponseAsync(
    req(DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY, baseCorrectionPayload()),
    {
      async correctionWriter(payload) {
        correctionCalls.push(payload);
        return { recorded: true };
      },
    },
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(correctionCalls.length, 1);
  assertSafeOutput([response.body, correctionCalls]);
});

test('async controller response honors async pre-departure writer failure safely', async () => {
  const response = await buildDataCorrectionGovernanceResponseAsync(
    req(DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY, baseCorrectionPayload()),
    {
      async correctionWriter() {
        return { recorded: false, rawError: 'writer_failure_should_not_leak' };
      },
    },
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'failed');
  assert.equal(response.body.safeMessageKey, 'dataCorrection.writerFailed');
  assertSafeOutput(response.body);
});

test('input req object is not mutated', () => {
  const request = req(DATA_CORRECTION_GOVERNANCE_ACTIONS.FOLLOW_UP_PROPOSAL, followUpPayload());
  const before = clone(request);

  buildDataCorrectionGovernanceResponse(request, {
    followUpDraftWriter() {},
  });

  assert.deepEqual(request, before);
});

test('controller source imports only orchestrator and no DB, route, provider, or AI', () => {
  const source = fs.readFileSync(controllerFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, ['../dataCorrection/dataCorrectionGovernanceOrchestrator']);
  assert.equal(specifiers.some((specifier) => /db|pool|repositories?|transaction|route|app|server|provider|line|sms|email|push|ai|rag|vector/i.test(specifier)), false);
  assert.doesNotMatch(source, /app\.listen|createServer|server\.listen|JSON\.stringify\\(req|req\.body\\)/);
});
