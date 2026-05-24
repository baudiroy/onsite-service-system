'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftToCaseApiModule,
} = require('../../src/repairIntake/repairIntakeDraftToCaseApiModule');

function unsafeRequestLike() {
  return {
    params: {
      draftId: 'draft_task1004',
      phone: '+886922222222',
      nested: {
        finalAppointmentId: 'unsafe_final_nested',
      },
    },
    query: {
      dryRun: 'true',
      sql: 'select * from unsafe_query',
    },
    body: {
      organizationId: 'org_task1004',
      tenantId: 'tenant_task1004',
      idempotencyKey: 'idem_task1004',
      approvalContext: {
        accepted: true,
        approvalId: 'approval_task1004',
        lineAccessToken: 'unsafe_nested_token',
      },
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
        permissionSource: 'synthetic_task1004',
        authorization: 'Bearer unsafe_nested',
      },
      phone: '+886922222222',
      address: 'unsafe full address',
      customerPhone: '+886933333333',
      lineUserId: 'unsafe_line',
      finalAppointmentId: 'unsafe_final',
      DATABASE_URL: 'postgres://unsafe',
      rawBody: 'unsafe raw body',
    },
    context: {
      organizationId: 'org_task1004',
      actorId: 'actor_task1004',
      requestId: 'req_task1004',
      headers: {
        authorization: 'Bearer unsafe',
      },
    },
    actor: {
      actorId: 'actor_task1004',
      role: 'dispatcher',
      lineUserId: 'unsafe_actor_line',
    },
    organizationId: 'org_task1004',
    tenantId: 'tenant_task1004',
    requestId: 'req_task1004',
    req: { unsafe: true },
    res: { unsafe: true },
    response: { unsafe: true },
    next: () => {},
    socket: { remoteAddress: 'unsafe' },
    connection: { unsafe: true },
    headers: { authorization: 'Bearer unsafe' },
    rawHeaders: ['authorization', 'Bearer unsafe'],
    cookies: { session: 'unsafe' },
    signedCookies: { session: 'unsafe' },
    session: { token: 'unsafe' },
    app: { unsafe: true },
    route: { unsafe: true },
    originalUrl: '/unsafe?token=unsafe',
    baseUrl: '/unsafe',
    ip: '127.0.0.1',
    ips: ['127.0.0.1'],
    protocol: 'https',
    hostname: 'unsafe.local',
    files: [{ filename: 'unsafe' }],
    file: { filename: 'unsafe' },
    rawBody: 'unsafe raw body',
    authorization: 'Bearer unsafe',
    cookie: 'unsafe_cookie',
    lineUserId: 'unsafe_line',
    lineAccessToken: 'unsafe_line_token',
    phone: '+886922222222',
    address: 'unsafe full address',
    customerPhone: '+886933333333',
    finalAppointmentId: 'unsafe_final',
    sql: 'select * from unsafe_table',
    DATABASE_URL: 'postgres://unsafe',
  };
}

function assertSafeRequestInput(input) {
  assert.deepEqual(Object.keys(input).sort(), [
    'actor',
    'body',
    'context',
    'organizationId',
    'params',
    'query',
    'requestId',
    'tenantId',
  ]);

  assert.equal(input.params.draftId, 'draft_task1004');
  assert.equal(input.query.dryRun, 'true');
  assert.equal(input.body.organizationId, 'org_task1004');
  assert.equal(input.body.tenantId, 'tenant_task1004');
  assert.equal(input.body.idempotencyKey, 'idem_task1004');
  assert.equal(input.body.approvalContext.accepted, true);
  assert.equal(input.body.approvalContext.approvalId, 'approval_task1004');
  assert.equal(input.body.permissionContext.canCreateCaseFromRepairIntakeDraft, true);
  assert.equal(input.body.permissionContext.permissionSource, 'synthetic_task1004');
  assert.equal(input.context.organizationId, 'org_task1004');
  assert.equal(input.context.actorId, 'actor_task1004');
  assert.equal(input.context.requestId, 'req_task1004');
  assert.equal(input.actor.actorId, 'actor_task1004');
  assert.equal(input.actor.role, 'dispatcher');
  assert.equal(input.organizationId, 'org_task1004');
  assert.equal(input.tenantId, 'tenant_task1004');
  assert.equal(input.requestId, 'req_task1004');

  const keys = new Set();
  const collectKeys = (value) => {
    if (!value || typeof value !== 'object') {
      return;
    }

    for (const [key, fieldValue] of Object.entries(value)) {
      keys.add(key);
      collectKeys(fieldValue);
    }
  };
  collectKeys(input);

  for (const forbiddenKey of [
    'req',
    'res',
    'response',
    'next',
    'socket',
    'connection',
    'headers',
    'rawHeaders',
    'cookies',
    'signedCookies',
    'session',
    'originalUrl',
    'baseUrl',
    '127.0.0.1',
    'protocol',
    'hostname',
    'files',
    'file',
    'rawBody',
    'DATABASE_URL',
    'postgres://',
    'authorization',
    'Bearer unsafe',
    'cookie',
    'lineUserId',
    'lineAccessToken',
    '+886922222222',
    '+886933333333',
    'unsafe full address',
    'customerPhone',
    'finalAppointmentId',
    'sql',
  ]) {
    assert.equal(keys.has(forbiddenKey), false, `forwarded unsafe key ${forbiddenKey}`);
  }

  const serialized = JSON.stringify(input);

  for (const forbidden of [
    'unsafe_final',
    'select *',
    'unsafe_table',
    'unsafe_query',
    'unsafe_line',
    'unsafe_line_token',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function capturingController(calls) {
  return {
    planDraftToCase: async (input) => {
      calls.push({ route: 'plan', input });
      return {
        ok: true,
        statusCode: 200,
        body: {
          ok: true,
          reasonCode: 'PLAN_READY',
        },
      };
    },
    submitDraftToCase: async (input) => {
      calls.push({ route: 'submit', input });
      return {
        ok: true,
        statusCode: 200,
        body: {
          ok: true,
          reasonCode: 'SUBMIT_READY',
        },
      };
    },
  };
}

function capturingApplicationService(calls) {
  return {
    planDraftToCase: async (input) => {
      calls.push({ route: 'plan', input });
      return {
        ok: true,
        action: 'repair_intake_draft_to_case_plan',
        draftId: input.draftId,
        organizationId: input.organizationId,
        reasonCode: 'PLAN_READY',
        requiredActions: [],
      };
    },
    submitDraftToCase: async (input) => {
      calls.push({ route: 'submit', input });
      return {
        ok: true,
        action: 'repair_intake_draft_to_case_submit',
        draftId: input.draftId,
        organizationId: input.organizationId,
        submitted: true,
        reasonCode: 'SUBMIT_READY',
        requiredActions: [],
      };
    },
  };
}

test('injected controller route handlers receive sanitized request input only', async () => {
  const calls = [];
  const moduleEnvelope = createRepairIntakeDraftToCaseApiModule({
    controller: capturingController(calls),
  });

  assert.equal(moduleEnvelope.ok, true);

  await moduleEnvelope.routes[0].handler(unsafeRequestLike());
  await moduleEnvelope.routes[1].handler(unsafeRequestLike());

  assert.equal(calls.length, 2);
  assert.equal(calls[0].route, 'plan');
  assert.equal(calls[1].route, 'submit');
  assertSafeRequestInput(calls[0].input);
  assertSafeRequestInput(calls[1].input);
});

test('applicationService adapter receives sanitized request-derived input only', async () => {
  const calls = [];
  const moduleEnvelope = createRepairIntakeDraftToCaseApiModule({
    applicationService: capturingApplicationService(calls),
  });

  assert.equal(moduleEnvelope.ok, true);

  await moduleEnvelope.routes[0].handler(unsafeRequestLike());
  await moduleEnvelope.routes[1].handler(unsafeRequestLike());

  assert.deepEqual(calls, [
    {
      route: 'plan',
      input: {
        draftId: 'draft_task1004',
        organizationId: 'org_task1004',
        actorId: 'actor_task1004',
        requestId: 'req_task1004',
        idempotencyKey: 'idem_task1004',
        approvalContext: {
          accepted: true,
          approvalId: 'approval_task1004',
          acceptedByActorId: undefined,
        },
        permissionContext: {
          canCreateCaseFromRepairIntakeDraft: true,
          permissionSource: 'synthetic_task1004',
        },
      },
    },
    {
      route: 'submit',
      input: {
        draftId: 'draft_task1004',
        organizationId: 'org_task1004',
        actorId: 'actor_task1004',
        requestId: 'req_task1004',
        idempotencyKey: 'idem_task1004',
        approvalContext: {
          accepted: true,
          approvalId: 'approval_task1004',
          acceptedByActorId: undefined,
        },
        permissionContext: {
          canCreateCaseFromRepairIntakeDraft: true,
          permissionSource: 'synthetic_task1004',
        },
      },
    },
  ]);

  const serializedCalls = JSON.stringify(calls);

  for (const forbidden of [
    'select *',
    'unsafe_table',
    'DATABASE_URL',
    'postgres://',
    '+886922222222',
    '+886933333333',
    'unsafe full address',
    'customerPhone',
    'lineUserId',
    'unsafe_line',
    'lineAccessToken',
    'unsafe_line_token',
    'finalAppointmentId',
    'unsafe_final',
    'rawBody',
    'authorization',
    'Bearer unsafe',
  ]) {
    assert.equal(serializedCalls.includes(forbidden), false, `leaked ${forbidden}`);
  }
});
