'use strict';

const SAAS_PERMISSION_CONTRACT_KIND = 'saas.permission_contract';

const REASON_CODES = Object.freeze({
  allowed: 'saas_permission_contract_allowed',
  organizationRequired: 'saas_permission_organization_required',
  organizationIsolationRequired: 'saas_permission_organization_isolation_required',
  organizationMismatch: 'saas_permission_organization_mismatch',
  organizationInactive: 'saas_permission_organization_inactive',
  permissionContextRequired: 'saas_permission_context_required',
  permissionMissing: 'saas_permission_missing',
  entitlementContextRequired: 'saas_entitlement_context_required',
  entitlementMissing: 'saas_entitlement_missing',
  frontendOnlyEntitlement: 'saas_entitlement_frontend_only_denied',
  billingContactActorDenied: 'saas_permission_billing_contact_actor_denied',
  customerReporterBillingAuthorityDenied: 'saas_permission_customer_reporter_billing_authority_denied',
  usageCannotAuthorize: 'saas_permission_usage_meter_cannot_authorize',
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

const BILLING_AUTHORITY_PERMISSIONS = new Set([
  'billing.manage',
  'saas.billing.manage',
  'billing.payment.manage',
]);

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
      || (source.organization && source.organization.status),
  );
}

function actor(source) {
  return isObject(source.actor) ? source.actor : {};
}

function actorId(source) {
  const value = actor(source);

  return firstString(source.actorId, value.id, value.actorId, value.userId);
}

function actorType(source) {
  const value = actor(source);

  return lowerString(source.actorType || value.actorType || value.userType || value.roleType);
}

function actorOrganizationId(source) {
  const value = actor(source);

  return firstString(value.organizationId, value.organization && value.organization.id);
}

function organizationIsolationContext(source) {
  if (isObject(source.organizationIsolation)) return source.organizationIsolation;
  if (isObject(source.organizationContext)) return source.organizationContext;

  return undefined;
}

function permissionContext(source) {
  if (isObject(source.permissionContext)) return source.permissionContext;
  if (isObject(source.permission)) return source.permission;

  return undefined;
}

function entitlementContext(source) {
  if (isObject(source.entitlementContext)) return source.entitlementContext;
  if (isObject(source.entitlement)) return source.entitlement;

  return undefined;
}

function hasFrontendOnlyEntitlement(source, entitlement) {
  return source.frontendOnlyEntitlement === true
    || lowerString(source.entitlementSource) === 'frontend'
    || lowerString(source.context && source.context.entitlementSource) === 'frontend'
    || lowerString(entitlement && entitlement.source) === 'frontend';
}

function requiredPermission(source, permission) {
  return firstString(
    source.requiredPermission,
    source.permissionKey,
    permission && permission.requiredPermission,
    permission && permission.permissionKey,
  );
}

function requiredEntitlement(source, entitlement) {
  return firstString(
    source.requiredEntitlement,
    source.entitlementKey,
    entitlement && entitlement.requiredEntitlement,
    entitlement && entitlement.entitlementKey,
  );
}

function hasPermission(permission, key) {
  if (!isObject(permission)) return false;
  if (permission.allowed === false || permission.granted === false) return false;
  if (permission.allowed === true || permission.granted === true) {
    const grantedKey = stringValue(permission.requiredPermission || permission.permissionKey);

    return !key || !grantedKey || grantedKey === key;
  }

  return Array.isArray(permission.permissions) && permission.permissions.includes(key);
}

function hasEntitlement(entitlement, key) {
  if (!isObject(entitlement)) return false;
  if (entitlement.allowed === false || entitlement.granted === false) return false;
  if (entitlement.allowed === true || entitlement.granted === true) {
    const grantedKey = stringValue(entitlement.requiredEntitlement || entitlement.entitlementKey);

    return !key || !grantedKey || grantedKey === key;
  }

  if (Array.isArray(entitlement.entitlements)) {
    return entitlement.entitlements.includes(key);
  }

  if (isObject(entitlement.entitlementFlags)) {
    return entitlement.entitlementFlags[key] === true;
  }

  return false;
}

function usageAccepted(source) {
  const usage = isObject(source.usageMeter)
    ? source.usageMeter
    : isObject(source.usage)
      ? source.usage
      : undefined;

  return usage && (usage.accepted === true || usage.ok === true);
}

function isBillingAuthorityRequest(permissionKey) {
  return BILLING_AUTHORITY_PERMISSIONS.has(permissionKey);
}

function nonBillingExecutionMarkers() {
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
    contractKind: SAAS_PERMISSION_CONTRACT_KIND,
    reasonCode,
    organizationId: context.organizationId,
    actorId: context.actorId,
    requiredPermission: context.requiredPermission,
    requiredEntitlement: context.requiredEntitlement,
    requestId: context.requestId,
    ...nonBillingExecutionMarkers(),
  });
}

function success(context = {}) {
  return compactRecord({
    ok: true,
    allowed: true,
    contractKind: SAAS_PERMISSION_CONTRACT_KIND,
    reasonCode: REASON_CODES.allowed,
    organizationId: context.organizationId,
    actorId: context.actorId,
    requestId: context.requestId,
    organizationIsolation: {
      requiredBeforeEntitlement: true,
      isolated: true,
    },
    permission: {
      requiredPermission: context.requiredPermission,
      granted: true,
      source: 'server_policy',
    },
    entitlement: {
      requiredEntitlement: context.requiredEntitlement,
      granted: true,
      source: 'server_policy',
    },
    usageMeterCannotAuthorize: true,
    ...nonBillingExecutionMarkers(),
  });
}

function evaluateSaasPermissionContract(input = {}) {
  const source = isObject(input) ? input : {};
  const resolvedRequestId = requestId(source);
  const resolvedOrganizationId = organizationId(source);

  if (!resolvedOrganizationId) {
    return failure(REASON_CODES.organizationRequired, { requestId: resolvedRequestId });
  }

  const isolation = organizationIsolationContext(source);

  if (!isObject(isolation) || isolation.isolated !== true) {
    return failure(REASON_CODES.organizationIsolationRequired, {
      organizationId: resolvedOrganizationId,
      requestId: resolvedRequestId,
    });
  }

  const isolatedOrganizationId = firstString(isolation.organizationId, isolation.tenantId);

  if (isolatedOrganizationId && isolatedOrganizationId !== resolvedOrganizationId) {
    return failure(REASON_CODES.organizationMismatch, {
      organizationId: resolvedOrganizationId,
      requestId: resolvedRequestId,
    });
  }

  const resolvedActorId = actorId(source);
  const resolvedActorOrganizationId = actorOrganizationId(source);

  if (resolvedActorOrganizationId && resolvedActorOrganizationId !== resolvedOrganizationId) {
    return failure(REASON_CODES.organizationMismatch, {
      organizationId: resolvedOrganizationId,
      actorId: resolvedActorId,
      requestId: resolvedRequestId,
    });
  }

  if (INACTIVE_ORGANIZATION_STATUSES.has(organizationStatus(source))) {
    return failure(REASON_CODES.organizationInactive, {
      organizationId: resolvedOrganizationId,
      actorId: resolvedActorId,
      requestId: resolvedRequestId,
    });
  }

  if (actorType(source) === 'billing_contact') {
    return failure(REASON_CODES.billingContactActorDenied, {
      organizationId: resolvedOrganizationId,
      actorId: resolvedActorId,
      requestId: resolvedRequestId,
    });
  }

  const permission = permissionContext(source);
  const permissionKey = requiredPermission(source, permission);

  if (isBillingAuthorityRequest(permissionKey) && ['customer', 'reporter'].includes(actorType(source))) {
    return failure(REASON_CODES.customerReporterBillingAuthorityDenied, {
      organizationId: resolvedOrganizationId,
      actorId: resolvedActorId,
      requiredPermission: permissionKey,
      requestId: resolvedRequestId,
    });
  }

  const entitlement = entitlementContext(source);
  const entitlementKey = requiredEntitlement(source, entitlement);

  if (hasFrontendOnlyEntitlement(source, entitlement)) {
    return failure(REASON_CODES.frontendOnlyEntitlement, {
      organizationId: resolvedOrganizationId,
      actorId: resolvedActorId,
      requiredPermission: permissionKey,
      requiredEntitlement: entitlementKey,
      requestId: resolvedRequestId,
    });
  }

  if (usageAccepted(source) && !isObject(permission) && !isObject(entitlement)) {
    return failure(REASON_CODES.usageCannotAuthorize, {
      organizationId: resolvedOrganizationId,
      actorId: resolvedActorId,
      requestId: resolvedRequestId,
    });
  }

  if (!isObject(permission)) {
    return failure(REASON_CODES.permissionContextRequired, {
      organizationId: resolvedOrganizationId,
      actorId: resolvedActorId,
      requiredPermission: permissionKey,
      requestId: resolvedRequestId,
    });
  }

  if (!hasPermission(permission, permissionKey)) {
    return failure(REASON_CODES.permissionMissing, {
      organizationId: resolvedOrganizationId,
      actorId: resolvedActorId,
      requiredPermission: permissionKey,
      requiredEntitlement: entitlementKey,
      requestId: resolvedRequestId,
    });
  }

  if (!isObject(entitlement)) {
    return failure(REASON_CODES.entitlementContextRequired, {
      organizationId: resolvedOrganizationId,
      actorId: resolvedActorId,
      requiredPermission: permissionKey,
      requiredEntitlement: entitlementKey,
      requestId: resolvedRequestId,
    });
  }

  if (!hasEntitlement(entitlement, entitlementKey)) {
    return failure(REASON_CODES.entitlementMissing, {
      organizationId: resolvedOrganizationId,
      actorId: resolvedActorId,
      requiredPermission: permissionKey,
      requiredEntitlement: entitlementKey,
      requestId: resolvedRequestId,
    });
  }

  return success({
    organizationId: resolvedOrganizationId,
    actorId: resolvedActorId,
    requiredPermission: permissionKey,
    requiredEntitlement: entitlementKey,
    requestId: resolvedRequestId,
  });
}

module.exports = {
  SAAS_PERMISSION_CONTRACT_KIND,
  REASON_CODES,
  evaluateSaasPermissionContract,
};
