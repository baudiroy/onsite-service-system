'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  app: defaultApp,
  createApp,
} = require('../../src/app');

const repoRoot = path.resolve(__dirname, '../..');
const appFile = path.join(repoRoot, 'src/app.js');

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
    organizationId: 'org_engineer_mobile_app_001',
    engineerId: 'eng_engineer_mobile_app_001',
    userId: 'user_engineer_mobile_app_001',
    role: 'engineer',
    permissions: ['engineer_mobile.tasks.read'],
    ...overrides,
  };
}

function task(overrides = {}) {
  return {
    caseId: 'case_engineer_mobile_app_001',
    appointmentId: 'apt_engineer_mobile_app_001',
    organizationId: 'org_engineer_mobile_app_001',
    assignedEngineerId: 'eng_engineer_mobile_app_001',
    scheduledStart: '2026-05-21T09:00:00+08:00',
    scheduledEnd: '2026-05-21T10:00:00+08:00',
    status: 'confirmed',
    customerNameMasked: '陳○○',
    customerPhoneMasked: '09xx-xxx-789',
    addressSummary: '台北市中山區',
    productSummary: '洗衣機',
    issueSummary: '漏水',
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
    DATABASE_URL: 'DATABASE_URL_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    ...overrides,
  };
}

function request(overrides = {}) {
  return {
    auth: auth(),
    query: {},
    ...overrides,
  };
}

function callMountedEngineerRoute(appInstance, req) {
  const route = findRoute(appInstance, 'get', '/engineer-mobile/tasks');
  const res = createResponse();
  let index = 0;

  assert.ok(route, 'engineer mobile route should be mounted');

  function next() {
    index += 1;
    const layer = route.route.stack[index];

    if (layer) {
      return layer.handle(req, res, next);
    }

    return undefined;
  }

  route.route.stack[0].handle(req, res, next);

  return res;
}

async function callMountedEngineerRouteAsync(appInstance, req) {
  const route = findRoute(appInstance, 'get', '/engineer-mobile/tasks');
  const res = createResponse();
  let index = 0;

  assert.ok(route, 'engineer mobile route should be mounted');

  function next() {
    index += 1;
    const layer = route.route.stack[index];

    if (layer) {
      return layer.handle(req, res, next);
    }

    return undefined;
  }

  await route.route.stack[0].handle(req, res, next);

  return res;
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
    'DATABASE_URL_should_not_leak',
    'final_appointment_should_not_leak',
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

test('src/app.js still exports default app', () => {
  assert.ok(defaultApp);
  assert.equal(typeof defaultApp.handle, 'function');
});

test('src/app.js exports createApp', () => {
  assert.equal(typeof createApp, 'function');
});

test('default app includes GET /engineer-mobile/tasks and safely denies missing auth', () => {
  const route = findRoute(defaultApp, 'get', '/engineer-mobile/tasks');
  const res = callMountedEngineerRoute(defaultApp, {});

  assert.ok(route);
  assert.deepEqual(res.statusCalls, [403]);
  assert.deepEqual(res.jsonCalls[0], {
    status: 'deny',
    messageKey: 'engineerMobile.unavailable',
    data: null,
  });
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('createApp({ engineerMobile: { readModel } }) returns only assigned scoped engineer tasks', () => {
  const app = createApp({
    engineerMobile: {
      readModel: {
        tasks: [
          task({ caseId: 'case_app_allowed' }),
          task({ caseId: 'case_app_wrong_org', organizationId: 'org_other' }),
          task({ caseId: 'case_app_wrong_engineer', assignedEngineerId: 'eng_other' }),
        ],
      },
    },
  });
  const res = callMountedEngineerRoute(app, request());

  assert.deepEqual(res.statusCalls, [200]);
  assert.equal(res.jsonCalls[0].status, 'allow');
  assert.deepEqual(res.jsonCalls[0].tasks.map((entry) => entry.caseId), ['case_app_allowed']);
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('app factory creation does not call injected taskProvider until route request executes', () => {
  const providerCalls = [];
  const app = createApp({
    engineerMobile: {
      taskProvider: {
        listTasks(query) {
          providerCalls.push(query);
          return [task({ caseId: 'case_provider_app_allowed' })];
        },
      },
    },
  });

  assert.deepEqual(providerCalls, []);

  const res = callMountedEngineerRoute(app, request());

  assert.equal(providerCalls.length, 1);
  assert.deepEqual(res.statusCalls, [200]);
  assert.deepEqual(res.jsonCalls[0].tasks.map((entry) => entry.caseId), ['case_provider_app_allowed']);
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('createApp can compose Engineer Mobile list read source from app executor option', async () => {
  const executorCalls = [];
  const app = createApp({
    engineerMobileAllowNonExecutableForTest: true,
    async engineerMobileReadExecutor(querySpec) {
      executorCalls.push(querySpec);
      return {
        rows: [
          {
            appointment_id: 'apt_app_executor_001',
            assigned_engineer_id: 'eng_engineer_mobile_app_001',
            case_id: 'case_app_executor_allowed',
            organization_id: 'org_engineer_mobile_app_001',
            scheduled_start: '2026-05-21T09:00:00+08:00',
            appointment_status: 'confirmed',
            customer_name_masked: '陳○○',
            customer_phone_masked: '09xx-xxx-789',
            address_summary: '台北市中山區',
            product_summary: '洗衣機',
            issue_summary: '漏水',
            service_type: 'repair',
            internal_note: 'internal_note_should_not_leak',
            raw_phone: 'raw_phone_should_not_leak',
            final_appointment_id: 'final_appointment_should_not_leak',
          },
        ],
      };
    },
  });

  assert.deepEqual(executorCalls, []);

  const res = await callMountedEngineerRouteAsync(app, request());

  assert.equal(executorCalls.length, 1);
  assert.equal(executorCalls[0].name, 'engineerMobileTaskListReadModel');
  assert.deepEqual(executorCalls[0].params.organizationId, 'org_engineer_mobile_app_001');
  assert.deepEqual(executorCalls[0].params.engineerId, 'eng_engineer_mobile_app_001');
  assert.deepEqual(res.statusCalls, [200]);
  assert.deepEqual(res.jsonCalls[0].tasks.map((entry) => entry.caseId), ['case_app_executor_allowed']);
  assertNoForbiddenOutput([res.jsonCalls[0], executorCalls]);
});

test('createApp list-specific executor shortcut has priority over shared executor shortcut', async () => {
  const sharedExecutorCalls = [];
  const listExecutorCalls = [];
  const app = createApp({
    engineerMobileAllowNonExecutableForTest: true,
    async engineerMobileReadExecutor(querySpec) {
      sharedExecutorCalls.push(querySpec);
      return { rows: [] };
    },
    async engineerMobileListExecutor(querySpec) {
      listExecutorCalls.push(querySpec);
      return {
        rows: [
          {
            appointment_id: 'apt_app_list_specific_executor_001',
            assigned_engineer_id: 'eng_engineer_mobile_app_001',
            case_id: 'case_app_list_specific_executor_allowed',
            organization_id: 'org_engineer_mobile_app_001',
            scheduled_start: '2026-05-21T09:00:00+08:00',
            appointment_status: 'confirmed',
            customer_name_masked: '陳○○',
            customer_phone_masked: '09xx-xxx-789',
            address_summary: '台北市中山區',
            product_summary: '洗衣機',
            issue_summary: '漏水',
            service_type: 'repair',
            internal_note: 'internal_note_should_not_leak',
            raw_phone: 'raw_phone_should_not_leak',
            final_appointment_id: 'final_appointment_should_not_leak',
          },
        ],
      };
    },
  });

  const res = await callMountedEngineerRouteAsync(app, request());

  assert.deepEqual(sharedExecutorCalls, []);
  assert.equal(listExecutorCalls.length, 1);
  assert.equal(listExecutorCalls[0].name, 'engineerMobileTaskListReadModel');
  assert.equal(listExecutorCalls[0].params.engineerId, 'eng_engineer_mobile_app_001');
  assert.equal(listExecutorCalls[0].params.organizationId, 'org_engineer_mobile_app_001');
  assert.deepEqual(res.statusCalls, [200]);
  assert.deepEqual(
    res.jsonCalls[0].tasks.map((entry) => entry.caseId),
    ['case_app_list_specific_executor_allowed'],
  );
  assertNoForbiddenOutput([res.jsonCalls[0], sharedExecutorCalls, listExecutorCalls]);
});

test('createApp supports engineerMobileReadRepository shortcut option', async () => {
  const repositoryCalls = [];
  const repository = {
    getTaskList(input) {
      repositoryCalls.push(input);
      return [
        task({ caseId: 'case_app_repository_allowed' }),
        task({ caseId: 'case_app_repository_wrong_org', organizationId: 'org_other' }),
        task({ caseId: 'case_app_repository_wrong_engineer', assignedEngineerId: 'eng_other' }),
      ];
    },
  };
  const app = createApp({
    engineerMobileReadRepository: repository,
  });

  assert.deepEqual(repositoryCalls, []);

  const res = await callMountedEngineerRouteAsync(app, request());

  assert.deepEqual(repositoryCalls, [{
    engineerId: 'eng_engineer_mobile_app_001',
    organizationId: 'org_engineer_mobile_app_001',
  }]);
  assert.deepEqual(res.statusCalls, [200]);
  assert.deepEqual(res.jsonCalls[0].tasks.map((entry) => entry.caseId), ['case_app_repository_allowed']);
  assertNoForbiddenOutput([res.jsonCalls[0], repositoryCalls]);
});

test('createApp supports async engineerMobileReadRepository shortcut option', async () => {
  const repositoryCalls = [];
  const syncRepositoryCalls = [];
  const repository = {
    async getReadModelAsync(input) {
      repositoryCalls.push(input);
      return {
        tasks: [
          task({ caseId: 'case_app_repository_async_allowed' }),
          task({ caseId: 'case_app_repository_async_wrong_org', organizationId: 'org_other' }),
          task({ caseId: 'case_app_repository_async_wrong_engineer', assignedEngineerId: 'eng_other' }),
        ],
      };
    },
    getTaskList(input) {
      syncRepositoryCalls.push(input);
      return [task({ caseId: 'case_app_repository_sync_should_not_run' })];
    },
  };
  const app = createApp({
    engineerMobileReadRepository: repository,
  });

  assert.deepEqual(repositoryCalls, []);
  assert.deepEqual(syncRepositoryCalls, []);

  const res = await callMountedEngineerRouteAsync(app, request());

  assert.deepEqual(syncRepositoryCalls, []);
  assert.deepEqual(repositoryCalls, [{
    engineerId: 'eng_engineer_mobile_app_001',
    organizationId: 'org_engineer_mobile_app_001',
  }]);
  assert.deepEqual(res.statusCalls, [200]);
  assert.deepEqual(
    res.jsonCalls[0].tasks.map((entry) => entry.caseId),
    ['case_app_repository_async_allowed'],
  );
  assertNoForbiddenOutput([res.jsonCalls[0], repositoryCalls, syncRepositoryCalls]);
});

test('createApp repository shortcut takes priority over executor shortcut option', async () => {
  const repositoryCalls = [];
  const executorCalls = [];
  const app = createApp({
    engineerMobileAllowNonExecutableForTest: true,
    engineerMobileReadRepository: {
      getTaskList(input) {
        repositoryCalls.push(input);
        return [task({ caseId: 'case_app_repository_over_executor' })];
      },
    },
    async engineerMobileReadExecutor(querySpec) {
      executorCalls.push(querySpec);
      return { rows: [] };
    },
  });
  const res = await callMountedEngineerRouteAsync(app, request());

  assert.deepEqual(executorCalls, []);
  assert.deepEqual(repositoryCalls, [{
    engineerId: 'eng_engineer_mobile_app_001',
    organizationId: 'org_engineer_mobile_app_001',
  }]);
  assert.deepEqual(res.statusCalls, [200]);
  assert.deepEqual(res.jsonCalls[0].tasks.map((entry) => entry.caseId), ['case_app_repository_over_executor']);
  assertNoForbiddenOutput([res.jsonCalls[0], repositoryCalls, executorCalls]);
});

test('createApp explicit engineerMobile option takes priority over repository shortcut', () => {
  const repositoryCalls = [];
  const app = createApp({
    engineerMobile: {
      readModel: {
        tasks: [task({ caseId: 'case_app_explicit_engineer_mobile' })],
      },
    },
    engineerMobileReadRepository: {
      getTaskList(input) {
        repositoryCalls.push(input);
        return [task({ caseId: 'case_app_repository_should_not_run' })];
      },
    },
  });
  const res = callMountedEngineerRoute(app, request());

  assert.deepEqual(repositoryCalls, []);
  assert.deepEqual(res.statusCalls, [200]);
  assert.deepEqual(
    res.jsonCalls[0].tasks.map((entry) => entry.caseId),
    ['case_app_explicit_engineer_mobile'],
  );
  assertNoForbiddenOutput([res.jsonCalls[0], repositoryCalls]);
});

test('createApp explicit engineerMobile option takes priority over executor shortcut', () => {
  const executorCalls = [];
  const app = createApp({
    engineerMobile: {
      readModel: {
        tasks: [task({ caseId: 'case_app_explicit_over_executor' })],
      },
    },
    engineerMobileAllowNonExecutableForTest: true,
    async engineerMobileReadExecutor(querySpec) {
      executorCalls.push(querySpec);
      return { rows: [] };
    },
  });
  const res = callMountedEngineerRoute(app, request());

  assert.deepEqual(executorCalls, []);
  assert.deepEqual(res.statusCalls, [200]);
  assert.deepEqual(
    res.jsonCalls[0].tasks.map((entry) => entry.caseId),
    ['case_app_explicit_over_executor'],
  );
  assertNoForbiddenOutput([res.jsonCalls[0], executorCalls]);
});

test('customer access and data correction app routes remain present', () => {
  const app = createApp();

  assert.ok(findRoute(app, 'get', '/customer-access/:caseId'));
  assert.ok(findRoute(app, 'post', '/data-correction/governance'));
});

test('app.js source does not import DB, repository, provider, AI, or server bootstrap', () => {
  const source = fs.readFileSync(appFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.equal(specifiers.includes('./routes'), true);
  assert.equal(specifiers.includes('./server'), false);
  assert.equal(specifiers.some((specifier) => /db|pool|repositories?|transaction|lineProvider|sms|email|push|openai|rag|vector/i.test(specifier)), false);
  assert.doesNotMatch(source, /app\.listen|server\.listen|createServer|require\(['"]\.\/server['"]\)/);
});
