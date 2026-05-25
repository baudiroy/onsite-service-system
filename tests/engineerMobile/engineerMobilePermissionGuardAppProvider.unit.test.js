'use strict';

const assert = require('node:assert/strict');
const { Readable, Writable } = require('node:stream');
const test = require('node:test');

const { createApp } = require('../../src/app');
const {
  createEngineerMobileTaskListReadProvider,
} = require('../../src/engineerMobile/engineerMobileTaskListReadProviderAdapter');
const {
  evaluateEngineerMobilePermissionAssignment,
} = require('../../src/engineerMobile/engineerMobilePermissionAssignmentGuard');

function auth(overrides = {}) {
  return {
    engineerId: 'eng_guard_app_001',
    organizationId: 'org_guard_app_001',
    permissions: ['engineer_mobile.tasks.read.assigned'],
    role: 'engineer',
    userId: 'user_guard_app_001',
    ...overrides,
  };
}

function task(overrides = {}) {
  return {
    addressSummary: '台北市大安區',
    aiRawPayload: 'ai_raw_payload_should_not_leak',
    appointmentId: 'apt_guard_app_001',
    assignedEngineerId: 'eng_guard_app_001',
    auditLog: 'audit_log_should_not_leak',
    billingInternal: 'billing_internal_should_not_leak',
    caseId: 'case_guard_app_001',
    customerNameMasked: '王○○',
    customerPhoneMasked: '09xx-xxx-123',
    DATABASE_URL: 'DATABASE_URL_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    internalNote: 'internal_note_should_not_leak',
    issueSummary: '不冷',
    organizationId: 'org_guard_app_001',
    productSummary: '冷氣',
    rawAddress: 'raw_address_should_not_leak',
    rawLineUserId: 'line_user_should_not_leak',
    rawPhone: 'raw_phone_should_not_leak',
    scheduledEnd: '2026-05-21T10:00:00+08:00',
    scheduledStart: '2026-05-21T09:00:00+08:00',
    secret: 'secret_should_not_leak',
    serviceType: 'repair',
    settlementInternal: 'settlement_internal_should_not_leak',
    siteNoteSafe: '請從管理室換證',
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

  req.auth = auth(authOverrides);
  req.body = {
    rawAddress: 'raw_address_should_not_leak',
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

function guardedApp(options = {}) {
  return createApp({
    engineerMobile: {
      permissionAssignmentContext: auth(),
      permissionAssignmentGuard: evaluateEngineerMobilePermissionAssignment,
      permissionAssignmentGuardEnabled: true,
      repository: {
        getReadModel() {
          return { tasks: [task(options.task)] };
        },
      },
      useRequestAwareProvider: true,
      ...options.engineerMobile,
    },
  });
}

function assertNoForbiddenOutput(value) {
  const serialized = JSON.stringify(value);

  for (const forbiddenValue of [
    'ai_raw_payload_should_not_leak',
    'audit_log_should_not_leak',
    'billing_internal_should_not_leak',
    'DATABASE_URL_should_not_leak',
    'final_appointment_should_not_leak',
    'internal_note_should_not_leak',
    'line_user_should_not_leak',
    'raw_address_should_not_leak',
    'raw_phone_should_not_leak',
    'secret_should_not_leak',
    'settlement_internal_should_not_leak',
    'token_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbiddenValue), false, `leaked ${forbiddenValue}`);
  }

  assert.equal(serialized.includes('"finalAppointmentId"'), false);
  assert.equal(serialized.includes('"rawAddress"'), false);
  assert.equal(serialized.includes('"rawLineUserId"'), false);
  assert.equal(serialized.includes('"rawPhone"'), false);
}

test('guarded app list allows assigned engineer and preserves status/tasks shape', async () => {
  const response = await requestApp(
    guardedApp(),
    '/engineer-mobile/tasks?from=2026-05-21&to=2026-05-21',
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(Object.keys(response.body).sort(), ['status', 'tasks']);
  assert.equal(response.body.status, 'allow');
  assert.deepEqual(response.body.tasks.map((entry) => entry.caseId), ['case_guard_app_001']);
  assertNoForbiddenOutput(response.body);
});

test('guarded app detail allows assigned engineer and preserves status/detail shape', async () => {
  const response = await requestApp(
    guardedApp(),
    '/engineer-mobile/tasks/apt_guard_app_001',
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(Object.keys(response.body).sort(), ['detail', 'status']);
  assert.equal(response.body.status, 'allow');
  assert.equal(response.body.detail.caseId, 'case_guard_app_001');
  assert.equal(response.body.detail.appointmentId, 'apt_guard_app_001');
  assertNoForbiddenOutput(response.body);
});

test('guarded app denies unassigned synthetic engineer context without leaking rows', async () => {
  const response = await requestApp(
    guardedApp({
      engineerMobile: {
        permissionAssignmentContext: auth({
          engineerId: 'eng_guard_app_other',
          userId: 'user_guard_app_other',
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

test('guarded app denies cross-organization synthetic context', async () => {
  const response = await requestApp(
    guardedApp({
      engineerMobile: {
        permissionAssignmentContext: auth({
          organizationId: 'org_guard_app_other',
        }),
      },
    }),
    '/engineer-mobile/tasks/apt_guard_app_001',
  );

  assert.equal(response.statusCode, 404);
  assert.equal(response.body.status, 'deny');
  assert.equal(response.body.detail, null);
  assertNoForbiddenOutput(response.body);
});

test('dispatcher supervisor and admin synthetic contexts can inspect explicit same-org assignment', async () => {
  for (const role of ['dispatch_assistant', 'supervisor', 'admin']) {
    const response = await requestApp(
      guardedApp({
        engineerMobile: {
          permissionAssignmentContext: auth({
            engineerId: `eng_guard_app_${role}`,
            role,
            userId: `user_guard_app_${role}`,
          }),
        },
      }),
      '/engineer-mobile/tasks/apt_guard_app_001',
    );

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.status, 'allow');
    assert.equal(response.body.detail.caseId, 'case_guard_app_001');
    assertNoForbiddenOutput(response.body);
  }
});

test('provider path fail-closes when guard is enabled but auth context lacks role permission and user', () => {
  const provider = createEngineerMobileTaskListReadProvider({
    permissionAssignmentGuard: evaluateEngineerMobilePermissionAssignment,
    permissionAssignmentGuardEnabled: true,
    repository: {
      getReadModel() {
        return { tasks: [task()] };
      },
    },
  });

  assert.deepEqual(provider.readModel({
    auth: {
      engineerId: 'eng_guard_app_001',
      organizationId: 'org_guard_app_001',
    },
    query: {
      from: '2026-05-21',
      to: '2026-05-21',
    },
  }), { tasks: [] });
});

test('default behavior remains unchanged when guard is disabled', async () => {
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
  assert.equal(response.body.status, 'allow');
  assert.deepEqual(response.body.tasks.map((entry) => entry.caseId), ['case_guard_app_001']);
  assertNoForbiddenOutput(response.body);
});
