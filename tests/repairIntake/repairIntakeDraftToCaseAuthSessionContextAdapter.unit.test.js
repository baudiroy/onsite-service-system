'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildRepairIntakeDraftToCaseAuthSessionContext,
} = require('../../src/repairIntake/repairIntakeDraftToCaseAuthSessionContextAdapter');

function validInput(overrides = {}) {
  return {
    user: {
      id: 'actor-task2355',
      organizationId: 'org-task2355',
      tenantId: 'tenant-task2355',
      roles: ['service_agent'],
      permissions: ['cases.create'],
      token: 'raw-token-should-not-leak',
      authProvider: 'password',
    },
    context: {
      organizationId: 'org-context-ignored-after-user',
      tenantId: 'tenant-context-ignored-after-user',
      actorId: 'actor-context-ignored-after-user',
      requestId: 'req-context-task2355',
      idempotencyKey: 'idem-context-task2355',
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
        permission: 'cases.create',
        debug: 'debug should not leak',
      },
    },
    sessionContext: {
      actorRole: 'service_agent',
      source: 'admin_route_session',
      correlationId: 'corr-session-task2355',
    },
    requestId: 'req-top-task2355',
    idempotencyKey: 'idem-top-task2355',
    ...overrides,
  };
}

test('valid authenticated user and context returns detached allowlisted ready envelope', () => {
  const input = validInput();
  const result = buildRepairIntakeDraftToCaseAuthSessionContext(input);

  assert.equal(result.ok, true);
  assert.equal(result.status, 'ready');
  assert.equal(result.reasonCode, 'auth_session_context_ready');
  assert.deepEqual(result.sessionContext, {
    organizationId: 'org-task2355',
    tenantId: 'tenant-task2355',
    actorId: 'actor-task2355',
    actorRole: 'service_agent',
    source: 'admin_route_session',
    requestId: 'req-top-task2355',
    correlationId: 'corr-session-task2355',
    idempotencyKey: 'idem-top-task2355',
    permissionContext: {
      canCreateCaseFromRepairIntakeDraft: true,
      permission: 'cases.create',
    },
  });
  assert.notEqual(result.sessionContext, input.context);
  assert.notEqual(result.sessionContext.permissionContext, input.context.permissionContext);
  assert.equal(Object.prototype.hasOwnProperty.call(result.sessionContext, 'token'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.sessionContext, 'authProvider'), false);
});

test('trusted source precedence falls back through context and session fields only', () => {
  const result = buildRepairIntakeDraftToCaseAuthSessionContext(validInput({
    user: {
      userId: 'actor-userid-task2355',
      permissions: ['cases.create'],
    },
    context: {
      organizationId: 'org-context-task2355',
      tenantId: 'tenant-context-task2355',
      requestId: 'req-context-task2355',
      idempotencyKey: 'idem-context-task2355',
    },
    sessionContext: {
      actorId: 'actor-session-task2355',
      actorRole: 'dispatcher',
      source: 'session-source-task2355',
      correlationId: 'corr-session-task2355',
    },
    requestId: undefined,
    idempotencyKey: undefined,
  }));

  assert.equal(result.ok, true);
  assert.equal(result.sessionContext.organizationId, 'org-context-task2355');
  assert.equal(result.sessionContext.tenantId, 'tenant-context-task2355');
  assert.equal(result.sessionContext.actorId, 'actor-userid-task2355');
  assert.equal(result.sessionContext.actorRole, 'dispatcher');
  assert.equal(result.sessionContext.requestId, 'req-context-task2355');
  assert.equal(result.sessionContext.idempotencyKey, 'idem-context-task2355');
});

test('raw body query headers cookies and draft input cannot override trusted context', () => {
  const result = buildRepairIntakeDraftToCaseAuthSessionContext(validInput({
    body: {
      organizationId: 'org-body-forbidden',
      tenantId: 'tenant-body-forbidden',
      actorId: 'actor-body-forbidden',
      draftId: 'draft-body-forbidden',
    },
    requestBody: {
      organizationId: 'org-request-body-forbidden',
    },
    draftInput: {
      actorId: 'actor-draft-input-forbidden',
    },
    query: {
      organizationId: 'org-query-forbidden',
    },
    headers: {
      authorization: 'Bearer forbidden-token',
    },
    cookies: {
      session: 'forbidden-cookie',
    },
    clientPayload: {
      organizationId: 'org-client-forbidden',
    },
  }));

  assert.equal(result.ok, true);
  assert.equal(result.sessionContext.organizationId, 'org-task2355');
  assert.equal(result.sessionContext.tenantId, 'tenant-task2355');
  assert.equal(result.sessionContext.actorId, 'actor-task2355');
  assert.equal(JSON.stringify(result).includes('forbidden'), false);
});

test('missing required organization or actor identity fails closed', () => {
  const missingOrganization = buildRepairIntakeDraftToCaseAuthSessionContext(validInput({
    user: { id: 'actor-task2355' },
    context: {},
    sessionContext: {},
  }));
  const missingActor = buildRepairIntakeDraftToCaseAuthSessionContext(validInput({
    user: { organizationId: 'org-task2355' },
    context: {},
    sessionContext: {},
  }));

  assert.deepEqual(missingOrganization, {
    ok: false,
    status: 'failed',
    reasonCode: 'auth_session_context_organization_required',
    sessionContext: null,
  });
  assert.deepEqual(missingActor, {
    ok: false,
    status: 'failed',
    reasonCode: 'auth_session_context_actor_required',
    sessionContext: null,
  });
});

test('malformed input fails closed without exposing raw auth session payload', () => {
  for (const value of [null, [], 'raw-token-secret', 123]) {
    const result = buildRepairIntakeDraftToCaseAuthSessionContext(value);

    assert.deepEqual(result, {
      ok: false,
      status: 'failed',
      reasonCode: 'auth_session_context_invalid',
      sessionContext: null,
    });
  }
});

test('unsafe strings are dropped or fail closed without raw leakage', () => {
  const unsafeRequired = buildRepairIntakeDraftToCaseAuthSessionContext(validInput({
    user: {
      id: 'actor-task2355',
      organizationId: 'org-task2355 select * from users',
    },
    context: {},
    sessionContext: {},
  }));
  const unsafeOptional = buildRepairIntakeDraftToCaseAuthSessionContext(validInput({
    context: {
      requestId: 'req-task2355 stack trace',
      idempotencyKey: 'idem-task2355 token',
    },
    requestId: undefined,
    idempotencyKey: undefined,
    sessionContext: {
      correlationId: 'corr-task2355 provider payload',
      source: 'admin_route_session',
    },
  }));

  assert.equal(unsafeRequired.ok, false);
  assert.equal(unsafeRequired.reasonCode, 'auth_session_context_organization_required');
  assert.equal(unsafeOptional.ok, true);
  assert.equal(Object.prototype.hasOwnProperty.call(unsafeOptional.sessionContext, 'requestId'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(unsafeOptional.sessionContext, 'idempotencyKey'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(unsafeOptional.sessionContext, 'correlationId'), false);
  assert.equal(JSON.stringify(unsafeOptional).includes('token'), false);
  assert.equal(JSON.stringify(unsafeOptional).includes('provider'), false);
});

test('does not mutate input objects and returns detached output objects', () => {
  const input = validInput();
  const before = JSON.stringify(input);
  const result = buildRepairIntakeDraftToCaseAuthSessionContext(input);

  result.sessionContext.organizationId = 'mutated-output';
  result.sessionContext.permissionContext.permission = 'mutated-permission';

  assert.equal(JSON.stringify(input), before);
  assert.equal(input.user.organizationId, 'org-task2355');
  assert.equal(input.context.permissionContext.permission, 'cases.create');
});
