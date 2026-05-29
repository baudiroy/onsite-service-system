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

function registeredRoute(options) {
  const router = createSyntheticRouter();
  registerCustomerAccessRoutes(router, options);
  return router.routes[0];
}

function invokeRoute(options, inputOverrides) {
  const route = registeredRoute(options);
  const res = createSyntheticRes();
  const req = {
    customerAccessContextInput: {
      organizationId: 'org_route_adapter_001',
      caseId: 'case_route_adapter_001',
      customerId: 'customer_route_adapter_001',
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

function allowRepository() {
  return {
    getOrganizationScope() {
      return {
        available: true,
        matched: true,
        organizationId: 'org_route_adapter_001',
      };
    },
    getVerifiedCustomerIdentity() {
      return {
        available: true,
        verified: true,
        customerId: 'customer_route_adapter_001',
      };
    },
    getCaseLinkage() {
      return {
        available: true,
        linked: true,
        caseId: 'case_route_adapter_001',
      };
    },
    getPublicationState() {
      return {
        available: true,
        allowed: true,
        customerVisiblePolicyPassed: true,
      };
    },
    getCustomerVisibleProjection() {
      return {
        available: true,
        data: {
          serviceReport: {
            publicReportId: 'report_public_route_adapter_001',
            status: 'available',
          },
        },
      };
    },
  };
}

function validRows(overrides) {
  const config = overrides || {};

  return {
    caseRow: {
      id: 'case_route_adapter_001',
      organization_id: 'org_route_adapter_001',
      customer_id: 'customer_route_adapter_001',
      ...(config.caseRow || {}),
    },
    customerIdentityRow: {
      customer_id: 'customer_route_adapter_001',
      organization_id: 'org_route_adapter_001',
      verified: true,
      line_channel_id: 'line_channel_route_adapter_001',
      line_user_id: 'line_user_should_not_leak',
      raw_phone: 'raw_phone_should_not_leak',
      ...(config.customerIdentityRow || {}),
    },
    publicationRow: {
      case_id: 'case_route_adapter_001',
      organization_id: 'org_route_adapter_001',
      publication_allowed: true,
      customer_visible_policy_passed: true,
      ...(config.publicationRow || {}),
    },
    serviceReportRow: {
      public_report_id: 'report_public_route_adapter_001',
      status: 'available',
      final_appointment_id: 'appt_should_not_be_in_response',
      internal_note: 'internal_note_should_not_leak',
      audit_log: 'audit_log_should_not_leak',
      ai_raw_payload: 'ai_raw_payload_should_not_leak',
      token: 'token_should_not_leak',
      secret: 'secret_should_not_leak',
      ...(config.serviceReportRow || {}),
    },
  };
}

function createSyntheticDbClient(calls) {
  const safeCalls = Array.isArray(calls) ? calls : [];

  return {
    query(sql, params) {
      safeCalls.push({ sql, params });

      if (sql.includes('from cases')) {
        return { rows: [validRows().caseRow] };
      }
      if (sql.includes('from customer_channel_identities')) {
        return { rows: [validRows().customerIdentityRow] };
      }
      if (sql.includes('from customer_access_publications')) {
        return { rows: [validRows().publicationRow] };
      }
      if (sql.includes('from customer_visible_service_reports')) {
        return { rows: [validRows().serviceReportRow] };
      }

      return { rows: [] };
    },
  };
}

function assertAllow(result) {
  assert.equal(result.nextCallCount, 1);
  assert.deepEqual(result.res.calls.status, [200]);
  assert.equal(result.body.status, 'allow');
  assert.equal(result.body.messageKey, 'customerAccess.available');
  assert.deepEqual(result.body.data, {
    serviceReport: {
      publicReportId: 'report_public_route_adapter_001',
      status: 'available',
    },
  });
  assertNoLeak(result.body);
}

function assertSafeDeny(result) {
  assert.deepEqual(result.res.calls.status, [404]);
  assert.equal(result.body.status, 'deny');
  assert.equal(result.body.messageKey, 'customerAccess.unavailable');
  assert.equal(result.body.data, null);
  assertNoLeak(result.body);
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
  ]) {
    assert.equal(serialized.includes(value), false, `route response leaked ${value}`);
  }
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

test('no options preserves existing safe-deny behavior', () => {
  assertSafeDeny(invokeRoute());
});

test('options.dbAdapter.repository all-allow returns HTTP 200 allow envelope', () => {
  assertAllow(invokeRoute({
    dbAdapter: {
      repository: allowRepository(),
    },
  }));
});

test('options.dbAdapter.queryExecutor all-allow synthetic rows returns HTTP 200 allow envelope', () => {
  assertAllow(invokeRoute({
    dbAdapter: {
      queryExecutor() {
        return validRows();
      },
    },
  }));
});

test('options.dbClient creates adapter path and all-allow synthetic rows return HTTP 200 allow envelope', () => {
  assertAllow(invokeRoute({
    dbClient: createSyntheticDbClient(),
  }));
});

test('route registration with dbClient does not call dbClient at registration time', () => {
  let callCount = 0;
  const router = createSyntheticRouter();

  registerCustomerAccessRoutes(router, {
    dbClient: {
      query() {
        callCount += 1;
        return { rows: [] };
      },
    },
  });

  assert.equal(router.routes.length, 2);
  assert.equal(callCount, 0);
});

test('dbClient throw during handler execution returns generic safe-deny 404 without raw error leak', () => {
  assertSafeDeny(invokeRoute({
    dbClient: {
      query() {
        throw new Error('internal_db_error_should_not_leak');
      },
    },
  }));
});

test('malformed dbAdapter returns generic safe-deny 404', () => {
  assertSafeDeny(invokeRoute({
    dbAdapter: {
      repository: {
        notARepository: true,
      },
    },
  }));
});

test('options.repository takes priority over dbAdapter and dbClient', () => {
  assertAllow(invokeRoute({
    repository: allowRepository(),
    dbAdapter: {
      repository: {
        getOrganizationScope() {
          throw new Error('internal_db_error_should_not_leak');
        },
      },
    },
    dbClient: {
      query() {
        throw new Error('internal_db_error_should_not_leak');
      },
    },
  }));
});

test('forbidden/internal fields are stripped and finalAppointmentId is not modified', () => {
  const result = invokeRoute({
    dbClient: createSyntheticDbClient(),
  });
  const serialized = JSON.stringify(result.body);

  assert.equal(serialized.includes('finalAppointmentId'), false);
  assert.equal(serialized.includes('final_appointment_id'), false);
  assertNoLeak(result.body);
});

test('route module imports DB adapter but no real DB, transaction, existing repositories, provider, or AI', () => {
  const source = fs.readFileSync(
    path.join(repoRoot, 'src/routes/customerAccessRoutes.js'),
    'utf8',
  );

  assert.deepEqual(requireSpecifiers(source), [
    '../customerAccess/customerAccessDbAdapter',
    '../customerAccess/customerAccessContextMiddleware',
    '../controllers/customerAccessController',
    '../customerAccess/customerServiceReportProjectionHandler',
    '../customerAccess/customerServiceReportAuditBoundary',
  ]);
  assert.doesNotMatch(source, /pg|pool|transaction|begin|commit|rollback/i);
  assert.doesNotMatch(source, /\.\.\/services(?:\/|')|\/repositories?\/|src\/db/i);
});

test('route path remains /customer-access/:caseId', () => {
  const route = registeredRoute({
    dbAdapter: {
      repository: allowRepository(),
    },
  });

  assert.equal(route.method, 'GET');
  assert.equal(route.path, '/customer-access/:caseId');
});
