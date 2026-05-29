'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DEPOT_ACCESS_SCOPE_GUARD_KIND,
  DEPOT_ACCESS_SCOPE_ROLES,
  evaluateDepotAccessScope,
} = require('../../src/guards/DepotAccessScopeGuard');

const ORG_ID = 'org_task_1912';
const BRAND_ID = 'brand_task_1912';
const SERVICE_PROVIDER_ID = 'service_provider_task_1912';
const SUBCONTRACTOR_ID = 'subcontractor_task_1912';
const ACTOR_ID = 'actor_task_1912';
const REQUEST_ID = 'req_task_1912';

function baseInput(overrides = {}) {
  return {
    requestId: REQUEST_ID,
    actor: {
      id: ACTOR_ID,
      role: DEPOT_ACCESS_SCOPE_ROLES.BRAND,
      organizationId: ORG_ID,
      brandIds: [BRAND_ID],
    },
    accessContext: {
      organizationId: ORG_ID,
      role: DEPOT_ACCESS_SCOPE_ROLES.BRAND,
      brandIds: [BRAND_ID],
      status: 'active',
    },
    resource: {
      organizationId: ORG_ID,
      brandId: BRAND_ID,
      serviceProviderId: SERVICE_PROVIDER_ID,
      subcontractorOrganizationId: SUBCONTRACTOR_ID,
      rawDbRow: 'raw db row should not leak',
      customerPhone: '0912-unsafe-should-not-leak',
      customerAddress: 'unsafe full address should not leak',
      providerPayload: 'unsafe provider payload should not leak',
      token: 'unsafe token should not leak',
      finalAppointmentId: 'unsafe final appointment should not leak',
      fieldServiceReport: 'unsafe fsr should not leak',
      billingInternals: 'unsafe billing should not leak',
      aiOutput: 'unsafe ai should not leak',
    },
    ...overrides,
  };
}

function assertAllowed(decision, role) {
  assert.equal(decision.ok, true);
  assert.equal(decision.allowed, true);
  assert.equal(decision.guardKind, DEPOT_ACCESS_SCOPE_GUARD_KIND);
  assert.equal(decision.reasonCode, 'depot_access_scope_allowed');
  assert.equal(decision.requestId, REQUEST_ID);
  assert.equal(decision.accessScope.organizationId, ORG_ID);
  assert.equal(decision.accessScope.actorId, ACTOR_ID);
  assert.equal(decision.accessScope.role, role);
}

function assertDenied(decision, reasonCode) {
  assert.equal(decision.ok, false);
  assert.equal(decision.allowed, false);
  assert.equal(decision.guardKind, DEPOT_ACCESS_SCOPE_GUARD_KIND);
  assert.equal(decision.reasonCode, reasonCode);
  assert.equal(decision.accessScope, null);
}

function assertNoSensitiveLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'raw db row should not leak',
    '0912-unsafe-should-not-leak',
    'unsafe full address should not leak',
    'unsafe provider payload should not leak',
    'unsafe token should not leak',
    'unsafe final appointment should not leak',
    'unsafe fsr should not leak',
    'unsafe billing should not leak',
    'unsafe ai should not leak',
    'rawDbRow',
    'customerPhone',
    'customerAddress',
    'providerPayload',
    'token',
    'finalAppointmentId',
    'fieldServiceReport',
    'billingInternals',
    'aiOutput',
    'DATABASE_URL',
    'stack',
    'sql',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('brand allowed synthetic scope is organization and brand scoped', () => {
  const decision = evaluateDepotAccessScope(baseInput());

  assertAllowed(decision, DEPOT_ACCESS_SCOPE_ROLES.BRAND);
  assert.equal(decision.accessScope.brandId, BRAND_ID);
  assert.equal(decision.accessScope.serviceProviderId, undefined);
  assert.equal(decision.accessScope.dataProfile, 'depot_internal');
  assert.deepEqual(decision.accessScope.allowedFields, [
    'depotIntakeId',
    'workflowType',
    'depotStatus',
    'itemRef',
    'productRef',
    'issueSummaryRef',
    'workshopId',
    'assignmentRef',
    'brandId',
    'serviceProviderId',
  ]);
  assertNoSensitiveLeak(decision);
});

test('service provider allowed synthetic scope requires explicit provider scope', () => {
  const decision = evaluateDepotAccessScope(baseInput({
    actor: {
      id: ACTOR_ID,
      role: DEPOT_ACCESS_SCOPE_ROLES.SERVICE_PROVIDER,
      organizationId: ORG_ID,
      serviceProviderIds: [SERVICE_PROVIDER_ID],
    },
    accessContext: {
      organizationId: ORG_ID,
      role: DEPOT_ACCESS_SCOPE_ROLES.SERVICE_PROVIDER,
      serviceProviderIds: [SERVICE_PROVIDER_ID],
      status: 'active',
    },
  }));

  assertAllowed(decision, DEPOT_ACCESS_SCOPE_ROLES.SERVICE_PROVIDER);
  assert.equal(decision.accessScope.serviceProviderId, SERVICE_PROVIDER_ID);
  assert.equal(decision.accessScope.brandId, undefined);
  assertNoSensitiveLeak(decision);
});

test('subcontractor allowed only with explicit assignment relationship and minimized fields', () => {
  const decision = evaluateDepotAccessScope(baseInput({
    actor: {
      id: ACTOR_ID,
      role: DEPOT_ACCESS_SCOPE_ROLES.SUBCONTRACTOR,
      organizationId: ORG_ID,
      subcontractorOrganizationIds: [SUBCONTRACTOR_ID],
    },
    accessContext: {
      organizationId: ORG_ID,
      role: DEPOT_ACCESS_SCOPE_ROLES.SUBCONTRACTOR,
      subcontractorOrganizationIds: [SUBCONTRACTOR_ID],
      assignmentRelationship: 'assigned_executor',
      status: 'active',
    },
  }));

  assertAllowed(decision, DEPOT_ACCESS_SCOPE_ROLES.SUBCONTRACTOR);
  assert.equal(decision.accessScope.subcontractorOrganizationId, SUBCONTRACTOR_ID);
  assert.equal(decision.accessScope.dataProfile, 'subcontractor_minimized');
  assert.deepEqual(decision.accessScope.allowedFields, [
    'depotIntakeId',
    'workflowType',
    'depotStatus',
    'itemRef',
    'productRef',
    'issueSummaryRef',
    'workshopId',
    'assignmentRef',
  ]);
  assert.equal(JSON.stringify(decision).includes('brandId'), false);
  assert.equal(JSON.stringify(decision).includes('serviceProviderId'), false);
  assertNoSensitiveLeak(decision);
});

test('subcontractor denied without explicit assignment relationship', () => {
  const decision = evaluateDepotAccessScope(baseInput({
    actor: {
      id: ACTOR_ID,
      role: DEPOT_ACCESS_SCOPE_ROLES.SUBCONTRACTOR,
      organizationId: ORG_ID,
      subcontractorOrganizationIds: [SUBCONTRACTOR_ID],
    },
    accessContext: {
      organizationId: ORG_ID,
      role: DEPOT_ACCESS_SCOPE_ROLES.SUBCONTRACTOR,
      subcontractorOrganizationIds: [SUBCONTRACTOR_ID],
      status: 'active',
    },
  }));

  assertDenied(decision, 'depot_access_subcontractor_relationship_required');
  assertNoSensitiveLeak(decision);
});

test('organization brand and service-provider mismatch fail closed', () => {
  const orgMismatch = evaluateDepotAccessScope(baseInput({
    resource: {
      organizationId: 'org_other',
      brandId: BRAND_ID,
      serviceProviderId: SERVICE_PROVIDER_ID,
    },
  }));
  const brandMismatch = evaluateDepotAccessScope(baseInput({
    resource: {
      organizationId: ORG_ID,
      brandId: 'brand_other',
      serviceProviderId: SERVICE_PROVIDER_ID,
    },
  }));
  const providerMismatch = evaluateDepotAccessScope(baseInput({
    actor: {
      id: ACTOR_ID,
      role: DEPOT_ACCESS_SCOPE_ROLES.SERVICE_PROVIDER,
      organizationId: ORG_ID,
      serviceProviderIds: [SERVICE_PROVIDER_ID],
    },
    accessContext: {
      organizationId: ORG_ID,
      role: DEPOT_ACCESS_SCOPE_ROLES.SERVICE_PROVIDER,
      serviceProviderIds: [SERVICE_PROVIDER_ID],
    },
    resource: {
      organizationId: ORG_ID,
      brandId: BRAND_ID,
      serviceProviderId: 'provider_other',
    },
  }));

  assertDenied(orgMismatch, 'depot_access_organization_mismatch');
  assertDenied(brandMismatch, 'depot_access_brand_scope_mismatch');
  assertDenied(providerMismatch, 'depot_access_service_provider_scope_mismatch');
});

test('missing context unknown role and revoked or disabled access fail closed', () => {
  assertDenied(evaluateDepotAccessScope({}), 'depot_access_actor_context_required');
  assertDenied(evaluateDepotAccessScope(baseInput({
    actor: {
      id: ACTOR_ID,
      role: 'global_provider',
      organizationId: ORG_ID,
    },
    accessContext: {
      organizationId: ORG_ID,
      role: 'global_provider',
    },
  })), 'depot_access_unknown_scope');
  assertDenied(evaluateDepotAccessScope(baseInput({
    accessContext: {
      organizationId: ORG_ID,
      role: DEPOT_ACCESS_SCOPE_ROLES.BRAND,
      brandIds: [BRAND_ID],
      revoked: true,
    },
  })), 'depot_access_revoked_or_disabled');
  assertDenied(evaluateDepotAccessScope(baseInput({
    accessContext: {
      organizationId: ORG_ID,
      role: DEPOT_ACCESS_SCOPE_ROLES.BRAND,
      brandIds: [BRAND_ID],
      status: 'disabled',
    },
  })), 'depot_access_revoked_or_disabled');
});

test('subcontractor scope mismatch fails closed even with explicit relationship', () => {
  const decision = evaluateDepotAccessScope(baseInput({
    actor: {
      id: ACTOR_ID,
      role: DEPOT_ACCESS_SCOPE_ROLES.SUBCONTRACTOR,
      organizationId: ORG_ID,
      subcontractorOrganizationIds: ['subcontractor_other'],
    },
    accessContext: {
      organizationId: ORG_ID,
      role: DEPOT_ACCESS_SCOPE_ROLES.SUBCONTRACTOR,
      subcontractorOrganizationIds: ['subcontractor_other'],
      assignmentRelationship: 'assigned_executor',
      status: 'active',
    },
  }));

  assertDenied(decision, 'depot_access_subcontractor_scope_mismatch');
});
