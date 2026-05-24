'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createPublicRouter,
} = require('../../src/routes/public.routes');

const repoRoot = path.resolve(__dirname, '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function routeLayers(router) {
  return Array.isArray(router && router.stack)
    ? router.stack.filter((layer) => layer && layer.route)
    : [];
}

function routePaths(router) {
  return routeLayers(router).map((layer) => layer.route.path);
}

function repairIntakeRouteLayers(router) {
  return routeLayers(router).filter((layer) => (
    typeof layer.route.path === 'string'
    && layer.route.path.startsWith('/repair-intake')
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
          id: 'draft_public_mount_runtime_001',
          organizationId: 'org_public_mount_runtime_001',
          tenantId: 'tenant_public_mount_runtime_001',
          status: 'ready',
          summary: {
            title: 'safe public mount draft',
          },
          phone: '+886900001109',
          address: 'unsafe address should not leak',
          lineUserId: 'unsafe_line_user_should_not_leak',
          finalAppointmentId: 'unsafe_final_appointment_should_not_leak',
          rawRows: [{ phone: '+886900001109' }],
          stack: 'unsafe stack should not leak',
        };
      },
    },
    planningPolicy: {
      planCaseFromDraft: async (input) => {
        calls.push({ name: 'plan.case', input });
        return {
          status: 'planned',
          reasonCode: 'REPAIR_INTAKE_PUBLIC_ROUTE_PLAN_READY',
          candidate: {
            sourceDraftId: 'draft_public_mount_runtime_001',
            organizationId: 'org_public_mount_runtime_001',
          },
          rawRows: [{ phone: '+886900001109' }],
          token: 'unsafe_token_should_not_leak',
        };
      },
    },
    caseCreationPort: {
      createCaseFromDraft: async (input) => {
        calls.push({ name: 'case.create', input });
        return {
          id: 'case_public_mount_runtime_001',
          organizationId: 'org_public_mount_runtime_001',
          sourceDraftId: 'draft_public_mount_runtime_001',
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
          draftId: 'draft_public_mount_runtime_001',
          organizationId: 'org_public_mount_runtime_001',
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
      draftId: 'draft_public_mount_runtime_001',
    },
    body: {
      organizationId: 'org_public_mount_runtime_001',
      tenantId: 'tenant_public_mount_runtime_001',
      idempotencyKey: 'idem_public_mount_runtime_001',
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
      },
      approvalContext: {
        accepted: true,
      },
      phone: '+886900001109',
      address: 'unsafe address should not leak',
      lineUserId: 'unsafe_line_user_should_not_leak',
      lineAccessToken: 'unsafe_line_token_should_not_leak',
      finalAppointmentId: 'unsafe_final_appointment_should_not_leak',
      DATABASE_URL: 'postgres://unsafe_should_not_leak',
    },
    context: {
      organizationId: 'org_public_mount_runtime_001',
      tenantId: 'tenant_public_mount_runtime_001',
      actorId: 'actor_public_mount_runtime_001',
      requestId: 'req_public_mount_runtime_001',
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
    '+886900001109',
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

async function dispatchMountedRoute(router, suffix) {
  const layer = repairIntakeRouteLayers(router).find((candidate) => (
    typeof candidate.route.path === 'string'
    && candidate.route.path.endsWith(suffix)
  ));

  assert.ok(layer, `missing mounted route ending in ${suffix}`);
  assert.equal(layer.route.methods.post, true);

  const routeStack = Array.isArray(layer.route.stack) ? layer.route.stack : [];
  assert.ok(routeStack.length > 0, `missing route stack for ${suffix}`);

  return routeStack[0].handle(syntheticRequest());
}

test('default public router keeps existing public routes and does not mount Repair Intake routes', () => {
  const router = createPublicRouter();
  const paths = routePaths(router);

  assert.deepEqual(paths, [
    '/case-inquiry',
    '/line-case-inquiry',
    '/brand-referral/normalize',
  ]);
  assert.deepEqual(repairIntakeRouteLayers(router), []);
});

test('direct runtimePorts injection mounts Repair Intake plan and submit routes', () => {
  const calls = [];
  const router = createPublicRouter({
    repairIntakeDraftToCaseRuntimePorts: createRuntimePorts(calls),
  });
  const mountedPaths = repairIntakeRouteLayers(router).map((layer) => layer.route.path);

  assert.equal(mountedPaths.length, 2);
  assert.ok(mountedPaths.every((routePath) => routePath.startsWith('/repair-intake')));
  assert.ok(mountedPaths.some((routePath) => routePath.endsWith('/drafts/:draftId/case/plan')));
  assert.ok(mountedPaths.some((routePath) => routePath.endsWith('/drafts/:draftId/case/submit')));
  assert.equal(calls.length, 0, 'mounting routes must not execute runtime ports');
});

test('nested runtimePorts injection also mounts Repair Intake routes', () => {
  const calls = [];
  const router = createPublicRouter({
    repairIntakeDraftToCase: {
      runtimePorts: createRuntimePorts(calls),
    },
  });
  const mountedPaths = repairIntakeRouteLayers(router).map((layer) => layer.route.path);

  assert.equal(mountedPaths.length, 2);
  assert.ok(mountedPaths.every((routePath) => routePath.startsWith('/repair-intake')));
  assert.ok(mountedPaths.some((routePath) => routePath.endsWith('/drafts/:draftId/case/plan')));
  assert.ok(mountedPaths.some((routePath) => routePath.endsWith('/drafts/:draftId/case/submit')));
  assert.equal(calls.length, 0, 'mounting routes must not execute runtime ports');
});

test('mounted plan and submit handlers can be directly dispatched without server startup', async () => {
  const calls = [];
  const router = createPublicRouter({
    repairIntakeDraftToCaseRuntimePorts: createRuntimePorts(calls),
  });
  const plan = await dispatchMountedRoute(router, '/drafts/:draftId/case/plan');
  const submit = await dispatchMountedRoute(router, '/drafts/:draftId/case/submit');

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

test('public route mount runtime source keeps safety invariants', () => {
  const source = read('src/routes/public.routes.js');

  [
    "require('../db')",
    "require('../repositories')",
    "require('../app')",
    "require('../server')",
    'src/db',
    'src/repositories',
    'src/app',
    'src/server',
    'app.listen',
    'server.listen',
    'listen(',
    'process.env',
    'DATABASE_URL',
    'sendLine',
    'sendSms',
    'sendEmail',
    'openai',
    'vector',
    'billing',
    'settlement',
    'invoice',
    'payment',
  ].forEach((marker) => {
    assert.equal(source.includes(marker), false, `forbidden public route source marker ${marker}`);
  });
});
