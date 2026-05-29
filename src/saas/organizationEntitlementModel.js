'use strict';

const ORGANIZATION_ENTITLEMENT_MODEL_KIND = 'saas.organization_plan_entitlement_runtime_model';

const REASON_CODES = Object.freeze({
  allowed: 'organization_entitlement_allowed',
  organizationRequired: 'organization_id_required',
  planRequired: 'organization_plan_required',
  planUnknown: 'organization_plan_unknown',
  statusRequired: 'organization_plan_status_required',
  planInactive: 'organization_plan_inactive',
  trialAmbiguous: 'organization_trial_ambiguous',
  trialExpired: 'organization_trial_expired',
  frontendOnlySignal: 'organization_entitlement_frontend_only_denied',
  entitlementMissing: 'organization_entitlement_missing',
});

const DENIED_STATUSES = new Set([
  'cancelled',
  'canceled',
  'disabled',
  'expired',
  'inactive',
  'past_due',
  'suspended',
]);

const TRIAL_STATUSES = new Set(['trial', 'trialing']);

const PLAN_CATALOG = Object.freeze({
  basic: Object.freeze({
    planCode: 'basic',
    planTier: 'basic',
    entitlements: Object.freeze({
      'core.workflow': true,
      'case.basic': true,
      'engineer.mobile.basic': true,
      'audit.basic': true,
    }),
    limits: Object.freeze({
      users: 5,
      organizations: 1,
    }),
  }),
  professional: Object.freeze({
    planCode: 'professional',
    planTier: 'professional',
    entitlements: Object.freeze({
      'core.workflow': true,
      'case.basic': true,
      'engineer.mobile.basic': true,
      'dispatch.manage': true,
      'customer.access.basic': true,
      'service.billing.basic': true,
      'brand.source.reporting': true,
    }),
    limits: Object.freeze({
      users: 25,
      organizations: 1,
    }),
  }),
  business: Object.freeze({
    planCode: 'business',
    planTier: 'business',
    entitlements: Object.freeze({
      'core.workflow': true,
      'case.basic': true,
      'engineer.mobile.basic': true,
      'dispatch.manage': true,
      'customer.access.basic': true,
      'service.billing.basic': true,
      'brand.source.reporting': true,
      'report.export': true,
      'advanced.audit': true,
    }),
    limits: Object.freeze({
      users: 100,
      organizations: 5,
    }),
  }),
  enterprise: Object.freeze({
    planCode: 'enterprise',
    planTier: 'enterprise',
    entitlements: Object.freeze({
      'core.workflow': true,
      'case.basic': true,
      'engineer.mobile.basic': true,
      'dispatch.manage': true,
      'customer.access.basic': true,
      'service.billing.basic': true,
      'brand.source.reporting': true,
      'report.export': true,
      'advanced.audit': true,
      'api.webhook': true,
      'enterprise.contract': true,
    }),
    limits: Object.freeze({
      users: null,
      organizations: null,
    }),
  }),
});

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

function compactRecord(record) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  );
}

function firstString(...values) {
  return values.map(stringValue).find(Boolean);
}

function lowerString(value) {
  const text = stringValue(value);

  return text ? text.toLowerCase() : undefined;
}

function parseTime(value) {
  const text = stringValue(value);

  if (!text) return undefined;

  const time = Date.parse(text);

  return Number.isNaN(time) ? undefined : time;
}

function organizationId(source) {
  return firstString(
    source.organizationId,
    source.organization && source.organization.id,
    source.organization && source.organization.organizationId,
  );
}

function planCode(source) {
  return lowerString(
    source.planCode
      || (source.plan && source.plan.planCode)
      || (source.plan && source.plan.code)
      || (source.subscription && source.subscription.planCode)
      || (source.organization && source.organization.planCode),
  );
}

function effectiveStatus(source) {
  return lowerString(
    source.effectiveStatus
      || source.status
      || (source.plan && source.plan.status)
      || (source.subscription && source.subscription.status)
      || (source.organization && source.organization.status),
  );
}

function requestId(source) {
  return firstString(source.requestId, source.context && source.context.requestId);
}

function hasFrontendOnlyEntitlementSignal(source) {
  return source.frontendOnlyEntitlement === true
    || source.frontendOnlyEntitlementSignal === true
    || lowerString(source.entitlementSource) === 'frontend'
    || lowerString(source.entitlementSignalSource) === 'frontend'
    || lowerString(source.context && source.context.entitlementSource) === 'frontend';
}

function addEntitlementArray(target, values) {
  if (!Array.isArray(values)) return;

  for (const value of values) {
    const key = stringValue(value);

    if (key) target[key] = true;
  }
}

function addEntitlementFlags(target, flags) {
  if (!isObject(flags)) return;

  for (const [key, value] of Object.entries(flags)) {
    const normalizedKey = stringValue(key);

    if (normalizedKey) target[normalizedKey] = value === true;
  }
}

function entitlementMap(source, planDefinition) {
  const entitlements = {
    ...(planDefinition.entitlements || {}),
  };

  addEntitlementArray(entitlements, source.entitlements);
  addEntitlementArray(entitlements, source.enabledEntitlements);
  addEntitlementFlags(entitlements, source.entitlementFlags);

  if (isObject(source.plan)) {
    addEntitlementArray(entitlements, source.plan.entitlements);
    addEntitlementFlags(entitlements, source.plan.entitlementFlags);
  }

  return entitlements;
}

function enabledEntitlementKeys(entitlements) {
  return Object.keys(entitlements)
    .filter((key) => entitlements[key] === true)
    .sort();
}

function trialInput(source) {
  const subscriptionTrial = isObject(source.subscription) && isObject(source.subscription.trial)
    ? source.subscription.trial
    : {};
  const directTrial = isObject(source.trial) ? source.trial : {};

  return {
    ...subscriptionTrial,
    ...directTrial,
  };
}

function evaluateTrial(source, status) {
  const trial = trialInput(source);
  const explicitTrial = source.isTrial === true
    || source.trial === true
    || (isObject(source.subscription) && source.subscription.isTrial === true)
    || trial.isTrial === true
    || TRIAL_STATUSES.has(status);

  if (!explicitTrial) {
    return {
      ok: true,
      trialState: 'not_trial',
    };
  }

  const endsAt = firstString(
    source.trialEndsAt,
    source.trialEndAt,
    trial.endsAt,
    trial.endAt,
    trial.expiresAt,
    source.subscription && source.subscription.trialEndsAt,
  );
  const endsAtTime = parseTime(endsAt);

  if (!endsAt || endsAtTime === undefined) {
    return {
      ok: false,
      reasonCode: REASON_CODES.trialAmbiguous,
      trialState: 'ambiguous',
    };
  }

  const startsAtTime = parseTime(firstString(source.trialStartsAt, trial.startsAt, trial.startAt));

  if (startsAtTime !== undefined && startsAtTime > endsAtTime) {
    return {
      ok: false,
      reasonCode: REASON_CODES.trialAmbiguous,
      trialState: 'ambiguous',
    };
  }

  const nowTime = parseTime(source.now) || Date.now();

  if (endsAtTime <= nowTime) {
    return {
      ok: false,
      reasonCode: REASON_CODES.trialExpired,
      trialState: 'expired',
      trialEndsAt: endsAt,
    };
  }

  return {
    ok: true,
    trialState: 'trial_active',
    trialEndsAt: endsAt,
  };
}

function normalizeLimits(source, planDefinition) {
  const sourceLimits = isObject(source.limits) ? source.limits : {};

  return {
    ...(planDefinition.limits || {}),
    ...sourceLimits,
  };
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

function normalizeUsageMeter(source) {
  const input = isObject(source.usageMeter)
    ? source.usageMeter
    : isObject(source.usageMetering)
      ? source.usageMetering
      : undefined;

  if (!input) return undefined;

  return compactRecord({
    metered: input.metered === true || Boolean(stringValue(input.usageKey)),
    usageKey: stringValue(input.usageKey),
    quantity: typeof input.quantity === 'number' ? input.quantity : undefined,
    invoiceCreated: false,
    paymentCreated: false,
  });
}

function failure(reasonCode, context = {}) {
  return compactRecord({
    ok: false,
    allowed: false,
    modelKind: ORGANIZATION_ENTITLEMENT_MODEL_KIND,
    reasonCode,
    organizationId: context.organizationId,
    planCode: context.planCode,
    requestId: context.requestId,
    entitlement: context.requiredEntitlement
      ? {
        requiredEntitlement: context.requiredEntitlement,
        granted: false,
      }
      : undefined,
  });
}

function success(context = {}) {
  return compactRecord({
    ok: true,
    allowed: true,
    modelKind: ORGANIZATION_ENTITLEMENT_MODEL_KIND,
    reasonCode: REASON_CODES.allowed,
    organizationId: context.organizationId,
    requestId: context.requestId,
    plan: {
      planCode: context.planDefinition.planCode,
      planTier: context.planDefinition.planTier,
      effectiveStatus: context.status,
      trialState: context.trial.trialState,
      trialEndsAt: context.trial.trialEndsAt,
      entitlements: enabledEntitlementKeys(context.entitlements),
      limits: context.limits,
    },
    entitlement: context.requiredEntitlement
      ? {
        requiredEntitlement: context.requiredEntitlement,
        granted: true,
        source: 'server_policy',
      }
      : {
        granted: true,
        source: 'server_policy',
      },
    billingContactRef: context.billingContactRef,
    usageMeter: context.usageMeter,
  });
}

function evaluateOrganizationEntitlement(input = {}) {
  const source = isObject(input) ? input : {};
  const resolvedRequestId = requestId(source);
  const resolvedOrganizationId = organizationId(source);

  if (!resolvedOrganizationId) {
    return failure(REASON_CODES.organizationRequired, { requestId: resolvedRequestId });
  }

  const resolvedPlanCode = planCode(source);

  if (!resolvedPlanCode) {
    return failure(REASON_CODES.planRequired, {
      organizationId: resolvedOrganizationId,
      requestId: resolvedRequestId,
    });
  }

  const planDefinition = PLAN_CATALOG[resolvedPlanCode];

  if (!planDefinition) {
    return failure(REASON_CODES.planUnknown, {
      organizationId: resolvedOrganizationId,
      planCode: resolvedPlanCode,
      requestId: resolvedRequestId,
    });
  }

  const status = effectiveStatus(source);

  if (!status) {
    return failure(REASON_CODES.statusRequired, {
      organizationId: resolvedOrganizationId,
      planCode: resolvedPlanCode,
      requestId: resolvedRequestId,
    });
  }

  if (DENIED_STATUSES.has(status)) {
    return failure(REASON_CODES.planInactive, {
      organizationId: resolvedOrganizationId,
      planCode: resolvedPlanCode,
      requestId: resolvedRequestId,
    });
  }

  const trial = evaluateTrial(source, status);

  if (!trial.ok) {
    return failure(trial.reasonCode, {
      organizationId: resolvedOrganizationId,
      planCode: resolvedPlanCode,
      requestId: resolvedRequestId,
    });
  }

  if (hasFrontendOnlyEntitlementSignal(source)) {
    return failure(REASON_CODES.frontendOnlySignal, {
      organizationId: resolvedOrganizationId,
      planCode: resolvedPlanCode,
      requestId: resolvedRequestId,
    });
  }

  const requiredEntitlement = stringValue(source.requiredEntitlement || source.requiredFeature);
  const entitlements = entitlementMap(source, planDefinition);

  if (requiredEntitlement && entitlements[requiredEntitlement] !== true) {
    return failure(REASON_CODES.entitlementMissing, {
      organizationId: resolvedOrganizationId,
      planCode: resolvedPlanCode,
      requestId: resolvedRequestId,
      requiredEntitlement,
    });
  }

  return success({
    organizationId: resolvedOrganizationId,
    requestId: resolvedRequestId,
    status,
    planDefinition,
    trial,
    entitlements,
    limits: normalizeLimits(source, planDefinition),
    requiredEntitlement,
    billingContactRef: normalizeBillingContactRef(source),
    usageMeter: normalizeUsageMeter(source),
  });
}

module.exports = {
  ORGANIZATION_ENTITLEMENT_MODEL_KIND,
  PLAN_CATALOG,
  REASON_CODES,
  evaluateOrganizationEntitlement,
};
