'use strict';

const USAGE_METERING_BOUNDARY_KIND = 'saas.usage_metering_boundary';

const REASON_CODES = Object.freeze({
  accepted: 'usage_metering_event_accepted',
  organizationRequired: 'usage_metering_organization_required',
  metricRequired: 'usage_metering_metric_required',
  metricUnknown: 'usage_metering_metric_unknown',
  quantityInvalid: 'usage_metering_quantity_invalid',
  frontendOnlyClaim: 'usage_metering_frontend_only_claim_denied',
  entitlementContextRequired: 'usage_metering_entitlement_context_required',
  entitlementMissing: 'usage_metering_entitlement_missing',
  limitExceeded: 'usage_metering_limit_exceeded',
});

const USAGE_METRICS = Object.freeze({
  'cases.count': Object.freeze({
    metricKey: 'cases.count',
    category: 'case',
    unit: 'count',
    integerOnly: true,
    entitlementKey: 'case.basic',
  }),
  'appointments.count': Object.freeze({
    metricKey: 'appointments.count',
    category: 'appointment',
    unit: 'count',
    integerOnly: true,
    entitlementKey: 'dispatch.manage',
  }),
  'engineer_mobile.actions.count': Object.freeze({
    metricKey: 'engineer_mobile.actions.count',
    category: 'engineer_mobile',
    unit: 'count',
    integerOnly: true,
    entitlementKey: 'engineer.mobile.basic',
  }),
  'customer_report.views.count': Object.freeze({
    metricKey: 'customer_report.views.count',
    category: 'customer_facing_report',
    unit: 'count',
    integerOnly: true,
    entitlementKey: 'customer.access.basic',
  }),
  'repair_intake.drafts.count': Object.freeze({
    metricKey: 'repair_intake.drafts.count',
    category: 'repair_intake',
    unit: 'count',
    integerOnly: true,
    entitlementKey: 'case.basic',
  }),
  'storage.attachments.units': Object.freeze({
    metricKey: 'storage.attachments.units',
    category: 'storage',
    unit: 'unit',
    integerOnly: true,
    entitlementKey: 'storage.attachments',
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

function metricKey(source) {
  return firstString(source.metricKey, source.usageMetric, source.usageKey);
}

function usageQuantity(source) {
  if (typeof source.quantity === 'number') return source.quantity;
  if (typeof source.amount === 'number') return source.amount;
  if (typeof source.count === 'number') return source.count;

  return undefined;
}

function currentUsage(source) {
  if (typeof source.currentUsage === 'number') return source.currentUsage;
  if (typeof source.previousUsage === 'number') return source.previousUsage;

  return 0;
}

function hasFrontendOnlyUsageClaim(source) {
  return source.frontendOnlyUsageClaim === true
    || source.frontendOnlyUsage === true
    || lowerString(source.usageSource) === 'frontend'
    || lowerString(source.source) === 'frontend'
    || lowerString(source.context && source.context.usageSource) === 'frontend';
}

function entitlementContext(source) {
  if (isObject(source.entitlementContext)) return source.entitlementContext;
  if (isObject(source.entitlement)) return source.entitlement;

  return undefined;
}

function entitlementGranted(context, requiredEntitlement) {
  if (!isObject(context)) return false;

  if (context.allowed === false || context.granted === false) return false;
  if (context.allowed === true || context.granted === true) {
    const key = stringValue(context.requiredEntitlement || context.entitlementKey);

    return !key || key === requiredEntitlement;
  }

  if (Array.isArray(context.entitlements)) {
    return context.entitlements.includes(requiredEntitlement);
  }

  if (isObject(context.entitlementFlags)) {
    return context.entitlementFlags[requiredEntitlement] === true;
  }

  return false;
}

function usageLimit(source, context, metric) {
  const metricSpecificLimits = [
    source.limits,
    context && context.limits,
    context && context.plan && context.plan.limits,
  ].filter(isObject);

  for (const limits of metricSpecificLimits) {
    if (typeof limits[metric.metricKey] === 'number') return limits[metric.metricKey];
    if (typeof limits[metric.category] === 'number') return limits[metric.category];
    if (typeof limits[metric.unit] === 'number') return limits[metric.unit];
  }

  if (typeof source.limit === 'number') return source.limit;
  if (typeof context?.limit === 'number') return context.limit;

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

function failure(reasonCode, context = {}) {
  return compactRecord({
    ok: false,
    accepted: false,
    boundaryKind: USAGE_METERING_BOUNDARY_KIND,
    reasonCode,
    organizationId: context.organizationId,
    metricKey: context.metricKey,
    requestId: context.requestId,
    usage: context.metric
      ? {
        metricKey: context.metric.metricKey,
        category: context.metric.category,
        unit: context.metric.unit,
        internalAccountingOnly: true,
        invoiceCreated: false,
        paymentCreated: false,
        paymentMethodCollected: false,
        billingProviderCalled: false,
      }
      : undefined,
  });
}

function success(context = {}) {
  return compactRecord({
    ok: true,
    accepted: true,
    boundaryKind: USAGE_METERING_BOUNDARY_KIND,
    reasonCode: REASON_CODES.accepted,
    organizationId: context.organizationId,
    requestId: context.requestId,
    metric: {
      metricKey: context.metric.metricKey,
      category: context.metric.category,
      unit: context.metric.unit,
      entitlementKey: context.metric.entitlementKey,
    },
    usage: {
      quantity: context.quantity,
      previousQuantity: context.current,
      projectedQuantity: context.projected,
      limit: context.limit,
      overLimit: false,
      internalAccountingOnly: true,
      invoiceCreated: false,
      paymentCreated: false,
      paymentMethodCollected: false,
      billingProviderCalled: false,
    },
    entitlement: {
      requiredEntitlement: context.metric.entitlementKey,
      granted: true,
      source: 'server_policy',
    },
    billingContactRef: context.billingContactRef,
  });
}

function evaluateUsageMeteringBoundary(input = {}) {
  const source = isObject(input) ? input : {};
  const resolvedRequestId = requestId(source);
  const resolvedOrganizationId = organizationId(source);

  if (!resolvedOrganizationId) {
    return failure(REASON_CODES.organizationRequired, { requestId: resolvedRequestId });
  }

  const resolvedMetricKey = metricKey(source);

  if (!resolvedMetricKey) {
    return failure(REASON_CODES.metricRequired, {
      organizationId: resolvedOrganizationId,
      requestId: resolvedRequestId,
    });
  }

  const metric = USAGE_METRICS[resolvedMetricKey];

  if (!metric) {
    return failure(REASON_CODES.metricUnknown, {
      organizationId: resolvedOrganizationId,
      metricKey: resolvedMetricKey,
      requestId: resolvedRequestId,
    });
  }

  const quantity = usageQuantity(source);

  if (
    typeof quantity !== 'number'
    || quantity < 0
    || (metric.integerOnly && !Number.isInteger(quantity))
  ) {
    return failure(REASON_CODES.quantityInvalid, {
      organizationId: resolvedOrganizationId,
      metricKey: resolvedMetricKey,
      requestId: resolvedRequestId,
      metric,
    });
  }

  if (hasFrontendOnlyUsageClaim(source)) {
    return failure(REASON_CODES.frontendOnlyClaim, {
      organizationId: resolvedOrganizationId,
      metricKey: resolvedMetricKey,
      requestId: resolvedRequestId,
      metric,
    });
  }

  const entitlement = entitlementContext(source);

  if (!isObject(entitlement)) {
    return failure(REASON_CODES.entitlementContextRequired, {
      organizationId: resolvedOrganizationId,
      metricKey: resolvedMetricKey,
      requestId: resolvedRequestId,
      metric,
    });
  }

  if (!entitlementGranted(entitlement, metric.entitlementKey)) {
    return failure(REASON_CODES.entitlementMissing, {
      organizationId: resolvedOrganizationId,
      metricKey: resolvedMetricKey,
      requestId: resolvedRequestId,
      metric,
    });
  }

  const current = currentUsage(source);
  const projected = current + quantity;
  const limit = usageLimit(source, entitlement, metric);

  if (typeof limit === 'number' && projected > limit) {
    return failure(REASON_CODES.limitExceeded, {
      organizationId: resolvedOrganizationId,
      metricKey: resolvedMetricKey,
      requestId: resolvedRequestId,
      metric,
    });
  }

  return success({
    organizationId: resolvedOrganizationId,
    requestId: resolvedRequestId,
    metric,
    quantity,
    current,
    projected,
    limit,
    billingContactRef: normalizeBillingContactRef(source),
  });
}

module.exports = {
  USAGE_METERING_BOUNDARY_KIND,
  USAGE_METRICS,
  REASON_CODES,
  evaluateUsageMeteringBoundary,
};
