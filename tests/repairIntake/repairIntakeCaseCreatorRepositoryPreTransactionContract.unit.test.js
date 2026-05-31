'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeCaseRepository,
} = require('../../src/repairIntake/repairIntakeCaseRepository');
const {
  createRepairIntakeCaseRepositoryContract,
} = require('../../src/repairIntake/repairIntakeCaseRepositoryContract');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function hasMarker(value, marker) {
  return JSON.stringify(value).includes(marker);
}

function assertNoUnsafeMarkers(value) {
  for (const marker of [
    'DATABASE_URL',
    'authorization',
    'billingPayload',
    'clientSecret',
    'customerName',
    'customerPhone',
    'database error',
    'field_service_reports',
    'finalAppointmentId',
    'headers',
    'lineAccessToken',
    'password',
    'phone',
    'providerPayload',
    'query',
    'rawBody',
    'rawDraft',
    'rawPlan',
    'rawRepositoryResult',
    'rawRow',
    'rawRows',
    'requestBody',
    'secret',
    'select *',
    'sql',
    'stack trace',
    'token',
  ]) {
    assert.equal(hasMarker(value, marker), false, `unsafe marker leaked: ${marker}`);
  }
}

function createPreTransactionHarness(dependency) {
  const repositoryCalls = [];
  const dependencyCalls = [];
  const dependencyResults = [];
  const repository = createRepairIntakeCaseRepository({
    caseCreationPort: {
      async createCaseFromDraft(input) {
        dependencyCalls.push(clone(input));

        const result = await dependency(input);
        dependencyResults.push(result);

        return result;
      },
    },
  });
  const contract = createRepairIntakeCaseRepositoryContract({
    caseRepository: {
      async createCaseFromDraft(input) {
        repositoryCalls.push(clone(input));
        return repository.createCaseFromDraft(input);
      },
    },
  });

  return {
    contract,
    dependencyCalls,
    dependencyResults,
    repositoryCalls,
  };
}

function creationInput(overrides = {}) {
  return {
    draft: {
      draftId: 'draft-2320',
      organizationId: 'org-2320',
      tenantId: 'tenant-2320',
      status: 'ready_for_case',
      source: 'repair-intake',
      rawDraft: { token: 'hidden' },
      customerPhone: 'hidden',
      address: 'hidden',
    },
    plan: {
      status: 'planned',
      candidate: {
        sourceDraftId: 'draft-2320',
        organizationId: 'org-2320',
        tenantId: 'tenant-2320',
        serviceType: 'onsite',
        rawRows: [{ sql: 'select * from cases' }],
        providerPayload: { token: 'hidden' },
        customerName: 'hidden',
      },
      rawPlan: { sql: 'select * from plans' },
      warnings: ['requires-human-confirmation'],
    },
    draftId: 'draft-2320',
    sourceDraftId: 'draft-2320',
    organizationId: 'org-2320',
    tenantId: 'tenant-2320',
    requestId: 'request-2320',
    actorId: 'actor-2320',
    requestBody: { organizationId: 'org-attacker', token: 'hidden' },
    draftInput: { organizationId: 'org-attacker' },
    body: { organizationId: 'org-attacker' },
    client: { organizationId: 'org-attacker' },
    headers: { authorization: 'Bearer hidden' },
    query: { organizationId: 'org-attacker' },
    rawBody: { organizationId: 'org-attacker' },
    customerName: 'hidden',
    phone: 'hidden',
    lineAccessToken: 'hidden',
    ...overrides,
  };
}

test('pre-transaction contract forwards only trusted scope and allowlisted creation fields', async () => {
  const input = creationInput();
  const inputBefore = clone(input);
  let dependencyResult;
  const { contract, dependencyCalls, dependencyResults, repositoryCalls } = createPreTransactionHarness(
    async (creationCommand) => {
      dependencyResult = {
        caseId: 'case-2320',
        caseRef: {
          caseId: 'case-2320',
          displayId: 'CASE-2320',
          rawRow: { sql: 'select * from hidden_table' },
        },
        draftId: creationCommand.draftId,
        sourceDraftId: creationCommand.sourceDraftId,
        organizationId: creationCommand.organizationId,
        tenantId: creationCommand.tenantId,
        requestId: creationCommand.requestId,
        actorId: creationCommand.actorId,
        status: 'created',
        summary: { safe: true, customerPhone: 'hidden' },
        metadata: { safe: true, token: 'hidden' },
        warnings: ['safe-warning'],
        rawRepositoryResult: { stack: 'stack trace' },
        finalAppointmentId: 'hidden',
      };

      return dependencyResult;
    },
  );

  const result = await contract.createCaseFromDraft(input);

  assert.deepEqual(input, inputBefore, 'input command was mutated');
  assert.equal(repositoryCalls.length, 1);
  assert.equal(dependencyCalls.length, 1);
  assert.deepEqual(Object.keys(dependencyCalls[0]).sort(), [
    'actorId',
    'draft',
    'draftId',
    'metadata',
    'organizationId',
    'plan',
    'requestId',
    'sourceDraftId',
    'tenantId',
    'warnings',
  ].sort());
  assert.equal(dependencyCalls[0].organizationId, 'org-2320');
  assert.equal(dependencyCalls[0].tenantId, 'tenant-2320');
  assert.equal(dependencyCalls[0].draftId, 'draft-2320');
  assert.equal(dependencyCalls[0].sourceDraftId, 'draft-2320');
  assert.equal(dependencyCalls[0].requestId, 'request-2320');
  assert.equal(dependencyCalls[0].actorId, 'actor-2320');
  assert.equal(hasMarker(repositoryCalls[0], 'org-attacker'), false);
  assert.equal(hasMarker(dependencyCalls[0], 'org-attacker'), false);
  assertNoUnsafeMarkers(repositoryCalls[0]);
  assertNoUnsafeMarkers(dependencyCalls[0]);

  assert.equal(result.ok, true);
  assert.equal(result.caseId, 'case-2320');
  assert.equal(result.organizationId, 'org-2320');
  assert.equal(result.tenantId, 'tenant-2320');
  assert.equal(result.requestId, 'request-2320');
  assert.equal(result.actorId, 'actor-2320');
  assert.deepEqual(result.metadata, { safe: true });
  assert.deepEqual(result.warnings, ['safe-warning']);
  assertNoUnsafeMarkers(result);
  assert.deepEqual(dependencyResults[0], dependencyResult, 'repository result object was mutated');
});

test('client controlled request body draft input raw body query headers and client fields cannot provide scope', async () => {
  const { contract, dependencyCalls, repositoryCalls } = createPreTransactionHarness(async (creationCommand) => {
    assert.equal(creationCommand.organizationId, undefined);
    assert.equal(creationCommand.tenantId, undefined);

    return {
      ok: false,
      reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_CREATE_FAILED',
      requiredActions: ['manual_review'],
      rawRow: { sql: 'select * from cases' },
      stack: 'database error stack trace',
      token: 'hidden',
    };
  });

  const result = await contract.createCaseFromDraft(creationInput({
    draft: {
      draftId: 'draft-2320-untrusted',
      status: 'ready_for_case',
    },
    plan: {
      status: 'planned',
      candidate: {
        sourceDraftId: 'draft-2320-untrusted',
      },
    },
    draftId: 'draft-2320-untrusted',
    sourceDraftId: 'draft-2320-untrusted',
    organizationId: undefined,
    tenantId: undefined,
    requestBody: { organizationId: 'org-request-body', tenantId: 'tenant-request-body' },
    draftInput: { organizationId: 'org-draft-input', tenantId: 'tenant-draft-input' },
    body: { organizationId: 'org-body', tenantId: 'tenant-body' },
    client: { organizationId: 'org-client', tenantId: 'tenant-client' },
    query: { organizationId: 'org-query', tenantId: 'tenant-query' },
    headers: { organizationId: 'org-header', tenantId: 'tenant-header' },
    rawBody: { organizationId: 'org-raw-body', tenantId: 'tenant-raw-body' },
  }));

  assert.equal(repositoryCalls.length, 1);
  assert.equal(dependencyCalls.length, 1);
  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_CREATE_FAILED');
  assert.equal(result.organizationId, null);
  assert.equal(result.tenantId, null);

  for (const marker of [
    'org-request-body',
    'org-draft-input',
    'org-body',
    'org-client',
    'org-query',
    'org-header',
    'org-raw-body',
    'tenant-request-body',
    'tenant-draft-input',
    'tenant-body',
    'tenant-client',
    'tenant-query',
    'tenant-header',
    'tenant-raw-body',
  ]) {
    assert.equal(hasMarker(repositoryCalls[0], marker), false, `untrusted scope leaked: ${marker}`);
    assert.equal(hasMarker(dependencyCalls[0], marker), false, `untrusted scope reached dependency: ${marker}`);
    assert.equal(hasMarker(result, marker), false, `untrusted scope leaked to result: ${marker}`);
  }

  assertNoUnsafeMarkers(result);
});

test('missing or malformed creation command fails closed before dependency execution', async () => {
  const { contract, dependencyCalls, repositoryCalls } = createPreTransactionHarness(async () => ({
    caseId: 'case-should-not-run',
  }));

  const result = await contract.createCaseFromDraft({
    draft: { draftId: 'draft-2320-invalid', organizationId: 'org-2320' },
  });

  assert.equal(repositoryCalls.length, 0);
  assert.equal(dependencyCalls.length, 0);
  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_INPUT_INVALID');
  assertNoUnsafeMarkers(result);
});

test('malformed repository result fails closed without raw leakage', async () => {
  const { contract, dependencyCalls, repositoryCalls } = createPreTransactionHarness(async () => ({
    ok: true,
    rawRows: [{ sql: 'select * from hidden_table' }],
    stack: 'stack trace',
    databaseError: 'database error',
    providerPayload: { token: 'hidden' },
  }));

  const result = await contract.createCaseFromDraft(creationInput({
    draftId: 'draft-2320-malformed',
    sourceDraftId: 'draft-2320-malformed',
    draft: {
      draftId: 'draft-2320-malformed',
      organizationId: 'org-2320',
      tenantId: 'tenant-2320',
    },
    plan: {
      status: 'planned',
      candidate: {
        sourceDraftId: 'draft-2320-malformed',
        organizationId: 'org-2320',
        tenantId: 'tenant-2320',
      },
    },
  }));

  assert.equal(repositoryCalls.length, 1);
  assert.equal(dependencyCalls.length, 1);
  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_CREATE_FAILED');
  assert.equal(result.draftId, 'draft-2320-malformed');
  assert.equal(result.organizationId, 'org-2320');
  assert.equal(result.tenantId, 'tenant-2320');
  assertNoUnsafeMarkers(result);
});

test('thrown and rejected repository errors fail closed without raw leakage', async () => {
  for (const dependency of [
    async () => {
      throw new Error('DATABASE_URL token password secret sql rawRows stack trace phone providerPayload');
    },
    async () => Promise.reject(new Error('database error select * headers authorization lineAccessToken')),
  ]) {
    const { contract, dependencyCalls, repositoryCalls } = createPreTransactionHarness(dependency);
    const result = await contract.createCaseFromDraft(creationInput());

    assert.equal(repositoryCalls.length, 1);
    assert.equal(dependencyCalls.length, 1);
    assert.equal(result.ok, false);
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_CREATE_FAILED');
    assert.equal(result.organizationId, 'org-2320');
    assert.equal(result.tenantId, 'tenant-2320');
    assertNoUnsafeMarkers(result);
  }
});
