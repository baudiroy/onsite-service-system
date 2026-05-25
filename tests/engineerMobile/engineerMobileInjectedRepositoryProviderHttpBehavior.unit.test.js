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
const testFile = path.join(repoRoot, 'tests/engineerMobile/engineerMobileInjectedRepositoryProviderHttpBehavior.unit.test.js');

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
    audit_raw_payload: 'audit_raw_payload_should_not_leak',
    billing_internal_data: 'billing_internal_should_not_leak',
    credential: 'credential_should_not_leak',
    customer_case_data: 'customer_case_data_should_not_leak',
    field_service_report_id: 'fsr_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    final_appointment_id: 'final_appointment_should_not_leak',
    full_address: '台北市測試區測試路一段88號',
    full_customer_payload: 'full_customer_payload_should_not_leak',
    full_payload: 'full_payload_should_not_leak',
    full_phone: '0912-345-678',
    internal_note: 'internal_note_should_not_leak',
    line_access_token: 'line_access_token_should_not_leak',
    line_channel_secret: 'line_channel_secret_should_not_leak',
    provider_payload: 'provider_payload_should_not_leak',
    raw_line_user_id: 'line_user_should_not_leak',
    secret: 'secret_should_not_leak',
    settlement_internal_data: 'settlement_internal_should_not_leak',
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

function createFakeQueryClient(queryCalls, rows = engineerMobileReadModelRows) {
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
    'db url',
    'raw_line_user_id',
    'line_user_id',
    'line_access_token',
    'line_channel_secret',
    'full_customer_payload',
    'full_payload',
    'customer_case_data',
    'provider_payload',
    'field_service_report_id',
    'fieldServiceReportId',
    'service_report_id',
    'formal_report_id',
    'completion_report_id',
    'completionReportId',
    'finalAppointmentId',
    'final_appointment_id',
    'internal_note',
    'internalNote',
    'audit_raw_payload',
    'auditRawPayload',
    'ai_raw_payload',
    'aiRawPayload',
    'billing_internal',
    'settlement_internal',
    'token',
    'secret',
    'password',
    'credential',
    'stack',
    'sql',
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

test('unit test imports only app factory repository constants fixture stream and Node built-ins', () => {
  const source = fs.readFileSync(testFile, 'utf8');
  const operationalSource = source
    .split('\n')
    .filter((line) => (
      !line.includes('assert.doesNotMatch')
      && !line.includes('forbiddenRuntimePattern')
    ))
    .join('\n');
  const forbiddenRuntimePattern = new RegExp(`\\.listen\\(|${['create', 'Server'].join('')}|process\\.env`);
  const specifiers = requireSpecifiers(source);
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
  assert.doesNotMatch(operationalSource, forbiddenRuntimePattern);
});

test('HTTP-style task list reaches injected repository provider through fake dbClient only', async () => {
  const queryCalls = [];
  const app = createApp({
    engineerMobile: {
      dbClient: createFakeQueryClient(queryCalls),
      useRequestAwareProvider: true,
    },
  });

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

test('HTTP-style task detail reaches injected repository provider through fake transaction only', async () => {
  const queryCalls = [];
  const app = createApp({
    engineerMobile: {
      transaction: createFakeQueryClient(queryCalls),
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

test('HTTP-style wrong scope empty result thrown DB and malformed rows fail closed safely', async () => {
  const wrongScopeApp = createApp({
    engineerMobile: {
      dbClient: createFakeQueryClient([], engineerMobileReadModelRows),
      useRequestAwareProvider: true,
    },
  });
  const emptyApp = createApp({
    engineerMobile: {
      dbClient: createFakeQueryClient([], []),
      useRequestAwareProvider: true,
    },
  });
  const malformedApp = createApp({
    engineerMobile: {
      dbClient: createFakeQueryClient([], [{ organization_id: 'org_fixture_engineer_mobile' }]),
      useRequestAwareProvider: true,
    },
  });
  const throwingApp = createApp({
    engineerMobile: {
      dbClient: {
        async query() {
          throw new Error('select * from secrets token secret raw_line_user_id 0912-345-678 should not leak');
        },
      },
      useRequestAwareProvider: true,
    },
  });

  const responses = [
    await requestApp(wrongScopeApp, '/engineer-mobile/tasks?from=2026-05-21&to=2026-05-25', {
      engineerId: 'eng_other',
    }),
    await requestApp(wrongScopeApp, '/engineer-mobile/tasks/apt_fixture_multi_visit_002', {
      organizationId: 'org_other',
    }),
    await requestApp(emptyApp, '/engineer-mobile/tasks'),
    await requestApp(emptyApp, '/engineer-mobile/tasks/apt_fixture_multi_visit_002'),
    await requestApp(malformedApp, '/engineer-mobile/tasks'),
    await requestApp(malformedApp, '/engineer-mobile/tasks/apt_fixture_multi_visit_002'),
    await requestApp(throwingApp, '/engineer-mobile/tasks'),
    await requestApp(throwingApp, '/engineer-mobile/tasks/apt_fixture_multi_visit_002'),
  ];

  assert.equal(responses[0].statusCode, 200);
  assert.deepEqual(responses[0].body.tasks, []);
  assert.equal(responses[1].statusCode, 404);
  assert.equal(responses[1].body.detail, null);
  assert.equal(responses[2].statusCode, 200);
  assert.deepEqual(responses[2].body.tasks, []);
  assert.equal(responses[3].statusCode, 404);
  assert.equal(responses[3].body.detail, null);
  assert.equal(responses[4].statusCode, 200);
  assert.deepEqual(responses[4].body.tasks, []);
  assert.equal(responses[5].statusCode, 404);
  assert.equal(responses[5].body.detail, null);
  assert.equal(responses[6].statusCode, 200);
  assert.deepEqual(responses[6].body.tasks, []);
  assert.equal(responses[7].statusCode, 404);
  assert.equal(responses[7].body.detail, null);
  assertNoForbiddenOutput(responses.map((response) => response.body));
});

test('HTTP behavior preserves one formal report invariant while allowing multiple appointments', async () => {
  const app = createApp({
    engineerMobile: {
      dbClient: createFakeQueryClient([]),
      useRequestAwareProvider: true,
    },
  });

  const response = await requestApp(app, '/engineer-mobile/tasks?from=2026-05-21&to=2026-05-25');
  const multiVisitTasks = response.body.tasks.filter((task) => task.caseId === 'case_fixture_multi_visit_001');

  assert.equal(multiVisitTasks.length, 2);
  assert.equal(multiVisitTasks.some((task) => Object.hasOwn(task, 'fieldServiceReportId')), false);
  assert.equal(multiVisitTasks.some((task) => Object.hasOwn(task, 'finalAppointmentId')), false);
  assertNoForbiddenOutput(response.body);
});
