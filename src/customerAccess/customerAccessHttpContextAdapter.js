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

function emptyRequestLikeInput() {
  return {
    organizationId: undefined,
    caseId: undefined,
    customerId: undefined,
    isCustomerIdentityVerified: false,
    isCaseLinkedToCustomer: false,
    isPublicationAllowed: false,
    isCustomerVisiblePolicyPassed: false,
    organizationScopeMatches: false,
    channelIdentityPresent: false,
    scopedChannelIdentityPresent: false,
    customerVisibleData: {},
  };
}

function stringValue(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function mapCustomerAccessHttpContext(input) {
  if (!isObject(input)) {
    return emptyRequestLikeInput();
  }

  const params = isObject(input.params) ? input.params : {};
  const auth = isObject(input.auth) ? input.auth : {};
  const channel = isObject(input.channel) ? input.channel : {};
  const access = isObject(input.access) ? input.access : {};
  const organizationId = stringValue(auth.organizationId);
  const caseId = stringValue(params.caseId);
  const customerId = stringValue(auth.customerId);
  const lineChannelId = stringValue(channel.lineChannelId);
  const lineUserId = stringValue(channel.lineUserId);

  return {
    organizationId,
    caseId,
    customerId,
    isCustomerIdentityVerified: auth.customerIdentityVerified === true,
    isCaseLinkedToCustomer: Boolean(caseId) && access.caseLinkedToCustomer === true,
    isPublicationAllowed: access.publicationAllowed === true,
    isCustomerVisiblePolicyPassed: access.customerVisiblePolicyPassed === true,
    organizationScopeMatches: access.organizationScopeMatched === true,
    channelIdentityPresent: Boolean(lineChannelId && lineUserId),
    scopedChannelIdentityPresent: Boolean(organizationId && lineChannelId && lineUserId),
    customerVisibleData: sanitizeCustomerVisibleData(
      isObject(input.customerVisibleData) ? input.customerVisibleData : {},
    ),
  };
}

module.exports = {
  mapCustomerAccessHttpContext,
};
