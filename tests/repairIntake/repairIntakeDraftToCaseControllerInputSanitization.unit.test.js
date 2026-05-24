'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftToCaseController,
} = require('../../src/repairIntake/repairIntakeDraftToCaseController');

function unsafeInput() {
  return {
    actor: {
      actorId: 'actor_task1012',
      role: 'dispatcher',
      lineUserId: 'unsafe_actor_line',
    },
    body: {
      organizationId: 'org_task1012',
      tenantId: 'tenant_task1012',
      idempotencyKey: 'idem_task1012',
      approvalContext: {
        accepted: true,
        approvalId: 'approval_task1012',
        lineAccessToken: 'unsafe_nested_token',
      },
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
        permissionSource: 'synthetic_task1012',
        authorization: 'Bearer unsafe_nested',
      },
      phone: '+886900000000',
      address: 'unsafe address',
      customerPhone: '+886911111111',
      customerName: 'unsafe customer',
      lineUserId: 'unsafe_line',
      lineAccessToken: 'unsafe_line_token',
      finalAppointmentId: 'unsafe_final',
      DATABASE_URL: 'postgres://unsafe',
      db: { unsafe: true },
      rawRows: [{ sql: 'select * from unsafe_nested' }],
    },
    context: {
      organizationId: 'org_task1012',
      actorId: 'actor_task1012',
      requestId: 'req_task1012',
      headers: {
        authorization: 'Bearer unsafe',
      },
    },
    organizationId: 'org_task1012',
    params: {
      draftId: 'draft_task1012',
      finalAppointmentId: 'unsafe_param_final',
    },
    query: {
      preview: 'true',
      sql: 'select * from unsafe_query',
    },
    requestId: 'req_task1012',
    tenantId: 'tenant_task1012',
    req: { unsafe: true },
    res: { unsafe: true },
    response: { unsafe: true },
    next: () => {},
    socket: { unsafe: true },
    connection: { unsafe: true },
    headers: { authorization: 'Bearer unsafe' },
    rawHeaders: ['authorization', 'Bearer unsafe'],
    cookies: { session: 'unsafe' },
    signedCookies: { session: 'unsafe' },
    session: { token: 'unsafe' },
    app: { unsafe: true },
    route: { unsafe: true },
    originalUrl: '/unsafe',
    baseUrl: '/unsafe',
    ip: '127.0.0.1',
    ips: ['127.0.0.1'],
    protocol: 'https',
    hostname: 'unsafe.local',
    files: [{ filename: 'unsafe' }],
    file: { filename: 'unsafe' },
    rawBody: 'unsafe raw body',
  };
}

function createController(calls) {
  return createRepairIntakeDraftToCaseController({
    applicationService: {
      planDraftToCase: async (input) => {
        calls.push({ method: 'plan', input });
        return {
          ok: true,
          statusCode: 200,
          body: {
            ok: true,
            reasonCode: 'PLAN_READY',
            draftId: input.params && input.params.draftId,
          },
        };
      },
      submitDraftToCase: async (input) => {
        calls.push({ method: 'submit', input });
        return {
          ok: true,
          statusCode: 200,
          body: {
            ok: true,
            reasonCode: 'SUBMIT_READY',
            draftId: input.params && input.params.draftId,
          },
        };
      },
    },
  });
}

function assertSanitizedInput(input) {
  assert.equal(input.actor.actorId, 'actor_task1012');
  assert.equal(input.actor.role, 'dispatcher');
  assert.equal(input.body.organizationId, 'org_task1012');
  assert.equal(input.body.tenantId, 'tenant_task1012');
  assert.equal(input.body.idempotencyKey, 'idem_task1012');
  assert.equal(input.body.approvalContext.accepted, true);
  assert.equal(input.body.approvalContext.approvalId, 'approval_task1012');
  assert.equal(input.body.permissionContext.canCreateCaseFromRepairIntakeDraft, true);
  assert.equal(input.body.permissionContext.permissionSource, 'synthetic_task1012');
  assert.equal(input.context.organizationId, 'org_task1012');
  assert.equal(input.context.actorId, 'actor_task1012');
  assert.equal(input.context.requestId, 'req_task1012');
  assert.equal(input.organizationId, 'org_task1012');
  assert.equal(input.params.draftId, 'draft_task1012');
  assert.equal(input.query.preview, 'true');
  assert.equal(input.requestId, 'req_task1012');
  assert.equal(input.tenantId, 'tenant_task1012');

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
    'app',
    'route',
    'originalUrl',
    'baseUrl',
    'ip',
    'ips',
    'protocol',
    'hostname',
    'files',
    'file',
    'rawBody',
    'DATABASE_URL',
    'authorization',
    'lineUserId',
    'lineAccessToken',
    'phone',
    'address',
    'customerPhone',
    'customerName',
    'finalAppointmentId',
    'sql',
    'db',
    'rawRows',
  ]) {
    assert.equal(keys.has(forbiddenKey), false, `forwarded unsafe key ${forbiddenKey}`);
  }

  const serialized = JSON.stringify(input);

  for (const forbidden of [
    'select *',
    'postgres://',
    '+886900000000',
    '+886911111111',
    'unsafe address',
    'unsafe customer',
    'unsafe_line',
    'unsafe_line_token',
    'unsafe_final',
    'unsafe_param_final',
    'Bearer unsafe',
    '127.0.0.1',
    'unsafe raw body',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('plan and submit handlers forward sanitized object input only', async () => {
  const calls = [];
  const controller = createController(calls);

  const planResult = await controller.planDraftToCase(unsafeInput());
  const submitResult = await controller.submitDraftToCase(unsafeInput());

  assert.equal(planResult.body.reasonCode, 'PLAN_READY');
  assert.equal(submitResult.body.reasonCode, 'SUBMIT_READY');
  assert.deepEqual(calls.map(({ method }) => method), ['plan', 'submit']);
  assertSanitizedInput(calls[0].input);
  assertSanitizedInput(calls[1].input);
});

test('invalid input behavior remains fail-closed and does not call applicationService', async () => {
  const calls = [];
  const controller = createController(calls);

  const planResult = await controller.planDraftToCase(null);
  const submitResult = await controller.submitDraftToCase(undefined);

  assert.equal(
    planResult.body.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_PLAN_INPUT_INVALID',
  );
  assert.equal(
    submitResult.body.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_SUBMIT_INPUT_INVALID',
  );
  assert.deepEqual(calls, []);
});
