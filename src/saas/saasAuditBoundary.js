'use strict';

const SAAS_AUDIT_BOUNDARY_KIND = 'saas.audit_boundary';

const REASON_CODES = Object.freeze({
  built: 'saas_audit_event_built',
  written: 'saas_audit_event_written',
  organizationRequired: 'saas_audit_organization_required',
  actionRequired: 'saas_audit_action_required',
  writerRequired: 'saas_audit_writer_required',
  writerFailed: 'saas_audit_writer_failed',
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

function organizationId(source) {
  return firstString(
    source.organizationId,
    source.organization && source.organization.id,
    source.organization && source.organization.organizationId,
  );
}

function actionType(source) {
  return firstString(source.actionType, source.action, source.eventType);
}

function requestId(source) {
  return firstString(source.requestId, source.context && source.context.requestId);
}

function safeActorId(source) {
  return firstString(source.actorId, source.actor && source.actor.id, source.actor && source.actor.actorId);
}

function safeBillingContactRef(source) {
  const input = source.billingContactRef;

  if (!isObject(input)) return undefined;

  return compactRecord({
    refId: firstString(input.refId, input.id, input.billingContactId),
    type: stringValue(input.type) || 'billing_contact',
    kind: stringValue(input.kind) || 'billing_contact_ref',
  });
}

function safeDecision(input) {
  if (!isObject(input)) return undefined;

  return compactRecord({
    ok: typeof input.ok === 'boolean' ? input.ok : undefined,
    allowed: typeof input.allowed === 'boolean' ? input.allowed : undefined,
    accepted: typeof input.accepted === 'boolean' ? input.accepted : undefined,
    reasonCode: stringValue(input.reasonCode),
    requiredEntitlement: stringValue(input.requiredEntitlement),
    requiredPermission: stringValue(input.requiredPermission),
  });
}

function safePlan(input) {
  if (!isObject(input)) return undefined;

  return compactRecord({
    planCode: stringValue(input.planCode),
    planTier: stringValue(input.planTier),
    effectiveStatus: stringValue(input.effectiveStatus),
  });
}

function safeUsage(input) {
  if (!isObject(input)) return undefined;

  return compactRecord({
    metricKey: firstString(input.metricKey, input.usageKey),
    reasonCode: stringValue(input.reasonCode),
    quantity: typeof input.quantity === 'number' ? input.quantity : undefined,
    projectedQuantity: typeof input.projectedQuantity === 'number' ? input.projectedQuantity : undefined,
    limit: typeof input.limit === 'number' ? input.limit : undefined,
  });
}

function safeTrial(input) {
  if (!isObject(input)) return undefined;

  return compactRecord({
    trialState: stringValue(input.trialState),
    trialApplied: typeof input.trialApplied === 'boolean' ? input.trialApplied : undefined,
    reasonCode: stringValue(input.reasonCode),
  });
}

function safePermission(input) {
  if (!isObject(input)) return undefined;

  return compactRecord({
    requiredPermission: stringValue(input.requiredPermission),
    granted: typeof input.granted === 'boolean' ? input.granted : undefined,
    reasonCode: stringValue(input.reasonCode),
  });
}

function nonExecutionMarkers() {
  return {
    customerVisible: false,
    invoiceCreated: false,
    paymentCreated: false,
    paymentMethodCollected: false,
    billingProviderCalled: false,
    organizationBillingStateMutated: false,
    providerSendTriggered: false,
  };
}

function failure(reasonCode, context = {}) {
  return compactRecord({
    ok: false,
    built: false,
    written: false,
    boundaryKind: SAAS_AUDIT_BOUNDARY_KIND,
    reasonCode,
    organizationId: context.organizationId,
    requestId: context.requestId,
    writerFailureSanitized: reasonCode === REASON_CODES.writerFailed,
    ...nonExecutionMarkers(),
  });
}

function buildSaasAuditEvent(input = {}) {
  const source = isObject(input) ? input : {};
  const resolvedRequestId = requestId(source);
  const resolvedOrganizationId = organizationId(source);

  if (!resolvedOrganizationId) {
    return failure(REASON_CODES.organizationRequired, { requestId: resolvedRequestId });
  }

  const resolvedActionType = actionType(source);

  if (!resolvedActionType) {
    return failure(REASON_CODES.actionRequired, {
      organizationId: resolvedOrganizationId,
      requestId: resolvedRequestId,
    });
  }

  const event = compactRecord({
    boundaryKind: SAAS_AUDIT_BOUNDARY_KIND,
    visibility: 'internal_only',
    actionType: resolvedActionType,
    organizationId: resolvedOrganizationId,
    actorId: safeActorId(source),
    requestId: resolvedRequestId,
    entitlementDecision: safeDecision(source.entitlementDecision || source.entitlement),
    plan: safePlan(source.plan),
    usage: safeUsage(source.usage),
    trial: safeTrial(source.trial),
    permission: safePermission(source.permission),
    billingContactRef: safeBillingContactRef(source),
    occurredAt: stringValue(source.occurredAt),
    ...nonExecutionMarkers(),
  });

  return {
    ok: true,
    built: true,
    boundaryKind: SAAS_AUDIT_BOUNDARY_KIND,
    reasonCode: REASON_CODES.built,
    event,
  };
}

async function writeSaasAuditEvent(input = {}, options = {}) {
  const built = buildSaasAuditEvent(input);

  if (!built.ok) return built;

  const writer = options.auditWriter;

  if (!writer || (typeof writer.write !== 'function' && typeof writer.record !== 'function')) {
    return failure(REASON_CODES.writerRequired, {
      organizationId: built.event.organizationId,
      requestId: built.event.requestId,
    });
  }

  try {
    const result = typeof writer.write === 'function'
      ? await writer.write(built.event)
      : await writer.record(built.event);

    return compactRecord({
      ok: true,
      built: true,
      written: true,
      boundaryKind: SAAS_AUDIT_BOUNDARY_KIND,
      reasonCode: REASON_CODES.written,
      eventId: firstString(result && result.eventId, result && result.id),
      organizationId: built.event.organizationId,
      requestId: built.event.requestId,
      ...nonExecutionMarkers(),
    });
  } catch (_error) {
    return failure(REASON_CODES.writerFailed, {
      organizationId: built.event.organizationId,
      requestId: built.event.requestId,
    });
  }
}

module.exports = {
  SAAS_AUDIT_BOUNDARY_KIND,
  REASON_CODES,
  buildSaasAuditEvent,
  writeSaasAuditEvent,
};
