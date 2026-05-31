'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeCaseCreatorRepositoryAdapter,
} = require('../../src/repairIntake/repairIntakeCaseCreatorRepositoryAdapter');

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
    'rawRepositoryResult',
    'rawRow',
    'rawRows',
    'rawServicePayload',
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

function command(overrides = {}) {
  return {
    draftId: 'draft-2321',
    organizationId: 'org-2321',
    tenantId: 'tenant-2321',
    actorId: 'actor-2321',
    requestId: 'request-2321',
    idempotencyKey: 'idempotency-2321',
    ...overrides,
  };
}

function caseCandidate(overrides = {}) {
  return {
    sourceDraftId: 'draft-2321',
    organizationId: 'org-2321',
    tenantId: 'tenant-2321',
    brandId: 'brand-2321',
    serviceProviderId: 'provider-2321',
    intakeSource: 'web',
    serviceType: 'onsite',
    priority: 'normal',
    reporterRef: { refId: 'reporter-2321', type: 'reporter' },
    customerRef: { refId: 'customer-2321', type: 'customer' },
    billingContactRef: { refId: 'billing-2321', type: 'billing_contact' },
    siteRef: { refId: 'site-2321', type: 'service_site' },
    issueSummaryRef: { refId: 'issue-2321', type: 'issue_summary' },
    createdByActorId: 'actor-2321',
    ...overrides,
  };
}

function creatorInput(overrides = {}) {
  return {
    command: command(),
    caseCandidate: caseCandidate(),
    ...overrides,
  };
}

function caseRef(overrides = {}) {
  return {
    id: 'case-2321',
    organizationId: 'org-2321',
    sourceDraftId: 'draft-2321',
    status: 'created',
    ...overrides,
  };
}

function createManualTransactionHarness(overrides = {}) {
  const calls = {
    auditWriter: [],
    caseRepository: [],
    draftRepository: [],
    sequence: [],
  };
  const tx = {
    txId: 'tx-2321',
    commit: async () => {
      calls.sequence.push('commit');

      if (overrides.commitError) {
        throw new Error(overrides.commitError);
      }
    },
    rollback: async () => {
      calls.sequence.push('rollback');

      if (overrides.rollbackError) {
        throw new Error(overrides.rollbackError);
      }
    },
  };
  const transactionRunner = overrides.transactionRunner || {
    begin: async () => {
      calls.sequence.push('begin');

      if (overrides.beginError) {
        throw new Error(overrides.beginError);
      }

      return tx;
    },
  };
  const adapter = createRepairIntakeCaseCreatorRepositoryAdapter({
    caseRepository: overrides.caseRepository || {
      createCaseFromRepairIntakeCandidate: async (input) => {
        calls.sequence.push('create');
        calls.caseRepository.push(clone(input));

        if (overrides.caseError) {
          throw new Error(overrides.caseError);
        }

        return overrides.caseResult || caseRef();
      },
    },
    repairIntakeDraftRepository: overrides.repairIntakeDraftRepository || {
      markDraftLinkedToCase: async (input) => {
        calls.sequence.push('link');
        calls.draftRepository.push(clone(input));

        if (overrides.linkError) {
          throw new Error(overrides.linkError);
        }

        return overrides.linkResult || { ok: true };
      },
    },
    auditWriter: overrides.auditWriter || {
      recordRepairIntakeDraftToCaseCreated: async (input) => {
        calls.sequence.push('audit');
        calls.auditWriter.push(clone(input));

        if (overrides.auditError) {
          throw new Error(overrides.auditError);
        }

        return overrides.auditResult || { ok: true };
      },
    },
    transactionRunner,
    clock: () => '2026-05-31T12:00:00.000Z',
  });

  return {
    adapter,
    calls,
    tx,
  };
}

test('successful transaction skeleton uses injected begin create link audit commit with trusted scope', async () => {
  const { adapter, calls, tx } = createManualTransactionHarness({
    caseResult: caseRef({
      rawRows: [{ sql: 'select * from cases' }],
      stack: 'stack trace',
      providerPayload: { token: 'hidden' },
      customerPhone: 'hidden',
    }),
  });
  const input = creatorInput();
  const inputBefore = clone(input);

  const result = await adapter.createCaseFromCandidate(input);

  assert.deepEqual(input, inputBefore, 'creator input was mutated');
  assert.deepEqual(result, caseRef());
  assert.deepEqual(calls.sequence, ['begin', 'create', 'link', 'audit', 'commit']);
  assert.equal(calls.caseRepository.length, 1);
  assert.deepEqual({
    ...calls.caseRepository[0],
    tx: { txId: calls.caseRepository[0].tx.txId },
  }, {
    command: command(),
    caseCandidate: caseCandidate(),
    occurredAt: '2026-05-31T12:00:00.000Z',
    tx: { txId: tx.txId },
  });
  assert.deepEqual({
    ...calls.draftRepository[0],
    tx: { txId: calls.draftRepository[0].tx.txId },
  }, {
    draftId: 'draft-2321',
    organizationId: 'org-2321',
    tenantId: 'tenant-2321',
    caseRef: caseRef(),
    actorId: 'actor-2321',
    requestId: 'request-2321',
    idempotencyKey: 'idempotency-2321',
    occurredAt: '2026-05-31T12:00:00.000Z',
    tx: { txId: tx.txId },
  });
  assert.equal(calls.auditWriter[0].tx.txId, 'tx-2321');
  assertNoUnsafeMarkers(result);
});

test('malformed trusted command and client controlled override fields fail before transaction work', async () => {
  const { adapter, calls } = createManualTransactionHarness();

  const missingCommandResult = await adapter.createCaseFromCandidate(creatorInput({
    command: command({ organizationId: '' }),
  }));
  const unsafeOverrideResult = await adapter.createCaseFromCandidate(creatorInput({
    requestBody: { organizationId: 'org-client', tenantId: 'tenant-client' },
    draftInput: { organizationId: 'org-draft-input' },
    body: { organizationId: 'org-body' },
    client: { organizationId: 'org-client' },
    headers: { authorization: 'hidden' },
    query: { organizationId: 'org-query' },
    rawBody: { organizationId: 'org-raw-body' },
  }));

  assert.deepEqual(missingCommandResult, {
    ok: false,
    reasonCode: 'REPAIR_INTAKE_CASE_CREATOR_COMMAND_MISSING',
    requiredActions: ['provide_sanitized_command'],
    caseRef: null,
  });
  assert.deepEqual(unsafeOverrideResult, {
    ok: false,
    reasonCode: 'REPAIR_INTAKE_CASE_CREATOR_UNSAFE_INPUT',
    requiredActions: ['provide_sanitized_creator_input'],
    caseRef: null,
  });
  assert.deepEqual(calls.sequence, []);
  assertNoUnsafeMarkers(missingCommandResult);
  assertNoUnsafeMarkers(unsafeOverrideResult);
});

test('tenant mismatch fails before transaction work', async () => {
  const { adapter, calls } = createManualTransactionHarness();

  const result = await adapter.createCaseFromCandidate(creatorInput({
    command: command({ tenantId: 'tenant-command' }),
    caseCandidate: caseCandidate({ tenantId: 'tenant-candidate' }),
  }));

  assert.deepEqual(result, {
    ok: false,
    reasonCode: 'REPAIR_INTAKE_CASE_CREATOR_TENANT_MISMATCH',
    requiredActions: ['manual_review'],
    caseRef: null,
  });
  assert.deepEqual(calls.sequence, []);
});

test('repository create failure rolls back through injected transaction and hides raw details', async () => {
  const { adapter, calls } = createManualTransactionHarness({
    caseError: 'DATABASE_URL select * stack trace token password secret phone providerPayload',
    rollbackError: 'rollback database error token stack trace',
  });

  const result = await adapter.createCaseFromCandidate(creatorInput());

  assert.deepEqual(calls.sequence, ['begin', 'create', 'rollback']);
  assert.deepEqual(result, {
    ok: false,
    reasonCode: 'REPAIR_INTAKE_CASE_CREATOR_CASE_CREATE_FAILED',
    requiredActions: ['retry_or_manual_review'],
    caseRef: null,
  });
  assertNoUnsafeMarkers(result);
});

test('malformed repository result rolls back and fails closed', async () => {
  const { adapter, calls } = createManualTransactionHarness({
    caseResult: {
      id: null,
      organizationId: 'org-2321',
      sourceDraftId: 'draft-2321',
      status: 'created',
      rawRepositoryResult: { sql: 'select * from cases' },
      token: 'hidden',
    },
  });

  const result = await adapter.createCaseFromCandidate(creatorInput());

  assert.deepEqual(calls.sequence, ['begin', 'create', 'rollback']);
  assert.deepEqual(result, {
    ok: false,
    reasonCode: 'CASE_REF_ID_MISSING',
    requiredActions: ['manual_review'],
    caseRef: null,
  });
  assertNoUnsafeMarkers(result);
});

test('commit failure attempts rollback and returns sanitized transaction failure', async () => {
  const { adapter, calls } = createManualTransactionHarness({
    commitError: 'commit database error select * token secret stack trace',
    rollbackError: 'rollback token secret stack trace',
  });

  const result = await adapter.createCaseFromCandidate(creatorInput());

  assert.deepEqual(calls.sequence, ['begin', 'create', 'link', 'audit', 'commit', 'rollback']);
  assert.deepEqual(result, {
    ok: false,
    reasonCode: 'REPAIR_INTAKE_CASE_CREATOR_TRANSACTION_COMMIT_FAILED',
    requiredActions: ['retry_or_manual_review'],
    caseRef: null,
  });
  assertNoUnsafeMarkers(result);
});

test('begin failure fails closed before create link audit work', async () => {
  const { adapter, calls } = createManualTransactionHarness({
    beginError: 'begin DATABASE_URL stack trace sql token',
  });

  const result = await adapter.createCaseFromCandidate(creatorInput());

  assert.deepEqual(calls.sequence, ['begin']);
  assert.deepEqual(result, {
    ok: false,
    reasonCode: 'REPAIR_INTAKE_CASE_CREATOR_TRANSACTION_BEGIN_FAILED',
    requiredActions: ['retry_or_manual_review'],
    caseRef: null,
  });
  assertNoUnsafeMarkers(result);
});

test('repository failure envelope is sanitized and does not mutate result object', async () => {
  const caseResult = {
    ok: false,
    reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_CREATE_FAILED',
    requiredActions: ['retry_or_manual_review'],
    rawRows: [{ sql: 'select * from cases' }],
    providerPayload: { token: 'hidden' },
    customerName: 'hidden',
  };
  const caseResultBefore = clone(caseResult);
  const { adapter, calls } = createManualTransactionHarness({ caseResult });

  const result = await adapter.createCaseFromCandidate(creatorInput());

  assert.deepEqual(caseResult, caseResultBefore, 'repository result object was mutated');
  assert.deepEqual(calls.sequence, ['begin', 'create', 'rollback']);
  assert.deepEqual(result, {
    ok: false,
    reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_CREATE_FAILED',
    requiredActions: ['retry_or_manual_review'],
    caseRef: null,
  });
  assertNoUnsafeMarkers(result);
});
