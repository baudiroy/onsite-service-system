'use strict';

const {
  decideEngineerMobileVisitAction,
} = require('./engineerMobileVisitActionDecisionHelper');

const ENGINEER_MOBILE_VISIT_ACTION_COMMAND_PLANNER_KIND = 'engineer_mobile.visit_action_command_planner';
const ENGINEER_MOBILE_VISIT_ACTION_TRANSITION_INTENT_KIND = 'engineer_mobile.visit_action_transition_intent';

const MOBILE_VISIT_STATUS_BY_ACTION = Object.freeze({
  'engineer_mobile.start_travel': 'traveling',
  'engineer_mobile.arrive': 'arrived',
  'engineer_mobile.start_work': 'working',
  'engineer_mobile.finish_work': 'work_finished',
  'engineer_mobile.record_visit_result': 'visit_result_recorded',
});

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

function stringListValue(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(stringValue).filter(Boolean);
}

function normalizedKey(value) {
  return String(value || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function hasUnsafeRequestContainer(source) {
  if (!isObject(source)) {
    return false;
  }

  return Object.keys(source).some((key) => [
    'body',
    'cookie',
    'cookies',
    'debug',
    'env',
    'header',
    'headers',
    'provider',
    'query',
    'session',
  ].includes(normalizedKey(key)));
}

function hasReportBoundaryMarker(source) {
  if (!isObject(source)) {
    return false;
  }

  return Object.keys(source).some((key) => [
    'approvecompletionreport',
    'approvefieldservicereport',
    'completionreportid',
    'createcompletionreport',
    'createfieldservicereport',
    'fieldservicereportid',
    'finalappointmentid',
    'formalizereport',
    'publishreport',
  ].includes(normalizedKey(key)));
}

function trustedContextFromActor(actor) {
  return compactRecord({
    engineerId: firstStringValue(actor, ['id', 'engineerId', 'engineer_id', 'userId', 'user_id']),
    organizationId: firstStringValue(actor, ['organizationId', 'organization_id']),
    permissions: stringListValue(isObject(actor) ? actor.permissions : undefined),
  });
}

function assignmentContextFromAppointment(appointment) {
  return compactRecord({
    assignedEngineerId: firstStringValue(appointment, [
      'assignedEngineerId',
      'assigned_engineer_id',
      'engineerId',
      'engineer_id',
    ]),
    organizationId: firstStringValue(appointment, ['organizationId', 'organization_id']),
  });
}

function actionSubjectFromAppointment(appointment) {
  return compactRecord({
    appointmentId: firstStringValue(appointment, ['appointmentId', 'appointment_id', 'id']),
    assignedEngineerId: firstStringValue(appointment, [
      'assignedEngineerId',
      'assigned_engineer_id',
      'engineerId',
      'engineer_id',
    ]),
    caseId: firstStringValue(appointment, ['caseId', 'case_id']),
    organizationId: firstStringValue(appointment, ['organizationId', 'organization_id']),
    appointmentStatus: firstStringValue(appointment, ['appointmentStatus', 'appointment_status']),
    arrivedAt: firstStringValue(appointment, ['arrivedAt', 'arrived_at']),
    arrivalAt: firstStringValue(appointment, ['arrivalAt', 'arrival_at']),
    actualArrivalAt: firstStringValue(appointment, ['actualArrivalAt', 'actual_arrival_at']),
    travelArrivedAt: firstStringValue(appointment, ['travelArrivedAt', 'travel_arrived_at']),
    completedAt: firstStringValue(appointment, ['completedAt', 'completed_at']),
    finishedAt: firstStringValue(appointment, ['finishedAt', 'finished_at']),
    actualEndAt: firstStringValue(appointment, ['actualEndAt', 'actual_end_at']),
    mobileTravelStartedAt: firstStringValue(appointment, [
      'mobileTravelStartedAt',
      'mobile_travel_started_at',
    ]),
    mobileVisitStatus: firstStringValue(appointment, ['mobileVisitStatus', 'mobile_visit_status']),
    mobileWorkFinishedAt: firstStringValue(appointment, [
      'mobileWorkFinishedAt',
      'mobile_work_finished_at',
    ]),
    mobileWorkStartedAt: firstStringValue(appointment, [
      'mobileWorkStartedAt',
      'mobile_work_started_at',
    ]),
    serviceFinishedAt: firstStringValue(appointment, ['serviceFinishedAt', 'service_finished_at']),
    serviceStartedAt: firstStringValue(appointment, ['serviceStartedAt', 'service_started_at']),
    startedWorkAt: firstStringValue(appointment, ['startedWorkAt', 'started_work_at']),
    status: firstStringValue(appointment, ['status']),
    travelStartedAt: firstStringValue(appointment, ['travelStartedAt', 'travel_started_at']),
    visitStatus: firstStringValue(appointment, ['visitStatus', 'visit_status']),
    workFinishedAt: firstStringValue(appointment, ['workFinishedAt', 'work_finished_at']),
    workStartedAt: firstStringValue(appointment, ['workStartedAt', 'work_started_at']),
  });
}

function safeSubject(policyDecision, actor, appointment) {
  const subject = isObject(policyDecision.subject) ? policyDecision.subject : {};
  const transitionIntent = isObject(policyDecision.transitionIntent) ? policyDecision.transitionIntent : {};
  const assignmentReference = isObject(policyDecision.assignmentReference)
    ? policyDecision.assignmentReference
    : {};
  const appointmentReference = isObject(policyDecision.appointmentReference)
    ? policyDecision.appointmentReference
    : {};

  return {
    actorId: stringValue(subject.actorId)
      || stringValue(transitionIntent.actorId)
      || stringValue(assignmentReference.engineerId)
      || firstStringValue(actor, ['id', 'engineerId', 'userId']),
    appointmentId: stringValue(subject.appointmentId)
      || stringValue(transitionIntent.appointmentId)
      || stringValue(appointmentReference.appointmentId)
      || firstStringValue(appointment, ['appointmentId', 'appointment_id', 'id']),
    caseId: stringValue(transitionIntent.caseId)
      || stringValue(appointmentReference.caseId)
      || firstStringValue(appointment, ['caseId', 'case_id']),
    organizationId: stringValue(subject.organizationId)
      || stringValue(transitionIntent.organizationId)
      || stringValue(assignmentReference.organizationId)
      || stringValue(appointmentReference.organizationId)
      || firstStringValue(appointment, ['organizationId', 'organization_id']),
  };
}

function compactRecord(record) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  );
}

function safeSupportedActions(value) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value
    .map((action) => stringValue(action))
    .filter(Boolean);
}

function auditIntentFor({ action, allowed, reasonCode, subject, now, requestId }) {
  return compactRecord({
    type: 'engineer_mobile.visit_action_command_planner_decision',
    plannerKind: ENGINEER_MOBILE_VISIT_ACTION_COMMAND_PLANNER_KIND,
    action: stringValue(action),
    allowed: Boolean(allowed),
    reasonCode: stringValue(reasonCode),
    actorId: subject.actorId,
    appointmentId: subject.appointmentId,
    caseId: subject.caseId,
    organizationId: subject.organizationId,
    requestId: stringValue(requestId),
    occurredAt: stringValue(now),
  });
}

function deniedCommandResult({ policyDecision, actor, appointment, now, requestId }) {
  const subject = safeSubject(policyDecision, actor, appointment);
  const action = stringValue(policyDecision.action);
  const reasonCode = stringValue(policyDecision.reasonCode) || 'denied';
  const safeRequestId = stringValue(requestId);

  return compactRecord({
    ok: false,
    allowed: false,
    plannerKind: ENGINEER_MOBILE_VISIT_ACTION_COMMAND_PLANNER_KIND,
    action,
    reasonCode,
    actorId: subject.actorId,
    appointmentId: subject.appointmentId,
    caseId: subject.caseId,
    organizationId: subject.organizationId,
    requestId: safeRequestId,
    supportedActions: safeSupportedActions(policyDecision.supportedActions),
    auditIntent: auditIntentFor({
      action,
      allowed: false,
      reasonCode,
      subject,
      now,
      requestId: safeRequestId,
    }),
  });
}

function transitionIntentFor({ policyDecision, subject, now, requestId }) {
  const action = stringValue(policyDecision.action);
  const mobileVisitStatus = MOBILE_VISIT_STATUS_BY_ACTION[action];
  const helperTransitionIntent = isObject(policyDecision.transitionIntent)
    ? policyDecision.transitionIntent
    : {};

  return compactRecord({
    kind: ENGINEER_MOBILE_VISIT_ACTION_TRANSITION_INTENT_KIND,
    action,
    actorId: subject.actorId,
    appointmentId: subject.appointmentId,
    caseId: subject.caseId,
    organizationId: subject.organizationId,
    mobileVisitStatus: stringValue(helperTransitionIntent.mobileVisitStatus) || mobileVisitStatus,
    visitResult: stringValue(helperTransitionIntent.visitResult) || stringValue(policyDecision.visitResult),
    requestId: stringValue(requestId),
    plannedAt: stringValue(helperTransitionIntent.plannedAt) || stringValue(now),
  });
}

function allowedCommandResult({ policyDecision, actor, appointment, now, requestId }) {
  const subject = safeSubject(policyDecision, actor, appointment);
  const action = stringValue(policyDecision.action);
  const reasonCode = 'allowed';
  const safeRequestId = stringValue(requestId);

  return compactRecord({
    ok: true,
    allowed: true,
    plannerKind: ENGINEER_MOBILE_VISIT_ACTION_COMMAND_PLANNER_KIND,
    action,
    reasonCode,
    actorId: subject.actorId,
    appointmentId: subject.appointmentId,
    caseId: subject.caseId,
    organizationId: subject.organizationId,
    requestId: safeRequestId,
    transitionIntent: transitionIntentFor({
      policyDecision,
      subject,
      now,
      requestId: safeRequestId,
    }),
    auditIntent: auditIntentFor({
      action,
      allowed: true,
      reasonCode,
      subject,
      now,
      requestId: safeRequestId,
    }),
  });
}

function planEngineerMobileVisitActionCommand(options = {}) {
  const source = isObject(options) ? options : {};
  const actionSubject = actionSubjectFromAppointment(source.appointment);
  const reportBoundaryDetected = hasReportBoundaryMarker(source)
    || hasReportBoundaryMarker(source.actor)
    || hasReportBoundaryMarker(source.appointment);
  const policyDecision = decideEngineerMobileVisitAction({
    action: source.action,
    trustedContext: trustedContextFromActor(source.actor),
    assignmentContext: assignmentContextFromAppointment(source.appointment),
    actionSubject: reportBoundaryDetected
      ? {
        ...actionSubject,
        publishReport: 'blocked',
      }
      : actionSubject,
    now: source.now,
    visitResult: source.visitResult,
    requestId: source.requestId,
    ...(hasUnsafeRequestContainer(source) ? { body: {} } : {}),
  });

  if (!policyDecision || policyDecision.allowed !== true) {
    return deniedCommandResult({
      policyDecision: isObject(policyDecision) ? policyDecision : {},
      actor: source.actor,
      appointment: source.appointment,
      now: source.now,
      requestId: source.requestId,
    });
  }

  return allowedCommandResult({
    policyDecision,
    actor: source.actor,
    appointment: source.appointment,
    now: source.now,
    requestId: source.requestId,
  });
}

module.exports = {
  planEngineerMobileVisitActionCommand,
  ENGINEER_MOBILE_VISIT_ACTION_COMMAND_PLANNER_KIND,
};
