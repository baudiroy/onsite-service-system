'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { buildCustomerAccessFacadeResponse } = require('../../src/customerAccess/customerAccessFacade');

const validRequest = () => ({
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
      finalAppointmentId: 'appointment-final-001',
      summary: 'Service completed.',
    },
  },
});

const forbiddenValues = [
  '0912-345-678',
  '台北市信義區測試路1號',
  'U1234567890abcdef',
  'internal note should never leak',
  'audit log should never leak',
  'ai raw payload should never leak',
  'internal billing data should never leak',
  'MISSING_ORGANIZATION_SCOPE',
  'UNVERIFIED_CUSTOMER_IDENTITY',
  'MISSING_CASE_LINKAGE',
  'PUBLICATION_NOT_ALLOWED',
  'CUSTOMER_VISIBLE_POLICY_FAILED',
];

function assertSafeResponse(response) {
  const serialized = JSON.stringify(response);

  for (const value of forbiddenValues) {
    assert.equal(serialized.includes(value), false, `facade response leaked forbidden value: ${value}`);
  }
}

function assertGenericDeny(response) {
  assert.deepEqual(response, {
    status: 'deny',
    messageKey: 'customerAccess.unavailable',
    customerVisible: false,
    data: null,
    error: {
      messageKey: 'customerAccess.unavailable',
    },
  });
  assertSafeResponse(response);
}

test('valid verified request-like input returns allow envelope', () => {
  const response = buildCustomerAccessFacadeResponse(validRequest());

  assert.deepEqual(response, {
    status: 'allow',
    messageKey: 'customerAccess.available',
    customerVisible: true,
    data: {
      serviceReport: {
        caseNo: 'CASE-001',
        status: 'completed',
        finalAppointmentId: 'appointment-final-001',
        summary: 'Service completed.',
      },
    },
  });
  assertSafeResponse(response);
});

test('missing input returns generic safe-deny envelope', () => {
  assertGenericDeny(buildCustomerAccessFacadeResponse());
});

test('missing organization id returns generic safe-deny envelope', () => {
  const request = validRequest();
  delete request.organizationId;

  assertGenericDeny(buildCustomerAccessFacadeResponse(request));
});

test('unverified customer identity returns generic safe-deny envelope', () => {
  const request = validRequest();
  request.isCustomerIdentityVerified = false;

  assertGenericDeny(buildCustomerAccessFacadeResponse(request));
});

test('raw phone only returns generic safe-deny envelope', () => {
  assertGenericDeny(
    buildCustomerAccessFacadeResponse({
      organizationId: 'org-synthetic',
      organizationScopeMatches: true,
      rawPhone: '0912-345-678',
    }),
  );
});

test('raw address only returns generic safe-deny envelope', () => {
  assertGenericDeny(
    buildCustomerAccessFacadeResponse({
      organizationId: 'org-synthetic',
      organizationScopeMatches: true,
      rawAddress: '台北市信義區測試路1號',
    }),
  );
});

test('LINE id alone returns generic safe-deny envelope', () => {
  assertGenericDeny(
    buildCustomerAccessFacadeResponse({
      organizationId: 'org-synthetic',
      organizationScopeMatches: true,
      lineUserId: 'U1234567890abcdef',
    }),
  );
});

test('organizationId plus lineChannelId and lineUserId alone returns generic safe-deny envelope', () => {
  assertGenericDeny(
    buildCustomerAccessFacadeResponse({
      organizationId: 'org-synthetic',
      organizationScopeMatches: true,
      lineChannelId: 'line-channel-synthetic',
      lineUserId: 'U1234567890abcdef',
    }),
  );
});

test('missing Case linkage returns generic safe-deny envelope', () => {
  const request = validRequest();
  request.isCaseLinkedToCustomer = false;

  assertGenericDeny(buildCustomerAccessFacadeResponse(request));
});

test('publication not allowed returns generic safe-deny envelope', () => {
  const request = validRequest();
  request.isPublicationAllowed = false;

  assertGenericDeny(buildCustomerAccessFacadeResponse(request));
});

test('customer-visible policy failure returns generic safe-deny envelope', () => {
  const request = validRequest();
  request.isCustomerVisiblePolicyPassed = false;

  assertGenericDeny(buildCustomerAccessFacadeResponse(request));
});

test('allow envelope strips forbidden customer-visible fields', () => {
  const request = validRequest();
  request.customerVisibleData.serviceReport.phone = '0912-345-678';
  request.customerVisibleData.serviceReport.address = '台北市信義區測試路1號';
  request.customerVisibleData.serviceReport.rawLineUserId = 'U1234567890abcdef';
  request.customerVisibleData.serviceReport.internalNote = 'internal note should never leak';
  request.customerVisibleData.serviceReport.auditLog = 'audit log should never leak';
  request.customerVisibleData.serviceReport.aiRawPayload = 'ai raw payload should never leak';
  request.customerVisibleData.serviceReport.internalBillingData = 'internal billing data should never leak';
  request.customerVisibleData.serviceReport.maskedPhone = '09xx-xxx-678';

  const response = buildCustomerAccessFacadeResponse(request);

  assert.deepEqual(response.data, {
    serviceReport: {
      caseNo: 'CASE-001',
      status: 'completed',
      finalAppointmentId: 'appointment-final-001',
      summary: 'Service completed.',
      maskedPhone: '09xx-xxx-678',
    },
  });
  assertSafeResponse(response);
});

test('input object is not mutated and finalAppointmentId is not modified', () => {
  const request = validRequest();
  request.rawPhone = '0912-345-678';
  const before = JSON.parse(JSON.stringify(request));

  const response = buildCustomerAccessFacadeResponse(request);

  assert.deepEqual(request, before);
  assert.equal(request.customerVisibleData.serviceReport.finalAppointmentId, 'appointment-final-001');
  assert.equal(response.data.serviceReport.finalAppointmentId, 'appointment-final-001');
  assertSafeResponse(response);
});
