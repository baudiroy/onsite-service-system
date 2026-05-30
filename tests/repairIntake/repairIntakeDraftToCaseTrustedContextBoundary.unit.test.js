'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  resolveRepairIntakeDraftToCaseRequestContext,
} = require('../../src/repairIntake/repairIntakeDraftToCaseRequestContextResolver');
const {
  createRepairIntakeDraftToCaseRouteHandler,
} = require('../../src/repairIntake/repairIntakeDraftToCaseRouteHandlerFactory');

function trustedResolverInput(overrides = {}) {
  return {
    sessionContext: {
      organizationId: 'org-server-owned',
      actorId: 'actor-server-owned',
      actorRole: 'service_agent',
    },
    repairIntakeDraftId: 'draft-server-owned',
    requestSource: 'trusted_route_context',
    requestBody: {
      organizationId: 'body-org-hidden',
      actorId: 'body-actor-hidden',
      actorRole: 'admin',
      repairIntakeDraftId: 'body-draft-hidden',
      source: 'body-source-hidden',
      draftInput: {
        customerDisplayName: 'Customer',
        problemDescription: 'Needs repair',
        organizationId: 'draft-org-hidden',
        actorId: 'draft-actor-hidden',
        actorRole: 'draft-admin-hidden',
        repairIntakeDraftId: 'draft-id-hidden',
        source: 'draft-source-hidden',
      },
    },
    ...overrides,
  };
}

function assertNoClientContext(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'body-org-hidden',
    'body-actor-hidden',
    'body-draft-hidden',
    'body-source-hidden',
    'draft-org-hidden',
    'draft-actor-hidden',
    'draft-admin-hidden',
    'draft-id-hidden',
    'draft-source-hidden',
    'admin',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked ${marker}`);
  }
}

test('Task2193 resolver derives server-owned context only from trusted fields', () => {
  const input = trustedResolverInput();
  const before = JSON.parse(JSON.stringify(input));

  const result = resolveRepairIntakeDraftToCaseRequestContext(input);

  assert.equal(result.ok, true);
  assert.equal(result.organizationId, 'org-server-owned');
  assert.equal(result.actorId, 'actor-server-owned');
  assert.equal(result.actorRole, 'service_agent');
  assert.equal(result.repairIntakeDraftId, 'draft-server-owned');
  assert.equal(result.source, 'trusted_route_context');
  assert.deepEqual(result.draftInput, {
    customerDisplayName: 'Customer',
    problemDescription: 'Needs repair',
  });
  assert.deepEqual(input, before);
  assertNoClientContext(result);
});

test('Task2193 resolver does not fall back to body or draftInput for missing trusted context', () => {
  for (const [label, override, reasonCode] of [
    [
      'organization',
      { sessionContext: { actorId: 'actor-server-owned', actorRole: 'service_agent' } },
      'REPAIR_INTAKE_DRAFT_TO_CASE_REQUEST_CONTEXT_ORGANIZATION_REQUIRED',
    ],
    [
      'actor',
      { sessionContext: { organizationId: 'org-server-owned', actorRole: 'service_agent' } },
      'REPAIR_INTAKE_DRAFT_TO_CASE_REQUEST_CONTEXT_ACTOR_REQUIRED',
    ],
    [
      'draft',
      { repairIntakeDraftId: undefined },
      'REPAIR_INTAKE_DRAFT_TO_CASE_REQUEST_CONTEXT_DRAFT_REQUIRED',
    ],
  ]) {
    const result = resolveRepairIntakeDraftToCaseRequestContext(trustedResolverInput(override));

    assert.equal(result.ok, false, `${label} should be invalid`);
    assert.equal(result.reasonCode, reasonCode);
    assertNoClientContext(result);
  }
});

test('Task2193 route handler sends path draft id as trusted top-level context, not request body', async () => {
  let routeLikeInput;
  const handler = createRepairIntakeDraftToCaseRouteHandler({
    routeAdapter: {
      handleRouteLikeRequest(input) {
        routeLikeInput = input;

        return {
          statusCode: 201,
          body: {
            ok: true,
            status: 'created',
            repairIntakeDraftId: input.repairIntakeDraftId,
          },
        };
      },
    },
  });

  await handler.handle({
    sessionContext: {
      organizationId: 'org-server-owned',
      actorId: 'actor-server-owned',
      actorRole: 'service_agent',
    },
    params: {
      repairIntakeDraftId: 'draft-path-trusted',
    },
    body: {
      organizationId: 'body-org-hidden',
      actorId: 'body-actor-hidden',
      actorRole: 'admin',
      repairIntakeDraftId: 'body-draft-hidden',
      draftId: 'body-draft-id-hidden',
      source: 'body-source-hidden',
      problemDescription: 'Safe text',
    },
    source: 'trusted_route_source',
  });

  assert.equal(routeLikeInput.repairIntakeDraftId, 'draft-path-trusted');
  assert.equal(Object.hasOwn(routeLikeInput.body, 'organizationId'), false);
  assert.equal(Object.hasOwn(routeLikeInput.body, 'actorId'), false);
  assert.equal(Object.hasOwn(routeLikeInput.body, 'actorRole'), false);
  assert.equal(Object.hasOwn(routeLikeInput.body, 'repairIntakeDraftId'), false);
  assert.equal(Object.hasOwn(routeLikeInput.body, 'draftId'), false);
  assert.equal(Object.hasOwn(routeLikeInput.body, 'source'), false);
  assertNoClientContext(routeLikeInput);
});
