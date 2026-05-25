'use strict';

const {
  normalizeBrandReferralSource,
} = require('./brandReferralSourcePolicy');

const FIELD_ALIASES = Object.freeze({
  organizationId: Object.freeze(['organization_id', 'organizationId']),
  brandId: Object.freeze(['brand_id', 'brandId']),
  sourceChannel: Object.freeze(['source_channel', 'sourceChannel']),
  referralSource: Object.freeze(['referral_source', 'referralSource']),
  lineChannelId: Object.freeze(['line_channel_id', 'lineChannelId']),
  lineUserId: Object.freeze(['line_user_id', 'lineUserId']),
  lineContextOrganizationId: Object.freeze([
    'line_context_organization_id',
    'lineContextOrganizationId',
  ]),
  entryContext: Object.freeze(['entry_context', 'entryContext']),
});

const PAYLOAD_KEYS = Object.freeze(['body', 'query', 'params']);

function safeObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function pickFirst(raw, aliases) {
  const root = safeObject(raw);
  const candidates = [root, ...PAYLOAD_KEYS.map((key) => safeObject(root[key]))];

  for (const candidate of candidates) {
    for (const alias of aliases) {
      if (Object.prototype.hasOwnProperty.call(candidate, alias)) {
        return candidate[alias];
      }
    }
  }

  return undefined;
}

function buildPolicyInput(input) {
  return {
    organization_id: pickFirst(input, FIELD_ALIASES.organizationId),
    brand_id: pickFirst(input, FIELD_ALIASES.brandId),
    source_channel: pickFirst(input, FIELD_ALIASES.sourceChannel),
    referral_source: pickFirst(input, FIELD_ALIASES.referralSource),
    line_channel_id: pickFirst(input, FIELD_ALIASES.lineChannelId),
    line_user_id: pickFirst(input, FIELD_ALIASES.lineUserId),
    line_context_organization_id: pickFirst(input, FIELD_ALIASES.lineContextOrganizationId),
    entry_context: pickFirst(input, FIELD_ALIASES.entryContext),
  };
}

function requiredNextStepFor(reasonKey) {
  if (reasonKey === 'unknown_source_fails_safe') {
    return 'collect_valid_referral_source';
  }

  if (reasonKey === 'line_context_cross_scope_fails_safe') {
    return 'reverify_channel_scope_before_use';
  }

  if (reasonKey === 'line_context_unscoped_metadata_only') {
    return 'collect_scoped_line_context';
  }

  return 'continue_to_verification_or_intake_draft';
}

function normalizeBrandReferralRequest(input = {}) {
  const referral = normalizeBrandReferralSource(buildPolicyInput(input));
  const metadata = referral.metadata;

  return {
    metadata: {
      organization_id: metadata.organizationId,
      brand_id: metadata.brandId,
      source_channel: metadata.sourceChannel,
      referral_source: metadata.referralSource,
      entry_context: metadata.entryContext,
      line_channel_id: metadata.lineChannelId,
      has_scoped_line_context: metadata.hasScopedLineContext,
      has_line_context: metadata.hasRawLineUserId,
    },
    grants: {
      identityVerified: false,
      caseBinding: false,
      caseDataAccess: false,
      intakeCreated: false,
      auditWritten: false,
    },
    reasonKey: referral.reasonKey,
    requiredNextStep: requiredNextStepFor(referral.reasonKey),
  };
}

module.exports = {
  normalizeBrandReferralRequest,
};
