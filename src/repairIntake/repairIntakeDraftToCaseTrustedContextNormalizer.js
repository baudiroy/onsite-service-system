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

function safeObject(value) {
  return isPlainObject(value) ? value : {};
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
    context: null,
  };
}

function normalizeRepairIntakeDraftToCaseTrustedContext(input = {}) {
  if (!isPlainObject(input)) {
    return fail('trusted_context_invalid');
  }

  const params = safeObject(input.params);
  const user = safeObject(input.user);
  const context = safeObject(input.context);
  const sessionContext = safeObject(input.sessionContext);
  const permissionContext = trustedPermissionContext(
    input.permissionContext,
    context.permissionContext,
    sessionContext.permissionContext,
  );

  const organizationId = firstString(
    user.organizationId,
    context.organizationId,
    sessionContext.organizationId,
    input.organizationId,
  );
  const repairIntakeDraftId = firstString(
    params.draftId,
    params.repairIntakeDraftId,
    input.repairIntakeDraftId,
    input.draftId,
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
    return fail('trusted_context_organization_required');
  }

  if (!repairIntakeDraftId) {
    return fail('trusted_context_draft_required');
  }

  if (!actorId) {
    return fail('trusted_context_actor_required');
  }

  return {
    ok: true,
    status: 'ready',
    reasonCode: 'trusted_context_ready',
    context: compactObject({
      organizationId,
      tenantId: firstString(user.tenantId, context.tenantId, sessionContext.tenantId, input.tenantId),
      actorId,
      actorRole: firstString(sessionContext.actorRole, context.actorRole, input.actorRole),
      source: firstString(input.requestSource, input.source, context.source, sessionContext.source),
      repairIntakeDraftId,
      requestId: firstString(input.requestId, context.requestId, sessionContext.requestId),
      correlationId: firstString(input.correlationId, context.correlationId, sessionContext.correlationId),
      idempotencyKey: firstString(input.idempotencyKey, context.idempotencyKey, sessionContext.idempotencyKey),
      permissionContext,
    }),
  };
}

module.exports = {
  normalizeRepairIntakeDraftToCaseTrustedContext,
};
