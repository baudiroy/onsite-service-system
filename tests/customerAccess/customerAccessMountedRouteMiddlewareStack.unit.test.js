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
    handlers,
    nextCallCount,
    res,
    route,
  };
}

function verifiedContextInput() {
  return {
    organizationId: 'org_test_001',
    caseId: 'case_test_001',
    customerId: 'customer_test_001',
    customerIdentityVerified: true,
    caseLinkedToCustomer: true,
    publicationAllowed: true,
    customerVisiblePolicyPassed: true,
    lineChannelId: 'line_channel_test_001',
    lineUserId: 'line_user_test_001',
    customerVisibleData: {
      serviceReport: {
        publicReportId: 'report_public_test_001',
        status: 'available',
        finalAppointmentId: 'appt_final_test_001',
        internalNote: 'must_not_leak',
        auditLog: 'must_not_leak',
        aiRawPayload: 'must_not_leak',
        internalBillingData: 'must_not_leak',
        rawPhone: 'must_not_leak',
        rawAddress: 'must_not_leak',
        rawLineUserId: 'must_not_leak',
      },
    },
  };
}

const forbiddenValues = [
  'must_not_leak',
  'line_user_test_001',
  'MISSING_ORGANIZATION_SCOPE',
  'UNVERIFIED_CUSTOMER_IDENTITY',
  'MISSING_CASE_LINKAGE',
  'PUBLICATION_NOT_ALLOWED',
  'CUSTOMER_VISIBLE_POLICY_FAILED',
];

function assertNoForbiddenLeak(body) {
  const serialized = JSON.stringify(body);

  for (const value of forbiddenValues) {
    assert.equal(serialized.includes(value), false, `mounted route response leaked ${value}`);
  }
}

test('central router exposes GET /customer-access/:caseId', () => {
  const route = mountedCustomerAccessRoute();

  assert.ok(route, 'customer access route should be mounted');
  assert.equal(route.route.path, '/customer-access/:caseId');
  assert.equal(route.route.methods.get, true);
});

test('mounted route contains middleware and controller handlers', () => {
  const route = mountedCustomerAccessRoute();
  const handlers = route.route.stack.map((layer) => layer.handle);

  assert.equal(handlers.length >= 2, true);
  assert.equal(handlers[0].name, 'customerAccessContextMiddleware');
  assert.equal(handlers[handlers.length - 1].name, 'handleCustomerAccessRequest');
  assert.equal(typeof handlers[0], 'function');
  assert.equal(typeof handlers[handlers.length - 1], 'function');
});

test('first mounted handler behaves as middleware and calls next', () => {
  const route = mountedCustomerAccessRoute();
  const middleware = route.route.stack[0].handle;
  let nextCallCount = 0;
  const req = {
    customerAccessContextInput: verifiedContextInput(),
  };

  middleware(req, {}, () => {
    nextCallCount += 1;
  });

  assert.equal(nextCallCount, 1);
  assert.deepEqual(req.auth, {
    organizationId: 'org_test_001',
    customerId: 'customer_test_001',
    customerIdentityVerified: true,
  });
});

test('missing customer access context runs full mounted stack and returns generic safe-deny', () => {
  const { body, nextCallCount, res } = invokeMountedRoute({
    params: { caseId: 'case_test_001' },
  });

  assert.equal(nextCallCount, 1);
  assert.deepEqual(res.calls.status, [404]);
  assert.deepEqual(body, {
    status: 'deny',
    messageKey: 'customerAccess.unavailable',
    customerVisible: false,
    data: null,
    error: {
      messageKey: 'customerAccess.unavailable',
    },
  });
  assertNoForbiddenLeak(body);
});

test('synthetic verified context runs full mounted stack and returns allow envelope', () => {
  const req = {
    customerAccessContextInput: verifiedContextInput(),
  };
  const originalReq = JSON.parse(JSON.stringify(req));
  const { body, nextCallCount, res } = invokeMountedRoute(req);

  assert.equal(nextCallCount, 1);
  assert.deepEqual(res.calls.status, [200]);
  assert.equal(body.status, 'allow');
  assert.equal(body.messageKey, 'customerAccess.available');
  assert.equal(body.customerVisible, true);
  assert.deepEqual(body.data, {
    serviceReport: {
      publicReportId: 'report_public_test_001',
      status: 'available',
      finalAppointmentId: 'appt_final_test_001',
    },
  });
  assert.equal(req.customerAccessContextInput.customerVisibleData.serviceReport.finalAppointmentId, 'appt_final_test_001');
  assert.equal(body.data.serviceReport.finalAppointmentId, 'appt_final_test_001');
  assert.deepEqual(req.customerAccessContextInput, originalReq.customerAccessContextInput);
  assertNoForbiddenLeak(body);
});

test('test imports central router only and does not import server bootstrap', () => {
  assert.equal(typeof router.listen, 'undefined');
  assert.equal(router.stack.some((layer) => layer && layer.handle && layer.handle.name === 'app'), false);
});
