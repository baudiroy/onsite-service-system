'use strict';

const GENERIC_DENY_MESSAGE_KEY = 'customerAccess.unavailable';
const ALLOW_MESSAGE_KEY = 'customerAccess.allowed';

function safeDeny(internalReasonCode) {
  return {
    allowed: false,
    status: 'deny',
    messageKey: GENERIC_DENY_MESSAGE_KEY,
    customerVisible: false,
    internalReasonCode,
  };
}

function allow() {
  return {
    allowed: true,
    status: 'allow',
    messageKey: ALLOW_MESSAGE_KEY,
    customerVisible: true,
  };
}

function valueAt(input, key, fallbackKey) {
  if (Object.prototype.hasOwnProperty.call(input, key)) {
    return input[key];
  }

  if (fallbackKey && Object.prototype.hasOwnProperty.call(input, fallbackKey)) {
    return input[fallbackKey];
  }

  return undefined;
}

function organizationScopePasses(input) {
  if (input.organizationScope === true) {
    return true;
  }

  if (!input.organizationScope || typeof input.organizationScope !== 'object') {
    return input.organizationScopeValid === true;
  }

  return input.organizationScope.present === true && input.organizationScope.matches === true;
}

function customerIdentityVerified(input) {
  if (input.customerIdentity === true) {
    return true;
  }

  if (!input.customerIdentity || typeof input.customerIdentity !== 'object') {
    return input.customerIdentityVerified === true;
  }

  return input.customerIdentity.verified === true;
}

function caseLinkagePasses(input) {
  if (input.caseLinkage === true) {
    return true;
  }

  if (!input.caseLinkage || typeof input.caseLinkage !== 'object') {
    return input.caseLinkedToCustomer === true;
  }

  return input.caseLinkage.linked === true;
}

function publicationAllowed(input) {
  if (input.publication === true) {
    return true;
  }

  if (!input.publication || typeof input.publication !== 'object') {
    return input.publicationAllowed === true;
  }

  return input.publication.allowed === true;
}

function customerVisiblePolicyPasses(input) {
  if (input.customerVisiblePolicy === true) {
    return true;
  }

  if (!input.customerVisiblePolicy || typeof input.customerVisiblePolicy !== 'object') {
    return input.customerVisiblePolicyPass === true;
  }

  return input.customerVisiblePolicy.passed === true;
}

function hasRawIdentifier(input, key) {
  const value = valueAt(input, key);
  return typeof value === 'string' && value.trim().length > 0;
}

function hasScopedChannelOnly(input) {
  const channel = input.channelIdentity || {};
  const organizationId = channel.organizationId || channel.organization_id || input.organization_id;
  const lineChannelId = channel.lineChannelId || channel.line_channel_id || input.line_channel_id;
  const lineUserId = channel.lineUserId || channel.line_user_id || input.line_user_id;

  return Boolean(organizationId && lineChannelId && lineUserId);
}

function resolveCustomerAccess(input) {
  if (!input || typeof input !== 'object') {
    return safeDeny('MISSING_INPUT');
  }

  if (!organizationScopePasses(input)) {
    return safeDeny('MISSING_ORGANIZATION_SCOPE');
  }

  if (!customerIdentityVerified(input)) {
    if (hasRawIdentifier(input, 'rawPhone') || hasRawIdentifier(input, 'phone')) {
      return safeDeny('RAW_PHONE_ONLY');
    }

    if (hasRawIdentifier(input, 'rawAddress') || hasRawIdentifier(input, 'address')) {
      return safeDeny('RAW_ADDRESS_ONLY');
    }

    if (hasScopedChannelOnly(input)) {
      return safeDeny('SCOPED_CHANNEL_IDENTITY_ONLY');
    }

    if (
      hasRawIdentifier(input, 'rawLineUserId') ||
      hasRawIdentifier(input, 'lineUserId') ||
      hasRawIdentifier(input, 'line_user_id')
    ) {
      return safeDeny('LINE_ID_ONLY');
    }

    return safeDeny('UNVERIFIED_CUSTOMER_IDENTITY');
  }

  if (!caseLinkagePasses(input)) {
    return safeDeny('MISSING_CASE_LINKAGE');
  }

  if (!publicationAllowed(input)) {
    return safeDeny('PUBLICATION_NOT_ALLOWED');
  }

  if (!customerVisiblePolicyPasses(input)) {
    return safeDeny('CUSTOMER_VISIBLE_POLICY_FAILED');
  }

  return allow();
}

module.exports = {
  resolveCustomerAccess,
};
