'use strict';

const assert = require('node:assert/strict');
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
      draftId: 'draft_task1044',
      phone: '+886900001044',
    },
    query: {
      preview: 'true',
      sql: 'select * from unsafe_task1044',
    },
    body: {
      organizationId: 'org_task1044',
      tenantId: 'tenant_task1044',
      idempotencyKey: 'idem_task1044',
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
      },
      approvalContext: {
        accepted: true,
      },
      phone: '+886900001044',
      address: 'unsafe address task1044',
      customerName: 'unsafe customer task1044',
      lineUserId: 'unsafe_line_task1044',
      lineAccessToken: 'unsafe_line_token_task1044',
      finalAppointmentId: 'unsafe_final_task1044',
    },
    context: {
      organizationId: 'org_task1044',
      actorId: 'actor_task1044',
      requestId: 'req_task1044',
      tenantId: 'tenant_task1044',
      lineUserId: 'unsafe_context_line_task1044',
    },
    organizationId: 'org_task1044',
    tenantId: 'tenant_task1044',
    requestId: 'req_task1044',
    actorId: 'actor_task1044',
    actor: {
      actorId: 'actor_task1044',
      phone: '+886900001044',
      lineUserId: 'actor_line_task1044',
      token: 'unsafe_actor_token_task1044',
    },
    req: { unsafe: true },
    res: { unsafe: true },
    response: { unsafe: true },
    rawBody: 'unsafe raw body task1044',
    headers: {
      authorization: 'Bearer unsafe',
      cookie: 'unsafe_cookie=abc',
    },
  };
}

function createIdempotencyStore(calls, options = {}) {
  return {
    findExistingDraftToCaseResult: async (lookup) => {
      calls.push({ name: 'idempotencyStore.find', payload: lookup });
      return options.existingResult || null;
    },
    recordDraftToCaseResult: async (input) => {
      calls.push({ name: 'idempotencyStore.record', payload: input });
      return {
        ok: true,
        draftId: 'draft_task1044',
        organizationId: 'org_task1044',
        tenantId: 'tenant_task1044',
        status: 'recorded',
        submitted: true,
        reasonCode: 'IDEMPOTENCY_RECORDED_TASK1044',
        requiredActions: ['stored'],
        recordId: 'record_task1044',
        plan: {
          status: 'planned',
          reasonCode: 'PLAN_READY_TASK1044',
          candidate: {
            sourceDraftId: 'draft_task1044',
            organizationId: 'org_task1044',
            tenantId: 'tenant_task1044',
          },
          rawRows: [{ phone: '+886900001044' }],
          token: 'unsafe token task1044',
          stack: 'unsafe store stack',
        },
        caseRef: {
          id: 'case_task1044',
          sourceDraftId: 'draft_task1044',
          organizationId: 'org_task1044',
          status: 'created',
          reasonCode: 'CASE_CREATED_TASK1044',
          finalAppointmentId: 'unsafe_final_task1044',
          stack: 'unsafe_record_stack_task1044',
          DATABASE_URL: 'postgres://unsafe',
        },
      };
    },
  };
}

function createCorePorts(calls) {
  return {
    draftRepository: {
      findDraftForConversion: async (lookup) => {
        calls.push({ name: 'draftRepository', payload: lookup });
        return {
          id: 'draft_task1044',
          organizationId: 'org_task1044',
          tenantId: 'tenant_task1044',
          status: 'ready',
          source: 'repair_intake',
          sourceRef: 'source_task1044',
          intakeSource: 'manual',
          reasonCode: 'DRAFT_READY_TASK1044',
          requiredActions: ['ready'],
          summary: {
            title: 'safe draft summary',
            phone: '+886900001044',
          },
          rawRows: [{ phone: '+886900001044' }],
          phone: '+886900001044',
          address: 'unsafe address task1044',
          finalAppointmentId: 'unsafe_final_task1044',
          lineUserId: 'unsafe_line_task1044',
          sql: 'select * from unsafe_draft_task1044',
          stack: 'unsafe_repository_stack',
        };
      },
    },
    planningPolicy: {
      planCaseFromDraft: async (payload) => {
        calls.push({ name: 'planningPolicy', payload });
        return {
          status: 'planned',
          reasonCode: 'PLAN_READY_TASK1044',
          requiredActions: ['prepare'],
          candidate: {
            sourceDraftId: 'draft_task1044',
            organizationId: 'org_task1044',
            tenantId: 'tenant_task1044',
            customerPhone: '+886900001044',
          },
          summary: {
            title: 'safe plan summary',
            phone: '+886900001044',
          },
          lineUserId: 'unsafe_plan_line_task1044',
          finalAppointmentId: 'unsafe_final_task1044',
          rawRows: [{ phone: '+886900001044' }],
          token: 'unsafe_plan_token_task1044',
          stack: 'unsafe_planner_stack',
        };
      },
    },
    caseCreationPort: {
      createCaseFromDraft: async (payload) => {
        calls.push({ name: 'caseCreationPort', payload });
        return {
          id: 'case_task1044',
          organizationId: 'org_task1044',
          tenantId: 'tenant_task1044',
          sourceDraftId: 'draft_task1044',
          status: 'created',
          reasonCode: 'CASE_CREATED_TASK1044',
          requiredActions: ['created'],
          summary: {
            title: 'safe case summary',
            phone: '+886900001044',
          },
          finalAppointmentId: 'unsafe_final_task1044',
          databaseUrl: 'postgres://unsafe',
          rawRows: [{ phone: '+886900001044' }],
          stack: 'unsafe_case_stack',
        };
      },
    },
    auditPort: {
      recordDraftToCaseDecision: async (payload) => {
        calls.push({ name: 'auditPort', payload });
        return {
          eventType: 'repair_intake_draft_to_case_decision',
          outcome: 'submitted',
          draftId: 'draft_task1044',
          organizationId: 'org_task1044',
          tenantId: 'tenant_task1044',
          caseId: 'case_task1044',
          reasonCode: 'AUDIT_RECORDED_TASK1044',
          finalAppointmentId: 'unsafe_final_task1044',
          stack: 'unsafe_audit_stack',
          token: 'unsafe_audit_token',
          metadata: {
            lineUserId: 'unsafe_audit_line',
            phone: '+886900001044',
            sql: 'select * from unsafe_audit_task1044',
          },
        };
      },
    },
  };
}

function createApplicationService(calls, options = {}) {
  const core = createCorePorts(calls);
  const idempotencyPort = createRepairIntakeIdempotencyPortAdapter({
    idempotencyStore: createIdempotencyStore(calls, options.idempotencyStoreOptions),
  });

  const draftReader = createRepairIntakeDraftReaderPortAdapter({
    draftRepository: core.draftRepository,
  });
  const casePlanner = createRepairIntakeCasePlannerPortAdapter({
    planningPolicy: core.planningPolicy,
  });
  const caseCreator = createRepairIntakeCaseCreatorPortAdapter({
    caseCreationPort: core.caseCreationPort,
  });
  const auditWriter = createRepairIntakeAuditWriterPortAdapter({
    auditPort: core.auditPort,
  });

  return createRepairIntakeDraftToCaseApplicationService({
    draftReader,
    casePlanner,
    caseCreator,
    auditWriter,
    idempotencyPort,
  });
}

function createFullInjectedApiModule(calls, options = {}) {
  const applicationService = createApplicationService(calls, options);
  const controller = createRepairIntakeDraftToCaseController({
    applicationService,
  });

  return createRepairIntakeDraftToCaseApiModule({
    controller,
  });
}

function collectForbiddenKeys(value, keys = new Set()) {
  if (!value || typeof value !== 'object') {
    return keys;
  }

  for (const [key, fieldValue] of Object.entries(value)) {
    keys.add(key);
    collectForbiddenKeys(fieldValue, keys);
  }

  return keys;
}

function assertNoUnsafeText(value) {
  const keys = collectForbiddenKeys(value);

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
    'response',
    'socket',
    'headers',
    'cookies',
    'rawBody',
    'rawRows',
    'rawrows',
    'rawResult',
    'rawresult',
    'sql',
    'authorization',
    'cookie',
    'customerName',
    'customerData',
    'customerdata',
    'address',
    'phone',
    'lineuserid',
    'lineaccesstoken',
    'finalAppointmentId',
    'databaseUrl',
    'stack',
    'token',
    'DATABASE_URL',
    'database_url',
    'rawQuery',
    'rawInput',
    'rawquery',
    'handler',
    'service',
  ]) {
    assert.equal(keys.has(forbiddenKey), false, `forwarded unsafe key ${forbiddenKey}`);
  }

  const serialized = JSON.stringify(value);
  for (const forbiddenText of [
    'select * from unsafe_task1044',
    'select * from unsafe_draft_task1044',
    'unsafe_task1044',
    'postgres://unsafe',
    'unsafe_final_task1044',
    'unsafe_line_task1044',
    'unsafe_line_token_task1044',
    'unsafe_context_line_task1044',
    'unsafe raw body task1044',
    'unsafe_case_stack',
    'unsafe_audit_stack',
    'unsafe_store_stack',
    'unsafe_planner_stack',
    'unsafe_repository_stack',
    'unsafe_plan_line_task1044',
    'unsafe_actor_token_task1044',
    'unsafe_audit_line',
    'unsafe_record_stack_task1044',
    'Bearer unsafe',
    'unsafe_record_stack_task1044',
    'unsafe_plan_token_task1044',
    'unsafe_line_task1044',
    'unsafe_line_token_task1044',
    'unsafe_final_task1044',
    'unsafe raw body task1044',
    'unsafe_plan_token_task1044',
    'unsafe_token_task1044',
    'handler',
    'applicationService',
    'controller',
    'service',
    'rawRows',
    'rawquery',
    'finalAppointmentId',
  ]) {
    assert.equal(serialized.includes(forbiddenText), false, `leaked ${forbiddenText}`);
  }
}

function assertSanitizedIdempotencyLookup(lookup) {
  assert.equal(lookup.idempotencyKey, 'idem_task1044');
  assert.equal(lookup.draftId, 'draft_task1044');
  assert.equal(lookup.organizationId, 'org_task1044');
  assert.equal(lookup.tenantId, 'tenant_task1044');
  assert.equal(lookup.requestId, 'req_task1044');
}

test('submit route no existing idempotency result: idempotency find -> draft reader -> planner -> creator -> audit -> record', async () => {
  const calls = [];
  const mountTarget = createSyntheticMountTarget();
  const summary = mountRepairIntakeDraftToCaseApiModule({
    mountTarget,
    apiModule: createFullInjectedApiModule(calls),
    basePath: '/internal/v1',
  });

  assert.equal(summary.ok, true);
  assert.equal(summary.mounted, 2);
  assert.deepEqual(summary.routes, [
    {
      method: 'POST',
      path: '/internal/v1/repair-intake/drafts/:draftId/case/plan',
    },
    {
      method: 'POST',
      path: '/internal/v1/repair-intake/drafts/:draftId/case/submit',
    },
  ]);
  assertNoUnsafeText(summary.routes);

  const response = await mountTarget.dispatch(
    'POST',
    '/internal/v1/repair-intake/drafts/:draftId/case/submit',
    unsafeRequestLike(),
  );

  const callNames = calls.map((call) => call.name);
  assert.deepEqual(callNames, [
    'idempotencyStore.find',
    'draftRepository',
    'planningPolicy',
    'caseCreationPort',
    'auditPort',
    'idempotencyStore.record',
  ]);

  assertSanitizedIdempotencyLookup(calls[0].payload);
  assert.deepEqual(calls[1].payload.draftId, 'draft_task1044');
  assert.deepEqual(calls[2].payload.draft.id, 'draft_task1044');
  assert.deepEqual(calls[3].payload.plan.reasonCode, 'PLAN_READY_TASK1044');
  assert.equal(calls[4].payload.decision, 'submitted');
  assert.deepEqual(calls[5].payload.idempotencyKey, 'idem_task1044');
  assert.equal(calls[5].payload.result.reasonCode, 'CASE_CREATED_TASK1044');

  assert.equal(response.ok, true);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.action, 'repair_intake_draft_to_case_submit');
  assert.equal(response.body.reasonCode, 'CASE_CREATED_TASK1044');
  assert.equal(response.body.submitted, true);
  assert.equal(response.body.caseRef.id, 'case_task1044');
  assert.equal(response.body.auditEvent.eventType, 'repair_intake_draft_to_case_decision');
  assertNoUnsafeText(response);
  assertNoUnsafeText(calls.map((call) => call.payload));
});

test('submit route existing idempotency replay: only idempotency find, no core ports or record', async () => {
  const calls = [];
  const mountTarget = createSyntheticMountTarget();
  const summary = mountRepairIntakeDraftToCaseApiModule({
    mountTarget,
    apiModule: createFullInjectedApiModule(calls, {
      idempotencyStoreOptions: {
        existingResult: {
          ok: true,
          submitted: true,
          draftId: 'draft_task1044',
          organizationId: 'org_task1044',
          tenantId: 'tenant_task1044',
          status: 'submitted',
          reasonCode: 'REPLAY_READY_TASK1044',
          plan: {
            status: 'planned',
            reasonCode: 'PLAN_READY_TASK1044',
            candidate: {
              sourceDraftId: 'draft_task1044',
              organizationId: 'org_task1044',
              tenantId: 'tenant_task1044',
            },
            finalAppointmentId: 'unsafe_final_task1044',
            lineUserId: 'unsafe_replay_line_task1044',
            rawRows: [{ phone: '+886900001044' }],
            stack: 'unsafe_replay_stack',
          },
          caseRef: {
            id: 'case_task1044',
            organizationId: 'org_task1044',
            sourceDraftId: 'draft_task1044',
            status: 'created',
            finalAppointmentId: 'unsafe_final_task1044',
            stack: 'unsafe_replay_case_stack',
          },
          auditEvent: {
            eventType: 'repair_intake_draft_to_case_decision',
            outcome: 'submitted',
            finalAppointmentId: 'unsafe_final_task1044',
            stack: 'unsafe_replay_audit_stack',
          },
        },
      },
    }),
  });

  assert.equal(summary.ok, true);
  assert.equal(summary.mounted, 2);
  assertNoUnsafeText(summary);

  const response = await mountTarget.dispatch(
    'POST',
    '/repair-intake/drafts/:draftId/case/submit',
    unsafeRequestLike(),
  );

  assert.deepEqual(calls.map((call) => call.name), ['idempotencyStore.find']);
  assertSanitizedIdempotencyLookup(calls[0].payload);

  assert.equal(response.ok, true);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.idempotentReplay, true);
  assert.equal(response.body.reasonCode, 'REPLAY_READY_TASK1044');
  assert.equal(response.body.caseRef.id, 'case_task1044');
  assert.equal(response.body.submitted, true);
  assertNoUnsafeText(response);
  assertNoUnsafeText(calls.map((call) => call.payload));
});
