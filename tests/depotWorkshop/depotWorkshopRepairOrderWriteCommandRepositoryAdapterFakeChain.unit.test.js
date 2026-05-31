'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DEPOT_WORKSHOP_ASSIGNMENT_INTENT_WRITE_ACTION,
  buildDepotWorkshopAssignmentIntentWriteCommand,
} = require('../../src/depotWorkshop/depotWorkshopAssignmentIntentWriteCommand');
const {
  createDepotWorkshopRepairOrderSqlRepositoryAdapter,
} = require('../../src/repositories/DepotWorkshopRepairOrderSqlRepositoryAdapter');

function validPreparedInput(overrides = {}) {
  const {
    assignmentIntent: assignmentIntentOverrides = {},
    permissionContext: permissionContextOverrides = {},
    ...topLevelOverrides
  } = overrides;

  return {
    writeAuthorized: true,
    assignmentIntent: {
      organizationId: 'org-chain-1',
      tenantId: 'tenant-chain-1',
      caseId: 'case-chain-1',
      depotIntakeId: 'depot-chain-1',
      repairOrderId: 'RO-chain-1',
      depotStatus: 'intake_received',
      targetDepotStatus: 'diagnosis_pending',
      brandId: 'brand-chain-1',
      serviceProviderId: 'provider-chain-1',
      subcontractorOrganizationId: 'subcontractor-chain-1',
      assignmentRelationship: 'assigned',
      workshopId: 'workshop-chain-1',
      workshopTeamId: 'team-chain-1',
      assignedTechnicianId: 'tech-chain-1',
      actorId: 'actor-chain-1',
      actorRole: 'admin',
      requestId: 'req-chain-1',
      repairOrderCustomerProjection: {
        repairOrderReference: 'RO-chain-1',
        caseReference: 'CASE-chain-1',
        depotStatus: 'intake_received',
        statusLabelKey: 'depot.status.intake_received',
        publicNotes: 'Safe customer note',
      },
      ...assignmentIntentOverrides,
    },
    permissionContext: {
      permissions: [DEPOT_WORKSHOP_ASSIGNMENT_INTENT_WRITE_ACTION],
      ...permissionContextOverrides,
    },
    ...topLevelOverrides,
  };
}

function buildSafeWriteCommand(overrides = {}) {
  return buildDepotWorkshopAssignmentIntentWriteCommand(validPreparedInput(overrides));
}

function successRow(overrides = {}) {
  return {
    id: 'repair-order-db-id-1',
    organization_id: 'org-chain-1',
    tenant_id: 'tenant-chain-1',
    case_id: 'case-chain-1',
    depot_intake_id: 'depot-chain-1',
    repair_order_ref: 'RO-chain-1',
    request_id: 'req-chain-1',
    ...overrides,
  };
}

function fakeAdapter({ onQuery } = {}) {
  const calls = [];
  const adapter = createDepotWorkshopRepairOrderSqlRepositoryAdapter({
    dbClient: {
      async query(querySpec) {
        calls.push(querySpec);

        if (typeof onQuery === 'function') {
          return onQuery(querySpec);
        }

        return { rows: [successRow()] };
      },
    },
  });

  return { adapter, calls };
}

test('write command composes with fake SQL adapter into parameterized repository result', async () => {
  const commandEnvelope = buildSafeWriteCommand();
  const { adapter, calls } = fakeAdapter();

  const result = await adapter.writeRepairOrder(commandEnvelope);

  assert.equal(commandEnvelope.ok, true);
  assert.equal(commandEnvelope.action, DEPOT_WORKSHOP_ASSIGNMENT_INTENT_WRITE_ACTION);
  assert.equal(result.ok, true);
  assert.equal(result.status, 'written');
  assert.equal(result.written, true);
  assert.equal(result.repositoryKind, 'depot_workshop.repair_order_repository_contract');
  assert.equal(result.organizationId, 'org-chain-1');
  assert.equal(result.caseId, 'case-chain-1');
  assert.equal(result.depotIntakeId, 'depot-chain-1');
  assert.equal(result.repairOrderId, 'RO-chain-1');
  assert.equal(result.repairOrderReference, 'RO-chain-1');
  assert.equal(result.requestId, 'req-chain-1');
  assert.equal(calls.length, 1);
  assert.match(calls[0].text, /INSERT INTO depot_workshop_repair_orders/);
  assert.match(calls[0].text, /ON CONFLICT \(organization_id, repair_order_ref\)/);
  assert.equal(calls[0].text.includes('org-chain-1'), false);
  assert.equal(calls[0].text.includes('case-chain-1'), false);
  assert.equal(calls[0].text.includes('RO-chain-1'), false);
  assert.deepEqual(calls[0].values.slice(0, 6), [
    'org-chain-1',
    'tenant-chain-1',
    'case-chain-1',
    'depot-chain-1',
    'RO-chain-1',
    'diagnosis_pending',
  ]);
});

test('written remains repository result evidence only', async () => {
  const commandEnvelope = buildSafeWriteCommand();
  const { adapter } = fakeAdapter();

  assert.equal(commandEnvelope.written, undefined);
  assert.equal(commandEnvelope.command.transitionPlan.toStatus, 'diagnosis_pending');

  const result = await adapter.writeRepairOrder(commandEnvelope);

  assert.equal(result.written, true);
  assert.equal(Object.prototype.hasOwnProperty.call(result, 'routeWriteScopeApproved'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result, 'writeScopeApproved'), false);
});

test('malformed write command fails closed before fake DB call', async () => {
  const malformedEnvelope = buildDepotWorkshopAssignmentIntentWriteCommand({
    writeAuthorized: true,
    assignmentIntent: 'not-an-object',
  });
  const { adapter, calls } = fakeAdapter();

  const result = await adapter.writeRepairOrder(malformedEnvelope);

  assert.equal(malformedEnvelope.ok, false);
  assert.equal(result.ok, false);
  assert.equal(result.status, 'rejected');
  assert.equal(calls.length, 0);
});

test('missing trusted organization case source or action fails closed before fake DB call', async () => {
  const missingOrganization = buildSafeWriteCommand({
    assignmentIntent: { organizationId: undefined },
  });
  const missingCase = buildSafeWriteCommand({
    assignmentIntent: { caseId: undefined },
  });
  const missingSource = buildSafeWriteCommand({
    assignmentIntent: { depotIntakeId: undefined, repairOrderId: undefined },
  });
  const missingAction = {
    ok: true,
    command: {
      organizationId: 'org-chain-1',
      caseId: 'case-chain-1',
      depotIntakeId: 'depot-chain-1',
    },
  };
  const { adapter, calls } = fakeAdapter();

  for (const input of [missingOrganization, missingCase, missingSource, missingAction]) {
    const result = await adapter.writeRepairOrder(input);

    assert.equal(result.ok, false);
    assert.equal(result.status, 'rejected');
  }

  assert.equal(missingOrganization.reasonCode, 'organization_id_required');
  assert.equal(missingCase.reasonCode, 'case_id_required');
  assert.equal(missingSource.reasonCode, 'repair_order_source_reference_required');
  assert.equal(calls.length, 0);
});

test('missing write authorization fails closed before fake DB call', async () => {
  const commandEnvelope = buildSafeWriteCommand({
    writeAuthorized: false,
    permissionContext: { permissions: [] },
  });
  const { adapter, calls } = fakeAdapter();

  const result = await adapter.writeRepairOrder(commandEnvelope);

  assert.equal(commandEnvelope.ok, false);
  assert.equal(commandEnvelope.reasonCode, 'depot_workshop_assignment_intent_write_authorization_required');
  assert.equal(result.ok, false);
  assert.equal(result.status, 'rejected');
  assert.equal(calls.length, 0);
});

test('fake DB thrown and rejected errors fail closed without raw leakage', async () => {
  const thrown = fakeAdapter({
    onQuery() {
      throw new Error('raw sql stack token password secret provider payload billing invoice openai rag vector completion report final appointment');
    },
  });
  const rejected = fakeAdapter({
    onQuery() {
      return Promise.reject(new Error('raw sql stack token password secret provider payload billing invoice openai rag vector completion report final appointment'));
    },
  });

  for (const harness of [thrown, rejected]) {
    const result = await harness.adapter.writeRepairOrder(buildSafeWriteCommand());
    const serialized = JSON.stringify(result).toLowerCase();

    assert.equal(result.ok, false);
    assert.equal(result.status, 'rejected');
    assert.equal(serialized.includes('raw sql stack token password secret'), false);
    assert.equal(serialized.includes('provider payload'), false);
    assert.equal(serialized.includes('billing invoice'), false);
    assert.equal(serialized.includes('openai rag vector'), false);
    assert.equal(serialized.includes('completion report final appointment'), false);
  }
});

test('malformed and cross-scope fake DB results fail closed', async () => {
  const malformed = fakeAdapter({
    onQuery() {
      return { rows: [] };
    },
  });
  const crossScope = fakeAdapter({
    onQuery() {
      return { rows: [successRow({ organization_id: 'other-org' })] };
    },
  });

  const malformedResult = await malformed.adapter.writeRepairOrder(buildSafeWriteCommand());
  const crossScopeResult = await crossScope.adapter.writeRepairOrder(buildSafeWriteCommand());

  assert.equal(malformedResult.ok, false);
  assert.equal(malformedResult.reasonCode, 'depot_workshop_repair_order_repository_write_result_rejected');
  assert.equal(crossScopeResult.ok, false);
  assert.equal(crossScopeResult.reasonCode, 'depot_workshop_repair_order_repository_write_result_rejected');
});

test('raw DB row payloads are not returned wholesale', async () => {
  const row = successRow({
    rawDbRow: { unsafe: true },
    raw_sql_error: 'raw sql stack token password secret',
    provider_payload: { unsafe: true },
    billing: { unsafe: true },
    ai_output: { unsafe: true },
    final_appointment_id: 'appointment-unsafe',
    completion_report: { unsafe: true },
  });
  const { adapter } = fakeAdapter({
    onQuery() {
      return { rows: [row] };
    },
  });

  const result = await adapter.writeRepairOrder(buildSafeWriteCommand());
  const serialized = JSON.stringify(result).toLowerCase();

  assert.equal(result.ok, true);
  assert.equal(Object.prototype.hasOwnProperty.call(result, 'rawDbRow'), false);
  assert.equal(serialized.includes('raw sql stack token password secret'), false);
  assert.equal(serialized.includes('provider_payload'), false);
  assert.equal(serialized.includes('billing'), false);
  assert.equal(serialized.includes('ai_output'), false);
  assert.equal(serialized.includes('final_appointment_id'), false);
  assert.equal(serialized.includes('completion_report'), false);
});

test('formal reports finalAppointment and unsafe payload markers are not emitted', async () => {
  const { adapter } = fakeAdapter();
  const result = await adapter.writeRepairOrder(buildSafeWriteCommand());
  const serialized = JSON.stringify(result).toLowerCase();

  assert.equal(serialized.includes('fieldservicereport'), false);
  assert.equal(serialized.includes('completionreport'), false);
  assert.equal(serialized.includes('finalappointmentid'), false);
  assert.equal(serialized.includes('providerpayload'), false);
  assert.equal(serialized.includes('billing'), false);
  assert.equal(serialized.includes('openai'), false);
  assert.equal(serialized.includes('rag'), false);
  assert.equal(serialized.includes('vector'), false);
});

test('input command and fake DB result objects are not mutated', async () => {
  const input = validPreparedInput();
  const commandEnvelope = buildDepotWorkshopAssignmentIntentWriteCommand(input);
  const row = successRow();
  const beforeInput = JSON.stringify(input);
  const beforeCommandEnvelope = JSON.stringify(commandEnvelope);
  const beforeRow = JSON.stringify(row);
  const { adapter } = fakeAdapter({
    onQuery() {
      return { rows: [row] };
    },
  });

  const result = await adapter.writeRepairOrder(commandEnvelope);

  assert.equal(result.ok, true);
  assert.equal(JSON.stringify(input), beforeInput);
  assert.equal(JSON.stringify(commandEnvelope), beforeCommandEnvelope);
  assert.equal(JSON.stringify(row), beforeRow);
});
