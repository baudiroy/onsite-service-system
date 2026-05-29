'use strict';

const DEPOT_REPAIR_CUSTOMER_VISIBLE_FILTER_KIND = 'depot_workshop.customer_visible_data_filter';
const DEPOT_REPAIR_CUSTOMER_VISIBLE_DTO_TYPE = 'depot_repair_customer_visible';

const DEPOT_REPAIR_CUSTOMER_VISIBLE_ALLOWED_FIELDS = Object.freeze([
  'customerRepairReference',
  'workflowType',
  'displayStatus',
  'statusSummary',
  'issueSummary',
  'workSummary',
  'nextCustomerAction',
  'estimatedReadyAt',
  'readyForReturnAt',
  'returnedAt',
  'lastCustomerUpdateAt',
  'supportContactHint',
]);

const FIELD_SOURCES = Object.freeze({
  customerRepairReference: ['customerRepairReference', 'repairReference', 'trackingReference'],
  workflowType: ['customerWorkflowType', 'workflowType'],
  displayStatus: ['customerDisplayStatus', 'displayStatus', 'depotStatus'],
  statusSummary: ['customerStatusSummary', 'statusSummary'],
  issueSummary: ['customerIssueSummary', 'issueSummary'],
  workSummary: ['customerWorkSummary', 'workSummary'],
  nextCustomerAction: ['nextCustomerAction', 'customerNextStep'],
  estimatedReadyAt: ['estimatedReadyAt', 'customerEstimatedReadyAt'],
  readyForReturnAt: ['readyForReturnAt', 'customerReadyForReturnAt'],
  returnedAt: ['returnedAt', 'customerReturnedAt'],
  lastCustomerUpdateAt: ['lastCustomerUpdateAt', 'customerFacingUpdatedAt'],
  supportContactHint: ['supportContactHint'],
});

const UNSAFE_TEXT_PATTERNS = Object.freeze([
  /database[_\s-]*url/i,
  /jwt[_\s-]*secret/i,
  /provider\s*payload/i,
  /\braw(?:\s|_|-)*(?:db|row|rows|customer|phone|address|payload|error|input)?\b/i,
  /\b(?:sql|stack|token|secret)\b/i,
  /\b(?:billing|invoice|charge|settlement)\b/i,
  /\b(?:openai|ai\s*output|rag)\b/i,
  /\b(?:final\s*appointment|field\s*service\s*report|completion\s*report|fsr)\b/i,
  /\b(?:phone|tel|address)\b/i,
  /\d{4}[-\s]?\d{3}[-\s]?\d{3}/,
]);

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return undefined;
}

function textIsSafe(value) {
  const text = stringValue(value);

  return Boolean(text) && !UNSAFE_TEXT_PATTERNS.some((pattern) => pattern.test(text));
}

function safeValue(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (Array.isArray(value)) {
    const filtered = value
      .map((item) => safeValue(item))
      .filter((item) => item !== undefined);

    return filtered.length > 0 ? filtered : undefined;
  }

  if (isObject(value)) {
    return undefined;
  }

  return textIsSafe(value) ? stringValue(value) : undefined;
}

function firstSafeValue(source, fieldNames) {
  for (const fieldName of fieldNames) {
    if (Object.prototype.hasOwnProperty.call(source, fieldName)) {
      const value = safeValue(source[fieldName]);

      if (value !== undefined) {
        return value;
      }
    }
  }

  return undefined;
}

function sourceFrom(input = {}) {
  if (!isObject(input)) {
    return {};
  }

  if (isObject(input.source)) {
    return input.source;
  }

  if (isObject(input.depotRepair)) {
    return input.depotRepair;
  }

  if (isObject(input.depotIntake)) {
    return input.depotIntake;
  }

  return input;
}

function buildDepotRepairCustomerVisibleDto(input = {}) {
  const source = sourceFrom(input);
  const dto = {
    dtoType: DEPOT_REPAIR_CUSTOMER_VISIBLE_DTO_TYPE,
  };

  for (const fieldName of DEPOT_REPAIR_CUSTOMER_VISIBLE_ALLOWED_FIELDS) {
    const value = firstSafeValue(source, FIELD_SOURCES[fieldName] || [fieldName]);

    if (value !== undefined) {
      dto[fieldName] = value;
    }
  }

  return {
    ok: true,
    filterKind: DEPOT_REPAIR_CUSTOMER_VISIBLE_FILTER_KIND,
    reasonCode: 'depot_customer_visible_dto_filtered',
    dto,
  };
}

module.exports = {
  DEPOT_REPAIR_CUSTOMER_VISIBLE_ALLOWED_FIELDS,
  DEPOT_REPAIR_CUSTOMER_VISIBLE_DTO_TYPE,
  DEPOT_REPAIR_CUSTOMER_VISIBLE_FILTER_KIND,
  buildDepotRepairCustomerVisibleDto,
};
