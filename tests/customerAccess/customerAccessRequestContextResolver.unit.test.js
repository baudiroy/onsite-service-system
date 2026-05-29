'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  resolveCustomerAccessContextFromRequest,
} = require('../../src/customerAccess/customerAccessRequestContextResolver');

function validContext(overrides = {}) {
  return {
    auth: {
      organizationId: 'org_request_context_001',
      customerId: 'customer_request_context_001',
      customerIdentityVerified: true,
    },
    params: {
      caseId: 'case_request_context_001',
      reportId: 'report_public_context_001',
    },
    access: {
      organizationScopeMatched: true,
      caseLinkedToCustomer: true,
      publicationAllowed: true,
      customerVisiblePolicyPassed: true,
    },
    ...overrides,
  };
}

function requestWithContext(context = validContext()) {
  return {
    customerAccessContext: context,
    headers: {
      authorization: 'Bearer token_should_not_be_trusted',
      cookie: 'session=secret_should_not_leak',
    },
    body: {
      rawPhone: '0912345678',
      rawAddress: 'No. 1 Secret Road',
      lineUserId: 'line_user_should_not_leak',
      token: 'token_should_not_leak',
    },
  };
}

function assertDenied(output) {
  assert.deepEqual(output, {
    resolved: false,
    messageKey: 'customerAccess.unavailable',
    customerVisible: false,
    customerAccessContext: null,
  });
  assertNoSensitiveLeak(output);
}

function assertNoSensitiveLeak(output) {
  const serialized = JSON.stringify(output);

  for (const value of [
    '0912345678',
    'No. 1 Secret Road',
    'line_user_should_not_leak',
    'token_should_not_be_trusted',
    'secret_should_not_leak',
    'token_should_not_leak',
    'provider_should_not_leak',
    'ai_should_not_leak',
    'billing_should_not_leak',
    'internal note should not leak',
  ]) {
    assert.equal(serialized.includes(value), false, `resolver leaked ${value}`);
  }
}

test('missing request fails closed', () => {
  assertDenied(resolveCustomerAccessContextFromRequest());
  assertDenied(resolveCustomerAccessContextFromRequest(null));
  assertDenied(resolveCustomerAccessContextFromRequest('not-object'));
});

test('missing pre-resolved synthetic context fails closed even with raw headers', () => {
  const output = resolveCustomerAccessContextFromRequest({
    headers: {
      authorization: 'Bearer token_should_not_be_trusted',
      cookie: 'session=secret_should_not_leak',
    },
  });

  assertDenied(output);
});

test('missing organization or customer id fails closed', () => {
  assertDenied(resolveCustomerAccessContextFromRequest(requestWithContext(validContext({
    auth: {
      customerId: 'customer_request_context_001',
      customerIdentityVerified: true,
    },
  }))));
  assertDenied(resolveCustomerAccessContextFromRequest(requestWithContext(validContext({
    auth: {
      organizationId: 'org_request_context_001',
      customerIdentityVerified: true,
    },
  }))));
});

test('invalid organization and customer id shapes fail closed', () => {
  assertDenied(resolveCustomerAccessContextFromRequest(requestWithContext(validContext({
    auth: {
      organizationId: 'org with spaces',
      customerId: 'customer_request_context_001',
      customerIdentityVerified: true,
    },
  }))));
  assertDenied(resolveCustomerAccessContextFromRequest(requestWithContext(validContext({
    auth: {
      organizationId: 'org_request_context_001',
      customerId: '../customer',
      customerIdentityVerified: true,
    },
  }))));
});

test('unauthorized context fails closed', () => {
  assertDenied(resolveCustomerAccessContextFromRequest(requestWithContext(validContext({
    access: {
      organizationScopeMatched: true,
      caseLinkedToCustomer: true,
      publicationAllowed: true,
      customerVisiblePolicyPassed: false,
    },
  }))));
  assertDenied(resolveCustomerAccessContextFromRequest(requestWithContext(validContext({
    authorized: false,
  }))));
});

test('malformed scoped case or report identifiers fail closed', () => {
  assertDenied(resolveCustomerAccessContextFromRequest(requestWithContext(validContext({
    params: {
      caseId: 'case with spaces',
      reportId: 'report_public_context_001',
    },
  }))));
  assertDenied(resolveCustomerAccessContextFromRequest(requestWithContext(validContext({
    params: {
      caseId: 'case_request_context_001',
      reportId: 'report/../../secret',
    },
  }))));
});

test('malformed fallback context identifiers fail closed instead of using alternate sources', () => {
  for (const context of [
    validContext({
      organizationId: '../org_request_context_001',
    }),
    validContext({
      customer: {
        id: '../customer_request_context_001',
      },
    }),
    validContext({
      caseId: 'case_request_context_001',
      case: {
        id: 'case/../../secret',
      },
    }),
    validContext({
      reportId: 'report_public_context_001',
      report: {
        id: 'report/../../secret',
      },
    }),
  ]) {
    assertDenied(resolveCustomerAccessContextFromRequest(requestWithContext(context)));
  }
});

test('request params query body and headers cannot override normalized context identifiers', () => {
  const output = resolveCustomerAccessContextFromRequest({
    customerAccessContext: validContext(),
    params: {
      caseId: 'case_route_override_should_not_win',
      reportId: 'report_route_override_should_not_win',
    },
    query: {
      caseId: 'case_query_override_should_not_win',
      reportId: 'report_query_override_should_not_win',
      organizationId: 'org_query_override_should_not_win',
      customerId: 'customer_query_override_should_not_win',
    },
    body: {
      caseId: 'case_body_override_should_not_win',
      reportId: 'report_body_override_should_not_win',
      organizationId: 'org_body_override_should_not_win',
      customerId: 'customer_body_override_should_not_win',
      token: 'token_should_not_leak',
    },
    headers: {
      authorization: 'Bearer token_should_not_be_trusted',
      cookie: 'session=secret_should_not_leak',
      'x-case-id': 'case_header_override_should_not_win',
      'x-report-id': 'report_header_override_should_not_win',
      'x-organization-id': 'org_header_override_should_not_win',
      'x-customer-id': 'customer_header_override_should_not_win',
    },
  });

  assert.equal(output.resolved, true);
  assert.deepEqual(output.customerAccessContext.params, {
    caseId: 'case_request_context_001',
    reportId: 'report_public_context_001',
  });
  assert.equal(output.customerAccessContext.organizationId, 'org_request_context_001');
  assert.equal(output.customerAccessContext.customerId, 'customer_request_context_001');
  assertNoSensitiveLeak(output);
});

test('ambiguous identity sources fail closed', () => {
  const output = resolveCustomerAccessContextFromRequest({
    customerAccessContext: validContext(),
    syntheticCustomerAccessContext: validContext({
      customerId: 'customer_other_001',
    }),
  });

  assertDenied(output);
});

test('raw bearer token header and cookie alone are not trusted as identity', () => {
  const output = resolveCustomerAccessContextFromRequest({
    headers: {
      authorization: 'Bearer token_should_not_be_trusted',
      cookie: 'session=secret_should_not_leak',
    },
    auth: {
      organizationId: 'org_request_context_001',
      customerIdentityVerified: true,
    },
  });

  assertDenied(output);
});

test('LINE user id alone is not trusted as global customer identity', () => {
  const output = resolveCustomerAccessContextFromRequest({
    syntheticCustomerAccessContext: {
      organizationId: 'org_request_context_001',
      caseId: 'case_request_context_001',
      lineUserId: 'line_user_should_not_leak',
      access: {
        organizationScopeMatched: true,
        caseLinkedToCustomer: true,
        publicationAllowed: true,
        customerVisiblePolicyPassed: true,
      },
    },
  });

  assertDenied(output);
});

test('valid customerAccessContext returns normalized minimal context', () => {
  const output = resolveCustomerAccessContextFromRequest(requestWithContext());

  assert.deepEqual(output, {
    resolved: true,
    messageKey: 'customerAccess.context.resolved',
    customerVisible: false,
    customerAccessContext: {
      organizationId: 'org_request_context_001',
      customerId: 'customer_request_context_001',
      caseId: 'case_request_context_001',
      reportId: 'report_public_context_001',
      params: {
        caseId: 'case_request_context_001',
        reportId: 'report_public_context_001',
      },
      auth: {
        organizationId: 'org_request_context_001',
        customerId: 'customer_request_context_001',
        customerIdentityVerified: true,
      },
      access: {
        organizationScopeMatched: true,
        caseLinkedToCustomer: true,
        publicationAllowed: true,
        customerVisiblePolicyPassed: true,
      },
    },
  });
  assertNoSensitiveLeak(output);
});

test('valid syntheticCustomerAccessContext returns normalized minimal context without raw channel identity', () => {
  const output = resolveCustomerAccessContextFromRequest({
    syntheticCustomerAccessContext: {
      organizationId: 'org_request_context_001',
      customerId: 'customer_request_context_001',
      caseId: 'case_request_context_001',
      reportId: 'report_public_context_001',
      customerIdentityVerified: true,
      caseLinkedToCustomer: true,
      publicationAllowed: true,
      customerVisiblePolicyPassed: true,
      organizationScopeMatched: true,
      lineChannelId: 'line_channel_context_001',
      lineUserId: 'line_user_should_not_leak',
    },
  });

  assert.equal(output.resolved, true);
  assert.equal(output.customerAccessContext.auth.customerIdentityVerified, true);
  assert.equal(output.customerAccessContext.lineUserId, undefined);
  assert.equal(output.customerAccessContext.channel, undefined);
  assertNoSensitiveLeak(output);
});

test('nested forbidden sensitive fields are excluded from resolver output', () => {
  const context = validContext({
    providerRawPayload: { value: 'provider_should_not_leak' },
    aiRawPayload: { value: 'ai_should_not_leak' },
    billingInternalData: { value: 'billing_should_not_leak' },
    internalNote: 'internal note should not leak',
    token: 'token_should_not_leak',
    customer: {
      id: 'customer_request_context_001',
      rawPhone: '0912345678',
      rawAddress: 'No. 1 Secret Road',
    },
  });
  const before = JSON.parse(JSON.stringify(context));
  const output = resolveCustomerAccessContextFromRequest(requestWithContext(context));

  assert.equal(output.resolved, true);
  assertNoSensitiveLeak(output);
  assert.deepEqual(context, before);
});
