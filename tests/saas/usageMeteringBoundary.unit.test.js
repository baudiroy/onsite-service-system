'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  USAGE_METERING_BOUNDARY_KIND,
  evaluateUsageMeteringBoundary,
} = require('../../src/saas/usageMeteringBoundary');

const ORG_ID = '33333333-3333-4333-8333-333333333333';
const REQUEST_ID = 'req_task_1921';

function entitlementContext(overrides = {}) {
  return {
    granted: true,
    requiredEntitlement: 'engineer.mobile.basic',
    limits: {
      engineer_mobile: 10,
    },
    ...overrides,
  };
}

function baseInput(overrides = {}) {
  return {
    organizationId: ORG_ID,
    metricKey: 'engineer_mobile.actions.count',
    quantity: 2,
    currentUsage: 3,
    entitlementContext: entitlementContext(),
    usageSource: 'server',
    requestId: REQUEST_ID,
    ...overrides,
  };
}

function assertAccepted(result) {
  assert.equal(result.ok, true);
  assert.equal(result.accepted, true);
  assert.equal(result.boundaryKind, USAGE_METERING_BOUNDARY_KIND);
  assert.equal(result.reasonCode, 'usage_metering_event_accepted');
  assert.equal(result.organizationId, ORG_ID);
  assert.equal(result.entitlement.source, 'server_policy');
}

function assertDenied(result, reasonCode) {
  assert.equal(result.ok, false);
  assert.equal(result.accepted, false);
  assert.equal(result.boundaryKind, USAGE_METERING_BOUNDARY_KIND);
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

test('accepted synthetic usage event returns internal accounting envelope only', () => {
  const result = evaluateUsageMeteringBoundary(baseInput());

  assertAccepted(result);
  assert.deepEqual(result.metric, {
    metricKey: 'engineer_mobile.actions.count',
    category: 'engineer_mobile',
    unit: 'count',
    entitlementKey: 'engineer.mobile.basic',
  });
  assert.deepEqual(result.usage, {
    quantity: 2,
    previousQuantity: 3,
    projectedQuantity: 5,
    limit: 10,
    overLimit: false,
    internalAccountingOnly: true,
    invoiceCreated: false,
    paymentCreated: false,
    paymentMethodCollected: false,
    billingProviderCalled: false,
  });
  assertNoUnsafeLeak(result);
});

test('unknown metric fails closed', () => {
  const result = evaluateUsageMeteringBoundary(baseInput({
    metricKey: 'unknown.metric',
  }));

  assertDenied(result, 'usage_metering_metric_unknown');
  assertNoUnsafeLeak(result);
});

test('negative and non-integer usage quantities fail closed for count metrics', () => {
  for (const quantity of [-1, 1.5]) {
    const result = evaluateUsageMeteringBoundary(baseInput({ quantity }));

    assertDenied(result, 'usage_metering_quantity_invalid');
    assertNoUnsafeLeak(result);
  }
});

test('frontend-only usage claim is denied even with entitlement context', () => {
  const result = evaluateUsageMeteringBoundary(baseInput({
    usageSource: 'frontend',
  }));

  assertDenied(result, 'usage_metering_frontend_only_claim_denied');
  assertNoUnsafeLeak(result);
});

test('missing entitlement context and missing required entitlement fail closed', () => {
  assertDenied(
    evaluateUsageMeteringBoundary(baseInput({ entitlementContext: undefined })),
    'usage_metering_entitlement_context_required',
  );

  assertDenied(
    evaluateUsageMeteringBoundary(baseInput({
      entitlementContext: {
        granted: true,
        requiredEntitlement: 'case.basic',
      },
    })),
    'usage_metering_entitlement_missing',
  );
});

test('usage above server-side entitlement limit is denied without invoice/payment behavior', () => {
  const result = evaluateUsageMeteringBoundary(baseInput({
    currentUsage: 9,
    quantity: 2,
  }));

  assertDenied(result, 'usage_metering_limit_exceeded');
  assert.equal(result.usage.invoiceCreated, false);
  assert.equal(result.usage.paymentCreated, false);
  assert.equal(result.usage.paymentMethodCollected, false);
  assert.equal(result.usage.billingProviderCalled, false);
  assertNoUnsafeLeak(result);
});

test('usage meter remains separate from billing contact customer and reporter identity', () => {
  const result = evaluateUsageMeteringBoundary(baseInput({
    billingContactRef: {
      refId: 'billing_ref_task_1921',
      customerId: 'customer_should_not_be_billing_contact',
      reporterId: 'reporter_should_not_be_billing_contact',
    },
  }));

  assertAccepted(result);
  assert.deepEqual(result.billingContactRef, {
    refId: 'billing_ref_task_1921',
    kind: 'billing_contact_ref',
    type: 'billing_contact',
  });
  assert.equal(Object.prototype.hasOwnProperty.call(result.billingContactRef, 'customerId'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.billingContactRef, 'reporterId'), false);
  assertNoUnsafeLeak(result);
});
