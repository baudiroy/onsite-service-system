'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  WORKSHOP_ASSIGNMENT_SERVICE_KIND,
  WORKSHOP_ASSIGN_PERMISSION,
  createWorkshopAssignmentService,
} = require('../../src/services/WorkshopAssignmentService');

const ORG_ID = 'org_task_1911';
const TENANT_ID = 'tenant_task_1911';
const ACTOR_ID = 'actor_task_1911';
const DRAFT_ID = 'draft_task_1911';
const BRAND_ID = 'brand_task_1911';
const SERVICE_PROVIDER_ID = 'service_provider_task_1911';
const REQUEST_ID = 'req_task_1911';

function depotIntake(overrides = {}) {
  return {
    draftId: DRAFT_ID,
    organizationId: ORG_ID,
    tenantId: TENANT_ID,
    workflowType: 'depot',
    depotStatus: 'diagnosis_pending',
    brandId: BRAND_ID,
    serviceProviderId: SERVICE_PROVIDER_ID,
    itemRef: 'item_ref_safe_1911',
    productRef: 'product_ref_safe_1911',
    issueSummaryRef: 'issue_ref_safe_1911',
    customerPhone: 'unsafe phone should not leak',
    customerName: 'unsafe customer should not leak',
    address: 'unsafe address should not leak',
    providerPayload: 'unsafe provider should not leak',
    finalAppointmentId: 'unsafe final should not leak',
    fieldServiceReport: 'unsafe fsr should not leak',
    ...overrides,
  };
}

function createRepository({ calls = [], result, reject } = {}) {
  return {
    async findDepotIntakeState(input) {
      calls.push(input);

      if (reject) {
        throw new Error('raw repo failure should not leak database password should not leak');
      }

      if (result !== undefined) {
        return result;
      }

      return {
        ok: true,
        found: true,
        depotIntake: depotIntake(),
      };
    },
  };
}

function validCommand(overrides = {}) {
  return {
    draftId: DRAFT_ID,
    organizationId: ORG_ID,
    tenantId: TENANT_ID,
    actorId: ACTOR_ID,
    brandId: BRAND_ID,
    serviceProviderId: SERVICE_PROVIDER_ID,
    workshopId: 'workshop_safe_1911',
    workshopTeamId: 'team_safe_1911',
    assignedTechnicianId: 'technician_safe_1911',
    assignmentNote: 'safe note',
    requestId: REQUEST_ID,
    permissionContext: {
      permission: WORKSHOP_ASSIGN_PERMISSION,
    },
    ...overrides,
  };
}

function assertFailure(result, reasonCode) {
  assert.equal(result.ok, false);
  assert.equal(result.prepared, false);
  assert.equal(result.written, false);
  assert.equal(result.serviceKind, WORKSHOP_ASSIGNMENT_SERVICE_KIND);
  assert.equal(result.reasonCode, reasonCode);
}

function assertNoUnsafeLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'unsafe phone should not leak',
    'unsafe customer should not leak',
    'unsafe address should not leak',
    'unsafe provider should not leak',
    'unsafe final should not leak',
    'unsafe fsr should not leak',
    'raw repo failure should not leak',
    'database password should not leak',
    'customerPhone',
    'customerName',
    'address',
    'providerPayload',
    'finalAppointmentId',
    'fieldServiceReport',
    'rows',
    'stack',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('synthetic assignment intent allow path returns sanitized prepared envelope', async () => {
  const calls = [];
  const service = createWorkshopAssignmentService({
    depotIntakeRepository: createRepository({ calls }),
  });

  const result = await service.prepareAssignmentIntent(validCommand());

  assert.equal(result.ok, true);
  assert.equal(result.prepared, true);
  assert.equal(result.written, false);
  assert.equal(result.serviceKind, WORKSHOP_ASSIGNMENT_SERVICE_KIND);
  assert.equal(result.reasonCode, 'workshop_assignment_intent_prepared');
  assert.deepEqual(calls, [{
    draftId: DRAFT_ID,
    organizationId: ORG_ID,
    tenantId: TENANT_ID,
    brandId: BRAND_ID,
    serviceProviderId: SERVICE_PROVIDER_ID,
    requestId: REQUEST_ID,
  }]);
  assert.deepEqual(result.assignmentIntent, {
    depotIntakeId: DRAFT_ID,
    organizationId: ORG_ID,
    tenantId: TENANT_ID,
    workflowType: 'depot',
    depotStatus: 'diagnosis_pending',
    brandId: BRAND_ID,
    serviceProviderId: SERVICE_PROVIDER_ID,
    itemRef: 'item_ref_safe_1911',
    productRef: 'product_ref_safe_1911',
    issueSummaryRef: 'issue_ref_safe_1911',
    workshopId: 'workshop_safe_1911',
    workshopTeamId: 'team_safe_1911',
    assignedTechnicianId: 'technician_safe_1911',
    subcontractorOrganizationId: null,
    assignmentNote: 'safe note',
    assignedByActorId: ACTOR_ID,
    actorRole: null,
    permission: WORKSHOP_ASSIGN_PERMISSION,
    writeRequired: false,
    requestId: REQUEST_ID,
  });
  assertNoUnsafeLeak(result);
});

test('missing dependency and missing depot intake fail safely', async () => {
  const missingDependency = createWorkshopAssignmentService({});
  const calls = [];
  const missingDepot = createWorkshopAssignmentService({
    depotIntakeRepository: createRepository({
      calls,
      result: {
        ok: false,
        found: false,
        reasonCode: 'depot_intake_not_found_or_denied',
      },
    }),
  });

  assertFailure(await missingDependency.prepareAssignmentIntent(validCommand()), 'depot_intake_repository_required');
  assertFailure(await missingDepot.prepareAssignmentIntent(validCommand()), 'depot_intake_not_found_or_denied');
  assert.equal(calls.length, 1);
});

test('organization brand and service-provider mismatch fail closed', async () => {
  for (const [override, commandOverride] of [
    [{ organizationId: 'org_other' }, {}],
    [{ brandId: 'brand_other' }, {}],
    [{ serviceProviderId: 'provider_other' }, {}],
    [{}, { brandId: 'brand_other' }],
    [{}, { serviceProviderId: 'provider_other' }],
  ]) {
    const service = createWorkshopAssignmentService({
      depotIntakeRepository: createRepository({
        result: {
          ok: true,
          found: true,
          depotIntake: depotIntake(override),
        },
      }),
    });

    assertFailure(await service.prepareAssignmentIntent(validCommand(commandOverride)), 'depot_intake_not_found_or_denied');
  }
});

test('invalid depot status and workflow are denied before assignment intent', async () => {
  for (const depotOverride of [
    { depotStatus: 'returned' },
    { depotStatus: 'closed' },
    { workflowType: 'onsite' },
  ]) {
    const service = createWorkshopAssignmentService({
      depotIntakeRepository: createRepository({
        result: {
          ok: true,
          found: true,
          depotIntake: depotIntake(depotOverride),
        },
      }),
    });

    assertFailure(await service.prepareAssignmentIntent(validCommand()), 'workshop_assignment_depot_status_ineligible');
  }
});

test('subcontractor scope denied unless explicit assignment relationship exists', async () => {
  const denied = createWorkshopAssignmentService({
    depotIntakeRepository: createRepository(),
  });
  const allowed = createWorkshopAssignmentService({
    depotIntakeRepository: createRepository(),
  });

  assertFailure(await denied.prepareAssignmentIntent(validCommand({
    actorRole: 'subcontractor',
  })), 'workshop_assignment_subcontractor_scope_required');

  const result = await allowed.prepareAssignmentIntent(validCommand({
    actorRole: 'subcontractor',
    assignmentRelationship: 'assigned_executor',
    subcontractorOrganizationId: 'subcontractor_safe_1911',
  }));

  assert.equal(result.ok, true);
  assert.equal(result.assignmentIntent.subcontractorOrganizationId, 'subcontractor_safe_1911');
  assertNoUnsafeLeak(result);
});

test('invalid command and forbidden write or unsafe payload fail before repository read', async () => {
  const calls = [];
  const service = createWorkshopAssignmentService({
    depotIntakeRepository: createRepository({ calls }),
  });

  assertFailure(await service.prepareAssignmentIntent(validCommand({
    writeRequested: true,
  })), 'workshop_assignment_write_scope_not_approved');
  assertFailure(await service.prepareAssignmentIntent(validCommand({
    draftId: undefined,
  })), 'depot_intake_required');
  assertFailure(await service.prepareAssignmentIntent(validCommand({
    permissionContext: {},
  })), 'workshop_assignment_permission_required');
  assertFailure(await service.prepareAssignmentIntent(validCommand({
    workshopId: undefined,
    workshopTeamId: undefined,
    assignedTechnicianId: undefined,
    assignmentNote: undefined,
  })), 'workshop_assignment_intent_required');
  assertFailure(await service.prepareAssignmentIntent(validCommand({
    finalAppointmentId: 'unsafe final should not leak',
  })), 'workshop_assignment_payload_forbidden_fields');
  assert.equal(calls.length, 0);
});

test('repository failure is sanitized', async () => {
  const service = createWorkshopAssignmentService({
    depotIntakeRepository: createRepository({ reject: true }),
  });

  const result = await service.prepareAssignmentIntent(validCommand());

  assertFailure(result, 'workshop_assignment_service_failed');
  assertNoUnsafeLeak(result);
});
