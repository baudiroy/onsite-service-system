'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  RepairIntakeIdempotencyPortAdapterError,
  createRepairIntakeIdempotencyPortAdapter,
} = require('../../src/repairIntake/repairIntakeIdempotencyPortAdapter');

const UNSAFE_TEXT = [
  'phone +886900001042',
  'unsafe line',
  'unsafe stack',
  'unsafe token',
  'unsafe secret',
  'rawRows',
  'rawrows',
  'rawResult',
  'rawresult',
  'rawQuery',
  'authorization',
  'cookie',
  'lineUserId',
  'finalAppointmentId',
  'stack',
  'token',
  'caseId',
  'databaseUrl',
  'postgres://unsafe',
  'SELECT *',
].join(' ');

function findStore(calls, options = {}) {
  return {
    findExistingDraftToCaseResult: async (lookup) => {
      calls.push({ method: 'find', lookup });

      if (options.throwFind) {
        throw new Error(UNSAFE_TEXT);
      }

      if (options.rejectFind) {
        return Promise.reject(new Error(UNSAFE_TEXT));
      }

      if (options.existingResult) {
        return options.existingResult;
      }

      return null;
    },
    recordDraftToCaseResult: async (input) => {
      calls.push({ method: 'record', input });

      if (options.throwRecord) {
        throw new Error(UNSAFE_TEXT);
      }

      if (options.rejectRecord) {
        return Promise.reject(new Error(UNSAFE_TEXT));
      }

      if (options.invalidRecordResult) {
        return null;
      }

      return {
        draftId: 'draft_task1042',
        organizationId: 'org_task1042',
        tenantId: 'tenant_task1042',
        status: 'recorded',
        submitted: true,
        reasonCode: 'IDEMPOTENCY_RECORDED_TASK1042',
        requiredActions: ['noop'],
        recordId: 'idem_record_1042',
        caseRef: {
          id: 'case_task1042',
          sourceDraftId: 'draft_task1042',
          organizationId: 'org_task1042',
          status: 'created',
          reasonCode: 'SUBMIT_READY_TASK1042',
        },
        stack: 'unsafe stack',
        rawRows: [{ unsafe: true }],
      };
    },
  };
}

function unsafeInput() {
  return {
    idempotencyKey: 'idem_task1042',
    draftId: 'draft_task1042',
    organizationId: 'org_task1042',
    tenantId: 'tenant_task1042',
    requestId: 'req_task1042',
    actor: {
      actorId: 'actor_task1042',
      phone: '+886900001042',
      lineUserId: 'unsafe line',
    },
    metadata: {
      source: 'integration_test',
      rawRows: [{ token: 'unsafe token' }],
    },
    result: {
      ok: true,
      action: 'repair_intake_draft_to_case_submit',
      draftId: 'draft_task1042',
      organizationId: 'org_task1042',
      caseRef: {
        id: 'case_task1042',
        organizationId: 'org_task1042',
        sourceDraftId: 'draft_task1042',
        status: 'created',
        reasonCode: 'SUBMIT_READY_TASK1042',
      },
      finalAppointmentId: 'unsafe final',
      sql: 'unsafe query',
      stack: 'unsafe stack',
    },
  };
}

function existingResult() {
  return {
    ok: true,
    action: 'repair_intake_draft_to_case_submit',
    draftId: 'draft_task1042',
    organizationId: 'org_task1042',
    tenantId: 'tenant_task1042',
    status: 'submitted',
    submitted: true,
    reasonCode: 'SUBMIT_READY_TASK1042',
    requiredActions: ['noop'],
    plan: {
      status: 'planned',
      reasonCode: 'PLAN_READY_TASK1042',
      rawRows: [{ phone: '+886900001042', secret: 'unsafe secret' }],
    },
    caseRef: {
      id: 'case_task1042',
      sourceDraftId: 'draft_task1042',
      organizationId: 'org_task1042',
      status: 'created',
      reasonCode: 'SUBMIT_READY_TASK1042',
      finalAppointmentId: 'unsafe final',
      stack: 'unsafe stack',
    },
  };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'phone',
    'finalAppointmentId',
    'lineUserId',
    'authorization',
    'cookie',
    'rawRows',
    'rawrows',
    'rawResult',
    'rawresult',
    'rawQuery',
    'unsafe final',
    'unsafe token',
    'unsafe secret',
    'unsafe line',
    'unsafe stack',
    'SELECT *',
    'postgres://',
    'stack',
    'token',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('factory requires injected idempotencyStore with required methods', () => {
  for (const options of [
    undefined,
    null,
    {},
    { idempotencyStore: null },
    { idempotencyStore: {} },
    { idempotencyStore: { findExistingDraftToCaseResult: async () => null } },
    { idempotencyStore: { recordDraftToCaseResult: async () => ({}) } },
    { idempotencyStore: { findExistingDraftToCaseResult: 'not-fn', recordDraftToCaseResult: async () => ({}) } },
  ]) {
    assert.throws(
      () => createRepairIntakeIdempotencyPortAdapter(options),
      (error) => {
        assert.equal(error instanceof RepairIntakeIdempotencyPortAdapterError, true);
        assert.equal(error.reasonCode, 'REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_STORE_REQUIRED');
        assert.deepEqual(error.requiredActions, ['configure_idempotency_store_methods']);
        assertNoUnsafeText(error);
        return true;
      },
    );
  }
});
test('findExistingDraftToCaseResult validates input and extracts safe lookup context', async () => {
  for (const invalidInput of [
    undefined,
    null,
    'input',
    42,
    true,
    [],
  ]) {
    const calls = [];
    const adapter = createRepairIntakeIdempotencyPortAdapter({
      idempotencyStore: findStore(calls),
    });

    const result = await adapter.findExistingDraftToCaseResult(invalidInput);

    assert.equal(result.reasonCode, 'REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_INPUT_INVALID');
    assert.deepEqual(calls, []);
    assertNoUnsafeText(result);
  }

  const calls = [];
  const adapter = createRepairIntakeIdempotencyPortAdapter({
    idempotencyStore: findStore(calls),
  });

  const result = await adapter.findExistingDraftToCaseResult(unsafeInput());

  assert.deepEqual(calls.length, 1);
  assert.equal(calls[0].method, 'find');
  assert.equal(calls[0].lookup.idempotencyKey, 'idem_task1042');
  assert.equal(calls[0].lookup.draftId, 'draft_task1042');
  assert.equal(calls[0].lookup.organizationId, 'org_task1042');
  assert.equal(calls[0].lookup.tenantId, 'tenant_task1042');
  assert.equal(calls[0].lookup.actor.actorId, 'actor_task1042');
  assert.equal(calls[0].lookup.actor.phone, undefined);
  assert.equal(calls[0].lookup.actor.lineuserid, undefined);
  assert.deepEqual(result.reasonCode, 'REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_NO_EXISTING_RESULT');
  assert.equal(result.ok, false);
  assert.equal(result.submitted, false);
  assertNoUnsafeText(result);
  assertNoUnsafeText(calls[0]);
});

test('findExisting returns sanitized replay when existing result exists', async () => {
  const calls = [];
  const adapter = createRepairIntakeIdempotencyPortAdapter({
    idempotencyStore: findStore(calls, { existingResult: existingResult() }),
  });

  const result = await adapter.findExistingDraftToCaseResult(unsafeInput());

  assert.deepEqual(calls.length, 1);
  assert.equal(result.ok, true);
  assert.equal(result.action, 'repair_intake_draft_to_case_submit');
  assert.equal(result.reasonCode, 'SUBMIT_READY_TASK1042');
  assert.equal(result.draftId, 'draft_task1042');
  assert.equal(result.organizationId, 'org_task1042');
  assert.equal(result.submitted, true);
  assert.equal(result.plan.status, 'planned');
  assert.equal(result.caseRef.id, 'case_task1042');
  assert.equal(result.caseRef.finalAppointmentId, undefined);
  assertNoUnsafeText(result);
  assertNoUnsafeText(calls[0]);
});

test('recordDraftToCaseResult validates input and requires sanitized idempotency key', async () => {
  for (const invalidInput of [
    undefined,
    null,
    'input',
    42,
    true,
    [],
  ]) {
    const calls = [];
    const adapter = createRepairIntakeIdempotencyPortAdapter({
      idempotencyStore: findStore(calls),
    });

    const result = await adapter.recordDraftToCaseResult(invalidInput);

    assert.equal(result.reasonCode, 'REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_INPUT_INVALID');
    assert.deepEqual(calls, []);
    assertNoUnsafeText(result);
  }

  const calls = [];
  const adapter = createRepairIntakeIdempotencyPortAdapter({
    idempotencyStore: findStore(calls),
  });

  const result = await adapter.recordDraftToCaseResult({
    draftId: 'draft_task1042',
    organizationId: 'org_task1042',
  });

  assert.equal(result.reasonCode, 'REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_INPUT_INVALID');
  assert.deepEqual(calls, []);
  assertNoUnsafeText(result);
});

test('recordDraftToCaseResult forwards only sanitized record context and returns sanitized envelope', async () => {
  const calls = [];
  const adapter = createRepairIntakeIdempotencyPortAdapter({
    idempotencyStore: findStore(calls),
  });

  const result = await adapter.recordDraftToCaseResult(unsafeInput());

  assert.deepEqual(calls.length, 1);
  assert.equal(calls[0].method, 'record');
  assert.equal(calls[0].input.idempotencyKey, 'idem_task1042');
  assert.equal(calls[0].input.draftId, 'draft_task1042');
  assert.equal(calls[0].input.organizationId, 'org_task1042');
  assert.equal(calls[0].input.actor.actorId, 'actor_task1042');
  assert.equal(calls[0].input.actor.phone, undefined);
  assert.equal(calls[0].input.actor.lineuserid, undefined);
  assert.equal(calls[0].input.result.caseRef.id, 'case_task1042');
  assert.equal(calls[0].input.result.finalAppointmentId, undefined);

  assert.equal(result.ok, true);
  assert.equal(result.reasonCode, 'IDEMPOTENCY_RECORDED_TASK1042');
  assert.equal(result.recordId, 'idem_record_1042');
  assert.equal(result.caseRef.id, 'case_task1042');
  assertNoUnsafeText(result);
  assertNoUnsafeText(calls[0]);
});

test('store thrown/rejected calls return sanitized failures', async () => {
  for (const options of [{ throwFind: true }, { rejectFind: true }]) {
    const calls = [];
    const adapter = createRepairIntakeIdempotencyPortAdapter({
      idempotencyStore: findStore(calls, options),
    });

    const result = await adapter.findExistingDraftToCaseResult(unsafeInput());

    assert.equal(result.reasonCode, 'REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_FIND_FAILED');
    assert.equal(result.ok, false);
    assertNoUnsafeText(result);
  }

  for (const options of [{ throwRecord: true }, { rejectRecord: true }]) {
    const calls = [];
    const adapter = createRepairIntakeIdempotencyPortAdapter({
      idempotencyStore: findStore(calls, options),
    });

    const result = await adapter.recordDraftToCaseResult(unsafeInput());

    assert.equal(result.reasonCode, 'REPAIR_INTAKE_IDEMPOTENCY_PORT_ADAPTER_RECORD_FAILED');
    assert.equal(result.ok, false);
    assertNoUnsafeText(result);
  }
});
