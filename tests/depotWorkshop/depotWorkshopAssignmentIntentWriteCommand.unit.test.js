'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DEPOT_WORKSHOP_ASSIGNMENT_INTENT_WRITE_ACTION,
  buildDepotWorkshopAssignmentIntentWriteCommand,
} = require('../../src/depotWorkshop/depotWorkshopAssignmentIntentWriteCommand');

function validInput(overrides = {}) {
  return {
    writeAuthorized: true,
    assignmentIntent: {
      organizationId: 'org-1',
      tenantId: 'tenant-1',
      caseId: 'case-1',
      depotIntakeId: 'depot-1',
      repairOrderId: 'repair-1',
      depotStatus: 'intake_received',
      targetDepotStatus: 'diagnosis_pending',
      workshopId: 'workshop-1',
      workshopTeamId: 'team-1',
      assignedTechnicianId: 'tech-1',
      actorId: 'actor-1',
      actorRole: 'admin',
      requestId: 'req-1',
      repairOrderCustomerProjection: {
        repairOrderReference: 'RO-1',
        caseReference: 'CASE-1',
        depotStatus: 'intake_received',
        statusLabelKey: 'depot.status.intake_received',
        publicNotes: 'Safe customer note',
      },
    },
    permissionContext: {
      permissions: [DEPOT_WORKSHOP_ASSIGNMENT_INTENT_WRITE_ACTION],
    },
    ...overrides,
  };
}

test('valid prepared assignment intent builds safe command envelope with exact action', () => {
  const result = buildDepotWorkshopAssignmentIntentWriteCommand(validInput());

  assert.equal(result.ok, true);
  assert.equal(result.status, 'ready');
  assert.equal(result.action, DEPOT_WORKSHOP_ASSIGNMENT_INTENT_WRITE_ACTION);
  assert.equal(result.command.action, DEPOT_WORKSHOP_ASSIGNMENT_INTENT_WRITE_ACTION);
  assert.equal(result.command.organizationId, 'org-1');
  assert.equal(result.command.caseId, 'case-1');
  assert.equal(result.command.depotIntakeId, 'depot-1');
  assert.equal(result.command.repairOrderId, 'repair-1');
  assert.equal(result.command.transitionPlan.toStatus, 'diagnosis_pending');
  assert.equal(result.auditIntent.internalOnly, true);
  assert.equal(result.auditIntent.customerVisible, false);
  assert.equal(result.customerProjectionPreview.repairOrderReference, 'RO-1');
});

test('missing trusted scope fails closed', () => {
  const result = buildDepotWorkshopAssignmentIntentWriteCommand(validInput({
    assignmentIntent: {
      caseId: 'case-1',
      depotIntakeId: 'depot-1',
      depotStatus: 'intake_received',
      actorId: 'actor-1',
    },
  }));

  assert.equal(result.ok, false);
  assert.equal(result.status, 'rejected');
  assert.equal(result.reasonCode, 'organization_id_required');
});

test('invalid transition fails closed', () => {
  const result = buildDepotWorkshopAssignmentIntentWriteCommand(validInput({
    assignmentIntent: {
      ...validInput().assignmentIntent,
      targetDepotStatus: 'closed',
    },
  }));

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'depot_workshop_repair_order_transition_not_allowed');
});

test('missing write permission or authorization marker fails closed', () => {
  const result = buildDepotWorkshopAssignmentIntentWriteCommand(validInput({
    writeAuthorized: false,
    permissionContext: { permissions: [] },
  }));

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'depot_workshop_assignment_intent_write_authorization_required');
});

test('subcontractor mismatch fails closed', () => {
  const result = buildDepotWorkshopAssignmentIntentWriteCommand(validInput({
    assignmentIntent: {
      ...validInput().assignmentIntent,
      actorRole: 'subcontractor',
      subcontractorOrganizationId: 'subcontractor-a',
      assignmentRelationship: 'assigned',
    },
    trustedScope: {
      trustedSubcontractorOrganizationId: 'subcontractor-b',
    },
  }));

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'depot_workshop_assignment_intent_write_subcontractor_scope_mismatch');
});

test('malformed prepared intent fails closed', () => {
  const result = buildDepotWorkshopAssignmentIntentWriteCommand({
    writeAuthorized: true,
    assignmentIntent: 'not-an-object',
  });

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'depot_workshop_assignment_intent_write_command_prepared_intent_required');
});

test('audit intent is internal only and sanitized', () => {
  const result = buildDepotWorkshopAssignmentIntentWriteCommand(validInput());

  assert.equal(result.ok, true);
  assert.equal(result.auditIntent.internalOnly, true);
  assert.equal(result.auditIntent.customerVisible, false);
  assert.equal(result.auditIntent.metadata.organizationId, 'org-1');
  assert.equal(Object.prototype.hasOwnProperty.call(result.auditIntent, 'providerPayload'), false);
});

test('customerProjectionPreview is safe allowlisted preview only', () => {
  const result = buildDepotWorkshopAssignmentIntentWriteCommand(validInput({
    assignmentIntent: {
      ...validInput().assignmentIntent,
      repairOrderCustomerProjection: {
        repairOrderReference: 'RO-safe',
        caseReference: 'CASE-safe',
        publicNotes: 'Call raw phone 0912-345-678',
        workshopInternalNote: 'not customer visible',
      },
    },
  }));

  assert.equal(result.ok, true);
  assert.equal(result.customerProjectionPreview.repairOrderReference, 'RO-safe');
  assert.equal(Object.prototype.hasOwnProperty.call(result.customerProjectionPreview, 'publicNotes'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.customerProjectionPreview, 'workshopInternalNote'), false);
});

test('forbidden fields fail closed without DB repository provider or report result', () => {
  const result = buildDepotWorkshopAssignmentIntentWriteCommand(validInput({
    assignmentIntent: {
      ...validInput().assignmentIntent,
      finalAppointmentId: 'appointment-1',
    },
  }));

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'depot_workshop_assignment_intent_write_command_forbidden_fields');
  assert.equal(Object.prototype.hasOwnProperty.call(result, 'command'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result, 'providerPayload'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result, 'repositoryResult'), false);
});

test('no formal FSR Completion Report finalAppointment mutation appears in success output', () => {
  const serialized = JSON.stringify(buildDepotWorkshopAssignmentIntentWriteCommand(validInput())).toLowerCase();

  assert.equal(serialized.includes('fieldservicereport'), false);
  assert.equal(serialized.includes('completionreport'), false);
  assert.equal(serialized.includes('finalappointmentid'), false);
  assert.equal(serialized.includes('insert into'), false);
  assert.equal(serialized.includes('providerpayload'), false);
});

test('input objects are not mutated and output is detached', () => {
  const input = validInput();
  const before = JSON.stringify(input);
  const result = buildDepotWorkshopAssignmentIntentWriteCommand(input);

  assert.equal(JSON.stringify(input), before);

  result.command.organizationId = 'changed';
  result.auditIntent.metadata.organizationId = 'changed';
  result.customerProjectionPreview.repairOrderReference = 'changed';

  const second = buildDepotWorkshopAssignmentIntentWriteCommand(input);

  assert.equal(second.command.organizationId, 'org-1');
  assert.equal(second.auditIntent.metadata.organizationId, 'org-1');
  assert.equal(second.customerProjectionPreview.repairOrderReference, 'RO-1');
});
