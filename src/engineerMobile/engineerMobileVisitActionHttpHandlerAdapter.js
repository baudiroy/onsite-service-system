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

function presentError(statusCode, reasonCode, requestId) {
  return presentEngineerMobileVisitActionHttpResponse({
    responseKind: 'error',
    statusCode,
    reasonCode,
    requestId,
  });
}

function presentServiceResult(serviceResult, requestId) {
  return presentEngineerMobileVisitActionHttpResponse({
    responseKind: 'service_result',
    serviceResult,
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
      const result = isObject(serviceResult) ? serviceResult : {};

      return presentServiceResult(result, requestId);
    } catch (error) {
      return presentError(500, ERROR_CODES.SERVICE_FAILED, requestId);
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
