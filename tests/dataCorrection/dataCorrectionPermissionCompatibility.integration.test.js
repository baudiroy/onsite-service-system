'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Readable, Writable } = require('node:stream');
const test = require('node:test');

const {
  createApp,
} = require('../../src/app');
const {
  createAppRouter,
} = require('../../src/routes');
const {
  createServerBootstrap,
} = require('../../src/server');

const repoRoot = path.resolve(__dirname, '../..');
const testFile = __filename;

const ACTIONS = Object.freeze({
  DATA_CORRECTION_REQUEST: 'data_correction_request',
  FOLLOW_UP_PROPOSAL: 'follow_up_proposal',
  POST_DEPARTURE_FREEZE: 'post_departure_freeze',
  PRE_DEPARTURE_APPLY: 'pre_departure_apply',
  UNABLE_TO_COMPLETE_RESULT: 'unable_to_complete_result',
});

const FIELD_GROUPS = Object.freeze({
  DISPATCH_OPERATIONAL: 'dispatch_operational',
  PHONE_IDENTITY: 'phone_identity',
});

function findRoute(expressRouter, method, pathname) {
  return expressRouter.stack.find((layer) => (
    layer.route
    && layer.route.path === pathname
    && layer.route.methods[method.toLowerCase()]
  ));
}

function auth(overrides = {}) {
  return {
    organizationId: 'org_data_correction_permission_compat_001',
    userId: 'dispatcher_data_correction_permission_compat_001',
    role: 'dispatch_assistant',
    permissions: ['case.correction.apply'],
    ...overrides,
  };
}

function body(actionType, payload) {
  return {
    actionType,
    payload,
  };
}

function correctionPayload(overrides = {}) {
  return {
    caseContext: {
      caseId: 'case_data_correction_permission_compat_001',
      organizationId: 'org_data_correction_permission_compat_001',
    },
    appointmentContext: {
      appointmentId: 'apt_data_correction_permission_compat_001',
      engineerReceivedTask: false,
      engineerDeparted: false,
      routeStarted: false,
      arrived: false,
    },
    correction: {
      fieldKey: 'issueSummary',
      fieldGroup: FIELD_GROUPS.DISPATCH_OPERATIONAL,
      fromValue: 'old_value_should_not_leak',
      toValue: 'safe updated issue',
      rawPhone: 'raw_phone_should_not_leak',
      rawAddress: 'raw_address_should_not_leak',
      rawLineUserId: 'line_user_should_not_leak',
      token: 'token_should_not_leak',
      secret: 'secret_should_not_leak',
      DATABASE_URL: 'DATABASE_URL_should_not_leak',
      internalNote: 'internal_note_should_not_leak',
      auditRawPayload: 'audit_raw_should_not_leak',
      aiRawPayload: 'ai_raw_payload_should_not_leak',
      finalAppointmentId: 'final_appointment_should_not_leak',
    },
    ...overrides,
  };
}

function unablePayload(overrides = {}) {
  return {
    caseContext: {
      caseId: 'case_data_correction_permission_compat_001',
      organizationId: 'org_data_correction_permission_compat_001',
    },
    appointmentContext: {
      appointmentId: 'apt_data_correction_permission_compat_001',
      organizationId: 'org_data_correction_permission_compat_001',
      assignedEngineerId: 'engineer_data_correction_permission_compat_001',
      arrived: true,
    },
    result: {
      reasonCode: 'unable_to_complete',
      terminalState: 'unable_to_complete',
      note: 'site condition mismatch',
      finalAppointmentId: 'final_appointment_should_not_leak',
    },
    ...overrides,
  };
}

function followUpPayload(overrides = {}) {
  return {
    caseContext: {
      caseId: 'case_data_correction_permission_compat_001',
      organizationId: 'org_data_correction_permission_compat_001',
    },
    appointmentContext: {
      appointmentId: 'apt_data_correction_permission_compat_001',
      organizationId: 'org_data_correction_permission_compat_001',
      terminalState: 'follow_up_required',
    },
    proposal: {
      proposalType: 'follow_up_appointment',
      reasonCode: 'follow_up_required',
      note: 'schedule follow up',
      finalAppointmentId: 'final_appointment_should_not_leak',
    },
    ...overrides,
  };
}

function request(actionType, payload, authOverrides = {}) {
  return {
    auth: auth(authOverrides),
    body: body(actionType, payload),
  };
}

function createResponse() {
  return {
    statusCalls: [],
    jsonCalls: [],
    status(statusCode) {
      this.statusCalls.push(statusCode);
      return this;
    },
    json(responseBody) {
      this.jsonCalls.push(responseBody);
      return this;
    },
  };
}

function callRouteStack(expressRouter, req) {
  const route = findRoute(expressRouter, 'post', '/data-correction/governance');
  const res = createResponse();

  assert.ok(route, 'mounted data correction route missing');

  const handlers = route.route.stack.map((layer) => layer.handle);
  let index = 0;

  function next() {
    index += 1;

    if (handlers[index]) {
      return handlers[index](req, res, next);
    }

    return undefined;
  }

  handlers[0](req, res, next);

  return {
    req,
    res,
    route,
  };
}

function createHttpRequest(pathname, requestBody, authOverrides) {
  const bodyText = JSON.stringify(requestBody || {});
  const bodyBuffer = Buffer.from(bodyText);
  let sent = false;
  const req = new Readable({
    read() {
      if (sent) {
        this.push(null);
        return;
      }

      sent = true;
      this.push(bodyBuffer);
      this.push(null);
    },
  });

  req.method = 'POST';
  req.url = pathname;
  req.originalUrl = pathname;
  req.headers = {
    'content-type': 'application/json',
    'content-length': String(bodyBuffer.length),
  };
  req.connection = {};

  if (authOverrides !== undefined) {
    req.auth = auth(authOverrides);
  }

  return req;
}

function createHttpResponse() {
  const chunks = [];
  const headers = {};
  const res = new Writable({
    write(chunk, encoding, callback) {
      chunks.push(Buffer.from(chunk));
      callback();
    },
  });

  res.statusCode = 200;
  res.setHeader = (name, value) => {
    headers[name.toLowerCase()] = value;
  };
  res.getHeader = (name) => headers[name.toLowerCase()];
  res.removeHeader = (name) => {
    delete headers[name.toLowerCase()];
  };
  res.writeHead = (statusCode, headerValues) => {
    res.statusCode = statusCode;
    if (headerValues && typeof headerValues === 'object') {
      for (const [name, value] of Object.entries(headerValues)) {
        res.setHeader(name, value);
      }
    }
    return res;
  };
  res.end = (chunk, encoding, callback) => {
    if (chunk) {
      chunks.push(Buffer.from(chunk, encoding));
    }
    Writable.prototype.end.call(res, callback);
    return res;
  };
  res.bodyText = () => Buffer.concat(chunks).toString('utf8');
  res.bodyJson = () => JSON.parse(res.bodyText());

  return res;
}

function requestApp(app, requestBody, authOverrides = {}) {
  return new Promise((resolve, reject) => {
    const req = createHttpRequest('/data-correction/governance', requestBody, authOverrides);
    const res = createHttpResponse();

    res.on('finish', () => {
      try {
        resolve({
          body: res.bodyJson(),
          bodyText: res.bodyText(),
          statusCode: res.statusCode,
        });
      } catch (error) {
        reject(error);
      }
    });
    res.on('error', reject);
    app.handle(req, res);
  });
}

function writerCalls() {
  return {
    appointmentResult: [],
    audit: [],
    contactLog: [],
    correction: [],
    dispatchNote: [],
    followUp: [],
  };
}

function dataCorrectionOptions(calls) {
  return {
    appointmentResultWriter(payload) {
      calls.appointmentResult.push(payload);
    },
    auditWriter(payload) {
      calls.audit.push(payload);
    },
    contactLogWriter(payload) {
      calls.contactLog.push(payload);
    },
    correctionWriter(payload) {
      calls.correction.push(payload);
    },
    dispatchNoteWriter(payload) {
      calls.dispatchNote.push(payload);
    },
    followUpDraftWriter(payload) {
      calls.followUp.push(payload);
    },
  };
}

function assertSafeOutput(value) {
  const serialized = JSON.stringify(value);

  for (const forbiddenValue of [
    'old_value_should_not_leak',
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'DATABASE_URL_should_not_leak',
    'internal_note_should_not_leak',
    'audit_raw_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'final_appointment_should_not_leak',
    'MISSING_PERMISSION',
    'UNKNOWN_ACTION',
    'AI_ACTOR',
  ]) {
    assert.equal(serialized.includes(forbiddenValue), false, `leaked ${forbiddenValue}`);
  }

  assert.equal(serialized.includes('"finalAppointmentId"'), false);
}

function assertPermissionDeny(response) {
  assert.equal(response.statusCode || response.statusCalls[0], 403);
  const bodyValue = response.body || response.jsonCalls[0];

  assert.deepEqual(bodyValue, {
    status: 'deny',
    messageKey: 'dataCorrection.unavailable',
    data: null,
  });
  assertSafeOutput(bodyValue);
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

test('route index mounted route includes permission middleware before handler', () => {
  const appRouter = createAppRouter({
    dataCorrection: dataCorrectionOptions(writerCalls()),
  });
  const route = findRoute(appRouter, 'post', '/data-correction/governance');

  assert.ok(route);
  assert.equal(route.route.stack.length, 2);
  assert.equal(route.route.stack[0].handle.name, 'dataCorrectionPermissionMiddleware');
  assert.equal(route.route.stack[1].handle.name, 'dataCorrectionGovernanceHandler');
});

test('route index path with missing auth returns generic 403 before writer calls', () => {
  const calls = writerCalls();
  const appRouter = createAppRouter({
    dataCorrection: dataCorrectionOptions(calls),
  });
  const output = callRouteStack(appRouter, {
    body: body(ACTIONS.PRE_DEPARTURE_APPLY, correctionPayload()),
  });

  assertPermissionDeny(output.res);
  assert.equal(calls.correction.length, 0);
});

test('route index path with valid permission allows pre-departure apply and calls correctionWriter', () => {
  const calls = writerCalls();
  const appRouter = createAppRouter({
    dataCorrection: dataCorrectionOptions(calls),
  });
  const output = callRouteStack(appRouter, request(
    ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
    {
      role: 'dispatch_assistant',
      permissions: ['case.correction.apply'],
    },
  ));

  assert.deepEqual(output.res.statusCalls, [200]);
  assert.equal(output.res.jsonCalls[0].status, 'ok');
  assert.equal(calls.correction.length, 1);
  assertSafeOutput([output.res.jsonCalls[0], calls]);
});

test('app factory path still supports valid pre-departure apply', async () => {
  const calls = writerCalls();
  const app = createApp({
    dataCorrection: dataCorrectionOptions(calls),
  });
  const response = await requestApp(app, body(
    ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ), {
    role: 'dispatch_assistant',
    permissions: ['case.correction.apply'],
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(calls.correction.length, 1);
  assertSafeOutput([response.body, calls]);
});

test('app factory path denies missing permission before writer calls', async () => {
  const calls = writerCalls();
  const app = createApp({
    dataCorrection: dataCorrectionOptions(calls),
  });
  const response = await requestApp(app, body(
    ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ), {
    role: 'dispatch_assistant',
    permissions: [],
  });

  assertPermissionDeny(response);
  assert.equal(calls.correction.length, 0);
});

test('app factory path supports post-departure freeze with data_correction.request alias', async () => {
  const calls = writerCalls();
  const app = createApp({
    dataCorrection: dataCorrectionOptions(calls),
  });
  const response = await requestApp(app, body(
    ACTIONS.POST_DEPARTURE_FREEZE,
    correctionPayload({
      appointmentContext: {
        appointmentId: 'apt_data_correction_permission_compat_001',
        engineerReceivedTask: true,
        engineerDeparted: true,
        routeStarted: false,
        arrived: false,
      },
    }),
  ), {
    role: 'customer_service',
    permissions: ['data_correction.request'],
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.result.manualHandlingRequired, true);
  assert.equal(calls.contactLog.length, 1);
  assert.equal(calls.dispatchNote.length, 1);
  assert.equal(calls.audit.length, 1);
  assert.equal(calls.correction.length, 0);
  assertSafeOutput([response.body, calls]);
});

test('server createServerBootstrap path supports mounted route behavior without calling listen', async () => {
  const calls = writerCalls();
  const bootstrap = createServerBootstrap({
    dataCorrection: dataCorrectionOptions(calls),
    port: 4071,
  });

  assert.equal(typeof bootstrap.app.handle, 'function');
  assert.equal(typeof bootstrap.app.listen, 'function');
  assert.deepEqual(calls, writerCalls());

  const response = await requestApp(bootstrap.app, body(
    ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ), {
    role: 'dispatch_assistant',
    permissions: ['case.correction.apply'],
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(calls.correction.length, 1);
  assertSafeOutput([response.body, calls]);
});

test('server createServerBootstrap path supports follow-up proposal with dispatch.follow_up.propose alias', async () => {
  const calls = writerCalls();
  const bootstrap = createServerBootstrap({
    dataCorrection: dataCorrectionOptions(calls),
  });
  const response = await requestApp(bootstrap.app, body(
    ACTIONS.FOLLOW_UP_PROPOSAL,
    followUpPayload(),
  ), {
    role: 'dispatch_assistant',
    permissions: ['dispatch.follow_up.propose'],
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.result.formalAppointmentCreated, false);
  assert.equal(calls.followUp.length, 1);
  assert.equal(calls.correction.length, 0);
  assertSafeOutput([response.body, calls]);
});

test('server options.app priority still bypasses dataCorrection options', () => {
  const calls = writerCalls();
  const listenCalls = [];
  const injectedApp = {
    listen(port) {
      listenCalls.push(port);
    },
  };
  const bootstrap = createServerBootstrap({
    app: injectedApp,
    dataCorrection: dataCorrectionOptions(calls),
    port: 4072,
  });

  assert.equal(bootstrap.app, injectedApp);
  assert.deepEqual(calls, writerCalls());
  assert.deepEqual(listenCalls, []);
});

test('engineer with appointment.result.record can do unable-to-complete through server-created route', async () => {
  const calls = writerCalls();
  const bootstrap = createServerBootstrap({
    dataCorrection: dataCorrectionOptions(calls),
  });
  const response = await requestApp(bootstrap.app, body(
    ACTIONS.UNABLE_TO_COMPLETE_RESULT,
    unablePayload(),
  ), {
    userId: 'engineer_data_correction_permission_compat_001',
    role: 'engineer',
    permissions: ['appointment.result.record'],
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(calls.appointmentResult.length, 1);
  assertSafeOutput([response.body, calls]);
});

test('engineer cannot do pre-departure apply through server-created route', async () => {
  const calls = writerCalls();
  const bootstrap = createServerBootstrap({
    dataCorrection: dataCorrectionOptions(calls),
  });
  const response = await requestApp(bootstrap.app, body(
    ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ), {
    role: 'engineer',
    permissions: ['case.correction.apply'],
  });

  assertPermissionDeny(response);
  assert.equal(calls.correction.length, 0);
});

test('AI role denied through mounted route', async () => {
  const calls = writerCalls();
  const app = createApp({
    dataCorrection: dataCorrectionOptions(calls),
  });
  const response = await requestApp(app, body(
    ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ), {
    role: 'ai',
    permissions: ['case.correction.apply'],
  });

  assertPermissionDeny(response);
  assert.equal(calls.correction.length, 0);
});

test('phone correction with valid permission returns re-verification and does not call correctionWriter', async () => {
  const calls = writerCalls();
  const app = createApp({
    dataCorrection: dataCorrectionOptions(calls),
  });
  const response = await requestApp(app, body(
    ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload({
      correction: {
        fieldKey: 'phoneNumber',
        fieldGroup: FIELD_GROUPS.PHONE_IDENTITY,
        toValue: 'raw_phone_should_not_leak',
      },
    }),
  ), {
    role: 'dispatch_assistant',
    permissions: ['case.correction.apply'],
  });

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.status, 'deny');
  assert.equal(response.body.phoneReverificationRequired, true);
  assert.equal(calls.correction.length, 0);
  assertSafeOutput(response.body);
});

test('mounted responses redact raw phone, address, LINE id, token, secret, DB URL, internal note, AI raw, and finalAppointmentId', async () => {
  const calls = writerCalls();
  const app = createApp({
    dataCorrection: dataCorrectionOptions(calls),
  });
  const response = await requestApp(app, body(
    ACTIONS.PRE_DEPARTURE_APPLY,
    correctionPayload(),
  ), {
    role: 'dispatch_assistant',
    permissions: ['case.correction.apply'],
  });

  assert.equal(response.statusCode, 200);
  assertSafeOutput([response.body, calls]);
});

test('integration test source has no DB, repository, provider, AI, smoke, or browser imports', () => {
  const source = fs.readFileSync(testFile, 'utf8');
  const specifiers = requireSpecifiers(source);
  const importedSpecifiers = specifiers.join('\n');

  assert.deepEqual(specifiers.sort(), [
    '../../src/app',
    '../../src/routes',
    '../../src/server',
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:stream',
    'node:test',
  ]);
  assert.doesNotMatch(importedSpecifiers, /supertest|playwright|browser|smoke|db\/pool|repositories?|transaction|provider|lineProvider|sms|email|push|rag|vector|openai|aiProvider/i);
});
