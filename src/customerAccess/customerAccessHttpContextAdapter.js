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
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();

  if (
    !trimmed ||
    trimmed.length > 128 ||
    /(?:['"`;=]|--|\/\*|\*\/|\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bunion\b|\bbearer\b|\bauthorization\b|\bcookie\b|\bset-cookie\b|\btoken\b|\bjwt\b|\bapi[-_ ]?key\b|\bheader\b)/i
      .test(trimmed)
  ) {
    return undefined;
  }

  return /^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(trimmed) ? trimmed : undefined;
}

function contextFromInput(input) {
  if (!isObject(input.customerAccessContext)) {
    return input;
  }

  return {
    params: {
      caseId: input.caseId,
    },
    auth: isObject(input.customerAccessContext.auth) ? input.customerAccessContext.auth : {},
    channel: isObject(input.customerAccessContext.channel) ? input.customerAccessContext.channel : {},
    access: isObject(input.customerAccessContext.access) ? input.customerAccessContext.access : {},
    customerVisibleData: isObject(input.customerAccessContext.customerVisibleData)
      ? input.customerAccessContext.customerVisibleData
      : {},
  };
}

function mapCustomerAccessHttpContext(input) {
  if (!isObject(input)) {
    return emptyRequestLikeInput();
  }

  const context = contextFromInput(input);
  const params = isObject(context.params) ? context.params : {};
  const auth = isObject(context.auth) ? context.auth : {};
  const channel = isObject(context.channel) ? context.channel : {};
  const access = isObject(context.access) ? context.access : {};
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
      isObject(context.customerVisibleData) ? context.customerVisibleData : {},
    ),
  };
}

module.exports = {
  mapCustomerAccessHttpContext,
};
