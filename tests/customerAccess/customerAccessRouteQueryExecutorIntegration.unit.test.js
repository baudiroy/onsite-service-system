'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
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

function validRows(overrides) {
  const config = overrides || {};

  return {
    caseRow: config.caseRow || {
      id: 'case_route_query_001',
      organization_id: 'org_route_query_001',
      customer_id: 'customer_route_query_001',
    },
    customerIdentityRow: config.customerIdentityRow || {
      customer_id: 'customer_route_query_001',
      organization_id: 'org_route_query_001',
      verified: true,
      line_channel_id: 'line_channel_route_query_001',
      line_user_id: 'line_user_should_not_leak',
      raw_phone: 'raw_phone_should_not_leak',
    },
    publicationRow: config.publicationRow || {
      case_id: 'case_route_query_001',
      organization_id: 'org_route_query_001',
      publication_allowed: true,
      customer_visible_policy_passed: true,
    },
    serviceReportRow: config.serviceReportRow || {
      public_report_id: 'report_public_route_query_001',
      status: 'available',
      final_appointment_id: 'appt_should_not_be_in_response',
      internal_note: 'internal_note_should_not_leak',
      audit_log: 'audit_log_should_not_leak',
      ai_raw_payload: 'ai_raw_payload_should_not_leak',
      billing_internal_data: 'billing_internal_data_should_not_leak',
      settlement_internal_data: 'settlement_internal_data_should_not_leak',
      token: 'token_should_not_leak',
      secret: 'secret_should_not_leak',
    },
  };
}

function registeredRoute(options) {
  const router = createSyntheticRouter();
  registerCustomerAccessRoutes(router, options);
  return router.routes[0];
}

function invokeRoute(rowsOrExecutor, inputOverrides) {
  const queryExecutor = typeof rowsOrExecutor === 'function'
    ? rowsOrExecutor
    : () => rowsOrExecutor;
  const route = registeredRoute({ queryExecutor });
  const res = createSyntheticRes();
  const req = {
    customerAccessContextInput: {
      organizationId: 'org_route_query_001',
      caseId: 'case_route_query_001',
      customerId: 'customer_route_query_001',
      rawPhone: 'raw_phone_should_not_leak',
      rawAddress: 'raw_address_should_not_leak',
      rawLineUserId: 'line_user_should_not_leak',
      ...(inputOverrides || {}),
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
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
    'internal_note_should_not_leak',
    'audit_log_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'billing_internal_data_should_not_leak',
    'settlement_internal_data_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'executor_error_should_not_leak',
    'appt_should_not_be_in_response',
  ]) {
    assert.equal(serialized.includes(value), false, `route response leaked ${value}`);
  }
}

function assertSafeDeny(result) {
  assert.deepEqual(result.res.calls.status, [404]);
  assert.equal(result.body.status, 'deny');
  assert.equal(result.body.messageKey, 'customerAccess.unavailable');
  assert.equal(result.body.data, null);
  assertNoLeak(result.body);
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

test('registerCustomerAccessRoutes with queryExecutor registers GET /customer-access/:caseId', () => {
  const route = registeredRoute({ queryExecutor: () => validRows() });

  assert.equal(route.method, 'GET');
  assert.equal(route.path, '/customer-access/:caseId');
  assert.equal(route.handlers.length, 2);
});

test('synthetic all-allow row bundle via queryExecutor returns HTTP 200 allow envelope', () => {
  const result = invokeRoute(validRows());

  assert.equal(result.nextCallCount, 1);
  assert.deepEqual(result.res.calls.status, [200]);
  assert.equal(result.body.status, 'allow');
  assert.equal(result.body.messageKey, 'customerAccess.available');
  assert.deepEqual(result.body.data, {
    serviceReport: {
      publicReportId: 'report_public_route_query_001',
      status: 'available',
    },
  });
  assertNoLeak(result.body);
});

test('missing required params or missing case id returns generic safe-deny', () => {
  assertSafeDeny(invokeRoute(() => {
    throw new Error('executor should not be called');
  }, {
    caseId: '',
  }));
});

test('organization mismatch rows return generic safe-deny', () => {
  assertSafeDeny(invokeRoute(validRows({
    serviceReportRow: {
      organization_id: 'org_other_001',
      public_report_id: 'report_public_route_query_001',
      status: 'available',
    },
  })));
});

test('identity unverified rows return generic safe-deny', () => {
  assertSafeDeny(invokeRoute(validRows({
    customerIdentityRow: {
      customer_id: 'customer_route_query_001',
      organization_id: 'org_route_query_001',
      verified: false,
      line_user_id: 'line_user_should_not_leak',
    },
  })));
});

test('case not linked rows return generic safe-deny', () => {
  assertSafeDeny(invokeRoute(validRows({
    caseRow: {
      id: 'case_route_query_001',
      organization_id: 'org_route_query_001',
    },
  })));
});

test('publication not allowed rows return generic safe-deny', () => {
  assertSafeDeny(invokeRoute(validRows({
    publicationRow: {
      case_id: 'case_route_query_001',
      organization_id: 'org_route_query_001',
      publication_allowed: false,
      customer_visible_policy_passed: true,
    },
  })));
});

test('projection unavailable rows return generic safe-deny', () => {
  const rows = validRows();
  delete rows.serviceReportRow;

  assertSafeDeny(invokeRoute(rows));
});

test('executor throw returns generic safe-deny without raw error leak', () => {
  assertSafeDeny(invokeRoute(() => {
    throw new Error('executor_error_should_not_leak');
  }));
});

test('finalAppointmentId is not included or modified in queryExecutor response', () => {
  const result = invokeRoute(validRows());
  const serialized = JSON.stringify(result.body);

  assert.equal(serialized.includes('finalAppointmentId'), false);
  assert.equal(serialized.includes('final_appointment_id'), false);
  assertNoLeak(result.body);
});

test('route and middleware imports do not include server bootstrap, DB, provider, or AI modules', () => {
  const routeSource = fs.readFileSync(
    path.join(repoRoot, 'src/routes/customerAccessRoutes.js'),
    'utf8',
  );
  const middlewareSource = fs.readFileSync(
    path.join(repoRoot, 'src/customerAccess/customerAccessContextMiddleware.js'),
    'utf8',
  );

  assert.deepEqual(requireSpecifiers(routeSource), [
    '../customerAccess/customerAccessDbAdapter',
    '../customerAccess/customerAccessContextMiddleware',
    '../controllers/customerAccessController',
  ]);
  assert.deepEqual(requireSpecifiers(middlewareSource), [
    './customerAccessContextProvider',
    './customerAccessReadOnlyRepository',
  ]);
  assert.doesNotMatch(`${routeSource}\n${middlewareSource}`, /pg|pool|client\.query|transaction|begin|commit|rollback/i);
  assert.doesNotMatch(`${routeSource}\n${middlewareSource}`, /sms|email|push|rag|vector/i);
  assert.doesNotMatch(`${routeSource}\n${middlewareSource}`, /lineAccessToken|channelSecret/i);
  assert.doesNotMatch(`${routeSource}\n${middlewareSource}`, /model\.|completion|embedding|retrieval/i);
});
