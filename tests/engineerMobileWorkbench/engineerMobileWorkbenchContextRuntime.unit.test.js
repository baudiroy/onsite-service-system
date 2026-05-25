'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  EngineerMobileWorkbenchController,
} = require('../../src/controllers/EngineerMobileWorkbenchController');
const {
  buildEngineerMobileWorkbenchContextResponseAsync,
} = require('../../src/engineerMobileWorkbench/engineerMobileWorkbenchContextService');
const {
  createEngineerMobileWorkbenchRouter,
} = require('../../src/routes/engineerMobileWorkbench.routes');
const { createAppRouter } = require('../../src/routes');

const repoRoot = path.resolve(__dirname, '../..');
const contextServiceFile = path.join(
  repoRoot,
  'src/engineerMobileWorkbench/engineerMobileWorkbenchContextService.js'
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
    organizationId: 'org_workbench_context_001',
    engineerId: 'eng_workbench_context_001',
    userId: 'user_workbench_context_001',
    role: 'engineer',
    permissions: [
      'engineer_mobile.tasks.read',
      'appointment.result.record',
    ],
    ...overrides,
  };
}

function request(overrides = {}) {
  return {
    auth: auth(),
    requestId: 'req_workbench_context_001',
    ...overrides,
  };
}

function contextProvider(overrides = {}) {
  return {
    engineerDisplayName: '工程師 A',
    organizationName: '示範服務商',
    timezone: 'Asia/Taipei',
    locale: 'zh-TW',
    workbenchMode: 'engineer_mobile_workbench',
    capabilities: [
      'tasks.read',
      'task.detail.read',
      'arrival.mark.future',
    ],
    featureFlags: [
      'workbench.context',
    ],
    rawPhone: 'raw_phone_should_not_leak',
    rawAddress: 'raw_address_should_not_leak',
    rawLineUserId: 'line_user_should_not_leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    internalNote: 'internal_note_should_not_leak',
    auditLog: 'audit_log_should_not_leak',
    aiRawPayload: 'ai_raw_payload_should_not_leak',
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

async function callRoute(router, req, pathname = '/context') {
  const route = findRoute(router, 'get', pathname);
  const res = createResponse();

  assert.ok(route, `workbench route missing: ${pathname}`);

  await route.route.stack[0].handle(req, res, () => {});
  await new Promise((resolve) => setImmediate(resolve));

  return res;
}

async function callNestedWorkbenchContextRoute(appRouter, req) {
  const workbenchLayer = appRouter.stack.find((layer) => (
    layer.name === 'router'
    && layer.handle
    && Array.isArray(layer.handle.stack)
    && Boolean(findRoute(layer.handle, 'get', '/context'))
  ));

  assert.ok(workbenchLayer, 'mounted workbench context router missing');

  return callRoute(workbenchLayer.handle, req);
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
  ]) {
    assert.equal(serialized.includes(forbiddenValue), false, `leaked ${forbiddenValue}`);
  }

  assert.equal(serialized.includes('"rawPhone"'), false);
  assert.equal(serialized.includes('"rawAddress"'), false);
  assert.equal(serialized.includes('"rawLineUserId"'), false);
  assert.equal(serialized.includes('"internalNote"'), false);
  assert.equal(serialized.includes('"auditLog"'), false);
  assert.equal(serialized.includes('"aiRawPayload"'), false);
}

test('context service returns safe scoped context with injected provider', async () => {
  const response = await buildEngineerMobileWorkbenchContextResponseAsync(request(), {
    contextProvider: {
      getCurrentContext(input) {
        assert.deepEqual(input, {
          organizationId: 'org_workbench_context_001',
          engineerId: 'eng_workbench_context_001',
          userId: 'user_workbench_context_001',
          role: 'engineer',
          permissions: [
            'engineer_mobile.tasks.read',
            'appointment.result.record',
          ],
        });
        return contextProvider();
      },
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'allow');
  assert.deepEqual(response.body.context, {
    organizationId: 'org_workbench_context_001',
    engineerId: 'eng_workbench_context_001',
    userId: 'user_workbench_context_001',
    role: 'engineer',
    permissions: [
      'engineer_mobile.tasks.read',
      'appointment.result.record',
    ],
    engineerDisplayName: '工程師 A',
    organizationName: '示範服務商',
    timezone: 'Asia/Taipei',
    locale: 'zh-TW',
    workbenchMode: 'engineer_mobile_workbench',
    capabilities: [
      'tasks.read',
      'task.detail.read',
      'arrival.mark.future',
    ],
    featureFlags: [
      'workbench.context',
    ],
  });
  assertNoForbiddenOutput(response.body);
});

test('context service denies missing auth before provider execution', async () => {
  let called = false;
  const response = await buildEngineerMobileWorkbenchContextResponseAsync(
    { requestId: 'req_missing_auth' },
    {
      contextProvider: {
        getCurrentContext() {
          called = true;
          return contextProvider();
        },
      },
    }
  );

  assert.equal(called, false);
  assert.equal(response.statusCode, 403);
  assert.equal(response.body.status, 'deny');
  assertNoForbiddenOutput(response.body);
});

test('context service fail-closes provider errors without leaking raw detail', async () => {
  const response = await buildEngineerMobileWorkbenchContextResponseAsync(request(), {
    contextProvider: {
      getCurrentContext() {
        throw new Error('token_should_not_leak');
      },
    },
  });

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.status, 'deny');
  assertNoForbiddenOutput(response.body);
});

test('controller getCurrentContext keeps default skeleton behavior without injected context source', async () => {
  const controller = new EngineerMobileWorkbenchController();
  const res = createResponse();

  await controller.getCurrentContext(request(), res);

  assert.deepEqual(res.statusCalls, [501]);
  assert.equal(res.jsonCalls[0].error.code, 'ENGINEER_MOBILE_WORKBENCH_NOT_IMPLEMENTED');
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('controller getCurrentContext returns injected safe context', async () => {
  const controller = new EngineerMobileWorkbenchController({
    engineerMobileWorkbenchContextOptions: {
      currentContext: contextProvider(),
    },
  });
  const res = createResponse();

  await controller.getCurrentContext(request(), res);

  assert.deepEqual(res.statusCalls, [200]);
  assert.equal(res.jsonCalls[0].status, 'allow');
  assert.equal(res.jsonCalls[0].context.organizationId, 'org_workbench_context_001');
  assert.equal(res.jsonCalls[0].context.engineerId, 'eng_workbench_context_001');
  assert.equal(res.jsonCalls[0].context.engineerDisplayName, '工程師 A');
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('workbench router factory supports injected context provider without DB access', async () => {
  const providerCalls = [];
  const router = createEngineerMobileWorkbenchRouter({
    contextProvider: {
      getCurrentContext(input) {
        providerCalls.push(input);
        return contextProvider({
          engineerDisplayName: '工程師 B',
        });
      },
    },
  });
  const res = await callRoute(router, request());

  assert.equal(providerCalls.length, 1);
  assert.deepEqual(providerCalls[0], {
    organizationId: 'org_workbench_context_001',
    engineerId: 'eng_workbench_context_001',
    userId: 'user_workbench_context_001',
    role: 'engineer',
    permissions: [
      'engineer_mobile.tasks.read',
      'appointment.result.record',
    ],
  });
  assert.deepEqual(res.statusCalls, [200]);
  assert.equal(res.jsonCalls[0].context.engineerDisplayName, '工程師 B');
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('central router passes engineerMobile options into mounted workbench context route', async () => {
  const appRouter = createAppRouter({
    engineerMobile: {
      contextProvider: {
        getCurrentContext() {
          return contextProvider({
            organizationName: '中央掛載服務商',
          });
        },
      },
    },
  });

  const res = await callNestedWorkbenchContextRoute(appRouter, request());

  assert.deepEqual(res.statusCalls, [200]);
  assert.equal(res.jsonCalls[0].context.organizationName, '中央掛載服務商');
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('workbench context runtime files avoid DB AI RAG provider sending and secret imports', () => {
  const serviceSource = fs.readFileSync(contextServiceFile, 'utf8');
  const controllerSource = fs.readFileSync(controllerFile, 'utf8');
  const routeSource = fs.readFileSync(routeFile, 'utf8');
  const combined = `${serviceSource}\n${controllerSource}\n${routeSource}`;

  assert.equal(/require\(['"].*db['"]\)/i.test(combined), false);
  assert.equal(/AIProvider|externalProvider|notificationProvider/i.test(combined), false);
  assert.equal(/AIProvider|RAG|vector/i.test(combined), false);
  assert.equal(/DATABASE_URL|access_token|channel_secret/i.test(combined), false);
});
