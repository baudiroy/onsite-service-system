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
    return `task2334_${kind || 'runtime'}_${index}`;
  };
}

function createMainDbClient(calls) {
  return {
    async query(text, params) {
      calls.mainDb.push({ text, params: clone(params || []) });

      return {
        rowCount: 1,
        rows: [],
      };
    },
  };
}

function createAuditDbClient(calls, options = {}) {
  return {
    async insert(tableName, payload) {
      calls.auditDb.push({ tableName, payload: clone(payload) });

      if (options.throwInsert) {
        throw new Error('select * stack trace raw DB error provider payload token password secret contact address');
      }

      if (options.rejectInsert) {
        return Promise.reject(new Error('select * stack trace SQL raw rows token secret'));
      }

      if (options.malformedResult) {
        return null;
      }

      return {
        ok: true,
        rows: [{
          rawRows: [{ phone: 'private customer phone', address: 'private customer address' }],
          sql: 'select * from unsafe',
          token: 'token',
          providerPayload: 'provider payload',
        }],
      };
    },
  };
}

function createCalls() {
  return {
    auditDb: [],
    mainDb: [],
  };
}

function createPorts({ calls = createCalls(), auditDbClient = createAuditDbClient(calls), overrides = {} } = {}) {
  return {
    calls,
    auditDbClient,
    mainDbClient: createMainDbClient(calls),
    ports: createRepairIntakeDraftToCaseRuntimePorts({
      dbClient: createMainDbClient(calls),
      auditDbClient,
      idGenerator: createIdGenerator(),
      caseNumberGenerator: () => 'CASE-TASK2334',
      clock: () => '2026-05-31T00:00:00.000Z',
      ...overrides,
    }),
  };
}

function auditInput(overrides = {}) {
  return {
    draftId: 'draft_task2334_001',
    organizationId: 'org_task2334',
    tenantId: 'tenant_task2334',
    actorId: 'actor_task2334',
    actorRole: 'admin_user',
    requestId: 'request_task2334',
    decision: 'submitted',
    draft: {
      id: 'draft_task2334_001',
      draftId: 'draft_task2334_001',
      organizationId: 'org_task2334',
      tenantId: 'tenant_task2334',
      status: 'ready_for_conversion',
      source: 'admin',
      summary: { title: 'safe task2334 draft' },
    },
    plan: {
      status: 'planned',
      candidate: {
        sourceDraftId: 'draft_task2334_001',
        organizationId: 'org_task2334',
        tenantId: 'tenant_task2334',
        caseNo: 'CASE-TASK2334',
      },
    },
    caseRef: {
      id: 'case_task2334_001',
      caseId: 'case_task2334_001',
      organizationId: 'org_task2334',
      tenantId: 'tenant_task2334',
      summary: {
        caseRef: 'CASE-TASK2334',
      },
    },
    ...overrides,
  };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'select *',
    'stack trace',
    'raw DB error',
    'raw rows',
    'rawRows',
    'raw request body',
    'raw draft input',
    'raw service payloads',
    'provider payload',
    'providerPayload',
    'token',
    'password',
    'secret',
    'private customer',
    'phone',
    'contact',
    'address',
    'openai',
    'RAG',
    'vector',
    'billing',
    'settlement',
    'payment',
    'invoice',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('runtime factory composes fake audit persistence through explicit injected audit DB without composition-time calls', async () => {
  const calls = createCalls();
  const auditDbClient = createAuditDbClient(calls);
  const auditDbSnapshot = JSON.stringify(auditDbClient);
  const input = auditInput();
  const inputSnapshot = JSON.stringify(input);
  const { ports } = createPorts({ calls, auditDbClient });

  assert.deepEqual(calls.mainDb, []);
  assert.deepEqual(calls.auditDb, []);
  assert.equal(typeof ports.auditWriter.recordDraftToCaseDecision, 'function');

  const result = await ports.auditWriter.recordDraftToCaseDecision(input);

  assert.equal(result.ok, true);
  assert.equal(result.eventType, 'repair_intake_draft_to_case_submission');
  assert.equal(result.outcome, 'submitted');
  assert.equal(result.draftId, 'draft_task2334_001');
  assert.equal(result.organizationId, 'org_task2334');
  assert.equal(result.tenantId, 'tenant_task2334');
  assert.equal(result.caseId, 'case_task2334_001');
  assert.deepEqual(calls.mainDb, []);
  assert.equal(calls.auditDb.length, 1);
  assert.deepEqual(calls.auditDb[0], {
    tableName: 'repair_intake_audit_events',
    payload: {
      id: 'task2334_repair_intake_audit_event_1',
      event_type: 'repair_intake_draft_to_case_submission',
      organization_id: 'org_task2334',
      tenant_id: 'tenant_task2334',
      draft_id: 'draft_task2334_001',
      case_id: 'case_task2334_001',
      case_ref: 'CASE-TASK2334',
      actor_id: 'actor_task2334',
      actor_type: 'admin_user',
      request_id: 'request_task2334',
      decision: 'submitted',
      outcome: 'submitted',
      reason_code: 'REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_PORTS_AUDIT_RECORDED',
      safe_metadata: {
        source: 'repair_intake_draft_to_case_runtime_ports_factory',
      },
      visibility: 'internal_only',
      occurred_at: '2026-05-31T00:00:00.000Z',
    },
  });
  assert.equal(JSON.stringify(input), inputSnapshot);
  assert.equal(JSON.stringify(auditDbClient), auditDbSnapshot);
  assertNoUnsafeText(result);
  assertNoUnsafeText(calls.auditDb[0]);
});

test('runtime factory audit writer requires trusted organization before fake DB write', async () => {
  const calls = createCalls();
  const { ports } = createPorts({ calls });

  const result = await ports.auditWriter.recordDraftToCaseDecision(auditInput({
    organizationId: '',
    draft: {
      id: 'draft_task2334_001',
      draftId: 'draft_task2334_001',
      status: 'ready_for_conversion',
    },
    caseRef: {
      id: 'case_task2334_001',
      summary: { caseRef: 'CASE-TASK2334' },
    },
  }));

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_ORGANIZATION_MISSING');
  assert.deepEqual(calls.mainDb, []);
  assert.deepEqual(calls.auditDb, []);
  assertNoUnsafeText(result);
});

test('runtime factory audit writer strips unsafe context before fake persistence payload and preserves inputs', async () => {
  const calls = createCalls();
  const { ports } = createPorts({ calls });
  const input = auditInput({
    requestId: "request_task2334'; select * from repair_intake_audit_events; --",
    source: 'openai RAG vector billing settlement payment invoice',
    metadata: {
      rawServicePayload: 'raw service payloads',
      token: 'token',
      password: 'password',
      secret: 'secret',
      providerPayload: 'provider payload',
      customerContact: 'private customer contact address',
    },
    rawBody: 'raw request body',
    draftInput: 'raw draft input',
  });
  const inputSnapshot = JSON.stringify(input);

  const result = await ports.auditWriter.recordDraftToCaseDecision(input);

  assert.equal(result.ok, true);
  assert.equal(calls.auditDb.length, 1);
  assert.equal(calls.auditDb[0].payload.request_id, null);
  assert.deepEqual(calls.auditDb[0].payload.safe_metadata, {
    source: 'repair_intake_draft_to_case_runtime_ports_factory',
  });
  assert.equal(JSON.stringify(input), inputSnapshot);
  assertNoUnsafeText(result);
  assertNoUnsafeText(calls.auditDb[0]);
});

test('runtime factory audit writer fake DB throw reject and malformed result fail closed without raw leakage', async () => {
  for (const options of [
    { throwInsert: true },
    { rejectInsert: true },
    { malformedResult: true },
  ]) {
    const calls = createCalls();
    const { ports } = createPorts({
      calls,
      auditDbClient: createAuditDbClient(calls, options),
    });

    const result = await ports.auditWriter.recordDraftToCaseDecision(auditInput());

    assert.equal(result.ok, false);
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_WRITE_FAILED');
    assert.deepEqual(calls.mainDb, []);
    assert.equal(calls.auditDb.length, 1);
    assertNoUnsafeText(result);
  }
});

test('runtime factory keeps existing missing main db dependency gate', () => {
  assert.throws(
    () => createRepairIntakeDraftToCaseRuntimePorts({
      auditDbClient: createAuditDbClient(createCalls()),
      idGenerator: createIdGenerator(),
    }),
    (error) => (
      error instanceof RepairIntakeDraftToCaseRuntimePortsFactoryError
      && error.reasonCode === 'REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_PORTS_DB_CLIENT_REQUIRED'
    ),
  );
});
