'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { createAppRouter, router } = require('../../src/routes');

const repoRoot = path.resolve(__dirname, '../..');
const routeIndexFile = path.join(repoRoot, 'src/routes/index.js');

function mountedCustomerAccessRoute(appRouter) {
  return appRouter.stack.find((layer) => (
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

function createSyntheticRequest(overrides) {
  return {
    customerAccessContextInput: {
      organizationId: 'org_route_index_001',
      caseId: 'case_route_index_001',
      customerId: 'customer_route_index_001',
      rawPhone: 'raw_phone_should_not_leak',
      rawAddress: 'raw_address_should_not_leak',
      rawLineUserId: 'line_user_should_not_leak',
      ...(overrides || {}),
    },
  };
}

function invokeCustomerAccessRoute(appRouter, requestOverrides) {
  const route = mountedCustomerAccessRoute(appRouter);
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
      id: 'case_route_index_001',
      organization_id: 'org_route_index_001',
      customer_id: 'customer_route_index_001',
    },
    customerIdentityRow: {
      customer_id: 'customer_route_index_001',
      organization_id: 'org_route_index_001',
      verified: true,
      line_channel_id: 'line_channel_route_index_001',
      line_user_id: 'line_user_should_not_leak',
      raw_phone: 'raw_phone_should_not_leak',
    },
    publicationRow: {
      case_id: 'case_route_index_001',
      organization_id: 'org_route_index_001',
      publication_allowed: true,
      customer_visible_policy_passed: true,
    },
    serviceReportRow: {
      public_report_id: 'report_public_route_index_001',
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
    assert.equal(serialized.includes(value), false, `route response leaked ${value}`);
  }
}

function assertAllow(result) {
  assert.deepEqual(result.res.calls.status, [200]);
  assert.equal(result.body.status, 'allow');
  assert.equal(result.body.messageKey, 'customerAccess.available');
  assert.equal(result.body.customerVisible, true);
  assert.deepEqual(result.body.data, {
    serviceReport: {
      publicReportId: 'report_public_route_index_001',
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

test('src/routes/index.js still exports default router', () => {
  assert.equal(typeof router, 'function');
  assert.equal(Array.isArray(router.stack), true);
});

test('src/routes/index.js exports createAppRouter', () => {
  assert.equal(typeof createAppRouter, 'function');
});

test('default exported router preserves no-options safe-deny behavior', () => {
  assertSafeDeny(invokeCustomerAccessRoute(router));
});

test('createAppRouter({ customerAccess: { dbClient } }) mounts GET /customer-access/:caseId', () => {
  const appRouter = createAppRouter({
    customerAccess: {
      dbClient: createSyntheticDbClient(),
    },
  });
  const route = mountedCustomerAccessRoute(appRouter);

  assert.ok(route, 'customer access route should be mounted');
  assert.equal(route.route.path, '/customer-access/:caseId');
  assert.equal(route.route.methods.get, true);
});

test('factory creation with dbClient does not call dbClient', () => {
  const calls = [];

  createAppRouter({
    customerAccess: {
      dbClient: createSyntheticDbClient(calls),
    },
  });

  assert.deepEqual(calls, []);
});

test('factory-created router with all-allow dbClient rows returns HTTP 200 allow envelope', () => {
  const calls = [];
  const appRouter = createAppRouter({
    customerAccess: {
      dbClient: createSyntheticDbClient(calls),
    },
  });
  const result = invokeCustomerAccessRoute(appRouter);

  assertAllow(result);
  assert.equal(calls.length > 0, true);
});

test('dbClient throw during request returns generic safe-deny 404 without raw error leak', () => {
  const appRouter = createAppRouter({
    customerAccess: {
      dbClient: {
        query() {
          throw new Error('internal_db_error_should_not_leak');
        },
      },
    },
  });

  assertSafeDeny(invokeCustomerAccessRoute(appRouter));
});

test('route index does not import real DB, transaction, repository, provider, or RAG runtime', () => {
  const source = fs.readFileSync(routeIndexFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.ok(specifiers.includes('express'));
  assert.ok(specifiers.includes('./customerAccessRoutes'));
  assert.ok(specifiers.includes('../customerAccess/customerAccessRouteRegistry'));
  assert.equal(specifiers.includes('../customerAccess/customerAccessDbAdapter'), false);
  assert.equal(specifiers.some((specifier) => specifier.includes('/db')), false);
  assert.equal(specifiers.some((specifier) => /repositories?/i.test(specifier)), false);
  assert.equal(specifiers.some((specifier) => /provider|rag|vector/i.test(specifier)), false);
  assert.doesNotMatch(source, /transaction|begin|commit|rollback/i);
});

test('route index does not import server bootstrap or call app.listen', () => {
  const source = fs.readFileSync(routeIndexFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.equal(specifiers.includes('../server'), false);
  assert.equal(specifiers.includes('./server'), false);
  assert.equal(specifiers.includes('../app'), false);
  assert.equal(specifiers.includes('./app'), false);
  assert.doesNotMatch(source, /app\.listen|listen\(/);
  assert.equal(typeof router.listen, 'undefined');
});
