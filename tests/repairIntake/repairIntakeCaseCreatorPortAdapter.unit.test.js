'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  RepairIntakeCaseCreatorPortAdapterError,
  createRepairIntakeCaseCreatorPortAdapter,
} = require('../../src/repairIntake/repairIntakeCaseCreatorPortAdapter');

const UNSAFE_ERROR_MESSAGE = [
  'SQL select * from unsafe_case_creator_table',
  'DATABASE_URL=postgres://unsafe-case-creator',
  'phone +886900001033',
  'address unsafe creator address',
  'customer unsafe creator name',
  'lineUserId unsafe_creator_line',
  'LINE access token unsafe_creator_line_token',
  'finalAppointmentId unsafe_creator_final',
  'stack trace at unsafe creator',
].join(' ');

function unsafeCreationInput() {
  return {
    draftId: 'draft_task1033_top',
    organizationId: 'org_task1033_top',
    tenantId: 'tenant_task1033_top',
    requestId: 'req_task1033_top',
    actor: {
      actorId: 'actor_task1033',
      token: 'unsafe actor token',
    },
    metadata: {
      source: 'integration_test',
      sql: 'select * from unsafe_metadata',
    },
    warnings: ['needs_review'],
    draft: {
      id: 'draft_task1033',
      organizationId: 'org_task1033',
      tenantId: 'tenant_task1033',
      status: 'ready',
      summary: {
        title: 'safe draft summary',
        phone: '+886900001033',
      },
      rawRows: [{ phone: '+886900001033' }],
      phone: '+886900001033',
      address: 'unsafe creator address',
      customerName: 'unsafe creator customer',
      lineUserId: 'unsafe_creator_line',
      finalAppointmentId: 'unsafe_creator_final',
      sql: 'select * from unsafe_draft',
      stack: 'unsafe draft stack',
    },
    plan: {
      status: 'planned',
      reasonCode: 'PLAN_READY_TASK1033',
      requiredActions: [],
      candidate: {
        sourceDraftId: 'draft_task1033',
        organizationId: 'org_task1033',
        tenantId: 'tenant_task1033',
        customerPhone: '+886900001033',
      },
      metadata: {
        plannedBy: 'synthetic_policy',
        token: 'unsafe planner token',
      },
      rawRows: [{ unsafe: true }],
      finalAppointmentId: 'unsafe_creator_final',
      stack: 'unsafe plan stack',
    },
    rawInput: {
      db: 'unsafe raw input',
    },
    headers: {
      authorization: 'Bearer unsafe',
    },
  };
}

function createCaseCreationPort(calls, options = {}) {
  return {
    createCaseFromDraft: async (creationInput) => {
      calls.push(creationInput);

      if (options.throwCreate) {
        throw new Error(UNSAFE_ERROR_MESSAGE);
      }

      if (options.rejectCreate) {
        return Promise.reject(new Error(UNSAFE_ERROR_MESSAGE));
      }

      if (options.invalidResult) {
        return null;
      }

      return {
        id: 'case_task1033',
        organizationId: 'org_task1033',
        tenantId: 'tenant_task1033',
        sourceDraftId: 'draft_task1033',
        status: 'created',
        reasonCode: 'CASE_CREATED_TASK1033',
        requiredActions: [],
        summary: {
          title: 'safe case summary',
          phone: '+886900001033',
        },
        metadata: {
          createdBy: 'synthetic_port',
          token: 'unsafe metadata token',
        },
        rawRows: [{ unsafe: true }],
        finalAppointmentId: 'unsafe_creator_final',
        databaseUrl: 'postgres://unsafe',
        stack: 'unsafe creator stack',
      };
    },
  };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'select *',
    'unsafe_case_creator_table',
    'unsafe_metadata',
    'unsafe_draft',
    'DATABASE_URL',
    'postgres://',
    '+886900001033',
    'unsafe creator address',
    'unsafe creator customer',
    'unsafe creator name',
    'unsafe_creator_line',
    'unsafe_creator_line_token',
    'LINE access token',
    'unsafe_creator_final',
    'unsafe actor token',
    'unsafe raw input',
    'unsafe draft stack',
    'unsafe plan stack',
    'unsafe creator stack',
    'unsafe metadata token',
    'unsafe planner token',
    'stack trace',
    'Bearer unsafe',
    'rawRows',
    'rawInput',
    'authorization',
    'phone',
    'address',
    'customerName',
    'customerPhone',
    'lineUserId',
    'lineAccessToken',
    'finalAppointmentId',
    'databaseUrl',
    'sql',
    'stack',
    'token',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('factory requires injected caseCreationPort.createCaseFromDraft', () => {
  for (const options of [
    undefined,
    null,
    {},
    { caseCreationPort: null },
    { caseCreationPort: {} },
    { caseCreationPort: { createCaseFromDraft: 'not-a-function' } },
  ]) {
    assert.throws(
      () => createRepairIntakeCaseCreatorPortAdapter(options),
      (error) => {
        assert.equal(error instanceof RepairIntakeCaseCreatorPortAdapterError, true);
        assert.equal(
          error.reasonCode,
          'REPAIR_INTAKE_CASE_CREATOR_PORT_ADAPTER_CREATION_PORT_REQUIRED',
        );
        assert.deepEqual(error.requiredActions, [
          'configure_case_creation_port_create_case_from_draft',
        ]);
        assertNoUnsafeText(error);
        return true;
      },
    );
  }
});

test('createCaseFromDraft forwards only sanitized creation context and returns sanitized caseRef', async () => {
  const calls = [];
  const adapter = createRepairIntakeCaseCreatorPortAdapter({
    caseCreationPort: createCaseCreationPort(calls),
  });

  const result = await adapter.createCaseFromDraft(unsafeCreationInput());

  assert.equal(calls.length, 1);
  assert.equal(calls[0].draftId, 'draft_task1033_top');
  assert.equal(calls[0].organizationId, 'org_task1033_top');
  assert.equal(calls[0].tenantId, 'tenant_task1033_top');
  assert.equal(calls[0].requestId, 'req_task1033_top');
  assert.equal(calls[0].actor.actorId, 'actor_task1033');
  assert.equal(calls[0].metadata.source, 'integration_test');
  assert.deepEqual(calls[0].warnings, ['needs_review']);
  assert.equal(calls[0].draft.id, 'draft_task1033');
  assert.equal(calls[0].draft.summary.title, 'safe draft summary');
  assert.equal(calls[0].plan.reasonCode, 'PLAN_READY_TASK1033');
  assert.equal(calls[0].plan.candidate.sourceDraftId, 'draft_task1033');
  assert.equal(result.ok, true);
  assert.equal(result.id, 'case_task1033');
  assert.equal(result.caseId, 'case_task1033');
  assert.equal(result.reasonCode, 'CASE_CREATED_TASK1033');
  assert.equal(result.summary.title, 'safe case summary');
  assertNoUnsafeText(calls);
  assertNoUnsafeText(result);
});

test('invalid input fails closed before creation port call', async () => {
  for (const invalidInput of [
    undefined,
    null,
    'input',
    42,
    true,
    [],
    () => {},
    {},
    { draft: null, plan: {} },
    { draft: {}, plan: null },
  ]) {
    const calls = [];
    const adapter = createRepairIntakeCaseCreatorPortAdapter({
      caseCreationPort: createCaseCreationPort(calls),
    });

    const result = await adapter.createCaseFromDraft(invalidInput);

    assert.equal(result.ok, false);
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_CASE_CREATOR_PORT_ADAPTER_INPUT_INVALID');
    assert.deepEqual(calls, []);
    assertNoUnsafeText(result);
  }
});

test('creation port thrown errors and rejections return sanitized create failure envelopes', async () => {
  for (const options of [{ throwCreate: true }, { rejectCreate: true }, { invalidResult: true }]) {
    const calls = [];
    const adapter = createRepairIntakeCaseCreatorPortAdapter({
      caseCreationPort: createCaseCreationPort(calls, options),
    });

    const result = await adapter.createCaseFromDraft(unsafeCreationInput());

    assert.equal(calls.length, 1);
    assert.equal(result.ok, false);
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_CASE_CREATOR_PORT_ADAPTER_CREATE_FAILED');
    assertNoUnsafeText(calls);
    assertNoUnsafeText(result);
  }
});
