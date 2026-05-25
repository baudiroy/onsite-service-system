'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createRepairIntakeIdempotencyPortAdapter,
} = require('../../src/repairIntake/repairIntakeIdempotencyPortAdapter');
const {
  createRepairIntakeDraftReaderPortAdapter,
} = require('../../src/repairIntake/repairIntakeDraftReaderPortAdapter');
const {
  createRepairIntakeCasePlannerPortAdapter,
} = require('../../src/repairIntake/repairIntakeCasePlannerPortAdapter');
const {
  createRepairIntakeCaseCreatorPortAdapter,
} = require('../../src/repairIntake/repairIntakeCaseCreatorPortAdapter');
const {
  createRepairIntakeAuditWriterPortAdapter,
} = require('../../src/repairIntake/repairIntakeAuditWriterPortAdapter');
const {
  createRepairIntakeDraftToCaseApplicationService,
} = require('../../src/repairIntake/repairIntakeDraftToCaseApplicationService');
const {
  createRepairIntakeDraftToCaseController,
} = require('../../src/repairIntake/repairIntakeDraftToCaseController');
const {
  createRepairIntakeDraftToCaseApiModule,
} = require('../../src/repairIntake/repairIntakeDraftToCaseApiModule');
const {
  mountRepairIntakeDraftToCaseApiModule,
} = require('../../src/repairIntake/repairIntakeDraftToCaseHttpMountAdapter');

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
      draftId: 'draft_task1048',
      phone: '+886900001048',
      lineUserId: 'unsafe_param_line_task1048',
    },
    query: {
      preview: 'true',
      sql: 'select * from unsafe_query_task1048',
    },
    body: {
      organizationId: 'org_task1048',
      tenantId: 'tenant_task1048',
      idempotencyKey: 'idem_task1048',
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
      },
      approvalContext: {
        accepted: true,
      },
      phone: '+886900001048',
      address: 'unsafe address task1048',
      customerName: 'unsafe customer task1048',
      lineUserId: 'unsafe_line_task1048',
      lineAccessToken: 'unsafe_line_token_task1048',
      finalAppointmentId: 'unsafe_final_task1048',
      DATABASE_URL: 'postgres://unsafe_task1048',
    },
    context: {
      organizationId: 'org_task1048',
      actorId: 'actor_task1048',
      requestId: 'req_task1048',
      tenantId: 'tenant_task1048',
      lineUserId: 'unsafe_context_line_task1048',
    },
    organizationId: 'org_task1048',
    tenantId: 'tenant_task1048',
    requestId: 'req_task1048',
    actorId: 'actor_task1048',
    rawBody: 'unsafe raw body task1048',
    req: { unsafe: true },
    res: { unsafe: true },
    headers: {
      authorization: 'Bearer unsafe_task1048',
      cookie: 'unsafe_cookie_task1048=1',
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
          draftId: 'draft_task1048',
          organizationId: 'org_task1048',
          tenantId: 'tenant_task1048',
          status: 'recorded',
          submitted: true,
          reasonCode: 'IDEMPOTENCY_RECORDED_TASK1048',
          requiredActions: ['stored'],
          result: {
            ok: true,
            submitted: true,
            reasonCode: 'CASE_CREATED_TASK1048',
            caseRef: {
              id: 'case_task1048',
              organizationId: 'org_task1048',
              tenantId: 'tenant_task1048',
              status: 'created',
              finalAppointmentId: 'unsafe_final_task1048',
            },
            rawRows: [{ phone: '+886900001048' }],
            stack: 'unsafe_record_stack_task1048',
          },
        };
      },
    },
    draftRepository: {
      findDraftForConversion: async (lookup) => {
        calls.push({ name: 'draftRepository', payload: lookup });
        return {
          id: 'draft_task1048',
          organizationId: 'org_task1048',
          tenantId: 'tenant_task1048',
          status: 'ready',
          source: 'repair_intake',
          sourceRef: 'source_task1048',
          intakeSource: 'manual',
          reasonCode: 'DRAFT_READY_TASK1048',
          requiredActions: ['ready'],
          summary: {
            title: 'safe draft summary task1048',
            phone: '+886900001048',
          },
          phone: '+886900001048',
          address: 'unsafe address task1048',
          lineUserId: 'unsafe_draft_line_task1048',
          finalAppointmentId: 'unsafe_final_task1048',
          sql: 'select * from unsafe_draft_task1048',
          rawRows: [{ phone: '+886900001048' }],
          stack: 'unsafe_draft_stack_task1048',
        };
      },
    },
    planningPolicy: {
      planCaseFromDraft: async (payload) => {
        calls.push({ name: 'planningPolicy', payload });
        return {
          status: 'planned',
          reasonCode: 'PLAN_READY_TASK1048',
          requiredActions: ['prepare'],
          candidate: {
            sourceDraftId: 'draft_task1048',
            organizationId: 'org_task1048',
            tenantId: 'tenant_task1048',
            customerPhone: '+886900001048',
          },
          summary: {
            title: 'safe plan summary task1048',
            phone: '+886900001048',
          },
          rawRows: [{ phone: '+886900001048' }],
          finalAppointmentId: 'unsafe_final_task1048',
          lineUserId: 'unsafe_plan_line_task1048',
          token: 'unsafe_plan_token_task1048',
          stack: 'unsafe_plan_stack_task1048',
        };
      },
    },
    caseCreationPort: {
      createCaseFromDraft: async (payload) => {
        calls.push({ name: 'caseCreationPort', payload });
        return {
          id: 'case_task1048',
          organizationId: 'org_task1048',
          tenantId: 'tenant_task1048',
          sourceDraftId: 'draft_task1048',
          status: 'created',
          reasonCode: 'CASE_CREATED_TASK1048',
          requiredActions: ['created'],
          summary: {
            title: 'safe case summary task1048',
            phone: '+886900001048',
          },
          finalAppointmentId: 'unsafe_final_task1048',
          databaseUrl: 'postgres://unsafe_task1048',
          rawRows: [{ phone: '+886900001048' }],
          stack: 'unsafe_case_stack_task1048',
        };
      },
    },
    auditPort: {
      recordDraftToCaseDecision: async (payload) => {
        calls.push({ name: 'auditPort', payload });
        return {
          eventType: 'repair_intake_draft_to_case_decision',
          outcome: 'submitted',
          draftId: 'draft_task1048',
          organizationId: 'org_task1048',
          tenantId: 'tenant_task1048',
          caseId: 'case_task1048',
          reasonCode: 'AUDIT_RECORDED_TASK1048',
          requiredActions: [],
          metadata: {
            lineUserId: 'unsafe_audit_line_task1048',
            phone: '+886900001048',
            sql: 'select * from unsafe_audit_task1048',
          },
          finalAppointmentId: 'unsafe_final_task1048',
          token: 'unsafe_audit_token_task1048',
          stack: 'unsafe_audit_stack_task1048',
        };
      },
    },
  };
}

function createInjectedComposition(calls, options = {}) {
  const ports = createSyntheticPorts(calls, options);
  const idempotencyPort = createRepairIntakeIdempotencyPortAdapter({
    idempotencyStore: ports.idempotencyStore,
  });
  const draftReader = createRepairIntakeDraftReaderPortAdapter({
    draftRepository: ports.draftRepository,
  });
  const casePlanner = createRepairIntakeCasePlannerPortAdapter({
    planningPolicy: ports.planningPolicy,
  });
  const caseCreator = createRepairIntakeCaseCreatorPortAdapter({
    caseCreationPort: ports.caseCreationPort,
  });
  const auditWriter = createRepairIntakeAuditWriterPortAdapter({
    auditPort: ports.auditPort,
  });
  const applicationService = createRepairIntakeDraftToCaseApplicationService({
    idempotencyPort,
    draftReader,
    casePlanner,
    caseCreator,
    auditWriter,
  });
  const controller = createRepairIntakeDraftToCaseController({
    applicationService,
  });
  const apiModule = createRepairIntakeDraftToCaseApiModule({
    controller,
  });
  const mountTarget = createSyntheticMountTarget();
  const mountSummary = mountRepairIntakeDraftToCaseApiModule({
    mountTarget,
    apiModule,
    basePath: options.basePath,
  });

  return {
    apiModule,
    mountSummary,
    mountTarget,
  };
}

function collectKeys(value, keys = new Set()) {
  if (!value || typeof value !== 'object') {
    return keys;
  }

  for (const [key, fieldValue] of Object.entries(value)) {
    keys.add(key);
    collectKeys(fieldValue, keys);
  }

  return keys;
}

function assertNoUnsafeText(value) {
  const keys = collectKeys(value);

  for (const forbiddenKey of [
    'handler',
    'applicationService',
    'controller',
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
    assert.equal(keys.has(forbiddenKey), false, `forwarded unsafe key ${forbiddenKey}`);
  }

  const serialized = JSON.stringify(value);
  for (const forbiddenText of [
    '+886900001048',
    'select *',
    'postgres://',
    'unsafe_',
    'unsafe address task1048',
    'unsafe customer task1048',
    'unsafe_final_task1048',
    'unsafe_line_task1048',
    'unsafe raw body task1048',
    'Bearer unsafe_task1048',
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

function assertMountSummaryOnlyHasSafeMetadata(mountSummary) {
  assert.equal(mountSummary.ok, true);
  assert.equal(mountSummary.mounted, 2);
  assert.deepEqual(Object.keys(mountSummary).sort(), [
    'mounted',
    'ok',
    'reasonCode',
    'requiredActions',
    'routes',
  ]);
  assert.deepEqual(mountSummary.routes, [
    {
      method: 'POST',
      path: '/local-smoke/repair-intake/drafts/:draftId/case/plan',
    },
    {
      method: 'POST',
      path: '/local-smoke/repair-intake/drafts/:draftId/case/submit',
    },
  ]);
  assertNoUnsafeText(mountSummary);
}

function assertSanitizedIdempotencyLookup(lookup) {
  assert.equal(lookup.idempotencyKey, 'idem_task1048');
  assert.equal(lookup.draftId, 'draft_task1048');
  assert.equal(lookup.organizationId, 'org_task1048');
  assert.equal(lookup.tenantId, 'tenant_task1048');
  assert.equal(lookup.requestId, 'req_task1048');
  assertNoUnsafeText(lookup);
}

test('local injected composition smoke exercises plan and no-existing submit without global mount or DB', async () => {
  const calls = [];
  const { mountSummary, mountTarget } = createInjectedComposition(calls, {
    basePath: '/local-smoke',
  });

  assertMountSummaryOnlyHasSafeMetadata(mountSummary);

  const planResponse = await mountTarget.dispatch(
    'POST',
    '/local-smoke/repair-intake/drafts/:draftId/case/plan',
    unsafeRequestLike(),
  );

  assert.deepEqual(calls.map((call) => call.name), ['draftRepository', 'planningPolicy']);
  assert.equal(planResponse.ok, true);
  assert.equal(planResponse.body.reasonCode, 'PLAN_READY_TASK1048');
  assert.equal(planResponse.body.submitted, false);
  assert.equal(planResponse.body.caseRef, null);
  assertNoUnsafeText(planResponse);
  assertNoUnsafeText(calls.map((call) => call.payload));

  const planCallCount = calls.length;
  const submitResponse = await mountTarget.dispatch(
    'POST',
    '/local-smoke/repair-intake/drafts/:draftId/case/submit',
    unsafeRequestLike(),
  );
  const submitCalls = calls.slice(planCallCount);

  assert.deepEqual(submitCalls.map((call) => call.name), [
    'idempotencyStore.find',
    'draftRepository',
    'planningPolicy',
    'caseCreationPort',
    'auditPort',
    'idempotencyStore.record',
  ]);
  assertSanitizedIdempotencyLookup(submitCalls[0].payload);
  assert.equal(submitCalls[3].payload.plan.reasonCode, 'PLAN_READY_TASK1048');
  assert.equal(submitCalls[4].payload.decision, 'submitted');
  assert.equal(submitCalls[5].payload.result.reasonCode, 'CASE_CREATED_TASK1048');
  assert.equal(submitResponse.ok, true);
  assert.equal(submitResponse.body.ok, true);
  assert.equal(submitResponse.body.reasonCode, 'CASE_CREATED_TASK1048');
  assert.equal(submitResponse.body.submitted, true);
  assert.equal(submitResponse.body.caseRef.id, 'case_task1048');
  assert.equal(submitResponse.body.auditEvent.eventType, 'repair_intake_draft_to_case_decision');
  assertNoUnsafeText(submitResponse);
  assertNoUnsafeText(submitCalls.map((call) => call.payload));
});

test('local injected composition smoke replays existing idempotency result and suppresses downstream ports', async () => {
  const calls = [];
  const { mountSummary, mountTarget } = createInjectedComposition(calls, {
    basePath: '/local-smoke',
    existingResult: {
      ok: true,
      submitted: true,
      draftId: 'draft_task1048',
      organizationId: 'org_task1048',
      tenantId: 'tenant_task1048',
      status: 'submitted',
      reasonCode: 'REPLAY_READY_TASK1048',
      plan: {
        status: 'planned',
        reasonCode: 'PLAN_READY_TASK1048',
        candidate: {
          sourceDraftId: 'draft_task1048',
          organizationId: 'org_task1048',
          tenantId: 'tenant_task1048',
        },
        finalAppointmentId: 'unsafe_final_task1048',
        lineUserId: 'unsafe_replay_line_task1048',
        rawRows: [{ phone: '+886900001048' }],
        stack: 'unsafe_replay_stack_task1048',
      },
      caseRef: {
        id: 'case_task1048',
        organizationId: 'org_task1048',
        tenantId: 'tenant_task1048',
        sourceDraftId: 'draft_task1048',
        status: 'created',
        finalAppointmentId: 'unsafe_final_task1048',
        stack: 'unsafe_replay_case_stack_task1048',
      },
      auditEvent: {
        eventType: 'repair_intake_draft_to_case_decision',
        outcome: 'submitted',
        finalAppointmentId: 'unsafe_final_task1048',
        stack: 'unsafe_replay_audit_stack_task1048',
      },
    },
  });

  assertMountSummaryOnlyHasSafeMetadata(mountSummary);

  const response = await mountTarget.dispatch(
    'POST',
    '/local-smoke/repair-intake/drafts/:draftId/case/submit',
    unsafeRequestLike(),
  );

  assert.deepEqual(calls.map((call) => call.name), ['idempotencyStore.find']);
  assertSanitizedIdempotencyLookup(calls[0].payload);
  assert.equal(response.ok, true);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.idempotentReplay, true);
  assert.equal(response.body.reasonCode, 'REPLAY_READY_TASK1048');
  assert.equal(response.body.submitted, true);
  assert.equal(response.body.caseRef.id, 'case_task1048');
  assertNoUnsafeText(response);
  assertNoUnsafeText(calls.map((call) => call.payload));
});

test('local injected composition smoke test does not import global app, routes, repositories, DB, or providers', () => {
  const source = fs.readFileSync(__filename, 'utf8');
  const forbiddenImportPatterns = [
    ['..', '..', 'src', 'app'].join('/'),
    ['..', '..', 'src', 'server'].join('/'),
    ['..', '..', 'src', 'routes', ''].join('/'),
    ['..', '..', 'src', 'repositories', ''].join('/'),
    ['..', '..', 'src', 'db', ''].join('/'),
    ['..', '..', 'src', 'providers', ''].join('/'),
    ['process', 'env'].join('.'),
    ['.', 'listen('].join(''),
    ['db', 'migrate'].join(':'),
    ['p', 'sql'].join(''),
  ];

  for (const forbidden of forbiddenImportPatterns) {
    assert.equal(source.includes(forbidden), false, `forbidden runtime coupling ${forbidden}`);
  }

  assert.equal(path.basename(__filename), 'repairIntakeInjectedComposition.smoke.test.js');
});
