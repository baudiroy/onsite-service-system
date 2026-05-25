'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeCasePlannerPortAdapter,
} = require('../../src/repairIntake/repairIntakeCasePlannerPortAdapter');
const {
  createRepairIntakeDraftReaderPortAdapter,
} = require('../../src/repairIntake/repairIntakeDraftReaderPortAdapter');
const {
  createRepairIntakeDraftToCaseApplicationService,
} = require('../../src/repairIntake/repairIntakeDraftToCaseApplicationService');

function unsafeInput() {
  return {
    draftId: 'draft_task1031_top',
    organizationId: 'org_task1031_top',
    tenantId: 'tenant_task1031_top',
    requestId: 'req_task1031_top',
    actor: {
      actorId: 'actor_task1031',
      token: 'unsafe actor token',
    },
    params: {
      draftId: 'draft_task1031_param',
      phone: '+886900001031',
    },
    context: {
      organizationId: 'org_task1031_context',
      tenantId: 'tenant_task1031_context',
      actorId: 'actor_task1031_context',
      requestId: 'req_task1031_context',
      lineUserId: 'unsafe_line_task1031',
    },
    body: {
      organizationId: 'org_task1031_body',
      tenantId: 'tenant_task1031_body',
      idempotencyKey: 'idem_task1031',
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
      },
      approvalContext: {
        accepted: true,
      },
      phone: '+886900001031',
      address: 'unsafe address task1031',
      customerName: 'unsafe customer task1031',
      lineAccessToken: 'unsafe_line_token_task1031',
      finalAppointmentId: 'unsafe_final_task1031',
    },
    rawInput: {
      sql: 'select * from unsafe_task1031',
    },
    headers: {
      authorization: 'Bearer unsafe',
    },
  };
}

function createDraftRepository(calls) {
  return {
    findDraftForConversion: async (lookup) => {
      calls.push({ name: 'draftRepository', payload: lookup });
      return {
        id: 'draft_task1031',
        organizationId: 'org_task1031',
        tenantId: 'tenant_task1031',
        status: 'ready',
        source: 'repair_intake',
        sourceRef: 'source_task1031',
        intakeSource: 'manual',
        reasonCode: 'DRAFT_READY_TASK1031',
        requiredActions: [],
        summary: {
          title: 'safe draft summary',
          phone: '+886900001031',
        },
        rawRows: [{ phone: '+886900001031' }],
        phone: '+886900001031',
        address: 'unsafe address task1031',
        customerName: 'unsafe customer task1031',
        lineUserId: 'unsafe_line_task1031',
        finalAppointmentId: 'unsafe_final_task1031',
        sql: 'select * from unsafe_repository_task1031',
        stack: 'unsafe repository stack',
      };
    },
  };
}

function createPlanningPolicy(calls) {
  return {
    planCaseFromDraft: async (planningInput) => {
      calls.push({ name: 'planningPolicy', payload: planningInput });
      return {
        status: 'planned',
        reasonCode: 'PLAN_READY_TASK1031',
        requiredActions: [],
        candidate: {
          sourceDraftId: 'draft_task1031',
          organizationId: 'org_task1031',
          tenantId: 'tenant_task1031',
          customerPhone: '+886900001031',
        },
        metadata: {
          plannedBy: 'synthetic_policy',
          token: 'unsafe planner token',
        },
        warnings: ['safe_warning'],
        rawRows: [{ unsafe: true }],
        lineUserId: 'unsafe_line_task1031',
        stack: 'unsafe planner stack',
      };
    },
  };
}

function createService(calls) {
  const draftReader = createRepairIntakeDraftReaderPortAdapter({
    draftRepository: createDraftRepository(calls),
  });
  const casePlanner = createRepairIntakeCasePlannerPortAdapter({
    planningPolicy: createPlanningPolicy(calls),
  });

  return createRepairIntakeDraftToCaseApplicationService({
    draftReader,
    casePlanner,
    caseCreator: {
      createCaseFromDraft: async (payload) => {
        calls.push({ name: 'caseCreator', payload });
        return {
          id: 'case_task1031',
          organizationId: 'org_task1031',
          sourceDraftId: 'draft_task1031',
          status: 'created',
          reasonCode: 'SUBMIT_READY_TASK1031',
          requiredActions: [],
          finalAppointmentId: 'unsafe_final_task1031',
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
          draftId: 'draft_task1031',
          organizationId: 'org_task1031',
          stack: 'unsafe audit stack',
          token: 'unsafe audit token',
        };
      },
    },
  });
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'select *',
    'unsafe_task1031',
    'unsafe_repository_task1031',
    'DATABASE_URL',
    'postgres://',
    '+886900001031',
    'unsafe address task1031',
    'unsafe customer task1031',
    'unsafe_line_task1031',
    'unsafe_line_token_task1031',
    'unsafe_final_task1031',
    'unsafe actor token',
    'unsafe repository stack',
    'unsafe planner token',
    'unsafe planner stack',
    'unsafe audit stack',
    'unsafe audit token',
    'Bearer unsafe',
    'rawRows',
    'rawInput',
    'headers',
    'authorization',
    'phone',
    'address',
    'customerName',
    'customerPhone',
    'lineUserId',
    'lineAccessToken',
    'finalAppointmentId',
    'databaseUrl',
    'sql',
    'stack',
    'token',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function assertRepositoryLookup(payload) {
  assert.deepEqual(payload, {
    draftId: 'draft_task1031_top',
    organizationId: 'org_task1031_top',
    tenantId: 'tenant_task1031_top',
    requestId: 'req_task1031_top',
    actorId: 'actor_task1031_context',
  });
  assertNoUnsafeText(payload);
}

function assertPlanningPolicyPayload(payload) {
  assert.equal(payload.draftId, 'draft_task1031_top');
  assert.equal(payload.organizationId, 'org_task1031_top');
  assert.equal(payload.tenantId, 'tenant_task1031_top');
  assert.equal(payload.requestId, 'req_task1031_top');
  assert.equal(payload.actor.actorId, 'actor_task1031_context');
  assert.equal(payload.draft.id, 'draft_task1031');
  assert.equal(payload.draft.draftId, 'draft_task1031');
  assert.equal(payload.draft.organizationId, 'org_task1031');
  assert.equal(payload.draft.summary.title, 'safe draft summary');
  assertNoUnsafeText(payload);
}

test('planDraftToCase uses draftReader and casePlanner adapters with sanitized payloads', async () => {
  const calls = [];
  const service = createService(calls);

  const result = await service.planDraftToCase(unsafeInput());

  assert.deepEqual(calls.map((call) => call.name), ['draftRepository', 'planningPolicy']);
  assertRepositoryLookup(calls[0].payload);
  assertPlanningPolicyPayload(calls[1].payload);
  assert.equal(result.ok, true);
  assert.equal(result.submitted, false);
  assert.equal(result.reasonCode, 'PLAN_READY_TASK1031');
  assertNoUnsafeText(result);
});

test('submitDraftToCase uses both adapters before create and audit ports', async () => {
  const calls = [];
  const service = createService(calls);

  const result = await service.submitDraftToCase(unsafeInput());

  assert.deepEqual(calls.map((call) => call.name), [
    'draftRepository',
    'planningPolicy',
    'caseCreator',
    'auditWriter',
  ]);
  assertRepositoryLookup(calls[0].payload);
  assertPlanningPolicyPayload(calls[1].payload);
  assert.equal(calls[2].payload.draft.id, 'draft_task1031');
  assert.equal(calls[2].payload.plan.reasonCode, 'PLAN_READY_TASK1031');
  assert.equal(calls[2].payload.plan.candidate.sourceDraftId, 'draft_task1031');
  assert.equal(calls[2].payload.caseRef, undefined);
  assert.equal(calls[3].payload.draft.id, 'draft_task1031');
  assert.equal(calls[3].payload.plan.status, 'planned');
  assert.equal(calls[3].payload.caseRef.id, 'case_task1031');
  assert.equal(calls[3].payload.decision, 'submitted');
  assert.equal(result.ok, true);
  assert.equal(result.submitted, true);
  assert.equal(result.reasonCode, 'SUBMIT_READY_TASK1031');
  assertNoUnsafeText(calls.map((call) => call.payload));
  assertNoUnsafeText(result);
});
