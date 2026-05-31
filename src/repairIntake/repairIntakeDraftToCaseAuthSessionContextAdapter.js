'use strict';

const UNSAFE_TEXT_MARKERS = Object.freeze([
  'ai/rag',
  'authorization',
  'billing',
  'customer address',
  'customer contact',
  'customer private',
  'database_url',
  'debug',
  'full address',
  'invoice',
  'openai',
  'password',
  'payment',
  'postgres://',
  'postgresql://',
  'provider',
  'rag',
  'raw body',
  'raw request',
  'secret',
  'select *',
  'settlement',
  'stack',
  'token',
  'vector',
]);

function isPlainObject(value) {
  return Boolean(value)
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype;
}

function safeObject(value) {
  return isPlainObject(value) ? value : {};
}

function stringHasUnsafeText(value) {
  const normalized = value.toLowerCase();

  return UNSAFE_TEXT_MARKERS.some((marker) => normalized.includes(marker));
}

function safeString(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed || stringHasUnsafeText(trimmed)) {
    return null;
  }

  return trimmed;
}

function firstString(...values) {
  for (const value of values) {
    const candidate = safeString(value);

    if (candidate) {
      return candidate;
    }
  }

  return null;
}

function compactObject(value) {
  const result = {};

  for (const [key, fieldValue] of Object.entries(value)) {
    if (fieldValue !== null && fieldValue !== undefined) {
      result[key] = fieldValue;
    }
  }

  return result;
}

function trustedPermissionContext(...values) {
  for (const value of values) {
    const source = safeObject(value);
    const permission = safeString(source.permission);
    const canCreateCaseFromRepairIntakeDraft = source.canCreateCaseFromRepairIntakeDraft === true;
    const result = compactObject({
      ...(canCreateCaseFromRepairIntakeDraft ? { canCreateCaseFromRepairIntakeDraft: true } : {}),
      permission,
    });

    if (Object.keys(result).length > 0) {
      return result;
    }
  }

  return null;
}

function fail(reasonCode) {
  return {
    ok: false,
    status: 'failed',
    reasonCode,
    sessionContext: null,
  };
}

function buildRepairIntakeDraftToCaseAuthSessionContext(input = {}) {
  if (!isPlainObject(input)) {
    return fail('auth_session_context_invalid');
  }

  const user = safeObject(input.user);
  const context = safeObject(input.context);
  const sessionContext = safeObject(input.sessionContext);
  const organizationId = firstString(
    user.organizationId,
    context.organizationId,
    sessionContext.organizationId,
    input.organizationId,
  );
  const actorId = firstString(
    user.id,
    user.userId,
    user.sub,
    context.actorId,
    sessionContext.actorId,
    input.actorId,
  );

  if (!organizationId) {
    return fail('auth_session_context_organization_required');
  }

  if (!actorId) {
    return fail('auth_session_context_actor_required');
  }

  return {
    ok: true,
    status: 'ready',
    reasonCode: 'auth_session_context_ready',
    sessionContext: compactObject({
      organizationId,
      tenantId: firstString(user.tenantId, context.tenantId, sessionContext.tenantId, input.tenantId),
      actorId,
      actorRole: firstString(
        sessionContext.actorRole,
        context.actorRole,
        input.actorRole,
        Array.isArray(user.roles) ? user.roles[0] : null,
      ),
      source: firstString(input.source, context.source, sessionContext.source, 'admin_authenticated_session'),
      requestId: firstString(input.requestId, context.requestId, sessionContext.requestId),
      correlationId: firstString(input.correlationId, context.correlationId, sessionContext.correlationId),
      idempotencyKey: firstString(input.idempotencyKey, context.idempotencyKey, sessionContext.idempotencyKey),
      permissionContext: trustedPermissionContext(
        input.permissionContext,
        context.permissionContext,
        sessionContext.permissionContext,
      ),
    }),
  };
}

module.exports = {
  buildRepairIntakeDraftToCaseAuthSessionContext,
};
