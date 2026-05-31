'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildAdminRequestLike,
} = require('../../src/routes/repairIntakeDraftToCase.routes');

function request(overrides = {}) {
  return {
    user: {
      id: 'actor-route-task2357',
      organizationId: 'org-route-task2357',
      tenantId: 'tenant-route-task2357',
      roles: ['service_agent'],
      permissions: ['cases.create'],
      token: 'raw-token-should-not-leak',
    },
    context: {
      actorRole: 'service_agent',
      requestId: 'req-context-task2357',
      idempotencyKey: 'idem-context-task2357',
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
        permission: 'cases.create',
      },
    },
    params: {
      draftId: 'draft-route-task2357',
    },
    body: {
      draftInput: {
        customerName: 'Allowed Customer',
      },
      organizationId: 'org-body-forbidden',
      actorId: 'actor-body-forbidden',
      repairIntakeDraftId: 'draft-body-forbidden',
      requestId: 'req-body-forbidden',
      idempotencyKey: 'idem-body-forbidden',
    },
    query: {
      organizationId: 'org-query-forbidden',
    },
    requestId: 'req-top-task2357',
    idempotencyKey: 'idem-top-task2357',
    ...overrides,
  };
}

test('route request-like builder wires auth session adapter and preserves compatible output shape', () => {
  const result = buildAdminRequestLike(request());

  assert.equal(result.organizationId, 'org-route-task2357');
  assert.equal(result.tenantId, 'tenant-route-task2357');
  assert.equal(result.actor.id, 'actor-route-task2357');
  assert.equal(result.actor.userId, 'actor-route-task2357');
  assert.equal(result.actor.organizationId, 'org-route-task2357');
  assert.equal(result.context.organizationId, 'org-route-task2357');
  assert.equal(result.context.actorId, 'actor-route-task2357');
  assert.equal(result.context.actorRole, 'service_agent');
  assert.equal(result.context.requestId, 'req-top-task2357');
  assert.equal(result.requestId, 'req-top-task2357');
  assert.equal(result.idempotencyKey, 'idem-top-task2357');
  assert.equal(result.draftId, 'draft-route-task2357');
  assert.equal(result.repairIntakeDraftId, 'draft-route-task2357');
  assert.equal(result.params.draftId, 'draft-route-task2357');
  assert.equal(result.params.repairIntakeDraftId, 'draft-route-task2357');
  assert.deepEqual(result.body.permissionContext, {
    canCreateCaseFromRepairIntakeDraft: true,
  });
  assert.deepEqual(result.context.permissionContext, {
    canCreateCaseFromRepairIntakeDraft: true,
    permission: 'cases.create',
  });
});

test('trusted source precedence flows through auth adapter before trusted normalizer', () => {
  const result = buildAdminRequestLike(request({
    user: {
      userId: 'actor-userid-task2357',
      permissions: ['cases.create'],
    },
    context: {
      organizationId: 'org-context-task2357',
      tenantId: 'tenant-context-task2357',
      actorRole: 'dispatcher',
      requestId: 'req-context-task2357',
      idempotencyKey: 'idem-context-task2357',
    },
    requestId: undefined,
    idempotencyKey: undefined,
  }));

  assert.equal(result.organizationId, 'org-context-task2357');
  assert.equal(result.tenantId, 'tenant-context-task2357');
  assert.equal(result.actor.id, 'actor-userid-task2357');
  assert.equal(result.context.actorRole, 'dispatcher');
  assert.equal(result.requestId, 'req-context-task2357');
  assert.equal(result.idempotencyKey, 'idem-context-task2357');
});

test('body requestBody draftInput query header and client fields cannot override trusted auth session context', () => {
  const result = buildAdminRequestLike(request({
    body: {
      organizationId: 'org-body-forbidden',
      tenantId: 'tenant-body-final-fallback-only',
      actorId: 'actor-body-forbidden',
      actorRole: 'admin',
      repairIntakeDraftId: 'draft-body-forbidden',
      draftInput: {
        organizationId: 'org-draft-input-forbidden',
        actorId: 'actor-draft-input-forbidden',
        description: 'Allowed description',
      },
      requestBody: {
        actorId: 'actor-request-body-forbidden',
      },
    },
    query: {
      organizationId: 'org-query-forbidden',
      actorId: 'actor-query-forbidden',
    },
    headers: {
      authorization: 'Bearer forbidden-token',
    },
    clientPayload: {
      organizationId: 'org-client-forbidden',
    },
  }));

  assert.equal(result.organizationId, 'org-route-task2357');
  assert.equal(result.tenantId, 'tenant-route-task2357');
  assert.equal(result.actor.id, 'actor-route-task2357');
  assert.equal(result.draftId, 'draft-route-task2357');
  assert.equal(JSON.stringify(result.context).includes('forbidden'), false);
  assert.equal(JSON.stringify(result.actor).includes('forbidden'), false);
  assert.equal(JSON.stringify(result.params).includes('forbidden'), false);
  assert.equal(JSON.stringify(result.body).includes('forbidden'), false);
  assert.equal(result.body.draftInput.description, 'Allowed description');
});

test('missing organization or actor fails closed into compatible request-like shape without raw leakage', () => {
  const missingOrganization = buildAdminRequestLike(request({
    user: {
      id: 'actor-route-task2357',
      permissions: ['cases.create'],
    },
    context: {},
  }));
  const missingActor = buildAdminRequestLike(request({
    user: {
      organizationId: 'org-route-task2357',
      permissions: ['cases.create'],
    },
    context: {},
  }));

  assert.equal(missingOrganization.organizationId, undefined);
  assert.equal(missingOrganization.actor.id, undefined);
  assert.equal(missingOrganization.draftId, undefined);
  assert.equal(missingOrganization.params.draftId, 'draft-route-task2357');
  assert.equal(missingOrganization.body.organizationId, undefined);
  assert.equal(missingOrganization.body.actorId, undefined);
  assert.equal(JSON.stringify(missingOrganization).includes('raw-token'), false);

  assert.equal(missingActor.organizationId, undefined);
  assert.equal(missingActor.actor.id, undefined);
  assert.equal(missingActor.draftId, undefined);
  assert.equal(missingActor.params.draftId, 'draft-route-task2357');
  assert.equal(JSON.stringify(missingActor).includes('raw-token'), false);
});

test('route request-like builder does not mutate request or body objects', () => {
  const input = request();
  const before = JSON.stringify(input);
  const result = buildAdminRequestLike(input);

  result.context.organizationId = 'mutated-output';
  result.body.draftInput.description = 'mutated-description';

  assert.equal(JSON.stringify(input), before);
  assert.equal(input.user.organizationId, 'org-route-task2357');
  assert.equal(input.body.draftInput.customerName, 'Allowed Customer');
});
