'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftReaderPortAdapter,
} = require('../../src/repairIntake/repairIntakeDraftReaderPortAdapter');
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
      draftId: 'draft_task1027',
      phone: '+886900001027',
    },
    query: {
      preview: 'true',
      sql: 'select * from unsafe_query_task1027',
    },
    body: {
      organizationId: 'org_task1027_body',
      tenantId: 'tenant_task1027_body',
      idempotencyKey: 'idem_task1027',
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
      },
      approvalContext: {
        accepted: true,
      },
      phone: '+886900001027',
      address: 'unsafe address task1027',
      customerName: 'unsafe customer task1027',
      lineUserId: 'unsafe_line_task1027',
      lineAccessToken: 'unsafe_line_token_task1027',
      finalAppointmentId: 'unsafe_final_task1027',
      DATABASE_URL: 'postgres://unsafe',
    },
    context: {
      organizationId: 'org_task1027_context',
      actorId: 'actor_task1027_context',
      requestId: 'req_task1027_context',
    },
    requestId: 'req_task1027',
    tenantId: 'tenant_task1027',
    req: { unsafe: true },
    res: { unsafe: true },
    headers: { authorization: 'Bearer unsafe' },
    rawBody: 'unsafe raw body task1027',
  };
}

function createFullInjectedApiModule(calls) {
  const draftReader = createRepairIntakeDraftReaderPortAdapter({
    draftRepository: {
      findDraftForConversion: async (lookup) => {
        calls.push({ name: 'draftRepository', payload: lookup });
        return {
          id: lookup.draftId,
          organizationId: lookup.organizationId,
          tenantId: lookup.tenantId,
          status: 'ready',
          source: 'repair_intake',
          sourceRef: 'source_task1027',
          intakeSource: 'manual',
          reasonCode: 'DRAFT_READY_TASK1027',
          requiredActions: [],
          summary: {
            title: 'safe draft summary',
            phone: '+886900001027',
          },
          rawRows: [{ phone: '+886900001027' }],
          phone: '+886900001027',
          address: 'unsafe address task1027',
          customerName: 'unsafe customer task1027',
          lineUserId: 'unsafe_line_task1027',
          finalAppointmentId: 'unsafe_final_task1027',
          sql: 'select * from unsafe_repository_task1027',
          stack: 'unsafe repository stack',
        };
      },
    },
  });

  const applicationService = createRepairIntakeDraftToCaseApplicationService({
    draftReader,
    casePlanner: {
      planCaseFromDraft: async (payload) => {
        calls.push({ name: 'casePlanner', payload });
        return {
          status: 'planned',
          reasonCode: 'PLAN_READY_TASK1027',
          requiredActions: [],
          candidate: {
            sourceDraftId: 'draft_task1027',
            organizationId: 'org_task1027',
            customerPhone: '+886900001027',
          },
          rawRows: [{ unsafe: true }],
          lineUserId: 'unsafe_line_task1027',
        };
      },
    },
    caseCreator: {
      createCaseFromDraft: async (payload) => {
        calls.push({ name: 'caseCreator', payload });
        return {
          id: 'case_task1027',
          organizationId: 'org_task1027',
          sourceDraftId: 'draft_task1027',
          status: 'created',
          reasonCode: 'SUBMIT_READY_TASK1027',
          requiredActions: [],
          finalAppointmentId: 'unsafe_final_task1027',
          databaseUrl: 'postgres://unsafe',
        };
      },
    },
    auditWriter: {
      recordDraftToCaseDecision: async (payload) => {
        calls.push({ name: 'auditWriter', payload });
        return {
          eventType: 'repair_intake_draft_to_case_decision',
          outcome: 'submitted',
          draftId: 'draft_task1027',
          organizationId: 'org_task1027',
          stack: 'unsafe audit stack',
          token: 'unsafe audit token',
        };
      },
    },
  });
  const controller = createRepairIntakeDraftToCaseController({ applicationService });

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
    'headers',
    'rawBody',
    'rawRows',
    'sql',
    'DATABASE_URL',
    'databaseUrl',
    'authorization',
    'phone',
    'address',
    'customerName',
    'customerPhone',
    'lineUserId',
    'lineAccessToken',
    'finalAppointmentId',
    'stack',
    'token',
  ]) {
    assert.equal(keys.has(forbiddenKey), false, `forwarded unsafe key ${forbiddenKey}`);
  }

  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'select *',
    'unsafe_query_task1027',
    'unsafe_repository_task1027',
    'DATABASE_URL',
    'postgres://',
    '+886900001027',
    'unsafe address task1027',
    'unsafe customer task1027',
    'unsafe_line_task1027',
    'unsafe_line_token_task1027',
    'unsafe_final_task1027',
    'unsafe raw body task1027',
    'unsafe repository stack',
    'unsafe audit stack',
    'unsafe audit token',
    'Bearer unsafe',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function assertRepositoryLookup(payload) {
  assert.equal(payload.draftId, 'draft_task1027');
  assert.equal(payload.organizationId, 'org_task1027_context');
  assert.equal(payload.tenantId, 'tenant_task1027');
  assert.equal(payload.requestId, 'req_task1027');
  assert.equal(payload.actorId, 'actor_task1027_context');
  assertNoUnsafeText(payload);
}

function assertPlannerPayload(payload) {
  assert.equal(payload.params.draftId, 'draft_task1027');
  assert.equal(payload.body.idempotencyKey, 'idem_task1027');
  assert.equal(payload.body.permissionContext.canCreateCaseFromRepairIntakeDraft, true);
  assert.equal(payload.body.approvalContext.accepted, true);
  assert.equal(payload.draft.id, 'draft_task1027');
  assert.equal(payload.draft.organizationId, 'org_task1027_context');
  assert.equal(payload.draft.status, 'ready');
  assert.equal(payload.draft.summary.title, 'safe draft summary');
  assert.equal(payload.plan, undefined);
  assert.equal(payload.caseRef, undefined);
  assertNoUnsafeText(payload);
}

test('mounted plan route dispatches through full injected draftReader chain', async () => {
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

  assert.deepEqual(calls.map((call) => call.name), ['draftRepository', 'casePlanner']);
  assertRepositoryLookup(calls[0].payload);
  assertPlannerPayload(calls[1].payload);
  assert.equal(response.ok, true);
  assert.equal(response.body.reasonCode, 'PLAN_READY_TASK1027');
  assert.equal(response.body.submitted, false);
  assert.equal(response.body.caseRef, null);
  assert.equal(response.body.auditEvent, null);
  assertNoUnsafeText(response);
});

test('mounted submit route dispatches through full injected draftReader chain', async () => {
  const calls = [];
  const mountTarget = createSyntheticMountTarget();
  const summary = mountRepairIntakeDraftToCaseApiModule({
    mountTarget,
    apiModule: createFullInjectedApiModule(calls),
  });

  assert.equal(summary.ok, true);
  assertNoUnsafeText(summary.routes);

  const response = await mountTarget.dispatch(
    'POST',
    '/repair-intake/drafts/:draftId/case/submit',
    unsafeRequestLike(),
  );

  assert.deepEqual(calls.map((call) => call.name), [
    'draftRepository',
    'casePlanner',
    'caseCreator',
    'auditWriter',
  ]);
  assertRepositoryLookup(calls[0].payload);
  assertPlannerPayload(calls[1].payload);
  assert.equal(calls[2].payload.draft.id, 'draft_task1027');
  assert.equal(calls[2].payload.plan.reasonCode, 'PLAN_READY_TASK1027');
  assert.equal(calls[2].payload.caseRef, undefined);
  assert.equal(calls[3].payload.draft.id, 'draft_task1027');
  assert.equal(calls[3].payload.plan.status, 'planned');
  assert.equal(calls[3].payload.caseRef.id, 'case_task1027');
  assert.equal(calls[3].payload.decision, 'submitted');
  assert.equal(response.ok, true);
  assert.equal(response.body.reasonCode, 'SUBMIT_READY_TASK1027');
  assert.equal(response.body.submitted, true);
  assertNoUnsafeText(calls.map((call) => call.payload));
  assertNoUnsafeText(response);
});
