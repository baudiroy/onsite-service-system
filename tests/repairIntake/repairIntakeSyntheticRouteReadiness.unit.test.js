'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const {
  createRepairIntakeSyntheticAppCompositionHarness,
} = require('../../src/repairIntake/repairIntakeSyntheticAppCompositionHarness');

function unsafeRequestLike() {
  return {
    params: {
      draftId: 'draft_task1067',
      phone: '+886900001067',
      lineUserId: 'unsafe_param_line_task1067',
    },
    body: {
      organizationId: 'org_task1067',
      tenantId: 'tenant_task1067',
      idempotencyKey: 'idem_task1067',
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
      },
      approvalContext: {
        accepted: true,
      },
      phone: '+886900001067',
      address: 'unsafe address task1067',
      customerName: 'unsafe customer task1067',
      lineUserId: 'unsafe_line_task1067',
      lineAccessToken: 'unsafe_line_token_task1067',
      finalAppointmentId: 'unsafe_final_task1067',
      DATABASE_URL: 'postgres://unsafe_task1067',
    },
    context: {
      organizationId: 'org_task1067',
      actorId: 'actor_task1067',
      requestId: 'req_task1067',
      tenantId: 'tenant_task1067',
      lineUserId: 'unsafe_context_line_task1067',
    },
    rawBody: 'unsafe raw body task1067',
    headers: {
      authorization: 'Bearer unsafe_task1067',
      cookie: 'unsafe_cookie_task1067=1',
    },
  };
}

function createRuntimePorts(calls) {
  return {
    idempotencyStore: {
      findExistingDraftToCaseResult: async (lookup) => {
        calls.push({ name: 'idempotencyStore.find', payload: lookup });
        return null;
      },
      recordDraftToCaseResult: async (input) => {
        calls.push({ name: 'idempotencyStore.record', payload: input });
        return {
          ok: true,
          submitted: true,
          reasonCode: 'IDEMPOTENCY_RECORDED_TASK1067',
          result: input.result,
          rawRows: [{ phone: '+886900001067' }],
          stack: 'unsafe_record_stack_task1067',
        };
      },
    },
    draftRepository: {
      findDraftForConversion: async (lookup) => {
        calls.push({ name: 'draftRepository', payload: lookup });
        return {
          id: 'draft_task1067',
          organizationId: 'org_task1067',
          tenantId: 'tenant_task1067',
          status: 'ready',
          source: 'repair_intake',
          reasonCode: 'DRAFT_READY_TASK1067',
          summary: {
            title: 'safe draft task1067',
            phone: '+886900001067',
          },
          phone: '+886900001067',
          address: 'unsafe address task1067',
          lineUserId: 'unsafe_draft_line_task1067',
          finalAppointmentId: 'unsafe_final_task1067',
          rawRows: [{ phone: '+886900001067' }],
          stack: 'unsafe_draft_stack_task1067',
        };
      },
    },
    planningPolicy: {
      planCaseFromDraft: async (payload) => {
        calls.push({ name: 'planningPolicy', payload });
        return {
          status: 'planned',
          reasonCode: 'PLAN_READY_TASK1067',
          candidate: {
            sourceDraftId: 'draft_task1067',
            organizationId: 'org_task1067',
            customerPhone: '+886900001067',
          },
          rawRows: [{ phone: '+886900001067' }],
          lineUserId: 'unsafe_plan_line_task1067',
          finalAppointmentId: 'unsafe_final_task1067',
          token: 'unsafe_plan_token_task1067',
        };
      },
    },
    caseCreationPort: {
      createCaseFromDraft: async (payload) => {
        calls.push({ name: 'caseCreationPort', payload });
        return {
          id: 'case_task1067',
          organizationId: 'org_task1067',
          tenantId: 'tenant_task1067',
          sourceDraftId: 'draft_task1067',
          status: 'created',
          reasonCode: 'CASE_CREATED_TASK1067',
          finalAppointmentId: 'unsafe_final_task1067',
          databaseUrl: 'postgres://unsafe_task1067',
          rawRows: [{ phone: '+886900001067' }],
          stack: 'unsafe_case_stack_task1067',
        };
      },
    },
    auditPort: {
      recordDraftToCaseDecision: async (payload) => {
        calls.push({ name: 'auditPort', payload });
        return {
          eventType: 'repair_intake_draft_to_case_decision',
          outcome: 'submitted',
          draftId: 'draft_task1067',
          organizationId: 'org_task1067',
          reasonCode: 'AUDIT_RECORDED_TASK1067',
          metadata: {
            phone: '+886900001067',
            lineUserId: 'unsafe_audit_line_task1067',
          },
          finalAppointmentId: 'unsafe_final_task1067',
          token: 'unsafe_audit_token_task1067',
          stack: 'unsafe_audit_stack_task1067',
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
      'token',
      'stack',
    ]) {
      assert.notEqual(key, forbiddenKey, `leaked key ${forbiddenKey}`);
    }
  }

  const serialized = JSON.stringify(value);
  for (const forbiddenText of [
    '+886900001067',
    'unsafe_',
    'unsafe address task1067',
    'unsafe customer task1067',
    'unsafe_final_task1067',
    'unsafe_line_task1067',
    'unsafe raw body task1067',
    'Bearer unsafe_task1067',
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

test('synthetic route readiness keeps safe route metadata and HTTP-like dispatch behavior', async () => {
  const calls = [];
  const harness = createRepairIntakeSyntheticAppCompositionHarness({
    runtimePorts: createRuntimePorts(calls),
    basePath: '/synthetic-route-readiness',
  });

  assert.equal(harness.ok, true);
  assert.equal(harness.basePath, '/synthetic-route-readiness');
  assert.equal(harness.mounted, 2);
  assert.deepEqual(harness.routes, [
    {
      method: 'POST',
      path: '/synthetic-route-readiness/repair-intake/drafts/:draftId/case/plan',
    },
    {
      method: 'POST',
      path: '/synthetic-route-readiness/repair-intake/drafts/:draftId/case/submit',
    },
  ]);
  for (const route of harness.routes) {
    assert.deepEqual(Object.keys(route).sort(), ['method', 'path']);
  }
  assertNoUnsafeText(harness);

  const plan = await harness.handleSyntheticRequest(
    'POST',
    '/synthetic-route-readiness/repair-intake/drafts/:draftId/case/plan',
    unsafeRequestLike(),
  );
  assert.deepEqual(calls.map((call) => call.name), ['draftRepository', 'planningPolicy']);
  assert.equal(plan.ok, true);
  assert.equal(plan.body.reasonCode, 'PLAN_READY_TASK1067');
  assert.equal(plan.body.submitted, false);
  assertNoUnsafeText(plan);
  assertNoUnsafeText(calls.map((call) => call.payload));

  const submitStart = calls.length;
  const submit = await harness.handleSyntheticRequest(
    'POST',
    '/synthetic-route-readiness/repair-intake/drafts/:draftId/case/submit',
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
  assert.equal(submit.ok, true);
  assert.equal(submit.body.reasonCode, 'CASE_CREATED_TASK1067');
  assert.equal(submit.body.submitted, true);
  assertNoUnsafeText(submit);
  assertNoUnsafeText(submitCalls.map((call) => call.payload));

  const unknown = await harness.handleSyntheticRequest(
    'POST',
    '/synthetic-route-readiness/not-mounted',
    unsafeRequestLike(),
  );
  assert.equal(unknown.ok, false);
  assert.equal(
    unknown.reasonCode,
    'REPAIR_INTAKE_SYNTHETIC_APP_COMPOSITION_HARNESS_ROUTE_NOT_FOUND',
  );
  assertNoUnsafeText(unknown);

  const method = await harness.handleSyntheticRequest(
    'GET',
    '/synthetic-route-readiness/repair-intake/drafts/:draftId/case/plan',
    unsafeRequestLike(),
  );
  assert.equal(method.ok, false);
  assert.equal(
    method.reasonCode,
    'REPAIR_INTAKE_SYNTHETIC_APP_COMPOSITION_HARNESS_METHOD_NOT_ALLOWED',
  );
  assertNoUnsafeText(method);
});

test('synthetic route readiness test keeps future-mount safety invariants in source', () => {
  const source = fs.readFileSync(__filename, 'utf8');
  const repairIntakeRequires = Array.from(
    source.matchAll(/require\('\.\.\/\.\.\/src\/repairIntake\/([^']+)'\)/g),
    (match) => match[1],
  );

  assert.deepEqual(repairIntakeRequires, [
    'repairIntakeSyntheticAppCompositionHarness',
  ]);
  assert.equal(source.includes('handleSyntheticRequest'), true);

  for (const forbidden of [
    ['..', '..', 'src', 'app'].join('/'),
    ['..', '..', 'src', 'server'].join('/'),
    ['..', '..', 'src', 'routes'].join('/'),
    ['..', '..', 'src', 'repositories'].join('/'),
    ['..', '..', 'src', 'db'].join('/'),
    ['process', 'env'].join('.'),
    ['listen', '('].join(''),
    ['fetch', '('].join(''),
    ['ax', 'ios'].join(''),
    ['send', 'Line'].join(''),
    ['send', 'Sms'].join(''),
    ['send', 'Email'].join(''),
    ['open', 'ai'].join(''),
    ['R', 'AG'].join(''),
    ['vec', 'tor'].join(''),
    ['bill', 'ing'].join(''),
    ['in', 'voice'].join(''),
    ['pay', 'ment'].join(''),
  ]) {
    assert.equal(source.includes(forbidden), false, `forbidden readiness source marker ${forbidden}`);
  }
});
