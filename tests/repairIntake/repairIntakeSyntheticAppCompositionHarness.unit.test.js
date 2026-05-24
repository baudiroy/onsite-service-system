'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createRepairIntakeSyntheticAppCompositionHarness,
} = require('../../src/repairIntake/repairIntakeSyntheticAppCompositionHarness');

const SOURCE_PATH = path.resolve(
  __dirname,
  '../../src/repairIntake/repairIntakeSyntheticAppCompositionHarness.js',
);

function unsafeRequestLike() {
  return {
    params: {
      draftId: 'draft_task1061',
      phone: '+886900001061',
      lineUserId: 'unsafe_param_line_task1061',
    },
    query: {
      sql: 'select * from unsafe_query_task1061',
    },
    body: {
      organizationId: 'org_task1061',
      tenantId: 'tenant_task1061',
      idempotencyKey: 'idem_task1061',
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
      },
      approvalContext: {
        accepted: true,
      },
      phone: '+886900001061',
      address: 'unsafe address task1061',
      customerName: 'unsafe customer task1061',
      lineUserId: 'unsafe_line_task1061',
      lineAccessToken: 'unsafe_line_token_task1061',
      finalAppointmentId: 'unsafe_final_task1061',
      DATABASE_URL: 'postgres://unsafe_task1061',
    },
    context: {
      organizationId: 'org_task1061',
      actorId: 'actor_task1061',
      requestId: 'req_task1061',
      tenantId: 'tenant_task1061',
      lineUserId: 'unsafe_context_line_task1061',
    },
    rawBody: 'unsafe raw body task1061',
    headers: {
      authorization: 'Bearer unsafe_task1061',
      cookie: 'unsafe_cookie_task1061=1',
    },
  };
}

function createRuntimePorts(calls, options = {}) {
  return {
    idempotencyStore: {
      findExistingDraftToCaseResult: async (lookup) => {
        calls.push({ name: 'idempotencyStore.find', payload: lookup });
        return options.existingResult || null;
      },
      recordDraftToCaseResult: async (input) => {
        calls.push({ name: 'idempotencyStore.record', payload: input });
        return {
          ok: true,
          submitted: true,
          reasonCode: 'IDEMPOTENCY_RECORDED_TASK1061',
          result: input.result,
          rawRows: [{ phone: '+886900001061' }],
          finalAppointmentId: 'unsafe_final_task1061',
          stack: 'unsafe_record_stack_task1061',
        };
      },
    },
    draftRepository: {
      findDraftForConversion: async (lookup) => {
        calls.push({ name: 'draftRepository', payload: lookup });
        return {
          id: 'draft_task1061',
          organizationId: 'org_task1061',
          tenantId: 'tenant_task1061',
          status: 'ready',
          source: 'repair_intake',
          reasonCode: 'DRAFT_READY_TASK1061',
          summary: {
            title: 'safe draft task1061',
            phone: '+886900001061',
          },
          phone: '+886900001061',
          address: 'unsafe address task1061',
          lineUserId: 'unsafe_draft_line_task1061',
          finalAppointmentId: 'unsafe_final_task1061',
          rawRows: [{ phone: '+886900001061' }],
          stack: 'unsafe_draft_stack_task1061',
        };
      },
    },
    planningPolicy: {
      planCaseFromDraft: async (payload) => {
        calls.push({ name: 'planningPolicy', payload });
        return {
          status: 'planned',
          reasonCode: 'PLAN_READY_TASK1061',
          candidate: {
            sourceDraftId: 'draft_task1061',
            organizationId: 'org_task1061',
            customerPhone: '+886900001061',
          },
          rawRows: [{ phone: '+886900001061' }],
          lineUserId: 'unsafe_plan_line_task1061',
          finalAppointmentId: 'unsafe_final_task1061',
          token: 'unsafe_plan_token_task1061',
          stack: 'unsafe_plan_stack_task1061',
        };
      },
    },
    caseCreationPort: {
      createCaseFromDraft: async (payload) => {
        calls.push({ name: 'caseCreationPort', payload });
        return {
          id: 'case_task1061',
          organizationId: 'org_task1061',
          tenantId: 'tenant_task1061',
          sourceDraftId: 'draft_task1061',
          status: 'created',
          reasonCode: 'CASE_CREATED_TASK1061',
          finalAppointmentId: 'unsafe_final_task1061',
          databaseUrl: 'postgres://unsafe_task1061',
          rawRows: [{ phone: '+886900001061' }],
          stack: 'unsafe_case_stack_task1061',
        };
      },
    },
    auditPort: {
      recordDraftToCaseDecision: async (payload) => {
        calls.push({ name: 'auditPort', payload });
        return {
          eventType: 'repair_intake_draft_to_case_decision',
          outcome: 'submitted',
          draftId: 'draft_task1061',
          organizationId: 'org_task1061',
          reasonCode: 'AUDIT_RECORDED_TASK1061',
          metadata: {
            lineUserId: 'unsafe_audit_line_task1061',
            phone: '+886900001061',
            sql: 'select * from unsafe_audit_task1061',
          },
          finalAppointmentId: 'unsafe_final_task1061',
          token: 'unsafe_audit_token_task1061',
          stack: 'unsafe_audit_stack_task1061',
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
    if (key === 'handleSyntheticRequest') {
      assert.equal(typeof fieldValue, 'function');
      continue;
    }

    for (const forbiddenKey of [
      'runtimePorts',
      'mountTarget',
      'handler',
      'handlers',
      'request',
      'rawRows',
      'rawBody',
      'headers',
      'authorization',
      'cookie',
      'phone',
      'address',
      'customerName',
      'lineUserId',
      'lineAccessToken',
      'finalAppointmentId',
      'databaseUrl',
      'DATABASE_URL',
      'sql',
      'token',
      'stack',
    ]) {
      assert.notEqual(key, forbiddenKey, `leaked key ${forbiddenKey}`);
    }
  }

  const serialized = JSON.stringify(value);

  for (const forbiddenText of [
    '+886900001061',
    'unsafe_',
    'unsafe address task1061',
    'unsafe customer task1061',
    'unsafe_final_task1061',
    'unsafe_line_task1061',
    'unsafe raw body task1061',
    'Bearer unsafe_task1061',
    'select *',
    'postgres://',
    'finalAppointmentId',
    'lineAccessToken',
    'lineUserId',
    'DATABASE_URL',
    'databaseUrl',
    'rawRows',
    'stack',
    'token',
  ]) {
    assert.equal(serialized.includes(forbiddenText), false, `leaked ${forbiddenText}`);
  }
}

function assertSafeHarness(harness) {
  assert.deepEqual(Object.keys(harness).sort(), [
    'basePath',
    'handleSyntheticRequest',
    'mounted',
    'ok',
    'reasonCode',
    'requiredActions',
    'routes',
  ]);
  assert.equal(typeof harness.handleSyntheticRequest, 'function');

  for (const route of harness.routes) {
    assert.deepEqual(Object.keys(route).sort(), ['method', 'path']);
  }

  assertNoUnsafeText(harness);
}

test('synthetic app harness fails closed when runtimePorts are missing', async () => {
  const harness = createRepairIntakeSyntheticAppCompositionHarness({
    runtimePorts: null,
    basePath: 'unsafe://task1061',
  });

  assert.equal(harness.ok, false);
  assert.equal(harness.mounted, 0);
  assert.equal(harness.basePath, null);
  assert.equal(
    harness.reasonCode,
    'REPAIR_INTAKE_SYNTHETIC_APP_COMPOSITION_HARNESS_PORTS_REQUIRED',
  );
  assert.deepEqual(harness.requiredActions, ['configure_runtime_ports']);
  assertSafeHarness(harness);

  const response = await harness.handleSyntheticRequest(
    'POST',
    '/task1061/missing',
    unsafeRequestLike(),
  );

  assert.equal(response.ok, false);
  assert.equal(
    response.reasonCode,
    'REPAIR_INTAKE_SYNTHETIC_APP_COMPOSITION_HARNESS_ROUTE_NOT_FOUND',
  );
  assertNoUnsafeText(response);
});

test('synthetic app harness composes internal mount target and dispatches plan and submit', async () => {
  const calls = [];
  const harness = createRepairIntakeSyntheticAppCompositionHarness({
    runtimePorts: createRuntimePorts(calls),
    basePath: '/synthetic-app-task1061',
  });

  assert.equal(harness.ok, true);
  assert.equal(harness.mounted, 2);
  assert.equal(harness.basePath, '/synthetic-app-task1061');
  assert.equal(
    harness.reasonCode,
    'REPAIR_INTAKE_SYNTHETIC_APP_COMPOSITION_HARNESS_READY',
  );
  assert.deepEqual(harness.requiredActions, []);
  assert.deepEqual(harness.routes, [
    {
      method: 'POST',
      path: '/synthetic-app-task1061/repair-intake/drafts/:draftId/case/plan',
    },
    {
      method: 'POST',
      path: '/synthetic-app-task1061/repair-intake/drafts/:draftId/case/submit',
    },
  ]);
  assert.deepEqual(calls, []);
  assertSafeHarness(harness);

  const planResponse = await harness.handleSyntheticRequest(
    'POST',
    '/synthetic-app-task1061/repair-intake/drafts/:draftId/case/plan',
    unsafeRequestLike(),
  );

  assert.deepEqual(calls.map((call) => call.name), ['draftRepository', 'planningPolicy']);
  assert.equal(planResponse.ok, true);
  assert.equal(planResponse.body.reasonCode, 'PLAN_READY_TASK1061');
  assert.equal(planResponse.body.submitted, false);
  assertNoUnsafeText(planResponse);
  assertNoUnsafeText(calls.map((call) => call.payload));

  const submitStart = calls.length;
  const submitResponse = await harness.handleSyntheticRequest(
    'POST',
    '/synthetic-app-task1061/repair-intake/drafts/:draftId/case/submit',
    unsafeRequestLike(),
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
  assert.equal(submitResponse.body.reasonCode, 'CASE_CREATED_TASK1061');
  assert.equal(submitResponse.body.submitted, true);
  assert.equal(submitResponse.body.caseRef.id, 'case_task1061');
  assertNoUnsafeText(submitResponse);
  assertNoUnsafeText(submitCalls.map((call) => call.payload));
});

test('synthetic app harness returns sanitized not-found and unsupported-method envelopes', async () => {
  const calls = [];
  const harness = createRepairIntakeSyntheticAppCompositionHarness({
    runtimePorts: createRuntimePorts(calls),
    basePath: '/synthetic-app-task1061',
  });

  const notFound = await harness.handleSyntheticRequest(
    'POST',
    '/synthetic-app-task1061/not-mounted',
    unsafeRequestLike(),
  );
  const methodNotAllowed = await harness.handleSyntheticRequest(
    'GET',
    '/synthetic-app-task1061/repair-intake/drafts/:draftId/case/plan',
    unsafeRequestLike(),
  );

  assert.deepEqual(calls, []);
  assert.equal(notFound.ok, false);
  assert.equal(
    notFound.reasonCode,
    'REPAIR_INTAKE_SYNTHETIC_APP_COMPOSITION_HARNESS_ROUTE_NOT_FOUND',
  );
  assert.deepEqual(notFound.requiredActions, ['use_mounted_route']);
  assert.equal(methodNotAllowed.ok, false);
  assert.equal(
    methodNotAllowed.reasonCode,
    'REPAIR_INTAKE_SYNTHETIC_APP_COMPOSITION_HARNESS_METHOD_NOT_ALLOWED',
  );
  assert.deepEqual(methodNotAllowed.requiredActions, ['use_supported_method']);
  assertNoUnsafeText(notFound);
  assertNoUnsafeText(methodNotAllowed);
});

test('synthetic app harness source imports only route composition wrapper and avoids forbidden runtime coupling', () => {
  const source = fs.readFileSync(SOURCE_PATH, 'utf8');
  const repairIntakeRequires = Array.from(
    source.matchAll(/require\('\.\/([^']+)'\)/g),
    (match) => match[1],
  );

  assert.deepEqual(repairIntakeRequires, [
    'repairIntakeDraftToCaseInjectedRouteComposition',
  ]);

  for (const marker of [
    'createRepairIntakeSyntheticAppCompositionHarness',
    'createRepairIntakeDraftToCaseInjectedRouteComposition',
    'handleSyntheticRequest',
    'createSyntheticMountTarget',
    'REPAIR_INTAKE_SYNTHETIC_APP_COMPOSITION_HARNESS_PORTS_REQUIRED',
    'REPAIR_INTAKE_SYNTHETIC_APP_COMPOSITION_HARNESS_COMPOSE_FAILED',
    'REPAIR_INTAKE_SYNTHETIC_APP_COMPOSITION_HARNESS_READY',
    'REPAIR_INTAKE_SYNTHETIC_APP_COMPOSITION_HARNESS_ROUTE_NOT_FOUND',
    'REPAIR_INTAKE_SYNTHETIC_APP_COMPOSITION_HARNESS_METHOD_NOT_ALLOWED',
  ]) {
    assert.equal(source.includes(marker), true, `missing harness marker ${marker}`);
  }

  for (const forbidden of [
    'repairIntakeDraftToCaseInjectedRuntimeComposer',
    'repairIntakeIdempotencyPortAdapter',
    'repairIntakeDraftReaderPortAdapter',
    'repairIntakeCasePlannerPortAdapter',
    'repairIntakeCaseCreatorPortAdapter',
    'repairIntakeAuditWriterPortAdapter',
    'repairIntakeDraftToCaseApplicationService',
    'repairIntakeDraftToCaseController',
    'repairIntakeDraftToCaseApiModule',
    'repairIntakeDraftToCaseHttpMountAdapter',
    "require('../app')",
    "require('../server')",
    "require('../routes')",
    "require('../repositories')",
    "require('../db')",
    'src/app',
    'src/server',
    'src/routes',
    'src/repositories',
    'src/db',
    'app.listen',
    'server.listen',
    'listen(',
    'fetch(',
    'axios',
    'process.env',
    'DATABASE_URL',
    'lineAccessToken',
    'lineUserId',
    'finalAppointmentId',
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
    assert.equal(source.includes(forbidden), false, `forbidden harness source marker ${forbidden}`);
  }
});
