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
          headers,
          statusCode: res.statusCode,
        });
      } catch (error) {
        reject(error);
      }
    });
    res.on('error', reject);
    app.handle(req, res);
  });

  function headers() {
    return {};
  }
}

function validDbRows() {
  return {
    caseRow: {
      id: 'case_server_wiring_001',
      organization_id: 'org_server_wiring_001',
      customer_id: 'customer_server_wiring_001',
    },
    customerIdentityRow: {
      customer_id: 'customer_server_wiring_001',
      organization_id: 'org_server_wiring_001',
      verified: true,
      line_channel_id: 'line_channel_server_wiring_001',
      line_user_id: 'line_user_should_not_leak',
      raw_phone: 'raw_phone_should_not_leak',
    },
    publicationRow: {
      case_id: 'case_server_wiring_001',
      organization_id: 'org_server_wiring_001',
      publication_allowed: true,
      customer_visible_policy_passed: true,
    },
    serviceReportRow: {
      public_report_id: 'report_public_server_wiring_001',
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

function createSyntheticDbClient(calls, rowsOverride) {
  const safeCalls = Array.isArray(calls) ? calls : [];
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

function customerAccessInput() {
  return {
    organizationId: 'org_server_wiring_001',
    caseId: 'case_server_wiring_001',
    customerId: 'customer_server_wiring_001',
    rawPhone: 'raw_phone_should_not_leak',
    rawAddress: 'raw_address_should_not_leak',
    rawLineUserId: 'line_user_should_not_leak',
  };
}

function assertNoLeak(value) {
  const serialized = JSON.stringify(value);

  for (const unsafeValue of [
    'select ',
    'from cases',
    'org_server_wiring_001',
    'customer_server_wiring_001',
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
    'internal_note_should_not_leak',
    'audit_log_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'postgres://db-url-should-not-leak',
    'appt_should_not_be_in_response',
    'finalAppointmentId',
    'final_appointment_id',
  ]) {
    assert.equal(serialized.includes(unsafeValue), false, `leaked ${unsafeValue}`);
  }
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

test('options.app priority wins over customerAccessBootstrap', () => {
  const injectedApp = createSyntheticApp([]);
  const resolvedApp = resolveServerApp({
    app: injectedApp,
    customerAccessBootstrap: {
      enabled: true,
      dbClient: createSyntheticDbClient([]),
    },
  });

  assert.equal(resolvedApp, injectedApp);
});

test('missing customerAccessBootstrap uses default app', () => {
  assert.equal(resolveServerApp(), defaultApp);
});

test('disabled customerAccessBootstrap uses default app', () => {
  assert.equal(resolveServerApp({
    customerAccessBootstrap: {
      enabled: false,
      dbClient: createSyntheticDbClient([]),
    },
  }), defaultApp);
});

test('enabled customerAccessBootstrap with dbClient creates customer-access-enabled app path', () => {
  const dbCalls = [];
  const bootstrap = createServerBootstrap({
    customerAccessBootstrap: {
      enabled: true,
      dbClient: createSyntheticDbClient(dbCalls),
      customerAccess: {
        getInput: customerAccessInput,
      },
    },
  });

  assert.notEqual(bootstrap.app, defaultApp);
  assert.equal(typeof bootstrap.app.handle, 'function');
  assert.deepEqual(dbCalls, []);
});

test('server bootstrap creation with dbClient does not call dbClient', () => {
  const dbCalls = [];

  createServerBootstrap({
    customerAccessBootstrap: {
      enabled: true,
      dbClient: createSyntheticDbClient(dbCalls),
    },
  });

  assert.deepEqual(dbCalls, []);
});

test('enabled customerAccessBootstrap can serve customer access allow envelope without network listen', async () => {
  const dbCalls = [];
  const bootstrap = createServerBootstrap({
    customerAccessBootstrap: {
      enabled: true,
      dbClient: createSyntheticDbClient(dbCalls),
      customerAccess: {
        getInput: customerAccessInput,
      },
    },
  });
  const response = await requestApp(bootstrap.app, '/customer-access/case_server_wiring_001');

  assert.equal(dbCalls.length > 0, true);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'allow');
  assert.deepEqual(response.body.data, {
    serviceReport: {
      publicReportId: 'report_public_server_wiring_001',
      status: 'available',
    },
  });
  assertNoLeak(response.body);
});

test('dbClient throw during request returns generic safe-deny without raw error leak', async () => {
  const dbCalls = [];
  const bootstrap = createServerBootstrap({
    customerAccessBootstrap: {
      enabled: true,
      dbClient: {
        query(sql, params) {
          dbCalls.push({ sql, params });
          throw new Error('internal_db_error_should_not_leak');
        },
      },
      customerAccess: {
        getInput: customerAccessInput,
      },
    },
  });
  const response = await requestApp(bootstrap.app, '/customer-access/case_server_wiring_001');

  assert.equal(dbCalls.length > 0, true);
  assert.equal(response.statusCode, 404);
  assert.equal(response.body.status, 'deny');
  assert.equal(response.body.messageKey, 'customerAccess.unavailable');
  assertNoLeak(response.body);
});

test('malformed or sensitive bootstrap config does not leak token, secret, or DB URL', () => {
  const loggerCalls = [];
  const bootstrap = createServerBootstrap({
    customerAccessBootstrap: {
      enabled: true,
      token: 'token_should_not_leak',
      secret: 'secret_should_not_leak',
      databaseUrl: 'postgres://db-url-should-not-leak',
      customerAccess: 'postgres://db-url-should-not-leak',
    },
    logger: createLogger(loggerCalls),
  });

  assert.equal(bootstrap.app, defaultApp);
  assertNoLeak(bootstrap);
  assertNoLeak(loggerCalls);
});

test('direct-run behavior remains guarded by require.main === module', () => {
  const source = fs.readFileSync(serverFile, 'utf8');

  assert.match(source, /require\.main\s*===\s*module/);
  assert.match(source, /startServer\(\)/);
});

test('server module does not directly import restricted customer access DB or provider modules', () => {
  const source = fs.readFileSync(serverFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.equal(specifiers.includes('./customerAccess/customerAccessServerBootstrapPlan'), true);
  assert.equal(specifiers.includes('./customerAccess/customerAccessAppBootstrapAdapter'), true);
  assert.equal(specifiers.includes('./customerAccess/customerAccessDbAdapter'), false);
  assert.equal(specifiers.includes('./customerAccess/customerAccessDbQueryExecutor'), false);
  assert.equal(specifiers.includes('./customerAccess/customerAccessReadOnlyRepository'), false);
  assert.equal(specifiers.some((specifier) => /repositories?|transaction|provider|line|sms|email|push|ai|rag|vector/i.test(specifier)), false);
  assert.doesNotMatch(source, /new Pool|createCustomerAccessDbAdapter|createCustomerAccessDbQueryExecutor|createCustomerAccessReadOnlyRepository/i);
});

test('startServer does not listen until called explicitly and then calls listen exactly once', () => {
  const listenCalls = [];
  const app = createSyntheticApp(listenCalls);
  const bootstrap = createServerBootstrap({ app, port: 4056 });

  assert.deepEqual(listenCalls, []);

  startServer({
    app: bootstrap.app,
    port: bootstrap.port,
    logger: createLogger([]),
    pool: { end: async () => {} },
    registerSignals: false,
  });

  assert.deepEqual(listenCalls, [{ event: 'listen', port: 4056 }]);
});
