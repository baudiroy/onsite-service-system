'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  registerCustomerAccessRoutes,
} = require('../../src/routes/customerAccessRoutes');

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

function allowReadModel(overrides) {
  const config = overrides || {};

  return {
    organizationScope: config.organizationScope || {
      matched: true,
      organizationId: 'org_read_001',
    },
    customerIdentity: config.customerIdentity || {
      verified: true,
      customerId: 'customer_read_001',
    },
    caseLinkage: config.caseLinkage || {
      linked: true,
      caseId: 'case_read_001',
    },
    publication: config.publication || {
      allowed: true,
      customerVisiblePolicyPassed: true,
    },
    customerVisibleProjection: config.customerVisibleProjection || {
      available: true,
      data: {
        serviceReport: {
          publicReportId: 'report_public_read_001',
          status: 'available',
          finalAppointmentId: 'appt_final_read_001',
          internalNote: 'must_not_leak',
          auditLog: 'must_not_leak',
          aiRawPayload: 'must_not_leak',
          internalBillingData: 'must_not_leak',
          rawPhone: '0912-345-678',
          rawAddress: '台北市信義區測試路1號',
          rawLineId: 'line_user_should_not_leak',
        },
      },
    },
  };
}

function registeredRoute(options) {
  const router = createSyntheticRouter();
  registerCustomerAccessRoutes(router, options);
  return router.routes[0];
}

function invokeRoute(readModel) {
  const route = registeredRoute({ readModel });
  const res = createSyntheticRes();
  const req = {
    customerAccessContextInput: {
      organizationId: 'org_input_001',
      caseId: 'case_input_001',
      rawPhone: '0912-345-678',
      rawAddress: '台北市信義區測試路1號',
      rawLineUserId: 'line_user_should_not_leak',
    },
  };
  let nextCallCount = 0;

  route.handlers[0](req, res, () => {
    nextCallCount += 1;
  });
  const body = route.handlers[1](req, res);

  return {
    body,
    nextCallCount,
    req,
    res,
    route,
  };
}

function assertNoLeak(body) {
  const serialized = JSON.stringify(body);

  for (const value of [
    '0912-345-678',
    '台北市信義區測試路1號',
    'line_user_should_not_leak',
    'must_not_leak',
    'MISSING_ORGANIZATION_SCOPE',
    'UNVERIFIED_CUSTOMER_IDENTITY',
    'MISSING_CASE_LINKAGE',
    'PUBLICATION_NOT_ALLOWED',
    'CUSTOMER_VISIBLE_POLICY_FAILED',
  ]) {
    assert.equal(serialized.includes(value), false, `route response leaked ${value}`);
  }
}

test('registerCustomerAccessRoutes with readModel registers GET /customer-access/:caseId', () => {
  const route = registeredRoute({ readModel: allowReadModel() });

  assert.equal(route.method, 'GET');
  assert.equal(route.path, '/customer-access/:caseId');
  assert.equal(route.handlers.length, 2);
});

test('all-allow readModel and middleware stack returns HTTP 200 allow envelope', () => {
  const { body, nextCallCount, res } = invokeRoute(allowReadModel());

  assert.equal(nextCallCount, 1);
  assert.deepEqual(res.calls.status, [200]);
  assert.equal(body.status, 'allow');
  assert.equal(body.messageKey, 'customerAccess.available');
  assert.deepEqual(body.data, {
    serviceReport: {
      publicReportId: 'report_public_read_001',
      status: 'available',
      finalAppointmentId: 'appt_final_read_001',
    },
  });
  assertNoLeak(body);
});

test('organization unmatched readModel returns generic safe-deny', () => {
  const { body, res } = invokeRoute(allowReadModel({
    organizationScope: {
      matched: false,
      organizationId: 'org_read_001',
    },
  }));

  assert.deepEqual(res.calls.status, [404]);
  assert.equal(body.messageKey, 'customerAccess.unavailable');
  assertNoLeak(body);
});

test('identity unverified readModel returns generic safe-deny', () => {
  const { body, res } = invokeRoute(allowReadModel({
    customerIdentity: {
      verified: false,
      customerId: 'customer_read_001',
    },
  }));

  assert.deepEqual(res.calls.status, [404]);
  assert.equal(body.messageKey, 'customerAccess.unavailable');
  assertNoLeak(body);
});

test('case not linked readModel returns generic safe-deny', () => {
  const { body, res } = invokeRoute(allowReadModel({
    caseLinkage: {
      linked: false,
      caseId: 'case_read_001',
    },
  }));

  assert.deepEqual(res.calls.status, [404]);
  assert.equal(body.messageKey, 'customerAccess.unavailable');
  assertNoLeak(body);
});

test('publication not allowed readModel returns generic safe-deny', () => {
  const { body, res } = invokeRoute(allowReadModel({
    publication: {
      allowed: false,
    },
  }));

  assert.deepEqual(res.calls.status, [404]);
  assert.equal(body.messageKey, 'customerAccess.unavailable');
  assertNoLeak(body);
});

test('projection unavailable returns generic safe-deny with no customer-visible data', () => {
  const { body, res } = invokeRoute(allowReadModel({
    customerVisibleProjection: {
      available: false,
      data: {
        serviceReport: {
          publicReportId: 'report_public_read_001',
        },
      },
    },
  }));

  assert.deepEqual(res.calls.status, [404]);
  assert.equal(body.data, null);
  assertNoLeak(body);
});

test('readModel throw returns generic safe-deny without raw error leakage', () => {
  const { body, res } = invokeRoute({
    organizationScope() {
      throw new Error('must_not_leak');
    },
    customerIdentity: {},
    caseLinkage: {},
    publication: {},
    customerVisibleProjection: {},
  });

  assert.deepEqual(res.calls.status, [404]);
  assert.equal(body.messageKey, 'customerAccess.unavailable');
  assertNoLeak(body);
});

test('response never exposes raw phone, address, LINE id, and finalAppointmentId is not modified', () => {
  const { body, req } = invokeRoute(allowReadModel());

  assert.equal(body.data.serviceReport.finalAppointmentId, 'appt_final_read_001');
  assert.equal(req.customerVisibleData.serviceReport.finalAppointmentId, 'appt_final_read_001');
  assertNoLeak(body);
});
