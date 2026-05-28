'use strict';

const ENGINEER_MOBILE_VISIT_ACTION_HTTP_HANDLER_ADAPTER_KIND = 'engineer_mobile.visit_action_http_handler_adapter';

const ERROR_CODES = Object.freeze({
  SERVICE_REQUIRED: 'VISIT_ACTION_SERVICE_REQUIRED',
  APPOINTMENT_ID_MISMATCH: 'APPOINTMENT_ID_MISMATCH',
  SERVICE_FAILED: 'VISIT_ACTION_SERVICE_FAILED',
});

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

function appointmentIdMismatch(request) {
  const body = requestBody(request);
  const params = requestParams(request);
  const paramAppointmentId = stringValue(params.appointmentId);
  const bodyAppointment = isObject(body.appointment) ? body.appointment : undefined;
  const bodyAppointmentId = appointmentIdFromAppointment(bodyAppointment);

  return Boolean(paramAppointmentId && bodyAppointmentId && paramAppointmentId !== bodyAppointmentId);
}

function requestIdFrom(request, body) {
  return firstString(
    request.requestId,
    request.id,
    body.requestId,
    body.id,
    request.headers && request.headers['x-request-id'],
  );
}

function actionRequestFrom(request) {
  const body = requestBody(request);
  const actor = safeActor(body.actor || request.actor);
  const appointment = safeAppointment(body.appointment || request.appointment);

  return compactRecord({
    action: stringValue(body.action || request.action),
    actor,
    appointment,
    visitResult: stringValue(body.visitResult || request.visitResult),
    now: stringValue(body.now || request.now),
  });
}

function hasServiceHandler(visitActionService) {
  return isObject(visitActionService)
    && typeof visitActionService.handleEngineerMobileVisitAction === 'function';
}

function safeErrorResponse(statusCode, code, requestId) {
  return {
    statusCode,
    body: compactRecord({
      ok: false,
      accepted: false,
      allowed: false,
      reasonCode: code,
      requestId,
      error: {
        code,
      },
    }),
  };
}

function statusCodeForServiceResult(result) {
  const reasonCode = stringValue(result.reasonCode);

  if (result.ok === true && result.allowed === true) {
    return 202;
  }

  if (reasonCode === 'unsupported_action') {
    return 400;
  }

  if (result.allowed === false) {
    return 403;
  }

  if (
    reasonCode === 'transition_writer_required'
    || reasonCode === 'transition_write_failed'
    || reasonCode === 'audit_write_failed'
  ) {
    return 500;
  }

  return result.ok === false ? 500 : 202;
}

function safeTransition(result) {
  const transitionIntent = isObject(result.transitionIntent) ? result.transitionIntent : {};
  const transition = compactRecord({
    applied: result.transitionApplied === true,
    mobileVisitStatus: stringValue(transitionIntent.mobileVisitStatus),
    visitResult: stringValue(transitionIntent.visitResult),
  });

  return Object.keys(transition).length > 0 ? transition : undefined;
}

function safeAudit(result) {
  if (!('auditRecorded' in result)) {
    return undefined;
  }

  return {
    recorded: result.auditRecorded === true,
  };
}

function safeBodyFromServiceResult(result, requestId) {
  return compactRecord({
    ok: result.ok === true,
    accepted: result.ok === true && result.allowed === true,
    allowed: result.allowed === true,
    action: stringValue(result.action),
    reasonCode: stringValue(result.reasonCode),
    appointmentId: stringValue(result.appointmentId),
    caseId: stringValue(result.caseId),
    organizationId: stringValue(result.organizationId),
    transition: safeTransition(result),
    audit: safeAudit(result),
    requestId,
  });
}

function createEngineerMobileVisitActionHttpHandlerAdapter(options = {}) {
  const source = isObject(options) ? options : {};
  const visitActionService = source.visitActionService;

  async function handleEngineerMobileVisitActionRequest(input) {
    const request = isObject(input) ? input : {};
    const body = requestBody(request);
    const requestId = requestIdFrom(request, body);

    if (!hasServiceHandler(visitActionService)) {
      return safeErrorResponse(500, ERROR_CODES.SERVICE_REQUIRED, requestId);
    }

    if (appointmentIdMismatch(request)) {
      return safeErrorResponse(400, ERROR_CODES.APPOINTMENT_ID_MISMATCH, requestId);
    }

    try {
      const serviceResult = await visitActionService.handleEngineerMobileVisitAction(
        actionRequestFrom(request),
      );
      const result = isObject(serviceResult) ? serviceResult : {};

      return {
        statusCode: statusCodeForServiceResult(result),
        body: safeBodyFromServiceResult(result, requestId),
      };
    } catch (error) {
      return safeErrorResponse(500, ERROR_CODES.SERVICE_FAILED, requestId);
    }
  }

  return {
    kind: ENGINEER_MOBILE_VISIT_ACTION_HTTP_HANDLER_ADAPTER_KIND,
    handleEngineerMobileVisitActionRequest,
  };
}

module.exports = {
  createEngineerMobileVisitActionHttpHandlerAdapter,
  ENGINEER_MOBILE_VISIT_ACTION_HTTP_HANDLER_ADAPTER_KIND,
};
