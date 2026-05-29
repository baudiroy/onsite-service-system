'use strict';

const DEPOT_REPAIR_STATUS_BOUNDARY_KIND = 'depot_workshop.depot_repair_status_boundary';

const DEPOT_WORKFLOW_TYPES = new Set([
  'depot',
  'carry_in',
  'mail_in',
  'pickup_delivery',
]);

const DEPOT_REPAIR_STATUSES = new Set([
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

const CLOSED_DEPOT_REPAIR_STATUSES = new Set([
  'cancelled',
  'closed',
]);

const ALLOWED_DEPOT_REPAIR_TRANSITIONS = Object.freeze({
  intake_received: new Set(['diagnosis_pending', 'cancelled']),
  diagnosis_pending: new Set(['diagnosis_completed', 'cancelled']),
  diagnosis_completed: new Set(['quote_pending', 'repair_in_progress', 'cancelled']),
  quote_pending: new Set(['quote_approved', 'cancelled']),
  quote_approved: new Set(['repair_in_progress', 'cancelled']),
  repair_in_progress: new Set(['quality_check', 'cancelled']),
  quality_check: new Set(['repair_in_progress', 'ready_for_return', 'cancelled']),
  ready_for_return: new Set(['returned', 'cancelled']),
  returned: new Set(['closed']),
  cancelled: new Set([]),
  closed: new Set([]),
});

const FORBIDDEN_MUTATION_KEYS = new Set([
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
  'providerPayload',
  'provider_payload',
  'billing',
  'billingEvent',
  'billing_event',
  'billingInternals',
  'billing_internals',
  'aiOutput',
  'ai_output',
  'aiProviderOutput',
  'ai_provider_output',
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

function compactRecord(record) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  );
}

function firstString(...values) {
  return values.map(stringValue).find(Boolean);
}

function depotIntakeFrom(input) {
  return isObject(input.depotIntake) ? input.depotIntake : {};
}

function actorIdFrom(input) {
  const actor = isObject(input.actor) ? input.actor : {};
  const user = isObject(input.user) ? input.user : {};

  return firstString(input.actorId, actor.id, actor.userId, actor.sub, user.id, user.userId, user.sub);
}

function organizationIdFrom(input) {
  const actor = isObject(input.actor) ? input.actor : {};
  const user = isObject(input.user) ? input.user : {};
  const context = isObject(input.context) ? input.context : {};
  const depotIntake = depotIntakeFrom(input);

  return firstString(
    input.organizationId,
    actor.organizationId,
    user.organizationId,
    context.organizationId,
    depotIntake.organizationId,
  );
}

function depotOrganizationIdFrom(input) {
  const depotIntake = depotIntakeFrom(input);

  return firstString(input.depotOrganizationId, depotIntake.organizationId);
}

function requestIdFrom(input) {
  const context = isObject(input.context) ? input.context : {};

  return firstString(input.requestId, context.requestId);
}

function workflowTypeFrom(input) {
  const depotIntake = depotIntakeFrom(input);

  return firstString(
    input.workflowType,
    input.workflow_type,
    input.serviceType,
    input.service_type,
    depotIntake.workflowType,
    depotIntake.workflow_type,
    depotIntake.serviceType,
    depotIntake.service_type,
  );
}

function explicitWorkflowTypeFrom(input) {
  return firstString(input.workflowType, input.workflow_type, input.serviceType, input.service_type);
}

function depotWorkflowTypeFrom(input) {
  const depotIntake = depotIntakeFrom(input);

  return firstString(
    depotIntake.workflowType,
    depotIntake.workflow_type,
    depotIntake.serviceType,
    depotIntake.service_type,
  );
}

function currentStatusFrom(input) {
  const depotIntake = depotIntakeFrom(input);

  return firstString(input.currentStatus, input.current_status, depotIntake.depotStatus, depotIntake.depot_status, depotIntake.status);
}

function targetStatusFrom(input) {
  return firstString(input.targetStatus, input.target_status, input.nextStatus, input.next_status, input.depotStatus, input.depot_status);
}

function depotIntakeIdFrom(input) {
  const depotIntake = depotIntakeFrom(input);

  return firstString(input.depotIntakeId, input.depot_intake_id, input.draftId, depotIntake.depotIntakeId, depotIntake.draftId);
}

function closedByFlag(input) {
  const depotIntake = depotIntakeFrom(input);

  return input.closed === true
    || input.finalized === true
    || depotIntake.closed === true
    || depotIntake.finalized === true;
}

function mutationIntentFrom(input) {
  return isObject(input.mutationIntent) ? input.mutationIntent : {};
}

function hasForbiddenMutationKeys(input) {
  const mutationIntent = mutationIntentFrom(input);
  const mutationKeys = Object.keys(mutationIntent);
  const topLevelKeys = Object.keys(input);

  return [...mutationKeys, ...topLevelKeys].some((key) => FORBIDDEN_MUTATION_KEYS.has(key));
}

function failure(reasonCode, context = {}) {
  return compactRecord({
    ok: false,
    allowed: false,
    boundaryKind: DEPOT_REPAIR_STATUS_BOUNDARY_KIND,
    reasonCode,
    requestId: requestIdFrom(context),
  });
}

function success(context) {
  return compactRecord({
    ok: true,
    allowed: true,
    boundaryKind: DEPOT_REPAIR_STATUS_BOUNDARY_KIND,
    reasonCode: 'depot_repair_status_transition_allowed',
    requestId: stringValue(context.requestId),
    transitionIntent: {
      depotIntakeId: context.depotIntakeId || null,
      organizationId: context.organizationId,
      workflowType: context.workflowType,
      actorId: context.actorId,
      currentStatus: context.currentStatus,
      targetStatus: context.targetStatus,
      requestId: stringValue(context.requestId) || null,
    },
    mutationIntent: {
      depotStatus: context.targetStatus,
      updatedBy: context.actorId,
    },
  });
}

function transitionAllowed(currentStatus, targetStatus) {
  const allowedTargets = ALLOWED_DEPOT_REPAIR_TRANSITIONS[currentStatus];

  return Boolean(allowedTargets && allowedTargets.has(targetStatus));
}

function evaluateDepotRepairStatusTransition(input = {}) {
  const source = isObject(input) ? input : {};
  const requestId = requestIdFrom(source);
  const actorId = actorIdFrom(source);
  const organizationId = organizationIdFrom(source);
  const depotOrganizationId = depotOrganizationIdFrom(source);
  const workflowType = workflowTypeFrom(source);
  const explicitWorkflowType = explicitWorkflowTypeFrom(source);
  const depotWorkflowType = depotWorkflowTypeFrom(source);
  const currentStatus = currentStatusFrom(source);
  const targetStatus = targetStatusFrom(source);

  if (!actorId) {
    return failure('depot_status_actor_required', { requestId });
  }

  if (!organizationId) {
    return failure('organization_id_required', { requestId });
  }

  if (depotOrganizationId && depotOrganizationId !== organizationId) {
    return failure('depot_status_organization_mismatch', { requestId });
  }

  if (!workflowType || !DEPOT_WORKFLOW_TYPES.has(workflowType)) {
    return failure('depot_workflow_type_unsupported', { requestId });
  }

  if (explicitWorkflowType && depotWorkflowType && explicitWorkflowType !== depotWorkflowType) {
    return failure('depot_workflow_type_mismatch', { requestId });
  }

  if (!currentStatus || !DEPOT_REPAIR_STATUSES.has(currentStatus)) {
    return failure('depot_repair_current_status_unknown', { requestId });
  }

  if (!targetStatus || !DEPOT_REPAIR_STATUSES.has(targetStatus)) {
    return failure('depot_repair_target_status_unsupported', { requestId });
  }

  if (CLOSED_DEPOT_REPAIR_STATUSES.has(currentStatus) || closedByFlag(source)) {
    return failure('depot_repair_status_closed_or_finalized', { requestId });
  }

  if (hasForbiddenMutationKeys(source)) {
    return failure('depot_repair_status_mutation_scope_forbidden', { requestId });
  }

  if (!transitionAllowed(currentStatus, targetStatus)) {
    return failure('depot_repair_status_transition_invalid', { requestId });
  }

  return success({
    actorId,
    organizationId,
    workflowType,
    currentStatus,
    targetStatus,
    depotIntakeId: depotIntakeIdFrom(source),
    requestId,
  });
}

module.exports = {
  DEPOT_REPAIR_STATUS_BOUNDARY_KIND,
  DEPOT_WORKFLOW_TYPES,
  DEPOT_REPAIR_STATUSES,
  CLOSED_DEPOT_REPAIR_STATUSES,
  evaluateDepotRepairStatusTransition,
};
