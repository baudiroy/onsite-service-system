'use strict';

const ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION = 'engineer_mobile.record_visit_result';
const ENGINEER_MOBILE_RECORD_VISIT_RESULT_PERMISSION = 'engineer_mobile.visit.record_result';

const ENGINEER_MOBILE_ALLOWED_VISIT_RESULTS = Object.freeze([
  'resolved',
  'follow_up_required',
  'parts_required',
  'cannot_repair',
  'customer_unavailable',
  'cancelled_on_site',
]);

const ALLOWED_VISIT_RESULT_SET = new Set(ENGINEER_MOBILE_ALLOWED_VISIT_RESULTS);

const OPEN_RECORD_VISIT_RESULT_STATUSES = new Set([
  'scheduled',
  'rescheduled',
]);

const WORK_FINISHED_VALUES = new Set([
  'work_finished',
  'finished_work',
  'service_finished',
  'work_completed',
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
    && actor.permissions.includes(ENGINEER_MOBILE_RECORD_VISIT_RESULT_PERMISSION);
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

function hasWorkFinished(appointment) {
  return WORK_FINISHED_VALUES.has(mobileVisitStatus(appointment))
    || WORK_FINISHED_VALUES.has(visitStatus(appointment))
    || hasAnyValue(appointment, [
      'workFinishedAt',
      'work_finished_at',
      'finishedWorkAt',
      'finished_work_at',
      'serviceFinishedAt',
      'service_finished_at',
      'mobileWorkFinishedAt',
      'mobile_work_finished_at',
    ]);
}

function hasVisitResultAlreadyRecorded(appointment) {
  return hasAnyValue(appointment, [
    'visitResult',
    'visit_result',
    'visitOutcome',
    'visit_outcome',
    'recordedVisitResult',
    'recorded_visit_result',
    'recordedVisitOutcome',
    'recorded_visit_outcome',
    'visitResultRecordedAt',
    'visit_result_recorded_at',
  ]);
}

function hasCompletionBoundaryIndicator(appointment) {
  return hasAnyValue(appointment, [
    'completionReportRequested',
    'completion_report_requested',
    'completionReportDraft',
    'completion_report_draft',
    'reportDraft',
    'report_draft',
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

function normalizedVisitResult(visitResult) {
  const result = normalizedValue(visitResult);
  return result && ALLOWED_VISIT_RESULT_SET.has(result) ? result : undefined;
}

function safeDecisionFields(actor, appointment, reasonCode, visitResult) {
  return {
    action: ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION,
    permission: ENGINEER_MOBILE_RECORD_VISIT_RESULT_PERMISSION,
    reasonCode,
    visitResult: normalizedVisitResult(visitResult),
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
    visitResult: decision.visitResult,
    actorId: decision.subject.actorId,
    appointmentId: decision.subject.appointmentId,
    organizationId: decision.subject.organizationId,
    occurredAt: stringValue(now),
  };
}

function deny(reasonCode, actor, appointment, visitResult, now) {
  const decision = {
    ok: false,
    allowed: false,
    ...safeDecisionFields(actor, appointment, reasonCode, visitResult),
  };

  return {
    ...decision,
    auditIntent: auditIntentFor(decision, now),
  };
}

function allow(actor, appointment, visitResult, now) {
  const decision = {
    ok: true,
    allowed: true,
    ...safeDecisionFields(actor, appointment, 'allowed', visitResult),
  };

  return {
    ...decision,
    auditIntent: auditIntentFor(decision, now),
  };
}

function evaluateEngineerMobileRecordVisitResultAction(options = {}) {
  const actor = isObject(options) && isObject(options.actor) ? options.actor : undefined;
  const appointment = isObject(options) && isObject(options.appointment) ? options.appointment : undefined;
  const visitResult = isObject(options) ? options.visitResult : undefined;
  const now = isObject(options) ? options.now : undefined;

  if (!actor) {
    return deny('actor_required', actor, appointment, visitResult, now);
  }

  if (!appointment) {
    return deny('appointment_required', actor, appointment, visitResult, now);
  }

  if (organizationId(actor) !== organizationId(appointment)) {
    return deny('organization_mismatch', actor, appointment, visitResult, now);
  }

  if (!includesPermission(actor)) {
    return deny('permission_required', actor, appointment, visitResult, now);
  }

  if (actorId(actor) !== assignedEngineerId(appointment)) {
    return deny('not_assigned_engineer', actor, appointment, visitResult, now);
  }

  if (!OPEN_RECORD_VISIT_RESULT_STATUSES.has(appointmentStatus(appointment))) {
    return deny('appointment_not_open', actor, appointment, visitResult, now);
  }

  if (!hasWorkFinished(appointment)) {
    return deny('work_not_finished', actor, appointment, visitResult, now);
  }

  if (hasVisitResultAlreadyRecorded(appointment)) {
    return deny('visit_result_already_recorded', actor, appointment, visitResult, now);
  }

  if (hasCompletionBoundaryIndicator(appointment)) {
    return deny('completion_report_boundary', actor, appointment, visitResult, now);
  }

  if (hasFinalAppointmentBoundaryIndicator(appointment)) {
    return deny('final_appointment_boundary', actor, appointment, visitResult, now);
  }

  if (!normalizedVisitResult(visitResult)) {
    return deny('invalid_visit_result', actor, appointment, visitResult, now);
  }

  return allow(actor, appointment, visitResult, now);
}

module.exports = {
  ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION,
  ENGINEER_MOBILE_RECORD_VISIT_RESULT_PERMISSION,
  ENGINEER_MOBILE_ALLOWED_VISIT_RESULTS,
  evaluateEngineerMobileRecordVisitResultAction,
};
