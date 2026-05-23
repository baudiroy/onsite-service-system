'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Readable, Writable } = require('node:stream');
const test = require('node:test');

const {
  createServerBootstrap,
  resolveServerApp,
  startServer,
} = require('../../src/server');

const { app: defaultApp } = require('../../src/app');

const repoRoot = path.resolve(__dirname, '../..');
const serverFile = path.join(repoRoot, 'src/server.js');

function createSyntheticApp(calls) {
  const safeCalls = Array.isArray(calls) ? calls : [];

  return {
    listen(port, callback) {
      safeCalls.push({ event: 'listen', port });

      if (callback) {
        callback();
      }

      return {
        close(closeCallback) {
          safeCalls.push({ event: 'close' });

          if (closeCallback) {
            closeCallback();
          }
        },
      };
    },
  };
}

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

function validDbRows() {
  return {
    caseRow: {
      id: 'case_composer_001',
      organization_id: 'org_composer_001',
      customer_id: 'customer_composer_001',
    },
    customerIdentityRow: {
      customer_id: 'customer_composer_001',
      organization_id: 'org_composer_001',
      verified: true,
      line_channel_id: 'line_channel_composer_001',
      line_user_id: 'line_user_should_not_leak',
      raw_phone: 'raw_phone_should_not_leak',
    },
    publicationRow: {
      case_id: 'case_composer_001',
      organization_id: 'org_composer_001',
      publication_allowed: true,
      customer_visible_policy_passed: true,
    },
    serviceReportRow: {
      public_report_id: 'report_public_composer_001',
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

function createSyntheticDbClient(queryCalls, rowsOverride) {
  const safeCalls = Array.isArray(queryCalls) ? queryCalls : [];
  const rows = rowsOverride || validDbRows();

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

function createConnector(connectorCalls, dbClient) {
  const safeCalls = Array.isArray(connectorCalls) ? connectorCalls : [];

  return {
    createReadOnlyClient(config) {
      safeCalls.push(config);
      return dbClient || createSyntheticDbClient([]);
    },
  };
}

function customerAccessInput() {
  return {
    organizationId: 'org_composer_001',
    caseId: 'case_composer_001',
    customerId: 'customer_composer_001',
    rawPhone: 'raw_phone_should_not_leak',
    rawAddress: 'raw_address_should_not_leak',
    rawLineUserId: 'line_user_should_not_leak',
  };
}

function dbEnabledComposer(overrides = {}) {
  return {
    env: {
      CUSTOMER_ACCESS_ENABLED: 'true',
      CUSTOMER_ACCESS_DB_ENABLED: 'true',
    },
    dbClientConfig: {
      readOnly: true,
    },
    customerAccess: {
      getInput: customerAccessInput,
    },
    ...overrides,
  };
}

function createLogger(calls) {
  const safeCalls = Array.isArray(calls) ? calls : [];

  return {
    log(...args) {
      safeCalls.push(['log', ...args]);
    },
    error(...args) {
      safeCalls.push(['error', ...args]);
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
    'postgres://db-url-should-not-leak',
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
    'internal_db_error_should_not_leak',
    'internal_connector_error_should_not_leak',
    'internal_note_should_not_leak',
    'audit_log_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'appt_should_not_be_in_response',
    'select ',
    'from cases',
    'finalAppointmentId',
    'final_appointment_id',
  ]) {
    assert.equal(serialized.includes(unsafeValue), false, `leaked ${unsafeValue}`);
  }
}

test('options.app priority wins over customerAccessComposer', () => {
  const injectedApp = createSyntheticApp([]);
  const resolved = resolveServerApp({
    app: injectedApp,
    customerAccessComposer: {
      env: {
        CUSTOMER_ACCESS_ENABLED: 'true',
      },
    },
  });

  assert.equal(resolved, injectedApp);
});

test('explicit customerAccessBootstrap priority wins over customerAccessComposer', () => {
  const connectorCalls = [];
  const app = resolveServerApp({
    customerAccessBootstrap: {
      enabled: true,
      customerAccess: {
        dbAdapter: {},
      },
    },
    customerAccessComposer: dbEnabledComposer({
      connector: createConnector(connectorCalls),
    }),
  });

  assert.notEqual(app, defaultApp);
  assert.deepEqual(connectorCalls, []);
});

test('customerAccessComposer priority wins over options.env', () => {
  const connectorCalls = [];
  const app = resolveServerApp({
    customerAccessComposer: dbEnabledComposer({
      connector: createConnector(connectorCalls),
    }),
    env: {
      CUSTOMER_ACCESS_ENABLED: 'false',
    },
  });

  assert.notEqual(app, defaultApp);
  assert.equal(connectorCalls.length, 1);
});

test('missing composer or disabled composer uses default app', () => {
  assert.equal(resolveServerApp(), defaultApp);
  assert.equal(resolveServerApp({
    customerAccessComposer: {
      env: {
        CUSTOMER_ACCESS_ENABLED: 'false',
      },
    },
  }), defaultApp);
});

test('composer env enabled without DB flag creates customer-access-enabled safe-deny app without dbClient', async () => {
  const bootstrap = createServerBootstrap({
    customerAccessComposer: {
      env: {
        CUSTOMER_ACCESS_ENABLED: 'true',
      },
    },
  });
  const response = await requestApp(bootstrap.app, '/customer-access/case_composer_001');

  assert.notEqual(bootstrap.app, defaultApp);
  assert.equal(response.statusCode, 404);
  assert.equal(response.body.status, 'deny');
  assertNoLeak(response.body);
});

test('composer DB enabled with connector and readOnly config creates synthetic dbClient path', () => {
  const connectorCalls = [];
  const queryCalls = [];
  const bootstrap = createServerBootstrap({
    customerAccessComposer: dbEnabledComposer({
      connector: createConnector(connectorCalls, createSyntheticDbClient(queryCalls)),
    }),
  });

  assert.notEqual(bootstrap.app, defaultApp);
  assert.equal(connectorCalls.length, 1);
  assert.deepEqual(queryCalls, []);
});

test('request through composer-created app with synthetic rows returns allow envelope', async () => {
  const connectorCalls = [];
  const queryCalls = [];
  const bootstrap = createServerBootstrap({
    customerAccessComposer: dbEnabledComposer({
      connector: createConnector(connectorCalls, createSyntheticDbClient(queryCalls)),
    }),
  });
  const response = await requestApp(bootstrap.app, '/customer-access/case_composer_001');

  assert.equal(connectorCalls.length, 1);
  assert.equal(queryCalls.length > 0, true);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'allow');
  assert.deepEqual(response.body.data, {
    serviceReport: {
      publicReportId: 'report_public_composer_001',
      status: 'available',
    },
  });
  assertNoLeak(response.body);
});

test('connector throw path returns generic safe-deny app without raw error leak', async () => {
  const bootstrap = createServerBootstrap({
    customerAccessComposer: dbEnabledComposer({
      connector: {
        createReadOnlyClient() {
          throw new Error('internal_connector_error_should_not_leak');
        },
      },
    }),
  });
  const response = await requestApp(bootstrap.app, '/customer-access/case_composer_001');

  assert.equal(response.statusCode, 404);
  assert.equal(response.body.status, 'deny');
  assertNoLeak(response.body);
});

test('dbClient throw path returns generic safe-deny without raw error leak', async () => {
  const queryCalls = [];
  const bootstrap = createServerBootstrap({
    customerAccessComposer: dbEnabledComposer({
      connector: createConnector(queryCalls, {
        query() {
          throw new Error('internal_db_error_should_not_leak');
        },
      }),
    }),
  });
  const response = await requestApp(bootstrap.app, '/customer-access/case_composer_001');

  assert.equal(response.statusCode, 404);
  assert.equal(response.body.status, 'deny');
  assertNoLeak(response.body);
});

test('dbClientConfig readOnly false creates no dbClient and generic safe-deny', async () => {
  const connectorCalls = [];
  const bootstrap = createServerBootstrap({
    customerAccessComposer: dbEnabledComposer({
      connector: createConnector(connectorCalls),
      dbClientConfig: {
        readOnly: false,
      },
    }),
  });
  const response = await requestApp(bootstrap.app, '/customer-access/case_composer_001');

  assert.deepEqual(connectorCalls, []);
  assert.equal(response.statusCode, 404);
  assert.equal(response.body.status, 'deny');
});

test('malformed or sensitive composer config does not leak token, secret, or DB URL', async () => {
  const bootstrap = createServerBootstrap({
    customerAccessComposer: {
      env: {
        CUSTOMER_ACCESS_ENABLED: 'true',
        token: 'token_should_not_leak',
        secret: 'secret_should_not_leak',
        DATABASE_URL: 'postgres://db-url-should-not-leak',
        rawPhone: 'raw_phone_should_not_leak',
        rawAddress: 'raw_address_should_not_leak',
        rawLineUserId: 'line_user_should_not_leak',
      },
      dbClientConfig: {
        readOnly: true,
        connectionString: 'postgres://db-url-should-not-leak',
      },
    },
  });
  const response = await requestApp(bootstrap.app, '/customer-access/case_composer_001');

  assert.equal(response.statusCode, 404);
  assertNoLeak(response.body);
});

test('server module does not directly import DB adapter, query executor, or read-only repository', () => {
  const source = fs.readFileSync(serverFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.equal(specifiers.includes('./customerAccess/customerAccessBootstrapComposer'), true);
  assert.equal(specifiers.includes('./customerAccess/customerAccessDbAdapter'), false);
  assert.equal(specifiers.includes('./customerAccess/customerAccessDbQueryExecutor'), false);
  assert.equal(specifiers.includes('./customerAccess/customerAccessReadOnlyRepository'), false);
});

test('server module does not import real DB, transaction, repository, provider, or AI modules', () => {
  const source = fs.readFileSync(serverFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.equal(specifiers.some((specifier) => /repositories?|transaction|provider|line|sms|email|push|ai|rag|vector/i.test(specifier)), false);
  assert.doesNotMatch(source, /new Pool|createCustomerAccessDbAdapter|createCustomerAccessDbQueryExecutor|createCustomerAccessReadOnlyRepository/i);
});

test('startServer with composer and injected app uses injected app priority and listens only when explicit', () => {
  const listenCalls = [];
  const injectedApp = createSyntheticApp(listenCalls);
  const bootstrap = createServerBootstrap({
    app: injectedApp,
    customerAccessComposer: dbEnabledComposer({
      connector: createConnector([]),
    }),
    port: 4058,
  });

  assert.equal(bootstrap.app, injectedApp);
  assert.deepEqual(listenCalls, []);

  startServer({
    app: bootstrap.app,
    customerAccessComposer: dbEnabledComposer({
      connector: createConnector([]),
    }),
    port: bootstrap.port,
    logger: createLogger([]),
    pool: { end: async () => {} },
    registerSignals: false,
  });

  assert.deepEqual(listenCalls, [{ event: 'listen', port: 4058 }]);
});

test('direct-run behavior remains guarded by require.main === module', () => {
  const source = fs.readFileSync(serverFile, 'utf8');

  assert.match(source, /require\.main\s*===\s*module/);
  assert.match(source, /startServer\(\)/);
});
