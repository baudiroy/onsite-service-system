'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { buildCustomerAccessHttpResponse } = require('../../src/customerAccess/customerAccessHttpFacade');

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
        status: 'completed',
        finalAppointmentId: 'appointment-final-001',
        summary: 'Service completed.',
      },
    },
  };
}

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
    assert.equal(serialized.includes(value), false, `HTTP facade response leaked forbidden value: ${value}`);
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

test('valid verified HTTP-like context returns allow envelope', () => {
  const response = buildCustomerAccessHttpResponse(validContext());

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
  assertGenericDeny(buildCustomerAccessHttpResponse());
});

test('missing organization id returns generic safe-deny envelope', () => {
  const context = validContext();
  delete context.auth.organizationId;

  assertGenericDeny(buildCustomerAccessHttpResponse(context));
});

test('missing case id returns generic safe-deny envelope', () => {
  const context = validContext();
  delete context.params.caseId;

  assertGenericDeny(buildCustomerAccessHttpResponse(context));
});

test('unverified customer identity returns generic safe-deny envelope', () => {
  const context = validContext();
  context.auth.customerIdentityVerified = false;

  assertGenericDeny(buildCustomerAccessHttpResponse(context));
});

test('raw phone only returns generic safe-deny envelope', () => {
  assertGenericDeny(
    buildCustomerAccessHttpResponse({
      auth: { organizationId: 'org-synthetic' },
      access: { organizationScopeMatched: true },
      rawPhone: '0912-345-678',
    }),
  );
});

test('raw address only returns generic safe-deny envelope', () => {
  assertGenericDeny(
    buildCustomerAccessHttpResponse({
      auth: { organizationId: 'org-synthetic' },
      access: { organizationScopeMatched: true },
      rawAddress: '台北市信義區測試路1號',
    }),
  );
});

test('LINE id alone returns generic safe-deny envelope', () => {
  assertGenericDeny(
    buildCustomerAccessHttpResponse({
      auth: { organizationId: 'org-synthetic' },
      channel: { lineUserId: 'U1234567890abcdef' },
      access: { organizationScopeMatched: true },
    }),
  );
});

test('organizationId plus lineChannelId and lineUserId alone returns generic safe-deny envelope', () => {
  assertGenericDeny(
    buildCustomerAccessHttpResponse({
      auth: { organizationId: 'org-synthetic' },
      channel: {
        lineChannelId: 'line-channel-synthetic',
        lineUserId: 'U1234567890abcdef',
      },
      access: { organizationScopeMatched: true },
    }),
  );
});

test('missing Case linkage returns generic safe-deny envelope', () => {
  const context = validContext();
  context.access.caseLinkedToCustomer = false;

  assertGenericDeny(buildCustomerAccessHttpResponse(context));
});

test('publication not allowed returns generic safe-deny envelope', () => {
  const context = validContext();
  context.access.publicationAllowed = false;

  assertGenericDeny(buildCustomerAccessHttpResponse(context));
});

test('customer-visible policy failure returns generic safe-deny envelope', () => {
  const context = validContext();
  context.access.customerVisiblePolicyPassed = false;

  assertGenericDeny(buildCustomerAccessHttpResponse(context));
});

test('allow envelope strips forbidden customer-visible fields', () => {
  const context = validContext();
  context.customerVisibleData.serviceReport.phone = '0912-345-678';
  context.customerVisibleData.serviceReport.address = '台北市信義區測試路1號';
  context.customerVisibleData.serviceReport.rawLineUserId = 'U1234567890abcdef';
  context.customerVisibleData.serviceReport.internalNote = 'internal note should never leak';
  context.customerVisibleData.serviceReport.auditLog = 'audit log should never leak';
  context.customerVisibleData.serviceReport.aiRawPayload = 'ai raw payload should never leak';
  context.customerVisibleData.serviceReport.internalBillingData = 'internal billing data should never leak';
  context.customerVisibleData.serviceReport.maskedPhone = '09xx-xxx-678';

  const response = buildCustomerAccessHttpResponse(context);

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
  const context = validContext();
  context.rawPhone = '0912-345-678';
  const before = JSON.parse(JSON.stringify(context));

  const response = buildCustomerAccessHttpResponse(context);

  assert.deepEqual(context, before);
  assert.equal(context.customerVisibleData.serviceReport.finalAppointmentId, 'appointment-final-001');
  assert.equal(response.data.serviceReport.finalAppointmentId, 'appointment-final-001');
  assertSafeResponse(response);
});
