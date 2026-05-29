'use strict';

const { resolveCustomerIdentityLink } = require('./customerIdentityLinkResolver');

const FORBIDDEN_KEYS = new Set([
  'address',
  'aiRawPayload',
  'auditLog',
  'billingInternalData',
  'channelSecret',
  'fullAddress',
  'fullPhone',
  'internalBillingData',
  'internalNote',
  'internalSettlementData',
  'lineAccessToken',
  'lineUserId',
  'line_user_id',
  'phone',
  'providerPayload',
  'providerRawPayload',
  'rawAddress',
  'rawLineId',
  'rawLineUserId',
  'rawPhone',
  'secret',
  'settlementInternalData',
  'token',
]);

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

const IDENTITY_LINK_KEYS = Object.freeze([
  'customerIdentityLink',
  'customerIdentityLinks',
  'identityLink',
  'identityLinks',
  'linkedIdentity',
  'linkedIdentities',
]);

function hasIdentityLinkInput(...sources) {
  return sources.some((source) => isObject(source) && IDENTITY_LINK_KEYS.some((key) => (
    isObject(source[key]) || Array.isArray(source[key])
  )));
}

function assignIdentityLinkInput(target, source) {
  if (!isObject(source)) {
    return;
  }

  for (const key of IDENTITY_LINK_KEYS) {
    if (isObject(source[key]) || Array.isArray(source[key])) {
      target[key] = source[key];
    }
  }
}

function identityLinkResolutionFromSources(sources, baseInput) {
  if (!hasIdentityLinkInput(...sources)) {
    return undefined;
  }

  const request = {
    ...baseInput,
  };

  for (const source of sources) {
    assignIdentityLinkInput(request, source);
  }

  return resolveCustomerIdentityLink(request);
}

function sanitizeCustomerVisibleData(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeCustomerVisibleData);
  }

  if (!isObject(value)) {
    return value;
  }

  const sanitized = {};

  for (const [key, childValue] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) {
      continue;
    }

    sanitized[key] = sanitizeCustomerVisibleData(childValue);
  }

  return sanitized;
}

function emptyContext() {
  return {
    params: {},
    auth: {
      customerIdentityVerified: false,
    },
    channel: {},
    access: {
      organizationScopeMatched: false,
      caseLinkedToCustomer: false,
      publicationAllowed: false,
      customerVisiblePolicyPassed: false,
    },
    customerVisibleData: {},
  };
}

const REPOSITORY_METHODS = [
  'getOrganizationScope',
  'getVerifiedCustomerIdentity',
  'getCaseLinkage',
  'getPublicationState',
  'getCustomerVisibleProjection',
];

function hasRepositoryContract(repository) {
  return isObject(repository) && REPOSITORY_METHODS.every((methodName) => (
    typeof repository[methodName] === 'function'
  ));
}

function safeRepositoryCall(repository, methodName, input) {
  try {
    const result = repository[methodName](input);

    return isObject(result) ? result : undefined;
  } catch (error) {
    return undefined;
  }
}

function buildCustomerAccessContextFromRepository(input, repository) {
  if (!hasRepositoryContract(repository)) {
    return emptyContext();
  }

  const organizationScope = safeRepositoryCall(repository, 'getOrganizationScope', input);
  const customerIdentity = safeRepositoryCall(repository, 'getVerifiedCustomerIdentity', input);
  const caseLinkage = safeRepositoryCall(repository, 'getCaseLinkage', input);
  const publication = safeRepositoryCall(repository, 'getPublicationState', input);
  const projection = safeRepositoryCall(repository, 'getCustomerVisibleProjection', input);

  if (!organizationScope || !customerIdentity || !caseLinkage || !publication || !projection) {
    return emptyContext();
  }

  const organizationId = stringValue(organizationScope.organizationId) || stringValue(input.organizationId);
  const caseId = stringValue(caseLinkage.caseId) || stringValue(input.caseId);
  const rawCustomerId = stringValue(customerIdentity.customerId);
  const lineChannelId = stringValue(input.lineChannelId) || stringValue(customerIdentity.lineChannelId);
  const lineUserId = stringValue(input.lineUserId) || stringValue(customerIdentity.lineUserId);
  const contactId = stringValue(input.contactId) || stringValue(customerIdentity.contactId);
  const identityLinkResolution = identityLinkResolutionFromSources([customerIdentity, input], {
    organizationId,
    customerId: rawCustomerId,
    caseId,
    contactId,
    lineChannelId,
    lineUserId,
  });
  const customerId = identityLinkResolution && identityLinkResolution.resolved
    ? identityLinkResolution.customerId
    : rawCustomerId;
  const organizationScopeMatched = organizationScope.matched === true
    || organizationScope.organizationScopeMatched === true;
  const customerIdentityVerified = Boolean(customerId && (
    identityLinkResolution
      ? identityLinkResolution.resolved === true
      : customerIdentity.verified === true || customerIdentity.customerIdentityVerified === true
  ));
  const caseLinkedToCustomer = Boolean(
    customerIdentityVerified && (caseLinkage.linked === true || caseLinkage.caseLinkedToCustomer === true),
  );
  const publicationAllowed = Boolean(
    caseLinkedToCustomer && (publication.allowed === true || publication.publicationAllowed === true),
  );
  const projectionAvailable = projection.available === true;
  const customerVisiblePolicyPassed = Boolean(
    publicationAllowed && (
      publication.customerVisiblePolicyPassed === true ||
      projection.customerVisiblePolicyPassed === true ||
      projectionAvailable
    ),
  );
  const hasScopedChannelIdentity = Boolean(organizationId && lineChannelId && lineUserId);
  const sourceData = isObject(projection.data)
    ? projection.data
    : projection.customerVisibleData;

  if (!organizationId || !caseId || !organizationScopeMatched) {
    return emptyContext();
  }

  if (!customerIdentityVerified || !caseLinkedToCustomer || !publicationAllowed) {
    return emptyContext();
  }

  return {
    params: {
      ...(caseId ? { caseId } : {}),
    },
    auth: {
      ...(organizationId ? { organizationId } : {}),
      ...(customerId ? { customerId } : {}),
      customerIdentityVerified,
    },
    channel: {
      ...(hasScopedChannelIdentity ? { lineChannelId, lineUserId } : {}),
    },
    access: {
      organizationScopeMatched: Boolean(organizationId && caseId && organizationScopeMatched),
      caseLinkedToCustomer,
      publicationAllowed,
      customerVisiblePolicyPassed,
    },
    customerVisibleData: customerVisiblePolicyPassed
      ? sanitizeCustomerVisibleData(isObject(sourceData) ? sourceData : {})
      : {},
  };
}

function buildCustomerAccessContext(input, options) {
  const repository = isObject(options) ? options.repository : undefined;

  if (repository) {
    return buildCustomerAccessContextFromRepository(isObject(input) ? input : {}, repository);
  }

  if (!isObject(input)) {
    return emptyContext();
  }

  const organizationId = stringValue(input.organizationId);
  const caseId = stringValue(input.caseId);
  const lineChannelId = stringValue(input.lineChannelId);
  const lineUserId = stringValue(input.lineUserId);
  const contactId = stringValue(input.contactId);
  const rawCustomerId = stringValue(input.customerId);
  const identityLinkResolution = identityLinkResolutionFromSources([input], {
    organizationId,
    customerId: rawCustomerId,
    caseId,
    contactId,
    lineChannelId,
    lineUserId,
  });
  const customerId = identityLinkResolution && identityLinkResolution.resolved
    ? identityLinkResolution.customerId
    : rawCustomerId;
  const organizationScopeMatched = Boolean(organizationId && caseId);
  const customerIdentityVerified = Boolean(customerId && (
    identityLinkResolution
      ? identityLinkResolution.resolved === true
      : input.customerIdentityVerified === true
  ));
  const caseLinkedToCustomer = Boolean(customerIdentityVerified && input.caseLinkedToCustomer === true);
  const publicationAllowed = Boolean(caseLinkedToCustomer && input.publicationAllowed === true);
  const customerVisiblePolicyPassed = Boolean(
    publicationAllowed && input.customerVisiblePolicyPassed === true,
  );
  const hasScopedChannelIdentity = Boolean(organizationId && lineChannelId && lineUserId);

  return {
    params: {
      ...(caseId ? { caseId } : {}),
    },
    auth: {
      ...(organizationId ? { organizationId } : {}),
      ...(customerId ? { customerId } : {}),
      customerIdentityVerified,
    },
    channel: {
      ...(hasScopedChannelIdentity ? { lineChannelId, lineUserId } : {}),
    },
    access: {
      organizationScopeMatched,
      caseLinkedToCustomer,
      publicationAllowed,
      customerVisiblePolicyPassed,
    },
    customerVisibleData: sanitizeCustomerVisibleData(
      isObject(input.customerVisibleData) ? input.customerVisibleData : {},
    ),
  };
}

module.exports = {
  buildCustomerAccessContext,
};
