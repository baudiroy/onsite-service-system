'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Readable, Writable } = require('node:stream');
const test = require('node:test');

const { createApp } = require('../../src/app');
const {
  evaluateEngineerMobilePermissionAssignment,
} = require('../../src/engineerMobile/engineerMobilePermissionAssignmentGuard');

const repoRoot = path.resolve(__dirname, '../..');
const testFile = path.join(
  repoRoot,
  'tests/engineerMobile/engineerMobilePermissionGuardHttpBehavior.unit.test.js',
);

function auth(overrides = {}) {
  return {
    engineerId: 'eng_guard_http_001',
    organizationId: 'org_guard_http_001',
    permissions: ['engineer_mobile.tasks.read.assigned'],
    role: 'engineer',
    userId: 'user_guard_http_001',
    ...overrides,
  };
}

function task(overrides = {}) {
  return {
    addressSummary: '新北市新店區',
    aiRawPayload: 'ai_raw_payload_should_not_leak',
    appointmentId: 'apt_guard_http_001',
    assignedEngineerId: 'eng_guard_http_001',
    auditRawPayload: 'audit_raw_payload_should_not_leak',
    billingInternal: 'billing_internal_should_not_leak',
    caseId: 'case_guard_http_001',
    customerNameMasked: '林○○',
    customerPhoneMasked: '09xx-xxx-765',
    DATABASE_URL: 'DATABASE_URL_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    fieldServiceReportId: 'fsr_should_not_leak',
    fullAddress: 'full_address_should_not_leak',
    fullPayload: 'full_payload_should_not_leak',
    internalNote: 'internal_note_should_not_leak',
    issueSummary: '異音',
    organizationId: 'org_guard_http_001',
    productSummary: '冷氣',
    rawLineUserId: 'line_user_should_not_leak',
    rawPhone: 'raw_phone_should_not_leak',
    reportId: 'report_should_not_leak',
    scheduledEnd: '2026-05-21T10:00:00+08:00',
    scheduledStart: '2026-05-21T09:00:00+08:00',
    secret: 'secret_should_not_leak',
    serviceType: 'repair',
    settlementInternal: 'settlement_internal_should_not_leak',
    siteNoteSafe: '請先聯絡管理室',
    sql: 'SQL_should_not_leak',
    stack: 'stack_should_not_leak',
    status: 'confirmed',
    token: 'token_should_not_leak',
    ...overrides,
  };
}

function createRequest(pathname, authOverrides = {}) {
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

  if (authOverrides !== undefined) {
    req.auth = auth(authOverrides);
  }

  req.body = {
    DATABASE_URL: 'DATABASE_URL_should_not_leak',
    rawLineUserId: 'line_user_should_not_leak',
    rawPhone: 'raw_phone_should_not_leak',
    secret: 'secret_should_not_leak',
    token: 'token_should_not_leak',
  };
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

function requestApp(app, pathname, authOverrides = {}) {
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

function createGuardedApp(options = {}) {
  const sourceTasks = Array.isArray(options.tasks) ? options.tasks : [task()];

  return createApp({
    engineerMobile: {
      permissionAssignmentContext: auth(),
      permissionAssignmentGuard: evaluateEngineerMobilePermissionAssignment,
      permissionAssignmentGuardEnabled: true,
      repository: {
        getReadModel() {
          return { tasks: sourceTasks };
        },
      },
      useRequestAwareProvider: true,
      ...options.engineerMobile,
    },
  });
}

function assertNoForbiddenOutput(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'AI raw payload',
    'DATABASE_URL_should_not_leak',
    'SQL_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'audit_raw_payload_should_not_leak',
    'billing_internal_should_not_leak',
    'final_appointment_should_not_leak',
    'fsr_should_not_leak',
    'full_address_should_not_leak',
    'full_payload_should_not_leak',
    'internal_note_should_not_leak',
    'line_user_should_not_leak',
    'raw_phone_should_not_leak',
    'report_should_not_leak',
    'secret_should_not_leak',
    'settlement_internal_should_not_leak',
    'stack_should_not_leak',
    'token_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }

  assert.equal(serialized.includes('"finalAppointmentId"'), false);
  assert.equal(serialized.includes('"fieldServiceReportId"'), false);
  assert.equal(serialized.includes('"fullAddress"'), false);
  assert.equal(serialized.includes('"fullPayload"'), false);
  assert.equal(serialized.includes('"rawLineUserId"'), false);
  assert.equal(serialized.includes('"rawPhone"'), false);
  assert.equal(serialized.includes('"reportId"'), false);
}

test('guarded HTTP-style list allows assigned engineer and keeps existing response shape', async () => {
  const response = await requestApp(
    createGuardedApp({
      tasks: [
        task({ appointmentId: 'apt_guard_http_002', scheduledStart: '2026-05-21T11:00:00+08:00' }),
        task(),
      ],
    }),
    '/engineer-mobile/tasks?from=2026-05-21&to=2026-05-21',
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(Object.keys(response.body).sort(), ['status', 'tasks']);
  assert.equal(response.body.status, 'allow');
  assert.deepEqual(response.body.tasks.map((entry) => entry.appointmentId), [
    'apt_guard_http_001',
    'apt_guard_http_002',
  ]);
  assertNoForbiddenOutput(response.body);
});

test('guarded HTTP-style detail allows assigned engineer and keeps existing response shape', async () => {
  const response = await requestApp(
    createGuardedApp(),
    '/engineer-mobile/tasks/apt_guard_http_001',
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(Object.keys(response.body).sort(), ['detail', 'status']);
  assert.equal(response.body.status, 'allow');
  assert.equal(response.body.detail.caseId, 'case_guard_http_001');
  assertNoForbiddenOutput(response.body);
});

test('guarded HTTP-style list denies unassigned synthetic context safely', async () => {
  const response = await requestApp(
    createGuardedApp({
      engineerMobile: {
        permissionAssignmentContext: auth({
          engineerId: 'eng_guard_http_other',
          userId: 'user_guard_http_other',
        }),
      },
    }),
    '/engineer-mobile/tasks?from=2026-05-21&to=2026-05-21',
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'allow');
  assert.deepEqual(response.body.tasks, []);
  assertNoForbiddenOutput(response.body);
});

test('guarded HTTP-style detail denies cross-organization synthetic context safely', async () => {
  const response = await requestApp(
    createGuardedApp({
      engineerMobile: {
        permissionAssignmentContext: auth({ organizationId: 'org_guard_http_other' }),
      },
    }),
    '/engineer-mobile/tasks/apt_guard_http_001',
  );

  assert.equal(response.statusCode, 404);
  assert.equal(response.body.status, 'deny');
  assert.equal(response.body.detail, null);
  assertNoForbiddenOutput(response.body);
});

test('missing auth unknown role and missing permission fail closed before leaking data', async () => {
  const app = createGuardedApp({
    engineerMobile: {
      permissionAssignmentContext: undefined,
    },
  });
  const cases = [
    [undefined, 404],
    [{ role: 'customer_service' }, 403],
    [{ permissions: ['cases.read'] }, 403],
  ];

  for (const [authOverrides, expectedStatus] of cases) {
    const response = await requestApp(
      app,
      '/engineer-mobile/tasks/apt_guard_http_001',
      authOverrides,
    );

    assert.equal(response.statusCode, expectedStatus);
    assert.equal(response.body.status, 'deny');
    assertNoForbiddenOutput(response.body);
  }
});

test('guard disabled HTTP-style behavior remains backward compatible', async () => {
  const response = await requestApp(
    createApp({
      engineerMobile: {
        repository: {
          getReadModel() {
            return { tasks: [task()] };
          },
        },
        useRequestAwareProvider: true,
      },
    }),
    '/engineer-mobile/tasks?from=2026-05-21&to=2026-05-21',
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(Object.keys(response.body).sort(), ['status', 'tasks']);
  assert.equal(response.body.status, 'allow');
  assert.deepEqual(response.body.tasks.map((entry) => entry.caseId), ['case_guard_http_001']);
  assertNoForbiddenOutput(response.body);
});

test('HTTP behavior test remains app-like only and does not start a server', () => {
  const source = fs.readFileSync(testFile, 'utf8');

  assert.match(source, /createApp/);
  assert.match(source, /app\.handle\(req, res\)/);
  assert.doesNotMatch(source, /\.listen\(/);
  assert.doesNotMatch(source, /createServer\(/);
});
