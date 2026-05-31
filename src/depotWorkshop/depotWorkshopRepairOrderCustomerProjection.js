'use strict';

const DEPOT_WORKSHOP_REPAIR_ORDER_CUSTOMER_PROJECTION_FIELDS = Object.freeze([
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

const CUSTOMER_PROJECTION_FIELD_SOURCES = Object.freeze({
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

const UNSAFE_CUSTOMER_PROJECTION_TEXT_PATTERNS = Object.freeze([
  /database[_\s-]*url/i,
  /jwt[_\s-]*secret/i,
  /provider\s*payload/i,
  /\braw(?:\s|_|-)*(?:db|row|rows|customer|phone|address|payload|error|input|case|appointment|report)?\b/i,
  /\b(?:sql|stack|token|secret|password)\b/i,
  /\b(?:billing|invoice|charge|settlement|payment)\b/i,
  /\b(?:openai|ai\s*output|rag|vector)\b/i,
  /\b(?:audit|internal|technician|subcontractor|assignment)\b/i,
  /\b(?:diagnosis|quote|parts|quality\s*check|qc)\s+(?:internal|raw|private)\b/i,
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

function safeScalar(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (!trimmed || UNSAFE_CUSTOMER_PROJECTION_TEXT_PATTERNS.some((pattern) => pattern.test(trimmed))) {
      return undefined;
    }

    return trimmed;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return undefined;
}

function firstSafeValue(source, fieldNames) {
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

function sourceFrom(input = {}) {
  if (!isPlainObject(input)) {
    return {};
  }

  if (isPlainObject(input.source)) {
    return input.source;
  }

  if (isPlainObject(input.repairOrder)) {
    return input.repairOrder;
  }

  if (isPlainObject(input.depotRepair)) {
    return input.depotRepair;
  }

  if (isPlainObject(input.depotIntake)) {
    return input.depotIntake;
  }

  return input;
}

function sanitizeDepotWorkshopRepairOrderCustomerProjection(input = {}) {
  const source = sourceFrom(input);
  const projection = {};

  for (const fieldName of DEPOT_WORKSHOP_REPAIR_ORDER_CUSTOMER_PROJECTION_FIELDS) {
    const value = firstSafeValue(source, CUSTOMER_PROJECTION_FIELD_SOURCES[fieldName] || [fieldName]);

    if (value !== undefined) {
      projection[fieldName] = value;
    }
  }

  return projection;
}

function buildDepotWorkshopRepairOrderCustomerProjection(input = {}) {
  if (!isPlainObject(input)) {
    return {
      ok: false,
      built: false,
      reasonCode: 'depot_workshop_repair_order_customer_projection_plain_object_required',
      projection: {},
    };
  }

  return {
    ok: true,
    built: true,
    reasonCode: 'depot_workshop_repair_order_customer_projection_built',
    projection: sanitizeDepotWorkshopRepairOrderCustomerProjection(input),
  };
}

module.exports = {
  DEPOT_WORKSHOP_REPAIR_ORDER_CUSTOMER_PROJECTION_FIELDS,
  buildDepotWorkshopRepairOrderCustomerProjection,
  sanitizeDepotWorkshopRepairOrderCustomerProjection,
};
