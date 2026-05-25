'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeCaseCreatorPortAdapter,
} = require('../../src/repairIntake/repairIntakeCaseCreatorPortAdapter');
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
    draftId: 'draft_task1035_top',
    organizationId: 'org_task1035_top',
    tenantId: 'tenant_task1035_top',
    requestId: 'req_task1035_top',
    actor: {
      actorId: 'actor_task1035',
      token: 'unsafe actor token',
    },
    context: {
      organizationId: 'org_task1035_context',
      tenantId: 'tenant_task1035_context',
      actorId: 'actor_task1035_context',
      requestId: 'req_task1035_context',
      lineUserId: 'unsafe_line_task1035',
    },
    body: {
      organizationId: 'org_task1035_body',
      tenantId: 'tenant_task1035_body',
      idempotencyKey: 'idem_task1035',
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
      },
      approvalContext: {
        accepted: true,
      },
      phone: '+886900001035',
      address: 'unsafe address task1035',
      customerName: 'unsafe customer task1035',
      lineAccessToken: 'unsafe_line_token_task1035',
      finalAppointmentId: 'unsafe_final_task1035',
    },
    rawInput: {
      sql: 'select * from unsafe_task1035',
    },
    headers: {
      authorization: 'Bearer unsafe',
    },
  };
}

function createService(calls) {
  const draftReader = createRepairIntakeDraftReaderPortAdapter({
    draftRepository: {
      findDraftForConversion: async (lookup) => {
        calls.push({ name: 'draftRepository', payload: lookup });
        return {
          id: 'draft_task1035',
          organizationId: 'org_task1035',
          tenantId: 'tenant_task1035',
          status: 'ready',
          summary: {
            title: 'safe draft summary',
            phone: '+886900001035',
          },
          rawRows: [{ phone: '+886900001035' }],
          phone: '+886900001035',
          address: 'unsafe address task1035',
          lineUserId: 'unsafe_line_task1035',
          finalAppointmentId: 'unsafe_final_task1035',
          sql: 'select * from unsafe_repository_task1035',
          stack: 'unsafe repository stack',
        };
      },
    },
  });
  const casePlanner = createRepairIntakeCasePlannerPortAdapter({
    planningPolicy: {
      planCaseFromDraft: async (planningInput) => {
        calls.push({ name: 'planningPolicy', payload: planningInput });
        return {
          status: 'planned',
          reasonCode: 'PLAN_READY_TASK1035',
          requiredActions: [],
          candidate: {
            sourceDraftId: 'draft_task1035',
            organizationId: 'org_task1035',
            tenantId: 'tenant_task1035',
            customerPhone: '+886900001035',
          },
          warnings: ['safe_warning'],
          rawRows: [{ unsafe: true }],
          stack: 'unsafe planner stack',
        };
      },
    },
  });
  const caseCreator = createRepairIntakeCaseCreatorPortAdapter({
    caseCreationPort: {
      createCaseFromDraft: async (creationInput) => {
        calls.push({ name: 'caseCreationPort', payload: creationInput });
        return {
          id: 'case_task1035',
          organizationId: 'org_task1035',
          tenantId: 'tenant_task1035',
          sourceDraftId: 'draft_task1035',
          status: 'created',
          reasonCode: 'CASE_CREATED_TASK1035',
          requiredActions: [],
          summary: {
            title: 'safe case summary',
            phone: '+886900001035',
          },
          rawRows: [{ unsafe: true }],
          finalAppointmentId: 'unsafe_final_task1035',
          databaseUrl: 'postgres://unsafe',
          stack: 'unsafe creator stack',
        };
      },
    },
  });

  return createRepairIntakeDraftToCaseApplicationService({
    draftReader,
    casePlanner,
    caseCreator,
    auditWriter: {
      recordDraftToCaseDecision: async (payload) => {
        calls.push({ name: 'auditWriter', payload });
        return {
          eventType: 'repair_intake_draft_to_case_decision',
          outcome: 'submitted',
          draftId: 'draft_task1035',
          organizationId: 'org_task1035',
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
    'unsafe_task1035',
    'unsafe_repository_task1035',
    'DATABASE_URL',
    'postgres://',
    '+886900001035',
    'unsafe address task1035',
    'unsafe customer task1035',
    'unsafe_line_task1035',
    'unsafe_line_token_task1035',
    'unsafe_final_task1035',
    'unsafe actor token',
    'unsafe repository stack',
    'unsafe planner stack',
    'unsafe creator stack',
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

test('submitDraftToCase uses draftReader, casePlanner, and caseCreator adapters before audit', async () => {
  const calls = [];
  const service = createService(calls);

  const result = await service.submitDraftToCase(unsafeInput());

  assert.deepEqual(calls.map((call) => call.name), [
    'draftRepository',
    'planningPolicy',
    'caseCreationPort',
    'auditWriter',
  ]);
  assert.equal(calls[0].payload.draftId, 'draft_task1035_top');
  assert.equal(calls[0].payload.organizationId, 'org_task1035_top');
  assert.equal(calls[0].payload.actorId, 'actor_task1035_context');
  assert.equal(calls[1].payload.draft.id, 'draft_task1035');
  assert.equal(calls[1].payload.draft.summary.title, 'safe draft summary');
  assert.equal(calls[2].payload.draft.id, 'draft_task1035');
  assert.equal(calls[2].payload.plan.reasonCode, 'PLAN_READY_TASK1035');
  assert.equal(calls[2].payload.plan.candidate.sourceDraftId, 'draft_task1035');
  assert.equal(calls[2].payload.requestId, 'req_task1035_top');
  assert.equal(calls[3].payload.draft.id, 'draft_task1035');
  assert.equal(calls[3].payload.plan.status, 'planned');
  assert.equal(calls[3].payload.caseRef.id, 'case_task1035');
  assert.equal(calls[3].payload.caseRef.reasonCode, 'CASE_CREATED_TASK1035');
  assert.equal(calls[3].payload.decision, 'submitted');
  assert.equal(result.ok, true);
  assert.equal(result.submitted, true);
  assert.equal(result.reasonCode, 'CASE_CREATED_TASK1035');
  assert.equal(result.caseRef.id, 'case_task1035');
  assertNoUnsafeText(calls.map((call) => call.payload));
  assertNoUnsafeText(result);
});
