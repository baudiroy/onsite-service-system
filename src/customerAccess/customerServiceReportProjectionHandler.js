'use strict';

const {
  getCustomerServiceReportProjection,
} = require('./customerServiceReportProjectionService');
const { buildCustomerAccessAuditEvent } = require('./customerAccessAuditEventBuilder');
const { writeCustomerAccessAuditEvent } = require('./customerAccessAuditWriterAdapter');
const {
  buildCustomerServiceReportSafeDenyEnvelope,
  buildCustomerServiceReportSafeEnvelope,
} = require('./customerServiceReportSafeEnvelopePresenter');

const SAFE_DENY_MESSAGE_KEY = 'customerAccess.unavailable';
const ALLOW_MESSAGE_KEY = 'customerAccess.serviceReport.available';
const CUSTOMER_ACCESS_SERVICE_REPORT_ROUTE = '/customer-access/:caseId/service-report/:reportId';
const CUSTOMER_ACCESS_SERVICE_REPORT_AUDIT_SOURCE = 'customer_access_projection_service';
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
const SAFE_REPORT_ENVELOPE_KEYS = Object.freeze([
  'ok',
  'status',
  'messageKey',
  ...SERVICE_REPORT_KEYS,
]);
const PUBLIC_ATTACHMENT_KEYS = Object.freeze(['attachmentId', 'label', 'mimeType']);
const SERVICE_INPUT_KEYS = Object.freeze(['caseId', 'customerAccessContext', 'dbClient', 'reportId']);
const CUSTOMER_ACCESS_CONTEXT_KEYS = Object.freeze([
  'caseId',
  'caseLinkedToCustomer',
  'customerId',
  'customerIdentityVerified',
  'customerVisiblePolicyPassed',
  'organizationId',
  'organizationScopeMatched',
  'publicationAllowed',
]);
const SAFE_IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const UNSAFE_IDENTIFIER_PATTERN = /(?:\.\.|['"`;]|--|\/\*|\*\/|\b(?:select|insert|update|delete|drop|union|alter|grant|revoke|authorization|bearer|cookie|token|headers?)\b)/i;

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

function safeIdentifierValue(value) {
  const candidate = stringValue(value);

  if (!candidate) {
    return undefined;
  }

  return SAFE_IDENTIFIER_PATTERN.test(candidate) && !UNSAFE_IDENTIFIER_PATTERN.test(candidate)
    ? candidate
    : undefined;
}

function booleanValue(...values) {
  return values.some((value) => value === true);
}

function safeDenyEnvelope() {
  const safeReportDenyEnvelope = buildCustomerServiceReportSafeDenyEnvelope();
  const messageKey = safeReportDenyEnvelope.status === 'deny' &&
    safeReportDenyEnvelope.messageKey === SAFE_DENY_MESSAGE_KEY
    ? safeReportDenyEnvelope.messageKey
    : SAFE_DENY_MESSAGE_KEY;

  return {
    status: 'deny',
    messageKey,
    customerVisible: false,
    data: null,
    error: {
      messageKey,
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

function isSafeReportEnvelope(envelope) {
  return isPlainObject(envelope) &&
    hasOnlyAllowedKeys(envelope, SAFE_REPORT_ENVELOPE_KEYS) &&
    envelope.ok === true &&
    envelope.status === 'allow' &&
    envelope.messageKey === ALLOW_MESSAGE_KEY;
}

function serviceReportFromSafeEnvelope(envelope) {
  if (!isSafeReportEnvelope(envelope)) {
    return undefined;
  }

  const serviceReport = {};

  for (const key of SERVICE_REPORT_KEYS) {
    if (envelope[key] !== undefined) {
      serviceReport[key] = envelope[key];
    }
  }

  return Object.keys(serviceReport).length > 0 && isSafeServiceReport(serviceReport)
    ? serviceReport
    : undefined;
}

function isAllowEnvelopeCandidate(serviceResult) {
  return serviceResult.status === 'allow' &&
    serviceResult.messageKey === ALLOW_MESSAGE_KEY &&
    serviceResult.customerVisible === true &&
    isPlainObject(serviceResult.data) &&
    hasOnlyAllowedKeys(serviceResult.data, ['serviceReport']);
}

function safeHttpEnvelopeFromServiceResult(serviceResult) {
  if (
    !isPlainObject(serviceResult) ||
    isThenable(serviceResult) ||
    !hasOnlyAllowedKeys(serviceResult, HTTP_ENVELOPE_KEYS)
  ) {
    return safeDenyEnvelope();
  }

  if (isSafeDenyEnvelope(serviceResult)) {
    return safeDenyEnvelope();
  }

  if (isSafeAllowEnvelope(serviceResult) || isAllowEnvelopeCandidate(serviceResult)) {
    const safeReportEnvelope = buildCustomerServiceReportSafeEnvelope(serviceResult);
    const serviceReport = serviceReportFromSafeEnvelope(safeReportEnvelope);

    if (!serviceReport) {
      return safeDenyEnvelope();
    }

    return {
      status: 'allow',
      messageKey: ALLOW_MESSAGE_KEY,
      customerVisible: true,
      data: {
        serviceReport,
      },
    };
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

function sanitizedCustomerAccessContextFromRequest(request) {
  if (!isObject(request.customerAccessContext)) {
    return undefined;
  }

  const context = request.customerAccessContext;
  const access = isObject(context.access) ? context.access : {};
  const auth = isObject(context.auth) ? context.auth : {};
  const customerIdentity = isObject(context.customerIdentity) ? context.customerIdentity : {};
  const contextParams = isObject(context.params) ? context.params : {};
  const organizationId = safeIdentifierValue(context.organizationId) || safeIdentifierValue(auth.organizationId);
  const customerId = safeIdentifierValue(context.customerId) || safeIdentifierValue(auth.customerId);
  const caseId = safeIdentifierValue(context.caseId) || safeIdentifierValue(contextParams.caseId);

  if (!organizationId || !customerId || !caseId) {
    return undefined;
  }

  return {
    organizationId,
    customerId,
    caseId,
    organizationScopeMatched: booleanValue(
      context.organizationScopeMatched,
      access.organizationScopeMatched,
      access.organizationScope,
      access.organizationScopeMatches,
    ),
    customerIdentityVerified: booleanValue(
      context.customerIdentityVerified,
      auth.customerIdentityVerified,
      customerIdentity.verified,
    ),
    caseLinkedToCustomer: booleanValue(
      context.caseLinkedToCustomer,
      access.caseLinkedToCustomer,
      access.caseLinkage,
    ),
    publicationAllowed: booleanValue(
      context.publicationAllowed,
      access.publicationAllowed,
      access.allowed,
    ),
    customerVisiblePolicyPassed: booleanValue(
      context.customerVisiblePolicyPassed,
      access.customerVisiblePolicyPassed,
      access.customerVisiblePolicy,
    ),
  };
}

function buildProjectionServiceInput(options) {
  const request = isObject(options.request) ? options.request : {};
  const params = requestParams(request);
  const caseId = safeIdentifierValue(params.caseId);
  const reportId = safeIdentifierValue(params.reportId);
  const customerAccessContext = sanitizedCustomerAccessContextFromRequest(request);

  if (!caseId || !reportId || !customerAccessContext) {
    return undefined;
  }

  return {
    dbClient: options.dbClient,
    customerAccessContext,
    caseId,
    reportId,
  };
}

async function handleCustomerServiceReportProjectionRequest(options = {}) {
  if (!isObject(options)) {
    return {
      statusCode: 404,
      body: safeDenyEnvelope(),
    };
  }

  const serviceInput = buildProjectionServiceInput(options);

  if (!serviceInput) {
    return {
      statusCode: 404,
      body: safeDenyEnvelope(),
    };
  }

  const projectionService = typeof options.projectionService === 'function'
    ? options.projectionService
    : getCustomerServiceReportProjection;
  let envelope;

  try {
    const serviceResult = await invokeProjectionService(projectionService, serviceInput);
    envelope = safeHttpEnvelopeFromServiceResult(serviceResult);
  } catch (_error) {
    envelope = safeDenyEnvelope();
  }

  recordServiceReportAudit({
    auditWriter: typeof options.auditWriter === 'function' ? options.auditWriter : undefined,
    envelope,
    serviceInput,
  });

  return {
    statusCode: statusCodeForEnvelope(envelope),
    body: envelope,
  };
}

function serviceReportAuditEventType(envelope) {
  return envelope && envelope.status === 'allow'
    ? 'customer_access.service_report.allow'
    : 'customer_access.service_report.deny';
}

function serviceReportAuditInput({ envelope, serviceInput }) {
  const eventType = serviceReportAuditEventType(envelope);
  const context = isObject(serviceInput.customerAccessContext)
    ? serviceInput.customerAccessContext
    : {};
  const auditInput = {
    eventType,
    caseId: safeIdentifierValue(serviceInput.caseId),
    reportId: safeIdentifierValue(serviceInput.reportId),
    organizationId: safeIdentifierValue(context.organizationId),
    customerId: safeIdentifierValue(context.customerId),
    decision: envelope && envelope.status === 'allow' ? 'allow' : 'deny',
    route: CUSTOMER_ACCESS_SERVICE_REPORT_ROUTE,
    method: 'GET',
    source: CUSTOMER_ACCESS_SERVICE_REPORT_AUDIT_SOURCE,
    metadata: {
      routeMatched: true,
      contextPresent: true,
      identifierValid: true,
    },
  };

  if (eventType === 'customer_access.service_report.deny') {
    auditInput.reasonCode = SAFE_DENY_MESSAGE_KEY;
  }

  return auditInput;
}

function recordServiceReportAudit({ auditWriter, envelope, serviceInput }) {
  if (typeof auditWriter !== 'function' || !serviceInput) {
    return;
  }

  const auditEventResult = buildCustomerAccessAuditEvent(serviceReportAuditInput({
    envelope,
    serviceInput,
  }));

  if (!auditEventResult.ok) {
    return;
  }

  writeCustomerAccessAuditEvent({
    auditEvent: auditEventResult.auditEvent,
    writer: auditWriter,
  }).catch(() => undefined);
}

function createCustomerServiceReportProjectionHandler(options = {}) {
  const dbClient = isObject(options) ? options.dbClient : undefined;
  const projectionService = isObject(options) && typeof options.projectionService === 'function'
    ? options.projectionService
    : undefined;
  const auditWriter = isObject(options) && typeof options.auditWriter === 'function'
    ? options.auditWriter
    : undefined;

  return async function handleCustomerServiceReportProjectionHttpRequest(req, res) {
    const response = await handleCustomerServiceReportProjectionRequest({
      request: req,
      dbClient,
      projectionService,
      auditWriter,
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
