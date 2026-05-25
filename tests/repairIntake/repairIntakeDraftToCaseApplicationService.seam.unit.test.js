'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  RepairIntakeDraftToCaseApplicationServiceError,
  createRepairIntakeDraftToCaseApplicationService,
} = require('../../src/repairIntake/repairIntakeDraftToCaseApplicationService');

const UNSAFE_ERROR_MESSAGE = [
  'SQL select * from unsafe_application_service_table',
  'DATABASE_URL=postgres://unsafe-application-service',
  'phone +886900000000',
  'address unsafe service address',
  'customer unsafe service name',
  'lineUserId unsafe_service_line',
  'LINE access token unsafe_service_line_token',
  'finalAppointmentId unsafe_service_final',
  'stack trace at unsafe service',
].join(' ');

function input() {
  return {
    draftId: 'draft_task1015',
    organizationId: 'org_task1015',
    actorId: 'actor_task1015',
    requestId: 'req_task1015',
    body: {
      idempotencyKey: 'idem_task1015',
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
      },
      approvalContext: {
        accepted: true,
      },
    },
    phone: '+886900000000',
    address: 'unsafe service address',
    lineUserId: 'unsafe_service_line',
    finalAppointmentId: 'unsafe_service_final',
    sql: 'select * from unsafe_input',
  };
}

function createPorts(calls, options = {}) {
  return {
    draftReader: {
      getDraftForConversion: async (serviceInput) => {
        calls.push({ port: 'draftReader', input: serviceInput });
        if (options.throwAt === 'draftReader') {
          throw new Error(UNSAFE_ERROR_MESSAGE);
        }
        return {
          id: 'draft_task1015',
          organizationId: 'org_task1015',
          status: 'ready',
          rawRows: [{ phone: '+886900000000' }],
          phone: '+886900000000',
          address: 'unsafe service address',
        };
      },
    },
    casePlanner: {
      planCaseFromDraft: async (serviceInput) => {
        calls.push({ port: 'casePlanner', input: serviceInput });
        if (options.rejectAt === 'casePlanner') {
          return Promise.reject(new Error(UNSAFE_ERROR_MESSAGE));
        }
        return {
          status: 'planned',
          reasonCode: 'PLAN_READY',
          requiredActions: [],
          candidate: {
            sourceDraftId: 'draft_task1015',
            organizationId: 'org_task1015',
          },
          sql: 'select * from unsafe_plan',
          lineUserId: 'unsafe_service_line',
        };
      },
    },
    caseCreator: {
      createCaseFromDraft: async (serviceInput) => {
        calls.push({ port: 'caseCreator', input: serviceInput });
        if (options.throwAt === 'caseCreator') {
          throw new Error(UNSAFE_ERROR_MESSAGE);
        }
        return {
          id: 'case_task1015',
          organizationId: 'org_task1015',
          sourceDraftId: 'draft_task1015',
          status: 'created',
          reasonCode: 'SUBMIT_READY',
          requiredActions: [],
          finalAppointmentId: 'unsafe_final',
          databaseUrl: 'postgres://unsafe',
        };
      },
    },
    auditWriter: {
      recordDraftToCaseDecision: async (serviceInput) => {
        calls.push({ port: 'auditWriter', input: serviceInput });
        if (options.rejectAt === 'auditWriter') {
          return Promise.reject(new Error(UNSAFE_ERROR_MESSAGE));
        }
        return {
          eventType: 'repair_intake_draft_to_case_decision',
          outcome: 'submitted',
          draftId: 'draft_task1015',
          organizationId: 'org_task1015',
          stack: 'unsafe stack',
          token: 'unsafe_token',
        };
      },
    },
  };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'select *',
    'unsafe_application_service_table',
    'unsafe_input',
    'unsafe_plan',
    'DATABASE_URL',
    'postgres://',
    '+886900000000',
    'unsafe service address',
    'unsafe service name',
    'lineUserId',
    'unsafe_service_line',
    'LINE access token',
    'unsafe_service_line_token',
    'finalAppointmentId',
    'unsafe_service_final',
    'unsafe_final',
    'stack trace',
    'unsafe stack',
    'unsafe_token',
    'rawRows',
    'databaseUrl',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('planDraftToCase calls only draftReader and casePlanner and returns sanitized plan envelope', async () => {
  const calls = [];
  const service = createRepairIntakeDraftToCaseApplicationService(createPorts(calls));

  const result = await service.planDraftToCase(input());

  assert.deepEqual(calls.map(({ port }) => port), ['draftReader', 'casePlanner']);
  assert.equal(result.ok, true);
  assert.equal(result.action, 'repair_intake_draft_to_case_plan');
  assert.equal(result.draftId, 'draft_task1015');
  assert.equal(result.organizationId, 'org_task1015');
  assert.equal(result.reasonCode, 'PLAN_READY');
  assert.equal(result.submitted, false);
  assert.equal(result.plan.status, 'planned');
  assert.equal(result.caseRef, null);
  assert.equal(result.auditEvent, null);
  assertNoUnsafeText(result);
  assertNoUnsafeText(calls);
});

test('submitDraftToCase calls all ports in order and returns sanitized submit envelope', async () => {
  const calls = [];
  const service = createRepairIntakeDraftToCaseApplicationService(createPorts(calls));

  const result = await service.submitDraftToCase(input());

  assert.deepEqual(calls.map(({ port }) => port), [
    'draftReader',
    'casePlanner',
    'caseCreator',
    'auditWriter',
  ]);
  assert.equal(result.ok, true);
  assert.equal(result.action, 'repair_intake_draft_to_case_submit');
  assert.equal(result.submitted, true);
  assert.equal(result.reasonCode, 'SUBMIT_READY');
  assert.equal(result.caseRef.id, 'case_task1015');
  assert.equal(result.auditEvent.eventType, 'repair_intake_draft_to_case_decision');
  assertNoUnsafeText(result);
  assertNoUnsafeText(calls);
});

test('invalid service input fails closed before any port call', async () => {
  for (const [methodName, expectedReasonCode] of [
    ['planDraftToCase', 'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_PLAN_INPUT_INVALID'],
    ['submitDraftToCase', 'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_SUBMIT_INPUT_INVALID'],
  ]) {
    const calls = [];
    const service = createRepairIntakeDraftToCaseApplicationService(createPorts(calls));

    for (const invalidInput of [undefined, null, 'input', 42, true, [], () => {}]) {
      const result = await service[methodName](invalidInput);

      assert.equal(result.ok, false);
      assert.equal(result.reasonCode, expectedReasonCode);
      assert.deepEqual(result.requiredActions, ['provide_valid_input']);
      assertNoUnsafeText(result);
    }

    assert.deepEqual(calls, []);
  }
});

test('invalid ports fail closed at factory creation with sanitized configuration error', () => {
  const invalidOptions = [
    null,
    {},
    { draftReader: {}, casePlanner: {}, caseCreator: {}, auditWriter: {} },
    {
      ...createPorts([]),
      auditWriter: {
        token: 'DATABASE_URL phone address lineUserId finalAppointmentId',
      },
    },
  ];

  for (const options of invalidOptions) {
    assert.throws(
      () => createRepairIntakeDraftToCaseApplicationService(options),
      (error) => {
        assert.equal(error instanceof RepairIntakeDraftToCaseApplicationServiceError, true);
        assert.equal(
          error.reasonCode,
          'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_PORTS_REQUIRED',
        );
        assert.deepEqual(error.requiredActions, [
          'configure_draft_reader_case_planner_case_creator_audit_writer',
        ]);
        assertNoUnsafeText(error);
        return true;
      },
    );
  }
});

test('port thrown errors and async rejections return sanitized failure envelopes', async () => {
  for (const [methodName, options, expectedReasonCode] of [
    [
      'planDraftToCase',
      { throwAt: 'draftReader' },
      'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_PLAN_FAILED',
    ],
    [
      'planDraftToCase',
      { rejectAt: 'casePlanner' },
      'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_PLAN_FAILED',
    ],
    [
      'submitDraftToCase',
      { throwAt: 'caseCreator' },
      'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_SUBMIT_FAILED',
    ],
    [
      'submitDraftToCase',
      { rejectAt: 'auditWriter' },
      'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_SUBMIT_FAILED',
    ],
  ]) {
    const service = createRepairIntakeDraftToCaseApplicationService(createPorts([], options));
    const result = await service[methodName](input());

    assert.equal(result.ok, false);
    assert.equal(result.status, 'failed');
    assert.equal(result.reasonCode, expectedReasonCode);
    assert.deepEqual(result.requiredActions, ['retry_or_manual_review']);
    assertNoUnsafeText(result);
  }
});
