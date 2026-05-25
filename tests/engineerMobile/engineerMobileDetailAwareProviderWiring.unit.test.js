'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Readable, Writable } = require('node:stream');
const test = require('node:test');

const { createApp } = require('../../src/app');
const {
  createServerBootstrap,
} = require('../../src/server');

const repoRoot = path.resolve(__dirname, '../..');
const appFile = path.join(repoRoot, 'src/app.js');
const serverFile = path.join(repoRoot, 'src/server.js');

function auth(overrides = {}) {
  return {
    organizationId: 'org_engineer_mobile_detail_wiring_001',
    userId: 'user_engineer_mobile_detail_wiring_001',
    engineerId: 'eng_engineer_mobile_detail_wiring_001',
    role: 'engineer',
    permissions: ['engineer_mobile.tasks.read'],
    ...overrides,
  };
}

function task(overrides = {}) {
  return {
    appointmentId: 'apt_engineer_mobile_detail_wiring_001',
    caseId: 'case_engineer_mobile_detail_wiring_001',
    organizationId: 'org_engineer_mobile_detail_wiring_001',
    assignedEngineerId: 'eng_engineer_mobile_detail_wiring_001',
    scheduledStart: '2026-05-21T09:00:00+08:00',
    scheduledEnd: '2026-05-21T10:00:00+08:00',
    status: 'confirmed',
    customerNameMasked: '黃○○',
    customerPhoneMasked: '09xx-xxx-246',
    addressSummary: '台中市西屯區',
    productSummary: '冷氣',
    issueSummary: '不冷',
    serviceType: 'repair',
    siteNoteSafe: '請先聯絡管理室',
    evidenceRefs: [
      {
        id: 'safe_wiring_ref_001',
        type: 'photo',
        label: '故障照片',
        token: 'evidence_token_should_not_leak',
      },
    ],
    internalNote: 'internal_note_should_not_leak',
    auditLog: 'audit_log_should_not_leak',
    aiRawPayload: 'ai_raw_payload_should_not_leak',
    billingInternal: 'billing_internal_should_not_leak',
    settlementInternal: 'settlement_internal_should_not_leak',
    rawPhone: 'raw_phone_should_not_leak',
    rawAddress: 'raw_address_should_not_leak',
    rawLineUserId: 'line_user_should_not_leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    DATABASE_URL: 'DATABASE_URL_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
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
    appointmentId: 'body_appointment_should_be_ignored',
    rawPhone: 'raw_phone_should_not_leak',
    rawAddress: 'raw_address_should_not_leak',
    rawLineUserId: 'line_user_should_not_leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    DATABASE_URL: 'DATABASE_URL_should_not_leak',
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

function appRouter(appInstance) {
  const routerLayer = appInstance._router.stack.find((layer) => (
    layer.handle
    && Array.isArray(layer.handle.stack)
    && layer.name === 'router'
  ));

  assert.ok(routerLayer, 'app router layer missing');
  return routerLayer.handle;
}

function findRoute(appInstance, method, pathname) {
  return appRouter(appInstance).stack.find((layer) => (
    layer.route
    && layer.route.path === pathname
    && layer.route.methods[method.toLowerCase()]
  ));
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

  for (const forbiddenValue of [
    'body_org_should_be_ignored',
    'body_engineer_should_be_ignored',
    'body_appointment_should_be_ignored',
    'internal_note_should_not_leak',
    'audit_log_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'billing_internal_should_not_leak',
    'settlement_internal_should_not_leak',
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'DATABASE_URL_should_not_leak',
    'final_appointment_should_not_leak',
    'evidence_token_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbiddenValue), false, `leaked ${forbiddenValue}`);
  }

  assert.equal(serialized.includes('"rawPhone"'), false);
  assert.equal(serialized.includes('"rawAddress"'), false);
  assert.equal(serialized.includes('"rawLineUserId"'), false);
  assert.equal(serialized.includes('"finalAppointmentId"'), false);
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

test('createApp request-aware provider does not call repository during app creation', () => {
  const calls = [];

  createApp({
    engineerMobile: {
      useRequestAwareProvider: true,
      repository: {
        getTaskDetail(input) {
          calls.push(input);
          return { task: task() };
        },
      },
    },
  });

  assert.deepEqual(calls, []);
});

test('list route maps auth and query without appointmentId', async () => {
  const calls = [];
  const app = createApp({
    engineerMobile: {
      useRequestAwareProvider: true,
      repository: {
        getReadModel(input) {
          calls.push(input);
          return {
            tasks: [
              task({ caseId: 'case_list_wiring_allowed' }),
              task({ caseId: 'case_list_wiring_wrong_engineer', assignedEngineerId: 'eng_other' }),
            ],
          };
        },
      },
    },
  });
  const response = await requestApp(app, '/engineer-mobile/tasks?from=2026-05-21&to=2026-05-28', {});

  assert.deepEqual(calls, [{
    dateRange: {
      from: '2026-05-21',
      to: '2026-05-28',
    },
    engineerId: 'eng_engineer_mobile_detail_wiring_001',
    organizationId: 'org_engineer_mobile_detail_wiring_001',
  }]);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.tasks.map((entry) => entry.caseId), ['case_list_wiring_allowed']);
  assertNoForbiddenOutput([response.body, calls]);
});

test('detail route maps auth and params appointmentId to repository.getTaskDetail', async () => {
  const calls = [];
  const app = createApp({
    engineerMobile: {
      useRequestAwareProvider: true,
      repository: {
        getTaskDetail(input) {
          calls.push(input);
          return { task: task({ caseId: 'case_detail_wiring_allowed' }) };
        },
      },
    },
  });
  const response = await requestApp(app, '/engineer-mobile/tasks/apt_engineer_mobile_detail_wiring_001?from=2026-05-21&to=2026-05-28', {});

  assert.deepEqual(calls, [{
    appointmentId: 'apt_engineer_mobile_detail_wiring_001',
    engineerId: 'eng_engineer_mobile_detail_wiring_001',
    organizationId: 'org_engineer_mobile_detail_wiring_001',
  }]);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.detail.caseId, 'case_detail_wiring_allowed');
  assertNoForbiddenOutput([response.body, calls]);
});

test('detail route can use repository.getTaskDetailAsync through request-aware provider', async () => {
  const calls = [];
  const app = createApp({
    engineerMobile: {
      useRequestAwareProvider: true,
      repository: {
        async getTaskDetailAsync(input) {
          calls.push(input);
          return { task: task({ caseId: 'case_async_detail_wiring_allowed' }) };
        },
      },
    },
  });
  const response = await requestApp(app, '/engineer-mobile/tasks/apt_engineer_mobile_detail_wiring_001?from=2026-05-21&to=2026-05-28', {});

  assert.deepEqual(calls, [{
    appointmentId: 'apt_engineer_mobile_detail_wiring_001',
    engineerId: 'eng_engineer_mobile_detail_wiring_001',
    organizationId: 'org_engineer_mobile_detail_wiring_001',
  }]);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.detail.caseId, 'case_async_detail_wiring_allowed');
  assertNoForbiddenOutput([response.body, calls]);
});

test('detail route can compose request-aware repository from injected executor', async () => {
  const executorCalls = [];
  const app = createApp({
    engineerMobile: {
      allowNonExecutableForTest: true,
      async executor(querySpec) {
        executorCalls.push(querySpec);
        return {
          rows: [
            {
              appointment_id: 'apt_engineer_mobile_detail_wiring_001',
              assigned_engineer_id: 'eng_engineer_mobile_detail_wiring_001',
              case_id: 'case_async_executor_detail_wiring',
              organization_id: 'org_engineer_mobile_detail_wiring_001',
              scheduled_start: '2026-05-21T09:00:00+08:00',
              status: 'confirmed',
              customer_name_masked: '黃○○',
              customer_phone_masked: '09xx-xxx-246',
              address_summary: '台中市西屯區',
              product_summary: '冷氣',
              issue_summary: '不冷',
              site_note_safe: '請先聯絡管理室',
              internal_note: 'internal_note_should_not_leak',
              raw_phone: 'raw_phone_should_not_leak',
              final_appointment_id: 'final_appointment_should_not_leak',
            },
          ],
        };
      },
      useRequestAwareProvider: true,
    },
  });
  const response = await requestApp(app, '/engineer-mobile/tasks/apt_engineer_mobile_detail_wiring_001', {});

  assert.equal(executorCalls.length, 1);
  assert.equal(Object.isFrozen(executorCalls[0]), true);
  assert.deepEqual(executorCalls[0].params, {
    appointmentId: 'apt_engineer_mobile_detail_wiring_001',
    engineerId: 'eng_engineer_mobile_detail_wiring_001',
    organizationId: 'org_engineer_mobile_detail_wiring_001',
  });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.detail.caseId, 'case_async_executor_detail_wiring');
  assertNoForbiddenOutput([response.body, executorCalls]);
});

test('detail route fallback to repository.getReadModel and getTaskList still works', async () => {
  for (const [methodName, expectedCaseId] of [
    ['getReadModel', 'case_detail_get_read_model'],
    ['getTaskList', 'case_detail_get_task_list'],
  ]) {
    const calls = [];
    const app = createApp({
      engineerMobile: {
        useRequestAwareProvider: true,
        repository: {
          [methodName](input) {
            calls.push(input);
            return { tasks: [task({ caseId: expectedCaseId })] };
          },
        },
      },
    });
    const response = await requestApp(app, '/engineer-mobile/tasks/apt_engineer_mobile_detail_wiring_001', {});

    assert.deepEqual(calls, [{
      appointmentId: 'apt_engineer_mobile_detail_wiring_001',
      engineerId: 'eng_engineer_mobile_detail_wiring_001',
      organizationId: 'org_engineer_mobile_detail_wiring_001',
    }]);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.detail.caseId, expectedCaseId);
    assertNoForbiddenOutput([response.body, calls]);
  }
});

test('detail route ignores body organization engineer and appointment values', async () => {
  const calls = [];
  const app = createApp({
    engineerMobile: {
      useRequestAwareProvider: true,
      repository: {
        getTaskDetail(input) {
          calls.push(input);
          return { task: task({ caseId: 'case_body_ignored' }) };
        },
      },
    },
  });
  const response = await requestApp(app, '/engineer-mobile/tasks/apt_engineer_mobile_detail_wiring_001', {});

  assert.deepEqual(calls, [{
    appointmentId: 'apt_engineer_mobile_detail_wiring_001',
    engineerId: 'eng_engineer_mobile_detail_wiring_001',
    organizationId: 'org_engineer_mobile_detail_wiring_001',
  }]);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.detail.caseId, 'case_body_ignored');
  assertNoForbiddenOutput([response.body, calls]);
});

test('wrong organization engineer or appointment denied safe through detail wiring', async () => {
  for (const sourceTask of [
    task({ organizationId: 'org_other' }),
    task({ assignedEngineerId: 'eng_other' }),
    task({ appointmentId: 'apt_other' }),
  ]) {
    const app = createApp({
      engineerMobile: {
        useRequestAwareProvider: true,
        repository: {
          getTaskDetail() {
            return { task: sourceTask };
          },
        },
      },
    });
    const response = await requestApp(app, '/engineer-mobile/tasks/apt_engineer_mobile_detail_wiring_001', {});

    assert.equal(response.statusCode, 404);
    assert.deepEqual(response.body, {
      detail: null,
      messageKey: 'engineerMobile.taskDetailUnavailable',
      status: 'deny',
    });
    assertNoForbiddenOutput(response.body);
  }
});

test('direct readModel behavior remains when request-aware flag is not enabled', async () => {
  const calls = [];
  const app = createApp({
    engineerMobile: {
      readModel(input) {
        calls.push(input);
        return [task({ caseId: 'case_direct_detail' })];
      },
    },
  });
  const response = await requestApp(app, '/engineer-mobile/tasks/apt_engineer_mobile_detail_wiring_001', {});

  assert.deepEqual(calls, [{
    appointmentId: 'apt_engineer_mobile_detail_wiring_001',
    engineerId: 'eng_engineer_mobile_detail_wiring_001',
    organizationId: 'org_engineer_mobile_detail_wiring_001',
  }]);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.detail.caseId, 'case_direct_detail');
  assertNoForbiddenOutput(response.body);
});

test('createServerBootstrap detail path works without listen', async () => {
  const calls = [];
  const bootstrap = createServerBootstrap({
    engineerMobile: {
      useRequestAwareProvider: true,
      repository: {
        getTaskDetail(input) {
          calls.push(input);
          return { task: task({ caseId: 'case_server_detail_wiring' }) };
        },
      },
    },
    port: 4073,
  });
  const response = await requestApp(bootstrap.app, '/engineer-mobile/tasks/apt_engineer_mobile_detail_wiring_001', {});

  assert.deepEqual(calls, [{
    appointmentId: 'apt_engineer_mobile_detail_wiring_001',
    engineerId: 'eng_engineer_mobile_detail_wiring_001',
    organizationId: 'org_engineer_mobile_detail_wiring_001',
  }]);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.detail.caseId, 'case_server_detail_wiring');
  assertNoForbiddenOutput(response.body);
});

test('server options.app priority bypasses engineerMobile provider', () => {
  const listenCalls = [];
  const repositoryCalls = [];
  const injectedApp = createSyntheticApp(listenCalls);
  const bootstrap = createServerBootstrap({
    app: injectedApp,
    engineerMobile: {
      useRequestAwareProvider: true,
      repository: {
        getTaskDetail(input) {
          repositoryCalls.push(input);
          return { task: task() };
        },
      },
    },
    port: 4074,
  });

  assert.equal(bootstrap.app, injectedApp);
  assert.deepEqual(repositoryCalls, []);
  assert.deepEqual(listenCalls, []);
});

test('customer access and data correction compatibility remains alongside engineerMobile', () => {
  const app = createApp({
    customerAccess: {
      dbAdapter: {},
    },
    dataCorrection: {
      correctionWriter() {},
    },
    engineerMobile: {
      useRequestAwareProvider: true,
      repository: {
        getTaskDetail() {
          return { task: task() };
        },
      },
    },
  });

  assert.ok(findRoute(app, 'get', '/engineer-mobile/tasks'));
  assert.ok(findRoute(app, 'get', '/engineer-mobile/tasks/:appointmentId'));
  assert.ok(findRoute(app, 'get', '/customer-access/:caseId'));
  assert.ok(findRoute(app, 'post', '/data-correction/governance'));
});

test('app and server source import boundaries avoid DB external provider and AI', () => {
  const appSource = fs.readFileSync(appFile, 'utf8');
  const serverSource = fs.readFileSync(serverFile, 'utf8');
  const appSpecifiers = requireSpecifiers(appSource);
  const serverSpecifiers = requireSpecifiers(serverSource);

  assert.ok(appSpecifiers.includes('./engineerMobile/engineerMobileTaskListReadProviderAdapter'));
  assert.equal(serverSpecifiers.includes('./engineerMobile/engineerMobileTaskListReadProviderAdapter'), false);
  assert.equal([...appSpecifiers, ...serverSpecifiers].some((specifier) => /db|pool|repositories?|transaction|lineProvider|sms|email|push|ai|rag|vector/i.test(specifier)), false);
});
