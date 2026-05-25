'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftToCaseApiModule,
} = require('../../src/repairIntake/repairIntakeDraftToCaseApiModule');
const {
  mountRepairIntakeDraftToCaseApiModule,
} = require('../../src/repairIntake/repairIntakeDraftToCaseHttpMountAdapter');

function syntheticController() {
  return {
    async planDraftToCase(requestLike = {}) {
      return {
        ok: true,
        statusCode: 200,
        body: {
          ok: true,
          action: 'repair_intake_draft_to_case_plan',
          draftId: requestLike.params && requestLike.params.draftId,
          organizationId: requestLike.context && requestLike.context.organizationId,
          reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PLAN_READY',
          requiredActions: [],
        },
      };
    },
    async submitDraftToCase(requestLike = {}) {
      return {
        ok: true,
        statusCode: 200,
        body: {
          ok: true,
          action: 'repair_intake_draft_to_case_submit',
          draftId: requestLike.params && requestLike.params.draftId,
          organizationId: requestLike.context && requestLike.context.organizationId,
          submitted: true,
          caseRef: {
            id: 'case_task999',
            organizationId: requestLike.context && requestLike.context.organizationId,
            sourceDraftId: requestLike.params && requestLike.params.draftId,
            status: 'created',
          },
          reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_SUBMITTED',
          requiredActions: [],
        },
      };
    },
  };
}

function actualApiModule() {
  return createRepairIntakeDraftToCaseApiModule({
    controller: syntheticController(),
  });
}

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

function requestLike() {
  return {
    params: {
      draftId: 'draft_task999',
    },
    body: {
      organizationId: 'org_task999',
      phone: '+886900000000',
      address: 'unsafe address',
      rawCustomerPayload: { name: 'unsafe customer' },
      lineUserId: 'unsafe_line',
      finalAppointmentId: 'unsafe_final',
    },
    context: {
      organizationId: 'org_task999',
      actorId: 'actor_task999',
      requestId: 'req_task999',
    },
  };
}

function assertNoForbiddenFields(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'handler',
    'rawRoute',
    'rawRoutes',
    'apiModule',
    'mountTarget',
    'select *',
    'stack trace',
    'sql',
    'SQL',
    'token',
    'secret',
    '+886900000000',
    'unsafe address',
    'rawCustomerPayload',
    'unsafe customer',
    'lineUserId',
    'unsafe_line',
    'lineAccessToken',
    'LINE access token',
    'finalAppointmentId',
    'unsafe_final',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('actual Task967 API module envelope mounts through injected post target and dispatches plan route', async () => {
  const moduleEnvelope = actualApiModule();
  const mountTarget = createSyntheticMountTarget();
  const summary = mountRepairIntakeDraftToCaseApiModule({
    mountTarget,
    apiModule: moduleEnvelope,
  });

  assert.equal(moduleEnvelope.ok, true);
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
  assertNoForbiddenFields(summary);

  const response = await mountTarget.dispatch(
    'POST',
    '/repair-intake/drafts/:draftId/case/plan',
    requestLike(),
  );

  assert.equal(response.ok, true);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, {
    ok: true,
    action: 'repair_intake_draft_to_case_plan',
    draftId: 'draft_task999',
    organizationId: 'org_task999',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PLAN_READY',
    requiredActions: [],
  });
  assertNoForbiddenFields(response);
});

test('actual Task967 API module envelope mounts through register target and dispatches submit route', async () => {
  const mountTarget = createSyntheticMountTarget({
    withPost: false,
    withRegister: true,
  });
  const summary = mountRepairIntakeDraftToCaseApiModule({
    mountTarget,
    apiModule: actualApiModule(),
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
  assertNoForbiddenFields(summary);

  const response = await mountTarget.dispatch(
    'POST',
    '/internal/v1/repair-intake/drafts/:draftId/case/submit',
    requestLike(),
  );

  assert.equal(response.ok, true);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.caseRef, {
    id: 'case_task999',
    organizationId: 'org_task999',
    sourceDraftId: 'draft_task999',
    status: 'created',
  });
  assertNoForbiddenFields(response);
});

test('actual API module mount uses only sanitized route summary metadata', () => {
  const mountTarget = createSyntheticMountTarget();
  const summary = mountRepairIntakeDraftToCaseApiModule({
    mountTarget,
    apiModule: actualApiModule(),
  });

  assert.equal(summary.ok, true);
  assert.deepEqual(Object.keys(summary).sort(), [
    'mounted',
    'ok',
    'reasonCode',
    'requiredActions',
    'routes',
  ]);

  for (const route of summary.routes) {
    assert.deepEqual(Object.keys(route).sort(), ['method', 'path']);
  }

  assertNoForbiddenFields(summary);
});
