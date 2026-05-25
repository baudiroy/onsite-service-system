'use strict';

const assert = require('node:assert/strict');
const { Readable, Writable } = require('node:stream');
const test = require('node:test');

const { createApp } = require('../../src/app');
const {
  createServerBootstrap,
} = require('../../src/server');

function auth(overrides = {}) {
  return {
    organizationId: 'org_engineer_mobile_detail_app_001',
    userId: 'user_engineer_mobile_detail_app_001',
    engineerId: 'eng_engineer_mobile_detail_app_001',
    role: 'engineer',
    permissions: ['engineer_mobile.tasks.read'],
    ...overrides,
  };
}

function task(overrides = {}) {
  return {
    appointmentId: 'apt_engineer_mobile_detail_app_001',
    caseId: 'case_engineer_mobile_detail_app_001',
    organizationId: 'org_engineer_mobile_detail_app_001',
    assignedEngineerId: 'eng_engineer_mobile_detail_app_001',
    scheduledStart: '2026-05-21T09:00:00+08:00',
    scheduledEnd: '2026-05-21T10:00:00+08:00',
    status: 'confirmed',
    customerNameMasked: '林○○',
    customerPhoneMasked: '09xx-xxx-765',
    addressSummary: '新北市新店區',
    productSummary: '冷氣',
    issueSummary: '異音',
    serviceType: 'repair',
    siteNoteSafe: '請先聯絡櫃台',
    evidenceRefs: [
      {
        id: 'safe_detail_ref_001',
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

test('createApp direct readModel detail route works for valid engineer auth', async () => {
  const calls = [];
  const app = createApp({
    engineerMobile: {
      readModel(input) {
        calls.push(input);
        return {
          tasks: [
            task({ caseId: 'case_detail_app_allowed' }),
            task({ caseId: 'case_detail_app_wrong_org', organizationId: 'org_other' }),
            task({ caseId: 'case_detail_app_wrong_engineer', assignedEngineerId: 'eng_other' }),
          ],
        };
      },
    },
  });
  const response = await requestApp(app, '/engineer-mobile/tasks/apt_engineer_mobile_detail_app_001', {});

  assert.deepEqual(calls, [{
    appointmentId: 'apt_engineer_mobile_detail_app_001',
    engineerId: 'eng_engineer_mobile_detail_app_001',
    organizationId: 'org_engineer_mobile_detail_app_001',
  }]);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'allow');
  assert.equal(response.body.detail.caseId, 'case_detail_app_allowed');
  assert.equal(response.body.detail.appointmentId, 'apt_engineer_mobile_detail_app_001');
  assertNoForbiddenOutput([response.body, calls]);
});

test('createApp request-aware provider path supports detail filtering without detail-specific repository input', async () => {
  const calls = [];
  const app = createApp({
    engineerMobile: {
      useRequestAwareProvider: true,
      repository: {
        getReadModel(input) {
          calls.push(input);
          return {
            tasks: [
              task({ caseId: 'case_request_aware_detail_allowed' }),
              task({ appointmentId: 'apt_other', caseId: 'case_request_aware_detail_other_appointment' }),
            ],
          };
        },
      },
    },
  });
  const response = await requestApp(app, '/engineer-mobile/tasks/apt_engineer_mobile_detail_app_001', {});

  assert.deepEqual(calls, [{
    appointmentId: 'apt_engineer_mobile_detail_app_001',
    engineerId: 'eng_engineer_mobile_detail_app_001',
    organizationId: 'org_engineer_mobile_detail_app_001',
  }]);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.detail.caseId, 'case_request_aware_detail_allowed');
  assertNoForbiddenOutput([response.body, calls]);
});

test('createApp detail route supports app executor shortcut without DB access', async () => {
  const detailExecutorCalls = [];
  const listExecutorCalls = [];
  const app = createApp({
    engineerMobileAllowNonExecutableForTest: true,
    engineerMobileReadListExecutor(querySpec) {
      listExecutorCalls.push(querySpec);
      return { rows: [] };
    },
    engineerMobileReadDetailExecutor(querySpec) {
      detailExecutorCalls.push(querySpec);
      return {
        rows: [
          {
            appointment_id: 'apt_engineer_mobile_detail_app_001',
            assigned_engineer_id: 'eng_engineer_mobile_detail_app_001',
            case_id: 'case_app_detail_executor_allowed',
            organization_id: 'org_engineer_mobile_detail_app_001',
            scheduled_start: '2026-05-21T09:00:00+08:00',
            appointment_status: 'confirmed',
            customer_name_masked: '林○○',
            customer_phone_masked: '09xx-xxx-765',
            address_summary: '新北市新店區',
            product_summary: '冷氣',
            issue_summary: '異音',
            service_type: 'repair',
            site_note_safe: '請先聯絡櫃台',
            internal_note: 'internal_note_should_not_leak',
            raw_phone: 'raw_phone_should_not_leak',
            final_appointment_id: 'final_appointment_should_not_leak',
          },
        ],
      };
    },
  });

  assert.deepEqual(detailExecutorCalls, []);
  assert.deepEqual(listExecutorCalls, []);

  const response = await requestApp(app, '/engineer-mobile/tasks/apt_engineer_mobile_detail_app_001', {});

  assert.deepEqual(listExecutorCalls, []);
  assert.equal(detailExecutorCalls.length, 1);
  assert.equal(detailExecutorCalls[0].name, 'engineerMobileTaskDetailReadModel');
  assert.deepEqual(detailExecutorCalls[0].params, {
    appointmentId: 'apt_engineer_mobile_detail_app_001',
    engineerId: 'eng_engineer_mobile_detail_app_001',
    organizationId: 'org_engineer_mobile_detail_app_001',
  });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.detail.caseId, 'case_app_detail_executor_allowed');
  assertNoForbiddenOutput([response.body, detailExecutorCalls, listExecutorCalls]);
});

test('createApp detail-specific executor shortcut has priority over shared executor shortcut', async () => {
  const sharedExecutorCalls = [];
  const detailExecutorCalls = [];
  const app = createApp({
    engineerMobileAllowNonExecutableForTest: true,
    engineerMobileReadExecutor(querySpec) {
      sharedExecutorCalls.push(querySpec);
      return { rows: [] };
    },
    engineerMobileDetailExecutor(querySpec) {
      detailExecutorCalls.push(querySpec);
      return {
        rows: [
          {
            appointment_id: 'apt_engineer_mobile_detail_app_001',
            assigned_engineer_id: 'eng_engineer_mobile_detail_app_001',
            case_id: 'case_app_detail_specific_executor_allowed',
            organization_id: 'org_engineer_mobile_detail_app_001',
            scheduled_start: '2026-05-21T09:00:00+08:00',
            appointment_status: 'confirmed',
            customer_name_masked: '林○○',
            customer_phone_masked: '09xx-xxx-765',
            address_summary: '新北市新店區',
            product_summary: '冷氣',
            issue_summary: '異音',
            service_type: 'repair',
            site_note_safe: '請先聯絡櫃台',
            internal_note: 'internal_note_should_not_leak',
            raw_phone: 'raw_phone_should_not_leak',
            final_appointment_id: 'final_appointment_should_not_leak',
          },
        ],
      };
    },
  });

  const response = await requestApp(app, '/engineer-mobile/tasks/apt_engineer_mobile_detail_app_001', {});

  assert.deepEqual(sharedExecutorCalls, []);
  assert.equal(detailExecutorCalls.length, 1);
  assert.equal(detailExecutorCalls[0].name, 'engineerMobileTaskDetailReadModel');
  assert.deepEqual(detailExecutorCalls[0].params, {
    appointmentId: 'apt_engineer_mobile_detail_app_001',
    engineerId: 'eng_engineer_mobile_detail_app_001',
    organizationId: 'org_engineer_mobile_detail_app_001',
  });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.detail.caseId, 'case_app_detail_specific_executor_allowed');
  assertNoForbiddenOutput([response.body, sharedExecutorCalls, detailExecutorCalls]);
});

test('createApp detail route supports top-level read repository shortcut without list fallback', async () => {
  const detailRepositoryCalls = [];
  const listRepositoryCalls = [];
  const app = createApp({
    engineerMobileReadRepository: {
      getTaskDetail(input) {
        detailRepositoryCalls.push(input);
        return {
          task: task({
            caseId: 'case_app_detail_repository_shortcut_allowed',
            internalNote: 'internal_note_should_not_leak',
            rawPhone: 'raw_phone_should_not_leak',
            finalAppointmentId: 'final_appointment_should_not_leak',
          }),
        };
      },
      getTaskList(input) {
        listRepositoryCalls.push(input);
        return { tasks: [] };
      },
    },
  });

  const response = await requestApp(app, '/engineer-mobile/tasks/apt_engineer_mobile_detail_app_001', {});

  assert.deepEqual(listRepositoryCalls, []);
  assert.deepEqual(detailRepositoryCalls, [{
    appointmentId: 'apt_engineer_mobile_detail_app_001',
    engineerId: 'eng_engineer_mobile_detail_app_001',
    organizationId: 'org_engineer_mobile_detail_app_001',
  }]);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.detail.caseId, 'case_app_detail_repository_shortcut_allowed');
  assertNoForbiddenOutput([response.body, detailRepositoryCalls, listRepositoryCalls]);
});

test('createApp detail route supports async top-level read repository shortcut without list fallback', async () => {
  const detailRepositoryCalls = [];
  const syncDetailRepositoryCalls = [];
  const listRepositoryCalls = [];
  const app = createApp({
    engineerMobileReadRepository: {
      async getTaskDetailAsync(input) {
        detailRepositoryCalls.push(input);
        return {
          task: task({
            caseId: 'case_app_detail_repository_async_shortcut_allowed',
            internalNote: 'internal_note_should_not_leak',
            rawPhone: 'raw_phone_should_not_leak',
            finalAppointmentId: 'final_appointment_should_not_leak',
          }),
        };
      },
      getTaskDetail(input) {
        syncDetailRepositoryCalls.push(input);
        return {
          task: task({
            caseId: 'case_app_detail_repository_sync_should_not_be_used',
          }),
        };
      },
      async getTaskListAsync(input) {
        listRepositoryCalls.push(input);
        return { tasks: [] };
      },
    },
  });

  const response = await requestApp(app, '/engineer-mobile/tasks/apt_engineer_mobile_detail_app_001', {});

  assert.deepEqual(syncDetailRepositoryCalls, []);
  assert.deepEqual(listRepositoryCalls, []);
  assert.deepEqual(detailRepositoryCalls, [{
    appointmentId: 'apt_engineer_mobile_detail_app_001',
    engineerId: 'eng_engineer_mobile_detail_app_001',
    organizationId: 'org_engineer_mobile_detail_app_001',
  }]);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.detail.caseId, 'case_app_detail_repository_async_shortcut_allowed');
  assertNoForbiddenOutput([
    response.body,
    detailRepositoryCalls,
    syncDetailRepositoryCalls,
    listRepositoryCalls,
  ]);
});

test('createServerBootstrap detail route works without listen', async () => {
  const calls = [];
  const bootstrap = createServerBootstrap({
    engineerMobile: {
      readModel(input) {
        calls.push(input);
        return { tasks: [task({ caseId: 'case_server_detail_allowed' })] };
      },
    },
    port: 4071,
  });
  const response = await requestApp(bootstrap.app, '/engineer-mobile/tasks/apt_engineer_mobile_detail_app_001', {});

  assert.deepEqual(calls, [{
    appointmentId: 'apt_engineer_mobile_detail_app_001',
    engineerId: 'eng_engineer_mobile_detail_app_001',
    organizationId: 'org_engineer_mobile_detail_app_001',
  }]);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.detail.caseId, 'case_server_detail_allowed');
  assertNoForbiddenOutput(response.body);
});

test('createServerBootstrap detail route supports top-level read repository shortcut without list fallback', async () => {
  const detailRepositoryCalls = [];
  const listRepositoryCalls = [];
  const bootstrap = createServerBootstrap({
    engineerMobileReadRepository: {
      getTaskDetail(input) {
        detailRepositoryCalls.push(input);
        return {
          task: task({
            caseId: 'case_server_detail_repository_shortcut_allowed',
            internalNote: 'internal_note_should_not_leak',
            rawPhone: 'raw_phone_should_not_leak',
            finalAppointmentId: 'final_appointment_should_not_leak',
          }),
        };
      },
      getTaskList(input) {
        listRepositoryCalls.push(input);
        return { tasks: [] };
      },
    },
  });

  const response = await requestApp(
    bootstrap.app,
    '/engineer-mobile/tasks/apt_engineer_mobile_detail_app_001',
    {},
  );

  assert.deepEqual(listRepositoryCalls, []);
  assert.deepEqual(detailRepositoryCalls, [{
    appointmentId: 'apt_engineer_mobile_detail_app_001',
    engineerId: 'eng_engineer_mobile_detail_app_001',
    organizationId: 'org_engineer_mobile_detail_app_001',
  }]);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.detail.caseId, 'case_server_detail_repository_shortcut_allowed');
  assertNoForbiddenOutput([response.body, detailRepositoryCalls, listRepositoryCalls]);
});

test('createServerBootstrap detail route supports async top-level read repository shortcut without list fallback', async () => {
  const detailRepositoryCalls = [];
  const syncDetailRepositoryCalls = [];
  const listRepositoryCalls = [];
  const bootstrap = createServerBootstrap({
    engineerMobileReadRepository: {
      async getTaskDetailAsync(input) {
        detailRepositoryCalls.push(input);
        return {
          task: task({
            caseId: 'case_server_detail_repository_async_shortcut_allowed',
            internalNote: 'internal_note_should_not_leak',
            rawPhone: 'raw_phone_should_not_leak',
            finalAppointmentId: 'final_appointment_should_not_leak',
          }),
        };
      },
      getTaskDetail(input) {
        syncDetailRepositoryCalls.push(input);
        return {
          task: task({
            caseId: 'case_server_detail_repository_sync_should_not_be_used',
          }),
        };
      },
      async getTaskListAsync(input) {
        listRepositoryCalls.push(input);
        return { tasks: [] };
      },
    },
  });

  const response = await requestApp(
    bootstrap.app,
    '/engineer-mobile/tasks/apt_engineer_mobile_detail_app_001',
    {},
  );

  assert.deepEqual(syncDetailRepositoryCalls, []);
  assert.deepEqual(listRepositoryCalls, []);
  assert.deepEqual(detailRepositoryCalls, [{
    appointmentId: 'apt_engineer_mobile_detail_app_001',
    engineerId: 'eng_engineer_mobile_detail_app_001',
    organizationId: 'org_engineer_mobile_detail_app_001',
  }]);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.detail.caseId, 'case_server_detail_repository_async_shortcut_allowed');
  assertNoForbiddenOutput([
    response.body,
    detailRepositoryCalls,
    syncDetailRepositoryCalls,
    listRepositoryCalls,
  ]);
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
        getReadModel(input) {
          repositoryCalls.push(input);
          return { tasks: [task()] };
        },
      },
    },
    port: 4072,
  });

  assert.equal(bootstrap.app, injectedApp);
  assert.deepEqual(repositoryCalls, []);
  assert.deepEqual(listenCalls, []);
});

test('missing auth and missing permission deny before detail provider', async () => {
  for (const authOverrides of [
    undefined,
    { permissions: [] },
  ]) {
    const calls = [];
    const app = createApp({
      engineerMobile: {
        readModel(input) {
          calls.push(input);
          return { tasks: [task()] };
        },
      },
    });
    const response = await requestApp(app, '/engineer-mobile/tasks/apt_engineer_mobile_detail_app_001', authOverrides);

    assert.deepEqual(calls, []);
    assert.equal(response.statusCode, 403);
    assert.deepEqual(response.body, {
      status: 'deny',
      messageKey: 'engineerMobile.unavailable',
      data: null,
    });
    assertNoForbiddenOutput(response.body);
  }
});

test('wrong organization engineer or appointment returns generic safe unavailable', async () => {
  for (const sourceTask of [
    task({ organizationId: 'org_other' }),
    task({ assignedEngineerId: 'eng_other' }),
    task({ appointmentId: 'apt_other' }),
  ]) {
    const app = createApp({
      engineerMobile: {
        readModel() {
          return { tasks: [sourceTask] };
        },
      },
    });
    const response = await requestApp(app, '/engineer-mobile/tasks/apt_engineer_mobile_detail_app_001', {});

    assert.equal(response.statusCode, 404);
    assert.deepEqual(response.body, {
      detail: null,
      messageKey: 'engineerMobile.taskDetailUnavailable',
      status: 'deny',
    });
    assertNoForbiddenOutput(response.body);
  }
});

test('list route still works through app after detail mount', async () => {
  const app = createApp({
    engineerMobile: {
      readModel(input) {
        assert.equal(input.organizationId, 'org_engineer_mobile_detail_app_001');
        assert.equal(input.engineerId, 'eng_engineer_mobile_detail_app_001');

        return {
          tasks: [
            task({ caseId: 'case_list_app_allowed' }),
            task({ caseId: 'case_list_app_wrong_org', organizationId: 'org_other' }),
            task({ caseId: 'case_list_app_wrong_engineer', assignedEngineerId: 'eng_other' }),
          ],
        };
      },
    },
  });
  const response = await requestApp(app, '/engineer-mobile/tasks?from=2026-05-21&to=2026-05-22', {});

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.tasks.map((entry) => entry.caseId), ['case_list_app_allowed']);
  assertNoForbiddenOutput(response.body);
});

test('customer access and data correction app routes remain present alongside detail route', () => {
  const app = createApp();

  assert.ok(findRoute(app, 'get', '/engineer-mobile/tasks'));
  assert.ok(findRoute(app, 'get', '/engineer-mobile/tasks/:appointmentId'));
  assert.ok(findRoute(app, 'get', '/customer-access/:caseId'));
  assert.ok(findRoute(app, 'post', '/data-correction/governance'));
});
