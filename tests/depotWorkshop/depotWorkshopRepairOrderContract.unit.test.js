'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildDepotWorkshopRepairOrderDraft,
  sanitizeDepotWorkshopRepairOrderInternalDraft,
  validateDepotWorkshopRepairOrderDraft,
} = require('../../src/depotWorkshop/depotWorkshopRepairOrderContract');

function trustedInput(overrides = {}) {
  return {
    repairOrderId: 'repair_order_2374',
    caseId: 'case_2374',
    depotIntakeId: 'depot_intake_2374',
    organizationId: 'org_2374',
    tenantId: 'tenant_2374',
    workflowType: 'depot',
    depotStatus: 'diagnosis_pending',
    workshopJobId: 'workshop_job_2374',
    workshopId: 'workshop_2374',
    workshopTeamId: 'team_2374',
    assignedTechnicianId: 'tech_2374',
    subcontractorOrganizationId: 'subcontractor_org_2374',
    assignmentRelationship: 'assigned_executor',
    itemRef: 'item_ref_2374',
    productRef: 'product_ref_2374',
    issueSummaryRef: 'issue_ref_2374',
    diagnosisSummaryRef: 'diagnosis_ref_2374',
    quoteSummaryRef: 'quote_ref_2374',
    estimateSummaryRef: 'estimate_ref_2374',
    partsSummaryRef: 'parts_ref_2374',
    qcSummaryRef: 'qc_ref_2374',
    customerVisibleProjectionRef: 'projection_ref_2374',
    auditEventRef: 'audit_ref_2374',
    requestId: 'req_2374',
    createdByActorId: 'actor_2374',
    updatedByActorId: 'actor_2374',
    finalAppointmentId: 'final appointment should not leak',
    fieldServiceReport: 'fsr should not leak',
    fieldServiceReportId: 'fsr_id_should_not_leak',
    completionReport: 'completion report should not leak',
    completionReportId: 'completion_id_should_not_leak',
    customerVisiblePublication: { publish: true },
    rawCustomerData: 'raw customer should not leak',
    rawDbRow: 'raw db row should not leak',
    rawRows: ['raw row should not leak'],
    customerName: 'customer name should not leak',
    customerPhone: '0912 should not leak',
    customerAddress: 'full address should not leak',
    providerPayload: 'provider payload should not leak',
    billingInternals: 'billing should not leak',
    invoice: 'invoice should not leak',
    settlement: 'settlement should not leak',
    payment: 'payment should not leak',
    aiOutput: 'ai output should not leak',
    aiProviderOutput: 'ai provider should not leak',
    vectorTrace: 'vector should not leak',
    debugTrace: 'debug should not leak',
    token: 'token should not leak',
    password: 'password should not leak',
    secret: 'secret should not leak',
    sql: 'select * from secrets',
    stack: 'stack should not leak',
    ...overrides,
  };
}

function assertNoForbiddenLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'final appointment should not leak',
    'fsr should not leak',
    'fsr_id_should_not_leak',
    'completion report should not leak',
    'completion_id_should_not_leak',
    'customerVisiblePublication',
    'publish',
    'raw customer should not leak',
    'raw db row should not leak',
    'raw row should not leak',
    'customer name should not leak',
    '0912 should not leak',
    'full address should not leak',
    'provider payload should not leak',
    'billing should not leak',
    'invoice should not leak',
    'settlement should not leak',
    'payment should not leak',
    'ai output should not leak',
    'ai provider should not leak',
    'vector should not leak',
    'debug should not leak',
    'token should not leak',
    'password should not leak',
    'secret should not leak',
    'select * from secrets',
    'stack should not leak',
    'finalAppointmentId',
    'fieldServiceReport',
    'completionReport',
    'providerPayload',
    'billingInternals',
    'aiOutput',
    'rawDbRow',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('valid internal repair order draft is built from trusted allowlisted fields', () => {
  const result = buildDepotWorkshopRepairOrderDraft(trustedInput());

  assert.equal(result.ok, true);
  assert.equal(result.valid, true);
  assert.equal(result.built, true);
  assert.equal(result.reasonCode, 'depot_workshop_repair_order_draft_built');
  assert.deepEqual(result.draft, {
    repairOrderId: 'repair_order_2374',
    caseId: 'case_2374',
    depotIntakeId: 'depot_intake_2374',
    organizationId: 'org_2374',
    tenantId: 'tenant_2374',
    workflowType: 'depot',
    depotStatus: 'diagnosis_pending',
    workshopJobId: 'workshop_job_2374',
    workshopId: 'workshop_2374',
    workshopTeamId: 'team_2374',
    assignedTechnicianId: 'tech_2374',
    subcontractorOrganizationId: 'subcontractor_org_2374',
    assignmentRelationship: 'assigned_executor',
    itemRef: 'item_ref_2374',
    productRef: 'product_ref_2374',
    issueSummaryRef: 'issue_ref_2374',
    diagnosisSummaryRef: 'diagnosis_ref_2374',
    quoteSummaryRef: 'quote_ref_2374',
    estimateSummaryRef: 'estimate_ref_2374',
    partsSummaryRef: 'parts_ref_2374',
    qcSummaryRef: 'qc_ref_2374',
    customerVisibleProjectionRef: 'projection_ref_2374',
    auditEventRef: 'audit_ref_2374',
    requestId: 'req_2374',
    createdByActorId: 'actor_2374',
    updatedByActorId: 'actor_2374',
  });
  assertNoForbiddenLeak(result);
});

test('missing organization case or source reference fails closed', () => {
  assert.equal(buildDepotWorkshopRepairOrderDraft(trustedInput({ organizationId: undefined })).reasonCode, 'organization_id_required');
  assert.equal(buildDepotWorkshopRepairOrderDraft(trustedInput({ caseId: undefined })).reasonCode, 'case_id_required');
  assert.equal(buildDepotWorkshopRepairOrderDraft(trustedInput({
    repairOrderId: undefined,
    depotIntakeId: undefined,
  })).reasonCode, 'repair_order_source_reference_required');
  assert.equal(buildDepotWorkshopRepairOrderDraft(null).reasonCode, 'depot_workshop_repair_order_plain_object_required');
});

test('invalid status fails closed and missing status defaults to safe initial status', () => {
  assert.equal(buildDepotWorkshopRepairOrderDraft(trustedInput({
    depotStatus: 'repair_waiting_parts',
  })).reasonCode, 'depot_workshop_repair_order_status_invalid');

  const result = buildDepotWorkshopRepairOrderDraft(trustedInput({
    depotStatus: undefined,
  }));

  assert.equal(result.ok, true);
  assert.equal(result.draft.depotStatus, 'intake_received');
});

test('optional tenant assignment and ownership references are carried only when safe', () => {
  const draft = sanitizeDepotWorkshopRepairOrderInternalDraft(trustedInput({
    tenantId: 'tenant_safe',
    workshopId: 'workshop_safe',
    workshopTeamId: 'team_safe',
    assignedTechnicianId: 'tech_safe',
    subcontractorOrganizationId: 'subcontractor_safe',
    assignmentRelationship: 'assigned_executor',
    auditEventRef: 'sql should not leak',
    customerVisibleProjectionRef: 'projection_safe',
  }));

  assert.equal(draft.tenantId, 'tenant_safe');
  assert.equal(draft.workshopId, 'workshop_safe');
  assert.equal(draft.workshopTeamId, 'team_safe');
  assert.equal(draft.assignedTechnicianId, 'tech_safe');
  assert.equal(draft.subcontractorOrganizationId, 'subcontractor_safe');
  assert.equal(draft.assignmentRelationship, 'assigned_executor');
  assert.equal(draft.customerVisibleProjectionRef, 'projection_safe');
  assert.equal(draft.auditEventRef, undefined);
});

test('forbidden formal report finalAppointment raw provider billing AI and debug fields are omitted', () => {
  const draft = sanitizeDepotWorkshopRepairOrderInternalDraft(trustedInput());

  assertNoForbiddenLeak(draft);
  assert.equal(Object.prototype.hasOwnProperty.call(draft, 'finalAppointmentId'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(draft, 'fieldServiceReport'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(draft, 'completionReport'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(draft, 'providerPayload'), false);
});

test('validate returns detached draft and input objects are not mutated', () => {
  const input = trustedInput();
  const before = JSON.stringify(input);
  const result = validateDepotWorkshopRepairOrderDraft(input);

  assert.equal(result.ok, true);
  assert.equal(result.valid, true);
  assert.equal(result.built, false);
  assert.equal(result.reasonCode, 'depot_workshop_repair_order_draft_valid');

  result.draft.depotStatus = 'closed';
  result.draft.organizationId = 'mutated_projection_only';

  assert.equal(JSON.stringify(input), before);
  assert.equal(input.depotStatus, 'diagnosis_pending');
  assert.equal(input.organizationId, 'org_2374');
});
