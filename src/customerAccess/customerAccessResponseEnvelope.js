'use strict';

const DENY_MESSAGE_KEY = 'customerAccess.unavailable';
const ALLOW_MESSAGE_KEY = 'customerAccess.available';

const FORBIDDEN_KEYS = new Set([
  'address',
  'aiRawPayload',
  'auditLog',
  'billingInternalData',
  'channelSecret',
  'customerExists',
  'fullAddress',
  'fullPhone',
  'identityMismatchReason',
  'internalBillingData',
  'internalNote',
  'internalReason',
  'internalReasonCode',
  'internalSettlementData',
  'lineAccessToken',
  'lineUserId',
  'line_user_id',
  'organizationMismatchReason',
  'permissionDetails',
  'phone',
  'publicationInternalReason',
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

function isForbiddenKey(key) {
  return FORBIDDEN_KEYS.has(key);
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
    if (isForbiddenKey(key)) {
      continue;
    }

    sanitized[key] = sanitizeCustomerVisibleData(childValue);
  }

  return sanitized;
}

function buildCustomerAccessDenyEnvelope() {
  return {
    status: 'deny',
    messageKey: DENY_MESSAGE_KEY,
    customerVisible: false,
    data: null,
    error: {
      messageKey: DENY_MESSAGE_KEY,
    },
  };
}

function buildCustomerAccessAllowEnvelope(input) {
  if (!isObject(input)) {
    return buildCustomerAccessDenyEnvelope();
  }

  const data = input.data || input.customerVisibleData;

  if (!isObject(data)) {
    return buildCustomerAccessDenyEnvelope();
  }

  return {
    status: 'allow',
    messageKey: ALLOW_MESSAGE_KEY,
    customerVisible: true,
    data: sanitizeCustomerVisibleData(data),
  };
}

function buildCustomerAccessEnvelope(input) {
  if (!isObject(input)) {
    return buildCustomerAccessDenyEnvelope();
  }

  const decision = input.decision || input;

  if (!decision || decision.allowed !== true) {
    return buildCustomerAccessDenyEnvelope();
  }

  return buildCustomerAccessAllowEnvelope(input);
}

module.exports = {
  buildCustomerAccessAllowEnvelope,
  buildCustomerAccessDenyEnvelope,
  buildCustomerAccessEnvelope,
};
