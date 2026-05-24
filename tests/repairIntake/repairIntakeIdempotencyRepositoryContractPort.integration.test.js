'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeIdempotencyRepositoryContract,
} = require('../../src/repairIntake/repairIntakeIdempotencyRepositoryContract');
const {
  createRepairIntakeIdempotencyPortAdapter,
} = require('../../src/repairIntake/repairIntakeIdempotencyPortAdapter');

const UNSAFE_ERROR_MESSAGE = [
  'SQL SELECT * FROM unsafe_task1087_idempotency_table',
  'DATABASE_URL=postgres://unsafe-task1087-idempotency',
  'phone +886900001087',
  'address unsafe task1087 address',
  'customerName unsafe task1087 customer',
  'lineUserId unsafe_task1087_line',
  'lineAccessToken unsafe_task1087_line_token',
  'finalAppointmentId unsafe_task1087_final',
  'stack trace unsafe task1087',
].join(' ');

function unsafeLookupInput() {
  return {
    idempotencyKey: 'idem_task1087',
    draftId: 'draft_task1087',
    organizationId: 'org_task1087',
    tenantId: 'tenant_task1087',
    requestId: 'req_task1087',
    actorId: 'actor_task1087',
    actor: {
      actorId: 'actor_task1087',
      phone: '+886900001087',
      lineUserId: 'unsafe_task1087_actor_line',
    },
    metadata: {
      safeKey: 'safe lookup metadata task1087',
      rawRows: [{ phone: '+886900001087' }],
    },
    raw: { phone: '+886900001087' },
    rawRows: [{ phone: '+886900001087' }],
    sql: 'SELECT * FROM unsafe_lookup_task1087',
    query: 'SELECT unsafe query task1087',
    paramsSql: ['unsafe param task1087'],
    db: 'unsafe db task1087',
    databaseUrl: 'postgres://unsafe-task1087-idempotency',
    DATABASE_URL: 'postgres://unsafe-task1087-idempotency-uppercase',
    authorization: 'Bearer unsafe_task1087',
    cookie: 'unsafe_cookie_task1087=1',
    headers: { authorization: 'Bearer unsafe_task1087' },
    phone: '+886900001087',
    address: 'unsafe task1087 address',
    customerPhone: '+886900001087',
    customerName: 'unsafe task1087 customer',
    lineUserId: 'unsafe_task1087_line',
    lineAccessToken: 'unsafe_task1087_line_token',
    finalAppointmentId: 'unsafe_task1087_final',
    stack: 'unsafe task1087 stack',
    error: new Error(UNSAFE_ERROR_MESSAGE),
    repository: { unsafe: true },
    connection: { unsafe: true },
  };
}

function unsafeRecordInput() {
  return {
    ...unsafeLookupInput(),
    result: {
      ok: true,
      action: 'repair_intake_draft_to_case_submit',
      draftId: 'draft_task1087',
      organizationId: 'org_task1087',
      tenantId: 'tenant_task1087',
      status: 'submitted',
      submitted: true,
      reasonCode: 'SUBMIT_READY_TASK1087',
      caseRef: {
        id: 'case_task1087',
        sourceDraftId: 'draft_task1087',
        organizationId: 'org_task1087',
        status: 'created',
        finalAppointmentId: 'unsafe_task1087_final',
      },
      rawRows: [{ phone: '+886900001087' }],
      sql: 'SELECT * FROM unsafe_record_input_task1087',
      token: 'unsafe_record_input_token_task1087',
      stack: 'unsafe record input stack task1087',
    },
    caseRef: {
      id: 'case_task1087',
      sourceDraftId: 'draft_task1087',
      organizationId: 'org_task1087',
      status: 'created',
      finalAppointmentId: 'unsafe_task1087_final',
      stack: 'unsafe record case stack task1087',
    },
  };
}

function createRawIdempotencyRepository(calls, options = {}) {
  return {
    findExistingDraftToCaseResult: async (lookup) => {
      calls.push({ name: 'rawFind', payload: lookup });

      if (options.throwFind) {
        throw new Error(UNSAFE_ERROR_MESSAGE);
      }

      if (options.rejectFind) {
        return Promise.reject(new Error(UNSAFE_ERROR_MESSAGE));
      }

      if (options.noExisting) {
        return null;
      }

      return {
        ok: true,
        action: 'repair_intake_draft_to_case_submit',
        idempotencyKey: 'idem_task1087',
        draftId: 'draft_task1087',
        organizationId: 'org_task1087',
        tenantId: 'tenant_task1087',
        requestId: 'req_task1087',
        status: 'submitted',
        submitted: true,
        reasonCode: 'REPLAY_READY_TASK1087',
        requiredActions: ['noop'],
        plan: {
          status: 'planned',
          reasonCode: 'PLAN_READY_TASK1087',
          rawRows: [{ phone: '+886900001087' }],
          finalAppointmentId: 'unsafe_task1087_final',
        },
        caseRef: {
          id: 'case_task1087',
          sourceDraftId: 'draft_task1087',
          organizationId: 'org_task1087',
          status: 'created',
          reasonCode: 'SUBMIT_READY_TASK1087',
          finalAppointmentId: 'unsafe_task1087_final',
          stack: 'unsafe replay case stack task1087',
        },
        result: {
          draftId: 'draft_task1087',
          organizationId: 'org_task1087',
          status: 'submitted',
          caseRef: {
            id: 'case_task1087',
            sourceDraftId: 'draft_task1087',
            organizationId: 'org_task1087',
            finalAppointmentId: 'unsafe_task1087_final',
          },
          sql: 'SELECT * FROM unsafe_replay_result_task1087',
          token: 'unsafe_replay_token_task1087',
        },
        metadata: {
          safeKey: 'safe replay metadata task1087',
          rawRows: [{ phone: '+886900001087' }],
        },
        rawRows: [{ phone: '+886900001087' }],
        sql: 'SELECT * FROM unsafe_replay_task1087',
        databaseUrl: 'postgres://unsafe-task1087-idempotency',
        authorization: 'Bearer unsafe_task1087',
        phone: '+886900001087',
        address: 'unsafe task1087 address',
        customerName: 'unsafe task1087 customer',
        lineUserId: 'unsafe_task1087_line',
        lineAccessToken: 'unsafe_task1087_line_token',
        finalAppointmentId: 'unsafe_task1087_final',
        stack: 'unsafe replay stack task1087',
        error: new Error(UNSAFE_ERROR_MESSAGE),
        repository: { unsafe: true },
      };
    },
    recordDraftToCaseResult: async (input) => {
      calls.push({ name: 'rawRecord', payload: input });

      if (options.throwRecord) {
        throw new Error(UNSAFE_ERROR_MESSAGE);
      }

      if (options.rejectRecord) {
        return Promise.reject(new Error(UNSAFE_ERROR_MESSAGE));
      }

      return {
        ok: true,
        action: 'repair_intake_draft_to_case_submit',
        recordId: 'record_task1087',
        idempotencyKey: 'idem_task1087',
        draftId: 'draft_task1087',
        organizationId: 'org_task1087',
        tenantId: 'tenant_task1087',
        requestId: 'req_task1087',
        status: 'recorded',
        submitted: true,
        reasonCode: 'RECORDED_TASK1087',
        requiredActions: ['stored'],
        result: {
          draftId: 'draft_task1087',
          organizationId: 'org_task1087',
          status: 'submitted',
          caseRef: {
            id: 'case_task1087',
            sourceDraftId: 'draft_task1087',
            organizationId: 'org_task1087',
            finalAppointmentId: 'unsafe_task1087_final',
          },
          sql: 'SELECT * FROM unsafe_record_result_task1087',
          token: 'unsafe_record_token_task1087',
        },
        caseRef: {
          id: 'case_task1087',
          sourceDraftId: 'draft_task1087',
          organizationId: 'org_task1087',
          status: 'created',
          reasonCode: 'SUBMIT_READY_TASK1087',
          finalAppointmentId: 'unsafe_task1087_final',
          stack: 'unsafe recorded case stack task1087',
        },
        metadata: {
          safeKey: 'safe record metadata task1087',
          rawRows: [{ phone: '+886900001087' }],
        },
        rawRows: [{ phone: '+886900001087' }],
        sql: 'SELECT * FROM unsafe_record_task1087',
        databaseUrl: 'postgres://unsafe-task1087-idempotency',
        authorization: 'Bearer unsafe_task1087',
        phone: '+886900001087',
        address: 'unsafe task1087 address',
        customerName: 'unsafe task1087 customer',
        lineUserId: 'unsafe_task1087_line',
        lineAccessToken: 'unsafe_task1087_line_token',
        finalAppointmentId: 'unsafe_task1087_final',
        stack: 'unsafe recorded stack task1087',
        error: new Error(UNSAFE_ERROR_MESSAGE),
        repository: { unsafe: true },
      };
    },
  };
}

function createIntegrationAdapter(calls, options = {}) {
  const idempotencyStore = createRepairIntakeIdempotencyRepositoryContract({
    idempotencyRepository: createRawIdempotencyRepository(calls, options),
  });

  return createRepairIntakeIdempotencyPortAdapter({ idempotencyStore });
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'SELECT *',
    'unsafe_task1087',
    'unsafe task1087',
    'unsafe_lookup_task1087',
    'unsafe_replay_task1087',
    'unsafe_record_task1087',
    'postgres://unsafe-task1087',
    '+886900001087',
    'Bearer unsafe_task1087',
    'unsafe_cookie_task1087',
    'rawRows',
    'sql',
    'query',
    'paramsSql',
    'db',
    'databaseUrl',
    'DATABASE_URL',
    'authorization',
    'cookie',
    'headers',
    'phone',
    'address',
    'customerPhone',
    'customerName',
    'lineUserId',
    'lineAccessToken',
    'finalAppointmentId',
    'stack',
    'token',
    'error',
    'repository',
    'connection',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('find no-existing sanitizes lookup through contract before adapter returns no-existing', async () => {
  const calls = [];
  const adapter = createIntegrationAdapter(calls, { noExisting: true });

  const result = await adapter.findExistingDraftToCaseResult(unsafeLookupInput());

  assert.deepEqual(calls, [
    {
      name: 'rawFind',
      payload: {
        idempotencyKey: 'idem_task1087',
        draftId: 'draft_task1087',
        organizationId: 'org_task1087',
        tenantId: 'tenant_task1087',
        requestId: 'req_task1087',
        metadata: {
          safeKey: 'safe lookup metadata task1087',
        },
      },
    },
  ]);
  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_NO_EXISTING_RESULT');
  assert.equal(result.status, 'not_found');
  assert.equal(result.submitted, false);
  assertNoUnsafeText(calls);
  assertNoUnsafeText(result);
});

test('find replay-ready sanitizes raw repository result before adapter returns replay envelope', async () => {
  const calls = [];
  const adapter = createIntegrationAdapter(calls);

  const result = await adapter.findExistingDraftToCaseResult(unsafeLookupInput());

  assert.equal(calls.length, 1);
  assert.equal(calls[0].name, 'rawFind');
  assert.equal(result.ok, true);
  assert.equal(result.action, 'repair_intake_draft_to_case_submit');
  assert.equal(result.reasonCode, 'REPLAY_READY_TASK1087');
  assert.equal(result.draftId, 'draft_task1087');
  assert.equal(result.organizationId, 'org_task1087');
  assert.equal(result.tenantId, 'tenant_task1087');
  assert.equal(result.status, 'submitted');
  assert.equal(result.submitted, true);
  assert.equal(result.plan.status, 'planned');
  assert.equal(result.caseRef.id, 'case_task1087');
  assertNoUnsafeText(calls);
  assertNoUnsafeText(result);
});

test('record result sanitizes record input and raw repository result before adapter returns recorded envelope', async () => {
  const calls = [];
  const adapter = createIntegrationAdapter(calls);

  const result = await adapter.recordDraftToCaseResult(unsafeRecordInput());

  assert.deepEqual(calls, [
    {
      name: 'rawRecord',
      payload: {
        idempotencyKey: 'idem_task1087',
        draftId: 'draft_task1087',
        organizationId: 'org_task1087',
        tenantId: 'tenant_task1087',
        requestId: 'req_task1087',
        metadata: {
          safeKey: 'safe lookup metadata task1087',
        },
        result: {
          ok: true,
          action: 'repair_intake_draft_to_case_submit',
          draftId: 'draft_task1087',
          organizationId: 'org_task1087',
          tenantId: 'tenant_task1087',
          status: 'submitted',
          submitted: true,
          reasonCode: 'SUBMIT_READY_TASK1087',
          caseRef: {
            id: 'case_task1087',
            sourceDraftId: 'draft_task1087',
            organizationId: 'org_task1087',
            status: 'created',
          },
        },
        caseRef: {
          id: 'case_task1087',
          sourceDraftId: 'draft_task1087',
          organizationId: 'org_task1087',
          status: 'created',
        },
      },
    },
  ]);
  assert.equal(result.ok, true);
  assert.equal(result.reasonCode, 'RECORDED_TASK1087');
  assert.equal(result.recordId, 'record_task1087');
  assert.equal(result.status, 'recorded');
  assert.equal(result.submitted, true);
  assert.equal(result.caseRef.id, 'case_task1087');
  assertNoUnsafeText(calls);
  assertNoUnsafeText(result);
});

test('raw find thrown and rejected errors remain sanitized through contract and adapter', async () => {
  for (const options of [{ throwFind: true }, { rejectFind: true }]) {
    const calls = [];
    const adapter = createIntegrationAdapter(calls, options);

    const result = await adapter.findExistingDraftToCaseResult(unsafeLookupInput());

    assert.equal(calls.length, 1);
    assert.equal(calls[0].name, 'rawFind');
    assert.equal(result.ok, false);
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_NO_EXISTING_RESULT');
    assertNoUnsafeText(calls);
    assertNoUnsafeText(result);
  }
});

test('raw record thrown and rejected errors remain sanitized through contract and adapter', async () => {
  for (const options of [{ throwRecord: true }, { rejectRecord: true }]) {
    const calls = [];
    const adapter = createIntegrationAdapter(calls, options);

    const result = await adapter.recordDraftToCaseResult(unsafeRecordInput());

    assert.equal(calls.length, 1);
    assert.equal(calls[0].name, 'rawRecord');
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_RECORD_FAILED');
    assert.equal(result.status, 'failed');
    assert.equal(result.submitted, false);
    assertNoUnsafeText(calls);
    assertNoUnsafeText(result);
  }
});
