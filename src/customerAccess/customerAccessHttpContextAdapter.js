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

function isPlainObject(value) {
  if (!isObject(value)) {
    return false;
  }

  if (
    value instanceof Date ||
    value instanceof Error ||
    (typeof Buffer !== 'undefined' && Buffer.isBuffer(value))
  ) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function safeProperty(value, key) {
  try {
    return value ? value[key] : undefined;
  } catch (error) {
    return undefined;
  }
}

function sanitizeCustomerVisibleData(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeCustomerVisibleData);
  }

  if (!isPlainObject(value)) {
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
  const caseId = stringValue(safeProperty(input, 'caseId'));
  const customerAccessContext = safeProperty(input, 'customerAccessContext');

  if (!caseId || !isPlainObject(customerAccessContext)) {
    return undefined;
  }

  const params = safeProperty(customerAccessContext, 'params');

  if (!isPlainObject(params) || stringValue(safeProperty(params, 'caseId')) !== caseId) {
    return undefined;
  }

  return {
    params: {
      caseId,
    },
    auth: isPlainObject(safeProperty(customerAccessContext, 'auth'))
      ? safeProperty(customerAccessContext, 'auth')
      : {},
    channel: isPlainObject(safeProperty(customerAccessContext, 'channel'))
      ? safeProperty(customerAccessContext, 'channel')
      : {},
    access: isPlainObject(safeProperty(customerAccessContext, 'access'))
      ? safeProperty(customerAccessContext, 'access')
      : {},
    customerVisibleData: isPlainObject(safeProperty(customerAccessContext, 'customerVisibleData'))
      ? safeProperty(customerAccessContext, 'customerVisibleData')
      : {},
  };
}

function mapCustomerAccessHttpContext(input) {
  if (!isPlainObject(input)) {
    return emptyRequestLikeInput();
  }

  const context = contextFromInput(input);
  const params = isPlainObject(safeProperty(context, 'params')) ? safeProperty(context, 'params') : {};
  const auth = isPlainObject(safeProperty(context, 'auth')) ? safeProperty(context, 'auth') : {};
  const channel = isPlainObject(safeProperty(context, 'channel')) ? safeProperty(context, 'channel') : {};
  const access = isPlainObject(safeProperty(context, 'access')) ? safeProperty(context, 'access') : {};
  const organizationId = stringValue(safeProperty(auth, 'organizationId'));
  const caseId = stringValue(safeProperty(params, 'caseId'));
  const customerId = stringValue(safeProperty(auth, 'customerId'));
  const lineChannelId = stringValue(safeProperty(channel, 'lineChannelId'));
  const lineUserId = stringValue(safeProperty(channel, 'lineUserId'));

  return {
    organizationId,
    caseId,
    customerId,
    isCustomerIdentityVerified: safeProperty(auth, 'customerIdentityVerified') === true,
    isCaseLinkedToCustomer: Boolean(caseId) && safeProperty(access, 'caseLinkedToCustomer') === true,
    isPublicationAllowed: safeProperty(access, 'publicationAllowed') === true,
    isCustomerVisiblePolicyPassed: safeProperty(access, 'customerVisiblePolicyPassed') === true,
    organizationScopeMatches: safeProperty(access, 'organizationScopeMatched') === true,
    channelIdentityPresent: Boolean(lineChannelId && lineUserId),
    scopedChannelIdentityPresent: Boolean(organizationId && lineChannelId && lineUserId),
    customerVisibleData: sanitizeCustomerVisibleData(
      isPlainObject(safeProperty(context, 'customerVisibleData'))
        ? safeProperty(context, 'customerVisibleData')
        : {},
    ),
  };
}

module.exports = {
  mapCustomerAccessHttpContext,
};
