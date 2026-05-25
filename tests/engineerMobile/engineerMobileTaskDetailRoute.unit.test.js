'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  ENGINEER_MOBILE_TASK_DETAIL_ROUTE_PATH,
  registerEngineerMobileTaskDetailRoutes,
} = require('../../src/routes/engineerMobileTaskDetailRoutes');

const repoRoot = path.resolve(__dirname, '../..');
const routeFile = path.join(repoRoot, 'src/routes/engineerMobileTaskDetailRoutes.js');
const controllerFile = path.join(repoRoot, 'src/controllers/engineerMobileTaskDetailController.js');

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
    organizationId: 'org_engineer_mobile_detail_route_001',
    userId: 'user_engineer_mobile_detail_route_001',
    engineerId: 'eng_engineer_mobile_detail_route_001',
    role: 'engineer',
    permissions: ['engineer_mobile.tasks.read'],
    ...overrides,
  };
}

function task(overrides = {}) {
  return {
    appointmentId: 'apt_engineer_mobile_detail_route_001',
    caseId: 'case_engineer_mobile_detail_route_001',
    organizationId: 'org_engineer_mobile_detail_route_001',
    assignedEngineerId: 'eng_engineer_mobile_detail_route_001',
    scheduledStart: '2026-05-21T09:00:00+08:00',
    status: 'confirmed',
    customerNameMasked: '許○○',
    customerPhoneMasked: '09xx-xxx-987',
    addressSummary: '桃園市中壢區',
    productSummary: '冷氣',
    issueSummary: '不冷',
    siteNoteSafe: '請先聯絡管理室',
    evidenceRefs: [
      {
        id: 'safe_ref_001',
        type: 'photo',
        label: '故障照片',
        token: 'evidence_token_should_not_leak',
      },
    ],
    internalNote: 'internal_note_should_not_leak',
    auditLog: 'audit_log_should_not_leak',
    aiRawPayload: 'ai_raw_payload_should_not_leak',
    billingInternal: 'billing_internal_should_not_leak',
    settlementInternal: 'settlement_internal_should_not_leak',
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
    body: {
      organizationId: 'body_org_should_not_leak',
      engineerId: 'body_engineer_should_not_leak',
      rawPhone: 'body_raw_phone_should_not_leak',
    },
    params: {
      appointmentId: 'apt_engineer_mobile_detail_route_001',
    },
    ...overrides,
  };
}

function registerRoute(options = {}) {
  const router = createSyntheticRouter();

  registerEngineerMobileTaskDetailRoutes(router, options);

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

async function invokeRouteAsync(route, req) {
  const res = createResponse();
  let index = 0;

  async function next() {
    index += 1;
    const handler = route.handlers[index];

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
    'body_org_should_not_leak',
    'body_engineer_should_not_leak',
    'body_raw_phone_should_not_leak',
    'internal_note_should_not_leak',
    'audit_log_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'billing_internal_should_not_leak',
    'settlement_internal_should_not_leak',
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'DATABASE_URL_should_not_leak',
    'final_appointment_should_not_leak',
    'evidence_token_should_not_leak',
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

test('route exports register function and detail path', () => {
  assert.equal(ENGINEER_MOBILE_TASK_DETAIL_ROUTE_PATH, '/engineer-mobile/tasks/:appointmentId');
  assert.equal(typeof registerEngineerMobileTaskDetailRoutes, 'function');
});

test('registers GET detail route with permission middleware before controller', () => {
  const route = registerRoute();

  assert.equal(route.method, 'get');
  assert.equal(route.pathname, '/engineer-mobile/tasks/:appointmentId');
  assert.equal(route.handlers.length, 2);
  assert.match(route.handlers[0].name, /engineerMobilePermissionMiddleware/);
  assert.match(route.handlers[1].name, /engineerMobileTaskDetailHandler/);
});

test('missing auth and permission denied before provider', () => {
  for (const req of [{}, request({ auth: auth({ permissions: [] }) })]) {
    const providerCalls = [];
    const route = registerRoute({
      readModel(input) {
        providerCalls.push(input);
        return { tasks: [task()] };
      },
    });
    const { res } = invokeRoute(route, req);

    assert.deepEqual(providerCalls, []);
    assert.deepEqual(res.statusCalls, [403]);
    assertNoForbiddenOutput(res.jsonCalls[0]);
  }
});

test('valid engineer auth and matching task returns HTTP 200 detail', () => {
  const route = registerRoute({
    readModel() {
      return { tasks: [task()] };
    },
  });
  const { res } = invokeRoute(route, request());

  assert.deepEqual(res.statusCalls, [200]);
  assert.equal(res.jsonCalls[0].status, 'allow');
  assert.equal(res.jsonCalls[0].detail.appointmentId, 'apt_engineer_mobile_detail_route_001');
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('valid engineer auth and async matching task returns HTTP 200 detail', async () => {
  const providerCalls = [];
  const route = registerRoute({
    async readModelAsync(input) {
      providerCalls.push(input);
      return { task: task({ caseId: 'case_async_detail_route' }) };
    },
  });
  const { res } = await invokeRouteAsync(route, request());

  assert.deepEqual(providerCalls, [{
    appointmentId: 'apt_engineer_mobile_detail_route_001',
    engineerId: 'eng_engineer_mobile_detail_route_001',
    organizationId: 'org_engineer_mobile_detail_route_001',
  }]);
  assert.deepEqual(res.statusCalls, [200]);
  assert.equal(res.jsonCalls[0].status, 'allow');
  assert.equal(res.jsonCalls[0].detail.caseId, 'case_async_detail_route');
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('wrong org engineer or appointment returns generic unavailable', () => {
  for (const sourceTask of [
    task({ organizationId: 'org_other' }),
    task({ assignedEngineerId: 'eng_other' }),
    task({ appointmentId: 'apt_other' }),
  ]) {
    const route = registerRoute({
      readModel() {
        return { tasks: [sourceTask] };
      },
    });
    const { res } = invokeRoute(route, request());

    assert.deepEqual(res.statusCalls, [404]);
    assert.deepEqual(res.jsonCalls[0], {
      detail: null,
      messageKey: 'engineerMobile.taskDetailUnavailable',
      status: 'deny',
    });
    assertNoForbiddenOutput(res.jsonCalls[0]);
  }
});

test('customer service and AI role denied before provider', () => {
  for (const role of ['customer_service', 'ai']) {
    const providerCalls = [];
    const route = registerRoute({
      readModel(input) {
        providerCalls.push(input);
        return { tasks: [task()] };
      },
    });
    const { res } = invokeRoute(route, request({
      auth: auth({ role }),
    }));

    assert.deepEqual(providerCalls, []);
    assert.deepEqual(res.statusCalls, [403]);
  }
});

test('invalid or missing router safe no-op', () => {
  assert.equal(registerEngineerMobileTaskDetailRoutes(undefined), undefined);
  assert.deepEqual(registerEngineerMobileTaskDetailRoutes({}), {});
});

test('route and controller import boundaries are safe', () => {
  const routeSource = fs.readFileSync(routeFile, 'utf8');
  const controllerSource = fs.readFileSync(controllerFile, 'utf8');

  assert.deepEqual(requireSpecifiers(routeSource), [
    '../controllers/engineerMobileTaskDetailController',
    '../engineerMobile/engineerMobilePermissionMiddleware',
  ]);
  assert.deepEqual(requireSpecifiers(controllerSource), [
    '../engineerMobile/engineerMobileTaskDetailService',
  ]);

  for (const [label, source] of [
    ['route', routeSource],
    ['controller', controllerSource],
  ]) {
    assert.equal(/db|pool|transaction|repositories?/i.test(source), false, `${label} imports DB`);
    assert.equal(requireSpecifiers(source).some((specifier) => /line|sms|email|push|provider/i.test(specifier)), false, `${label} imports provider`);
    assert.equal(/rag|vector|openai/i.test(source), false, `${label} imports AI`);
    assert.equal(/require\(['"].*(app|server)['"]\)/i.test(source), false, `${label} imports app/server`);
  }
});
