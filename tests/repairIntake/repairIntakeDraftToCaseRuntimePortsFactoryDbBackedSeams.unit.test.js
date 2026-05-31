'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftToCaseRuntimePorts,
  RepairIntakeDraftToCaseRuntimePortsFactoryError,
} = require('../../src/repairIntake/repairIntakeDraftToCaseRuntimePortsFactory');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createIdGenerator() {
  let index = 0;

  return ({ kind } = {}) => {
    index += 1;
    return `${kind || 'runtime'}-2324-${index}`;
  };
}

function createFakeDbClient() {
  const calls = [];
  const draftRow = {
    id: 'draft-2324',
    organization_id: 'org-2324',
    tenant_id: 'tenant-2324',
    draft_status: 'ready_for_conversion',
    source: 'website',
    source_ref: 'source-ref-2324',
    intake_source: 'runtime_ports_factory_unit',
    safe_summary: {
      customerId: 'customer-2324',
      brand: 'brand-2324',
      productType: 'appliance',
      modelNo: 'model-2324',
      problemDescription: 'safe issue summary 2324',
      serviceRegion: 'north',
    },
    safe_metadata: {
      priority: 'normal',
    },
    validation_errors_safe: [],
  };

  return {
    calls,
    async query(text, params) {
      calls.push({ text, params: clone(params || []) });

      if (text.includes('FROM repair_intake_drafts')) {
        return {
          rowCount: 1,
          rows: [draftRow],
        };
      }

      if (text.includes('FROM repair_intake_idempotency_records')) {
        return {
          rowCount: 0,
          rows: [],
        };
      }

      return {
        rowCount: 1,
        rows: [],
      };
    },
  };
}

function createTransactionRunner(calls) {
  return {
    begin: async () => {
      calls.push('begin');

      return {
        txId: 'tx-2324',
        async query(text, params) {
          calls.push(`tx:${text.split(/\s+/).slice(0, 3).join(' ')}`);

          return {
            rowCount: 1,
            rows: [],
            params,
          };
        },
        async commit() {
          calls.push('commit');
        },
        async rollback() {
          calls.push('rollback');
        },
      };
    },
  };
}

function createFactoryOptions(overrides = {}) {
  return {
    dbClient: createFakeDbClient(),
    idGenerator: createIdGenerator(),
    caseNumberGenerator: () => 'CASE-2324',
    clock: () => '2026-05-31T12:00:00.000Z',
    ...overrides,
  };
}

function caseCreatorInput() {
  return {
    command: {
      draftId: 'draft-2324',
      organizationId: 'org-2324',
      tenantId: 'tenant-2324',
      actorId: 'actor-2324',
      requestId: 'request-2324',
      idempotencyKey: 'idem-2324',
    },
    caseCandidate: {
      sourceDraftId: 'draft-2324',
      organizationId: 'org-2324',
      tenantId: 'tenant-2324',
      caseNo: 'CASE-2324',
      customerId: 'customer-2324',
      source: 'web',
      brand: 'brand-2324',
      intakeSource: 'web',
      serviceType: 'onsite',
      caseType: 'repair',
      productType: 'appliance',
      modelNo: 'model-2324',
      problemDescription: 'safe issue summary 2324',
      priority: 'normal',
    },
  };
}

test('factory composes DB-backed application ports without composition-time DB or transaction calls', () => {
  const dbClient = createFakeDbClient();
  const transactionCalls = [];
  const transactionRunner = createTransactionRunner(transactionCalls);
  const dependencySnapshot = {
    dbClientKeys: Object.keys(dbClient).sort(),
    transactionRunnerKeys: Object.keys(transactionRunner).sort(),
  };

  const ports = createRepairIntakeDraftToCaseRuntimePorts(createFactoryOptions({
    dbClient,
    transactionRunner,
  }));

  assert.deepEqual(dbClient.calls, []);
  assert.deepEqual(transactionCalls, []);
  assert.deepEqual({
    dbClientKeys: Object.keys(dbClient).sort(),
    transactionRunnerKeys: Object.keys(transactionRunner).sort(),
  }, dependencySnapshot);
  assert.equal(typeof ports.draftReader.getDraftForConversion, 'function');
  assert.equal(typeof ports.idempotencyPort.findExistingDraftToCaseResult, 'function');
  assert.equal(typeof ports.idempotencyPort.recordDraftToCaseResult, 'function');
  assert.equal(typeof ports.casePlanner.planCaseFromDraft, 'function');
  assert.equal(typeof ports.caseCreator.createCaseFromDraft, 'function');
  assert.equal(typeof ports.caseCreatorRepository.createCaseFromCandidate, 'function');
  assert.equal(typeof ports.auditWriter.recordDraftToCaseDecision, 'function');
});

test('factory omits DB-backed case creator transaction repository when transactionRunner is missing', () => {
  const ports = createRepairIntakeDraftToCaseRuntimePorts(createFactoryOptions());

  assert.equal(ports.caseCreatorRepository, undefined);
  assert.equal(typeof ports.draftReader.getDraftForConversion, 'function');
  assert.equal(typeof ports.idempotencyPort.findExistingDraftToCaseResult, 'function');
  assert.equal(typeof ports.caseCreator.createCaseFromDraft, 'function');
});

test('factory still fails closed when required injected dbClient is missing', () => {
  assert.throws(
    () => createRepairIntakeDraftToCaseRuntimePorts({
      idGenerator: createIdGenerator(),
    }),
    (error) => (
      error instanceof RepairIntakeDraftToCaseRuntimePortsFactoryError
      && error.reasonCode === 'REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_PORTS_DB_CLIENT_REQUIRED'
    ),
  );
});

test('composed draft reader idempotency and transaction skeleton ports work with fake clients only', async () => {
  const dbClient = createFakeDbClient();
  const transactionCalls = [];
  const auditCalls = [];
  const ports = createRepairIntakeDraftToCaseRuntimePorts(createFactoryOptions({
    dbClient,
    transactionRunner: createTransactionRunner(transactionCalls),
    caseCreatorCaseRepository: {
      createCaseFromRepairIntakeCandidate: async (input) => {
        await input.tx.query('insert into cases', []);

        return {
          id: 'case-2324-1',
          organizationId: input.command.organizationId,
          sourceDraftId: input.command.draftId,
          status: 'created',
        };
      },
    },
    caseCreatorAuditWriter: {
      recordRepairIntakeDraftToCaseCreated: async (input) => {
        auditCalls.push(clone({
          auditEvent: input.auditEvent,
          caseRef: input.caseRef,
          command: input.command,
          txId: input.tx && input.tx.txId,
        }));

        return { ok: true };
      },
    },
  }));

  const draft = await ports.draftReader.getDraftForConversion({
    draftId: 'draft-2324',
    organizationId: 'org-2324',
    tenantId: 'tenant-2324',
  });
  const existing = await ports.idempotencyPort.findExistingDraftToCaseResult({
    draftId: 'draft-2324',
    organizationId: 'org-2324',
    tenantId: 'tenant-2324',
    idempotencyKey: 'idem-2324',
  });
  const created = await ports.caseCreatorRepository.createCaseFromCandidate(caseCreatorInput());

  assert.equal(draft.ok, true);
  assert.equal(draft.draftId, 'draft-2324');
  assert.equal(existing.ok, false);
  assert.equal(existing.reasonCode, 'REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_NO_EXISTING_RESULT');
  assert.deepEqual(created, {
    id: 'case-2324-1',
    organizationId: 'org-2324',
    sourceDraftId: 'draft-2324',
    status: 'created',
  });
  assert.deepEqual(transactionCalls, [
    'begin',
    'tx:insert into cases',
    'tx:update repair_intake_drafts set',
    'commit',
  ]);
  assert.equal(auditCalls.length, 1);
  assert.equal(auditCalls[0].txId, 'tx-2324');
  assert.ok(dbClient.calls.some((call) => call.text.includes('FROM repair_intake_drafts')));
  assert.ok(dbClient.calls.some((call) => call.text.includes('FROM repair_intake_idempotency_records')));
});
