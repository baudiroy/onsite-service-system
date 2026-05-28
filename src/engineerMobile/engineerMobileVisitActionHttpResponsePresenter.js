'use strict';

const ENGINEER_MOBILE_VISIT_ACTION_HTTP_RESPONSE_PRESENTER_KIND = 'engineer_mobile.visit_action_http_response_presenter';

const ERROR_RESPONSE_KIND = 'error';
const SERVICE_RESULT_RESPONSE_KIND = 'service_result';

const SERVER_FAILURE_REASON_CODES = Object.freeze([
  'service_invocation_failed',
  'transition_writer_required',
  'transition_write_failed',
  'patch_writer_required',
  'patch_write_failed',
  'audit_writer_required',
  'audit_write_failed',
  'audit_event_writer_required',
  'audit_event_write_failed',
  'persistence_port_required',
  'persistence_port_write_failed',
  'repository_adapter_required',
  'repository_adapter_write_failed',
  'repository_write_failed',
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

  if (SERVER_FAILURE_REASON_CODES.includes(reasonCode)) {
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

function presentServiceResult(source) {
  const serviceResult = isObject(source.serviceResult) ? source.serviceResult : {};
  const requestId = stringValue(source.requestId);

  return {
    statusCode: statusCodeForServiceResult(serviceResult),
    body: safeBodyFromServiceResult(serviceResult, requestId),
  };
}

function presentError(source) {
  return safeErrorResponse(
    safeStatusCode(source.statusCode, 500),
    stringValue(source.reasonCode),
    stringValue(source.requestId),
  );
}

function presentEngineerMobileVisitActionHttpResponse(input = {}) {
  const source = isObject(input) ? input : {};
  const responseKind = stringValue(source.responseKind) || SERVICE_RESULT_RESPONSE_KIND;

  if (responseKind === ERROR_RESPONSE_KIND) {
    return presentError(source);
  }

  return presentServiceResult(source);
}

module.exports = {
  presentEngineerMobileVisitActionHttpResponse,
  ENGINEER_MOBILE_VISIT_ACTION_HTTP_RESPONSE_PRESENTER_KIND,
};
