'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { app, createApp } = require('../../src/app');
const {
  CUSTOMER_ACCESS_REPORT_ROUTE_PATH,
  CUSTOMER_ACCESS_ROUTE_PATH,
} = require('../../src/routes/customerAccessRoutes');

const repoRoot = path.resolve(__dirname, '../..');
const appFile = path.join(repoRoot, 'src/app.js');

function appRouter(appInstance) {
  return appInstance._router.stack.find((layer) => (
    layer.handle
    && Array.isArray(layer.handle.stack)
    && layer.name === 'router'
  )).handle;
}

function mountedCustomerAccessRoute(appInstance) {
  return appRouter(appInstance).stack.find((layer) => (
    layer.route
    && layer.route.path === CUSTOMER_ACCESS_ROUTE_PATH
    && layer.route.methods.get === true
  ));
}

function mountedCustomerAccessRoutes(appInstance) {
  return appRouter(appInstance).stack.filter((layer) => (
    layer.route
    && layer.route.methods.get === true
    && String(layer.route.path).startsWith('/customer-access/')
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

function createSyntheticRequest(overrides) {
  const caseId = (overrides && overrides.caseId) || 'case_app_factory_001';

  return {
    params: {
      caseId,
    },
    customerAccessContextInput: {
      organizationId: 'org_app_factory_001',
      caseId,
      customerId: 'customer_app_factory_001',
      rawPhone: 'raw_phone_should_not_leak',
      rawAddress: 'raw_address_should_not_leak',
      rawLineUserId: 'line_user_should_not_leak',
      ...(overrides || {}),
    },
  };
}

function invokeCustomerAccessRoute(appInstance, requestOverrides) {
  const route = mountedCustomerAccessRoute(appInstance);
  const req = createSyntheticRequest(requestOverrides);
  const res = createSyntheticRes();
  let body;

  assert.ok(route, 'customer access route should be mounted');

  for (const layer of route.route.stack) {
    let nextCalled = false;
    const result = layer.handle(req, res, () => {
      nextCalled = true;
    });

    if (res.calls.json.length > 0) {
      body = result;
      break;
    }

    if (!nextCalled) {
      break;
    }
  }

  return {
    body,
    req,
    res,
    route,
  };
}

function validRows() {
  return {
    caseRow: {
      id: 'case_app_factory_001',
      organization_id: 'org_app_factory_001',
      customer_id: 'customer_app_factory_001',
    },
    customerIdentityRow: {
      customer_id: 'customer_app_factory_001',
      organization_id: 'org_app_factory_001',
      verified: true,
      line_channel_id: 'line_channel_app_factory_001',
      line_user_id: 'line_user_should_not_leak',
      raw_phone: 'raw_phone_should_not_leak',
    },
    publicationRow: {
      case_id: 'case_app_factory_001',
      organization_id: 'org_app_factory_001',
      publication_allowed: true,
      customer_visible_policy_passed: true,
    },
    serviceReportRow: {
      public_report_id: 'report_public_app_factory_001',
      status: 'available',
      final_appointment_id: 'appt_should_not_be_in_response',
      internal_note: 'internal_note_should_not_leak',
      audit_log: 'audit_log_should_not_leak',
      ai_raw_payload: 'ai_raw_payload_should_not_leak',
      token: 'token_should_not_leak',
      secret: 'secret_should_not_leak',
    },
  };
}

function createSyntheticDbClient(calls) {
  const safeCalls = Array.isArray(calls) ? calls : [];
  const rows = validRows();

  return {
    query(sql, params) {
      safeCalls.push({ sql, params });

      if (sql.includes('from cases')) {
        return { rows: [rows.caseRow] };
      }
      if (sql.includes('from customer_channel_identities')) {
        return { rows: [rows.customerIdentityRow] };
      }
      if (sql.includes('from customer_access_publications')) {
        return { rows: [rows.publicationRow] };
      }
      if (sql.includes('from customer_visible_service_reports')) {
        return { rows: [rows.serviceReportRow] };
      }

      return { rows: [] };
    },
  };
}

function assertNoLeak(body) {
  const serialized = JSON.stringify(body);

  for (const value of [
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
    'internal_db_error_should_not_leak',
    'internal_note_should_not_leak',
    'audit_log_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'appt_should_not_be_in_response',
    'finalAppointmentId',
    'final_appointment_id',
  ]) {
    assert.equal(serialized.includes(value), false, `app response leaked ${value}`);
  }
}

function assertAllow(result) {
  assert.deepEqual(result.res.calls.status, [200]);
  assert.equal(result.body.status, 'allow');
  assert.equal(result.body.messageKey, 'customerAccess.available');
  assert.equal(result.body.customerVisible, true);
  assert.deepEqual(result.body.data, {
    serviceReport: {
      publicReportId: 'report_public_app_factory_001',
      status: 'available',
    },
  });
  assertNoLeak(result.body);
}

function assertSafeDeny(result) {
  assert.deepEqual(result.res.calls.status, [404]);
  assert.equal(result.body.status, 'deny');
  assert.equal(result.body.messageKey, 'customerAccess.unavailable');
  assert.equal(result.body.customerVisible, false);
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

test('src/app.js still exports default app', () => {
  assert.equal(typeof app, 'function');
  assert.equal(typeof app.listen, 'function');
});

test('src/app.js exports createApp', () => {
  assert.equal(typeof createApp, 'function');
});

test('default app preserves no-options customer access safe-deny behavior', () => {
  assertSafeDeny(invokeCustomerAccessRoute(app));
});

test('createApp({ customerAccess: { dbClient } }) creates app with customer access route', () => {
  const appInstance = createApp({
    customerAccess: {
      dbClient: createSyntheticDbClient(),
    },
  });
  const route = mountedCustomerAccessRoute(appInstance);

  assert.ok(route, 'customer access route should be mounted');
  assert.equal(route.route.path, CUSTOMER_ACCESS_ROUTE_PATH);
  assert.equal(route.route.methods.get, true);
});

test('createApp({ customerAccess: { dbClient } }) exposes only accepted customer access public routes', () => {
  const appInstance = createApp({
    customerAccess: {
      dbClient: createSyntheticDbClient(),
    },
  });

  assert.deepEqual(mountedCustomerAccessRoutes(appInstance).map((layer) => layer.route.path), [
    CUSTOMER_ACCESS_ROUTE_PATH,
    CUSTOMER_ACCESS_REPORT_ROUTE_PATH,
  ]);
  assert.equal(
    mountedCustomerAccessRoutes(appInstance).some((layer) => (
      String(layer.route.path).includes('/__internal/customer-access')
    )),
    false,
  );
});

test('app factory creation with dbClient does not call dbClient', () => {
  const calls = [];

  createApp({
    customerAccess: {
      dbClient: createSyntheticDbClient(calls),
    },
  });

  assert.deepEqual(calls, []);
});

test('factory-created app with all-allow dbClient rows returns HTTP 200 allow envelope', () => {
  const calls = [];
  const appInstance = createApp({
    customerAccess: {
      dbClient: createSyntheticDbClient(calls),
    },
  });
  const result = invokeCustomerAccessRoute(appInstance);

  assertAllow(result);
  assert.equal(calls.length > 0, true);
});

test('dbClient throw during request returns generic safe-deny 404 without raw error leak', () => {
  const appInstance = createApp({
    customerAccess: {
      dbClient: {
        query() {
          throw new Error('internal_db_error_should_not_leak');
        },
      },
    },
  });

  assertSafeDeny(invokeCustomerAccessRoute(appInstance));
});

test('app.js does not import real DB, transaction, repository, external provider, or AI runtime', () => {
  const source = fs.readFileSync(appFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.equal(specifiers.includes('./db/pool'), false);
  assert.equal(specifiers.includes('./db/transaction'), false);
  assert.equal(specifiers.some((specifier) => /repositories?/i.test(specifier)), false);
  assert.equal(specifiers.some((specifier) => /lineProvider|sms|email|push|ai|rag|vector/i.test(specifier)), false);
  assert.doesNotMatch(source, /transaction|begin|commit|rollback/i);
});

test('app.js does not import server bootstrap or call app.listen', () => {
  const source = fs.readFileSync(appFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.equal(specifiers.includes('./server'), false);
  assert.doesNotMatch(source, /\.listen\(/);
});
