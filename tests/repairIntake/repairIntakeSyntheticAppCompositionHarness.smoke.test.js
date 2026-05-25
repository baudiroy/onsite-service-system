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
      draftId: 'draft_task1063',
      phone: '+886900001063',
      lineUserId: 'unsafe_param_line_task1063',
    },
    query: {
      sql: 'select * from unsafe_query_task1063',
    },
    body: {
      organizationId: 'org_task1063',
      tenantId: 'tenant_task1063',
      idempotencyKey: 'idem_task1063',
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
      },
      approvalContext: {
        accepted: true,
      },
      phone: '+886900001063',
      address: 'unsafe address task1063',
      customerName: 'unsafe customer task1063',
      lineUserId: 'unsafe_line_task1063',
      lineAccessToken: 'unsafe_line_token_task1063',
      finalAppointmentId: 'unsafe_final_task1063',
      DATABASE_URL: 'postgres://unsafe_task1063',
    },
    context: {
      organizationId: 'org_task1063',
      actorId: 'actor_task1063',
      requestId: 'req_task1063',
      tenantId: 'tenant_task1063',
      lineUserId: 'unsafe_context_line_task1063',
    },
    rawBody: 'unsafe raw body task1063',
    headers: {
      authorization: 'Bearer unsafe_task1063',
      cookie: 'unsafe_cookie_task1063=1',
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
          reasonCode: 'IDEMPOTENCY_RECORDED_TASK1063',
          result: input.result,
          rawRows: [{ phone: '+886900001063' }],
          finalAppointmentId: 'unsafe_final_task1063',
          stack: 'unsafe_record_stack_task1063',
        };
      },
    },
    draftRepository: {
      findDraftForConversion: async (lookup) => {
        calls.push({ name: 'draftRepository', payload: lookup });
        return {
          id: 'draft_task1063',
          organizationId: 'org_task1063',
          tenantId: 'tenant_task1063',
          status: 'ready',
          source: 'repair_intake',
          reasonCode: 'DRAFT_READY_TASK1063',
          summary: {
            title: 'safe draft task1063',
            phone: '+886900001063',
          },
          phone: '+886900001063',
          address: 'unsafe address task1063',
          lineUserId: 'unsafe_draft_line_task1063',
          finalAppointmentId: 'unsafe_final_task1063',
          rawRows: [{ phone: '+886900001063' }],
          stack: 'unsafe_draft_stack_task1063',
        };
      },
    },
    planningPolicy: {
      planCaseFromDraft: async (payload) => {
        calls.push({ name: 'planningPolicy', payload });
        return {
          status: 'planned',
          reasonCode: 'PLAN_READY_TASK1063',
          candidate: {
            sourceDraftId: 'draft_task1063',
            organizationId: 'org_task1063',
            customerPhone: '+886900001063',
          },
          rawRows: [{ phone: '+886900001063' }],
          lineUserId: 'unsafe_plan_line_task1063',
          finalAppointmentId: 'unsafe_final_task1063',
          token: 'unsafe_plan_token_task1063',
          stack: 'unsafe_plan_stack_task1063',
        };
      },
    },
    caseCreationPort: {
      createCaseFromDraft: async (payload) => {
        calls.push({ name: 'caseCreationPort', payload });
        return {
          id: 'case_task1063',
          organizationId: 'org_task1063',
          tenantId: 'tenant_task1063',
          sourceDraftId: 'draft_task1063',
          status: 'created',
          reasonCode: 'CASE_CREATED_TASK1063',
          finalAppointmentId: 'unsafe_final_task1063',
          databaseUrl: 'postgres://unsafe_task1063',
          rawRows: [{ phone: '+886900001063' }],
          stack: 'unsafe_case_stack_task1063',
        };
      },
    },
    auditPort: {
      recordDraftToCaseDecision: async (payload) => {
        calls.push({ name: 'auditPort', payload });
        return {
          eventType: 'repair_intake_draft_to_case_decision',
          outcome: 'submitted',
          draftId: 'draft_task1063',
          organizationId: 'org_task1063',
          reasonCode: 'AUDIT_RECORDED_TASK1063',
          metadata: {
            lineUserId: 'unsafe_audit_line_task1063',
            phone: '+886900001063',
            sql: 'select * from unsafe_audit_task1063',
          },
          finalAppointmentId: 'unsafe_final_task1063',
          token: 'unsafe_audit_token_task1063',
          stack: 'unsafe_audit_stack_task1063',
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
    '+886900001063',
    'unsafe_',
    'unsafe address task1063',
    'unsafe customer task1063',
    'unsafe_final_task1063',
    'unsafe_line_task1063',
    'unsafe raw body task1063',
    'Bearer unsafe_task1063',
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

function assertSafeHarnessSummary(harness) {
  assert.deepEqual(Object.keys(harness).sort(), [
    'basePath',
    'handleSyntheticRequest',
    'mounted',
    'ok',
    'reasonCode',
    'requiredActions',
    'routes',
  ]);

  for (const route of harness.routes) {
    assert.deepEqual(Object.keys(route).sort(), ['method', 'path']);
  }

  assertNoUnsafeText(harness);
}

test('synthetic app harness smoke dispatches plan and no-existing submit through harness only', async () => {
  const calls = [];
  const harness = createRepairIntakeSyntheticAppCompositionHarness({
    runtimePorts: createRuntimePorts(calls),
    basePath: '/synthetic-harness-smoke',
  });

  assert.equal(harness.ok, true);
  assert.equal(harness.mounted, 2);
  assert.equal(harness.basePath, '/synthetic-harness-smoke');
  assert.equal(
    harness.reasonCode,
    'REPAIR_INTAKE_SYNTHETIC_APP_COMPOSITION_HARNESS_READY',
  );
  assert.deepEqual(harness.routes, [
    {
      method: 'POST',
      path: '/synthetic-harness-smoke/repair-intake/drafts/:draftId/case/plan',
    },
    {
      method: 'POST',
      path: '/synthetic-harness-smoke/repair-intake/drafts/:draftId/case/submit',
    },
  ]);
  assert.deepEqual(calls, []);
  assertSafeHarnessSummary(harness);

  const planResponse = await harness.handleSyntheticRequest(
    'POST',
    '/synthetic-harness-smoke/repair-intake/drafts/:draftId/case/plan',
    unsafeRequestLike(),
  );

  assert.deepEqual(calls.map((call) => call.name), ['draftRepository', 'planningPolicy']);
  assert.equal(planResponse.ok, true);
  assert.equal(planResponse.body.reasonCode, 'PLAN_READY_TASK1063');
  assert.equal(planResponse.body.submitted, false);
  assertNoUnsafeText(planResponse);
  assertNoUnsafeText(calls.map((call) => call.payload));

  const submitStart = calls.length;
  const submitResponse = await harness.handleSyntheticRequest(
    'POST',
    '/synthetic-harness-smoke/repair-intake/drafts/:draftId/case/submit',
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
  assert.equal(submitResponse.body.reasonCode, 'CASE_CREATED_TASK1063');
  assert.equal(submitResponse.body.submitted, true);
  assert.equal(submitResponse.body.caseRef.id, 'case_task1063');
  assertNoUnsafeText(submitResponse);
  assertNoUnsafeText(submitCalls.map((call) => call.payload));
});

test('synthetic app harness smoke replays idempotency result and suppresses downstream ports', async () => {
  const calls = [];
  const harness = createRepairIntakeSyntheticAppCompositionHarness({
    runtimePorts: createRuntimePorts(calls, {
      existingResult: {
        ok: true,
        submitted: true,
        draftId: 'draft_task1063',
        organizationId: 'org_task1063',
        tenantId: 'tenant_task1063',
        status: 'submitted',
        reasonCode: 'REPLAY_READY_TASK1063',
        caseRef: {
          id: 'case_task1063',
          finalAppointmentId: 'unsafe_final_task1063',
          stack: 'unsafe_replay_case_stack_task1063',
        },
        plan: {
          status: 'planned',
          reasonCode: 'PLAN_READY_TASK1063',
          rawRows: [{ phone: '+886900001063' }],
          finalAppointmentId: 'unsafe_final_task1063',
        },
        auditEvent: {
          eventType: 'repair_intake_draft_to_case_decision',
          stack: 'unsafe_replay_audit_stack_task1063',
        },
      },
    }),
    basePath: '/synthetic-harness-smoke',
  });

  assert.equal(harness.ok, true);
  assertSafeHarnessSummary(harness);

  const response = await harness.handleSyntheticRequest(
    'POST',
    '/synthetic-harness-smoke/repair-intake/drafts/:draftId/case/submit',
    unsafeRequestLike(),
  );

  assert.deepEqual(calls.map((call) => call.name), ['idempotencyStore.find']);
  assert.equal(response.ok, true);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.idempotentReplay, true);
  assert.equal(response.body.reasonCode, 'REPLAY_READY_TASK1063');
  assertNoUnsafeText(response);
  assertNoUnsafeText(calls.map((call) => call.payload));
});

test('synthetic app harness smoke returns sanitized unmatched path and unsupported method envelopes', async () => {
  const calls = [];
  const harness = createRepairIntakeSyntheticAppCompositionHarness({
    runtimePorts: createRuntimePorts(calls),
    basePath: '/synthetic-harness-smoke',
  });

  const notFound = await harness.handleSyntheticRequest(
    'POST',
    '/synthetic-harness-smoke/not-mounted',
    unsafeRequestLike(),
  );
  const methodNotAllowed = await harness.handleSyntheticRequest(
    'GET',
    '/synthetic-harness-smoke/repair-intake/drafts/:draftId/case/plan',
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

test('synthetic app harness smoke source imports harness only and avoids forbidden runtime mentions', () => {
  const source = fs.readFileSync(__filename, 'utf8');

  assert.equal(source.includes('repairIntakeSyntheticAppCompositionHarness'), true);

  for (const forbidden of [
    ['repairIntakeDraftToCaseInjected', 'RouteComposition'].join(''),
    ['repairIntakeDraftToCaseInjected', 'RuntimeComposer'].join(''),
    ['repairIntake', 'IdempotencyPortAdapter'].join(''),
    ['repairIntake', 'DraftReaderPortAdapter'].join(''),
    ['repairIntake', 'CasePlannerPortAdapter'].join(''),
    ['repairIntake', 'CaseCreatorPortAdapter'].join(''),
    ['repairIntake', 'AuditWriterPortAdapter'].join(''),
    ['repairIntakeDraftToCase', 'ApplicationService'].join(''),
    ['repairIntakeDraftToCase', 'Controller'].join(''),
    ['repairIntakeDraftToCase', 'ApiModule'].join(''),
    ['repairIntakeDraftToCase', 'HttpMountAdapter'].join(''),
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
    assert.equal(source.includes(forbidden), false, `forbidden smoke source marker ${forbidden}`);
  }
});
