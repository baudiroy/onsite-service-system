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
    '../engineerMobile/engineerMobilePermissionMiddleware',
    '../engineerMobile/engineerMobileTaskListService',
  ].sort());
  assert.equal(specifiers.some((specifier) => /db|pool|repositories?|transaction|provider|line|sms|email|push|ai|rag|vector/i.test(specifier)), false);
  assert.doesNotMatch(controllerSource + routeSource, /app\.listen|createServer|server\.listen/);
});
