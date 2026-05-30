'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createAppRouter,
} = require('../../src/routes');
const {
  REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION,
  REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH,
  REPAIR_INTAKE_DRAFT_TO_CASE_ROUTES_ENABLED_ENV,
  buildAdminRequestLike,
  registerRepairIntakeDraftToCaseAdminRoutes,
} = require('../../src/routes/repairIntakeDraftToCase.routes');

const repoRoot = path.resolve(__dirname, '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function createRuntimePorts(calls = []) {
  return {
    idempotencyStore: {
      findExistingDraftToCaseResult: async (input) => {
        calls.push({ name: 'idempotency.find', input });
        return null;
      },
      recordDraftToCaseResult: async (input) => {
        calls.push({ name: 'idempotency.record', input });
        return {
          ok: true,
          status: 'recorded',
          result: input.result,
          rawPayload: 'unsafe raw payload should not leak',
          token: 'unsafe_token_should_not_leak',
        };
      },
    },
    draftRepository: {
      findDraftForConversion: async (input) => {
        calls.push({ name: 'draft.find', input });
        return {
          id: 'draft_admin_mount_runtime_001',
          organizationId: 'org_admin_mount_runtime_001',
          tenantId: 'tenant_admin_mount_runtime_001',
          status: 'ready',
          summary: {
            title: 'safe admin mount draft',
          },
          phone: '+886900001166',
          address: 'unsafe address should not leak',
          lineUserId: 'unsafe_line_user_should_not_leak',
          finalAppointmentId: 'unsafe_final_appointment_should_not_leak',
          rawRows: [{ phone: '+886900001166' }],
          stack: 'unsafe stack should not leak',
        };
      },
    },
    planningPolicy: {
      planCaseFromDraft: async (input) => {
        calls.push({ name: 'plan.case', input });
        return {
          status: 'planned',
          reasonCode: 'REPAIR_INTAKE_ADMIN_ROUTE_PLAN_READY',
          candidate: {
            sourceDraftId: 'draft_admin_mount_runtime_001',
            organizationId: 'org_admin_mount_runtime_001',
          },
          rawRows: [{ phone: '+886900001166' }],
          token: 'unsafe_token_should_not_leak',
        };
      },
    },
    caseCreationPort: {
      createCaseFromDraft: async (input) => {
        calls.push({ name: 'case.create', input });
        return {
          id: 'case_admin_mount_runtime_001',
          organizationId: 'org_admin_mount_runtime_001',
          sourceDraftId: 'draft_admin_mount_runtime_001',
          status: 'created',
          finalAppointmentId: 'unsafe_final_appointment_should_not_leak',
          databaseUrl: 'postgres://unsafe_should_not_leak',
        };
      },
    },
    auditPort: {
      recordDraftToCaseDecision: async (input) => {
        calls.push({ name: 'audit.record', input });
        return {
          eventType: 'repair_intake_draft_to_case_decision',
          outcome: 'recorded',
          draftId: 'draft_admin_mount_runtime_001',
          organizationId: 'org_admin_mount_runtime_001',
          token: 'unsafe_token_should_not_leak',
          stack: 'unsafe stack should not leak',
        };
      },
    },
  };
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

function findRoute(expressRouter, method, pathname) {
  return expressRouter.stack.find((layer) => (
    layer
    && layer.route
    && layer.route.path === pathname
    && layer.route.methods[method.toLowerCase()]
  ));
}

function publicMountLayer(appRouter) {
  return appRouter.stack.find((layer) => (
    layer
    && layer.name === 'router'
    && layer.handle
    && Array.isArray(layer.handle.stack)
    && layer.handle.stack.some((nestedLayer) => (
      nestedLayer
      && nestedLayer.route
      && nestedLayer.route.path === '/case-inquiry'
    ))
  ));
}

function publicRepairIntakeRouteLayers(appRouter) {
  const publicLayer = publicMountLayer(appRouter);

  return publicLayer
    ? publicLayer.handle.stack.filter((layer) => (
      layer
      && layer.route
      && typeof layer.route.path === 'string'
      && layer.route.path.startsWith('/repair-intake')
    ))
    : [];
}

function request(overrides = {}) {
  return {
    params: {
      draftId: 'draft_admin_mount_runtime_001',
    },
    query: {
      ignored: 'safe',
    },
    body: {
      organizationId: 'org_body_should_not_win_001',
      tenantId: 'tenant_body_admin_mount_001',
      actorId: 'actor_body_should_not_win_001',
      idempotencyKey: 'idem_body_should_not_win_001',
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: false,
      },
      approvalContext: {
        accepted: true,
      },
      phone: '+886900001166',
      address: 'unsafe address should not leak',
      lineUserId: 'unsafe_line_user_should_not_leak',
      lineAccessToken: 'unsafe_line_token_should_not_leak',
      finalAppointmentId: 'unsafe_final_appointment_should_not_leak',
      DATABASE_URL: 'postgres://unsafe_should_not_leak',
    },
    context: {
      organizationId: 'org_context_admin_mount_001',
      tenantId: 'tenant_context_admin_mount_001',
      actorId: 'actor_context_should_not_win_001',
      requestId: 'req_context_admin_mount_001',
    },
    requestId: 'req_admin_mount_runtime_001',
    idempotencyKey: 'idem_admin_mount_runtime_001',
    user: {
      id: 'user_admin_mount_runtime_001',
      organizationId: 'org_admin_mount_runtime_001',
      tenantId: 'tenant_admin_mount_runtime_001',
      permissions: [REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION],
    },
    ...overrides,
  };
}

async function invokeRoute(route, req) {
  const res = createResponse();
  const stack = route.route.stack;
  let routeError = null;

  await new Promise((resolve) => {
    const maybePromise = stack[0].handle(req, res, (error) => {
      routeError = error || null;
      resolve();
    });

    if (maybePromise && typeof maybePromise.then === 'function') {
      maybePromise.catch((error) => {
        routeError = error;
        resolve();
      });
    }
  });

  if (!routeError) {
    await stack[1].handle(req, res, (error) => {
      routeError = error || null;
    });
  }

  return {
    error: routeError,
    res,
  };
}

function assertSafe(value) {
  const serialized = JSON.stringify(value);

  [
    '+886900001166',
    'unsafe_',
    'postgres://',
    'lineAccessToken',
    'lineUserId',
    'finalAppointmentId',
    'DATABASE_URL',
    'databaseUrl',
    'rawRows',
    'rawPayload',
    'headers',
    'authorization',
    'stack',
    'token',
  ].forEach((marker) => {
    assert.equal(serialized.includes(marker), false, `unsafe marker leaked: ${marker}`);
  });
}

test('default app router does not mount protected admin Draft to Case route', () => {
  const appRouter = createAppRouter();

  assert.equal(findRoute(appRouter, 'post', REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH), undefined);
});

test('feature flag without runtime ports keeps protected admin route unmounted', () => {
  const appRouter = createAppRouter({
    repairIntakeDraftToCaseRoutesEnabled: true,
  });

  assert.equal(findRoute(appRouter, 'post', REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH), undefined);
});

test('feature flag and injected runtime ports mount only protected admin submit route', () => {
  const calls = [];
  const appRouter = createAppRouter({
    repairIntakeDraftToCaseRoutesEnabled: true,
    repairIntakeDraftToCaseRuntimePorts: createRuntimePorts(calls),
  });
  const route = findRoute(appRouter, 'post', REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH);

  assert.ok(route, 'missing protected admin Draft to Case submit route');
  assert.equal(route.route.stack.length, 2);
  assert.equal(publicRepairIntakeRouteLayers(appRouter).length, 0);
  assert.equal(findRoute(appRouter, 'post', '/api/v1/admin/repair-intake/drafts/:draftId/case/plan'), undefined);
  assert.equal(calls.length, 0, 'mounting admin route must not execute runtime ports');
});

test('protected admin route requires cases.create permission before submit handler', async () => {
  const appRouter = createAppRouter({
    repairIntakeDraftToCaseRoutesEnabled: true,
    repairIntakeDraftToCaseRuntimePorts: createRuntimePorts(),
  });
  const route = findRoute(appRouter, 'post', REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH);
  const output = await invokeRoute(route, request({
    user: {
      id: 'user_admin_mount_denied_001',
      permissions: [],
    },
  }));

  assert.equal(output.error && output.error.code, 'PERMISSION_DENIED');
  assert.deepEqual(output.res.statusCalls, []);
  assert.deepEqual(output.res.jsonCalls, []);
});

test('protected admin route derives permission context and actor from authenticated user', async () => {
  const calls = [];
  const appRouter = createAppRouter({
    repairIntakeDraftToCaseRoutesEnabled: true,
    repairIntakeDraftToCaseRuntimePorts: createRuntimePorts(calls),
  });
  const route = findRoute(appRouter, 'post', REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH);
  const output = await invokeRoute(route, request());

  assert.ifError(output.error);
  assert.deepEqual(output.res.statusCalls, [200]);
  assert.equal(output.res.jsonCalls.length, 1);
  assert.equal(output.res.jsonCalls[0].ok, true);
  assert.equal(output.res.jsonCalls[0].action, 'repair_intake_draft_to_case_submit');
  assert.equal(output.res.jsonCalls[0].submitted, true);
  assertSafe(output.res.jsonCalls);
  assert.ok(calls.some((call) => call.name === 'case.create'));
  assert.ok(calls.some((call) => call.name === 'audit.record'));

  const draftReadCall = calls.find((call) => call.name === 'draft.find');
  assert.equal(draftReadCall.input.draftId, 'draft_admin_mount_runtime_001');
  assert.equal(draftReadCall.input.organizationId, 'org_admin_mount_runtime_001');
  assert.equal(draftReadCall.input.actorId, 'user_admin_mount_runtime_001');

  const idempotencyReadCall = calls.find((call) => call.name === 'idempotency.find');
  assert.equal(idempotencyReadCall.input.idempotencyKey, 'idem_admin_mount_runtime_001');

  const caseCreateCall = calls.find((call) => call.name === 'case.create');
  assert.equal(caseCreateCall.input.draftId, 'draft_admin_mount_runtime_001');
  assert.equal(caseCreateCall.input.organizationId, 'org_admin_mount_runtime_001');
  assert.equal(caseCreateCall.input.actor.actorId, 'user_admin_mount_runtime_001');
});

test('admin route source keeps bounded mount and feature flag invariants', () => {
  const routeSource = read('src/routes/repairIntakeDraftToCase.routes.js');
  const indexSource = read('src/routes/index.js');
  const envSource = read('src/config/env.js');

  assert.equal(REPAIR_INTAKE_DRAFT_TO_CASE_ROUTES_ENABLED_ENV, 'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTES_ENABLED');
  assert.ok(envSource.includes("'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTES_ENABLED'"));
  assert.ok(envSource.includes('repairIntakeDraftToCaseRoutesEnabled'));
  assert.ok(routeSource.includes("requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION)"));
  assert.ok(routeSource.includes("REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION = 'cases.create'"));
  assert.ok(indexSource.includes('registerRepairIntakeDraftToCaseAdminRoutes(appRouter'));

  [
    "require('../db",
    "require('../repositories",
    "require('../server",
    'src/db',
    'src/repositories',
    'src/server',
    'DATABASE_URL',
    'app.listen',
    'server.listen',
    'sendLine',
    'sendSms',
    'sendEmail',
    'webhook',
    'openai',
    'vector',
    'rag',
    'billing',
    'settlement',
    'payment',
    'invoice',
    'admin/src',
  ].forEach((marker) => {
    assert.equal(routeSource.includes(marker), false, `forbidden route source marker ${marker}`);
  });
});

test('route registrar can be called directly and returns bounded mount summary', () => {
  const router = {
    calls: [],
    post(pathname, ...handlers) {
      this.calls.push({ pathname, handlers });
    },
  };
  const summary = registerRepairIntakeDraftToCaseAdminRoutes(router, {
    repairIntakeDraftToCaseRoutesEnabled: true,
    repairIntakeDraftToCaseRuntimePorts: createRuntimePorts(),
  });

  assert.equal(summary.ok, true);
  assert.equal(summary.mounted, 1);
  assert.deepEqual(summary.routes, [{
    method: 'POST',
    path: REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH,
  }]);
  assert.equal(router.calls.length, 1);
  assert.equal(router.calls[0].pathname, REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH);
  assert.equal(router.calls[0].handlers.length, 2);
});

test('admin request builder ignores body actor and grants permission from route middleware', () => {
  const requestLike = buildAdminRequestLike(request());

  assert.equal(requestLike.repairIntakeDraftId, 'draft_admin_mount_runtime_001');
  assert.equal(requestLike.draftId, 'draft_admin_mount_runtime_001');
  assert.equal(requestLike.params.draftId, 'draft_admin_mount_runtime_001');
  assert.equal(requestLike.params.repairIntakeDraftId, 'draft_admin_mount_runtime_001');
  assert.equal(Object.hasOwn(requestLike.body, 'draftId'), false);
  assert.equal(Object.hasOwn(requestLike.body, 'repairIntakeDraftId'), false);
  assert.equal(requestLike.organizationId, 'org_admin_mount_runtime_001');
  assert.equal(requestLike.idempotencyKey, 'idem_admin_mount_runtime_001');
  assert.equal(requestLike.context.organizationId, 'org_admin_mount_runtime_001');
  assert.equal(requestLike.context.actorId, 'user_admin_mount_runtime_001');
  assert.equal(requestLike.actor.id, 'user_admin_mount_runtime_001');
  assert.equal(Object.hasOwn(requestLike.body, 'actorId'), false);
  assert.equal(Object.hasOwn(requestLike.body, 'organizationId'), false);
  assert.equal(Object.hasOwn(requestLike.body, 'idempotencyKey'), false);
  assert.equal(requestLike.body.permissionContext.canCreateCaseFromRepairIntakeDraft, true);
  assert.equal(requestLike.context.permissionContext.permission, REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION);
});

test('admin request builder does not trust body draft id as route context', () => {
  const baseRequest = request();
  const requestLike = buildAdminRequestLike(request({
    params: {},
    body: {
      ...baseRequest.body,
      draftId: 'draft_admin_mount_body_fallback_001',
    },
  }));

  assert.equal(requestLike.repairIntakeDraftId, undefined);
  assert.equal(requestLike.draftId, undefined);
  assert.equal(requestLike.params.draftId, undefined);
  assert.equal(requestLike.params.repairIntakeDraftId, undefined);
  assert.equal(Object.hasOwn(requestLike.body, 'draftId'), false);
  assert.equal(Object.hasOwn(requestLike.body, 'repairIntakeDraftId'), false);
});
