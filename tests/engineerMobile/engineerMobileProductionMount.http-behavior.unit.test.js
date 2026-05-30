'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { createAppRouter } = require('../../src/routes');

const SAFE_DENY_ENVELOPE = {
  status: 'deny',
  messageKey: 'engineerMobile.unavailable',
  data: null,
};

const FORBIDDEN_RESPONSE_VALUES = [
  'raw_request_should_not_leak',
  'raw_headers_should_not_leak',
  'raw_body_should_not_leak',
  'raw_cookie_should_not_leak',
  'query_alias_should_not_win',
  'body_alias_should_not_win',
  'header_alias_should_not_win',
  'cookie_alias_should_not_win',
  'authorization_should_not_leak',
  'token_should_not_leak',
  '0912-345-678',
  'No. 1 Secret Road',
  'raw_email_should_not_leak',
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
  'rawAuditWriter',
];

function createSyntheticRes() {
  const calls = {
    json: [],
    status: [],
  };

  return {
    calls,
    status(statusCode) {
      calls.status.push(statusCode);
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
      body: options.req && options.req.body ? options.req.body : {},
      cookies: options.req && options.req.cookies ? options.req.cookies : {},
      headers: options.req && options.req.headers ? options.req.headers : {},
      method,
      originalUrl: requestPath,
      params,
      path: requestPath,
      query: options.req && options.req.query ? options.req.query : {},
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
        json: [SAFE_DENY_ENVELOPE],
        status: [404],
      },
    },
    routePath: undefined,
  };
}

function auth(overrides = {}) {
  return {
    organizationId: 'org_engineer_mobile_prod_001',
    engineerId: 'eng_engineer_mobile_prod_001',
    userId: 'user_engineer_mobile_prod_001',
    role: 'engineer',
    permissions: [
      'engineer_mobile.tasks.read',
      'engineer_mobile.visit.start_travel',
    ],
    rawSession: 'session_should_not_leak',
    token: 'token_should_not_leak',
    ...overrides,
  };
}

function task(overrides = {}) {
  return {
    appointmentId: 'apt_engineer_mobile_prod_001',
    caseId: 'case_engineer_mobile_prod_001',
    organizationId: 'org_engineer_mobile_prod_001',
    assignedEngineerId: 'eng_engineer_mobile_prod_001',
    scheduledStart: '2026-05-21T09:00:00+08:00',
    scheduledEnd: '2026-05-21T10:00:00+08:00',
    status: 'confirmed',
    customerNameMasked: '林○○',
    customerPhoneMasked: '09xx-xxx-456',
    addressSummary: '新北市板橋區',
    productSummary: '冷氣',
    issueSummary: '不冷',
    serviceType: 'repair',
    internalNote: 'internal_note_should_not_leak',
    privateField: 'private_field_should_not_leak',
    adminOnly: 'admin_only_should_not_leak',
    rawPhone: '0912-345-678',
    rawAddress: 'No. 1 Secret Road',
    rawEmail: 'raw_email_should_not_leak',
    rawLineUserId: 'line_user_should_not_leak',
    queryMetadata: 'query_metadata_should_not_leak',
    token: 'token_should_not_leak',
    debug: 'debug_should_not_leak',
    stack: 'stack_should_not_leak',
    sql: 'select secret_should_not_leak',
    auditEvent: 'auditEvent',
    auditWritten: true,
    persisted: true,
    ...overrides,
  };
}

function createDbClient() {
  return {
    calls: [],
    query(querySpec) {
      this.calls.push(querySpec);
      throw new Error('DB query must not run in synthetic production mount behavior tests');
    },
  };
}

function createProviderSender() {
  return {
    sends: [],
    send(payload) {
      this.sends.push(payload);
      throw new Error('provider send must not run in synthetic production mount behavior tests');
    },
  };
}

function createAuditWriter(auditEvents) {
  return function auditWriter(auditEvent) {
    auditEvents.push(auditEvent);

    return {
      ok: true,
      rawAuditWriter: 'rawAuditWriter',
      auditWritten: true,
      persisted: true,
    };
  };
}

function createVisitActionService(calls = []) {
  return {
    async handleEngineerMobileVisitAction(payload) {
      calls.push(payload);

      return {
        ok: true,
        allowed: true,
        accepted: true,
        action: payload.action,
        appointmentId: payload.appointmentId,
        caseId: payload.appointment && payload.appointment.caseId,
        organizationId: payload.appointment && payload.appointment.organizationId,
        requestId: payload.requestId,
        transitionApplied: true,
        auditRecorded: true,
        providerPayload: 'provider_payload_should_not_leak',
        rawPayload: 'raw_payload_should_not_leak',
        rawPhone: '0912-345-678',
        persisted: true,
      };
    },
  };
}

function createUnsupportedActionService(calls = []) {
  return {
    async handleEngineerMobileVisitAction(payload) {
      calls.push(payload);

      return {
        ok: false,
        allowed: false,
        action: payload.action,
        reasonCode: 'unsupported_action',
        appointmentId: payload.appointmentId,
        rawPayload: 'raw_payload_should_not_leak',
        debug: 'debug_should_not_leak',
      };
    },
  };
}

function createProductionRouterContext() {
  const dbClient = createDbClient();
  const provider = createProviderSender();
  const auditEvents = [];
  const readCalls = [];
  const appointmentCalls = [];
  const visitActionCalls = [];
  const tasks = [
    task({ caseId: 'case_engineer_mobile_prod_allowed' }),
    task({
      caseId: 'case_engineer_mobile_prod_wrong_org',
      organizationId: 'org_other',
    }),
    task({
      caseId: 'case_engineer_mobile_prod_wrong_engineer',
      assignedEngineerId: 'eng_other',
    }),
  ];
  const appRouter = createAppRouter({
    engineerMobile: {
      auditWriter: createAuditWriter(auditEvents),
      dbClient,
      provider,
      readModel(input) {
        readCalls.push(input);
        return { tasks };
      },
      visitActionAppointmentProvider(input) {
        appointmentCalls.push(input);
        return task({
          appointmentId: input.appointmentId,
          caseId: 'case_visit_action_prod_allowed',
        });
      },
      visitActionService: createVisitActionService(visitActionCalls),
    },
  });

  return {
    appRouter,
    auditEvents,
    dbClient,
    provider,
    readCalls,
    appointmentCalls,
    visitActionCalls,
  };
}

function createInvalidActionRouterContext() {
  const context = createProductionRouterContext();
  const visitActionCalls = [];
  const appRouter = createAppRouter({
    engineerMobile: {
      auditWriter: createAuditWriter(context.auditEvents),
      dbClient: context.dbClient,
      provider: context.provider,
      readModel(input) {
        context.readCalls.push(input);
        return { tasks: [task()] };
      },
      visitActionAppointmentProvider(input) {
        context.appointmentCalls.push(input);
        return task({
          appointmentId: input.appointmentId,
          caseId: 'case_visit_action_prod_denied',
        });
      },
      visitActionService: createUnsupportedActionService(visitActionCalls),
    },
  });

  return {
    ...context,
    appRouter,
    visitActionCalls,
  };
}

function request(overrides = {}) {
  return {
    auth: auth(),
    body: {
      appointmentId: 'body_alias_should_not_win',
      action: 'body_alias_should_not_win',
      rawRequest: 'raw_body_should_not_leak',
      rawPhone: '0912-345-678',
    },
    cookies: {
      appointmentId: 'cookie_alias_should_not_win',
      token: 'token_should_not_leak',
    },
    headers: {
      authorization: 'authorization_should_not_leak',
      appointmentId: 'header_alias_should_not_win',
      rawHeaders: 'raw_headers_should_not_leak',
    },
    query: {
      appointmentId: 'query_alias_should_not_win',
      action: 'query_alias_should_not_win',
    },
    requestId: 'req_engineer_mobile_prod_001',
    ...overrides,
  };
}

function engineerMobileRouteTemplates(appRouter) {
  return appRouter.stack
    .filter((layer) => layer.route && String(layer.route.path).startsWith('/engineer-mobile/'))
    .map((layer) => ({
      methods: Object.keys(layer.route.methods).map((method) => method.toUpperCase()).sort(),
      path: layer.route.path,
    }))
    .sort((a, b) => `${a.methods[0]} ${a.path}`.localeCompare(`${b.methods[0]} ${b.path}`));
}

function assertNoForbiddenOutput(value) {
  const serialized = JSON.stringify(value);

  for (const forbiddenValue of FORBIDDEN_RESPONSE_VALUES) {
    assert.equal(serialized.includes(forbiddenValue), false, `response leaked ${forbiddenValue}`);
  }

  for (const forbiddenKey of [
    'request',
    'rawRequest',
    'headers',
    'rawHeaders',
    'cookies',
    'params',
    'auth',
    'user',
    'session',
    'channel',
    'access',
    'auditEvent',
    'auditWritten',
    'persisted',
    'queryMetadata',
  ]) {
    assert.equal(serialized.includes(`"${forbiddenKey}"`), false, `response leaked key ${forbiddenKey}`);
  }
}

function assertNoSideEffects(context) {
  assert.deepEqual(context.dbClient.calls, []);
  assert.deepEqual(context.provider.sends, []);
}

test('production composition exposes only accepted Engineer Mobile public route templates', () => {
  const context = createProductionRouterContext();

  assert.deepEqual(engineerMobileRouteTemplates(context.appRouter), [
    {
      methods: ['GET'],
      path: '/engineer-mobile/tasks',
    },
    {
      methods: ['GET'],
      path: '/engineer-mobile/tasks/:appointmentId',
    },
    {
      methods: ['POST'],
      path: '/engineer-mobile/appointments/:appointmentId/actions/:action',
    },
  ]);
  assertNoSideEffects(context);
});

test('production composition GET /engineer-mobile/tasks returns accepted task list response', async () => {
  const context = createProductionRouterContext();
  const result = await dispatchProductionRequest(context.appRouter, {
    method: 'GET',
    path: '/engineer-mobile/tasks',
    req: request(),
  });

  assert.equal(result.matched, true);
  assert.equal(result.routePath, '/engineer-mobile/tasks');
  assert.deepEqual(result.res.calls.status, [200]);
  assert.equal(result.body.status, 'allow');
  assert.deepEqual(result.body.tasks.map((entry) => entry.caseId), ['case_engineer_mobile_prod_allowed']);
  assert.equal(context.readCalls.length, 1);
  assertNoForbiddenOutput(result.body);
  assertNoSideEffects(context);
});

test('production composition GET task detail uses route param appointmentId only', async () => {
  const context = createProductionRouterContext();
  const result = await dispatchProductionRequest(context.appRouter, {
    method: 'GET',
    path: '/engineer-mobile/tasks/apt_engineer_mobile_prod_001',
    req: request(),
  });

  assert.equal(result.matched, true);
  assert.equal(result.routePath, '/engineer-mobile/tasks/:appointmentId');
  assert.deepEqual(result.res.calls.status, [200]);
  assert.equal(result.body.status, 'allow');
  assert.equal(result.body.detail.appointmentId, 'apt_engineer_mobile_prod_001');
  assert.equal(context.readCalls[0].appointmentId, 'apt_engineer_mobile_prod_001');
  assertNoForbiddenOutput(result.body);
  assertNoSideEffects(context);
});

test('production composition POST visit action uses route params and keeps response sanitized', async () => {
  const context = createProductionRouterContext();
  const result = await dispatchProductionRequest(context.appRouter, {
    method: 'POST',
    path: '/engineer-mobile/appointments/apt_visit_action_prod_001/actions/engineer_mobile.start_travel',
    req: request(),
  });

  assert.equal(result.matched, true);
  assert.equal(result.routePath, '/engineer-mobile/appointments/:appointmentId/actions/:action');
  assert.deepEqual(result.res.calls.status, [202]);
  assert.equal(result.body.accepted, true);
  assert.equal(result.body.appointmentId, 'apt_visit_action_prod_001');
  assert.equal(context.appointmentCalls.length, 1);
  assert.equal(context.appointmentCalls[0].appointmentId, 'apt_visit_action_prod_001');
  assert.equal(context.appointmentCalls[0].action, 'engineer_mobile.start_travel');
  assert.equal(context.visitActionCalls.length, 1);
  assert.equal(context.visitActionCalls[0].appointmentId, 'apt_visit_action_prod_001');
  assert.equal(context.visitActionCalls[0].action, 'engineer_mobile.start_travel');
  assertNoForbiddenOutput(result.body);
  assertNoSideEffects(context);
});

test('production composition invalid and missing visit action values keep existing safe behavior', async () => {
  const invalidContext = createInvalidActionRouterContext();
  const invalidAction = await dispatchProductionRequest(invalidContext.appRouter, {
    method: 'POST',
    path: '/engineer-mobile/appointments/apt_visit_action_prod_001/actions/engineer_mobile.unsupported_action',
    req: request(),
  });

  assert.equal(invalidAction.matched, true);
  assert.equal(invalidAction.routePath, '/engineer-mobile/appointments/:appointmentId/actions/:action');
  assert.deepEqual(invalidAction.res.calls.status, [400]);
  assert.equal(invalidAction.body.accepted, false);
  assert.equal(invalidAction.body.allowed, false);
  assert.equal(invalidAction.body.reasonCode, 'unsupported_action');
  assert.equal(invalidContext.appointmentCalls.length, 1);
  assert.equal(invalidContext.visitActionCalls.length, 1);
  assert.equal(invalidContext.visitActionCalls[0].action, 'engineer_mobile.unsupported_action');
  assertNoForbiddenOutput(invalidAction.body);
  assertNoSideEffects(invalidContext);

  const missingContext = createProductionRouterContext();
  const missingAppointment = await dispatchProductionRequest(missingContext.appRouter, {
    method: 'POST',
    path: '/engineer-mobile/appointments//actions/engineer_mobile.start_travel',
    req: request(),
  });

  assert.equal(missingAppointment.matched, false);
  assert.deepEqual(missingAppointment.res.calls.status, [404]);
  assertNoForbiddenOutput(missingAppointment.body);
  assertNoSideEffects(missingContext);
});

test('production composition unsupported methods and near-match paths do not dispatch', async () => {
  for (const candidate of [
    { method: 'POST', path: '/engineer-mobile/tasks' },
    { method: 'GET', path: '/engineer-mobile/tasks/' },
    { method: 'GET', path: '/engineer-mobile/tasks/apt_engineer_mobile_prod_001/extra' },
    { method: 'POST', path: '/engineer-mobile/appointments/apt_visit_action_prod_001/actions' },
    { method: 'POST', path: '/engineer-mobile/appointments/apt_visit_action_prod_001/actions/engineer_mobile.start_travel/extra' },
    { method: 'GET', path: '/__internal/engineer-mobile/tasks' },
  ]) {
    const context = createProductionRouterContext();
    const result = await dispatchProductionRequest(context.appRouter, {
      ...candidate,
      req: request(),
    });

    assert.equal(result.matched, false, `${candidate.method} ${candidate.path} should not dispatch`);
    assert.deepEqual(result.res.calls.status, [404]);
    assertNoForbiddenOutput(result.body);
    assertNoSideEffects(context);
  }
});
