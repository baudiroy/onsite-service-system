'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftToCaseApplicationService,
} = require('../../src/repairIntake/repairIntakeDraftToCaseApplicationService');

function validInput() {
  return {
    draftId: 'draft_task1019r2',
    organizationId: 'org_task1019r2',
    actorId: 'actor_task1019r2',
    requestId: 'req_task1019r2',
    body: {
      organizationId: 'org_task1019r2',
      idempotencyKey: 'idem_task1019r2',
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
      },
      approvalContext: {
        accepted: true,
      },
      phone: '+886900001019',
      address: 'unsafe address task1019r2',
      lineUserId: 'unsafe_line_task1019r2',
      finalAppointmentId: 'unsafe_final_task1019r2',
    },
    sql: 'select * from unsafe_submit_precondition',
    headers: {
      authorization: 'Bearer unsafe',
    },
  };
}

function createPorts(calls) {
  return {
    draftReader: {
      getDraftForConversion: async (payload) => {
        calls.push({ name: 'draftReader', payload });
        return {
          id: 'draft_task1019r2',
          organizationId: 'org_task1019r2',
          status: 'ready',
          phone: '+886900001019',
          rawRows: [{ unsafe: true }],
        };
      },
    },
    casePlanner: {
      planCaseFromDraft: async (payload) => {
        calls.push({ name: 'casePlanner', payload });
        return {
          status: 'planned',
          reasonCode: 'PLAN_READY_TASK1019R2',
          requiredActions: [],
          candidate: {
            sourceDraftId: 'draft_task1019r2',
            organizationId: 'org_task1019r2',
          },
          stack: 'unsafe plan stack',
        };
      },
    },
    caseCreator: {
      createCaseFromDraft: async (payload) => {
        calls.push({ name: 'caseCreator', payload });
        return {
          id: 'case_task1019r2',
          organizationId: 'org_task1019r2',
          sourceDraftId: 'draft_task1019r2',
          status: 'created',
          reasonCode: 'SUBMIT_READY_TASK1019R2',
          requiredActions: [],
          finalAppointmentId: 'unsafe_final_task1019r2',
        };
      },
    },
    auditWriter: {
      recordDraftToCaseDecision: async (payload) => {
        calls.push({ name: 'auditWriter', payload });
        return {
          eventType: 'repair_intake_draft_to_case_decision',
          outcome: 'submitted',
          draftId: 'draft_task1019r2',
          organizationId: 'org_task1019r2',
          token: 'unsafe audit token',
        };
      },
    },
  };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'select *',
    'unsafe_submit_precondition',
    '+886900001019',
    'unsafe address task1019r2',
    'unsafe_line_task1019r2',
    'unsafe_final_task1019r2',
    'Bearer unsafe',
    'unsafe plan stack',
    'unsafe audit token',
    'rawRows',
    'finalAppointmentId',
    'authorization',
    'phone',
    'address',
    'lineUserId',
    'stack',
    'token',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('submitDraftToCase fails closed before port calls when idempotencyKey is missing', async () => {
  for (const body of [
    undefined,
    {},
    {
      permissionContext: { canCreateCaseFromRepairIntakeDraft: true },
      approvalContext: { accepted: true },
    },
  ]) {
    const calls = [];
    const service = createRepairIntakeDraftToCaseApplicationService(createPorts(calls));
    const input = validInput();
    input.body = body;

    const result = await service.submitDraftToCase(input);

    assert.equal(result.ok, false);
    assert.equal(
      result.reasonCode,
      'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_IDEMPOTENCY_REQUIRED',
    );
    assert.deepEqual(result.requiredActions, ['provide_idempotency_key']);
    assert.deepEqual(calls, []);
    assertNoUnsafeText(result);
  }
});

test('submitDraftToCase fails closed before port calls when permission is missing or false', async () => {
  for (const permissionContext of [
    undefined,
    {},
    { canCreateCaseFromRepairIntakeDraft: false },
  ]) {
    const calls = [];
    const service = createRepairIntakeDraftToCaseApplicationService(createPorts(calls));
    const input = validInput();
    input.body.permissionContext = permissionContext;

    const result = await service.submitDraftToCase(input);

    assert.equal(result.ok, false);
    assert.equal(
      result.reasonCode,
      'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_PERMISSION_REQUIRED',
    );
    assert.deepEqual(result.requiredActions, ['provide_case_creation_permission']);
    assert.deepEqual(calls, []);
    assertNoUnsafeText(result);
  }
});

test('submitDraftToCase fails closed before port calls when approval is missing or false', async () => {
  for (const approvalContext of [
    undefined,
    {},
    { accepted: false },
  ]) {
    const calls = [];
    const service = createRepairIntakeDraftToCaseApplicationService(createPorts(calls));
    const input = validInput();
    input.body.approvalContext = approvalContext;

    const result = await service.submitDraftToCase(input);

    assert.equal(result.ok, false);
    assert.equal(
      result.reasonCode,
      'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_APPROVAL_REQUIRED',
    );
    assert.deepEqual(result.requiredActions, ['provide_approval_acceptance']);
    assert.deepEqual(calls, []);
    assertNoUnsafeText(result);
  }
});

test('valid submit still calls ports in order and returns sanitized submit envelope', async () => {
  const calls = [];
  const service = createRepairIntakeDraftToCaseApplicationService(createPorts(calls));

  const result = await service.submitDraftToCase(validInput());

  assert.deepEqual(calls.map((call) => call.name), [
    'draftReader',
    'casePlanner',
    'caseCreator',
    'auditWriter',
  ]);
  assert.equal(result.ok, true);
  assert.equal(result.submitted, true);
  assert.equal(result.reasonCode, 'SUBMIT_READY_TASK1019R2');
  assertNoUnsafeText(calls.map((call) => call.payload));
  assertNoUnsafeText(result);
});

test('planDraftToCase does not require submit preconditions and avoids create/audit ports', async () => {
  const calls = [];
  const service = createRepairIntakeDraftToCaseApplicationService(createPorts(calls));
  const input = validInput();
  input.body = {};

  const result = await service.planDraftToCase(input);

  assert.deepEqual(calls.map((call) => call.name), ['draftReader', 'casePlanner']);
  assert.equal(result.ok, true);
  assert.equal(result.submitted, false);
  assert.equal(result.reasonCode, 'PLAN_READY_TASK1019R2');
  assertNoUnsafeText(calls.map((call) => call.payload));
  assertNoUnsafeText(result);
});
