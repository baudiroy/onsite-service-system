'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Readable, Writable } = require('node:stream');
const test = require('node:test');

const { createApp } = require('../../src/app');

const repoRoot = path.resolve(__dirname, '../..');
const appFile = path.join(repoRoot, 'src/app.js');

function auth(overrides = {}) {
  return {
    organizationId: 'org_workbench_app_factory_001',
    engineerId: 'eng_workbench_app_factory_001',
    userId: 'user_workbench_app_factory_001',
    role: 'engineer',
    permissions: [
      'engineer_mobile.tasks.read',
    ],
    ...overrides,
  };
}

function createRequest(pathname, authOverrides, options = {}) {
  const bodyText = options.body ? JSON.stringify(options.body) : '';
  let sent = false;
  const req = new Readable({
    read() {
      if (sent) {
        this.push(null);
        return;
      }

      sent = true;
      if (bodyText) {
        this.push(bodyText);
      }
      this.push(null);
    },
  });

  req.method = options.method || 'GET';
  req.url = pathname;
  req.originalUrl = pathname;
  req.headers = bodyText
    ? {
      'content-length': String(Buffer.byteLength(bodyText)),
      'content-type': 'application/json',
    }
    : {};
  req.connection = {};

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

function requestApp(app, pathname, authOverrides = {}, options = {}) {
  return new Promise((resolve, reject) => {
    const req = createRequest(pathname, authOverrides, options);
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

function contextProvider(label) {
  return {
    getCurrentContext() {
      return {
        engineerDisplayName: label,
        organizationName: `${label} org`,
        rawPhone: 'raw_phone_should_not_leak',
        rawLineUserId: 'line_user_should_not_leak',
        token: 'token_should_not_leak',
        secret: 'secret_should_not_leak',
      };
    },
  };
}

function task(overrides = {}) {
  return {
    caseId: 'case_workbench_app_factory_task_001',
    appointmentId: 'apt_workbench_app_factory_task_001',
    organizationId: 'org_workbench_app_factory_001',
    assignedEngineerId: 'eng_workbench_app_factory_001',
    scheduledStart: '2026-05-21T09:00:00+08:00',
    scheduledEnd: '2026-05-21T10:00:00+08:00',
    status: 'confirmed',
    customerNameMasked: '王○○',
    customerPhoneMasked: '09xx-xxx-123',
    addressSummary: '台北市信義區',
    productSummary: '冷氣',
    issueSummary: '不冷',
    serviceType: 'repair',
    rawPhone: 'raw_phone_should_not_leak',
    rawLineUserId: 'line_user_should_not_leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    ...overrides,
  };
}

function assertNoForbiddenOutput(value) {
  const serialized = JSON.stringify(value);

  for (const forbiddenValue of [
    'raw_phone_should_not_leak',
    'line_user_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbiddenValue), false, `leaked ${forbiddenValue}`);
  }

  assert.equal(serialized.includes('"rawPhone"'), false);
  assert.equal(serialized.includes('"rawLineUserId"'), false);
}

test('createApp({ engineerMobileWorkbench }) mounts dedicated Workbench context options', async () => {
  const app = createApp({
    engineerMobileWorkbench: {
      contextProvider: contextProvider('dedicated-workbench'),
    },
  });

  const response = await requestApp(app, '/api/v1/engineer/mobile-workbench/context');

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'allow');
  assert.equal(response.body.context.engineerDisplayName, 'dedicated-workbench');
  assertNoForbiddenOutput(response.body);
});

test('createApp({ engineerMobileWorkbench }) has priority over engineerMobile fallback', async () => {
  const app = createApp({
    engineerMobile: {
      contextProvider: contextProvider('engineer-mobile-fallback'),
    },
    engineerMobileWorkbench: {
      contextProvider: contextProvider('dedicated-workbench'),
    },
  });

  const response = await requestApp(app, '/api/v1/engineer/mobile-workbench/context');

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.context.engineerDisplayName, 'dedicated-workbench');
  assertNoForbiddenOutput(response.body);
});

test('createApp composes Workbench context from app shortcut provider', async () => {
  const app = createApp({
    engineerMobileWorkbenchContextProvider: contextProvider('app-shortcut-workbench'),
  });

  const response = await requestApp(app, '/api/v1/engineer/mobile-workbench/context');

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'allow');
  assert.equal(response.body.context.engineerDisplayName, 'app-shortcut-workbench');
  assertNoForbiddenOutput(response.body);
});

test('createApp awaits async Workbench context shortcut provider', async () => {
  const providerCalls = [];
  const app = createApp({
    engineerMobileWorkbenchContextProvider: {
      async getCurrentContext(input) {
        providerCalls.push(input);
        return {
          engineerDisplayName: 'async-app-shortcut-workbench',
          organizationName: 'async app org',
          rawPhone: 'raw_phone_should_not_leak',
          rawLineUserId: 'line_user_should_not_leak',
          token: 'token_should_not_leak',
          secret: 'secret_should_not_leak',
        };
      },
    },
  });

  const response = await requestApp(app, '/api/v1/engineer/mobile-workbench/context');

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'allow');
  assert.equal(response.body.context.engineerDisplayName, 'async-app-shortcut-workbench');
  assert.deepEqual(providerCalls, [
    {
      organizationId: 'org_workbench_app_factory_001',
      engineerId: 'eng_workbench_app_factory_001',
      userId: 'user_workbench_app_factory_001',
      role: 'engineer',
      permissions: [
        'engineer_mobile.tasks.read',
      ],
    },
  ]);
  assertNoForbiddenOutput([response.body, providerCalls]);
});

test('createApp composes Workbench task list and detail from app shortcut task provider', async () => {
  const providerCalls = [];
  const app = createApp({
    engineerMobileWorkbenchTaskProvider: {
      listTasks(input) {
        providerCalls.push({ type: 'list', input });
        return [
          task(),
          task({
            appointmentId: 'apt_workbench_app_factory_wrong_engineer',
            assignedEngineerId: 'eng_other',
          }),
        ];
      },
      getTaskDetail(input) {
        providerCalls.push({ type: 'detail', input });
        return {
          task: task({
            appointmentId: 'apt_workbench_app_factory_detail_001',
            caseId: 'case_workbench_app_factory_detail_001',
          }),
        };
      },
    },
  });

  const listResponse = await requestApp(
    app,
    '/api/v1/engineer/mobile-workbench/tasks',
  );
  const detailResponse = await requestApp(
    app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_app_factory_detail_001',
  );

  assert.equal(listResponse.statusCode, 200);
  assert.equal(detailResponse.statusCode, 200);
  assert.deepEqual(listResponse.body.tasks.map((entry) => entry.appointmentId), [
    'apt_workbench_app_factory_task_001',
  ]);
  assert.equal(detailResponse.body.detail.caseId, 'case_workbench_app_factory_detail_001');
  assert.deepEqual(providerCalls.map((call) => call.type), ['list', 'detail']);
  assert.equal(providerCalls[0].input.organizationId, 'org_workbench_app_factory_001');
  assert.equal(providerCalls[0].input.engineerId, 'eng_workbench_app_factory_001');
  assert.equal(providerCalls[1].input.appointmentId, 'apt_workbench_app_factory_detail_001');
  assertNoForbiddenOutput([listResponse.body, detailResponse.body]);
});

test('createApp composes Workbench task list and detail from async app shortcut task provider', async () => {
  const providerCalls = [];
  const app = createApp({
    engineerMobileWorkbenchTaskProvider: {
      async listTasks(input) {
        providerCalls.push({ type: 'list', input });
        return [
          task({ caseId: 'case_workbench_app_factory_async_list_001' }),
          task({
            appointmentId: 'apt_workbench_app_factory_async_wrong_engineer',
            assignedEngineerId: 'eng_other',
          }),
        ];
      },
      async getTaskDetail(input) {
        providerCalls.push({ type: 'detail', input });
        return {
          task: task({
            appointmentId: 'apt_workbench_app_factory_async_detail_001',
            caseId: 'case_workbench_app_factory_async_detail_001',
          }),
        };
      },
    },
  });

  const listResponse = await requestApp(
    app,
    '/api/v1/engineer/mobile-workbench/tasks',
  );
  const detailResponse = await requestApp(
    app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_app_factory_async_detail_001',
  );

  assert.equal(listResponse.statusCode, 200);
  assert.equal(detailResponse.statusCode, 200);
  assert.deepEqual(listResponse.body.tasks.map((entry) => entry.caseId), [
    'case_workbench_app_factory_async_list_001',
  ]);
  assert.equal(detailResponse.body.detail.caseId, 'case_workbench_app_factory_async_detail_001');
  assert.deepEqual(providerCalls.map((call) => call.type), ['list', 'detail']);
  assert.equal(providerCalls[0].input.organizationId, 'org_workbench_app_factory_001');
  assert.equal(providerCalls[0].input.engineerId, 'eng_workbench_app_factory_001');
  assert.equal(providerCalls[1].input.appointmentId, 'apt_workbench_app_factory_async_detail_001');
  assertNoForbiddenOutput([listResponse.body, detailResponse.body, providerCalls]);
});

test('createApp composes Workbench split task list and detail shortcut providers', async () => {
  const providerCalls = [];
  const app = createApp({
    engineerMobileWorkbenchTaskListProvider: {
      providerName: 'list-provider',
      listTasks(input) {
        providerCalls.push({ type: 'list', providerName: this.providerName, input });
        return [task()];
      },
    },
    engineerMobileWorkbenchTaskDetailProvider: {
      providerName: 'detail-provider',
      getTaskDetail(input) {
        providerCalls.push({ type: 'detail', providerName: this.providerName, input });
        return {
          task: task({
            appointmentId: 'apt_workbench_app_factory_split_detail_001',
            caseId: 'case_workbench_app_factory_split_detail_001',
          }),
        };
      },
    },
  });

  const listResponse = await requestApp(
    app,
    '/api/v1/engineer/mobile-workbench/tasks',
  );
  const detailResponse = await requestApp(
    app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_app_factory_split_detail_001',
  );

  assert.equal(listResponse.statusCode, 200);
  assert.equal(detailResponse.statusCode, 200);
  assert.equal(listResponse.body.tasks[0].appointmentId, 'apt_workbench_app_factory_task_001');
  assert.equal(detailResponse.body.detail.caseId, 'case_workbench_app_factory_split_detail_001');
  assert.deepEqual(providerCalls.map((call) => `${call.type}:${call.providerName}`), [
    'list:list-provider',
    'detail:detail-provider',
  ]);
  assertNoForbiddenOutput([listResponse.body, detailResponse.body]);
});

test('createApp composes Workbench async split task list and detail shortcut providers', async () => {
  const providerCalls = [];
  const app = createApp({
    engineerMobileWorkbenchTaskListProvider: {
      providerName: 'async-list-provider',
      async listTasks(input) {
        providerCalls.push({ type: 'list', providerName: this.providerName, input });
        return [
          task({ caseId: 'case_workbench_app_factory_async_split_list_001' }),
          task({
            appointmentId: 'apt_workbench_app_factory_async_split_wrong_engineer',
            assignedEngineerId: 'eng_other',
          }),
        ];
      },
    },
    engineerMobileWorkbenchTaskDetailProvider: {
      providerName: 'async-detail-provider',
      async getTaskDetail(input) {
        providerCalls.push({ type: 'detail', providerName: this.providerName, input });
        return {
          task: task({
            appointmentId: 'apt_workbench_app_factory_async_split_detail_001',
            caseId: 'case_workbench_app_factory_async_split_detail_001',
          }),
        };
      },
    },
  });

  const listResponse = await requestApp(
    app,
    '/api/v1/engineer/mobile-workbench/tasks',
  );
  const detailResponse = await requestApp(
    app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_app_factory_async_split_detail_001',
  );

  assert.equal(listResponse.statusCode, 200);
  assert.equal(detailResponse.statusCode, 200);
  assert.deepEqual(listResponse.body.tasks.map((entry) => entry.caseId), [
    'case_workbench_app_factory_async_split_list_001',
  ]);
  assert.equal(detailResponse.body.detail.caseId, 'case_workbench_app_factory_async_split_detail_001');
  assert.deepEqual(providerCalls.map((call) => `${call.type}:${call.providerName}`), [
    'list:async-list-provider',
    'detail:async-detail-provider',
  ]);
  assert.equal(providerCalls[0].input.organizationId, 'org_workbench_app_factory_001');
  assert.equal(providerCalls[0].input.engineerId, 'eng_workbench_app_factory_001');
  assert.equal(providerCalls[1].input.organizationId, 'org_workbench_app_factory_001');
  assert.equal(providerCalls[1].input.engineerId, 'eng_workbench_app_factory_001');
  assert.equal(providerCalls[1].input.appointmentId, 'apt_workbench_app_factory_async_split_detail_001');
  assertNoForbiddenOutput([listResponse.body, detailResponse.body, providerCalls]);
});

test('createApp full Workbench task provider has priority over split shortcut providers', async () => {
  const providerCalls = [];
  const app = createApp({
    engineerMobileWorkbenchTaskProvider: {
      listTasks(input) {
        providerCalls.push({ type: 'full-list', input });
        return [task()];
      },
      getTaskDetail(input) {
        providerCalls.push({ type: 'full-detail', input });
        return {
          task: task({
            appointmentId: 'apt_workbench_app_factory_full_priority_detail_001',
            caseId: 'case_workbench_app_factory_full_priority_detail_001',
          }),
        };
      },
    },
    engineerMobileWorkbenchTaskListProvider: {
      listTasks() {
        providerCalls.push({ type: 'split-list' });
        return [task({ appointmentId: 'apt_should_not_appear' })];
      },
    },
    engineerMobileWorkbenchTaskDetailProvider: {
      getTaskDetail() {
        providerCalls.push({ type: 'split-detail' });
        return {
          task: task({
            appointmentId: 'apt_should_not_appear',
            caseId: 'case_should_not_appear',
          }),
        };
      },
    },
  });

  const listResponse = await requestApp(
    app,
    '/api/v1/engineer/mobile-workbench/tasks',
  );
  const detailResponse = await requestApp(
    app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_app_factory_full_priority_detail_001',
  );

  assert.equal(listResponse.statusCode, 200);
  assert.equal(detailResponse.statusCode, 200);
  assert.equal(listResponse.body.tasks[0].appointmentId, 'apt_workbench_app_factory_task_001');
  assert.equal(detailResponse.body.detail.caseId, 'case_workbench_app_factory_full_priority_detail_001');
  assert.deepEqual(providerCalls.map((call) => call.type), ['full-list', 'full-detail']);
  assertNoForbiddenOutput([listResponse.body, detailResponse.body]);
});

test('createApp Workbench shortcut permission denies before shortcut provider execution', async () => {
  const providerCalls = [];
  const app = createApp({
    engineerMobileWorkbenchContextProvider: {
      getCurrentContext() {
        providerCalls.push('called');
        return {
          engineerDisplayName: 'should-not-run',
        };
      },
    },
    engineerMobileWorkbenchPermission: {},
  });

  const response = await requestApp(
    app,
    '/api/v1/engineer/mobile-workbench/context',
    { permissions: [] },
  );

  assert.deepEqual(providerCalls, []);
  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, {
    status: 'deny',
    messageKey: 'engineerMobileWorkbench.unavailable',
    data: null,
  });
  assertNoForbiddenOutput(response.body);
});

test('createApp composes Workbench status operation from app shortcut provider', async () => {
  const calls = [];
  const app = createApp({
    engineerMobileWorkbenchTaskStatusProvider: {
      markTaskStatus(input) {
        calls.push(input);
        return {
          operationId: 'op_workbench_app_factory_shortcut_001',
          rawPhone: 'raw_phone_should_not_leak',
          secret: 'secret_should_not_leak',
          status: 'accepted',
          taskStatus: 'arrived',
        };
      },
    },
  });

  const response = await requestApp(
    app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_app_factory_001/arrived',
    {},
    {
      method: 'POST',
      body: {
        clientRequestId: 'client_request_workbench_app_factory_001',
        secret: 'secret_should_not_leak',
      },
    },
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(calls, [
    {
      clientRequestId: 'client_request_workbench_app_factory_001',
      engineerId: 'eng_workbench_app_factory_001',
      operation: 'arrived',
      organizationId: 'org_workbench_app_factory_001',
      taskId: 'apt_workbench_app_factory_001',
      userId: 'user_workbench_app_factory_001',
    },
  ]);
  assert.equal(response.body.operation.operationId, 'op_workbench_app_factory_shortcut_001');
  assertNoForbiddenOutput(response.body);
});

test('createApp awaits async Workbench task status shortcut provider', async () => {
  const calls = [];
  const app = createApp({
    engineerMobileWorkbenchTaskStatusProvider: {
      async markTaskStatus(input) {
        calls.push(input);
        return {
          operationId: 'op_workbench_app_factory_async_status_001',
          rawPhone: 'raw_phone_should_not_leak',
          secret: 'secret_should_not_leak',
          status: 'accepted',
          taskStatus: 'arrived',
        };
      },
    },
  });

  const response = await requestApp(
    app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_app_factory_001/arrived',
    {},
    {
      method: 'POST',
      body: {
        clientRequestId: 'client_request_workbench_app_factory_async_status_001',
        secret: 'secret_should_not_leak',
      },
    },
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(calls, [
    {
      clientRequestId: 'client_request_workbench_app_factory_async_status_001',
      engineerId: 'eng_workbench_app_factory_001',
      operation: 'arrived',
      organizationId: 'org_workbench_app_factory_001',
      taskId: 'apt_workbench_app_factory_001',
      userId: 'user_workbench_app_factory_001',
    },
  ]);
  assert.equal(response.body.operation.operationId, 'op_workbench_app_factory_async_status_001');
  assertNoForbiddenOutput([response.body, calls]);
});

test('createApp composes Workbench status operation from app status operation shortcut provider', async () => {
  const calls = [];
  const app = createApp({
    engineerMobileWorkbenchStatusOperationProvider: {
      execute(input) {
        calls.push(input);
        return {
          operationId: 'op_workbench_app_factory_status_operation_001',
          rawPhone: 'raw_phone_should_not_leak',
          secret: 'secret_should_not_leak',
          status: 'accepted',
          taskStatus: 'started',
        };
      },
    },
  });

  const response = await requestApp(
    app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_app_factory_001/started',
    {},
    {
      method: 'POST',
      body: {
        clientRequestId: 'client_request_workbench_app_factory_status_operation_001',
        secret: 'secret_should_not_leak',
      },
    },
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(calls, [
    {
      clientRequestId: 'client_request_workbench_app_factory_status_operation_001',
      engineerId: 'eng_workbench_app_factory_001',
      operation: 'started',
      organizationId: 'org_workbench_app_factory_001',
      taskId: 'apt_workbench_app_factory_001',
      userId: 'user_workbench_app_factory_001',
    },
  ]);
  assert.equal(
    response.body.operation.operationId,
    'op_workbench_app_factory_status_operation_001',
  );
  assertNoForbiddenOutput(response.body);
});

test('createApp awaits async Workbench status operation shortcut provider', async () => {
  const calls = [];
  const app = createApp({
    engineerMobileWorkbenchStatusOperationProvider: {
      async execute(input) {
        calls.push(input);
        return {
          operationId: 'op_workbench_app_factory_async_status_operation_001',
          rawPhone: 'raw_phone_should_not_leak',
          secret: 'secret_should_not_leak',
          status: 'accepted',
          taskStatus: 'started',
        };
      },
    },
  });

  const response = await requestApp(
    app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_app_factory_001/started',
    {},
    {
      method: 'POST',
      body: {
        clientRequestId: 'client_request_workbench_app_factory_async_status_operation_001',
        secret: 'secret_should_not_leak',
      },
    },
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(calls, [
    {
      clientRequestId: 'client_request_workbench_app_factory_async_status_operation_001',
      engineerId: 'eng_workbench_app_factory_001',
      operation: 'started',
      organizationId: 'org_workbench_app_factory_001',
      taskId: 'apt_workbench_app_factory_001',
      userId: 'user_workbench_app_factory_001',
    },
  ]);
  assert.equal(
    response.body.operation.operationId,
    'op_workbench_app_factory_async_status_operation_001',
  );
  assertNoForbiddenOutput([response.body, calls]);
});

test('createApp awaits async Workbench arrived provider shortcut', async () => {
  const calls = [];
  const app = createApp({
    engineerMobileWorkbenchArrivedProvider: {
      async markArrived(input) {
        calls.push(input);
        return {
          operationId: 'op_workbench_app_factory_async_arrived_provider_001',
          rawPhone: 'raw_phone_should_not_leak',
          secret: 'secret_should_not_leak',
          status: 'accepted',
          taskStatus: 'arrived',
        };
      },
    },
  });

  const response = await requestApp(
    app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_app_factory_001/arrived',
    {},
    {
      method: 'POST',
      body: {
        clientRequestId: 'client_request_workbench_app_factory_async_arrived_provider_001',
        secret: 'secret_should_not_leak',
      },
    },
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(calls, [
    {
      clientRequestId: 'client_request_workbench_app_factory_async_arrived_provider_001',
      engineerId: 'eng_workbench_app_factory_001',
      operation: 'arrived',
      organizationId: 'org_workbench_app_factory_001',
      taskId: 'apt_workbench_app_factory_001',
      userId: 'user_workbench_app_factory_001',
    },
  ]);
  assert.equal(
    response.body.operation.operationId,
    'op_workbench_app_factory_async_arrived_provider_001',
  );
  assertNoForbiddenOutput([response.body, calls]);
});

test('createApp awaits async Workbench started provider shortcut', async () => {
  const calls = [];
  const app = createApp({
    engineerMobileWorkbenchStartedProvider: {
      async markStarted(input) {
        calls.push(input);
        return {
          operationId: 'op_workbench_app_factory_async_started_provider_001',
          rawPhone: 'raw_phone_should_not_leak',
          secret: 'secret_should_not_leak',
          status: 'accepted',
          taskStatus: 'started',
        };
      },
    },
  });

  const response = await requestApp(
    app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_app_factory_001/started',
    {},
    {
      method: 'POST',
      body: {
        clientRequestId: 'client_request_workbench_app_factory_async_started_provider_001',
        secret: 'secret_should_not_leak',
      },
    },
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(calls, [
    {
      clientRequestId: 'client_request_workbench_app_factory_async_started_provider_001',
      engineerId: 'eng_workbench_app_factory_001',
      operation: 'started',
      organizationId: 'org_workbench_app_factory_001',
      taskId: 'apt_workbench_app_factory_001',
      userId: 'user_workbench_app_factory_001',
    },
  ]);
  assert.equal(
    response.body.operation.operationId,
    'op_workbench_app_factory_async_started_provider_001',
  );
  assertNoForbiddenOutput([response.body, calls]);
});

test('createApp composes Workbench completion submission from app shortcut provider', async () => {
  const calls = [];
  const app = createApp({
    engineerMobileWorkbenchCompletionSubmissionProvider: {
      createCompletionSubmission(input) {
        calls.push(input);
        return {
          receivedAt: '2026-05-21T09:30:00+08:00',
          status: 'accepted',
          submissionId: 'sub_workbench_app_factory_shortcut_001',
          rawPhone: 'raw_phone_should_not_leak',
          token: 'token_should_not_leak',
        };
      },
    },
  });

  const response = await requestApp(
    app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_app_factory_002/completion-submissions',
    {},
    {
      method: 'POST',
      body: {
        resultStatus: 'pending_parts',
        clientRequestId: 'client_request_workbench_app_factory_002',
        engineerNote: '需要待料',
        finalAppointmentId: 'final_appointment_should_not_leak',
        token: 'token_should_not_leak',
      },
    },
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(calls, [
    {
      clientRequestId: 'client_request_workbench_app_factory_002',
      customerSignatureStatus: null,
      engineerId: 'eng_workbench_app_factory_001',
      engineerNote: '需要待料',
      organizationId: 'org_workbench_app_factory_001',
      partRefs: [],
      photoRefs: [],
      resultStatus: 'pending_parts',
      signatureExceptionReason: null,
      signatureRefs: [],
      taskId: 'apt_workbench_app_factory_002',
      userId: 'user_workbench_app_factory_001',
    },
  ]);
  assert.equal(response.body.submission.submissionId, 'sub_workbench_app_factory_shortcut_001');
  assertNoForbiddenOutput(response.body);
});

test('createApp awaits async Workbench completion submission shortcut provider', async () => {
  const calls = [];
  const app = createApp({
    engineerMobileWorkbenchCompletionSubmissionProvider: {
      async createCompletionSubmission(input) {
        calls.push(input);
        return {
          receivedAt: '2026-05-21T09:45:00+08:00',
          status: 'accepted',
          submissionId: 'sub_workbench_app_factory_async_shortcut_001',
          rawPhone: 'raw_phone_should_not_leak',
          token: 'token_should_not_leak',
        };
      },
    },
  });

  const response = await requestApp(
    app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_app_factory_002/completion-submissions',
    {},
    {
      method: 'POST',
      body: {
        resultStatus: 'unable_to_complete',
        clientRequestId: 'client_request_workbench_app_factory_async_completion_002',
        engineerNote: '現場條件不符，需要重新安排',
        finalAppointmentId: 'final_appointment_should_not_leak',
        token: 'token_should_not_leak',
      },
    },
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(calls, [
    {
      clientRequestId: 'client_request_workbench_app_factory_async_completion_002',
      customerSignatureStatus: null,
      engineerId: 'eng_workbench_app_factory_001',
      engineerNote: '現場條件不符，需要重新安排',
      organizationId: 'org_workbench_app_factory_001',
      partRefs: [],
      photoRefs: [],
      resultStatus: 'unable_to_complete',
      signatureExceptionReason: null,
      signatureRefs: [],
      taskId: 'apt_workbench_app_factory_002',
      userId: 'user_workbench_app_factory_001',
    },
  ]);
  assert.equal(response.body.submission.submissionId, 'sub_workbench_app_factory_async_shortcut_001');
  assert.equal(response.body.submission.resultStatus, 'unable_to_complete');
  assertNoForbiddenOutput([response.body, calls]);
});

test('createApp awaits async Workbench submitCompletion shortcut provider alias', async () => {
  const calls = [];
  const app = createApp({
    engineerMobileWorkbenchCompletionSubmissionProvider: {
      async submitCompletion(input) {
        calls.push(input);
        return {
          receivedAt: '2026-05-21T10:05:00+08:00',
          status: 'accepted',
          submissionId: 'sub_workbench_app_factory_submit_completion_alias_001',
          rawPhone: 'raw_phone_should_not_leak',
          token: 'token_should_not_leak',
        };
      },
    },
  });

  const response = await requestApp(
    app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_app_factory_002/completion-submissions',
    {},
    {
      method: 'POST',
      body: {
        resultStatus: 'quote_required',
        clientRequestId: 'client_request_workbench_app_factory_submit_completion_alias_001',
        engineerNote: '需要報價確認',
        finalAppointmentId: 'final_appointment_should_not_leak',
        token: 'token_should_not_leak',
      },
    },
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(calls, [
    {
      clientRequestId: 'client_request_workbench_app_factory_submit_completion_alias_001',
      customerSignatureStatus: null,
      engineerId: 'eng_workbench_app_factory_001',
      engineerNote: '需要報價確認',
      organizationId: 'org_workbench_app_factory_001',
      partRefs: [],
      photoRefs: [],
      resultStatus: 'quote_required',
      signatureExceptionReason: null,
      signatureRefs: [],
      taskId: 'apt_workbench_app_factory_002',
      userId: 'user_workbench_app_factory_001',
    },
  ]);
  assert.equal(
    response.body.submission.submissionId,
    'sub_workbench_app_factory_submit_completion_alias_001',
  );
  assertNoForbiddenOutput([response.body, calls]);
});

test('createApp awaits async Workbench completion execute shortcut provider alias', async () => {
  const calls = [];
  const app = createApp({
    engineerMobileWorkbenchCompletionSubmissionProvider: {
      async execute(input) {
        calls.push(input);
        return {
          receivedAt: '2026-05-21T10:10:00+08:00',
          status: 'accepted',
          submissionId: 'sub_workbench_app_factory_completion_execute_alias_001',
          rawPhone: 'raw_phone_should_not_leak',
          token: 'token_should_not_leak',
        };
      },
    },
  });

  const response = await requestApp(
    app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_app_factory_002/completion-submissions',
    {},
    {
      method: 'POST',
      body: {
        resultStatus: 'follow_up_required',
        clientRequestId: 'client_request_workbench_app_factory_completion_execute_alias_001',
        engineerNote: '需要二次派工',
        finalAppointmentId: 'final_appointment_should_not_leak',
        token: 'token_should_not_leak',
      },
    },
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(calls, [
    {
      clientRequestId: 'client_request_workbench_app_factory_completion_execute_alias_001',
      customerSignatureStatus: null,
      engineerId: 'eng_workbench_app_factory_001',
      engineerNote: '需要二次派工',
      organizationId: 'org_workbench_app_factory_001',
      partRefs: [],
      photoRefs: [],
      resultStatus: 'follow_up_required',
      signatureExceptionReason: null,
      signatureRefs: [],
      taskId: 'apt_workbench_app_factory_002',
      userId: 'user_workbench_app_factory_001',
    },
  ]);
  assert.equal(
    response.body.submission.submissionId,
    'sub_workbench_app_factory_completion_execute_alias_001',
  );
  assertNoForbiddenOutput([response.body, calls]);
});

test('createApp dedicated Workbench options take priority over app shortcuts', async () => {
  const app = createApp({
    engineerMobileWorkbench: {
      contextProvider: contextProvider('dedicated-workbench'),
    },
    engineerMobileWorkbenchContextProvider: contextProvider('app-shortcut-workbench'),
  });

  const response = await requestApp(app, '/api/v1/engineer/mobile-workbench/context');

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.context.engineerDisplayName, 'dedicated-workbench');
  assertNoForbiddenOutput(response.body);
});

test('createApp dedicated Workbench options take priority over operation shortcuts', async () => {
  const calls = [];
  const app = createApp({
    engineerMobileWorkbench: {
      completionSubmissionProvider: {
        createCompletionSubmission(input) {
          calls.push({ type: 'dedicated-completion', input });
          return {
            status: 'accepted',
            submissionId: 'sub_dedicated_app_factory_001',
          };
        },
      },
      taskProvider: {
        listTasks(input) {
          calls.push({ type: 'dedicated-list', input });
          return [task()];
        },
      },
      taskStatusProvider: {
        markTaskStatus(input) {
          calls.push({ type: 'dedicated-status', input });
          return {
            operationId: 'op_dedicated_app_factory_001',
            status: 'accepted',
            taskStatus: 'arrived',
          };
        },
      },
    },
    engineerMobileWorkbenchCompletionSubmissionProvider: {
      createCompletionSubmission(input) {
        calls.push({ type: 'shortcut-completion', input });
        return {
          status: 'accepted',
          submissionId: 'sub_shortcut_should_not_appear',
        };
      },
    },
    engineerMobileWorkbenchTaskProvider: {
      listTasks(input) {
        calls.push({ type: 'shortcut-list', input });
        return [task({ appointmentId: 'apt_shortcut_should_not_appear' })];
      },
    },
    engineerMobileWorkbenchTaskStatusProvider: {
      markTaskStatus(input) {
        calls.push({ type: 'shortcut-status', input });
        return {
          operationId: 'op_shortcut_should_not_appear',
          status: 'accepted',
          taskStatus: 'arrived',
        };
      },
    },
  });

  const listResponse = await requestApp(app, '/api/v1/engineer/mobile-workbench/tasks');
  const statusResponse = await requestApp(
    app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_app_factory_001/arrived',
    {},
    {
      method: 'POST',
      body: {
        clientRequestId: 'client_request_dedicated_app_factory_001',
      },
    },
  );
  const completionResponse = await requestApp(
    app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_app_factory_002/completion-submissions',
    {},
    {
      method: 'POST',
      body: {
        resultStatus: 'completed',
      },
    },
  );

  assert.equal(listResponse.statusCode, 200);
  assert.equal(statusResponse.statusCode, 200);
  assert.equal(completionResponse.statusCode, 200);
  assert.equal(listResponse.body.tasks[0].appointmentId, 'apt_workbench_app_factory_task_001');
  assert.equal(statusResponse.body.operation.operationId, 'op_dedicated_app_factory_001');
  assert.equal(completionResponse.body.submission.submissionId, 'sub_dedicated_app_factory_001');
  assert.deepEqual(calls.map((call) => call.type), [
    'dedicated-list',
    'dedicated-status',
    'dedicated-completion',
  ]);
  assertNoForbiddenOutput([listResponse.body, statusResponse.body, completionResponse.body]);
});

test('createApp dedicated Workbench status options take priority over app status operation shortcut', async () => {
  const calls = [];
  const app = createApp({
    engineerMobileWorkbench: {
      taskStatusProvider: {
        markTaskStatus(input) {
          calls.push({ type: 'dedicated-status', input });
          return {
            operationId: 'op_dedicated_status_operation_priority_app_001',
            status: 'accepted',
            taskStatus: 'started',
          };
        },
      },
    },
    engineerMobileWorkbenchStatusOperationProvider: {
      execute(input) {
        calls.push({ type: 'shortcut-status-operation', input });
        return {
          operationId: 'op_shortcut_status_operation_should_not_appear',
          status: 'accepted',
          taskStatus: 'started',
        };
      },
    },
  });

  const response = await requestApp(
    app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_app_factory_001/started',
    {},
    {
      method: 'POST',
      body: {
        clientRequestId: 'client_request_dedicated_status_operation_priority_app_001',
      },
    },
  );

  assert.equal(response.statusCode, 200);
  assert.equal(
    response.body.operation.operationId,
    'op_dedicated_status_operation_priority_app_001',
  );
  assert.deepEqual(calls.map((call) => call.type), ['dedicated-status']);
  assertNoForbiddenOutput(response.body);
});

test('createApp({ engineerMobile }) remains Workbench fallback when no dedicated options exist', async () => {
  const app = createApp({
    engineerMobile: {
      contextProvider: contextProvider('engineer-mobile-fallback'),
    },
  });

  const response = await requestApp(app, '/api/v1/engineer/mobile-workbench/context');

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.context.engineerDisplayName, 'engineer-mobile-fallback');
  assertNoForbiddenOutput(response.body);
});

test('default createApp keeps Workbench context skeleton without injected options', async () => {
  const app = createApp();
  const response = await requestApp(app, '/api/v1/engineer/mobile-workbench/context');

  assert.equal(response.statusCode, 501);
  assert.equal(response.body.error.code, 'ENGINEER_MOBILE_WORKBENCH_NOT_IMPLEMENTED');
  assertNoForbiddenOutput(response.body);
});

test('app factory Workbench wiring avoids DB AI RAG provider sending and secret imports', () => {
  const appSource = fs.readFileSync(appFile, 'utf8');

  assert.equal(appSource.includes('engineerMobileWorkbench: buildEngineerMobileWorkbenchOptions(options)'), true);
  assert.equal(appSource.includes('engineerMobileWorkbenchPermission'), true);
  assert.equal(appSource.includes('engineerMobileWorkbenchStatusOperationProvider'), true);
  assert.equal(/AIProvider|externalProvider|notificationProvider/i.test(appSource), false);
  assert.equal(/AIProvider|RAG|vector/i.test(appSource), false);
  assert.equal(/DATABASE_URL|access_token|channel_secret/i.test(appSource), false);
});
