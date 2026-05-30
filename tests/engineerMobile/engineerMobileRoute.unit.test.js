'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  buildEngineerMobileTaskListResponse,
  handleEngineerMobileTaskListRequest,
} = require('../../src/controllers/engineerMobileController');
const {
  ENGINEER_MOBILE_TASKS_ROUTE_PATH,
  registerEngineerMobileRoutes,
} = require('../../src/routes/engineerMobileRoutes');
const {
  ENGINEER_MOBILE_AUDIT_EVENT_KEYS,
} = require('../../src/engineerMobile/engineerMobileAuditEventBuilder');

const repoRoot = path.resolve(__dirname, '../..');
const controllerFile = path.join(repoRoot, 'src/controllers/engineerMobileController.js');
const routeFile = path.join(repoRoot, 'src/routes/engineerMobileRoutes.js');

function createRouter() {
  const registrations = [];

  return {
    registrations,
    get(pathname, ...handlers) {
      registrations.push({
        handlers,
        method: 'GET',
        path: pathname,
      });
      return this;
    },
  };
}

function createResponse() {
  return {
    statusCode: undefined,
    body: undefined,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function auth(overrides = {}) {
  return {
    engineerId: 'eng_engineer_mobile_route_001',
    organizationId: 'org_engineer_mobile_route_001',
    permissions: ['engineer_mobile.tasks.read'],
    role: 'engineer',
    userId: 'user_engineer_mobile_route_001',
    ...overrides,
  };
}

function task(overrides = {}) {
  return {
    caseId: 'case_route_001',
    appointmentId: 'apt_route_001',
    organizationId: 'org_engineer_mobile_route_001',
    assignedEngineerId: 'eng_engineer_mobile_route_001',
    scheduledStart: '2026-05-21T09:00:00+08:00',
    status: 'confirmed',
    customerNameMasked: '林○○',
    customerPhoneMasked: '09xx-xxx-456',
    addressSummary: '新北市板橋區',
    productSummary: '冰箱',
    issueSummary: '異音',
    internalNote: 'internal_note_should_not_leak',
    auditLog: 'audit_log_should_not_leak',
    aiRawPayload: 'ai_raw_payload_should_not_leak',
    billingInternal: 'billing_internal_should_not_leak',
    settlementInternal: 'settlement_internal_should_not_leak',
    rawPhone: 'raw_phone_should_not_leak',
    rawAddress: 'raw_address_should_not_leak',
    rawLineUserId: 'line_user_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    ...overrides,
  };
}

function assertNoForbiddenOutput(value) {
  const serialized = JSON.stringify(value);

  for (const forbiddenValue of [
    'internal_note_should_not_leak',
    'audit_log_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'billing_internal_should_not_leak',
    'settlement_internal_should_not_leak',
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
    'final_appointment_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbiddenValue), false, `leaked ${forbiddenValue}`);
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
    assert.equal(serialized.includes(auditField), false, `leaked ${auditField}`);
  }
}

async function invokeTaskListRoute(options, req) {
  const router = createRouter();
  registerEngineerMobileRoutes(router, options);
  const res = createResponse();
  const [permissionMiddleware, controllerHandler] = router.registrations[0].handlers;

  await permissionMiddleware(req, res, () => controllerHandler(req, res));

  return res;
}

function assertTaskListAuditEventBase(event, eventType, decision) {
  assert.equal(event.eventType, eventType);
  assert.equal(event.route, '/engineer-mobile/tasks');
  assert.equal(event.method, 'GET');
  assert.equal(event.source, 'engineer_mobile_task_list_handler');
  assert.equal(event.decision, decision);
  assert.deepEqual(Object.keys(event).sort(), Object.keys(event)
    .filter((key) => ENGINEER_MOBILE_AUDIT_EVENT_KEYS.includes(key))
    .sort());
}

function requireSpecifiers(source) {
  const specifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers;
}

test('route exports registerEngineerMobileRoutes and path constant', () => {
  assert.equal(typeof registerEngineerMobileRoutes, 'function');
  assert.equal(ENGINEER_MOBILE_TASKS_ROUTE_PATH, '/engineer-mobile/tasks');
});

test('registers GET /engineer-mobile/tasks', () => {
  const router = createRouter();

  registerEngineerMobileRoutes(router, { readModel: { tasks: [] } });

  assert.equal(router.registrations.length, 1);
  assert.equal(router.registrations[0].method, 'GET');
  assert.equal(router.registrations[0].path, '/engineer-mobile/tasks');
  assert.equal(router.registrations[0].handlers.length, 2);
  assert.equal(typeof router.registrations[0].handlers[0], 'function');
  assert.equal(typeof router.registrations[0].handlers[1], 'function');
});

test('missing auth returns generic forbidden response', () => {
  const response = buildEngineerMobileTaskListResponse({}, {
    readModel: {
      tasks: [task()],
    },
  });

  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, {
    status: 'deny',
    messageKey: 'engineerMobile.forbidden',
    tasks: [],
  });
  assertNoForbiddenOutput(response.body);
});

test('valid auth and injected readModel returns safe assigned tasks', () => {
  const response = buildEngineerMobileTaskListResponse({
    auth: auth(),
    query: {
      from: '2026-05-21',
      to: '2026-05-22',
    },
  }, {
    readModel: {
      tasks: [
        task({ caseId: 'case_allowed' }),
        task({ caseId: 'case_wrong_org', organizationId: 'org_other' }),
        task({ caseId: 'case_wrong_engineer', assignedEngineerId: 'eng_other' }),
      ],
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'allow');
  assert.deepEqual(response.body.tasks.map((entry) => entry.caseId), ['case_allowed']);
  assertNoForbiddenOutput(response.body);
});

test('route handler uses injected options and response helper', () => {
  const router = createRouter();
  registerEngineerMobileRoutes(router, {
    readModel: {
      tasks: [task({ caseId: 'case_route_handler' })],
    },
  });
  const res = createResponse();
  const req = {
    auth: auth(),
    query: {},
  };
  const [permissionMiddleware, controllerHandler] = router.registrations[0].handlers;

  permissionMiddleware(req, res, () => controllerHandler(req, res));

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.tasks.map((entry) => entry.caseId), ['case_route_handler']);
  assertNoForbiddenOutput(res.body);
});

test('route handler awaits async read model when provided', async () => {
  const router = createRouter();
  const providerCalls = [];
  registerEngineerMobileRoutes(router, {
    async readModelAsync(input) {
      providerCalls.push(input);
      return {
        tasks: [task({ caseId: 'case_async_route_handler' })],
      };
    },
  });
  const res = createResponse();
  const req = {
    auth: auth(),
    query: {},
  };
  const [permissionMiddleware, controllerHandler] = router.registrations[0].handlers;

  await permissionMiddleware(req, res, () => controllerHandler(req, res));

  assert.deepEqual(providerCalls, [{
    organizationId: 'org_engineer_mobile_route_001',
    engineerId: 'eng_engineer_mobile_route_001',
    dateRange: undefined,
  }]);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.tasks.map((entry) => entry.caseId), ['case_async_route_handler']);
  assertNoForbiddenOutput(res.body);
});

test('task list allow response writes one sanitized audit event without changing response', async () => {
  const auditEvents = [];
  const response = await invokeTaskListRoute({
    readModel: {
      tasks: [task({ caseId: 'case_audit_allow' })],
    },
    auditWriter(event) {
      auditEvents.push(event);

      return {
        ok: true,
        status: 'recorded',
        auditWritten: true,
        persisted: true,
      };
    },
  }, {
    auth: auth(),
    query: {
      from: '2026-05-21',
      to: '2026-05-22',
    },
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, {
    status: 'allow',
    tasks: [task({ caseId: 'case_audit_allow' })].map((entry) => ({
      caseId: entry.caseId,
      appointmentId: entry.appointmentId,
      scheduledStart: entry.scheduledStart,
      status: entry.status,
      customerNameMasked: entry.customerNameMasked,
      customerPhoneMasked: entry.customerPhoneMasked,
      addressSummary: entry.addressSummary,
      productSummary: entry.productSummary,
      issueSummary: entry.issueSummary,
    })),
  });
  assert.equal(auditEvents.length, 1);
  assertTaskListAuditEventBase(
    auditEvents[0],
    'engineer_mobile.task_list.allow',
    'allow',
  );
  assert.equal(auditEvents[0].organizationId, 'org_engineer_mobile_route_001');
  assert.equal(auditEvents[0].engineerId, 'eng_engineer_mobile_route_001');
  assert.deepEqual(auditEvents[0].metadata, {
    routeMatched: true,
    contextPresent: true,
    identifierValid: true,
    permissionPassed: true,
  });
  assert.equal(Object.prototype.hasOwnProperty.call(auditEvents[0], 'reasonCode'), false);
  assertNoForbiddenOutput(auditEvents[0]);
  assertNoAuditResultOutput(response.body);
});

test('task list permission deny writes one deny audit event without changing safe response', async () => {
  const auditEvents = [];
  const response = await invokeTaskListRoute({
    readModel: {
      tasks: [task({ caseId: 'case_audit_denied' })],
    },
    auditWriter(event) {
      auditEvents.push(event);

      return {
        ok: true,
        status: 'recorded',
        auditWritten: true,
        persisted: true,
      };
    },
  }, {
    auth: {
      engineerId: 'eng_engineer_mobile_route_001',
      organizationId: 'org_engineer_mobile_route_001',
      role: 'engineer',
      userId: 'user_engineer_mobile_route_001',
    },
    query: {},
  });

  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, {
    status: 'deny',
    messageKey: 'engineerMobile.unavailable',
    data: null,
  });
  assert.equal(auditEvents.length, 1);
  assertTaskListAuditEventBase(
    auditEvents[0],
    'engineer_mobile.task_list.deny',
    'deny',
  );
  assert.equal(auditEvents[0].reasonCode, 'engineerMobile.unavailable');
  assert.deepEqual(auditEvents[0].metadata, {
    routeMatched: true,
    contextPresent: true,
    identifierValid: true,
    permissionPassed: false,
  });
  assertNoForbiddenOutput(auditEvents[0]);
  assertNoAuditResultOutput(response.body);
});

test('task list handler deny writes one deny audit event without leaking raw provider failure', () => {
  const auditEvents = [];
  const res = createResponse();

  handleEngineerMobileTaskListRequest({
    auth: auth(),
    query: {},
  }, res, {
    taskProvider: {
      listTasks() {
        throw new Error('select token_should_not_leak from provider_debug');
      },
    },
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

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, {
    status: 'deny',
    messageKey: 'engineerMobile.forbidden',
    tasks: [],
  });
  assert.equal(auditEvents.length, 1);
  assertTaskListAuditEventBase(
    auditEvents[0],
    'engineer_mobile.task_list.deny',
    'deny',
  );
  assert.equal(auditEvents[0].reasonCode, 'engineerMobile.unavailable');
  assert.equal(JSON.stringify(auditEvents[0]).includes('provider_debug'), false);
  assertNoForbiddenOutput(res.body);
  assertNoAuditResultOutput(res.body);
});

test('missing or malformed auditWriter skips audit and preserves task list response', async () => {
  const expected = await invokeTaskListRoute({
    readModel: {
      tasks: [task({ caseId: 'case_no_writer' })],
    },
  }, {
    auth: auth(),
    query: {},
  });
  const malformed = await invokeTaskListRoute({
    readModel: {
      tasks: [task({ caseId: 'case_no_writer' })],
    },
    auditWriter: {
      record() {
        throw new Error('object_writer_should_not_be_called');
      },
    },
  }, {
    auth: auth(),
    query: {},
  });

  assert.equal(malformed.statusCode, expected.statusCode);
  assert.deepEqual(malformed.body, expected.body);
  assertNoAuditResultOutput(malformed.body);
});

test('audit writer failures and malformed results do not change task list response', async () => {
  for (const auditWriter of [
    () => {
      throw new Error('stack token sql provider debug should not leak');
    },
    () => Promise.reject(new Error('reject token sql provider debug should not leak')),
    () => ({ ok: true, status: 'recorded', auditWritten: false, persisted: false }),
  ]) {
    const response = await invokeTaskListRoute({
      readModel: {
        tasks: [task({ caseId: 'case_writer_failure' })],
      },
      auditWriter,
    }, {
      auth: auth(),
      query: {},
    });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body.tasks.map((entry) => entry.caseId), ['case_writer_failure']);
    assert.equal(JSON.stringify(response.body).includes('provider debug'), false);
    assertNoForbiddenOutput(response.body);
    assertNoAuditResultOutput(response.body);
  }
});

test('audit event excludes raw request context and provider sentinels', async () => {
  const auditEvents = [];
  const response = await invokeTaskListRoute({
    readModel: {
      tasks: [task({
        caseId: 'case_non_leakage',
        rawProviderPayload: 'provider_payload_should_not_leak',
      })],
    },
    auditWriter(event) {
      auditEvents.push(event);

      return {
        ok: true,
        status: 'recorded',
        auditWritten: true,
        persisted: true,
      };
    },
  }, {
    auth: {
      ...auth(),
      rawSession: 'session_should_not_leak',
      token: 'token_should_not_leak',
      privateNote: 'private_should_not_leak',
    },
    headers: {
      authorization: 'bearer token_should_not_leak',
      cookie: 'cookie_should_not_leak',
    },
    rawHeaders: ['authorization', 'token_should_not_leak'],
    body: {
      debug: 'debug_should_not_leak',
    },
    query: {
      from: '2026-05-21',
      sql: 'select secret_should_not_leak',
    },
    params: {
      raw: 'params_should_not_leak',
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(auditEvents.length, 1);
  assertNoForbiddenOutput(auditEvents[0]);
  for (const forbiddenValue of [
    'provider_payload_should_not_leak',
    'session_should_not_leak',
    'private_should_not_leak',
    'cookie_should_not_leak',
    'params_should_not_leak',
    'debug_should_not_leak',
  ]) {
    assert.equal(JSON.stringify(auditEvents[0]).includes(forbiddenValue), false);
  }
  assertNoAuditResultOutput(response.body);
});

test('invalid audit event builder result skips writer and preserves response', () => {
  const builderPath = require.resolve('../../src/engineerMobile/engineerMobileAuditEventBuilder');
  const controllerPath = require.resolve('../../src/controllers/engineerMobileController');
  const builderModule = require(builderPath);
  const originalBuilder = builderModule.buildEngineerMobileAuditEvent;

  try {
    builderModule.buildEngineerMobileAuditEvent = () => ({
      ok: false,
      reasonCode: 'invalid_route',
    });
    delete require.cache[controllerPath];
    const freshController = require('../../src/controllers/engineerMobileController');
    const auditEvents = [];
    const res = createResponse();

    freshController.handleEngineerMobileTaskListRequest({
      auth: auth(),
      query: {},
    }, res, {
      readModel: {
        tasks: [task({ caseId: 'case_builder_invalid' })],
      },
      auditWriter(event) {
        auditEvents.push(event);
      },
    });

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.tasks.map((entry) => entry.caseId), ['case_builder_invalid']);
    assert.equal(auditEvents.length, 0);
    assertNoAuditResultOutput(res.body);
  } finally {
    builderModule.buildEngineerMobileAuditEvent = originalBuilder;
    delete require.cache[controllerPath];
    require('../../src/controllers/engineerMobileController');
  }
});

test('handle function returns safe deny without raw internal reason', () => {
  const res = createResponse();

  handleEngineerMobileTaskListRequest({
    auth: {},
    query: {},
  }, res, {
    taskProvider: {
      listTasks() {
        throw new Error('internal provider failure should not leak');
      },
    },
  });

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, {
    status: 'deny',
    messageKey: 'engineerMobile.forbidden',
    tasks: [],
  });
  assert.equal(JSON.stringify(res.body).includes('internal provider failure'), false);
});

test('controller and route source import no DB, repository, provider, notification, AI, or RAG modules', () => {
  const controllerSource = fs.readFileSync(controllerFile, 'utf8');
  const routeSource = fs.readFileSync(routeFile, 'utf8');
  const specifiers = [
    ...requireSpecifiers(controllerSource),
    ...requireSpecifiers(routeSource),
  ];

  assert.deepEqual(specifiers.sort(), [
    '../controllers/engineerMobileController',
    '../engineerMobile/engineerMobileAuditEventBuilder',
    '../engineerMobile/engineerMobileAuditWriterAdapter',
    '../engineerMobile/engineerMobilePermissionMiddleware',
    '../engineerMobile/engineerMobileTaskListService',
  ].sort());
  assert.equal(specifiers.some((specifier) => /db|pool|repositories?|transaction|provider|line|sms|email|push|ai|rag|vector/i.test(specifier)), false);
  assert.doesNotMatch(controllerSource + routeSource, /app\.listen|createServer|server\.listen/);
});
