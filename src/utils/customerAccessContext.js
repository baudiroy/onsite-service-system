const { isCustomerSafeRequestReference } = require('./customerFacingResponseEnvelope');

const CUSTOMER_ACCESS_VERIFICATION_STATE = Object.freeze({
  VERIFIED: 'verified',
  VERIFICATION_REQUIRED: 'verification_required',
  VERIFICATION_FAILED: 'verification_failed',
  UNAVAILABLE: 'unavailable',
  RATE_LIMITED: 'rate_limited',
  ABUSE_SUSPECTED: 'abuse_suspected',
  UNSUPPORTED_CHANNEL: 'unsupported_channel'
});

const CUSTOMER_ACCESS_SURFACE_TYPE = Object.freeze({
  TIMELINE: 'timeline',
  SERVICE_REPORT: 'service_report',
  ACCESS_VERIFICATION: 'access_verification',
  UNAVAILABLE: 'unavailable'
});

const CUSTOMER_ACCESS_PROJECTION_SCOPE = Object.freeze({
  NONE: 'none',
  TIMELINE: 'timeline',
  SERVICE_REPORT: 'service_report',
  TIMELINE_AND_SERVICE_REPORT: 'timeline_and_service_report'
});

const CUSTOMER_ACCESS_SCOPE_REF_PATTERN = /^scope_[A-Za-z][A-Za-z0-9_-]{2,63}$/;

const VERIFIED_PROJECTION_SCOPES = new Set([
  CUSTOMER_ACCESS_PROJECTION_SCOPE.TIMELINE,
  CUSTOMER_ACCESS_PROJECTION_SCOPE.SERVICE_REPORT,
  CUSTOMER_ACCESS_PROJECTION_SCOPE.TIMELINE_AND_SERVICE_REPORT
]);

function hasAllowedValue(value, allowedValues) {
  return allowedValues.includes(value);
}

function normalizeVerificationState(value) {
  const allowedStates = Object.values(CUSTOMER_ACCESS_VERIFICATION_STATE);

  if (hasAllowedValue(value, allowedStates)) {
    return value;
  }

  return CUSTOMER_ACCESS_VERIFICATION_STATE.UNAVAILABLE;
}

function normalizeSurfaceType(value) {
  const allowedSurfaceTypes = Object.values(CUSTOMER_ACCESS_SURFACE_TYPE);

  if (hasAllowedValue(value, allowedSurfaceTypes)) {
    return value;
  }

  return CUSTOMER_ACCESS_SURFACE_TYPE.UNAVAILABLE;
}

function normalizeProjectionScope(value, verificationState) {
  const allowedProjectionScopes = Object.values(CUSTOMER_ACCESS_PROJECTION_SCOPE);

  if (verificationState !== CUSTOMER_ACCESS_VERIFICATION_STATE.VERIFIED) {
    return CUSTOMER_ACCESS_PROJECTION_SCOPE.NONE;
  }

  if (hasAllowedValue(value, allowedProjectionScopes)) {
    return value;
  }

  return CUSTOMER_ACCESS_PROJECTION_SCOPE.NONE;
}

function isSanitizedScopeRef(value) {
  return typeof value === 'string' && CUSTOMER_ACCESS_SCOPE_REF_PATTERN.test(value);
}

function buildCustomerAccessContext(options = {}) {
  const verificationState = normalizeVerificationState(options.verificationState);
  const surfaceType = normalizeSurfaceType(options.surfaceType);
  const allowedProjectionScope = normalizeProjectionScope(options.allowedProjectionScope, verificationState);
  const context = {
    verificationState,
    surfaceType,
    allowedProjectionScope
  };

  if (isCustomerSafeRequestReference(options.requestReference)) {
    context.requestReference = options.requestReference;
  }

  if (isSanitizedScopeRef(options.organizationScopeRef)) {
    context.organizationScopeRef = options.organizationScopeRef;
  }

  if (isSanitizedScopeRef(options.channelScopeRef)) {
    context.channelScopeRef = options.channelScopeRef;
  }

  return context;
}

function isVerifiedCustomerAccessContext(context) {
  return (
    Boolean(context) &&
    context.verificationState === CUSTOMER_ACCESS_VERIFICATION_STATE.VERIFIED &&
    VERIFIED_PROJECTION_SCOPES.has(context.allowedProjectionScope) &&
    context.surfaceType !== CUSTOMER_ACCESS_SURFACE_TYPE.UNAVAILABLE
  );
}

module.exports = {
  CUSTOMER_ACCESS_VERIFICATION_STATE,
  CUSTOMER_ACCESS_SURFACE_TYPE,
  CUSTOMER_ACCESS_PROJECTION_SCOPE,
  buildCustomerAccessContext,
  isVerifiedCustomerAccessContext
};
