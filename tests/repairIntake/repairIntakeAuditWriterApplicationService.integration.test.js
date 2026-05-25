'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeAuditWriterPortAdapter,
} = require('../../src/repairIntake/repairIntakeAuditWriterPortAdapter');
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
    draftId: 'draft_task1039_top',
    organizationId: 'org_task1039_top',
    tenantId: 'tenant_task1039_top',
    requestId: 'req_task1039_top',
    actor: {
      actorId: 'actor_task1039',
      token: 'unsafe actor token',
    },
    params: {
      draftId: 'draft_task1039_param',
      phone: '+886900001039',
    },
    context: {
      organizationId: 'org_task1039_context',
      tenantId: 'tenant_task1039_context',
      actorId: 'actor_task1039_context',
      requestId: 'req_task1039_context',
      lineUserId: 'unsafe_line_task1039',
    },
    body: {
      organizationId: 'org_task1039_body',
      tenantId: 'tenant_task1039_body',
      idempotencyKey: 'idem_task1039',
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
      },
      approvalContext: {
        accepted: true,
      },
      phone: '+886900001039',
      address: 'unsafe address task1039',
      customerName: 'unsafe customer task1039',
      lineAccessToken: 'unsafe_line_token_task1039',
      finalAppointmentId: 'unsafe_final_task1039',
    },
    rawInput: {
      sql: 'select * from unsafe_task1039',
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
        id: 'draft_task1039',
        organizationId: 'org_task1039',
        tenantId: 'tenant_task1039',
        status: 'ready',
        source: 'repair_intake',
        sourceRef: 'source_task1039',
        intakeSource: 'manual',
        reasonCode: 'DRAFT_READY_TASK1039',
        requiredActions: [],
        summary: {
          title: 'safe draft summary',
          phone: '+886900001039',
        },
        rawRows: [{ phone: '+886900001039' }],
        phone: '+886900001039',
        address: 'unsafe address task1039',
        customerName: 'unsafe customer task1039',
        lineUserId: 'unsafe_line_task1039',
        finalAppointmentId: 'unsafe_final_task1039',
        sql: 'select * from unsafe_repository_task1039',
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
        reasonCode: 'PLAN_READY_TASK1039',
        requiredActions: [],
        candidate: {
          sourceDraftId: 'draft_task1039',
          organizationId: 'org_task1039',
          tenantId: 'tenant_task1039',
          customerPhone: '+886900001039',
        },
        metadata: {
          plannedBy: 'synthetic_policy',
          token: 'unsafe planner token',
        },
        warnings: ['safe_warning'],
        rawRows: [{ unsafe: true }],
        lineUserId: 'unsafe_line_task1039',
        stack: 'unsafe planner stack',
      };
    },
  };
}

function createCaseCreationPort(calls) {
  return {
    createCaseFromDraft: async (creationInput) => {
      calls.push({ name: 'caseCreationPort', payload: creationInput });
      return {
        id: 'case_task1039',
        organizationId: 'org_task1039',
        tenantId: 'tenant_task1039',
        sourceDraftId: 'draft_task1039',
        status: 'created',
        reasonCode: 'CASE_CREATED_TASK1039',
        requiredActions: [],
        summary: {
          title: 'safe case summary',
          phone: '+886900001039',
        },
        finalAppointmentId: 'unsafe_final_task1039',
        databaseUrl: 'postgres://unsafe',
        rawRows: [{ unsafe: true }],
        stack: 'unsafe case stack',
      };
    },
  };
}

function createAuditPort(calls) {
  return {
    recordDraftToCaseDecision: async (payload) => {
      calls.push({ name: 'auditPort', payload });
      return {
        eventType: 'repair_intake_draft_to_case_decision',
        outcome: 'submitted',
        draftId: 'draft_task1039',
        organizationId: 'org_task1039',
        tenantId: 'tenant_task1039',
        caseId: 'case_task1039',
        reasonCode: 'AUDIT_RECORDED_TASK1039',
        requiredActions: ['recorded'],
        metadata: {
          recordedBy: 'synthetic_audit_port',
          token: 'unsafe audit token',
        },
        rawRows: [{ unsafe: true }],
        finalAppointmentId: 'unsafe_final_task1039',
        stack: 'unsafe audit stack',
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
  const caseCreator = createRepairIntakeCaseCreatorPortAdapter({
    caseCreationPort: createCaseCreationPort(calls),
  });
  const auditWriter = createRepairIntakeAuditWriterPortAdapter({
    auditPort: createAuditPort(calls),
  });

  return createRepairIntakeDraftToCaseApplicationService({
    draftReader,
    casePlanner,
    caseCreator,
    auditWriter,
  });
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'select *',
    'unsafe_task1039',
    'unsafe_repository_task1039',
    'DATABASE_URL',
    'postgres://',
    '+886900001039',
    'unsafe address task1039',
    'unsafe customer task1039',
    'unsafe_line_task1039',
    'unsafe_line_token_task1039',
    'unsafe_final_task1039',
    'unsafe actor token',
    'unsafe repository stack',
    'unsafe planner token',
    'unsafe planner stack',
    'unsafe case stack',
    'unsafe audit stack',
    'unsafe audit token',
    'Bearer unsafe',
    'rawRows',
    'rawInput',
    'authorization',
    'headers',
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

test('submitDraftToCase injects draftReader/casePlanner/caseCreator/auditWriter adapters as a pure chain', async () => {
  const calls = [];
  const service = createService(calls);

  const result = await service.submitDraftToCase(unsafeInput());

  assert.deepEqual(calls.map((call) => call.name), [
    'draftRepository',
    'planningPolicy',
    'caseCreationPort',
    'auditPort',
  ]);

  assert.deepEqual(calls[0].payload, {
    draftId: 'draft_task1039_top',
    organizationId: 'org_task1039_top',
    tenantId: 'tenant_task1039_top',
    requestId: 'req_task1039_top',
    actorId: 'actor_task1039_context',
  });

  const planningPayload = calls[1].payload;
  assert.equal(planningPayload.draft.id, 'draft_task1039');
  assert.equal(planningPayload.draft.draftId, 'draft_task1039');
  assert.equal(planningPayload.draft.organizationId, 'org_task1039');
  assert.equal(planningPayload.draft.summary.title, 'safe draft summary');
  assert.equal(planningPayload.actor.actorId, 'actor_task1039_context');

  const creationPayload = calls[2].payload;
  assert.equal(creationPayload.draft.id, 'draft_task1039');
  assert.equal(creationPayload.plan.reasonCode, 'PLAN_READY_TASK1039');
  assert.equal(creationPayload.plan.candidate.sourceDraftId, 'draft_task1039');
  assert.equal(creationPayload.actor.actorId, 'actor_task1039_context');

  const auditPortPayload = calls[3].payload;
  assert.equal(auditPortPayload.draft.id, 'draft_task1039');
  assert.equal(auditPortPayload.plan.status, 'planned');
  assert.equal(auditPortPayload.caseRef.id, 'case_task1039');
  assert.equal(auditPortPayload.decision, 'submitted');

  assert.equal(result.ok, true);
  assert.equal(result.submitted, true);
  assert.equal(result.reasonCode, 'CASE_CREATED_TASK1039');
  assert.equal(result.plan.reasonCode, 'PLAN_READY_TASK1039');
  assert.equal(result.caseRef.id, 'case_task1039');
  assert.equal(result.auditEvent.eventType, 'repair_intake_draft_to_case_decision');
  assert.equal(result.auditEvent.outcome, 'submitted');
  assert.equal(result.auditEvent.reasonCode, 'AUDIT_RECORDED_TASK1039');

  assertNoUnsafeText(calls.map((call) => call.payload));
  assertNoUnsafeText(result);
});
