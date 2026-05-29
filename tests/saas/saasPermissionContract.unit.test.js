'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  SAAS_PERMISSION_CONTRACT_KIND,
  evaluateSaasPermissionContract,
} = require('../../src/saas/saasPermissionContract');

const ORG_ID = '33333333-3333-4333-8333-333333333333';
const OTHER_ORG_ID = '99999999-9999-4999-8999-999999999999';
const ACTOR_ID = '66666666-6666-4666-8666-666666666666';
const REQUEST_ID = 'req_task_1924';

function baseInput(overrides = {}) {
  return {
    organizationId: ORG_ID,
    organizationStatus: 'active',
    organizationIsolation: {
      isolated: true,
      organizationId: ORG_ID,
    },
    actor: {
      id: ACTOR_ID,
      organizationId: ORG_ID,
      actorType: 'admin',
    },
    requiredPermission: 'saas.feature.use',
    permissionContext: {
      permissions: ['saas.feature.use'],
    },
    requiredEntitlement: 'customer.access.basic',
    entitlementContext: {
      granted: true,
      requiredEntitlement: 'customer.access.basic',
    },
    requestId: REQUEST_ID,
    ...overrides,
  };
}

function assertAllowed(result) {
  assert.equal(result.ok, true);
  assert.equal(result.allowed, true);
  assert.equal(result.contractKind, SAAS_PERMISSION_CONTRACT_KIND);
  assert.equal(result.reasonCode, 'saas_permission_contract_allowed');
  assert.equal(result.organizationId, ORG_ID);
}

function assertDenied(result, reasonCode) {
  assert.equal(result.ok, false);
  assert.equal(result.allowed, false);
  assert.equal(result.contractKind, SAAS_PERMISSION_CONTRACT_KIND);
  assert.equal(result.reasonCode, reasonCode);
}

function assertNoUnsafeLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'DATABASE_URL',
    'postgres' + '://',
    'secret',
    'token',
    'stack',
    'raw row',
    'invoice_should_not_be_created',
    'payment_should_not_be_created',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('permission and entitlement are both required after organization isolation', () => {
  const result = evaluateSaasPermissionContract(baseInput());

  assertAllowed(result);
  assert.equal(result.organizationIsolation.requiredBeforeEntitlement, true);
  assert.equal(result.organizationIsolation.isolated, true);
  assert.deepEqual(result.permission, {
    requiredPermission: 'saas.feature.use',
    granted: true,
    source: 'server_policy',
  });
  assert.deepEqual(result.entitlement, {
    requiredEntitlement: 'customer.access.basic',
    granted: true,
    source: 'server_policy',
  });
  assert.equal(result.usageMeterCannotAuthorize, true);
  assert.equal(result.invoiceCreated, false);
  assert.equal(result.paymentCreated, false);
  assert.equal(result.paymentMethodCollected, false);
  assert.equal(result.billingProviderCalled, false);
  assertNoUnsafeLeak(result);
});

test('entitlement alone is denied when permission is missing', () => {
  const result = evaluateSaasPermissionContract(baseInput({
    permissionContext: undefined,
  }));

  assertDenied(result, 'saas_permission_context_required');
  assertNoUnsafeLeak(result);
});

test('permission alone is denied when entitlement is missing', () => {
  const result = evaluateSaasPermissionContract(baseInput({
    entitlementContext: undefined,
  }));

  assertDenied(result, 'saas_entitlement_context_required');
  assertNoUnsafeLeak(result);
});

test('frontend-only entitlement is denied and cannot replace server policy', () => {
  const result = evaluateSaasPermissionContract(baseInput({
    entitlementContext: {
      granted: true,
      requiredEntitlement: 'customer.access.basic',
      source: 'frontend',
    },
  }));

  assertDenied(result, 'saas_entitlement_frontend_only_denied');
});

test('billing contact cannot act as admin permission actor', () => {
  const result = evaluateSaasPermissionContract(baseInput({
    actor: {
      id: 'billing_contact_actor',
      organizationId: ORG_ID,
      actorType: 'billing_contact',
    },
  }));

  assertDenied(result, 'saas_permission_billing_contact_actor_denied');
});

test('customer and reporter cannot act as billing authority', () => {
  for (const actorType of ['customer', 'reporter']) {
    const result = evaluateSaasPermissionContract(baseInput({
      requiredPermission: 'billing.manage',
      permissionContext: {
        permissions: ['billing.manage'],
      },
      actor: {
        id: `${actorType}_actor`,
        organizationId: ORG_ID,
        actorType,
      },
    }));

    assertDenied(result, 'saas_permission_customer_reporter_billing_authority_denied');
  }
});

test('organization mismatch and missing isolation fail before entitlement or usage checks', () => {
  assertDenied(
    evaluateSaasPermissionContract(baseInput({
      actor: {
        id: ACTOR_ID,
        organizationId: OTHER_ORG_ID,
        actorType: 'admin',
      },
    })),
    'saas_permission_organization_mismatch',
  );

  assertDenied(
    evaluateSaasPermissionContract(baseInput({
      organizationIsolation: undefined,
      entitlementSource: 'frontend',
    })),
    'saas_permission_organization_isolation_required',
  );
});

test('usage meter cannot authorize features by itself', () => {
  const result = evaluateSaasPermissionContract(baseInput({
    permissionContext: undefined,
    entitlementContext: undefined,
    usageMeter: {
      ok: true,
      accepted: true,
    },
  }));

  assertDenied(result, 'saas_permission_usage_meter_cannot_authorize');
});

test('suspended and disabled organization statuses fail closed', () => {
  for (const organizationStatus of ['suspended', 'disabled']) {
    const result = evaluateSaasPermissionContract(baseInput({ organizationStatus }));

    assertDenied(result, 'saas_permission_organization_inactive');
    assertNoUnsafeLeak(result);
  }
});
