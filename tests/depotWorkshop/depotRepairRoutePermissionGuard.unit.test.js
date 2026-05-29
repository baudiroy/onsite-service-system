'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DEPOT_REPAIR_ROUTE_PATH,
  DEPOT_REPAIR_ROUTE_PERMISSION,
  buildServiceInput,
  createDepotRepairRouteHandler,
  registerDepotRepairRoutes,
} = require('../../src/routes/depotRepair.routes');

const ORG_ID = 'org_task_1913';
const BRAND_ID = 'brand_task_1913';
const SERVICE_PROVIDER_ID = 'service_provider_task_1913';
const SUBCONTRACTOR_ID = 'subcontractor_task_1913';
const ACTOR_ID = 'actor_task_1913';
const DEPOT_INTAKE_ID = 'depot_intake_task_1913';
const REQUEST_ID = 'req_task_1913';

function createSyntheticRouter() {
  return {
    routes: [],
    post(pathname, ...handlers) {
      this.routes.push({
        method: 'POST',
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
    method: 'POST',
    params: {
      depotIntakeId: DEPOT_INTAKE_ID,
      ...(overrides.params || {}),
    },
    body: {
      organizationId: ORG_ID,
      brandId: BRAND_ID,
      serviceProviderId: SERVICE_PROVIDER_ID,
      workshopId: 'workshop_task_1913',
      workshopTeamId: 'team_task_1913',
      assignedTechnicianId: 'technician_task_1913',
      assignmentNote: 'safe route note',
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
      role: 'brand',
      brandIds: [BRAND_ID],
      permissions: [DEPOT_REPAIR_ROUTE_PERMISSION],
      ...(overrides.user || {}),
    },
  };
}

function createDepotRepairService({ calls = [], result, impl } = {}) {
  return {
    async prepareDepotRepairRouteIntent(input) {
      calls.push(input);

      if (impl) {
        return impl(input);
      }

      return result || {
        ok: true,
        prepared: true,
        written: false,
        reasonCode: 'depot_repair_route_intent_prepared',
        requestId: input.requestId,
        assignmentIntent: {
          depotIntakeId: input.depotIntakeId,
          organizationId: input.organizationId,
          brandId: input.brandId,
          serviceProviderId: input.serviceProviderId,
          workshopId: input.workshopId,
          assignmentNote: input.assignmentNote,
          rawDbRow: 'raw db row should not leak',
          customerPhone: '0912 should not leak',
          customerAddress: 'full address should not leak',
          providerPayload: 'provider payload should not leak',
          finalAppointmentId: 'final appointment should not leak',
          fieldServiceReport: 'fsr should not leak',
        },
      };
    },
  };
}

function assertNoUnsafeLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'raw db row should not leak',
    '0912 should not leak',
    'full address should not leak',
    'provider payload should not leak',
    'final appointment should not leak',
    'fsr should not leak',
    'rawDbRow',
    'customerPhone',
    'customerAddress',
    'providerPayload',
    'finalAppointmentId',
    'fieldServiceReport',
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

test('registerDepotRepairRoutes mounts POST route only when service is injected', () => {
  const router = createSyntheticRouter();
  const summary = registerDepotRepairRoutes(router, {
    depotRepairService: createDepotRepairService(),
  });

  assert.equal(summary.ok, true);
  assert.equal(summary.mounted, 1);
  assert.deepEqual(summary.routes, [{
    method: 'POST',
    path: DEPOT_REPAIR_ROUTE_PATH,
  }]);
  assert.equal(router.routes.length, 1);
  assert.equal(router.routes[0].method, 'POST');
  assert.equal(router.routes[0].path, DEPOT_REPAIR_ROUTE_PATH);
  assert.equal(router.routes[0].handlers.length, 2);

  const noServiceRouter = createSyntheticRouter();
  const noServiceSummary = registerDepotRepairRoutes(noServiceRouter, {});
  assert.equal(noServiceSummary.ok, false);
  assert.equal(noServiceRouter.routes.length, 0);
});

test('permission guard runs before handler and injected service', async () => {
  const calls = [];
  const router = createSyntheticRouter();
  registerDepotRepairRoutes(router, {
    depotRepairService: createDepotRepairService({ calls }),
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

test('injected preflight allow path calls service and returns sanitized response', async () => {
  const calls = [];
  const router = createSyntheticRouter();
  registerDepotRepairRoutes(router, {
    depotRepairService: createDepotRepairService({ calls }),
  });
  const route = router.routes[0];
  const req = request();
  const res = createSyntheticRes();
  const permissionResult = await runPermission(route.handlers[0], req);

  assert.equal(permissionResult.nextError, null);
  await route.handlers[1](req, res);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].depotIntakeId, DEPOT_INTAKE_ID);
  assert.equal(calls[0].organizationId, ORG_ID);
  assert.equal(calls[0].actorId, ACTOR_ID);
  assert.equal(calls[0].permissionContext.canPrepareDepotRepair, true);
  assert.deepEqual(res.calls.status, [200]);
  assert.equal(res.calls.json[0].meta.ok, true);
  assert.equal(res.calls.json[0].meta.written, false);
  assert.equal(res.calls.json[0].data.depotRepair.depotIntakeId, DEPOT_INTAKE_ID);
  assertNoUnsafeLeak(res.calls.json[0]);
});

test('missing dependency returns safe unavailable response', async () => {
  const handler = createDepotRepairRouteHandler({});
  const res = createSyntheticRes();

  await handler(request(), res);

  assert.deepEqual(res.calls.status, [503]);
  assert.equal(res.calls.json[0].error.reasonCode, 'depot_repair_route_service_required');
  assertNoUnsafeLeak(res.calls.json[0]);
});

test('access guard denied safe failure occurs before service call', async () => {
  const calls = [];
  const handler = createDepotRepairRouteHandler({
    depotRepairService: createDepotRepairService({ calls }),
    accessGuard() {
      return {
        ok: false,
        allowed: false,
        reasonCode: 'depot_access_brand_scope_mismatch',
        rawDbRow: 'raw db row should not leak',
        stack: 'stack should not leak',
      };
    },
  });
  const res = createSyntheticRes();

  await handler(request(), res);

  assert.equal(calls.length, 0);
  assert.deepEqual(res.calls.status, [403]);
  assert.equal(res.calls.json[0].error.reasonCode, 'depot_access_brand_scope_mismatch');
  assertNoUnsafeLeak(res.calls.json[0]);
});

test('subcontractor route response excludes customer-sensitive fields', async () => {
  const handler = createDepotRepairRouteHandler({
    depotRepairService: createDepotRepairService(),
  });
  const res = createSyntheticRes();

  await handler(request({
    user: {
      role: 'subcontractor',
      brandIds: undefined,
      subcontractorOrganizationIds: [SUBCONTRACTOR_ID],
    },
    body: {
      actorRole: 'subcontractor',
      brandId: BRAND_ID,
      serviceProviderId: SERVICE_PROVIDER_ID,
      subcontractorOrganizationId: SUBCONTRACTOR_ID,
      assignmentRelationship: 'assigned_executor',
      customerPhone: '0912 should not leak',
      customerAddress: 'full address should not leak',
    },
  }), res);

  assert.deepEqual(res.calls.status, [200]);
  assertNoUnsafeLeak(res.calls.json[0]);
});

test('write scope not approved returns conflict before service call', async () => {
  const calls = [];
  const handler = createDepotRepairRouteHandler({
    depotRepairService: createDepotRepairService({ calls }),
  });
  const res = createSyntheticRes();

  await handler(request({
    body: {
      writeRequested: true,
    },
  }), res);

  assert.equal(calls.length, 0);
  assert.deepEqual(res.calls.status, [409]);
  assert.equal(res.calls.json[0].error.reasonCode, 'depot_repair_route_write_scope_not_approved');
  assertNoUnsafeLeak(res.calls.json[0]);
});

test('service failure is sanitized and buildServiceInput uses authenticated organization', async () => {
  const handler = createDepotRepairRouteHandler({
    depotRepairService: createDepotRepairService({
      impl() {
        throw new Error('raw failure should not leak token secret');
      },
    }),
  });
  const res = createSyntheticRes();
  const input = buildServiceInput(request({
    body: {
      organizationId: 'body_org_should_not_win',
      depotIntakeId: 'body_depot_should_not_win',
    },
  }));

  assert.equal(input.organizationId, ORG_ID);
  assert.equal(input.actorId, ACTOR_ID);
  assert.equal(input.depotIntakeId, DEPOT_INTAKE_ID);

  await handler(request(), res);

  assert.deepEqual(res.calls.status, [503]);
  assert.equal(res.calls.json[0].error.reasonCode, 'depot_repair_route_service_failed');
  assertNoUnsafeLeak(res.calls.json[0]);
});
