'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  WORKSHOP_ASSIGNMENT_SERVICE_KIND,
  WORKSHOP_ASSIGN_PERMISSION,
  createWorkshopAssignmentService,
} = require('../../src/services/WorkshopAssignmentService');

const ORG_ID = 'org_task_2381';
const TENANT_ID = 'tenant_task_2381';
const ACTOR_ID = 'actor_task_2381';
const DRAFT_ID = 'draft_task_2381';
const CASE_ID = 'case_task_2381';
const BRAND_ID = 'brand_task_2381';
const SERVICE_PROVIDER_ID = 'service_provider_task_2381';
const REQUEST_ID = 'req_task_2381';

function enrichedDepotIntake(overrides = {}) {
  return {
    draftId: DRAFT_ID,
    caseId: CASE_ID,
    organizationId: ORG_ID,
    tenantId: TENANT_ID,
    workflowType: 'depot',
    depotStatus: 'diagnosis_pending',
    brandId: BRAND_ID,
    serviceProviderId: SERVICE_PROVIDER_ID,
    itemRef: 'item_ref_safe_2381',
    productRef: 'product_ref_safe_2381',
    issueSummaryRef: 'issue_ref_safe_2381',
    repairOrderReference: 'RO-2381',
    caseReference: 'CASE-2381',
    statusLabelKey: 'depot.status.diagnosis_pending',
    customerMessageKey: 'depot.message.diagnosis_pending',
    estimatedReadyAt: '2026-06-03T10:00:00.000Z',
    returnMethod: 'pickup',
    publicNotes: 'Safe customer-facing pickup note.',
    customerPhone: 'unsafe phone should not leak',
    customerName: 'unsafe customer should not leak',
    address: 'unsafe address should not leak',
    providerPayload: 'unsafe provider should not leak',
    finalAppointmentId: 'unsafe final should not leak',
    fieldServiceReport: 'unsafe fsr should not leak',
    completionReport: 'unsafe completion should not leak',
    billingInternals: 'unsafe billing should not leak',
    aiOutput: 'unsafe ai should not leak',
    token: 'unsafe token should not leak',
    sql: 'unsafe sql should not leak',
    ...overrides,
  };
}

function createRepository({ calls = [], depotIntake = enrichedDepotIntake() } = {}) {
  return {
    async findDepotIntakeState(input) {
      calls.push({ ...input });

      return {
        ok: true,
        found: true,
        depotIntake,
      };
    },
  };
}

function validCommand(overrides = {}) {
  return {
    draftId: DRAFT_ID,
    organizationId: ORG_ID,
    tenantId: TENANT_ID,
    actorId: ACTOR_ID,
    brandId: BRAND_ID,
    serviceProviderId: SERVICE_PROVIDER_ID,
    workshopId: 'workshop_safe_2381',
    workshopTeamId: 'team_safe_2381',
    assignedTechnicianId: 'technician_safe_2381',
    assignmentNote: 'safe assignment note',
    targetDepotStatus: 'diagnosis_completed',
    requestId: REQUEST_ID,
    permissionContext: {
      permission: WORKSHOP_ASSIGN_PERMISSION,
    },
    ...overrides,
  };
}

function assertNoUnsafeLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'unsafe phone should not leak',
    'unsafe customer should not leak',
    'unsafe address should not leak',
    'unsafe provider should not leak',
    'unsafe final should not leak',
    'unsafe fsr should not leak',
    'unsafe completion should not leak',
    'unsafe billing should not leak',
    'unsafe ai should not leak',
    'unsafe token should not leak',
    'unsafe sql should not leak',
    'customerPhone',
    'customerName',
    'address',
    'providerPayload',
    'finalAppointmentId',
    'fieldServiceReport',
    'completionReport',
    'billingInternals',
    'aiOutput',
    'token',
    'sql',
    'password',
    'secret',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('assignment intent remains prepare-only and includes safe detached repair order helper sections', async () => {
  const calls = [];
  const depotIntake = enrichedDepotIntake();
  const depotBefore = JSON.parse(JSON.stringify(depotIntake));
  const command = validCommand();
  const commandBefore = JSON.parse(JSON.stringify(command));
  const service = createWorkshopAssignmentService({
    depotIntakeRepository: createRepository({ calls, depotIntake }),
  });

  const result = await service.prepareAssignmentIntent(command);

  assert.equal(result.ok, true);
  assert.equal(result.prepared, true);
  assert.equal(result.written, false);
  assert.equal(result.serviceKind, WORKSHOP_ASSIGNMENT_SERVICE_KIND);
  assert.equal(result.reasonCode, 'workshop_assignment_intent_prepared');
  assert.deepEqual(calls, [{
    draftId: DRAFT_ID,
    organizationId: ORG_ID,
    tenantId: TENANT_ID,
    brandId: BRAND_ID,
    serviceProviderId: SERVICE_PROVIDER_ID,
    requestId: REQUEST_ID,
  }]);

  const intent = result.assignmentIntent;

  assert.equal(intent.writeRequired, false);
  assert.equal(intent.repairOrderDraft.caseId, CASE_ID);
  assert.equal(intent.repairOrderDraft.depotIntakeId, DRAFT_ID);
  assert.equal(intent.repairOrderDraft.depotStatus, 'diagnosis_pending');
  assert.equal(intent.repairOrderDraft.workshopId, 'workshop_safe_2381');
  assert.equal(intent.repairOrderDraft.createdByActorId, ACTOR_ID);
  assert.equal(intent.repairOrderTransitionPlan.fromStatus, 'diagnosis_pending');
  assert.equal(intent.repairOrderTransitionPlan.toStatus, 'diagnosis_completed');
  assert.equal(intent.repairOrderTransitionPlan.actorId, ACTOR_ID);
  assert.equal(intent.repairOrderAuditIntent.internalOnly, true);
  assert.equal(intent.repairOrderAuditIntent.customerVisible, false);
  assert.equal(intent.repairOrderAuditIntent.eventType, 'depot_workshop_repair_assignment_intent_prepared');
  assert.equal(intent.repairOrderAuditIntent.metadata.assignmentStatus, 'prepared');
  assert.equal(intent.repairOrderCustomerProjection.repairOrderReference, 'RO-2381');
  assert.equal(intent.repairOrderCustomerProjection.caseReference, 'CASE-2381');
  assert.equal(intent.repairOrderCustomerProjection.depotStatus, 'diagnosis_pending');
  assert.equal(intent.repairOrderCustomerProjection.publicNotes, 'Safe customer-facing pickup note.');

  intent.repairOrderDraft.caseId = 'mutated_output_case';
  intent.repairOrderAuditIntent.metadata.caseId = 'mutated_output_case';
  intent.repairOrderCustomerProjection.caseReference = 'mutated_output_case';

  assert.deepEqual(depotIntake, depotBefore);
  assert.deepEqual(command, commandBefore);
  assertNoUnsafeLeak(result);
});

test('missing repair order source requirements safely omit helper sections without breaking base assignment intent', async () => {
  const service = createWorkshopAssignmentService({
    depotIntakeRepository: createRepository({
      depotIntake: enrichedDepotIntake({
        caseId: undefined,
        repairOrderId: undefined,
      }),
    }),
  });

  const result = await service.prepareAssignmentIntent(validCommand());

  assert.equal(result.ok, true);
  assert.equal(result.written, false);
  assert.equal(result.assignmentIntent.depotIntakeId, DRAFT_ID);
  assert.equal(result.assignmentIntent.repairOrderDraft, undefined);
  assert.equal(result.assignmentIntent.repairOrderTransitionPlan, undefined);
  assert.equal(result.assignmentIntent.repairOrderAuditIntent, undefined);
  assert.equal(result.assignmentIntent.repairOrderCustomerProjection, undefined);
  assertNoUnsafeLeak(result);
});

test('invalid transition target is omitted safely while draft audit and projection stay bounded', async () => {
  const service = createWorkshopAssignmentService({
    depotIntakeRepository: createRepository(),
  });

  const result = await service.prepareAssignmentIntent(validCommand({
    targetDepotStatus: 'closed',
  }));

  assert.equal(result.ok, true);
  assert.equal(result.written, false);
  assert.equal(result.assignmentIntent.repairOrderDraft.caseId, CASE_ID);
  assert.equal(result.assignmentIntent.repairOrderTransitionPlan, undefined);
  assert.equal(result.assignmentIntent.repairOrderAuditIntent.internalOnly, true);
  assert.equal(result.assignmentIntent.repairOrderCustomerProjection.repairOrderReference, 'RO-2381');
  assertNoUnsafeLeak(result);
});

test('forbidden command payload and route write intent still fail before repository read', async () => {
  const calls = [];
  const service = createWorkshopAssignmentService({
    depotIntakeRepository: createRepository({ calls }),
  });

  for (const override of [
    { writeRequested: true },
    { writeApproved: true },
    { persist: true },
    { finalAppointmentId: 'unsafe final should not leak' },
    { providerPayload: 'unsafe provider should not leak' },
    { billingInternals: 'unsafe billing should not leak' },
    { aiOutput: 'unsafe ai should not leak' },
  ]) {
    const result = await service.prepareAssignmentIntent(validCommand(override));

    assert.equal(result.ok, false);
    assert.equal(result.prepared, false);
    assert.equal(result.written, false);
    assertNoUnsafeLeak(result);
  }

  assert.equal(calls.length, 0);
});

test('subcontractor assignment scope remains required before helper-derived sections are prepared', async () => {
  const service = createWorkshopAssignmentService({
    depotIntakeRepository: createRepository(),
  });

  const denied = await service.prepareAssignmentIntent(validCommand({
    actorRole: 'subcontractor',
    subcontractorOrganizationId: 'subcontractor_safe_2381',
  }));

  assert.equal(denied.ok, false);
  assert.equal(denied.reasonCode, 'workshop_assignment_subcontractor_scope_required');

  const allowed = await service.prepareAssignmentIntent(validCommand({
    actorRole: 'subcontractor',
    assignmentRelationship: 'assigned_executor',
    subcontractorOrganizationId: 'subcontractor_safe_2381',
  }));

  assert.equal(allowed.ok, true);
  assert.equal(allowed.written, false);
  assert.equal(allowed.assignmentIntent.subcontractorOrganizationId, 'subcontractor_safe_2381');
  assert.equal(allowed.assignmentIntent.repairOrderDraft.subcontractorOrganizationId, 'subcontractor_safe_2381');
  assert.equal(allowed.assignmentIntent.repairOrderAuditIntent.internalOnly, true);
  assertNoUnsafeLeak(allowed);
});
