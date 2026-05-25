'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  ENGINEER_MOBILE_WORKBENCH_ALLOWED_ROLES,
  ENGINEER_MOBILE_WORKBENCH_REQUIRED_PERMISSIONS,
  buildEngineerMobileWorkbenchPermissionContext,
  createEngineerMobileWorkbenchPermissionMiddleware,
} = require('../../src/engineerMobileWorkbench/engineerMobileWorkbenchPermissionMiddleware');
const {
  createEngineerMobileWorkbenchRouter,
} = require('../../src/routes/engineerMobileWorkbench.routes');

const repoRoot = path.resolve(__dirname, '../..');
const middlewareFile = path.join(
  repoRoot,
  'src/engineerMobileWorkbench/engineerMobileWorkbenchPermissionMiddleware.js',
);
const routeFile = path.join(repoRoot, 'src/routes/engineerMobileWorkbench.routes.js');

function auth(overrides = {}) {
  return {
    organizationId: 'org_workbench_permission_001',
    userId: 'user_workbench_permission_001',
    engineerId: 'eng_workbench_permission_001',
    role: 'engineer',
    permissions: ['engineer_mobile.workbench.access'],
    rawPhone: 'raw_phone_should_not_leak',
    rawAddress: 'raw_address_should_not_leak',
    rawLineUserId: 'line_user_should_not_leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    DATABASE_URL: 'DATABASE_URL_should_not_leak',
    aiRawPayload: 'ai_raw_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    ...overrides,
  };
}

function request(overrides = {}) {
  return {
    auth: auth(),
    body: {
      clientRequestId: 'client_request_permission_001',
      resultStatus: 'pending_parts',
      secret: 'body_secret_should_not_leak',
    },
    params: {
      taskId: 'apt_workbench_permission_001',
    },
    ...overrides,
  };
}

function task(overrides = {}) {
  return {
    appointmentId: 'apt_workbench_permission_001',
    assignedEngineerId: 'eng_workbench_permission_001',
    caseId: 'case_workbench_permission_001',
    organizationId: 'org_workbench_permission_001',
    scheduledStart: '2026-05-21T09:00:00+08:00',
    status: 'confirmed',
    customerNameMasked: '王○○',
    customerPhoneMasked: '09xx-xxx-123',
    addressSummary: '台北市信義區',
    productSummary: '冷氣',
    issueSummary: '不冷',
    rawPhone: 'raw_phone_should_not_leak',
    rawAddress: 'raw_address_should_not_leak',
    rawLineUserId: 'line_user_should_not_leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    internalNote: 'internal_note_should_not_leak',
    auditLog: 'audit_log_should_not_leak',
    aiRawPayload: 'ai_raw_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    ...overrides,
  };
}

function operationResult(overrides = {}) {
  return {
    status: 'accepted',
    taskStatus: 'arrived',
    operationId: 'op_workbench_permission_001',
    occurredAt: '2026-05-21T09:05:00+08:00',
    messageKey: 'engineer_mobile.status.accepted',
    rawPhone: 'raw_phone_should_not_leak',
    rawAddress: 'raw_address_should_not_leak',
    rawLineUserId: 'line_user_should_not_leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    internalNote: 'internal_note_should_not_leak',
    auditLog: 'audit_log_should_not_leak',
    aiRawPayload: 'ai_raw_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    ...overrides,
  };
}

function completionSubmissionResult(overrides = {}) {
  return {
    status: 'accepted',
    submissionId: 'sub_workbench_permission_001',
    receivedAt: '2026-05-21T09:20:00+08:00',
    messageKey: 'engineer_mobile.completion_submission.accepted',
    rawPhone: 'raw_phone_should_not_leak',
    rawAddress: 'raw_address_should_not_leak',
    rawLineUserId: 'line_user_should_not_leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    internalNote: 'internal_note_should_not_leak',
    auditLog: 'audit_log_should_not_leak',
    aiRawPayload: 'ai_raw_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    ...overrides,
  };
}

function response() {
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

function findRoute(router, method, pathname) {
  return router.stack.find((layer) => (
    layer.route
    && layer.route.path === pathname
    && layer.route.methods[method.toLowerCase()]
  ));
}

async function invokeRoute(router, req, pathname = '/context', method = 'get') {
  const route = findRoute(router, method, pathname);
  const res = response();
  let index = 0;

  assert.ok(route, `workbench route missing: ${method.toUpperCase()} ${pathname}`);

  function next(error) {
    if (error) {
      throw error;
    }

    index += 1;
    const layer = route.route.stack[index];

    if (layer) {
      return layer.handle(req, res, next);
    }

    return undefined;
  }

  route.route.stack[0].handle(req, res, next);
  await new Promise((resolve) => setImmediate(resolve));

  return {
    req,
    res,
  };
}

function createRouteCoverageOptions(providerCalls) {
  return {
    completionSubmissionProvider: {
      createCompletionSubmission(input) {
        providerCalls.push({
          endpoint: 'completion-submissions',
          input,
        });
        return completionSubmissionResult();
      },
    },
    contextProvider: {
      getCurrentContext(input) {
        providerCalls.push({
          endpoint: 'context',
          input,
        });
        return {
          engineerDisplayName: 'permission-route-engineer',
        };
      },
    },
    permission: {},
    taskProvider: {
      getTaskDetail(input) {
        providerCalls.push({
          endpoint: 'tasks-detail',
          input,
        });
        return {
          task: task(),
        };
      },
      listTasks(input) {
        providerCalls.push({
          endpoint: 'tasks-list',
          input,
        });
        return [task()];
      },
    },
    taskStatusProvider: {
      markTaskStatus(input) {
        providerCalls.push({
          endpoint: input.operation,
          input,
        });
        return operationResult({
          taskStatus: input.operation === 'started' ? 'in_progress' : 'arrived',
        });
      },
    },
  };
}

function assertNoSensitive(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'DATABASE_URL_should_not_leak',
    'ai_raw_should_not_leak',
    'final_appointment_should_not_leak',
    'body_secret_should_not_leak',
    'rawPhone',
    'rawAddress',
    'rawLineUserId',
    'DATABASE_URL',
    'aiRawPayload',
    'finalAppointmentId',
    'token',
    'secret',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
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

test('exports Workbench permission constants and middleware factory', () => {
  assert.equal(typeof buildEngineerMobileWorkbenchPermissionContext, 'function');
  assert.equal(typeof createEngineerMobileWorkbenchPermissionMiddleware, 'function');
  assert.deepEqual(ENGINEER_MOBILE_WORKBENCH_REQUIRED_PERMISSIONS, [
    'engineer_mobile.tasks.read',
    'engineer_mobile.tasks.read.assigned',
    'engineer_mobile.workbench.access',
  ]);
  assert.deepEqual(ENGINEER_MOBILE_WORKBENCH_ALLOWED_ROLES, [
    'admin',
    'dispatch_assistant',
    'engineer',
    'supervisor',
  ]);
});

test('missing auth and missing permission deny with generic safe response', () => {
  for (const req of [
    {},
    request({ auth: auth({ permissions: [] }) }),
  ]) {
    const res = response();
    const middleware = createEngineerMobileWorkbenchPermissionMiddleware();

    middleware(req, res, () => {
      throw new Error('next_should_not_be_called');
    });

    assert.deepEqual(res.statusCalls, [403]);
    assert.deepEqual(res.jsonCalls[0], {
      status: 'deny',
      messageKey: 'engineerMobileWorkbench.unavailable',
      data: null,
    });
    assertNoSensitive(res.jsonCalls[0]);
  }
});

test('compatible Workbench permissions and allowed roles pass with safe context', () => {
  for (const permission of ENGINEER_MOBILE_WORKBENCH_REQUIRED_PERMISSIONS) {
    const decision = buildEngineerMobileWorkbenchPermissionContext(request({
      auth: auth({ permissions: [permission] }),
    }));

    assert.equal(decision.allowed, true, `${permission} should allow`);
    assert.deepEqual(decision.permissionContext.permissions, [permission]);
    assertNoSensitive(decision);
  }

  for (const role of ENGINEER_MOBILE_WORKBENCH_ALLOWED_ROLES) {
    const decision = buildEngineerMobileWorkbenchPermissionContext(request({
      auth: auth({ role }),
    }));

    assert.equal(decision.allowed, true, `${role} should allow`);
  }
});

test('customer service and AI role deny even with compatible permission', () => {
  for (const role of ['customer_service', 'ai']) {
    const decision = buildEngineerMobileWorkbenchPermissionContext(request({
      auth: auth({
        role,
        permissions: [...ENGINEER_MOBILE_WORKBENCH_REQUIRED_PERMISSIONS],
      }),
    }));

    assert.equal(decision.allowed, false);
    assertNoSensitive(decision);
  }
});

test('Workbench route permission option denies before provider execution', async () => {
  const providerCalls = [];
  const router = createEngineerMobileWorkbenchRouter({
    contextProvider: {
      getCurrentContext(input) {
        providerCalls.push(input);
        return {
          engineerDisplayName: 'should-not-run',
        };
      },
    },
    permission: {},
  });
  const { res } = await invokeRoute(router, {});

  assert.deepEqual(providerCalls, []);
  assert.deepEqual(res.statusCalls, [403]);
  assert.deepEqual(res.jsonCalls[0], {
    status: 'deny',
    messageKey: 'engineerMobileWorkbench.unavailable',
    data: null,
  });
  assertNoSensitive(res.jsonCalls[0]);
});

test('Workbench route permission option allows provider execution after safe context', async () => {
  const providerCalls = [];
  const router = createEngineerMobileWorkbenchRouter({
    contextProvider: {
      getCurrentContext(input) {
        providerCalls.push(input);
        return {
          engineerDisplayName: 'workbench-permission-allowed',
        };
      },
    },
    permission: {},
  });
  const req = request();
  const { res } = await invokeRoute(router, req);

  assert.deepEqual(res.statusCalls, [200]);
  assert.equal(res.jsonCalls[0].context.engineerDisplayName, 'workbench-permission-allowed');
  assert.equal(providerCalls.length, 1);
  assert.deepEqual(req.engineerMobileWorkbenchPermissionContext, {
    organizationId: 'org_workbench_permission_001',
    userId: 'user_workbench_permission_001',
    engineerId: 'eng_workbench_permission_001',
    role: 'engineer',
    permissions: ['engineer_mobile.workbench.access'],
  });
  assertNoSensitive([res.jsonCalls[0], providerCalls, req.engineerMobileWorkbenchPermissionContext]);
});

test('Workbench route permission option protects every endpoint before provider execution', async () => {
  const endpointSpecs = [
    ['get', '/context'],
    ['get', '/tasks'],
    ['get', '/tasks/:taskId'],
    ['post', '/tasks/:taskId/arrived'],
    ['post', '/tasks/:taskId/started'],
    ['post', '/tasks/:taskId/completion-submissions'],
  ];
  const providerCalls = [];
  const router = createEngineerMobileWorkbenchRouter(createRouteCoverageOptions(providerCalls));

  for (const [method, pathname] of endpointSpecs) {
    const { res } = await invokeRoute(router, {}, pathname, method);

    assert.deepEqual(res.statusCalls, [403], `${method.toUpperCase()} ${pathname}`);
    assert.deepEqual(res.jsonCalls[0], {
      status: 'deny',
      messageKey: 'engineerMobileWorkbench.unavailable',
      data: null,
    });
    assertNoSensitive(res.jsonCalls[0]);
  }

  assert.deepEqual(providerCalls, []);
});

test('Workbench route permission option allows every endpoint with compatible permission', async () => {
  const endpointSpecs = [
    ['get', '/context', 'context'],
    ['get', '/tasks', 'tasks-list'],
    ['get', '/tasks/:taskId', 'tasks-detail'],
    ['post', '/tasks/:taskId/arrived', 'arrived'],
    ['post', '/tasks/:taskId/started', 'started'],
    ['post', '/tasks/:taskId/completion-submissions', 'completion-submissions'],
  ];
  const providerCalls = [];
  const router = createEngineerMobileWorkbenchRouter(createRouteCoverageOptions(providerCalls));

  for (const [method, pathname, endpoint] of endpointSpecs) {
    const { res } = await invokeRoute(router, request(), pathname, method);

    assert.deepEqual(res.statusCalls, [200], `${method.toUpperCase()} ${pathname}`);
    assertNoSensitive(res.jsonCalls[0]);
    assert.equal(providerCalls.at(-1).endpoint, endpoint);
  }

  assert.deepEqual(providerCalls.map((call) => call.endpoint), [
    'context',
    'tasks-list',
    'tasks-detail',
    'arrived',
    'started',
    'completion-submissions',
  ]);
});

test('permission middleware and optional route wiring avoid DB provider AI and secret imports', () => {
  const middlewareSource = fs.readFileSync(middlewareFile, 'utf8');
  const routeSource = fs.readFileSync(routeFile, 'utf8');
  const middlewareSpecifiers = requireSpecifiers(middlewareSource);
  const routeSpecifiers = requireSpecifiers(routeSource);

  assert.deepEqual(middlewareSpecifiers, []);
  assert.equal(routeSpecifiers.includes('../engineerMobileWorkbench/engineerMobileWorkbenchPermissionMiddleware'), true);
  assert.equal(/db|pool|transaction|repositories?/i.test(middlewareSource), false);
  assert.equal(/line|sms|email|push|provider/i.test(middlewareSource), false);
  assert.equal(/AIProvider|RAG|vector|openai/i.test(middlewareSource), false);
  assert.equal(/DATABASE_URL|access_token|channel_secret/i.test(middlewareSource), false);
});
