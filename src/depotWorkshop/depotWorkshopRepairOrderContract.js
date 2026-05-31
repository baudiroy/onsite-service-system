'use strict';

const {
  isDepotWorkshopRepairOrderStatus,
} = require('./depotWorkshopRepairOrderStateModel');

const INITIAL_DEPOT_WORKSHOP_REPAIR_ORDER_STATUS = 'intake_received';

const INTERNAL_DRAFT_FIELD_SOURCES = Object.freeze({
  repairOrderId: Object.freeze(['repairOrderId', 'repair_order_id']),
  caseId: Object.freeze(['caseId', 'case_id']),
  depotIntakeId: Object.freeze(['depotIntakeId', 'depot_intake_id', 'draftId', 'draft_id']),
  organizationId: Object.freeze(['organizationId', 'organization_id']),
  tenantId: Object.freeze(['tenantId', 'tenant_id']),
  workflowType: Object.freeze(['workflowType', 'workflow_type', 'serviceType', 'service_type']),
  depotStatus: Object.freeze(['depotStatus', 'depot_status', 'status']),
  workshopJobId: Object.freeze(['workshopJobId', 'workshop_job_id']),
  workshopId: Object.freeze(['workshopId', 'workshop_id']),
  workshopTeamId: Object.freeze(['workshopTeamId', 'workshop_team_id']),
  assignedTechnicianId: Object.freeze(['assignedTechnicianId', 'assigned_technician_id']),
  subcontractorOrganizationId: Object.freeze(['subcontractorOrganizationId', 'subcontractor_organization_id']),
  assignmentRelationship: Object.freeze(['assignmentRelationship', 'assignment_relationship']),
  itemRef: Object.freeze(['itemRef', 'item_ref']),
  productRef: Object.freeze(['productRef', 'product_ref']),
  issueSummaryRef: Object.freeze(['issueSummaryRef', 'issue_summary_ref']),
  diagnosisSummaryRef: Object.freeze(['diagnosisSummaryRef', 'diagnosis_summary_ref']),
  quoteSummaryRef: Object.freeze(['quoteSummaryRef', 'quote_summary_ref']),
  estimateSummaryRef: Object.freeze(['estimateSummaryRef', 'estimate_summary_ref']),
  partsSummaryRef: Object.freeze(['partsSummaryRef', 'parts_summary_ref']),
  qcSummaryRef: Object.freeze(['qcSummaryRef', 'qc_summary_ref']),
  customerVisibleProjectionRef: Object.freeze(['customerVisibleProjectionRef', 'customer_visible_projection_ref']),
  auditEventRef: Object.freeze(['auditEventRef', 'audit_event_ref']),
  requestId: Object.freeze(['requestId', 'request_id']),
  createdByActorId: Object.freeze(['createdByActorId', 'created_by_actor_id', 'actorId', 'actor_id']),
  updatedByActorId: Object.freeze(['updatedByActorId', 'updated_by_actor_id', 'actorId', 'actor_id']),
});

const UNSAFE_INTERNAL_TEXT_PATTERNS = Object.freeze([
  /database[_\s-]*url/i,
  /jwt[_\s-]*secret/i,
  /provider\s*payload/i,
  /\braw(?:\s|_|-)*(?:db|row|rows|customer|phone|address|payload|error|input)?\b/i,
  /\b(?:sql|stack|token|secret|password)\b/i,
  /\b(?:billing|invoice|charge|settlement|payment)\b/i,
  /\b(?:openai|ai\s*output|rag|vector)\b/i,
  /\b(?:final\s*appointment|field\s*service\s*report|completion\s*report|fsr)\b/i,
  /\b(?:phone|tel|address|signature|photo)\b/i,
]);

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function stringValue(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (!trimmed || UNSAFE_INTERNAL_TEXT_PATTERNS.some((pattern) => pattern.test(trimmed))) {
      return undefined;
    }

    return trimmed;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return undefined;
}

function firstFieldValue(input, fieldNames) {
  for (const fieldName of fieldNames) {
    if (!Object.prototype.hasOwnProperty.call(input, fieldName)) {
      continue;
    }

    const value = stringValue(input[fieldName]);

    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
}

function compactRecord(record) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  );
}

function sanitizeDepotWorkshopRepairOrderInternalDraft(input = {}) {
  if (!isPlainObject(input)) {
    return {};
  }

  const draft = {};

  for (const [fieldName, sourceFields] of Object.entries(INTERNAL_DRAFT_FIELD_SOURCES)) {
    const value = firstFieldValue(input, sourceFields);

    if (value !== undefined) {
      draft[fieldName] = value;
    }
  }

  if (!draft.depotStatus) {
    draft.depotStatus = INITIAL_DEPOT_WORKSHOP_REPAIR_ORDER_STATUS;
  }

  return compactRecord(draft);
}

function failure(reasonCode, draft = {}) {
  return compactRecord({
    ok: false,
    valid: false,
    built: false,
    reasonCode,
    requestId: draft.requestId,
  });
}

function validateDepotWorkshopRepairOrderDraft(input = {}) {
  const draft = sanitizeDepotWorkshopRepairOrderInternalDraft(input);

  if (!isPlainObject(input)) {
    return failure('depot_workshop_repair_order_plain_object_required');
  }

  if (!draft.organizationId) {
    return failure('organization_id_required', draft);
  }

  if (!draft.caseId) {
    return failure('case_id_required', draft);
  }

  if (!draft.depotIntakeId && !draft.repairOrderId) {
    return failure('repair_order_source_reference_required', draft);
  }

  if (!draft.depotStatus || !isDepotWorkshopRepairOrderStatus(draft.depotStatus)) {
    return failure('depot_workshop_repair_order_status_invalid', draft);
  }

  return {
    ok: true,
    valid: true,
    built: false,
    reasonCode: 'depot_workshop_repair_order_draft_valid',
    requestId: draft.requestId,
    draft,
  };
}

function buildDepotWorkshopRepairOrderDraft(input = {}) {
  const validation = validateDepotWorkshopRepairOrderDraft(input);

  if (!validation.ok) {
    return validation;
  }

  return {
    ok: true,
    valid: true,
    built: true,
    reasonCode: 'depot_workshop_repair_order_draft_built',
    requestId: validation.requestId,
    draft: { ...validation.draft },
  };
}

module.exports = {
  buildDepotWorkshopRepairOrderDraft,
  sanitizeDepotWorkshopRepairOrderInternalDraft,
  validateDepotWorkshopRepairOrderDraft,
};
