'use strict';

const ENGINEER_MOBILE_VISIT_ACTION_HTTP_REQUEST_NORMALIZER_KIND = 'engineer_mobile.visit_action_http_request_normalizer';

const SAFE_ACTOR_KEYS = Object.freeze([
  'id',
  'engineerId',
  'userId',
  'organizationId',
  'organization_id',
]);

const SAFE_APPOINTMENT_KEYS = Object.freeze([
  'appointmentId',
  'appointment_id',
  'id',
  'caseId',
  'case_id',
  'organizationId',
  'organization_id',
  'assignedEngineerId',
  'assigned_engineer_id',
  'engineerId',
  'engineer_id',
  'status',
  'appointmentStatus',
  'appointment_status',
  'mobileVisitStatus',
  'mobile_visit_status',
  'visitStatus',
  'visit_status',
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
  'travelStartedAt',
  'travel_started_at',
  'mobileTravelStartedAt',
  'mobile_travel_started_at',
  'arrivedAt',
  'arrived_at',
  'arrivalAt',
  'arrival_at',
  'actualArrivalAt',
  'actual_arrival_at',
  'travelArrivedAt',
  'travel_arrived_at',
  'workStartedAt',
  'work_started_at',
  'startedWorkAt',
  'started_work_at',
  'serviceStartedAt',
  'service_started_at',
  'mobileWorkStartedAt',
  'mobile_work_started_at',
  'workFinishedAt',
  'work_finished_at',
  'finishedWorkAt',
  'finished_work_at',
  'serviceFinishedAt',
  'service_finished_at',
  'mobileWorkFinishedAt',
  'mobile_work_finished_at',
  'finishedAt',
  'finished_at',
  'completedAt',
  'completed_at',
  'actualEndAt',
  'actual_end_at',
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

function clonePlain(value) {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value));
}

function safeStringArray(value) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const items = value.map((item) => stringValue(item)).filter(Boolean);
  return items.length > 0 ? items : undefined;
}

function pickSafeObject(source, keys) {
  if (!isObject(source)) {
    return undefined;
  }

  const picked = {};

  for (const key of keys) {
    if (source[key] !== undefined) {
      picked[key] = clonePlain(source[key]);
    }
  }

  return Object.keys(picked).length > 0 ? picked : undefined;
}

function safeActor(actor) {
  const picked = pickSafeObject(actor, SAFE_ACTOR_KEYS);

  if (!picked) {
    return undefined;
  }

  const permissions = safeStringArray(actor.permissions);

  if (permissions) {
    picked.permissions = permissions;
  }

  return picked;
}

function safeAppointment(appointment) {
  return pickSafeObject(appointment, SAFE_APPOINTMENT_KEYS);
}

function requestBody(request) {
  return isObject(request.body) ? request.body : {};
}

function requestParams(request) {
  return isObject(request.params) ? request.params : {};
}

function firstString(...values) {
  for (const value of values) {
    const text = stringValue(value);

    if (text) {
      return text;
    }
  }

  return undefined;
}

function appointmentIdFromAppointment(appointment) {
  if (!isObject(appointment)) {
    return undefined;
  }

  return firstString(appointment.appointmentId, appointment.appointment_id, appointment.id);
}

function failure(reasonCode, extra = {}) {
  return compactRecord({
    ok: false,
    normalized: false,
    normalizerKind: ENGINEER_MOBILE_VISIT_ACTION_HTTP_REQUEST_NORMALIZER_KIND,
    reasonCode,
    ...extra,
  });
}

function normalizeEngineerMobileVisitActionHttpRequest(input) {
  if (input !== undefined && input !== null && !isObject(input)) {
    return failure('request_required');
  }

  const request = isObject(input) ? input : {};
  const body = requestBody(request);
  const params = requestParams(request);
  const rawAppointment = body.appointment !== undefined ? body.appointment : request.appointment;
  const paramAppointmentId = stringValue(params.appointmentId);
  const bodyAppointmentId = appointmentIdFromAppointment(rawAppointment);
  const requestId = firstString(request.requestId, request.id, body.requestId, body.id);

  if (paramAppointmentId && bodyAppointmentId && paramAppointmentId !== bodyAppointmentId) {
    return failure('appointment_id_mismatch', { requestId });
  }

  return compactRecord({
    ok: true,
    normalized: true,
    normalizerKind: ENGINEER_MOBILE_VISIT_ACTION_HTTP_REQUEST_NORMALIZER_KIND,
    action: firstString(params.action, body.action, request.action),
    actor: safeActor(request.actor || body.actor),
    appointment: safeAppointment(rawAppointment),
    visitResult: firstString(body.visitResult, request.visitResult),
    now: firstString(request.now, body.now),
    requestId,
    appointmentId: firstString(paramAppointmentId, bodyAppointmentId),
  });
}

module.exports = {
  normalizeEngineerMobileVisitActionHttpRequest,
  ENGINEER_MOBILE_VISIT_ACTION_HTTP_REQUEST_NORMALIZER_KIND,
};
