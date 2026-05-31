'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  WORKSHOP_ASSIGNMENT_SERVICE_KIND,
  WORKSHOP_ASSIGN_PERMISSION,
  createWorkshopAssignmentService,
} = require('../../src/services/WorkshopAssignmentService');

const ORG_ID = 'org_task_2416';
const TENANT_ID = 'tenant_task_2416';
const CASE_ID = 'case_task_2416';
const DRAFT_ID = 'draft_task_2416';
const REPAIR_ORDER_ID = 'repair_order_task_2416';
const ACTOR_ID = 'actor_task_2416';
const REQUEST_ID = 'req_task_2416';
const WRITE_PERMISSION = 'depot_workshop.assignment_intent.write';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function preparedAssignmentIntent(overrides = {}) {
  return {
    depotIntakeId: DRAFT_ID,
    repairOrderId: REPAIR_ORDER_ID,
    organizationId: ORG_ID,
    tenantId: TENANT_ID,
    caseId: CASE_ID,
    depotStatus: 'diagnosis_pending',
    targetDepotStatus: 'diagnosis_completed',
    workflowType: 'depot',
    workshopId: 'workshop_safe_2416',
    workshopTeamId: 'team_safe_2416',
    assignedTechnicianId: 'technician_safe_2416',
    assignedByActorId: ACTOR_ID,
    requestId: REQUEST_ID,
    repairOrderCustomerProjection: {
      repairOrderReference: 'RO-2416',
      caseReference: 'CASE-2416',
      depotStatus: 'diagnosis_pending',
    },
    ...overrides,
  };
}

function validWriteInput(overrides = {}) {
  return {
    assignmentIntent: preparedAssignmentIntent(),
    trustedScope: {
      organizationId: ORG_ID,
      tenantId: TENANT_ID,
      caseId: CASE_ID,
      depotIntakeId: DRAFT_ID,
      repairOrderId: REPAIR_ORDER_ID,
      actorId: ACTOR_ID,
      requestId: REQUEST_ID,
      permissionContext: {
        permission: WRITE_PERMISSION,
      },
    },
    ...overrides,
  };
}

function depotIntake() {
  return {
    draftId: DRAFT_ID,
    organizationId: ORG_ID,
    tenantId: TENANT_ID,
    workflowType: 'depot',
    depotStatus: 'diagnosis_pending',
    caseId: CASE_ID,
    repairOrderId: REPAIR_ORDER_ID,
    workshopId: 'workshop_safe_2416',
  };
}

function createDepotIntakeRepository() {
  return {
    async findDepotIntakeState() {
      return {
        ok: true,
        found: true,
        depotIntake: depotIntake(),
      };
    },
  };
}

function successRepositoryResult(overrides = {}) {
  return {
    ok: true,
    status: 'written',
    reasonCode: 'depot_workshop_repair_order_repository_write_succeeded',
    organizationId: ORG_ID,
    tenantId: TENANT_ID,
    caseId: CASE_ID,
    depotIntakeId: DRAFT_ID,
    repairOrderId: REPAIR_ORDER_ID,
    repairOrderReference: REPAIR_ORDER_ID,
    written: true,
    requestId: REQUEST_ID,
    ...overrides,
  };
}

function createRepairOrderRepository({ calls = [], result, reject, throwError } = {}) {
  return {
    async writeRepairOrder(input) {
      calls.push(clone(input));

      if (throwError) {
        throw new Error('raw sql stack token password secret should not leak');
      }

      if (reject) {
        return Promise.reject(new Error('raw rejected database failure should not leak'));
      }

      if (result !== undefined) {
        return result;
      }

      return successRepositoryResult();
    },
  };
}

function assertNoUnsafeLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'rawDbRow',
    'raw_db_row',
    'raw sql stack token password secret should not leak',
    'raw rejected database failure should not leak',
    'providerPayload',
    'billingInternals',
    'aiOutput',
    'vectorTrace',
    'fieldServiceReport',
    'completionReport',
    'finalAppointmentId',
    'DATABASE_URL',
    'password',
    'secret',
    'token',
    'stack',
    'sql',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function assertFailure(result) {
  assert.equal(result.ok, false);
  assert.equal(result.prepared, false);
  assert.equal(result.written, false);
  assert.equal(result.serviceKind, WORKSHOP_ASSIGNMENT_SERVICE_KIND);
  assertNoUnsafeLeak(result);
}

test('prepareAssignmentIntent remains prepare-only while write method is separate', async () => {
  const service = createWorkshopAssignmentService({
    depotIntakeRepository: createDepotIntakeRepository(),
    repairOrderRepository: createRepairOrderRepository(),
  });

  const result = await service.prepareAssignmentIntent({
    draftId: DRAFT_ID,
    organizationId: ORG_ID,
    tenantId: TENANT_ID,
    actorId: ACTOR_ID,
    workshopId: 'workshop_safe_2416',
    requestId: REQUEST_ID,
    permissionContext: {
      permission: WORKSHOP_ASSIGN_PERMISSION,
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.prepared, true);
  assert.equal(result.written, false);
  assert.equal(result.assignmentIntent.writeRequired, false);
  assert.equal(typeof service.writePreparedAssignmentIntent, 'function');
  assertNoUnsafeLeak(result);
});

test('valid prepared assignment intent reaches fake repository and returns normalized safe result', async () => {
  const calls = [];
  const input = validWriteInput();
  const inputBefore = clone(input);
  const fakeResult = successRepositoryResult();
  const fakeResultBefore = clone(fakeResult);
  const service = createWorkshopAssignmentService({
    repairOrderRepository: createRepairOrderRepository({ calls, result: fakeResult }),
  });

  const result = await service.writePreparedAssignmentIntent(input);

  assert.equal(result.ok, true);
  assert.equal(result.prepared, true);
  assert.equal(result.written, true);
  assert.equal(result.serviceKind, WORKSHOP_ASSIGNMENT_SERVICE_KIND);
  assert.equal(result.reasonCode, 'depot_workshop_repair_order_repository_write_succeeded');
  assert.deepEqual(result.repairOrderResult, {
    repositoryKind: 'depot_workshop.repair_order_repository_contract',
    repairOrderReference: REPAIR_ORDER_ID,
    organizationId: ORG_ID,
    tenantId: TENANT_ID,
    caseId: CASE_ID,
    depotIntakeId: DRAFT_ID,
    repairOrderId: REPAIR_ORDER_ID,
    written: true,
    requestId: REQUEST_ID,
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].action, WRITE_PERMISSION);
  assert.equal(calls[0].command.organizationId, ORG_ID);
  assert.equal(calls[0].command.caseId, CASE_ID);
  assert.equal(calls[0].command.depotIntakeId, DRAFT_ID);
  assert.equal(calls[0].command.actorId, ACTOR_ID);
  assert.equal(calls[0].command.targetDepotStatus, 'diagnosis_completed');
  assert.equal(calls[0].auditIntent.internalOnly, true);
  assert.equal(calls[0].customerProjectionPreview.repairOrderReference, 'RO-2416');
  assert.deepEqual(input, inputBefore);
  assert.deepEqual(fakeResult, fakeResultBefore);
  assertNoUnsafeLeak(result);
  assertNoUnsafeLeak(calls);
});

test('missing dependency malformed input missing authorization and invalid transition fail before fake write', async () => {
  const calls = [];
  const serviceWithoutRepository = createWorkshopAssignmentService({});
  const service = createWorkshopAssignmentService({
    repairOrderRepository: createRepairOrderRepository({ calls }),
  });

  assertFailure(await serviceWithoutRepository.writePreparedAssignmentIntent(validWriteInput()));
  assert.equal(calls.length, 0);

  for (const input of [
    {},
    validWriteInput({ assignmentIntent: preparedAssignmentIntent({ caseId: undefined }), trustedScope: { organizationId: ORG_ID } }),
    validWriteInput({
      assignmentIntent: preparedAssignmentIntent({ depotIntakeId: undefined, repairOrderId: undefined }),
      trustedScope: {
        organizationId: ORG_ID,
        caseId: CASE_ID,
        actorId: ACTOR_ID,
        permissionContext: {
          permission: WRITE_PERMISSION,
        },
      },
    }),
    validWriteInput({ trustedScope: { organizationId: ORG_ID, caseId: CASE_ID, depotIntakeId: DRAFT_ID, actorId: ACTOR_ID } }),
    validWriteInput({ assignmentIntent: preparedAssignmentIntent({ targetDepotStatus: 'closed' }) }),
  ]) {
    assertFailure(await service.writePreparedAssignmentIntent(input));
  }

  assert.equal(calls.length, 0);
});

test('repository thrown rejected malformed and cross-scope results fail closed without raw leakage', async () => {
  for (const repositoryOptions of [
    { throwError: true },
    { reject: true },
    { result: { ok: true, rawDbRow: { token: 'secret should not leak' } } },
    { result: successRepositoryResult({ organizationId: 'org_other_2416' }) },
    { result: successRepositoryResult({ caseId: 'case_other_2416' }) },
  ]) {
    const service = createWorkshopAssignmentService({
      repairOrderRepository: createRepairOrderRepository(repositoryOptions),
    });

    assertFailure(await service.writePreparedAssignmentIntent(validWriteInput()));
  }
});
