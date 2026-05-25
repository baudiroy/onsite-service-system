'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  EngineerMobileWorkbenchController,
} = require('../../src/controllers/EngineerMobileWorkbenchController');
const {
  createEngineerMobileWorkbenchRouter,
} = require('../../src/routes/engineerMobileWorkbench.routes');
const { createAppRouter } = require('../../src/routes');

const repoRoot = path.resolve(__dirname, '../..');
const controllerFile = path.join(repoRoot, 'src/controllers/EngineerMobileWorkbenchController.js');
const routeFile = path.join(repoRoot, 'src/routes/engineerMobileWorkbench.routes.js');
const routeIndexFile = path.join(repoRoot, 'src/routes/index.js');

function createResponse() {
  return {
    statusCalls: [],
    jsonCalls: [],
    status(statusCode) {
      this.statusCalls.push(statusCode);
      return this;
    },
    json(body) {
      this.jsonCalls.push(body);
      return this;
    },
  };
}

function auth(overrides = {}) {
  return {
    organizationId: 'org_workbench_task_list_001',
    engineerId: 'eng_workbench_task_list_001',
    userId: 'user_workbench_task_list_001',
    role: 'engineer',
    permissions: ['engineer_mobile.tasks.read'],
    ...overrides,
  };
}

function task(overrides = {}) {
  return {
    caseId: 'case_workbench_allowed_001',
    appointmentId: 'apt_workbench_allowed_001',
    organizationId: 'org_workbench_task_list_001',
    assignedEngineerId: 'eng_workbench_task_list_001',
    scheduledStart: '2026-05-21T09:00:00+08:00',
    scheduledEnd: '2026-05-21T10:00:00+08:00',
    status: 'confirmed',
    customerNameMasked: '王○○',
    customerPhoneMasked: '09xx-xxx-123',
    addressSummary: '台北市信義區',
    productSummary: '冷氣',
    issueSummary: '不冷',
    serviceType: 'repair',
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
    finalAppointmentId: 'final_appointment_should_not_leak',
    ...overrides,
  };
}

function request(overrides = {}) {
  return {
    auth: auth(),
    query: {},
    requestId: 'req_workbench_task_list_001',
    ...overrides,
  };
}

function findRoute(router, method, pathname) {
  return router.stack.find((layer) => (
    layer.route
    && layer.route.path === pathname
    && layer.route.methods[method.toLowerCase()]
  ));
}

async function callRoute(router, req, pathname = '/tasks') {
  const route = findRoute(router, 'get', pathname);
  const res = createResponse();

  assert.ok(route, `workbench route missing: ${pathname}`);

  await route.route.stack[0].handle(req, res, () => {});
  await new Promise((resolve) => setImmediate(resolve));

  return res;
}

async function callNestedWorkbenchTaskRoute(appRouter, req) {
  const workbenchLayer = appRouter.stack.find((layer) => (
    layer.name === 'router'
    && layer.handle
    && Array.isArray(layer.handle.stack)
    && Boolean(findRoute(layer.handle, 'get', '/tasks'))
  ));

  assert.ok(workbenchLayer, 'mounted workbench router missing');

  return callRoute(workbenchLayer.handle, req);
}

async function callNestedWorkbenchTaskDetailRoute(appRouter, req) {
  const workbenchLayer = appRouter.stack.find((layer) => (
    layer.name === 'router'
    && layer.handle
    && Array.isArray(layer.handle.stack)
    && Boolean(findRoute(layer.handle, 'get', '/tasks/:taskId'))
  ));

  assert.ok(workbenchLayer, 'mounted workbench detail router missing');

  return callRoute(workbenchLayer.handle, req, '/tasks/:taskId');
}

function assertNoForbiddenOutput(value) {
  const serialized = JSON.stringify(value);

  for (const forbiddenValue of [
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
    'final_appointment_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbiddenValue), false, `leaked ${forbiddenValue}`);
  }

  assert.equal(serialized.includes('"rawPhone"'), false);
  assert.equal(serialized.includes('"rawAddress"'), false);
  assert.equal(serialized.includes('"rawLineUserId"'), false);
  assert.equal(serialized.includes('"finalAppointmentId"'), false);
}

test('controller listTasks keeps default skeleton behavior without injected task source', async () => {
  const controller = new EngineerMobileWorkbenchController();
  const res = createResponse();

  await controller.listTasks(request(), res);

  assert.deepEqual(res.statusCalls, [501]);
  assert.equal(res.jsonCalls[0].error.code, 'ENGINEER_MOBILE_WORKBENCH_NOT_IMPLEMENTED');
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('controller listTasks returns scoped safe tasks with injected read model', async () => {
  const controller = new EngineerMobileWorkbenchController({
    engineerMobileTaskListOptions: {
      readModel: {
        tasks: [
          task({ caseId: 'case_workbench_allowed_001' }),
          task({ caseId: 'case_workbench_wrong_org', organizationId: 'org_other' }),
          task({ caseId: 'case_workbench_wrong_engineer', assignedEngineerId: 'eng_other' }),
        ],
      },
    },
  });
  const res = createResponse();

  await controller.listTasks(request(), res);

  assert.deepEqual(res.statusCalls, [200]);
  assert.equal(res.jsonCalls[0].status, 'allow');
  assert.deepEqual(res.jsonCalls[0].tasks.map((entry) => entry.caseId), [
    'case_workbench_allowed_001',
  ]);
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('controller listTasks safely denies missing engineer auth before reading task source', async () => {
  let called = false;
  const controller = new EngineerMobileWorkbenchController({
    engineerMobileTaskListOptions: {
      taskProvider: {
        listTasks() {
          called = true;
          return [task()];
        },
      },
    },
  });
  const res = createResponse();

  await controller.listTasks({ requestId: 'req_missing_auth' }, res);

  assert.equal(called, false);
  assert.deepEqual(res.statusCalls, [403]);
  assert.equal(res.jsonCalls[0].status, 'deny');
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('controller getTaskDetail maps workbench taskId to safe injected detail response', async () => {
  const controller = new EngineerMobileWorkbenchController({
    engineerMobileTaskDetailOptions: {
      readModel: {
        tasks: [
          task({
            appointmentId: 'apt_workbench_detail_allowed',
            caseId: 'case_workbench_detail_allowed',
            evidenceRefs: [
              {
                id: 'file_ref_safe_001',
                type: 'photo',
                label: '完工照片'
              },
              {
                id: 'file_ref_secret_should_not_pass',
                type: 'photo',
                label: 'internal',
                rawBinary: 'raw_binary_should_not_leak'
              }
            ],
            siteNoteSafe: '請由管理室引導',
          }),
          task({
            appointmentId: 'apt_workbench_detail_wrong_engineer',
            assignedEngineerId: 'eng_other',
          }),
        ],
      },
    },
  });
  const res = createResponse();

  await controller.getTaskDetail(request({
    params: {
      taskId: 'apt_workbench_detail_allowed',
    },
  }), res);

  assert.deepEqual(res.statusCalls, [200]);
  assert.equal(res.jsonCalls[0].status, 'allow');
  assert.equal(res.jsonCalls[0].detail.appointmentId, 'apt_workbench_detail_allowed');
  assert.equal(res.jsonCalls[0].detail.caseId, 'case_workbench_detail_allowed');
  assert.equal(res.jsonCalls[0].detail.siteNoteSafe, '請由管理室引導');
  assert.deepEqual(res.jsonCalls[0].detail.evidenceRefs[0], {
    id: 'file_ref_safe_001',
    label: '完工照片',
    type: 'photo',
  });
  assert.equal(res.jsonCalls[0].detail.evidenceRefs[1].rawBinary, undefined);
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('controller getTaskDetail safely denies missing auth before reading task source', async () => {
  let called = false;
  const controller = new EngineerMobileWorkbenchController({
    engineerMobileTaskDetailOptions: {
      taskProvider: {
        getTaskDetail() {
          called = true;
          return {
            task: task({ appointmentId: 'apt_workbench_detail_allowed' }),
          };
        },
      },
    },
  });
  const res = createResponse();

  await controller.getTaskDetail({
    params: {
      taskId: 'apt_workbench_detail_allowed',
    },
    requestId: 'req_detail_missing_auth',
  }, res);

  assert.equal(called, false);
  assert.deepEqual(res.statusCalls, [403]);
  assert.equal(res.jsonCalls[0].status, 'deny');
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('workbench router factory supports injected taskProvider without DB access', async () => {
  const providerCalls = [];
  const router = createEngineerMobileWorkbenchRouter({
    taskProvider: {
      listTasks(input) {
        providerCalls.push(input);
        return [
          task({ caseId: 'case_workbench_route_allowed' }),
          task({ caseId: 'case_workbench_route_wrong_engineer', assignedEngineerId: 'eng_other' }),
        ];
      },
    },
  });
  const res = await callRoute(router, request({
    query: {
      from: '2026-05-21',
      to: '2026-05-22',
    },
  }));

  assert.equal(providerCalls.length, 1);
  assert.deepEqual(providerCalls[0], {
    organizationId: 'org_workbench_task_list_001',
    engineerId: 'eng_workbench_task_list_001',
    dateRange: {
      from: '2026-05-21',
      to: '2026-05-22',
    },
  });
  assert.deepEqual(res.statusCalls, [200]);
  assert.deepEqual(res.jsonCalls[0].tasks.map((entry) => entry.caseId), [
    'case_workbench_route_allowed',
  ]);
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('workbench router factory supports injected task detail without DB access', async () => {
  const providerCalls = [];
  const router = createEngineerMobileWorkbenchRouter({
    taskProvider: {
      getTaskDetail(input) {
        providerCalls.push(input);
        return {
          task: task({
            appointmentId: 'apt_workbench_route_detail_allowed',
            caseId: 'case_workbench_route_detail_allowed',
          }),
        };
      },
    },
  });
  const res = await callRoute(router, request({
    params: {
      taskId: 'apt_workbench_route_detail_allowed',
    },
  }), '/tasks/:taskId');

  assert.equal(providerCalls.length, 1);
  assert.deepEqual(providerCalls[0], {
    appointmentId: 'apt_workbench_route_detail_allowed',
    engineerId: 'eng_workbench_task_list_001',
    organizationId: 'org_workbench_task_list_001',
  });
  assert.deepEqual(res.statusCalls, [200]);
  assert.equal(res.jsonCalls[0].detail.caseId, 'case_workbench_route_detail_allowed');
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('central router passes engineerMobile options into mounted workbench task list', async () => {
  const appRouter = createAppRouter({
    engineerMobile: {
      readModel: {
        tasks: [task({ caseId: 'case_workbench_index_allowed' })],
      },
    },
  });

  const res = await callNestedWorkbenchTaskRoute(appRouter, request());

  assert.deepEqual(res.statusCalls, [200]);
  assert.deepEqual(res.jsonCalls[0].tasks.map((entry) => entry.caseId), [
    'case_workbench_index_allowed',
  ]);
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('central router passes engineerMobile options into mounted workbench task detail', async () => {
  const appRouter = createAppRouter({
    engineerMobile: {
      readModel: {
        tasks: [
          task({
            appointmentId: 'apt_workbench_index_detail_allowed',
            caseId: 'case_workbench_index_detail_allowed',
          }),
        ],
      },
    },
  });

  const res = await callNestedWorkbenchTaskDetailRoute(appRouter, request({
    params: {
      taskId: 'apt_workbench_index_detail_allowed',
    },
  }));

  assert.deepEqual(res.statusCalls, [200]);
  assert.equal(res.jsonCalls[0].detail.caseId, 'case_workbench_index_detail_allowed');
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('workbench task-list runtime files avoid DB provider AI provider and secret runtime imports', () => {
  const controllerSource = fs.readFileSync(controllerFile, 'utf8');
  const routeSource = fs.readFileSync(routeFile, 'utf8');
  const routeIndexSource = fs.readFileSync(routeIndexFile, 'utf8');
  const combined = `${controllerSource}\n${routeSource}\n${routeIndexSource}`;

  assert.equal(/require\(['"].*db['"]\)/i.test(combined), false);
  assert.equal(/AIProvider|externalProvider|notificationProvider/i.test(controllerSource), false);
  assert.equal(/AIProvider|externalProvider|notificationProvider/i.test(routeSource), false);
  assert.equal(/AIProvider|RAG|vector/i.test(combined), false);
  assert.equal(/DATABASE_URL|access_token|channel_secret/i.test(combined), false);
});
