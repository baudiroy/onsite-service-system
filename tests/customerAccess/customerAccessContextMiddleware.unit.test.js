'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  applyCustomerAccessContextToRequest,
  buildCustomerAccessContextMiddleware,
} = require('../../src/customerAccess/customerAccessContextMiddleware');

const forbiddenValues = [
  'raw_request_should_not_leak',
  'headers_should_not_leak',
  'raw_headers_should_not_leak',
  'body_should_not_leak',
  'raw_body_should_not_leak',
  'query_should_not_leak',
  'cookies_should_not_leak',
  'socket_should_not_leak',
  'connection_should_not_leak',
  'ip_should_not_leak',
  'user_should_not_leak',
  'session_should_not_leak',
  'authorization_should_not_leak',
  'provider_payload_should_not_leak',
  'env_should_not_leak',
  '0912-345-678',
  '台北市信義區測試路1號',
  'line_user_test_001',
  'token_should_not_leak',
  'secret_should_not_leak',
  'policy_result_should_not_leak',
  'policy_rule_should_not_leak',
  'deny_reason_should_not_leak',
  'entitlement_should_not_leak',
  'org_graph_should_not_leak',
  'subcontractor_should_not_leak',
  'debug_should_not_leak',
  'unknown_customer_visible_should_not_leak',
  'unknown_nested_should_not_leak',
  'select customer_visible_should_not_leak',
  'Bearer customer_visible_should_not_leak',
  'at customerVisibleFrame (internal.js:1)',
  'alias_service_report_should_not_leak',
  'raw_request_service_report_should_not_leak',
  'override_service_report_should_not_leak',
];

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

function assertNoForbiddenValues(value) {
  const serialized = JSON.stringify(value);

  for (const forbiddenValue of forbiddenValues) {
    assert.equal(
      serialized.includes(forbiddenValue),
      false,
      `middleware output leaked forbidden value: ${forbiddenValue}`,
    );
  }
}

function aliasServiceReport(value = 'alias_service_report_should_not_leak') {
  return {
    serviceReport: {
      caseNo: value,
      finalAppointmentId: value,
      publicReportId: value,
      status: value,
      summary: value,
    },
  };
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
  assert.deepEqual(req.customerAccessRouteParams, {});
  assert.deepEqual(req.params, {
    caseId: 'case_test_001',
  });
  assert.deepEqual(req.auth, {
    organizationId: 'org_test_001',
    customerId: 'customer_test_001',
    customerIdentityVerified: true,
  });
  assert.deepEqual(req.channel, {});
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
  assert.deepEqual(Object.keys(req.customerAccessContext), [
    'params',
    'auth',
    'channel',
    'access',
    'customerVisibleData',
  ]);
  assert.deepEqual(req.customerAccessContext, {
    params: { caseId: 'case_test_001' },
    auth: {
      organizationId: 'org_test_001',
      customerId: 'customer_test_001',
      customerIdentityVerified: true,
    },
    channel: {},
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
  assertNoForbiddenValues(req.customerAccessContext);
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
  assert.deepEqual(req.channel, {});
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
    params: { caseId: 'case_route_original' },
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
  assert.deepEqual(req.customerAccessRouteParams, { caseId: 'case_route_original' });
  assert.deepEqual(req.params, { caseId: 'case_route_original' });
  assert.deepEqual(req.auth, { customerIdentityVerified: false });
});

test('middleware output omits raw request auth session user and provider containers', () => {
  const req = {
    params: {
      caseId: 'case_route_original',
      raw: 'raw_request_should_not_leak',
    },
    auth: {
      authorization: 'authorization_should_not_leak',
      token: 'token_should_not_leak',
    },
    headers: { authorization: 'authorization_should_not_leak' },
    rawHeaders: ['authorization', 'raw_headers_should_not_leak'],
    body: { raw: 'body_should_not_leak' },
    rawBody: 'raw_body_should_not_leak',
    query: { raw: 'query_should_not_leak' },
    cookies: { session: 'cookies_should_not_leak' },
    socket: { remoteAddress: 'socket_should_not_leak' },
    connection: { id: 'connection_should_not_leak' },
    ip: 'ip_should_not_leak',
    user: { id: 'user_should_not_leak' },
    session: { id: 'session_should_not_leak' },
    providerPayload: { raw: 'provider_payload_should_not_leak' },
    env: { ZEABUR: 'env_should_not_leak' },
    customerAccessContextInput: validContextInput(),
  };

  invokeMiddleware(req);

  assert.deepEqual(req.params, { caseId: 'case_route_original' });
  assert.deepEqual(req.customerAccessRouteParams, { caseId: 'case_route_original' });
  assert.deepEqual(req.auth, {
    organizationId: 'org_test_001',
    customerId: 'customer_test_001',
    customerIdentityVerified: true,
  });
  assert.deepEqual(req.channel, {});
  assert.deepEqual(Object.keys(req.customerAccessContext), [
    'params',
    'auth',
    'channel',
    'access',
    'customerVisibleData',
  ]);
  assertNoForbiddenValues(req.customerAccessContext);
  assertNoForbiddenValues({
    params: req.params,
    auth: req.auth,
    channel: req.channel,
    access: req.access,
    customerVisibleData: req.customerVisibleData,
  });
});

test('middleware output strips sensitive identity policy and debug details from context', () => {
  const input = validContextInput();
  input.phone = '0912-345-678';
  input.rawPhone = '0912-345-678';
  input.customer_phone_raw = '0912-345-678';
  input.address = '台北市信義區測試路1號';
  input.rawAddress = '台北市信義區測試路1號';
  input.customer_address_raw = '台北市信義區測試路1號';
  input.authorization = 'authorization_should_not_leak';
  input.token = 'token_should_not_leak';
  input.sessionSecret = 'secret_should_not_leak';
  input.policyEngineResult = { reason: 'policy_result_should_not_leak' };
  input.policyRuleList = ['policy_rule_should_not_leak'];
  input.internalDenyReason = 'deny_reason_should_not_leak';
  input.entitlementDetails = 'entitlement_should_not_leak';
  input.organizationGraph = 'org_graph_should_not_leak';
  input.subcontractorDetails = 'subcontractor_should_not_leak';
  input.debug = 'debug_should_not_leak';
  input.customerVisibleData.serviceReport.rawRequest = 'raw_request_should_not_leak';
  input.customerVisibleData.serviceReport.policyEngineResult = 'policy_result_should_not_leak';
  input.customerVisibleData.serviceReport.policyRuleList = 'policy_rule_should_not_leak';
  input.customerVisibleData.serviceReport.debug = 'debug_should_not_leak';
  input.customerVisibleData.serviceReport.authorization = 'authorization_should_not_leak';
  input.customerVisibleData.serviceReport.sessionSecret = 'secret_should_not_leak';
  const req = {
    customerAccessContextInput: input,
  };

  invokeMiddleware(req);

  assert.deepEqual(req.customerAccessContext.auth, {
    organizationId: 'org_test_001',
    customerId: 'customer_test_001',
    customerIdentityVerified: true,
  });
  assert.deepEqual(req.customerAccessContext.channel, {});
  assert.deepEqual(req.customerAccessContext.access, {
    organizationScopeMatched: true,
    caseLinkedToCustomer: true,
    publicationAllowed: true,
    customerVisiblePolicyPassed: true,
  });
  assert.deepEqual(req.customerAccessContext.customerVisibleData, {
    serviceReport: {
      publicReportId: 'report_public_test_001',
      status: 'available',
      finalAppointmentId: 'appt_final_test_001',
    },
  });
  assertNoForbiddenValues(req.customerAccessContext);
});

test('middleware customerVisibleData emits only explicit deep allowlist keys', () => {
  const input = validContextInput();
  input.customerVisibleData = {
    unknownTopLevel: 'unknown_customer_visible_should_not_leak',
    serviceReport: {
      caseNo: 'CASE-001',
      finalAppointmentId: 'appt_final_test_001',
      publicReportId: 'report_public_test_001',
      status: 'available',
      summary: 'Service completed.',
      displayName: 'unknown_nested_should_not_leak',
      arbitraryCustomerData: 'unknown_nested_should_not_leak',
    },
  };
  const req = {
    customerAccessContextInput: input,
  };

  invokeMiddleware(req);

  assert.deepEqual(req.customerAccessContext.customerVisibleData, {
    serviceReport: {
      caseNo: 'CASE-001',
      finalAppointmentId: 'appt_final_test_001',
      publicReportId: 'report_public_test_001',
      status: 'available',
      summary: 'Service completed.',
    },
  });
  assert.deepEqual(Object.keys(req.customerAccessContext.customerVisibleData), ['serviceReport']);
  assert.deepEqual(Object.keys(req.customerAccessContext.customerVisibleData.serviceReport), [
    'caseNo',
    'finalAppointmentId',
    'publicReportId',
    'status',
    'summary',
  ]);
  assertNoForbiddenValues(req.customerAccessContext);
});

test('middleware customerVisibleData malformed sources and values are omitted safely', () => {
  class UnsafeCustomerVisibleData {
    constructor() {
      this.serviceReport = { summary: 'unknown_nested_should_not_leak' };
    }
  }

  const malformedSources = [
    null,
    undefined,
    [],
    'unknown_customer_visible_should_not_leak',
    123,
    true,
    new Date('2026-05-30T00:00:00.000Z'),
    new Error('unknown_customer_visible_should_not_leak'),
    Buffer.from('unknown_customer_visible_should_not_leak'),
    { then() {} },
    () => 'unknown_customer_visible_should_not_leak',
    new UnsafeCustomerVisibleData(),
  ];

  const throwingSource = {};
  Object.defineProperty(throwingSource, 'customerVisibleData', {
    get() {
      throw new Error('raw_request_should_not_leak');
    },
  });
  malformedSources.push(throwingSource);

  for (const candidate of malformedSources) {
    const input = validContextInput();
    input.customerVisibleData = candidate;
    const req = {
      customerAccessContextInput: input,
    };

    invokeMiddleware(req);

    assert.deepEqual(req.customerAccessContext.customerVisibleData, {});
    assertNoForbiddenValues(req.customerAccessContext);
  }

  const unsafeFieldValues = [
    {},
    [],
    new Error('unknown_nested_should_not_leak'),
    new Date('2026-05-30T00:00:00.000Z'),
    Buffer.from('unknown_nested_should_not_leak'),
    { then() {} },
    () => 'unknown_nested_should_not_leak',
    new UnsafeCustomerVisibleData(),
    'select customer_visible_should_not_leak',
    'Bearer customer_visible_should_not_leak',
    'authorization header should not leak',
    'at customerVisibleFrame (internal.js:1)',
  ];

  for (const candidate of unsafeFieldValues) {
    const input = validContextInput();
    input.customerVisibleData = {
      serviceReport: {
        caseNo: candidate,
        finalAppointmentId: candidate,
        publicReportId: candidate,
        status: candidate,
        summary: candidate,
      },
    };
    const req = {
      customerAccessContextInput: input,
    };

    invokeMiddleware(req);

    assert.deepEqual(req.customerAccessContext.customerVisibleData, {});
    assertNoForbiddenValues(req.customerAccessContext);
  }
});

test('middleware customerVisibleData uses only the explicit approved source location', () => {
  const input = validContextInput();
  input.customerVisibleData = {
    serviceReport: {
      caseNo: 'CASE-APPROVED',
      finalAppointmentId: 'appt_approved_001',
      publicReportId: 'report_approved_001',
      status: 'available',
      summary: 'Approved source summary.',
    },
  };
  input.customerData = aliasServiceReport();
  input.visibleData = aliasServiceReport();
  input.publicData = aliasServiceReport();
  input.publicCustomerData = aliasServiceReport();
  input.customer_visible_data = aliasServiceReport();
  input.customer_visible = aliasServiceReport();
  input.report = aliasServiceReport();
  input.serviceReport = aliasServiceReport();
  input.data = aliasServiceReport();
  input.payload = { customerVisibleData: aliasServiceReport() };
  input.context = { customerVisibleData: aliasServiceReport() };
  input.auth = { customerVisibleData: aliasServiceReport() };
  input.access = { customerVisibleData: aliasServiceReport() };
  input.channel = { customerVisibleData: aliasServiceReport() };
  const req = {
    body: { customerVisibleData: aliasServiceReport('raw_request_service_report_should_not_leak') },
    query: { customerVisibleData: aliasServiceReport('raw_request_service_report_should_not_leak') },
    headers: { customerVisibleData: aliasServiceReport('raw_request_service_report_should_not_leak') },
    cookies: { customerVisibleData: aliasServiceReport('raw_request_service_report_should_not_leak') },
    params: { caseId: 'case_test_001', customerVisibleData: aliasServiceReport('raw_request_service_report_should_not_leak') },
    user: { customerVisibleData: aliasServiceReport('raw_request_service_report_should_not_leak') },
    session: { customerVisibleData: aliasServiceReport('raw_request_service_report_should_not_leak') },
    locals: { customerVisibleData: aliasServiceReport('raw_request_service_report_should_not_leak') },
    context: { customerVisibleData: aliasServiceReport('raw_request_service_report_should_not_leak') },
    arbitraryTopLevel: aliasServiceReport('raw_request_service_report_should_not_leak'),
    customerAccessContextInput: input,
  };

  invokeMiddleware(req);

  assert.deepEqual(req.customerAccessContext.customerVisibleData, {
    serviceReport: {
      caseNo: 'CASE-APPROVED',
      finalAppointmentId: 'appt_approved_001',
      publicReportId: 'report_approved_001',
      status: 'available',
      summary: 'Approved source summary.',
    },
  });
  assertNoForbiddenValues(req.customerAccessContext);
});

test('middleware customerVisibleData aliases and raw request sources do not create output', () => {
  const input = validContextInput();
  delete input.customerVisibleData;
  input.customerData = aliasServiceReport();
  input.visibleData = aliasServiceReport();
  input.publicData = aliasServiceReport();
  input.publicCustomerData = aliasServiceReport();
  input.customer_visible_data = aliasServiceReport();
  input.customer_visible = aliasServiceReport();
  input.report = aliasServiceReport();
  input.serviceReport = aliasServiceReport();
  input.data = aliasServiceReport();
  input.payload = { customerVisibleData: aliasServiceReport() };
  input.context = { customerVisibleData: aliasServiceReport() };
  input.auth = { customerVisibleData: aliasServiceReport() };
  input.access = { customerVisibleData: aliasServiceReport() };
  input.channel = { customerVisibleData: aliasServiceReport() };
  const req = {
    body: { customerVisibleData: aliasServiceReport('raw_request_service_report_should_not_leak') },
    query: { customerVisibleData: aliasServiceReport('raw_request_service_report_should_not_leak') },
    headers: { customerVisibleData: aliasServiceReport('raw_request_service_report_should_not_leak') },
    cookies: { customerVisibleData: aliasServiceReport('raw_request_service_report_should_not_leak') },
    params: { caseId: 'case_test_001', customerVisibleData: aliasServiceReport('raw_request_service_report_should_not_leak') },
    user: { customerVisibleData: aliasServiceReport('raw_request_service_report_should_not_leak') },
    session: { customerVisibleData: aliasServiceReport('raw_request_service_report_should_not_leak') },
    locals: { customerVisibleData: aliasServiceReport('raw_request_service_report_should_not_leak') },
    context: { customerVisibleData: aliasServiceReport('raw_request_service_report_should_not_leak') },
    arbitraryTopLevel: aliasServiceReport('raw_request_service_report_should_not_leak'),
    customerAccessContextInput: input,
  };

  invokeMiddleware(req);

  assert.deepEqual(req.customerAccessContext.customerVisibleData, {});
  assertNoForbiddenValues(req.customerAccessContext);
});

test('middleware fail-closes when getInput throws without leaking raw error', () => {
  const rawError = new Error('raw_request_should_not_leak');
  const middleware = buildCustomerAccessContextMiddleware({
    getInput() {
      throw rawError;
    },
  });
  const req = {
    params: { caseId: 'case_test_001' },
  };
  let nextCallCount = 0;

  assert.doesNotThrow(() => middleware(req, {}, () => {
    nextCallCount += 1;
  }));
  assert.equal(nextCallCount, 1);
  assert.deepEqual(req.customerAccessContext, {
    params: {},
    auth: {
      customerIdentityVerified: false,
    },
    channel: {},
    access: {
      organizationScopeMatched: false,
      caseLinkedToCustomer: false,
      publicationAllowed: false,
      customerVisiblePolicyPassed: false,
    },
    customerVisibleData: {},
  });
  assertNoForbiddenValues(req.customerAccessContext);
});
