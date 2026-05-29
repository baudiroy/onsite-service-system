'use strict';

const SAFE_DENY_MESSAGE_KEY = 'customerAccess.unavailable';
const RESOLVED_MESSAGE_KEY = 'customerAccess.identityLink.resolved';

const SUPPORTED_CHANNELS = new Set([
  'app',
  'email',
  'line',
  'line_messaging',
  'sms',
]);

const ACTIVE_LINK_STATES = new Set([
  'active',
  'linked',
  'verified',
]);

const DENIED_LINK_STATES = new Set([
  'ambiguous',
  'disabled',
  'expired',
  'inactive',
  'revoked',
  'unlinked',
]);

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function normalizedValue(value) {
  const candidate = stringValue(value);

  return candidate ? candidate.toLowerCase() : undefined;
}

function safeDeny() {
  return {
    resolved: false,
    status: 'deny',
    messageKey: SAFE_DENY_MESSAGE_KEY,
    customerVisible: false,
  };
}

function resolveAllow({ organizationId, customerId, contactId, provider, channel }) {
  return {
    resolved: true,
    status: 'allow',
    messageKey: RESOLVED_MESSAGE_KEY,
    customerVisible: false,
    organizationId,
    customerId,
    ...(contactId ? { contactId } : {}),
    provider,
    channel,
  };
}

function candidatesFromInput(input) {
  if (!isObject(input)) {
    return [];
  }

  const candidates = [];

  for (const key of [
    'customerIdentityLink',
    'identityLink',
    'linkedIdentity',
  ]) {
    if (isObject(input[key])) {
      candidates.push(input[key]);
    }
  }

  for (const key of [
    'customerIdentityLinks',
    'identityLinks',
    'linkedIdentities',
  ]) {
    if (Array.isArray(input[key])) {
      candidates.push(...input[key].filter(isObject));
    }
  }

  return candidates;
}

function valueFrom(source, ...keys) {
  for (const key of keys) {
    const value = stringValue(source && source[key]);

    if (value) {
      return value;
    }
  }

  return undefined;
}

function expectedValue(input, ...keys) {
  return valueFrom(input, ...keys);
}

function providerFrom(link) {
  const provider = normalizedValue(link.provider)
    || normalizedValue(link.channel)
    || normalizedValue(link.identityProvider)
    || normalizedValue(link.identity_provider);

  if (provider) {
    return provider;
  }

  if (
    valueFrom(link, 'lineChannelId', 'line_channel_id') ||
    valueFrom(link, 'lineUserId', 'line_user_id')
  ) {
    return 'line';
  }

  return undefined;
}

function channelFrom(link, provider) {
  return normalizedValue(link.channel)
    || normalizedValue(link.identityChannel)
    || normalizedValue(link.identity_channel)
    || provider;
}

function linkState(link) {
  return normalizedValue(link.status)
    || normalizedValue(link.state)
    || normalizedValue(link.linkState)
    || normalizedValue(link.link_state);
}

function linkIsDenied(link) {
  const state = linkState(link);

  return link.revoked === true
    || link.disabled === true
    || link.enabled === false
    || link.active === false
    || (state && DENIED_LINK_STATES.has(state));
}

function linkIsActive(link) {
  const state = linkState(link);

  return link.verified === true
    || link.active === true
    || (state && ACTIVE_LINK_STATES.has(state));
}

function valuesMatchOrUnset(expected, actual) {
  return !expected || !actual || expected === actual;
}

function lineIdentifiersAreScoped(link, input) {
  const linkLineChannelId = valueFrom(link, 'lineChannelId', 'line_channel_id');
  const linkLineUserId = valueFrom(link, 'lineUserId', 'line_user_id');
  const expectedLineChannelId = expectedValue(input, 'lineChannelId', 'line_channel_id');
  const expectedLineUserId = expectedValue(input, 'lineUserId', 'line_user_id');

  if (!linkLineChannelId || !linkLineUserId) {
    return false;
  }

  return valuesMatchOrUnset(expectedLineChannelId, linkLineChannelId)
    && valuesMatchOrUnset(expectedLineUserId, linkLineUserId);
}

function resolveCandidate(link, input) {
  const provider = providerFrom(link);
  const channel = channelFrom(link, provider);

  if (!provider || !channel || !SUPPORTED_CHANNELS.has(provider) || !SUPPORTED_CHANNELS.has(channel)) {
    return safeDeny();
  }

  if (linkIsDenied(link) || !linkIsActive(link)) {
    return safeDeny();
  }

  const expectedOrganizationId = expectedValue(input, 'organizationId', 'organization_id');
  const expectedCustomerId = expectedValue(input, 'customerId', 'customer_id');
  const expectedCaseId = expectedValue(input, 'caseId', 'case_id');
  const expectedContactId = expectedValue(input, 'contactId', 'contact_id');

  const organizationId = valueFrom(link, 'organizationId', 'organization_id');
  const customerId = valueFrom(link, 'customerId', 'customer_id');
  const caseId = valueFrom(link, 'caseId', 'case_id');
  const contactId = valueFrom(link, 'contactId', 'contact_id');

  if (!organizationId || !customerId) {
    return safeDeny();
  }

  if (!valuesMatchOrUnset(expectedOrganizationId, organizationId)) {
    return safeDeny();
  }

  if (!valuesMatchOrUnset(expectedCustomerId, customerId)) {
    return safeDeny();
  }

  if (!valuesMatchOrUnset(expectedCaseId, caseId)) {
    return safeDeny();
  }

  if (!valuesMatchOrUnset(expectedContactId, contactId)) {
    return safeDeny();
  }

  if (provider === 'line' && !lineIdentifiersAreScoped(link, input)) {
    return safeDeny();
  }

  return resolveAllow({
    organizationId,
    customerId,
    contactId: contactId || expectedContactId,
    provider,
    channel,
  });
}

function resolveCustomerIdentityLink(input) {
  const candidates = candidatesFromInput(input);

  if (candidates.length !== 1) {
    return safeDeny();
  }

  return resolveCandidate(candidates[0], isObject(input) ? input : {});
}

module.exports = {
  resolveCustomerIdentityLink,
};
