'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createAppRouter,
} = require('../../src/routes');
const {
  ENGINEER_MOBILE_VISIT_ACTION_ROUTE_PATH,
  registerEngineerMobileVisitActionRoutes,
} = require('../../src/routes/engineerMobileVisitActionRoutes');
const {
  ENGINEER_MOBILE_AUDIT_EVENT_KEYS,
} = require('../../src/engineerMobile/engineerMobileAuditEventBuilder');

const repoRoot = path.resolve(__dirname, '../..');
const routeFile = path.join(repoRoot, 'src/routes/engineerMobileVisitActionRoutes.js');
const serverFile = path.join(repoRoot, 'src/server.js');

function createSyntheticRouter() {
  const calls = [];

  return {
    calls,
    post(pathname, ...handlers) {
      calls.push({
        handlers,
        method: 'post',
        pathname,
      });

      return this;
    },
  };
}

function createResponse() {
  return {
    jsonCalls: [],
    statusCalls: [],
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
    organizationId: 'org_visit_action_route_001',
    userId: 'user_visit_action_route_001',
    engineerId: 'eng_visit_action_route_001',
    role: 'engineer',
    permissions: [
      'engineer_mobile.tasks.read',
      'engineer_mobile.visit.start_travel',
    ],
    ...overrides,
  };
}

function appointment(overrides = {}) {
  return {
    appointmentId: 'apt_visit_action_route_001',
    caseId: 'case_visit_action_route_001',
    organizationId: 'org_visit_action_route_001',
    assignedEngineerId: 'eng_visit_action_route_001',
    status: 'scheduled',
    customerPhone: 'raw_phone_should_not_leak',
    customerAddress: 'raw_address_should_not_leak',
    lineUserId: 'raw_line_should_not_leak',
    privateNote: 'private_note_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    ...overrides,
  };
}

function request(overrides = {}) {
  return {
    auth: auth(),
    body: {
      actor: {
        id: 'body_actor_should_be_ignored',
        organizationId: 'body_org_should_be_ignored',
        permissions: ['body_permission_should_be_ignored'],
      },
      appointment: {
        appointmentId: 'body_appointment_should_be_ignored',
      },
      rawPhone: 'body_raw_phone_should_not_leak',
      visitResult: 'resolved',
    },
    params: {
      action: 'engineer_mobile.start_travel',
      appointmentId: 'apt_visit_action_route_001',
    },
    requestId: 'req_visit_action_route_001',
    ...overrides,
  };
}

function acceptedService(calls = []) {
  return {
    async handleEngineerMobileVisitAction(payload) {
      calls.push(payload);

      return {
        ok: true,
        allowed: true,
        action: payload.action,
        reasonCode: 'applied',
        appointmentId: payload.appointmentId,
        caseId: payload.appointment && payload.appointment.caseId,
        organizationId: payload.appointment && payload.appointment.organizationId,
        transitionApplied: true,
        auditRecorded: true,
        transitionIntent: {
          mobileVisitStatus: 'traveling',
        },
        rawPhone: 'raw_phone_should_not_leak',
        finalAppointmentId: 'final_appointment_should_not_leak',
      };
    },
  };
}

function registerRoute(options = {}) {
  const router = createSyntheticRouter();

  registerEngineerMobileVisitActionRoutes(router, options);

  assert.equal(router.calls.length, 1);
  return router.calls[0];
}

async function invokeRoute(route, req) {
  const res = createResponse();
  let current = 0;

  async function next(error) {
    if (error) {
      throw error;
    }

    current += 1;
    const handler = route.handlers[current];

    if (handler) {
      return handler(req, res, next);
    }

    return undefined;
  }

  await route.handlers[0](req, res, next);

  return {
    req,
    res,
  };
}

function assertNoForbiddenOutput(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'body_actor_should_be_ignored',
    'body_org_should_be_ignored',
    'body_permission_should_be_ignored',
    'body_appointment_should_be_ignored',
    'body_raw_phone_should_not_leak',
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'raw_line_should_not_leak',
    'private_note_should_not_leak',
    'final_appointment_should_not_leak',
    'rawPhone',
    'rawAddress',
    'lineUserId',
    'privateNote',
    'finalAppointmentId',
    'stack',
    'token',
    'secret',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function assertNoAuditResultOutput(value) {
  const serialized = JSON.stringify(value);

  for (const auditField of [
    'auditEvent',
    'auditWritten',
    'persisted',
    'audit result',
    'audit_persistence_failed',
    'invalid_writer_result',
  ]) {
    assert.equal(serialized.includes(auditField), false, `leaked ${auditField}`);
  }
}

function assertVisitActionAuditEventBase(event, eventType, decision) {
  assert.equal(event.eventType, eventType);
  assert.equal(event.route, '/engineer-mobile/appointments/:appointmentId/actions/:action');
  assert.equal(event.method, 'POST');
  assert.equal(event.source, 'engineer_mobile_visit_action_handler');
  assert.equal(event.decision, decision);
  assert.deepEqual(Object.keys(event).sort(), Object.keys(event)
    .filter((key) => ENGINEER_MOBILE_AUDIT_EVENT_KEYS.includes(key))
    .sort());
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

test('exports register function and canonical visit action route path', () => {
  assert.equal(
    ENGINEER_MOBILE_VISIT_ACTION_ROUTE_PATH,
    '/engineer-mobile/appointments/:appointmentId/actions/:action',
  );
  assert.equal(typeof registerEngineerMobileVisitActionRoutes, 'function');
});

test('registers POST route with permission middleware before visit action handler', () => {
  const route = registerRoute();

  assert.equal(route.method, 'post');
  assert.equal(route.pathname, ENGINEER_MOBILE_VISIT_ACTION_ROUTE_PATH);
  assert.equal(route.handlers.length, 2);
  assert.match(route.handlers[0].name, /engineerMobileVisitActionPermissionMiddleware/);
  assert.match(route.handlers[1].name, /engineerMobileVisitActionRouteHandler/);
});

test('route index registers visit action POST path', () => {
  const router = createAppRouter({
    engineerMobile: {
      visitActionService: acceptedService(),
      visitActionAppointmentProvider: () => appointment(),
    },
  });
  const routeLayer = router.stack.find((layer) => (
    layer.route
    && layer.route.path === ENGINEER_MOBILE_VISIT_ACTION_ROUTE_PATH
    && layer.route.methods.post
  ));

  assert.ok(routeLayer, 'visit action route should be registered in app router');
});

test('server auth context covers the mounted unprefixed Engineer Mobile route family', () => {
  const source = fs.readFileSync(serverFile, 'utf8');

  assert.match(source, /path\.startsWith\('\/engineer-mobile\/'\)/);
});

test('missing auth denies before appointment provider or service is called', async () => {
  const appointmentCalls = [];
  const serviceCalls = [];
  const route = registerRoute({
    visitActionAppointmentProvider(input) {
      appointmentCalls.push(input);
      return appointment();
    },
    visitActionService: acceptedService(serviceCalls),
  });
  const { res } = await invokeRoute(route, request({ auth: undefined }));

  assert.deepEqual(appointmentCalls, []);
  assert.deepEqual(serviceCalls, []);
  assert.deepEqual(res.statusCalls, [403]);
  assert.deepEqual(res.jsonCalls[0], {
    status: 'deny',
    messageKey: 'engineerMobile.unavailable',
    data: null,
  });
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('valid request uses server auth and appointment provider, ignoring body actor and appointment', async () => {
  const appointmentCalls = [];
  const serviceCalls = [];
  const route = registerRoute({
    visitActionAppointmentProvider(input) {
      appointmentCalls.push(input);
      return appointment();
    },
    visitActionService: acceptedService(serviceCalls),
  });
  const { res } = await invokeRoute(route, request());

  assert.deepEqual(appointmentCalls, [{
    action: 'engineer_mobile.start_travel',
    appointmentId: 'apt_visit_action_route_001',
    engineerId: 'eng_visit_action_route_001',
    organizationId: 'org_visit_action_route_001',
    requestId: 'req_visit_action_route_001',
    userId: 'user_visit_action_route_001',
  }]);
  assert.equal(serviceCalls.length, 1);
  assert.equal(serviceCalls[0].actor.id, 'eng_visit_action_route_001');
  assert.equal(serviceCalls[0].actor.organizationId, 'org_visit_action_route_001');
  assert.equal(serviceCalls[0].appointment.appointmentId, 'apt_visit_action_route_001');
  assert.equal(serviceCalls[0].requestId, 'req_visit_action_route_001');
  assert.deepEqual(res.statusCalls, [202]);
  assert.equal(res.jsonCalls[0].accepted, true);
  assert.equal(res.jsonCalls[0].requestId, 'req_visit_action_route_001');
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('visit action allow response writes one sanitized audit event without changing response', async () => {
  const auditEvents = [];
  const route = registerRoute({
    auditWriter(event) {
      auditEvents.push(event);

      return {
        ok: true,
        status: 'recorded',
        auditWritten: true,
        persisted: true,
      };
    },
    visitActionAppointmentProvider() {
      return appointment();
    },
    visitActionService: acceptedService(),
  });
  const { res } = await invokeRoute(route, request());

  assert.deepEqual(res.statusCalls, [202]);
  assert.equal(res.jsonCalls[0].accepted, true);
  assert.equal(auditEvents.length, 1);
  assertVisitActionAuditEventBase(
    auditEvents[0],
    'engineer_mobile.visit_action.allow',
    'allow',
  );
  assert.equal(auditEvents[0].appointmentId, 'apt_visit_action_route_001');
  assert.equal(auditEvents[0].action, 'engineer_mobile.start_travel');
  assert.equal(auditEvents[0].organizationId, 'org_visit_action_route_001');
  assert.equal(auditEvents[0].engineerId, 'eng_visit_action_route_001');
  assert.deepEqual(auditEvents[0].metadata, {
    routeMatched: true,
    contextPresent: true,
    identifierValid: true,
    permissionPassed: true,
    actionAllowed: true,
  });
  assert.equal(Object.prototype.hasOwnProperty.call(auditEvents[0], 'reasonCode'), false);
  assertNoForbiddenOutput(auditEvents[0]);
  assertNoAuditResultOutput(res.jsonCalls[0]);
});

test('appointment id mismatch from server-side appointment provider returns sanitized 400', async () => {
  const route = registerRoute({
    visitActionAppointmentProvider() {
      return appointment({ appointmentId: 'apt_other' });
    },
    visitActionService: acceptedService(),
  });
  const { res } = await invokeRoute(route, request());

  assert.deepEqual(res.statusCalls, [400]);
  assert.equal(res.jsonCalls[0].reasonCode, 'APPOINTMENT_ID_MISMATCH');
  assert.equal(res.jsonCalls[0].requestId, 'req_visit_action_route_001');
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('visit action safe deny writes one deny audit event without leaking raw service details', async () => {
  const auditEvents = [];
  const route = registerRoute({
    auditWriter(event) {
      auditEvents.push(event);

      return {
        ok: true,
        status: 'recorded',
        auditWritten: true,
        persisted: true,
      };
    },
    visitActionAppointmentProvider() {
      return appointment({ appointmentId: 'apt_other' });
    },
    visitActionService: acceptedService(),
  });
  const { res } = await invokeRoute(route, request());

  assert.deepEqual(res.statusCalls, [400]);
  assert.equal(res.jsonCalls[0].reasonCode, 'APPOINTMENT_ID_MISMATCH');
  assert.equal(auditEvents.length, 1);
  assertVisitActionAuditEventBase(
    auditEvents[0],
    'engineer_mobile.visit_action.deny',
    'deny',
  );
  assert.equal(auditEvents[0].appointmentId, 'apt_visit_action_route_001');
  assert.equal(auditEvents[0].action, 'engineer_mobile.start_travel');
  assert.equal(auditEvents[0].reasonCode, 'engineerMobile.unavailable');
  assert.deepEqual(auditEvents[0].metadata, {
    routeMatched: true,
    contextPresent: true,
    identifierValid: true,
    permissionPassed: false,
    actionAllowed: false,
  });
  assertNoForbiddenOutput(auditEvents[0]);
  assertNoAuditResultOutput(res.jsonCalls[0]);
});

test('invalid visit action skips writer and preserves sanitized response', async () => {
  const auditEvents = [];
  const route = registerRoute({
    auditWriter(event) {
      auditEvents.push(event);
    },
    visitActionAppointmentProvider() {
      return appointment();
    },
    visitActionService: acceptedService(),
  });
  const { res } = await invokeRoute(route, request({
    params: {
      action: 'engineer_mobile.unsupported_action',
      appointmentId: 'apt_visit_action_route_001',
    },
  }));

  assert.deepEqual(res.statusCalls, [202]);
  assert.equal(res.jsonCalls[0].accepted, true);
  assert.equal(auditEvents.length, 0);
  assertNoForbiddenOutput(res.jsonCalls[0]);
  assertNoAuditResultOutput(res.jsonCalls[0]);
});

test('service failure returns sanitized 500 without raw error leak', async () => {
  const route = registerRoute({
    visitActionAppointmentProvider() {
      return appointment();
    },
    visitActionService: {
      async handleEngineerMobileVisitAction() {
        throw new Error('token_should_not_leak stack_should_not_leak');
      },
    },
  });
  const { res } = await invokeRoute(route, request());

  assert.deepEqual(res.statusCalls, [500]);
  assert.equal(res.jsonCalls[0].reasonCode, 'service_invocation_failed');
  assert.equal(res.jsonCalls[0].error.code, 'service_invocation_failed');
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('missing or malformed auditWriter skips audit and preserves allow and deny responses', async () => {
  const expectedAllow = await invokeRoute(registerRoute({
    visitActionAppointmentProvider() {
      return appointment();
    },
    visitActionService: acceptedService(),
  }), request());
  const malformedAllow = await invokeRoute(registerRoute({
    auditWriter: {
      record() {
        throw new Error('object_writer_should_not_be_called');
      },
    },
    visitActionAppointmentProvider() {
      return appointment();
    },
    visitActionService: acceptedService(),
  }), request());

  assert.deepEqual(malformedAllow.res.statusCalls, expectedAllow.res.statusCalls);
  assert.deepEqual(malformedAllow.res.jsonCalls, expectedAllow.res.jsonCalls);

  const expectedDeny = await invokeRoute(registerRoute({
    visitActionAppointmentProvider() {
      return appointment({ appointmentId: 'apt_other' });
    },
    visitActionService: acceptedService(),
  }), request());
  const malformedDeny = await invokeRoute(registerRoute({
    auditWriter: {
      write() {
        throw new Error('object_writer_should_not_be_called');
      },
    },
    visitActionAppointmentProvider() {
      return appointment({ appointmentId: 'apt_other' });
    },
    visitActionService: acceptedService(),
  }), request());

  assert.deepEqual(malformedDeny.res.statusCalls, expectedDeny.res.statusCalls);
  assert.deepEqual(malformedDeny.res.jsonCalls, expectedDeny.res.jsonCalls);
});

test('audit writer failures and malformed results do not change visit action response', async () => {
  for (const auditWriter of [
    () => {
      throw new Error('stack token sql provider debug should not leak');
    },
    () => Promise.reject(new Error('reject token sql provider debug should not leak')),
    () => ({ ok: true, status: 'recorded', auditWritten: false, persisted: false }),
  ]) {
    const route = registerRoute({
      auditWriter,
      visitActionAppointmentProvider() {
        return appointment();
      },
      visitActionService: acceptedService(),
    });
    const { res } = await invokeRoute(route, request());

    assert.deepEqual(res.statusCalls, [202]);
    assert.equal(res.jsonCalls[0].accepted, true);
    assert.equal(JSON.stringify(res.jsonCalls[0]).includes('provider debug'), false);
    assertNoForbiddenOutput(res.jsonCalls[0]);
    assertNoAuditResultOutput(res.jsonCalls[0]);
  }
});

test('audit event excludes raw request context and visit action service sentinels', async () => {
  const auditEvents = [];
  const route = registerRoute({
    auditWriter(event) {
      auditEvents.push(event);

      return {
        ok: true,
        status: 'recorded',
        auditWritten: true,
        persisted: true,
      };
    },
    visitActionAppointmentProvider() {
      return appointment({
        rawProviderPayload: 'provider_payload_should_not_leak',
      });
    },
    visitActionService: acceptedService(),
  });
  const { res } = await invokeRoute(route, request({
    auth: {
      ...auth(),
      rawSession: 'session_should_not_leak',
      token: 'token_should_not_leak',
      privateNote: 'private_should_not_leak',
    },
    headers: {
      authorization: 'bearer token_should_not_leak',
      cookie: 'cookie_should_not_leak',
    },
    rawHeaders: ['authorization', 'token_should_not_leak'],
    body: {
      debug: 'debug_should_not_leak',
      visitResult: 'resolved',
    },
    params: {
      action: 'engineer_mobile.start_travel',
      appointmentId: 'apt_visit_action_route_001',
      raw: 'params_should_not_leak',
    },
    query: {
      sql: 'select secret_should_not_leak',
    },
  }));

  assert.deepEqual(res.statusCalls, [202]);
  assert.equal(auditEvents.length, 1);
  assertNoForbiddenOutput(auditEvents[0]);
  for (const forbiddenValue of [
    'provider_payload_should_not_leak',
    'session_should_not_leak',
    'private_should_not_leak',
    'cookie_should_not_leak',
    'params_should_not_leak',
    'debug_should_not_leak',
  ]) {
    assert.equal(JSON.stringify(auditEvents[0]).includes(forbiddenValue), false);
  }
  assertNoAuditResultOutput(res.jsonCalls[0]);
});

test('invalid visit action audit event builder result skips writer and preserves response', async () => {
  const builderPath = require.resolve('../../src/engineerMobile/engineerMobileAuditEventBuilder');
  const routePath = require.resolve('../../src/routes/engineerMobileVisitActionRoutes');
  const builderModule = require(builderPath);
  const originalBuilder = builderModule.buildEngineerMobileAuditEvent;

  try {
    builderModule.buildEngineerMobileAuditEvent = () => ({
      ok: false,
      reasonCode: 'invalid_route',
    });
    delete require.cache[routePath];
    const freshRouteModule = require('../../src/routes/engineerMobileVisitActionRoutes');
    const freshRouter = createSyntheticRouter();
    const auditEvents = [];

    freshRouteModule.registerEngineerMobileVisitActionRoutes(freshRouter, {
      auditWriter(event) {
        auditEvents.push(event);
      },
      visitActionAppointmentProvider() {
        return appointment();
      },
      visitActionService: acceptedService(),
    });

    const { res } = await invokeRoute(freshRouter.calls[0], request());

    assert.deepEqual(res.statusCalls, [202]);
    assert.equal(res.jsonCalls[0].accepted, true);
    assert.equal(auditEvents.length, 0);
    assertNoAuditResultOutput(res.jsonCalls[0]);
  } finally {
    builderModule.buildEngineerMobileAuditEvent = originalBuilder;
    delete require.cache[routePath];
    require('../../src/routes/engineerMobileVisitActionRoutes');
  }
});

test('invalid router is a safe no-op', () => {
  for (const router of [undefined, null, {}, { get() {} }]) {
    assert.equal(registerEngineerMobileVisitActionRoutes(router), router);
  }
});

test('route source import boundary avoids DB provider app server and admin dependencies', () => {
  const source = fs.readFileSync(routeFile, 'utf8');

  assert.deepEqual(requireSpecifiers(source), [
    '../engineerMobile/engineerMobilePermissionMiddleware',
    '../engineerMobile/engineerMobileVisitActionHttpHandlerAdapter',
    '../engineerMobile/engineerMobileAuditEventBuilder',
    '../engineerMobile/engineerMobileAuditWriterAdapter',
  ]);

  for (const pattern of [
    /\bpg\b/i,
    /\bpool\b/i,
    /DATABASE_URL/,
    /process\.env/,
    /\bfs\b/,
    /\bpath\b/,
    /require\(['"].*express['"]\)/i,
    /require\(['"].*server['"]\)/i,
    /require\(['"].*app['"]\)/i,
    /require\(['"].*admin/i,
    /\.listen\s*\(/,
    /\bINSERT\b/i,
    /\bUPDATE\b/i,
    /\bDELETE\b/i,
    /\bALTER\b/i,
    /\bCREATE\s+TABLE\b/i,
    /\.query\s*\(/,
    /finalAppointmentId\s*:/,
  ]) {
    assert.doesNotMatch(source, pattern, `route contains forbidden pattern ${pattern}`);
  }
});
