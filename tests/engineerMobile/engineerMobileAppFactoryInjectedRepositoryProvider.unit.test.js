'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Readable, Writable } = require('node:stream');
const test = require('node:test');

const {
  createApp,
} = require('../../src/app');
const {
  DETAIL_SQL,
  LIST_SQL,
} = require('../../src/engineerMobile/engineerMobileReadModelRepository');
const {
  engineerMobileReadModelRows,
} = require('./fixtures/engineerMobileReadModelRows.fixture');

const repoRoot = path.resolve(__dirname, '../..');
const composerFile = path.join(repoRoot, 'src/engineerMobile/engineerMobileReadProviderOptionsComposer.js');
const testFile = path.join(repoRoot, 'tests/engineerMobile/engineerMobileAppFactoryInjectedRepositoryProvider.unit.test.js');

function auth(overrides = {}) {
  return {
    engineerId: 'eng_fixture_primary',
    organizationId: 'org_fixture_engineer_mobile',
    permissions: ['engineer_mobile.tasks.read'],
    role: 'engineer',
    userId: 'user_fixture_engineer_mobile',
    ...overrides,
  };
}

function withUnsafeExtras(row = {}) {
  return {
    ...row,
    DATABASE_URL: 'postgres://user:pass@example.invalid/db',
    ai_raw_payload: 'ai_raw_payload_should_not_leak',
    audit_log: 'audit_log_should_not_leak',
    billing_internal: 'billing_internal_should_not_leak',
    credential: 'credential_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    final_appointment_id: 'final_appointment_should_not_leak',
    full_customer_payload: 'full_customer_payload_should_not_leak',
    full_payload: 'full_payload_should_not_leak',
    internal_note: 'internal_note_should_not_leak',
    raw_address: '台北市測試區測試路一段88號',
    raw_line_user_id: 'line_user_should_not_leak',
    raw_phone: '0912-345-678',
    secret: 'secret_should_not_leak',
    settlement_internal: 'settlement_internal_should_not_leak',
    token: 'token_should_not_leak',
  };
}

function createRequest(pathname, authOverrides) {
  let sent = false;
  const req = new Readable({
    read() {
      if (sent) {
        this.push(null);
        return;
      }

      sent = true;
      this.push(null);
    },
  });

  req.auth = auth(authOverrides || {});
  req.connection = {};
  req.headers = {};
  req.method = 'GET';
  req.originalUrl = pathname;
  req.url = pathname;

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

function requestApp(app, pathname, authOverrides) {
  return new Promise((resolve, reject) => {
    const req = createRequest(pathname, authOverrides);
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

function createFakeDbClient(queryCalls, rows = engineerMobileReadModelRows) {
  return {
    async query(sql, values) {
      queryCalls.push({ sql, values });

      return {
        rows: rows.map(withUnsafeExtras),
      };
    },
  };
}

function assertNoForbiddenOutput(value) {
  const serialized = JSON.stringify(value);
  const lower = serialized.toLowerCase();

  for (const forbidden of [
    'postgres://',
    'postgresql://',
    'database_url',
    'bearer ',
    'raw_line_user_id',
    'line_user_id',
    'full_customer_payload',
    'full_payload',
    'field_service_report_id',
    'fieldServiceReportId',
    'completion_report_id',
    'completionReportId',
    'finalAppointmentId',
    'final_appointment_id',
    'internal_note',
    'internalNote',
    'audit_log',
    'auditLog',
    'ai_raw_payload',
    'aiRawPayload',
    'billing_internal',
    'billingInternal',
    'settlement_internal',
    'settlementInternal',
    'token',
    'secret',
    'password',
    'credential',
    'stack',
    'select ',
  ]) {
    assert.equal(lower.includes(forbidden.toLowerCase()), false, `leaked ${forbidden}`);
  }

  assert.equal(/09\d{2}[-\s]?\d{3}[-\s]?\d{3}/.test(serialized), false);
  assert.equal(/台北市.+\d+號/.test(serialized), false);
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

test('unit test imports only app factory repository constants fixture and Node built-ins', () => {
  const specifiers = requireSpecifiers(fs.readFileSync(testFile, 'utf8'));
  const allowed = [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:stream',
    'node:test',
    '../../src/app',
    '../../src/engineerMobile/engineerMobileReadModelRepository',
    './fixtures/engineerMobileReadModelRows.fixture',
  ];

  assert.deepEqual(specifiers.sort(), allowed.sort());
  assert.equal(
    specifiers.some((specifier) => /pool|server|migration|psql|openai|rag|vector|smoke|browser|lineProvider|sms|email|push/i.test(specifier)),
    false,
  );
  assert.doesNotMatch(fs.readFileSync(testFile, 'utf8'), /\.listen\(/);
});

test('default request-aware app factory without injected DB remains unchanged and does not query', async () => {
  const app = createApp({
    engineerMobile: {
      useRequestAwareProvider: true,
    },
  });
  const response = await requestApp(app, '/engineer-mobile/tasks?from=2026-05-21&to=2026-05-25');

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, {
    status: 'allow',
    tasks: [],
  });
  assertNoForbiddenOutput(response.body);
});

test('app factory nested dbClient option reaches injected repository for task list and keeps API shape', async () => {
  const queryCalls = [];
  const app = createApp({
    engineerMobile: {
      dbClient: createFakeDbClient(queryCalls),
      useRequestAwareProvider: true,
    },
  });

  assert.deepEqual(queryCalls, []);

  const response = await requestApp(app, '/engineer-mobile/tasks?from=2026-05-21&to=2026-05-25');

  assert.equal(response.statusCode, 200);
  assert.deepEqual(Object.keys(response.body).sort(), ['status', 'tasks']);
  assert.equal(response.body.status, 'allow');
  assert.deepEqual(response.body.tasks.map((task) => task.appointmentId), [
    'apt_fixture_multi_visit_001',
    'apt_fixture_multi_visit_002',
    'apt_fixture_note_exclusion_001',
  ]);
  assert.deepEqual(queryCalls, [{
    sql: LIST_SQL,
    values: [
      'org_fixture_engineer_mobile',
      'eng_fixture_primary',
      '2026-05-21',
      '2026-05-25',
    ],
  }]);
  assertNoForbiddenOutput(response.body);
});

test('app factory nested dbClient option reaches injected repository for task detail and keeps API shape', async () => {
  const queryCalls = [];
  const app = createApp({
    engineerMobile: {
      dbClient: createFakeDbClient(queryCalls),
      useRequestAwareProvider: true,
    },
  });
  const response = await requestApp(app, '/engineer-mobile/tasks/apt_fixture_multi_visit_002');

  assert.equal(response.statusCode, 200);
  assert.deepEqual(Object.keys(response.body).sort(), ['detail', 'status']);
  assert.equal(response.body.status, 'allow');
  assert.equal(response.body.detail.appointmentId, 'apt_fixture_multi_visit_002');
  assert.equal(response.body.detail.caseId, 'case_fixture_multi_visit_001');
  assert.deepEqual(queryCalls, [{
    sql: DETAIL_SQL,
    values: [
      'org_fixture_engineer_mobile',
      'eng_fixture_primary',
      'apt_fixture_multi_visit_002',
    ],
  }]);
  assertNoForbiddenOutput(response.body);
});

test('app factory nested transaction option can provide read-model rows without real DB', async () => {
  const queryCalls = [];
  const app = createApp({
    engineerMobile: {
      transaction: createFakeDbClient(queryCalls),
      useRequestAwareProvider: true,
    },
  });
  const response = await requestApp(app, '/engineer-mobile/tasks/apt_fixture_multi_visit_001');

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'allow');
  assert.equal(response.body.detail.appointmentId, 'apt_fixture_multi_visit_001');
  assert.equal(queryCalls.length, 1);
  assert.equal(queryCalls[0].sql, DETAIL_SQL);
  assertNoForbiddenOutput(response.body);
});

test('injected repository path fails closed for DB throw malformed and wrong scope without raw leak', async () => {
  const throwingApp = createApp({
    engineerMobile: {
      dbClient: {
        async query() {
          throw new Error('db timeout token secret raw_phone select * should not leak');
        },
      },
      useRequestAwareProvider: true,
    },
  });
  const malformedApp = createApp({
    engineerMobile: {
      dbClient: createFakeDbClient([], [{
        organization_id: 'org_fixture_engineer_mobile',
      }]),
      useRequestAwareProvider: true,
    },
  });
  const wrongScopeApp = createApp({
    engineerMobile: {
      dbClient: createFakeDbClient([], engineerMobileReadModelRows),
      useRequestAwareProvider: true,
    },
  });

  const throwingList = await requestApp(throwingApp, '/engineer-mobile/tasks');
  const throwingDetail = await requestApp(throwingApp, '/engineer-mobile/tasks/apt_fixture_multi_visit_002');
  const malformedList = await requestApp(malformedApp, '/engineer-mobile/tasks');
  const malformedDetail = await requestApp(malformedApp, '/engineer-mobile/tasks/apt_fixture_multi_visit_002');
  const wrongScopeList = await requestApp(wrongScopeApp, '/engineer-mobile/tasks', {
    organizationId: 'org_other',
  });
  const wrongScopeDetail = await requestApp(wrongScopeApp, '/engineer-mobile/tasks/apt_fixture_multi_visit_002', {
    engineerId: 'eng_other',
  });

  assert.equal(throwingList.statusCode, 200);
  assert.deepEqual(throwingList.body.tasks, []);
  assert.equal(throwingDetail.statusCode, 404);
  assert.deepEqual(throwingDetail.body.detail, null);
  assert.equal(malformedList.statusCode, 200);
  assert.deepEqual(malformedList.body.tasks, []);
  assert.equal(malformedDetail.statusCode, 404);
  assert.deepEqual(malformedDetail.body.detail, null);
  assert.equal(wrongScopeList.statusCode, 200);
  assert.deepEqual(wrongScopeList.body.tasks, []);
  assert.equal(wrongScopeDetail.statusCode, 404);
  assert.deepEqual(wrongScopeDetail.body.detail, null);
  assertNoForbiddenOutput([
    throwingList.body,
    throwingDetail.body,
    malformedList.body,
    malformedDetail.body,
    wrongScopeList.body,
    wrongScopeDetail.body,
  ]);
});

test('composer source creates injected repository only from explicit dbClient or transaction boundary', () => {
  const source = fs.readFileSync(composerFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, ['./engineerMobileReadRepository']);
  assert.match(source, /function hasInjectedQueryBoundary\(options\)/);
  assert.match(source, /hasOwnOption\(options, 'dbClient'\)/);
  assert.match(source, /hasOwnOption\(options, 'transaction'\)/);
  assert.match(source, /module\['require'\]\('\.\/engineerMobileReadModelRepository'\)/);
  assert.match(source, /createEngineerMobileReadModelRepository\(\{/);
  assert.doesNotMatch(source, /process\.env/);
  assert.doesNotMatch(source, /app\.listen|server\.listen|createServer/);
  assert.doesNotMatch(source, /require\(['"].*(?:pg|database|pool|config|routes?|controllers?|server|provider|webhook|sms|line|openai|rag|billing|entitlement)['"]\)/i);
  assert.doesNotMatch(source, /submitCompletion|createReport|updateReport|mutateFinalAppointmentId|sendProviderMessage|dispatchPush/i);
});
