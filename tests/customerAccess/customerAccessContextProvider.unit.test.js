'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildCustomerAccessContext,
} = require('../../src/customerAccess/customerAccessContextProvider');

function validInput() {
  return {
    organizationId: 'org_test_001',
    caseId: 'case_test_001',
    customerId: 'customer_test_001',
    customerIdentityVerified: true,
    caseLinkedToCustomer: true,
    publicationAllowed: true,
    customerVisiblePolicyPassed: true,
    lineChannelId: 'line_channel_test_001',
    lineUserId: 'line_user_test_001',
    customerVisibleData: {
      serviceReport: {
        publicReportId: 'report_public_test_001',
        status: 'available',
        finalAppointmentId: 'appt_final_test_001',
      },
    },
  };
}

function failClosedAccess() {
  return {
    organizationScopeMatched: false,
    caseLinkedToCustomer: false,
    publicationAllowed: false,
    customerVisiblePolicyPassed: false,
  };
}

test('valid verified context maps to controller-compatible context', () => {
  const context = buildCustomerAccessContext(validInput());

  assert.deepEqual(context, {
    params: {
      caseId: 'case_test_001',
    },
    auth: {
      organizationId: 'org_test_001',
      customerId: 'customer_test_001',
      customerIdentityVerified: true,
    },
    channel: {
      lineChannelId: 'line_channel_test_001',
      lineUserId: 'line_user_test_001',
    },
    access: {
      organizationScopeMatched: true,
      caseLinkedToCustomer: true,
      publicationAllowed: true,
      customerVisiblePolicyPassed: true,
    },
    customerVisibleData: {
      serviceReport: {
        publicReportId: 'report_public_test_001',
        status: 'available',
        finalAppointmentId: 'appt_final_test_001',
      },
    },
  });
});

test('missing input maps to fail-closed context', () => {
  assert.deepEqual(buildCustomerAccessContext(), {
    params: {},
    auth: {
      customerIdentityVerified: false,
    },
    channel: {},
    access: failClosedAccess(),
    customerVisibleData: {},
  });
});

test('missing organization id maps to fail-closed organization scope', () => {
  const input = validInput();
  delete input.organizationId;

  const context = buildCustomerAccessContext(input);

  assert.equal(context.auth.organizationId, undefined);
  assert.equal(context.auth.customerIdentityVerified, true);
  assert.equal(context.access.organizationScopeMatched, false);
  assert.equal(context.channel.lineUserId, undefined);
});

test('missing case id maps to fail-closed context', () => {
  const input = validInput();
  delete input.caseId;

  const context = buildCustomerAccessContext(input);

  assert.deepEqual(context.params, {});
  assert.equal(context.access.organizationScopeMatched, false);
  assert.equal(context.access.caseLinkedToCustomer, true);
  assert.equal(context.access.publicationAllowed, true);
});

test('unverified identity remains unverified and cannot pass linkage', () => {
  const input = validInput();
  input.customerIdentityVerified = false;

  const context = buildCustomerAccessContext(input);

  assert.equal(context.auth.customerIdentityVerified, false);
  assert.equal(context.access.caseLinkedToCustomer, false);
  assert.equal(context.access.publicationAllowed, false);
  assert.equal(context.access.customerVisiblePolicyPassed, false);
});

test('raw phone only does not become verified identity', () => {
  const context = buildCustomerAccessContext({
    organizationId: 'org_test_001',
    caseId: 'case_test_001',
    rawPhone: '0912-345-678',
  });

  assert.equal(context.auth.customerIdentityVerified, false);
  assert.equal(context.auth.customerId, undefined);
  assert.equal(context.access.caseLinkedToCustomer, false);
});

test('raw address only does not become verified identity', () => {
  const context = buildCustomerAccessContext({
    organizationId: 'org_test_001',
    caseId: 'case_test_001',
    rawAddress: '台北市信義區測試路1號',
  });

  assert.equal(context.auth.customerIdentityVerified, false);
  assert.equal(context.auth.customerId, undefined);
  assert.equal(context.access.caseLinkedToCustomer, false);
});

test('line user id alone does not become verified identity or scoped channel metadata', () => {
  const context = buildCustomerAccessContext({
    organizationId: 'org_test_001',
    caseId: 'case_test_001',
    lineUserId: 'line_user_test_001',
  });

  assert.equal(context.auth.customerIdentityVerified, false);
  assert.deepEqual(context.channel, {});
});

test('linked LINE identity resolves customer identity without treating LINE as global identity', () => {
  const context = buildCustomerAccessContext({
    organizationId: 'org_test_001',
    caseId: 'case_test_001',
    lineChannelId: 'line_channel_test_001',
    lineUserId: 'line_user_should_not_leak',
    customerIdentityLink: {
      provider: 'line',
      channel: 'line',
      organizationId: 'org_test_001',
      customerId: 'customer_linked_001',
      caseId: 'case_test_001',
      lineChannelId: 'line_channel_test_001',
      lineUserId: 'line_user_should_not_leak',
      status: 'active',
      providerPayload: {
        token: 'provider_payload_should_not_leak',
      },
    },
    caseLinkedToCustomer: true,
    publicationAllowed: true,
    customerVisiblePolicyPassed: true,
  });
  const serialized = JSON.stringify(context);

  assert.equal(context.auth.customerIdentityVerified, true);
  assert.equal(context.auth.customerId, 'customer_linked_001');
  assert.equal(context.access.caseLinkedToCustomer, true);
  assert.equal(context.access.publicationAllowed, true);
  assert.equal(serialized.includes('provider_payload_should_not_leak'), false);
});

test('ambiguous or revoked identity link fails closed even with LINE identifiers present', () => {
  for (const identityLinkInput of [
    {
      customerIdentityLinks: [
        {
          provider: 'line',
          channel: 'line',
          organizationId: 'org_test_001',
          customerId: 'customer_linked_001',
          lineChannelId: 'line_channel_test_001',
          lineUserId: 'line_user_should_not_leak',
          status: 'active',
        },
        {
          provider: 'line',
          channel: 'line',
          organizationId: 'org_test_001',
          customerId: 'customer_linked_002',
          lineChannelId: 'line_channel_test_001',
          lineUserId: 'line_user_should_not_leak',
          status: 'active',
        },
      ],
    },
    {
      customerIdentityLink: {
        provider: 'line',
        channel: 'line',
        organizationId: 'org_test_001',
        customerId: 'customer_linked_001',
        lineChannelId: 'line_channel_test_001',
        lineUserId: 'line_user_should_not_leak',
        status: 'revoked',
      },
    },
  ]) {
    const context = buildCustomerAccessContext({
      organizationId: 'org_test_001',
      caseId: 'case_test_001',
      lineChannelId: 'line_channel_test_001',
      lineUserId: 'line_user_should_not_leak',
      caseLinkedToCustomer: true,
      publicationAllowed: true,
      customerVisiblePolicyPassed: true,
      ...identityLinkInput,
    });

    assert.equal(context.auth.customerIdentityVerified, false);
    assert.equal(context.auth.customerId, undefined);
    assert.equal(context.access.caseLinkedToCustomer, false);
    assert.equal(context.access.publicationAllowed, false);
  }
});

test('organization, line channel, and line user id alone do not become verified identity', () => {
  const context = buildCustomerAccessContext({
    organizationId: 'org_test_001',
    caseId: 'case_test_001',
    lineChannelId: 'line_channel_test_001',
    lineUserId: 'line_user_test_001',
  });

  assert.equal(context.auth.customerIdentityVerified, false);
  assert.deepEqual(context.channel, {
    lineChannelId: 'line_channel_test_001',
    lineUserId: 'line_user_test_001',
  });
  assert.equal(context.access.caseLinkedToCustomer, false);
});

test('publication not allowed remains not allowed', () => {
  const input = validInput();
  input.publicationAllowed = false;

  const context = buildCustomerAccessContext(input);

  assert.equal(context.access.caseLinkedToCustomer, true);
  assert.equal(context.access.publicationAllowed, false);
  assert.equal(context.access.customerVisiblePolicyPassed, false);
});

test('customer-visible policy failure remains failed', () => {
  const input = validInput();
  input.customerVisiblePolicyPassed = false;

  const context = buildCustomerAccessContext(input);

  assert.equal(context.access.publicationAllowed, true);
  assert.equal(context.access.customerVisiblePolicyPassed, false);
});

test('forbidden fields are stripped from customer-visible data', () => {
  const input = validInput();
  input.customerVisibleData.serviceReport.internalNote = 'should-not-leak';
  input.customerVisibleData.serviceReport.auditLog = { event: 'should-not-leak' };
  input.customerVisibleData.serviceReport.aiRawPayload = { prompt: 'should-not-leak' };
  input.customerVisibleData.serviceReport.internalBillingData = { amount: 9999 };
  input.customerVisibleData.serviceReport.settlementInternalData = { vendorRule: 'should-not-leak' };
  input.customerVisibleData.serviceReport.rawPhone = '0912-345-678';
  input.customerVisibleData.serviceReport.rawAddress = '台北市信義區測試路1號';
  input.customerVisibleData.serviceReport.rawLineUserId = 'line_user_test_001';
  input.customerVisibleData.serviceReport.token = 'token_should_not_leak';
  input.customerVisibleData.serviceReport.secret = 'secret_should_not_leak';

  const context = buildCustomerAccessContext(input);
  const serialized = JSON.stringify(context.customerVisibleData);

  assert.deepEqual(context.customerVisibleData, {
    serviceReport: {
      publicReportId: 'report_public_test_001',
      status: 'available',
      finalAppointmentId: 'appt_final_test_001',
    },
  });
  assert.equal(serialized.includes('should-not-leak'), false);
  assert.equal(serialized.includes('0912-345-678'), false);
  assert.equal(serialized.includes('台北市信義區測試路1號'), false);
  assert.equal(serialized.includes('token_should_not_leak'), false);
  assert.equal(serialized.includes('secret_should_not_leak'), false);
});

test('input object is not mutated and finalAppointmentId is not modified', () => {
  const input = validInput();
  const original = JSON.parse(JSON.stringify(input));

  const context = buildCustomerAccessContext(input);

  assert.deepEqual(input, original);
  assert.equal(input.customerVisibleData.serviceReport.finalAppointmentId, 'appt_final_test_001');
  assert.equal(context.customerVisibleData.serviceReport.finalAppointmentId, 'appt_final_test_001');
});
