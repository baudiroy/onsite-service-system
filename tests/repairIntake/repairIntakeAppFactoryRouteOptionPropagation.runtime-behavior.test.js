'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createApp,
} = require('../../src/app');

const repoRoot = path.resolve(__dirname, '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function appStack(app) {
  return app && app._router && Array.isArray(app._router.stack)
    ? app._router.stack
    : [];
}

function appRouterLayer(app) {
  return appStack(app).find((layer) => (
    layer
    && layer.name === 'router'
    && layer.handle
    && Array.isArray(layer.handle.stack)
    && layer.handle.stack.some((nestedLayer) => (
      nestedLayer
      && nestedLayer.handle
      && Array.isArray(nestedLayer.handle.stack)
      && nestedLayer.handle.stack.some((publicLayer) => (
        publicLayer
        && publicLayer.route
        && publicLayer.route.path === '/case-inquiry'
      ))
    ))
  ));
}

function publicMountLayer(app) {
  const appLayer = appRouterLayer(app);

  return appLayer
    ? appLayer.handle.stack.find((layer) => (
      layer
      && layer.name === 'router'
      && layer.handle
      && Array.isArray(layer.handle.stack)
      && layer.handle.stack.some((nestedLayer) => (
        nestedLayer
        && nestedLayer.route
        && nestedLayer.route.path === '/case-inquiry'
      ))
    ))
    : undefined;
}

function publicRouteLayers(app) {
  const publicLayer = publicMountLayer(app);

  return publicLayer
    ? publicLayer.handle.stack.filter((layer) => layer && layer.route)
    : [];
}

function repairIntakeRouteLayers(app) {
  return publicRouteLayers(app).filter((layer) => (
    typeof layer.route.path === 'string'
    && layer.route.path.startsWith('/repair-intake')
  ));
}

function effectivePublicPaths(app) {
  return repairIntakeRouteLayers(app).map((layer) => (
    `/api/v1/public${layer.route.path}`
  ));
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
          id: 'draft_app_factory_runtime_001',
          organizationId: 'org_app_factory_runtime_001',
          tenantId: 'tenant_app_factory_runtime_001',
          status: 'ready',
          summary: {
            title: 'safe app factory draft',
          },
          phone: '+886900001119',
          address: 'unsafe address should not leak',
          lineUserId: 'unsafe_line_user_should_not_leak',
          finalAppointmentId: 'unsafe_final_appointment_should_not_leak',
          rawRows: [{ phone: '+886900001119' }],
          stack: 'unsafe stack should not leak',
        };
      },
    },
    planningPolicy: {
      planCaseFromDraft: async (input) => {
        calls.push({ name: 'plan.case', input });
        return {
          status: 'planned',
          reasonCode: 'REPAIR_INTAKE_APP_FACTORY_PLAN_READY',
          candidate: {
            sourceDraftId: 'draft_app_factory_runtime_001',
            organizationId: 'org_app_factory_runtime_001',
          },
          rawRows: [{ phone: '+886900001119' }],
          token: 'unsafe_token_should_not_leak',
        };
      },
    },
    caseCreationPort: {
      createCaseFromDraft: async (input) => {
        calls.push({ name: 'case.create', input });
        return {
          id: 'case_app_factory_runtime_001',
          organizationId: 'org_app_factory_runtime_001',
          sourceDraftId: 'draft_app_factory_runtime_001',
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
          draftId: 'draft_app_factory_runtime_001',
          organizationId: 'org_app_factory_runtime_001',
          token: 'unsafe_token_should_not_leak',
          stack: 'unsafe stack should not leak',
        };
      },
    },
  };
}

function syntheticRequest() {
  return {
    params: {
      draftId: 'draft_app_factory_runtime_001',
    },
    body: {
      organizationId: 'org_app_factory_runtime_001',
      tenantId: 'tenant_app_factory_runtime_001',
      idempotencyKey: 'idem_app_factory_runtime_001',
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
      },
      approvalContext: {
        accepted: true,
      },
      phone: '+886900001119',
      address: 'unsafe address should not leak',
      lineUserId: 'unsafe_line_user_should_not_leak',
      lineAccessToken: 'unsafe_line_token_should_not_leak',
      finalAppointmentId: 'unsafe_final_appointment_should_not_leak',
      DATABASE_URL: 'postgres://unsafe_should_not_leak',
    },
    context: {
      organizationId: 'org_app_factory_runtime_001',
      tenantId: 'tenant_app_factory_runtime_001',
      actorId: 'actor_app_factory_runtime_001',
      requestId: 'req_app_factory_runtime_001',
    },
    rawBody: 'unsafe raw body should not leak',
    headers: {
      authorization: 'Bearer unsafe_should_not_leak',
    },
  };
}

function assertSafe(value) {
  const serialized = JSON.stringify(value);

  [
    '+886900001119',
    'unsafe_',
    'postgres://',
    'Bearer unsafe',
    'lineAccessToken',
    'lineUserId',
    'finalAppointmentId',
    'DATABASE_URL',
    'databaseUrl',
    'rawRows',
    'rawPayload',
    'rawBody',
    'headers',
    'authorization',
    'stack',
    'token',
  ].forEach((marker) => {
    assert.equal(serialized.includes(marker), false, `unsafe marker leaked: ${marker}`);
  });
}

async function dispatchMountedRoute(app, suffix) {
  const layer = repairIntakeRouteLayers(app).find((candidate) => (
    typeof candidate.route.path === 'string'
    && candidate.route.path.endsWith(suffix)
  ));

  assert.ok(layer, `missing mounted route ending in ${suffix}`);
  assert.equal(layer.route.methods.post, true);

  const routeStack = Array.isArray(layer.route.stack) ? layer.route.stack : [];
  assert.ok(routeStack.length > 0, `missing route stack for ${suffix}`);

  return routeStack[0].handle(syntheticRequest());
}

function createAppRouterOptionsBlock(source) {
  const match = source.match(/app\.use\(createAppRouter\(\{[\s\S]*?\}\)\);/);

  assert.ok(match, 'missing app.use(createAppRouter({ ... })) block');
  return match[0];
}

test('default createApp builds app router safely without Repair Intake public routes', () => {
  const app = createApp();

  assert.ok(appRouterLayer(app), 'missing app router layer');
  assert.ok(publicMountLayer(app), 'missing public router layer');
  assert.deepEqual(effectivePublicPaths(app), []);
});

test('direct runtimePorts propagation mounts Repair Intake routes through createApp', () => {
  const calls = [];
  const app = createApp({
    repairIntakeDraftToCaseRuntimePorts: createRuntimePorts(calls),
  });
  const paths = effectivePublicPaths(app);

  assert.equal(paths.length, 2);
  assert.ok(paths.every((routePath) => routePath.startsWith('/api/v1/public/repair-intake')));
  assert.ok(paths.some((routePath) => routePath.endsWith('/drafts/:draftId/case/plan')));
  assert.ok(paths.some((routePath) => routePath.endsWith('/drafts/:draftId/case/submit')));
  assert.equal(calls.length, 0, 'mounting through createApp must not execute runtime ports');
});

test('nested runtimePorts propagation mounts Repair Intake routes through createApp', () => {
  const calls = [];
  const app = createApp({
    repairIntakeDraftToCase: {
      runtimePorts: createRuntimePorts(calls),
    },
  });
  const paths = effectivePublicPaths(app);

  assert.equal(paths.length, 2);
  assert.ok(paths.every((routePath) => routePath.startsWith('/api/v1/public/repair-intake')));
  assert.ok(paths.some((routePath) => routePath.endsWith('/drafts/:draftId/case/plan')));
  assert.ok(paths.some((routePath) => routePath.endsWith('/drafts/:draftId/case/submit')));
  assert.equal(calls.length, 0, 'mounting through createApp must not execute runtime ports');
});

test('mounted createApp plan and submit handlers can be directly dispatched without server startup', async () => {
  const calls = [];
  const app = createApp({
    repairIntakeDraftToCaseRuntimePorts: createRuntimePorts(calls),
  });
  const plan = await dispatchMountedRoute(app, '/drafts/:draftId/case/plan');
  const submit = await dispatchMountedRoute(app, '/drafts/:draftId/case/submit');

  assert.equal(plan.ok, true);
  assert.equal(plan.action, 'repair_intake_draft_to_case_plan');
  assert.equal(submit.ok, true);
  assert.equal(submit.action, 'repair_intake_draft_to_case_submit');
  assertSafe([plan, submit]);
  assert.ok(calls.some((call) => call.name === 'draft.find'));
  assert.ok(calls.some((call) => call.name === 'plan.case'));
  assert.ok(calls.some((call) => call.name === 'case.create'));
  assert.ok(calls.some((call) => call.name === 'audit.record'));
});

test('app factory runtime source keeps safety invariants scoped to route option propagation', () => {
  const appSource = read('src/app.js');
  const routeOptionsBlock = createAppRouterOptionsBlock(appSource);

  assert.match(appSource, /const \{ createAppRouter \} = require\('\.\/routes'\);/);
  assert.match(routeOptionsBlock, /repairIntakeDraftToCaseRuntimePorts: options\.repairIntakeDraftToCaseRuntimePorts/);
  assert.match(routeOptionsBlock, /repairIntakeDraftToCase: options\.repairIntakeDraftToCase/);

  [
    "require('./server",
    "require('./db",
    "require('./repositories",
    "require('./repairIntake/",
    'app.listen',
    'server.listen',
    'listen(',
    'process.env.REPAIR_INTAKE',
    'DATABASE_URL',
  ].forEach((marker) => {
    assert.equal(appSource.includes(marker), false, `forbidden app source marker ${marker}`);
  });

  [
    'defaultRepairIntake',
    'new DraftRepository',
    'new CaseRepository',
    'new IdempotencyRepository',
    'new AuditRepository',
    'provider',
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
    'openapi',
    'swagger',
    'admin/src',
  ].forEach((marker) => {
    assert.equal(routeOptionsBlock.includes(marker), false, `forbidden route option marker ${marker}`);
  });
});
