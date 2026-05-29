'use strict';

const SAFE_DENY_MESSAGE_KEY = 'customerAccess.unavailable';
const RESOLVED_MESSAGE_KEY = 'customerAccess.context.resolved';

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

function hasMalformedIdentifierValue(...values) {
  return values.some((value) => {
    const candidate = stringValue(value);

    return Boolean(candidate && !safeIdentifier(candidate));
  });
}

function booleanTrue(value) {
  return value === true;
}

function deniedResolution() {
  return {
    resolved: false,
    messageKey: SAFE_DENY_MESSAGE_KEY,
    customerVisible: false,
    customerAccessContext: null,
  };
}

function contextSourcesFromRequest(request) {
  const sources = [];

  if (isObject(request.customerAccessContext)) {
    sources.push(request.customerAccessContext);
  }

  if (isObject(request.syntheticCustomerAccessContext)) {
    sources.push(request.syntheticCustomerAccessContext);
  }

  return sources;
}

function contextOrganizationId(context) {
  return safeIdentifier(context.organizationId)
    || safeIdentifier(context.auth && context.auth.organizationId)
    || safeIdentifier(context.organization && context.organization.organizationId)
    || safeIdentifier(context.organization && context.organization.id);
}

function contextCustomerId(context) {
  return safeIdentifier(context.customerId)
    || safeIdentifier(context.auth && context.auth.customerId)
    || safeIdentifier(context.customerIdentity && context.customerIdentity.customerId)
    || safeIdentifier(context.customer && context.customer.id);
}

function contextCaseId(context) {
  return safeIdentifier(context.caseId)
    || safeIdentifier(context.params && context.params.caseId)
    || safeIdentifier(context.case && context.case.caseId)
    || safeIdentifier(context.case && context.case.id);
}

function contextReportId(context) {
  return safeIdentifier(context.reportId)
    || safeIdentifier(context.params && context.params.reportId)
    || safeIdentifier(context.report && context.report.reportId)
    || safeIdentifier(context.report && context.report.id)
    || safeIdentifier(context.serviceReport && context.serviceReport.reportId);
}

function hasMalformedContextIdentifier(context) {
  return hasMalformedIdentifierValue(
    context.organizationId,
    context.auth && context.auth.organizationId,
    context.organization && context.organization.organizationId,
    context.organization && context.organization.id,
    context.customerId,
    context.auth && context.auth.customerId,
    context.customerIdentity && context.customerIdentity.customerId,
    context.customer && context.customer.id,
    context.caseId,
    context.params && context.params.caseId,
    context.case && context.case.caseId,
    context.case && context.case.id,
    context.reportId,
    context.params && context.params.reportId,
    context.report && context.report.reportId,
    context.report && context.report.id,
    context.serviceReport && context.serviceReport.reportId,
  );
}

function isAuthorizedSyntheticContext(context) {
  const access = isObject(context.access) ? context.access : {};
  const auth = isObject(context.auth) ? context.auth : {};
  const customerIdentity = isObject(context.customerIdentity) ? context.customerIdentity : {};
  const capabilities = isObject(context.capabilities) ? context.capabilities : {};

  if (context.authorized === false || access.authorized === false || capabilities.customerAccess === false) {
    return false;
  }

  const organizationScopeMatched = booleanTrue(context.organizationScopeMatched)
    || booleanTrue(access.organizationScopeMatched)
    || booleanTrue(access.organizationScope)
    || booleanTrue(access.organizationScopeMatches);
  const customerIdentityVerified = booleanTrue(context.customerIdentityVerified)
    || booleanTrue(auth.customerIdentityVerified)
    || booleanTrue(customerIdentity.verified);
  const caseLinkedToCustomer = booleanTrue(context.caseLinkedToCustomer)
    || booleanTrue(access.caseLinkedToCustomer)
    || booleanTrue(access.caseLinkage);
  const publicationAllowed = booleanTrue(context.publicationAllowed)
    || booleanTrue(access.publicationAllowed)
    || booleanTrue(access.publication);
  const customerVisiblePolicyPassed = booleanTrue(context.customerVisiblePolicyPassed)
    || booleanTrue(access.customerVisiblePolicyPassed)
    || booleanTrue(access.customerVisiblePolicy);

  return Boolean(
    contextOrganizationId(context) &&
    contextCustomerId(context) &&
    organizationScopeMatched &&
    customerIdentityVerified &&
    caseLinkedToCustomer &&
    publicationAllowed &&
    customerVisiblePolicyPassed,
  );
}

function buildNormalizedContext(context) {
  const organizationId = contextOrganizationId(context);
  const customerId = contextCustomerId(context);
  const caseId = contextCaseId(context);
  const reportId = contextReportId(context);

  const params = {};

  if (caseId) {
    params.caseId = caseId;
  }

  if (reportId) {
    params.reportId = reportId;
  }

  return {
    organizationId,
    customerId,
    ...(caseId ? { caseId } : {}),
    ...(reportId ? { reportId } : {}),
    params,
    auth: {
      organizationId,
      customerId,
      customerIdentityVerified: true,
    },
    access: {
      organizationScopeMatched: true,
      caseLinkedToCustomer: true,
      publicationAllowed: true,
      customerVisiblePolicyPassed: true,
    },
  };
}

function resolveCustomerAccessContextFromRequest(request) {
  if (!isObject(request)) {
    return deniedResolution();
  }

  const sources = contextSourcesFromRequest(request);

  if (sources.length !== 1) {
    return deniedResolution();
  }

  const [context] = sources;

  if (hasMalformedContextIdentifier(context) || !isAuthorizedSyntheticContext(context)) {
    return deniedResolution();
  }

  return {
    resolved: true,
    messageKey: RESOLVED_MESSAGE_KEY,
    customerVisible: false,
    customerAccessContext: buildNormalizedContext(context),
  };
}

module.exports = {
  resolveCustomerAccessContextFromRequest,
};
