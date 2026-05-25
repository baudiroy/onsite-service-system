'use strict';

const {
  normalizeBrandReferralApiRequest,
} = require('./brandReferralApp');
const {
  BRAND_REFERRAL_AUDIT_EVENT_TYPES,
  buildBrandReferralAuditIntent,
} = require('./brandReferralAuditIntentBuilder');

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function buildSafeRouteError(statusCode, reasonKey, requiredNextStep) {
  return {
    statusCode,
    body: {
      ok: false,
      messageKey: 'brand_referral.route_rejected',
      reasonKey,
      requiredNextStep,
    },
  };
}

function withOptionalAuditIntent(response, options = {}, auditOptions = {}) {
  if (options.includeAuditIntent !== true) {
    return response;
  }

  return {
    ...response,
    auditIntent: buildBrandReferralAuditIntent(response, auditOptions),
  };
}

function normalizeInternalWriterResult(result = {}) {
  if (!isPlainObject(result)) {
    return {
      ok: false,
      reasonKey: 'brand_referral_contact_writer_invalid_result',
    };
  }

  return {
    ok: result.ok === true,
    reasonKey: typeof result.reasonKey === 'string' ? result.reasonKey.slice(0, 120) : undefined,
  };
}

function withOptionalContactWriter(response, options = {}, auditOptions = {}) {
  const contactWriter = options.contactWriter;

  if (!contactWriter || typeof contactWriter.write !== 'function') {
    return response;
  }

  const auditIntent = buildBrandReferralAuditIntent(response, auditOptions);
  const includeInternalResult = options.includeContactWriterResult === true;
  const decorate = (result) => {
    if (!includeInternalResult) {
      return response;
    }

    return {
      ...response,
      contactWriterResult: normalizeInternalWriterResult(result),
    };
  };

  try {
    const result = contactWriter.write(auditIntent);

    if (result && typeof result.then === 'function') {
      return result
        .then(decorate)
        .catch(() => decorate({
          ok: false,
          reasonKey: 'brand_referral_contact_writer_failed',
        }));
    }

    return decorate(result);
  } catch (_error) {
    return decorate({
      ok: false,
      reasonKey: 'brand_referral_contact_writer_failed',
    });
  }
}

function normalizeRouteResponse(response) {
  if (!isPlainObject(response) || !isPlainObject(response.body)) {
    return buildSafeRouteError(500, 'brand_referral_route_invalid_response', 'retry_with_valid_route_adapter');
  }

  return {
    statusCode: Number.isInteger(response.statusCode) ? response.statusCode : 500,
    body: response.body,
  };
}

function handleBrandReferralRouteRequest(request = {}, options = {}) {
  if (!isPlainObject(request)) {
    return withOptionalContactWriter(withOptionalAuditIntent(
      buildSafeRouteError(400, 'brand_referral_route_invalid_request', 'provide_request_object'),
      options,
      {
        eventType: BRAND_REFERRAL_AUDIT_EVENT_TYPES.malformed,
        resultStatus: 'malformed',
      },
    ), options, {
      eventType: BRAND_REFERRAL_AUDIT_EVENT_TYPES.malformed,
      resultStatus: 'malformed',
    });
  }

  try {
    return withOptionalContactWriter(withOptionalAuditIntent(
      normalizeRouteResponse(normalizeBrandReferralApiRequest(request, {
        requireAccessGuard: options.requireAccessGuard !== false,
        accessGuard: options.accessGuard,
        accessContext: options.accessContext,
      })),
      options,
    ), options);
  } catch (_error) {
    return withOptionalContactWriter(withOptionalAuditIntent(
      buildSafeRouteError(500, 'brand_referral_route_handler_failed', 'retry_without_exposing_internals'),
      options,
      {
        eventType: BRAND_REFERRAL_AUDIT_EVENT_TYPES.malformed,
        resultStatus: 'malformed',
      },
    ), options, {
      eventType: BRAND_REFERRAL_AUDIT_EVENT_TYPES.malformed,
      resultStatus: 'malformed',
    });
  }
}

function createBrandReferralRouteAdapter(options = {}) {
  return {
    mounted: false,
    publicRouteMounted: false,
    handle: (request) => handleBrandReferralRouteRequest(request, options),
  };
}

module.exports = {
  createBrandReferralRouteAdapter,
  handleBrandReferralRouteRequest,
};
