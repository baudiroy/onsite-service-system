'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  EngineerMobileWorkbenchController,
} = require('../../src/controllers/EngineerMobileWorkbenchController');
const {
  buildEngineerMobileWorkbenchTaskStatusOperationResponseAsync,
} = require('../../src/engineerMobileWorkbench/engineerMobileWorkbenchTaskStatusOperationService');
const {
  createEngineerMobileWorkbenchRouter,
} = require('../../src/routes/engineerMobileWorkbench.routes');
const { createAppRouter } = require('../../src/routes');

const repoRoot = path.resolve(__dirname, '../..');
const operationServiceFile = path.join(
  repoRoot,
  'src/engineerMobileWorkbench/engineerMobileWorkbenchTaskStatusOperationService.js'
);
const controllerFile = path.join(repoRoot, 'src/controllers/EngineerMobileWorkbenchController.js');
const routeFile = path.join(repoRoot, 'src/routes/engineerMobileWorkbench.routes.js');

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
    organizationId: 'org_workbench_status_001',
    engineerId: 'eng_workbench_status_001',
    userId: 'user_workbench_status_001',
    role: 'engineer',
    permissions: [
      'engineer_mobile.tasks.read',
      'appointment.status.mark',
    ],
    ...overrides,
  };
}

function request(overrides = {}) {
  return {
    auth: auth(),
    body: {
      clientRequestId: 'client_request_status_001',
    },
    params: {
      taskId: 'apt_workbench_status_001',
    },
    requestId: 'req_workbench_status_001',
    ...overrides,
  };
}

function operationResult(overrides = {}) {
  return {
    status: 'accepted',
    taskStatus: 'arrived',
    operationId: 'op_workbench_status_001',
    occurredAt: '2026-05-21T09:05:00+08:00',
    messageKey: 'engineer_mobile.status.arrived.accepted',
    rawPhone: 'raw_phone_should_not_leak',
    rawAddress: 'raw_address_should_not_leak',
    rawLineUserId: 'line_user_should_not_leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    internalNote: 'internal_note_should_not_leak',
    auditLog: 'audit_log_should_not_leak',
    aiRawPayload: 'ai_raw_payload_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
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

async function callRoute(router, req, pathname, method = 'post') {
  const route = findRoute(router, method, pathname);
  const res = createResponse();

  assert.ok(route, `workbench route missing: ${method.toUpperCase()} ${pathname}`);

  await route.route.stack[0].handle(req, res, () => {});
  await new Promise((resolve) => setImmediate(resolve));

  return res;
}

async function callNestedWorkbenchStatusRoute(appRouter, req, pathname) {
  const workbenchLayer = appRouter.stack.find((layer) => (
    layer.name === 'router'
    && layer.handle
    && Array.isArray(layer.handle.stack)
    && Boolean(findRoute(layer.handle, 'post', pathname))
  ));

  assert.ok(workbenchLayer, `mounted workbench status router missing: ${pathname}`);

  return callRoute(workbenchLayer.handle, req, pathname);
}

function assertNoForbiddenOutput(value) {
  const serialized = JSON.stringify(value);

  for (const forbiddenValue of [
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'internal_note_should_not_leak',
    'audit_log_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'final_appointment_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbiddenValue), false, `leaked ${forbiddenValue}`);
  }

  assert.equal(serialized.includes('"rawPhone"'), false);
  assert.equal(serialized.includes('"rawAddress"'), false);
  assert.equal(serialized.includes('"rawLineUserId"'), false);
  assert.equal(serialized.includes('"internalNote"'), false);
  assert.equal(serialized.includes('"auditLog"'), false);
  assert.equal(serialized.includes('"aiRawPayload"'), false);
  assert.equal(serialized.includes('"finalAppointmentId"'), false);
}

test('task status operation service calls injected arrived provider with scoped input', async () => {
  const calls = [];
  const response = await buildEngineerMobileWorkbenchTaskStatusOperationResponseAsync(
    request(),
    'arrived',
    {
      arrivedProvider: {
        markArrived(input) {
          calls.push(input);
          return operationResult();
        },
      },
    }
  );

  assert.deepEqual(calls, [
    {
      organizationId: 'org_workbench_status_001',
      engineerId: 'eng_workbench_status_001',
      userId: 'user_workbench_status_001',
      taskId: 'apt_workbench_status_001',
      operation: 'arrived',
      clientRequestId: 'client_request_status_001',
    },
  ]);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.operation, {
    operation: 'arrived',
    taskId: 'apt_workbench_status_001',
    status: 'accepted',
    taskStatus: 'arrived',
    operationId: 'op_workbench_status_001',
    occurredAt: '2026-05-21T09:05:00+08:00',
    messageKey: 'engineer_mobile.status.arrived.accepted',
  });
  assertNoForbiddenOutput(response.body);
});

test('task status operation service calls injected started provider and denies missing auth first', async () => {
  let called = false;
  const response = await buildEngineerMobileWorkbenchTaskStatusOperationResponseAsync(
    request({ auth: undefined }),
    'started',
    {
      startedProvider: {
        markStarted() {
          called = true;
          return operationResult({ taskStatus: 'in_progress' });
        },
      },
    }
  );

  assert.equal(called, false);
  assert.equal(response.statusCode, 403);
  assert.equal(response.body.status, 'deny');
  assertNoForbiddenOutput(response.body);
});

test('task status operation service fail-closes provider errors without leaking detail', async () => {
  const response = await buildEngineerMobileWorkbenchTaskStatusOperationResponseAsync(
    request(),
    'arrived',
    {
      taskStatusProvider: {
        markTaskStatus() {
          throw new Error('secret_should_not_leak');
        },
      },
    }
  );

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.status, 'deny');
  assertNoForbiddenOutput(response.body);
});

test('controller markArrived and markStarted keep default skeleton behavior without injected operation source', async () => {
  const controller = new EngineerMobileWorkbenchController();
  const arrivedRes = createResponse();
  const startedRes = createResponse();

  await controller.markArrived(request(), arrivedRes);
  await controller.markStarted(request(), startedRes);

  assert.deepEqual(arrivedRes.statusCalls, [501]);
  assert.deepEqual(startedRes.statusCalls, [501]);
  assert.equal(arrivedRes.jsonCalls[0].error.code, 'ENGINEER_MOBILE_WORKBENCH_NOT_IMPLEMENTED');
  assert.equal(startedRes.jsonCalls[0].error.code, 'ENGINEER_MOBILE_WORKBENCH_NOT_IMPLEMENTED');
  assertNoForbiddenOutput(arrivedRes.jsonCalls[0]);
  assertNoForbiddenOutput(startedRes.jsonCalls[0]);
});

test('controller markArrived returns injected safe operation result', async () => {
  const controller = new EngineerMobileWorkbenchController({
    engineerMobileWorkbenchTaskStatusOptions: {
      taskStatusProvider: {
        markTaskStatus() {
          return operationResult();
        },
      },
    },
  });
  const res = createResponse();

  await controller.markArrived(request(), res);

  assert.deepEqual(res.statusCalls, [200]);
  assert.equal(res.jsonCalls[0].status, 'allow');
  assert.equal(res.jsonCalls[0].operation.operation, 'arrived');
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('workbench router factory supports injected arrived and started providers without DB access', async () => {
  const calls = [];
  const router = createEngineerMobileWorkbenchRouter({
    taskStatusProvider: {
      markTaskStatus(input) {
        calls.push(input);
        return operationResult({
          taskStatus: input.operation === 'started' ? 'in_progress' : 'arrived',
        });
      },
    },
  });

  const arrivedRes = await callRoute(router, request(), '/tasks/:taskId/arrived');
  const startedRes = await callRoute(router, request(), '/tasks/:taskId/started');

  assert.deepEqual(calls.map((call) => call.operation), ['arrived', 'started']);
  assert.deepEqual(arrivedRes.statusCalls, [200]);
  assert.deepEqual(startedRes.statusCalls, [200]);
  assert.equal(arrivedRes.jsonCalls[0].operation.taskStatus, 'arrived');
  assert.equal(startedRes.jsonCalls[0].operation.taskStatus, 'in_progress');
  assertNoForbiddenOutput(arrivedRes.jsonCalls[0]);
  assertNoForbiddenOutput(startedRes.jsonCalls[0]);
});

test('central router passes engineerMobile options into mounted workbench status routes', async () => {
  const appRouter = createAppRouter({
    engineerMobile: {
      taskStatusProvider: {
        markTaskStatus(input) {
          return operationResult({
            operationId: `op_${input.operation}`,
            taskStatus: input.operation,
          });
        },
      },
    },
  });

  const arrivedRes = await callNestedWorkbenchStatusRoute(
    appRouter,
    request(),
    '/tasks/:taskId/arrived'
  );
  const startedRes = await callNestedWorkbenchStatusRoute(
    appRouter,
    request(),
    '/tasks/:taskId/started'
  );

  assert.deepEqual(arrivedRes.statusCalls, [200]);
  assert.deepEqual(startedRes.statusCalls, [200]);
  assert.equal(arrivedRes.jsonCalls[0].operation.operationId, 'op_arrived');
  assert.equal(startedRes.jsonCalls[0].operation.operationId, 'op_started');
  assertNoForbiddenOutput(arrivedRes.jsonCalls[0]);
  assertNoForbiddenOutput(startedRes.jsonCalls[0]);
});

test('workbench status operation runtime files avoid DB AI RAG provider sending and secret imports', () => {
  const serviceSource = fs.readFileSync(operationServiceFile, 'utf8');
  const controllerSource = fs.readFileSync(controllerFile, 'utf8');
  const routeSource = fs.readFileSync(routeFile, 'utf8');
  const combined = `${serviceSource}\n${controllerSource}\n${routeSource}`;

  assert.equal(/require\(['"].*db['"]\)/i.test(combined), false);
  assert.equal(/AIProvider|externalProvider|notificationProvider/i.test(combined), false);
  assert.equal(/AIProvider|RAG|vector/i.test(combined), false);
  assert.equal(/DATABASE_URL|access_token|channel_secret/i.test(combined), false);
});
