'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const {
  createRepairIntakeDraftToCaseInjectedRouteComposition,
} = require('../../src/repairIntake/repairIntakeDraftToCaseInjectedRouteComposition');

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

function unsafeRequestLike() {
  return {
    params: {
      draftId: 'draft_task1058',
      phone: '+886900001058',
      lineUserId: 'unsafe_param_line_task1058',
    },
    query: {
      preview: 'true',
      sql: 'select * from unsafe_query_task1058',
    },
    body: {
      organizationId: 'org_task1058',
      tenantId: 'tenant_task1058',
      idempotencyKey: 'idem_task1058',
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
      },
      approvalContext: {
        accepted: true,
      },
      phone: '+886900001058',
      address: 'unsafe address task1058',
      customerName: 'unsafe customer task1058',
      lineUserId: 'unsafe_line_task1058',
      lineAccessToken: 'unsafe_line_token_task1058',
      finalAppointmentId: 'unsafe_final_task1058',
      DATABASE_URL: 'postgres://unsafe_task1058',
    },
    context: {
      organizationId: 'org_task1058',
      actorId: 'actor_task1058',
      requestId: 'req_task1058',
      tenantId: 'tenant_task1058',
      lineUserId: 'unsafe_context_line_task1058',
    },
    organizationId: 'org_task1058',
    tenantId: 'tenant_task1058',
    requestId: 'req_task1058',
    actorId: 'actor_task1058',
    rawBody: 'unsafe raw body task1058',
    req: { unsafe: true },
    res: { unsafe: true },
    headers: {
      authorization: 'Bearer unsafe_task1058',
      cookie: 'unsafe_cookie_task1058=1',
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
          draftId: 'draft_task1058',
          organizationId: 'org_task1058',
          tenantId: 'tenant_task1058',
          status: 'recorded',
          submitted: true,
          reasonCode: 'IDEMPOTENCY_RECORDED_TASK1058',
          requiredActions: ['stored'],
          result: {
            ok: true,
            submitted: true,
            reasonCode: 'CASE_CREATED_TASK1058',
            caseRef: {
              id: 'case_task1058',
              organizationId: 'org_task1058',
              tenantId: 'tenant_task1058',
              status: 'created',
              finalAppointmentId: 'unsafe_final_task1058',
            },
            rawRows: [{ phone: '+886900001058' }],
            stack: 'unsafe_record_stack_task1058',
          },
        };
      },
    },
    draftRepository: {
      findDraftForConversion: async (lookup) => {
        calls.push({ name: 'draftRepository', payload: lookup });
        return {
          id: 'draft_task1058',
          organizationId: 'org_task1058',
          tenantId: 'tenant_task1058',
          status: 'ready',
          source: 'repair_intake',
          sourceRef: 'source_task1058',
          intakeSource: 'manual',
          reasonCode: 'DRAFT_READY_TASK1058',
          requiredActions: ['ready'],
          summary: {
            title: 'safe draft summary task1058',
            phone: '+886900001058',
          },
          phone: '+886900001058',
          address: 'unsafe address task1058',
          lineUserId: 'unsafe_draft_line_task1058',
          finalAppointmentId: 'unsafe_final_task1058',
          sql: 'select * from unsafe_draft_task1058',
          rawRows: [{ phone: '+886900001058' }],
          stack: 'unsafe_draft_stack_task1058',
        };
      },
    },
    planningPolicy: {
      planCaseFromDraft: async (payload) => {
        calls.push({ name: 'planningPolicy', payload });
        return {
          status: 'planned',
          reasonCode: 'PLAN_READY_TASK1058',
          requiredActions: ['prepare'],
          candidate: {
            sourceDraftId: 'draft_task1058',
            organizationId: 'org_task1058',
            tenantId: 'tenant_task1058',
            customerPhone: '+886900001058',
          },
          summary: {
            title: 'safe plan summary task1058',
            phone: '+886900001058',
          },
          rawRows: [{ phone: '+886900001058' }],
          finalAppointmentId: 'unsafe_final_task1058',
          lineUserId: 'unsafe_plan_line_task1058',
          token: 'unsafe_plan_token_task1058',
          stack: 'unsafe_plan_stack_task1058',
        };
      },
    },
    caseCreationPort: {
      createCaseFromDraft: async (payload) => {
        calls.push({ name: 'caseCreationPort', payload });
        return {
          id: 'case_task1058',
          organizationId: 'org_task1058',
          tenantId: 'tenant_task1058',
          sourceDraftId: 'draft_task1058',
          status: 'created',
          reasonCode: 'CASE_CREATED_TASK1058',
          requiredActions: ['created'],
          summary: {
            title: 'safe case summary task1058',
            phone: '+886900001058',
          },
          finalAppointmentId: 'unsafe_final_task1058',
          databaseUrl: 'postgres://unsafe_task1058',
          rawRows: [{ phone: '+886900001058' }],
          stack: 'unsafe_case_stack_task1058',
        };
      },
    },
    auditPort: {
      recordDraftToCaseDecision: async (payload) => {
        calls.push({ name: 'auditPort', payload });
        return {
          eventType: 'repair_intake_draft_to_case_decision',
          outcome: 'submitted',
          draftId: 'draft_task1058',
          organizationId: 'org_task1058',
          tenantId: 'tenant_task1058',
          caseId: 'case_task1058',
          reasonCode: 'AUDIT_RECORDED_TASK1058',
          requiredActions: [],
          metadata: {
            lineUserId: 'unsafe_audit_line_task1058',
            phone: '+886900001058',
            sql: 'select * from unsafe_audit_task1058',
          },
          finalAppointmentId: 'unsafe_final_task1058',
          token: 'unsafe_audit_token_task1058',
          stack: 'unsafe_audit_stack_task1058',
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
      assert.equal(typeof fieldValue, 'boolean', `raw component leaked at ${key}`);
      continue;
    }

    for (const forbiddenKey of [
      'handler',
      'module',
      'port',
      'repository',
      'store',
      'mountTarget',
      'runtimePorts',
      'req',
      'res',
      'headers',
      'cookie',
      'rawBody',
      'rawRows',
      'sql',
      'DATABASE_URL',
      'databaseUrl',
      'authorization',
      'phone',
      'address',
      'customerName',
      'lineUserId',
      'lineAccessToken',
      'finalAppointmentId',
      'token',
      'stack',
    ]) {
      assert.notEqual(key, forbiddenKey, `forwarded unsafe key ${forbiddenKey}`);
    }
  }

  const serialized = JSON.stringify(value);
  for (const forbiddenText of [
    '+886900001058',
    'select *',
    'postgres://',
    'unsafe_',
    'unsafe address task1058',
    'unsafe customer task1058',
    'unsafe_final_task1058',
    'unsafe_line_task1058',
    'unsafe raw body task1058',
    'Bearer unsafe_task1058',
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

function assertSafeRouteCompositionSummary(summary) {
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

test('route composition smoke builds no-mount summary without global route mount', () => {
  const calls = [];
  const summary = createRepairIntakeDraftToCaseInjectedRouteComposition({
    runtimePorts: createRuntimePorts(calls),
    basePath: '/route-composition-smoke',
  });

  assert.equal(summary.ok, true);
  assert.equal(summary.mounted, 0);
  assert.equal(summary.basePath, '/route-composition-smoke');
  assert.equal(summary.components.httpMount, false);
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
  assertSafeRouteCompositionSummary(summary);
});

test('route composition smoke mounts explicit synthetic target and exercises plan and submit', async () => {
  const calls = [];
  const mountTarget = createSyntheticMountTarget();
  const summary = createRepairIntakeDraftToCaseInjectedRouteComposition({
    runtimePorts: createRuntimePorts(calls),
    mountTarget,
    basePath: '/route-composition-smoke',
  });

  assert.equal(summary.ok, true);
  assert.equal(summary.mounted, 2);
  assert.equal(summary.basePath, '/route-composition-smoke');
  assert.equal(summary.components.httpMount, true);
  assert.equal(summary.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_COMPOSITION_MOUNTED');
  assert.deepEqual(summary.routes, [
    {
      method: 'POST',
      path: '/route-composition-smoke/repair-intake/drafts/:draftId/case/plan',
    },
    {
      method: 'POST',
      path: '/route-composition-smoke/repair-intake/drafts/:draftId/case/submit',
    },
  ]);
  assert.equal(mountTarget.registrations.length, 2);
  assertSafeRouteCompositionSummary(summary);

  const planResponse = await mountTarget.dispatch(
    'POST',
    '/route-composition-smoke/repair-intake/drafts/:draftId/case/plan',
    unsafeRequestLike(),
  );

  assert.deepEqual(calls.map((call) => call.name), ['draftRepository', 'planningPolicy']);
  assert.equal(planResponse.ok, true);
  assert.equal(planResponse.body.reasonCode, 'PLAN_READY_TASK1058');
  assert.equal(planResponse.body.submitted, false);
  assertNoUnsafeText(planResponse);
  assertNoUnsafeText(calls.map((call) => call.payload));

  const submitStart = calls.length;
  const submitResponse = await mountTarget.dispatch(
    'POST',
    '/route-composition-smoke/repair-intake/drafts/:draftId/case/submit',
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
  assert.equal(submitResponse.body.reasonCode, 'CASE_CREATED_TASK1058');
  assert.equal(submitResponse.body.submitted, true);
  assert.equal(submitResponse.body.caseRef.id, 'case_task1058');
  assertNoUnsafeText(submitResponse);
  assertNoUnsafeText(submitCalls.map((call) => call.payload));
});

test('route composition smoke replays idempotency result and suppresses downstream ports', async () => {
  const calls = [];
  const mountTarget = createSyntheticMountTarget();
  const summary = createRepairIntakeDraftToCaseInjectedRouteComposition({
    runtimePorts: createRuntimePorts(calls, {
      existingResult: {
        ok: true,
        submitted: true,
        draftId: 'draft_task1058',
        organizationId: 'org_task1058',
        tenantId: 'tenant_task1058',
        status: 'submitted',
        reasonCode: 'REPLAY_READY_TASK1058',
        caseRef: {
          id: 'case_task1058',
          organizationId: 'org_task1058',
          tenantId: 'tenant_task1058',
          finalAppointmentId: 'unsafe_final_task1058',
          stack: 'unsafe_replay_case_stack_task1058',
        },
        plan: {
          status: 'planned',
          reasonCode: 'PLAN_READY_TASK1058',
          finalAppointmentId: 'unsafe_final_task1058',
          rawRows: [{ phone: '+886900001058' }],
          stack: 'unsafe_replay_plan_stack_task1058',
        },
        auditEvent: {
          eventType: 'repair_intake_draft_to_case_decision',
          finalAppointmentId: 'unsafe_final_task1058',
          stack: 'unsafe_replay_audit_stack_task1058',
        },
      },
    }),
    mountTarget,
    basePath: '/route-composition-smoke',
  });

  assert.equal(summary.ok, true);
  assertSafeRouteCompositionSummary(summary);

  const response = await mountTarget.dispatch(
    'POST',
    '/route-composition-smoke/repair-intake/drafts/:draftId/case/submit',
    unsafeRequestLike(),
  );

  assert.deepEqual(calls.map((call) => call.name), ['idempotencyStore.find']);
  assert.equal(response.ok, true);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.idempotentReplay, true);
  assert.equal(response.body.reasonCode, 'REPLAY_READY_TASK1058');
  assertNoUnsafeText(response);
  assertNoUnsafeText(calls.map((call) => call.payload));
});

test('route composition smoke source imports route wrapper only and avoids forbidden runtime mentions', () => {
  const source = fs.readFileSync(__filename, 'utf8');

  assert.equal(source.includes('repairIntakeDraftToCaseInjectedRouteComposition'), true);

  for (const forbidden of [
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
