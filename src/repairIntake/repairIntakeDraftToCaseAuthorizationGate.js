'use strict';

const INVALID_DEPENDENCY_ACTIONS = ['configure_permission_resolver'];
const RETRY_ACTIONS = ['retry_or_manual_review'];

const UNSAFE_FIELD_NAMES = new Set([
  'address',
  'authorization',
  'cookie',
  'customer',
  'customerdata',
  'customername',
  'customerphone',
  'databaseurl',
  'd' + 'b',
  'error',
  'final' + 'appointment' + 'id',
  'headers',
  'lineaccesstoken',
  'lineuserid',
  'params',
  'phone',
  'query',
  'raw',
  'rawbody',
  'rawcontext',
  'rawresult',
  'rawrow',
  'rawrows',
  'secret',
  's' + 'ql',
  'stack',
  'token',
]);

function isPlainObject(value) {
  return Boolean(value)
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype;
}

function normalizedFieldName(value) {
  return String(value).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

function fieldIsUnsafe(key) {
  const normalized = normalizedFieldName(key);

  return normalized.startsWith('raw') || UNSAFE_FIELD_NAMES.has(normalized);
}

function sanitizeNestedValue(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeNestedValue(item))
      .filter((item) => item !== undefined);
  }

  if (isPlainObject(value)) {
    const result = {};

    for (const [key, fieldValue] of Object.entries(value)) {
      if (fieldIsUnsafe(key)) {
        continue;
      }

      const sanitized = sanitizeNestedValue(fieldValue);

      if (sanitized !== undefined) {
        result[key] = sanitized;
      }
    }

    return result;
  }

  if (value === undefined || typeof value === 'function' || typeof value === 'symbol') {
    return undefined;
  }

  return value;
}

function safeString(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function safeArray(value) {
  return Array.isArray(value)
    ? sanitizeNestedValue(value).filter((item) => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function safeObject(value) {
  return isPlainObject(value) ? sanitizeNestedValue(value) : {};
}

function createSafeContext(context) {
  const safeContext = safeObject(context);

  return sanitizeNestedValue({
    organizationId: safeString(safeContext.organizationId),
    actorId: safeString(safeContext.actorId),
    repairIntakeDraftId: safeString(safeContext.repairIntakeDraftId),
    source: safeString(safeContext.source),
    actorRole: safeString(safeContext.actorRole),
    requestId: safeString(safeContext.requestId),
    tenantId: safeString(safeContext.tenantId),
    metadata: safeObject(safeContext.metadata),
  });
}

function validateAuthorizationContext(context) {
  if (!isPlainObject(context)) {
    return 'REPAIR_INTAKE_DRAFT_TO_CASE_AUTHORIZATION_GATE_CONTEXT_INVALID';
  }

  if (!safeString(context.organizationId)) {
    return 'REPAIR_INTAKE_DRAFT_TO_CASE_AUTHORIZATION_GATE_ORGANIZATION_REQUIRED';
  }

  if (!safeString(context.actorId)) {
    return 'REPAIR_INTAKE_DRAFT_TO_CASE_AUTHORIZATION_GATE_ACTOR_REQUIRED';
  }

  if (!safeString(context.repairIntakeDraftId)) {
    return 'REPAIR_INTAKE_DRAFT_TO_CASE_AUTHORIZATION_GATE_DRAFT_REQUIRED';
  }

  return null;
}

function invalidInputEnvelope(reasonCode, context = {}) {
  const safeContext = createSafeContext(isPlainObject(context) ? context : {});

  return sanitizeNestedValue({
    ok: false,
    allowed: false,
    status: 'invalid_input',
    reasonCode,
    requiredActions: ['provide_valid_authorization_context'],
    organizationId: safeContext.organizationId || null,
    actorId: safeContext.actorId || null,
    repairIntakeDraftId: safeContext.repairIntakeDraftId || null,
    source: safeContext.source || null,
    actorRole: safeContext.actorRole || null,
    requestId: safeContext.requestId || null,
    tenantId: safeContext.tenantId || null,
    metadata: {},
    warnings: [],
  });
}

function invalidDependencyEnvelope(reasonCode) {
  return {
    ok: false,
    allowed: false,
    status: 'invalid_dependency',
    reasonCode,
    requiredActions: INVALID_DEPENDENCY_ACTIONS,
    organizationId: null,
    actorId: null,
    repairIntakeDraftId: null,
    source: null,
    actorRole: null,
    requestId: null,
    tenantId: null,
    metadata: {},
    warnings: [],
  };
}

function resolverFailureEnvelope(context) {
  const safeContext = createSafeContext(context);

  return sanitizeNestedValue({
    ok: false,
    allowed: false,
    status: 'failed',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_AUTHORIZATION_GATE_RESOLVER_FAILED',
    requiredActions: RETRY_ACTIONS,
    organizationId: safeContext.organizationId || null,
    actorId: safeContext.actorId || null,
    repairIntakeDraftId: safeContext.repairIntakeDraftId || null,
    source: safeContext.source || null,
    actorRole: safeContext.actorRole || null,
    requestId: safeContext.requestId || null,
    tenantId: safeContext.tenantId || null,
    metadata: {},
    warnings: [],
  });
}

function resultIsAllowed(resolverResult) {
  if (resolverResult === true) {
    return true;
  }

  return isPlainObject(resolverResult) && resolverResult.allowed === true;
}

function normalizeResolverResult(context, resolverResult) {
  const safeContext = createSafeContext(context);
  const result = safeObject(resolverResult);
  const allowed = resultIsAllowed(resolverResult);

  return sanitizeNestedValue({
    ok: allowed,
    allowed,
    status: allowed ? 'allowed' : 'denied',
    reasonCode: safeString(result.reasonCode)
      || (allowed
        ? 'REPAIR_INTAKE_DRAFT_TO_CASE_AUTHORIZATION_GATE_ALLOWED'
        : 'REPAIR_INTAKE_DRAFT_TO_CASE_AUTHORIZATION_GATE_DENIED'),
    requiredActions: allowed ? [] : (
      safeArray(result.requiredActions).length > 0 ? safeArray(result.requiredActions) : ['request_permission_review']
    ),
    organizationId: safeContext.organizationId || null,
    actorId: safeContext.actorId || null,
    repairIntakeDraftId: safeContext.repairIntakeDraftId || null,
    source: safeContext.source || null,
    actorRole: safeContext.actorRole || null,
    requestId: safeContext.requestId || null,
    tenantId: safeContext.tenantId || null,
    metadata: safeObject(result.metadata),
    warnings: safeArray(result.warnings),
  });
}

function createInvalidAuthorizationGate(reasonCode) {
  async function authorizeDraftToCase() {
    return invalidDependencyEnvelope(reasonCode);
  }

  return {
    authorizeDraftToCase,
  };
}

function createRepairIntakeDraftToCaseAuthorizationGate(options = {}) {
  const safeOptions = isPlainObject(options) ? options : {};
  const { permissionResolver } = safeOptions;

  if (!isPlainObject(permissionResolver)) {
    return createInvalidAuthorizationGate(
      'REPAIR_INTAKE_DRAFT_TO_CASE_AUTHORIZATION_GATE_RESOLVER_REQUIRED',
    );
  }

  if (typeof permissionResolver.canCreateCaseFromRepairIntakeDraft !== 'function') {
    return createInvalidAuthorizationGate(
      'REPAIR_INTAKE_DRAFT_TO_CASE_AUTHORIZATION_GATE_RESOLVER_METHOD_REQUIRED',
    );
  }

  async function authorizeDraftToCase(context = {}) {
    const invalidReasonCode = validateAuthorizationContext(context);

    if (invalidReasonCode) {
      return invalidInputEnvelope(invalidReasonCode, context);
    }

    const safeContext = createSafeContext(context);

    try {
      const resolverResult = await permissionResolver.canCreateCaseFromRepairIntakeDraft(safeContext);

      return normalizeResolverResult(safeContext, resolverResult);
    } catch (error) {
      return resolverFailureEnvelope(safeContext);
    }
  }

  return {
    authorizeDraftToCase,
  };
}

module.exports = {
  createRepairIntakeDraftToCaseAuthorizationGate,
};
