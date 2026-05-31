'use strict';

const DEPOT_WORKSHOP_REPAIR_ORDER_AUDIT_EVENT_TYPES = Object.freeze([
  'depot_workshop_repair_order_created',
  'depot_workshop_repair_status_transition_planned',
  'depot_workshop_repair_assignment_intent_prepared',
  'depot_workshop_repair_customer_projection_prepared',
  'depot_workshop_repair_audit_sanitized',
]);

const AUDIT_METADATA_FIELD_SOURCES = Object.freeze({
  eventType: Object.freeze(['eventType', 'event_type', 'actionType', 'action']),
  organizationId: Object.freeze(['organizationId', 'organization_id']),
  caseId: Object.freeze(['caseId', 'case_id']),
  repairOrderId: Object.freeze(['repairOrderId', 'repair_order_id']),
  depotIntakeId: Object.freeze(['depotIntakeId', 'depot_intake_id', 'draftId', 'draft_id']),
  tenantId: Object.freeze(['tenantId', 'tenant_id']),
  actorId: Object.freeze(['actorId', 'actor_id']),
  actorRole: Object.freeze(['actorRole', 'actor_role', 'role']),
  requestId: Object.freeze(['requestId', 'request_id']),
  correlationId: Object.freeze(['correlationId', 'correlation_id']),
  fromStatus: Object.freeze(['fromStatus', 'from_status', 'currentStatus', 'current_status']),
  toStatus: Object.freeze(['toStatus', 'to_status', 'targetStatus', 'target_status', 'nextStatus', 'next_status']),
  depotStatus: Object.freeze(['depotStatus', 'depot_status', 'status']),
  transitionReasonCode: Object.freeze(['transitionReasonCode', 'transition_reason_code', 'reasonCode', 'reason_code']),
  assignmentStatus: Object.freeze(['assignmentStatus', 'assignment_status', 'assignmentIntentStatus']),
  projectionStatus: Object.freeze(['projectionStatus', 'projection_status']),
  auditStatus: Object.freeze(['auditStatus', 'audit_status']),
  dataProfile: Object.freeze(['dataProfile', 'data_profile']),
  occurredAt: Object.freeze(['occurredAt', 'occurred_at']),
});

const FORBIDDEN_AUDIT_EVENT_INPUT_KEYS = new Set([
  'finalAppointmentId',
  'final_appointment_id',
  'completionReportId',
  'completion_report_id',
  'completionReport',
  'completion_report',
  'fieldServiceReportId',
  'field_service_report_id',
  'fieldServiceReport',
  'field_service_report',
  'customerVisibleReportBody',
  'customer_visible_report_body',
  'customerVisiblePublication',
  'customer_visible_publication',
  'rawCustomerData',
  'raw_customer_data',
  'rawDbRow',
  'raw_db_row',
  'rawRows',
  'raw_rows',
  'customerName',
  'customer_name',
  'customerPhone',
  'customer_phone',
  'customerAddress',
  'customer_address',
  'rawPhone',
  'rawAddress',
  'address',
  'providerPayload',
  'provider_payload',
  'billing',
  'billingEvent',
  'billing_event',
  'billingInternals',
  'billing_internals',
  'invoice',
  'settlement',
  'payment',
  'aiOutput',
  'ai_output',
  'aiProviderOutput',
  'ai_provider_output',
  'openAiTrace',
  'openai_trace',
  'vectorTrace',
  'vector_trace',
  'debugTrace',
  'debug_trace',
  'DATABASE_URL',
  'JWT_SECRET',
  'token',
  'password',
  'secret',
  'sql',
  'stack',
]);

const UNSAFE_AUDIT_TEXT_PATTERNS = Object.freeze([
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

    if (!trimmed || UNSAFE_AUDIT_TEXT_PATTERNS.some((pattern) => pattern.test(trimmed))) {
      return undefined;
    }

    return trimmed;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return undefined;
}

function firstString(input, fieldNames) {
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

function fieldIsForbidden(fieldName) {
  return FORBIDDEN_AUDIT_EVENT_INPUT_KEYS.has(fieldName)
    || String(fieldName).replace(/[^a-zA-Z0-9]/g, '').toLowerCase().startsWith('raw');
}

function hasForbiddenInput(value) {
  if (Array.isArray(value)) {
    return value.some((item) => hasForbiddenInput(item));
  }

  if (!isPlainObject(value)) {
    return false;
  }

  return Object.entries(value).some(([fieldName, fieldValue]) => (
    fieldIsForbidden(fieldName) || hasForbiddenInput(fieldValue)
  ));
}

function metadataSourceFrom(input = {}) {
  const metadata = isPlainObject(input.metadata) ? input.metadata : {};

  return {
    ...metadata,
    ...input,
  };
}

function eventTypeFrom(input = {}) {
  return firstString(metadataSourceFrom(input), AUDIT_METADATA_FIELD_SOURCES.eventType);
}

function sourceReferenceFrom(input = {}) {
  const source = metadataSourceFrom(input);

  return firstString(source, AUDIT_METADATA_FIELD_SOURCES.repairOrderId)
    || firstString(source, AUDIT_METADATA_FIELD_SOURCES.depotIntakeId);
}

function sanitizeDepotWorkshopRepairOrderAuditMetadata(input = {}) {
  if (!isPlainObject(input)) {
    return {};
  }

  const source = metadataSourceFrom(input);
  const metadata = {};

  for (const [fieldName, sourceFields] of Object.entries(AUDIT_METADATA_FIELD_SOURCES)) {
    const value = firstString(source, sourceFields);

    if (value !== undefined) {
      metadata[fieldName] = value;
    }
  }

  return compactRecord(metadata);
}

function failure(reasonCode, context = {}) {
  return compactRecord({
    ok: false,
    built: false,
    reasonCode,
    requestId: firstString(metadataSourceFrom(context), AUDIT_METADATA_FIELD_SOURCES.requestId),
  });
}

function buildDepotWorkshopRepairOrderAuditEvent(input = {}) {
  if (!isPlainObject(input)) {
    return failure('depot_workshop_repair_order_audit_plain_object_required');
  }

  if (hasForbiddenInput(input)) {
    return failure('depot_workshop_repair_order_audit_forbidden_fields', input);
  }

  const metadata = sanitizeDepotWorkshopRepairOrderAuditMetadata(input);
  const eventType = eventTypeFrom(input);
  const sourceReference = sourceReferenceFrom(input);

  if (!eventType || !DEPOT_WORKSHOP_REPAIR_ORDER_AUDIT_EVENT_TYPES.includes(eventType)) {
    return failure('depot_workshop_repair_order_audit_event_type_invalid', metadata);
  }

  if (!metadata.organizationId) {
    return failure('organization_id_required', metadata);
  }

  if (!metadata.caseId) {
    return failure('case_id_required', metadata);
  }

  if (!sourceReference) {
    return failure('repair_order_source_reference_required', metadata);
  }

  const auditEvent = compactRecord({
    eventKind: 'depot_workshop.repair_order_audit_event',
    eventType,
    entityType: 'depot_workshop_repair_order',
    entityId: sourceReference,
    organizationId: metadata.organizationId,
    caseId: metadata.caseId,
    repairOrderId: metadata.repairOrderId,
    depotIntakeId: metadata.depotIntakeId,
    tenantId: metadata.tenantId,
    actorId: metadata.actorId,
    actorRole: metadata.actorRole,
    requestId: metadata.requestId,
    correlationId: metadata.correlationId,
    internalOnly: true,
    customerVisible: false,
    metadata: { ...metadata },
  });

  return {
    ok: true,
    built: true,
    reasonCode: 'depot_workshop_repair_order_audit_event_built',
    requestId: metadata.requestId,
    auditEvent: { ...auditEvent, metadata: { ...auditEvent.metadata } },
  };
}

module.exports = {
  DEPOT_WORKSHOP_REPAIR_ORDER_AUDIT_EVENT_TYPES,
  buildDepotWorkshopRepairOrderAuditEvent,
  sanitizeDepotWorkshopRepairOrderAuditMetadata,
};
