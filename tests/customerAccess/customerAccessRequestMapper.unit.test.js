'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { mapCustomerAccessRequest } = require('../../src/customerAccess/customerAccessRequestMapper');

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

function assertNoForbiddenValues(mapped) {
  const serialized = JSON.stringify(mapped);

  for (const value of forbiddenValues) {
    assert.equal(serialized.includes(value), false, `mapped output leaked forbidden value: ${value}`);
  }
}

test('maps valid verified customer access request into service input shape', () => {
  const mapped = mapCustomerAccessRequest({
    organizationId: 'org-synthetic',
    organizationScopeMatches: true,
    caseId: 'case-synthetic',
    customerId: 'customer-synthetic',
    isCustomerIdentityVerified: true,
    isCaseLinkedToCustomer: true,
    isPublicationAllowed: true,
    isCustomerVisiblePolicyPassed: true,
    lineChannelId: 'line-channel-synthetic',
    lineUserId: 'U1234567890abcdef',
    customerVisibleData: {
      serviceReport: {
        caseNo: 'CASE-001',
        status: 'completed',
      },
    },
  });

  assert.deepEqual(mapped, {
    organizationScope: {
      organizationId: 'org-synthetic',
      present: true,
      matches: true,
    },
    customerIdentity: {
      customerId: 'customer-synthetic',
      verified: true,
      channelIdentityPresent: true,
      scopedChannelIdentityPresent: true,
    },
    caseLinkage: {
      caseId: 'case-synthetic',
      linked: true,
    },
    publication: {
      allowed: true,
    },
    customerVisiblePolicy: {
      passed: true,
    },
    customerVisibleData: {
      serviceReport: {
        caseNo: 'CASE-001',
        status: 'completed',
      },
    },
  });
  assertNoForbiddenValues(mapped);
});

test('missing input maps to fail-closed input', () => {
  const mapped = mapCustomerAccessRequest();

  assert.equal(mapped.organizationScope.present, false);
  assert.equal(mapped.organizationScope.matches, false);
  assert.equal(mapped.customerIdentity.verified, false);
  assert.equal(mapped.caseLinkage.linked, false);
  assert.equal(mapped.publication.allowed, false);
  assert.equal(mapped.customerVisiblePolicy.passed, false);
  assertNoForbiddenValues(mapped);
});

test('missing organization id maps to fail-closed input', () => {
  const mapped = mapCustomerAccessRequest({
    organizationScopeMatches: true,
    isCustomerIdentityVerified: true,
    isCaseLinkedToCustomer: true,
    isPublicationAllowed: true,
    isCustomerVisiblePolicyPassed: true,
  });

  assert.equal(mapped.organizationScope.present, false);
  assert.equal(mapped.organizationScope.matches, true);
  assertNoForbiddenValues(mapped);
});

test('unverified customer identity remains unverified', () => {
  const mapped = mapCustomerAccessRequest({
    organizationId: 'org-synthetic',
    organizationScopeMatches: true,
    customerId: 'customer-synthetic',
    isCustomerIdentityVerified: false,
  });

  assert.equal(mapped.customerIdentity.verified, false);
  assert.equal(mapped.customerIdentity.customerId, 'customer-synthetic');
  assertNoForbiddenValues(mapped);
});

test('raw phone only does not become verified identity', () => {
  const mapped = mapCustomerAccessRequest({
    organizationId: 'org-synthetic',
    organizationScopeMatches: true,
    rawPhone: '0912-345-678',
  });

  assert.equal(mapped.customerIdentity.verified, false);
  assert.equal(mapped.customerIdentity.customerId, undefined);
  assertNoForbiddenValues(mapped);
});

test('raw address only does not become verified identity', () => {
  const mapped = mapCustomerAccessRequest({
    organizationId: 'org-synthetic',
    organizationScopeMatches: true,
    rawAddress: '台北市信義區測試路1號',
  });

  assert.equal(mapped.customerIdentity.verified, false);
  assertNoForbiddenValues(mapped);
});

test('line user id alone does not become verified identity', () => {
  const mapped = mapCustomerAccessRequest({
    organizationId: 'org-synthetic',
    organizationScopeMatches: true,
    lineUserId: 'U1234567890abcdef',
  });

  assert.equal(mapped.customerIdentity.verified, false);
  assert.equal(mapped.customerIdentity.channelIdentityPresent, false);
  assert.equal(mapped.customerIdentity.scopedChannelIdentityPresent, false);
  assertNoForbiddenValues(mapped);
});

test('organizationId plus line channel and user id alone does not become verified identity', () => {
  const mapped = mapCustomerAccessRequest({
    organizationId: 'org-synthetic',
    organizationScopeMatches: true,
    lineChannelId: 'line-channel-synthetic',
    lineUserId: 'U1234567890abcdef',
  });

  assert.equal(mapped.customerIdentity.verified, false);
  assert.equal(mapped.customerIdentity.channelIdentityPresent, true);
  assert.equal(mapped.customerIdentity.scopedChannelIdentityPresent, true);
  assertNoForbiddenValues(mapped);
});

test('missing case linkage maps to fail-closed input', () => {
  const mapped = mapCustomerAccessRequest({
    organizationId: 'org-synthetic',
    organizationScopeMatches: true,
    caseId: 'case-synthetic',
    customerId: 'customer-synthetic',
    isCustomerIdentityVerified: true,
  });

  assert.equal(mapped.caseLinkage.caseId, 'case-synthetic');
  assert.equal(mapped.caseLinkage.linked, false);
  assertNoForbiddenValues(mapped);
});

test('publication not allowed remains not allowed', () => {
  const mapped = mapCustomerAccessRequest({
    organizationId: 'org-synthetic',
    organizationScopeMatches: true,
    isPublicationAllowed: false,
  });

  assert.equal(mapped.publication.allowed, false);
  assertNoForbiddenValues(mapped);
});

test('customer-visible policy failure remains failed', () => {
  const mapped = mapCustomerAccessRequest({
    organizationId: 'org-synthetic',
    organizationScopeMatches: true,
    isCustomerVisiblePolicyPassed: false,
  });

  assert.equal(mapped.customerVisiblePolicy.passed, false);
  assertNoForbiddenValues(mapped);
});

test('strips forbidden fields from customer-visible data', () => {
  const mapped = mapCustomerAccessRequest({
    organizationId: 'org-synthetic',
    organizationScopeMatches: true,
    customerVisibleData: {
      serviceReport: {
        caseNo: 'CASE-001',
        finalAppointmentId: 'appointment-final-001',
        rawPhone: '0912-345-678',
        rawAddress: '台北市信義區測試路1號',
        rawLineUserId: 'U1234567890abcdef',
        internalNote: 'internal note should never leak',
        auditLog: 'audit log should never leak',
        aiRawPayload: 'ai raw payload should never leak',
        internalBillingData: 'internal billing data should never leak',
        token: 'token should never leak',
        secret: 'secret should never leak',
      },
    },
  });

  assert.deepEqual(mapped.customerVisibleData, {
    serviceReport: {
      caseNo: 'CASE-001',
      finalAppointmentId: 'appointment-final-001',
    },
  });
  assertNoForbiddenValues(mapped);
});

test('input object is not mutated and finalAppointmentId is not modified', () => {
  const input = {
    organizationId: 'org-synthetic',
    organizationScopeMatches: true,
    customerVisibleData: {
      serviceReport: {
        caseNo: 'CASE-001',
        finalAppointmentId: 'appointment-final-001',
        rawPhone: '0912-345-678',
      },
    },
  };
  const before = JSON.parse(JSON.stringify(input));

  const mapped = mapCustomerAccessRequest(input);

  assert.deepEqual(input, before);
  assert.equal(input.customerVisibleData.serviceReport.finalAppointmentId, 'appointment-final-001');
  assert.equal(mapped.customerVisibleData.serviceReport.finalAppointmentId, 'appointment-final-001');
  assertNoForbiddenValues(mapped);
});
