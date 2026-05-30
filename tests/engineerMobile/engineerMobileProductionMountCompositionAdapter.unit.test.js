'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ENGINEER_MOBILE_TASKS_ROUTE_PATH,
} = require('../../src/routes/engineerMobileRoutes');
const {
  ENGINEER_MOBILE_TASK_DETAIL_ROUTE_PATH,
} = require('../../src/routes/engineerMobileTaskDetailRoutes');
const {
  ENGINEER_MOBILE_VISIT_ACTION_ROUTE_PATH,
} = require('../../src/routes/engineerMobileVisitActionRoutes');
const {
  ENGINEER_MOBILE_PRODUCTION_ROUTES,
  createEngineerMobileProductionMountComposition,
} = require('../../src/engineerMobile/engineerMobileProductionMountCompositionAdapter');
const {
  ENGINEER_MOBILE_AUDIT_EVENT_KEYS,
} = require('../../src/engineerMobile/engineerMobileAuditEventBuilder');

const forbiddenValues = [
  'raw_router_should_not_leak',
  'raw_db_client_should_not_leak',
  'raw_repository_should_not_leak',
  'raw_audit_writer_should_not_leak',
  'raw_provider_should_not_leak',
  'raw_error_should_not_leak',
  'raw_options_should_not_leak',
  'authorization_header_should_not_leak',
  'postgres://user:password@localhost/engineer_mobile_should_not_leak',
  'select secret_should_not_leak',
  'Bearer token_should_not_leak',
  'DATABASE_URL_should_not_leak',
  'private_note_should_not_leak',
  'final_appointment_should_not_leak',
];

function expectedSuccessSummary() {
  return {
    registered: true,
    module: 'engineerMobile',
    routes: [
      {
        method: 'GET',
        path: ENGINEER_MOBILE_TASKS_ROUTE_PATH,
      },
      {
        method: 'GET',
        path: ENGINEER_MOBILE_TASK_DETAIL_ROUTE_PATH,
      },
      {
        method: 'POST',
        path: ENGINEER_MOBILE_VISIT_ACTION_ROUTE_PATH,
      },
    ],
  };
}

function expectedFailureSummary(reasonCode) {
  return {
    registered: false,
    module: 'engineerMobile',
    messageKey: 'engineerMobile.unavailable',
    customerVisible: false,
    reasonCode,
  };
}

function createSyntheticRouter(overrides = {}) {
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
    post(path, ...handlers) {
      this.routes.push({
        method: 'POST',
        path,
        handlers,
      });

      return this;
    },
    listen(...args) {
      this.listenCalls.push(args);
      throw new Error('listener must not start');
    },
    ...overrides,
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
      throw new Error('DB query must not run during registration');
    },
  };
}

function createSyntheticRepository() {
  return {
    rawRepository: 'raw_repository_should_not_leak',
    privateNote: 'private_note_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    async listAssignedTasks() {
      throw new Error('repository must not be called during registration');
    },
    async getTaskDetail() {
      throw new Error('repository must not be called during registration');
    },
  };
}

function createSyntheticProviderSender() {
  return {
    rawProvider: 'raw_provider_should_not_leak',
    sends: [],
    send(payload) {
      this.sends.push(payload);
      throw new Error('provider send must not run during registration');
    },
  };
}

function assertNoSummaryLeak(summary) {
  const serialized = JSON.stringify(summary);

  for (const value of forbiddenValues) {
    assert.equal(serialized.includes(value), false, `summary leaked ${value}`);
  }

  for (const key of [
    'router',
    'dbClient',
    'repository',
    'auditWriter',
    'provider',
    'rawRouter',
    'rawDbClient',
    'rawRepository',
    'rawAuditWriter',
  ]) {
    assert.equal(Object.prototype.hasOwnProperty.call(summary, key), false);
  }
}

function assertNoAuditResultOutput(value) {
  const serialized = JSON.stringify(value);

  for (const auditField of [
    'auditEvent',
    'auditWritten',
    'persisted',
    'audit result',
    'audit_persistence_failed',
    'invalid_writer_result',
  ]) {
    assert.equal(serialized.includes(auditField), false, `summary leaked ${auditField}`);
  }
}

function assertRegistrationAuditEventBase(event, eventType, decision) {
  assert.equal(event.eventType, eventType);
  assert.equal(event.source, 'engineer_mobile_route_registration');
  assert.equal(event.decision, decision);
  assert.deepEqual(Object.keys(event).sort(), Object.keys(event)
    .filter((key) => ENGINEER_MOBILE_AUDIT_EVENT_KEYS.includes(key))
    .sort());
}

function waitForAuditSideChannel() {
  return new Promise((resolve) => {
    setImmediate(resolve);
  });
}

test('exports Engineer Mobile production mount composition factory and route summary constants', () => {
  assert.equal(typeof createEngineerMobileProductionMountComposition, 'function');
  assert.deepEqual(ENGINEER_MOBILE_PRODUCTION_ROUTES, expectedSuccessSummary().routes);
});

test('valid composition delegates to existing Engineer Mobile route registration boundaries', () => {
  const router = createSyntheticRouter();
  const dbClient = createSyntheticDbClient();
  const provider = createSyntheticProviderSender();

  const summary = createEngineerMobileProductionMountComposition({
    router,
    dbClient,
    repository: createSyntheticRepository(),
    visitActionAppointmentProvider: provider,
    provider,
  });

  assert.deepEqual(summary, expectedSuccessSummary());
  assert.deepEqual(router.routes.map((route) => `${route.method} ${route.path}`), [
    `GET ${ENGINEER_MOBILE_TASKS_ROUTE_PATH}`,
    `GET ${ENGINEER_MOBILE_TASK_DETAIL_ROUTE_PATH}`,
    `POST ${ENGINEER_MOBILE_VISIT_ACTION_ROUTE_PATH}`,
  ]);
  assert.equal(router.routes.every((route) => route.handlers.every((handler) => typeof handler === 'function')), true);
  assert.deepEqual(router.listenCalls, []);
  assert.equal(dbClient.calls.length, 0);
  assert.deepEqual(provider.sends, []);
  assertNoSummaryLeak(summary);
});

test('optional auditWriter is a side channel and does not change success summary', async () => {
  const auditEvents = [];
  const summary = createEngineerMobileProductionMountComposition({
    router: createSyntheticRouter(),
    dbClient: createSyntheticDbClient(),
    repository: createSyntheticRepository(),
    auditWriter(auditEvent) {
      auditEvents.push(auditEvent);

      return {
        ok: true,
        rawAuditWriter: 'raw_audit_writer_should_not_leak',
        persisted: true,
      };
    },
  });

  await waitForAuditSideChannel();

  assert.deepEqual(summary, expectedSuccessSummary());
  assert.deepEqual(auditEvents.map((event) => `${event.method} ${event.route}`), [
    `GET ${ENGINEER_MOBILE_TASKS_ROUTE_PATH}`,
    `GET ${ENGINEER_MOBILE_TASK_DETAIL_ROUTE_PATH}`,
    `POST ${ENGINEER_MOBILE_VISIT_ACTION_ROUTE_PATH}`,
  ]);
  for (const event of auditEvents) {
    assertRegistrationAuditEventBase(
      event,
      'engineer_mobile.route_registration.success',
      'success',
    );
    assert.deepEqual(event.metadata, {
      dependencyValid: true,
      registrationResult: 'success',
    });
    assert.equal(Object.prototype.hasOwnProperty.call(event, 'reasonCode'), false);
  }
  assert.equal(JSON.stringify(summary).includes('persisted'), false);
  assertNoSummaryLeak(summary);
  assertNoAuditResultOutput(summary);
});

test('auditWriter failure does not alter registration summary or expose writer details', async () => {
  const summary = createEngineerMobileProductionMountComposition({
    router: createSyntheticRouter(),
    dbClient: createSyntheticDbClient(),
    repository: createSyntheticRepository(),
    auditWriter() {
      throw new Error('raw_audit_writer_should_not_leak');
    },
  });

  await waitForAuditSideChannel();

  assert.deepEqual(summary, expectedSuccessSummary());
  assertNoSummaryLeak(summary);
  assertNoAuditResultOutput(summary);
});

test('object-shaped auditWriter is skipped and does not change success summary', async () => {
  const summary = createEngineerMobileProductionMountComposition({
    router: createSyntheticRouter(),
    dbClient: createSyntheticDbClient(),
    repository: createSyntheticRepository(),
    auditWriter: {
      record() {
        throw new Error('object_writer_should_not_be_called');
      },
    },
  });

  await waitForAuditSideChannel();

  assert.deepEqual(summary, expectedSuccessSummary());
  assertNoSummaryLeak(summary);
});

test('missing or malformed mount target returns sanitized failure without registration', () => {
  const malformedRouters = [
    undefined,
    null,
    {},
    { get: 'not function', post() {} },
    { get() {}, post: 'not function' },
    { get() {}, rawRouter: 'raw_router_should_not_leak' },
  ];

  for (const router of malformedRouters) {
    const dbClient = createSyntheticDbClient();
    const summary = createEngineerMobileProductionMountComposition({
      router,
      dbClient,
      repository: createSyntheticRepository(),
    });

    assert.deepEqual(summary, expectedFailureSummary('mount_target_invalid'));
    assert.equal(dbClient.calls.length, 0);
    assertNoSummaryLeak(summary);
  }
});

test('throwing mount target method returns sanitized registration failure and safe failure audit', async () => {
  const auditEvents = [];
  const router = createSyntheticRouter({
    get() {
      throw new Error('raw_error_should_not_leak');
    },
  });
  const dbClient = createSyntheticDbClient();

  const summary = createEngineerMobileProductionMountComposition({
    router,
    dbClient,
    repository: createSyntheticRepository(),
    auditWriter(event) {
      auditEvents.push(event);

      return {
        ok: true,
        status: 'recorded',
        auditWritten: true,
        persisted: true,
      };
    },
  });

  await waitForAuditSideChannel();

  assert.deepEqual(summary, expectedFailureSummary('route_registration_failed'));
  assert.equal(dbClient.calls.length, 0);
  assert.equal(auditEvents.length, 1);
  assertRegistrationAuditEventBase(
    auditEvents[0],
    'engineer_mobile.route_registration.failure',
    'failure',
  );
  assert.equal(auditEvents[0].route, ENGINEER_MOBILE_TASKS_ROUTE_PATH);
  assert.equal(auditEvents[0].method, 'GET');
  assert.equal(auditEvents[0].reasonCode, 'route_registration_failed');
  assert.deepEqual(auditEvents[0].metadata, {
    dependencyValid: false,
    registrationResult: 'failure',
  });
  assertNoSummaryLeak(summary);
  assertNoAuditResultOutput(summary);
});

test('missing mount target failure skips audit when no safe route is known', async () => {
  const auditEvents = [];
  const summary = createEngineerMobileProductionMountComposition({
    router: undefined,
    auditWriter(event) {
      auditEvents.push(event);
    },
  });

  await waitForAuditSideChannel();

  assert.deepEqual(summary, expectedFailureSummary('mount_target_invalid'));
  assert.equal(auditEvents.length, 0);
  assertNoSummaryLeak(summary);
});

test('invalid registration audit builder result skips writer and keeps summary unchanged', async () => {
  const builderPath = require.resolve('../../src/engineerMobile/engineerMobileAuditEventBuilder');
  const adapterPath = require.resolve('../../src/engineerMobile/engineerMobileProductionMountCompositionAdapter');
  const builderModule = require(builderPath);
  const originalBuilder = builderModule.buildEngineerMobileAuditEvent;

  try {
    builderModule.buildEngineerMobileAuditEvent = () => ({
      ok: false,
      reasonCode: 'invalid_route',
    });
    delete require.cache[adapterPath];
    const freshAdapter = require('../../src/engineerMobile/engineerMobileProductionMountCompositionAdapter');
    const auditEvents = [];
    const summary = freshAdapter.createEngineerMobileProductionMountComposition({
      router: createSyntheticRouter(),
      auditWriter(event) {
        auditEvents.push(event);
      },
    });

    await waitForAuditSideChannel();

    assert.deepEqual(summary, expectedSuccessSummary());
    assert.equal(auditEvents.length, 0);
    assertNoSummaryLeak(summary);
  } finally {
    builderModule.buildEngineerMobileAuditEvent = originalBuilder;
    delete require.cache[adapterPath];
    require('../../src/engineerMobile/engineerMobileProductionMountCompositionAdapter');
  }
});

test('importing adapter has no registration side effects', () => {
  const router = createSyntheticRouter();

  assert.deepEqual(router.routes, []);
  assert.deepEqual(router.listenCalls, []);
});
