'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createRepairIntakeDraftToCaseInjectedRouteComposition,
} = require('../../src/repairIntake/repairIntakeDraftToCaseInjectedRouteComposition');

const SOURCE_PATH = path.resolve(
  __dirname,
  '../../src/repairIntake/repairIntakeDraftToCaseInjectedRouteComposition.js',
);

function createSyntheticMountTarget() {
  const routeHandlers = new Map();
  const registrations = [];

  function add(method, routePath, handler) {
    registrations.push({ method, path: routePath, handler });
    routeHandlers.set(`${method.toUpperCase()} ${routePath}`, handler);
  }

  return {
    registrations,
    post: (routePath, handler) => {
      add('POST', routePath, handler);
    },
    async dispatch(method, routePath, requestLike) {
      const handler = routeHandlers.get(`${method.toUpperCase()} ${routePath}`);

      if (!handler) {
        return {
          ok: false,
          body: {
            ok: false,
            reasonCode: 'SYNTHETIC_ROUTE_NOT_FOUND',
            requiredActions: ['configure_route'],
          },
        };
      }

      const response = await handler(requestLike);

      return {
        ok: response && response.ok === true,
        body: response && (response.body || response),
      };
    },
  };
}

function requestLike() {
  return {
    params: {
      draftId: 'draft_task1056',
      phone: '+886900001056',
    },
    body: {
      organizationId: 'org_task1056',
      tenantId: 'tenant_task1056',
      idempotencyKey: 'idem_task1056',
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
      },
      approvalContext: {
        accepted: true,
      },
      phone: '+886900001056',
      address: 'unsafe address task1056',
      lineUserId: 'unsafe_line_task1056',
      lineAccessToken: 'unsafe_line_token_task1056',
      finalAppointmentId: 'unsafe_final_task1056',
      DATABASE_URL: 'postgres://unsafe_task1056',
    },
    context: {
      organizationId: 'org_task1056',
      actorId: 'actor_task1056',
      requestId: 'req_task1056',
      tenantId: 'tenant_task1056',
    },
    rawBody: 'unsafe raw body task1056',
    headers: {
      authorization: 'Bearer unsafe_task1056',
    },
  };
}

function createRuntimePorts(calls, existingResult = null) {
  return {
    idempotencyStore: {
      findExistingDraftToCaseResult: async (lookup) => {
        calls.push({ name: 'idempotencyStore.find', payload: lookup });
        return existingResult;
      },
      recordDraftToCaseResult: async (input) => {
        calls.push({ name: 'idempotencyStore.record', payload: input });
        return {
          ok: true,
          status: 'recorded',
          submitted: true,
          reasonCode: 'IDEMPOTENCY_RECORDED_TASK1056',
          result: input.result,
        };
      },
    },
    draftRepository: {
      findDraftForConversion: async (lookup) => {
        calls.push({ name: 'draftRepository', payload: lookup });
        return {
          id: 'draft_task1056',
          organizationId: 'org_task1056',
          tenantId: 'tenant_task1056',
          status: 'ready',
          summary: {
            title: 'safe draft task1056',
            phone: '+886900001056',
          },
          phone: '+886900001056',
          address: 'unsafe address task1056',
          lineUserId: 'unsafe_line_task1056',
          finalAppointmentId: 'unsafe_final_task1056',
          rawRows: [{ phone: '+886900001056' }],
          stack: 'unsafe_stack_task1056',
        };
      },
    },
    planningPolicy: {
      planCaseFromDraft: async (payload) => {
        calls.push({ name: 'planningPolicy', payload });
        return {
          status: 'planned',
          reasonCode: 'PLAN_READY_TASK1056',
          candidate: {
            sourceDraftId: 'draft_task1056',
            organizationId: 'org_task1056',
            customerPhone: '+886900001056',
          },
          rawRows: [{ phone: '+886900001056' }],
          token: 'unsafe_token_task1056',
        };
      },
    },
    caseCreationPort: {
      createCaseFromDraft: async (payload) => {
        calls.push({ name: 'caseCreationPort', payload });
        return {
          id: 'case_task1056',
          organizationId: 'org_task1056',
          sourceDraftId: 'draft_task1056',
          status: 'created',
          reasonCode: 'CASE_CREATED_TASK1056',
          finalAppointmentId: 'unsafe_final_task1056',
          databaseUrl: 'postgres://unsafe_task1056',
        };
      },
    },
    auditPort: {
      recordDraftToCaseDecision: async (payload) => {
        calls.push({ name: 'auditPort', payload });
        return {
          eventType: 'repair_intake_draft_to_case_decision',
          outcome: 'submitted',
          draftId: 'draft_task1056',
          organizationId: 'org_task1056',
          token: 'unsafe_token_task1056',
          stack: 'unsafe_stack_task1056',
        };
      },
    },
  };
}

function collectEntries(value, entries = []) {
  if (!value || typeof value !== 'object') {
    return entries;
  }

  for (const [key, fieldValue] of Object.entries(value)) {
    entries.push([key, fieldValue]);
    collectEntries(fieldValue, entries);
  }

  return entries;
}

function assertNoUnsafeText(value) {
  const entries = collectEntries(value);

  for (const [key, fieldValue] of entries) {
    if (['applicationService', 'controller', 'apiModule'].includes(key)) {
      assert.equal(typeof fieldValue, 'boolean');
      continue;
    }

    for (const forbiddenKey of [
      'handler',
      'mountTarget',
      'runtimePorts',
      'rawRows',
      'rawBody',
      'headers',
      'authorization',
      'phone',
      'address',
      'lineUserId',
      'lineAccessToken',
      'finalAppointmentId',
      'databaseUrl',
      'DATABASE_URL',
      'token',
      'stack',
    ]) {
      assert.notEqual(key, forbiddenKey, `leaked key ${forbiddenKey}`);
    }
  }

  const serialized = JSON.stringify(value);

  for (const forbiddenText of [
    '+886900001056',
    'unsafe_',
    'postgres://',
    'Bearer unsafe_task1056',
    'finalAppointmentId',
    'lineAccessToken',
    'lineUserId',
    'DATABASE_URL',
    'databaseUrl',
    'rawRows',
    'stack',
    'token',
    'secret',
    'providerPayload',
    'field_service_reports',
  ]) {
    assert.equal(serialized.includes(forbiddenText), false, `leaked ${forbiddenText}`);
  }
}

function assertSafeSummary(summary) {
  assert.deepEqual(Object.keys(summary).sort(), [
    'basePath',
    'components',
    'mounted',
    'ok',
    'reasonCode',
    'requiredActions',
    'routes',
  ]);

  for (const route of summary.routes) {
    assert.deepEqual(Object.keys(route).sort(), ['method', 'path']);
  }

  assertNoUnsafeText(summary);
}

test('route composition fails closed when runtimePorts are missing', () => {
  const summary = createRepairIntakeDraftToCaseInjectedRouteComposition({
    runtimePorts: null,
    mountTarget: { unsafe: true },
    basePath: 'https://unsafe.example/token',
  });

  assert.equal(summary.ok, false);
  assert.equal(summary.mounted, 0);
  assert.equal(summary.basePath, null);
  assert.equal(
    summary.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_COMPOSITION_PORTS_REQUIRED',
  );
  assert.deepEqual(summary.requiredActions, ['configure_runtime_ports']);
  assertSafeSummary(summary);
});

test('route composition returns no-mount readiness summary without calling ports', () => {
  const calls = [];
  const summary = createRepairIntakeDraftToCaseInjectedRouteComposition({
    runtimePorts: createRuntimePorts(calls),
    basePath: '/route-composer',
  });

  assert.equal(summary.ok, true);
  assert.equal(summary.mounted, 0);
  assert.equal(summary.basePath, '/route-composer');
  assert.equal(summary.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_COMPOSITION_READY');
  assert.deepEqual(summary.routes, [
    {
      method: 'POST',
      path: '/repair-intake/drafts/:draftId/case/plan',
    },
    {
      method: 'POST',
      path: '/repair-intake/drafts/:draftId/case/submit',
    },
  ]);
  assert.deepEqual(calls, []);
  assertSafeSummary(summary);
});

test('route composition mounts only on explicit synthetic target', async () => {
  const calls = [];
  const mountTarget = createSyntheticMountTarget();
  const summary = createRepairIntakeDraftToCaseInjectedRouteComposition({
    runtimePorts: createRuntimePorts(calls),
    mountTarget,
    basePath: '/route-composer',
  });

  assert.equal(summary.ok, true);
  assert.equal(summary.mounted, 2);
  assert.equal(summary.basePath, '/route-composer');
  assert.equal(summary.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_COMPOSITION_MOUNTED');
  assert.equal(mountTarget.registrations.length, 2);
  assertSafeSummary(summary);

  const planResponse = await mountTarget.dispatch(
    'POST',
    '/route-composer/repair-intake/drafts/:draftId/case/plan',
    requestLike(),
  );

  assert.deepEqual(calls.map((call) => call.name), ['draftRepository', 'planningPolicy']);
  assert.equal(planResponse.ok, true);
  assert.equal(planResponse.body.reasonCode, 'PLAN_READY_TASK1056');
  assertNoUnsafeText(planResponse);
  assertNoUnsafeText(calls.map((call) => call.payload));

  const submitStart = calls.length;
  const submitResponse = await mountTarget.dispatch(
    'POST',
    '/route-composer/repair-intake/drafts/:draftId/case/submit',
    requestLike(),
  );
  const submitCalls = calls.slice(submitStart);

  assert.deepEqual(submitCalls.map((call) => call.name), [
    'idempotencyStore.find',
    'draftRepository',
    'planningPolicy',
    'caseCreationPort',
    'auditPort',
    'idempotencyStore.record',
  ]);
  assert.equal(submitResponse.ok, true);
  assert.equal(submitResponse.body.reasonCode, 'CASE_CREATED_TASK1056');
  assertNoUnsafeText(submitResponse);
  assertNoUnsafeText(submitCalls.map((call) => call.payload));
});

test('route composition submit permission failure stops before fake repository ports', async () => {
  const calls = [];
  const mountTarget = createSyntheticMountTarget();
  const summary = createRepairIntakeDraftToCaseInjectedRouteComposition({
    runtimePorts: createRuntimePorts(calls),
    mountTarget,
    basePath: '/route-composer',
  });
  const deniedRequest = requestLike();
  deniedRequest.body.permissionContext = {
    canCreateCaseFromRepairIntakeDraft: false,
  };
  deniedRequest.body.sql = 'select * from field_service_reports where token = secret';
  deniedRequest.body.providerPayload = {
    lineAccessToken: 'unsafe_provider_token_task1614',
  };

  assert.equal(summary.ok, true);
  assert.equal(summary.mounted, 2);

  const response = await mountTarget.dispatch(
    'POST',
    '/route-composer/repair-intake/drafts/:draftId/case/submit',
    deniedRequest,
  );

  assert.equal(response.ok, false);
  assert.equal(response.body.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_PERMISSION_REQUIRED');
  assert.deepEqual(response.body.requiredActions, ['provide_case_creation_permission']);
  assert.deepEqual(calls, []);
  assertNoUnsafeText(response);
});

test('route composition source only imports the runtime composer', () => {
  const source = fs.readFileSync(SOURCE_PATH, 'utf8');

  assert.equal(source.includes('repairIntakeDraftToCaseInjectedRuntimeComposer'), true);

  for (const forbidden of [
    "require('../db')",
    "require('../repositories')",
    "require('../routes')",
    "require('../controllers')",
    "require('../app')",
    "require('../server')",
    'express()',
    'app.listen',
    'server.listen',
    'fetch(',
    'axios',
    'process.env',
    'DATABASE_URL',
    'INSERT INTO',
    'UPDATE ',
    'DELETE FROM',
    'SELECT ',
    'sendLine',
    'sendSms',
    'sendEmail',
    'openai',
    'vector',
    'billing',
    'invoice',
    'payment',
  ]) {
    assert.equal(source.includes(forbidden), false, `forbidden source marker ${forbidden}`);
  }

  assert.doesNotMatch(source, /(^|[^'"])listen\(/);
});
