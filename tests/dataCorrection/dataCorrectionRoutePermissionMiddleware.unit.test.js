'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  DATA_CORRECTION_GOVERNANCE_ROUTE_PATH,
  registerDataCorrectionRoutes,
} = require('../../src/routes/dataCorrectionRoutes');

const repoRoot = path.resolve(__dirname, '../..');
const routeFile = path.join(repoRoot, 'src/routes/dataCorrectionRoutes.js');

const ACTIONS = Object.freeze({
  DATA_CORRECTION_REQUEST: 'data_correction_request',
  FOLLOW_UP_PROPOSAL: 'follow_up_proposal',
  POST_DEPARTURE_FREEZE: 'post_departure_freeze',
  PRE_DEPARTURE_APPLY: 'pre_departure_apply',
  UNABLE_TO_COMPLETE_RESULT: 'unable_to_complete_result',
});

const FIELD_GROUPS = Object.freeze({
  DISPATCH_OPERATIONAL: 'dispatch_operational',
  PHONE_IDENTITY: 'phone_identity',
});

function createRouter() {
  const registrations = [];

  return {
    registrations,
    post(pathname, ...handlers) {
      registrations.push({
        method: 'POST',
        path: pathname,
        handlers,
      });
      return this;
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

function auth(overrides = {}) {
  return {
    organizationId: 'org_data_correction_route_permission_001',
    userId: 'user_data_correction_route_permission_001',
    role: 'customer_service',
    permissions: ['case.correction.request'],
    ...overrides,
  };
}

function correctionPayload(overrides = {}) {
  return {
    caseContext: {
      caseId: 'case_data_correction_route_permission_001',
      organizationId: 'org_data_correction_route_permission_001',
    },
    appointmentContext: {
      appointmentId: 'apt_data_correction_route_permission_001',
      engineerReceivedTask: false,
      engineerDeparted: false,
      routeStarted: false,
      arrived: false,
    },
    correction: {
      fieldKey: 'issueSummary',
      fieldGroup: FIELD_GROUPS.DISPATCH_OPERATIONAL,
      fromValue: 'old_value_should_not_leak',
      toValue: 'safe updated issue',
      rawPhone: 'raw_phone_should_not_leak',
      rawAddress: 'raw_address_should_not_leak',
      rawLineUserId: 'line_user_should_not_leak',
      token: 'token_should_not_leak',
      secret: 'secret_should_not_leak',
      DATABASE_URL: 'DATABASE_URL_should_not_leak',
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
      caseId: 'case_data_correction_route_permission_001',
      organizationId: 'org_data_correction_route_permission_001',
    },
    appointmentContext: {
      appointmentId: 'apt_data_correction_route_permission_001',
      organizationId: 'org_data_correction_route_permission_001',
      assignedEngineerId: 'engineer_data_correction_route_permission_001',
      arrived: true,
    },
    result: {
      reasonCode: 'unable_to_complete',
      terminalState: 'unable_to_complete',
      note: 'site condition mismatch',
      finalAppointmentId: 'final_appointment_should_not_leak',
    },
    ...overrides,
  };
}

function followUpPayload(overrides = {}) {
  return {
    caseContext: {
      caseId: 'case_data_correction_route_permission_001',
      organizationId: 'org_data_correction_route_permission_001',
    },
    appointmentContext: {
      appointmentId: 'apt_data_correction_route_permission_001',
      organizationId: 'org_data_correction_route_permission_001',
      terminalState: 'follow_up_required',
    },
    proposal: {
      proposalType: 'follow_up_appointment',
      reasonCode: 'follow_up_required',
      note: 'schedule follow up',
      finalAppointmentId: 'final_appointment_should_not_leak',
    },
    ...overrides,
  };
}

function request(actionType, payload, authOverrides = {}) {
  return {
    auth: auth(authOverrides),
    body: {
      actionType,
      payload,
    },
  };
}

function register(options = {}) {
  const router = createRouter();

  registerDataCorrectionRoutes(router, options);

  assert.equal(router.registrations.length, 1);
  return router.registrations[0];
}

function callRoute(registration, req) {
  const res = createResponse();
  const { handlers } = registration;
  let index = 0;

  function next() {
    index += 1;

    if (handlers[index]) {
      return handlers[index](req, res, next);
    }

    return undefined;
  }

  if (handlers[0]) {
    handlers[0](req, res, next);
  }

  return {
    req,
    res,
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
    'audit_raw_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'final_appointment_should_not_leak',
    'MISSING_PERMISSION',
    'UNKNOWN_ACTION',
    'AI_ACTOR',
  ]) {
    assert.equal(serialized.includes(forbiddenValue), false, `leaked ${forbiddenValue}`);
  }

  assert.equal(serialized.includes('"finalAppointmentId"'), false);
}

function assertDeniedByMiddleware(output) {
  assert.deepEqual(output.res.statusCalls, [403]);
  assert.deepEqual(output.res.jsonCalls, [{
    status: 'deny',
    messageKey: 'dataCorrection.unavailable',
    data: null,
  }]);
  assertSafeOutput(output.res.jsonCalls[0]);
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

test('route registers POST /data-correction/governance with permission middleware and handler', () => {
  const registration = register();

  assert.equal(registration.method, 'POST');
  assert.equal(registration.path, DATA_CORRECTION_GOVERNANCE_ROUTE_PATH);
  assert.equal(registration.path, '/data-correction/governance');
  assert.equal(registration.handlers.length, 2);
  assert.equal(typeof registration.handlers[0], 'function');
  assert.equal(typeof registration.handlers[1], 'function');
});

test('route stack order puts permission middleware before controller handler', () => {
  const registration = register();

  assert.equal(registration.handlers[0].name, 'dataCorrectionPermissionMiddleware');
  assert.equal(registration.handlers[1].name, 'dataCorrectionGovernanceHandler');
});

test('missing router safe no-op still works', () => {
  assert.equal(registerDataCorrectionRoutes(), undefined);
  assert.deepEqual(registerDataCorrectionRoutes({}), {});
});

test('missing auth denied by middleware before controller or writer', () => {
  const correctionCalls = [];
  const registration = register({
    correctionWriter(payload) {
      correctionCalls.push(payload);
    },
  });
  const output = callRoute(registration, {
    body: {
      actionType: ACTIONS.PRE_DEPARTURE_APPLY,
      payload: correctionPayload(),
    },
  });

  assertDeniedByMiddleware(output);
  assert.equal(correctionCalls.length, 0);
});

test('missing permission denied before controller or writer', () => {
  const correctionCalls = [];
  const registration = register({
    correctionWriter(payload) {
      correctionCalls.push(payload);
    },
  });
  const output = callRoute(registration, request(
    ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
    {
      role: 'dispatch_assistant',
      permissions: [],
    },
  ));

  assertDeniedByMiddleware(output);
  assert.equal(correctionCalls.length, 0);
});

test('valid data_correction_request with case.correction.request passes middleware and returns safe response', () => {
  const registration = register();
  const output = callRoute(registration, request(
    ACTIONS.DATA_CORRECTION_REQUEST,
    correctionPayload(),
    {
      role: 'customer_service',
      permissions: ['case.correction.request'],
    },
  ));

  assert.deepEqual(output.res.statusCalls, [200]);
  assert.equal(output.res.jsonCalls[0].status, 'ok');
  assert.equal(output.req.dataCorrectionPermissionContext.role, 'customer_service');
  assertSafeOutput(output.res.jsonCalls[0]);
});

test('valid data_correction_request with manual handling writers does not call correctionWriter', () => {
  const contactLogCalls = [];
  const dispatchNoteCalls = [];
  const auditCalls = [];
  const correctionCalls = [];
  const registration = register({
    contactLogWriter(payload) {
      contactLogCalls.push(payload);
    },
    dispatchNoteWriter(payload) {
      dispatchNoteCalls.push(payload);
    },
    auditWriter(payload) {
      auditCalls.push(payload);
    },
    correctionWriter(payload) {
      correctionCalls.push(payload);
    },
  });
  const output = callRoute(registration, request(
    ACTIONS.DATA_CORRECTION_REQUEST,
    correctionPayload({
      appointmentContext: {
        appointmentId: 'apt_data_correction_route_permission_001',
        engineerReceivedTask: true,
        engineerDeparted: true,
        routeStarted: false,
        arrived: false,
      },
    }),
    {
      role: 'customer_service',
      permissions: ['case.correction.request'],
    },
  ));

  assert.deepEqual(output.res.statusCalls, [200]);
  assert.equal(output.res.jsonCalls[0].status, 'ok');
  assert.equal(output.res.jsonCalls[0].result.manualHandlingRequired, true);
  assert.equal(output.res.jsonCalls[0].result.correctionApplicationReady, false);
  assert.equal(output.res.jsonCalls[0].result.writerResults.correction, undefined);
  assert.equal(contactLogCalls.length, 1);
  assert.equal(dispatchNoteCalls.length, 1);
  assert.equal(auditCalls.length, 1);
  assert.equal(correctionCalls.length, 0);
  assertSafeOutput([output.res.jsonCalls[0], contactLogCalls, dispatchNoteCalls, auditCalls, correctionCalls]);
});

test('valid pre_departure_apply with case.correction.apply passes and calls correctionWriter', () => {
  const correctionCalls = [];
  const registration = register({
    correctionWriter(payload) {
      correctionCalls.push(payload);
    },
  });
  const output = callRoute(registration, request(
    ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
    {
      role: 'dispatch_assistant',
      permissions: ['case.correction.apply'],
    },
  ));

  assert.deepEqual(output.res.statusCalls, [200]);
  assert.equal(output.res.jsonCalls[0].status, 'ok');
  assert.equal(correctionCalls.length, 1);
  assertSafeOutput([output.res.jsonCalls[0], correctionCalls]);
});

test('post_departure_freeze with data_correction.request alias passes route permission and calls manual handling writers', () => {
  const contactLogCalls = [];
  const dispatchNoteCalls = [];
  const auditCalls = [];
  const registration = register({
    contactLogWriter(payload) {
      contactLogCalls.push(payload);
    },
    dispatchNoteWriter(payload) {
      dispatchNoteCalls.push(payload);
    },
    auditWriter(payload) {
      auditCalls.push(payload);
    },
  });
  const output = callRoute(registration, request(
    ACTIONS.POST_DEPARTURE_FREEZE,
    correctionPayload({
      appointmentContext: {
        appointmentId: 'apt_data_correction_route_permission_001',
        engineerReceivedTask: true,
        engineerDeparted: true,
        routeStarted: false,
        arrived: false,
      },
    }),
    {
      role: 'customer_service',
      permissions: ['data_correction.request'],
    },
  ));

  assert.deepEqual(output.res.statusCalls, [200]);
  assert.equal(output.res.jsonCalls[0].result.manualHandlingRequired, true);
  assert.deepEqual(output.req.dataCorrectionPermissionContext.allowedActionTypes, [
    ACTIONS.DATA_CORRECTION_REQUEST,
    ACTIONS.POST_DEPARTURE_FREEZE,
  ]);
  assert.equal(contactLogCalls.length, 1);
  assert.equal(dispatchNoteCalls.length, 1);
  assert.equal(auditCalls.length, 1);
  assertSafeOutput([output.res.jsonCalls[0], contactLogCalls, dispatchNoteCalls, auditCalls]);
});

test('engineer with appointment.result.record can pass unable_to_complete_result and call appointmentResultWriter', () => {
  const appointmentResultCalls = [];
  const registration = register({
    appointmentResultWriter(payload) {
      appointmentResultCalls.push(payload);
    },
  });
  const output = callRoute(registration, request(
    ACTIONS.UNABLE_TO_COMPLETE_RESULT,
    unablePayload(),
    {
      userId: 'engineer_data_correction_route_permission_001',
      role: 'engineer',
      permissions: ['appointment.result.record'],
    },
  ));

  assert.deepEqual(output.res.statusCalls, [200]);
  assert.equal(output.res.jsonCalls[0].status, 'ok');
  assert.equal(appointmentResultCalls.length, 1);
  assertSafeOutput([output.res.jsonCalls[0], appointmentResultCalls]);
});

test('follow_up_proposal with dispatch.follow_up.propose alias passes route permission and calls followUpDraftWriter', () => {
  const followUpCalls = [];
  const registration = register({
    followUpDraftWriter(payload) {
      followUpCalls.push(payload);
    },
  });
  const output = callRoute(registration, request(
    ACTIONS.FOLLOW_UP_PROPOSAL,
    followUpPayload(),
    {
      role: 'dispatch_assistant',
      permissions: ['dispatch.follow_up.propose'],
    },
  ));

  assert.deepEqual(output.res.statusCalls, [200]);
  assert.equal(output.res.jsonCalls[0].result.formalAppointmentCreated, false);
  assert.deepEqual(output.req.dataCorrectionPermissionContext.allowedActionTypes, [
    ACTIONS.FOLLOW_UP_PROPOSAL,
  ]);
  assert.equal(followUpCalls.length, 1);
  assertSafeOutput([output.res.jsonCalls[0], followUpCalls]);
});

test('engineer cannot pass pre_departure_apply general correction', () => {
  const correctionCalls = [];
  const registration = register({
    correctionWriter(payload) {
      correctionCalls.push(payload);
    },
  });
  const output = callRoute(registration, request(
    ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
    {
      role: 'engineer',
      permissions: ['case.correction.apply'],
    },
  ));

  assertDeniedByMiddleware(output);
  assert.equal(correctionCalls.length, 0);
});

test('AI role denied before controller or writer', () => {
  const correctionCalls = [];
  const registration = register({
    correctionWriter(payload) {
      correctionCalls.push(payload);
    },
  });
  const output = callRoute(registration, request(
    ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
    {
      role: 'ai',
      permissions: ['case.correction.apply'],
    },
  ));

  assertDeniedByMiddleware(output);
  assert.equal(correctionCalls.length, 0);
});

test('phone correction with valid permission returns re-verification and does not call correctionWriter', () => {
  const correctionCalls = [];
  const registration = register({
    correctionWriter(payload) {
      correctionCalls.push(payload);
    },
  });
  const output = callRoute(registration, request(
    ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload({
      correction: {
        fieldKey: 'phoneNumber',
        fieldGroup: FIELD_GROUPS.PHONE_IDENTITY,
        toValue: 'raw_phone_should_not_leak',
      },
    }),
    {
      role: 'dispatch_assistant',
      permissions: ['case.correction.apply'],
    },
  ));

  assert.deepEqual(output.res.statusCalls, [403]);
  assert.equal(output.res.jsonCalls[0].status, 'deny');
  assert.equal(output.res.jsonCalls[0].phoneReverificationRequired, true);
  assert.equal(correctionCalls.length, 0);
  assertSafeOutput(output.res.jsonCalls[0]);
});

test('denied response is generic and does not leak permission reason', () => {
  const registration = register();
  const output = callRoute(registration, request(
    'unknown_action_type',
    correctionPayload(),
    {
      permissions: ['case.correction.request'],
    },
  ));

  assertDeniedByMiddleware(output);
});

test('responses exclude raw phone, raw address, raw LINE id, token, secret, DB URL, internal note, AI raw, and finalAppointmentId', () => {
  const allowed = callRoute(register(), request(
    ACTIONS.DATA_CORRECTION_REQUEST,
    correctionPayload(),
    {
      role: 'customer_service',
      permissions: ['case.correction.request'],
    },
  ));
  const denied = callRoute(register(), request(
    ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
    {
      role: 'engineer',
      permissions: ['case.correction.apply'],
    },
  ));

  assertSafeOutput(allowed.res.jsonCalls[0]);
  assertSafeOutput(allowed.req.dataCorrectionPermissionContext);
  assertSafeOutput(denied.res.jsonCalls[0]);
});

test('route source imports only controller and permission middleware', () => {
  const source = fs.readFileSync(routeFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers.sort(), [
    '../controllers/dataCorrectionController',
    '../dataCorrection/dataCorrectionPermissionMiddleware',
  ]);
  assert.doesNotMatch(source, /db|pool|repositories?|transaction|provider|lineProvider|sms|email|push|rag|vector|app\\.js|server\\.js/i);
});
