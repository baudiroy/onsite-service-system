'use strict';

const {
  getCustomerServiceReportProjection,
} = require('./customerServiceReportProjectionService');

const SAFE_DENY_MESSAGE_KEY = 'customerAccess.unavailable';
const ALLOW_MESSAGE_KEY = 'customerAccess.serviceReport.available';
const HTTP_ENVELOPE_KEYS = Object.freeze(['customerVisible', 'data', 'error', 'messageKey', 'status']);
const SERVICE_REPORT_KEYS = Object.freeze([
  'appointmentWindow',
  'caseReference',
  'completionTime',
  'customerReportReference',
  'engineerDisplayName',
  'publicAttachments',
  'serviceStatus',
  'serviceSummary',
]);
const PUBLIC_ATTACHMENT_KEYS = Object.freeze(['attachmentId', 'label', 'mimeType']);

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isPlainObject(value) {
  if (!isObject(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function isThenable(value) {
  return Boolean(value) && typeof value.then === 'function';
}

function isNativePromise(value) {
  return value instanceof Promise || Object.prototype.toString.call(value) === '[object Promise]';
}

function stringValue(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function safeDenyEnvelope() {
  return {
    status: 'deny',
    messageKey: SAFE_DENY_MESSAGE_KEY,
    customerVisible: false,
    data: null,
    error: {
      messageKey: SAFE_DENY_MESSAGE_KEY,
    },
  };
}

function statusCodeForEnvelope(envelope) {
  return envelope && envelope.status === 'allow' ? 200 : 404;
}

function hasOnlyAllowedKeys(candidate, allowedKeys) {
  return Object.keys(candidate).every((key) => allowedKeys.includes(key));
}

function isSafeStringOrAbsent(value) {
  return value === undefined || (typeof value === 'string' && value.trim().length > 0);
}

function isSafePublicAttachment(candidate) {
  if (!isPlainObject(candidate) || !hasOnlyAllowedKeys(candidate, PUBLIC_ATTACHMENT_KEYS)) {
    return false;
  }

  return PUBLIC_ATTACHMENT_KEYS.every((key) => isSafeStringOrAbsent(candidate[key]));
}

function isSafeServiceReport(candidate) {
  if (!isPlainObject(candidate) || !hasOnlyAllowedKeys(candidate, SERVICE_REPORT_KEYS)) {
    return false;
  }

  for (const key of SERVICE_REPORT_KEYS) {
    if (key === 'publicAttachments') {
      if (
        candidate.publicAttachments !== undefined &&
        (
          !Array.isArray(candidate.publicAttachments) ||
          !candidate.publicAttachments.every(isSafePublicAttachment)
        )
      ) {
        return false;
      }
      continue;
    }

    if (!isSafeStringOrAbsent(candidate[key])) {
      return false;
    }
  }

  return true;
}

function isSafeDenyEnvelope(envelope) {
  return envelope.status === 'deny' &&
    envelope.messageKey === SAFE_DENY_MESSAGE_KEY &&
    envelope.customerVisible === false &&
    envelope.data === null &&
    isPlainObject(envelope.error) &&
    hasOnlyAllowedKeys(envelope.error, ['messageKey']) &&
    envelope.error.messageKey === SAFE_DENY_MESSAGE_KEY;
}

function isSafeAllowEnvelope(envelope) {
  return envelope.status === 'allow' &&
    envelope.messageKey === ALLOW_MESSAGE_KEY &&
    envelope.customerVisible === true &&
    isPlainObject(envelope.data) &&
    hasOnlyAllowedKeys(envelope.data, ['serviceReport']) &&
    isSafeServiceReport(envelope.data.serviceReport) &&
    envelope.error === undefined;
}

function safeHttpEnvelopeFromServiceResult(serviceResult) {
  if (
    !isPlainObject(serviceResult) ||
    isThenable(serviceResult) ||
    !hasOnlyAllowedKeys(serviceResult, HTTP_ENVELOPE_KEYS)
  ) {
    return safeDenyEnvelope();
  }

  if (isSafeDenyEnvelope(serviceResult) || isSafeAllowEnvelope(serviceResult)) {
    return serviceResult;
  }

  return safeDenyEnvelope();
}

async function invokeProjectionService(projectionService, input) {
  const result = projectionService(input);

  if (isNativePromise(result)) {
    return result;
  }

  if (isThenable(result)) {
    return undefined;
  }

  return result;
}

function requestParams(request) {
  return isObject(request.params) ? request.params : {};
}

function customerAccessContextFromRequest(request) {
  return isObject(request.customerAccessContext) ? request.customerAccessContext : undefined;
}

async function handleCustomerServiceReportProjectionRequest(options = {}) {
  if (!isObject(options)) {
    return {
      statusCode: 404,
      body: safeDenyEnvelope(),
    };
  }

  const request = isObject(options.request) ? options.request : {};
  const params = requestParams(request);
  const projectionService = typeof options.projectionService === 'function'
    ? options.projectionService
    : getCustomerServiceReportProjection;
  let envelope;

  try {
    const serviceResult = await invokeProjectionService(projectionService, {
      dbClient: options.dbClient,
      customerAccessContext: customerAccessContextFromRequest(request),
      caseId: stringValue(params.caseId),
      reportId: stringValue(params.reportId),
    });
    envelope = safeHttpEnvelopeFromServiceResult(serviceResult);
  } catch (_error) {
    envelope = safeDenyEnvelope();
  }

  return {
    statusCode: statusCodeForEnvelope(envelope),
    body: envelope,
  };
}

function createCustomerServiceReportProjectionHandler(options = {}) {
  const dbClient = isObject(options) ? options.dbClient : undefined;
  const projectionService = isObject(options) && typeof options.projectionService === 'function'
    ? options.projectionService
    : undefined;

  return async function handleCustomerServiceReportProjectionHttpRequest(req, res) {
    const response = await handleCustomerServiceReportProjectionRequest({
      request: req,
      dbClient,
      projectionService,
    });

    if (res && typeof res.status === 'function' && typeof res.json === 'function') {
      return res.status(response.statusCode).json(response.body);
    }

    return response;
  };
}

module.exports = {
  createCustomerServiceReportProjectionHandler,
  handleCustomerServiceReportProjectionRequest,
};
