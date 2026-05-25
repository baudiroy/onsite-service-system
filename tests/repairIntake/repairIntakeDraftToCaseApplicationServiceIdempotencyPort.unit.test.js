'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  RepairIntakeDraftToCaseApplicationServiceError,
  createRepairIntakeDraftToCaseApplicationService,
} = require('../../src/repairIntake/repairIntakeDraftToCaseApplicationService');

function validInput() {
  return {
    draftId: 'draft_task1021',
    organizationId: 'org_task1021',
    actorId: 'actor_task1021',
    requestId: 'req_task1021',
    body: {
      organizationId: 'org_task1021',
      idempotencyKey: 'idem_task1021',
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
      },
      approvalContext: {
        accepted: true,
      },
      phone: '+886900001021',
      address: 'unsafe address task1021',
      lineUserId: 'unsafe_line_task1021',
      finalAppointmentId: 'unsafe_final_task1021',
    },
    rawInput: {
      sql: 'select * from unsafe_task1021',
    },
    headers: {
      authorization: 'Bearer unsafe',
    },
  };
}

function createPorts(calls, options = {}) {
  const ports = {
    draftReader: {
      getDraftForConversion: async (payload) => {
        calls.push({ name: 'draftReader', payload });
        return {
          id: 'draft_task1021',
          organizationId: 'org_task1021',
          status: 'ready',
          rawRows: [{ phone: '+886900001021' }],
          phone: '+886900001021',
        };
      },
    },
    casePlanner: {
      planCaseFromDraft: async (payload) => {
        calls.push({ name: 'casePlanner', payload });
        return {
          status: 'planned',
          reasonCode: 'PLAN_READY_TASK1021',
          requiredActions: [],
          candidate: {
            sourceDraftId: 'draft_task1021',
            organizationId: 'org_task1021',
          },
          stack: 'unsafe plan stack',
        };
      },
    },
    caseCreator: {
      createCaseFromDraft: async (payload) => {
        calls.push({ name: 'caseCreator', payload });
        return {
          id: 'case_task1021',
          organizationId: 'org_task1021',
          sourceDraftId: 'draft_task1021',
          status: 'created',
          reasonCode: 'SUBMIT_READY_TASK1021',
          requiredActions: [],
          finalAppointmentId: 'unsafe_final_task1021',
        };
      },
    },
    auditWriter: {
      recordDraftToCaseDecision: async (payload) => {
        calls.push({ name: 'auditWriter', payload });
        return {
          eventType: 'repair_intake_draft_to_case_decision',
          outcome: 'submitted',
          draftId: 'draft_task1021',
          organizationId: 'org_task1021',
          token: 'unsafe audit token',
        };
      },
    },
  };

  if (options.idempotencyPort !== undefined) {
    ports.idempotencyPort = options.idempotencyPort;
  }

  return ports;
}

function createIdempotencyPort(calls, options = {}) {
  return {
    findExistingDraftToCaseResult: async (payload) => {
      calls.push({ name: 'findExisting', payload });
      if (options.throwAt === 'find') {
        throw new Error('SQL unsafe find failure phone +886900001021');
      }
      if (options.rejectAt === 'find') {
        return Promise.reject(new Error('DATABASE_URL unsafe find rejection'));
      }
      return options.existingResult || null;
    },
    recordDraftToCaseResult: async (payload) => {
      calls.push({ name: 'recordResult', payload });
      if (options.throwAt === 'record') {
        throw new Error('SQL unsafe record failure phone +886900001021');
      }
      if (options.rejectAt === 'record') {
        return Promise.reject(new Error('DATABASE_URL unsafe record rejection'));
      }
      return {
        recorded: true,
        stack: 'unsafe record stack',
      };
    },
  };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'select *',
    'unsafe_task1021',
    'DATABASE_URL',
    '+886900001021',
    'unsafe address task1021',
    'unsafe_line_task1021',
    'unsafe_final_task1021',
    'Bearer unsafe',
    'unsafe plan stack',
    'unsafe audit token',
    'unsafe record stack',
    'rawInput',
    'rawRows',
    'authorization',
    'phone',
    'address',
    'lineUserId',
    'finalAppointmentId',
    'stack',
    'token',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('submit behavior is unchanged when no idempotencyPort is provided', async () => {
  const calls = [];
  const service = createRepairIntakeDraftToCaseApplicationService(createPorts(calls));

  const result = await service.submitDraftToCase(validInput());

  assert.deepEqual(calls.map((call) => call.name), [
    'draftReader',
    'casePlanner',
    'caseCreator',
    'auditWriter',
  ]);
  assert.equal(result.ok, true);
  assert.equal(result.reasonCode, 'SUBMIT_READY_TASK1021');
  assertNoUnsafeText(calls.map((call) => call.payload));
  assertNoUnsafeText(result);
});

test('invalid idempotencyPort shape fails closed at factory creation', () => {
  for (const idempotencyPort of [
    null,
    {},
    { findExistingDraftToCaseResult: async () => null },
    { recordDraftToCaseResult: async () => ({}) },
  ]) {
    assert.throws(
      () => createRepairIntakeDraftToCaseApplicationService(createPorts([], { idempotencyPort })),
      (error) => {
        assert.equal(error instanceof RepairIntakeDraftToCaseApplicationServiceError, true);
        assert.equal(
          error.reasonCode,
          'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_IDEMPOTENCY_PORT_REQUIRED',
        );
        assert.deepEqual(error.requiredActions, ['configure_idempotency_port']);
        assertNoUnsafeText(error);
        return true;
      },
    );
  }
});

test('submit preconditions run before idempotency or core port calls', async () => {
  const calls = [];
  const service = createRepairIntakeDraftToCaseApplicationService(
    createPorts(calls, { idempotencyPort: createIdempotencyPort(calls) }),
  );
  const input = validInput();
  input.body.idempotencyKey = '';

  const result = await service.submitDraftToCase(input);

  assert.equal(result.ok, false);
  assert.equal(
    result.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_IDEMPOTENCY_REQUIRED',
  );
  assert.deepEqual(calls, []);
  assertNoUnsafeText(result);
});

test('existing successful idempotency result replays without core submit ports or record call', async () => {
  const calls = [];
  const service = createRepairIntakeDraftToCaseApplicationService(
    createPorts(calls, {
      idempotencyPort: createIdempotencyPort(calls, {
        existingResult: {
          ok: true,
          submitted: true,
          draftId: 'draft_task1021',
          organizationId: 'org_task1021',
          status: 'submitted',
          reasonCode: 'SUBMIT_READY_TASK1021',
          plan: { status: 'planned', phone: '+886900001021' },
          caseRef: { id: 'case_task1021', finalAppointmentId: 'unsafe_final_task1021' },
          auditEvent: { eventType: 'repair_intake_draft_to_case_decision', stack: 'unsafe stack' },
          rawRows: [{ unsafe: true }],
        },
      }),
    }),
  );

  const result = await service.submitDraftToCase(validInput());

  assert.deepEqual(calls.map((call) => call.name), ['findExisting']);
  assert.equal(result.ok, true);
  assert.equal(result.submitted, true);
  assert.equal(result.idempotentReplay, true);
  assert.equal(result.reasonCode, 'SUBMIT_READY_TASK1021');
  assertNoUnsafeText(calls.map((call) => call.payload));
  assertNoUnsafeText(result);
});

test('normal submit with idempotencyPort records sanitized submit result after audit', async () => {
  const calls = [];
  const service = createRepairIntakeDraftToCaseApplicationService(
    createPorts(calls, { idempotencyPort: createIdempotencyPort(calls) }),
  );

  const result = await service.submitDraftToCase(validInput());

  assert.deepEqual(calls.map((call) => call.name), [
    'findExisting',
    'draftReader',
    'casePlanner',
    'caseCreator',
    'auditWriter',
    'recordResult',
  ]);
  assert.equal(result.ok, true);
  assert.equal(result.reasonCode, 'SUBMIT_READY_TASK1021');
  assert.equal(calls.at(-1).payload.result.reasonCode, 'SUBMIT_READY_TASK1021');
  assertNoUnsafeText(calls.map((call) => call.payload));
  assertNoUnsafeText(result);
});

test('idempotency port thrown errors and rejections return sanitized failure envelope', async () => {
  for (const options of [
    { throwAt: 'find' },
    { rejectAt: 'find' },
    { throwAt: 'record' },
    { rejectAt: 'record' },
  ]) {
    const calls = [];
    const service = createRepairIntakeDraftToCaseApplicationService(
      createPorts(calls, { idempotencyPort: createIdempotencyPort(calls, options) }),
    );

    const result = await service.submitDraftToCase(validInput());

    assert.equal(result.ok, false);
    assert.equal(
      result.reasonCode,
      'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_IDEMPOTENCY_FAILED',
    );
    assertNoUnsafeText(result);
  }
});

test('planDraftToCase does not use idempotencyPort', async () => {
  const calls = [];
  const service = createRepairIntakeDraftToCaseApplicationService(
    createPorts(calls, { idempotencyPort: createIdempotencyPort(calls) }),
  );

  const result = await service.planDraftToCase(validInput());

  assert.deepEqual(calls.map((call) => call.name), ['draftReader', 'casePlanner']);
  assert.equal(result.ok, true);
  assert.equal(result.submitted, false);
  assertNoUnsafeText(calls.map((call) => call.payload));
  assertNoUnsafeText(result);
});
