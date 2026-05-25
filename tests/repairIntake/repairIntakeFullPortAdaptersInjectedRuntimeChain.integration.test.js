'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

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
      draftId: 'draft_task1040',
      phone: '+886900001040',
    },
    query: {
      preview: 'true',
      sql: 'select * from unsafe_query_task1040',
    },
    body: {
      organizationId: 'org_task1040',
      tenantId: 'tenant_task1040',
      idempotencyKey: 'idem_task1040',
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
      },
      approvalContext: {
        accepted: true,
      },
      phone: '+886900001040',
      address: 'unsafe address task1040',
      customerName: 'unsafe customer task1040',
      lineUserId: 'unsafe_line_task1040',
      lineAccessToken: 'unsafe_line_token_task1040',
      finalAppointmentId: 'unsafe_final_task1040',
      DATABASE_URL: 'postgres://unsafe',
    },
    context: {
      organizationId: 'org_task1040',
      actorId: 'actor_task1040',
      requestId: 'req_task1040',
    },
    requestId: 'req_task1040',
    tenantId: 'tenant_task1040',
    req: { unsafe: true },
    res: { unsafe: true },
    rawBody: 'unsafe raw body task1040',
    headers: { authorization: 'Bearer unsafe' },
  };
}

function makePorts(calls) {
  return {
    draftRepository: {
      findDraftForConversion: async (lookup) => {
        calls.push({ name: 'draftRepository', payload: lookup });
        return {
          id: 'draft_task1040',
          organizationId: 'org_task1040',
          tenantId: 'tenant_task1040',
          status: 'ready',
          source: 'repair_intake',
          sourceRef: 'source_task1040',
          intakeSource: 'manual',
          reasonCode: 'DRAFT_READY_TASK1040',
          requiredActions: [],
          summary: {
            title: 'safe draft summary',
            phone: '+886900001040',
          },
          rawRows: [{ phone: '+886900001040' }],
          phone: '+886900001040',
          address: 'unsafe address task1040',
          lineUserId: 'unsafe_line_task1040',
          finalAppointmentId: 'unsafe_final_task1040',
          sql: 'select * from unsafe_draft_task1040',
          stack: 'unsafe repository stack task1040',
        };
      },
    },
    planningPolicy: {
      planCaseFromDraft: async (payload) => {
        calls.push({ name: 'casePlanningPolicy', payload });
        return {
          status: 'planned',
          reasonCode: 'PLAN_READY_TASK1040',
          requiredActions: [],
          candidate: {
            sourceDraftId: 'draft_task1040',
            organizationId: 'org_task1040',
            customerPhone: '+886900001040',
          },
          rawRows: [{ unsafe: true }],
          lineUserId: 'unsafe_line_task1040',
        };
      },
    },
    caseCreationPort: {
      createCaseFromDraft: async (payload) => {
        calls.push({ name: 'caseCreationPort', payload });
        return {
          id: 'case_task1040',
          organizationId: 'org_task1040',
          sourceDraftId: 'draft_task1040',
          status: 'created',
          reasonCode: 'SUBMIT_READY_TASK1040',
          requiredActions: [],
          finalAppointmentId: 'unsafe_final_task1040',
          databaseUrl: 'postgres://unsafe',
        };
      },
    },
    auditPort: {
      recordDraftToCaseDecision: async (payload) => {
        calls.push({ name: 'auditPort', payload });
        return {
          eventType: 'repair_intake_draft_to_case_decision',
          outcome: 'submitted',
          draftId: 'draft_task1040',
          organizationId: 'org_task1040',
          token: 'unsafe_token_task1040',
          stack: 'unsafe_audit_stack_task1040',
        };
      },
    },
  };
}

function createFullInjectedApiModule(calls) {
  const ports = makePorts(calls);
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
    draftReader,
    casePlanner,
    caseCreator,
    auditWriter,
  });
  const controller = createRepairIntakeDraftToCaseController({
    applicationService,
  });

  return createRepairIntakeDraftToCaseApiModule({ controller });
}

function assertNoUnsafeText(value) {
  const keys = new Set();
  const collectKeys = (candidate) => {
    if (!candidate || typeof candidate !== 'object') {
      return;
    }

    for (const [key, fieldValue] of Object.entries(candidate)) {
      keys.add(key);
      collectKeys(fieldValue);
    }
  };
  collectKeys(value);

  for (const forbiddenKey of [
    'handler',
    'applicationService',
    'controller',
    'module',
    'port',
    'repository',
    'req',
    'res',
    'rawBody',
    'rawRows',
    'sql',
    'DATABASE_URL',
    'authorization',
    'phone',
    'address',
    'customerName',
    'lineUserId',
    'lineAccessToken',
    'finalAppointmentId',
    'stack',
    'token',
    'databaseUrl',
    'rawquery',
    'response',
  ]) {
    assert.equal(keys.has(forbiddenKey), false, `forwarded unsafe key ${forbiddenKey}`);
  }

  const serialized = JSON.stringify(value);
  for (const forbidden of [
    'select *',
    'unsafe_query_task1040',
    'unsafe_draft_task1040',
    'DATABASE_URL',
    'postgres://',
    '+886900001040',
    'unsafe address task1040',
    'unsafe customer task1040',
    'unsafe_line_task1040',
    'unsafe_line_token_task1040',
    'unsafe_final_task1040',
    'unsafe raw body task1040',
    'unsafe repository stack task1040',
    'unsafe_audit_stack_task1040',
    'unsafe_token_task1040',
    'Bearer unsafe',
    'unsafe_',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function assertPlanPayload(payload) {
  assert.equal(payload.draftId, 'draft_task1040');
  assert.equal(payload.actor.actorId, 'actor_task1040');
  assert.equal(payload.organizationId, 'org_task1040');
  assert.equal(payload.tenantId, 'tenant_task1040');
  assert.equal(payload.requestId, 'req_task1040');
  assert.equal(payload.draft.id, 'draft_task1040');
  assert.equal(payload.draft.organizationId, 'org_task1040');
  assert.equal(payload.draft.status, 'ready');
  assert.equal(payload.draft.summary.title, 'safe draft summary');
  assertNoUnsafeText(payload);
}

test('mounted full chain plan route uses draftReader + planningPolicy only and returns sanitized plan', async () => {
  const calls = [];
  const mountTarget = createSyntheticMountTarget();
  const summary = mountRepairIntakeDraftToCaseApiModule({
    mountTarget,
    apiModule: createFullInjectedApiModule(calls),
  });

  assert.equal(summary.ok, true);
  assert.equal(summary.mounted, 2);
  assertNoUnsafeText(summary.routes);

  const response = await mountTarget.dispatch(
    'POST',
    '/repair-intake/drafts/:draftId/case/plan',
    unsafeRequestLike(),
  );

  assert.deepEqual(calls.map((call) => call.name), ['draftRepository', 'casePlanningPolicy']);
  assertNoUnsafeText(calls.map((call) => call.payload));
  assert.deepEqual(calls[0].payload.draftId, 'draft_task1040');
  assert.equal(calls[0].payload.organizationId, 'org_task1040');
  assert.equal(calls[0].payload.tenantId, 'tenant_task1040');
  assert.equal(calls[0].payload.requestId, 'req_task1040');
  assert.equal(calls[0].payload.actorId, 'actor_task1040');
  assertPlanPayload(calls[1].payload);
  assert.equal(response.ok, true);
  assert.equal(response.body.reasonCode, 'PLAN_READY_TASK1040');
  assert.equal(response.body.submitted, false);
  assert.equal(response.body.caseRef, null);
  assertNoUnsafeText(response);
});

test('mounted full chain submit route uses draftReader + planning + creation + audit ports and returns sanitized submit', async () => {
  const calls = [];
  const mountTarget = createSyntheticMountTarget();
  const summary = mountRepairIntakeDraftToCaseApiModule({
    mountTarget,
    apiModule: createFullInjectedApiModule(calls),
    basePath: '/internal/v1',
  });

  assert.equal(summary.ok, true);
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

  assert.deepEqual(calls.map((call) => call.name), [
    'draftRepository',
    'casePlanningPolicy',
    'caseCreationPort',
    'auditPort',
  ]);
  for (const call of calls) {
    assertNoUnsafeText(call.payload);
  }
  assert.equal(calls[2].payload.plan.reasonCode, 'PLAN_READY_TASK1040');
  assert.equal(calls[2].payload.caseRef, undefined);
  assert.equal(calls[3].payload.decision, 'submitted');
  assert.equal(response.ok, true);
  assert.equal(response.body.reasonCode, 'SUBMIT_READY_TASK1040');
  assert.equal(response.body.submitted, true);
  assert.equal(response.body.caseRef.id, 'case_task1040');
  assert.equal(response.body.caseRef.organizationId, 'org_task1040');
  assert.equal(response.body.auditEvent.outcome, 'submitted');
  assertNoUnsafeText(response);
});
