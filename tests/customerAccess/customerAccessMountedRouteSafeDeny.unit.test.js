'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { router } = require('../../src/routes');

function mountedCustomerAccessRoute() {
  return router.stack.find((layer) => (
    layer.route
    && layer.route.path === '/customer-access/:caseId'
    && layer.route.methods.get === true
  ));
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

function invokeMountedRoute(req) {
  const route = mountedCustomerAccessRoute();
  const handlers = route.route.stack.map((layer) => layer.handle);
  const res = createSyntheticRes();
  let nextCallCount = 0;

  handlers[0](req, res, () => {
    nextCallCount += 1;
  });
  const body = handlers[handlers.length - 1](req, res);

  return {
    body,
    nextCallCount,
    res,
  };
}

const forbiddenLeakValues = [
  'case exists',
  'customer exists',
  'organization mismatch',
  'identity mismatch',
  'publication reason',
  'MISSING_ORGANIZATION_SCOPE',
  'UNVERIFIED_CUSTOMER_IDENTITY',
  'MISSING_CASE_LINKAGE',
  'PUBLICATION_NOT_ALLOWED',
  'CUSTOMER_VISIBLE_POLICY_FAILED',
  '0912-345-678',
  '台北市信義區測試路1號',
  'U1234567890abcdef',
];

function assertNoSensitiveLeak(body) {
  const serialized = JSON.stringify(body);

  for (const value of forbiddenLeakValues) {
    assert.equal(serialized.includes(value), false, `safe-deny response leaked ${value}`);
  }
}

test('central router exposes GET /customer-access/:caseId', () => {
  const route = mountedCustomerAccessRoute();

  assert.ok(route, 'customer access route should be mounted');
  assert.equal(route.route.path, '/customer-access/:caseId');
  assert.equal(route.route.methods.get, true);
});

test('mounted customer access route handler exists', () => {
  const route = mountedCustomerAccessRoute();
  const handler = route.route.stack[0].handle;

  assert.equal(typeof handler, 'function');
});

test('mounted customer access route returns generic safe-deny without verified context', () => {
  const { body, nextCallCount, res } = invokeMountedRoute({ params: { caseId: 'case-synthetic' } });

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
  assertNoSensitiveLeak(body);
});

test('mounted safe-deny does not expose raw phone, address, LINE id, or internal reason', () => {
  const { body } = invokeMountedRoute(
    {
      params: { caseId: 'case-synthetic' },
      auth: { organizationId: 'org-synthetic' },
      channel: { lineUserId: 'U1234567890abcdef' },
      rawPhone: '0912-345-678',
      rawAddress: '台北市信義區測試路1號',
    },
  );

  assert.equal(body.status, 'deny');
  assert.equal(body.messageKey, 'customerAccess.unavailable');
  assertNoSensitiveLeak(body);
});

test('mounted safe-deny does not expose case, customer, org, identity, or publication reason', () => {
  const { body, res } = invokeMountedRoute(
    {
      params: { caseId: 'case-synthetic' },
      auth: { organizationId: 'org-synthetic' },
      access: {
        publicationAllowed: false,
        customerVisiblePolicyPassed: false,
      },
    },
  );

  assert.deepEqual(res.calls.status, [404]);
  assert.deepEqual(Object.keys(body.error), ['messageKey']);
  assertNoSensitiveLeak(body);
});

test('test imports central router only and does not import server bootstrap', () => {
  assert.equal(router.stack.some((layer) => layer && layer.handle && layer.handle.name === 'app'), false);
  assert.equal(typeof router.listen, 'undefined');
});
