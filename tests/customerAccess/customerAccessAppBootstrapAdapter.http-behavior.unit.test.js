'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const { Readable, Writable } = require('node:stream');
const test = require('node:test');

const {
  createCustomerAccessEnabledApp,
} = require('../../src/customerAccess/customerAccessAppBootstrapAdapter');

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
          headers: res.headers,
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
      id: 'case_http_behavior_001',
      organization_id: 'org_http_behavior_001',
      customer_id: 'customer_http_behavior_001',
    },
    customerIdentityRow: {
      customer_id: 'customer_http_behavior_001',
      organization_id: 'org_http_behavior_001',
      verified: true,
      line_channel_id: 'line_channel_http_behavior_001',
      line_user_id: 'line_user_should_not_leak',
      raw_phone: 'raw_phone_should_not_leak',
    },
    publicationRow: {
      case_id: 'case_http_behavior_001',
      organization_id: 'org_http_behavior_001',
      publication_allowed: true,
      customer_visible_policy_passed: true,
    },
    serviceReportRow: {
      public_report_id: 'report_public_http_behavior_001',
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
    organizationId: 'org_http_behavior_001',
    caseId: 'case_http_behavior_001',
    customerId: 'customer_http_behavior_001',
    rawPhone: 'raw_phone_should_not_leak',
    rawAddress: 'raw_address_should_not_leak',
    rawLineUserId: 'line_user_should_not_leak',
  };
}

function assertNoLeak(response) {
  const serialized = JSON.stringify(response);

  for (const value of [
    'select ',
    'from cases',
    'org_http_behavior_001',
    'customer_http_behavior_001',
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
    'internal_note_should_not_leak',
    'audit_log_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'appt_should_not_be_in_response',
    'finalAppointmentId',
    'final_appointment_id',
  ]) {
    assert.equal(serialized.includes(value), false, `HTTP response leaked ${value}`);
  }
}

test('createCustomerAccessEnabledApp({ dbClient }) returns app-like object and does not call listen or dbClient', () => {
  const calls = [];
  const app = createCustomerAccessEnabledApp({
    dbClient: createSyntheticDbClient(calls),
  });

  assert.equal(typeof app, 'function');
  assert.equal(typeof app.handle, 'function');
  assert.equal(typeof app.listen, 'function');
  assert.deepEqual(calls, []);
});

test('HTTP request through injected synthetic dbClient returns allow envelope without leaking internal data', async () => {
  const calls = [];
  let listenCallCount = 0;
  const app = createCustomerAccessEnabledApp({
    dbClient: createSyntheticDbClient(calls),
    customerAccess: {
      getInput: customerAccessInput,
    },
  });
  const originalListen = app.listen.bind(app);

  app.listen = (...args) => {
    listenCallCount += 1;
    return originalListen(...args);
  };

  const response = await requestApp(app, '/customer-access/case_http_behavior_001');

  assert.equal(listenCallCount, 0);
  assert.equal(calls.length > 0, true);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'allow');
  assert.deepEqual(response.body.data, {
    serviceReport: {
      publicReportId: 'report_public_http_behavior_001',
      status: 'available',
    },
  });
  assertNoLeak(response.body);
});

test('HTTP request with empty synthetic dbClient rows remains generic safe-deny', async () => {
  const calls = [];
  const app = createCustomerAccessEnabledApp({
    dbClient: createSyntheticDbClient(calls, {}),
    customerAccess: {
      getInput: customerAccessInput,
    },
  });
  const response = await requestApp(app, '/customer-access/case_http_behavior_001');

  assert.equal(calls.length > 0, true);
  assert.equal(response.statusCode, 404);
  assert.equal(response.body.status, 'deny');
  assert.equal(response.body.messageKey, 'customerAccess.unavailable');
  assert.equal(response.body.data, null);
  assertNoLeak(response.body);
});

test('HTTP request with throwing synthetic dbClient remains generic safe-deny', async () => {
  const calls = [];
  const app = createCustomerAccessEnabledApp({
    dbClient: {
      query(sql, params) {
        calls.push({ sql, params });
        throw new Error('internal_db_error_should_not_leak');
      },
    },
    customerAccess: {
      getInput: customerAccessInput,
    },
  });
  const response = await requestApp(app, '/customer-access/case_http_behavior_001');

  assert.equal(calls.length > 0, true);
  assert.equal(response.statusCode, 404);
  assert.equal(response.body.status, 'deny');
  assertNoLeak(response.body);
});

test('test uses no shared DB, DATABASE_URL, provider sending, AI, RAG, or vector DB', () => {
  const source = fs.readFileSync(__filename, 'utf8');
  const requireSpecifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    requireSpecifiers.push(match[1]);
  }

  assert.deepEqual(requireSpecifiers, [
    'node:assert/strict',
    'node:fs',
    'node:stream',
    'node:test',
    '../../src/customerAccess/customerAccessAppBootstrapAdapter',
  ]);
  assert.doesNotMatch(source, /process\.env\.DATABASE_URL/);
});
