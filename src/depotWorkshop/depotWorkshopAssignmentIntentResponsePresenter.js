'use strict';

const DEPOT_WORKSHOP_ASSIGNMENT_INTENT_RESPONSE_FIELDS = Object.freeze([
  'depotIntakeId',
  'organizationId',
  'tenantId',
  'workflowType',
  'depotStatus',
  'brandId',
  'serviceProviderId',
  'itemRef',
  'productRef',
  'issueSummaryRef',
  'workshopId',
  'workshopTeamId',
  'assignedTechnicianId',
  'subcontractorOrganizationId',
  'assignmentNote',
  'assignedByActorId',
  'actorRole',
  'permission',
  'writeRequired',
  'requestId',
  'repairOrderDraftSummary',
  'repairOrderTransitionPlanSummary',
  'repairOrderAuditIntentSummary',
  'repairOrderCustomerProjectionPreview',
]);

const BASE_FIELD_SOURCES = Object.freeze({
  depotIntakeId: Object.freeze(['depotIntakeId', 'depot_intake_id', 'draftId', 'draft_id']),
  organizationId: Object.freeze(['organizationId', 'organization_id']),
  tenantId: Object.freeze(['tenantId', 'tenant_id']),
  workflowType: Object.freeze(['workflowType', 'workflow_type']),
  depotStatus: Object.freeze(['depotStatus', 'depot_status', 'status']),
  brandId: Object.freeze(['brandId', 'brand_id']),
  serviceProviderId: Object.freeze(['serviceProviderId', 'service_provider_id', 'providerId']),
  itemRef: Object.freeze(['itemRef', 'item_ref']),
  productRef: Object.freeze(['productRef', 'product_ref']),
  issueSummaryRef: Object.freeze(['issueSummaryRef', 'issue_summary_ref']),
  workshopId: Object.freeze(['workshopId', 'workshop_id']),
  workshopTeamId: Object.freeze(['workshopTeamId', 'workshop_team_id']),
  assignedTechnicianId: Object.freeze(['assignedTechnicianId', 'assigned_technician_id']),
  subcontractorOrganizationId: Object.freeze(['subcontractorOrganizationId', 'subcontractor_organization_id']),
  assignmentNote: Object.freeze(['assignmentNote', 'assignment_note']),
  assignedByActorId: Object.freeze(['assignedByActorId', 'assigned_by_actor_id', 'actorId']),
  actorRole: Object.freeze(['actorRole', 'actor_role']),
  permission: Object.freeze(['permission']),
  requestId: Object.freeze(['requestId', 'request_id']),
});

const DRAFT_SUMMARY_SOURCES = Object.freeze({
  repairOrderId: Object.freeze(['repairOrderId', 'repair_order_id']),
  caseId: Object.freeze(['caseId', 'case_id']),
  depotIntakeId: Object.freeze(['depotIntakeId', 'depot_intake_id', 'draftId', 'draft_id']),
  workflowType: Object.freeze(['workflowType', 'workflow_type']),
  depotStatus: Object.freeze(['depotStatus', 'depot_status', 'status']),
  workshopId: Object.freeze(['workshopId', 'workshop_id']),
  workshopTeamId: Object.freeze(['workshopTeamId', 'workshop_team_id']),
  assignedTechnicianId: Object.freeze(['assignedTechnicianId', 'assigned_technician_id']),
  subcontractorOrganizationId: Object.freeze(['subcontractorOrganizationId', 'subcontractor_organization_id']),
});

const TRANSITION_SUMMARY_SOURCES = Object.freeze({
  fromStatus: Object.freeze(['fromStatus', 'from_status']),
  toStatus: Object.freeze(['toStatus', 'to_status', 'targetStatus', 'target_status']),
  reasonCode: Object.freeze(['reasonCode', 'reason_code', 'transitionReasonCode']),
  transitionStatus: Object.freeze(['transitionStatus', 'transition_status', 'status']),
});

const AUDIT_SUMMARY_SOURCES = Object.freeze({
  eventType: Object.freeze(['eventType', 'event_type']),
  auditStatus: Object.freeze(['auditStatus', 'audit_status']),
});

const CUSTOMER_PROJECTION_PREVIEW_FIELDS = Object.freeze([
  'repairOrderReference',
  'caseReference',
  'depotStatus',
  'statusLabelKey',
  'lastUpdatedAt',
  'customerMessageKey',
  'estimatedReadyAt',
  'returnMethod',
  'publicNotes',
]);

const CUSTOMER_PROJECTION_PREVIEW_SOURCES = Object.freeze({
  repairOrderReference: Object.freeze(['repairOrderReference', 'repair_order_reference', 'customerRepairReference']),
  caseReference: Object.freeze(['caseReference', 'case_reference', 'customerCaseReference']),
  depotStatus: Object.freeze(['depotStatus', 'depot_status', 'displayStatus']),
  statusLabelKey: Object.freeze(['statusLabelKey', 'status_label_key']),
  lastUpdatedAt: Object.freeze(['lastUpdatedAt', 'last_updated_at', 'customerFacingUpdatedAt']),
  customerMessageKey: Object.freeze(['customerMessageKey', 'customer_message_key']),
  estimatedReadyAt: Object.freeze(['estimatedReadyAt', 'estimated_ready_at', 'customerEstimatedReadyAt']),
  returnMethod: Object.freeze(['returnMethod', 'return_method']),
  publicNotes: Object.freeze(['publicNotes', 'public_notes', 'customerPublicNotes']),
});

const UNSAFE_TEXT_PATTERNS = Object.freeze([
  /database[_\s-]*url/i,
  /jwt[_\s-]*secret/i,
  /provider\s*payload/i,
  /\braw(?:\s|_|-)*(?:db|row|rows|customer|phone|address|payload|error|input|case|appointment|report)?\b/i,
  /\b(?:sql|stack|token|secret|password)\b/i,
  /\b(?:billing|invoice|charge|settlement|payment)\b/i,
  /\b(?:openai|ai\s*output|rag|vector)\b/i,
  /\b(?:audit|internal|technician|subcontractor|assignment)\s+(?:payload|private|secret|raw)\b/i,
  /\b(?:final\s*appointment|field\s*service\s*report|completion\s*report|fsr)\b/i,
  /\b(?:phone|tel|address|signature|photo)\b/i,
  /\d{4}[-\s]?\d{3}[-\s]?\d{3}/,
]);

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function compactRecord(record) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  );
}

function safeScalar(value) {
  if (value === undefined || value === '') {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (!trimmed || UNSAFE_TEXT_PATTERNS.some((pattern) => pattern.test(trimmed))) {
      return undefined;
    }

    return trimmed;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  return undefined;
}

function firstSafeValue(source, fieldNames) {
  if (!isPlainObject(source)) {
    return undefined;
  }

  for (const fieldName of fieldNames) {
    if (!Object.prototype.hasOwnProperty.call(source, fieldName)) {
      continue;
    }

    const value = safeScalar(source[fieldName]);

    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
}

function pickSafeFields(source, fieldSources) {
  if (!isPlainObject(source)) {
    return undefined;
  }

  const record = {};

  for (const [fieldName, sourceFields] of Object.entries(fieldSources)) {
    const value = firstSafeValue(source, sourceFields);

    if (value !== undefined) {
      record[fieldName] = value;
    }
  }

  return Object.keys(record).length > 0 ? record : undefined;
}

function sourceIntentFrom(result = {}) {
  if (!isPlainObject(result)) {
    return undefined;
  }

  if (isPlainObject(result.assignmentIntent)) {
    return result.assignmentIntent;
  }

  if (isPlainObject(result.depotRepair)) {
    return result.depotRepair;
  }

  if (isPlainObject(result.intent)) {
    return result.intent;
  }

  if (isPlainObject(result.data) && isPlainObject(result.data.depotRepair)) {
    return result.data.depotRepair;
  }

  return undefined;
}

function requestIdFrom(result = {}, requestContext = {}, intent = {}) {
  return firstSafeValue(result, ['requestId', 'request_id'])
    || firstSafeValue(requestContext, ['requestId', 'request_id'])
    || firstSafeValue(intent, ['requestId', 'request_id'])
    || null;
}

function reasonCodeFrom(result = {}, fallback) {
  return firstSafeValue(result, ['reasonCode', 'reason_code']) || fallback;
}

function failureEnvelope(reasonCode, requestId = null) {
  return {
    error: {
      code: 'DEPOT_WORKSHOP_ASSIGNMENT_INTENT_PRESENTATION_FAILED',
      message: 'Depot workshop assignment intent presentation failed.',
      reasonCode,
      requestId,
    },
  };
}

function buildDraftSummary(intent = {}) {
  const summary = pickSafeFields(intent.repairOrderDraft, DRAFT_SUMMARY_SOURCES);

  return summary;
}

function buildTransitionPlanSummary(intent = {}) {
  const summary = pickSafeFields(intent.repairOrderTransitionPlan, TRANSITION_SUMMARY_SOURCES);

  if (!summary || !summary.toStatus) {
    return undefined;
  }

  return summary;
}

function buildAuditIntentSummary(intent = {}) {
  const auditIntent = isPlainObject(intent.repairOrderAuditIntent) ? intent.repairOrderAuditIntent : undefined;

  if (!auditIntent) {
    return undefined;
  }

  if (auditIntent.customerVisible !== false) {
    return undefined;
  }

  const summary = pickSafeFields(auditIntent, AUDIT_SUMMARY_SOURCES) || {};

  return compactRecord({
    ...summary,
    customerVisible: false,
  });
}

function buildCustomerProjectionPreview(intent = {}) {
  const source = isPlainObject(intent.repairOrderCustomerProjection)
    ? intent.repairOrderCustomerProjection
    : undefined;

  if (!source) {
    return undefined;
  }

  const preview = {};

  for (const fieldName of CUSTOMER_PROJECTION_PREVIEW_FIELDS) {
    const value = firstSafeValue(source, CUSTOMER_PROJECTION_PREVIEW_SOURCES[fieldName] || [fieldName]);

    if (value !== undefined) {
      preview[fieldName] = value;
    }
  }

  return Object.keys(preview).length > 0 ? preview : undefined;
}

function buildDepotRepairPayload(intent = {}) {
  const payload = pickSafeFields(intent, BASE_FIELD_SOURCES) || {};

  return compactRecord({
    ...payload,
    writeRequired: false,
    repairOrderDraftSummary: buildDraftSummary(intent),
    repairOrderTransitionPlanSummary: buildTransitionPlanSummary(intent),
    repairOrderAuditIntentSummary: buildAuditIntentSummary(intent),
    repairOrderCustomerProjectionPreview: buildCustomerProjectionPreview(intent),
  });
}

function presentDepotWorkshopAssignmentIntentResponse(result, requestContext = {}) {
  if (!isPlainObject(result)) {
    return failureEnvelope('depot_workshop_assignment_intent_presenter_result_required', null);
  }

  const intent = sourceIntentFrom(result);
  const requestId = requestIdFrom(result, requestContext, intent);

  if (result.ok !== true || !intent) {
    return failureEnvelope(
      reasonCodeFrom(result, 'depot_workshop_assignment_intent_presenter_result_denied'),
      requestId,
    );
  }

  return {
    data: {
      depotRepair: buildDepotRepairPayload(intent),
    },
    meta: {
      ok: true,
      prepared: result.prepared === true || result.ok === true,
      written: false,
      reasonCode: reasonCodeFrom(result, 'depot_repair_route_prepared'),
    },
    requestId,
  };
}

module.exports = {
  DEPOT_WORKSHOP_ASSIGNMENT_INTENT_RESPONSE_FIELDS,
  CUSTOMER_PROJECTION_PREVIEW_FIELDS,
  presentDepotWorkshopAssignmentIntentResponse,
};
