'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION,
  buildAdminRequestLike,
} = require('../../src/routes/repairIntakeDraftToCase.routes');

function request(overrides = {}) {
  return {
    params: {
      draftId: 'draft_route_wiring_001',
    },
    query: {
      safe: 'yes',
    },
    body: {
      organizationId: 'body_org_should_not_bind',
      tenantId: 'body_tenant_fallback',
      actorId: 'body_actor_should_not_bind',
      actorRole: 'body_role_should_not_bind',
      repairIntakeDraftId: 'body_draft_should_not_bind',
      draftId: 'body_draft_alias_should_not_bind',
      requestId: 'body_request_should_not_bind',
      idempotencyKey: 'body_idem_should_not_bind',
      source: 'body_source_should_not_bind',
      requestBody: {
        organizationId: 'nested_request_body_org_should_not_bind',
      },
      draftInput: {
        source: 'draft_input_source_should_not_bind',
      },
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: false,
        permission: 'cases.delete',
        token: 'permission_token_should_not_leak',
      },
      approvalContext: {
        accepted: true,
      },
    },
    context: {
      organizationId: 'context_org_route_wiring_001',
      tenantId: 'context_tenant_route_wiring_001',
      actorId: 'context_actor_should_not_win',
      actorRole: 'service_agent',
      requestId: 'context_request_route_wiring_001',
      idempotencyKey: 'context_idem_route_wiring_001',
    },
    requestId: 'top_request_route_wiring_001',
    idempotencyKey: 'top_idem_route_wiring_001',
    user: {
      id: 'user_actor_route_wiring_001',
      userId: 'user_id_route_wiring_001',
      sub: 'user_sub_route_wiring_001',
      organizationId: 'user_org_route_wiring_001',
      tenantId: 'user_tenant_route_wiring_001',
    },
    ...overrides,
  };
}

function assertNoRawLeak(value) {
  const text = JSON.stringify(value);

  for (const marker of [
    'body_org_should_not_bind',
    'body_actor_should_not_bind',
    'body_role_should_not_bind',
    'body_draft_should_not_bind',
    'body_draft_alias_should_not_bind',
    'body_request_should_not_bind',
    'body_idem_should_not_bind',
    'body_source_should_not_bind',
    'nested_request_body_org_should_not_bind',
    'draft_input_source_should_not_bind',
    'permission_token_should_not_leak',
    'cases.delete',
  ]) {
    assert.equal(text.includes(marker), false, `request-like output leaked ${marker}`);
  }
}

test('route request-like builder wires trusted normalizer and preserves compatible output shape', () => {
  const requestLike = buildAdminRequestLike(request());

  assert.equal(requestLike.organizationId, 'user_org_route_wiring_001');
  assert.equal(requestLike.tenantId, 'user_tenant_route_wiring_001');
  assert.equal(requestLike.requestId, 'top_request_route_wiring_001');
  assert.equal(requestLike.idempotencyKey, 'top_idem_route_wiring_001');
  assert.equal(requestLike.repairIntakeDraftId, 'draft_route_wiring_001');
  assert.equal(requestLike.draftId, 'draft_route_wiring_001');
  assert.equal(requestLike.params.draftId, 'draft_route_wiring_001');
  assert.equal(requestLike.params.repairIntakeDraftId, 'draft_route_wiring_001');
  assert.equal(requestLike.context.organizationId, 'user_org_route_wiring_001');
  assert.equal(requestLike.context.tenantId, 'user_tenant_route_wiring_001');
  assert.equal(requestLike.context.actorId, 'user_actor_route_wiring_001');
  assert.equal(requestLike.context.requestId, 'top_request_route_wiring_001');
  assert.equal(requestLike.actor.id, 'user_actor_route_wiring_001');
  assert.equal(requestLike.actor.userId, 'user_actor_route_wiring_001');
  assert.equal(requestLike.actor.organizationId, 'user_org_route_wiring_001');
  assert.deepEqual(requestLike.context.permissionContext, {
    canCreateCaseFromRepairIntakeDraft: true,
    permission: REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION,
  });
  assert.deepEqual(requestLike.body.permissionContext, {
    canCreateCaseFromRepairIntakeDraft: true,
  });
  assert.equal(requestLike.body.approvalContext.accepted, true);
  assertNoRawLeak(requestLike);
});

test('trusted context precedence falls back through accepted route user and context sources', () => {
  const requestLike = buildAdminRequestLike(request({
    user: {
      sub: 'actor_from_sub_route_wiring',
    },
    context: {
      organizationId: 'context_org_route_wiring_002',
      tenantId: 'context_tenant_route_wiring_002',
      requestId: 'context_request_route_wiring_002',
      idempotencyKey: 'context_idem_route_wiring_002',
    },
    requestId: '',
    idempotencyKey: '',
  }));

  assert.equal(requestLike.organizationId, 'context_org_route_wiring_002');
  assert.equal(requestLike.tenantId, 'context_tenant_route_wiring_002');
  assert.equal(requestLike.context.actorId, 'actor_from_sub_route_wiring');
  assert.equal(requestLike.requestId, 'context_request_route_wiring_002');
  assert.equal(requestLike.idempotencyKey, 'context_idem_route_wiring_002');
  assertNoRawLeak(requestLike);
});

test('body tenant remains only a final fallback and cannot override trusted user or context tenant', () => {
  const requestLike = buildAdminRequestLike(request({
    user: {
      id: 'user_actor_route_wiring_003',
      organizationId: 'user_org_route_wiring_003',
    },
    context: {},
  }));

  assert.equal(requestLike.organizationId, 'user_org_route_wiring_003');
  assert.equal(requestLike.tenantId, 'body_tenant_fallback');
  assertNoRawLeak(requestLike);
});

test('missing organization or draft fails closed into compatible request-like shape without raw leakage', () => {
  const missingOrganization = buildAdminRequestLike(request({
    user: {
      id: 'user_actor_route_wiring_004',
    },
    context: {},
  }));
  const missingDraft = buildAdminRequestLike(request({
    params: {},
  }));

  assert.equal(missingOrganization.organizationId, undefined);
  assert.equal(missingOrganization.context.organizationId, undefined);
  assert.equal(missingOrganization.repairIntakeDraftId, undefined);
  assert.equal(missingOrganization.body.permissionContext.canCreateCaseFromRepairIntakeDraft, true);
  assertNoRawLeak(missingOrganization);

  assert.equal(missingDraft.repairIntakeDraftId, undefined);
  assert.equal(missingDraft.draftId, undefined);
  assert.equal(missingDraft.params.draftId, undefined);
  assert.equal(missingDraft.params.repairIntakeDraftId, undefined);
  assertNoRawLeak(missingDraft);
});

test('route request-like builder does not mutate request or body objects', () => {
  const input = request();
  const before = JSON.stringify(input);
  const requestLike = buildAdminRequestLike(input);

  assert.equal(JSON.stringify(input), before);
  assert.notEqual(requestLike.body, input.body);
  assert.notEqual(requestLike.context, input.context);
  assertNoRawLeak(requestLike);
});
