'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createCustomerAccessDbQueryExecutor,
} = require('../../src/customerAccess/customerAccessDbQueryExecutor');
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

function rowForKey(key, overrides) {
  const config = overrides || {};
  const rows = {
    case: {
      id: 'case_db_route_001',
      organization_id: 'org_db_route_001',
      customer_id: 'customer_db_route_001',
      ...(config.case || {}),
    },
    customerIdentity: {
      customer_id: 'customer_db_route_001',
      organization_id: 'org_db_route_001',
      verified: true,
      line_channel_id: 'line_channel_db_route_001',
      line_user_id: 'line_user_should_not_leak',
      raw_phone: 'raw_phone_should_not_leak',
      ...(config.customerIdentity || {}),
    },
    publication: {
      case_id: 'case_db_route_001',
      organization_id: 'org_db_route_001',
      publication_allowed: true,
      customer_visible_policy_passed: true,
      secret: 'secret_should_not_leak',
      ...(config.publication || {}),
    },
    serviceReport: {
      public_report_id: 'report_public_db_route_001',
      status: 'available',
      final_appointment_id: 'appt_should_not_be_in_response',
      internal_note: 'internal_note_should_not_leak',
      audit_log: 'audit_log_should_not_leak',
      ai_raw_payload: 'ai_raw_payload_should_not_leak',
      billing_internal_data: 'billing_internal_data_should_not_leak',
      settlement_internal_data: 'settlement_internal_data_should_not_leak',
      token: 'token_should_not_leak',
      ...(config.serviceReport || {}),
    },
  };

  return rows[key];
}

function createSyntheticDbClient(overrides) {
  const config = overrides || {};

  return {
    query(sql) {
      if (config.throwOnQuery) {
        throw new Error('internal_db_error_should_not_leak');
      }

      const statementKey = config.sqlToKey[sql];
      const row = config.rowsByKey[statementKey];

      return row ? { rows: [row] } : { rows: [] };
    },
  };
}

function createDbClientForRows(rowOverrides) {
  const sqlToKey = {};
  const rowsByKey = {
    case: rowForKey('case', rowOverrides),
    customerIdentity: rowForKey('customerIdentity', rowOverrides),
    publication: rowForKey('publication', rowOverrides),
    serviceReport: rowForKey('serviceReport', rowOverrides),
  };

  if (rowOverrides && Object.prototype.hasOwnProperty.call(rowOverrides, 'serviceReport')
    && rowOverrides.serviceReport === undefined) {
    delete rowsByKey.serviceReport;
  }

  return {
    buildQueryExecutor() {
      const queryExecutor = createCustomerAccessDbQueryExecutor({
        dbClient: createSyntheticDbClient({
          sqlToKey,
          rowsByKey,
        }),
      });

      return function routeQueryExecutor(querySpec) {
        for (const statement of querySpec.statements || []) {
          sqlToKey[statement.sql] = statement.key;
        }

        return queryExecutor(querySpec);
      };
    },
  };
}

function registeredRoute(queryExecutor) {
  const router = createSyntheticRouter();
  registerCustomerAccessRoutes(router, { queryExecutor });
  return router.routes[0];
}

function invokeRoute(queryExecutor, inputOverrides) {
  const route = registeredRoute(queryExecutor);
  const res = createSyntheticRes();
  const req = {
    customerAccessContextInput: {
      organizationId: 'org_db_route_001',
      caseId: 'case_db_route_001',
      customerId: 'customer_db_route_001',
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

function invokeWithRows(rowOverrides, inputOverrides) {
  const factory = createDbClientForRows(rowOverrides);
  return invokeRoute(factory.buildQueryExecutor(), inputOverrides);
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
    'billing_internal_data_should_not_leak',
    'settlement_internal_data_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
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

test('route with DB executor registers GET /customer-access/:caseId', () => {
  const route = registeredRoute(createDbClientForRows().buildQueryExecutor());

  assert.equal(route.method, 'GET');
  assert.equal(route.path, '/customer-access/:caseId');
  assert.equal(route.handlers.length, 2);
});

test('all-allow synthetic DB rows return HTTP 200 allow envelope', () => {
  const result = invokeWithRows();

  assert.equal(result.nextCallCount, 1);
  assert.deepEqual(result.res.calls.status, [200]);
  assert.equal(result.body.status, 'allow');
  assert.equal(result.body.messageKey, 'customerAccess.available');
  assert.deepEqual(result.body.data, {
    serviceReport: {
      publicReportId: 'report_public_db_route_001',
      status: 'available',
    },
  });
  assertNoLeak(result.body);
});

test('organization mismatch rows return generic safe-deny 404', () => {
  assertSafeDeny(invokeWithRows({
    publication: {
      organization_id: 'org_other_001',
    },
  }));
});

test('customer mismatch rows return generic safe-deny 404', () => {
  assertSafeDeny(invokeWithRows({
    customerIdentity: {
      customer_id: 'customer_other_001',
    },
  }));
});

test('unverified identity rows return generic safe-deny 404', () => {
  assertSafeDeny(invokeWithRows({
    customerIdentity: {
      verified: false,
    },
  }));
});

test('publication denied rows return generic safe-deny 404', () => {
  assertSafeDeny(invokeWithRows({
    publication: {
      publication_allowed: false,
    },
  }));
});

test('projection missing rows return generic safe-deny 404', () => {
  assertSafeDeny(invokeWithRows({
    serviceReport: undefined,
  }));
});

test('dbClient throw returns generic safe-deny 404 without raw error leak', () => {
  const queryExecutor = createCustomerAccessDbQueryExecutor({
    dbClient: {
      query() {
        throw new Error('internal_db_error_should_not_leak');
      },
    },
  });

  assertSafeDeny(invokeRoute(queryExecutor));
});

test('finalAppointmentId is not included or modified in DB executor route response', () => {
  const result = invokeWithRows();
  const serialized = JSON.stringify(result.body);

  assert.equal(serialized.includes('finalAppointmentId'), false);
  assert.equal(serialized.includes('final_appointment_id'), false);
  assertNoLeak(result.body);
});

test('missing required input params return generic safe-deny without DB execution', () => {
  let callCount = 0;
  const queryExecutor = createCustomerAccessDbQueryExecutor({
    dbClient: {
      query() {
        callCount += 1;
        return { rows: [rowForKey('case')] };
      },
    },
  });

  assertSafeDeny(invokeRoute(queryExecutor, { customerId: '' }));
  assert.equal(callCount, 0);
});

test('route and executor imports do not include server bootstrap, real DB, provider, or AI modules', () => {
  const routeSource = fs.readFileSync(
    path.join(repoRoot, 'src/routes/customerAccessRoutes.js'),
    'utf8',
  );
  const executorSource = fs.readFileSync(
    path.join(repoRoot, 'src/customerAccess/customerAccessDbQueryExecutor.js'),
    'utf8',
  );

  assert.deepEqual(requireSpecifiers(routeSource), [
    '../customerAccess/customerAccessDbAdapter',
    '../customerAccess/customerAccessContextMiddleware',
    '../controllers/customerAccessController',
  ]);
  assert.deepEqual(requireSpecifiers(executorSource), []);
  assert.doesNotMatch(`${routeSource}\n${executorSource}`, /pg|pool|transaction|begin|commit|rollback/i);
});
