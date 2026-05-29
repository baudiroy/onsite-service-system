'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  getCustomerAccessRouteDefinitions,
  registerCustomerAccessModuleRoutes,
} = require('../../src/customerAccess/customerAccessRouteRegistry');

function createSyntheticRouter() {
  return {
    routes: [],
    get(path, ...handlers) {
      this.routes.push({
        method: 'GET',
        path,
        handlers,
      });
      return this;
    },
  };
}

function invokeRoute(route, req) {
  const res = createSyntheticRes();
  let nextCallCount = 0;

  route.handlers[0](req, res, () => {
    nextCallCount += 1;
  });
  const body = route.handlers[route.handlers.length - 1](req, res);

  return {
    body,
    nextCallCount,
    res,
  };
}

function createSyntheticRes() {
  const calls = {
    status: [],
    json: [],
  };

  return {
    calls,
    status(code) {
      calls.status.push(code);
      return this;
    },
    json(body) {
      calls.json.push(body);
      return body;
    },
  };
}

const forbiddenValues = [
  '0912-345-678',
  '台北市信義區測試路1號',
  'U1234567890abcdef',
  'MISSING_ORGANIZATION_SCOPE',
  'UNVERIFIED_CUSTOMER_IDENTITY',
  'MISSING_CASE_LINKAGE',
  'PUBLICATION_NOT_ALLOWED',
  'CUSTOMER_VISIBLE_POLICY_FAILED',
];

function assertSafePayload(payload) {
  const serialized = JSON.stringify(payload);

  for (const value of forbiddenValues) {
    assert.equal(serialized.includes(value), false, `registry payload leaked forbidden value: ${value}`);
  }
}

test('exports registerCustomerAccessModuleRoutes', () => {
  assert.equal(typeof registerCustomerAccessModuleRoutes, 'function');
});

test('exports getCustomerAccessRouteDefinitions', () => {
  assert.equal(typeof getCustomerAccessRouteDefinitions, 'function');
});

test('registry registers customer access routes through synthetic router', () => {
  const router = createSyntheticRouter();

  const returnedRouter = registerCustomerAccessModuleRoutes(router);

  assert.equal(returnedRouter, router);
  assert.deepEqual(router.routes.map((route) => `${route.method} ${route.path}`), [
    'GET /customer-access/:caseId',
    'GET /customer-access/:caseId/service-report/:reportId',
  ]);
});

test('registered route path includes caseId param and handler is function', () => {
  const router = createSyntheticRouter();

  registerCustomerAccessModuleRoutes(router);

  assert.equal(router.routes[0].path, '/customer-access/:caseId');
  assert.equal(router.routes[0].path.includes(':caseId'), true);
  assert.equal(router.routes[0].handlers.length >= 2, true);
  assert.equal(typeof router.routes[0].handlers[0], 'function');
  assert.equal(typeof router.routes[0].handlers[router.routes[0].handlers.length - 1], 'function');
});

test('metadata returns customer access route path and method without sensitive data', () => {
  const definitions = getCustomerAccessRouteDefinitions();

  assert.deepEqual(definitions, [
    {
      module: 'customerAccess',
      method: 'GET',
      path: '/customer-access/:caseId',
    },
    {
      module: 'customerAccess',
      method: 'GET',
      path: '/customer-access/:caseId/service-report/:reportId',
    },
  ]);
  assertSafePayload(definitions);
});

test('invalid or missing router safe no-ops', () => {
  assert.equal(registerCustomerAccessModuleRoutes(), undefined);
  assert.equal(registerCustomerAccessModuleRoutes(null), null);
  assert.deepEqual(registerCustomerAccessModuleRoutes({}), {});
});

test('registered handler returns generic safe-deny for missing middleware context', () => {
  const router = createSyntheticRouter();
  registerCustomerAccessModuleRoutes(router);

  const { body, nextCallCount, res } = invokeRoute(
    router.routes[0],
    { params: { caseId: 'case-synthetic' } },
  );

  assert.equal(nextCallCount, 1);
  assert.deepEqual(res.calls.status, [404]);
  assert.equal(res.calls.json.length, 1);
  assert.deepEqual(body, {
    status: 'deny',
    messageKey: 'customerAccess.unavailable',
    customerVisible: false,
    data: null,
    error: {
      messageKey: 'customerAccess.unavailable',
    },
  });
  assertSafePayload(body);
});

test('registered handler response does not expose internal reason or raw identifiers', () => {
  const router = createSyntheticRouter();
  registerCustomerAccessModuleRoutes(router);

  const { body } = invokeRoute(
    router.routes[0],
    {
      params: { caseId: 'case-synthetic' },
      auth: { organizationId: 'org-synthetic' },
      channel: { lineUserId: 'U1234567890abcdef' },
      rawPhone: '0912-345-678',
      rawAddress: '台北市信義區測試路1號',
    },
  );

  assert.equal(body.status, 'deny');
  assertSafePayload(body);
});
