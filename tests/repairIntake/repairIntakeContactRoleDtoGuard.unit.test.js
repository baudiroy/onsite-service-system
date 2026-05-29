'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ACTION,
  normalizeRepairIntakeContactRoleDto,
} = require('../../src/repairIntake/repairIntakeContactRoleDtoGuard');

function assertNoUnsafeFields(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'phone',
    'address',
    'fullAddress',
    'rawPayload',
    'rawRows',
    'providerPayload',
    'token',
    'secret',
    'lineAccessToken',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked ${marker}`);
  }
}

test('all contact roles remain distinct and preserve safe refs', () => {
  const result = normalizeRepairIntakeContactRoleDto({
    reporterRef: { refId: 'person-1', type: 'reporter', source: 'web' },
    customerRef: { refId: 'person-2', type: 'customer', source: 'web' },
    billingContactRef: { refId: 'person-3', type: 'billing_contact', source: 'web' },
    onSiteContactOverrideRef: { refId: 'person-4', type: 'on_site_contact_override', source: 'web' },
  });

  assert.equal(result.ok, true);
  assert.equal(result.action, ACTION);
  assert.deepEqual(result.reporterRef, { refId: 'person-1', type: 'reporter', source: 'web' });
  assert.deepEqual(result.customerRef, { refId: 'person-2', type: 'customer', source: 'web' });
  assert.deepEqual(result.billingContactRef, { refId: 'person-3', type: 'billing_contact', source: 'web' });
  assert.deepEqual(result.onSiteContactOverrideRef, {
    refId: 'person-4',
    type: 'on_site_contact_override',
    source: 'web',
  });
});

test('missing roles stay null without borrowing another role', () => {
  const result = normalizeRepairIntakeContactRoleDto({
    reporterRef: { refId: 'person-1', type: 'reporter' },
  });

  assert.deepEqual(result.reporterRef, { refId: 'person-1', type: 'reporter' });
  assert.equal(result.customerRef, null);
  assert.equal(result.billingContactRef, null);
  assert.equal(result.onSiteContactOverrideRef, null);
});

test('same person in multiple roles is represented explicitly without role conflation', () => {
  const result = normalizeRepairIntakeContactRoleDto({
    reporterRef: { refId: 'person-shared', type: 'customer', role: 'customer' },
    customerRef: { refId: 'person-shared', type: 'customer', role: 'customer' },
    billingContactRef: { refId: 'person-shared', type: 'customer', role: 'customer' },
    onSiteContactOverrideRef: { refId: 'person-shared', type: 'customer', role: 'customer' },
  });

  assert.deepEqual(result.reporterRef, {
    refId: 'person-shared',
    type: 'reporter',
    role: 'reporter',
  });
  assert.deepEqual(result.customerRef, {
    refId: 'person-shared',
    type: 'customer',
    role: 'customer',
  });
  assert.deepEqual(result.billingContactRef, {
    refId: 'person-shared',
    type: 'billing_contact',
    role: 'billing_contact',
  });
  assert.deepEqual(result.onSiteContactOverrideRef, {
    refId: 'person-shared',
    type: 'on_site_contact_override',
    role: 'on_site_contact_override',
  });
});

test('raw phone and address are excluded while safe contact summary is preserved', () => {
  const result = normalizeRepairIntakeContactRoleDto({
    customerRef: {
      refId: 'customer-safe-summary',
      type: 'customer',
      phone: '+886900000000',
      address: 'raw address',
      rawRows: [{ phone: '+886900000000' }],
      providerPayload: 'providerPayload',
      token: 'token',
      secret: 'secret',
      safeContactSummary: {
        displayName: 'Masked Customer',
        maskedPhone: '+8869*****000',
        maskedAddress: 'Taipei ***',
        phone: '+886900000000',
        address: 'raw address',
      },
    },
  });

  assert.deepEqual(result.customerRef, {
    refId: 'customer-safe-summary',
    type: 'customer',
    safeContactSummary: {
      displayName: 'Masked Customer',
      maskedPhone: '+8869*****000',
      maskedAddress: 'Taipei ***',
    },
  });
  assertNoUnsafeFields(result);
});

test('billing contact reporter and on-site override are not treated as customer', () => {
  const result = normalizeRepairIntakeContactRoleDto({
    reporterRef: { refId: 'reporter-1', role: 'customer' },
    billingContactRef: { refId: 'billing-1', role: 'customer' },
    onSiteContactOverrideRef: { refId: 'site-1', role: 'customer' },
  });

  assert.deepEqual(result.reporterRef, { refId: 'reporter-1', role: 'reporter' });
  assert.equal(result.customerRef, null);
  assert.deepEqual(result.billingContactRef, { refId: 'billing-1', role: 'billing_contact' });
  assert.deepEqual(result.onSiteContactOverrideRef, { refId: 'site-1', role: 'on_site_contact_override' });
});

test('unsafe role ref values and unsafe safeContactSummary fields are stripped', () => {
  const result = normalizeRepairIntakeContactRoleDto({
    reporterRef: {
      refId: 'select * stack phone address providerPayload token secret',
      type: 'reporter',
      safeContactSummary: {
        displayName: 'select * stack phone address providerPayload token secret',
        maskedPhone: '+8869*****000',
      },
    },
    customerRef: {
      refId: 'customer-safe',
      type: 'customer',
      safeContactSummary: {
        displayName: 'Masked Customer',
        maskedPhone: '+8869*****000',
      },
    },
  });

  assert.deepEqual(result.reporterRef, {
    type: 'reporter',
    safeContactSummary: {
      maskedPhone: '+8869*****000',
    },
  });
  assert.deepEqual(result.customerRef, {
    refId: 'customer-safe',
    type: 'customer',
    safeContactSummary: {
      displayName: 'Masked Customer',
      maskedPhone: '+8869*****000',
    },
  });
  assertNoUnsafeFields(result);
});
