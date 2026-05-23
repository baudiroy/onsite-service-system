'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  CUSTOMER_ACCESS_ROUTE_PATH,
  registerCustomerAccessRoutes,
} = require('../../src/routes/customerAccessRoutes');

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

function assertSafeResponse(response) {
  const serialized = JSON.stringify(response);

  for (const value of forbiddenValues) {
    assert.equal(serialized.includes(value), false, `route response leaked forbidden value: ${value}`);
  }
}

test('exports registerCustomerAccessRoutes', () => {
  assert.equal(typeof registerCustomerAccessRoutes, 'function');
});

test('registers one GET route on synthetic router', () => {
  const router = createSyntheticRouter();

  const returnedRouter = registerCustomerAccessRoutes(router);

  assert.equal(returnedRouter, router);
  assert.equal(router.routes.length, 1);
  assert.equal(router.routes[0].method, 'GET');
});

test('registered path includes caseId param', () => {
  const router = createSyntheticRouter();

  registerCustomerAccessRoutes(router);

  assert.equal(CUSTOMER_ACCESS_ROUTE_PATH, '/customer-access/:caseId');
  assert.equal(router.routes[0].path, '/customer-access/:caseId');
  assert.equal(router.routes[0].path.includes(':caseId'), true);
});

test('registered middleware and handler are functions', () => {
  const router = createSyntheticRouter();

  registerCustomerAccessRoutes(router);

  assert.equal(router.routes[0].handlers.length >= 2, true);
  assert.equal(typeof router.routes[0].handlers[0], 'function');
  assert.equal(typeof router.routes[0].handlers[router.routes[0].handlers.length - 1], 'function');
});

test('invalid or missing router no-ops without external side effect', () => {
  assert.equal(registerCustomerAccessRoutes(), undefined);
  assert.equal(registerCustomerAccessRoutes(null), null);
  assert.deepEqual(registerCustomerAccessRoutes({}), {});
});

test('registered handler can be invoked with synthetic req/res and returns generic safe-deny', () => {
  const router = createSyntheticRouter();
  registerCustomerAccessRoutes(router);

  const { body, nextCallCount, res } = invokeRoute(
    router.routes[0],
    { params: { caseId: 'case-synthetic' } },
  );

  assert.equal(nextCallCount, 1);
  assert.deepEqual(res.calls.status, [404]);
  assert.equal(res.calls.json.length, 1);
  assert.deepEqual(body, res.calls.json[0]);
  assert.deepEqual(body, {
    status: 'deny',
    messageKey: 'customerAccess.unavailable',
    customerVisible: false,
    data: null,
    error: {
      messageKey: 'customerAccess.unavailable',
    },
  });
  assertSafeResponse(body);
});

test('registered handler response does not expose raw phone, address, LINE id, or internal reason', () => {
  const router = createSyntheticRouter();
  registerCustomerAccessRoutes(router);

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
  assertSafeResponse(body);
});
