'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DEFAULT_INTERNAL_PROJECTION_PATH,
  registerCustomerServiceReportProjectionRoute,
} = require('../../src/customerAccess/customerServiceReportProjectionAppAdapter');

function authorizedContext(overrides = {}) {
  return {
    auth: {
      organizationId: 'org_adapter_001',
      customerId: 'customer_adapter_001',
      customerIdentityVerified: true,
    },
    params: {
      caseId: 'case_adapter_001',
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

function request(overrides = {}) {
  return {
    params: {
      caseId: 'case_adapter_001',
      reportId: 'report_public_adapter_001',
    },
    customerAccessContext: authorizedContext(),
    body: {
      rawPhone: '0912345678',
      rawAddress: 'No. 1 Secret Road',
      lineUserId: 'line_user_should_not_leak',
    },
    ...overrides,
  };
}

function reportRow(overrides = {}) {
  return {
    organization_id: 'org_adapter_001',
    customer_id: 'customer_adapter_001',
    case_id: 'case_adapter_001',
    public_report_id: 'report_public_adapter_001',
    publication_allowed: true,
    publication_state: 'published',
    customer_visible_policy_passed: true,
    customer_visible: true,
    case_display_id: 'CASE-ADAPTER-001',
    service_status_display: 'Completed',
    appointment_window: '2026-05-22 14:00-16:00',
    engineer_display_name: 'Engineer Adapter',
    approved_service_summary: 'Customer-safe adapter service summary',
    completion_time: '2026-05-22T08:00:00.000Z',
    publicAttachments: [
      {
        attachmentId: 'att_public_adapter_001',
        label: 'Public service photo',
        mimeType: 'image/jpeg',
        customerVisible: true,
        signedUrl: 'https://signed.example.invalid/secret',
      },
    ],
    rawPhone: '0912345678',
    rawAddress: 'No. 1 Secret Road',
    lineUserId: 'line_user_should_not_leak',
    finalAppointmentId: 'appt_final_should_not_leak',
    internalNote: 'internal note should not leak',
    providerRawPayload: { id: 'provider_should_not_leak' },
    aiRawPayload: { id: 'ai_should_not_leak' },
    billingInternalData: { amount: 999 },
    token: 'token_should_not_leak',
    ...overrides,
  };
}

function dbClientWithRows(rows, options = {}) {
  const calls = [];

  return {
    calls,
    query(querySpec) {
      calls.push(querySpec);

      if (options.throwOnQuery) {
        throw new Error('database sql token_should_not_leak');
      }

      return { rows };
    },
  };
}

function syntheticApp(options = {}) {
  const calls = {
    get: [],
    listen: [],
  };

  return {
    calls,
    get(path, handler) {
      calls.get.push({ path, handler });

      if (options.throwOnGet) {
        throw new Error('route token_should_not_leak');
      }

      return this;
    },
    listen() {
      calls.listen.push('listen');
      throw new Error('listen should not be called');
    },
  };
}

function assertNoSensitiveLeak(output) {
  const serialized = JSON.stringify(output);

  for (const forbidden of [
    '0912345678',
    'No. 1 Secret Road',
    'line_user_should_not_leak',
    'appt_final_should_not_leak',
    'internal note should not leak',
    'provider_should_not_leak',
    'ai_should_not_leak',
    'signed.example.invalid',
    '999',
    'token_should_not_leak',
    'database sql',
    'route token',
    'adapter projection service should not leak',
    'raw_adapter_result_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `adapter output leaked ${forbidden}`);
  }
}

function assertNoRawRequestInputLeak(input) {
  const serialized = JSON.stringify(input);

  assert.deepEqual(Object.keys(input).sort(), [
    'caseId',
    'customerAccessContext',
    'dbClient',
    'reportId',
  ].sort());
  assert.deepEqual(Object.keys(input.customerAccessContext).sort(), [
    'caseId',
    'caseLinkedToCustomer',
    'customerId',
    'customerIdentityVerified',
    'customerVisiblePolicyPassed',
    'organizationId',
    'organizationScopeMatched',
    'publicationAllowed',
  ].sort());

  for (const forbidden of [
    '"headers"',
    '"authorization"',
    '"cookies"',
    '"query"',
    '"params"',
    '"body"',
    '"socket"',
    '"connection"',
    '"auth"',
    '"access"',
    '"user"',
    '"session"',
    '"provider_payload"',
    '"sql"',
    '"token"',
    'adapter_authorization_should_not_pass',
    'adapter_cookie_should_not_pass',
    'adapter_provider_should_not_pass',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `adapter service input leaked ${forbidden}`);
  }
}

test('registers exactly one GET-like handler on injected synthetic app with explicit path', () => {
  const app = syntheticApp();
  const dbClient = dbClientWithRows([reportRow()]);
  const options = {
    app,
    dbClient,
    path: '/internal/customer-access/:caseId/service-report',
  };

  const result = registerCustomerServiceReportProjectionRoute(options);

  assert.equal(result.registered, true);
  assert.equal(result.method, 'GET');
  assert.equal(result.path, '/internal/customer-access/:caseId/service-report');
  assert.equal(typeof result.handler, 'function');
  assert.equal(app.calls.get.length, 1);
  assert.equal(app.calls.get[0].path, '/internal/customer-access/:caseId/service-report');
  assert.equal(app.calls.get[0].handler, result.handler);
  assert.equal(app.calls.listen.length, 0);
  assert.equal(dbClient.calls.length, 0);
  assert.equal(options.dbClient, dbClient);
});

test('uses internal default path when explicit path is missing or blank', () => {
  for (const candidate of [undefined, '', '   ']) {
    const app = syntheticApp();
    const result = registerCustomerServiceReportProjectionRoute({
      app,
      dbClient: dbClientWithRows([reportRow()]),
      path: candidate,
    });

    assert.equal(result.registered, true);
    assert.equal(result.path, DEFAULT_INTERNAL_PROJECTION_PATH);
    assert.equal(app.calls.get[0].path, DEFAULT_INTERNAL_PROJECTION_PATH);
    assert.equal(app.calls.listen.length, 0);
  }
});

test('registered handler preserves Task909 safe allow behavior through synthetic request', async () => {
  const app = syntheticApp();
  const dbClient = dbClientWithRows([reportRow()]);
  const result = registerCustomerServiceReportProjectionRoute({
    app,
    dbClient,
    path: '/internal/customer-access/:caseId/service-report',
  });

  const response = await app.calls.get[0].handler(request());

  assert.equal(result.registered, true);
  assert.deepEqual(response, {
    statusCode: 200,
    body: {
      status: 'allow',
      messageKey: 'customerAccess.serviceReport.available',
      customerVisible: true,
      data: {
        serviceReport: {
          customerReportReference: 'report_public_adapter_001',
          caseReference: 'CASE-ADAPTER-001',
          serviceStatus: 'Completed',
          appointmentWindow: '2026-05-22 14:00-16:00',
          engineerDisplayName: 'Engineer Adapter',
          serviceSummary: 'Customer-safe adapter service summary',
          completionTime: '2026-05-22T08:00:00.000Z',
          publicAttachments: [
            {
              attachmentId: 'att_public_adapter_001',
              label: 'Public service photo',
              mimeType: 'image/jpeg',
            },
          ],
        },
      },
    },
  });
  assert.equal(dbClient.calls.length, 1);
  assertNoSensitiveLeak(response);
});

test('registered handler passes only explicit sanitized DTO keys to projection service', async () => {
  const app = syntheticApp();
  const serviceInputs = [];
  const result = registerCustomerServiceReportProjectionRoute({
    app,
    dbClient: dbClientWithRows([reportRow()]),
    path: '/internal/customer-access/:caseId/service-report',
    projectionService: (input) => {
      serviceInputs.push(input);

      return {
        status: 'allow',
        messageKey: 'customerAccess.serviceReport.available',
        customerVisible: true,
        data: {
          serviceReport: {
            customerReportReference: 'report_public_adapter_001',
          },
        },
      };
    },
  });

  const response = await app.calls.get[0].handler(request({
    headers: {
      authorization: 'adapter_authorization_should_not_pass',
    },
    cookies: {
      session: 'adapter_cookie_should_not_pass',
    },
    query: {
      sql: 'select secret',
    },
    body: {
      provider_payload: 'adapter_provider_should_not_pass',
    },
    socket: {
      remoteAddress: '127.0.0.1',
    },
    user: {
      token: 'token_should_not_leak',
    },
  }));

  assert.equal(result.registered, true);
  assert.equal(response.statusCode, 200);
  assert.equal(serviceInputs.length, 1);
  assertNoRawRequestInputLeak(serviceInputs[0]);
  assert.deepEqual(serviceInputs[0].customerAccessContext, {
    organizationId: 'org_adapter_001',
    customerId: 'customer_adapter_001',
    caseId: 'case_adapter_001',
    organizationScopeMatched: true,
    customerIdentityVerified: true,
    caseLinkedToCustomer: true,
    publicationAllowed: true,
    customerVisiblePolicyPassed: true,
  });
  assert.equal(serviceInputs[0].caseId, 'case_adapter_001');
  assert.equal(serviceInputs[0].reportId, 'report_public_adapter_001');
  assertNoSensitiveLeak(response);
});

test('registered handler rejects identifier aliases when required route params are missing', async () => {
  const app = syntheticApp();
  const serviceInputs = [];
  const result = registerCustomerServiceReportProjectionRoute({
    app,
    dbClient: dbClientWithRows([reportRow()]),
    path: '/internal/customer-access/:caseId/service-report/:reportId',
    projectionService: (input) => {
      serviceInputs.push(input);

      return {
        status: 'allow',
        messageKey: 'customerAccess.serviceReport.available',
        customerVisible: true,
        data: {
          serviceReport: {
            customerReportReference: 'report_public_adapter_001',
          },
        },
      };
    },
  });

  const response = await app.calls.get[0].handler(request({
    params: {
      caseId: 'case_adapter_001',
    },
    query: {
      reportId: 'report_query_alias_should_not_win',
      public_report_id: 'report_query_public_alias_should_not_win',
    },
    body: {
      report_id: 'report_body_alias_should_not_win',
      public_report_id: 'report_body_public_alias_should_not_win',
    },
    headers: {
      'x-report-id': 'report_header_alias_should_not_win',
      authorization: 'adapter_authorization_should_not_pass',
    },
    cookies: {
      public_report_id: 'report_cookie_alias_should_not_win',
    },
  }));

  assert.equal(result.registered, true);
  assert.deepEqual(response, {
    statusCode: 404,
    body: {
      status: 'deny',
      messageKey: 'customerAccess.unavailable',
      customerVisible: false,
      data: null,
      error: {
        messageKey: 'customerAccess.unavailable',
      },
    },
  });
  assert.equal(serviceInputs.length, 0);
  assertNoSensitiveLeak(response);
});

test('registered handler sanitizes injected projection service throw at HTTP boundary', async () => {
  const app = syntheticApp();
  const result = registerCustomerServiceReportProjectionRoute({
    app,
    dbClient: dbClientWithRows([reportRow()]),
    path: '/internal/customer-access/:caseId/service-report',
    projectionService: () => {
      throw new Error('adapter projection service should not leak sql token_should_not_leak');
    },
  });

  const response = await app.calls.get[0].handler(request());

  assert.equal(result.registered, true);
  assert.deepEqual(response, {
    statusCode: 404,
    body: {
      status: 'deny',
      messageKey: 'customerAccess.unavailable',
      customerVisible: false,
      data: null,
      error: {
        messageKey: 'customerAccess.unavailable',
      },
    },
  });
  assertNoSensitiveLeak(response);
});

test('registered handler sanitizes malformed injected projection service result at HTTP boundary', async () => {
  const app = syntheticApp();
  const result = registerCustomerServiceReportProjectionRoute({
    app,
    dbClient: dbClientWithRows([reportRow()]),
    path: '/internal/customer-access/:caseId/service-report',
    projectionService: () => ({
      status: 'allow',
      messageKey: 'customerAccess.serviceReport.available',
      customerVisible: true,
      data: {
        serviceReport: {
          customerReportReference: 'report_public_adapter_001',
          serviceSummary: 'Customer-safe adapter service summary',
          dbRow: 'raw_adapter_result_should_not_leak',
        },
      },
      raw: 'raw_adapter_result_should_not_leak',
      headers: {
        authorization: 'token_should_not_leak',
      },
    }),
  });

  const response = await app.calls.get[0].handler(request());

  assert.equal(result.registered, true);
  assert.deepEqual(response, {
    statusCode: 404,
    body: {
      status: 'deny',
      messageKey: 'customerAccess.unavailable',
      customerVisible: false,
      data: null,
      error: {
        messageKey: 'customerAccess.unavailable',
      },
    },
  });
  assertNoSensitiveLeak(response);
});

test('missing synthetic app or router fails closed without leaking details', () => {
  const dbClient = dbClientWithRows([reportRow()]);

  for (const candidate of [
    undefined,
    null,
    {},
    { app: {} },
    { router: {} },
    { app: { post() {} } },
  ]) {
    const result = registerCustomerServiceReportProjectionRoute({
      ...candidate,
      dbClient,
    });

    assert.deepEqual(result, {
      registered: false,
      messageKey: 'customerAccess.unavailable',
      customerVisible: false,
    });
    assertNoSensitiveLeak(result);
  }

  assert.equal(dbClient.calls.length, 0);
});

test('missing injected dbClient fails closed and does not register handler', () => {
  for (const candidate of [
    undefined,
    null,
    {},
    { query: 'not function' },
  ]) {
    const app = syntheticApp();
    const result = registerCustomerServiceReportProjectionRoute({
      app,
      dbClient: candidate,
    });

    assert.deepEqual(result, {
      registered: false,
      messageKey: 'customerAccess.unavailable',
      customerVisible: false,
    });
    assert.equal(app.calls.get.length, 0);
    assert.equal(app.calls.listen.length, 0);
    assertNoSensitiveLeak(result);
  }
});

test('synthetic app registration failure fails closed without raw error leak', () => {
  const app = syntheticApp({ throwOnGet: true });
  const dbClient = dbClientWithRows([reportRow()]);

  const result = registerCustomerServiceReportProjectionRoute({
    app,
    dbClient,
    path: '/internal/customer-access/:caseId/service-report',
  });

  assert.deepEqual(result, {
    registered: false,
    messageKey: 'customerAccess.unavailable',
    customerVisible: false,
  });
  assert.equal(app.calls.get.length, 1);
  assert.equal(app.calls.listen.length, 0);
  assert.equal(dbClient.calls.length, 0);
  assertNoSensitiveLeak(result);
});

test('router option is supported without depending on a global app', () => {
  const router = syntheticApp();
  const result = registerCustomerServiceReportProjectionRoute({
    router,
    dbClient: dbClientWithRows([reportRow()]),
    path: '/internal/customer-access/:caseId/service-report',
  });

  assert.equal(result.registered, true);
  assert.equal(router.calls.get.length, 1);
  assert.equal(router.calls.listen.length, 0);
});
