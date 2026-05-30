'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  ENGINEER_MOBILE_TASK_DETAIL_ROUTE_PATH,
  registerEngineerMobileTaskDetailRoutes,
} = require('../../src/routes/engineerMobileTaskDetailRoutes');
const {
  ENGINEER_MOBILE_AUDIT_EVENT_KEYS,
} = require('../../src/engineerMobile/engineerMobileAuditEventBuilder');

const repoRoot = path.resolve(__dirname, '../..');
const routeFile = path.join(repoRoot, 'src/routes/engineerMobileTaskDetailRoutes.js');
const controllerFile = path.join(repoRoot, 'src/controllers/engineerMobileTaskDetailController.js');

function createSyntheticRouter() {
  const calls = [];

  return {
    calls,
    get(pathname, ...handlers) {
      calls.push({
        handlers,
        method: 'get',
        pathname,
      });

      return this;
    },
  };
}

function createResponse() {
  return {
    jsonCalls: [],
    statusCalls: [],
    status(statusCode) {
      this.statusCalls.push(statusCode);
      return this;
    },
    json(body) {
      this.jsonCalls.push(body);
      return this;
    },
  };
}

function auth(overrides = {}) {
  return {
    organizationId: 'org_engineer_mobile_detail_route_001',
    userId: 'user_engineer_mobile_detail_route_001',
    engineerId: 'eng_engineer_mobile_detail_route_001',
    role: 'engineer',
    permissions: ['engineer_mobile.tasks.read'],
    ...overrides,
  };
}

function task(overrides = {}) {
  return {
    appointmentId: 'apt_engineer_mobile_detail_route_001',
    caseId: 'case_engineer_mobile_detail_route_001',
    organizationId: 'org_engineer_mobile_detail_route_001',
    assignedEngineerId: 'eng_engineer_mobile_detail_route_001',
    scheduledStart: '2026-05-21T09:00:00+08:00',
    status: 'confirmed',
    customerNameMasked: '許○○',
    customerPhoneMasked: '09xx-xxx-987',
    addressSummary: '桃園市中壢區',
    productSummary: '冷氣',
    issueSummary: '不冷',
    siteNoteSafe: '請先聯絡管理室',
    evidenceRefs: [
      {
        id: 'safe_ref_001',
        type: 'photo',
        label: '故障照片',
        token: 'evidence_token_should_not_leak',
      },
    ],
    internalNote: 'internal_note_should_not_leak',
    auditLog: 'audit_log_should_not_leak',
    aiRawPayload: 'ai_raw_payload_should_not_leak',
    billingInternal: 'billing_internal_should_not_leak',
    settlementInternal: 'settlement_internal_should_not_leak',
    rawPhone: 'raw_phone_should_not_leak',
    rawAddress: 'raw_address_should_not_leak',
    rawLineUserId: 'line_user_should_not_leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    DATABASE_URL: 'DATABASE_URL_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    ...overrides,
  };
}

function request(overrides = {}) {
  return {
    auth: auth(),
    body: {
      organizationId: 'body_org_should_not_leak',
      engineerId: 'body_engineer_should_not_leak',
      rawPhone: 'body_raw_phone_should_not_leak',
    },
    params: {
      appointmentId: 'apt_engineer_mobile_detail_route_001',
    },
    ...overrides,
  };
}

function registerRoute(options = {}) {
  const router = createSyntheticRouter();

  registerEngineerMobileTaskDetailRoutes(router, options);

  assert.equal(router.calls.length, 1);
  return router.calls[0];
}

function invokeRoute(route, req) {
  const res = createResponse();
  let index = 0;

  function next() {
    index += 1;
    const handler = route.handlers[index];

    if (handler) {
      return handler(req, res, next);
    }

    return undefined;
  }

  route.handlers[0](req, res, next);

  return {
    req,
    res,
  };
}

async function invokeRouteAsync(route, req) {
  const res = createResponse();
  let index = 0;

  async function next() {
    index += 1;
    const handler = route.handlers[index];

    if (handler) {
      return handler(req, res, next);
    }

    return undefined;
  }

  await route.handlers[0](req, res, next);

  return {
    req,
    res,
  };
}

function assertNoForbiddenOutput(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'body_org_should_not_leak',
    'body_engineer_should_not_leak',
    'body_raw_phone_should_not_leak',
    'internal_note_should_not_leak',
    'audit_log_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'billing_internal_should_not_leak',
    'settlement_internal_should_not_leak',
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'DATABASE_URL_should_not_leak',
    'final_appointment_should_not_leak',
    'evidence_token_should_not_leak',
    'rawPhone',
    'rawAddress',
    'rawLineUserId',
    'finalAppointmentId',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
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

function assertTaskDetailAuditEventBase(event, eventType, decision) {
  assert.equal(event.eventType, eventType);
  assert.equal(event.route, '/engineer-mobile/tasks/:appointmentId');
  assert.equal(event.method, 'GET');
  assert.equal(event.source, 'engineer_mobile_task_detail_handler');
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

test('route exports register function and detail path', () => {
  assert.equal(ENGINEER_MOBILE_TASK_DETAIL_ROUTE_PATH, '/engineer-mobile/tasks/:appointmentId');
  assert.equal(typeof registerEngineerMobileTaskDetailRoutes, 'function');
});

test('registers GET detail route with permission middleware before controller', () => {
  const route = registerRoute();

  assert.equal(route.method, 'get');
  assert.equal(route.pathname, '/engineer-mobile/tasks/:appointmentId');
  assert.equal(route.handlers.length, 2);
  assert.match(route.handlers[0].name, /engineerMobileTaskDetailPermissionMiddleware/);
  assert.match(route.handlers[1].name, /engineerMobileTaskDetailHandler/);
});

test('missing auth and permission denied before provider', () => {
  for (const req of [{}, request({ auth: auth({ permissions: [] }) })]) {
    const providerCalls = [];
    const route = registerRoute({
      readModel(input) {
        providerCalls.push(input);
        return { tasks: [task()] };
      },
    });
    const { res } = invokeRoute(route, req);

    assert.deepEqual(providerCalls, []);
    assert.deepEqual(res.statusCalls, [403]);
    assertNoForbiddenOutput(res.jsonCalls[0]);
  }
});

test('valid engineer auth and matching task returns HTTP 200 detail', () => {
  const route = registerRoute({
    readModel() {
      return { tasks: [task()] };
    },
  });
  const { res } = invokeRoute(route, request());

  assert.deepEqual(res.statusCalls, [200]);
  assert.equal(res.jsonCalls[0].status, 'allow');
  assert.equal(res.jsonCalls[0].detail.appointmentId, 'apt_engineer_mobile_detail_route_001');
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('task detail allow response writes one sanitized audit event without changing response', () => {
  const auditEvents = [];
  const route = registerRoute({
    readModel() {
      return { tasks: [task({ caseId: 'case_detail_audit_allow' })] };
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
  const { res } = invokeRoute(route, request());

  assert.deepEqual(res.statusCalls, [200]);
  assert.equal(res.jsonCalls[0].status, 'allow');
  assert.equal(res.jsonCalls[0].detail.caseId, 'case_detail_audit_allow');
  assert.equal(auditEvents.length, 1);
  assertTaskDetailAuditEventBase(
    auditEvents[0],
    'engineer_mobile.task_detail.allow',
    'allow',
  );
  assert.equal(auditEvents[0].appointmentId, 'apt_engineer_mobile_detail_route_001');
  assert.equal(auditEvents[0].organizationId, 'org_engineer_mobile_detail_route_001');
  assert.equal(auditEvents[0].engineerId, 'eng_engineer_mobile_detail_route_001');
  assert.deepEqual(auditEvents[0].metadata, {
    routeMatched: true,
    contextPresent: true,
    identifierValid: true,
    permissionPassed: true,
  });
  assert.equal(Object.prototype.hasOwnProperty.call(auditEvents[0], 'reasonCode'), false);
  assertNoForbiddenOutput(auditEvents[0]);
  assertNoAuditResultOutput(res.jsonCalls[0]);
});

test('valid engineer auth and async matching task returns HTTP 200 detail', async () => {
  const providerCalls = [];
  const route = registerRoute({
    async readModelAsync(input) {
      providerCalls.push(input);
      return { task: task({ caseId: 'case_async_detail_route' }) };
    },
  });
  const { res } = await invokeRouteAsync(route, request());

  assert.deepEqual(providerCalls, [{
    appointmentId: 'apt_engineer_mobile_detail_route_001',
    engineerId: 'eng_engineer_mobile_detail_route_001',
    organizationId: 'org_engineer_mobile_detail_route_001',
  }]);
  assert.deepEqual(res.statusCalls, [200]);
  assert.equal(res.jsonCalls[0].status, 'allow');
  assert.equal(res.jsonCalls[0].detail.caseId, 'case_async_detail_route');
  assertNoForbiddenOutput(res.jsonCalls[0]);
});

test('wrong org engineer or appointment returns generic unavailable', () => {
  for (const sourceTask of [
    task({ organizationId: 'org_other' }),
    task({ assignedEngineerId: 'eng_other' }),
    task({ appointmentId: 'apt_other' }),
  ]) {
    const route = registerRoute({
      readModel() {
        return { tasks: [sourceTask] };
      },
    });
    const { res } = invokeRoute(route, request());

    assert.deepEqual(res.statusCalls, [404]);
    assert.deepEqual(res.jsonCalls[0], {
      detail: null,
      messageKey: 'engineerMobile.taskDetailUnavailable',
      status: 'deny',
    });
    assertNoForbiddenOutput(res.jsonCalls[0]);
  }
});

test('task detail safe deny writes one deny audit event without leaking raw provider detail', () => {
  const auditEvents = [];
  const route = registerRoute({
    readModel() {
      return {
        tasks: [
          task({
            appointmentId: 'apt_other',
            rawProviderPayload: 'provider_payload_should_not_leak',
          }),
        ],
      };
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
  const { res } = invokeRoute(route, request());

  assert.deepEqual(res.statusCalls, [404]);
  assert.deepEqual(res.jsonCalls[0], {
    detail: null,
    messageKey: 'engineerMobile.taskDetailUnavailable',
    status: 'deny',
  });
  assert.equal(auditEvents.length, 1);
  assertTaskDetailAuditEventBase(
    auditEvents[0],
    'engineer_mobile.task_detail.deny',
    'deny',
  );
  assert.equal(auditEvents[0].appointmentId, 'apt_engineer_mobile_detail_route_001');
  assert.equal(auditEvents[0].reasonCode, 'engineerMobile.unavailable');
  assert.deepEqual(auditEvents[0].metadata, {
    routeMatched: true,
    contextPresent: true,
    identifierValid: true,
    permissionPassed: false,
  });
  assert.equal(JSON.stringify(auditEvents[0]).includes('provider_payload_should_not_leak'), false);
  assertNoForbiddenOutput(auditEvents[0]);
  assertNoAuditResultOutput(res.jsonCalls[0]);
});

test('task detail permission deny writes one deny audit event before provider', () => {
  const auditEvents = [];
  const providerCalls = [];
  const route = registerRoute({
    readModel(input) {
      providerCalls.push(input);
      return { tasks: [task()] };
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
  const { res } = invokeRoute(route, request({
    auth: auth({ permissions: [] }),
  }));

  assert.deepEqual(providerCalls, []);
  assert.deepEqual(res.statusCalls, [403]);
  assert.equal(auditEvents.length, 1);
  assertTaskDetailAuditEventBase(
    auditEvents[0],
    'engineer_mobile.task_detail.deny',
    'deny',
  );
  assert.equal(auditEvents[0].appointmentId, 'apt_engineer_mobile_detail_route_001');
  assert.equal(auditEvents[0].reasonCode, 'engineerMobile.unavailable');
  assertNoForbiddenOutput(res.jsonCalls[0]);
  assertNoAuditResultOutput(res.jsonCalls[0]);
});

test('missing or malformed auditWriter skips audit and preserves detail allow and deny responses', () => {
  const expectedAllowRoute = registerRoute({
    readModel() {
      return { tasks: [task({ caseId: 'case_no_writer_detail' })] };
    },
  });
  const malformedAllowRoute = registerRoute({
    readModel() {
      return { tasks: [task({ caseId: 'case_no_writer_detail' })] };
    },
    auditWriter: {
      record() {
        throw new Error('object_writer_should_not_be_called');
      },
    },
  });
  const expectedAllow = invokeRoute(expectedAllowRoute, request()).res;
  const malformedAllow = invokeRoute(malformedAllowRoute, request()).res;

  assert.deepEqual(malformedAllow.statusCalls, expectedAllow.statusCalls);
  assert.deepEqual(malformedAllow.jsonCalls, expectedAllow.jsonCalls);

  const expectedDenyRoute = registerRoute({
    readModel() {
      return { tasks: [task({ appointmentId: 'apt_other' })] };
    },
  });
  const malformedDenyRoute = registerRoute({
    readModel() {
      return { tasks: [task({ appointmentId: 'apt_other' })] };
    },
    auditWriter: {
      write() {
        throw new Error('object_writer_should_not_be_called');
      },
    },
  });
  const expectedDeny = invokeRoute(expectedDenyRoute, request()).res;
  const malformedDeny = invokeRoute(malformedDenyRoute, request()).res;

  assert.deepEqual(malformedDeny.statusCalls, expectedDeny.statusCalls);
  assert.deepEqual(malformedDeny.jsonCalls, expectedDeny.jsonCalls);
  assertNoAuditResultOutput(malformedAllow.jsonCalls[0]);
  assertNoAuditResultOutput(malformedDeny.jsonCalls[0]);
});

test('audit writer failures and malformed results do not change task detail response', () => {
  for (const auditWriter of [
    () => {
      throw new Error('stack token sql provider debug should not leak');
    },
    () => Promise.reject(new Error('reject token sql provider debug should not leak')),
    () => ({ ok: true, status: 'recorded', auditWritten: false, persisted: false }),
  ]) {
    const route = registerRoute({
      readModel() {
        return { tasks: [task({ caseId: 'case_detail_writer_failure' })] };
      },
      auditWriter,
    });
    const { res } = invokeRoute(route, request());

    assert.deepEqual(res.statusCalls, [200]);
    assert.equal(res.jsonCalls[0].detail.caseId, 'case_detail_writer_failure');
    assert.equal(JSON.stringify(res.jsonCalls[0]).includes('provider debug'), false);
    assertNoForbiddenOutput(res.jsonCalls[0]);
    assertNoAuditResultOutput(res.jsonCalls[0]);
  }
});

test('audit event excludes raw request context and task detail provider sentinels', () => {
  const auditEvents = [];
  const route = registerRoute({
    readModel() {
      return {
        tasks: [
          task({
            rawProviderPayload: 'provider_payload_should_not_leak',
          }),
        ],
      };
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
  const { res } = invokeRoute(route, request({
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
    params: {
      appointmentId: 'apt_engineer_mobile_detail_route_001',
      raw: 'params_should_not_leak',
    },
    query: {
      sql: 'select secret_should_not_leak',
    },
  }));

  assert.deepEqual(res.statusCalls, [200]);
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
  assertNoAuditResultOutput(res.jsonCalls[0]);
});

test('invalid task detail audit event builder result skips writer and preserves response', () => {
  const builderPath = require.resolve('../../src/engineerMobile/engineerMobileAuditEventBuilder');
  const controllerPath = require.resolve('../../src/controllers/engineerMobileTaskDetailController');
  const builderModule = require(builderPath);
  const originalBuilder = builderModule.buildEngineerMobileAuditEvent;

  try {
    builderModule.buildEngineerMobileAuditEvent = () => ({
      ok: false,
      reasonCode: 'invalid_route',
    });
    delete require.cache[controllerPath];
    const freshController = require('../../src/controllers/engineerMobileTaskDetailController');
    const auditEvents = [];
    const res = createResponse();

    freshController.handleEngineerMobileTaskDetailRequest(request(), res, {
      readModel() {
        return { tasks: [task({ caseId: 'case_detail_builder_invalid' })] };
      },
      auditWriter(event) {
        auditEvents.push(event);
      },
    });

    assert.deepEqual(res.statusCalls, [200]);
    assert.equal(res.jsonCalls[0].detail.caseId, 'case_detail_builder_invalid');
    assert.equal(auditEvents.length, 0);
    assertNoAuditResultOutput(res.jsonCalls[0]);
  } finally {
    builderModule.buildEngineerMobileAuditEvent = originalBuilder;
    delete require.cache[controllerPath];
    require('../../src/controllers/engineerMobileTaskDetailController');
  }
});

test('customer service and AI role denied before provider', () => {
  for (const role of ['customer_service', 'ai']) {
    const providerCalls = [];
    const route = registerRoute({
      readModel(input) {
        providerCalls.push(input);
        return { tasks: [task()] };
      },
    });
    const { res } = invokeRoute(route, request({
      auth: auth({ role }),
    }));

    assert.deepEqual(providerCalls, []);
    assert.deepEqual(res.statusCalls, [403]);
  }
});

test('invalid or missing router safe no-op', () => {
  assert.equal(registerEngineerMobileTaskDetailRoutes(undefined), undefined);
  assert.deepEqual(registerEngineerMobileTaskDetailRoutes({}), {});
});

test('route and controller import boundaries are safe', () => {
  const routeSource = fs.readFileSync(routeFile, 'utf8');
  const controllerSource = fs.readFileSync(controllerFile, 'utf8');

  assert.deepEqual(requireSpecifiers(routeSource), [
    '../controllers/engineerMobileTaskDetailController',
    '../engineerMobile/engineerMobilePermissionMiddleware',
  ]);
  assert.deepEqual(requireSpecifiers(controllerSource), [
    '../engineerMobile/engineerMobileTaskDetailService',
    '../engineerMobile/engineerMobileAuditEventBuilder',
    '../engineerMobile/engineerMobileAuditWriterAdapter',
  ]);

  for (const [label, source] of [
    ['route', routeSource],
    ['controller', controllerSource],
  ]) {
    assert.equal(/db|pool|transaction|repositories?/i.test(source), false, `${label} imports DB`);
    assert.equal(requireSpecifiers(source).some((specifier) => /line|sms|email|push|provider/i.test(specifier)), false, `${label} imports provider`);
    assert.equal(/rag|vector|openai/i.test(source), false, `${label} imports AI`);
    assert.equal(/require\(['"].*(app|server)['"]\)/i.test(source), false, `${label} imports app/server`);
  }
});
