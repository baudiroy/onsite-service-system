'use strict';

const EVENT_TYPES = Object.freeze({
  normalized: 'brand_referral_normalized',
  denied: 'brand_referral_denied',
  malformed: 'brand_referral_malformed',
  unknownSource: 'brand_referral_unknown_source',
});

const EVENT_TYPE_SET = new Set(Object.values(EVENT_TYPES));

const FIELD_ALIASES = Object.freeze({
  organizationId: Object.freeze(['organization_id', 'organizationId']),
  brandId: Object.freeze(['brand_id', 'brandId']),
  sourceChannel: Object.freeze(['source_channel', 'sourceChannel']),
  referralSource: Object.freeze(['referral_source', 'referralSource']),
  entryContext: Object.freeze(['entry_context', 'entryContext']),
  lineChannelId: Object.freeze(['line_channel_id', 'lineChannelId']),
  reasonKey: Object.freeze(['reasonKey', 'reason_key']),
});

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function safeString(value) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.slice(0, 160);
}

function pickFirst(candidates, aliases) {
  for (const candidate of candidates) {
    if (!isPlainObject(candidate)) {
      continue;
    }

    for (const alias of aliases) {
      if (Object.prototype.hasOwnProperty.call(candidate, alias)) {
        const value = safeString(candidate[alias]);
        if (value) {
          return value;
        }
      }
    }
  }

  return undefined;
}

function collectCandidates(input) {
  if (!isPlainObject(input)) {
    return [];
  }

  const body = isPlainObject(input.body) ? input.body : {};
  const referral = isPlainObject(input.referral) ? input.referral : {};
  const bodyReferral = isPlainObject(body.referral) ? body.referral : {};
  const access = isPlainObject(input.access) ? input.access : {};
  const bodyAccess = isPlainObject(body.access) ? body.access : {};

  return [
    input,
    isPlainObject(input.metadata) ? input.metadata : {},
    referral,
    isPlainObject(referral.metadata) ? referral.metadata : {},
    body,
    bodyReferral,
    isPlainObject(bodyReferral.metadata) ? bodyReferral.metadata : {},
    access,
    isPlainObject(access.metadata) ? access.metadata : {},
    bodyAccess,
    isPlainObject(bodyAccess.metadata) ? bodyAccess.metadata : {},
  ];
}

function inferResultStatus(input, options) {
  const explicit = safeString(options.resultStatus);
  if (explicit) {
    return explicit;
  }

  if (!isPlainObject(input)) {
    return 'malformed';
  }

  if (input.ok === true || (isPlainObject(input.body) && input.body.ok === true)) {
    return 'normalized';
  }

  if (input.ok === false || (isPlainObject(input.body) && input.body.ok === false)) {
    return 'denied';
  }

  return 'unknown';
}

function inferEventType(input, options, reasonKey, resultStatus, sourceChannel) {
  const explicit = safeString(options.eventType);
  if (explicit && EVENT_TYPE_SET.has(explicit)) {
    return explicit;
  }

  if (!isPlainObject(input) || resultStatus === 'malformed') {
    return EVENT_TYPES.malformed;
  }

  if (reasonKey === 'unknown_source_fails_safe' || sourceChannel === 'unknown') {
    return EVENT_TYPES.unknownSource;
  }

  if (resultStatus === 'normalized') {
    return EVENT_TYPES.normalized;
  }

  if (resultStatus === 'denied') {
    return EVENT_TYPES.denied;
  }

  return EVENT_TYPES.unknownSource;
}

function buildBrandReferralAuditIntent(input = {}, options = {}) {
  const candidates = collectCandidates(input);
  const organizationId = pickFirst(candidates, FIELD_ALIASES.organizationId);
  const brandId = pickFirst(candidates, FIELD_ALIASES.brandId);
  const sourceChannel = pickFirst(candidates, FIELD_ALIASES.sourceChannel);
  const referralSource = pickFirst(candidates, FIELD_ALIASES.referralSource);
  const entryContext = pickFirst(candidates, FIELD_ALIASES.entryContext);
  const lineChannelId = pickFirst(candidates, FIELD_ALIASES.lineChannelId);
  const reasonKey = pickFirst(candidates, FIELD_ALIASES.reasonKey);
  const resultStatus = inferResultStatus(input, options);
  const eventType = inferEventType(input, options, reasonKey, resultStatus, sourceChannel);
  const timestamp = safeString(options.timestamp);

  return {
    eventType,
    organization_id: organizationId,
    brand_id: brandId,
    source_channel: sourceChannel,
    referral_source: referralSource,
    entry_context: entryContext,
    line_channel_id: lineChannelId,
    reasonKey,
    resultStatus,
    timestamp,
    auditWritten: false,
    contactWritten: false,
  };
}

module.exports = {
  BRAND_REFERRAL_AUDIT_EVENT_TYPES: EVENT_TYPES,
  buildBrandReferralAuditIntent,
};
