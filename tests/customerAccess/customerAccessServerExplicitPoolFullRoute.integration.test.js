'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Readable, Writable } = require('node:stream');
const test = require('node:test');

const {
  createServerBootstrap,
} = require('../../src/server');
const {
  handleCustomerServiceReportProjectionRequest,
} = require('../../src/customerAccess/customerServiceReportProjectionHandler');

const repoRoot = path.resolve(__dirname, '../..');
const serverFile = path.join(repoRoot, 'src/server.js');

function createRequest(pathname, method = 'GET') {
  const req = new Readable({
    read() {
      this.push(null);
    },
  });

  req.method = method;
  req.url = pathname;
  req.originalUrl = pathname;
  req.headers = {};
  req.connection = {};

  return req;
}

function createResponse() {
  const chunks = [];
  const headers = {};

  const res = new Writable({
    write(chunk, encoding, callback) {
      chunks.push(Buffer.from(chunk));
      callback();
    },
  });

  res.statusCode = 200;
  res.setHeader = (name, value) => {
    headers[name.toLowerCase()] = value;
  };
  res.getHeader = (name) => headers[name.toLowerCase()];
  res.removeHeader = (name) => {
    delete headers[name.toLowerCase()];
  };
  res.writeHead = (statusCode, headerValues) => {
    res.statusCode = statusCode;
    if (headerValues && typeof headerValues === 'object') {
      for (const [name, value] of Object.entries(headerValues)) {
        res.setHeader(name, value);
      }
    }
    return res;
  };
  res.end = (chunk, encoding, callback) => {
    if (chunk) {
      chunks.push(Buffer.from(chunk, encoding));
    }
    Writable.prototype.end.call(res, callback);
    return res;
  };
  res.bodyText = () => Buffer.concat(chunks).toString('utf8');
  res.bodyJson = () => JSON.parse(res.bodyText());

  return res;
}

function requestApp(app, pathname, options = {}) {
  return new Promise((resolve, reject) => {
    const req = createRequest(pathname, options.method || 'GET');
    const res = createResponse();

    res.on('finish', () => {
      try {
        resolve({
          body: res.bodyJson(),
          bodyText: res.bodyText(),
          statusCode: res.statusCode,
        });
      } catch (error) {
        reject(error);
      }
    });
    res.on('error', reject);
    app.handle(req, res);
  });
}

function enabledOptions(overrides = {}) {
  return {
    env: {
      CUSTOMER_ACCESS_ENABLED: 'true',
      CUSTOMER_ACCESS_READ_ONLY_ENABLED: 'true',
      CUSTOMER_ACCESS_DB_ENABLED: 'true',
      DATABASE_URL: 'postgres://db-url-should-not-leak',
      TOKEN: 'token_should_not_leak',
    },
    customerAccessDbClientConfig: {
      readOnly: true,
      connectionString: 'postgres://db-url-should-not-leak',
      token: 'token_should_not_leak',
      secret: 'secret_should_not_leak',
      password: 'password_should_not_leak',
    },
    customerAccess: {
      getInput() {
        return {
          organizationId: 'org_full_route_001',
          caseId: 'case_full_route_001',
          customerId: 'customer_full_route_001',
          rawPhone: 'raw_phone_should_not_leak',
          rawAddress: 'raw_address_should_not_leak',
          rawLineUserId: 'line_user_should_not_leak',
        };
      },
    },
    ...overrides,
  };
}

function allAllowRows() {
  return {
    caseRow: {
      id: 'case_full_route_001',
      organization_id: 'org_full_route_001',
      customer_id: 'customer_full_route_001',
    },
    customerIdentityRow: {
      customer_id: 'customer_full_route_001',
      organization_id: 'org_full_route_001',
      verified: true,
      line_channel_id: 'line_channel_full_route_001',
      line_user_id: 'line_user_should_not_leak',
      raw_phone: 'raw_phone_should_not_leak',
    },
    publicationRow: {
      case_id: 'case_full_route_001',
      organization_id: 'org_full_route_001',
      publication_allowed: true,
      customer_visible_policy_passed: true,
    },
    serviceReportRow: {
      organization_id: 'org_full_route_001',
      customer_id: 'customer_full_route_001',
      case_id: 'case_full_route_001',
      public_report_id: 'report_public_full_route_001',
      publication_allowed: true,
      customer_visible_policy_passed: true,
      publication_state: 'published',
      customer_visible: true,
      case_display_id: 'CASE-FULL-ROUTE-001',
      service_status_display: 'Completed',
      appointment_window: '2026-05-29 09:00-10:00',
      engineer_display_name: 'Engineer Full Route',
      service_summary: 'Customer-safe full route summary',
      completion_time: '2026-05-29T10:00:00.000Z',
      status: 'available',
      final_appointment_id: 'appt_should_not_be_in_response',
      internal_note: 'internal_note_should_not_leak',
      audit_log: 'audit_log_should_not_leak',
      ai_raw_payload: 'ai_raw_payload_should_not_leak',
      billing_internal_data: 'billing_internal_should_not_leak',
      settlement_internal_data: 'settlement_internal_should_not_leak',
      token: 'token_should_not_leak',
      secret: 'secret_should_not_leak',
    },
  };
}

function authorizedProjectionRequest() {
  return {
    params: {
      caseId: 'case_full_route_001',
      reportId: 'report_public_full_route_001',
    },
    customerAccessContext: {
      organizationId: 'org_full_route_001',
      customerId: 'customer_full_route_001',
      caseId: 'case_full_route_001',
      organizationScopeMatched: true,
      customerIdentityVerified: true,
      caseLinkedToCustomer: true,
      publication: {
        allowed: true,
        publicationState: 'published',
      },
      customerVisiblePolicyPassed: true,
      access: {
        organizationScopeMatched: true,
        caseLinkedToCustomer: true,
        publicationAllowed: true,
        customerVisiblePolicyPassed: true,
      },
      auth: {
        organizationId: 'org_full_route_001',
        customerId: 'customer_full_route_001',
        customerIdentityVerified: true,
      },
    },
  };
}

function createSyntheticPool(queryCalls, rowsOverride) {
  const safeCalls = Array.isArray(queryCalls) ? queryCalls : [];
  const rows = rowsOverride || allAllowRows();

  return {
    query(sql, params) {
      const sqlText = typeof sql === 'string' ? sql : sql && sql.text;
      const sqlParams = Array.isArray(params)
        ? params
        : (Array.isArray(sql && sql.values) ? sql.values : params);
      safeCalls.push({ sql: sqlText, params: sqlParams });

      if (sqlText.includes('from cases')) {
        return { rows: rows.caseRow ? [rows.caseRow] : [] };
      }
      if (sqlText.includes('from customer_channel_identities')) {
        return { rows: rows.customerIdentityRow ? [rows.customerIdentityRow] : [] };
      }
      if (sqlText.includes('from customer_access_publications')) {
        return { rows: rows.publicationRow ? [rows.publicationRow] : [] };
      }
      if (sqlText.includes('from customer_visible_service_reports')) {
        return { rows: rows.serviceReportRow ? [rows.serviceReportRow] : [] };
      }

      return { rows: [] };
    },
  };
}

function createAsyncSyntheticPool(queryCalls, rowsOverride) {
  const syntheticPool = createSyntheticPool(queryCalls, rowsOverride);

  return {
    query(sql, params) {
      return Promise.resolve(syntheticPool.query(sql, params));
    },
  };
}

function createMalformedResultPool(queryCalls) {
  const safeCalls = Array.isArray(queryCalls) ? queryCalls : [];

  return {
    query(sql, params) {
      safeCalls.push({ sql, params });
      return { row: { internal_note: 'internal_note_should_not_leak' } };
    },
  };
}

function createInjectedApp(calls) {
  const safeCalls = Array.isArray(calls) ? calls : [];

  return {
    handle() {
      safeCalls.push('handle');
    },
    listen(port) {
      safeCalls.push(['listen', port]);
      return {
        close(callback) {
          if (callback) {
            callback();
          }
        },
      };
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

function assertNoLeak(value) {
  const serialized = JSON.stringify(value);

  for (const unsafeValue of [
    'token_should_not_leak',
    'secret_should_not_leak',
    'password_should_not_leak',
    'postgres://db-url-should-not-leak',
    'connection_string_should_not_leak',
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
    'internal_pool_error_should_not_leak',
    'internal_note_should_not_leak',
    'audit_log_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'billing_internal_should_not_leak',
    'settlement_internal_should_not_leak',
    'appt_should_not_be_in_response',
    'finalAppointmentId',
    'final_appointment_id',
    'select ',
    'from cases',
  ]) {
    assert.equal(serialized.includes(unsafeValue), false, `leaked ${unsafeValue}`);
  }
}

test('server explicit pool all-allow rows return HTTP 200 allow envelope', async () => {
  const queryCalls = [];
  const bootstrap = createServerBootstrap(enabledOptions({
    customerAccessPool: createSyntheticPool(queryCalls),
  }));

  assert.deepEqual(queryCalls, []);

  const response = await requestApp(bootstrap.app, '/customer-access/case_full_route_001');

  assert.equal(queryCalls.length > 0, true);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'allow');
  assert.deepEqual(response.body.data, {
    serviceReport: {
      publicReportId: 'report_public_full_route_001',
      status: 'available',
    },
  });
  assertNoLeak(response.body);
});

test('server explicit async pool all-allow rows return HTTP 200 allow envelope', async () => {
  const queryCalls = [];
  const bootstrap = createServerBootstrap(enabledOptions({
    customerAccessPool: createAsyncSyntheticPool(queryCalls),
  }));

  assert.deepEqual(queryCalls, []);

  const response = await requestApp(bootstrap.app, '/customer-access/case_full_route_001');

  assert.equal(queryCalls.length > 0, true);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'allow');
  assert.deepEqual(response.body.data, {
    serviceReport: {
      publicReportId: 'report_public_full_route_001',
      status: 'available',
    },
  });
  assertNoLeak(response.body);
});

test('server explicit async pool service report full route passes allow context to projection', async () => {
  const queryCalls = [];
  const bootstrap = createServerBootstrap(enabledOptions({
    customerAccessPool: createAsyncSyntheticPool(queryCalls),
  }));

  const response = await requestApp(
    bootstrap.app,
    '/customer-access/case_full_route_001/service-report/report_public_full_route_001',
  );

  assert.equal(queryCalls.length > 0, true);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'allow');
  assert.equal(response.body.messageKey, 'customerAccess.serviceReport.available');
  assert.equal(response.body.customerVisible, true);
  assert.deepEqual(response.body.data, {
    serviceReport: {
      customerReportReference: 'report_public_full_route_001',
      caseReference: 'CASE-FULL-ROUTE-001',
      serviceStatus: 'Completed',
      appointmentWindow: '2026-05-29 09:00-10:00',
      engineerDisplayName: 'Engineer Full Route',
      serviceSummary: 'Customer-safe full route summary',
      completionTime: '2026-05-29T10:00:00.000Z',
    },
  });

  const directResponse = await handleCustomerServiceReportProjectionRequest({
    request: authorizedProjectionRequest(),
    dbClient: createAsyncSyntheticPool([]),
  });

  assert.equal(directResponse.statusCode, 200);
  assert.deepEqual(response.body, directResponse.body);
  assertNoLeak(response.body);
});

test('server explicit pool service report route rejects unsupported method without querying projection', async () => {
  const queryCalls = [];
  const bootstrap = createServerBootstrap(enabledOptions({
    customerAccessPool: createAsyncSyntheticPool(queryCalls),
  }));

  const response = await requestApp(
    bootstrap.app,
    '/customer-access/case_full_route_001/service-report/report_public_full_route_001',
    { method: 'POST' },
  );

  assert.deepEqual(queryCalls, []);
  assert.equal(response.statusCode, 404);
  assert.equal(response.body.error.code, 'NOT_FOUND');
  assert.match(response.body.error.message, /Route not found: POST/);
  assertNoLeak(response.body);
});

test('server explicit pool malformed service report path stays not-found without projection query', async () => {
  const queryCalls = [];
  const bootstrap = createServerBootstrap(enabledOptions({
    customerAccessPool: createAsyncSyntheticPool(queryCalls),
  }));

  const response = await requestApp(
    bootstrap.app,
    '/customer-access/case_full_route_001/service-report',
  );

  assert.deepEqual(queryCalls, []);
  assert.equal(response.statusCode, 404);
  assert.equal(response.body.error.code, 'NOT_FOUND');
  assert.match(response.body.error.message, /Route not found: GET/);
  assertNoLeak(response.body);
});

test('allow response strips internal report and sensitive fields', async () => {
  const bootstrap = createServerBootstrap(enabledOptions({
    customerAccessPool: createSyntheticPool([]),
  }));
  const response = await requestApp(bootstrap.app, '/customer-access/case_full_route_001');

  assert.equal(response.statusCode, 200);
  assertNoLeak(response.body);
});

test('readOnly false returns generic safe-deny 404 and pool is not queried', async () => {
  const queryCalls = [];
  const bootstrap = createServerBootstrap(enabledOptions({
    customerAccessPool: createSyntheticPool(queryCalls),
    customerAccessDbClientConfig: {
      readOnly: false,
      connectionString: 'postgres://db-url-should-not-leak',
    },
  }));
  const response = await requestApp(bootstrap.app, '/customer-access/case_full_route_001');

  assert.deepEqual(queryCalls, []);
  assert.equal(response.statusCode, 404);
  assert.equal(response.body.status, 'deny');
  assertNoLeak(response.body);
});

test('pool query throw returns generic safe-deny 404 without raw error leak', async () => {
  const bootstrap = createServerBootstrap(enabledOptions({
    customerAccessPool: {
      query() {
        throw new Error('internal_pool_error_should_not_leak postgres://db-url-should-not-leak token_should_not_leak');
      },
    },
  }));
  const response = await requestApp(bootstrap.app, '/customer-access/case_full_route_001');

  assert.equal(response.statusCode, 404);
  assert.equal(response.body.status, 'deny');
  assertNoLeak(response.body);
});

test('malformed pool result returns generic safe-deny 404', async () => {
  const queryCalls = [];
  const bootstrap = createServerBootstrap(enabledOptions({
    customerAccessPool: createMalformedResultPool(queryCalls),
  }));
  const response = await requestApp(bootstrap.app, '/customer-access/case_full_route_001');

  assert.equal(queryCalls.length > 0, true);
  assert.equal(response.statusCode, 404);
  assert.equal(response.body.status, 'deny');
  assertNoLeak(response.body);
});

test('env disabled with pool returns default safe-deny and pool is not queried', async () => {
  const queryCalls = [];
  const bootstrap = createServerBootstrap(enabledOptions({
    env: {
      CUSTOMER_ACCESS_ENABLED: 'false',
      CUSTOMER_ACCESS_DB_ENABLED: 'true',
    },
    customerAccessPool: createSyntheticPool(queryCalls),
  }));
  const response = await requestApp(bootstrap.app, '/customer-access/case_full_route_001');

  assert.deepEqual(queryCalls, []);
  assert.equal(response.statusCode, 404);
  assert.equal(response.body.status, 'deny');
  assertNoLeak(response.body);
});

test('options.app priority bypasses pool path', () => {
  const calls = [];
  const queryCalls = [];
  const injectedApp = createInjectedApp(calls);
  const bootstrap = createServerBootstrap(enabledOptions({
    app: injectedApp,
    customerAccessPool: createSyntheticPool(queryCalls),
  }));

  assert.equal(bootstrap.app, injectedApp);
  assert.deepEqual(calls, []);
  assert.deepEqual(queryCalls, []);
});

test('server import does not trigger listen during bootstrap creation', () => {
  const calls = [];
  const injectedApp = createInjectedApp(calls);

  createServerBootstrap(enabledOptions({
    app: injectedApp,
    customerAccessPool: createSyntheticPool([]),
    port: 4061,
  }));

  assert.deepEqual(calls, []);
});

test('server source does not directly import restricted DB adapter, repository, provider, or AI modules', () => {
  const source = fs.readFileSync(serverFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.equal(specifiers.includes('./customerAccess/customerAccessBootstrapComposer'), true);
  assert.equal(specifiers.includes('./customerAccess/customerAccessDbAdapter'), false);
  assert.equal(specifiers.includes('./customerAccess/customerAccessDbQueryExecutor'), false);
  assert.equal(specifiers.includes('./customerAccess/customerAccessReadOnlyRepository'), false);
  assert.equal(specifiers.includes('./customerAccess/customerAccessReadOnlyDbConnector'), false);
  assert.equal(specifiers.some((specifier) => /repositories?|transaction|provider|line|sms|email|push|ai|rag|vector/i.test(specifier)), false);
  assert.doesNotMatch(source, /new Pool|createCustomerAccessDbAdapter|createCustomerAccessDbQueryExecutor|createCustomerAccessReadOnlyRepository|createCustomerAccessReadOnlyDbConnector/i);
});

test('test file uses only synthetic sentinel strings and no real secrets', () => {
  const source = fs.readFileSync(__filename, 'utf8');

  assert.equal(source.includes(['process', 'env'].join('.') + '.'), false);
  assert.equal(source.includes(['npm', 'run', 'db:migrate'].join(' ')), false);
  assert.equal(source.includes(['p', 's', 'q', 'l'].join('')), false);
  assert.equal(source.includes(['line', 'channel', 'secret'].join('_')), false);
  assert.equal(source.includes(['access', 'token'].join('_')), false);
});
