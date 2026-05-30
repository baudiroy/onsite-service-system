'use strict';

const ALLOWED_ACTOR_ROLES = Object.freeze([
  'service_agent',
]);

const ALLOWED_SOURCES = Object.freeze([
  'admin_route_injected_test',
  'pre_route_factory_unit',
  'repair_intake',
  'route-like-unit',
  'route_adapter_full_composition',
  'route_handler_factory_unit',
  'route_handler_full_composition',
  'synthetic_audit_integration',
  'synthetic_controller_adapter',
  'synthetic_handler',
  'synthetic_handler_integration',
  'synthetic_http_envelope_integration',
  'synthetic_idempotency_integration',
  'synthetic_pre_route_readiness',
  'trusted_route_context',
  'trusted_route_source',
]);

const allowedActorRoleSet = new Set(ALLOWED_ACTOR_ROLES);
const allowedSourceSet = new Set(ALLOWED_SOURCES);

function isPlainObject(value) {
  return Boolean(value)
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype;
}

function safeString(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function normalizedValue(value) {
  const safeValue = safeString(value);

  return safeValue ? safeValue.toLowerCase() : null;
}

function deny(reasonCode, context = {}) {
  return {
    allowed: false,
    reasonCode,
    organizationId: context.organizationId || null,
    actorId: context.actorId || null,
    actorRole: context.actorRole || null,
    repairIntakeDraftId: context.repairIntakeDraftId || null,
    source: context.source || null,
  };
}

function allow(context) {
  return {
    allowed: true,
    reasonCode: 'allowed',
    organizationId: context.organizationId,
    actorId: context.actorId,
    actorRole: context.actorRole,
    repairIntakeDraftId: context.repairIntakeDraftId,
    source: context.source,
  };
}

function trustedContext(input = {}) {
  const safeInput = isPlainObject(input) ? input : {};

  return {
    organizationId: safeString(safeInput.organizationId),
    actorId: safeString(safeInput.actorId),
    actorRole: normalizedValue(safeInput.actorRole),
    repairIntakeDraftId: safeString(safeInput.repairIntakeDraftId),
    source: normalizedValue(safeInput.source),
  };
}

function decideRepairIntakeDraftToCasePermission(input = {}) {
  const context = trustedContext(input);

  if (
    !context.organizationId
    || !context.actorId
    || !context.actorRole
    || !context.repairIntakeDraftId
  ) {
    return deny('missing_trusted_context', context);
  }

  if (!allowedActorRoleSet.has(context.actorRole)) {
    return deny('role_not_allowed', context);
  }

  if (!context.source || !allowedSourceSet.has(context.source)) {
    return deny('invalid_source', context);
  }

  return allow(context);
}

module.exports = {
  ALLOWED_ACTOR_ROLES,
  ALLOWED_SOURCES,
  decideRepairIntakeDraftToCasePermission,
};
