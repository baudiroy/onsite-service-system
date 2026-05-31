'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  normalizeRepairIntakeDraftToCaseTrustedContext,
} = require('../../src/repairIntake/repairIntakeDraftToCaseTrustedContextNormalizer');

function trustedInput(overrides = {}) {
  return {
    params: {
      draftId: 'draft_from_params',
    },
    user: {
      id: 'actor_from_user',
      userId: 'actor_from_user_id',
      sub: 'actor_from_sub',
      organizationId: 'org_from_user',
      tenantId: 'tenant_from_user',
    },
    context: {
      organizationId: 'org_from_context',
      tenantId: 'tenant_from_context',
      actorId: 'actor_from_context',
      actorRole: 'context_role',
      requestId: 'request_from_context',
      correlationId: 'correlation_from_context',
      idempotencyKey: 'idempotency_from_context',
      source: 'source_from_context',
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
        permission: 'cases.create',
        rawToken: 'token_should_not_leak',
      },
    },
    sessionContext: {
      actorId: 'actor_from_session',
      actorRole: 'service_agent',
      source: 'source_from_session',
    },
    requestId: 'request_from_top_level',
    correlationId: 'correlation_from_top_level',
    idempotencyKey: 'idempotency_from_top_level',
    source: 'source_from_top_level',
    tenantId: 'tenant_from_top_level',
    body: {
      organizationId: 'body_org_should_not_bind',
      actorId: 'body_actor_should_not_bind',
      repairIntakeDraftId: 'body_draft_should_not_bind',
      requestId: 'body_request_should_not_bind',
      idempotencyKey: 'body_idempotency_should_not_bind',
      source: 'body_source_should_not_bind',
      token: 'token_should_not_leak',
      providerPayload: 'provider_should_not_leak',
    },
    requestBody: {
      organizationId: 'request_body_org_should_not_bind',
    },
    draftInput: {
      source: 'draft_input_source_should_not_bind',
    },
    ...overrides,
  };
}

function assertNoLeak(value) {
  const text = JSON.stringify(value);

  for (const marker of [
    'body_org_should_not_bind',
    'body_actor_should_not_bind',
    'body_draft_should_not_bind',
    'body_request_should_not_bind',
    'body_idempotency_should_not_bind',
    'body_source_should_not_bind',
    'request_body_org_should_not_bind',
    'draft_input_source_should_not_bind',
    'token_should_not_leak',
    'provider_should_not_leak',
    'rawToken',
  ]) {
    assert.equal(text.includes(marker), false, `result leaked ${marker}`);
  }
}

test('normalizes trusted route user context and session fields with trusted precedence', () => {
  const result = normalizeRepairIntakeDraftToCaseTrustedContext(trustedInput());

  assert.deepEqual(result, {
    ok: true,
    status: 'ready',
    reasonCode: 'trusted_context_ready',
    context: {
      organizationId: 'org_from_user',
      tenantId: 'tenant_from_user',
      actorId: 'actor_from_user',
      actorRole: 'service_agent',
      source: 'source_from_top_level',
      repairIntakeDraftId: 'draft_from_params',
      requestId: 'request_from_top_level',
      correlationId: 'correlation_from_top_level',
      idempotencyKey: 'idempotency_from_top_level',
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
        permission: 'cases.create',
      },
    },
  });
  assertNoLeak(result);
});

test('uses accepted trusted fallbacks without reading raw body requestBody or draftInput context', () => {
  const result = normalizeRepairIntakeDraftToCaseTrustedContext(trustedInput({
    params: {
      repairIntakeDraftId: 'draft_from_params_fallback',
    },
    user: {
      sub: 'actor_from_sub',
    },
    context: {
      organizationId: 'org_from_context',
      tenantId: 'tenant_from_context',
      actorRole: 'context_role',
      requestId: 'request_from_context',
      correlationId: 'correlation_from_context',
      idempotencyKey: 'idempotency_from_context',
      source: 'source_from_context',
    },
    sessionContext: {},
    requestId: null,
    correlationId: null,
    idempotencyKey: null,
    source: null,
    tenantId: 'tenant_from_top_level',
  }));

  assert.equal(result.ok, true);
  assert.deepEqual(result.context, {
    organizationId: 'org_from_context',
    tenantId: 'tenant_from_context',
    actorId: 'actor_from_sub',
    actorRole: 'context_role',
    source: 'source_from_context',
    repairIntakeDraftId: 'draft_from_params_fallback',
    requestId: 'request_from_context',
    correlationId: 'correlation_from_context',
    idempotencyKey: 'idempotency_from_context',
  });
  assertNoLeak(result);
});

test('fails closed for malformed input and missing required trusted context', () => {
  assert.deepEqual(normalizeRepairIntakeDraftToCaseTrustedContext(null), {
    ok: false,
    status: 'failed',
    reasonCode: 'trusted_context_invalid',
    context: null,
  });

  assert.deepEqual(normalizeRepairIntakeDraftToCaseTrustedContext(trustedInput({
    user: {
      id: 'actor_from_user',
    },
    context: {},
    sessionContext: {},
    organizationId: null,
  })), {
    ok: false,
    status: 'failed',
    reasonCode: 'trusted_context_organization_required',
    context: null,
  });

  assert.deepEqual(normalizeRepairIntakeDraftToCaseTrustedContext(trustedInput({
    params: {},
    repairIntakeDraftId: null,
    draftId: null,
  })), {
    ok: false,
    status: 'failed',
    reasonCode: 'trusted_context_draft_required',
    context: null,
  });

  assert.deepEqual(normalizeRepairIntakeDraftToCaseTrustedContext(trustedInput({
    user: {},
    context: {
      organizationId: 'org_from_context',
    },
    sessionContext: {},
    actorId: null,
  })), {
    ok: false,
    status: 'failed',
    reasonCode: 'trusted_context_actor_required',
    context: null,
  });
});

test('drops unsafe optional strings and fails closed when required trusted strings are unsafe', () => {
  const result = normalizeRepairIntakeDraftToCaseTrustedContext(trustedInput({
    context: {
      organizationId: 'org_from_context',
    },
    sessionContext: {
      actorRole: 'service_agent',
    },
    idempotencyKey: 'token_should_be_dropped',
    correlationId: 'select * should_be_dropped',
    source: 'billing_should_be_dropped',
  }));

  assert.equal(result.ok, true);
  assert.equal(Object.prototype.hasOwnProperty.call(result.context, 'idempotencyKey'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.context, 'correlationId'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.context, 'source'), false);
  assertNoLeak(result);

  assert.deepEqual(normalizeRepairIntakeDraftToCaseTrustedContext(trustedInput({
    user: {
      id: 'actor_from_user',
      organizationId: 'select * from organizations',
    },
    context: {},
    sessionContext: {},
  })), {
    ok: false,
    status: 'failed',
    reasonCode: 'trusted_context_organization_required',
    context: null,
  });
});

test('does not mutate input and returns detached allowlisted permission context', () => {
  const permissionContext = {
    canCreateCaseFromRepairIntakeDraft: true,
    permission: 'cases.create',
    token: 'token_should_not_leak',
  };
  const input = trustedInput({
    permissionContext,
    context: {
      organizationId: 'org_from_context',
    },
  });
  const before = JSON.stringify(input);
  const result = normalizeRepairIntakeDraftToCaseTrustedContext(input);

  assert.equal(JSON.stringify(input), before);
  assert.equal(result.ok, true);
  assert.notEqual(result.context.permissionContext, permissionContext);
  assert.deepEqual(result.context.permissionContext, {
    canCreateCaseFromRepairIntakeDraft: true,
    permission: 'cases.create',
  });

  permissionContext.permission = 'cases.delete';
  permissionContext.canCreateCaseFromRepairIntakeDraft = false;

  assert.deepEqual(result.context.permissionContext, {
    canCreateCaseFromRepairIntakeDraft: true,
    permission: 'cases.create',
  });
  assertNoLeak(result);
});
