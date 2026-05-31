'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DEPOT_WORKSHOP_ASSIGNMENT_INTENT_RESPONSE_FIELDS,
  CUSTOMER_PROJECTION_PREVIEW_FIELDS,
  presentDepotWorkshopAssignmentIntentResponse,
} = require('../../src/depotWorkshop/depotWorkshopAssignmentIntentResponsePresenter');

function validResult(overrides = {}) {
  return {
    ok: true,
    prepared: true,
    written: false,
    reasonCode: 'workshop_assignment_intent_prepared',
    requestId: 'req-presenter-2387',
    assignmentIntent: {
      depotIntakeId: 'depot-intake-2387',
      organizationId: 'org-2387',
      tenantId: 'tenant-2387',
      workflowType: 'depot',
      depotStatus: 'diagnosis_pending',
      brandId: 'brand-2387',
      serviceProviderId: 'service-provider-2387',
      itemRef: 'item-2387',
      productRef: 'product-2387',
      issueSummaryRef: 'issue-2387',
      workshopId: 'workshop-2387',
      workshopTeamId: 'team-2387',
      assignedTechnicianId: 'tech-2387',
      subcontractorOrganizationId: 'subcontractor-2387',
      assignmentNote: 'Prepare repair assignment.',
      assignedByActorId: 'actor-2387',
      actorRole: 'admin',
      permission: 'workshop.assign',
      writeRequired: true,
      requestId: 'req-presenter-2387',
      repairOrderDraft: {
        repairOrderId: 'repair-order-2387',
        caseId: 'case-2387',
        depotIntakeId: 'depot-intake-2387',
        workflowType: 'depot',
        depotStatus: 'diagnosis_pending',
        workshopId: 'workshop-2387',
        workshopTeamId: 'team-2387',
        assignedTechnicianId: 'tech-2387',
        subcontractorOrganizationId: 'subcontractor-2387',
        rawDbRow: 'raw db row should not leak',
      },
      repairOrderTransitionPlan: {
        fromStatus: 'diagnosis_pending',
        toStatus: 'repair_in_progress',
        reasonCode: 'depot_workshop_repair_order_transition_planned',
        transitionStatus: 'planned',
        sql: 'select * from secrets',
      },
      repairOrderAuditIntent: {
        eventType: 'depot_workshop_repair_assignment_intent_prepared',
        auditStatus: 'prepared',
        customerVisible: false,
        metadata: {
          rawDbRow: 'raw audit metadata should not leak',
        },
      },
      repairOrderCustomerProjection: {
        repairOrderReference: 'DEPOT-ORDER-2387',
        caseReference: 'CASE-2387',
        depotStatus: 'diagnosis_pending',
        statusLabelKey: 'depot.status.diagnosis_pending',
        lastUpdatedAt: '2026-05-31T10:00:00.000Z',
        customerMessageKey: 'depot.message.diagnosis_pending',
        estimatedReadyAt: '2026-06-01T10:00:00.000Z',
        returnMethod: 'pickup',
        publicNotes: 'Workshop is reviewing your item.',
        providerPayload: 'provider payload should not leak',
      },
      finalAppointmentId: 'final appointment should not leak',
      fieldServiceReport: 'fsr should not leak',
      completionReport: 'completion report should not leak',
      providerPayload: 'provider payload should not leak',
      billingInternals: 'billing should not leak',
      aiOutput: 'ai output should not leak',
      rawRows: ['raw row should not leak'],
      ...overrides.assignmentIntent,
    },
    ...overrides,
  };
}

function assertNoForbiddenLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'final appointment should not leak',
    'fsr should not leak',
    'completion report should not leak',
    'provider payload should not leak',
    'billing should not leak',
    'ai output should not leak',
    'raw row should not leak',
    'raw db row should not leak',
    'raw audit metadata should not leak',
    'select * from secrets',
    'finalAppointmentId',
    'fieldServiceReport',
    'completionReport',
    'providerPayload',
    'billingInternals',
    'aiOutput',
    'rawRows',
    'rawDbRow',
    'sql',
    'metadata',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('valid assignment intent presents allowlisted admin-safe response', () => {
  const result = presentDepotWorkshopAssignmentIntentResponse(validResult());

  assert.deepEqual(Object.keys(result), ['data', 'meta', 'requestId']);
  assert.deepEqual(result.meta, {
    ok: true,
    prepared: true,
    written: false,
    reasonCode: 'workshop_assignment_intent_prepared',
  });
  assert.equal(result.requestId, 'req-presenter-2387');

  const depotRepair = result.data.depotRepair;

  assert.equal(depotRepair.depotIntakeId, 'depot-intake-2387');
  assert.equal(depotRepair.organizationId, 'org-2387');
  assert.equal(depotRepair.workshopId, 'workshop-2387');
  assert.equal(depotRepair.permission, 'workshop.assign');
  assert.equal(depotRepair.writeRequired, false);

  for (const field of Object.keys(depotRepair)) {
    assert.equal(DEPOT_WORKSHOP_ASSIGNMENT_INTENT_RESPONSE_FIELDS.includes(field), true, `${field} should be allowlisted`);
  }
  assertNoForbiddenLeak(result);
});

test('helper-derived sections are summarized and not exposed wholesale', () => {
  const result = presentDepotWorkshopAssignmentIntentResponse(validResult());
  const depotRepair = result.data.depotRepair;

  assert.deepEqual(depotRepair.repairOrderDraftSummary, {
    repairOrderId: 'repair-order-2387',
    caseId: 'case-2387',
    depotIntakeId: 'depot-intake-2387',
    workflowType: 'depot',
    depotStatus: 'diagnosis_pending',
    workshopId: 'workshop-2387',
    workshopTeamId: 'team-2387',
    assignedTechnicianId: 'tech-2387',
    subcontractorOrganizationId: 'subcontractor-2387',
  });
  assert.deepEqual(depotRepair.repairOrderTransitionPlanSummary, {
    fromStatus: 'diagnosis_pending',
    toStatus: 'repair_in_progress',
    reasonCode: 'depot_workshop_repair_order_transition_planned',
    transitionStatus: 'planned',
  });
  assert.deepEqual(depotRepair.repairOrderAuditIntentSummary, {
    eventType: 'depot_workshop_repair_assignment_intent_prepared',
    auditStatus: 'prepared',
    customerVisible: false,
  });
  assert.deepEqual(depotRepair.repairOrderCustomerProjectionPreview, {
    repairOrderReference: 'DEPOT-ORDER-2387',
    caseReference: 'CASE-2387',
    depotStatus: 'diagnosis_pending',
    statusLabelKey: 'depot.status.diagnosis_pending',
    lastUpdatedAt: '2026-05-31T10:00:00.000Z',
    customerMessageKey: 'depot.message.diagnosis_pending',
    estimatedReadyAt: '2026-06-01T10:00:00.000Z',
    returnMethod: 'pickup',
    publicNotes: 'Workshop is reviewing your item.',
  });

  for (const field of Object.keys(depotRepair.repairOrderCustomerProjectionPreview)) {
    assert.equal(CUSTOMER_PROJECTION_PREVIEW_FIELDS.includes(field), true, `${field} should be projection preview allowlisted`);
  }

  assert.equal(Object.prototype.hasOwnProperty.call(depotRepair, 'repairOrderDraft'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(depotRepair, 'repairOrderTransitionPlan'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(depotRepair, 'repairOrderAuditIntent'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(depotRepair, 'repairOrderCustomerProjection'), false);
  assertNoForbiddenLeak(result);
});

test('meta written and writeRequired remain false and invalid transition targets are omitted', () => {
  const result = presentDepotWorkshopAssignmentIntentResponse(validResult({
    assignmentIntent: {
      repairOrderTransitionPlan: {
        fromStatus: 'diagnosis_pending',
        toStatus: 'final appointment should not leak',
        reasonCode: 'provider payload should not leak',
      },
    },
  }));

  assert.equal(result.meta.written, false);
  assert.equal(result.data.depotRepair.writeRequired, false);
  assert.equal(result.data.depotRepair.repairOrderTransitionPlanSummary, undefined);
  assertNoForbiddenLeak(result);
});

test('malformed and failure input return safe failure envelope', () => {
  assert.deepEqual(presentDepotWorkshopAssignmentIntentResponse(null), {
    error: {
      code: 'DEPOT_WORKSHOP_ASSIGNMENT_INTENT_PRESENTATION_FAILED',
      message: 'Depot workshop assignment intent presentation failed.',
      reasonCode: 'depot_workshop_assignment_intent_presenter_result_required',
      requestId: null,
    },
  });

  const failure = presentDepotWorkshopAssignmentIntentResponse({
    ok: false,
    reasonCode: 'workshop_assignment_permission_required',
    requestId: 'req-denied-2387',
    rawError: {
      stack: 'stack should not leak',
    },
  });

  assert.deepEqual(failure, {
    error: {
      code: 'DEPOT_WORKSHOP_ASSIGNMENT_INTENT_PRESENTATION_FAILED',
      message: 'Depot workshop assignment intent presentation failed.',
      reasonCode: 'workshop_assignment_permission_required',
      requestId: 'req-denied-2387',
    },
  });
  assertNoForbiddenLeak(failure);
});

test('forbidden fields are omitted without formal report final appointment or provider exposure', () => {
  const result = presentDepotWorkshopAssignmentIntentResponse(validResult({
    assignmentIntent: {
      assignmentNote: 'field service report should not leak',
      repairOrderAuditIntent: {
        eventType: 'depot_workshop_repair_assignment_intent_prepared',
        auditStatus: 'prepared',
        customerVisible: true,
      },
      repairOrderCustomerProjection: {
        publicNotes: 'phone 0912-345-678 should not leak',
        repairOrderReference: 'DEPOT-ORDER-2387',
      },
    },
  }));

  assert.equal(result.data.depotRepair.assignmentNote, undefined);
  assert.equal(result.data.depotRepair.repairOrderAuditIntentSummary, undefined);
  assert.deepEqual(result.data.depotRepair.repairOrderCustomerProjectionPreview, {
    repairOrderReference: 'DEPOT-ORDER-2387',
  });
  assertNoForbiddenLeak(result);
});

test('input objects are not mutated and output is detached', () => {
  const input = validResult();
  const before = JSON.stringify(input);
  const result = presentDepotWorkshopAssignmentIntentResponse(input);

  result.data.depotRepair.depotIntakeId = 'mutated-output-only';
  result.data.depotRepair.repairOrderDraftSummary.repairOrderId = 'mutated-summary-only';
  result.data.depotRepair.repairOrderCustomerProjectionPreview.publicNotes = 'mutated-preview-only';

  assert.equal(JSON.stringify(input), before);
  assert.equal(input.assignmentIntent.depotIntakeId, 'depot-intake-2387');
  assert.equal(input.assignmentIntent.repairOrderDraft.repairOrderId, 'repair-order-2387');
  assert.equal(input.assignmentIntent.repairOrderCustomerProjection.publicNotes, 'Workshop is reviewing your item.');
});
