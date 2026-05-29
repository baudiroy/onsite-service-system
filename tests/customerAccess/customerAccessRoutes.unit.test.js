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
    listenCalls: [],
    get(path, ...handlers) {
      this.routes.push({
        method: 'GET',
        path,
        handlers,
      });
      return this;
    },
    listen(...args) {
      this.listenCalls.push(args);
      throw new Error('synthetic route test must not start listener');
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

function expectedUnavailableEnvelope() {
  return {
    status: 'deny',
    messageKey: 'customerAccess.unavailable',
    customerVisible: false,
    data: null,
    error: {
      messageKey: 'customerAccess.unavailable',
    },
  };
}

async function dispatchSyntheticRoute(router, options) {
  const method = String(options.method || '').toUpperCase();
  const requestPath = options.path;

  for (const route of router.routes) {
    const params = route.method === method
      ? routePatternParams(route.path, requestPath)
      : undefined;

    if (!params) {
      continue;
    }

    const req = {
      ...(options.req || {}),
      params,
    };
    const result = await invokeRouteAsync(route, req);

    return {
      ...result,
      handlerInvoked: true,
      matched: true,
      params,
    };
  }

  return {
    body: expectedUnavailableEnvelope(),
    handlerInvoked: false,
    matched: false,
    params: {},
    res: {
      calls: {
        status: [404],
        json: [expectedUnavailableEnvelope()],
      },
    },
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
        caseNo: 'CASE-ROUTE-001',
        finalAppointmentId: 'appt_final_route_001',
        publicReportId: 'report_public_route_001',
        status: 'available',
        summary: 'Customer-safe case overview route summary',
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
    publication_allowed: true,
    publication_state: 'published',
    customer_visible_policy_passed: true,
    customer_visible: true,
    case_display_id: 'CASE-ROUTE-001',
    service_status_display: 'Completed',
    appointment_window: '2026-05-23 10:00-12:00',
    engineer_display_name: 'Engineer Route',
    approved_service_summary: 'Customer-safe route summary',
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
  'case_query_override',
  'case_body_override',
  'case_header_override',
  'case_cookie_override',
  'raw request stack should not leak',
  'select secret_should_not_leak',
  'Bearer token_should_not_leak',
  'raw_request_should_not_leak',
  'raw_headers_should_not_leak',
  'raw_body_should_not_leak',
  'raw_cookie_should_not_leak',
  'raw_auth_should_not_leak',
  'raw_user_should_not_leak',
  'raw_session_should_not_leak',
  'raw_channel_should_not_leak',
  'raw_access_should_not_leak',
  'provider_payload_should_not_leak',
  'debug_sql_should_not_leak',
  'raw_path_param_should_not_leak',
  'raw_query_value_should_not_leak',
  'raw_body_value_should_not_leak',
  'raw_header_value_should_not_leak',
  'raw_cookie_value_should_not_leak',
  'raw_session_value_should_not_leak',
  'raw_stack_should_not_leak',
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

function expectedRegistrationSummary() {
  return {
    registered: true,
    routes: [
      {
        method: 'GET',
        path: CUSTOMER_ACCESS_ROUTE_PATH,
      },
      {
        method: 'GET',
        path: CUSTOMER_ACCESS_REPORT_ROUTE_PATH,
      },
    ],
  };
}

function expectedRegistrationFailure(reasonCode = 'mount_target_invalid') {
  return {
    registered: false,
    messageKey: 'customerAccess.unavailable',
    customerVisible: false,
    reasonCode,
  };
}

function routeKey(route) {
  return `${route.method} ${route.path}`;
}

function summaryRouteKeys(summary) {
  return summary.routes.map(routeKey);
}

function registeredRouteKeys(router) {
  return router.routes.map(routeKey);
}

function assertNoDuplicateRouteKeys(keys) {
  assert.equal(new Set(keys).size, keys.length, `duplicate route keys: ${keys.join(', ')}`);
}

function assertSummaryMatchesRegisteredRoutes(summary, router) {
  const summaryKeys = summaryRouteKeys(summary);
  const registeredKeys = registeredRouteKeys(router);

  assert.deepEqual(summaryKeys, [
    'GET /customer-access/:caseId',
    'GET /customer-access/:caseId/service-report/:reportId',
  ]);
  assert.deepEqual(registeredKeys, summaryKeys);
  assertNoDuplicateRouteKeys(summaryKeys);
  assertNoDuplicateRouteKeys(registeredKeys);
  assert.equal(
    registeredKeys.some((key) => key.includes('/__internal/customer-access')),
    false,
  );
}

function assertNoRouteRegistrationSummaryLeak(summary) {
  const serialized = JSON.stringify(summary);

  assert.equal(typeof summary.get, 'undefined');
  assert.equal(typeof summary.handler, 'undefined');
  assert.equal(typeof summary.router, 'undefined');
  assert.equal(typeof summary.route, 'undefined');
  assert.equal(typeof summary.dbClient, 'undefined');
  assert.equal(typeof summary.options, 'undefined');

  for (const forbidden of [
    'function',
    'handler',
    'raw_router_should_not_leak',
    'raw_route_should_not_leak',
    'raw_adapter_result_should_not_leak',
    'request_should_not_leak',
    'headers_should_not_leak',
    'cookies_should_not_leak',
    'body_should_not_leak',
    'query_should_not_leak',
    'params_should_not_leak',
    'user_should_not_leak',
    'session_should_not_leak',
    'db_client_should_not_leak',
    'query_function_source_should_not_leak',
    'postgres://user:password@localhost/customer_access_should_not_leak',
    'zeabur_should_not_leak',
    'provider_should_not_leak',
    'projection_service_should_not_leak',
    'projection_function_source_should_not_leak',
    'facade_function_source_should_not_leak',
    'raw_target_should_not_leak',
    'debug_should_not_leak',
    'internal_should_not_leak',
    'Bearer token_should_not_leak',
    'select secret_should_not_leak',
    'route registration stack should not leak',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `route registration summary leaked ${forbidden}`);
  }
}

test('exports registerCustomerAccessRoutes', () => {
  assert.equal(typeof registerCustomerAccessRoutes, 'function');
});

test('registers customer access and service report GET routes on synthetic router', () => {
  const router = createSyntheticRouter();

  const summary = registerCustomerAccessRoutes(router);

  assert.deepEqual(summary, expectedRegistrationSummary());
  assertSummaryMatchesRegisteredRoutes(summary, router);
  assert.deepEqual(router.listenCalls, []);
  assertNoRouteRegistrationSummaryLeak(summary);
});

test('registration summary cross-checks exactly with synthetic mounted dispatch table', () => {
  const router = createSyntheticRouter();
  router.rawTarget = 'raw_target_should_not_leak';
  router.rawRouter = 'raw_router_should_not_leak';
  const dbClient = createSyntheticDbClient([reportRow()]);
  dbClient.rawDbClient = 'db_client_should_not_leak';
  dbClient.sql = 'select secret_should_not_leak';
  const options = {
    dbClient,
    projectionService() {
      throw new Error('projection_function_source_should_not_leak');
    },
    facade() {
      throw new Error('facade_function_source_should_not_leak');
    },
    zeaburEnv: 'zeabur_should_not_leak',
    providerDebug: 'provider_should_not_leak',
    internalDebug: 'internal_should_not_leak',
    headers: {
      authorization: 'Bearer token_should_not_leak',
    },
  };

  const summary = registerCustomerAccessRoutes(router, options);

  assert.deepEqual(summary, expectedRegistrationSummary());
  assertSummaryMatchesRegisteredRoutes(summary, router);
  assert.equal(router.routes.length, 2);
  assert.equal(router.routes.every((route) => route.handlers.length === 2), true);
  assert.deepEqual(router.listenCalls, []);
  assertNoRouteRegistrationSummaryLeak(summary);
});

test('production mount readiness gate uses only injected get target and explicit dbClient', () => {
  const calls = {
    get: [],
    listen: [],
    post: [],
    use: [],
  };
  const productionReadyTarget = {
    rawTarget: 'raw_target_should_not_leak',
    get(path, ...handlers) {
      calls.get.push({
        path,
        handlers,
      });
      return this;
    },
    listen(...args) {
      calls.listen.push(args);
      throw new Error('production readiness guard must not start a listener');
    },
    post(...args) {
      calls.post.push(args);
      throw new Error('production readiness guard must not register POST routes');
    },
    use(...args) {
      calls.use.push(args);
      throw new Error('production readiness guard must not use global mounts');
    },
  };
  const dbClient = createSyntheticDbClient([reportRow()]);
  const summary = registerCustomerAccessRoutes(productionReadyTarget, {
    dbClient,
    repository: allowRepository(),
    providerDebug: 'provider_should_not_leak',
    zeaburEnv: 'zeabur_should_not_leak',
  });

  assert.deepEqual(summary, expectedRegistrationSummary());
  assert.deepEqual(calls.get.map((call) => call.path), [
    '/customer-access/:caseId',
    '/customer-access/:caseId/service-report/:reportId',
  ]);
  assert.equal(calls.get.every((call) => call.handlers.every((handler) => typeof handler === 'function')), true);
  assert.deepEqual(calls.listen, []);
  assert.deepEqual(calls.post, []);
  assert.deepEqual(calls.use, []);
  assert.equal(dbClient.calls.length, 0);
  assertSummaryMatchesRegisteredRoutes(summary, {
    routes: calls.get.map((call) => ({
      method: 'GET',
      path: call.path,
      handlers: call.handlers,
    })),
  });
  assertNoRouteRegistrationSummaryLeak(summary);
});

test('production mount readiness dependency failures stay sanitized before public route registration', () => {
  const malformedTargets = [
    undefined,
    null,
    {},
    { get: 'not function', rawTarget: 'raw_target_should_not_leak' },
  ];
  const malformedDbClients = [
    null,
    {},
    { query: 'not function' },
    {
      query: null,
      connectionString: 'postgres://user:password@localhost/customer_access_should_not_leak',
      sql: 'select secret_should_not_leak',
      token: 'Bearer token_should_not_leak',
    },
  ];

  for (const target of malformedTargets) {
    const summary = registerCustomerAccessRoutes(target, {
      dbClient: createSyntheticDbClient([reportRow()]),
    });

    assert.deepEqual(summary, expectedRegistrationFailure('mount_target_invalid'));
    assert.equal(typeof summary.routes, 'undefined');
    assertNoRouteRegistrationSummaryLeak(summary);
  }

  for (const dbClient of malformedDbClients) {
    const router = createSyntheticRouter();
    const summary = registerCustomerAccessRoutes(router, {
      dbClient,
      projectionService: 'projection_service_should_not_leak',
      providerDebug: 'provider_should_not_leak',
    });

    assert.deepEqual(summary, expectedRegistrationFailure('db_client_invalid'));
    assert.equal(router.routes.length, 0);
    assert.equal(typeof summary.routes, 'undefined');
    assertNoRouteRegistrationSummaryLeak(summary);
  }
});

test('failure summaries omit routes partial registrations and raw failure details', () => {
  const firstRouteThrow = {
    routes: [],
    get(path, ...handlers) {
      this.routes.push({
        method: 'GET',
        path,
        handlers,
        rawRoute: 'raw_route_should_not_leak',
      });
      throw new Error('first route select secret_should_not_leak Bearer token_should_not_leak');
    },
  };
  const secondRouteThrow = {
    routes: [],
    get(path, ...handlers) {
      this.routes.push({
        method: 'GET',
        path,
        handlers,
        rawRoute: 'raw_route_should_not_leak',
      });

      if (this.routes.length === 2) {
        throw new Error('second route debug_should_not_leak internal_should_not_leak');
      }

      return this;
    },
  };
  const cases = [
    {
      summary: registerCustomerAccessRoutes({
        rawTarget: 'raw_target_should_not_leak',
      }),
      registeredRoutes: [],
      reasonCode: 'mount_target_invalid',
    },
    {
      summary: registerCustomerAccessRoutes(createSyntheticRouter(), {
        dbClient: {
          query: 'not function',
          rawDbClient: 'db_client_should_not_leak',
          sql: 'select secret_should_not_leak',
        },
      }),
      registeredRoutes: [],
      reasonCode: 'db_client_invalid',
    },
    {
      summary: registerCustomerAccessRoutes(firstRouteThrow, {
        dbClient: createSyntheticDbClient([reportRow()]),
        projectionService: 'projection_service_should_not_leak',
      }),
      registeredRoutes: firstRouteThrow.routes,
      reasonCode: 'route_registration_failed',
    },
    {
      summary: registerCustomerAccessRoutes(secondRouteThrow, {
        dbClient: createSyntheticDbClient([reportRow()]),
        providerDebug: 'provider_should_not_leak',
      }),
      registeredRoutes: secondRouteThrow.routes,
      reasonCode: 'route_registration_failed',
    },
  ];

  for (const candidate of cases) {
    assert.deepEqual(candidate.summary, expectedRegistrationFailure(candidate.reasonCode));
    assert.equal(typeof candidate.summary.routes, 'undefined');
    assertNoRouteRegistrationSummaryLeak(candidate.summary);
    assertNoRouteRegistrationSummaryLeak({
      summary: candidate.summary,
    });

    for (const route of candidate.registeredRoutes) {
      assert.equal(typeof route.handlers, 'object');
    }
  }
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

test('synthetic mounted router dispatches both accepted customer access routes without server listener', async () => {
  const router = createSyntheticRouter();
  const dbClient = createSyntheticDbClient([reportRow()]);
  const summary = registerCustomerAccessRoutes(router, {
    dbClient,
    repository: allowRepository(),
  });

  const baseRouteResult = invokeRoute(
    router.routes[0],
    {
      params: {
        caseId: 'case_route_001',
      },
      query: {
        caseId: 'case_query_override',
      },
      body: {
        rawBody: 'raw_body_should_not_leak',
      },
      headers: {
        authorization: 'Bearer token_should_not_leak',
      },
      cookies: {
        session: 'raw_cookie_should_not_leak',
      },
      customerAccessContextInput: authorizedContextInput(),
    },
  );
  const reportRouteResult = await invokeRouteAsync(
    router.routes[1],
    {
      params: {
        caseId: 'case_route_001',
        reportId: 'report_public_route_001',
      },
      request: {
        raw: 'raw_request_should_not_leak',
      },
      rawHeaders: ['raw_headers_should_not_leak'],
      query: {
        reportId: 'report_query_alias_should_not_win',
      },
      body: {
        provider_payload: 'provider_payload_should_not_leak',
      },
      headers: {
        authorization: 'Bearer token_should_not_leak',
      },
      cookies: {
        session: 'raw_cookie_should_not_leak',
      },
      auth: {
        raw: 'raw_auth_should_not_leak',
      },
      user: {
        raw: 'raw_user_should_not_leak',
      },
      session: {
        raw: 'raw_session_should_not_leak',
      },
      channel: {
        raw: 'raw_channel_should_not_leak',
      },
      access: {
        raw: 'raw_access_should_not_leak',
      },
      debug: {
        sql: 'debug_sql_should_not_leak',
      },
      customerAccessContextInput: authorizedContextInput(),
    },
  );

  assert.deepEqual(summary, expectedRegistrationSummary());
  assert.deepEqual(router.listenCalls, []);
  assert.deepEqual(router.routes.map((route) => `${route.method} ${route.path}`), [
    'GET /customer-access/:caseId',
    'GET /customer-access/:caseId/service-report/:reportId',
  ]);
  assert.equal(baseRouteResult.nextCallCount, 1);
  assert.deepEqual(baseRouteResult.res.calls.status, [200]);
  assert.equal(baseRouteResult.body.status, 'allow');
  assert.equal(reportRouteResult.nextCallCount, 1);
  assert.deepEqual(reportRouteResult.res.calls.status, [200]);
  assert.equal(reportRouteResult.body.status, 'allow');
  assert.equal(dbClient.calls.length, 1);
  assert.deepEqual(dbClient.calls[0].values, [
    'org_route_001',
    'customer_route_001',
    'case_route_001',
    'report_public_route_001',
  ]);
  assertSafeResponse(baseRouteResult.body);
  assertSafeResponse(reportRouteResult.body);
  assertSafeResponse(dbClient.calls[0]);
});

test('synthetic public route dispatch is strict for method path and internal route isolation', async () => {
  const router = createSyntheticRouter();
  const dbClient = createSyntheticDbClient([reportRow()]);

  registerCustomerAccessRoutes(router, {
    dbClient,
    repository: allowRepository(),
  });

  const acceptedCase = await dispatchSyntheticRoute(router, {
    method: 'GET',
    path: '/customer-access/case_route_001',
    req: {
      customerAccessContextInput: authorizedContextInput(),
    },
  });
  const acceptedReport = await dispatchSyntheticRoute(router, {
    method: 'GET',
    path: '/customer-access/case_route_001/service-report/report_public_route_001',
    req: {
      customerAccessContextInput: authorizedContextInput(),
    },
  });

  assert.equal(acceptedCase.matched, true);
  assert.equal(acceptedCase.handlerInvoked, true);
  assert.deepEqual(acceptedCase.res.calls.status, [200]);
  assert.equal(acceptedCase.body.status, 'allow');
  assert.deepEqual(acceptedCase.params, { caseId: 'case_route_001' });
  assert.equal(acceptedReport.matched, true);
  assert.equal(acceptedReport.handlerInvoked, true);
  assert.deepEqual(acceptedReport.res.calls.status, [200]);
  assert.equal(acceptedReport.body.status, 'allow');
  assert.deepEqual(acceptedReport.params, {
    caseId: 'case_route_001',
    reportId: 'report_public_route_001',
  });
  assert.equal(dbClient.calls.length, 1);

  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']) {
    for (const path of [
      '/customer-access/case_route_001',
      '/customer-access/case_route_001/service-report/report_public_route_001',
    ]) {
      const blocked = await dispatchSyntheticRoute(router, {
        method,
        path,
        req: {
          body: {
            raw: 'raw_body_value_should_not_leak',
          },
          headers: {
            authorization: 'raw_header_value_should_not_leak',
          },
          query: {
            caseId: 'raw_query_value_should_not_leak',
          },
          cookies: {
            session: 'raw_cookie_value_should_not_leak',
          },
          session: {
            token: 'raw_session_value_should_not_leak',
          },
        },
      });

      assert.equal(blocked.matched, false);
      assert.equal(blocked.handlerInvoked, false);
      assert.deepEqual(blocked.res.calls.status, [404]);
      assert.deepEqual(blocked.body, expectedUnavailableEnvelope());
      assertSafeResponse(blocked.body);
    }
  }

  const dbCallsAfterMethodChecks = dbClient.calls.length;

  for (const path of [
    '/customer-access',
    '/customer-access/case_route_001/',
    '/customer-access/case_route_001/extra',
    '/customer-access/case_route_001/service-report',
    '/customer-access/case_route_001/service-report/',
    '/customer-access/case_route_001/service-report/report_public_route_001/',
    '/customer-access/case_route_001/service-report/report_public_route_001/extra',
    '/customer-access/case_route_001/service_reports/report_public_route_001',
    '/customer-access/case_route_001/reports/report_public_route_001',
    '/customer-access/case_route_001/service-report/report_public_route_001/download',
    '/customer-access/raw_path_param_should_not_leak/service-report',
    '/__internal/customer-access/service-reports/case_route_001/report_public_route_001',
  ]) {
    const blocked = await dispatchSyntheticRoute(router, {
      method: 'GET',
      path,
      req: {
        query: {
          caseId: 'raw_query_value_should_not_leak',
          reportId: 'raw_query_value_should_not_leak',
        },
        body: {
          caseId: 'raw_body_value_should_not_leak',
          reportId: 'raw_body_value_should_not_leak',
        },
        headers: {
          'x-case-id': 'raw_header_value_should_not_leak',
          'x-report-id': 'raw_header_value_should_not_leak',
        },
        cookies: {
          caseId: 'raw_cookie_value_should_not_leak',
          reportId: 'raw_cookie_value_should_not_leak',
        },
        debug: {
          stack: 'raw_stack_should_not_leak',
        },
      },
    });

    assert.equal(blocked.matched, false);
    assert.equal(blocked.handlerInvoked, false);
    assert.deepEqual(blocked.res.calls.status, [404]);
    assert.deepEqual(blocked.body, expectedUnavailableEnvelope());
    assertSafeResponse(blocked.body);
  }

  assert.equal(dbClient.calls.length, dbCallsAfterMethodChecks);
  assertSummaryMatchesRegisteredRoutes(expectedRegistrationSummary(), router);
});

test('invalid or missing router returns sanitized failure without external side effect', () => {
  for (const candidate of [
    undefined,
    null,
    {},
    { get: 'not function' },
    {
      rawRouter: 'raw_router_should_not_leak',
      route: {
        raw: 'raw_route_should_not_leak',
      },
      request: {
        headers: 'headers_should_not_leak',
      },
      dbClient: {
        secret: 'db_client_should_not_leak',
      },
    },
  ]) {
    const summary = registerCustomerAccessRoutes(candidate);

    assert.deepEqual(summary, expectedRegistrationFailure('mount_target_invalid'));
    assertNoRouteRegistrationSummaryLeak(summary);
  }
});

test('route registration summary never exposes raw router handler route or dependency objects', () => {
  const router = createSyntheticRouter();
  router.rawRouter = 'raw_router_should_not_leak';
  router.routeObject = {
    raw: 'raw_route_should_not_leak',
  };
  router.request = {
    headers: 'headers_should_not_leak',
    cookies: 'cookies_should_not_leak',
    body: 'body_should_not_leak',
    query: 'query_should_not_leak',
    params: 'params_should_not_leak',
    user: 'user_should_not_leak',
    session: 'session_should_not_leak',
  };
  const options = {
    dbClient: createSyntheticDbClient([reportRow()]),
    providerDebug: 'provider_should_not_leak',
    internalDebug: 'internal_should_not_leak',
    zeaburEnv: 'zeabur_should_not_leak',
    adapterResult: {
      raw: 'raw_adapter_result_should_not_leak',
    },
  };

  const summary = registerCustomerAccessRoutes(router, options);

  assert.deepEqual(summary, expectedRegistrationSummary());
  assert.deepEqual(Object.keys(summary).sort(), ['registered', 'routes'].sort());
  assert.deepEqual(summary.routes.map((route) => Object.keys(route).sort()), [
    ['method', 'path'],
    ['method', 'path'],
  ]);
  assert.equal(router.routes.length, 2);
  assert.equal(typeof router.routes[0].handlers[0], 'function');
  assert.equal(typeof router.routes[1].handlers[1], 'function');
  assertNoRouteRegistrationSummaryLeak(summary);
});

test('route registration does not execute injected dbClient or projectionService dependencies', () => {
  const router = createSyntheticRouter();
  const dbClient = {
    calls: [],
    query() {
      this.calls.push('query');
      throw new Error('query function should not run during registration');
    },
    connectionString: 'postgres://user:password@localhost/customer_access_should_not_leak',
    queryFunctionSource: 'query_function_source_should_not_leak',
  };
  let projectionServiceCalls = 0;
  const projectionService = () => {
    projectionServiceCalls += 1;
    throw new Error('projection_service_should_not_leak');
  };

  const summary = registerCustomerAccessRoutes(router, {
    dbClient,
    projectionService,
    providerDebug: 'provider_should_not_leak',
    zeaburEnv: 'zeabur_should_not_leak',
  });

  assert.deepEqual(summary, expectedRegistrationSummary());
  assert.equal(dbClient.calls.length, 0);
  assert.equal(projectionServiceCalls, 0);
  assert.equal(router.routes.length, 2);
  assertNoRouteRegistrationSummaryLeak(summary);
});

test('explicit malformed dbClient returns sanitized failure without route registration or raw leak', () => {
  for (const candidate of [
    null,
    {},
    { query: 'not function' },
    {
      query: null,
      connectionString: 'postgres://user:password@localhost/customer_access_should_not_leak',
      token: 'Bearer token_should_not_leak',
      sql: 'select secret_should_not_leak',
      providerDebug: 'provider_should_not_leak',
    },
  ]) {
    const router = createSyntheticRouter();
    const summary = registerCustomerAccessRoutes(router, {
      dbClient: candidate,
      projectionService: {
        raw: 'projection_service_should_not_leak',
      },
    });

    assert.deepEqual(summary, expectedRegistrationFailure('db_client_invalid'));
    assert.equal(router.routes.length, 0);
    assertNoRouteRegistrationSummaryLeak(summary);
  }
});

test('throwing dbClient dependency getters fail closed without raw leak', () => {
  const throwingDbClientOptions = {};
  Object.defineProperty(throwingDbClientOptions, 'dbClient', {
    get() {
      throw new Error('db_client_should_not_leak');
    },
  });
  const throwingQueryDbClient = {};
  Object.defineProperty(throwingQueryDbClient, 'query', {
    get() {
      throw new Error('query_function_source_should_not_leak');
    },
  });

  for (const options of [
    throwingDbClientOptions,
    { dbClient: throwingQueryDbClient },
  ]) {
    const router = createSyntheticRouter();
    const summary = registerCustomerAccessRoutes(router, options);

    assert.deepEqual(summary, expectedRegistrationFailure('db_client_invalid'));
    assert.equal(router.routes.length, 0);
    assertNoRouteRegistrationSummaryLeak(summary);
  }
});

test('route registration failure returns sanitized summary without raw thrown error leak', () => {
  const throwError = new Error(
    'route registration stack should not leak select secret_should_not_leak Bearer token_should_not_leak provider_should_not_leak debug_should_not_leak internal_should_not_leak',
  );
  throwError.stack = 'route registration stack should not leak\nat select secret_should_not_leak';
  const router = {
    get() {
      throw throwError;
    },
    rawRouter: 'raw_router_should_not_leak',
    dbClient: {
      secret: 'db_client_should_not_leak',
    },
  };

  const summary = registerCustomerAccessRoutes(router, {
    dbClient: createSyntheticDbClient([reportRow()]),
  });

  assert.deepEqual(summary, expectedRegistrationFailure('route_registration_failed'));
  assertNoRouteRegistrationSummaryLeak(summary);
});

test('first route registration failure returns atomic sanitized failure without partial route leak', () => {
  const throwError = new Error(
    'first route failed select secret_should_not_leak Bearer token_should_not_leak provider_should_not_leak debug_should_not_leak internal_should_not_leak',
  );
  throwError.stack = 'first route stack should not leak\nat select secret_should_not_leak';
  const router = {
    routes: [],
    get(path, ...handlers) {
      this.routes.push({
        method: 'GET',
        path,
        handlers,
        rawRoute: 'raw_route_should_not_leak',
      });
      throw throwError;
    },
    rawRouter: 'raw_router_should_not_leak',
  };

  const summary = registerCustomerAccessRoutes(router, {
    dbClient: createSyntheticDbClient([reportRow()]),
  });

  assert.deepEqual(summary, expectedRegistrationFailure('route_registration_failed'));
  assert.equal(router.routes.length, 1);
  assert.equal(typeof summary.routes, 'undefined');
  assertNoRouteRegistrationSummaryLeak(summary);
});

test('second route registration failure returns atomic sanitized failure without partial route leak', () => {
  const throwError = new Error(
    'second route failed select secret_should_not_leak Bearer token_should_not_leak provider_should_not_leak debug_should_not_leak internal_should_not_leak',
  );
  throwError.stack = 'second route stack should not leak\nat select secret_should_not_leak';
  const router = {
    routes: [],
    get(path, ...handlers) {
      this.routes.push({
        method: 'GET',
        path,
        handlers,
        rawRoute: 'raw_route_should_not_leak',
      });

      if (this.routes.length === 2) {
        throw throwError;
      }

      return this;
    },
    rawRouter: 'raw_router_should_not_leak',
  };

  const summary = registerCustomerAccessRoutes(router, {
    dbClient: createSyntheticDbClient([reportRow()]),
    providerDebug: 'provider_should_not_leak',
    internalDebug: 'internal_should_not_leak',
  });

  assert.deepEqual(summary, expectedRegistrationFailure('route_registration_failed'));
  assert.equal(router.routes.length, 2);
  assert.equal(typeof summary.routes, 'undefined');
  assertNoRouteRegistrationSummaryLeak(summary);
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

test('case overview route allows only params caseId with middleware customerAccessContext DTO', () => {
  const router = createSyntheticRouter();
  registerCustomerAccessRoutes(router);

  const { body, nextCallCount, res } = invokeRoute(
    router.routes[0],
    {
      params: {
        caseId: 'case_route_001',
      },
      query: {
        caseId: 'case_query_override',
      },
      body: {
        caseId: 'case_body_override',
      },
      headers: {
        'x-case-id': 'case_header_override',
      },
      cookies: {
        caseId: 'case_cookie_override',
      },
      customerAccessContextInput: authorizedContextInput(),
    },
  );

  assert.equal(nextCallCount, 1);
  assert.deepEqual(res.calls.status, [200]);
  assert.equal(body.status, 'allow');
  assert.deepEqual(body.data, {
    serviceReport: {
      caseNo: 'CASE-ROUTE-001',
      finalAppointmentId: 'appt_final_route_001',
      publicReportId: 'report_public_route_001',
      status: 'available',
      summary: 'Customer-safe case overview route summary',
    },
  });
  assertSafeResponse(body);
});

test('case overview route rejects query body header cookie caseId aliases when route param is absent', () => {
  const router = createSyntheticRouter();
  registerCustomerAccessRoutes(router);

  const { body, nextCallCount, res } = invokeRoute(
    router.routes[0],
    {
      params: {},
      query: {
        caseId: 'case_query_override',
      },
      body: {
        caseId: 'case_body_override',
      },
      headers: {
        'x-case-id': 'case_header_override',
      },
      cookies: {
        caseId: 'case_cookie_override',
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
  assertSafeResponse(body);
});

test('case overview route malformed caseId returns safe-deny without raw value leak', () => {
  const router = createSyntheticRouter();
  registerCustomerAccessRoutes(router);

  for (const candidate of [
    '',
    '   ',
    {},
    [],
    123,
    true,
    new Date('2026-05-30T00:00:00.000Z'),
    new Error('raw request stack should not leak'),
    Buffer.from('case_route_001'),
    { then() {} },
    "case_route_001' or '1'='1",
    'case_route_001; select secret_should_not_leak',
    'Bearer token_should_not_leak',
  ]) {
    const { body, nextCallCount, res } = invokeRoute(
      router.routes[0],
      {
        params: {
          caseId: candidate,
        },
        customerAccessContextInput: authorizedContextInput(),
      },
    );

    assert.equal(nextCallCount, 1);
    assert.deepEqual(res.calls.status, [404]);
    assert.equal(body.status, 'deny');
    assertSafeResponse(body);
  }
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

test('service report route uses only caseId and reportId route params for projection lookup', async () => {
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
      query: {
        caseId: 'case_query_alias_should_not_win',
        reportId: 'report_query_alias_should_not_win',
        public_report_id: 'report_query_public_alias_should_not_win',
      },
      body: {
        case_id: 'case_body_alias_should_not_win',
        report_id: 'report_body_alias_should_not_win',
        public_report_id: 'report_body_public_alias_should_not_win',
      },
      headers: {
        'x-case-id': 'case_header_alias_should_not_win',
        'x-report-id': 'report_header_alias_should_not_win',
        authorization: 'route_authorization_should_not_pass',
      },
      cookies: {
        public_report_id: 'report_cookie_alias_should_not_win',
        session: 'route_cookie_should_not_pass',
      },
      customerAccessContextInput: authorizedContextInput(),
    },
  );

  assert.equal(nextCallCount, 1);
  assert.deepEqual(res.calls.status, [200]);
  assert.equal(body.status, 'allow');
  assert.equal(dbClient.calls.length, 1);
  assert.deepEqual(dbClient.calls[0].values, [
    'org_route_001',
    'customer_route_001',
    'case_route_001',
    'report_public_route_001',
  ]);
  assertSafeResponse(body);
  assertSafeResponse(dbClient.calls[0]);
});

test('service report route rejects missing malformed or alias-only identifiers before projection query', async () => {
  for (const params of [
    { caseId: 'case_route_001' },
    { reportId: 'report_public_route_001' },
    { caseId: '', reportId: 'report_public_route_001' },
    { caseId: 'case_route_001', reportId: '' },
    { caseId: "case_route_001' or '1'='1", reportId: 'report_public_route_001' },
    { caseId: 'case_route_001', reportId: 'report_public_route_001;select secret_should_not_leak' },
    { caseId: 'Bearer token_should_not_leak', reportId: 'report_public_route_001' },
  ]) {
    const router = createSyntheticRouter();
    const dbClient = createSyntheticDbClient([reportRow()]);
    registerCustomerAccessRoutes(router, { dbClient, repository: allowRepository() });

    const { body, nextCallCount, res } = await invokeRouteAsync(
      router.routes[1],
      {
        params,
        query: {
          caseId: 'case_query_alias_should_not_win',
          reportId: 'report_query_alias_should_not_win',
        },
        body: {
          caseId: 'case_body_alias_should_not_win',
          reportId: 'report_body_alias_should_not_win',
        },
        headers: {
          'x-case-id': 'case_header_alias_should_not_win',
          'x-report-id': 'report_header_alias_should_not_win',
          authorization: 'Bearer token_should_not_leak',
        },
        cookies: {
          caseId: 'case_cookie_override',
          reportId: 'report_cookie_alias_should_not_win',
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
    assert.equal(dbClient.calls.length, 0);
    assertSafeResponse(body);
  }
});

test('service report route not found projection returns sanitized unavailable without existence leak', async () => {
  const router = createSyntheticRouter();
  const dbClient = createSyntheticDbClient([]);

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
