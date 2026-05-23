'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  applyCustomerAccessContextToRequest,
  buildCustomerAccessContextMiddleware,
} = require('../../src/customerAccess/customerAccessContextMiddleware');

function validContextInput() {
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

function invokeMiddleware(req) {
  const middleware = buildCustomerAccessContextMiddleware();
  let nextCallCount = 0;

  middleware(req, {}, () => {
    nextCallCount += 1;
  });

  return nextCallCount;
}

test('middleware builder returns function', () => {
  const middleware = buildCustomerAccessContextMiddleware();

  assert.equal(typeof middleware, 'function');
});

test('valid req.customerAccessContextInput populates controller-compatible req fields', () => {
  const req = {
    customerAccessContextInput: validContextInput(),
  };
  const nextCallCount = invokeMiddleware(req);

  assert.equal(nextCallCount, 1);
  assert.deepEqual(req.params, {
    caseId: 'case_test_001',
  });
  assert.deepEqual(req.auth, {
    organizationId: 'org_test_001',
    customerId: 'customer_test_001',
    customerIdentityVerified: true,
  });
  assert.deepEqual(req.channel, {
    lineChannelId: 'line_channel_test_001',
    lineUserId: 'line_user_test_001',
  });
  assert.deepEqual(req.access, {
    organizationScopeMatched: true,
    caseLinkedToCustomer: true,
    publicationAllowed: true,
    customerVisiblePolicyPassed: true,
  });
  assert.deepEqual(req.customerVisibleData, {
    serviceReport: {
      publicReportId: 'report_public_test_001',
      status: 'available',
      finalAppointmentId: 'appt_final_test_001',
    },
  });
});

test('missing context input populates fail-closed req fields', () => {
  const req = {};

  invokeMiddleware(req);

  assert.deepEqual(req.params, {});
  assert.deepEqual(req.auth, {
    customerIdentityVerified: false,
  });
  assert.deepEqual(req.channel, {});
  assert.deepEqual(req.access, {
    organizationScopeMatched: false,
    caseLinkedToCustomer: false,
    publicationAllowed: false,
    customerVisiblePolicyPassed: false,
  });
  assert.deepEqual(req.customerVisibleData, {});
});

test('middleware calls next exactly once when next is function', () => {
  const req = {
    customerAccessContextInput: validContextInput(),
  };

  assert.equal(invokeMiddleware(req), 1);
});

test('invalid or missing next does not throw', () => {
  const middleware = buildCustomerAccessContextMiddleware();
  const req = {
    customerAccessContextInput: validContextInput(),
  };

  assert.doesNotThrow(() => middleware(req, {}, null));
  assert.doesNotThrow(() => middleware(req, {}));
});

test('raw phone only does not become verified identity', () => {
  const req = {
    customerAccessContextInput: {
      organizationId: 'org_test_001',
      caseId: 'case_test_001',
      rawPhone: '0912-345-678',
    },
  };

  invokeMiddleware(req);

  assert.equal(req.auth.customerIdentityVerified, false);
  assert.equal(req.auth.customerId, undefined);
  assert.equal(req.access.caseLinkedToCustomer, false);
});

test('raw address only does not become verified identity', () => {
  const req = {
    customerAccessContextInput: {
      organizationId: 'org_test_001',
      caseId: 'case_test_001',
      rawAddress: '台北市信義區測試路1號',
    },
  };

  invokeMiddleware(req);

  assert.equal(req.auth.customerIdentityVerified, false);
  assert.equal(req.auth.customerId, undefined);
  assert.equal(req.access.caseLinkedToCustomer, false);
});

test('line user id alone does not become verified identity', () => {
  const req = {
    customerAccessContextInput: {
      organizationId: 'org_test_001',
      caseId: 'case_test_001',
      lineUserId: 'line_user_test_001',
    },
  };

  invokeMiddleware(req);

  assert.equal(req.auth.customerIdentityVerified, false);
  assert.deepEqual(req.channel, {});
});

test('organization, line channel, and line user id alone do not become verified identity', () => {
  const req = {
    customerAccessContextInput: {
      organizationId: 'org_test_001',
      caseId: 'case_test_001',
      lineChannelId: 'line_channel_test_001',
      lineUserId: 'line_user_test_001',
    },
  };

  invokeMiddleware(req);

  assert.equal(req.auth.customerIdentityVerified, false);
  assert.deepEqual(req.channel, {
    lineChannelId: 'line_channel_test_001',
    lineUserId: 'line_user_test_001',
  });
  assert.equal(req.access.caseLinkedToCustomer, false);
});

test('forbidden fields are stripped and not written to req.customerVisibleData', () => {
  const input = validContextInput();
  input.customerVisibleData.serviceReport.internalNote = 'should-not-leak';
  input.customerVisibleData.serviceReport.auditLog = { event: 'should-not-leak' };
  input.customerVisibleData.serviceReport.aiRawPayload = { prompt: 'should-not-leak' };
  input.customerVisibleData.serviceReport.internalBillingData = { amount: 9999 };
  input.customerVisibleData.serviceReport.rawPhone = '0912-345-678';
  input.customerVisibleData.serviceReport.rawAddress = '台北市信義區測試路1號';
  input.customerVisibleData.serviceReport.rawLineUserId = 'line_user_test_001';
  input.customerVisibleData.serviceReport.token = 'token_should_not_leak';
  input.customerVisibleData.serviceReport.secret = 'secret_should_not_leak';
  const req = {
    customerAccessContextInput: input,
  };

  invokeMiddleware(req);
  const serialized = JSON.stringify(req.customerVisibleData);

  assert.deepEqual(req.customerVisibleData, {
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

test('finalAppointmentId is not modified', () => {
  const req = {
    customerAccessContextInput: validContextInput(),
  };

  invokeMiddleware(req);

  assert.equal(req.customerAccessContextInput.customerVisibleData.serviceReport.finalAppointmentId, 'appt_final_test_001');
  assert.equal(req.customerVisibleData.serviceReport.finalAppointmentId, 'appt_final_test_001');
});

test('middleware does not mutate unrelated req fields', () => {
  const req = {
    requestId: 'request_test_001',
    untouched: {
      value: 'keep-me',
    },
    customerAccessContextInput: validContextInput(),
  };

  invokeMiddleware(req);

  assert.equal(req.requestId, 'request_test_001');
  assert.deepEqual(req.untouched, {
    value: 'keep-me',
  });
});

test('applyCustomerAccessContextToRequest performs bounded request mutation', () => {
  const req = {
    existing: 'keep-me',
  };
  const returned = applyCustomerAccessContextToRequest(req, {
    params: { caseId: 'case_test_001' },
    auth: { customerIdentityVerified: false },
    channel: {},
    access: { publicationAllowed: false },
    customerVisibleData: {},
  });

  assert.equal(returned, req);
  assert.equal(req.existing, 'keep-me');
  assert.deepEqual(req.params, { caseId: 'case_test_001' });
  assert.deepEqual(req.auth, { customerIdentityVerified: false });
});
