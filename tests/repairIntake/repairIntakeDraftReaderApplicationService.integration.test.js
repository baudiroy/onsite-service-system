'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftReaderPortAdapter,
} = require('../../src/repairIntake/repairIntakeDraftReaderPortAdapter');
const {
  createRepairIntakeDraftToCaseApplicationService,
} = require('../../src/repairIntake/repairIntakeDraftToCaseApplicationService');

function unsafeInput() {
  return {
    draftId: 'draft_task1026_top',
    organizationId: 'org_task1026_top',
    tenantId: 'tenant_task1026_top',
    requestId: 'req_task1026_top',
    actor: {
      actorId: 'actor_task1026_actor',
      token: 'unsafe actor token',
    },
    params: {
      draftId: 'draft_task1026_param',
      phone: '+886900001026',
    },
    context: {
      organizationId: 'org_task1026_context',
      tenantId: 'tenant_task1026_context',
      actorId: 'actor_task1026_context',
      requestId: 'req_task1026_context',
      lineUserId: 'unsafe_line_task1026',
    },
    body: {
      organizationId: 'org_task1026_body',
      tenantId: 'tenant_task1026_body',
      idempotencyKey: 'idem_task1026',
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
      },
      approvalContext: {
        accepted: true,
      },
      phone: '+886900001026',
      address: 'unsafe address task1026',
      customerName: 'unsafe customer task1026',
      lineAccessToken: 'unsafe_line_token_task1026',
      finalAppointmentId: 'unsafe_final_task1026',
    },
    rawInput: {
      sql: 'select * from unsafe_task1026',
    },
    headers: {
      authorization: 'Bearer unsafe',
    },
  };
}

function createSyntheticDraftRepository(calls) {
  return {
    findDraftForConversion: async (lookup) => {
      calls.push({ name: 'draftRepository', payload: lookup });
      return {
        id: 'draft_task1026',
        organizationId: 'org_task1026',
        tenantId: 'tenant_task1026',
        status: 'ready',
        source: 'repair_intake',
        sourceRef: 'source_task1026',
        intakeSource: 'manual',
        reasonCode: 'DRAFT_READY_TASK1026',
        requiredActions: [],
        summary: {
          title: 'safe draft summary',
          phone: '+886900001026',
        },
        rawRows: [{ phone: '+886900001026' }],
        rawRow: { address: 'unsafe raw row address' },
        phone: '+886900001026',
        address: 'unsafe address task1026',
        customerName: 'unsafe customer task1026',
        lineUserId: 'unsafe_line_task1026',
        finalAppointmentId: 'unsafe_final_task1026',
        sql: 'select * from unsafe_repository',
        stack: 'unsafe repository stack',
      };
    },
  };
}

function createApplicationPorts(calls) {
  return {
    casePlanner: {
      planCaseFromDraft: async (payload) => {
        calls.push({ name: 'casePlanner', payload });
        return {
          status: 'planned',
          reasonCode: 'PLAN_READY_TASK1026',
          requiredActions: [],
          candidate: {
            sourceDraftId: 'draft_task1026',
            organizationId: 'org_task1026',
            customerPhone: '+886900001026',
          },
          rawRows: [{ unsafe: true }],
          lineUserId: 'unsafe_line_task1026',
          stack: 'unsafe plan stack',
        };
      },
    },
    caseCreator: {
      createCaseFromDraft: async (payload) => {
        calls.push({ name: 'caseCreator', payload });
        return {
          id: 'case_task1026',
          organizationId: 'org_task1026',
          sourceDraftId: 'draft_task1026',
          status: 'created',
          reasonCode: 'SUBMIT_READY_TASK1026',
          requiredActions: [],
          finalAppointmentId: 'unsafe_final_task1026',
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
          draftId: 'draft_task1026',
          organizationId: 'org_task1026',
          token: 'unsafe audit token',
        };
      },
    },
  };
}

function createInjectedService(calls) {
  const draftReader = createRepairIntakeDraftReaderPortAdapter({
    draftRepository: createSyntheticDraftRepository(calls),
  });
  const ports = createApplicationPorts(calls);

  return createRepairIntakeDraftToCaseApplicationService({
    draftReader,
    casePlanner: ports.casePlanner,
    caseCreator: ports.caseCreator,
    auditWriter: ports.auditWriter,
  });
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'select *',
    'unsafe_task1026',
    'unsafe_repository',
    'DATABASE_URL',
    'postgres://',
    '+886900001026',
    'unsafe address task1026',
    'unsafe customer task1026',
    'unsafe_line_task1026',
    'unsafe_line_token_task1026',
    'unsafe_final_task1026',
    'unsafe actor token',
    'unsafe raw row address',
    'unsafe repository stack',
    'unsafe plan stack',
    'unsafe audit token',
    'Bearer unsafe',
    'rawRows',
    'rawRow',
    'rawInput',
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
    draftId: 'draft_task1026_top',
    organizationId: 'org_task1026_top',
    tenantId: 'tenant_task1026_top',
    requestId: 'req_task1026_top',
    actorId: 'actor_task1026_context',
  });
  assertNoUnsafeText(payload);
}

function assertPlannerPayload(payload) {
  assert.equal(payload.draft.id, 'draft_task1026');
  assert.equal(payload.draft.draftId, 'draft_task1026');
  assert.equal(payload.draft.organizationId, 'org_task1026');
  assert.equal(payload.draft.status, 'ready');
  assert.equal(payload.draft.summary.title, 'safe draft summary');
  assert.equal(payload.plan, undefined);
  assert.equal(payload.caseRef, undefined);
  assertNoUnsafeText(payload);
}

test('planDraftToCase uses draftReader adapter and synthetic draftRepository before planning only', async () => {
  const calls = [];
  const service = createInjectedService(calls);

  const result = await service.planDraftToCase(unsafeInput());

  assert.deepEqual(calls.map((call) => call.name), ['draftRepository', 'casePlanner']);
  assertRepositoryLookup(calls[0].payload);
  assertPlannerPayload(calls[1].payload);
  assert.equal(result.ok, true);
  assert.equal(result.submitted, false);
  assert.equal(result.reasonCode, 'PLAN_READY_TASK1026');
  assertNoUnsafeText(result);
});

test('submitDraftToCase uses draftReader adapter and preserves sanitized submit call order', async () => {
  const calls = [];
  const service = createInjectedService(calls);

  const result = await service.submitDraftToCase(unsafeInput());

  assert.deepEqual(calls.map((call) => call.name), [
    'draftRepository',
    'casePlanner',
    'caseCreator',
    'auditWriter',
  ]);
  assertRepositoryLookup(calls[0].payload);
  assertPlannerPayload(calls[1].payload);
  assert.equal(calls[2].payload.draft.id, 'draft_task1026');
  assert.equal(calls[2].payload.plan.reasonCode, 'PLAN_READY_TASK1026');
  assert.equal(calls[2].payload.plan.candidate.sourceDraftId, 'draft_task1026');
  assert.equal(calls[2].payload.caseRef, undefined);
  assert.equal(calls[3].payload.draft.id, 'draft_task1026');
  assert.equal(calls[3].payload.plan.status, 'planned');
  assert.equal(calls[3].payload.caseRef.id, 'case_task1026');
  assert.equal(calls[3].payload.decision, 'submitted');
  assert.equal(result.ok, true);
  assert.equal(result.submitted, true);
  assert.equal(result.reasonCode, 'SUBMIT_READY_TASK1026');
  assertNoUnsafeText(calls.map((call) => call.payload));
  assertNoUnsafeText(result);
});
