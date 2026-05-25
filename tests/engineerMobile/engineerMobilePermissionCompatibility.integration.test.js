'use strict';

const assert = require('node:assert/strict');
const { Readable, Writable } = require('node:stream');
const test = require('node:test');

const { createApp } = require('../../src/app');
const {
  createEngineerMobileTaskListReadRepository,
} = require('../../src/engineerMobile/engineerMobileTaskListReadRepository');
const {
  createAppRouter,
} = require('../../src/routes');
const {
  createServerBootstrap,
} = require('../../src/server');

function auth(overrides = {}) {
  return {
    organizationId: 'org_engineer_mobile_permission_compat_001',
    userId: 'user_engineer_mobile_permission_compat_001',
    engineerId: 'eng_engineer_mobile_permission_compat_001',
    role: 'engineer',
    permissions: ['engineer_mobile.tasks.read'],
    ...overrides,
  };
}

function task(overrides = {}) {
  return {
    caseId: 'case_engineer_mobile_permission_compat_001',
    appointmentId: 'apt_engineer_mobile_permission_compat_001',
    organizationId: 'org_engineer_mobile_permission_compat_001',
    assignedEngineerId: 'eng_engineer_mobile_permission_compat_001',
    scheduledStart: '2026-05-21T09:00:00+08:00',
    scheduledEnd: '2026-05-21T10:00:00+08:00',
    status: 'confirmed',
    customerNameMasked: '黃○○',
    customerPhoneMasked: '09xx-xxx-321',
    addressSummary: '高雄市苓雅區',
    productSummary: '冰箱',
    issueSummary: '不冷',
    serviceType: 'repair',
    rawPhone: 'raw_phone_should_not_leak',
    rawAddress: 'raw_address_should_not_leak',
    rawLineUserId: 'line_user_should_not_leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    DATABASE_URL: 'DATABASE_URL_should_not_leak',
    internalNote: 'internal_note_should_not_leak',
    auditLog: 'audit_log_should_not_leak',
    aiRawPayload: 'ai_raw_payload_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    ...overrides,
  };
}

function row(overrides = {}) {
  return {
    case_id: 'case_engineer_mobile_permission_compat_001',
    appointment_id: 'apt_engineer_mobile_permission_compat_001',
    organization_id: 'org_engineer_mobile_permission_compat_001',
    assigned_engineer_id: 'eng_engineer_mobile_permission_compat_001',
    scheduled_start: '2026-05-21T09:00:00+08:00',
    scheduled_end: '2026-05-21T10:00:00+08:00',
    appointment_status: 'confirmed',
    customer_name_masked: '黃○○',
    customer_phone_masked: '09xx-xxx-321',
    address_summary: '高雄市苓雅區',
    product_summary: '冰箱',
    issue_summary: '不冷',
    service_type: 'repair',
    raw_phone: 'raw_phone_should_not_leak',
    raw_address: 'raw_address_should_not_leak',
    raw_line_user_id: 'line_user_should_not_leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    DATABASE_URL: 'DATABASE_URL_should_not_leak',
    internal_note: 'internal_note_should_not_leak',
    audit_log: 'audit_log_should_not_leak',
    ai_raw_payload: 'ai_raw_payload_should_not_leak',
    final_appointment_id: 'final_appointment_should_not_leak',
    ...overrides,
  };
}

function createRequest(pathname, authOverrides, bodyOverrides = {}) {
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

  req.method = 'GET';
  req.url = pathname;
  req.originalUrl = pathname;
  req.headers = {};
  req.connection = {};
  req.body = {
    organizationId: 'body_org_should_be_ignored',
    engineerId: 'body_engineer_should_be_ignored',
    rawPhone: 'body_raw_phone_should_not_leak',
    secret: 'body_secret_should_not_leak',
    ...bodyOverrides,
  };

  if (authOverrides !== undefined) {
    req.auth = auth(authOverrides);
  }

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
  res.status = (statusCode) => {
    res.statusCode = statusCode;
    return res;
  };
  res.json = (body) => {
    res.setHeader('content-type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify(body));
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

function requestTarget(target, authOverrides, query = 'from=2026-05-21&to=2026-05-28') {
  return new Promise((resolve, reject) => {
    const req = createRequest(`/engineer-mobile/tasks?${query}`, authOverrides);
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
    target.handle(req, res);
  });
}

function createRepository(executorCalls, rows) {
  return createEngineerMobileTaskListReadRepository({
    allowNonExecutableForTest: true,
    executor(querySpec) {
      executorCalls.push(querySpec);
      return {
        rows,
      };
    },
  });
}

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

function assertNoForbiddenOutput(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'body_org_should_be_ignored',
    'body_engineer_should_be_ignored',
    'body_raw_phone_should_not_leak',
    'body_secret_should_not_leak',
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'DATABASE_URL_should_not_leak',
    'internal_note_should_not_leak',
    'audit_log_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'final_appointment_should_not_leak',
    'rawPhone',
    'rawAddress',
    'rawLineUserId',
    'finalAppointmentId',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('route index path denies missing auth before provider call', async () => {
  const providerCalls = [];
  const router = createAppRouter({
    engineerMobile: {
      readModel(input) {
        providerCalls.push(input);
        return [task()];
      },
    },
  });
  const response = await requestTarget(router, undefined);

  assert.deepEqual(providerCalls, []);
  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, {
    status: 'deny',
    messageKey: 'engineerMobile.unavailable',
    data: null,
  });
  assertNoForbiddenOutput(response.body);
});

test('route index path denies missing permission before provider call', async () => {
  const providerCalls = [];
  const router = createAppRouter({
    engineerMobile: {
      readModel(input) {
        providerCalls.push(input);
        return [task()];
      },
    },
  });
  const response = await requestTarget(router, { permissions: [] });

  assert.deepEqual(providerCalls, []);
  assert.equal(response.statusCode, 403);
  assertNoForbiddenOutput(response.body);
});

test('route index path allows engineer and returns assigned tasks', async () => {
  const router = createAppRouter({
    engineerMobile: {
      readModel() {
        return [
          task({ caseId: 'case_route_allowed' }),
          task({ caseId: 'case_route_wrong_org', organizationId: 'org_other' }),
          task({ caseId: 'case_route_wrong_engineer', assignedEngineerId: 'eng_other' }),
        ];
      },
    },
  });
  const response = await requestTarget(router, {});

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.tasks.map((entry) => entry.caseId), ['case_route_allowed']);
  assertNoForbiddenOutput(response.body);
});

test('route index path denies customer service and AI before provider call', async () => {
  for (const role of ['customer_service', 'ai']) {
    const providerCalls = [];
    const router = createAppRouter({
      engineerMobile: {
        readModel(input) {
          providerCalls.push(input);
          return [task()];
        },
      },
    });
    const response = await requestTarget(router, { role });

    assert.deepEqual(providerCalls, []);
    assert.equal(response.statusCode, 403);
  }
});

test('compatible permissions pass through route index path', async () => {
  for (const permission of [
    'engineer_mobile.tasks.read.assigned',
    'engineer_mobile.workbench.access',
  ]) {
    const router = createAppRouter({
      engineerMobile: {
        readModel() {
          return [task({ caseId: `case_${permission.replaceAll('.', '_')}` })];
        },
      },
    });
    const response = await requestTarget(router, { permissions: [permission] });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.tasks.length, 1);
  }
});

test('app factory request-aware provider maps auth/query and ignores body org engineer', async () => {
  const executorCalls = [];
  const repository = createRepository(executorCalls, [
    row({ case_id: 'case_app_allowed' }),
    row({ case_id: 'case_app_wrong_org', organization_id: 'org_other' }),
    row({ case_id: 'case_app_wrong_engineer', assigned_engineer_id: 'eng_other' }),
  ]);
  const app = createApp({
    engineerMobile: {
      useRequestAwareProvider: true,
      repository,
    },
  });
  const response = await requestTarget(app, {});

  assert.equal(executorCalls.length, 1);
  assert.deepEqual(executorCalls[0].params, {
    organizationId: 'org_engineer_mobile_permission_compat_001',
    engineerId: 'eng_engineer_mobile_permission_compat_001',
    from: '2026-05-21',
    to: '2026-05-28',
  });
  assert.equal(JSON.stringify(executorCalls).includes('body_org_should_be_ignored'), false);
  assert.equal(JSON.stringify(executorCalls).includes('body_engineer_should_be_ignored'), false);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.tasks.map((entry) => entry.caseId), ['case_app_allowed']);
  assertNoForbiddenOutput([response.body, executorCalls]);
});

test('server factory request-aware provider path works without listen', async () => {
  const executorCalls = [];
  const repository = createRepository(executorCalls, [
    row({ case_id: 'case_server_allowed' }),
  ]);
  const bootstrap = createServerBootstrap({
    engineerMobile: {
      useRequestAwareProvider: true,
      repository,
    },
    port: 4072,
  });
  const response = await requestTarget(bootstrap.app, {});

  assert.equal(executorCalls.length, 1);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.tasks.map((entry) => entry.caseId), ['case_server_allowed']);
  assertNoForbiddenOutput(response.body);
});

test('server options.app priority bypasses engineerMobile repository', () => {
  const executorCalls = [];
  const listenCalls = [];
  const syntheticApp = createSyntheticApp(listenCalls);
  const repository = createRepository(executorCalls, [row()]);
  const bootstrap = createServerBootstrap({
    app: syntheticApp,
    engineerMobile: {
      useRequestAwareProvider: true,
      repository,
    },
    port: 4073,
  });

  assert.equal(bootstrap.app, syntheticApp);
  assert.deepEqual(executorCalls, []);
  assert.deepEqual(listenCalls, []);
});
