'use strict';

const TRIAL_LIMIT_GUARD_KIND = 'saas.trial_limit_guard';

const REASON_CODES = Object.freeze({
  allowed: 'trial_limit_allowed',
  paidPlanNotTrial: 'trial_limit_not_applicable_paid_plan',
  organizationRequired: 'trial_limit_organization_required',
  trialStateRequired: 'trial_limit_trial_state_required',
  trialAmbiguous: 'trial_limit_trial_state_ambiguous',
  trialExpired: 'trial_limit_expired',
  organizationInactive: 'trial_limit_organization_inactive',
  entitlementMissing: 'trial_limit_entitlement_missing',
  usageInputRequired: 'trial_limit_usage_input_required',
  usageInputInvalid: 'trial_limit_usage_input_invalid',
  limitRequired: 'trial_limit_limit_required',
  limitExceeded: 'trial_limit_exceeded',
  frontendOnlyTrialFlag: 'trial_limit_frontend_only_trial_flag_denied',
});

const INACTIVE_ORGANIZATION_STATUSES = new Set([
  'cancelled',
  'canceled',
  'disabled',
  'expired',
  'inactive',
  'past_due',
  'suspended',
]);

const ACTIVE_TRIAL_STATES = new Set(['active', 'trial_active', 'trialing']);
const EXPIRED_TRIAL_STATES = new Set(['expired', 'trial_expired']);
const AMBIGUOUS_TRIAL_STATES = new Set(['ambiguous', 'unknown', 'pending_review']);
const PAID_PLAN_STATES = new Set(['not_trial', 'paid', 'active_paid']);

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return undefined;
}

function lowerString(value) {
  const text = stringValue(value);

  return text ? text.toLowerCase() : undefined;
}

function compactRecord(record) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  );
}

function firstString(...values) {
  return values.map(stringValue).find(Boolean);
}

function organizationId(source) {
  return firstString(
    source.organizationId,
    source.organization && source.organization.id,
    source.organization && source.organization.organizationId,
  );
}

function requestId(source) {
  return firstString(source.requestId, source.context && source.context.requestId);
}

function organizationStatus(source) {
  return lowerString(
    source.organizationStatus
      || source.status
      || (source.organization && source.organization.status)
      || (source.subscription && source.subscription.status),
  );
}

function trialState(source) {
  return lowerString(
    source.trialState
      || (source.trial && source.trial.state)
      || (source.subscription && source.subscription.trialState)
      || (source.entitlementContext && source.entitlementContext.trialState),
  );
}

function hasFrontendOnlyTrialFlag(source) {
  return source.frontendOnlyTrialFlag === true
    || source.frontendOnlyTrial === true
    || lowerString(source.trialSource) === 'frontend'
    || lowerString(source.context && source.context.trialSource) === 'frontend'
    || lowerString(source.trial && source.trial.source) === 'frontend';
}

function entitlementContext(source) {
  if (isObject(source.entitlementContext)) return source.entitlementContext;
  if (isObject(source.entitlement)) return source.entitlement;

  return undefined;
}

function usageInput(source) {
  if (isObject(source.usageMeter)) return source.usageMeter;
  if (isObject(source.usageInput)) return source.usageInput;
  if (isObject(source.usage)) return source.usage;

  return undefined;
}

function metricKeyFromUsage(usage) {
  return firstString(
    usage.metricKey,
    usage.usageKey,
    usage.metric && usage.metric.metricKey,
  );
}

function entitlementKeyFromUsage(source, usage) {
  return firstString(
    source.requiredEntitlement,
    usage.requiredEntitlement,
    usage.entitlementKey,
    usage.metric && usage.metric.entitlementKey,
  );
}

function projectedQuantityFromUsage(usage) {
  if (typeof usage.projectedQuantity === 'number') return usage.projectedQuantity;
  if (typeof usage.projectedUsage === 'number') return usage.projectedUsage;

  const current = typeof usage.currentUsage === 'number'
    ? usage.currentUsage
    : typeof usage.previousQuantity === 'number'
      ? usage.previousQuantity
      : 0;
  const quantity = typeof usage.quantity === 'number' ? usage.quantity : undefined;

  if (quantity === undefined) return undefined;

  return current + quantity;
}

function quantityFromUsage(usage) {
  if (typeof usage.quantity === 'number') return usage.quantity;
  if (typeof usage.amount === 'number') return usage.amount;
  if (typeof usage.count === 'number') return usage.count;

  return undefined;
}

function entitlementGranted(context, requiredEntitlement) {
  if (!isObject(context)) return false;

  if (context.allowed === false || context.granted === false) return false;
  if (context.allowed === true || context.granted === true) {
    const key = stringValue(context.requiredEntitlement || context.entitlementKey);

    return !requiredEntitlement || !key || key === requiredEntitlement;
  }

  if (requiredEntitlement && Array.isArray(context.entitlements)) {
    return context.entitlements.includes(requiredEntitlement);
  }

  if (requiredEntitlement && isObject(context.entitlementFlags)) {
    return context.entitlementFlags[requiredEntitlement] === true;
  }

  return false;
}

function trialLimit(source, context, usage) {
  const metricKey = metricKeyFromUsage(usage);
  const entitlementKey = entitlementKeyFromUsage(source, usage);
  const limitSources = [
    source.trialLimits,
    source.limits,
    context && context.trialLimits,
    context && context.limits,
  ].filter(isObject);

  for (const limits of limitSources) {
    if (metricKey && typeof limits[metricKey] === 'number') return limits[metricKey];
    if (entitlementKey && typeof limits[entitlementKey] === 'number') return limits[entitlementKey];
    if (typeof limits.trial === 'number') return limits.trial;
  }

  if (typeof source.trialLimit === 'number') return source.trialLimit;

  return undefined;
}

function normalizeBillingContactRef(source) {
  const input = source.billingContactRef;

  if (!input) return undefined;

  if (!isObject(input)) {
    const refId = stringValue(input);

    return refId ? { refId, kind: 'billing_contact_ref' } : undefined;
  }

  return compactRecord({
    refId: firstString(input.refId, input.id, input.billingContactId),
    kind: stringValue(input.kind) || 'billing_contact_ref',
    type: stringValue(input.type) || 'billing_contact',
  });
}

function nonBillingMarkers() {
  return {
    invoiceCreated: false,
    paymentCreated: false,
    paymentMethodCollected: false,
    billingProviderCalled: false,
  };
}

function failure(reasonCode, context = {}) {
  return compactRecord({
    ok: false,
    allowed: false,
    guardKind: TRIAL_LIMIT_GUARD_KIND,
    reasonCode,
    organizationId: context.organizationId,
    trialState: context.trialState,
    requestId: context.requestId,
    requiresReview: reasonCode === REASON_CODES.limitExceeded,
    usage: context.usage
      ? {
        metricKey: metricKeyFromUsage(context.usage),
        quantity: quantityFromUsage(context.usage),
        projectedQuantity: projectedQuantityFromUsage(context.usage),
        internalTrialLimitOnly: true,
        ...nonBillingMarkers(),
      }
      : undefined,
  });
}

function success(context = {}) {
  return compactRecord({
    ok: true,
    allowed: true,
    guardKind: TRIAL_LIMIT_GUARD_KIND,
    reasonCode: context.reasonCode || REASON_CODES.allowed,
    organizationId: context.organizationId,
    trialState: context.trialState,
    requestId: context.requestId,
    trialApplied: context.trialApplied,
    usage: context.usage
      ? {
        metricKey: metricKeyFromUsage(context.usage),
        quantity: quantityFromUsage(context.usage),
        projectedQuantity: projectedQuantityFromUsage(context.usage),
        trialLimit: context.limit,
        underLimit: true,
        internalTrialLimitOnly: true,
        ...nonBillingMarkers(),
      }
      : undefined,
    entitlement: context.requiredEntitlement
      ? {
        requiredEntitlement: context.requiredEntitlement,
        granted: true,
        source: 'server_policy',
      }
      : undefined,
    billingContactRef: context.billingContactRef,
  });
}

function evaluateTrialLimitGuard(input = {}) {
  const source = isObject(input) ? input : {};
  const resolvedRequestId = requestId(source);
  const resolvedOrganizationId = organizationId(source);

  if (!resolvedOrganizationId) {
    return failure(REASON_CODES.organizationRequired, { requestId: resolvedRequestId });
  }

  const status = organizationStatus(source);

  if (INACTIVE_ORGANIZATION_STATUSES.has(status)) {
    return failure(REASON_CODES.organizationInactive, {
      organizationId: resolvedOrganizationId,
      requestId: resolvedRequestId,
    });
  }

  if (hasFrontendOnlyTrialFlag(source)) {
    return failure(REASON_CODES.frontendOnlyTrialFlag, {
      organizationId: resolvedOrganizationId,
      requestId: resolvedRequestId,
    });
  }

  const resolvedTrialState = trialState(source);

  if (!resolvedTrialState) {
    return failure(REASON_CODES.trialStateRequired, {
      organizationId: resolvedOrganizationId,
      requestId: resolvedRequestId,
    });
  }

  if (EXPIRED_TRIAL_STATES.has(resolvedTrialState)) {
    return failure(REASON_CODES.trialExpired, {
      organizationId: resolvedOrganizationId,
      trialState: resolvedTrialState,
      requestId: resolvedRequestId,
    });
  }

  if (AMBIGUOUS_TRIAL_STATES.has(resolvedTrialState)) {
    return failure(REASON_CODES.trialAmbiguous, {
      organizationId: resolvedOrganizationId,
      trialState: resolvedTrialState,
      requestId: resolvedRequestId,
    });
  }

  if (PAID_PLAN_STATES.has(resolvedTrialState)) {
    return success({
      organizationId: resolvedOrganizationId,
      requestId: resolvedRequestId,
      trialState: resolvedTrialState,
      reasonCode: REASON_CODES.paidPlanNotTrial,
      trialApplied: false,
      billingContactRef: normalizeBillingContactRef(source),
    });
  }

  if (!ACTIVE_TRIAL_STATES.has(resolvedTrialState)) {
    return failure(REASON_CODES.trialAmbiguous, {
      organizationId: resolvedOrganizationId,
      trialState: resolvedTrialState,
      requestId: resolvedRequestId,
    });
  }

  const entitlement = entitlementContext(source);
  const usage = usageInput(source);

  if (!isObject(usage)) {
    return failure(REASON_CODES.usageInputRequired, {
      organizationId: resolvedOrganizationId,
      trialState: resolvedTrialState,
      requestId: resolvedRequestId,
    });
  }

  const quantity = quantityFromUsage(usage);
  const projected = projectedQuantityFromUsage(usage);

  if (
    typeof quantity !== 'number'
    || quantity < 0
    || !Number.isInteger(quantity)
    || typeof projected !== 'number'
    || projected < 0
  ) {
    return failure(REASON_CODES.usageInputInvalid, {
      organizationId: resolvedOrganizationId,
      trialState: resolvedTrialState,
      requestId: resolvedRequestId,
      usage,
    });
  }

  const requiredEntitlement = entitlementKeyFromUsage(source, usage);

  if (!entitlementGranted(entitlement, requiredEntitlement)) {
    return failure(REASON_CODES.entitlementMissing, {
      organizationId: resolvedOrganizationId,
      trialState: resolvedTrialState,
      requestId: resolvedRequestId,
      usage,
    });
  }

  const limit = trialLimit(source, entitlement, usage);

  if (typeof limit !== 'number') {
    return failure(REASON_CODES.limitRequired, {
      organizationId: resolvedOrganizationId,
      trialState: resolvedTrialState,
      requestId: resolvedRequestId,
      usage,
    });
  }

  if (projected > limit) {
    return failure(REASON_CODES.limitExceeded, {
      organizationId: resolvedOrganizationId,
      trialState: resolvedTrialState,
      requestId: resolvedRequestId,
      usage,
    });
  }

  return success({
    organizationId: resolvedOrganizationId,
    requestId: resolvedRequestId,
    trialState: resolvedTrialState,
    trialApplied: true,
    usage,
    limit,
    requiredEntitlement,
    billingContactRef: normalizeBillingContactRef(source),
  });
}

module.exports = {
  TRIAL_LIMIT_GUARD_KIND,
  REASON_CODES,
  evaluateTrialLimitGuard,
};
