'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  CUSTOMER_ACCESS_ROUTE_PATH,
  registerCustomerAccessRoutes,
} = require('../../src/routes/customerAccessRoutes');

const repoRoot = path.resolve(__dirname, '../..');

function createSyntheticRouter() {
  return {
    routes: [],
    get(pathname, ...handlers) {
      this.routes.push({
        method: 'GET',
        path: pathname,
        handlers,
      });
      return this;
    },
  };
}

function registeredCustomerAccessRoute() {
  const router = createSyntheticRouter();
  registerCustomerAccessRoutes(router);
  return router.routes[0];
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

function invokeRoute(req) {
  const route = registeredCustomerAccessRoute();
  const res = createSyntheticRes();
  let nextCallCount = 0;

  route.handlers[0](req, res, () => {
    nextCallCount += 1;
  });
  const body = route.handlers[1](req, res);

  return {
    body,
    nextCallCount,
    res,
    route,
  };
}

function validContextInput() {
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
        internalNote: 'should-not-leak',
        auditLog: { event: 'should-not-leak' },
        aiRawPayload: { prompt: 'should-not-leak' },
        internalBillingData: { amount: 9999 },
        rawPhone: '0912-345-678',
        rawAddress: '台北市信義區測試路1號',
        rawLineUserId: 'line_user_test_001',
        token: 'token_should_not_leak',
        secret: 'secret_should_not_leak',
      },
    },
  };
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

const forbiddenValues = [
  'should-not-leak',
  '0912-345-678',
  '台北市信義區測試路1號',
  'line_user_test_001',
  'token_should_not_leak',
  'secret_should_not_leak',
  'MISSING_ORGANIZATION_SCOPE',
  'UNVERIFIED_CUSTOMER_IDENTITY',
  'MISSING_CASE_LINKAGE',
  'PUBLICATION_NOT_ALLOWED',
  'CUSTOMER_VISIBLE_POLICY_FAILED',
];

function assertNoForbiddenLeak(body) {
  const serialized = JSON.stringify(body);

  for (const value of forbiddenValues) {
    assert.equal(serialized.includes(value), false, `route response leaked ${value}`);
  }
}

test('route registers GET /customer-access/:caseId', () => {
  const route = registeredCustomerAccessRoute();

  assert.equal(CUSTOMER_ACCESS_ROUTE_PATH, '/customer-access/:caseId');
  assert.equal(route.method, 'GET');
  assert.equal(route.path, '/customer-access/:caseId');
});

test('route registers middleware before controller handler', () => {
  const route = registeredCustomerAccessRoute();

  assert.equal(route.handlers.length, 2);
  assert.equal(typeof route.handlers[0], 'function');
  assert.equal(typeof route.handlers[1], 'function');
  assert.equal(route.handlers[0].name, 'customerAccessContextMiddleware');
  assert.equal(route.handlers[1].name, 'handleCustomerAccessRequest');
});

test('missing context invokes middleware then controller and returns generic safe-deny', () => {
  const { body, nextCallCount, res } = invokeRoute({
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

test('verified synthetic context invokes middleware then controller and returns allow envelope', () => {
  const req = {
    customerAccessContextInput: validContextInput(),
  };
  const originalReq = JSON.parse(JSON.stringify(req));
  const { body, nextCallCount, res } = invokeRoute(req);

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
});

test('allow envelope strips forbidden and internal fields', () => {
  const { body } = invokeRoute({
    customerAccessContextInput: validContextInput(),
  });

  assert.equal(body.status, 'allow');
  assertNoForbiddenLeak(body);
});

test('route module requires only bounded customer access adapter, context middleware, and controller', () => {
  const source = fs.readFileSync(
    path.join(repoRoot, 'src/routes/customerAccessRoutes.js'),
    'utf8',
  );

  assert.deepEqual(requireSpecifiers(source), [
    '../customerAccess/customerAccessDbAdapter',
    '../customerAccess/customerAccessContextMiddleware',
    '../controllers/customerAccessController',
  ]);
});
