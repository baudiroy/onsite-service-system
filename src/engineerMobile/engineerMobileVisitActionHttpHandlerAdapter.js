'use strict';

const HTTP_REQUEST_NORMALIZER_MODULE = './engineerMobileVisitActionHttpRequestNormalizer';
const {
  normalizeEngineerMobileVisitActionHttpRequest,
} = require(HTTP_REQUEST_NORMALIZER_MODULE);

const ENGINEER_MOBILE_VISIT_ACTION_HTTP_HANDLER_ADAPTER_KIND = 'engineer_mobile.visit_action_http_handler_adapter';

const ERROR_CODES = Object.freeze({
  SERVICE_REQUIRED: 'VISIT_ACTION_SERVICE_REQUIRED',
  APPOINTMENT_ID_MISMATCH: 'APPOINTMENT_ID_MISMATCH',
  SERVICE_FAILED: 'VISIT_ACTION_SERVICE_FAILED',
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

function compactRecord(record) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  );
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
    const normalization = normalizeEngineerMobileVisitActionHttpRequest(input);
    const requestId = stringValue(normalization.requestId);

    if (!hasServiceHandler(visitActionService)) {
      return safeErrorResponse(500, ERROR_CODES.SERVICE_REQUIRED, requestId);
    }

    if (normalization.reasonCode === 'appointment_id_mismatch') {
      return safeErrorResponse(400, ERROR_CODES.APPOINTMENT_ID_MISMATCH, requestId);
    }

    if (normalization.ok !== true) {
      return safeErrorResponse(400, stringValue(normalization.reasonCode), requestId);
    }

    try {
      const serviceResult = await visitActionService.handleEngineerMobileVisitAction(
        actionRequestFromNormalization(normalization),
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
