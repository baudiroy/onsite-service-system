'use strict';

const AUDIT_EVENT_TYPE = 'customerServiceReport.access';

const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9:_-]{1,127}$/;

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function safeIdentifier(value) {
  const candidate = stringValue(value);

  return candidate && SAFE_ID_PATTERN.test(candidate) ? candidate : undefined;
}

function booleanValue(value) {
  return value === true || value === false ? value : undefined;
}

function objectOrEmpty(value) {
  return isObject(value) ? value : {};
}

function requestParams(request) {
  return objectOrEmpty(request.params);
}

function requestAccess(request) {
  return objectOrEmpty(request.access);
}

function requestContext(request) {
  return objectOrEmpty(request.customerAccessContext);
}

function contextAuth(context) {
  return objectOrEmpty(context.auth);
}

function contextAccess(context) {
  return objectOrEmpty(context.access);
}

function identifierFrom(...values) {
  for (const value of values) {
    const identifier = safeIdentifier(value);

    if (identifier) {
      return identifier;
    }
  }

  return undefined;
}

function responseEnvelope(input) {
  const response = isObject(input.response) ? input.response : {};
  const body = isObject(input.responseBody) ? input.responseBody : response.body;

  return isObject(body) ? body : {};
}

function safeDecisionMetadata(input) {
  const envelope = responseEnvelope(input);
  const request = objectOrEmpty(input.request);
  const access = requestAccess(request);
  const context = requestContext(request);
  const contextAccessValue = contextAccess(context);

  return {
    status: stringValue(envelope.status) || 'deny',
    messageKey: stringValue(envelope.messageKey) || 'customerAccess.unavailable',
    customerVisible: booleanValue(envelope.customerVisible) === true,
    publicationAllowed: booleanValue(access.publicationAllowed)
      ?? booleanValue(contextAccessValue.publicationAllowed),
    customerVisiblePolicyPassed: booleanValue(access.customerVisiblePolicyPassed)
      ?? booleanValue(contextAccessValue.customerVisiblePolicyPassed),
  };
}

function buildCustomerServiceReportAuditEvent(input = {}) {
  const request = objectOrEmpty(input.request);
  const params = requestParams(request);
  const context = requestContext(request);
  const auth = contextAuth(context);
  const decision = safeDecisionMetadata(input);
  const organizationId = identifierFrom(
    auth.organizationId,
    context.organizationId,
    request.auth && request.auth.organizationId,
  );
  const customerId = identifierFrom(
    auth.customerId,
    context.customerId,
    request.auth && request.auth.customerId,
  );
  const caseId = identifierFrom(params.caseId, context.caseId, context.params && context.params.caseId);
  const reportId = identifierFrom(params.reportId, context.reportId, context.params && context.params.reportId);
  const customerAccessContextId = identifierFrom(
    context.customerAccessContextId,
    context.accessContextId,
    context.contextId,
  );
  const customerIdentityLinkId = identifierFrom(
    context.customerIdentityLinkId,
    context.identityLinkId,
    context.customerIdentity && context.customerIdentity.linkId,
  );
  const requestId = identifierFrom(request.requestId, context.requestId, input.requestId);
  const occurredAt = stringValue(input.occurredAt);
  const event = {
    eventType: AUDIT_EVENT_TYPE,
    action: 'customer_service_report_access',
    outcome: decision.status === 'allow' ? 'allow' : 'deny',
    decision,
  };

  for (const [key, value] of Object.entries({
    organizationId,
    customerId,
    caseId,
    reportId,
    customerAccessContextId,
    customerIdentityLinkId,
    requestId,
    occurredAt,
  })) {
    if (value) {
      event[key] = value;
    }
  }

  return event;
}

async function recordCustomerServiceReportAuditEvent(input = {}) {
  const auditWriter = isObject(input) ? input.auditWriter : undefined;
  const event = buildCustomerServiceReportAuditEvent(input);

  if (typeof auditWriter !== 'function') {
    return {
      event,
      written: false,
      skipped: true,
    };
  }

  try {
    await auditWriter(event);

    return {
      event,
      written: true,
      skipped: false,
    };
  } catch (error) {
    return {
      event,
      written: false,
      skipped: false,
      failed: true,
    };
  }
}

module.exports = {
  AUDIT_EVENT_TYPE,
  buildCustomerServiceReportAuditEvent,
  recordCustomerServiceReportAuditEvent,
};
