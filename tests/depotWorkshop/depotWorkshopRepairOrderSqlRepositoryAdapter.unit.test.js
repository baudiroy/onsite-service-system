'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createDepotWorkshopRepairOrderSqlRepositoryAdapter,
} = require('../../src/repositories/DepotWorkshopRepairOrderSqlRepositoryAdapter');

function validCommand(overrides = {}) {
  const { command: commandOverrides = {}, ...topLevelOverrides } = overrides;

  return {
    ok: true,
    action: 'depot_workshop.assignment_intent.write',
    command: {
      action: 'depot_workshop.assignment_intent.write',
      organizationId: 'org-1',
      tenantId: 'tenant-1',
      caseId: 'case-1',
      depotIntakeId: 'depot-1',
      repairOrderId: 'RO-1',
      depotStatus: 'intake_received',
      targetDepotStatus: 'diagnosis_pending',
      brandId: 'brand-1',
      serviceProviderId: 'provider-1',
      subcontractorOrganizationId: 'subcontractor-1',
      assignmentRelationship: 'assigned',
      workshopId: 'workshop-1',
      workshopTeamId: 'team-1',
      assignedTechnicianId: 'tech-1',
      actorId: 'actor-1',
      actorRole: 'admin',
      requestId: 'req-1',
      ...commandOverrides,
    },
    auditIntent: {
      eventType: 'depot_workshop_repair_assignment_intent_prepared',
      internalOnly: true,
      customerVisible: false,
      metadata: {
        organizationId: 'org-1',
        caseId: 'case-1',
      },
    },
    customerProjectionPreview: {
      repairOrderReference: 'RO-1',
      displayStatus: 'diagnosis_pending',
    },
    ...topLevelOverrides,
  };
}

function successRow(overrides = {}) {
  return {
    id: 'repair-order-id-1',
    organization_id: 'org-1',
    tenant_id: 'tenant-1',
    case_id: 'case-1',
    depot_intake_id: 'depot-1',
    repair_order_ref: 'RO-1',
    request_id: 'req-1',
    ...overrides,
  };
}

test('valid normalized write command calls fake dbClient with parameterized SQL and values', async () => {
  const calls = [];
  const adapter = createDepotWorkshopRepairOrderSqlRepositoryAdapter({
    dbClient: {
      async query(querySpec) {
        calls.push(querySpec);

        return { rows: [successRow()] };
      },
    },
  });

  const result = await adapter.writeRepairOrder(validCommand());

  assert.equal(result.ok, true);
  assert.equal(result.written, true);
  assert.equal(calls.length, 1);
  assert.match(calls[0].text, /INSERT INTO depot_workshop_repair_orders/);
  assert.match(calls[0].text, /ON CONFLICT \(organization_id, repair_order_ref\)/);
  assert.equal(calls[0].text.includes('org-1'), false);
  assert.equal(calls[0].text.includes('case-1'), false);
  assert.equal(calls[0].text.includes('RO-1'), false);
  assert.deepEqual(calls[0].values.slice(0, 6), [
    'org-1',
    'tenant-1',
    'case-1',
    'depot-1',
    'RO-1',
    'diagnosis_pending',
  ]);
});

test('successful fake DB result normalizes into safe repository result', async () => {
  const adapter = createDepotWorkshopRepairOrderSqlRepositoryAdapter({
    dbClient: {
      async query() {
        return { rows: [successRow()] };
      },
    },
  });

  const result = await adapter.writeRepairOrder(validCommand());

  assert.equal(result.ok, true);
  assert.equal(result.status, 'written');
  assert.equal(result.repositoryKind, 'depot_workshop.repair_order_repository_contract');
  assert.equal(result.organizationId, 'org-1');
  assert.equal(result.caseId, 'case-1');
  assert.equal(result.depotIntakeId, 'depot-1');
  assert.equal(result.repairOrderId, 'RO-1');
  assert.equal(result.repairOrderReference, 'RO-1');
  assert.equal(result.requestId, 'req-1');
  assert.equal(Object.prototype.hasOwnProperty.call(result, 'rawDbRow'), false);
});

test('missing or malformed command fails closed before fake DB call', async () => {
  let calls = 0;
  const adapter = createDepotWorkshopRepairOrderSqlRepositoryAdapter({
    dbClient: {
      async query() {
        calls += 1;

        return { rows: [successRow()] };
      },
    },
  });

  const result = await adapter.writeRepairOrder({
    ok: true,
    command: {
      action: 'not-allowed',
      organizationId: 'org-1',
      caseId: 'case-1',
      depotIntakeId: 'depot-1',
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, 'rejected');
  assert.equal(calls, 0);
});

test('fake DB thrown error fails closed without raw leakage', async () => {
  const adapter = createDepotWorkshopRepairOrderSqlRepositoryAdapter({
    dbClient: {
      async query() {
        throw new Error('raw sql stack token secret provider payload');
      },
    },
  });

  const result = await adapter.writeRepairOrder(validCommand());
  const serialized = JSON.stringify(result).toLowerCase();

  assert.equal(result.ok, false);
  assert.equal(result.status, 'rejected');
  assert.equal(serialized.includes('raw sql stack token secret provider'), false);
});

test('fake DB rejected error fails closed without raw leakage', async () => {
  const adapter = createDepotWorkshopRepairOrderSqlRepositoryAdapter({
    dbClient: {
      query() {
        return Promise.reject(new Error('password token stack'));
      },
    },
  });

  const result = await adapter.writeRepairOrder(validCommand());
  const serialized = JSON.stringify(result).toLowerCase();

  assert.equal(result.ok, false);
  assert.equal(result.status, 'rejected');
  assert.equal(serialized.includes('password token stack'), false);
});

test('malformed fake DB result fails closed', async () => {
  const adapter = createDepotWorkshopRepairOrderSqlRepositoryAdapter({
    dbClient: {
      async query() {
        return { rows: [] };
      },
    },
  });

  const result = await adapter.writeRepairOrder(validCommand());

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'depot_workshop_repair_order_repository_write_result_rejected');
});

test('cross-scope-looking fake DB result fails closed', async () => {
  const adapter = createDepotWorkshopRepairOrderSqlRepositoryAdapter({
    dbClient: {
      async query() {
        return { rows: [successRow({ organization_id: 'other-org' })] };
      },
    },
  });

  const result = await adapter.writeRepairOrder(validCommand());

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'depot_workshop_repair_order_repository_write_result_rejected');
});

test('SQL is parameterized and does not interpolate raw private values into SQL text', async () => {
  let captured;
  const adapter = createDepotWorkshopRepairOrderSqlRepositoryAdapter({
    dbClient: {
      async query(querySpec) {
        captured = querySpec;

        return { rows: [successRow()] };
      },
    },
  });

  await adapter.writeRepairOrder(validCommand({
    command: {
      organizationId: 'org-sensitive-value',
      caseId: 'case-sensitive-value',
      requestId: 'req-sensitive-value',
    },
  }));

  assert.equal(captured.text.includes('org-sensitive-value'), false);
  assert.equal(captured.text.includes('case-sensitive-value'), false);
  assert.equal(captured.text.includes('req-sensitive-value'), false);
  assert.equal(captured.values.includes('org-sensitive-value'), true);
  assert.equal(captured.values.includes('case-sensitive-value'), true);
  assert.equal(captured.values.includes('req-sensitive-value'), true);
});

test('no formal FSR Completion Report or finalAppointment fields are emitted', async () => {
  const adapter = createDepotWorkshopRepairOrderSqlRepositoryAdapter({
    dbClient: {
      async query() {
        return { rows: [successRow()] };
      },
    },
  });

  const serialized = JSON.stringify(await adapter.writeRepairOrder(validCommand())).toLowerCase();

  assert.equal(serialized.includes('fieldservicereport'), false);
  assert.equal(serialized.includes('completionreport'), false);
  assert.equal(serialized.includes('finalappointmentid'), false);
});

test('input command and fake DB result objects are not mutated', async () => {
  const input = validCommand();
  const row = successRow();
  const beforeInput = JSON.stringify(input);
  const beforeRow = JSON.stringify(row);
  const adapter = createDepotWorkshopRepairOrderSqlRepositoryAdapter({
    dbClient: {
      async query() {
        return { rows: [row] };
      },
    },
  });

  const result = await adapter.writeRepairOrder(input);

  assert.equal(result.ok, true);
  assert.equal(JSON.stringify(input), beforeInput);
  assert.equal(JSON.stringify(row), beforeRow);
});
