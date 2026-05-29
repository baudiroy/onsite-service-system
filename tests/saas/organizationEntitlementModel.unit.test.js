'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ORGANIZATION_ENTITLEMENT_MODEL_KIND,
  evaluateOrganizationEntitlement,
} = require('../../src/saas/organizationEntitlementModel');

const ORG_ID = '33333333-3333-4333-8333-333333333333';
const REQUEST_ID = 'req_task_1920';

function baseInput(overrides = {}) {
  return {
    organizationId: ORG_ID,
    planCode: 'professional',
    status: 'active',
    requiredEntitlement: 'customer.access.basic',
    requestId: REQUEST_ID,
    ...overrides,
  };
}

function assertAllowed(result) {
  assert.equal(result.ok, true);
  assert.equal(result.allowed, true);
  assert.equal(result.modelKind, ORGANIZATION_ENTITLEMENT_MODEL_KIND);
  assert.equal(result.reasonCode, 'organization_entitlement_allowed');
  assert.equal(result.organizationId, ORG_ID);
  assert.equal(result.entitlement.source, 'server_policy');
}

function assertDenied(result, reasonCode) {
  assert.equal(result.ok, false);
  assert.equal(result.allowed, false);
  assert.equal(result.modelKind, ORGANIZATION_ENTITLEMENT_MODEL_KIND);
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
    'customer_should_not_be_billing_contact',
    'reporter_should_not_be_billing_contact',
    'invoice_should_not_be_created',
    'payment_should_not_be_created',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('allowed paid plan entitlement returns normalized server-policy envelope', () => {
  const result = evaluateOrganizationEntitlement(baseInput());

  assertAllowed(result);
  assert.equal(result.plan.planCode, 'professional');
  assert.equal(result.plan.planTier, 'professional');
  assert.equal(result.plan.effectiveStatus, 'active');
  assert.equal(result.plan.trialState, 'not_trial');
  assert.equal(result.entitlement.requiredEntitlement, 'customer.access.basic');
  assert.equal(result.entitlement.granted, true);
  assert.equal(result.plan.entitlements.includes('customer.access.basic'), true);
  assertNoUnsafeLeak(result);
});

test('trial path allows active trial and denies expired trial', () => {
  const activeTrial = evaluateOrganizationEntitlement(baseInput({
    status: 'trialing',
    trialEndsAt: '2026-06-30T00:00:00.000Z',
    now: '2026-05-29T00:00:00.000Z',
  }));

  assertAllowed(activeTrial);
  assert.equal(activeTrial.plan.trialState, 'trial_active');
  assert.equal(activeTrial.plan.trialEndsAt, '2026-06-30T00:00:00.000Z');

  const expiredTrial = evaluateOrganizationEntitlement(baseInput({
    status: 'trialing',
    trialEndsAt: '2026-05-01T00:00:00.000Z',
    now: '2026-05-29T00:00:00.000Z',
  }));

  assertDenied(expiredTrial, 'organization_trial_expired');
});

test('ambiguous trial state fails closed', () => {
  const result = evaluateOrganizationEntitlement(baseInput({
    status: 'trialing',
  }));

  assertDenied(result, 'organization_trial_ambiguous');
});

test('disabled and suspended status fail closed', () => {
  for (const status of ['disabled', 'suspended']) {
    const result = evaluateOrganizationEntitlement(baseInput({ status }));

    assertDenied(result, 'organization_plan_inactive');
    assertNoUnsafeLeak(result);
  }
});

test('missing organization and unknown plan fail closed', () => {
  assertDenied(
    evaluateOrganizationEntitlement(baseInput({ organizationId: null })),
    'organization_id_required',
  );
  assertDenied(
    evaluateOrganizationEntitlement(baseInput({ planCode: 'surprise_custom_plan' })),
    'organization_plan_unknown',
  );
});

test('missing required entitlement is denied without raw plan leakage', () => {
  const result = evaluateOrganizationEntitlement(baseInput({
    planCode: 'basic',
    requiredEntitlement: 'api.webhook',
  }));

  assertDenied(result, 'organization_entitlement_missing');
  assert.equal(result.entitlement.requiredEntitlement, 'api.webhook');
  assert.equal(result.entitlement.granted, false);
  assertNoUnsafeLeak(result);
});

test('frontend-only entitlement signal is denied even when the requested key is present', () => {
  const result = evaluateOrganizationEntitlement(baseInput({
    planCode: 'enterprise',
    requiredEntitlement: 'api.webhook',
    entitlementSource: 'frontend',
  }));

  assertDenied(result, 'organization_entitlement_frontend_only_denied');
  assertNoUnsafeLeak(result);
});

test('billingContactRef remains metadata and does not become customer or reporter identity', () => {
  const result = evaluateOrganizationEntitlement(baseInput({
    billingContactRef: {
      refId: 'billing_ref_task_1920',
      type: 'billing_contact',
      customerId: 'customer_should_not_be_billing_contact',
      reporterId: 'reporter_should_not_be_billing_contact',
    },
  }));

  assertAllowed(result);
  assert.deepEqual(result.billingContactRef, {
    refId: 'billing_ref_task_1920',
    kind: 'billing_contact_ref',
    type: 'billing_contact',
  });
  assert.equal(Object.prototype.hasOwnProperty.call(result.billingContactRef, 'customerId'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.billingContactRef, 'reporterId'), false);
  assertNoUnsafeLeak(result);
});

test('usage meter metadata does not become invoice or payment behavior', () => {
  const result = evaluateOrganizationEntitlement(baseInput({
    usageMeter: {
      usageKey: 'report.export.rows',
      quantity: 42,
      invoiceId: 'invoice_should_not_be_created',
      paymentId: 'payment_should_not_be_created',
    },
  }));

  assertAllowed(result);
  assert.deepEqual(result.usageMeter, {
    metered: true,
    usageKey: 'report.export.rows',
    quantity: 42,
    invoiceCreated: false,
    paymentCreated: false,
  });
  assertNoUnsafeLeak(result);
});
