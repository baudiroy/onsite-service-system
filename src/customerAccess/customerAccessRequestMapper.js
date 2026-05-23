'use strict';

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
  'rawAddress',
  'rawLineUserId',
  'rawPhone',
  'secret',
  'settlementInternalData',
  'token',
]);

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
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

function emptyMappedInput() {
  return {
    organizationScope: {
      present: false,
      matches: false,
    },
    customerIdentity: {
      verified: false,
    },
    caseLinkage: {
      linked: false,
    },
    publication: {
      allowed: false,
    },
    customerVisiblePolicy: {
      passed: false,
    },
    customerVisibleData: {},
  };
}

function mapCustomerAccessRequest(input) {
  if (!isObject(input)) {
    return emptyMappedInput();
  }

  const organizationId = typeof input.organizationId === 'string' ? input.organizationId.trim() : '';
  const caseId = typeof input.caseId === 'string' ? input.caseId.trim() : '';
  const customerId = typeof input.customerId === 'string' ? input.customerId.trim() : '';
  const lineChannelId = typeof input.lineChannelId === 'string' ? input.lineChannelId.trim() : '';
  const lineUserId = typeof input.lineUserId === 'string' ? input.lineUserId.trim() : '';
  const sourceData = isObject(input.customerVisibleData)
    ? input.customerVisibleData
    : input.data;

  return {
    organizationScope: {
      organizationId: organizationId || undefined,
      present: Boolean(organizationId),
      matches: input.isOrganizationScopeMatched === true || input.organizationScopeMatches === true,
    },
    customerIdentity: {
      customerId: customerId || undefined,
      verified: input.isCustomerIdentityVerified === true,
      channelIdentityPresent: Boolean(lineChannelId && lineUserId),
      scopedChannelIdentityPresent: Boolean(organizationId && lineChannelId && lineUserId),
    },
    caseLinkage: {
      caseId: caseId || undefined,
      linked: input.isCaseLinkedToCustomer === true,
    },
    publication: {
      allowed: input.isPublicationAllowed === true,
    },
    customerVisiblePolicy: {
      passed: input.isCustomerVisiblePolicyPassed === true,
    },
    customerVisibleData: sanitizeCustomerVisibleData(isObject(sourceData) ? sourceData : {}),
  };
}

module.exports = {
  mapCustomerAccessRequest,
};
