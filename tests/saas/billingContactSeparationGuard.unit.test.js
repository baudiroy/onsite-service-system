'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  BILLING_CONTACT_SEPARATION_GUARD_KIND,
  evaluateBillingContactSeparationGuard,
} = require('../../src/saas/billingContactSeparationGuard');

const ORG_ID = '33333333-3333-4333-8333-333333333333';
const REQUEST_ID = 'req_task_1923';

function billingContactRef(overrides = {}) {
  return {
    refId: 'billing_contact_task_1923',
    type: 'billing_contact',
    verified: true,
    consentVerified: true,
    safeSummary: {
      displayName: 'Billing Contact',
      maskedPhone: '09**-***-123',
    },
    ...overrides,
  };
}

function baseInput(overrides = {}) {
  return {
    organizationId: ORG_ID,
    billingContactRef: billingContactRef(),
    customerRef: { refId: 'customer_task_1923', role: 'customer' },
    reporterRef: { refId: 'reporter_task_1923', role: 'reporter' },
    onSiteContactRef: { refId: 'onsite_task_1923', role: 'on_site_contact' },
    adminActorRef: { refId: 'admin_task_1923', role: 'admin_actor' },
    organizationOwnerRef: { refId: 'owner_task_1923', role: 'organization_owner' },
    requestId: REQUEST_ID,
    ...overrides,
  };
}

function assertAllowed(result) {
  assert.equal(result.ok, true);
  assert.equal(result.allowed, true);
  assert.equal(result.guardKind, BILLING_CONTACT_SEPARATION_GUARD_KIND);
  assert.equal(result.reasonCode, 'billing_contact_separation_allowed');
  assert.equal(result.organizationId, ORG_ID);
}

function assertDenied(result, reasonCode) {
  assert.equal(result.ok, false);
  assert.equal(result.allowed, false);
  assert.equal(result.guardKind, BILLING_CONTACT_SEPARATION_GUARD_KIND);
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
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'provider_payload_should_not_leak',
    'invoice_should_not_be_created',
    'payment_should_not_be_created',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('billing contact remains distinct from customer reporter on-site admin and owner roles', () => {
  const result = evaluateBillingContactSeparationGuard(baseInput());

  assertAllowed(result);
  assert.equal(result.billingContact.use, 'billing_metadata_only');
  assert.equal(result.billingContact.notificationRecipientMetadata, true);
  assert.equal(result.billingContact.customerIdentity, false);
  assert.equal(result.billingContact.reporterIdentity, false);
  assert.equal(result.billingContact.onSiteContactIdentity, false);
  assert.equal(result.billingContact.adminActor, false);
  assert.equal(result.billingContact.organizationOwner, false);
  assert.equal(result.billingContact.entitlementOwner, false);
  assert.equal(result.billingContact.paymentAuthority, false);
  assert.equal(result.invoiceCreated, false);
  assert.equal(result.paymentCreated, false);
  assert.equal(result.paymentMethodCollected, false);
  assert.equal(result.billingProviderCalled, false);
  assertNoUnsafeLeak(result);
});

test('same person represented in multiple roles is allowed without role conflation', () => {
  const result = evaluateBillingContactSeparationGuard(baseInput({
    billingContactRef: billingContactRef({ refId: 'same_person_ref' }),
    customerRef: { refId: 'same_person_ref', role: 'customer' },
    reporterRef: { refId: 'same_person_ref', role: 'reporter' },
  }));

  assertAllowed(result);
  assert.equal(result.samePersonAllowedWithoutRoleConflation, true);
  assert.equal(result.billingContact.refId, 'same_person_ref');
  assert.equal(result.billingContact.customerIdentity, false);
  assert.equal(result.billingContact.reporterIdentity, false);
  assertNoUnsafeLeak(result);
});

test('missing and unsupported billing contact context fail closed', () => {
  assertDenied(
    evaluateBillingContactSeparationGuard(baseInput({ billingContactRef: undefined })),
    'billing_contact_context_required',
  );

  assertDenied(
    evaluateBillingContactSeparationGuard(baseInput({
      billingContactRef: billingContactRef({ type: 'payment_authority' }),
    })),
    'billing_contact_type_unsupported',
  );
});

test('frontend-only billing contact claim and role conflation are denied', () => {
  assertDenied(
    evaluateBillingContactSeparationGuard(baseInput({ billingContactSource: 'frontend' })),
    'billing_contact_frontend_only_claim_denied',
  );

  assertDenied(
    evaluateBillingContactSeparationGuard(baseInput({
      billingContactRef: billingContactRef({ role: 'customer' }),
    })),
    'billing_contact_role_conflation_denied',
  );
});

test('raw phone address and provider payload are excluded when normalized safe summary exists', () => {
  const result = evaluateBillingContactSeparationGuard(baseInput({
    billingContactRef: billingContactRef({
      rawPhone: 'raw_phone_should_not_leak',
      rawAddress: 'raw_address_should_not_leak',
      providerPayload: 'provider_payload_should_not_leak',
      safeSummary: {
        displayName: 'Billing Contact',
        maskedPhone: '09**-***-123',
        maskedAddress: 'Taipei ***',
      },
    }),
  }));

  assertAllowed(result);
  assert.equal(result.billingContact.safeSummary.maskedPhone, '09**-***-123');
  assert.equal(result.billingContact.safeSummary.maskedAddress, 'Taipei ***');
  assertNoUnsafeLeak(result);
});

test('raw unverified contact payload and missing consent or verification fail closed', () => {
  assertDenied(
    evaluateBillingContactSeparationGuard(baseInput({
      billingContactRef: {
        refId: 'raw_contact',
        type: 'billing_contact',
        verified: true,
        consentVerified: true,
        rawPhone: 'raw_phone_should_not_leak',
      },
    })),
    'billing_contact_raw_unverified_payload_denied',
  );

  assertDenied(
    evaluateBillingContactSeparationGuard(baseInput({
      billingContactRef: billingContactRef({ consentVerified: false }),
    })),
    'billing_contact_consent_required',
  );

  assertDenied(
    evaluateBillingContactSeparationGuard(baseInput({
      billingContactRef: billingContactRef({ verified: false }),
    })),
    'billing_contact_verification_required',
  );
});
