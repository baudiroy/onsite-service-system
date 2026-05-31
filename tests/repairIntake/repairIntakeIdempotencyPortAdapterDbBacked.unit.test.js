'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeIdempotencyPortAdapter,
} = require('../../src/repairIntake/repairIntakeIdempotencyPortAdapter');
const {
  createRepairIntakeIdempotencyRepository,
} = require('../../src/repairIntake/repairIntakeIdempotencyRepository');

const UNSAFE_MARKERS = [
  'rawRows',
  'rawRow',
  'rawResult',
  'rawRequestBody',
  'rawSql',
  'SELECT *',
  'unsafe stack',
  'unsafe token',
  'unsafe password',
  'unsafe secret',
  'unsafe provider',
  'unsafe ai',
  'unsafe rag',
  'unsafe billing',
  'unsafe audit',
  'unsafe customer',
  'unsafe phone',
  'unsafe address',
  'postgres://',
  'DATABASE_URL',
  'authorization',
  'lineUserId',
  'finalAppointmentId',
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const marker of UNSAFE_MARKERS) {
    assert.equal(serialized.includes(marker), false, `leaked ${marker}`);
  }
}

function goodReplayRow(overrides = {}) {
  return {
    id: 'idem_record_2317',
    organization_id: 'org_2317',
    tenant_id: 'tenant_2317',
    idempotency_key: 'idem_2317',
    operation_type: 'draft_to_case',
    draft_id: 'draft_2317',
    replay_case_id: 'case_2317',
    replay_case_ref: 'case_ref_2317',
    replay_result_safe: {
      caseId: 'case_2317',
      status: 'submitted',
      safeValue: 'safe replay 2317',
      rawRequestBody: 'unsafe rawRequestBody',
      token: 'unsafe token',
      password: 'unsafe password',
      providerPayload: 'unsafe provider',
      ai: 'unsafe ai',
      rag: 'unsafe rag',
      billing: 'unsafe billing',
      auditInternals: 'unsafe audit',
      customerPhone: 'unsafe phone',
      customerAddress: 'unsafe address',
    },
    record_status: 'completed',
    rawRow: { sql: 'SELECT * FROM unsafe' },
    stack: 'unsafe stack',
    ...overrides,
  };
}

function goodRecordRow(overrides = {}) {
  return {
    ...goodReplayRow({
      id: 'idem_record_write_2317',
      replay_result_safe: {
        caseId: 'case_2317',
        status: 'submitted',
        safeValue: 'safe recorded 2317',
        rawSql: 'SELECT * FROM unsafe',
        secret: 'unsafe secret',
      },
    }),
    ...overrides,
  };
}

function trustedContext(overrides = {}) {
  return {
    repairIntakeDraftId: 'draft_2317',
    draftId: 'body_draft_should_not_win',
    organizationId: 'org_2317',
    tenantId: 'tenant_2317',
    idempotencyKey: 'idem_2317',
    requestId: 'req_2317',
    actor: {
      actorId: 'actor_2317',
      phone: 'unsafe phone',
    },
    metadata: {
      source: 'task_2317',
      rawRows: [{ token: 'unsafe token' }],
    },
    body: {
      organizationId: 'org_body_should_not_win',
      draftId: 'draft_body_should_not_win',
      idempotencyKey: 'idem_body_should_not_win',
    },
    draftInput: {
      organizationId: 'org_draft_input_should_not_win',
      draftId: 'draft_draft_input_should_not_win',
      idempotencyKey: 'idem_draft_input_should_not_win',
    },
    headers: {
      authorization: 'unsafe token',
    },
    query: {
      idempotencyKey: 'idem_query_should_not_win',
    },
    ...overrides,
  };
}

function recordContext(overrides = {}) {
  return {
    ...trustedContext(),
    result: {
      ok: true,
      action: 'repair_intake_draft_to_case_submit',
      draftId: 'draft_2317',
      organizationId: 'org_2317',
      tenantId: 'tenant_2317',
      status: 'submitted',
      submitted: true,
      caseRef: {
        id: 'case_2317',
        caseId: 'case_2317',
        caseRef: 'case_ref_2317',
        sourceDraftId: 'draft_2317',
        organizationId: 'org_2317',
        status: 'created',
        finalAppointmentId: 'unsafe finalAppointmentId',
      },
      rawResult: { stack: 'unsafe stack' },
    },
    caseRef: {
      id: 'case_2317',
      caseId: 'case_2317',
      caseRef: 'case_ref_2317',
      sourceDraftId: 'draft_2317',
      organizationId: 'org_2317',
      status: 'created',
    },
    ...overrides,
  };
}

function createDbBackedAdapter(options = {}) {
  const calls = [];
  const dbClient = {
    query: async (sql, params) => {
      calls.push({ sql, params });

      if (options.throwQuery) {
        throw new Error('DATABASE_URL=postgres://unsafe SELECT * unsafe stack unsafe token');
      }

      if (/^SELECT/.test(sql)) {
        return options.selectResult !== undefined
          ? options.selectResult
          : { rows: options.selectRows || [goodReplayRow(options.selectRowOverrides)] };
      }

      return options.insertResult !== undefined
        ? options.insertResult
        : { rows: options.insertRows || [goodRecordRow(options.insertRowOverrides)] };
    },
  };
  const repository = createRepairIntakeIdempotencyRepository({ dbClient });
  const idempotencyStore = {
    findExistingDraftToCaseResult: (input) => repository.findExistingDraftToCaseResult(input),
    recordDraftToCaseResult: (input) => repository.recordDraftToCaseResult({
      ...input,
      safeRequestFingerprint: input.safeRequestFingerprint || 'fingerprint_2317',
    }),
  };
  const adapter = createRepairIntakeIdempotencyPortAdapter({ idempotencyStore });

  return { adapter, calls };
}

test('DB-backed lookup replays only matching organization idempotency key draft and tenant scope', async () => {
  const { adapter, calls } = createDbBackedAdapter();
  const input = trustedContext();
  const before = clone(input);

  const result = await adapter.findExistingDraftToCaseResult(input);

  assert.equal(result.ok, true);
  assert.equal(result.idempotencyKey, 'idem_2317');
  assert.equal(result.draftId, 'draft_2317');
  assert.equal(result.organizationId, 'org_2317');
  assert.equal(result.tenantId, 'tenant_2317');
  assert.equal(result.caseRef.caseRef, 'case_ref_2317');
  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /organization_id = \$1/);
  assert.match(calls[0].sql, /operation_type = \$2/);
  assert.match(calls[0].sql, /idempotency_key = \$3/);
  assert.match(calls[0].sql, /draft_id = \$4/);
  assert.match(calls[0].sql, /tenant_id = \$5/);
  assert.deepEqual(calls[0].params, [
    'org_2317',
    'draft_to_case',
    'idem_2317',
    'draft_2317',
    'tenant_2317',
  ]);
  assertNoUnsafeText(result);
  assertNoUnsafeText(calls);
  assert.deepEqual(input, before);
});

test('DB-backed record writes scoped context and returns sanitized recorded envelope', async () => {
  const { adapter, calls } = createDbBackedAdapter();
  const input = recordContext();
  const before = clone(input);

  const result = await adapter.recordDraftToCaseResult(input);

  assert.equal(result.ok, true);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_RECORDED');
  assert.equal(result.idempotencyKey, 'idem_2317');
  assert.equal(result.draftId, 'draft_2317');
  assert.equal(result.organizationId, 'org_2317');
  assert.equal(result.tenantId, 'tenant_2317');
  assert.equal(result.recordId, 'idem_record_write_2317');
  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /^INSERT INTO repair_intake_idempotency_records/);
  assert.deepEqual(calls[0].params.slice(0, 6), [
    'org_2317',
    'tenant_2317',
    'idem_2317',
    'draft_to_case',
    'draft_2317',
    'fingerprint_2317',
  ]);
  assertNoUnsafeText(result);
  assertNoUnsafeText(calls);
  assert.deepEqual(input, before);
});

test('DB-backed lookup fails closed on cross-org and wrong-tenant rows', async () => {
  for (const selectRowOverrides of [
    { organization_id: 'org_wrong_2317' },
    { tenant_id: 'tenant_wrong_2317' },
    { draft_id: 'draft_wrong_2317' },
    { idempotency_key: 'idem_wrong_2317' },
  ]) {
    const { adapter } = createDbBackedAdapter({ selectRowOverrides });

    const result = await adapter.findExistingDraftToCaseResult(trustedContext());

    assert.equal(result.ok, false);
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_FIND_FAILED');
    assertNoUnsafeText(result);
  }
});

test('DB-backed adapter validates missing context before query', async () => {
  for (const input of [
    trustedContext({ idempotencyKey: '' }),
    trustedContext({ repairIntakeDraftId: '', draftId: '' }),
    trustedContext({ organizationId: '' }),
  ]) {
    const { adapter, calls } = createDbBackedAdapter();

    const result = await adapter.findExistingDraftToCaseResult(input);

    assert.equal(result.ok, false);
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_INPUT_INVALID');
    assert.deepEqual(calls, []);
    assertNoUnsafeText(result);
  }
});

test('DB-backed malformed row and write result fail closed without raw leakage', async () => {
  const lookupCases = [
    { selectRows: [{ ...goodReplayRow(), replay_case_id: '', replay_case_ref: '', replay_result_safe: {} }] },
    { selectResult: { rows: [{ rawRow: { sql: 'SELECT * unsafe' } }] } },
  ];

  for (const options of lookupCases) {
    const { adapter } = createDbBackedAdapter(options);
    const result = await adapter.findExistingDraftToCaseResult(trustedContext());

    assert.equal(result.ok, false);
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_FIND_FAILED');
    assertNoUnsafeText(result);
  }

  for (const options of [
    { insertResult: { rows: [] } },
    { insertRows: [{ ...goodRecordRow(), replay_case_id: '', replay_case_ref: '', replay_result_safe: {} }] },
    { insertRows: [{ ...goodRecordRow(), organization_id: 'org_wrong_2317' }] },
  ]) {
    const { adapter } = createDbBackedAdapter(options);
    const result = await adapter.recordDraftToCaseResult(recordContext());

    assert.equal(result.ok, false);
    assert.match(result.reasonCode, /REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_(RECORD_FAILED|SCOPE_MISMATCH)/);
    assertNoUnsafeText(result);
  }
});

test('DB-backed query thrown or rejected fails closed without stack or secret leakage', async () => {
  for (const method of ['findExistingDraftToCaseResult', 'recordDraftToCaseResult']) {
    const { adapter } = createDbBackedAdapter({ throwQuery: true });
    const input = method === 'recordDraftToCaseResult' ? recordContext() : trustedContext();

    const result = await adapter[method](input);

    assert.equal(result.ok, false);
    assert.match(result.reasonCode, /REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_(FIND|RECORD)_FAILED/);
    assertNoUnsafeText(result);
  }
});

test('body draftInput and client-controlled fields cannot override trusted top-level scope', async () => {
  const { adapter, calls } = createDbBackedAdapter();

  await adapter.findExistingDraftToCaseResult(trustedContext({
    body: {
      organizationId: 'org_attacker',
      draftId: 'draft_attacker',
      idempotencyKey: 'idem_attacker',
    },
    draftInput: {
      organizationId: 'org_draft_attacker',
      draftId: 'draft_draft_attacker',
      idempotencyKey: 'idem_draft_attacker',
    },
    client: {
      organizationId: 'org_client_attacker',
      draftId: 'draft_client_attacker',
      idempotencyKey: 'idem_client_attacker',
    },
  }));

  assert.deepEqual(calls[0].params, [
    'org_2317',
    'draft_to_case',
    'idem_2317',
    'draft_2317',
    'tenant_2317',
  ]);
  assertNoUnsafeText(calls);
});
