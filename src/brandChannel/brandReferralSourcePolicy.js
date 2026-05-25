'use strict';

const SOURCE_CHANNELS = Object.freeze([
  'brand_line',
  'brand_website',
  'platform_line',
  'platform_web',
  'sms',
  'manual',
  'unknown',
]);

const SOURCE_CHANNEL_SET = new Set(SOURCE_CHANNELS);

const SAFE_ENTRY_CONTEXT_KEYS = Object.freeze([
  'entry_link_id',
  'entry_point',
  'campaign',
  'utm_source',
  'utm_medium',
]);

const SAFE_VALUE_PATTERN = /^[a-zA-Z0-9_.:/@ -]+$/;

function normalizeSafeString(value, { maxLength = 120, lower = false } = {}) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength || !SAFE_VALUE_PATTERN.test(trimmed)) {
    return null;
  }

  return lower ? trimmed.toLowerCase() : trimmed;
}

function normalizeIdentifier(value) {
  return normalizeSafeString(value, { maxLength: 80 });
}

function normalizeSourceChannel(value) {
  const normalized = normalizeSafeString(value, { maxLength: 40, lower: true });
  if (!normalized || !SOURCE_CHANNEL_SET.has(normalized)) {
    return 'unknown';
  }
  return normalized;
}

function normalizeEntryContext(entryContext) {
  if (!entryContext || typeof entryContext !== 'object' || Array.isArray(entryContext)) {
    return {};
  }

  return SAFE_ENTRY_CONTEXT_KEYS.reduce((safeContext, key) => {
    const normalized = normalizeSafeString(entryContext[key], { maxLength: 120 });
    if (normalized) {
      safeContext[key] = normalized;
    }
    return safeContext;
  }, {});
}

function buildLineScope(raw) {
  const organizationId = normalizeIdentifier(raw.organization_id || raw.organizationId);
  const lineChannelId = normalizeIdentifier(raw.line_channel_id || raw.lineChannelId);
  const lineUserId = normalizeIdentifier(raw.line_user_id || raw.lineUserId);
  const lineOrganizationId = normalizeIdentifier(raw.line_context_organization_id || raw.lineContextOrganizationId);
  const organizationMatches = !lineOrganizationId || !organizationId || lineOrganizationId === organizationId;
  const scoped = Boolean(organizationId && lineChannelId && lineUserId && organizationMatches);

  return {
    organizationId,
    lineChannelId,
    scoped,
    hasRawLineUserId: Boolean(lineUserId),
    organizationMatches,
  };
}

function reasonForChannel(sourceChannel, lineScope) {
  if (sourceChannel === 'unknown') {
    return 'unknown_source_fails_safe';
  }

  if ((sourceChannel === 'brand_line' || sourceChannel === 'platform_line') && !lineScope.scoped) {
    return lineScope.organizationMatches === false
      ? 'line_context_cross_scope_fails_safe'
      : 'line_context_unscoped_metadata_only';
  }

  return `${sourceChannel}_metadata_only`;
}

function normalizeBrandReferralSource(input = {}) {
  const raw = input && typeof input === 'object' ? input : {};
  const sourceChannel = normalizeSourceChannel(raw.source_channel || raw.sourceChannel);
  const lineScope = buildLineScope(raw);
  const brandId = normalizeIdentifier(raw.brand_id || raw.brandId);
  const referralSource = normalizeSafeString(raw.referral_source || raw.referralSource, {
    maxLength: 120,
  });
  const entryContext = normalizeEntryContext(raw.entry_context || raw.entryContext);

  return {
    metadata: {
      brandId,
      organizationId: lineScope.organizationId,
      sourceChannel,
      referralSource,
      entryContext,
      lineChannelId: lineScope.lineChannelId,
      hasScopedLineContext: lineScope.scoped,
      hasRawLineUserId: lineScope.hasRawLineUserId,
    },
    grants: {
      identityVerified: false,
      caseBinding: false,
      caseDataAccess: false,
    },
    reasonKey: reasonForChannel(sourceChannel, lineScope),
  };
}

function validateScopedLineMetadata(input = {}) {
  return buildLineScope(input).scoped;
}

module.exports = {
  SOURCE_CHANNELS,
  normalizeSourceChannel,
  normalizeBrandReferralSource,
  validateScopedLineMetadata,
};
