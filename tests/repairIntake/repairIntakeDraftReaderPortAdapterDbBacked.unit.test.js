'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftReaderPortAdapter,
} = require('../../src/repairIntake/repairIntakeDraftReaderPortAdapter');
const {
  createRepairIntakeDraftRepository,
} = require('../../src/repairIntake/repairIntakeDraftRepository');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function safeRow(overrides = {}) {
  return {
    id: 'draft_db_2315',
    organization_id: 'org_db_2315',
    tenant_id: 'tenant_db_2315',
    draft_status: 'ready_for_conversion',
    source: 'repair_intake',
    source_ref: 'source_db_2315',
    intake_source: 'admin',
    safe_summary: {
      title: 'safe db backed draft',
      phone: '+886900002315',
      customerName: 'unsafe customer name',
      token: 'unsafe summary token',
    },
    safe_metadata: {
      safeKey: 'safe metadata',
      brandId: 'brand_db_2315',
      serviceProviderId: 'provider_db_2315',
      reporterRef: {
        id: 'reporter_db_2315',
        phone: '+886900002315',
      },
      customerRef: {
        id: 'customer_db_2315',
        address: 'unsafe customer address',
      },
      billingContactRef: {
        id: 'billing_db_2315',
        token: 'unsafe billing token',
      },
      duplicateCandidate: {
        candidateId: 'dup_db_2315',
        matchScore: 0.72,
        confirmedDuplicate: true,
        caseId: 'case_should_not_escape',
      },
      rawRows: [{ token: 'unsafe nested raw token' }],
    },
    validation_errors_safe: ['safe warning', '', 42],
    rawRow: {
      sql: 'select * from unsafe_row',
    },
    stack: 'unsafe stack trace',
    lineAccessToken: 'unsafe line token',
    providerPayload: 'unsafe provider payload',
    auditInternal: 'unsafe audit internal',
    billing: 'unsafe billing payload',
    rag: 'unsafe rag payload',
    ...overrides,
  };
}

function trustedInput(overrides = {}) {
  return {
    repairIntakeDraftId: 'draft_db_2315',
    context: {
      organizationId: 'org_db_2315',
      tenantId: 'tenant_db_2315',
      requestId: 'req_db_2315',
      actorId: 'actor_db_2315',
    },
    body: {
      draftId: 'body_draft_should_not_win',
      organizationId: 'body_org_should_not_win',
      repairIntakeDraftId: 'body_repair_draft_should_not_win',
      draftInput: {
        draftId: 'draft_input_should_not_win',
        organizationId: 'draft_input_org_should_not_win',
      },
      rawBody: 'unsafe raw body',
      token: 'unsafe body token',
    },
    params: {
      draftId: 'params_draft_should_not_win',
    },
    ...overrides,
  };
}

function createDbBackedReader(options = {}) {
  const calls = [];
  const rows = options.rows || [safeRow()];
  const dbClient = {
    async query(sql, params) {
      calls.push({ sql, params });

      if (options.throwQuery) {
        throw new Error('DATABASE_URL=postgres://unsafe select * from unsafe_table stack unsafe token');
      }

      if (options.rejectQuery) {
        return Promise.reject(new Error('DATABASE_URL=postgres://unsafe rejected query stack unsafe token'));
      }

      return { rows };
    },
  };
  const draftRepository = createRepairIntakeDraftRepository({ dbClient });
  const adapter = createRepairIntakeDraftReaderPortAdapter({ draftRepository });

  return { adapter, calls, rows };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'DATABASE_URL',
    'postgres://',
    'select *',
    'unsafe_table',
    '+886900002315',
    'unsafe customer name',
    'unsafe customer address',
    'unsafe summary token',
    'unsafe billing token',
    'unsafe nested raw token',
    'case_should_not_escape',
    'unsafe_row',
    'unsafe stack trace',
    'unsafe line token',
    'unsafe provider payload',
    'unsafe audit internal',
    'unsafe billing payload',
    'unsafe rag payload',
    'body_draft_should_not_win',
    'body_org_should_not_win',
    'body_repair_draft_should_not_win',
    'draft_input_should_not_win',
    'draft_input_org_should_not_win',
    'params_draft_should_not_win',
    'unsafe raw body',
    'unsafe body token',
    'rawRow',
    'rawRows',
    'sql',
    'stack',
    'lineAccessToken',
    'providerPayload',
    'auditInternal',
    'billing',
    'rag',
    'token',
    'phone',
    'customerName',
    'address',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('DB-backed draft reader reads by trusted organization and draft id with sanitized output', async () => {
  const { adapter, calls } = createDbBackedReader();

  const result = await adapter.getDraftForConversion(trustedInput());

  assert.equal(result.ok, true);
  assert.equal(result.draftId, 'draft_db_2315');
  assert.equal(result.organizationId, 'org_db_2315');
  assert.equal(result.tenantId, 'tenant_db_2315');
  assert.equal(result.status, 'ready_for_conversion');
  assert.equal(result.summary.title, 'safe db backed draft');
  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /^SELECT/);
  assert.match(calls[0].sql, /FROM repair_intake_drafts/);
  assert.match(calls[0].sql, /id = \$1/);
  assert.match(calls[0].sql, /organization_id = \$2/);
  assert.match(calls[0].sql, /tenant_id = \$3/);
  assert.deepEqual(calls[0].params, ['draft_db_2315', 'org_db_2315', 'tenant_db_2315']);
  assertNoUnsafeText(result);
});

test('client-controlled body draftInput params cannot override trusted context', async () => {
  const { adapter, calls } = createDbBackedReader();

  const result = await adapter.getDraftForConversion(trustedInput());

  assert.equal(result.ok, true);
  assert.deepEqual(calls[0].params, ['draft_db_2315', 'org_db_2315', 'tenant_db_2315']);
  assert.equal(calls[0].sql.includes('body_draft_should_not_win'), false);
  assert.equal(calls[0].sql.includes('body_org_should_not_win'), false);
  assert.equal(calls[0].sql.includes('draft_input_should_not_win'), false);
  assert.equal(calls[0].params.includes('body_draft_should_not_win'), false);
  assert.equal(calls[0].params.includes('body_org_should_not_win'), false);
  assert.equal(calls[0].params.includes('draft_input_should_not_win'), false);
  assertNoUnsafeText(result);
});

test('cross-organization and wrong-tenant rows fail closed', async () => {
  for (const row of [
    safeRow({ organization_id: 'org_other_2315' }),
    safeRow({ tenant_id: 'tenant_other_2315' }),
  ]) {
    const { adapter } = createDbBackedReader({ rows: [row] });
    const result = await adapter.getDraftForConversion(trustedInput());

    assert.equal(result.ok, false);
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_DRAFT_NOT_FOUND');
    assert.deepEqual(result.requiredActions, ['verify_draft_exists']);
    assertNoUnsafeText(result);
  }
});

test('missing draft and malformed rows fail closed', async () => {
  for (const rows of [
    [],
    [null],
    [safeRow({ id: null })],
    [safeRow({ organization_id: null })],
    [safeRow({ id: 'draft_other_2315' })],
  ]) {
    const { adapter } = createDbBackedReader({ rows });
    const result = await adapter.getDraftForConversion(trustedInput());

    assert.equal(result.ok, false);
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_DRAFT_NOT_FOUND');
    assertNoUnsafeText(result);
  }
});

test('malformed trusted input fails closed before query', async () => {
  for (const input of [
    null,
    undefined,
    'draft_db_2315',
    {},
    { repairIntakeDraftId: 'draft_db_2315' },
    { context: { organizationId: 'org_db_2315' } },
    { repairIntakeDraftId: '', context: { organizationId: 'org_db_2315' } },
    trustedInput({ repairIntakeDraftId: 'draft_db_2315', context: {} }),
  ]) {
    const { adapter, calls } = createDbBackedReader();
    const result = await adapter.getDraftForConversion(input);

    assert.equal(result.ok, false);
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_INPUT_INVALID');
    assert.equal(calls.length, 0);
    assertNoUnsafeText(result);
  }
});

test('query thrown or rejected errors fail closed without raw leakage', async () => {
  for (const options of [{ throwQuery: true }, { rejectQuery: true }]) {
    const { adapter, calls } = createDbBackedReader(options);
    const result = await adapter.getDraftForConversion(trustedInput());

    assert.equal(calls.length, 1);
    assert.equal(result.ok, false);
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_READ_FAILED');
    assertNoUnsafeText(result);
  }
});

test('input and DB row objects are not mutated', async () => {
  const row = safeRow();
  const input = trustedInput();
  const beforeRow = clone(row);
  const beforeInput = clone(input);
  const { adapter } = createDbBackedReader({ rows: [row] });

  const result = await adapter.getDraftForConversion(input);

  assert.equal(result.ok, true);
  assert.deepEqual(row, beforeRow);
  assert.deepEqual(input, beforeInput);
});
