'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  CUSTOMER_ACCESS_REPORT_ROUTE_PATH,
  CUSTOMER_ACCESS_ROUTE_PATH,
  registerCustomerAccessRoutes,
} = require('../../src/routes/customerAccessRoutes');

function createSyntheticRouter() {
  return {
    routes: [],
    get(path, ...handlers) {
      this.routes.push({
        method: 'GET',
        path,
        handlers,
      });
      return this;
    },
  };
}

function invokeRoute(route, req) {
  const res = createSyntheticRes();
  let nextCallCount = 0;

  route.handlers[0](req, res, () => {
    nextCallCount += 1;
  });
  const body = route.handlers[route.handlers.length - 1](req, res);

  return {
    body,
    nextCallCount,
    res,
  };
}

async function invokeRouteAsync(route, req) {
  const res = createSyntheticRes();
  let nextCallCount = 0;

  route.handlers[0](req, res, () => {
    nextCallCount += 1;
  });
  const body = await route.handlers[route.handlers.length - 1](req, res);

  return {
    body,
    nextCallCount,
    res,
  };
}

function createSyntheticRes() {
  const calls = {
    status: [],
    json: [],
  };

  return {
    calls,
    status(code) {
      calls.status.push(code);
      return this;
    },
    json(body) {
      calls.json.push(body);
      return body;
    },
  };
}

function createSyntheticDbClient(rows) {
  const calls = [];

  return {
    calls,
    query(querySpec) {
      calls.push(querySpec);
      return { rows };
    },
  };
}

function authorizedContextInput() {
  return {
    organizationId: 'org_route_001',
    caseId: 'case_route_001',
    customerId: 'customer_route_001',
    customerIdentityVerified: true,
    caseLinkedToCustomer: true,
    publicationAllowed: true,
    customerVisiblePolicyPassed: true,
    customerVisibleData: {
      serviceReport: {
        publicReportId: 'report_public_route_001',
        status: 'available',
      },
    },
  };
}

function reportRow(overrides = {}) {
  return {
    organization_id: 'org_route_001',
    customer_id: 'customer_route_001',
    case_id: 'case_route_001',
    public_report_id: 'report_public_route_001',
    case_display_id: 'CASE-ROUTE-001',
    service_status_display: 'Completed',
    appointment_window: '2026-05-23 10:00-12:00',
    engineer_display_name: 'Engineer Route',
    service_summary: 'Customer-safe route summary',
    completion_time: '2026-05-23T04:00:00.000Z',
    rawCasePayload: 'raw_case_payload_should_not_leak',
    rawAppointmentRow: 'raw_appointment_row_should_not_leak',
    rawCompletionReport: 'raw_completion_report_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    internalNote: 'internal_note_should_not_leak',
    providerRawPayload: 'provider_payload_should_not_leak',
    ...overrides,
  };
}

function allowRepository() {
  return {
    getOrganizationScope() {
      return {
        available: true,
        matched: true,
        organizationId: 'org_route_001',
      };
    },
    getVerifiedCustomerIdentity() {
      return {
        available: true,
        verified: true,
        customerId: 'customer_route_001',
      };
    },
    getCaseLinkage() {
      return {
        available: true,
        linked: true,
        caseId: 'case_route_001',
      };
    },
    getPublicationState() {
      return {
        available: true,
        allowed: true,
        customerVisiblePolicyPassed: true,
      };
    },
    getCustomerVisibleProjection() {
      return {
        available: true,
        customerVisiblePolicyPassed: true,
        data: {
          serviceReport: {
            publicReportId: 'report_public_route_001',
            status: 'available',
          },
        },
      };
    },
  };
}

function denyRepository() {
  return {
    getOrganizationScope() {
      return {
        available: false,
        matched: false,
        organizationId: null,
      };
    },
    getVerifiedCustomerIdentity() {
      return {
        available: false,
        verified: false,
        customerId: null,
      };
    },
    getCaseLinkage() {
      return {
        available: false,
        linked: false,
        caseId: null,
      };
    },
    getPublicationState() {
      return {
        available: false,
        allowed: false,
      };
    },
    getCustomerVisibleProjection() {
      return {
        available: false,
        data: {},
      };
    },
  };
}

function allowRepositoryWithMissingCustomerId() {
  return {
    ...allowRepository(),
    getVerifiedCustomerIdentity() {
      return {
        available: true,
        verified: true,
        customerId: null,
      };
    },
  };
}

const forbiddenValues = [
  '0912-345-678',
  '台北市信義區測試路1號',
  'U1234567890abcdef',
  'raw_case_payload_should_not_leak',
  'raw_appointment_row_should_not_leak',
  'raw_completion_report_should_not_leak',
  'final_appointment_should_not_leak',
  'internal_note_should_not_leak',
  'provider_payload_should_not_leak',
  'MISSING_ORGANIZATION_SCOPE',
  'UNVERIFIED_CUSTOMER_IDENTITY',
  'MISSING_CASE_LINKAGE',
  'PUBLICATION_NOT_ALLOWED',
  'CUSTOMER_VISIBLE_POLICY_FAILED',
];

function assertSafeResponse(response) {
  const serialized = JSON.stringify(response);

  for (const value of forbiddenValues) {
    assert.equal(serialized.includes(value), false, `route response leaked forbidden value: ${value}`);
  }
}

function assertAuditSafe(event) {
  const serialized = JSON.stringify(event);

  for (const value of [
    ...forbiddenValues,
    'Customer-safe route summary',
    'Completed',
    'CASE-ROUTE-001',
    '2026-05-23 10:00-12:00',
  ]) {
    assert.equal(serialized.includes(value), false, `audit event leaked forbidden value: ${value}`);
  }
}

test('exports registerCustomerAccessRoutes', () => {
  assert.equal(typeof registerCustomerAccessRoutes, 'function');
});

test('registers customer access and service report GET routes on synthetic router', () => {
  const router = createSyntheticRouter();

  const returnedRouter = registerCustomerAccessRoutes(router);

  assert.equal(returnedRouter, router);
  assert.deepEqual(router.routes.map((route) => `${route.method} ${route.path}`), [
    'GET /customer-access/:caseId',
    'GET /customer-access/:caseId/service-report/:reportId',
  ]);
});

test('registered path includes caseId param', () => {
  const router = createSyntheticRouter();

  registerCustomerAccessRoutes(router);

  assert.equal(CUSTOMER_ACCESS_ROUTE_PATH, '/customer-access/:caseId');
  assert.equal(CUSTOMER_ACCESS_REPORT_ROUTE_PATH, '/customer-access/:caseId/service-report/:reportId');
  assert.equal(router.routes[0].path, '/customer-access/:caseId');
  assert.equal(router.routes[0].path.includes(':caseId'), true);
  assert.equal(router.routes[1].path.includes(':reportId'), true);
});

test('registered middleware and handler are functions', () => {
  const router = createSyntheticRouter();

  registerCustomerAccessRoutes(router);

  for (const route of router.routes) {
    assert.equal(route.handlers.length >= 2, true);
    assert.equal(typeof route.handlers[0], 'function');
    assert.equal(typeof route.handlers[route.handlers.length - 1], 'function');
  }
});

test('invalid or missing router no-ops without external side effect', () => {
  assert.equal(registerCustomerAccessRoutes(), undefined);
  assert.equal(registerCustomerAccessRoutes(null), null);
  assert.deepEqual(registerCustomerAccessRoutes({}), {});
});

test('registered handler can be invoked with synthetic req/res and returns generic safe-deny', () => {
  const router = createSyntheticRouter();
  registerCustomerAccessRoutes(router);

  const { body, nextCallCount, res } = invokeRoute(
    router.routes[0],
    { params: { caseId: 'case-synthetic' } },
  );

  assert.equal(nextCallCount, 1);
  assert.deepEqual(res.calls.status, [404]);
  assert.equal(res.calls.json.length, 1);
  assert.deepEqual(body, res.calls.json[0]);
  assert.deepEqual(body, {
    status: 'deny',
    messageKey: 'customerAccess.unavailable',
    customerVisible: false,
    data: null,
    error: {
      messageKey: 'customerAccess.unavailable',
    },
  });
  assertSafeResponse(body);
});

test('registered handler response does not expose raw phone, address, LINE id, or internal reason', () => {
  const router = createSyntheticRouter();
  registerCustomerAccessRoutes(router);

  const { body } = invokeRoute(
    router.routes[0],
    {
      params: { caseId: 'case-synthetic' },
      auth: { organizationId: 'org-synthetic' },
      channel: { lineUserId: 'U1234567890abcdef' },
      rawPhone: '0912-345-678',
      rawAddress: '台北市信義區測試路1號',
    },
  );

  assert.equal(body.status, 'deny');
  assertSafeResponse(body);
});

test('service report route returns safe-deny before projection when resolver gate denies', async () => {
  const router = createSyntheticRouter();
  const dbClient = createSyntheticDbClient([reportRow()]);
  registerCustomerAccessRoutes(router, { dbClient, repository: denyRepository() });

  const { body, nextCallCount, res } = await invokeRouteAsync(
    router.routes[1],
    {
      params: {
        caseId: 'case_route_001',
        reportId: 'report_public_route_001',
      },
    },
  );

  assert.equal(nextCallCount, 1);
  assert.deepEqual(res.calls.status, [404]);
  assert.deepEqual(body, {
    status: 'deny',
    messageKey: 'customerAccess.unavailable',
    customerVisible: false,
    data: null,
    error: {
      messageKey: 'customerAccess.unavailable',
    },
  });
  assert.equal(dbClient.calls.length, 0);
  assertSafeResponse(body);
});

test('service report route fails closed when allow-shaped context is missing customer scope', async () => {
  const router = createSyntheticRouter();
  const dbClient = createSyntheticDbClient([reportRow()]);
  registerCustomerAccessRoutes(router, {
    dbClient,
    repository: allowRepositoryWithMissingCustomerId(),
  });

  const { body, nextCallCount, res } = await invokeRouteAsync(
    router.routes[1],
    {
      params: {
        caseId: 'case_route_001',
        reportId: 'report_public_route_001',
      },
    },
  );

  assert.equal(nextCallCount, 1);
  assert.deepEqual(res.calls.status, [404]);
  assert.deepEqual(body, {
    status: 'deny',
    messageKey: 'customerAccess.unavailable',
    customerVisible: false,
    data: null,
    error: {
      messageKey: 'customerAccess.unavailable',
    },
  });
  assert.equal(dbClient.calls.length, 0);
  assertSafeResponse(body);
});

test('customer access unavailable responses intentionally use app-level 404 stealth safe-deny', async () => {
  const router = createSyntheticRouter();
  const dbClient = createSyntheticDbClient([reportRow()]);

  registerCustomerAccessRoutes(router, { dbClient, repository: denyRepository() });

  const baseRouteResult = invokeRoute(
    router.routes[0],
    { params: { caseId: 'case_route_001' } },
  );
  const reportRouteResult = await invokeRouteAsync(
    router.routes[1],
    {
      params: {
        caseId: 'case_route_001',
        reportId: 'report_public_route_001',
      },
    },
  );

  assert.equal(router.routes[0].path, CUSTOMER_ACCESS_ROUTE_PATH);
  assert.equal(router.routes[1].path, CUSTOMER_ACCESS_REPORT_ROUTE_PATH);

  for (const result of [baseRouteResult, reportRouteResult]) {
    assert.deepEqual(result.res.calls.status, [404]);
    assert.deepEqual(result.body, {
      status: 'deny',
      messageKey: 'customerAccess.unavailable',
      customerVisible: false,
      data: null,
      error: {
        messageKey: 'customerAccess.unavailable',
      },
    });
    assertSafeResponse(result.body);
  }

  assert.equal(dbClient.calls.length, 0);
});

test('service report route allow path returns filtered projection without raw case data', async () => {
  const router = createSyntheticRouter();
  const dbClient = createSyntheticDbClient([reportRow()]);
  registerCustomerAccessRoutes(router, { dbClient, repository: allowRepository() });

  const { body, nextCallCount, res } = await invokeRouteAsync(
    router.routes[1],
    {
      params: {
        caseId: 'case_route_001',
        reportId: 'report_public_route_001',
      },
      customerAccessContextInput: authorizedContextInput(),
    },
  );

  assert.equal(nextCallCount, 1);
  assert.deepEqual(res.calls.status, [200]);
  assert.equal(body.status, 'allow');
  assert.equal(body.messageKey, 'customerAccess.serviceReport.available');
  assert.deepEqual(body.data.serviceReport, {
    customerReportReference: 'report_public_route_001',
    caseReference: 'CASE-ROUTE-001',
    serviceStatus: 'Completed',
    appointmentWindow: '2026-05-23 10:00-12:00',
    engineerDisplayName: 'Engineer Route',
    serviceSummary: 'Customer-safe route summary',
    completionTime: '2026-05-23T04:00:00.000Z',
  });
  assert.equal(dbClient.calls.length, 1);
  assertSafeResponse(body);
});

test('service report route writes sanitized allow audit event with injected writer', async () => {
  const router = createSyntheticRouter();
  const dbClient = createSyntheticDbClient([reportRow()]);
  const auditEvents = [];

  registerCustomerAccessRoutes(router, {
    dbClient,
    repository: allowRepository(),
    auditWriter(event) {
      auditEvents.push(event);
    },
  });

  const { body } = await invokeRouteAsync(
    router.routes[1],
    {
      requestId: 'request_route_audit_001',
      params: {
        caseId: 'case_route_001',
        reportId: 'report_public_route_001',
      },
      customerAccessContextInput: authorizedContextInput(),
    },
  );

  assert.equal(body.status, 'allow');
  assert.equal(auditEvents.length, 1);
  assert.deepEqual(auditEvents[0], {
    eventType: 'customerServiceReport.access',
    action: 'customer_service_report_access',
    outcome: 'allow',
    decision: {
      status: 'allow',
      messageKey: 'customerAccess.serviceReport.available',
      customerVisible: true,
      publicationAllowed: true,
      customerVisiblePolicyPassed: true,
    },
    organizationId: 'org_route_001',
    customerId: 'customer_route_001',
    caseId: 'case_route_001',
    reportId: 'report_public_route_001',
    requestId: 'request_route_audit_001',
  });
  assertAuditSafe(auditEvents[0]);
  assertSafeResponse(body);
});

test('service report route writes sanitized deny audit event before projection query', async () => {
  const router = createSyntheticRouter();
  const dbClient = createSyntheticDbClient([reportRow()]);
  const auditEvents = [];

  registerCustomerAccessRoutes(router, {
    dbClient,
    repository: denyRepository(),
    auditWriter(event) {
      auditEvents.push(event);
    },
  });

  const { body, res } = await invokeRouteAsync(
    router.routes[1],
    {
      requestId: 'request_route_audit_002',
      params: {
        caseId: 'case_route_001',
        reportId: 'report_public_route_001',
      },
    },
  );

  assert.deepEqual(res.calls.status, [404]);
  assert.equal(body.status, 'deny');
  assert.equal(dbClient.calls.length, 0);
  assert.equal(auditEvents.length, 1);
  assert.deepEqual(auditEvents[0], {
    eventType: 'customerServiceReport.access',
    action: 'customer_service_report_access',
    outcome: 'deny',
    decision: {
      status: 'deny',
      messageKey: 'customerAccess.unavailable',
      customerVisible: false,
      publicationAllowed: false,
      customerVisiblePolicyPassed: false,
    },
    caseId: 'case_route_001',
    reportId: 'report_public_route_001',
    requestId: 'request_route_audit_002',
  });
  assertAuditSafe(auditEvents[0]);
  assertSafeResponse(body);
});

test('service report route audit writer failure remains sanitized and customer-invisible', async () => {
  const router = createSyntheticRouter();
  const dbClient = createSyntheticDbClient([reportRow()]);
  const auditEvents = [];

  registerCustomerAccessRoutes(router, {
    dbClient,
    repository: denyRepository(),
    auditWriter(event) {
      auditEvents.push(event);
      throw new Error('token_should_not_leak');
    },
  });

  const { body, res } = await invokeRouteAsync(
    router.routes[1],
    {
      params: {
        caseId: 'case_route_001',
        reportId: 'report_public_route_001',
      },
    },
  );

  assert.deepEqual(res.calls.status, [404]);
  assert.equal(body.status, 'deny');
  assert.equal(auditEvents.length, 1);
  assert.equal(JSON.stringify(body).includes('token_should_not_leak'), false);
  assert.equal(JSON.stringify(body).includes('audit'), false);
  assertSafeResponse(body);
  assertAuditSafe(auditEvents[0]);
});

test('service report route missing projection dbClient stays 404 safe-deny and audits requestId', async () => {
  const router = createSyntheticRouter();
  const auditEvents = [];

  registerCustomerAccessRoutes(router, {
    repository: allowRepository(),
    auditWriter(event) {
      auditEvents.push(event);
    },
  });

  const { body, nextCallCount, res } = await invokeRouteAsync(
    router.routes[1],
    {
      requestId: 'request_route_harden_001',
      params: {
        caseId: 'case_route_001',
        reportId: 'report_public_route_001',
      },
      customerAccessContextInput: authorizedContextInput(),
    },
  );

  assert.equal(nextCallCount, 1);
  assert.deepEqual(res.calls.status, [404]);
  assert.deepEqual(body, {
    status: 'deny',
    messageKey: 'customerAccess.unavailable',
    customerVisible: false,
    data: null,
    error: {
      messageKey: 'customerAccess.unavailable',
    },
  });
  assert.equal(auditEvents.length, 1);
  assert.equal(auditEvents[0].outcome, 'deny');
  assert.equal(auditEvents[0].decision.status, 'deny');
  assert.equal(auditEvents[0].requestId, 'request_route_harden_001');
  assert.equal(auditEvents[0].caseId, 'case_route_001');
  assert.equal(auditEvents[0].reportId, 'report_public_route_001');
  assertSafeResponse(body);
  assertAuditSafe(auditEvents[0]);
});

test('service report route projection query failure remains sanitized and customer-invisible', async () => {
  const router = createSyntheticRouter();
  const auditEvents = [];
  const dbClient = {
    calls: [],
    query(querySpec) {
      this.calls.push(querySpec);
      throw new Error('database hostname token_should_not_leak');
    },
  };

  registerCustomerAccessRoutes(router, {
    dbClient,
    repository: allowRepository(),
    auditWriter(event) {
      auditEvents.push(event);
    },
  });

  const { body, res } = await invokeRouteAsync(
    router.routes[1],
    {
      requestId: 'request_route_harden_002',
      params: {
        caseId: 'case_route_001',
        reportId: 'report_public_route_001',
      },
      customerAccessContextInput: authorizedContextInput(),
    },
  );

  assert.deepEqual(res.calls.status, [404]);
  assert.equal(body.status, 'deny');
  assert.equal(body.messageKey, 'customerAccess.unavailable');
  assert.equal(JSON.stringify(body).includes('database hostname'), false);
  assert.equal(JSON.stringify(body).includes('token_should_not_leak'), false);
  assert.equal(dbClient.calls.length, 1);
  assert.equal(auditEvents.length, 1);
  assert.equal(auditEvents[0].outcome, 'deny');
  assert.equal(auditEvents[0].requestId, 'request_route_harden_002');
  assertSafeResponse(body);
  assertAuditSafe(auditEvents[0]);
});
