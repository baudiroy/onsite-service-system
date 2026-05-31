'use strict';

const HTTP_REQUEST_NORMALIZER_MODULE = './engineerMobileVisitActionHttpRequestNormalizer';
const {
  normalizeEngineerMobileVisitActionHttpRequest,
} = require(HTTP_REQUEST_NORMALIZER_MODULE);
const HTTP_RESPONSE_PRESENTER_MODULE = './engineerMobileVisitActionHttpResponsePresenter';
const {
  presentEngineerMobileVisitActionHttpResponse,
} = require(HTTP_RESPONSE_PRESENTER_MODULE);

const ENGINEER_MOBILE_VISIT_ACTION_HTTP_HANDLER_ADAPTER_KIND = 'engineer_mobile.visit_action_http_handler_adapter';

const ERROR_CODES = Object.freeze({
  SERVICE_REQUIRED: 'VISIT_ACTION_SERVICE_REQUIRED',
  APPOINTMENT_ID_MISMATCH: 'APPOINTMENT_ID_MISMATCH',
  SERVICE_INVOCATION_FAILED: 'service_invocation_failed',
});

const SUPPORTED_ACTIONS = Object.freeze([
  'engineer_mobile.start_travel',
  'engineer_mobile.arrive',
  'engineer_mobile.start_work',
  'engineer_mobile.finish_work',
  'engineer_mobile.record_visit_result',
]);

const SUPPORTED_MOBILE_VISIT_STATUSES = Object.freeze([
  'traveling',
  'arrived',
  'working',
  'work_finished',
  'visit_result_recorded',
]);

const SUPPORTED_VISIT_RESULTS = Object.freeze([
  'resolved',
  'follow_up_required',
  'parts_required',
  'cannot_repair',
  'customer_unavailable',
  'cancelled_on_site',
]);

const SAFE_REASON_CODES = Object.freeze([
  'APPOINTMENT_ID_MISMATCH',
  'VISIT_ACTION_SERVICE_REQUIRED',
  'appointment_id_mismatch',
  'appointment_required',
  'audit_event_writer_required',
  'audit_event_write_failed',
  'audit_writer_required',
  'audit_write_failed',
  'cross_scope',
  'denied',
  'ineligible',
  'invalid_assignment',
  'invalid_context',
  'invalid_state',
  'invalid_subject',
  'invalid_visit_result',
  'malformed_decision',
  'malformed_planner_result',
  'malformed_transition_intent',
  'not_assigned',
  'patch_write_failed',
  'patch_writer_required',
  'permission_required',
  'persistence_port_required',
  'persistence_port_write_failed',
  'repository_adapter_required',
  'repository_adapter_write_failed',
  'repository_write_failed',
  'report_boundary',
  'request_required',
  'service_invocation_failed',
  'transition_write_failed',
  'transition_writer_required',
  'unauthorized',
  'unsupported_action',
  'applied',
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

function safeStatusCode(value, fallback) {
  return Number.isInteger(value) && value >= 100 && value <= 599 ? value : fallback;
}

function safeAction(value) {
  const action = stringValue(value);

  return SUPPORTED_ACTIONS.includes(action) ? action : undefined;
}

function safeReasonCode(value, fallback = ERROR_CODES.SERVICE_INVOCATION_FAILED) {
  const reasonCode = stringValue(value);

  return SAFE_REASON_CODES.includes(reasonCode) ? reasonCode : fallback;
}

function safeMobileVisitStatus(value) {
  const mobileVisitStatus = stringValue(value);

  return SUPPORTED_MOBILE_VISIT_STATUSES.includes(mobileVisitStatus)
    ? mobileVisitStatus
    : undefined;
}

function safeVisitResult(value) {
  const visitResult = stringValue(value);

  return SUPPORTED_VISIT_RESULTS.includes(visitResult) ? visitResult : undefined;
}

function hasServiceHandler(visitActionService) {
  return isObject(visitActionService)
    && typeof visitActionService.handleEngineerMobileVisitAction === 'function';
}

function actionRequestFromNormalization(normalization) {
  return compactRecord({
    action: normalization.action,
    actor: normalization.actor,
    appointment: normalization.appointment,
    visitResult: normalization.visitResult,
    now: normalization.now,
    requestId: normalization.requestId,
    appointmentId: normalization.appointmentId,
  });
}

function safeTransitionFromResponseBody(body) {
  const transition = isObject(body.transition) ? body.transition : undefined;

  if (!transition) {
    return undefined;
  }

  return compactRecord({
    applied: transition.applied === true,
    mobileVisitStatus: safeMobileVisitStatus(transition.mobileVisitStatus),
    visitResult: safeVisitResult(transition.visitResult),
  });
}

function safeAuditFromResponseBody(body) {
  const audit = isObject(body.audit) ? body.audit : undefined;

  if (!audit) {
    return undefined;
  }

  return {
    recorded: audit.recorded === true,
  };
}

function safeErrorFromResponseBody(body, reasonCode) {
  if (!isObject(body.error)) {
    return undefined;
  }

  return {
    code: safeReasonCode(body.error.code, reasonCode),
  };
}

function safeHttpResponse(presented, fallback) {
  const response = isObject(presented) ? presented : {};
  const body = isObject(response.body) ? response.body : {};
  const fallbackReasonCode = safeReasonCode(fallback.reasonCode);
  const reasonCode = safeReasonCode(body.reasonCode, fallbackReasonCode);

  return {
    statusCode: safeStatusCode(response.statusCode, fallback.statusCode),
    body: compactRecord({
      ok: body.ok === true,
      accepted: body.accepted === true,
      allowed: body.allowed === true,
      action: safeAction(body.action),
      reasonCode,
      appointmentId: stringValue(body.appointmentId),
      caseId: stringValue(body.caseId),
      organizationId: stringValue(body.organizationId),
      transition: safeTransitionFromResponseBody(body),
      audit: safeAuditFromResponseBody(body),
      requestId: stringValue(body.requestId) || stringValue(fallback.requestId),
      error: safeErrorFromResponseBody(body, reasonCode),
    }),
  };
}

function presentError(statusCode, reasonCode, requestId) {
  const safeReason = safeReasonCode(reasonCode);
  const safeRequestId = stringValue(requestId);
  const presented = presentEngineerMobileVisitActionHttpResponse({
    responseKind: 'error',
    statusCode,
    reasonCode: safeReason,
    requestId: safeRequestId,
  });

  return safeHttpResponse(presented, {
    statusCode,
    reasonCode: safeReason,
    requestId: safeRequestId,
  });
}

function presentServiceResult(serviceResult, requestId) {
  const safeRequestId = stringValue(requestId);
  const presented = presentEngineerMobileVisitActionHttpResponse({
    responseKind: 'service_result',
    serviceResult,
    requestId: safeRequestId,
  });

  return safeHttpResponse(presented, {
    statusCode: 500,
    reasonCode: stringValue(serviceResult.reasonCode),
    requestId: safeRequestId,
  });
}

function createEngineerMobileVisitActionHttpHandlerAdapter(options = {}) {
  const source = isObject(options) ? options : {};
  const visitActionService = source.visitActionService;

  async function handleEngineerMobileVisitActionRequest(input) {
    const normalization = normalizeEngineerMobileVisitActionHttpRequest(input);
    const requestId = stringValue(normalization.requestId);

    if (!hasServiceHandler(visitActionService)) {
      return presentError(500, ERROR_CODES.SERVICE_REQUIRED, requestId);
    }

    if (normalization.reasonCode === 'appointment_id_mismatch') {
      return presentError(400, ERROR_CODES.APPOINTMENT_ID_MISMATCH, requestId);
    }

    if (normalization.ok !== true) {
      return presentError(400, stringValue(normalization.reasonCode), requestId);
    }

    try {
      const serviceResult = await visitActionService.handleEngineerMobileVisitAction(
        actionRequestFromNormalization(normalization),
      );
      if (!isObject(serviceResult)) {
        return presentError(500, ERROR_CODES.SERVICE_INVOCATION_FAILED, requestId);
      }

      return presentServiceResult(serviceResult, requestId);
    } catch (error) {
      return presentError(500, ERROR_CODES.SERVICE_INVOCATION_FAILED, requestId);
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
