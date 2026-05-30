'use strict';

const {
  evaluateEngineerMobileVisitAction,
} = require('./engineerMobileVisitActionPolicyRegistry');

const ACTION_ALIASES = Object.freeze({
  arrive: 'engineer_mobile.arrive',
  'engineer_mobile.arrive': 'engineer_mobile.arrive',
  finish_work: 'engineer_mobile.finish_work',
  'engineer_mobile.finish_work': 'engineer_mobile.finish_work',
  record_visit_result: 'engineer_mobile.record_visit_result',
  'engineer_mobile.record_visit_result': 'engineer_mobile.record_visit_result',
  start_travel: 'engineer_mobile.start_travel',
  'engineer_mobile.start_travel': 'engineer_mobile.start_travel',
  start_work: 'engineer_mobile.start_work',
  'engineer_mobile.start_work': 'engineer_mobile.start_work',
});

const ACTION_PERMISSIONS = Object.freeze({
  'engineer_mobile.arrive': 'engineer_mobile.visit.arrive',
  'engineer_mobile.finish_work': 'engineer_mobile.visit.finish_work',
  'engineer_mobile.record_visit_result': 'engineer_mobile.visit.record_result',
  'engineer_mobile.start_travel': 'engineer_mobile.visit.start_travel',
  'engineer_mobile.start_work': 'engineer_mobile.visit.start_work',
});

const ACTION_TRANSITION_STATUSES = Object.freeze({
  'engineer_mobile.arrive': 'arrived',
  'engineer_mobile.finish_work': 'work_finished',
  'engineer_mobile.record_visit_result': 'visit_result_recorded',
  'engineer_mobile.start_travel': 'traveling',
  'engineer_mobile.start_work': 'working',
});

const SAFE_APPOINTMENT_STATE_FIELDS = Object.freeze([
  'appointmentStatus',
  'appointment_status',
  'arrivedAt',
  'arrived_at',
  'arrivalAt',
  'arrival_at',
  'actualArrivalAt',
  'actual_arrival_at',
  'travelArrivedAt',
  'travel_arrived_at',
  'completedAt',
  'completed_at',
  'finishedAt',
  'finished_at',
  'actualEndAt',
  'actual_end_at',
  'mobileTravelStartedAt',
  'mobile_travel_started_at',
  'mobileVisitStatus',
  'mobile_visit_status',
  'mobileWorkFinishedAt',
  'mobile_work_finished_at',
  'mobileWorkStartedAt',
  'mobile_work_started_at',
  'serviceFinishedAt',
  'service_finished_at',
  'serviceStartedAt',
  'service_started_at',
  'startedWorkAt',
  'started_work_at',
  'status',
  'travelStartedAt',
  'travel_started_at',
  'visitStatus',
  'visit_status',
  'workFinishedAt',
  'work_finished_at',
  'workStartedAt',
  'work_started_at',
]);

const UNSAFE_CONTAINER_KEYS = Object.freeze([
  'body',
  'query',
  'header',
  'headers',
  'cookie',
  'cookies',
  'session',
  'provider',
  'debug',
  'env',
]);

const UNSAFE_FIELD_MARKERS = Object.freeze([
  'audit',
  'billing',
  'completionreport',
  'debug',
  'fieldservicereport',
  'finalappointment',
  'invoice',
  'password',
  'payment',
  'provider',
  'raw',
  'report',
  'secret',
  'settlement',
  'token',
  'vector',
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

function normalizedKey(value) {
  return String(value || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function readString(source, keys) {
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

function readStringList(source, keys) {
  if (!isObject(source)) {
    return [];
  }

  for (const key of keys) {
    const value = source[key];

    if (Array.isArray(value)) {
      return value.map(stringValue).filter(Boolean);
    }
  }

  return [];
}

function firstObject(...values) {
  return values.find(isObject) || {};
}

function normalizeAction(value) {
  const action = stringValue(value);

  return action ? ACTION_ALIASES[action] : undefined;
}

function hasUnsafeContainer(source) {
  if (!isObject(source)) {
    return false;
  }

  return Object.keys(source).some((key) => UNSAFE_CONTAINER_KEYS.includes(normalizedKey(key)));
}

function hasUnsafeField(source) {
  if (!isObject(source)) {
    return false;
  }

  return Object.keys(source).some((key) => {
    const normalized = normalizedKey(key);
    return UNSAFE_FIELD_MARKERS.some((marker) => normalized.includes(marker));
  });
}

function deny(action, reasonCode) {
  return compactRecord({
    allowed: false,
    status: 'ineligible',
    reasonCode,
    action,
  });
}

function normalizePolicyReason(reasonCode) {
  return {
    actor_required: 'invalid_context',
    already_arrived: 'invalid_state',
    already_finished: 'invalid_state',
    already_working: 'invalid_state',
    appointment_not_open: 'invalid_state',
    appointment_required: 'invalid_subject',
    arrival_required: 'invalid_state',
    completion_report_boundary: 'report_boundary',
    final_appointment_boundary: 'report_boundary',
    invalid_visit_result: 'invalid_visit_result',
    not_assigned_engineer: 'not_assigned',
    organization_mismatch: 'cross_scope',
    permission_required: 'unauthorized',
    terminal_visit_result: 'invalid_state',
    travel_not_started: 'invalid_state',
    unsupported_action: 'unsupported_action',
    visit_result_already_recorded: 'invalid_state',
    work_not_finished: 'invalid_state',
    work_not_started: 'invalid_state',
  }[reasonCode] || 'ineligible';
}

function sameValue(values) {
  const presentValues = values.filter(Boolean);

  return presentValues.length <= 1 || presentValues.every((value) => value === presentValues[0]);
}

function pickAppointmentState(subject) {
  const state = {};

  for (const field of SAFE_APPOINTMENT_STATE_FIELDS) {
    const value = stringValue(subject[field]);

    if (value !== undefined) {
      state[field] = value;
    }
  }

  return state;
}

function buildTransitionIntent({
  action,
  actorId,
  appointmentId,
  caseId,
  organizationId,
  now,
  requestId,
  visitResult,
}) {
  return compactRecord({
    action,
    actorId,
    appointmentId,
    caseId,
    organizationId,
    mobileVisitStatus: ACTION_TRANSITION_STATUSES[action],
    visitResult: action === 'engineer_mobile.record_visit_result' ? visitResult : undefined,
    requestId,
    plannedAt: stringValue(now),
  });
}

function decideEngineerMobileVisitAction(input = {}) {
  const source = isObject(input) ? input : {};
  const action = normalizeAction(source.action);

  if (!action) {
    return deny(undefined, 'unsupported_action');
  }

  if (hasUnsafeContainer(source)) {
    return deny(action, 'invalid_context');
  }

  const permissionContext = firstObject(
    source.trustedContext,
    source.permissionContext,
    source.auth,
    source.context,
  );
  const assignmentContext = firstObject(
    source.assignmentContext,
    source.assignment,
    source.taskScope,
    source.task,
  );
  const actionSubject = firstObject(
    source.actionSubject,
    source.appointmentState,
    source.appointment,
  );

  if (
    hasUnsafeField(permissionContext)
    || hasUnsafeField(assignmentContext)
    || hasUnsafeField(actionSubject)
  ) {
    return deny(action, 'report_boundary');
  }

  const actorId = readString(permissionContext, ['engineerId', 'engineer_id', 'actorId', 'actor_id', 'id', 'userId', 'user_id']);
  const actorOrganizationId = readString(permissionContext, ['organizationId', 'organization_id']);
  const permissions = readStringList(permissionContext, ['permissions', 'scopes']);
  const assignedEngineerId = readString(assignmentContext, ['assignedEngineerId', 'assigned_engineer_id', 'engineerId', 'engineer_id']);
  const assignmentOrganizationId = readString(assignmentContext, ['organizationId', 'organization_id']);
  const subjectOrganizationId = readString(actionSubject, ['organizationId', 'organization_id']);
  const subjectAssignedEngineerId = readString(actionSubject, ['assignedEngineerId', 'assigned_engineer_id', 'engineerId', 'engineer_id']);
  const appointmentId = readString(actionSubject, ['appointmentId', 'appointment_id', 'id']);
  const caseId = readString(actionSubject, ['caseId', 'case_id']);
  const visitResult = stringValue(source.visitResult);

  if (!actorId || !actorOrganizationId || permissions.length === 0) {
    return deny(action, 'invalid_context');
  }

  if (!assignedEngineerId || !assignmentOrganizationId) {
    return deny(action, 'invalid_assignment');
  }

  if (!appointmentId || !subjectOrganizationId) {
    return deny(action, 'invalid_subject');
  }

  if (!sameValue([actorOrganizationId, assignmentOrganizationId, subjectOrganizationId])) {
    return deny(action, 'cross_scope');
  }

  if (!sameValue([actorId, assignedEngineerId, subjectAssignedEngineerId])) {
    return deny(action, 'not_assigned');
  }

  const actor = {
    id: actorId,
    engineerId: actorId,
    organizationId: actorOrganizationId,
    permissions,
  };
  const appointment = {
    ...pickAppointmentState(actionSubject),
    appointmentId,
    caseId,
    organizationId: subjectOrganizationId,
    assignedEngineerId,
  };
  const policyDecision = evaluateEngineerMobileVisitAction({
    action,
    actor,
    appointment,
    now: source.now,
    visitResult,
  });

  if (!policyDecision.allowed) {
    return deny(action, normalizePolicyReason(policyDecision.reasonCode));
  }

  return compactRecord({
    allowed: true,
    status: 'allowed',
    reasonCode: 'allowed',
    action,
    assignmentReference: {
      engineerId: actorId,
      organizationId: actorOrganizationId,
    },
    appointmentReference: compactRecord({
      appointmentId,
      caseId,
      organizationId: subjectOrganizationId,
    }),
    transitionIntent: buildTransitionIntent({
      action,
      actorId,
      appointmentId,
      caseId,
      organizationId: subjectOrganizationId,
      now: source.now,
      requestId: stringValue(source.requestId),
      visitResult: policyDecision.visitResult,
    }),
  });
}

module.exports = {
  ACTION_ALIASES,
  decideEngineerMobileVisitAction,
};
