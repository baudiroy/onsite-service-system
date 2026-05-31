'use strict';

const DEPOT_WORKSHOP_REPAIR_ORDER_STATUSES = Object.freeze([
  'intake_received',
  'diagnosis_pending',
  'diagnosis_completed',
  'quote_pending',
  'quote_approved',
  'repair_in_progress',
  'quality_check',
  'ready_for_return',
  'returned',
  'cancelled',
  'closed',
]);

const DEPOT_WORKSHOP_REPAIR_ORDER_TERMINAL_STATUSES = Object.freeze([
  'cancelled',
  'closed',
]);

const DEPOT_WORKSHOP_REPAIR_ORDER_INTERNAL_ONLY_FIELDS = Object.freeze([
  'repairOrderId',
  'caseId',
  'depotIntakeId',
  'organizationId',
  'tenantId',
  'depotStatus',
  'workshopJobId',
  'workshopId',
  'workshopTeamId',
  'assignedTechnicianId',
  'subcontractorOrganizationId',
  'assignmentRelationship',
  'itemRef',
  'productRef',
  'diagnosisSummaryRef',
  'quoteSummaryRef',
  'estimateSummaryRef',
  'partsSummaryRef',
  'qcSummaryRef',
  'customerVisibleProjectionRef',
  'auditEventRef',
  'requestId',
  'createdByActorId',
  'updatedByActorId',
  'finalAppointmentId',
  'fieldServiceReport',
  'fieldServiceReportId',
  'completionReport',
  'completionReportId',
  'customerVisiblePublication',
  'rawCustomerData',
  'rawDbRow',
  'rawRows',
  'providerPayload',
  'billingInternals',
  'invoice',
  'settlement',
  'aiOutput',
  'aiProviderOutput',
  'DATABASE_URL',
  'token',
  'secret',
  'sql',
  'stack',
]);

const DEPOT_WORKSHOP_REPAIR_ORDER_CUSTOMER_VISIBLE_FIELDS = Object.freeze([
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

const UNSAFE_PUBLIC_TEXT_PATTERNS = Object.freeze([
  /database[_\s-]*url/i,
  /jwt[_\s-]*secret/i,
  /provider\s*payload/i,
  /\braw(?:\s|_|-)*(?:db|row|rows|customer|phone|address|payload|error|input)?\b/i,
  /\b(?:sql|stack|token|secret|password)\b/i,
  /\b(?:billing|invoice|charge|settlement|payment)\b/i,
  /\b(?:openai|ai\s*output|rag|vector)\b/i,
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

function isDepotWorkshopRepairOrderStatus(value) {
  return DEPOT_WORKSHOP_REPAIR_ORDER_STATUSES.includes(value);
}

function isDepotWorkshopRepairOrderTerminalStatus(value) {
  return DEPOT_WORKSHOP_REPAIR_ORDER_TERMINAL_STATUSES.includes(value);
}

function safeScalar(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (!trimmed || UNSAFE_PUBLIC_TEXT_PATTERNS.some((pattern) => pattern.test(trimmed))) {
      return undefined;
    }

    return trimmed;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return undefined;
}

function safePublicValue(value) {
  if (Array.isArray(value)) {
    const filtered = value
      .map((item) => safePublicValue(item))
      .filter((item) => item !== undefined);

    return filtered.length > 0 ? filtered : undefined;
  }

  if (isPlainObject(value)) {
    return undefined;
  }

  return safeScalar(value);
}

function sanitizeDepotWorkshopRepairOrderPublicProjection(input = {}) {
  if (!isPlainObject(input)) {
    return {};
  }

  const projection = {};

  for (const fieldName of DEPOT_WORKSHOP_REPAIR_ORDER_CUSTOMER_VISIBLE_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(input, fieldName)) {
      continue;
    }

    const safeValue = safePublicValue(input[fieldName]);

    if (safeValue !== undefined) {
      projection[fieldName] = safeValue;
    }
  }

  return projection;
}

module.exports = {
  DEPOT_WORKSHOP_REPAIR_ORDER_CUSTOMER_VISIBLE_FIELDS,
  DEPOT_WORKSHOP_REPAIR_ORDER_INTERNAL_ONLY_FIELDS,
  DEPOT_WORKSHOP_REPAIR_ORDER_STATUSES,
  DEPOT_WORKSHOP_REPAIR_ORDER_TERMINAL_STATUSES,
  isDepotWorkshopRepairOrderStatus,
  isDepotWorkshopRepairOrderTerminalStatus,
  sanitizeDepotWorkshopRepairOrderPublicProjection,
};
