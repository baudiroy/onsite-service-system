'use strict';

const { buildCustomerAccessHttpResponse } = require('../customerAccess/customerAccessHttpFacade');

const SAFE_DENY_ENVELOPE = Object.freeze({
  status: 'deny',
  messageKey: 'customerAccess.unavailable',
  customerVisible: false,
  data: null,
  error: Object.freeze({
    messageKey: 'customerAccess.unavailable',
  }),
});

function isPlainObject(value) {
  return Boolean(value)
    && typeof value === 'object'
    && !Array.isArray(value)
    && !(value instanceof Date)
    && !(value instanceof Error)
    && !(typeof Buffer !== 'undefined' && Buffer.isBuffer(value));
}

function safeProperty(value, key) {
  try {
    return value ? value[key] : undefined;
  } catch (error) {
    return undefined;
  }
}

function isSuspiciousIdentifier(value) {
  return /(?:['"`;=]|--|\/\*|\*\/|\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bunion\b|\bbearer\b|\bauthorization\b|\bcookie\b|\bset-cookie\b|\btoken\b|\bjwt\b|\bapi[-_ ]?key\b|\bheader\b)/i
    .test(value);
}

function safeIdentifierValue(value) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();

  if (!trimmed || trimmed.length > 128 || isSuspiciousIdentifier(trimmed)) {
    return undefined;
  }

  return /^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(trimmed) ? trimmed : undefined;
}

function objectOrEmpty(value) {
  return isPlainObject(value) ? value : {};
}

function sanitizedCustomerAccessContextFromRequest(request, caseId) {
  const context = safeProperty(request, 'customerAccessContext');

  if (!isPlainObject(context)) {
    return undefined;
  }

  const contextParams = objectOrEmpty(safeProperty(context, 'params'));
  const contextCaseId = safeIdentifierValue(safeProperty(contextParams, 'caseId'));

  if (!contextCaseId || contextCaseId !== caseId) {
    return undefined;
  }

  return {
    params: {
      caseId,
    },
    auth: objectOrEmpty(safeProperty(context, 'auth')),
    channel: objectOrEmpty(safeProperty(context, 'channel')),
    access: objectOrEmpty(safeProperty(context, 'access')),
    customerVisibleData: objectOrEmpty(safeProperty(context, 'customerVisibleData')),
  };
}

function buildCustomerAccessOverviewInput(req) {
  const request = isPlainObject(req) ? req : {};
  const routeParams = safeProperty(request, 'customerAccessRouteParams');
  const params = isPlainObject(routeParams)
    ? routeParams
    : objectOrEmpty(safeProperty(request, 'params'));
  const caseId = safeIdentifierValue(safeProperty(params, 'caseId'));
  const customerAccessContext = caseId
    ? sanitizedCustomerAccessContextFromRequest(request, caseId)
    : undefined;

  if (!caseId || !customerAccessContext) {
    return {};
  }

  return {
    caseId,
    customerAccessContext,
  };
}

function buildCustomerAccessControllerResponse(req) {
  try {
    return buildCustomerAccessHttpResponse(buildCustomerAccessOverviewInput(req));
  } catch (error) {
    return SAFE_DENY_ENVELOPE;
  }
}

function statusCodeForEnvelope(envelope) {
  return envelope && envelope.status === 'allow' ? 200 : 404;
}

function handleCustomerAccessRequest(req, res) {
  const envelope = buildCustomerAccessControllerResponse(req);
  const statusCode = statusCodeForEnvelope(envelope);

  return res.status(statusCode).json(envelope);
}

module.exports = {
  buildCustomerAccessControllerResponse,
  handleCustomerAccessRequest,
};
