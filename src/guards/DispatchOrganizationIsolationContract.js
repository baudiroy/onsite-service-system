'use strict';

const DISPATCH_ORGANIZATION_ISOLATION_CONTRACT_KIND = 'admin_dispatch.organization_isolation_runtime_contract';

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

function permissionContext(input = {}) {
  const context = isObject(input.context) ? input.context : {};
  const nested = isObject(context.permissionContext) ? context.permissionContext : {};
  const direct = isObject(input.permissionContext) ? input.permissionContext : {};

  return {
    ...nested,
    ...direct,
  };
}

function hasDispatchManagePermission(input = {}) {
  const permission = permissionContext(input);

  if (permission.canManageDispatch === true || permission.permission === 'dispatch.manage') {
    return true;
  }

  return Array.isArray(permission.permissions) && permission.permissions.includes('dispatch.manage');
}

function routeOrganizationId(input = {}) {
  return firstString(
    input.organizationId,
    input.context && input.context.organizationId,
    input.actor && input.actor.organizationId,
  );
}

function actorId(input = {}) {
  return firstString(
    input.actorId,
    input.actor && input.actor.id,
    input.actor && input.actor.userId,
  );
}

function repositorySpecs(input = {}) {
  if (Array.isArray(input.repositorySpecs)) {
    return input.repositorySpecs;
  }

  if (isObject(input.repositorySpec)) {
    return [input.repositorySpec];
  }

  return [];
}

function specHasOrganizationPredicate(spec, organizationId) {
  if (!isObject(spec)) {
    return false;
  }

  const text = stringValue(spec.text) || '';
  const values = Array.isArray(spec.values) ? spec.values : [];
  const hasReadJoin = text.includes('JOIN cases AS c ON c.id = da.case_id');
  const hasWriteJoin = text.includes('FROM cases AS c')
    && text.includes('da.case_id = c.id');

  return (hasReadJoin || hasWriteJoin)
    && text.includes('c.organization_id = $2::uuid')
    && values[1] === organizationId;
}

function visibleAssignmentOrganization(input = {}) {
  const assignment = isObject(input.visibleAssignment) ? input.visibleAssignment : {};

  return firstString(assignment.organizationId, input.visibleOrganizationId);
}

function failure(reasonCode, context = {}) {
  return compactRecord({
    ok: false,
    isolated: false,
    contractKind: DISPATCH_ORGANIZATION_ISOLATION_CONTRACT_KIND,
    reasonCode,
    requestId: stringValue(context.requestId),
  });
}

function success(context = {}) {
  return compactRecord({
    ok: true,
    isolated: true,
    contractKind: DISPATCH_ORGANIZATION_ISOLATION_CONTRACT_KIND,
    reasonCode: 'dispatch_organization_isolation_contract_satisfied',
    requestId: stringValue(context.requestId),
    organizationId: context.organizationId,
  });
}

function evaluateDispatchOrganizationIsolationContract(input = {}) {
  const source = isObject(input) ? input : {};
  const requestId = firstString(source.requestId, source.context && source.context.requestId);
  const organizationId = routeOrganizationId(source);
  const resolvedActorId = actorId(source);

  if (source.organizationSource === 'global') {
    return failure('global_organization_fallback_forbidden', { requestId });
  }

  if (!resolvedActorId) {
    return failure('admin_actor_required', { requestId });
  }

  if (!organizationId) {
    return failure('organization_id_required', { requestId });
  }

  if (!hasDispatchManagePermission(source)) {
    return failure('dispatch_permission_context_required', { requestId });
  }

  const specs = repositorySpecs(source);

  if (specs.length > 0 && specs.some((spec) => !specHasOrganizationPredicate(spec, organizationId))) {
    return failure('repository_organization_predicate_required', { requestId });
  }

  const assignmentOrganizationId = visibleAssignmentOrganization(source);

  if (assignmentOrganizationId && assignmentOrganizationId !== organizationId) {
    return failure('visible_assignment_organization_mismatch', { requestId });
  }

  return success({
    organizationId,
    requestId,
  });
}

module.exports = {
  DISPATCH_ORGANIZATION_ISOLATION_CONTRACT_KIND,
  evaluateDispatchOrganizationIsolationContract,
};
