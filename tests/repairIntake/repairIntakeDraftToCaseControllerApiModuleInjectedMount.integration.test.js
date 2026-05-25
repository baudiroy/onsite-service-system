'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftToCaseController,
} = require('../../src/repairIntake/repairIntakeDraftToCaseController');
const {
  createRepairIntakeDraftToCaseApiModule,
} = require('../../src/repairIntake/repairIntakeDraftToCaseApiModule');
const {
  mountRepairIntakeDraftToCaseApiModule,
} = require('../../src/repairIntake/repairIntakeDraftToCaseHttpMountAdapter');

function createSyntheticMountTarget(options = {}) {
  const routeHandlers = new Map();
  const registrations = [];

  function add(method, routePath, handler) {
    registrations.push({
      method,
      path: routePath,
      handler,
    });
    routeHandlers.set(`${method.toUpperCase()} ${routePath}`, handler);
  }

  return {
    registrations,
    post: options.withPost === false ? undefined : (routePath, handler) => {
      add('POST', routePath, handler);
    },
    register: options.withRegister ? (method, routePath, handler) => {
      add(method, routePath, handler);
    } : undefined,
    async dispatch(method, routePath, requestLike) {
      const handler = routeHandlers.get(`${method.toUpperCase()} ${routePath}`);

      if (!handler) {
        return {
          ok: false,
          statusCode: 404,
          body: {
            ok: false,
            reasonCode: 'SYNTHETIC_ROUTE_NOT_FOUND',
            requiredActions: ['configure_route'],
          },
        };
      }

      const response = await handler(requestLike);

      return {
        ok: response && response.ok === true,
        statusCode: response && response.statusCode,
        body: response && response.body,
      };
    },
  };
}

function unsafeRequestLike() {
  return {
    params: {
      draftId: 'draft_task1009',
      phone: '+886977777777',
    },
    query: {
      preview: 'true',
      sql: 'select * from unsafe_query',
    },
    body: {
      organizationId: 'org_task1009',
      tenantId: 'tenant_task1009',
      idempotencyKey: 'idem_task1009',
      approvalContext: {
        accepted: true,
        approvalId: 'approval_task1009',
      },
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
        permissionSource: 'synthetic_task1009',
      },
      phone: '+886977777777',
      address: 'unsafe address',
      customerPhone: '+886988888888',
      lineUserId: 'unsafe_line',
      lineAccessToken: 'unsafe_line_token',
      finalAppointmentId: 'unsafe_final',
      DATABASE_URL: 'postgres://unsafe',
    },
    context: {
      organizationId: 'org_task1009',
      actorId: 'actor_task1009',
      requestId: 'req_task1009',
      headers: {
        authorization: 'Bearer unsafe',
      },
    },
    actor: {
      actorId: 'actor_task1009',
      role: 'dispatcher',
    },
    organizationId: 'org_task1009',
    tenantId: 'tenant_task1009',
    requestId: 'req_task1009',
    req: { unsafe: true },
    res: { unsafe: true },
    response: { unsafe: true },
    socket: { unsafe: true },
    headers: { authorization: 'Bearer unsafe' },
    cookies: { session: 'unsafe' },
    rawBody: 'unsafe raw body',
    sql: 'select * from unsafe_table',
  };
}

function createApplicationService(calls) {
  return {
    planDraftToCase: async (input) => {
      calls.push({ method: 'plan', input });
      return {
        ok: true,
        statusCode: 200,
        body: {
          ok: true,
          action: 'repair_intake_draft_to_case_plan',
          draftId: input.params && input.params.draftId,
          organizationId: input.context && input.context.organizationId,
          reasonCode: 'PLAN_READY',
          requiredActions: [],
          result: {
            accepted: true,
            sql: 'select * from unsafe_result',
          },
          metadata: {
            source: 'synthetic_task1009',
            authorization: 'Bearer unsafe',
          },
          phone: '+886977777777',
          address: 'unsafe address',
          lineUserId: 'unsafe_line',
          finalAppointmentId: 'unsafe_final',
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
          action: 'repair_intake_draft_to_case_submit',
          draftId: input.params && input.params.draftId,
          organizationId: input.context && input.context.organizationId,
          submitted: true,
          caseRef: {
            id: 'case_task1009',
            organizationId: input.context && input.context.organizationId,
            sourceDraftId: input.params && input.params.draftId,
            status: 'created',
            phone: '+886977777777',
          },
          reasonCode: 'SUBMIT_READY',
          requiredActions: [],
          rawRows: [{ phone: '+886977777777' }],
          databaseUrl: 'postgres://unsafe',
          lineAccessToken: 'unsafe_line_token',
          finalAppointmentId: 'unsafe_final',
        },
      };
    },
  };
}

function createActualApiModule(calls) {
  const controller = createRepairIntakeDraftToCaseController({
    applicationService: createApplicationService(calls),
  });

  return createRepairIntakeDraftToCaseApiModule({ controller });
}

function assertNoUnsafeText(value) {
  const keys = new Set();
  const collectKeys = (candidate) => {
    if (!candidate || typeof candidate !== 'object') {
      return;
    }

    for (const [key, fieldValue] of Object.entries(candidate)) {
      keys.add(key);
      collectKeys(fieldValue);
    }
  };
  collectKeys(value);

  for (const forbiddenKey of [
    'handler',
    'controller',
    'applicationService',
    'req',
    'res',
    'response',
    'socket',
    'headers',
    'cookies',
    'rawBody',
    'sql',
    'DATABASE_URL',
    'authorization',
    'customerPhone',
    'lineUserId',
    'lineAccessToken',
    'finalAppointmentId',
    'rawRows',
    'databaseUrl',
  ]) {
    assert.equal(keys.has(forbiddenKey), false, `forwarded unsafe key ${forbiddenKey}`);
  }

  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'select *',
    'unsafe_table',
    'unsafe_query',
    'unsafe_result',
    'DATABASE_URL',
    'postgres://',
    'Bearer unsafe',
    '+886977777777',
    '+886988888888',
    'unsafe address',
    'unsafe_line',
    'unsafe_line_token',
    'unsafe_final',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function assertSanitizedServiceInput(input) {
  assert.equal(input.params.draftId, 'draft_task1009');
  assert.equal(input.query.preview, 'true');
  assert.equal(input.body.organizationId, 'org_task1009');
  assert.equal(input.body.tenantId, 'tenant_task1009');
  assert.equal(input.body.idempotencyKey, 'idem_task1009');
  assert.equal(input.context.organizationId, 'org_task1009');
  assert.equal(input.context.actorId, 'actor_task1009');
  assert.equal(input.context.requestId, 'req_task1009');
  assert.equal(input.actor.actorId, 'actor_task1009');
  assert.equal(input.organizationId, 'org_task1009');
  assert.equal(input.tenantId, 'tenant_task1009');
  assert.equal(input.requestId, 'req_task1009');
  assertNoUnsafeText(input);
}

test('controller seam mounts through post target and dispatches sanitized plan flow', async () => {
  const calls = [];
  const apiModule = createActualApiModule(calls);
  const mountTarget = createSyntheticMountTarget();
  const summary = mountRepairIntakeDraftToCaseApiModule({
    mountTarget,
    apiModule,
  });

  assert.equal(apiModule.ok, true);
  assert.equal(summary.ok, true);
  assert.equal(summary.mounted, 2);
  assert.deepEqual(summary.routes, [
    {
      method: 'POST',
      path: '/repair-intake/drafts/:draftId/case/plan',
    },
    {
      method: 'POST',
      path: '/repair-intake/drafts/:draftId/case/submit',
    },
  ]);
  assertNoUnsafeText(summary);

  const response = await mountTarget.dispatch(
    'POST',
    '/repair-intake/drafts/:draftId/case/plan',
    unsafeRequestLike(),
  );

  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, 'plan');
  assertSanitizedServiceInput(calls[0].input);
  assert.equal(response.ok, true);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.reasonCode, 'PLAN_READY');
  assert.equal(response.body.draftId, 'draft_task1009');
  assert.equal(response.body.organizationId, 'org_task1009');
  assert.equal(response.body.result.accepted, true);
  assert.deepEqual(response.body.metadata, { source: 'synthetic_task1009' });
  assertNoUnsafeText(response);
});

test('controller seam mounts through register target and dispatches sanitized submit flow', async () => {
  const calls = [];
  const mountTarget = createSyntheticMountTarget({
    withPost: false,
    withRegister: true,
  });
  const summary = mountRepairIntakeDraftToCaseApiModule({
    mountTarget,
    apiModule: createActualApiModule(calls),
    basePath: '/internal/v1',
  });

  assert.equal(summary.ok, true);
  assert.deepEqual(mountTarget.registrations.map(({ method, path }) => ({ method, path })), [
    {
      method: 'POST',
      path: '/internal/v1/repair-intake/drafts/:draftId/case/plan',
    },
    {
      method: 'POST',
      path: '/internal/v1/repair-intake/drafts/:draftId/case/submit',
    },
  ]);
  assertNoUnsafeText(summary);

  const response = await mountTarget.dispatch(
    'POST',
    '/internal/v1/repair-intake/drafts/:draftId/case/submit',
    unsafeRequestLike(),
  );

  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, 'submit');
  assertSanitizedServiceInput(calls[0].input);
  assert.equal(response.ok, true);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.reasonCode, 'SUBMIT_READY');
  assert.equal(response.body.caseRef.id, 'case_task1009');
  assert.equal(response.body.caseRef.organizationId, 'org_task1009');
  assert.equal(response.body.caseRef.sourceDraftId, 'draft_task1009');
  assertNoUnsafeText(response);
});
