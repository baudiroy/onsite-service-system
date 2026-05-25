'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Readable, Writable } = require('node:stream');
const test = require('node:test');

const {
  createServerBootstrap,
} = require('../../src/server');

const repoRoot = path.resolve(__dirname, '../..');
const serverFile = path.join(repoRoot, 'src/server.js');

function auth(overrides = {}) {
  return {
    organizationId: 'org_workbench_server_001',
    engineerId: 'eng_workbench_server_001',
    userId: 'user_workbench_server_001',
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

function contextProvider(label, calls = []) {
  return {
    getCurrentContext(input) {
      calls.push(input);
      return {
        engineerDisplayName: label,
        organizationName: `${label} org`,
        rawPhone: 'raw_phone_should_not_leak',
        token: 'token_should_not_leak',
        secret: 'secret_should_not_leak',
      };
    },
  };
}

function task(overrides = {}) {
  return {
    caseId: 'case_workbench_server_task_001',
    appointmentId: 'apt_workbench_server_task_001',
    organizationId: 'org_workbench_server_001',
    assignedEngineerId: 'eng_workbench_server_001',
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
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    ...overrides,
  };
}

function assertNoForbiddenOutput(value) {
  const serialized = JSON.stringify(value);

  for (const forbiddenValue of [
    'raw_phone_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbiddenValue), false, `leaked ${forbiddenValue}`);
  }

  assert.equal(serialized.includes('"rawPhone"'), false);
}

test('createServerBootstrap({ engineerMobileWorkbench }) creates app with dedicated Workbench options', async () => {
  const calls = [];
  const bootstrap = createServerBootstrap({
    engineerMobileWorkbench: {
      contextProvider: contextProvider('server-workbench', calls),
    },
  });

  const response = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/context'
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.context.engineerDisplayName, 'server-workbench');
  assert.deepEqual(calls, [
    {
      organizationId: 'org_workbench_server_001',
      engineerId: 'eng_workbench_server_001',
      userId: 'user_workbench_server_001',
      role: 'engineer',
      permissions: [
        'engineer_mobile.tasks.read',
      ],
    },
  ]);
  assertNoForbiddenOutput(response.body);
});

test('createServerBootstrap composes Workbench context from server shortcut provider', async () => {
  const calls = [];
  const bootstrap = createServerBootstrap({
    engineerMobileWorkbenchContextProvider: contextProvider('server-workbench-shortcut', calls),
  });

  const response = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/context'
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.context.engineerDisplayName, 'server-workbench-shortcut');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].organizationId, 'org_workbench_server_001');
  assert.equal(calls[0].engineerId, 'eng_workbench_server_001');
  assertNoForbiddenOutput(response.body);
});

test('createServerBootstrap awaits async Workbench context shortcut provider', async () => {
  const calls = [];
  const bootstrap = createServerBootstrap({
    engineerMobileWorkbenchContextProvider: {
      async getCurrentContext(input) {
        calls.push(input);
        return {
          engineerDisplayName: 'async-server-workbench-shortcut',
          organizationName: 'async server org',
          rawPhone: 'raw_phone_should_not_leak',
          token: 'token_should_not_leak',
          secret: 'secret_should_not_leak',
        };
      },
    },
  });

  const response = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/context'
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'allow');
  assert.equal(response.body.context.engineerDisplayName, 'async-server-workbench-shortcut');
  assert.deepEqual(calls, [
    {
      organizationId: 'org_workbench_server_001',
      engineerId: 'eng_workbench_server_001',
      userId: 'user_workbench_server_001',
      role: 'engineer',
      permissions: [
        'engineer_mobile.tasks.read',
      ],
    },
  ]);
  assertNoForbiddenOutput([response.body, calls]);
});

test('createServerBootstrap composes Workbench task list and detail from server shortcut task provider', async () => {
  const providerCalls = [];
  const bootstrap = createServerBootstrap({
    engineerMobileWorkbenchTaskProvider: {
      listTasks(input) {
        providerCalls.push({ type: 'list', input });
        return [
          task(),
          task({
            appointmentId: 'apt_workbench_server_wrong_engineer',
            assignedEngineerId: 'eng_other',
          }),
        ];
      },
      getTaskDetail(input) {
        providerCalls.push({ type: 'detail', input });
        return {
          task: task({
            appointmentId: 'apt_workbench_server_detail_001',
            caseId: 'case_workbench_server_detail_001',
          }),
        };
      },
    },
  });

  const listResponse = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks'
  );
  const detailResponse = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_server_detail_001'
  );

  assert.equal(listResponse.statusCode, 200);
  assert.equal(detailResponse.statusCode, 200);
  assert.deepEqual(listResponse.body.tasks.map((entry) => entry.appointmentId), [
    'apt_workbench_server_task_001',
  ]);
  assert.equal(detailResponse.body.detail.caseId, 'case_workbench_server_detail_001');
  assert.deepEqual(providerCalls.map((call) => call.type), ['list', 'detail']);
  assert.equal(providerCalls[0].input.organizationId, 'org_workbench_server_001');
  assert.equal(providerCalls[0].input.engineerId, 'eng_workbench_server_001');
  assert.equal(providerCalls[1].input.appointmentId, 'apt_workbench_server_detail_001');
  assertNoForbiddenOutput([listResponse.body, detailResponse.body]);
});

test('createServerBootstrap composes Workbench task list and detail from async server shortcut task provider', async () => {
  const providerCalls = [];
  const bootstrap = createServerBootstrap({
    engineerMobileWorkbenchTaskProvider: {
      async listTasks(input) {
        providerCalls.push({ type: 'list', input });
        return [
          task({ caseId: 'case_workbench_server_async_list_001' }),
          task({
            appointmentId: 'apt_workbench_server_async_wrong_engineer',
            assignedEngineerId: 'eng_other',
          }),
        ];
      },
      async getTaskDetail(input) {
        providerCalls.push({ type: 'detail', input });
        return {
          task: task({
            appointmentId: 'apt_workbench_server_async_detail_001',
            caseId: 'case_workbench_server_async_detail_001',
          }),
        };
      },
    },
  });

  const listResponse = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks'
  );
  const detailResponse = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_server_async_detail_001'
  );

  assert.equal(listResponse.statusCode, 200);
  assert.equal(detailResponse.statusCode, 200);
  assert.deepEqual(listResponse.body.tasks.map((entry) => entry.caseId), [
    'case_workbench_server_async_list_001',
  ]);
  assert.equal(detailResponse.body.detail.caseId, 'case_workbench_server_async_detail_001');
  assert.deepEqual(providerCalls.map((call) => call.type), ['list', 'detail']);
  assert.equal(providerCalls[0].input.organizationId, 'org_workbench_server_001');
  assert.equal(providerCalls[0].input.engineerId, 'eng_workbench_server_001');
  assert.equal(providerCalls[1].input.appointmentId, 'apt_workbench_server_async_detail_001');
  assertNoForbiddenOutput([listResponse.body, detailResponse.body, providerCalls]);
});

test('createServerBootstrap composes Workbench split task list and detail shortcut providers', async () => {
  const providerCalls = [];
  const bootstrap = createServerBootstrap({
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
            appointmentId: 'apt_workbench_server_split_detail_001',
            caseId: 'case_workbench_server_split_detail_001',
          }),
        };
      },
    },
  });

  const listResponse = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks'
  );
  const detailResponse = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_server_split_detail_001'
  );

  assert.equal(listResponse.statusCode, 200);
  assert.equal(detailResponse.statusCode, 200);
  assert.equal(listResponse.body.tasks[0].appointmentId, 'apt_workbench_server_task_001');
  assert.equal(detailResponse.body.detail.caseId, 'case_workbench_server_split_detail_001');
  assert.deepEqual(providerCalls.map((call) => `${call.type}:${call.providerName}`), [
    'list:list-provider',
    'detail:detail-provider',
  ]);
  assertNoForbiddenOutput([listResponse.body, detailResponse.body]);
});

test('createServerBootstrap composes Workbench async split task list and detail shortcut providers', async () => {
  const providerCalls = [];
  const bootstrap = createServerBootstrap({
    engineerMobileWorkbenchTaskListProvider: {
      providerName: 'async-list-provider',
      async listTasks(input) {
        providerCalls.push({ type: 'list', providerName: this.providerName, input });
        return [
          task({ caseId: 'case_workbench_server_async_split_list_001' }),
          task({
            appointmentId: 'apt_workbench_server_async_split_wrong_engineer',
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
            appointmentId: 'apt_workbench_server_async_split_detail_001',
            caseId: 'case_workbench_server_async_split_detail_001',
          }),
        };
      },
    },
  });

  const listResponse = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks'
  );
  const detailResponse = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_server_async_split_detail_001'
  );

  assert.equal(listResponse.statusCode, 200);
  assert.equal(detailResponse.statusCode, 200);
  assert.deepEqual(listResponse.body.tasks.map((entry) => entry.caseId), [
    'case_workbench_server_async_split_list_001',
  ]);
  assert.equal(detailResponse.body.detail.caseId, 'case_workbench_server_async_split_detail_001');
  assert.deepEqual(providerCalls.map((call) => `${call.type}:${call.providerName}`), [
    'list:async-list-provider',
    'detail:async-detail-provider',
  ]);
  assert.equal(providerCalls[0].input.organizationId, 'org_workbench_server_001');
  assert.equal(providerCalls[0].input.engineerId, 'eng_workbench_server_001');
  assert.equal(providerCalls[1].input.organizationId, 'org_workbench_server_001');
  assert.equal(providerCalls[1].input.engineerId, 'eng_workbench_server_001');
  assert.equal(providerCalls[1].input.appointmentId, 'apt_workbench_server_async_split_detail_001');
  assertNoForbiddenOutput([listResponse.body, detailResponse.body, providerCalls]);
});

test('createServerBootstrap full Workbench task provider has priority over split shortcut providers', async () => {
  const providerCalls = [];
  const bootstrap = createServerBootstrap({
    engineerMobileWorkbenchTaskProvider: {
      listTasks(input) {
        providerCalls.push({ type: 'full-list', input });
        return [task()];
      },
      getTaskDetail(input) {
        providerCalls.push({ type: 'full-detail', input });
        return {
          task: task({
            appointmentId: 'apt_workbench_server_full_priority_detail_001',
            caseId: 'case_workbench_server_full_priority_detail_001',
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
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks'
  );
  const detailResponse = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_server_full_priority_detail_001'
  );

  assert.equal(listResponse.statusCode, 200);
  assert.equal(detailResponse.statusCode, 200);
  assert.equal(listResponse.body.tasks[0].appointmentId, 'apt_workbench_server_task_001');
  assert.equal(detailResponse.body.detail.caseId, 'case_workbench_server_full_priority_detail_001');
  assert.deepEqual(providerCalls.map((call) => call.type), ['full-list', 'full-detail']);
  assertNoForbiddenOutput([listResponse.body, detailResponse.body]);
});

test('server Workbench shortcut permission denies missing permission before shortcut provider execution', async () => {
  const calls = [];
  const bootstrap = createServerBootstrap({
    engineerMobileWorkbenchContextProvider: contextProvider('should-not-run', calls),
    engineerMobileWorkbenchPermission: {},
  });

  const response = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/context',
    {
      permissions: [],
    }
  );

  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, {
    data: null,
    messageKey: 'engineerMobileWorkbench.unavailable',
    status: 'deny',
  });
  assert.deepEqual(calls, []);
  assertNoForbiddenOutput(response.body);
});

test('server Workbench shortcut permission allows compatible engineer context', async () => {
  const calls = [];
  const bootstrap = createServerBootstrap({
    engineerMobileWorkbenchContextProvider: contextProvider('server-workbench-permission', calls),
    engineerMobileWorkbenchPermission: {},
  });

  const response = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/context',
    {
      permissions: ['engineer_mobile.workbench.access'],
    }
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.context.engineerDisplayName, 'server-workbench-permission');
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].permissions, ['engineer_mobile.workbench.access']);
  assertNoForbiddenOutput(response.body);
});

test('createServerBootstrap composes Workbench status operation from server shortcut provider', async () => {
  const calls = [];
  const bootstrap = createServerBootstrap({
    engineerMobileWorkbenchTaskStatusProvider: {
      markTaskStatus(input) {
        calls.push(input);
        return {
          operationId: 'op_workbench_server_shortcut_001',
          rawPhone: 'raw_phone_should_not_leak',
          secret: 'secret_should_not_leak',
          status: 'accepted',
          taskStatus: 'arrived',
        };
      },
    },
  });

  const response = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_server_001/arrived',
    {},
    {
      method: 'POST',
      body: {
        clientRequestId: 'client_request_workbench_server_001',
        secret: 'secret_should_not_leak',
      },
    },
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(calls, [
    {
      clientRequestId: 'client_request_workbench_server_001',
      engineerId: 'eng_workbench_server_001',
      operation: 'arrived',
      organizationId: 'org_workbench_server_001',
      taskId: 'apt_workbench_server_001',
      userId: 'user_workbench_server_001',
    },
  ]);
  assert.equal(response.body.operation.operationId, 'op_workbench_server_shortcut_001');
  assertNoForbiddenOutput(response.body);
});

test('createServerBootstrap awaits async Workbench task status shortcut provider', async () => {
  const calls = [];
  const bootstrap = createServerBootstrap({
    engineerMobileWorkbenchTaskStatusProvider: {
      async markTaskStatus(input) {
        calls.push(input);
        return {
          operationId: 'op_workbench_server_async_status_001',
          rawPhone: 'raw_phone_should_not_leak',
          secret: 'secret_should_not_leak',
          status: 'accepted',
          taskStatus: 'arrived',
        };
      },
    },
  });

  const response = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_server_001/arrived',
    {},
    {
      method: 'POST',
      body: {
        clientRequestId: 'client_request_workbench_server_async_status_001',
        secret: 'secret_should_not_leak',
      },
    },
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(calls, [
    {
      clientRequestId: 'client_request_workbench_server_async_status_001',
      engineerId: 'eng_workbench_server_001',
      operation: 'arrived',
      organizationId: 'org_workbench_server_001',
      taskId: 'apt_workbench_server_001',
      userId: 'user_workbench_server_001',
    },
  ]);
  assert.equal(response.body.operation.operationId, 'op_workbench_server_async_status_001');
  assertNoForbiddenOutput([response.body, calls]);
});

test('createServerBootstrap composes Workbench status operation from server status operation shortcut provider', async () => {
  const calls = [];
  const bootstrap = createServerBootstrap({
    engineerMobileWorkbenchStatusOperationProvider: {
      execute(input) {
        calls.push(input);
        return {
          operationId: 'op_workbench_server_status_operation_001',
          rawPhone: 'raw_phone_should_not_leak',
          secret: 'secret_should_not_leak',
          status: 'accepted',
          taskStatus: 'started',
        };
      },
    },
  });

  const response = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_server_001/started',
    {},
    {
      method: 'POST',
      body: {
        clientRequestId: 'client_request_workbench_server_status_operation_001',
        secret: 'secret_should_not_leak',
      },
    },
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(calls, [
    {
      clientRequestId: 'client_request_workbench_server_status_operation_001',
      engineerId: 'eng_workbench_server_001',
      operation: 'started',
      organizationId: 'org_workbench_server_001',
      taskId: 'apt_workbench_server_001',
      userId: 'user_workbench_server_001',
    },
  ]);
  assert.equal(response.body.operation.operationId, 'op_workbench_server_status_operation_001');
  assertNoForbiddenOutput(response.body);
});

test('createServerBootstrap awaits async Workbench status operation shortcut provider', async () => {
  const calls = [];
  const bootstrap = createServerBootstrap({
    engineerMobileWorkbenchStatusOperationProvider: {
      async execute(input) {
        calls.push(input);
        return {
          operationId: 'op_workbench_server_async_status_operation_001',
          rawPhone: 'raw_phone_should_not_leak',
          secret: 'secret_should_not_leak',
          status: 'accepted',
          taskStatus: 'started',
        };
      },
    },
  });

  const response = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_server_001/started',
    {},
    {
      method: 'POST',
      body: {
        clientRequestId: 'client_request_workbench_server_async_status_operation_001',
        secret: 'secret_should_not_leak',
      },
    },
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(calls, [
    {
      clientRequestId: 'client_request_workbench_server_async_status_operation_001',
      engineerId: 'eng_workbench_server_001',
      operation: 'started',
      organizationId: 'org_workbench_server_001',
      taskId: 'apt_workbench_server_001',
      userId: 'user_workbench_server_001',
    },
  ]);
  assert.equal(response.body.operation.operationId, 'op_workbench_server_async_status_operation_001');
  assertNoForbiddenOutput([response.body, calls]);
});

test('createServerBootstrap awaits async Workbench arrived provider shortcut', async () => {
  const calls = [];
  const bootstrap = createServerBootstrap({
    engineerMobileWorkbenchArrivedProvider: {
      async markArrived(input) {
        calls.push(input);
        return {
          operationId: 'op_workbench_server_async_arrived_provider_001',
          rawPhone: 'raw_phone_should_not_leak',
          secret: 'secret_should_not_leak',
          status: 'accepted',
          taskStatus: 'arrived',
        };
      },
    },
  });

  const response = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_server_001/arrived',
    {},
    {
      method: 'POST',
      body: {
        clientRequestId: 'client_request_workbench_server_async_arrived_provider_001',
        secret: 'secret_should_not_leak',
      },
    },
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(calls, [
    {
      clientRequestId: 'client_request_workbench_server_async_arrived_provider_001',
      engineerId: 'eng_workbench_server_001',
      operation: 'arrived',
      organizationId: 'org_workbench_server_001',
      taskId: 'apt_workbench_server_001',
      userId: 'user_workbench_server_001',
    },
  ]);
  assert.equal(
    response.body.operation.operationId,
    'op_workbench_server_async_arrived_provider_001',
  );
  assertNoForbiddenOutput([response.body, calls]);
});

test('createServerBootstrap awaits async Workbench started provider shortcut', async () => {
  const calls = [];
  const bootstrap = createServerBootstrap({
    engineerMobileWorkbenchStartedProvider: {
      async markStarted(input) {
        calls.push(input);
        return {
          operationId: 'op_workbench_server_async_started_provider_001',
          rawPhone: 'raw_phone_should_not_leak',
          secret: 'secret_should_not_leak',
          status: 'accepted',
          taskStatus: 'started',
        };
      },
    },
  });

  const response = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_server_001/started',
    {},
    {
      method: 'POST',
      body: {
        clientRequestId: 'client_request_workbench_server_async_started_provider_001',
        secret: 'secret_should_not_leak',
      },
    },
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(calls, [
    {
      clientRequestId: 'client_request_workbench_server_async_started_provider_001',
      engineerId: 'eng_workbench_server_001',
      operation: 'started',
      organizationId: 'org_workbench_server_001',
      taskId: 'apt_workbench_server_001',
      userId: 'user_workbench_server_001',
    },
  ]);
  assert.equal(
    response.body.operation.operationId,
    'op_workbench_server_async_started_provider_001',
  );
  assertNoForbiddenOutput([response.body, calls]);
});

test('createServerBootstrap composes Workbench completion submission from server shortcut provider', async () => {
  const calls = [];
  const bootstrap = createServerBootstrap({
    engineerMobileWorkbenchCompletionSubmissionProvider: {
      createCompletionSubmission(input) {
        calls.push(input);
        return {
          receivedAt: '2026-05-21T09:30:00+08:00',
          status: 'accepted',
          submissionId: 'sub_workbench_server_shortcut_001',
          rawPhone: 'raw_phone_should_not_leak',
          token: 'token_should_not_leak',
        };
      },
    },
  });

  const response = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_server_002/completion-submissions',
    {},
    {
      method: 'POST',
      body: {
        resultStatus: 'pending_parts',
        clientRequestId: 'client_request_workbench_server_002',
        engineerNote: '需要待料',
        finalAppointmentId: 'final_appointment_should_not_leak',
        token: 'token_should_not_leak',
      },
    },
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(calls, [
    {
      clientRequestId: 'client_request_workbench_server_002',
      customerSignatureStatus: null,
      engineerId: 'eng_workbench_server_001',
      engineerNote: '需要待料',
      organizationId: 'org_workbench_server_001',
      partRefs: [],
      photoRefs: [],
      resultStatus: 'pending_parts',
      signatureExceptionReason: null,
      signatureRefs: [],
      taskId: 'apt_workbench_server_002',
      userId: 'user_workbench_server_001',
    },
  ]);
  assert.equal(response.body.submission.submissionId, 'sub_workbench_server_shortcut_001');
  assertNoForbiddenOutput(response.body);
});

test('createServerBootstrap awaits async Workbench completion submission shortcut provider', async () => {
  const calls = [];
  const bootstrap = createServerBootstrap({
    engineerMobileWorkbenchCompletionSubmissionProvider: {
      async createCompletionSubmission(input) {
        calls.push(input);
        return {
          receivedAt: '2026-05-21T09:45:00+08:00',
          status: 'accepted',
          submissionId: 'sub_workbench_server_async_shortcut_001',
          rawPhone: 'raw_phone_should_not_leak',
          token: 'token_should_not_leak',
        };
      },
    },
  });

  const response = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_server_002/completion-submissions',
    {},
    {
      method: 'POST',
      body: {
        resultStatus: 'unable_to_complete',
        clientRequestId: 'client_request_workbench_server_async_completion_002',
        engineerNote: '現場條件不符，需要重新安排',
        finalAppointmentId: 'final_appointment_should_not_leak',
        token: 'token_should_not_leak',
      },
    },
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(calls, [
    {
      clientRequestId: 'client_request_workbench_server_async_completion_002',
      customerSignatureStatus: null,
      engineerId: 'eng_workbench_server_001',
      engineerNote: '現場條件不符，需要重新安排',
      organizationId: 'org_workbench_server_001',
      partRefs: [],
      photoRefs: [],
      resultStatus: 'unable_to_complete',
      signatureExceptionReason: null,
      signatureRefs: [],
      taskId: 'apt_workbench_server_002',
      userId: 'user_workbench_server_001',
    },
  ]);
  assert.equal(response.body.submission.submissionId, 'sub_workbench_server_async_shortcut_001');
  assert.equal(response.body.submission.resultStatus, 'unable_to_complete');
  assertNoForbiddenOutput([response.body, calls]);
});

test('createServerBootstrap awaits async Workbench submitCompletion shortcut provider alias', async () => {
  const calls = [];
  const bootstrap = createServerBootstrap({
    engineerMobileWorkbenchCompletionSubmissionProvider: {
      async submitCompletion(input) {
        calls.push(input);
        return {
          receivedAt: '2026-05-21T10:05:00+08:00',
          status: 'accepted',
          submissionId: 'sub_workbench_server_submit_completion_alias_001',
          rawPhone: 'raw_phone_should_not_leak',
          token: 'token_should_not_leak',
        };
      },
    },
  });

  const response = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_server_002/completion-submissions',
    {},
    {
      method: 'POST',
      body: {
        resultStatus: 'quote_required',
        clientRequestId: 'client_request_workbench_server_submit_completion_alias_001',
        engineerNote: '需要報價確認',
        finalAppointmentId: 'final_appointment_should_not_leak',
        token: 'token_should_not_leak',
      },
    },
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(calls, [
    {
      clientRequestId: 'client_request_workbench_server_submit_completion_alias_001',
      customerSignatureStatus: null,
      engineerId: 'eng_workbench_server_001',
      engineerNote: '需要報價確認',
      organizationId: 'org_workbench_server_001',
      partRefs: [],
      photoRefs: [],
      resultStatus: 'quote_required',
      signatureExceptionReason: null,
      signatureRefs: [],
      taskId: 'apt_workbench_server_002',
      userId: 'user_workbench_server_001',
    },
  ]);
  assert.equal(
    response.body.submission.submissionId,
    'sub_workbench_server_submit_completion_alias_001',
  );
  assertNoForbiddenOutput([response.body, calls]);
});

test('createServerBootstrap awaits async Workbench completion execute shortcut provider alias', async () => {
  const calls = [];
  const bootstrap = createServerBootstrap({
    engineerMobileWorkbenchCompletionSubmissionProvider: {
      async execute(input) {
        calls.push(input);
        return {
          receivedAt: '2026-05-21T10:10:00+08:00',
          status: 'accepted',
          submissionId: 'sub_workbench_server_completion_execute_alias_001',
          rawPhone: 'raw_phone_should_not_leak',
          token: 'token_should_not_leak',
        };
      },
    },
  });

  const response = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_server_002/completion-submissions',
    {},
    {
      method: 'POST',
      body: {
        resultStatus: 'follow_up_required',
        clientRequestId: 'client_request_workbench_server_completion_execute_alias_001',
        engineerNote: '需要二次派工',
        finalAppointmentId: 'final_appointment_should_not_leak',
        token: 'token_should_not_leak',
      },
    },
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(calls, [
    {
      clientRequestId: 'client_request_workbench_server_completion_execute_alias_001',
      customerSignatureStatus: null,
      engineerId: 'eng_workbench_server_001',
      engineerNote: '需要二次派工',
      organizationId: 'org_workbench_server_001',
      partRefs: [],
      photoRefs: [],
      resultStatus: 'follow_up_required',
      signatureExceptionReason: null,
      signatureRefs: [],
      taskId: 'apt_workbench_server_002',
      userId: 'user_workbench_server_001',
    },
  ]);
  assert.equal(
    response.body.submission.submissionId,
    'sub_workbench_server_completion_execute_alias_001',
  );
  assertNoForbiddenOutput([response.body, calls]);
});

test('server dedicated Workbench options take priority over engineerMobile fallback', async () => {
  const bootstrap = createServerBootstrap({
    engineerMobile: {
      contextProvider: contextProvider('engineer-mobile-fallback'),
    },
    engineerMobileWorkbench: {
      contextProvider: contextProvider('server-workbench'),
    },
  });

  const response = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/context'
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.context.engineerDisplayName, 'server-workbench');
  assertNoForbiddenOutput(response.body);
});

test('server dedicated Workbench options take priority over operation shortcuts', async () => {
  const calls = [];
  const bootstrap = createServerBootstrap({
    engineerMobileWorkbench: {
      completionSubmissionProvider: {
        createCompletionSubmission(input) {
          calls.push({ type: 'dedicated-completion', input });
          return {
            status: 'accepted',
            submissionId: 'sub_dedicated_server_001',
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
            operationId: 'op_dedicated_server_001',
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

  const listResponse = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks'
  );
  const statusResponse = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_server_001/arrived',
    {},
    {
      method: 'POST',
      body: {
        clientRequestId: 'client_request_dedicated_server_001',
      },
    }
  );
  const completionResponse = await requestApp(
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_server_002/completion-submissions',
    {},
    {
      method: 'POST',
      body: {
        resultStatus: 'completed',
      },
    }
  );

  assert.equal(listResponse.statusCode, 200);
  assert.equal(statusResponse.statusCode, 200);
  assert.equal(completionResponse.statusCode, 200);
  assert.equal(listResponse.body.tasks[0].appointmentId, 'apt_workbench_server_task_001');
  assert.equal(statusResponse.body.operation.operationId, 'op_dedicated_server_001');
  assert.equal(completionResponse.body.submission.submissionId, 'sub_dedicated_server_001');
  assert.deepEqual(calls.map((call) => call.type), [
    'dedicated-list',
    'dedicated-status',
    'dedicated-completion',
  ]);
  assertNoForbiddenOutput([listResponse.body, statusResponse.body, completionResponse.body]);
});

test('server dedicated Workbench status options take priority over server status operation shortcut', async () => {
  const calls = [];
  const bootstrap = createServerBootstrap({
    engineerMobileWorkbench: {
      taskStatusProvider: {
        markTaskStatus(input) {
          calls.push({ type: 'dedicated-status', input });
          return {
            operationId: 'op_dedicated_status_operation_priority_server_001',
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
    bootstrap.app,
    '/api/v1/engineer/mobile-workbench/tasks/apt_workbench_server_001/started',
    {},
    {
      method: 'POST',
      body: {
        clientRequestId: 'client_request_dedicated_status_operation_priority_server_001',
      },
    }
  );

  assert.equal(response.statusCode, 200);
  assert.equal(
    response.body.operation.operationId,
    'op_dedicated_status_operation_priority_server_001'
  );
  assert.deepEqual(calls.map((call) => call.type), ['dedicated-status']);
  assertNoForbiddenOutput(response.body);
});

test('server app option priority bypasses Engineer Mobile Workbench options', () => {
  const app = { sentinel: 'custom-app' };
  const bootstrap = createServerBootstrap({
    app,
    engineerMobileWorkbench: {
      contextProvider: contextProvider('should-not-be-used'),
    },
  });

  assert.equal(bootstrap.app, app);
});

test('server Workbench option wiring avoids DB AI RAG provider sending and secret imports', () => {
  const serverSource = fs.readFileSync(serverFile, 'utf8');

  assert.equal(serverSource.includes("hasOwnOption(options, 'engineerMobileWorkbench')"), true);
  assert.equal(serverSource.includes('engineerMobileWorkbenchContextProvider'), true);
  assert.equal(serverSource.includes('engineerMobileWorkbenchCompletionSubmissionProvider'), true);
  assert.equal(serverSource.includes('engineerMobileWorkbenchStatusOperationProvider'), true);
  assert.equal(serverSource.includes('engineerMobileWorkbenchPermission'), true);
  assert.equal(/AIProvider|externalProvider|notificationProvider/i.test(serverSource), false);
  assert.equal(/AIProvider|RAG|vector/i.test(serverSource), false);
  assert.equal(/DATABASE_URL|access_token|channel_secret/i.test(serverSource), false);
});
