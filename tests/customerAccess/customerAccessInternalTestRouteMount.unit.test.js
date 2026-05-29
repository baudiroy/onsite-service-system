'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DEFAULT_INTERNAL_TEST_ROUTE_PATH,
  mountCustomerAccessInternalTestRoutes,
} = require('../../src/customerAccess/customerAccessInternalTestRouteMount');

function authorizedContext(overrides = {}) {
  return {
    auth: {
      organizationId: 'org_internal_mount_001',
      customerId: 'customer_internal_mount_001',
      customerIdentityVerified: true,
    },
    params: {
      caseId: 'case_internal_mount_001',
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
      caseId: 'case_internal_mount_001',
      reportId: 'report_public_internal_mount_001',
    },
    customerAccessContext: authorizedContext(),
    body: {
      rawPhone: '0912345678',
      rawAddress: 'Secret internal mount address',
      lineUserId: 'line_user_should_not_leak',
    },
    ...overrides,
  };
}

function reportRow(overrides = {}) {
  return {
    organization_id: 'org_internal_mount_001',
    customer_id: 'customer_internal_mount_001',
    case_id: 'case_internal_mount_001',
    public_report_id: 'report_public_internal_mount_001',
    publication_allowed: true,
    publication_state: 'published',
    customer_visible_policy_passed: true,
    customer_visible: true,
    case_display_id: 'CASE-INTERNAL-MOUNT-001',
    service_status_display: 'Completed',
    appointment_window: '2026-05-22 14:00-16:00',
    engineer_display_name: 'Engineer Internal Mount',
    approved_service_summary: 'Customer-safe internal mount summary',
    completion_time: '2026-05-22T08:00:00.000Z',
    publicAttachments: [
      {
        attachmentId: 'att_public_internal_mount_001',
        label: 'Public internal mount photo',
        mimeType: 'image/jpeg',
        customerVisible: true,
        signedUrl: 'https://signed.example.invalid/secret',
      },
    ],
    rawPhone: '0912345678',
    rawAddress: 'Secret internal mount address',
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
    'Secret internal mount address',
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
  ]) {
    assert.equal(serialized.includes(forbidden), false, `mount output leaked ${forbidden}`);
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
    '"req"',
    '"request"',
    '"headers"',
    '"authorization"',
    '"cookies"',
    '"query"',
    '"params"',
    '"body"',
    '"socket"',
    '"connection"',
    '"user"',
    '"session"',
    '"provider_payload"',
    '"sql"',
    '"token"',
    'internal_mount_authorization_should_not_pass',
    'internal_mount_cookie_should_not_pass',
    'internal_mount_provider_should_not_pass',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `internal mount service input leaked ${forbidden}`);
  }
}

test('missing injected synthetic app or router fails closed', () => {
  const dbClient = dbClientWithRows([reportRow()]);

  for (const candidate of [
    undefined,
    null,
    {},
    { app: {} },
    { router: {} },
    { app: { post() {} } },
  ]) {
    const result = mountCustomerAccessInternalTestRoutes({
      ...candidate,
      dbClient,
    });

    assert.deepEqual(result, {
      mounted: false,
      messageKey: 'customerAccess.unavailable',
      customerVisible: false,
    });
    assertNoSensitiveLeak(result);
  }

  assert.equal(dbClient.calls.length, 0);
});

test('missing injected dbClient fails closed without registering handler', () => {
  for (const candidate of [
    undefined,
    null,
    {},
    { query: 'not function' },
  ]) {
    const app = syntheticApp();
    const result = mountCustomerAccessInternalTestRoutes({
      app,
      dbClient: candidate,
    });

    assert.deepEqual(result, {
      mounted: false,
      messageKey: 'customerAccess.unavailable',
      customerVisible: false,
    });
    assert.equal(app.calls.get.length, 0);
    assert.equal(app.calls.listen.length, 0);
    assertNoSensitiveLeak(result);
  }
});

test('valid synthetic app registers exactly one internal test route', () => {
  const app = syntheticApp();
  const dbClient = dbClientWithRows([reportRow()]);
  const result = mountCustomerAccessInternalTestRoutes({
    app,
    dbClient,
  });

  assert.equal(result.mounted, true);
  assert.equal(result.registered, true);
  assert.equal(result.internalOnly, true);
  assert.equal(result.testOnly, true);
  assert.equal(result.method, 'GET');
  assert.equal(result.path, DEFAULT_INTERNAL_TEST_ROUTE_PATH);
  assert.equal(result.path, '/__internal/customer-access/service-reports/:caseId/:reportId');
  assert.equal(typeof result.handler, 'undefined');
  assert.equal(result.path.startsWith('/__internal/'), true);
  assert.equal(result.path.includes(':caseId'), true);
  assert.equal(result.path.includes(':reportId'), true);
  assert.equal(app.calls.get.length, 1);
  assert.equal(app.calls.get[0].path, DEFAULT_INTERNAL_TEST_ROUTE_PATH);
  assert.equal(typeof app.calls.get[0].handler, 'function');
  assert.equal(app.calls.listen.length, 0);
  assert.equal(dbClient.calls.length, 0);
});

test('valid synthetic router registers exactly one explicit internal test route', () => {
  const router = syntheticApp();
  const result = mountCustomerAccessInternalTestRoutes({
    router,
    dbClient: dbClientWithRows([reportRow()]),
    path: '/__internal/customer-access/test-route/:caseId/:reportId',
  });

  assert.equal(result.mounted, true);
  assert.equal(result.path, '/__internal/customer-access/test-route/:caseId/:reportId');
  assert.equal(router.calls.get.length, 1);
  assert.equal(router.calls.listen.length, 0);
});

test('non-internal or incomplete param path fails closed without registration', () => {
  for (const path of [
    '/customer-access/service-reports/:caseId/:reportId',
    '/__internal/customer-access/service-reports/:caseId',
    '/__internal/customer-access/service-reports/:reportId',
    '/__internal/customer-access/service-reports',
  ]) {
    const app = syntheticApp();
    const dbClient = dbClientWithRows([reportRow()]);
    const result = mountCustomerAccessInternalTestRoutes({
      app,
      dbClient,
      path,
    });

    assert.deepEqual(result, {
      mounted: false,
      messageKey: 'customerAccess.unavailable',
      customerVisible: false,
    });
    assert.equal(app.calls.get.length, 0);
    assert.equal(app.calls.listen.length, 0);
    assert.equal(dbClient.calls.length, 0);
  }
});

test('registered handler preserves Task909 safe allow behavior through synthetic request', async () => {
  const app = syntheticApp();
  const dbClient = dbClientWithRows([reportRow()]);
  const result = mountCustomerAccessInternalTestRoutes({
    app,
    dbClient,
  });

  const response = await app.calls.get[0].handler(request());

  assert.equal(result.mounted, true);
  assert.deepEqual(response, {
    statusCode: 200,
    body: {
      status: 'allow',
      messageKey: 'customerAccess.serviceReport.available',
      customerVisible: true,
      data: {
        serviceReport: {
          customerReportReference: 'report_public_internal_mount_001',
          caseReference: 'CASE-INTERNAL-MOUNT-001',
          serviceStatus: 'Completed',
          appointmentWindow: '2026-05-22 14:00-16:00',
          engineerDisplayName: 'Engineer Internal Mount',
          serviceSummary: 'Customer-safe internal mount summary',
          completionTime: '2026-05-22T08:00:00.000Z',
          publicAttachments: [
            {
              attachmentId: 'att_public_internal_mount_001',
              label: 'Public internal mount photo',
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

test('registered internal handler requires context and route params without alias fallback', async () => {
  const app = syntheticApp();
  const dbClient = dbClientWithRows([reportRow()]);
  const result = mountCustomerAccessInternalTestRoutes({
    app,
    dbClient,
  });

  for (const candidate of [
    request({ customerAccessContext: undefined }),
    request({ customerAccessContext: {} }),
    request({
      params: {
        caseId: 'case_internal_mount_001',
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
        authorization: 'internal_mount_authorization_should_not_pass',
      },
      cookies: {
        reportId: 'report_cookie_alias_should_not_win',
      },
    }),
  ]) {
    const response = await app.calls.get[0].handler(candidate);

    assert.equal(result.mounted, true);
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
  }

  assert.equal(dbClient.calls.length, 0);
});

test('registered internal handler passes only sanitized DTO keys to projection service', async () => {
  const app = syntheticApp();
  const serviceInputs = [];
  const result = mountCustomerAccessInternalTestRoutes({
    app,
    dbClient: dbClientWithRows([reportRow()]),
    projectionService: (input) => {
      serviceInputs.push(input);

      return {
        status: 'allow',
        messageKey: 'customerAccess.serviceReport.available',
        customerVisible: true,
        data: {
          serviceReport: {
            customerReportReference: 'report_public_internal_mount_001',
          },
        },
      };
    },
  });

  const response = await app.calls.get[0].handler(request({
    headers: {
      authorization: 'internal_mount_authorization_should_not_pass',
    },
    cookies: {
      session: 'internal_mount_cookie_should_not_pass',
    },
    query: {
      sql: 'select secret',
    },
    body: {
      provider_payload: 'internal_mount_provider_should_not_pass',
    },
    socket: {
      remoteAddress: '127.0.0.1',
    },
    user: {
      token: 'token_should_not_leak',
    },
  }));

  assert.equal(result.mounted, true);
  assert.equal(response.statusCode, 200);
  assert.equal(serviceInputs.length, 1);
  assertNoRawRequestInputLeak(serviceInputs[0]);
  assert.deepEqual(serviceInputs[0].customerAccessContext, {
    organizationId: 'org_internal_mount_001',
    customerId: 'customer_internal_mount_001',
    caseId: 'case_internal_mount_001',
    organizationScopeMatched: true,
    customerIdentityVerified: true,
    caseLinkedToCustomer: true,
    publicationAllowed: true,
    customerVisiblePolicyPassed: true,
  });
  assert.equal(serviceInputs[0].caseId, 'case_internal_mount_001');
  assert.equal(serviceInputs[0].reportId, 'report_public_internal_mount_001');
  assertNoSensitiveLeak(response);
});

test('registration error returns safe not-mounted envelope without sensitive detail', () => {
  const app = syntheticApp({ throwOnGet: true });
  const dbClient = dbClientWithRows([reportRow()]);
  const result = mountCustomerAccessInternalTestRoutes({
    app,
    dbClient,
  });

  assert.deepEqual(result, {
    mounted: false,
    messageKey: 'customerAccess.unavailable',
    customerVisible: false,
  });
  assert.equal(app.calls.get.length, 1);
  assert.equal(app.calls.listen.length, 0);
  assert.equal(dbClient.calls.length, 0);
  assertNoSensitiveLeak(result);
});
