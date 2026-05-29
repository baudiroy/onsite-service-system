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
    service_summary: 'Customer-safe internal mount summary',
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
  assert.equal(typeof result.handler, 'function');
  assert.equal(result.path.startsWith('/__internal/'), true);
  assert.equal(app.calls.get.length, 1);
  assert.equal(app.calls.get[0].path, DEFAULT_INTERNAL_TEST_ROUTE_PATH);
  assert.equal(app.calls.get[0].handler, result.handler);
  assert.equal(app.calls.listen.length, 0);
  assert.equal(dbClient.calls.length, 0);
});

test('valid synthetic router registers exactly one explicit internal test route', () => {
  const router = syntheticApp();
  const result = mountCustomerAccessInternalTestRoutes({
    router,
    dbClient: dbClientWithRows([reportRow()]),
    path: '/__internal/customer-access/test-route/:caseId',
  });

  assert.equal(result.mounted, true);
  assert.equal(result.path, '/__internal/customer-access/test-route/:caseId');
  assert.equal(router.calls.get.length, 1);
  assert.equal(router.calls.listen.length, 0);
});

test('non-internal path fails closed without registration', () => {
  const app = syntheticApp();
  const dbClient = dbClientWithRows([reportRow()]);
  const result = mountCustomerAccessInternalTestRoutes({
    app,
    dbClient,
    path: '/customer-access/service-reports/:caseId',
  });

  assert.deepEqual(result, {
    mounted: false,
    messageKey: 'customerAccess.unavailable',
    customerVisible: false,
  });
  assert.equal(app.calls.get.length, 0);
  assert.equal(app.calls.listen.length, 0);
  assert.equal(dbClient.calls.length, 0);
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
