'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  DATA_CORRECTION_GOVERNANCE_ROUTE_HANDLER_CONTRACT,
  DATA_CORRECTION_GOVERNANCE_ROUTE_CONTRACT,
  DATA_CORRECTION_GOVERNANCE_ROUTE_OPTION_KEYS,
  DATA_CORRECTION_GOVERNANCE_ROUTE_PATH,
  registerDataCorrectionRoutes,
} = require('../../src/routes/dataCorrectionRoutes');
const {
  CORRECTION_FIELD_GROUPS,
} = require('../../src/dataCorrection/dataCorrectionPolicyEngine');
const {
  DATA_CORRECTION_GOVERNANCE_ACTIONS,
} = require('../../src/dataCorrection/dataCorrectionGovernanceOrchestrator');

const repoRoot = path.resolve(__dirname, '../..');
const routeFile = path.join(repoRoot, 'src/routes/dataCorrectionRoutes.js');

function createRouter() {
  const registrations = [];

  return {
    registrations,
    post(pathname, ...handlers) {
      registrations.push({
        method: 'POST',
        path: pathname,
        handler: handlers[0],
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
    organizationId: 'org_data_correction_route_001',
    userId: 'dispatcher_data_correction_route_001',
    role: 'dispatch_assistant',
    permissions: ['data_correction.apply', 'data_correction.request'],
    ...overrides,
  };
}

function correctionPayload(overrides = {}) {
  return {
    caseContext: {
      caseId: 'case_data_correction_route_001',
      organizationId: 'org_data_correction_route_001',
    },
    appointmentContext: {
      appointmentId: 'apt_data_correction_route_001',
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

function request(actionType, payload, authOverrides = {}) {
  return {
    auth: auth(authOverrides),
    body: {
      actionType,
      payload,
    },
  };
}

function callRegisteredHandlers(registration, req, res) {
  let index = 0;

  function next(error) {
    assert.ifError(error);

    const handler = registration.handlers[index];
    index += 1;

    if (typeof handler !== 'function') {
      return;
    }

    if (handler.length >= 3) {
      handler(req, res, next);
      return;
    }

    handler(req, res);
  }

  next();
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

test('exports route constant and registerDataCorrectionRoutes', () => {
  assert.equal(Object.isFrozen(DATA_CORRECTION_GOVERNANCE_ROUTE_CONTRACT), true);
  assert.deepEqual(DATA_CORRECTION_GOVERNANCE_ROUTE_CONTRACT, {
    METHOD: 'post',
    PATH: '/data-correction/governance',
  });
  assert.equal(DATA_CORRECTION_GOVERNANCE_ROUTE_PATH, '/data-correction/governance');
  assert.equal(typeof registerDataCorrectionRoutes, 'function');

  assert.throws(() => {
    DATA_CORRECTION_GOVERNANCE_ROUTE_CONTRACT.METHOD = 'get';
  }, TypeError);
});

test('exports immutable route handler chain contract', () => {
  assert.equal(Object.isFrozen(DATA_CORRECTION_GOVERNANCE_ROUTE_HANDLER_CONTRACT), true);
  assert.deepEqual(DATA_CORRECTION_GOVERNANCE_ROUTE_HANDLER_CONTRACT, {
    PERMISSION_MIDDLEWARE_INDEX: 0,
    GOVERNANCE_HANDLER_INDEX: 1,
    HANDLER_COUNT: 2,
  });

  assert.throws(() => {
    DATA_CORRECTION_GOVERNANCE_ROUTE_HANDLER_CONTRACT.HANDLER_COUNT = 3;
  }, TypeError);
});

test('exports immutable route option key contract', () => {
  assert.equal(Object.isFrozen(DATA_CORRECTION_GOVERNANCE_ROUTE_OPTION_KEYS), true);
  assert.deepEqual(DATA_CORRECTION_GOVERNANCE_ROUTE_OPTION_KEYS, {
    PERMISSION: 'permission',
  });

  assert.throws(() => {
    DATA_CORRECTION_GOVERNANCE_ROUTE_OPTION_KEYS.PERMISSION = 'auth';
  }, TypeError);
});

test('registers one POST /data-correction/governance handler on synthetic router', () => {
  const router = createRouter();

  registerDataCorrectionRoutes(router);

  assert.equal(router.registrations.length, 1);
  assert.deepEqual(router.registrations[0], {
    method: 'POST',
    path: '/data-correction/governance',
    handler: router.registrations[0].handler,
    handlers: router.registrations[0].handlers,
  });
  assert.equal(typeof router.registrations[0].handler, 'function');
  assert.equal(
    router.registrations[0].handlers.length,
    DATA_CORRECTION_GOVERNANCE_ROUTE_HANDLER_CONTRACT.HANDLER_COUNT,
  );
  assert.equal(
    typeof router.registrations[0].handlers[
      DATA_CORRECTION_GOVERNANCE_ROUTE_HANDLER_CONTRACT.PERMISSION_MIDDLEWARE_INDEX
    ],
    'function',
  );
  assert.equal(
    typeof router.registrations[0].handlers[
      DATA_CORRECTION_GOVERNANCE_ROUTE_HANDLER_CONTRACT.GOVERNANCE_HANDLER_INDEX
    ],
    'function',
  );
});

test('missing router or invalid router safe no-op', () => {
  assert.equal(registerDataCorrectionRoutes(), undefined);
  assert.deepEqual(registerDataCorrectionRoutes({}), {});
});

test('handler with missing auth returns generic 403 safe deny', () => {
  const router = createRouter();
  registerDataCorrectionRoutes(router);
  const res = createResponse();

  callRegisteredHandlers(router.registrations[0], {
    body: {
      actionType: DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY,
      payload: correctionPayload(),
    },
  }, res);

  assert.deepEqual(res.statusCalls, [403]);
  assert.equal(res.jsonCalls[0].status, 'deny');
  assertSafeOutput(res.jsonCalls[0]);
});

test('handler with pre-departure apply request and injected correctionWriter returns safe 200 response', () => {
  const router = createRouter();
  const correctionCalls = [];
  registerDataCorrectionRoutes(router, {
    correctionWriter(payload) {
      correctionCalls.push(payload);
    },
  });
  const res = createResponse();

  callRegisteredHandlers(router.registrations[0],
    request(DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY, correctionPayload()),
    res,
  );

  assert.deepEqual(res.statusCalls, [200]);
  assert.equal(res.jsonCalls[0].status, 'ok');
  assert.equal(correctionCalls.length, 1);
  assertSafeOutput([res.jsonCalls[0], correctionCalls]);
});

test('handler with phone correction returns re-verification safe response and does not expose raw phone', () => {
  const router = createRouter();
  const correctionCalls = [];
  registerDataCorrectionRoutes(router, {
    correctionWriter(payload) {
      correctionCalls.push(payload);
    },
  });
  const res = createResponse();

  callRegisteredHandlers(router.registrations[0],
    request(DATA_CORRECTION_GOVERNANCE_ACTIONS.PRE_DEPARTURE_APPLY, correctionPayload({
      correction: {
        fieldKey: 'phoneNumber',
        fieldGroup: CORRECTION_FIELD_GROUPS.PHONE_IDENTITY,
        toValue: 'raw_phone_should_not_leak',
      },
    })),
    res,
  );

  assert.deepEqual(res.statusCalls, [403]);
  assert.equal(res.jsonCalls[0].phoneReverificationRequired, true);
  assert.equal(correctionCalls.length, 0);
  assertSafeOutput(res.jsonCalls[0]);
});

test('handler with post-departure freeze request and injected writers returns safe manual handling response', () => {
  const router = createRouter();
  const contactLogCalls = [];
  const dispatchNoteCalls = [];
  registerDataCorrectionRoutes(router, {
    contactLogWriter(payload) {
      contactLogCalls.push(payload);
    },
    dispatchNoteWriter(payload) {
      dispatchNoteCalls.push(payload);
    },
  });
  const res = createResponse();

  callRegisteredHandlers(router.registrations[0],
    request(DATA_CORRECTION_GOVERNANCE_ACTIONS.POST_DEPARTURE_FREEZE, correctionPayload({
      appointmentContext: {
        appointmentId: 'apt_data_correction_route_001',
        engineerReceivedTask: true,
        engineerDeparted: true,
        routeStarted: false,
        arrived: false,
      },
    })),
    res,
  );

  assert.deepEqual(res.statusCalls, [200]);
  assert.equal(res.jsonCalls[0].result.manualHandlingRequired, true);
  assert.equal(contactLogCalls.length, 1);
  assert.equal(dispatchNoteCalls.length, 1);
  assertSafeOutput([res.jsonCalls[0], contactLogCalls, dispatchNoteCalls]);
});

test('route source imports only controller and no DB, repository, provider, AI, app, or server', () => {
  const source = fs.readFileSync(routeFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, [
    '../controllers/dataCorrectionController',
    '../dataCorrection/dataCorrectionPermissionMiddleware',
  ]);
  assert.equal(specifiers.some((specifier) => /db|pool|repositories?|transaction|provider|line|sms|email|push|ai|rag|vector|app|server/i.test(specifier)), false);
  assert.doesNotMatch(source, /app\.listen|server\.listen|createServer/);
});
