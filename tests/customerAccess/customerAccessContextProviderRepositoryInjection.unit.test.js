'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildCustomerAccessContext,
} = require('../../src/customerAccess/customerAccessContextProvider');

function callerProvidedInput() {
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

function allowRepository(overrides) {
  const config = overrides || {};

  return {
    getOrganizationScope() {
      return config.organizationScope || {
        matched: true,
        organizationId: 'org_repo_001',
      };
    },
    getVerifiedCustomerIdentity() {
      return config.customerIdentity || {
        verified: true,
        customerId: 'customer_repo_001',
      };
    },
    getCaseLinkage() {
      return config.caseLinkage || {
        linked: true,
        caseId: 'case_repo_001',
      };
    },
    getPublicationState() {
      return config.publication || {
        allowed: true,
      };
    },
    getCustomerVisibleProjection() {
      return config.projection || {
        available: true,
        data: {
          serviceReport: {
            publicReportId: 'report_public_repo_001',
            status: 'available',
            finalAppointmentId: 'appt_final_repo_001',
          },
        },
      };
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

function assertFailClosed(context) {
  assert.equal(context.auth.customerIdentityVerified, false);
  assert.deepEqual(context.access, failClosedAccess());
  assert.deepEqual(context.customerVisibleData, {});
}

function assertNoLeak(context) {
  const serialized = JSON.stringify(context);

  for (const value of [
    '0912-345-678',
    '台北市信義區測試路1號',
    'line_user_should_not_leak',
    'should-not-leak',
    'token_should_not_leak',
    'secret_should_not_leak',
  ]) {
    assert.equal(serialized.includes(value), false, `context leaked ${value}`);
  }
}

test('no repository preserves existing caller-provided behavior', () => {
  const context = buildCustomerAccessContext(callerProvidedInput());

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

test('repository all allow results map to controller-compatible allow context', () => {
  const context = buildCustomerAccessContext(
    {
      organizationId: 'org_input_001',
      caseId: 'case_input_001',
      lineChannelId: 'line_channel_input_001',
      lineUserId: 'line_user_input_001',
    },
    {
      repository: allowRepository(),
    },
  );

  assert.deepEqual(context, {
    params: {
      caseId: 'case_repo_001',
    },
    auth: {
      organizationId: 'org_repo_001',
      customerId: 'customer_repo_001',
      customerIdentityVerified: true,
    },
    channel: {
      lineChannelId: 'line_channel_input_001',
      lineUserId: 'line_user_input_001',
    },
    access: {
      organizationScopeMatched: true,
      caseLinkedToCustomer: true,
      publicationAllowed: true,
      customerVisiblePolicyPassed: true,
    },
    customerVisibleData: {
      serviceReport: {
        publicReportId: 'report_public_repo_001',
        status: 'available',
        finalAppointmentId: 'appt_final_repo_001',
      },
    },
  });
});

test('repository organization scope missing or unmatched fails closed', () => {
  assertFailClosed(buildCustomerAccessContext(callerProvidedInput(), {
    repository: allowRepository({
      organizationScope: {
        matched: false,
        organizationId: 'org_repo_001',
      },
    }),
  }));
});

test('repository identity unverified fails closed', () => {
  assertFailClosed(buildCustomerAccessContext(callerProvidedInput(), {
    repository: allowRepository({
      customerIdentity: {
        verified: false,
        customerId: 'customer_repo_001',
      },
    }),
  }));
});

test('repository case linkage not linked fails closed', () => {
  assertFailClosed(buildCustomerAccessContext(callerProvidedInput(), {
    repository: allowRepository({
      caseLinkage: {
        linked: false,
        caseId: 'case_repo_001',
      },
    }),
  }));
});

test('repository publication not allowed fails closed', () => {
  assertFailClosed(buildCustomerAccessContext(callerProvidedInput(), {
    repository: allowRepository({
      publication: {
        allowed: false,
      },
    }),
  }));
});

test('repository projection unavailable returns no customer-visible data', () => {
  const context = buildCustomerAccessContext(callerProvidedInput(), {
    repository: allowRepository({
      projection: {
        available: false,
        data: {
          serviceReport: {
            publicReportId: 'report_public_repo_001',
          },
        },
      },
    }),
  });

  assert.equal(context.access.publicationAllowed, true);
  assert.equal(context.access.customerVisiblePolicyPassed, false);
  assert.deepEqual(context.customerVisibleData, {});
});

test('repository method missing fails closed', () => {
  const repository = allowRepository();
  delete repository.getPublicationState;

  assert.deepEqual(buildCustomerAccessContext(callerProvidedInput(), { repository }), {
    params: {},
    auth: {
      customerIdentityVerified: false,
    },
    channel: {},
    access: failClosedAccess(),
    customerVisibleData: {},
  });
});

test('repository method throws fail closed without raw error', () => {
  const repository = allowRepository();
  repository.getCaseLinkage = () => {
    throw new Error('should-not-leak');
  };

  const context = buildCustomerAccessContext(callerProvidedInput(), { repository });

  assert.deepEqual(context, {
    params: {},
    auth: {
      customerIdentityVerified: false,
    },
    channel: {},
    access: failClosedAccess(),
    customerVisibleData: {},
  });
  assertNoLeak(context);
});

test('repository raw identifiers and internal projection fields do not leak', () => {
  const context = buildCustomerAccessContext(
    {
      organizationId: 'org_input_001',
      caseId: 'case_input_001',
      rawPhone: '0912-345-678',
      rawAddress: '台北市信義區測試路1號',
      rawLineUserId: 'line_user_should_not_leak',
    },
    {
      repository: allowRepository({
        customerIdentity: {
          verified: true,
          customerId: 'customer_repo_001',
          rawPhone: '0912-345-678',
          rawAddress: '台北市信義區測試路1號',
          lineUserId: 'line_user_should_not_leak',
        },
        projection: {
          available: true,
          data: {
            serviceReport: {
              publicReportId: 'report_public_repo_001',
              status: 'available',
              finalAppointmentId: 'appt_final_repo_001',
              internalNote: 'should-not-leak',
              auditLog: 'should-not-leak',
              aiRawPayload: 'should-not-leak',
              internalBillingData: 'should-not-leak',
              rawPhone: '0912-345-678',
              rawAddress: '台北市信義區測試路1號',
              rawLineId: 'line_user_should_not_leak',
              token: 'token_should_not_leak',
              secret: 'secret_should_not_leak',
            },
          },
        },
      }),
    },
  );

  assert.equal(context.access.customerVisiblePolicyPassed, true);
  assert.deepEqual(context.customerVisibleData, {
    serviceReport: {
      publicReportId: 'report_public_repo_001',
      status: 'available',
      finalAppointmentId: 'appt_final_repo_001',
    },
  });
  assertNoLeak(context);
});

test('repository result cannot modify finalAppointmentId and inputs are not mutated', () => {
  const input = callerProvidedInput();
  const repository = allowRepository();
  const originalInput = JSON.parse(JSON.stringify(input));
  const originalRepositoryKeys = Object.keys(repository);

  const context = buildCustomerAccessContext(input, { repository });

  assert.deepEqual(input, originalInput);
  assert.deepEqual(Object.keys(repository), originalRepositoryKeys);
  assert.equal(context.customerVisibleData.serviceReport.finalAppointmentId, 'appt_final_repo_001');
});
