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
    return `${kind || 'synthetic'}-2326-${index}`;
  };
}

function createDraftRow(overrides = {}) {
  return {
    id: 'draft-2326',
    organization_id: 'org-2326',
    tenant_id: 'tenant-2326',
    draft_status: 'ready_for_conversion',
    source: 'website',
    source_ref: 'safe-source-2326',
    intake_source: 'synthetic_full_chain',
    safe_summary: {
      brand: 'safe-brand-2326',
      productType: 'appliance',
      modelNo: 'safe-model-2326',
      problemDescription: 'safe issue summary 2326',
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

function createFakeDbClient(options = {}) {
  const calls = [];
  const draftRow = createDraftRow(options.draftRow || {});

  return {
    calls,
    draftRow,
    async query(text, params = []) {
      calls.push({ text, params: clone(params) });

      if (options.queryThrows) {
        throw new Error('hidden raw database failure select * stack token secret');
      }

      if (text.includes('FROM repair_intake_drafts')) {
        if (options.missingDraft) {
          return { rowCount: 0, rows: [] };
        }

        if (options.crossOrganizationDraft) {
          return {
            rowCount: 1,
            rows: [createDraftRow({ organization_id: 'org-attacker-2326' })],
          };
        }

        if (options.malformedDraftRow) {
          return {
            rowCount: 1,
            rows: [createDraftRow({ id: null, organization_id: null })],
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
              id: 'idem-wrong-2326',
              organization_id: 'org-attacker-2326',
              tenant_id: 'tenant-attacker-2326',
              idempotency_key: 'idem-attacker-2326',
              operation_type: 'draft_to_case',
              draft_id: 'draft-attacker-2326',
              replay_case_id: 'case-attacker-2326',
              replay_case_ref: 'CASE-ATTACKER-2326',
              replay_result_safe: {
                status: 'submitted',
                submitted: true,
                caseRef: {
                  id: 'case-attacker-2326',
                  organizationId: 'org-attacker-2326',
                  sourceDraftId: 'draft-attacker-2326',
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
        if (options.malformedIdempotencyWrite) {
          return {
            rowCount: 1,
            rows: [{ malformed: true }],
          };
        }

        return {
          rowCount: 1,
          rows: [{
            id: 'idem-recorded-2326',
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

      if (text.includes('INSERT INTO repair_intake_audit_events')) {
        return { rowCount: 1, rows: [] };
      }

      return { rowCount: 1, rows: [] };
    },
  };
}

function createTransactionRunner(options = {}) {
  const calls = [];
  const runner = {
    calls,
    async begin() {
      calls.push('begin');

      if (options.failBegin) {
        throw new Error('hidden begin failure stack token secret');
      }

      return {
        txId: 'tx-2326',
        async query(text, params = []) {
          calls.push(`tx:${text.split(/\s+/).slice(0, 3).join(' ')}`);

          if (options.failLink && text.includes('repair_intake_drafts')) {
            return { rowCount: 0, rows: [], params };
          }

          return { rowCount: 1, rows: [], params };
        },
        async commit() {
          calls.push('commit');

          if (options.failCommit) {
            throw new Error('hidden commit failure sql stack token secret');
          }
        },
        async rollback() {
          calls.push('rollback');
        },
      };
    },
  };

  return runner;
}

function createCaseRepository(options = {}) {
  const calls = [];
  const repository = {
    calls,
    async createCaseFromRepairIntakeCandidate(input) {
      calls.push(clone({
        command: input.command,
        candidate: input.caseCandidate,
        txId: input.tx && input.tx.txId,
      }));

      if (options.failCreate) {
        throw new Error('hidden create failure select * stack token secret');
      }

      if (options.malformedCreateResult) {
        return {
          status: 'created',
          rawRows: [{ sql: 'select hidden', token: 'hidden-token' }],
        };
      }

      await input.tx.query('insert into cases', []);

      return {
        id: 'case-2326',
        organizationId: input.command.organizationId,
        sourceDraftId: input.command.draftId,
        status: 'created',
        rawRows: [{ token: 'hidden-token', phone: 'hidden-phone' }],
        providerPayload: { secret: 'hidden-secret' },
      };
    },
  };

  return repository;
}

function createCaseCreatorAuditWriter(options = {}) {
  const calls = [];
  const auditWriter = {
    calls,
    async recordRepairIntakeDraftToCaseCreated(input) {
      calls.push(clone({
        auditEvent: input.auditEvent,
        caseRef: input.caseRef,
        command: input.command,
        txId: input.tx && input.tx.txId,
      }));

      if (options.failAudit) {
        return {
          ok: false,
          rawError: 'hidden audit failure sql stack token secret',
        };
      }

      return { ok: true };
    },
  };

  return auditWriter;
}

function createRequest(overrides = {}) {
  return {
    params: {
      draftId: 'draft-2326',
      raw: 'hidden-param-raw',
    },
    body: {
      organizationId: 'org-body-attacker-2326',
      tenantId: 'tenant-2326',
      idempotencyKey: 'idem-2326',
      approvalContext: {
        accepted: true,
        approvalId: 'approval-2326',
        rawRows: [{ sql: 'select hidden' }],
      },
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
        permissionSource: 'synthetic-test',
        token: 'hidden-permission-token',
      },
      rawBody: 'hidden raw body',
      providerPayload: { token: 'hidden-provider-token' },
      billing: { invoice: 'hidden-invoice' },
    },
    context: {
      organizationId: 'org-2326',
      tenantId: 'tenant-2326',
      actorId: 'actor-2326',
      requestId: 'request-2326',
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

function createPlanningPolicy() {
  return {
    async planCaseFromDraft(input) {
      return {
        status: 'planned',
        reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_DB_BACKED_SYNTHETIC_PLAN_READY',
        candidate: {
          sourceDraftId: input.draft.draftId,
          organizationId: input.organizationId,
          tenantId: input.tenantId,
          intakeSource: 'synthetic_full_chain',
          serviceType: 'onsite',
          priority: 'normal',
          reporterRef: {
            id: 'reporter-2326',
            type: 'service_agent',
          },
          customerRef: {
            id: 'customer-2326',
            type: 'customer',
          },
          issueSummaryRef: {
            id: 'issue-2326',
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
  function statusCodeFor(result) {
    return result && result.ok === true ? 200 : 409;
  }

  return {
    async submitDraftToCase(requestLike) {
      const result = await applicationService.submitDraftToCase(requestLike);

      return {
        ok: result.ok === true,
        statusCode: statusCodeFor(result),
        body: result,
      };
    },
    async planDraftToCase(requestLike) {
      const result = await applicationService.planDraftToCase(requestLike);

      return {
        ok: result.ok === true,
        statusCode: statusCodeFor(result),
        body: result,
      };
    },
  };
}

function createSyntheticChain(options = {}) {
  const dbClient = createFakeDbClient(options.db || {});
  const transactionRunner = createTransactionRunner(options.transaction || {});
  const caseRepository = createCaseRepository(options.caseRepository || {});
  const caseCreatorAuditWriter = createCaseCreatorAuditWriter(options.caseCreatorAuditWriter || {});
  const dependencySnapshot = {
    dbClientKeys: Object.keys(dbClient).sort(),
    transactionRunnerKeys: Object.keys(transactionRunner).sort(),
    caseRepositoryKeys: Object.keys(caseRepository).sort(),
    caseCreatorAuditWriterKeys: Object.keys(caseCreatorAuditWriter).sort(),
    draftRow: clone(dbClient.draftRow),
  };
  const runtimePorts = createRepairIntakeDraftToCaseRuntimePorts({
    dbClient,
    transactionRunner,
    caseCreatorCaseRepository: caseRepository,
    caseCreatorAuditWriter,
    planningPolicy: createPlanningPolicy(),
    idGenerator: createIdGenerator(),
    caseNumberGenerator: () => 'CASE-2326',
    clock: () => '2026-05-31T12:30:00.000Z',
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
  const submitRoute = apiModule.routes.find((route) => route.path.endsWith('/submit'));

  return {
    apiModule,
    caseCreatorAuditWriter,
    caseRepository,
    dbClient,
    dependencySnapshot,
    submitRoute,
    transactionRunner,
  };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'hidden',
    'rawRows',
    'rawBody',
    'rawError',
    'rawServicePayload',
    'providerPayload',
    'provider payload',
    'token',
    'password',
    'secret',
    'select *',
    'stack',
    'database failure',
    'customer private',
    'customerAddress',
    'customerPhone',
    'phone',
    'address',
    'billingPayload',
    'settlement',
    'payment',
    'invoice',
    'openai',
    'vector',
    'rag',
    'auditInternal',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked unsafe marker ${marker}`);
  }
}

function assertDependenciesUnmutated(chain) {
  assert.deepEqual(Object.keys(chain.dbClient).sort(), chain.dependencySnapshot.dbClientKeys);
  assert.deepEqual(Object.keys(chain.transactionRunner).sort(), chain.dependencySnapshot.transactionRunnerKeys);
  assert.deepEqual(Object.keys(chain.caseRepository).sort(), chain.dependencySnapshot.caseRepositoryKeys);
  assert.deepEqual(Object.keys(chain.caseCreatorAuditWriter).sort(), chain.dependencySnapshot.caseCreatorAuditWriterKeys);
  assert.deepEqual(chain.dbClient.draftRow, chain.dependencySnapshot.draftRow);
}

test('successful fake DB-backed application API chain creates safe draft-to-case output', async () => {
  const request = createRequest();
  const beforeRequest = clone(request);
  const chain = createSyntheticChain();

  assert.equal(chain.apiModule.ok, true);
  assert.deepEqual(chain.dbClient.calls, []);
  assert.deepEqual(chain.transactionRunner.calls, []);

  const response = await chain.submitRoute.handler(request);

  assert.equal(response.ok, true);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.action, 'repair_intake_draft_to_case_submit');
  assert.equal(response.body.draftId, 'draft-2326');
  assert.equal(response.body.organizationId, 'org-2326');
  assert.equal(response.body.submitted, true);
  assert.equal(response.body.caseRef.id, 'case-2326');
  assert.equal(response.body.caseRef.organizationId, 'org-2326');
  assert.equal(response.body.caseRef.sourceDraftId, 'draft-2326');
  assert.deepEqual(chain.transactionRunner.calls, [
    'begin',
    'tx:insert into cases',
    'tx:update repair_intake_drafts set',
    'commit',
  ]);
  assert.equal(chain.caseRepository.calls.length, 1);
  assert.equal(chain.caseCreatorAuditWriter.calls.length, 1);
  assert.ok(chain.dbClient.calls.some((call) => call.text.includes('FROM repair_intake_drafts')));
  assert.ok(chain.dbClient.calls.some((call) => call.text.includes('FROM repair_intake_idempotency_records')));
  assert.ok(chain.dbClient.calls.some((call) => call.text.includes('INSERT INTO repair_intake_idempotency_records')));
  assert.ok(chain.dbClient.calls.some((call) => call.text.includes('INSERT INTO repair_intake_audit_events')));
  assertNoUnsafeText(response);
  assertNoUnsafeText(chain.caseRepository.calls);
  assertNoUnsafeText(chain.caseCreatorAuditWriter.calls);
  assert.deepEqual(request, beforeRequest);
  assertDependenciesUnmutated(chain);
});

test('cross-organization draft row fails closed before transaction work', async () => {
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
  assert.deepEqual(chain.transactionRunner.calls, []);
  assert.deepEqual(chain.caseRepository.calls, []);
  assertNoUnsafeText(response);
  assertDependenciesUnmutated(chain);
});

test('wrong idempotency scope fails closed and never replays attacker case data', async () => {
  const chain = createSyntheticChain({
    db: {
      wrongIdempotencyScope: true,
    },
  });

  const response = await chain.submitRoute.handler(createRequest());

  assert.equal(response.ok, true);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.submitted, true);
  assert.equal(response.body.caseRef.id, 'case-2326');
  assert.equal(JSON.stringify(response).includes('case-attacker-2326'), false);
  assert.deepEqual(chain.transactionRunner.calls, [
    'begin',
    'tx:insert into cases',
    'tx:update repair_intake_drafts set',
    'commit',
  ]);
  assert.equal(chain.caseRepository.calls.length, 1);
  assertNoUnsafeText(response);
  assertDependenciesUnmutated(chain);
});

test('transaction create link audit and commit failures fail closed with rollback when supported', async () => {
  const cases = [
    {
      name: 'create',
      options: { caseRepository: { failCreate: true } },
      expectedTransactionCalls: ['begin', 'rollback'],
    },
    {
      name: 'link',
      options: { transaction: { failLink: true } },
      expectedTransactionCalls: ['begin', 'tx:insert into cases', 'tx:update repair_intake_drafts set', 'rollback'],
    },
    {
      name: 'audit',
      options: { caseCreatorAuditWriter: { failAudit: true } },
      expectedTransactionCalls: ['begin', 'tx:insert into cases', 'tx:update repair_intake_drafts set', 'rollback'],
    },
    {
      name: 'commit',
      options: { transaction: { failCommit: true } },
      expectedTransactionCalls: [
        'begin',
        'tx:insert into cases',
        'tx:update repair_intake_drafts set',
        'commit',
        'rollback',
      ],
    },
  ];

  for (const failureCase of cases) {
    const chain = createSyntheticChain(failureCase.options);
    const response = await chain.submitRoute.handler(createRequest());

    assert.equal(response.ok, false, `${failureCase.name} should fail closed`);
    assert.equal(response.statusCode, 409, `${failureCase.name} status`);
    assert.equal(response.body.submitted, false, `${failureCase.name} submitted`);
    assert.equal(
      response.body.reasonCode,
      'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_SUBMIT_FAILED',
      `${failureCase.name} reasonCode`,
    );
    assert.deepEqual(chain.transactionRunner.calls, failureCase.expectedTransactionCalls, failureCase.name);
    assertNoUnsafeText(response);
    assertDependenciesUnmutated(chain);
  }
});

test('malformed DB row and malformed writer result fail closed without raw leakage', async () => {
  const cases = [
    {
      name: 'malformed draft row',
      options: { db: { malformedDraftRow: true } },
      expectedReasonCode: 'REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_DRAFT_NOT_FOUND',
      expectTransaction: false,
    },
    {
      name: 'malformed case writer result',
      options: { caseRepository: { malformedCreateResult: true } },
      expectedReasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_SUBMIT_FAILED',
      expectTransaction: true,
    },
    {
      name: 'malformed idempotency writer result',
      options: { db: { malformedIdempotencyWrite: true } },
      expectedReasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_IDEMPOTENCY_FAILED',
      expectTransaction: true,
    },
  ];

  for (const failureCase of cases) {
    const chain = createSyntheticChain(failureCase.options);
    const response = await chain.submitRoute.handler(createRequest());

    assert.equal(response.ok, false, failureCase.name);
    assert.equal(response.statusCode, 409, failureCase.name);
    assert.equal(response.body.reasonCode, failureCase.expectedReasonCode, failureCase.name);
    assert.equal(
      chain.transactionRunner.calls.includes('begin'),
      failureCase.expectTransaction,
      `${failureCase.name} transaction expectation`,
    );
    assertNoUnsafeText(response);
    assertDependenciesUnmutated(chain);
  }
});

test('synthetic chain test source stays fake only without env DB server migration provider or package coupling', () => {
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
