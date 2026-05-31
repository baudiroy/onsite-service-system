'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  RepairIntakeDraftReaderPortAdapterError,
  createRepairIntakeDraftReaderPortAdapter,
} = require('../../src/repairIntake/repairIntakeDraftReaderPortAdapter');

const UNSAFE_ERROR_MESSAGE = [
  'SQL select * from unsafe_draft_reader_table',
  'DATABASE_URL=postgres://unsafe-draft-reader',
  'phone +886900001024',
  'address unsafe reader address',
  'customer unsafe reader name',
  'lineUserId unsafe_reader_line',
  'LINE access token unsafe_reader_line_token',
  'finalAppointmentId unsafe_reader_final',
  'stack trace at unsafe reader',
].join(' ');

function unsafeInput() {
  return {
    draftId: 'draft_task1024_top',
    organizationId: 'org_task1024_top',
    tenantId: 'tenant_task1024_top',
    requestId: 'req_task1024_top',
    actor: {
      actorId: 'actor_task1024_actor',
      token: 'unsafe actor token',
    },
    params: {
      draftId: 'draft_task1024_param',
      phone: '+886900001024',
    },
    context: {
      organizationId: 'org_task1024_context',
      tenantId: 'tenant_task1024_context',
      actorId: 'actor_task1024_context',
      requestId: 'req_task1024_context',
      lineUserId: 'unsafe_reader_line',
    },
    phone: '+886900001024',
    address: 'unsafe reader address',
    customerName: 'unsafe reader customer',
    lineAccessToken: 'unsafe_reader_line_token',
    finalAppointmentId: 'unsafe_reader_final',
    sql: 'select * from unsafe_input',
    headers: {
      authorization: 'Bearer unsafe',
    },
    rawRow: {
      db: 'unsafe raw row',
    },
  };
}

function createDraftRepository(calls, options = {}) {
  return {
    findDraftForConversion: async (lookup) => {
      calls.push(lookup);

      if (options.throwRead) {
        throw new Error(UNSAFE_ERROR_MESSAGE);
      }

      if (options.rejectRead) {
        return Promise.reject(new Error(UNSAFE_ERROR_MESSAGE));
      }

      if (options.notFound) {
        return null;
      }

      return {
        id: lookup.draftId,
        organizationId: lookup.organizationId,
        tenantId: lookup.tenantId,
        status: 'ready',
        source: 'repair_intake',
        sourceRef: 'source_task1024',
        intakeSource: 'manual',
        reasonCode: 'DRAFT_READY_TASK1024',
        requiredActions: [],
        summary: {
          title: 'safe draft summary',
          phone: '+886900001024',
        },
        rawRows: [{ phone: '+886900001024' }],
        rawRow: { address: 'unsafe raw row address' },
        phone: '+886900001024',
        address: 'unsafe reader address',
        customerName: 'unsafe reader customer',
        lineUserId: 'unsafe_reader_line',
        lineAccessToken: 'unsafe_reader_line_token',
        finalAppointmentId: 'unsafe_reader_final',
        sql: 'select * from unsafe_repository',
        stack: 'unsafe repository stack',
      };
    },
  };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'select *',
    'unsafe_draft_reader_table',
    'unsafe_input',
    'unsafe_repository',
    'DATABASE_URL',
    'postgres://',
    '+886900001024',
    'unsafe reader address',
    'unsafe reader customer',
    'unsafe reader name',
    'unsafe_reader_line',
    'unsafe_reader_line_token',
    'LINE access token',
    'unsafe_reader_final',
    'unsafe actor token',
    'unsafe raw row',
    'unsafe raw row address',
    'unsafe repository stack',
    'stack trace',
    'Bearer unsafe',
    'rawRows',
    'rawRow',
    'authorization',
    'phone',
    'address',
    'customerName',
    'lineUserId',
    'lineAccessToken',
    'finalAppointmentId',
    'sql',
    'stack',
    'token',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('factory requires injected draftRepository.findDraftForConversion', () => {
  for (const options of [
    undefined,
    null,
    {},
    { draftRepository: null },
    { draftRepository: {} },
    { draftRepository: { findDraftForConversion: 'not-a-function' } },
  ]) {
    assert.throws(
      () => createRepairIntakeDraftReaderPortAdapter(options),
      (error) => {
        assert.equal(error instanceof RepairIntakeDraftReaderPortAdapterError, true);
        assert.equal(
          error.reasonCode,
          'REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_REPOSITORY_REQUIRED',
        );
        assert.deepEqual(error.requiredActions, [
          'configure_draft_repository_find_draft_for_conversion',
        ]);
        assertNoUnsafeText(error);
        return true;
      },
    );
  }
});

test('getDraftForConversion forwards only sanitized lookup fields', async () => {
  const calls = [];
  const adapter = createRepairIntakeDraftReaderPortAdapter({
    draftRepository: createDraftRepository(calls),
  });

  const result = await adapter.getDraftForConversion(unsafeInput());

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    draftId: 'draft_task1024_top',
    organizationId: 'org_task1024_top',
    tenantId: 'tenant_task1024_top',
    requestId: 'req_task1024_top',
    actorId: 'actor_task1024_actor',
  });
  assert.equal(result.ok, true);
  assert.equal(result.id, 'draft_task1024_top');
  assert.equal(result.draftId, 'draft_task1024_top');
  assert.equal(result.organizationId, 'org_task1024_top');
  assert.equal(result.tenantId, 'tenant_task1024_top');
  assert.equal(result.reasonCode, 'DRAFT_READY_TASK1024');
  assert.equal(result.summary.title, 'safe draft summary');
  assertNoUnsafeText(calls);
  assertNoUnsafeText(result);
});

test('getDraftForConversion can derive lookup fields from params and context', async () => {
  const calls = [];
  const adapter = createRepairIntakeDraftReaderPortAdapter({
    draftRepository: createDraftRepository(calls),
  });
  const input = unsafeInput();
  delete input.draftId;
  delete input.organizationId;
  delete input.tenantId;
  delete input.requestId;
  delete input.actor;

  const result = await adapter.getDraftForConversion(input);

  assert.deepEqual(calls[0], {
    draftId: 'draft_task1024_param',
    organizationId: 'org_task1024_context',
    tenantId: 'tenant_task1024_context',
    requestId: 'req_task1024_context',
    actorId: 'actor_task1024_context',
  });
  assert.equal(result.ok, true);
  assertNoUnsafeText(calls);
  assertNoUnsafeText(result);
});

test('invalid lookup input fails closed before repository call', async () => {
  for (const invalidInput of [undefined, null, 'input', 42, true, [], () => {}, {}]) {
    const calls = [];
    const adapter = createRepairIntakeDraftReaderPortAdapter({
      draftRepository: createDraftRepository(calls),
    });

    const result = await adapter.getDraftForConversion(invalidInput);

    assert.equal(result.ok, false);
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_INPUT_INVALID');
    assert.deepEqual(calls, []);
    assertNoUnsafeText(result);
  }
});

test('not found repository result returns sanitized not-found envelope', async () => {
  const calls = [];
  const adapter = createRepairIntakeDraftReaderPortAdapter({
    draftRepository: createDraftRepository(calls, { notFound: true }),
  });

  const result = await adapter.getDraftForConversion(unsafeInput());

  assert.equal(calls.length, 1);
  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_DRAFT_NOT_FOUND');
  assert.deepEqual(result.requiredActions, ['verify_draft_exists']);
  assertNoUnsafeText(calls);
  assertNoUnsafeText(result);
});

test('repository thrown errors and rejections return sanitized read failure envelopes', async () => {
  for (const options of [{ throwRead: true }, { rejectRead: true }]) {
    const calls = [];
    const adapter = createRepairIntakeDraftReaderPortAdapter({
      draftRepository: createDraftRepository(calls, options),
    });

    const result = await adapter.getDraftForConversion(unsafeInput());

    assert.equal(calls.length, 1);
    assert.equal(result.ok, false);
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_READER_PORT_ADAPTER_READ_FAILED');
    assertNoUnsafeText(calls);
    assertNoUnsafeText(result);
  }
});
