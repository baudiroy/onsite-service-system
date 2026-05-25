'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  ENGINEER_MOBILE_TASKS_ROUTE_PATH,
  registerEngineerMobileRoutes,
} = require('../../src/routes/engineerMobileRoutes');

const repoRoot = path.resolve(__dirname, '../..');
const routeFile = path.join(repoRoot, 'src/routes/engineerMobileRoutes.js');

function createSyntheticRouter() {
  const calls = [];

  return {
    calls,
    get(pathname, ...handlers) {
      calls.push({
        handlers,
        method: 'get',
        pathname,
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
    organizationId: 'org_engineer_mobile_route_permission_001',
    userId: 'user_engineer_mobile_route_permission_001',
    engineerId: 'eng_engineer_mobile_route_permission_001',
    role: 'engineer',
    permissions: ['engineer_mobile.tasks.read'],
    ...overrides,
  };
}

function task(overrides = {}) {
  return {
    caseId: 'case_engineer_mobile_route_permission_001',
    appointmentId: 'apt_engineer_mobile_route_permission_001',
    organizationId: 'org_engineer_mobile_route_permission_001',
    assignedEngineerId: 'eng_engineer_mobile_route_permission_001',
    scheduledStart: '2026-05-21T09:00:00+08:00',
    scheduledEnd: '2026-05-21T10:00:00+08:00',
    status: 'confirmed',
    customerNameMasked: '陳○○',
    customerPhoneMasked: '09xx-xxx-789',
    addressSummary: '台中市西屯區',
    productSummary: '洗衣機',
    issueSummary: '異音',
    serviceType: 'repair',
    internalNote: 'internal_note_should_not_leak',
    auditLog: 'audit_log_should_not_leak',
    aiRawPayload: 'ai_raw_payload_should_not_leak',
    rawPhone: 'raw_phone_should_not_leak',
    rawAddress: 'raw_address_should_not_leak',
    rawLineUserId: 'line_user_should_not_leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    DATABASE_URL: 'DATABASE_URL_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    ...overrides,
  };
}

function request(overrides = {}) {
  return {
    auth: auth(),
    query: {},
    body: {
      organizationId: 'body_org_should_not_leak',
      engineerId: 'body_engineer_should_not_leak',
      rawPhone: 'body_raw_phone_should_not_leak',
      secret: 'body_secret_should_not_leak',
    },
    ...overrides,
  };
}

function registerRoute(options = {}) {
  const router = createSyntheticRouter();

  registerEngineerMobileRoutes(router, options);

  assert.equal(router.calls.length, 1);
  return router.calls[0];
}

function invokeRoute(route, req) {
  const res = createResponse();
  let index = 0;

  function next() {
    index += 1;
    const handler = route.handlers[index];

    if (handler) {
      return handler(req, res, next);
    }

    return undefined;
  }

  route.handlers[0](req, res, next);

  return {
    req,
    res,
  };
}

function assertNoForbiddenOutput(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'body_org_should_not_leak',
    'body_engineer_should_not_leak',
    'body_raw_phone_should_not_leak',
    'body_secret_should_not_leak',
    'internal_note_should_not_leak',
    'audit_log_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'DATABASE_URL_should_not_leak',
    'final_appointment_should_not_leak',
    'rawPhone',
    'rawAddress',
    'rawLineUserId',
    'finalAppointmentId',
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

test('route registers GET /engineer-mobile/tasks with middleware before handler', () => {
  const route = registerRoute();

  assert.equal(route.method, 'get');
  assert.equal(route.pathname, ENGINEER_MOBILE_TASKS_ROUTE_PATH);
  assert.equal(route.handlers.length, 2);
  assert.match(route.handlers[0].name, /engineerMobilePermissionMiddleware/);
  assert.match(route.handlers[1].name, /engineerMobileTaskListHandler/);
});

test('missing auth denied by middleware before provider calls', () => {
  const providerCalls = [];
  const route = registerRoute({
    readModel() {
      providerCalls.push('called');
      return [task()];
    },
  });
  const { res } = invokeRoute(route, {});

  assert.deepEqual(providerCalls, []);
  assert.deepEqual(res.statusCalls, [403]);
  assert.deepEqual(res.jsonCalls[0], {
    status: 'deny',
    messageKey: 'engineerMobile.unavailable',
    data: null,
  });
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('missing permission denied before provider calls', () => {
  const providerCalls = [];
  const route = registerRoute({
    readModel() {
      providerCalls.push('called');
      return [task()];
    },
  });
  const { res } = invokeRoute(route, request({
    auth: auth({ permissions: [] }),
  }));

  assert.deepEqual(providerCalls, []);
  assert.deepEqual(res.statusCalls, [403]);
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('engineer with required permission passes middleware and returns task list', () => {
  const providerCalls = [];
  const route = registerRoute({
    readModel(input) {
      providerCalls.push(input);
      return [task({ caseId: 'case_allowed' })];
    },
  });
  const req = request();
  const { res } = invokeRoute(route, req);

  assert.equal(providerCalls.length, 1);
  assert.deepEqual(res.statusCalls, [200]);
  assert.equal(res.jsonCalls[0].status, 'allow');
  assert.deepEqual(res.jsonCalls[0].tasks.map((entry) => entry.caseId), ['case_allowed']);
  assert.deepEqual(req.engineerMobilePermissionContext, {
    organizationId: 'org_engineer_mobile_route_permission_001',
    userId: 'user_engineer_mobile_route_permission_001',
    engineerId: 'eng_engineer_mobile_route_permission_001',
    role: 'engineer',
    permissions: ['engineer_mobile.tasks.read'],
  });
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('compatible Engineer Mobile permissions pass', () => {
  for (const permission of [
    'engineer_mobile.tasks.read.assigned',
    'engineer_mobile.workbench.access',
  ]) {
    const route = registerRoute({
      readModel() {
        return [task({ caseId: `case_${permission.replaceAll('.', '_')}` })];
      },
    });
    const { res } = invokeRoute(route, request({
      auth: auth({ permissions: [permission] }),
    }));

    assert.deepEqual(res.statusCalls, [200]);
    assert.equal(res.jsonCalls[0].tasks.length, 1);
  }
});

test('supervisor admin and dispatch assistant with permission and engineerId pass', () => {
  for (const role of ['supervisor', 'admin', 'dispatch_assistant']) {
    const route = registerRoute({
      readModel() {
        return [task({ caseId: `case_${role}` })];
      },
    });
    const { res } = invokeRoute(route, request({
      auth: auth({ role }),
    }));

    assert.deepEqual(res.statusCalls, [200]);
    assert.equal(res.jsonCalls[0].tasks.length, 1);
  }
});

test('customer service and AI role denied before provider calls', () => {
  for (const role of ['customer_service', 'ai']) {
    const providerCalls = [];
    const route = registerRoute({
      readModel() {
        providerCalls.push(role);
        return [task()];
      },
    });
    const { res } = invokeRoute(route, request({
      auth: auth({ role }),
    }));

    assert.deepEqual(providerCalls, []);
    assert.deepEqual(res.statusCalls, [403]);
  }
});

test('wrong org and wrong engineer tasks remain excluded by service', () => {
  const route = registerRoute({
    readModel() {
      return [
        task({ caseId: 'case_allowed' }),
        task({ caseId: 'case_wrong_org', organizationId: 'org_other' }),
        task({ caseId: 'case_wrong_engineer', assignedEngineerId: 'eng_other' }),
      ];
    },
  });
  const { res } = invokeRoute(route, request());

  assert.deepEqual(res.statusCalls, [200]);
  assert.deepEqual(res.jsonCalls[0].tasks.map((entry) => entry.caseId), ['case_allowed']);
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('missing router remains safe no-op', () => {
  assert.equal(registerEngineerMobileRoutes(undefined), undefined);
  assert.deepEqual(registerEngineerMobileRoutes({}), {});
});

test('route source imports only controller and permission middleware', () => {
  const source = fs.readFileSync(routeFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, [
    '../controllers/engineerMobileController',
    '../engineerMobile/engineerMobilePermissionMiddleware',
  ]);
  assert.equal(/db|pool|transaction|repositories?/i.test(source), false);
  assert.equal(/line|sms|email|push|provider/i.test(source), false);
  assert.equal(/rag|vector|openai/i.test(source), false);
  assert.equal(/require\(['"].*(app|server)['"]\)/i.test(source), false);
});
