'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Readable, Writable } = require('node:stream');
const test = require('node:test');

const {
  createServerBootstrap,
} = require('../../src/server');

const repoRoot = path.resolve(__dirname, '../..');
const serverFile = path.join(repoRoot, 'src/server.js');

function createRequest(pathname) {
  const req = new Readable({
    read() {
      this.push(null);
    },
  });

  req.method = 'GET';
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

function requestApp(app, pathname) {
  return new Promise((resolve, reject) => {
    const req = createRequest(pathname);
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

function allAllowRows() {
  return {
    caseRow: {
      id: 'case_full_composition_001',
      organization_id: 'org_full_composition_001',
      customer_id: 'customer_full_composition_001',
    },
    customerIdentityRow: {
      customer_id: 'customer_full_composition_001',
      organization_id: 'org_full_composition_001',
      verified: true,
      line_channel_id: 'line_channel_full_composition_001',
      line_user_id: 'line_user_should_not_leak',
      raw_phone: 'raw_phone_should_not_leak',
    },
    publicationRow: {
      case_id: 'case_full_composition_001',
      organization_id: 'org_full_composition_001',
      publication_allowed: true,
      customer_visible_policy_passed: true,
    },
    serviceReportRow: {
      public_report_id: 'report_public_full_composition_001',
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

function createSyntheticDbClient(queryCalls, rowsOverride) {
  const safeCalls = Array.isArray(queryCalls) ? queryCalls : [];
  const rows = rowsOverride || allAllowRows();

  return {
    query(sql, params) {
      safeCalls.push({ sql, params });

      if (sql.includes('from cases')) {
        return { rows: rows.caseRow ? [rows.caseRow] : [] };
      }
      if (sql.includes('from customer_channel_identities')) {
        return { rows: rows.customerIdentityRow ? [rows.customerIdentityRow] : [] };
      }
      if (sql.includes('from customer_access_publications')) {
        return { rows: rows.publicationRow ? [rows.publicationRow] : [] };
      }
      if (sql.includes('from customer_visible_service_reports')) {
        return { rows: rows.serviceReportRow ? [rows.serviceReportRow] : [] };
      }

      return { rows: [] };
    },
  };
}

function createSyntheticConnector(connectorCalls, dbClient) {
  const safeCalls = Array.isArray(connectorCalls) ? connectorCalls : [];

  return {
    createReadOnlyClient(config) {
      safeCalls.push(config);
      return dbClient || createSyntheticDbClient([]);
    },
  };
}

function composerInput(overrides = {}) {
  return {
    env: {
      CUSTOMER_ACCESS_ENABLED: 'true',
      CUSTOMER_ACCESS_READ_ONLY_ENABLED: 'true',
      CUSTOMER_ACCESS_DB_ENABLED: 'true',
      DATABASE_URL: 'postgres://db-url-should-not-leak',
      TOKEN: 'token_should_not_leak',
    },
    dbClientConfig: {
      readOnly: true,
      connectionString: 'postgres://db-url-should-not-leak',
      password: 'password_should_not_leak',
    },
    customerAccess: {
      getInput() {
        return {
          organizationId: 'org_full_composition_001',
          caseId: 'case_full_composition_001',
          customerId: 'customer_full_composition_001',
          rawPhone: 'raw_phone_should_not_leak',
          rawAddress: 'raw_address_should_not_leak',
          rawLineUserId: 'line_user_should_not_leak',
        };
      },
    },
    ...overrides,
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
    'internal_note_should_not_leak',
    'audit_log_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'billing_internal_should_not_leak',
    'settlement_internal_should_not_leak',
    'internal_db_error_should_not_leak',
    'internal_connector_error_should_not_leak',
    'appt_should_not_be_in_response',
    'finalAppointmentId',
    'final_appointment_id',
    'select ',
    'from cases',
  ]) {
    assert.equal(serialized.includes(unsafeValue), false, `leaked ${unsafeValue}`);
  }
}

test('full all-allow synthetic connector path returns HTTP 200 allow envelope', async () => {
  const connectorCalls = [];
  const queryCalls = [];
  const app = createServerBootstrap({
    customerAccessComposer: composerInput({
      connector: createSyntheticConnector(connectorCalls, createSyntheticDbClient(queryCalls)),
    }),
  }).app;

  assert.equal(connectorCalls.length, 1);
  assert.deepEqual(queryCalls, []);

  const response = await requestApp(app, '/customer-access/case_full_composition_001');

  assert.equal(queryCalls.length > 0, true);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'allow');
  assert.deepEqual(response.body.data, {
    serviceReport: {
      publicReportId: 'report_public_full_composition_001',
      status: 'available',
    },
  });
  assertNoLeak(response.body);
});

test('readOnly false results in generic safe-deny 404', async () => {
  const connectorCalls = [];
  const app = createServerBootstrap({
    customerAccessComposer: composerInput({
      connector: createSyntheticConnector(connectorCalls),
      dbClientConfig: {
        readOnly: false,
        connectionString: 'postgres://db-url-should-not-leak',
      },
    }),
  }).app;
  const response = await requestApp(app, '/customer-access/case_full_composition_001');

  assert.deepEqual(connectorCalls, []);
  assert.equal(response.statusCode, 404);
  assert.equal(response.body.status, 'deny');
  assertNoLeak(response.body);
});

test('connector throw results in generic safe-deny 404 without raw error leak', async () => {
  const app = createServerBootstrap({
    customerAccessComposer: composerInput({
      connector: {
        createReadOnlyClient() {
          throw new Error('internal_connector_error_should_not_leak');
        },
      },
    }),
  }).app;
  const response = await requestApp(app, '/customer-access/case_full_composition_001');

  assert.equal(response.statusCode, 404);
  assert.equal(response.body.status, 'deny');
  assertNoLeak(response.body);
});

test('dbClient query throw results in generic safe-deny 404 without raw error leak', async () => {
  const app = createServerBootstrap({
    customerAccessComposer: composerInput({
      connector: createSyntheticConnector([], {
        query() {
          throw new Error('internal_db_error_should_not_leak');
        },
      }),
    }),
  }).app;
  const response = await requestApp(app, '/customer-access/case_full_composition_001');

  assert.equal(response.statusCode, 404);
  assert.equal(response.body.status, 'deny');
  assertNoLeak(response.body);
});

test('env disabled results in default generic safe-deny behavior', async () => {
  const app = createServerBootstrap({
    customerAccessComposer: {
      env: {
        CUSTOMER_ACCESS_ENABLED: 'false',
      },
    },
  }).app;
  const response = await requestApp(app, '/customer-access/case_full_composition_001');

  assert.equal(response.statusCode, 404);
  assert.equal(response.body.status, 'deny');
  assertNoLeak(response.body);
});

test('options.app injected priority wins and bypasses composer', () => {
  const calls = [];
  const injectedApp = createInjectedApp(calls);
  const app = createServerBootstrap({
    app: injectedApp,
    customerAccessComposer: composerInput({
      connector: createSyntheticConnector([]),
    }),
  }).app;

  assert.equal(app, injectedApp);
  assert.deepEqual(calls, []);
});

test('direct-run listen is not triggered during test import', () => {
  const calls = [];
  const injectedApp = createInjectedApp(calls);

  createServerBootstrap({ app: injectedApp, port: 4059 });

  assert.deepEqual(calls, []);
});

test('server bootstrap source does not import restricted runtime modules directly', () => {
  const source = fs.readFileSync(serverFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.equal(specifiers.includes('./customerAccess/customerAccessBootstrapComposer'), true);
  assert.equal(specifiers.includes('./customerAccess/customerAccessDbAdapter'), false);
  assert.equal(specifiers.includes('./customerAccess/customerAccessDbQueryExecutor'), false);
  assert.equal(specifiers.includes('./customerAccess/customerAccessReadOnlyRepository'), false);
  assert.equal(specifiers.some((specifier) => /repositories?|transaction|provider|line|sms|email|push|ai|rag|vector/i.test(specifier)), false);
  assert.doesNotMatch(source, /new Pool|createCustomerAccessDbAdapter|createCustomerAccessDbQueryExecutor|createCustomerAccessReadOnlyRepository/i);
});

test('test file uses only synthetic sentinel strings and no real secrets', () => {
  const source = fs.readFileSync(__filename, 'utf8');

  assert.equal(source.includes(['process', 'env'].join('.') + '.'), false);
  assert.equal(source.includes(['npm', 'run', 'db:migrate'].join(' ')), false);
  assert.equal(source.includes(['p', 's', 'q', 'l'].join('')), false);
  assert.equal(source.includes(['line', 'channel', 'secret'].join('_')), false);
  assert.equal(source.includes(['access', 'token'].join('_')), false);
});
