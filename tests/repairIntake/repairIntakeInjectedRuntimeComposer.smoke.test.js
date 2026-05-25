'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const {
  createRepairIntakeDraftToCaseInjectedRuntimeComposition,
} = require('../../src/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposer');

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
          statusCode: 404,
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
        statusCode: response && response.statusCode,
        body: response && (response.body || response),
      };
    },
  };
}

function unsafeRequestLike() {
  return {
    params: {
      draftId: 'draft_task1053',
      phone: '+886900001053',
      lineUserId: 'unsafe_param_line_task1053',
    },
    query: {
      preview: 'true',
      sql: 'select * from unsafe_query_task1053',
    },
    body: {
      organizationId: 'org_task1053',
      tenantId: 'tenant_task1053',
      idempotencyKey: 'idem_task1053',
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
      },
      approvalContext: {
        accepted: true,
      },
      phone: '+886900001053',
      address: 'unsafe address task1053',
      customerName: 'unsafe customer task1053',
      lineUserId: 'unsafe_line_task1053',
      lineAccessToken: 'unsafe_line_token_task1053',
      finalAppointmentId: 'unsafe_final_task1053',
      DATABASE_URL: 'postgres://unsafe_task1053',
    },
    context: {
      organizationId: 'org_task1053',
      actorId: 'actor_task1053',
      requestId: 'req_task1053',
      tenantId: 'tenant_task1053',
      lineUserId: 'unsafe_context_line_task1053',
    },
    organizationId: 'org_task1053',
    tenantId: 'tenant_task1053',
    requestId: 'req_task1053',
    actorId: 'actor_task1053',
    rawBody: 'unsafe raw body task1053',
    req: { unsafe: true },
    res: { unsafe: true },
    headers: {
      authorization: 'Bearer unsafe_task1053',
      cookie: 'unsafe_cookie_task1053=1',
    },
  };
}

function createSyntheticPorts(calls, options = {}) {
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
          draftId: 'draft_task1053',
          organizationId: 'org_task1053',
          tenantId: 'tenant_task1053',
          status: 'recorded',
          submitted: true,
          reasonCode: 'IDEMPOTENCY_RECORDED_TASK1053',
          requiredActions: ['stored'],
          result: {
            ok: true,
            submitted: true,
            reasonCode: 'CASE_CREATED_TASK1053',
            caseRef: {
              id: 'case_task1053',
              organizationId: 'org_task1053',
              tenantId: 'tenant_task1053',
              status: 'created',
              finalAppointmentId: 'unsafe_final_task1053',
            },
            rawRows: [{ phone: '+886900001053' }],
            stack: 'unsafe_record_stack_task1053',
          },
        };
      },
    },
    draftRepository: {
      findDraftForConversion: async (lookup) => {
        calls.push({ name: 'draftRepository', payload: lookup });
        return {
          id: 'draft_task1053',
          organizationId: 'org_task1053',
          tenantId: 'tenant_task1053',
          status: 'ready',
          source: 'repair_intake',
          sourceRef: 'source_task1053',
          intakeSource: 'manual',
          reasonCode: 'DRAFT_READY_TASK1053',
          requiredActions: ['ready'],
          summary: {
            title: 'safe draft summary task1053',
            phone: '+886900001053',
          },
          phone: '+886900001053',
          address: 'unsafe address task1053',
          lineUserId: 'unsafe_draft_line_task1053',
          finalAppointmentId: 'unsafe_final_task1053',
          sql: 'select * from unsafe_draft_task1053',
          rawRows: [{ phone: '+886900001053' }],
          stack: 'unsafe_draft_stack_task1053',
        };
      },
    },
    planningPolicy: {
      planCaseFromDraft: async (payload) => {
        calls.push({ name: 'planningPolicy', payload });
        return {
          status: 'planned',
          reasonCode: 'PLAN_READY_TASK1053',
          requiredActions: ['prepare'],
          candidate: {
            sourceDraftId: 'draft_task1053',
            organizationId: 'org_task1053',
            tenantId: 'tenant_task1053',
            customerPhone: '+886900001053',
          },
          summary: {
            title: 'safe plan summary task1053',
            phone: '+886900001053',
          },
          rawRows: [{ phone: '+886900001053' }],
          finalAppointmentId: 'unsafe_final_task1053',
          lineUserId: 'unsafe_plan_line_task1053',
          token: 'unsafe_plan_token_task1053',
          stack: 'unsafe_plan_stack_task1053',
        };
      },
    },
    caseCreationPort: {
      createCaseFromDraft: async (payload) => {
        calls.push({ name: 'caseCreationPort', payload });
        return {
          id: 'case_task1053',
          organizationId: 'org_task1053',
          tenantId: 'tenant_task1053',
          sourceDraftId: 'draft_task1053',
          status: 'created',
          reasonCode: 'CASE_CREATED_TASK1053',
          requiredActions: ['created'],
          summary: {
            title: 'safe case summary task1053',
            phone: '+886900001053',
          },
          finalAppointmentId: 'unsafe_final_task1053',
          databaseUrl: 'postgres://unsafe_task1053',
          rawRows: [{ phone: '+886900001053' }],
          stack: 'unsafe_case_stack_task1053',
        };
      },
    },
    auditPort: {
      recordDraftToCaseDecision: async (payload) => {
        calls.push({ name: 'auditPort', payload });
        return {
          eventType: 'repair_intake_draft_to_case_decision',
          outcome: 'submitted',
          draftId: 'draft_task1053',
          organizationId: 'org_task1053',
          tenantId: 'tenant_task1053',
          caseId: 'case_task1053',
          reasonCode: 'AUDIT_RECORDED_TASK1053',
          requiredActions: [],
          metadata: {
            lineUserId: 'unsafe_audit_line_task1053',
            phone: '+886900001053',
            sql: 'select * from unsafe_audit_task1053',
          },
          finalAppointmentId: 'unsafe_final_task1053',
          token: 'unsafe_audit_token_task1053',
          stack: 'unsafe_audit_stack_task1053',
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
    '+886900001053',
    'select *',
    'postgres://',
    'unsafe_',
    'unsafe address task1053',
    'unsafe customer task1053',
    'unsafe_final_task1053',
    'unsafe_line_task1053',
    'unsafe raw body task1053',
    'Bearer unsafe_task1053',
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

function assertSafeSummary(summary) {
  assert.deepEqual(Object.keys(summary).sort(), [
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

test('composer smoke builds no-mount composition without calling synthetic ports', () => {
  const calls = [];
  const ports = createSyntheticPorts(calls);

  const summary = createRepairIntakeDraftToCaseInjectedRuntimeComposition({
    idempotencyStore: ports.idempotencyStore,
    draftRepository: ports.draftRepository,
    planningPolicy: ports.planningPolicy,
    caseCreationPort: ports.caseCreationPort,
    auditPort: ports.auditPort,
  });

  assert.equal(summary.ok, true);
  assert.equal(summary.mounted, 0);
  assert.equal(summary.components.httpMount, false);
  assert.equal(summary.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_COMPOSER_READY');
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

test('composer smoke mounts explicit synthetic target and exercises plan and submit', async () => {
  const calls = [];
  const ports = createSyntheticPorts(calls);
  const mountTarget = createSyntheticMountTarget();

  const summary = createRepairIntakeDraftToCaseInjectedRuntimeComposition({
    idempotencyStore: ports.idempotencyStore,
    draftRepository: ports.draftRepository,
    planningPolicy: ports.planningPolicy,
    caseCreationPort: ports.caseCreationPort,
    auditPort: ports.auditPort,
    mountTarget,
    basePath: '/composer-smoke',
  });

  assert.equal(summary.ok, true);
  assert.equal(summary.mounted, 2);
  assert.equal(summary.components.httpMount, true);
  assert.equal(summary.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_COMPOSER_MOUNTED');
  assert.deepEqual(summary.routes, [
    {
      method: 'POST',
      path: '/composer-smoke/repair-intake/drafts/:draftId/case/plan',
    },
    {
      method: 'POST',
      path: '/composer-smoke/repair-intake/drafts/:draftId/case/submit',
    },
  ]);
  assert.equal(mountTarget.registrations.length, 2);
  assertSafeSummary(summary);

  const planResponse = await mountTarget.dispatch(
    'POST',
    '/composer-smoke/repair-intake/drafts/:draftId/case/plan',
    unsafeRequestLike(),
  );

  assert.deepEqual(calls.map((call) => call.name), ['draftRepository', 'planningPolicy']);
  assert.equal(planResponse.ok, true);
  assert.equal(planResponse.body.reasonCode, 'PLAN_READY_TASK1053');
  assert.equal(planResponse.body.submitted, false);
  assertNoUnsafeText(planResponse);
  assertNoUnsafeText(calls.map((call) => call.payload));

  const submitStart = calls.length;
  const submitResponse = await mountTarget.dispatch(
    'POST',
    '/composer-smoke/repair-intake/drafts/:draftId/case/submit',
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
  assert.equal(submitResponse.body.ok, true);
  assert.equal(submitResponse.body.reasonCode, 'CASE_CREATED_TASK1053');
  assert.equal(submitResponse.body.submitted, true);
  assert.equal(submitResponse.body.caseRef.id, 'case_task1053');
  assert.equal(submitResponse.body.auditEvent.eventType, 'repair_intake_draft_to_case_decision');
  assertNoUnsafeText(submitResponse);
  assertNoUnsafeText(submitCalls.map((call) => call.payload));
});

test('composer smoke replays existing idempotency result and suppresses downstream ports', async () => {
  const calls = [];
  const ports = createSyntheticPorts(calls, {
    existingResult: {
      ok: true,
      submitted: true,
      draftId: 'draft_task1053',
      organizationId: 'org_task1053',
      tenantId: 'tenant_task1053',
      status: 'submitted',
      reasonCode: 'REPLAY_READY_TASK1053',
      plan: {
        status: 'planned',
        reasonCode: 'PLAN_READY_TASK1053',
        candidate: {
          sourceDraftId: 'draft_task1053',
          organizationId: 'org_task1053',
          tenantId: 'tenant_task1053',
        },
        finalAppointmentId: 'unsafe_final_task1053',
        lineUserId: 'unsafe_replay_line_task1053',
        rawRows: [{ phone: '+886900001053' }],
        stack: 'unsafe_replay_stack_task1053',
      },
      caseRef: {
        id: 'case_task1053',
        organizationId: 'org_task1053',
        tenantId: 'tenant_task1053',
        sourceDraftId: 'draft_task1053',
        status: 'created',
        finalAppointmentId: 'unsafe_final_task1053',
        stack: 'unsafe_replay_case_stack_task1053',
      },
      auditEvent: {
        eventType: 'repair_intake_draft_to_case_decision',
        outcome: 'submitted',
        finalAppointmentId: 'unsafe_final_task1053',
        stack: 'unsafe_replay_audit_stack_task1053',
      },
    },
  });
  const mountTarget = createSyntheticMountTarget();

  const summary = createRepairIntakeDraftToCaseInjectedRuntimeComposition({
    idempotencyStore: ports.idempotencyStore,
    draftRepository: ports.draftRepository,
    planningPolicy: ports.planningPolicy,
    caseCreationPort: ports.caseCreationPort,
    auditPort: ports.auditPort,
    mountTarget,
    basePath: '/composer-smoke',
  });

  assert.equal(summary.ok, true);
  assertSafeSummary(summary);

  const response = await mountTarget.dispatch(
    'POST',
    '/composer-smoke/repair-intake/drafts/:draftId/case/submit',
    unsafeRequestLike(),
  );

  assert.deepEqual(calls.map((call) => call.name), ['idempotencyStore.find']);
  assert.equal(response.ok, true);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.idempotentReplay, true);
  assert.equal(response.body.reasonCode, 'REPLAY_READY_TASK1053');
  assert.equal(response.body.submitted, true);
  assert.equal(response.body.caseRef.id, 'case_task1053');
  assertNoUnsafeText(response);
  assertNoUnsafeText(calls.map((call) => call.payload));
});

test('composer smoke source imports composer only and avoids forbidden runtime mentions', () => {
  const source = fs.readFileSync(__filename, 'utf8');

  assert.equal(
    source.includes('repairIntakeDraftToCaseInjectedRuntimeComposer'),
    true,
  );

  for (const forbiddenFactory of [
    ['createRepairIntake', 'IdempotencyPortAdapter'].join(''),
    ['createRepairIntake', 'DraftReaderPortAdapter'].join(''),
    ['createRepairIntake', 'CasePlannerPortAdapter'].join(''),
    ['createRepairIntake', 'CaseCreatorPortAdapter'].join(''),
    ['createRepairIntake', 'AuditWriterPortAdapter'].join(''),
    ['createRepairIntakeDraftToCase', 'ApplicationService'].join(''),
    ['createRepairIntakeDraftToCase', 'Controller'].join(''),
    ['createRepairIntakeDraftToCase', 'ApiModule'].join(''),
    ['mountRepairIntakeDraftToCase', 'ApiModule'].join(''),
  ]) {
    assert.equal(source.includes(forbiddenFactory), false, `direct factory import marker ${forbiddenFactory}`);
  }

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
    assert.equal(source.includes(forbidden), false, `forbidden smoke source marker ${forbidden}`);
  }
});
