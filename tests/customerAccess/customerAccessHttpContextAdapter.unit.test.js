'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { mapCustomerAccessHttpContext } = require('../../src/customerAccess/customerAccessHttpContextAdapter');

const forbiddenValues = [
  '0912-345-678',
  '台北市信義區測試路1號',
  'U1234567890abcdef',
  'internal note should never leak',
  'audit log should never leak',
  'ai raw payload should never leak',
  'internal billing data should never leak',
  'token should never leak',
  'secret should never leak',
];

function validContext() {
  return {
    params: { caseId: 'case-synthetic' },
    auth: {
      organizationId: 'org-synthetic',
      customerId: 'customer-synthetic',
      customerIdentityVerified: true,
    },
    channel: {
      lineChannelId: 'line-channel-synthetic',
      lineUserId: 'U1234567890abcdef',
    },
    access: {
      organizationScopeMatched: true,
      caseLinkedToCustomer: true,
      publicationAllowed: true,
      customerVisiblePolicyPassed: true,
    },
    customerVisibleData: {
      serviceReport: {
        caseNo: 'CASE-001',
        finalAppointmentId: 'appointment-final-001',
      },
    },
  };
}

function assertNoForbiddenValues(mapped) {
  const serialized = JSON.stringify(mapped);

  for (const value of forbiddenValues) {
    assert.equal(serialized.includes(value), false, `mapped context leaked forbidden value: ${value}`);
  }
}

test('maps valid HTTP-like context into request-like facade input', () => {
  const mapped = mapCustomerAccessHttpContext(validContext());

  assert.deepEqual(mapped, {
    organizationId: 'org-synthetic',
    caseId: 'case-synthetic',
    customerId: 'customer-synthetic',
    isCustomerIdentityVerified: true,
    isCaseLinkedToCustomer: true,
    isPublicationAllowed: true,
    isCustomerVisiblePolicyPassed: true,
    organizationScopeMatches: true,
    channelIdentityPresent: true,
    scopedChannelIdentityPresent: true,
    customerVisibleData: {
      serviceReport: {
        caseNo: 'CASE-001',
        finalAppointmentId: 'appointment-final-001',
      },
    },
  });
  assertNoForbiddenValues(mapped);
});

test('missing input maps to fail-closed request-like input', () => {
  const mapped = mapCustomerAccessHttpContext();

  assert.equal(mapped.organizationId, undefined);
  assert.equal(mapped.caseId, undefined);
  assert.equal(mapped.customerId, undefined);
  assert.equal(mapped.isCustomerIdentityVerified, false);
  assert.equal(mapped.isCaseLinkedToCustomer, false);
  assert.equal(mapped.isPublicationAllowed, false);
  assert.equal(mapped.isCustomerVisiblePolicyPassed, false);
  assert.equal(mapped.organizationScopeMatches, false);
  assertNoForbiddenValues(mapped);
});

test('missing auth.organizationId maps to fail-closed input', () => {
  const context = validContext();
  delete context.auth.organizationId;

  const mapped = mapCustomerAccessHttpContext(context);

  assert.equal(mapped.organizationId, undefined);
  assert.equal(mapped.organizationScopeMatches, true);
  assertNoForbiddenValues(mapped);
});

test('missing params.caseId maps to fail-closed input', () => {
  const context = validContext();
  delete context.params.caseId;

  const mapped = mapCustomerAccessHttpContext(context);

  assert.equal(mapped.caseId, undefined);
  assertNoForbiddenValues(mapped);
});

test('unverified identity remains unverified', () => {
  const context = validContext();
  context.auth.customerIdentityVerified = false;

  const mapped = mapCustomerAccessHttpContext(context);

  assert.equal(mapped.isCustomerIdentityVerified, false);
  assertNoForbiddenValues(mapped);
});

test('raw phone only does not become verified identity', () => {
  const mapped = mapCustomerAccessHttpContext({
    auth: { organizationId: 'org-synthetic' },
    access: { organizationScopeMatched: true },
    rawPhone: '0912-345-678',
  });

  assert.equal(mapped.isCustomerIdentityVerified, false);
  assertNoForbiddenValues(mapped);
});

test('raw address only does not become verified identity', () => {
  const mapped = mapCustomerAccessHttpContext({
    auth: { organizationId: 'org-synthetic' },
    access: { organizationScopeMatched: true },
    rawAddress: '台北市信義區測試路1號',
  });

  assert.equal(mapped.isCustomerIdentityVerified, false);
  assertNoForbiddenValues(mapped);
});

test('line user id alone does not become verified identity', () => {
  const mapped = mapCustomerAccessHttpContext({
    auth: { organizationId: 'org-synthetic' },
    channel: { lineUserId: 'U1234567890abcdef' },
    access: { organizationScopeMatched: true },
  });

  assert.equal(mapped.isCustomerIdentityVerified, false);
  assert.equal(mapped.channelIdentityPresent, false);
  assert.equal(mapped.scopedChannelIdentityPresent, false);
  assertNoForbiddenValues(mapped);
});

test('organizationId plus lineChannelId and lineUserId alone does not become verified identity', () => {
  const mapped = mapCustomerAccessHttpContext({
    auth: { organizationId: 'org-synthetic' },
    channel: {
      lineChannelId: 'line-channel-synthetic',
      lineUserId: 'U1234567890abcdef',
    },
    access: { organizationScopeMatched: true },
  });

  assert.equal(mapped.isCustomerIdentityVerified, false);
  assert.equal(mapped.channelIdentityPresent, true);
  assert.equal(mapped.scopedChannelIdentityPresent, true);
  assertNoForbiddenValues(mapped);
});

test('publication not allowed remains not allowed', () => {
  const context = validContext();
  context.access.publicationAllowed = false;

  const mapped = mapCustomerAccessHttpContext(context);

  assert.equal(mapped.isPublicationAllowed, false);
  assertNoForbiddenValues(mapped);
});

test('customer-visible policy failure remains failed', () => {
  const context = validContext();
  context.access.customerVisiblePolicyPassed = false;

  const mapped = mapCustomerAccessHttpContext(context);

  assert.equal(mapped.isCustomerVisiblePolicyPassed, false);
  assertNoForbiddenValues(mapped);
});

test('strips forbidden fields from customer-visible data', () => {
  const context = validContext();
  context.customerVisibleData.serviceReport.phone = '0912-345-678';
  context.customerVisibleData.serviceReport.address = '台北市信義區測試路1號';
  context.customerVisibleData.serviceReport.rawLineUserId = 'U1234567890abcdef';
  context.customerVisibleData.serviceReport.internalNote = 'internal note should never leak';
  context.customerVisibleData.serviceReport.auditLog = 'audit log should never leak';
  context.customerVisibleData.serviceReport.aiRawPayload = 'ai raw payload should never leak';
  context.customerVisibleData.serviceReport.internalBillingData = 'internal billing data should never leak';
  context.customerVisibleData.serviceReport.token = 'token should never leak';
  context.customerVisibleData.serviceReport.secret = 'secret should never leak';

  const mapped = mapCustomerAccessHttpContext(context);

  assert.deepEqual(mapped.customerVisibleData, {
    serviceReport: {
      caseNo: 'CASE-001',
      finalAppointmentId: 'appointment-final-001',
    },
  });
  assertNoForbiddenValues(mapped);
});

test('input object is not mutated and finalAppointmentId is not modified', () => {
  const context = validContext();
  context.customerVisibleData.serviceReport.phone = '0912-345-678';
  const before = JSON.parse(JSON.stringify(context));

  const mapped = mapCustomerAccessHttpContext(context);

  assert.deepEqual(context, before);
  assert.equal(context.customerVisibleData.serviceReport.finalAppointmentId, 'appointment-final-001');
  assert.equal(mapped.customerVisibleData.serviceReport.finalAppointmentId, 'appointment-final-001');
  assertNoForbiddenValues(mapped);
});
