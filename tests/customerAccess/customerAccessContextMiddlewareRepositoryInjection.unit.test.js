'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildCustomerAccessContextMiddleware,
} = require('../../src/customerAccess/customerAccessContextMiddleware');

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

function invokeMiddleware(req, options) {
  const middleware = buildCustomerAccessContextMiddleware(options);
  let nextCallCount = 0;

  middleware(req, {}, () => {
    nextCallCount += 1;
  });

  return nextCallCount;
}

function failClosedAccess() {
  return {
    organizationScopeMatched: false,
    caseLinkedToCustomer: false,
    publicationAllowed: false,
    customerVisiblePolicyPassed: false,
  };
}

function assertFailClosedReq(req) {
  assert.equal(req.auth.customerIdentityVerified, false);
  assert.deepEqual(req.access, failClosedAccess());
  assert.deepEqual(req.customerVisibleData, {});
}

function assertNoLeak(req) {
  const serialized = JSON.stringify({
    params: req.params,
    auth: req.auth,
    channel: req.channel,
    access: req.access,
    customerVisibleData: req.customerVisibleData,
  });

  for (const value of [
    '0912-345-678',
    '台北市信義區測試路1號',
    'line_user_should_not_leak',
    'should-not-leak',
    'token_should_not_leak',
    'secret_should_not_leak',
  ]) {
    assert.equal(serialized.includes(value), false, `request leaked ${value}`);
  }
}

test('no repository preserves existing caller-provided behavior', () => {
  const req = {
    customerAccessContextInput: callerProvidedInput(),
  };

  invokeMiddleware(req);

  assert.deepEqual(req.params, { caseId: 'case_test_001' });
  assert.deepEqual(req.auth, {
    organizationId: 'org_test_001',
    customerId: 'customer_test_001',
    customerIdentityVerified: true,
  });
  assert.deepEqual(req.access, {
    organizationScopeMatched: true,
    caseLinkedToCustomer: true,
    publicationAllowed: true,
    customerVisiblePolicyPassed: true,
  });
  assert.deepEqual(req.customerVisibleData.serviceReport, {
    publicReportId: 'report_public_test_001',
    status: 'available',
    finalAppointmentId: 'appt_final_test_001',
  });
});

test('repository all allow results populate controller-compatible req fields', () => {
  const req = {
    customerAccessContextInput: {
      organizationId: 'org_input_001',
      caseId: 'case_input_001',
      lineChannelId: 'line_channel_input_001',
      lineUserId: 'line_user_input_001',
    },
  };
  const nextCallCount = invokeMiddleware(req, {
    repository: allowRepository(),
  });

  assert.equal(nextCallCount, 1);
  assert.deepEqual(req.params, { caseId: 'case_repo_001' });
  assert.deepEqual(req.auth, {
    organizationId: 'org_repo_001',
    customerId: 'customer_repo_001',
    customerIdentityVerified: true,
  });
  assert.deepEqual(req.channel, {
    lineChannelId: 'line_channel_input_001',
    lineUserId: 'line_user_input_001',
  });
  assert.deepEqual(req.access, {
    organizationScopeMatched: true,
    caseLinkedToCustomer: true,
    publicationAllowed: true,
    customerVisiblePolicyPassed: true,
  });
  assert.deepEqual(req.customerVisibleData.serviceReport, {
    publicReportId: 'report_public_repo_001',
    status: 'available',
    finalAppointmentId: 'appt_final_repo_001',
  });
});

test('repository organization unmatched creates fail-closed req context', () => {
  const req = { customerAccessContextInput: callerProvidedInput() };

  invokeMiddleware(req, {
    repository: allowRepository({
      organizationScope: {
        matched: false,
        organizationId: 'org_repo_001',
      },
    }),
  });

  assertFailClosedReq(req);
});

test('repository identity unverified creates fail-closed req context', () => {
  const req = { customerAccessContextInput: callerProvidedInput() };

  invokeMiddleware(req, {
    repository: allowRepository({
      customerIdentity: {
        verified: false,
        customerId: 'customer_repo_001',
      },
    }),
  });

  assertFailClosedReq(req);
});

test('repository case linkage not linked creates fail-closed req context', () => {
  const req = { customerAccessContextInput: callerProvidedInput() };

  invokeMiddleware(req, {
    repository: allowRepository({
      caseLinkage: {
        linked: false,
        caseId: 'case_repo_001',
      },
    }),
  });

  assertFailClosedReq(req);
});

test('repository publication not allowed creates fail-closed req context', () => {
  const req = { customerAccessContextInput: callerProvidedInput() };

  invokeMiddleware(req, {
    repository: allowRepository({
      publication: {
        allowed: false,
      },
    }),
  });

  assertFailClosedReq(req);
});

test('repository projection unavailable creates no customer-visible data', () => {
  const req = { customerAccessContextInput: callerProvidedInput() };

  invokeMiddleware(req, {
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

  assert.equal(req.access.publicationAllowed, true);
  assert.equal(req.access.customerVisiblePolicyPassed, false);
  assert.deepEqual(req.customerVisibleData, {});
});

test('repository method missing creates fail-closed req context', () => {
  const req = { customerAccessContextInput: callerProvidedInput() };
  const repository = allowRepository();
  delete repository.getPublicationState;

  invokeMiddleware(req, { repository });

  assertFailClosedReq(req);
});

test('repository method throws creates fail-closed req context and still calls next once', () => {
  const req = { customerAccessContextInput: callerProvidedInput() };
  const repository = allowRepository();
  repository.getCaseLinkage = () => {
    throw new Error('should-not-leak');
  };

  const nextCallCount = invokeMiddleware(req, { repository });

  assert.equal(nextCallCount, 1);
  assertFailClosedReq(req);
  assertNoLeak(req);
});

test('repository raw identifiers and internal fields do not leak into req output', () => {
  const req = {
    customerAccessContextInput: {
      organizationId: 'org_input_001',
      caseId: 'case_input_001',
      rawPhone: '0912-345-678',
      rawAddress: '台北市信義區測試路1號',
      rawLineUserId: 'line_user_should_not_leak',
    },
  };

  invokeMiddleware(req, {
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
  });

  assert.deepEqual(req.customerVisibleData.serviceReport, {
    publicReportId: 'report_public_repo_001',
    status: 'available',
    finalAppointmentId: 'appt_final_repo_001',
  });
  assertNoLeak(req);
});

test('finalAppointmentId is not modified and unrelated req fields are preserved', () => {
  const req = {
    requestId: 'request_test_001',
    untouched: { value: 'keep-me' },
    customerAccessContextInput: callerProvidedInput(),
  };
  const repository = allowRepository();
  const repositoryKeys = Object.keys(repository);

  invokeMiddleware(req, { repository });

  assert.equal(req.requestId, 'request_test_001');
  assert.deepEqual(req.untouched, { value: 'keep-me' });
  assert.equal(req.customerVisibleData.serviceReport.finalAppointmentId, 'appt_final_repo_001');
  assert.deepEqual(Object.keys(repository), repositoryKeys);
});
