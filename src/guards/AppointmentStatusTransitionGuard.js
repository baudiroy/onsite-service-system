'use strict';

const APPOINTMENT_STATUS_TRANSITION_GUARD_KIND = 'admin_dispatch.appointment_status_transition_guard';

const OPEN_APPOINTMENT_STATUSES = new Set(['scheduled', 'rescheduled']);
const CLOSED_APPOINTMENT_STATUSES = new Set(['cancelled', 'completed', 'no_show']);
const SUPPORTED_APPOINTMENT_STATUSES = new Set([
  ...OPEN_APPOINTMENT_STATUSES,
  ...CLOSED_APPOINTMENT_STATUSES,
]);

const ALLOWED_TRANSITIONS = Object.freeze({
  scheduled: new Set(['rescheduled', 'cancelled', 'no_show']),
  rescheduled: new Set(['scheduled', 'cancelled', 'no_show']),
});

const FORBIDDEN_MUTATION_KEYS = new Set([
  'finalAppointmentId',
  'final_appointment_id',
  'completionReportId',
  'completion_report_id',
  'fieldServiceReportId',
  'field_service_report_id',
  'customerVisiblePublication',
  'customer_visible_publication',
  'providerPayload',
  'provider_payload',
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

function actorIdFrom(input) {
  const actor = isObject(input.actor) ? input.actor : {};
  const user = isObject(input.user) ? input.user : {};

  return firstString(input.actorId, actor.id, actor.userId, actor.sub, user.id, user.userId, user.sub);
}

function organizationIdFrom(input) {
  const appointment = isObject(input.appointment) ? input.appointment : {};
  const assignment = isObject(input.assignment) ? input.assignment : {};
  const actor = isObject(input.actor) ? input.actor : {};
  const user = isObject(input.user) ? input.user : {};
  const context = isObject(input.context) ? input.context : {};

  return firstString(
    input.organizationId,
    actor.organizationId,
    user.organizationId,
    context.organizationId,
    appointment.organizationId,
    assignment.organizationId,
  );
}

function currentStatusFrom(input) {
  const appointment = isObject(input.appointment) ? input.appointment : {};

  return firstString(input.currentStatus, appointment.appointmentStatus, appointment.status);
}

function targetStatusFrom(input) {
  return firstString(input.targetStatus, input.nextStatus, input.appointmentStatus);
}

function appointmentOrganizationFrom(input) {
  const appointment = isObject(input.appointment) ? input.appointment : {};

  return firstString(appointment.organizationId, input.appointmentOrganizationId);
}

function assignmentOrganizationFrom(input) {
  const assignment = isObject(input.assignment) ? input.assignment : {};

  return firstString(assignment.organizationId, input.assignmentOrganizationId);
}

function assignmentVisible(input) {
  const assignment = isObject(input.assignment) ? input.assignment : {};

  return input.assignmentVisible === true
    || assignment.visible === true
    || assignment.found === true
    || assignment.eligible === true;
}

function assignmentEligible(input) {
  const assignment = isObject(input.assignment) ? input.assignment : {};

  if (input.assignmentEligible === false || assignment.eligible === false) {
    return false;
  }

  return assignmentVisible(input);
}

function closedByFlag(input) {
  const appointment = isObject(input.appointment) ? input.appointment : {};

  return input.closed === true
    || input.finalized === true
    || appointment.closed === true
    || appointment.finalized === true;
}

function mutationIntentFrom(input) {
  return isObject(input.mutationIntent) ? input.mutationIntent : {};
}

function hasForbiddenMutationKeys(input) {
  const mutationIntent = mutationIntentFrom(input);

  return Object.keys(mutationIntent).some((key) => FORBIDDEN_MUTATION_KEYS.has(key));
}

function appointmentIdFrom(input) {
  const appointment = isObject(input.appointment) ? input.appointment : {};

  return firstString(input.appointmentId, appointment.id, appointment.appointmentId);
}

function failure(reasonCode, context = {}) {
  return compactRecord({
    ok: false,
    allowed: false,
    guardKind: APPOINTMENT_STATUS_TRANSITION_GUARD_KIND,
    reasonCode,
    requestId: stringValue(context.requestId),
  });
}

function success(context) {
  return compactRecord({
    ok: true,
    allowed: true,
    guardKind: APPOINTMENT_STATUS_TRANSITION_GUARD_KIND,
    reasonCode: 'appointment_status_transition_allowed',
    requestId: stringValue(context.requestId),
    transitionIntent: {
      appointmentId: context.appointmentId || null,
      organizationId: context.organizationId,
      actorId: context.actorId,
      currentStatus: context.currentStatus,
      targetStatus: context.targetStatus,
      requestId: stringValue(context.requestId) || null,
    },
    mutationIntent: {
      appointmentStatus: context.targetStatus,
      updatedBy: context.actorId,
    },
  });
}

function transitionAllowed(currentStatus, targetStatus) {
  const allowedTargets = ALLOWED_TRANSITIONS[currentStatus];

  return Boolean(allowedTargets && allowedTargets.has(targetStatus));
}

function evaluateAppointmentStatusTransition(input = {}) {
  const source = isObject(input) ? input : {};
  const requestId = firstString(source.requestId, source.context && source.context.requestId);
  const actorId = actorIdFrom(source);
  const organizationId = organizationIdFrom(source);
  const currentStatus = currentStatusFrom(source);
  const targetStatus = targetStatusFrom(source);
  const appointmentOrganizationId = appointmentOrganizationFrom(source);
  const assignmentOrganizationId = assignmentOrganizationFrom(source);

  if (!actorId) {
    return failure('admin_actor_required', { requestId });
  }

  if (!organizationId) {
    return failure('organization_id_required', { requestId });
  }

  if (!currentStatus || !SUPPORTED_APPOINTMENT_STATUSES.has(currentStatus)) {
    return failure('appointment_current_status_unknown', { requestId });
  }

  if (!targetStatus || !SUPPORTED_APPOINTMENT_STATUSES.has(targetStatus)) {
    return failure('appointment_target_status_unsupported', { requestId });
  }

  if (CLOSED_APPOINTMENT_STATUSES.has(currentStatus) || closedByFlag(source)) {
    return failure('appointment_status_closed_or_finalized', { requestId });
  }

  if (appointmentOrganizationId && appointmentOrganizationId !== organizationId) {
    return failure('appointment_organization_mismatch', { requestId });
  }

  if (assignmentOrganizationId && assignmentOrganizationId !== organizationId) {
    return failure('assignment_organization_mismatch', { requestId });
  }

  if (!assignmentVisible(source) || !assignmentEligible(source)) {
    return failure('assignment_not_visible_or_eligible', { requestId });
  }

  if (hasForbiddenMutationKeys(source)) {
    return failure('appointment_status_mutation_scope_forbidden', { requestId });
  }

  if (!transitionAllowed(currentStatus, targetStatus)) {
    return failure('appointment_status_transition_invalid', { requestId });
  }

  return success({
    actorId,
    organizationId,
    appointmentId: appointmentIdFrom(source),
    currentStatus,
    targetStatus,
    requestId,
  });
}

module.exports = {
  APPOINTMENT_STATUS_TRANSITION_GUARD_KIND,
  evaluateAppointmentStatusTransition,
};
