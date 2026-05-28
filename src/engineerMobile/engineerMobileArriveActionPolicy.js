'use strict';

const ENGINEER_MOBILE_ARRIVE_ACTION = 'engineer_mobile.arrive';
const ENGINEER_MOBILE_ARRIVE_PERMISSION = 'engineer_mobile.visit.arrive';

const OPEN_ARRIVE_STATUSES = new Set([
  'scheduled',
  'rescheduled',
]);

const TERMINAL_VISIT_RESULTS = new Set([
  'cancelled',
  'canceled',
  'completed',
  'failed',
  'no_show',
  'unable_to_service',
]);

const TRAVELING_VALUES = new Set([
  'traveling',
  'in_transit',
  'en_route',
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

  return String(value);
}

function normalizedValue(value) {
  const text = stringValue(value);
  return text ? text.toLowerCase() : undefined;
}

function firstStringValue(source, keys) {
  if (!isObject(source)) {
    return undefined;
  }

  for (const key of keys) {
    const value = stringValue(source[key]);

    if (value) {
      return value;
    }
  }

  return undefined;
}

function actorId(actor) {
  return firstStringValue(actor, ['id', 'engineerId', 'userId']);
}

function appointmentId(appointment) {
  return firstStringValue(appointment, ['appointmentId', 'appointment_id', 'id']);
}

function assignedEngineerId(appointment) {
  return firstStringValue(appointment, [
    'assignedEngineerId',
    'assigned_engineer_id',
    'engineerId',
    'engineer_id',
  ]);
}

function organizationId(source) {
  return firstStringValue(source, ['organizationId', 'organization_id']);
}

function appointmentStatus(appointment) {
  return normalizedValue(firstStringValue(appointment, [
    'status',
    'appointmentStatus',
    'appointment_status',
  ]));
}

function includesPermission(actor) {
  return Array.isArray(actor.permissions)
    && actor.permissions.includes(ENGINEER_MOBILE_ARRIVE_PERMISSION);
}

function hasAnyValue(source, keys) {
  return keys.some((key) => {
    const value = source[key];

    if (value === undefined || value === null || value === false || value === '') {
      return false;
    }

    return true;
  });
}

function hasTravelStarted(appointment) {
  const mobileVisitStatus = normalizedValue(firstStringValue(appointment, [
    'mobileVisitStatus',
    'mobile_visit_status',
  ]));
  const visitStatus = normalizedValue(firstStringValue(appointment, [
    'visitStatus',
    'visit_status',
  ]));

  return TRAVELING_VALUES.has(mobileVisitStatus)
    || TRAVELING_VALUES.has(visitStatus)
    || hasAnyValue(appointment, [
      'travelStartedAt',
      'travel_started_at',
      'mobileTravelStartedAt',
      'mobile_travel_started_at',
    ]);
}

function hasAlreadyArrived(appointment) {
  return hasAnyValue(appointment, [
    'arrivedAt',
    'arrived_at',
    'arrivalAt',
    'arrival_at',
    'actualArrivalAt',
    'actual_arrival_at',
    'travelArrivedAt',
    'travel_arrived_at',
  ]);
}

function hasAlreadyFinished(appointment) {
  return hasAnyValue(appointment, [
    'finishedAt',
    'finished_at',
    'completedAt',
    'completed_at',
    'actualEndAt',
    'actual_end_at',
    'serviceFinishedAt',
    'service_finished_at',
  ]);
}

function hasTerminalVisitResult(appointment) {
  const result = normalizedValue(firstStringValue(appointment, [
    'visitResult',
    'visit_result',
    'visitStatus',
    'visit_status',
    'visitOutcome',
    'visit_outcome',
  ]));

  return Boolean(result && TERMINAL_VISIT_RESULTS.has(result));
}

function hasCompletionBoundaryIndicator(appointment) {
  return hasAnyValue(appointment, [
    'completionReportRequested',
    'completion_report_requested',
    'createReport',
    'create_report',
    'submitCompletion',
    'submit_completion',
    'publishReport',
    'publish_report',
    'completionReportId',
    'completion_report_id',
    'fieldServiceReportId',
    'field_service_report_id',
    'serviceReportId',
    'service_report_id',
    'reportFinalizedAt',
    'report_finalized_at',
  ]);
}

function safeDecisionFields(actor, appointment, reasonCode) {
  return {
    action: ENGINEER_MOBILE_ARRIVE_ACTION,
    permission: ENGINEER_MOBILE_ARRIVE_PERMISSION,
    reasonCode,
    subject: {
      actorId: isObject(actor) ? actorId(actor) : undefined,
      appointmentId: isObject(appointment) ? appointmentId(appointment) : undefined,
      organizationId: isObject(appointment) ? organizationId(appointment) : undefined,
      status: isObject(appointment) ? appointmentStatus(appointment) : undefined,
    },
  };
}

function auditIntentFor(decision, now) {
  return {
    type: 'engineer_mobile.action_policy_decision',
    action: decision.action,
    allowed: decision.allowed,
    reasonCode: decision.reasonCode,
    actorId: decision.subject.actorId,
    appointmentId: decision.subject.appointmentId,
    organizationId: decision.subject.organizationId,
    occurredAt: stringValue(now),
  };
}

function deny(reasonCode, actor, appointment, now) {
  const decision = {
    ok: false,
    allowed: false,
    ...safeDecisionFields(actor, appointment, reasonCode),
  };

  return {
    ...decision,
    auditIntent: auditIntentFor(decision, now),
  };
}

function allow(actor, appointment, now) {
  const decision = {
    ok: true,
    allowed: true,
    ...safeDecisionFields(actor, appointment, 'allowed'),
  };

  return {
    ...decision,
    auditIntent: auditIntentFor(decision, now),
  };
}

function evaluateEngineerMobileArriveAction(options = {}) {
  const actor = isObject(options) && isObject(options.actor) ? options.actor : undefined;
  const appointment = isObject(options) && isObject(options.appointment) ? options.appointment : undefined;
  const now = isObject(options) ? options.now : undefined;

  if (!actor) {
    return deny('actor_required', actor, appointment, now);
  }

  if (!appointment) {
    return deny('appointment_required', actor, appointment, now);
  }

  if (organizationId(actor) !== organizationId(appointment)) {
    return deny('organization_mismatch', actor, appointment, now);
  }

  if (!includesPermission(actor)) {
    return deny('permission_required', actor, appointment, now);
  }

  if (actorId(actor) !== assignedEngineerId(appointment)) {
    return deny('not_assigned_engineer', actor, appointment, now);
  }

  if (!OPEN_ARRIVE_STATUSES.has(appointmentStatus(appointment))) {
    return deny('appointment_not_open', actor, appointment, now);
  }

  if (!hasTravelStarted(appointment)) {
    return deny('travel_not_started', actor, appointment, now);
  }

  if (hasAlreadyArrived(appointment)) {
    return deny('already_arrived', actor, appointment, now);
  }

  if (hasAlreadyFinished(appointment)) {
    return deny('already_finished', actor, appointment, now);
  }

  if (hasTerminalVisitResult(appointment)) {
    return deny('terminal_visit_result', actor, appointment, now);
  }

  if (hasCompletionBoundaryIndicator(appointment)) {
    return deny('completion_report_boundary', actor, appointment, now);
  }

  return allow(actor, appointment, now);
}

module.exports = {
  ENGINEER_MOBILE_ARRIVE_ACTION,
  ENGINEER_MOBILE_ARRIVE_PERMISSION,
  evaluateEngineerMobileArriveAction,
};
