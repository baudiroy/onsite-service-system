'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
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

function verifiedSyntheticRequest() {
  return {
    params: {
      caseId: 'case_test_001',
    },
    customerAccessContextInput: {
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
          caseNo: 'CASE-TEST-001',
          publicReportId: 'report_public_test_001',
          status: 'available',
          finalAppointmentId: 'appt_final_test_001',
          summary: 'Customer-safe synthetic summary',
          internalNote: 'should-not-leak',
          auditLog: { event: 'should-not-leak' },
          aiRawPayload: { prompt: 'should-not-leak' },
          internalBillingData: { amount: 9999 },
          settlementInternalData: { vendorRule: 'should-not-leak' },
          rawPhone: '0912-345-678',
          rawAddress: '台北市信義區測試路1號',
          lineUserId: 'line_user_test_001',
          token: 'token_should_not_leak',
          secret: 'secret_should_not_leak',
        },
      },
    },
  };
}

const forbiddenValues = [
  'should-not-leak',
  '0912-345-678',
  '台北市信義區測試路1號',
  'line_user_test_001',
  'token_should_not_leak',
  'secret_should_not_leak',
  'internalNote',
  'auditLog',
  'aiRawPayload',
  'internalBillingData',
  'settlementInternalData',
  'rawPhone',
  'rawAddress',
  'lineUserId',
  'token',
  'secret',
];

function assertNoForbiddenFields(body) {
  const serialized = JSON.stringify(body);

  for (const value of forbiddenValues) {
    assert.equal(serialized.includes(value), false, `allow response leaked forbidden value: ${value}`);
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

test('mounted customer access route returns allow envelope with verified synthetic context', () => {
  const req = verifiedSyntheticRequest();
  const originalReq = JSON.parse(JSON.stringify(req));
  const { body, nextCallCount, res } = invokeMountedRoute(req);

  assert.equal(nextCallCount, 1);
  assert.deepEqual(res.calls.status, [200]);
  assert.equal(res.calls.json.length, 1);
  assert.deepEqual(body, res.calls.json[0]);
  assert.equal(body.status, 'allow');
  assert.equal(body.messageKey, 'customerAccess.available');
  assert.equal(body.customerVisible, true);
  assert.deepEqual(Object.keys(body), ['status', 'messageKey', 'customerVisible', 'data']);
  assert.deepEqual(Object.keys(body.data), ['serviceReport']);
  assert.deepEqual(Object.keys(body.data.serviceReport), [
    'caseNo',
    'finalAppointmentId',
    'publicReportId',
    'status',
    'summary',
  ]);
  assert.deepEqual(body.data, {
    serviceReport: {
      caseNo: 'CASE-TEST-001',
      finalAppointmentId: 'appt_final_test_001',
      publicReportId: 'report_public_test_001',
      status: 'available',
      summary: 'Customer-safe synthetic summary',
    },
  });
  assert.deepEqual(req.customerAccessContextInput, originalReq.customerAccessContextInput);
});

test('mounted allow response filters internal, billing, audit, AI, identity, token, and secret fields', () => {
  const { body } = invokeMountedRoute(verifiedSyntheticRequest());

  assert.equal(body.status, 'allow');
  assertNoForbiddenFields(body);
});

test('mounted allow response preserves finalAppointmentId without modifying it', () => {
  const req = verifiedSyntheticRequest();
  const { body } = invokeMountedRoute(req);

  assert.equal(req.customerAccessContextInput.customerVisibleData.serviceReport.finalAppointmentId, 'appt_final_test_001');
  assert.equal(body.data.serviceReport.finalAppointmentId, 'appt_final_test_001');
});

function requireSpecifiers(source) {
  const specifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers;
}

test('test file imports only central router and Node built-ins', () => {
  const testSource = fs.readFileSync(__filename, 'utf8');
  const specifiers = requireSpecifiers(testSource);

  assert.deepEqual(specifiers, [
    'node:assert/strict',
    'node:fs',
    'node:test',
    '../../src/routes',
  ]);
  assert.equal(typeof router.listen, 'undefined');
});
