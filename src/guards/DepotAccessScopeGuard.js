'use strict';

const DEPOT_ACCESS_SCOPE_GUARD_KIND = 'depot_workshop.access_scope_guard';

const DEPOT_ACCESS_SCOPE_ROLES = Object.freeze({
  BRAND: 'brand',
  SERVICE_PROVIDER: 'service_provider',
  SUBCONTRACTOR: 'subcontractor',
});

const ALLOWED_SCOPE_ROLES = new Set(Object.values(DEPOT_ACCESS_SCOPE_ROLES));

const ACTIVE_RELATIONSHIPS = new Set([
  'assigned_executor',
  'assigned_workshop',
  'active_assignment',
  'depot_workshop_assignment',
]);

const SUBCONTRACTOR_ALLOWED_FIELDS = Object.freeze([
  'depotIntakeId',
  'workflowType',
  'depotStatus',
  'itemRef',
  'productRef',
  'issueSummaryRef',
  'workshopId',
  'assignmentRef',
]);

const INTERNAL_ALLOWED_FIELDS = Object.freeze([
  ...SUBCONTRACTOR_ALLOWED_FIELDS,
  'brandId',
  'serviceProviderId',
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

function firstString(...values) {
  return values.map(stringValue).find(Boolean);
}

function compactRecord(record) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  );
}

function safeList(...values) {
  const result = [];

  for (const value of values) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const safe = stringValue(item);

        if (safe) {
          result.push(safe);
        }
      }
    } else {
      const safe = stringValue(value);

      if (safe) {
        result.push(safe);
      }
    }
  }

  return Array.from(new Set(result));
}

function hasValue(values, expected) {
  return Boolean(expected) && values.includes(expected);
}

function normalizeRole(value) {
  const role = stringValue(value);

  if (!role) {
    return undefined;
  }

  const normalized = role.toLowerCase().replace(/[-\s]+/g, '_');

  if (normalized.startsWith('brand')) {
    return DEPOT_ACCESS_SCOPE_ROLES.BRAND;
  }

  if (normalized.startsWith('service_provider') || normalized.startsWith('provider')) {
    return DEPOT_ACCESS_SCOPE_ROLES.SERVICE_PROVIDER;
  }

  if (normalized.startsWith('subcontractor')) {
    return DEPOT_ACCESS_SCOPE_ROLES.SUBCONTRACTOR;
  }

  return normalized;
}

function actorFrom(input = {}) {
  const actor = isObject(input.actor) ? input.actor : {};
  const user = isObject(input.user) ? input.user : {};

  return {
    id: firstString(input.actorId, actor.id, actor.userId, actor.sub, user.id, user.userId, user.sub),
    role: normalizeRole(firstString(input.actorRole, input.role, actor.role, actor.actorRole, user.role)),
    organizationId: firstString(
      input.organizationId,
      actor.organizationId,
      actor.organization_id,
      user.organizationId,
      user.organization_id,
    ),
    brandIds: safeList(
      input.brandId,
      input.brand_id,
      actor.brandId,
      actor.brand_id,
      actor.brandIds,
      actor.brand_ids,
      user.brandId,
      user.brand_id,
      user.brandIds,
      user.brand_ids,
    ),
    serviceProviderIds: safeList(
      input.serviceProviderId,
      input.service_provider_id,
      input.providerId,
      actor.serviceProviderId,
      actor.service_provider_id,
      actor.serviceProviderIds,
      actor.service_provider_ids,
      actor.providerId,
      user.serviceProviderId,
      user.service_provider_id,
      user.serviceProviderIds,
      user.service_provider_ids,
      user.providerId,
    ),
    subcontractorOrganizationIds: safeList(
      input.subcontractorOrganizationId,
      input.subcontractor_organization_id,
      actor.subcontractorOrganizationId,
      actor.subcontractor_organization_id,
      actor.subcontractorOrganizationIds,
      actor.subcontractor_organization_ids,
      user.subcontractorOrganizationId,
      user.subcontractor_organization_id,
      user.subcontractorOrganizationIds,
      user.subcontractor_organization_ids,
    ),
  };
}

function contextFrom(input = {}) {
  const context = isObject(input.context) ? input.context : {};
  const access = isObject(input.accessContext)
    ? input.accessContext
    : (isObject(input.permissionContext) ? input.permissionContext : {});
  const contextAccess = isObject(context.accessContext) ? context.accessContext : {};

  return {
    organizationId: firstString(
      access.organizationId,
      access.organization_id,
      contextAccess.organizationId,
      contextAccess.organization_id,
      context.organizationId,
      context.organization_id,
    ),
    role: normalizeRole(firstString(access.role, access.scopeRole, contextAccess.role, contextAccess.scopeRole)),
    brandIds: safeList(
      access.brandId,
      access.brand_id,
      access.brandIds,
      access.brand_ids,
      access.allowedBrandIds,
      contextAccess.brandId,
      contextAccess.brandIds,
      contextAccess.allowedBrandIds,
    ),
    serviceProviderIds: safeList(
      access.serviceProviderId,
      access.service_provider_id,
      access.serviceProviderIds,
      access.service_provider_ids,
      access.allowedServiceProviderIds,
      contextAccess.serviceProviderId,
      contextAccess.serviceProviderIds,
      contextAccess.allowedServiceProviderIds,
    ),
    subcontractorOrganizationIds: safeList(
      access.subcontractorOrganizationId,
      access.subcontractor_organization_id,
      access.subcontractorOrganizationIds,
      access.subcontractor_organization_ids,
      access.allowedSubcontractorOrganizationIds,
      contextAccess.subcontractorOrganizationId,
      contextAccess.subcontractorOrganizationIds,
      contextAccess.allowedSubcontractorOrganizationIds,
    ),
    disabled: access.disabled === true
      || access.accessDisabled === true
      || contextAccess.disabled === true
      || contextAccess.accessDisabled === true,
    revoked: access.revoked === true
      || access.accessRevoked === true
      || contextAccess.revoked === true
      || contextAccess.accessRevoked === true,
    status: firstString(access.status, access.accessStatus, contextAccess.status, contextAccess.accessStatus),
    relationship: firstString(
      input.assignmentRelationship,
      input.accessRelationship,
      access.assignmentRelationship,
      access.accessRelationship,
      access.caseRelationship,
      contextAccess.assignmentRelationship,
      contextAccess.accessRelationship,
      contextAccess.caseRelationship,
      context.assignmentRelationship,
      context.accessRelationship,
      context.caseRelationship,
    ),
  };
}

function resourceFrom(input = {}) {
  const resource = isObject(input.resource) ? input.resource : {};
  const depotIntake = isObject(input.depotIntake) ? input.depotIntake : {};
  const workshopItem = isObject(input.workshopItem) ? input.workshopItem : {};

  return {
    organizationId: firstString(
      input.resourceOrganizationId,
      input.resource_organization_id,
      resource.organizationId,
      resource.organization_id,
      depotIntake.organizationId,
      depotIntake.organization_id,
      workshopItem.organizationId,
      workshopItem.organization_id,
    ),
    brandId: firstString(
      input.resourceBrandId,
      input.resource_brand_id,
      resource.brandId,
      resource.brand_id,
      depotIntake.brandId,
      depotIntake.brand_id,
      workshopItem.brandId,
      workshopItem.brand_id,
    ),
    serviceProviderId: firstString(
      input.resourceServiceProviderId,
      input.resource_service_provider_id,
      resource.serviceProviderId,
      resource.service_provider_id,
      resource.providerId,
      depotIntake.serviceProviderId,
      depotIntake.service_provider_id,
      depotIntake.providerId,
      workshopItem.serviceProviderId,
      workshopItem.service_provider_id,
      workshopItem.providerId,
    ),
    subcontractorOrganizationId: firstString(
      input.resourceSubcontractorOrganizationId,
      input.resource_subcontractor_organization_id,
      resource.subcontractorOrganizationId,
      resource.subcontractor_organization_id,
      depotIntake.subcontractorOrganizationId,
      depotIntake.subcontractor_organization_id,
      workshopItem.subcontractorOrganizationId,
      workshopItem.subcontractor_organization_id,
    ),
    relationship: firstString(
      resource.assignmentRelationship,
      resource.accessRelationship,
      depotIntake.assignmentRelationship,
      depotIntake.accessRelationship,
      workshopItem.assignmentRelationship,
      workshopItem.accessRelationship,
    ),
    subcontractorAssignmentApproved: resource.subcontractorAssignmentApproved === true
      || depotIntake.subcontractorAssignmentApproved === true
      || workshopItem.subcontractorAssignmentApproved === true,
  };
}

function requestIdFrom(input = {}) {
  const context = isObject(input.context) ? input.context : {};

  return firstString(input.requestId, context.requestId);
}

function accessIsInactive(access) {
  const status = stringValue(access.status);

  return access.disabled === true
    || access.revoked === true
    || status === 'revoked'
    || status === 'disabled'
    || status === 'inactive';
}

function explicitSubcontractorRelationship(access, resource) {
  return resource.subcontractorAssignmentApproved === true
    || ACTIVE_RELATIONSHIPS.has(stringValue(access.relationship))
    || ACTIVE_RELATIONSHIPS.has(stringValue(resource.relationship));
}

function failure(reasonCode, input = {}) {
  return compactRecord({
    ok: false,
    allowed: false,
    guardKind: DEPOT_ACCESS_SCOPE_GUARD_KIND,
    reasonCode,
    requestId: requestIdFrom(input),
    accessScope: null,
  });
}

function success(scope, input = {}) {
  return compactRecord({
    ok: true,
    allowed: true,
    guardKind: DEPOT_ACCESS_SCOPE_GUARD_KIND,
    reasonCode: 'depot_access_scope_allowed',
    requestId: requestIdFrom(input),
    accessScope: scope,
  });
}

function buildScope({ actor, role, organizationId, resource, input }) {
  const isSubcontractor = role === DEPOT_ACCESS_SCOPE_ROLES.SUBCONTRACTOR;

  return compactRecord({
    organizationId,
    actorId: actor.id,
    role,
    brandId: role === DEPOT_ACCESS_SCOPE_ROLES.BRAND ? resource.brandId : undefined,
    serviceProviderId: role === DEPOT_ACCESS_SCOPE_ROLES.SERVICE_PROVIDER ? resource.serviceProviderId : undefined,
    subcontractorOrganizationId: isSubcontractor ? resource.subcontractorOrganizationId : undefined,
    dataProfile: isSubcontractor ? 'subcontractor_minimized' : 'depot_internal',
    allowedFields: isSubcontractor ? SUBCONTRACTOR_ALLOWED_FIELDS : INTERNAL_ALLOWED_FIELDS,
    requestId: requestIdFrom(input),
  });
}

function evaluateDepotAccessScope(input = {}) {
  const source = isObject(input) ? input : {};
  const actor = actorFrom(source);
  const access = contextFrom(source);
  const resource = resourceFrom(source);
  const role = access.role || actor.role;
  const organizationId = actor.organizationId;
  const accessOrganizationId = access.organizationId;

  if (!actor.id || !role) {
    return failure('depot_access_actor_context_required', source);
  }

  if (!ALLOWED_SCOPE_ROLES.has(role)) {
    return failure('depot_access_unknown_scope', source);
  }

  if (!organizationId || !accessOrganizationId || !resource.organizationId) {
    return failure('organization_id_required', source);
  }

  if (organizationId !== accessOrganizationId || organizationId !== resource.organizationId) {
    return failure('depot_access_organization_mismatch', source);
  }

  if (accessIsInactive(access)) {
    return failure('depot_access_revoked_or_disabled', source);
  }

  const brandIds = safeList(actor.brandIds, access.brandIds);
  const serviceProviderIds = safeList(actor.serviceProviderIds, access.serviceProviderIds);
  const subcontractorOrganizationIds = safeList(
    actor.subcontractorOrganizationIds,
    access.subcontractorOrganizationIds,
  );

  if (role === DEPOT_ACCESS_SCOPE_ROLES.BRAND) {
    if (!resource.brandId || brandIds.length === 0) {
      return failure('depot_access_brand_scope_required', source);
    }

    if (!hasValue(brandIds, resource.brandId)) {
      return failure('depot_access_brand_scope_mismatch', source);
    }
  }

  if (role === DEPOT_ACCESS_SCOPE_ROLES.SERVICE_PROVIDER) {
    if (!resource.serviceProviderId || serviceProviderIds.length === 0) {
      return failure('depot_access_service_provider_scope_required', source);
    }

    if (!hasValue(serviceProviderIds, resource.serviceProviderId)) {
      return failure('depot_access_service_provider_scope_mismatch', source);
    }
  }

  if (role === DEPOT_ACCESS_SCOPE_ROLES.SUBCONTRACTOR) {
    if (!explicitSubcontractorRelationship(access, resource)) {
      return failure('depot_access_subcontractor_relationship_required', source);
    }

    if (
      resource.subcontractorOrganizationId
      && subcontractorOrganizationIds.length > 0
      && !hasValue(subcontractorOrganizationIds, resource.subcontractorOrganizationId)
    ) {
      return failure('depot_access_subcontractor_scope_mismatch', source);
    }
  }

  return success(buildScope({
    actor,
    role,
    organizationId,
    resource,
    input: source,
  }), source);
}

module.exports = {
  DEPOT_ACCESS_SCOPE_GUARD_KIND,
  DEPOT_ACCESS_SCOPE_ROLES,
  evaluateDepotAccessScope,
};
