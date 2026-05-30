'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  CUSTOMER_ACCESS_REPORT_ROUTE_PATH,
  CUSTOMER_ACCESS_ROUTE_PATH,
} = require('../../src/routes/customerAccessRoutes');
const {
  createCustomerAccessProductionMountComposition,
} = require('../../src/customerAccess/customerAccessProductionMountCompositionAdapter');

const forbiddenValues = [
  'raw_router_should_not_leak',
  'raw_db_client_should_not_leak',
  'raw_repository_should_not_leak',
  'raw_audit_writer_should_not_leak',
  'raw_options_should_not_leak',
  'authorization_header_should_not_leak',
  'route_registration_stack_should_not_leak',
  'postgres://user:password@localhost/customer_access_should_not_leak',
  'select secret_should_not_leak',
  'Bearer token_should_not_leak',
  'DATABASE_URL_should_not_leak',
  'provider_should_not_leak',
  'debug_should_not_leak',
  'internal_should_not_leak',
  'private_should_not_leak',
  'function_source_should_not_leak',
];

function expectedSuccessSummary() {
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

function expectedFailureSummary(reasonCode) {
  return {
    registered: false,
    messageKey: 'customerAccess.unavailable',
    customerVisible: false,
    reasonCode,
  };
}

function createSyntheticRouter() {
  return {
    routes: [],
    listenCalls: [],
    rawRouter: 'raw_router_should_not_leak',
    authorization: 'authorization_header_should_not_leak',
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
      throw new Error('listener must not start');
    },
  };
}

function createSyntheticDbClient() {
  return {
    calls: [],
    rawDbClient: 'raw_db_client_should_not_leak',
    sql: 'select secret_should_not_leak',
    env: 'DATABASE_URL_should_not_leak',
    query(querySpec) {
      this.calls.push(querySpec);

      return { rows: [] };
    },
  };
}

function createSyntheticRepository() {
  return {
    rawRepository: 'raw_repository_should_not_leak',
    providerDebug: 'provider_should_not_leak',
    internalNote: 'internal_should_not_leak',
    privateField: 'private_should_not_leak',
    getOrganizationScope() {
      return { available: false };
    },
    getVerifiedCustomerIdentity() {
      return { available: false };
    },
    getCaseLinkage() {
      return { available: false };
    },
    getPublicationState() {
      return { available: false };
    },
    getCustomerVisibleProjection() {
      return { available: false, data: {} };
    },
  };
}

function assertNoSummaryLeak(summary) {
  const serialized = JSON.stringify(summary);

  for (const value of forbiddenValues) {
    assert.equal(serialized.includes(value), false, `summary leaked ${value}`);
  }

  assert.equal(Object.prototype.hasOwnProperty.call(summary, 'router'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(summary, 'dbClient'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(summary, 'repository'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(summary, 'auditWriter'), false);
}

function waitForAuditSideChannel() {
  return new Promise((resolve) => {
    setImmediate(resolve);
  });
}

test('exports production mount composition factory', () => {
  assert.equal(typeof createCustomerAccessProductionMountComposition, 'function');
});

test('valid composition registers existing customer access routes with injected router and dbClient only', () => {
  const router = createSyntheticRouter();
  const dbClient = createSyntheticDbClient();

  const summary = createCustomerAccessProductionMountComposition({
    router,
    dbClient,
    repository: createSyntheticRepository(),
  });

  assert.deepEqual(summary, expectedSuccessSummary());
  assert.deepEqual(router.routes.map((route) => `${route.method} ${route.path}`), [
    `GET ${CUSTOMER_ACCESS_ROUTE_PATH}`,
    `GET ${CUSTOMER_ACCESS_REPORT_ROUTE_PATH}`,
  ]);
  assert.equal(router.routes.every((route) => route.handlers.every((handler) => typeof handler === 'function')), true);
  assert.deepEqual(router.listenCalls, []);
  assert.equal(dbClient.calls.length, 0);
  assertNoSummaryLeak(summary);
});

test('optional auditWriter preserves route-registration side-channel without changing summary output', async () => {
  const auditEvents = [];
  const summary = createCustomerAccessProductionMountComposition({
    router: createSyntheticRouter(),
    dbClient: createSyntheticDbClient(),
    repository: createSyntheticRepository(),
    auditWriter(auditEvent) {
      auditEvents.push(auditEvent);

      return {
        ok: true,
        status: 'recorded',
        auditWritten: true,
        persisted: true,
        rawAuditWriter: 'raw_audit_writer_should_not_leak',
      };
    },
  });

  await waitForAuditSideChannel();

  assert.deepEqual(summary, expectedSuccessSummary());
  assert.equal(auditEvents.length, 2);
  assert.deepEqual(auditEvents.map((event) => event.route), [
    CUSTOMER_ACCESS_ROUTE_PATH,
    CUSTOMER_ACCESS_REPORT_ROUTE_PATH,
  ]);
  assert.equal(auditEvents.every((event) => event.eventType === 'customer_access.route_registration.success'), true);
  assert.equal(JSON.stringify(summary).includes('auditWritten'), false);
  assert.equal(JSON.stringify(summary).includes('persisted'), false);
  assertNoSummaryLeak(summary);
});

test('auditWriter failure does not alter registration summary or expose writer details', async () => {
  const summary = createCustomerAccessProductionMountComposition({
    router: createSyntheticRouter(),
    dbClient: createSyntheticDbClient(),
    repository: createSyntheticRepository(),
    auditWriter() {
      throw new Error('route_registration_stack_should_not_leak');
    },
  });

  await waitForAuditSideChannel();

  assert.deepEqual(summary, expectedSuccessSummary());
  assertNoSummaryLeak(summary);
});

test('missing or malformed router returns sanitized mount target failure', () => {
  const malformedRouters = [
    undefined,
    null,
    {},
    { get: 'not function', rawRouter: 'raw_router_should_not_leak' },
  ];

  for (const router of malformedRouters) {
    const summary = createCustomerAccessProductionMountComposition({
      router,
      dbClient: createSyntheticDbClient(),
      repository: createSyntheticRepository(),
    });

    assert.deepEqual(summary, expectedFailureSummary('mount_target_invalid'));
    assertNoSummaryLeak(summary);
  }
});

test('missing or malformed dbClient returns sanitized db client failure without registering routes', () => {
  const malformedDbClients = [
    undefined,
    null,
    {},
    {
      query: 'not function',
      rawDbClient: 'raw_db_client_should_not_leak',
      sql: 'select secret_should_not_leak',
      token: 'Bearer token_should_not_leak',
      connectionString: 'postgres://user:password@localhost/customer_access_should_not_leak',
    },
  ];

  for (const dbClient of malformedDbClients) {
    const router = createSyntheticRouter();
    const summary = createCustomerAccessProductionMountComposition({
      router,
      dbClient,
      repository: createSyntheticRepository(),
    });

    assert.deepEqual(summary, expectedFailureSummary('db_client_invalid'));
    assert.equal(router.routes.length, 0);
    assertNoSummaryLeak(summary);
  }
});

test('throwing router.get returns sanitized registration failure without raw error details', async () => {
  const auditEvents = [];
  const throwingRouter = {
    rawRouter: 'raw_router_should_not_leak',
    get() {
      throw new Error('route_registration_stack_should_not_leak select secret_should_not_leak');
    },
  };

  const summary = createCustomerAccessProductionMountComposition({
    router: throwingRouter,
    dbClient: createSyntheticDbClient(),
    repository: createSyntheticRepository(),
    auditWriter(auditEvent) {
      auditEvents.push(auditEvent);
    },
  });

  await waitForAuditSideChannel();

  assert.deepEqual(summary, expectedFailureSummary('route_registration_failed'));
  assert.equal(auditEvents.length, 1);
  assert.equal(auditEvents[0].eventType, 'customer_access.route_registration.failure');
  assert.equal(auditEvents[0].route, CUSTOMER_ACCESS_ROUTE_PATH);
  assertNoSummaryLeak(summary);
});

test('malformed input object does not leak dependencies and stays sanitized', () => {
  for (const input of [
    undefined,
    null,
    'not object',
    ['raw_router_should_not_leak'],
  ]) {
    const summary = createCustomerAccessProductionMountComposition(input);

    assert.deepEqual(summary, expectedFailureSummary('mount_target_invalid'));
    assertNoSummaryLeak(summary);
  }
});

test('repeated composition calls keep registration state isolated per injected router and dbClient', () => {
  const firstRouter = createSyntheticRouter();
  const secondRouter = createSyntheticRouter();
  const firstDbClient = createSyntheticDbClient();
  const secondDbClient = createSyntheticDbClient();

  const firstSummary = createCustomerAccessProductionMountComposition({
    router: firstRouter,
    dbClient: firstDbClient,
    repository: createSyntheticRepository(),
  });
  const secondSummary = createCustomerAccessProductionMountComposition({
    router: secondRouter,
    dbClient: secondDbClient,
    repository: createSyntheticRepository(),
  });

  assert.deepEqual(firstSummary, expectedSuccessSummary());
  assert.deepEqual(secondSummary, expectedSuccessSummary());
  assert.notEqual(firstSummary, secondSummary);
  assert.notEqual(firstSummary.routes, secondSummary.routes);
  assert.notEqual(firstRouter.routes, secondRouter.routes);
  assert.equal(firstRouter.routes.length, 2);
  assert.equal(secondRouter.routes.length, 2);
  assert.deepEqual(firstRouter.routes.map((route) => route.path), [
    CUSTOMER_ACCESS_ROUTE_PATH,
    CUSTOMER_ACCESS_REPORT_ROUTE_PATH,
  ]);
  assert.deepEqual(secondRouter.routes.map((route) => route.path), [
    CUSTOMER_ACCESS_ROUTE_PATH,
    CUSTOMER_ACCESS_REPORT_ROUTE_PATH,
  ]);
  assert.equal(firstDbClient.calls.length, 0);
  assert.equal(secondDbClient.calls.length, 0);
  assert.deepEqual(firstRouter.listenCalls, []);
  assert.deepEqual(secondRouter.listenCalls, []);
  assertNoSummaryLeak(firstSummary);
  assertNoSummaryLeak(secondSummary);
});

test('raw dependency sentinels from all injected inputs never appear in success summary', async () => {
  const auditEvents = [];
  const router = createSyntheticRouter();
  const dbClient = createSyntheticDbClient();
  const repository = createSyntheticRepository();

  const summary = createCustomerAccessProductionMountComposition({
    router,
    dbClient,
    repository,
    auditWriter(auditEvent) {
      auditEvents.push(auditEvent);

      return {
        ok: true,
        status: 'recorded',
        auditWritten: true,
        persisted: true,
        rawAuditWriter: 'raw_audit_writer_should_not_leak',
        token: 'Bearer token_should_not_leak',
      };
    },
    rawOptions: 'raw_options_should_not_leak',
    token: 'Bearer token_should_not_leak',
    sql: 'select secret_should_not_leak',
    env: 'DATABASE_URL_should_not_leak',
    provider: 'provider_should_not_leak',
    debug: 'debug_should_not_leak',
    internal: 'internal_should_not_leak',
    private: 'private_should_not_leak',
    functionSource() {
      throw new Error('function_source_should_not_leak');
    },
  });

  await waitForAuditSideChannel();

  assert.deepEqual(summary, expectedSuccessSummary());
  assert.equal(auditEvents.length, 2);
  assert.equal(JSON.stringify(summary).includes('auditWritten'), false);
  assertNoSummaryLeak(summary);
});

test('registration failure summaries remain exact and omit partial routes across dependency failures', () => {
  const firstRouteThrow = {
    routes: [],
    rawRouter: 'raw_router_should_not_leak',
    get(path, ...handlers) {
      this.routes.push({
        method: 'GET',
        path,
        handlers,
        rawRoute: 'raw_router_should_not_leak',
      });
      throw new Error('route_registration_stack_should_not_leak select secret_should_not_leak');
    },
  };
  const secondRouteThrow = {
    routes: [],
    rawRouter: 'raw_router_should_not_leak',
    get(path, ...handlers) {
      this.routes.push({
        method: 'GET',
        path,
        handlers,
        rawRoute: 'raw_router_should_not_leak',
      });

      if (this.routes.length === 2) {
        throw new Error('debug_should_not_leak internal_should_not_leak');
      }

      return this;
    },
  };
  const cases = [
    {
      summary: createCustomerAccessProductionMountComposition({
        router: { get: 'not function', rawRouter: 'raw_router_should_not_leak' },
        dbClient: createSyntheticDbClient(),
      }),
      reasonCode: 'mount_target_invalid',
    },
    {
      summary: createCustomerAccessProductionMountComposition({
        router: createSyntheticRouter(),
        dbClient: {
          query: 'not function',
          rawDbClient: 'raw_db_client_should_not_leak',
          sql: 'select secret_should_not_leak',
        },
      }),
      reasonCode: 'db_client_invalid',
    },
    {
      summary: createCustomerAccessProductionMountComposition({
        router: firstRouteThrow,
        dbClient: createSyntheticDbClient(),
      }),
      reasonCode: 'route_registration_failed',
    },
    {
      summary: createCustomerAccessProductionMountComposition({
        router: secondRouteThrow,
        dbClient: createSyntheticDbClient(),
      }),
      reasonCode: 'route_registration_failed',
    },
  ];

  for (const candidate of cases) {
    assert.deepEqual(candidate.summary, expectedFailureSummary(candidate.reasonCode));
    assert.equal(Object.prototype.hasOwnProperty.call(candidate.summary, 'routes'), false);
    assertNoSummaryLeak(candidate.summary);
  }
});
