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
  assert.match(route.handlers[0].name, /engineerMobilePermissionMiddleware/);
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
