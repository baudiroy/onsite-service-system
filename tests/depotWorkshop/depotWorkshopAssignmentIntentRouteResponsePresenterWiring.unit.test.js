'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DEPOT_REPAIR_ROUTE_PATH,
  DEPOT_REPAIR_ROUTE_PERMISSION,
  createDepotRepairRouteHandler,
  registerDepotRepairRoutes,
} = require('../../src/routes/depotRepair.routes');

const ORG_ID = 'org_task_2388';
const BRAND_ID = 'brand_task_2388';
const SERVICE_PROVIDER_ID = 'provider_task_2388';
const DEPOT_INTAKE_ID = 'depot_intake_task_2388';
const REQUEST_ID = 'req_task_2388';
const ACTOR_ID = 'actor_task_2388';

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
      workshopId: 'workshop_task_2388',
      workshopTeamId: 'team_task_2388',
      assignedTechnicianId: 'tech_task_2388',
      assignmentNote: 'Prepare presenter response.',
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

function serviceResult(overrides = {}) {
  return {
    ok: true,
    prepared: true,
    written: false,
    reasonCode: 'workshop_assignment_intent_prepared',
    requestId: REQUEST_ID,
    assignmentIntent: {
      depotIntakeId: DEPOT_INTAKE_ID,
      organizationId: ORG_ID,
      brandId: BRAND_ID,
      serviceProviderId: SERVICE_PROVIDER_ID,
      workflowType: 'depot',
      depotStatus: 'diagnosis_pending',
      workshopId: 'workshop_task_2388',
      workshopTeamId: 'team_task_2388',
      assignedTechnicianId: 'tech_task_2388',
      assignmentNote: 'Prepare presenter response.',
      assignedByActorId: ACTOR_ID,
      actorRole: 'brand',
      permission: 'workshop.assign',
      writeRequired: true,
      requestId: REQUEST_ID,
      repairOrderDraft: {
        repairOrderId: 'repair_order_task_2388',
        caseId: 'case_task_2388',
        depotIntakeId: DEPOT_INTAKE_ID,
        workflowType: 'depot',
        depotStatus: 'diagnosis_pending',
        workshopId: 'workshop_task_2388',
        rawDbRow: 'raw db row should not leak',
      },
      repairOrderTransitionPlan: {
        fromStatus: 'diagnosis_pending',
        toStatus: 'repair_in_progress',
        reasonCode: 'depot_workshop_repair_order_transition_planned',
        transitionStatus: 'planned',
      },
      repairOrderAuditIntent: {
        eventType: 'depot_workshop_repair_assignment_intent_prepared',
        auditStatus: 'prepared',
        customerVisible: false,
        metadata: {
          stack: 'stack should not leak',
        },
      },
      repairOrderCustomerProjection: {
        repairOrderReference: 'DEPOT-ORDER-2388',
        caseReference: 'CASE-2388',
        depotStatus: 'diagnosis_pending',
        statusLabelKey: 'depot.status.diagnosis_pending',
        publicNotes: 'Workshop is reviewing your item.',
        providerPayload: 'provider payload should not leak',
      },
      finalAppointmentId: 'final appointment should not leak',
      fieldServiceReport: 'fsr should not leak',
      completionReport: 'completion report should not leak',
      customerPhone: '0912 should not leak',
      rawRows: ['raw row should not leak'],
      providerPayload: 'provider payload should not leak',
      billingInternals: 'billing should not leak',
      aiOutput: 'ai output should not leak',
      ...(overrides.assignmentIntent || {}),
    },
    ...overrides,
  };
}

function createDepotRepairService({ calls = [], result } = {}) {
  return {
    async prepareDepotRepairRouteIntent(input) {
      calls.push(input);
      return result || serviceResult();
    },
  };
}

function assertNoForbiddenLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'raw db row should not leak',
    'raw row should not leak',
    'stack should not leak',
    'provider payload should not leak',
    'final appointment should not leak',
    'fsr should not leak',
    'completion report should not leak',
    '0912 should not leak',
    'billing should not leak',
    'ai output should not leak',
    'rawDbRow',
    'rawRows',
    'metadata',
    'providerPayload',
    'finalAppointmentId',
    'fieldServiceReport',
    'completionReport',
    'customerPhone',
    'billingInternals',
    'aiOutput',
    'DATABASE_URL',
    'postgres' + '://',
    'token',
    'secret',
    'sql',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('route path and permission remain unchanged while presenter is wired', () => {
  const router = createSyntheticRouter();
  const summary = registerDepotRepairRoutes(router, {
    depotRepairService: createDepotRepairService(),
  });

  assert.equal(summary.ok, true);
  assert.equal(router.routes[0].method, 'POST');
  assert.equal(router.routes[0].path, DEPOT_REPAIR_ROUTE_PATH);
  assert.equal(DEPOT_REPAIR_ROUTE_PERMISSION, 'depot.repair.prepare');
});

test('normal assignment intent response uses presenter-compatible envelope and allowlist', async () => {
  const calls = [];
  const result = serviceResult();
  const before = JSON.stringify(result);
  const handler = createDepotRepairRouteHandler({
    depotRepairService: createDepotRepairService({ calls, result }),
    accessGuard() {
      return { allowed: true };
    },
  });
  const res = createSyntheticRes();

  await handler(request(), res);

  assert.equal(JSON.stringify(result), before);
  assert.deepEqual(res.calls.status, [200]);
  assert.deepEqual(Object.keys(res.calls.json[0]), ['data', 'meta', 'requestId']);
  assert.equal(res.calls.json[0].meta.ok, true);
  assert.equal(res.calls.json[0].meta.prepared, true);
  assert.equal(res.calls.json[0].meta.written, false);
  assert.equal(res.calls.json[0].requestId, REQUEST_ID);
  assert.equal(calls.length, 1);

  const depotRepair = res.calls.json[0].data.depotRepair;

  assert.equal(depotRepair.depotIntakeId, DEPOT_INTAKE_ID);
  assert.equal(depotRepair.writeRequired, false);
  assert.equal(depotRepair.repairOrderDraftSummary.repairOrderId, 'repair_order_task_2388');
  assert.equal(depotRepair.repairOrderTransitionPlanSummary.toStatus, 'repair_in_progress');
  assert.equal(depotRepair.repairOrderAuditIntentSummary.customerVisible, false);
  assert.equal(depotRepair.repairOrderCustomerProjectionPreview.repairOrderReference, 'DEPOT-ORDER-2388');
  assert.equal(Object.prototype.hasOwnProperty.call(depotRepair, 'repairOrderDraft'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(depotRepair, 'repairOrderTransitionPlan'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(depotRepair, 'repairOrderAuditIntent'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(depotRepair, 'repairOrderCustomerProjection'), false);
  assertNoForbiddenLeak(res.calls.json[0]);
});

test('route write scope remains blocked before service or presenter response execution', async () => {
  const calls = [];
  const handler = createDepotRepairRouteHandler({
    depotRepairService: createDepotRepairService({ calls }),
    accessGuard() {
      return { allowed: true };
    },
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
  assertNoForbiddenLeak(res.calls.json[0]);
});

test('failure route result remains safe and forbidden fields are omitted', async () => {
  const handler = createDepotRepairRouteHandler({
    depotRepairService: createDepotRepairService({
      result: {
        ok: false,
        reasonCode: 'workshop_assignment_permission_required',
        requestId: REQUEST_ID,
        rawError: {
          stack: 'stack should not leak',
        },
        finalAppointmentId: 'final appointment should not leak',
      },
    }),
    accessGuard() {
      return { allowed: true };
    },
  });
  const res = createSyntheticRes();

  await handler(request(), res);

  assert.deepEqual(res.calls.status, [403]);
  assert.deepEqual(res.calls.json[0], {
    error: {
      code: 'DEPOT_REPAIR_ROUTE_DENIED',
      message: 'Depot repair route denied.',
      reasonCode: 'workshop_assignment_permission_required',
      requestId: REQUEST_ID,
    },
  });
  assertNoForbiddenLeak(res.calls.json[0]);
});
