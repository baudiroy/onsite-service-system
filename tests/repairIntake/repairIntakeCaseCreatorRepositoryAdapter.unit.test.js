'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createRepairIntakeCaseCreatorRepositoryAdapter,
} = require('../../src/repairIntake/repairIntakeCaseCreatorRepositoryAdapter');

const SOURCE_PATH = path.join(__dirname, '../../src/repairIntake/repairIntakeCaseCreatorRepositoryAdapter.js');

function command(overrides = {}) {
  return {
    draftId: 'draft_task950_001',
    organizationId: 'org_task950',
    actorId: 'actor_task950',
    requestId: 'request_task950',
    idempotencyKey: 'idem_task950',
    ...overrides,
  };
}

function caseCandidate(overrides = {}) {
  return {
    sourceDraftId: 'draft_task950_001',
    organizationId: 'org_task950',
    brandId: 'brand_task950',
    serviceProviderId: 'provider_task950',
    intakeSource: 'web',
    serviceType: 'onsite',
    priority: 'normal',
    reporterRef: { refId: 'reporter_ref_task950', type: 'reporter' },
    customerRef: { refId: 'customer_ref_task950', type: 'customer' },
    billingContactRef: { refId: 'billing_ref_task950', type: 'billing_contact' },
    siteRef: { refId: 'site_ref_task950', type: 'service_site' },
    issueSummaryRef: { refId: 'issue_ref_task950', type: 'issue_summary' },
    createdByActorId: 'actor_task950',
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
    id: 'case_ref_task950',
    organizationId: 'org_task950',
    sourceDraftId: 'draft_task950_001',
    status: 'created',
    ...overrides,
  };
}

function assertNoForbiddenFields(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'caseId',
    'case_id',
    'finalAppointmentId',
    'final_appointment_id',
    'phone',
    'address',
    'customerPayload',
    'rawImportedRowPayload',
    'rawPayload',
    'select *',
    'stack trace',
    'providerPayload',
    'field_service_reports',
    'token',
    'secret',
    'lineAccessToken',
    'LINE access token',
    'LINE marker',
    'rows',
    'sql',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function createHarness(overrides = {}) {
  const tx = { txId: 'tx_task950' };
  const calls = {
    caseRepository: [],
    repairIntakeDraftRepository: [],
    auditWriter: [],
    transactionRunner: [],
  };

  const caseRepository = overrides.caseRepository === undefined ? {
    createCaseFromRepairIntakeCandidate: async (input) => {
      calls.caseRepository.push(input);
      return overrides.caseResult || caseRef();
    },
  } : overrides.caseRepository;

  const repairIntakeDraftRepository = overrides.repairIntakeDraftRepository === undefined ? {
    markDraftLinkedToCase: async (input) => {
      calls.repairIntakeDraftRepository.push(input);
      return overrides.linkResult || { ok: true };
    },
  } : overrides.repairIntakeDraftRepository;

  const auditWriter = overrides.auditWriter === undefined ? {
    recordRepairIntakeDraftToCaseCreated: async (input) => {
      calls.auditWriter.push(input);
      return overrides.auditResult || { ok: true };
    },
  } : overrides.auditWriter;

  const transactionRunner = overrides.transactionRunner === undefined ? {
    runInTransaction: async (callback) => {
      calls.transactionRunner.push({ callback });
      return callback(tx);
    },
  } : overrides.transactionRunner;

  const adapter = createRepairIntakeCaseCreatorRepositoryAdapter({
    caseRepository,
    repairIntakeDraftRepository,
    transactionRunner,
    auditWriter,
    clock: overrides.clock || (() => '2026-05-23T12:00:00.000Z'),
  });

  return {
    adapter,
    calls,
    tx,
  };
}

test('happy path creates case links draft writes audit and returns sanitized creator result', async () => {
  const { adapter, calls, tx } = createHarness({
    caseResult: caseRef({
      phone: 'phone',
      address: 'address',
      customerPayload: 'customerPayload',
      rawImportedRowPayload: 'rawImportedRowPayload',
      rawPayload: 'rawPayload',
      sql: 'select *',
      stack: 'stack trace',
      providerPayload: 'providerPayload',
      token: 'token',
      secret: 'secret',
      lineAccessToken: 'LINE access token',
      caseId: 'unsafe_case_id',
      finalAppointmentId: 'final_should_not_copy',
    }),
    auditResult: {
      ok: true,
      phone: 'phone',
      address: 'address',
      providerPayload: 'providerPayload',
      token: 'token',
      secret: 'secret',
    },
  });

  const result = await adapter.createCaseFromCandidate(creatorInput());

  assert.deepEqual(result, caseRef());
  assert.equal(calls.transactionRunner.length, 1);
  assert.equal(calls.caseRepository.length, 1);
  assert.equal(calls.repairIntakeDraftRepository.length, 1);
  assert.equal(calls.auditWriter.length, 1);
  assert.deepEqual(calls.caseRepository[0], {
    command: command(),
    caseCandidate: caseCandidate(),
    occurredAt: '2026-05-23T12:00:00.000Z',
    tx,
  });
  assert.deepEqual(calls.repairIntakeDraftRepository[0], {
    draftId: 'draft_task950_001',
    organizationId: 'org_task950',
    caseRef: caseRef(),
    actorId: 'actor_task950',
    requestId: 'request_task950',
    idempotencyKey: 'idem_task950',
    occurredAt: '2026-05-23T12:00:00.000Z',
    tx,
  });
  assert.deepEqual(calls.auditWriter[0].auditEvent, {
    eventType: 'repair_intake_draft_to_case_submission',
    outcome: 'submitted',
    draftId: 'draft_task950_001',
    organizationId: 'org_task950',
    actorId: 'actor_task950',
    requestId: 'request_task950',
    idempotencyKey: 'idem_task950',
    caseRef: caseRef(),
    reasonCode: 'CASE_REF_NORMALIZED',
    requiredActions: [],
  });
  assert.deepEqual(calls.auditWriter[0].caseRef, caseRef());
  assert.deepEqual(calls.auditWriter[0].command, command());
  assert.equal(calls.auditWriter[0].tx, tx);
  assert.equal(calls.auditWriter[0].occurredAt, '2026-05-23T12:00:00.000Z');
  assertNoForbiddenFields(result);
});

test('function and alternate injected method names are supported', async () => {
  const calls = {
    caseRepository: [],
    repairIntakeDraftRepository: [],
    auditWriter: [],
    transactionRunner: [],
  };
  const tx = { txId: 'tx_alt' };
  const adapter = createRepairIntakeCaseCreatorRepositoryAdapter({
    caseRepository: {
      create: async (input) => {
        calls.caseRepository.push(input);
        return { caseRef: caseRef() };
      },
    },
    repairIntakeDraftRepository: {
      markLinkedToCase: async (input) => {
        calls.repairIntakeDraftRepository.push(input);
        return { ok: true };
      },
    },
    auditWriter: {
      record: async (input) => {
        calls.auditWriter.push(input);
        return { ok: true };
      },
    },
    transactionRunner: async (callback) => {
      calls.transactionRunner.push({ callback });
      return callback(tx);
    },
  });

  const result = await adapter.create(creatorInput());

  assert.deepEqual(result, caseRef());
  assert.equal(calls.transactionRunner.length, 1);
  assert.equal(calls.caseRepository.length, 1);
  assert.equal(calls.repairIntakeDraftRepository.length, 1);
  assert.equal(calls.auditWriter.length, 1);
  assert.equal(calls.caseRepository[0].tx, tx);
});

test('clock failure does not block repository transaction or leak raw error', async () => {
  const { adapter, calls } = createHarness({
    clock: () => {
      throw new Error('select * stack trace providerPayload token secret phone address customerPayload');
    },
  });

  const result = await adapter.createCaseFromCandidate(creatorInput());

  assert.deepEqual(result, caseRef());
  assert.equal(calls.transactionRunner.length, 1);
  assert.equal(calls.caseRepository[0].occurredAt, null);
  assert.equal(calls.repairIntakeDraftRepository[0].occurredAt, null);
  assert.equal(calls.auditWriter[0].occurredAt, null);
  assertNoForbiddenFields(result);
});

test('missing caseRepository fails safely before transaction', async () => {
  const { adapter, calls } = createHarness({ caseRepository: null });

  const result = await adapter.createCaseFromCandidate(creatorInput());

  assert.deepEqual(result, {
    ok: false,
    reasonCode: 'REPAIR_INTAKE_CASE_CREATOR_CASE_REPOSITORY_REQUIRED',
    requiredActions: ['configure_case_repository'],
    caseRef: null,
  });
  assert.equal(calls.transactionRunner.length, 0);
});

test('missing repairIntakeDraftRepository fails safely before transaction', async () => {
  const { adapter, calls } = createHarness({ repairIntakeDraftRepository: null });

  const result = await adapter.createCaseFromCandidate(creatorInput());

  assert.deepEqual(result, {
    ok: false,
    reasonCode: 'REPAIR_INTAKE_CASE_CREATOR_DRAFT_REPOSITORY_REQUIRED',
    requiredActions: ['configure_repair_intake_draft_repository'],
    caseRef: null,
  });
  assert.equal(calls.transactionRunner.length, 0);
});

test('missing transactionRunner fails safely before writing', async () => {
  const { adapter, calls } = createHarness({ transactionRunner: null });

  const result = await adapter.createCaseFromCandidate(creatorInput());

  assert.deepEqual(result, {
    ok: false,
    reasonCode: 'REPAIR_INTAKE_CASE_CREATOR_TRANSACTION_RUNNER_REQUIRED',
    requiredActions: ['configure_transaction_runner'],
    caseRef: null,
  });
  assert.equal(calls.caseRepository.length, 0);
  assert.equal(calls.repairIntakeDraftRepository.length, 0);
  assert.equal(calls.auditWriter.length, 0);
});

test('missing auditWriter fails safely before transaction', async () => {
  const { adapter, calls } = createHarness({ auditWriter: null });

  const result = await adapter.createCaseFromCandidate(creatorInput());

  assert.deepEqual(result, {
    ok: false,
    reasonCode: 'REPAIR_INTAKE_CASE_CREATOR_AUDIT_WRITER_REQUIRED',
    requiredActions: ['configure_audit_writer'],
    caseRef: null,
  });
  assert.equal(calls.transactionRunner.length, 0);
});

test('missing creator input fails safely before dependencies', async () => {
  const { adapter, calls } = createHarness();

  const result = await adapter.createCaseFromCandidate(null);

  assert.deepEqual(result, {
    ok: false,
    reasonCode: 'REPAIR_INTAKE_CASE_CREATOR_INPUT_MISSING',
    requiredActions: ['provide_creator_input'],
    caseRef: null,
  });
  assert.equal(calls.transactionRunner.length, 0);
});

test('unsafe creator input fields fail safely before transaction', async () => {
  const { adapter, calls } = createHarness();

  const result = await adapter.createCaseFromCandidate(creatorInput({
    caseCandidate: caseCandidate({
      phone: 'phone',
      address: 'address',
      customerPayload: 'customerPayload',
      rawImportedRowPayload: 'rawImportedRowPayload',
      rawPayload: 'rawPayload',
      providerPayload: 'providerPayload',
      token: 'token',
      secret: 'secret',
      lineAccessToken: 'LINE access token',
      finalAppointmentId: 'final_should_not_copy',
    }),
  }));

  assert.deepEqual(result, {
    ok: false,
    reasonCode: 'REPAIR_INTAKE_CASE_CREATOR_UNSAFE_INPUT',
    requiredActions: ['provide_sanitized_creator_input'],
    caseRef: null,
  });
  assert.equal(calls.transactionRunner.length, 0);
  assertNoForbiddenFields(result);
});

test('organization mismatch between command and candidate fails safely', async () => {
  const { adapter, calls } = createHarness();

  const result = await adapter.createCaseFromCandidate(creatorInput({
    caseCandidate: caseCandidate({ organizationId: 'org_other' }),
  }));

  assert.deepEqual(result, {
    ok: false,
    reasonCode: 'REPAIR_INTAKE_CASE_CREATOR_ORGANIZATION_MISMATCH',
    requiredActions: ['manual_review'],
    caseRef: null,
  });
  assert.equal(calls.transactionRunner.length, 0);
});

test('draft and sourceDraft mismatch fails safely', async () => {
  const { adapter, calls } = createHarness();

  const result = await adapter.createCaseFromCandidate(creatorInput({
    caseCandidate: caseCandidate({ sourceDraftId: 'draft_other' }),
  }));

  assert.deepEqual(result, {
    ok: false,
    reasonCode: 'REPAIR_INTAKE_CASE_CREATOR_SOURCE_DRAFT_MISMATCH',
    requiredActions: ['manual_review'],
    caseRef: null,
  });
  assert.equal(calls.transactionRunner.length, 0);
});

test('case repository failure fails safely without linking draft or writing audit', async () => {
  const { adapter, calls } = createHarness({
    caseRepository: {
      createCaseFromRepairIntakeCandidate: async (input) => {
        calls.caseRepository.push(input);
        throw new Error('select * stack trace providerPayload token secret phone address customerPayload');
      },
    },
  });

  const result = await adapter.createCaseFromCandidate(creatorInput());

  assert.deepEqual(result, {
    ok: false,
    reasonCode: 'REPAIR_INTAKE_CASE_CREATOR_CASE_CREATE_FAILED',
    requiredActions: ['retry_or_manual_review'],
    caseRef: null,
  });
  assert.equal(calls.caseRepository.length, 1);
  assert.equal(calls.repairIntakeDraftRepository.length, 0);
  assert.equal(calls.auditWriter.length, 0);
  assertNoForbiddenFields(result);
});

test('case repository invalid result fails safely without linking draft or writing audit', async () => {
  const { adapter, calls } = createHarness({
    caseResult: caseRef({ organizationId: 'org_other' }),
  });

  const result = await adapter.createCaseFromCandidate(creatorInput());

  assert.deepEqual(result, {
    ok: false,
    reasonCode: 'CASE_REF_ORGANIZATION_MISMATCH',
    requiredActions: ['manual_review'],
    caseRef: null,
  });
  assert.equal(calls.caseRepository.length, 1);
  assert.equal(calls.repairIntakeDraftRepository.length, 0);
  assert.equal(calls.auditWriter.length, 0);
});

test('case repository safe failure envelope fails safely without linking draft or writing audit', async () => {
  const { adapter, calls } = createHarness({
    caseResult: {
      ok: false,
      status: 'failed',
      reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_CREATE_FAILED',
      requiredActions: ['retry_or_manual_review'],
      caseRef: null,
      field_service_reports: 'field_service_reports',
      finalAppointmentId: 'finalAppointmentId',
      providerPayload: 'providerPayload',
      token: 'token',
      secret: 'secret',
      phone: 'phone',
      address: 'address',
      lineAccessToken: 'LINE marker',
      rows: [{ sql: 'select *' }],
      stack: 'stack trace',
    },
  });

  const result = await adapter.createCaseFromCandidate(creatorInput());

  assert.deepEqual(result, {
    ok: false,
    reasonCode: 'REPAIR_INTAKE_CASE_REPOSITORY_CREATE_FAILED',
    requiredActions: ['retry_or_manual_review'],
    caseRef: null,
  });
  assert.equal(calls.caseRepository.length, 1);
  assert.equal(calls.repairIntakeDraftRepository.length, 0);
  assert.equal(calls.auditWriter.length, 0);
  assertNoForbiddenFields(result);
});

test('draft link failure fails safely without audit success', async () => {
  const { adapter, calls } = createHarness({
    linkResult: { ok: false, reasonCode: 'unsafe raw result' },
  });

  const result = await adapter.createCaseFromCandidate(creatorInput());

  assert.deepEqual(result, {
    ok: false,
    reasonCode: 'REPAIR_INTAKE_CASE_CREATOR_DRAFT_LINK_FAILED',
    requiredActions: ['retry_or_manual_review'],
    caseRef: null,
  });
  assert.equal(calls.caseRepository.length, 1);
  assert.equal(calls.repairIntakeDraftRepository.length, 1);
  assert.equal(calls.auditWriter.length, 0);
});

test('draft link throwing fails safely without audit success', async () => {
  const { adapter, calls } = createHarness({
    repairIntakeDraftRepository: {
      markDraftLinkedToCase: async (input) => {
        calls.repairIntakeDraftRepository.push(input);
        throw new Error('select * stack trace providerPayload token secret phone address customerPayload');
      },
    },
  });

  const result = await adapter.createCaseFromCandidate(creatorInput());

  assert.deepEqual(result, {
    ok: false,
    reasonCode: 'REPAIR_INTAKE_CASE_CREATOR_DRAFT_LINK_FAILED',
    requiredActions: ['retry_or_manual_review'],
    caseRef: null,
  });
  assert.equal(calls.auditWriter.length, 0);
  assertNoForbiddenFields(result);
});

test('audit writer failure fails safely', async () => {
  const { adapter, calls } = createHarness({
    auditWriter: {
      recordRepairIntakeDraftToCaseCreated: async (input) => {
        calls.auditWriter.push(input);
        throw new Error('select * stack trace providerPayload token secret phone address customerPayload lineAccessToken');
      },
    },
  });

  const result = await adapter.createCaseFromCandidate(creatorInput());

  assert.deepEqual(result, {
    ok: false,
    reasonCode: 'REPAIR_INTAKE_CASE_CREATOR_AUDIT_WRITE_FAILED',
    requiredActions: ['retry_or_manual_review'],
    caseRef: null,
  });
  assert.equal(calls.caseRepository.length, 1);
  assert.equal(calls.repairIntakeDraftRepository.length, 1);
  assert.equal(calls.auditWriter.length, 1);
  assertNoForbiddenFields(result);
});

test('audit writer explicit failure fails safely', async () => {
  const { adapter, calls } = createHarness({
    auditResult: { ok: false, reasonCode: 'raw failure with phone address token secret' },
  });

  const result = await adapter.createCaseFromCandidate(creatorInput());

  assert.deepEqual(result, {
    ok: false,
    reasonCode: 'REPAIR_INTAKE_CASE_CREATOR_AUDIT_WRITE_FAILED',
    requiredActions: ['retry_or_manual_review'],
    caseRef: null,
  });
  assert.equal(calls.auditWriter.length, 1);
  assertNoForbiddenFields(result);
});

test('transaction runner failure fails safely without raw leakage', async () => {
  const { adapter, calls } = createHarness({
    transactionRunner: {
      runInTransaction: async () => {
        calls.transactionRunner.push({ failed: true });
        throw new Error('select * stack trace providerPayload token secret phone address customerPayload');
      },
    },
  });

  const result = await adapter.createCaseFromCandidate(creatorInput());

  assert.deepEqual(result, {
    ok: false,
    reasonCode: 'REPAIR_INTAKE_CASE_CREATOR_TRANSACTION_FAILED',
    requiredActions: ['retry_or_manual_review'],
    caseRef: null,
  });
  assert.equal(calls.caseRepository.length, 0);
  assertNoForbiddenFields(result);
});

test('adapter source does not import DB repositories providers API admin AI billing or smoke runtime', () => {
  const source = fs.readFileSync(SOURCE_PATH, 'utf8');
  const specifiers = [];
  const requirePattern = /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g;
  let match;

  while ((match = requirePattern.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  assert.deepEqual(specifiers.sort(), [
    './repairIntakeDraftCaseSubmissionAuditEventBuilder',
    './repairIntakeDraftCaseSubmissionResultNormalizer',
  ].sort());

  for (const forbidden of [
    '../repositories',
    '../routes',
    '../controllers',
    '../providers',
    '../ai',
    '../billing',
    '../admin',
    '../smoke',
    'pg',
    'sequelize',
    'knex',
    'openai',
    'line',
    'sms',
  ]) {
    assert.equal(source.includes(`require('${forbidden}`), false, `source should not import ${forbidden}`);
    assert.equal(source.includes(`require("${forbidden}`), false, `source should not import ${forbidden}`);
  }
});
