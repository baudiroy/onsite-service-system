'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createAppRouter,
  router: defaultRouter,
} = require('../../src/routes');
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
const routeIndexFile = path.join(repoRoot, 'src/routes/index.js');

function findRoute(expressRouter, method, pathname) {
  return expressRouter.stack.find((layer) => (
    layer.route
    && layer.route.path === pathname
    && layer.route.methods[method.toLowerCase()]
  ));
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
    organizationId: 'org_data_correction_mount_001',
    userId: 'dispatcher_data_correction_mount_001',
    role: 'dispatch_assistant',
    permissions: ['data_correction.apply', 'data_correction.request', 'dispatch.follow_up.propose'],
    ...overrides,
  };
}

function correctionPayload(overrides = {}) {
  return {
    caseContext: {
      caseId: 'case_data_correction_mount_001',
      organizationId: 'org_data_correction_mount_001',
    },
    appointmentContext: {
      appointmentId: 'apt_data_correction_mount_001',
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
      caseId: 'case_data_correction_mount_001',
      organizationId: 'org_data_correction_mount_001',
    },
    appointmentContext: {
      appointmentId: 'apt_data_correction_mount_001',
      organizationId: 'org_data_correction_mount_001',
      assignedEngineerId: 'engineer_data_correction_mount_001',
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
      caseId: 'case_data_correction_mount_001',
      organizationId: 'org_data_correction_mount_001',
    },
    appointmentContext: {
      appointmentId: 'apt_data_correction_mount_001',
      organizationId: 'org_data_correction_mount_001',
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

function request(actionType, payload, authOverrides = {}) {
  return {
    auth: auth(authOverrides),
    body: {
      actionType,
      payload,
    },
  };
}

function callMountedHandler(expressRouter, req) {
  const route = findRoute(expressRouter, 'post', '/data-correction/governance');
  const res = createResponse();
  let index = 0;

  assert.ok(route, 'mounted data correction route missing');

  function next(error) {
    assert.ifError(error);

    const layer = route.route.stack[index];
    index += 1;

    if (!layer || typeof layer.handle !== 'function') {
      return;
    }

    if (layer.handle.length >= 3) {
      layer.handle(req, res, next);
      return;
    }

    layer.handle(req, res);
  }

  next();

  return res;
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

test('default central router export still works', () => {
  assert.ok(defaultRouter);
  assert.equal(typeof defaultRouter.use, 'function');
});

test('createAppRouter exports and works', () => {
  const appRouter = createAppRouter();

  assert.ok(appRouter);
  assert.equal(typeof appRouter.use, 'function');
});

test('central router mounts POST /data-correction/governance', () => {
  const appRouter = createAppRouter();
  const route = findRoute(appRouter, 'post', '/data-correction/governance');

  assert.ok(route);
  assert.equal(route.route.path, '/data-correction/governance');
  assert.equal(typeof route.route.stack[0].handle, 'function');
});

test('missing auth through mounted route returns generic 403 safe deny', () => {
  const appRouter = createAppRouter();
  const res = callMountedHandler(appRouter, {
    body: {
      actionType: DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
      payload: correctionPayload(),
    },
  });

  assert.deepEqual(res.statusCalls, [403]);
  assert.equal(res.jsonCalls[0].status, 'deny');
  assertSafeOutput(res.jsonCalls[0]);
});

test('createAppRouter with dataCorrection correctionWriter returns 200 and calls writer', () => {
  const correctionCalls = [];
  const appRouter = createAppRouter({
    dataCorrection: {
      correctionWriter(payload) {
        correctionCalls.push(payload);
      },
    },
  });
  const res = callMountedHandler(appRouter, request(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ));

  assert.deepEqual(res.statusCalls, [200]);
  assert.equal(res.jsonCalls[0].status, 'ok');
  assert.equal(correctionCalls.length, 1);
  assertSafeOutput([res.jsonCalls[0], correctionCalls]);
});

test('phone correction through mounted route returns re-verification response and does not call correctionWriter', () => {
  const correctionCalls = [];
  const appRouter = createAppRouter({
    dataCorrection: {
      correctionWriter(payload) {
        correctionCalls.push(payload);
      },
    },
  });
  const res = callMountedHandler(appRouter, request(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload({
      correction: {
        fieldKey: 'phoneNumber',
        fieldGroup: CORRECTION_FIELD_GROUPS.PHONE_IDENTITY,
        toValue: 'raw_phone_should_not_leak',
      },
    }),
  ));

  assert.deepEqual(res.statusCalls, [403]);
  assert.equal(res.jsonCalls[0].phoneReverificationRequired, true);
  assert.equal(correctionCalls.length, 0);
  assertSafeOutput(res.jsonCalls[0]);
});

test('post-departure freeze through mounted route calls contact, dispatch, and audit writers', () => {
  const contactLogCalls = [];
  const dispatchNoteCalls = [];
  const auditCalls = [];
  const appRouter = createAppRouter({
    dataCorrection: {
      contactLogWriter(payload) {
        contactLogCalls.push(payload);
      },
      dispatchNoteWriter(payload) {
        dispatchNoteCalls.push(payload);
      },
      auditWriter(payload) {
        auditCalls.push(payload);
      },
    },
  });
  const res = callMountedHandler(appRouter, request(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.POST_DEPARTURE_FREEZE,
    correctionPayload({
      appointmentContext: {
        appointmentId: 'apt_data_correction_mount_001',
        engineerReceivedTask: true,
        engineerDeparted: true,
        routeStarted: false,
        arrived: false,
      },
    }),
  ));

  assert.deepEqual(res.statusCalls, [200]);
  assert.equal(res.jsonCalls[0].result.manualHandlingRequired, true);
  assert.equal(contactLogCalls.length, 1);
  assert.equal(dispatchNoteCalls.length, 1);
  assert.equal(auditCalls.length, 1);
  assertSafeOutput([res.jsonCalls[0], contactLogCalls, dispatchNoteCalls, auditCalls]);
});

test('unable-to-complete result through mounted route calls appointmentResultWriter', () => {
  const appointmentResultCalls = [];
  const appRouter = createAppRouter({
    dataCorrection: {
      appointmentResultWriter(payload) {
        appointmentResultCalls.push(payload);
      },
    },
  });
  const res = callMountedHandler(appRouter, request(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.UNABLE_TO_COMPLETE_RESULT,
    unablePayload(),
    {
      userId: 'engineer_data_correction_mount_001',
      role: 'engineer',
      permissions: ['appointment.result.record'],
    },
  ));

  assert.deepEqual(res.statusCalls, [200]);
  assert.equal(res.jsonCalls[0].result.fieldServiceReportCreated, false);
  assert.equal(appointmentResultCalls.length, 1);
  assertSafeOutput([res.jsonCalls[0], appointmentResultCalls]);
});

test('follow-up proposal through mounted route calls followUpDraftWriter', () => {
  const followUpCalls = [];
  const appRouter = createAppRouter({
    dataCorrection: {
      followUpDraftWriter(payload) {
        followUpCalls.push(payload);
      },
    },
  });
  const res = callMountedHandler(appRouter, request(
    DATA_CORRECTION_GOVERNANCE_ACTIONS.FOLLOW_UP_PROPOSAL,
    followUpPayload(),
  ));

  assert.deepEqual(res.statusCalls, [200]);
  assert.equal(res.jsonCalls[0].result.formalAppointmentCreated, false);
  assert.equal(followUpCalls.length, 1);
  assertSafeOutput([res.jsonCalls[0], followUpCalls]);
});

test('route index source does not import DB, repository, provider, AI, or server bootstrap', () => {
  const source = fs.readFileSync(routeIndexFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.equal(specifiers.includes('./dataCorrectionRoutes'), true);
  assert.equal(specifiers.some((specifier) => /db|pool|repositories?|transaction|provider|lineProvider|sms|email|push|rag|vector/i.test(specifier)), false);
  assert.doesNotMatch(source, /app\.listen|server\.listen|createServer/);
});
