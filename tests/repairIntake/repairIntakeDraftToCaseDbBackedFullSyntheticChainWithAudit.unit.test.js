'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const {
  createRepairIntakeDraftToCaseApiModule,
} = require('../../src/repairIntake/repairIntakeDraftToCaseApiModule');
const {
  createRepairIntakeDraftToCaseApplicationService,
} = require('../../src/repairIntake/repairIntakeDraftToCaseApplicationService');
const {
  createRepairIntakeDraftToCaseRuntimePorts,
} = require('../../src/repairIntake/repairIntakeDraftToCaseRuntimePortsFactory');

const TEST_SOURCE_PATH = __filename;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createIdGenerator() {
  let index = 0;

  return ({ kind } = {}) => {
    index += 1;
    return `task2335_${kind || 'synthetic'}_${index}`;
  };
}

function createDraftRow(overrides = {}) {
  return {
    id: 'draft_task2335_001',
    organization_id: 'org_task2335',
    tenant_id: 'tenant_task2335',
    draft_status: 'ready_for_conversion',
    source: 'website',
    source_ref: 'safe_source_task2335',
    intake_source: 'task2335_full_synthetic_chain',
    safe_summary: {
      brand: 'safe brand task2335',
      productType: 'appliance',
      modelNo: 'safe model task2335',
      problemDescription: 'safe issue summary task2335',
      serviceRegion: 'north',
      customerAddress: 'hidden customer private address',
      customerPhone: 'hidden customer private phone',
      token: 'hidden-token',
    },
    safe_metadata: {
      priority: 'normal',
      rawRows: [{ sql: 'select hidden' }],
      providerPayload: { token: 'hidden-provider-token' },
    },
    validation_errors_safe: [],
    ...overrides,
  };
}

function createFakeDbClient(calls, options = {}) {
  const draftRow = createDraftRow(options.draftRow || {});

  return {
    draftRow,
    async query(text, params = []) {
      calls.db.push({ text, params: clone(params) });

      if (text.includes('FROM repair_intake_drafts')) {
        if (options.crossOrganizationDraft) {
          return {
            rowCount: 1,
            rows: [createDraftRow({ organization_id: 'org_attacker_task2335' })],
          };
        }

        return {
          rowCount: 1,
          rows: [draftRow],
        };
      }

      if (text.includes('FROM repair_intake_idempotency_records')) {
        if (options.wrongIdempotencyScope) {
          return {
            rowCount: 1,
            rows: [{
              id: 'idem_attacker_task2335',
              organization_id: 'org_attacker_task2335',
              tenant_id: 'tenant_attacker_task2335',
              idempotency_key: 'idem_attacker_task2335',
              operation_type: 'draft_to_case',
              draft_id: 'draft_attacker_task2335',
              replay_case_id: 'case_attacker_task2335',
              replay_case_ref: 'CASE-ATTACKER-TASK2335',
              replay_result_safe: {
                status: 'submitted',
                submitted: true,
                caseRef: {
                  id: 'case_attacker_task2335',
                  organizationId: 'org_attacker_task2335',
                  sourceDraftId: 'draft_attacker_task2335',
                  status: 'created',
                },
              },
              record_status: 'completed',
            }],
          };
        }

        return { rowCount: 0, rows: [] };
      }

      if (text.includes('INSERT INTO repair_intake_idempotency_records')) {
        return {
          rowCount: 1,
          rows: [{
            id: 'idem_recorded_task2335',
            organization_id: params[0],
            tenant_id: params[1],
            idempotency_key: params[2],
            operation_type: params[3],
            draft_id: params[4],
            replay_case_id: params[6],
            replay_case_ref: params[7],
            replay_result_safe: JSON.parse(params[8]),
            record_status: params[9],
          }],
        };
      }

      return { rowCount: 1, rows: [] };
    },
  };
}

function createAuditDbClient(calls, options = {}) {
  return {
    async insert(tableName, payload) {
      calls.auditDb.push({ tableName, payload: clone(payload) });
      calls.events.push(`audit:${tableName}`);

      if (options.throwInsert) {
        throw new Error('hidden raw DB rows select * stack token password secret provider payload contact address');
      }

      if (options.rejectInsert) {
        return Promise.reject(new Error('hidden SQL stack DB error token secret raw service payloads'));
      }

      if (options.malformedResult) {
        return null;
      }

      return {
        ok: true,
        rows: [{
          rawRows: [{ phone: 'hidden customer private phone', address: 'hidden customer private address' }],
          sql: 'select * from hidden',
          token: 'hidden-token',
          providerPayload: 'hidden provider payload',
        }],
      };
    },
  };
}

function createTransactionRunner(calls) {
  return {
    async begin() {
      calls.transaction.push('begin');
      calls.events.push('begin');

      return {
        txId: 'tx_task2335',
        async query(text, params = []) {
          const marker = text.includes('repair_intake_drafts') ? 'tx:link' : 'tx:create';

          calls.transaction.push(marker);
          calls.events.push(marker);

          return { rowCount: 1, rows: [], params };
        },
        async commit() {
          calls.transaction.push('commit');
          calls.events.push('commit');
        },
        async rollback() {
          calls.transaction.push('rollback');
          calls.events.push('rollback');
        },
      };
    },
  };
}

function createCaseRepository(calls) {
  return {
    async createCaseFromRepairIntakeCandidate(input) {
      calls.caseRepository.push(clone({
        command: input.command,
        candidate: input.caseCandidate,
        txId: input.tx && input.tx.txId,
      }));

      await input.tx.query('insert into cases', []);

      return {
        id: 'case_task2335_001',
        organizationId: input.command.organizationId,
        sourceDraftId: input.command.draftId,
        status: 'created',
        rawRows: [{ token: 'hidden-token', phone: 'hidden-phone' }],
        providerPayload: { secret: 'hidden-secret' },
      };
    },
  };
}

function createPlanningPolicy() {
  return {
    async planCaseFromDraft(input) {
      return {
        status: 'planned',
        reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_DB_BACKED_SYNTHETIC_WITH_AUDIT_PLAN_READY',
        candidate: {
          sourceDraftId: input.draft.draftId,
          organizationId: input.organizationId,
          tenantId: input.tenantId,
          intakeSource: 'task2335_full_synthetic_chain',
          serviceType: 'onsite',
          priority: 'normal',
          reporterRef: {
            id: 'reporter_task2335',
            type: 'service_agent',
          },
          customerRef: {
            id: 'customer_task2335',
            type: 'customer',
          },
          issueSummaryRef: {
            id: 'issue_task2335',
            type: 'issue_summary',
          },
          createdByActorId: input.actorId,
        },
      };
    },
  };
}

function appCaseCreatorFromRepository(caseCreatorRepository) {
  return {
    async createCaseFromDraft(input) {
      return caseCreatorRepository.createCaseFromCandidate({
        command: {
          draftId: input.draftId,
          organizationId: input.organizationId,
          tenantId: input.tenantId,
          actorId: input.actorId,
          requestId: input.requestId,
          idempotencyKey: input.idempotencyKey,
        },
        caseCandidate: input.plan.candidate,
      });
    },
  };
}

function controllerFromApplicationService(applicationService) {
  return {
    async planDraftToCase(requestLike) {
      const result = await applicationService.planDraftToCase(requestLike);

      return {
        ok: result.ok === true,
        statusCode: result.ok === true ? 200 : 409,
        body: result,
      };
    },
    async submitDraftToCase(requestLike) {
      const result = await applicationService.submitDraftToCase(requestLike);

      return {
        ok: result.ok === true,
        statusCode: result.ok === true ? 200 : 409,
        body: result,
      };
    },
  };
}

function createRequest(overrides = {}) {
  return {
    params: {
      draftId: 'draft_task2335_001',
      raw: 'hidden-param-raw',
    },
    body: {
      organizationId: 'org_body_attacker_task2335',
      tenantId: 'tenant_task2335',
      idempotencyKey: 'idem_task2335',
      approvalContext: {
        accepted: true,
        rawRows: [{ sql: 'select hidden' }],
      },
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
        token: 'hidden-permission-token',
      },
      rawBody: 'hidden raw request body',
      rawServicePayload: 'hidden raw service payloads',
      providerPayload: { token: 'hidden-provider-token' },
      openai: 'hidden openai',
      rag: 'hidden RAG',
      vector: 'hidden vector',
      billing: { settlement: 'hidden settlement', payment: 'hidden payment', invoice: 'hidden invoice' },
    },
    context: {
      organizationId: 'org_task2335',
      tenantId: 'tenant_task2335',
      actorId: 'actor_task2335',
      requestId: 'request_task2335',
      token: 'hidden-context-token',
    },
    query: {
      sql: 'select hidden',
      token: 'hidden-query-token',
    },
    headers: {
      authorization: 'hidden-auth',
    },
    ...overrides,
  };
}

function createCalls() {
  return {
    auditDb: [],
    caseRepository: [],
    db: [],
    events: [],
    transaction: [],
  };
}

function createSyntheticChain(options = {}) {
  const calls = createCalls();
  const dbClient = createFakeDbClient(calls, options.db || {});
  const auditDbClient = createAuditDbClient(calls, options.auditDb || {});
  const transactionRunner = createTransactionRunner(calls);
  const caseRepository = createCaseRepository(calls);
  const dependencySnapshot = {
    auditDbClientKeys: Object.keys(auditDbClient).sort(),
    caseRepositoryKeys: Object.keys(caseRepository).sort(),
    dbClientKeys: Object.keys(dbClient).sort(),
    draftRow: clone(dbClient.draftRow),
    transactionRunnerKeys: Object.keys(transactionRunner).sort(),
  };
  const runtimePorts = createRepairIntakeDraftToCaseRuntimePorts({
    dbClient,
    auditDbClient,
    transactionRunner,
    caseCreatorCaseRepository: caseRepository,
    planningPolicy: createPlanningPolicy(),
    idGenerator: createIdGenerator(),
    caseNumberGenerator: () => 'CASE-TASK2335',
    clock: () => '2026-05-31T01:00:00.000Z',
  });
  const applicationService = createRepairIntakeDraftToCaseApplicationService({
    draftReader: runtimePorts.draftReader,
    idempotencyPort: runtimePorts.idempotencyPort,
    casePlanner: runtimePorts.casePlanner,
    caseCreator: appCaseCreatorFromRepository(runtimePorts.caseCreatorRepository),
    auditWriter: runtimePorts.auditWriter,
  });
  const apiModule = createRepairIntakeDraftToCaseApiModule({
    controller: controllerFromApplicationService(applicationService),
  });

  return {
    apiModule,
    auditDbClient,
    calls,
    caseRepository,
    dbClient,
    dependencySnapshot,
    runtimePorts,
    submitRoute: apiModule.routes.find((route) => route.path.endsWith('/submit')),
    transactionRunner,
  };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'hidden',
    'rawRows',
    'rawBody',
    'raw request body',
    'raw DB rows',
    'rawError',
    'rawServicePayload',
    'raw service payloads',
    'providerPayload',
    'provider payload',
    'token',
    'password',
    'secret',
    'select *',
    'SQL',
    'stack',
    'DB error',
    'customer private',
    'customerAddress',
    'customerPhone',
    'phone',
    'contact',
    'address',
    'billingPayload',
    'settlement',
    'payment',
    'invoice',
    'openai',
    'RAG',
    'vector',
    'rag',
    'auditInternal',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked unsafe marker ${marker}`);
  }
}

function assertDependenciesUnmutated(chain) {
  assert.deepEqual(Object.keys(chain.auditDbClient).sort(), chain.dependencySnapshot.auditDbClientKeys);
  assert.deepEqual(Object.keys(chain.caseRepository).sort(), chain.dependencySnapshot.caseRepositoryKeys);
  assert.deepEqual(Object.keys(chain.dbClient).sort(), chain.dependencySnapshot.dbClientKeys);
  assert.deepEqual(Object.keys(chain.transactionRunner).sort(), chain.dependencySnapshot.transactionRunnerKeys);
  assert.deepEqual(chain.dbClient.draftRow, chain.dependencySnapshot.draftRow);
}

function assertAuditPayload(payload) {
  assert.equal(payload.event_type, 'repair_intake_draft_to_case_submission');
  assert.equal(payload.organization_id, 'org_task2335');
  assert.equal(payload.tenant_id, 'tenant_task2335');
  assert.equal(payload.draft_id, 'draft_task2335_001');
  assert.equal(payload.case_id, 'case_task2335_001');
  assert.equal(payload.case_ref, 'case_task2335_001');
  assert.equal(payload.actor_id, 'actor_task2335');
  assert.equal(payload.actor_type, 'system');
  assert.equal(payload.request_id, 'request_task2335');
  assert.equal(payload.decision, 'submitted');
  assert.equal(payload.outcome, 'submitted');
  assert.equal(payload.reason_code, 'REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_PORTS_AUDIT_RECORDED');
  assert.deepEqual(payload.safe_metadata, {
    source: 'repair_intake_draft_to_case_runtime_ports_factory',
  });
  assert.equal(payload.visibility, 'internal_only');
  assert.equal(payload.occurred_at, '2026-05-31T01:00:00.000Z');
}

test('successful fake full synthetic chain records sanitized audit persistence through runtime factory', async () => {
  const chain = createSyntheticChain();
  const request = createRequest();
  const beforeRequest = clone(request);

  assert.equal(chain.apiModule.ok, true);
  assert.deepEqual(chain.calls.db, []);
  assert.deepEqual(chain.calls.auditDb, []);
  assert.deepEqual(chain.calls.transaction, []);

  const response = await chain.submitRoute.handler(request);

  assert.equal(response.ok, true);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.action, 'repair_intake_draft_to_case_submit');
  assert.equal(response.body.draftId, 'draft_task2335_001');
  assert.equal(response.body.organizationId, 'org_task2335');
  assert.equal(response.body.caseRef.id, 'case_task2335_001');
  assert.deepEqual(chain.calls.transaction, ['begin', 'tx:create', 'tx:link', 'commit']);
  assert.deepEqual(chain.calls.events, [
    'begin',
    'tx:create',
    'tx:link',
    'audit:repair_intake_audit_events',
    'commit',
    'audit:repair_intake_audit_events',
  ]);
  assert.equal(chain.calls.caseRepository.length, 1);
  assert.ok(chain.calls.db.some((call) => call.text.includes('FROM repair_intake_drafts')));
  assert.ok(chain.calls.db.some((call) => call.text.includes('FROM repair_intake_idempotency_records')));
  assert.ok(chain.calls.db.some((call) => call.text.includes('INSERT INTO repair_intake_idempotency_records')));
  assert.equal(chain.calls.db.some((call) => call.text.toLowerCase().includes('repair_intake_audit_events')), false);
  assert.equal(chain.calls.auditDb.length, 2);
  assert.equal(chain.calls.auditDb.every((call) => call.tableName === 'repair_intake_audit_events'), true);
  assertAuditPayload(chain.calls.auditDb[0].payload);
  assertAuditPayload(chain.calls.auditDb[1].payload);
  assertNoUnsafeText(response);
  assertNoUnsafeText(chain.calls.caseRepository);
  assertNoUnsafeText(chain.calls.auditDb);
  assert.deepEqual(request, beforeRequest);
  assertDependenciesUnmutated(chain);
});

test('fake audit DB throw reject and malformed result fail closed without raw leakage', async () => {
  for (const auditDb of [
    { throwInsert: true },
    { rejectInsert: true },
    { malformedResult: true },
  ]) {
    const chain = createSyntheticChain({ auditDb });
    const response = await chain.submitRoute.handler(createRequest());

    assert.equal(response.ok, false);
    assert.equal(response.statusCode, 409);
    assert.equal(response.body.submitted, false);
    assert.equal(response.body.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_SUBMIT_FAILED');
    assert.deepEqual(chain.calls.transaction, ['begin', 'tx:create', 'tx:link', 'rollback']);
    assert.deepEqual(chain.calls.events, [
      'begin',
      'tx:create',
      'tx:link',
      'audit:repair_intake_audit_events',
      'rollback',
    ]);
    assert.equal(chain.calls.auditDb.length, 1);
    assertNoUnsafeText(response);
    assertDependenciesUnmutated(chain);
  }
});

test('missing organization audit event fails before fake audit DB call', async () => {
  const chain = createSyntheticChain();
  const result = await chain.runtimePorts.auditWriter.recordDraftToCaseDecision({
    draftId: 'draft_task2335_001',
    draft: {
      id: 'draft_task2335_001',
      draftId: 'draft_task2335_001',
      status: 'ready_for_conversion',
    },
    plan: {
      status: 'planned',
      candidate: {
        sourceDraftId: 'draft_task2335_001',
      },
    },
    caseRef: {
      id: 'case_task2335_001',
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_ORGANIZATION_MISSING');
  assert.deepEqual(chain.calls.auditDb, []);
  assertNoUnsafeText(result);
  assertDependenciesUnmutated(chain);
});

test('cross-organization draft fails closed before transaction and audit persistence', async () => {
  const chain = createSyntheticChain({
    db: {
      crossOrganizationDraft: true,
    },
  });
  const response = await chain.submitRoute.handler(createRequest());

  assert.equal(response.ok, false);
  assert.equal(response.statusCode, 409);
  assert.equal(response.body.submitted, false);
  assert.equal(response.body.reasonCode, 'REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_DRAFT_NOT_FOUND');
  assert.deepEqual(chain.calls.transaction, []);
  assert.deepEqual(chain.calls.auditDb, []);
  assert.equal(JSON.stringify(response).includes('org_attacker_task2335'), false);
  assertNoUnsafeText(response);
  assertDependenciesUnmutated(chain);
});

test('wrong idempotency replay scope does not replay attacker data and still records safe audit', async () => {
  const chain = createSyntheticChain({
    db: {
      wrongIdempotencyScope: true,
    },
  });
  const response = await chain.submitRoute.handler(createRequest());

  assert.equal(response.ok, true);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.submitted, true);
  assert.equal(response.body.caseRef.id, 'case_task2335_001');
  assert.equal(JSON.stringify(response).includes('case_attacker_task2335'), false);
  assert.equal(JSON.stringify(response).includes('org_attacker_task2335'), false);
  assert.equal(chain.calls.auditDb.length, 2);
  assertNoUnsafeText(response);
  assertDependenciesUnmutated(chain);
});

test('Task2335 synthetic chain test source stays fake only without env DB server migration provider or package coupling', () => {
  const source = fs.readFileSync(TEST_SOURCE_PATH, 'utf8');
  const requireSpecifiers = Array.from(source.matchAll(/require\((['"])([^'"]+)\1\)/g), (match) => match[2]);

  assert.deepEqual(requireSpecifiers, [
    'node:assert/strict',
    'node:fs',
    'node:test',
    '../../src/repairIntake/repairIntakeDraftToCaseApiModule',
    '../../src/repairIntake/repairIntakeDraftToCaseApplicationService',
    '../../src/repairIntake/repairIntakeDraftToCaseRuntimePortsFactory',
  ]);

  for (const forbidden of [
    'process.env.DATA' + 'BASE_URL',
    'new ' + 'Pool',
    'require(' + "'pg')",
    'require("pg"' + ')',
    'app.' + 'listen',
    'server.' + 'listen',
    'npm run ' + 'migrate',
    'db' + ':migrate',
    '/health' + 'z',
    'send' + 'Line',
    'send' + 'Sms',
    'send' + 'Email',
    'webhook.' + 'send',
    'package' + '-lock',
  ]) {
    assert.equal(source.includes(forbidden), false, `test source contains forbidden marker ${forbidden}`);
  }
});
