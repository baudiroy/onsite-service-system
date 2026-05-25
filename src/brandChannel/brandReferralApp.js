'use strict';

const {
  normalizeBrandReferralRequest,
} = require('./brandReferralRequestNormalizer');

function buildResponse(envelope) {
  return {
    statusCode: 200,
    body: {
      ok: true,
      messageKey: 'brand_referral.normalized',
      referral: envelope,
    },
  };
}

function buildAccessDeniedResponse(decision) {
  return {
    statusCode: 403,
    body: {
      ok: false,
      messageKey: 'brand_referral.access_denied',
      reasonKey: decision.reasonKey,
      requiredNextStep: decision.requiredNextStep,
      access: {
        allowed: false,
        metadata: decision.metadata || {},
      },
    },
  };
}

function normalizeBrandReferralApiRequest(request = {}, options = {}) {
  if (options.requireAccessGuard === true) {
    const decision = typeof options.accessGuard === 'function'
      ? options.accessGuard({ request, context: options.accessContext })
      : {
        allowed: false,
        reasonKey: 'brand_referral_access_guard_missing',
        requiredNextStep: 'provide_brand_referral_access_guard',
        metadata: {},
      };
    if (!decision.allowed) {
      return buildAccessDeniedResponse(decision);
    }
  }

  return buildResponse(normalizeBrandReferralRequest(request));
}

function createBrandReferralApp(options = {}) {
  return {
    normalizeReferralRequest: (request) => normalizeBrandReferralApiRequest(request, options),
  };
}

module.exports = {
  createBrandReferralApp,
  normalizeBrandReferralApiRequest,
};
