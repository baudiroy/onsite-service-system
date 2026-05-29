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
const SAFE_ALLOW_MESSAGE_KEY = 'customerAccess.available';
const CUSTOMER_VISIBLE_CASE_NO_SOURCE_KEY = 'caseNo';
const CUSTOMER_VISIBLE_FINAL_APPOINTMENT_ID_SOURCE_KEY = 'finalAppointmentId';
const CUSTOMER_VISIBLE_PUBLIC_REPORT_ID_SOURCE_KEY = 'publicReportId';
const SERVICE_REPORT_BASE_RESPONSE_KEYS = Object.freeze([
  CUSTOMER_VISIBLE_CASE_NO_SOURCE_KEY,
  CUSTOMER_VISIBLE_FINAL_APPOINTMENT_ID_SOURCE_KEY,
  CUSTOMER_VISIBLE_PUBLIC_REPORT_ID_SOURCE_KEY,
]);
const CUSTOMER_VISIBLE_STATUS_SOURCE_KEY = 'status';
const CUSTOMER_VISIBLE_SUMMARY_SOURCE_KEY = 'summary';
const SERVICE_REPORT_RESPONSE_KEYS = Object.freeze([
  ...SERVICE_REPORT_BASE_RESPONSE_KEYS,
  CUSTOMER_VISIBLE_STATUS_SOURCE_KEY,
  CUSTOMER_VISIBLE_SUMMARY_SOURCE_KEY,
]);

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

function isThenable(value) {
  return Boolean(value) && typeof safeProperty(value, 'then') === 'function';
}

function isPlainEnvelopeObject(value) {
  if (!isPlainObject(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function plainEnvelopeObjectOrEmpty(value) {
  return isPlainEnvelopeObject(value) ? value : {};
}

function safeDenyEnvelope() {
  return {
    status: SAFE_DENY_ENVELOPE.status,
    messageKey: SAFE_DENY_ENVELOPE.messageKey,
    customerVisible: SAFE_DENY_ENVELOPE.customerVisible,
    data: SAFE_DENY_ENVELOPE.data,
    error: {
      messageKey: SAFE_DENY_ENVELOPE.error.messageKey,
    },
  };
}

function isUnsafeDisplayString(value) {
  return /(?:['"`;=]|--|\/\*|\*\/|\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bunion\b|\bbearer\b|\bauthorization\b|\bcookie\b|\bset-cookie\b|\btoken\b|\bjwt\b|\bapi[-_ ]?key\b|\bheader\b|\bstack\b|\bat\s+\w+\s*\()/i
    .test(value);
}

function isSafeDisplayValue(value) {
  if (value === null || ['number', 'boolean'].includes(typeof value)) {
    return true;
  }

  return typeof value === 'string' && !isUnsafeDisplayString(value);
}

function assignSafeDisplayValue(target, key, value) {
  if (isSafeDisplayValue(value)) {
    target[key] = value;
  }
}

function customerVisibleCaseNoValue(candidate) {
  return safeProperty(candidate, CUSTOMER_VISIBLE_CASE_NO_SOURCE_KEY);
}

function customerVisibleFinalAppointmentIdValue(candidate) {
  return safeProperty(candidate, CUSTOMER_VISIBLE_FINAL_APPOINTMENT_ID_SOURCE_KEY);
}

function customerVisiblePublicReportIdValue(candidate) {
  return safeProperty(candidate, CUSTOMER_VISIBLE_PUBLIC_REPORT_ID_SOURCE_KEY);
}

function customerVisibleStatusValue(candidate) {
  return safeProperty(candidate, CUSTOMER_VISIBLE_STATUS_SOURCE_KEY);
}

function customerVisibleSummaryValue(candidate) {
  return safeProperty(candidate, CUSTOMER_VISIBLE_SUMMARY_SOURCE_KEY);
}

function allowlistedServiceReport(candidate) {
  if (!isPlainEnvelopeObject(candidate)) {
    return undefined;
  }

  const serviceReport = {};

  assignSafeDisplayValue(
    serviceReport,
    CUSTOMER_VISIBLE_CASE_NO_SOURCE_KEY,
    customerVisibleCaseNoValue(candidate),
  );
  assignSafeDisplayValue(
    serviceReport,
    CUSTOMER_VISIBLE_FINAL_APPOINTMENT_ID_SOURCE_KEY,
    customerVisibleFinalAppointmentIdValue(candidate),
  );
  assignSafeDisplayValue(
    serviceReport,
    CUSTOMER_VISIBLE_PUBLIC_REPORT_ID_SOURCE_KEY,
    customerVisiblePublicReportIdValue(candidate),
  );

  assignSafeDisplayValue(
    serviceReport,
    CUSTOMER_VISIBLE_STATUS_SOURCE_KEY,
    customerVisibleStatusValue(candidate),
  );
  assignSafeDisplayValue(
    serviceReport,
    CUSTOMER_VISIBLE_SUMMARY_SOURCE_KEY,
    customerVisibleSummaryValue(candidate),
  );

  return serviceReport;
}

function safeAllowEnvelopeFromFacadeResult(facadeResult) {
  if (!isPlainEnvelopeObject(facadeResult)) {
    return safeDenyEnvelope();
  }

  if (
    safeProperty(facadeResult, 'status') !== 'allow' ||
    safeProperty(facadeResult, 'messageKey') !== SAFE_ALLOW_MESSAGE_KEY ||
    safeProperty(facadeResult, 'customerVisible') !== true
  ) {
    return safeDenyEnvelope();
  }

  const data = safeProperty(facadeResult, 'data');

  if (!isPlainEnvelopeObject(data)) {
    return safeDenyEnvelope();
  }

  const serviceReport = allowlistedServiceReport(safeProperty(data, 'serviceReport'));

  if (!serviceReport) {
    return safeDenyEnvelope();
  }

  return {
    status: 'allow',
    messageKey: SAFE_ALLOW_MESSAGE_KEY,
    customerVisible: true,
    data: {
      serviceReport,
    },
  };
}

function safeEnvelopeFromFacadeResult(facadeResult) {
  if (isThenable(facadeResult)) {
    try {
      facadeResult.catch(() => undefined);
    } catch (error) {
      // Ignore thenable catch failures; the customer response remains safe-deny.
    }

    return safeDenyEnvelope();
  }

  if (isPlainEnvelopeObject(facadeResult) && safeProperty(facadeResult, 'status') === 'allow') {
    return safeAllowEnvelopeFromFacadeResult(facadeResult);
  }

  return safeDenyEnvelope();
}

function sanitizedCustomerAccessContextFromRequest(request, caseId) {
  const context = safeProperty(request, 'customerAccessContext');

  if (!isPlainEnvelopeObject(context)) {
    return undefined;
  }

  const contextParams = plainEnvelopeObjectOrEmpty(safeProperty(context, 'params'));
  const contextCaseId = safeIdentifierValue(safeProperty(contextParams, 'caseId'));

  if (!contextCaseId || contextCaseId !== caseId) {
    return undefined;
  }

  return {
    params: {
      caseId,
    },
    auth: plainEnvelopeObjectOrEmpty(safeProperty(context, 'auth')),
    channel: plainEnvelopeObjectOrEmpty(safeProperty(context, 'channel')),
    access: plainEnvelopeObjectOrEmpty(safeProperty(context, 'access')),
    customerVisibleData: plainEnvelopeObjectOrEmpty(safeProperty(context, 'customerVisibleData')),
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
    return undefined;
  }

  return {
    caseId,
    customerAccessContext,
  };
}

function buildCustomerAccessControllerResponse(req, options) {
  return buildCustomerAccessControllerResponseWithOptions(req, options);
}

function buildCustomerAccessControllerResponseWithOptions(req, options) {
  const facade = isPlainObject(options) && typeof safeProperty(options, 'buildCustomerAccessHttpResponse') === 'function'
    ? safeProperty(options, 'buildCustomerAccessHttpResponse')
    : buildCustomerAccessHttpResponse;

  try {
    const overviewInput = buildCustomerAccessOverviewInput(req);

    if (!overviewInput) {
      return safeDenyEnvelope();
    }

    const facadeResult = facade(overviewInput);

    return safeEnvelopeFromFacadeResult(facadeResult);
  } catch (error) {
    return safeDenyEnvelope();
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
