'use strict';

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

function safeObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function pickOrganizationId(request = {}) {
  const raw = safeObject(request);
  const body = safeObject(raw.body);
  const query = safeObject(raw.query);
  const params = safeObject(raw.params);

  return normalizeIdentifier(
    raw.organization_id ||
      raw.organizationId ||
      body.organization_id ||
      body.organizationId ||
      query.organization_id ||
      query.organizationId ||
      params.organization_id ||
      params.organizationId,
  );
}

function deny(reasonKey, requiredNextStep, metadata = {}) {
  return {
    allowed: false,
    reasonKey,
    requiredNextStep,
    metadata,
    grants: {
      permissionGranted: false,
      entitlementGranted: false,
      organizationScopeVerified: false,
    },
  };
}

function allow(metadata) {
  return {
    allowed: true,
    reasonKey: 'brand_referral_access_allowed',
    requiredNextStep: 'continue_to_normalization',
    metadata,
    grants: {
      permissionGranted: true,
      entitlementGranted: true,
      organizationScopeVerified: true,
    },
  };
}

function evaluateBrandReferralAccess(input = {}) {
  const raw = safeObject(input);
  const request = safeObject(raw.request);
  const context = safeObject(raw.context);
  const requestOrganizationId = pickOrganizationId(request);
  const contextOrganizationId = normalizeIdentifier(context.organization_id || context.organizationId);
  const featureKey = normalizeSafeString(context.feature_key || context.featureKey, {
    maxLength: 80,
    lower: true,
  }) || 'brand_referral_normalization';
  const metadata = {
    organization_id: requestOrganizationId || contextOrganizationId,
    feature_key: featureKey,
  };

  if (!requestOrganizationId || !contextOrganizationId) {
    return deny('missing_organization_scope', 'collect_valid_organization_scope', metadata);
  }

  if (requestOrganizationId !== contextOrganizationId) {
    return deny('organization_scope_mismatch', 'recheck_organization_scope', metadata);
  }

  if (context.can_normalize_brand_referral !== true && context.canNormalizeBrandReferral !== true) {
    return deny('brand_referral_permission_denied', 'request_brand_referral_permission', metadata);
  }

  if (context.brand_referral_entitled !== true && context.brandReferralEntitled !== true) {
    return deny('brand_referral_entitlement_denied', 'enable_brand_referral_entitlement', metadata);
  }

  return allow(metadata);
}

function buildBrandReferralAccessDeniedResponse(decision) {
  return {
    statusCode: 403,
    body: {
      ok: false,
      messageKey: 'brand_referral.access_denied',
      reasonKey: decision.reasonKey,
      requiredNextStep: decision.requiredNextStep,
      access: {
        allowed: false,
        metadata: decision.metadata,
      },
    },
  };
}

module.exports = {
  evaluateBrandReferralAccess,
  buildBrandReferralAccessDeniedResponse,
};
