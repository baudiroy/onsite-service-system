'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const { createAppRouter } = require('../../src/routes');
const {
  CUSTOMER_ACCESS_REPORT_ROUTE_PATH,
  CUSTOMER_ACCESS_ROUTE_PATH,
} = require('../../src/routes/customerAccessRoutes');

const SAFE_DENY_ENVELOPE = {
  status: 'deny',
  messageKey: 'customerAccess.unavailable',
  customerVisible: false,
  data: null,
  error: {
    messageKey: 'customerAccess.unavailable',
  },
};

const FORBIDDEN_RESPONSE_VALUES = [
  'raw_request_should_not_leak',
  'raw_headers_should_not_leak',
  'raw_body_should_not_leak',
  'raw_cookie_should_not_leak',
  'case_query_alias_should_not_win',
  'case_body_alias_should_not_win',
  'case_header_alias_should_not_win',
  'case_cookie_alias_should_not_win',
  'report_query_alias_should_not_win',
  'report_body_alias_should_not_win',
  'report_header_alias_should_not_win',
  'report_cookie_alias_should_not_win',
  'authorization_should_not_leak',
  'token_should_not_leak',
  '0912-345-678',
  'No. 1 Secret Road',
  'line_user_should_not_leak',
  'provider_payload_should_not_leak',
  'raw_payload_should_not_leak',
  'debug_should_not_leak',
  'stack_should_not_leak',
  'select secret_should_not_leak',
  'internal_note_should_not_leak',
  'private_field_should_not_leak',
  'admin_only_should_not_leak',
  'query_metadata_should_not_leak',
  'auditWritten',
  'auditEvent',
  'persisted',
  'writer',
];

function createSyntheticRes() {
  const calls = {
    headers: [],
    json: [],
    status: [],
  };

  return {
    calls,
    set(key, value) {
      calls.headers.push({ key, value });
      return this;
    },
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

function routePatternParams(routePath, requestPath) {
  if (typeof routePath !== 'string' || typeof requestPath !== 'string') {
    return undefined;
  }

  if (requestPath !== '/' && requestPath.endsWith('/')) {
    return undefined;
  }

  const routeSegments = routePath.split('/').filter(Boolean);
  const requestSegments = requestPath.split('/').filter(Boolean);

  if (routeSegments.length !== requestSegments.length) {
    return undefined;
  }

  const params = {};

  for (let index = 0; index < routeSegments.length; index += 1) {
    const routeSegment = routeSegments[index];
    const requestSegment = requestSegments[index];

    if (routeSegment.startsWith(':')) {
      params[routeSegment.slice(1)] = requestSegment;
      continue;
    }

    if (routeSegment !== requestSegment) {
      return undefined;
    }
  }

  return params;
}

async function invokeRouteLayer(routeLayer, req) {
  const handlers = routeLayer.route.stack.map((layer) => layer.handle);
  const res = createSyntheticRes();
  let nextCallCount = 0;
  let body;

  async function runHandler(index) {
    if (index >= handlers.length) {
      return undefined;
    }

    let nextCalled = false;
    const result = handlers[index](req, res, () => {
      nextCalled = true;
      nextCallCount += 1;
    });

    const resolved = result && typeof result.then === 'function'
      ? await result
      : result;

    if (res.calls.json.length > 0) {
      body = res.calls.json[res.calls.json.length - 1];
      return body;
    }

    if (nextCalled) {
      return runHandler(index + 1);
    }

    body = resolved;
    return body;
  }

  await runHandler(0);

  return {
    body,
    handlers,
    nextCallCount,
    res,
  };
}

async function dispatchProductionRequest(appRouter, options) {
  const method = String(options.method || '').toUpperCase();
  const requestPath = options.path;

  for (const layer of appRouter.stack) {
    if (!layer.route || !layer.route.methods[String(method).toLowerCase()]) {
      continue;
    }

    const params = routePatternParams(layer.route.path, requestPath);

    if (!params) {
      continue;
    }

    const req = {
      ...(options.req || {}),
      method,
      originalUrl: requestPath,
      params,
      path: requestPath,
    };
    const result = await invokeRouteLayer(layer, req);

    return {
      ...result,
      matched: true,
      params,
      routePath: layer.route.path,
    };
  }

  return {
    body: SAFE_DENY_ENVELOPE,
    handlers: [],
    matched: false,
    nextCallCount: 0,
    params: {},
    res: {
      calls: {
        headers: [],
        json: [SAFE_DENY_ENVELOPE],
        status: [404],
      },
    },
    routePath: undefined,
  };
}

function authorizedContextInput() {
  return {
    organizationId: 'org_prod_001',
    caseId: 'case_prod_001',
    customerId: 'customer_prod_001',
    customerIdentityVerified: true,
    caseLinkedToCustomer: true,
    publicationAllowed: true,
    customerVisiblePolicyPassed: true,
    lineUserId: 'line_user_should_not_leak',
    rawPhone: '0912-345-678',
    rawAddress: 'No. 1 Secret Road',
    customerVisibleData: {
      serviceReport: {
        caseNo: 'CASE-PROD-001',
        finalAppointmentId: 'appt_prod_001',
        publicReportId: 'report_prod_001',
        status: 'available',
        summary: 'Customer-safe production composition summary',
        internalNote: 'internal_note_should_not_leak',
        privateField: 'private_field_should_not_leak',
        adminOnly: 'admin_only_should_not_leak',
      },
    },
  };
}

function allowRepository() {
  return {
    getOrganizationScope() {
      return {
        available: true,
        matched: true,
        organizationId: 'org_prod_001',
      };
    },
    getVerifiedCustomerIdentity() {
      return {
        available: true,
        verified: true,
        customerId: 'customer_prod_001',
      };
    },
    getCaseLinkage() {
      return {
        available: true,
        linked: true,
        caseId: 'case_prod_001',
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
            caseNo: 'CASE-PROD-001',
            finalAppointmentId: 'appt_prod_001',
            publicReportId: 'report_prod_001',
            status: 'available',
            summary: 'Customer-safe production composition summary',
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

function reportRow(overrides = {}) {
  return {
    organization_id: 'org_prod_001',
    customer_id: 'customer_prod_001',
    case_id: 'case_prod_001',
    public_report_id: 'report_prod_001',
    publication_allowed: true,
    publication_state: 'published',
    customer_visible_policy_passed: true,
    customer_visible: true,
    case_display_id: 'CASE-PROD-001',
    service_status_display: 'Completed',
    appointment_window: '2026-05-30 10:00-12:00',
    engineer_display_name: 'Engineer Production',
    approved_service_summary: 'Customer-safe production report summary',
    completion_time: '2026-05-30T04:00:00.000Z',
    publicAttachments: [
      {
        attachmentId: 'att_prod_001',
        label: 'Service photo',
        mimeType: 'image/jpeg',
        customerVisible: true,
        signedUrl: 'https://signed.example.invalid/token_should_not_leak',
      },
      {
        attachmentId: 'att_internal_001',
        label: 'Internal only',
        customerVisible: false,
      },
    ],
    rawCasePayload: 'raw_payload_should_not_leak',
    providerRawPayload: 'provider_payload_should_not_leak',
    debugInfo: 'debug_should_not_leak',
    stack: 'stack_should_not_leak',
    sql: 'select secret_should_not_leak',
    queryMetadata: 'query_metadata_should_not_leak',
    ...overrides,
  };
}

function createSyntheticDbClient(rows = [reportRow()]) {
  const calls = [];

  return {
    calls,
    query(querySpec) {
      calls.push(querySpec);
      return { rows };
    },
  };
}

function createProductionRouter(options = {}) {
  const dbClient = options.dbClient || createSyntheticDbClient();
  const auditEvents = [];
  const appRouter = createAppRouter({
    customerAccess: {
      auditWriter(auditEvent) {
        auditEvents.push(auditEvent);
        return {
          ok: true,
          auditWritten: true,
          persisted: true,
        };
      },
      dbClient,
      repository: options.repository || allowRepository(),
    },
  });

  return {
    appRouter,
    auditEvents,
    dbClient,
  };
}

function aliasRequest(overrides = {}) {
  return {
    body: {
      caseId: 'case_body_alias_should_not_win',
      reportId: 'report_body_alias_should_not_win',
      rawBody: 'raw_body_should_not_leak',
    },
    cookies: {
      caseId: 'case_cookie_alias_should_not_win',
      reportId: 'report_cookie_alias_should_not_win',
      session: 'raw_cookie_should_not_leak',
    },
    customerAccessContextInput: authorizedContextInput(),
    headers: {
      authorization: 'authorization_should_not_leak token_should_not_leak',
      'x-case-id': 'case_header_alias_should_not_win',
      'x-report-id': 'report_header_alias_should_not_win',
      rawHeaders: 'raw_headers_should_not_leak',
    },
    query: {
      caseId: 'case_query_alias_should_not_win',
      reportId: 'report_query_alias_should_not_win',
    },
    rawRequest: 'raw_request_should_not_leak',
    ...overrides,
  };
}

function assertNoForbiddenLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of FORBIDDEN_RESPONSE_VALUES) {
    assert.equal(serialized.includes(forbidden), false, `response leaked ${forbidden}`);
  }
}

function assertSafeDeny(result) {
  assert.equal(result.body, result.res.calls.json[0]);
  assert.deepEqual(result.res.calls.status, [404]);
  assert.deepEqual(result.body, SAFE_DENY_ENVELOPE);
  assertNoForbiddenLeak(result.body);
}

test('production composition exposes only accepted Customer Access public GET route templates', () => {
  const { appRouter } = createProductionRouter();
  const routeTemplates = appRouter.stack
    .filter((layer) => layer.route && layer.route.methods.get)
    .map((layer) => layer.route.path)
    .filter((routePath) => String(routePath).includes('customer-access'));

  assert.deepEqual(routeTemplates, [
    CUSTOMER_ACCESS_ROUTE_PATH,
    CUSTOMER_ACCESS_REPORT_ROUTE_PATH,
  ]);
  assert.equal(routeTemplates.includes('/__internal/customer-access/service-reports/:caseId/:reportId'), false);
});

test('production composition GET /customer-access/:caseId returns allowlisted case overview envelope', async () => {
  const { appRouter, auditEvents, dbClient } = createProductionRouter();
  const result = await dispatchProductionRequest(appRouter, {
    method: 'GET',
    path: '/customer-access/case_prod_001',
    req: aliasRequest(),
  });

  assert.equal(result.matched, true);
  assert.equal(result.routePath, CUSTOMER_ACCESS_ROUTE_PATH);
  assert.equal(result.nextCallCount, 1);
  assert.deepEqual(result.res.calls.status, [200]);
  assert.deepEqual(Object.keys(result.body), ['status', 'messageKey', 'customerVisible', 'data']);
  assert.equal(result.body.status, 'allow');
  assert.equal(result.body.messageKey, 'customerAccess.available');
  assert.equal(result.body.customerVisible, true);
  assert.deepEqual(Object.keys(result.body.data), ['serviceReport']);
  assert.deepEqual(Object.keys(result.body.data.serviceReport), [
    'caseNo',
    'finalAppointmentId',
    'publicReportId',
    'status',
    'summary',
  ]);
  assert.deepEqual(result.body.data.serviceReport, {
    caseNo: 'CASE-PROD-001',
    finalAppointmentId: 'appt_prod_001',
    publicReportId: 'report_prod_001',
    status: 'available',
    summary: 'Customer-safe production composition summary',
  });
  assert.deepEqual(dbClient.calls, []);
  assert.equal(auditEvents.some((event) => event && event.auditWritten), false);
  assertNoForbiddenLeak(result.body);
  assertNoForbiddenLeak(result.res.calls.headers);
});

test('production composition GET service-report route returns allowlisted report projection envelope', async () => {
  const { appRouter, auditEvents, dbClient } = createProductionRouter();
  const result = await dispatchProductionRequest(appRouter, {
    method: 'GET',
    path: '/customer-access/case_prod_001/service-report/report_prod_001',
    req: aliasRequest(),
  });

  assert.equal(result.matched, true);
  assert.equal(result.routePath, CUSTOMER_ACCESS_REPORT_ROUTE_PATH);
  assert.equal(result.nextCallCount, 1);
  assert.deepEqual(result.res.calls.status, [200]);
  assert.equal(result.body.status, 'allow');
  assert.equal(result.body.messageKey, 'customerAccess.serviceReport.available');
  assert.equal(result.body.customerVisible, true);
  assert.deepEqual(Object.keys(result.body.data), ['serviceReport']);
  assert.deepEqual(Object.keys(result.body.data.serviceReport).sort(), [
    'appointmentWindow',
    'caseReference',
    'completionTime',
    'customerReportReference',
    'engineerDisplayName',
    'publicAttachments',
    'serviceStatus',
    'serviceSummary',
  ].sort());
  assert.deepEqual(result.body.data.serviceReport, {
    customerReportReference: 'report_prod_001',
    caseReference: 'CASE-PROD-001',
    serviceStatus: 'Completed',
    appointmentWindow: '2026-05-30 10:00-12:00',
    engineerDisplayName: 'Engineer Production',
    serviceSummary: 'Customer-safe production report summary',
    completionTime: '2026-05-30T04:00:00.000Z',
    publicAttachments: [
      {
        attachmentId: 'att_prod_001',
        label: 'Service photo',
        mimeType: 'image/jpeg',
      },
    ],
  });
  assert.deepEqual(Object.keys(result.body.data.serviceReport.publicAttachments[0]), [
    'attachmentId',
    'label',
    'mimeType',
  ]);
  assert.equal(dbClient.calls.length, 1);
  assert.deepEqual(dbClient.calls[0].values, [
    'org_prod_001',
    'customer_prod_001',
    'case_prod_001',
    'report_prod_001',
  ]);
  assert.equal(auditEvents.some((event) => event && event.auditWritten), false);
  assertNoForbiddenLeak(result.body);
  assertNoForbiddenLeak(result.res.calls.headers);
});

test('production composition safe-denies missing malformed and alias-only identifiers without projection query', async () => {
  for (const request of [
    {
      method: 'GET',
      path: '/customer-access/Bearer%20token_should_not_leak',
      req: aliasRequest(),
    },
    {
      method: 'GET',
      path: '/customer-access/case_prod_001/service-report/report_prod_001%3Bselect%20secret_should_not_leak',
      req: aliasRequest(),
    },
    {
      method: 'GET',
      path: '/customer-access/case_prod_001/service-report',
      req: aliasRequest(),
    },
  ]) {
    const dbClient = createSyntheticDbClient();
    const { appRouter } = createProductionRouter({ dbClient });
    const result = await dispatchProductionRequest(appRouter, request);

    assertSafeDeny(result);
    assert.equal(dbClient.calls.length, 0);
  }
});

test('production composition service-deny and projection-deny stay sanitized without leaking raw context', async () => {
  const deniedContextDbClient = createSyntheticDbClient();
  const deniedContext = createProductionRouter({
    dbClient: deniedContextDbClient,
    repository: denyRepository(),
  });
  const contextResult = await dispatchProductionRequest(deniedContext.appRouter, {
    method: 'GET',
    path: '/customer-access/case_prod_001/service-report/report_prod_001',
    req: aliasRequest(),
  });

  assertSafeDeny(contextResult);
  assert.equal(deniedContextDbClient.calls.length, 0);

  const projectionDenyDbClient = createSyntheticDbClient([]);
  const projectionDeny = createProductionRouter({ dbClient: projectionDenyDbClient });
  const projectionResult = await dispatchProductionRequest(projectionDeny.appRouter, {
    method: 'GET',
    path: '/customer-access/case_prod_001/service-report/report_prod_001',
    req: aliasRequest(),
  });

  assertSafeDeny(projectionResult);
  assert.equal(projectionDenyDbClient.calls.length, 1);
});

test('production composition method and near-match paths do not dispatch Customer Access handlers', async () => {
  for (const request of [
    ...['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'].map((method) => ({
      method,
      path: '/customer-access/case_prod_001',
    })),
    { method: 'GET', path: '/customer-access/case_prod_001/' },
    { method: 'GET', path: '/customer-access/case_prod_001/service-report/' },
    { method: 'GET', path: '/customer-access/case_prod_001/service-report/report_prod_001/extra' },
    { method: 'GET', path: '/__internal/customer-access/service-reports/case_prod_001/report_prod_001' },
  ]) {
    const dbClient = createSyntheticDbClient();
    const { appRouter } = createProductionRouter({ dbClient });
    const result = await dispatchProductionRequest(appRouter, {
      ...request,
      req: aliasRequest(),
    });

    assert.equal(result.matched, false);
    assert.equal(result.handlers.length, 0);
    assertSafeDeny(result);
    assert.equal(dbClient.calls.length, 0);
  }
});

test('Task2147 HTTP behavior surrogate stays synthetic and does not import server app DB env or providers', () => {
  const source = fs.readFileSync(__filename, 'utf8');
  const specifiers = [...source.matchAll(/require\(['"]([^'"]+)['"]\)/g)].map((match) => match[1]);

  assert.deepEqual(specifiers, [
    'node:assert/strict',
    'node:fs',
    'node:test',
    '../../src/routes',
    '../../src/routes/customerAccessRoutes',
  ]);
  assert.equal(typeof createAppRouter().listen, 'undefined');
});
