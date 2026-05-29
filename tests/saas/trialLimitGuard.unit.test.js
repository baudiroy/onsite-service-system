'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  TRIAL_LIMIT_GUARD_KIND,
  evaluateTrialLimitGuard,
} = require('../../src/saas/trialLimitGuard');

const ORG_ID = '33333333-3333-4333-8333-333333333333';
const REQUEST_ID = 'req_task_1922';

function baseInput(overrides = {}) {
  return {
    organizationId: ORG_ID,
    organizationStatus: 'active',
    trialState: 'trial_active',
    entitlementContext: {
      granted: true,
      requiredEntitlement: 'engineer.mobile.basic',
      trialLimits: {
        'engineer_mobile.actions.count': 10,
      },
    },
    usageMeter: {
      metricKey: 'engineer_mobile.actions.count',
      entitlementKey: 'engineer.mobile.basic',
      quantity: 2,
      previousQuantity: 3,
      projectedQuantity: 5,
    },
    requestId: REQUEST_ID,
    ...overrides,
  };
}

function assertAllowed(result) {
  assert.equal(result.ok, true);
  assert.equal(result.allowed, true);
  assert.equal(result.guardKind, TRIAL_LIMIT_GUARD_KIND);
  assert.equal(result.organizationId, ORG_ID);
}

function assertDenied(result, reasonCode) {
  assert.equal(result.ok, false);
  assert.equal(result.allowed, false);
  assert.equal(result.guardKind, TRIAL_LIMIT_GUARD_KIND);
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

test('trial active under server-side limit allows without invoice or payment behavior', () => {
  const result = evaluateTrialLimitGuard(baseInput());

  assertAllowed(result);
  assert.equal(result.reasonCode, 'trial_limit_allowed');
  assert.equal(result.trialApplied, true);
  assert.deepEqual(result.usage, {
    metricKey: 'engineer_mobile.actions.count',
    quantity: 2,
    projectedQuantity: 5,
    trialLimit: 10,
    underLimit: true,
    internalTrialLimitOnly: true,
    invoiceCreated: false,
    paymentCreated: false,
    paymentMethodCollected: false,
    billingProviderCalled: false,
  });
  assert.deepEqual(result.entitlement, {
    requiredEntitlement: 'engineer.mobile.basic',
    granted: true,
    source: 'server_policy',
  });
  assertNoUnsafeLeak(result);
});

test('trial over limit denies with review-required marker and no billing behavior', () => {
  const result = evaluateTrialLimitGuard(baseInput({
    usageMeter: {
      metricKey: 'engineer_mobile.actions.count',
      entitlementKey: 'engineer.mobile.basic',
      quantity: 3,
      previousQuantity: 9,
      projectedQuantity: 12,
    },
  }));

  assertDenied(result, 'trial_limit_exceeded');
  assert.equal(result.requiresReview, true);
  assert.equal(result.usage.invoiceCreated, false);
  assert.equal(result.usage.paymentCreated, false);
  assert.equal(result.usage.paymentMethodCollected, false);
  assert.equal(result.usage.billingProviderCalled, false);
  assertNoUnsafeLeak(result);
});

test('trial expired and ambiguous states deny', () => {
  assertDenied(
    evaluateTrialLimitGuard(baseInput({ trialState: 'expired' })),
    'trial_limit_expired',
  );
  assertDenied(
    evaluateTrialLimitGuard(baseInput({ trialState: 'ambiguous' })),
    'trial_limit_trial_state_ambiguous',
  );
});

test('disabled and suspended organizations deny before trial allowance', () => {
  for (const organizationStatus of ['disabled', 'suspended']) {
    const result = evaluateTrialLimitGuard(baseInput({ organizationStatus }));

    assertDenied(result, 'trial_limit_organization_inactive');
    assertNoUnsafeLeak(result);
  }
});

test('missing usage input fails closed for active trial', () => {
  const result = evaluateTrialLimitGuard(baseInput({
    usageMeter: undefined,
  }));

  assertDenied(result, 'trial_limit_usage_input_required');
});

test('missing entitlement and frontend-only trial flags fail closed', () => {
  assertDenied(
    evaluateTrialLimitGuard(baseInput({ entitlementContext: { granted: false } })),
    'trial_limit_entitlement_missing',
  );
  assertDenied(
    evaluateTrialLimitGuard(baseInput({ trialSource: 'frontend' })),
    'trial_limit_frontend_only_trial_flag_denied',
  );
});

test('paid plan is not incorrectly treated as trial and does not require usage input', () => {
  const result = evaluateTrialLimitGuard(baseInput({
    trialState: 'not_trial',
    usageMeter: undefined,
  }));

  assertAllowed(result);
  assert.equal(result.reasonCode, 'trial_limit_not_applicable_paid_plan');
  assert.equal(result.trialApplied, false);
  assert.equal(result.usage, undefined);
  assertNoUnsafeLeak(result);
});

test('billingContactRef remains metadata and does not become customer or reporter identity', () => {
  const result = evaluateTrialLimitGuard(baseInput({
    billingContactRef: {
      refId: 'billing_ref_task_1922',
      customerId: 'customer_should_not_be_billing_contact',
      reporterId: 'reporter_should_not_be_billing_contact',
    },
  }));

  assertAllowed(result);
  assert.deepEqual(result.billingContactRef, {
    refId: 'billing_ref_task_1922',
    kind: 'billing_contact_ref',
    type: 'billing_contact',
  });
  assert.equal(Object.prototype.hasOwnProperty.call(result.billingContactRef, 'customerId'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.billingContactRef, 'reporterId'), false);
  assertNoUnsafeLeak(result);
});
