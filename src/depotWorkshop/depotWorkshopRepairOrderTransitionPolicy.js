'use strict';

const {
  isDepotWorkshopRepairOrderStatus,
  isDepotWorkshopRepairOrderTerminalStatus,
} = require('./depotWorkshopRepairOrderStateModel');
const {
  validateDepotWorkshopRepairOrderDraft,
} = require('./depotWorkshopRepairOrderContract');

const DEPOT_WORKSHOP_REPAIR_ORDER_ALLOWED_TRANSITIONS = Object.freeze({
  intake_received: Object.freeze(['diagnosis_pending', 'cancelled']),
  diagnosis_pending: Object.freeze(['diagnosis_completed', 'cancelled']),
  diagnosis_completed: Object.freeze(['quote_pending', 'cancelled']),
  quote_pending: Object.freeze(['quote_approved', 'cancelled']),
  quote_approved: Object.freeze(['repair_in_progress', 'cancelled']),
  repair_in_progress: Object.freeze(['quality_check', 'cancelled']),
  quality_check: Object.freeze(['ready_for_return', 'cancelled']),
  ready_for_return: Object.freeze(['returned', 'cancelled']),
  returned: Object.freeze(['closed', 'cancelled']),
  cancelled: Object.freeze([]),
  closed: Object.freeze([]),
});

const FORBIDDEN_TRANSITION_INPUT_KEYS = new Set([
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
  'token',
  'password',
  'secret',
  'sql',
  'stack',
]);

const UNSAFE_TRANSITION_TEXT_PATTERNS = Object.freeze([
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

    if (!trimmed || UNSAFE_TRANSITION_TEXT_PATTERNS.some((pattern) => pattern.test(trimmed))) {
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
  return FORBIDDEN_TRANSITION_INPUT_KEYS.has(fieldName)
    || String(fieldName).replace(/[^a-zA-Z0-9]/g, '').toLowerCase().startsWith('raw');
}

function hasForbiddenInput(input) {
  return Object.keys(input).some((fieldName) => fieldIsForbidden(fieldName));
}

function fromStatusFrom(input) {
  return firstString(input, ['fromStatus', 'from_status', 'currentStatus', 'current_status']);
}

function toStatusFrom(input) {
  return firstString(input, ['toStatus', 'to_status', 'targetStatus', 'target_status', 'nextStatus', 'next_status']);
}

function actorIdFrom(input) {
  const actor = isPlainObject(input.actor) ? input.actor : {};
  const user = isPlainObject(input.user) ? input.user : {};

  return firstString(input, ['actorId', 'actor_id', 'updatedByActorId', 'updated_by_actor_id'])
    || firstString(actor, ['id', 'userId', 'user_id', 'sub'])
    || firstString(user, ['id', 'userId', 'user_id', 'sub']);
}

function allowedTargetsFor(fromStatus) {
  return DEPOT_WORKSHOP_REPAIR_ORDER_ALLOWED_TRANSITIONS[fromStatus] || Object.freeze([]);
}

function failure(reasonCode, context = {}) {
  return compactRecord({
    ok: false,
    allowed: false,
    planned: false,
    reasonCode,
    requestId: context.requestId,
  });
}

function success(input, contractDraft, fromStatus, toStatus) {
  const plannedTransition = compactRecord({
    organizationId: contractDraft.organizationId,
    caseId: contractDraft.caseId,
    repairOrderId: contractDraft.repairOrderId,
    depotIntakeId: contractDraft.depotIntakeId,
    tenantId: contractDraft.tenantId,
    fromStatus,
    toStatus,
    actorId: actorIdFrom(input),
    requestId: contractDraft.requestId,
  });

  return {
    ok: true,
    allowed: true,
    planned: true,
    reasonCode: 'depot_workshop_repair_order_transition_planned',
    requestId: contractDraft.requestId,
    plannedTransition: { ...plannedTransition },
  };
}

function evaluateTransition(input = {}) {
  if (!isPlainObject(input)) {
    return failure('depot_workshop_repair_order_transition_plain_object_required');
  }

  if (hasForbiddenInput(input)) {
    return failure('depot_workshop_repair_order_transition_forbidden_fields', input);
  }

  const fromStatus = fromStatusFrom(input);
  const toStatus = toStatusFrom(input);

  if (!fromStatus || !isDepotWorkshopRepairOrderStatus(fromStatus)) {
    return failure('depot_workshop_repair_order_from_status_invalid', input);
  }

  if (!toStatus || !isDepotWorkshopRepairOrderStatus(toStatus)) {
    return failure('depot_workshop_repair_order_to_status_invalid', input);
  }

  const contractValidation = validateDepotWorkshopRepairOrderDraft({
    ...input,
    depotStatus: fromStatus,
  });

  if (!contractValidation.ok) {
    return failure(contractValidation.reasonCode, contractValidation);
  }

  if (isDepotWorkshopRepairOrderTerminalStatus(fromStatus)) {
    return failure('depot_workshop_repair_order_terminal_transition_denied', contractValidation);
  }

  if (!allowedTargetsFor(fromStatus).includes(toStatus)) {
    return failure('depot_workshop_repair_order_transition_not_allowed', contractValidation);
  }

  return success(input, contractValidation.draft, fromStatus, toStatus);
}

function canTransitionDepotWorkshopRepairOrderStatus(input = {}) {
  return evaluateTransition(input);
}

function planDepotWorkshopRepairOrderStatusTransition(input = {}) {
  const result = evaluateTransition(input);

  if (!result.ok) {
    return result;
  }

  return {
    ...result,
    plannedTransition: { ...result.plannedTransition },
  };
}

module.exports = {
  DEPOT_WORKSHOP_REPAIR_ORDER_ALLOWED_TRANSITIONS,
  canTransitionDepotWorkshopRepairOrderStatus,
  planDepotWorkshopRepairOrderStatusTransition,
};
