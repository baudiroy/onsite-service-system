'use strict';

const ENGINEER_MOBILE_FINISH_WORK_ACTION = 'engineer_mobile.finish_work';
const ENGINEER_MOBILE_FINISH_WORK_PERMISSION = 'engineer_mobile.visit.finish_work';

const OPEN_FINISH_WORK_STATUSES = new Set([
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

const WORKING_VALUES = new Set([
  'working',
  'in_progress',
  'in_service',
  'servicing',
  'started_work',
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
    && actor.permissions.includes(ENGINEER_MOBILE_FINISH_WORK_PERMISSION);
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

function mobileVisitStatus(appointment) {
  return normalizedValue(firstStringValue(appointment, [
    'mobileVisitStatus',
    'mobile_visit_status',
  ]));
}

function visitStatus(appointment) {
  return normalizedValue(firstStringValue(appointment, [
    'visitStatus',
    'visit_status',
  ]));
}

function hasWorkStarted(appointment) {
  return WORKING_VALUES.has(mobileVisitStatus(appointment))
    || WORKING_VALUES.has(visitStatus(appointment))
    || hasAnyValue(appointment, [
      'workStartedAt',
      'work_started_at',
      'startedWorkAt',
      'started_work_at',
      'serviceStartedAt',
      'service_started_at',
      'mobileWorkStartedAt',
      'mobile_work_started_at',
    ]);
}

function hasAlreadyFinished(appointment) {
  return hasAnyValue(appointment, [
    'workFinishedAt',
    'work_finished_at',
    'finishedWorkAt',
    'finished_work_at',
    'serviceFinishedAt',
    'service_finished_at',
    'finishedAt',
    'finished_at',
    'completedAt',
    'completed_at',
    'actualEndAt',
    'actual_end_at',
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
    'approveCompletion',
    'approve_completion',
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

function hasFinalAppointmentBoundaryIndicator(appointment) {
  return hasAnyValue(appointment, [
    ['final', 'AppointmentId'].join(''),
    'final_appointment_id',
    'set_final_appointment',
    'finalAppointmentOverride',
    'final_appointment_override',
    'markFinalAppointment',
    'mark_final_appointment',
  ]);
}

function safeDecisionFields(actor, appointment, reasonCode) {
  return {
    action: ENGINEER_MOBILE_FINISH_WORK_ACTION,
    permission: ENGINEER_MOBILE_FINISH_WORK_PERMISSION,
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

function evaluateEngineerMobileFinishWorkAction(options = {}) {
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

  if (!OPEN_FINISH_WORK_STATUSES.has(appointmentStatus(appointment))) {
    return deny('appointment_not_open', actor, appointment, now);
  }

  if (!hasWorkStarted(appointment)) {
    return deny('work_not_started', actor, appointment, now);
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

  if (hasFinalAppointmentBoundaryIndicator(appointment)) {
    return deny('final_appointment_boundary', actor, appointment, now);
  }

  return allow(actor, appointment, now);
}

module.exports = {
  ENGINEER_MOBILE_FINISH_WORK_ACTION,
  ENGINEER_MOBILE_FINISH_WORK_PERMISSION,
  evaluateEngineerMobileFinishWorkAction,
};
