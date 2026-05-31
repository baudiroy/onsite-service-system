'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildDepotWorkshopAssignmentIntentWriteCommand,
} = require('../../src/depotWorkshop/depotWorkshopAssignmentIntentWriteCommand');
const {
  DEPOT_WORKSHOP_REPAIR_ORDER_REPOSITORY_CONTRACT_KIND,
  buildDepotWorkshopRepairOrderRepositorySafeFailure,
  normalizeDepotWorkshopRepairOrderRepositoryResult,
  normalizeDepotWorkshopRepairOrderRepositoryWriteCommand,
} = require('../../src/depotWorkshop/depotWorkshopRepairOrderRepositoryContract');

function preparedAssignmentIntent(overrides = {}) {
  return {
    depotIntakeId: 'depot_intake_2398',
    organizationId: 'org_2398',
    tenantId: 'tenant_2398',
    workflowType: 'depot',
    depotStatus: 'diagnosis_pending',
    caseId: 'case_2398',
    repairOrderId: 'repair_order_2398',
    brandId: 'brand_2398',
    serviceProviderId: 'provider_2398',
    workshopId: 'workshop_2398',
    workshopTeamId: 'team_2398',
    assignedTechnicianId: 'tech_2398',
    subcontractorOrganizationId: 'subcontractor_2398',
    assignmentRelationship: 'assigned_executor',
    actorId: 'actor_2398',
    actorRole: 'admin',
    targetDepotStatus: 'diagnosis_completed',
    requestId: 'req_2398',
    repairOrderCustomerProjection: {
      repairOrderReference: 'RO-2398',
      caseReference: 'CASE-2398',
      depotStatus: 'diagnosis_pending',
      statusLabelKey: 'depot.status.diagnosis_pending',
      lastUpdatedAt: '2026-05-31T00:00:00.000Z',
      customerMessageKey: 'depot.message.diagnosis',
      estimatedReadyAt: '2026-06-03T00:00:00.000Z',
      returnMethod: 'pickup',
      publicNotes: 'Diagnosis is queued.',
    },
    ...overrides,
  };
}

function writeEnvelope(overrides = {}) {
  return buildDepotWorkshopAssignmentIntentWriteCommand({
    assignmentIntent: preparedAssignmentIntent(),
    trustedScope: {
      organizationId: 'org_2398',
      tenantId: 'tenant_2398',
      caseId: 'case_2398',
      depotIntakeId: 'depot_intake_2398',
      repairOrderId: 'repair_order_2398',
      actorId: 'actor_2398',
      actorRole: 'admin',
      permissionContext: {
        permission: 'depot_workshop.assignment_intent.write',
      },
    },
    writeAuthorized: true,
    ...overrides,
  });
}

function assertNoForbiddenLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'finalAppointmentId',
    'fieldServiceReport',
    'completionReport',
    'customerPhone',
    'customerAddress',
    'rawDbRow',
    'rawRepositoryError',
    'providerPayload',
    'billingInternals',
    'aiOutput',
    'vectorTrace',
    'DATABASE_URL',
    'sql',
    'stack',
    'token',
    'password',
    'secret',
    '0912',
    'select * from secrets',
    'provider payload should not leak',
    'completion report should not leak',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('valid safe write command normalizes into repository command contract', () => {
  const envelope = writeEnvelope();
  const result = normalizeDepotWorkshopRepairOrderRepositoryWriteCommand(envelope);

  assert.equal(envelope.ok, true);
  assert.equal(result.ok, true);
  assert.equal(result.status, 'ready');
  assert.equal(result.reasonCode, 'depot_workshop_repair_order_repository_write_command_normalized');
  assert.equal(result.repositoryKind, DEPOT_WORKSHOP_REPAIR_ORDER_REPOSITORY_CONTRACT_KIND);
  assert.equal(result.action, 'depot_workshop.assignment_intent.write');
  assert.equal(result.written, false);
  assert.deepEqual(result.command, {
    action: 'depot_workshop.assignment_intent.write',
    organizationId: 'org_2398',
    tenantId: 'tenant_2398',
    caseId: 'case_2398',
    depotIntakeId: 'depot_intake_2398',
    repairOrderId: 'repair_order_2398',
    brandId: 'brand_2398',
    serviceProviderId: 'provider_2398',
    workshopId: 'workshop_2398',
    workshopTeamId: 'team_2398',
    assignedTechnicianId: 'tech_2398',
    subcontractorOrganizationId: 'subcontractor_2398',
    assignmentRelationship: 'assigned_executor',
    actorId: 'actor_2398',
    actorRole: 'admin',
    depotStatus: 'diagnosis_pending',
    targetDepotStatus: 'diagnosis_completed',
    requestId: 'req_2398',
  });
  assert.equal(result.auditIntent.eventType, 'depot_workshop_repair_assignment_intent_prepared');
  assert.equal(result.customerProjectionPreview.repairOrderReference, 'RO-2398');
  assertNoForbiddenLeak(result);
});

test('missing trusted organization case source or action fails closed', () => {
  const envelope = writeEnvelope();

  assert.equal(normalizeDepotWorkshopRepairOrderRepositoryWriteCommand({
    ...envelope,
    command: { ...envelope.command, organizationId: undefined },
  }).reasonCode, 'organization_id_required');

  assert.equal(normalizeDepotWorkshopRepairOrderRepositoryWriteCommand({
    ...envelope,
    command: { ...envelope.command, caseId: undefined },
  }).reasonCode, 'case_id_required');

  assert.equal(normalizeDepotWorkshopRepairOrderRepositoryWriteCommand({
    ...envelope,
    command: {
      ...envelope.command,
      depotIntakeId: undefined,
      repairOrderId: undefined,
    },
  }).reasonCode, 'repair_order_source_reference_required');

  assert.equal(normalizeDepotWorkshopRepairOrderRepositoryWriteCommand({
    ...envelope,
    action: 'depot_workshop.other_action',
    command: {
      ...envelope.command,
      action: 'depot_workshop.other_action',
    },
  }).reasonCode, 'depot_workshop_repair_order_repository_action_required');
});

test('malformed command fails closed', () => {
  assert.equal(
    normalizeDepotWorkshopRepairOrderRepositoryWriteCommand(null).reasonCode,
    'depot_workshop_repair_order_repository_command_plain_object_required',
  );
  assert.equal(
    normalizeDepotWorkshopRepairOrderRepositoryWriteCommand({ ok: false }).reasonCode,
    'depot_workshop_repair_order_repository_command_rejected',
  );
  assert.equal(
    normalizeDepotWorkshopRepairOrderRepositoryWriteCommand({
      ...writeEnvelope(),
      rawDbRow: { id: 'raw row should not leak' },
    }).reasonCode,
    'depot_workshop_repair_order_repository_command_rejected',
  );
});

test('unsafe or cross-scope-looking repository result fails closed', () => {
  assert.equal(normalizeDepotWorkshopRepairOrderRepositoryResult({
    ok: true,
    organizationId: 'org_other',
    caseId: 'case_2398',
    depotIntakeId: 'depot_intake_2398',
    repairOrderReference: 'RO-2398',
    written: true,
    trustedScope: {
      organizationId: 'org_2398',
      caseId: 'case_2398',
    },
  }).reasonCode, 'depot_workshop_repair_order_repository_result_scope_mismatch');

  assert.equal(normalizeDepotWorkshopRepairOrderRepositoryResult({
    ok: true,
    organizationId: 'org_2398',
    caseId: 'case_2398',
    depotIntakeId: 'depot_intake_2398',
    rawRepositoryError: 'select * from secrets',
    written: true,
  }).reasonCode, 'depot_workshop_repair_order_repository_result_rejected');
});

test('safe repository success result is normalized without raw payload leakage', () => {
  const result = normalizeDepotWorkshopRepairOrderRepositoryResult({
    ok: true,
    status: 'written',
    reasonCode: 'depot_workshop_repair_order_repository_write_succeeded',
    repairOrderReference: 'RO-2398',
    organizationId: 'org_2398',
    tenantId: 'tenant_2398',
    caseId: 'case_2398',
    depotIntakeId: 'depot_intake_2398',
    repairOrderId: 'repair_order_2398',
    written: true,
    requestId: 'req_2398',
    trustedScope: {
      organizationId: 'org_2398',
      tenantId: 'tenant_2398',
      caseId: 'case_2398',
      depotIntakeId: 'depot_intake_2398',
    },
  });

  assert.deepEqual(result, {
    ok: true,
    status: 'written',
    reasonCode: 'depot_workshop_repair_order_repository_write_succeeded',
    repositoryKind: DEPOT_WORKSHOP_REPAIR_ORDER_REPOSITORY_CONTRACT_KIND,
    repairOrderReference: 'RO-2398',
    organizationId: 'org_2398',
    tenantId: 'tenant_2398',
    caseId: 'case_2398',
    depotIntakeId: 'depot_intake_2398',
    repairOrderId: 'repair_order_2398',
    written: true,
    requestId: 'req_2398',
  });
  assertNoForbiddenLeak(result);
});

test('forbidden FSR Completion Report and finalAppointment fields are not emitted', () => {
  const result = normalizeDepotWorkshopRepairOrderRepositoryWriteCommand({
    ...writeEnvelope(),
    finalAppointmentId: 'finalAppointmentId should not leak',
    completionReport: 'completion report should not leak',
    fieldServiceReport: 'field service report should not leak',
  });

  assert.equal(result.ok, false);
  assertNoForbiddenLeak(result);
});

test('no DB repository adapter provider result is executed', () => {
  let queryCalled = false;
  const result = normalizeDepotWorkshopRepairOrderRepositoryWriteCommand({
    ...writeEnvelope(),
    dbClient: {
      query() {
        queryCalled = true;
      },
    },
  });

  assert.equal(result.ok, false);
  assert.equal(queryCalled, false);
});

test('input objects are not mutated and output is detached', () => {
  const envelope = writeEnvelope();
  const before = JSON.stringify(envelope);
  const result = normalizeDepotWorkshopRepairOrderRepositoryWriteCommand(envelope);

  assert.equal(result.ok, true);
  result.command.organizationId = 'mutated_projection_only';
  result.auditIntent.eventType = 'mutated_projection_only';

  assert.equal(JSON.stringify(envelope), before);
  assert.equal(envelope.command.organizationId, 'org_2398');
  assert.equal(envelope.auditIntent.eventType, 'depot_workshop_repair_assignment_intent_prepared');
});

test('safe failure builder returns minimal sanitized failure envelope', () => {
  const failure = buildDepotWorkshopRepairOrderRepositorySafeFailure('custom_reason', {
    requestId: 'req_2398',
    rawRepositoryError: 'select * from secrets',
  });

  assert.deepEqual(failure, {
    ok: false,
    status: 'rejected',
    reasonCode: 'custom_reason',
    repositoryKind: DEPOT_WORKSHOP_REPAIR_ORDER_REPOSITORY_CONTRACT_KIND,
    written: false,
    requestId: 'req_2398',
  });
  assertNoForbiddenLeak(failure);
});
