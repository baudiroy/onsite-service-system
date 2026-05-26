'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createRepairIntakeDraftToCaseRuntimePorts,
  RepairIntakeDraftToCaseRuntimePortsFactoryError,
} = require('../../src/repairIntake/repairIntakeDraftToCaseRuntimePortsFactory');
const {
  createAppRouter,
} = require('../../src/routes');
const {
  REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH,
} = require('../../src/routes/repairIntakeDraftToCase.routes');

const repoRoot = path.resolve(__dirname, '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function createIdSequence(prefix = 'id') {
  let index = 0;

  return ({ kind } = {}) => {
    index += 1;
    return `${prefix}_${kind || 'case'}_${index}`;
  };
}

function createFakeDbClient() {
  const calls = [];
  const draftRow = {
    id: 'draft_runtime_ports_001',
    organization_id: 'org_runtime_ports_001',
    tenant_id: 'tenant_runtime_ports_001',
    draft_status: 'ready_for_conversion',
    source: 'website',
    source_ref: 'source_ref_runtime_ports_001',
    intake_source: 'admin_route_unit',
    safe_summary: {
      customerId: 'customer_runtime_ports_001',
      brand: 'RuntimePorts Brand',
      productType: 'RuntimePorts Product',
      modelNo: 'RuntimePorts Model',
      problemDescription: 'RuntimePorts safe issue summary',
      serviceRegion: 'RuntimePorts Region',
    },
    safe_metadata: {
      priority: 'normal',
    },
    validation_errors_safe: [],
  };

  return {
    calls,
    async query(text, params) {
      calls.push({ text, params });

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

function findRoute(expressRouter, method, pathname) {
  return expressRouter.stack.find((layer) => (
    layer
    && layer.route
    && layer.route.path === pathname
    && layer.route.methods[method.toLowerCase()]
  ));
}

function createFactoryOptions(overrides = {}) {
  return {
    dbClient: createFakeDbClient(),
    idGenerator: createIdSequence('runtime_ports'),
    caseNumberGenerator: () => 'CASE_RUNTIME_PORTS_001',
    clock: () => '2026-05-26T00:00:00.000Z',
    ...overrides,
  };
}

test('factory rejects missing injected db client and never creates its own pool', () => {
  assert.throws(
    () => createRepairIntakeDraftToCaseRuntimePorts({
      idGenerator: createIdSequence(),
    }),
    (error) => (
      error instanceof RepairIntakeDraftToCaseRuntimePortsFactoryError
      && error.reasonCode === 'REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_PORTS_DB_CLIENT_REQUIRED'
    ),
  );
});

test('factory rejects missing id generator', () => {
  assert.throws(
    () => createRepairIntakeDraftToCaseRuntimePorts({
      dbClient: createFakeDbClient(),
    }),
    (error) => (
      error instanceof RepairIntakeDraftToCaseRuntimePortsFactoryError
      && error.reasonCode === 'REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_PORTS_ID_GENERATOR_REQUIRED'
    ),
  );
});

test('factory returns runtime ports compatible with protected admin route mount', () => {
  const ports = createRepairIntakeDraftToCaseRuntimePorts(createFactoryOptions());
  const appRouter = createAppRouter({
    repairIntakeDraftToCaseRoutesEnabled: true,
    repairIntakeDraftToCaseRuntimePorts: ports,
  });

  assert.equal(typeof ports.draftRepository.findDraftForConversion, 'function');
  assert.equal(typeof ports.idempotencyStore.findExistingDraftToCaseResult, 'function');
  assert.equal(typeof ports.idempotencyStore.recordDraftToCaseResult, 'function');
  assert.equal(typeof ports.planningPolicy.planCaseFromDraft, 'function');
  assert.equal(typeof ports.caseCreationPort.createCaseFromDraft, 'function');
  assert.equal(typeof ports.auditPort.recordDraftToCaseDecision, 'function');
  assert.ok(findRoute(appRouter, 'post', REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH));
});

test('default planning policy builds a safe case candidate from draft summary and generator', async () => {
  const ports = createRepairIntakeDraftToCaseRuntimePorts(createFactoryOptions());
  const draft = await ports.draftRepository.findDraftForConversion({
    draftId: 'draft_runtime_ports_001',
    organizationId: 'org_runtime_ports_001',
    tenantId: 'tenant_runtime_ports_001',
  });
  const plan = await ports.planningPolicy.planCaseFromDraft({
    draft,
    draftId: draft.draftId,
    organizationId: draft.organizationId,
    tenantId: draft.tenantId,
  });

  assert.equal(plan.status, 'planned');
  assert.equal(plan.candidate.caseNo, 'CASE_RUNTIME_PORTS_001');
  assert.equal(plan.candidate.customerId, 'customer_runtime_ports_001');
  assert.equal(plan.candidate.brand, 'RuntimePorts Brand');
  assert.equal(plan.candidate.productType, 'RuntimePorts Product');
  assert.equal(plan.candidate.modelNo, 'RuntimePorts Model');
  assert.equal(plan.candidate.problemDescription, 'RuntimePorts safe issue summary');
  assert.equal(plan.candidate.source, 'website');
  assert.equal(plan.candidate.caseType, 'repair');
});

test('case creation port writes case conversion and draft converted update through injected client', async () => {
  const dbClient = createFakeDbClient();
  const ports = createRepairIntakeDraftToCaseRuntimePorts(createFactoryOptions({ dbClient }));
  const draft = await ports.draftRepository.findDraftForConversion({
    draftId: 'draft_runtime_ports_001',
    organizationId: 'org_runtime_ports_001',
    tenantId: 'tenant_runtime_ports_001',
  });
  const plan = await ports.planningPolicy.planCaseFromDraft({
    draft,
    draftId: draft.draftId,
    organizationId: draft.organizationId,
    tenantId: draft.tenantId,
  });
  const result = await ports.caseCreationPort.createCaseFromDraft({
    draft,
    plan,
    draftId: draft.draftId,
    organizationId: draft.organizationId,
    tenantId: draft.tenantId,
    actorId: 'actor_runtime_ports_001',
    requestId: 'req_runtime_ports_001',
    idempotencyKey: 'idem_runtime_ports_001',
  });

  assert.equal(result.status, 'created');
  assert.equal(result.caseRef, 'CASE_RUNTIME_PORTS_001');
  assert.ok(result.summary.conversionId.startsWith('runtime_ports_repair_intake_draft_case_conversion_'));
  assert.ok(dbClient.calls.some((call) => call.text.includes('insert into cases')));
  assert.ok(dbClient.calls.some((call) => call.text.includes('INSERT INTO repair_intake_draft_case_conversions')));
  assert.ok(dbClient.calls.some((call) => call.text.includes('UPDATE repair_intake_drafts')));
});

test('server-style prefixed runtime ids are normalized to DB-compatible UUIDs without changing case number', async () => {
  const dbClient = createFakeDbClient();
  const caseId = '11111111-1111-4111-8111-111111111111';
  const conversionId = '22222222-2222-4222-8222-222222222222';
  const auditEventId = '33333333-3333-4333-8333-333333333333';
  const idGenerator = ({ kind } = {}) => {
    if (kind === 'repair_intake_draft_case_conversion') {
      return `ri_repair_intake_draft_case_conversion_${conversionId}`;
    }

    if (kind === 'repair_intake_audit_event') {
      return `ri_repair_intake_audit_event_${auditEventId}`;
    }

    return `ri_record_${caseId}`;
  };
  const ports = createRepairIntakeDraftToCaseRuntimePorts(createFactoryOptions({
    dbClient,
    idGenerator,
  }));
  const draft = await ports.draftRepository.findDraftForConversion({
    draftId: 'draft_runtime_ports_001',
    organizationId: 'org_runtime_ports_001',
    tenantId: 'tenant_runtime_ports_001',
  });
  const plan = await ports.planningPolicy.planCaseFromDraft({
    draft,
    draftId: draft.draftId,
    organizationId: draft.organizationId,
    tenantId: draft.tenantId,
  });

  const created = await ports.caseCreationPort.createCaseFromDraft({
    draft,
    plan,
    draftId: draft.draftId,
    organizationId: draft.organizationId,
    tenantId: draft.tenantId,
    actorId: 'actor_runtime_ports_001',
    requestId: 'req_runtime_ports_001',
    idempotencyKey: 'idem_runtime_ports_001',
  });
  const audit = await ports.auditPort.recordDraftToCaseDecision({
    draftId: draft.draftId,
    organizationId: draft.organizationId,
    tenantId: draft.tenantId,
    actorId: 'actor_runtime_ports_001',
    requestId: 'req_runtime_ports_001',
    draft,
    caseRef: created,
  });

  const caseInsert = dbClient.calls.find((call) => call.text.includes('insert into cases'));
  const conversionInsert = dbClient.calls.find((call) => call.text.includes('INSERT INTO repair_intake_draft_case_conversions'));
  const auditInsert = dbClient.calls.find((call) => call.text.includes('INSERT INTO repair_intake_audit_events'));

  assert.equal(created.id, caseId);
  assert.equal(created.caseRef, 'CASE_RUNTIME_PORTS_001');
  assert.equal(audit.caseId, caseId);
  assert.equal(caseInsert.params[0], caseId);
  assert.equal(caseInsert.params[1], 'CASE_RUNTIME_PORTS_001');
  assert.equal(conversionInsert.params[0], conversionId);
  assert.equal(conversionInsert.params[4], caseId);
  assert.equal(auditInsert.params[0], auditEventId);
  assert.equal(auditInsert.params[5], caseId);
  assert.equal(
    dbClient.calls.flatMap((call) => call.params || []).some((param) => (
      typeof param === 'string' && param.startsWith('ri_record_')
    )),
    false,
  );
});

test('audit and idempotency ports write safe rows through injected client', async () => {
  const dbClient = createFakeDbClient();
  const ports = createRepairIntakeDraftToCaseRuntimePorts(createFactoryOptions({ dbClient }));
  const audit = await ports.auditPort.recordDraftToCaseDecision({
    draftId: 'draft_runtime_ports_001',
    organizationId: 'org_runtime_ports_001',
    tenantId: 'tenant_runtime_ports_001',
    actorId: 'actor_runtime_ports_001',
    requestId: 'req_runtime_ports_001',
    draft: {
      draftId: 'draft_runtime_ports_001',
      organizationId: 'org_runtime_ports_001',
      tenantId: 'tenant_runtime_ports_001',
    },
    caseRef: {
      id: 'case_runtime_ports_001',
      caseId: 'case_runtime_ports_001',
      summary: {
        caseRef: 'CASE_RUNTIME_PORTS_001',
      },
    },
  });
  const idempotency = await ports.idempotencyStore.recordDraftToCaseResult({
    draftId: 'draft_runtime_ports_001',
    organizationId: 'org_runtime_ports_001',
    tenantId: 'tenant_runtime_ports_001',
    actorId: 'actor_runtime_ports_001',
    requestId: 'req_runtime_ports_001',
    idempotencyKey: 'idem_runtime_ports_001',
    result: {
      status: 'created',
      submitted: true,
      caseRef: {
        id: 'case_runtime_ports_001',
        caseId: 'case_runtime_ports_001',
        summary: {
          caseRef: 'CASE_RUNTIME_PORTS_001',
        },
      },
    },
  });

  assert.equal(audit.ok, true);
  assert.equal(audit.eventType, 'repair_intake_draft_to_case_submission');
  assert.equal(idempotency.reasonCode, 'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_RECORDED');
  assert.equal(idempotency.caseId, 'case_runtime_ports_001');
  assert.deepEqual(idempotency.caseRef, {
    caseRef: 'CASE_RUNTIME_PORTS_001',
    caseId: 'case_runtime_ports_001',
  });
  assert.ok(dbClient.calls.some((call) => call.text.includes('INSERT INTO repair_intake_audit_events')));
  assert.ok(dbClient.calls.some((call) => call.text.includes('INSERT INTO repair_intake_idempotency_records')));

  const idempotencyInsert = dbClient.calls.find((call) => call.text.includes('INSERT INTO repair_intake_idempotency_records'));
  assert.equal(typeof idempotencyInsert.params[5], 'string');
  assert.equal(idempotencyInsert.params[5].length, 64);
});

test('factory source has no env pool server migration provider or credential coupling', () => {
  const source = read('src/repairIntake/repairIntakeDraftToCaseRuntimePortsFactory.js');

  [
    'process.env',
    'DATABASE_URL',
    "require('pg')",
    'new Pool',
    'createPool',
    'src/server',
    'app.listen',
    'server.listen',
    'migration',
    'admin/src',
    'sendLine',
    'sendSms',
    'sendEmail',
    'webhook',
    'openai',
    'vector',
    'rag',
    'billing',
    'settlement',
    'payment',
    'invoice',
  ].forEach((marker) => {
    assert.equal(source.includes(marker), false, `forbidden factory source marker ${marker}`);
  });
});
