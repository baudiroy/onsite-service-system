'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DISPATCH_ASSIGNMENT_ADMIN_PERMISSION,
  DISPATCH_ASSIGNMENT_ADMIN_ROUTE_PATH,
  buildServiceInput,
  createDispatchAssignmentRouteHandler,
  registerDispatchAssignmentRoutes,
} = require('../../src/routes/dispatchAssignment.routes');

const ASSIGNMENT_ID = '11111111-1111-4111-8111-111111111111';
const ORG_ID = '33333333-3333-4333-8333-333333333333';
const DISPATCH_UNIT_ID = '44444444-4444-4444-8444-444444444444';
const ENGINEER_ID = '55555555-5555-4555-8555-555555555555';
const ACTOR_ID = '66666666-6666-4666-8666-666666666666';
const REQUEST_ID = 'req_task_1901';

function createSyntheticRouter() {
  return {
    routes: [],
    patch(pathname, ...handlers) {
      this.routes.push({
        method: 'PATCH',
        path: pathname,
        handlers,
      });
      return this;
    },
  };
}

function createSyntheticRes() {
  const calls = {
    status: [],
    json: [],
  };

  return {
    calls,
    status(code) {
      calls.status.push(code);
      return this;
    },
    json(body) {
      calls.json.push(body);
      return body;
    },
  };
}

function request(overrides = {}) {
  return {
    params: {
      assignmentId: ASSIGNMENT_ID,
      ...(overrides.params || {}),
    },
    body: {
      dispatchUnitId: DISPATCH_UNIT_ID,
      assignedEngineerId: ENGINEER_ID,
      dispatchStatus: 'assigned',
      assignmentNote: 'safe assignment note',
      ...(overrides.body || {}),
    },
    context: {
      requestId: REQUEST_ID,
      ...(overrides.context || {}),
    },
    requestId: REQUEST_ID,
    user: {
      id: ACTOR_ID,
      organizationId: ORG_ID,
      permissions: [DISPATCH_ASSIGNMENT_ADMIN_PERMISSION],
      ...(overrides.user || {}),
    },
    get() {
      return undefined;
    },
  };
}

function createAssignmentService({ calls = [], result, impl } = {}) {
  return {
    async assignAppointment(input) {
      calls.push(input);

      if (impl) {
        return impl(input);
      }

      return result || {
        ok: true,
        assigned: true,
        reasonCode: 'dispatch_assignment_intent_accepted',
        requestId: input.requestId,
        assignment: {
          dispatchAssignmentId: input.assignmentId,
          organizationId: input.organizationId,
          dispatchUnitId: input.dispatchUnitId,
          assignedEngineerId: input.assignedEngineerId,
          dispatchStatus: input.dispatchStatus,
          assignmentNote: input.assignmentNote,
        },
        auditContext: {
          actorId: input.actorId,
          organizationId: input.organizationId,
          permission: DISPATCH_ASSIGNMENT_ADMIN_PERMISSION,
          requestId: input.requestId,
        },
      };
    },
  };
}

function assertNoUnsafeLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'raw service failure should not leak',
    'raw provider payload should not leak',
    'raw db row should not leak',
    'DATABASE_URL',
    'postgres' + '://',
    'stack',
    'sql',
    'token',
    'secret',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

async function runPermission(handler, req) {
  let nextError = null;
  let nextCalled = false;

  await handler(req, createSyntheticRes(), (error) => {
    nextCalled = true;
    nextError = error || null;
  });

  return { nextCalled, nextError };
}

test('registerDispatchAssignmentRoutes mounts PATCH route only when service is injected', () => {
  const router = createSyntheticRouter();
  const summary = registerDispatchAssignmentRoutes(router, {
    assignmentService: createAssignmentService(),
  });

  assert.equal(summary.ok, true);
  assert.equal(summary.mounted, 1);
  assert.deepEqual(summary.routes, [{
    method: 'PATCH',
    path: DISPATCH_ASSIGNMENT_ADMIN_ROUTE_PATH,
  }]);
  assert.equal(router.routes.length, 1);
  assert.equal(router.routes[0].method, 'PATCH');
  assert.equal(router.routes[0].path, DISPATCH_ASSIGNMENT_ADMIN_ROUTE_PATH);
  assert.equal(router.routes[0].handlers.length, 2);

  const noServiceRouter = createSyntheticRouter();
  const noServiceSummary = registerDispatchAssignmentRoutes(noServiceRouter, {});
  assert.equal(noServiceSummary.ok, false);
  assert.equal(noServiceRouter.routes.length, 0);
});

test('permission guard runs before injected service and denies missing permission', async () => {
  const calls = [];
  const router = createSyntheticRouter();
  registerDispatchAssignmentRoutes(router, {
    assignmentService: createAssignmentService({ calls }),
  });
  const route = router.routes[0];
  const deniedReq = request({
    user: {
      permissions: [],
    },
  });

  const permissionResult = await runPermission(route.handlers[0], deniedReq);

  assert.equal(permissionResult.nextCalled, true);
  assert.equal(permissionResult.nextError && permissionResult.nextError.code, 'PERMISSION_DENIED');
  assert.equal(calls.length, 0);
});

test('synthetic allow path calls injected service and returns normalized response', async () => {
  const calls = [];
  const router = createSyntheticRouter();
  registerDispatchAssignmentRoutes(router, {
    assignmentService: createAssignmentService({ calls }),
  });
  const route = router.routes[0];
  const req = request();
  const res = createSyntheticRes();
  const permissionResult = await runPermission(route.handlers[0], req);

  assert.equal(permissionResult.nextError, null);
  await route.handlers[1](req, res);

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    assignmentId: ASSIGNMENT_ID,
    organizationId: ORG_ID,
    actorId: ACTOR_ID,
    actor: {
      id: ACTOR_ID,
      userId: ACTOR_ID,
      organizationId: ORG_ID,
    },
    dispatchUnitId: DISPATCH_UNIT_ID,
    assignedEngineerId: ENGINEER_ID,
    dispatchStatus: 'assigned',
    assignmentNote: 'safe assignment note',
    occurredAt: undefined,
    requestId: REQUEST_ID,
    context: {
      requestId: REQUEST_ID,
      organizationId: ORG_ID,
      actorId: ACTOR_ID,
      permissionContext: {
        canManageDispatch: true,
        permission: DISPATCH_ASSIGNMENT_ADMIN_PERMISSION,
      },
    },
    permissionContext: {
      canManageDispatch: true,
      permission: DISPATCH_ASSIGNMENT_ADMIN_PERMISSION,
    },
  });
  assert.deepEqual(res.calls.status, [200]);
  assert.equal(res.calls.json[0].meta.ok, true);
  assert.equal(res.calls.json[0].data.assignment.dispatchAssignmentId, ASSIGNMENT_ID);
  assertNoUnsafeLeak(res.calls.json[0]);
});

test('missing dependency handler returns safe unavailable response', async () => {
  const handler = createDispatchAssignmentRouteHandler({});
  const res = createSyntheticRes();

  await handler(request(), res);

  assert.deepEqual(res.calls.status, [503]);
  assert.equal(res.calls.json[0].error.code, 'DISPATCH_ASSIGNMENT_UNAVAILABLE');
  assert.equal(res.calls.json[0].error.reasonCode, 'assignment_route_dependency_required');
  assertNoUnsafeLeak(res.calls.json[0]);
});

test('service denied and service failure responses are sanitized', async () => {
  const deniedHandler = createDispatchAssignmentRouteHandler({
    assignmentService: createAssignmentService({
      result: {
        ok: false,
        reasonCode: 'dispatch_assignment_not_found_or_denied',
        requestId: REQUEST_ID,
        rows: [{ raw: 'raw db row should not leak' }],
      },
    }),
  });
  const failureHandler = createDispatchAssignmentRouteHandler({
    assignmentService: createAssignmentService({
      impl() {
        throw new Error('raw service failure should not leak token secret');
      },
    }),
  });
  const deniedRes = createSyntheticRes();
  const failureRes = createSyntheticRes();

  await deniedHandler(request(), deniedRes);
  await failureHandler(request(), failureRes);

  assert.deepEqual(deniedRes.calls.status, [404]);
  assert.equal(deniedRes.calls.json[0].error.reasonCode, 'dispatch_assignment_not_found_or_denied');
  assertNoUnsafeLeak(deniedRes.calls.json[0]);
  assert.deepEqual(failureRes.calls.status, [502]);
  assert.equal(failureRes.calls.json[0].error.reasonCode, 'dispatch_assignment_route_failed');
  assertNoUnsafeLeak(failureRes.calls.json[0]);
});

test('buildServiceInput uses actor and organization from authenticated request context', () => {
  const input = buildServiceInput(request({
    body: {
      organizationId: 'body_org_should_not_win',
      assignmentId: 'body_assignment_should_not_win',
      dispatchUnitId: DISPATCH_UNIT_ID,
      assignedEngineerId: ENGINEER_ID,
      assignmentNote: 'safe assignment note',
    },
  }));

  assert.equal(input.assignmentId, ASSIGNMENT_ID);
  assert.equal(input.organizationId, ORG_ID);
  assert.equal(input.actorId, ACTOR_ID);
  assert.equal(input.permissionContext.permission, DISPATCH_ASSIGNMENT_ADMIN_PERMISSION);
});
