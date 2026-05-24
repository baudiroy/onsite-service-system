'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { ValidationError } = require('../../src/utils/errors');

const transactionModulePath = require.resolve('../../src/db/transaction');
const syntheticClient = Object.freeze({ id: 'synthetic-task1278-client' });

require.cache[transactionModulePath] = {
  id: transactionModulePath,
  filename: transactionModulePath,
  loaded: true,
  exports: {
    async withTransaction(callback) {
      return callback(syntheticClient);
    },
  },
};

const { AppointmentService } = require('../../src/services/AppointmentService');

function appointmentInput(overrides = {}) {
  return {
    dispatchAssignmentId: 'dispatch-1278',
    scheduledStartAt: '2026-06-02T10:00:00.000Z',
    scheduledEndAt: '2026-06-02T12:00:00.000Z',
    visitType: 'repair',
    timezone: 'Asia/Taipei',
    note: 'synthetic create appointment',
    visitSequence: 1,
    ...overrides,
  };
}

function appointmentRowFromInput(input, overrides = {}) {
  return {
    id: 'appointment-1278',
    case_id: input.caseId || 'case-1278',
    dispatch_assignment_id: input.dispatchAssignmentId || null,
    scheduled_start_at: input.scheduledStartAt,
    scheduled_end_at: input.scheduledEndAt,
    appointment_status: input.appointmentStatus || 'scheduled',
    visit_type: input.visitType,
    timezone: input.timezone,
    reschedule_reason: null,
    note: input.note || null,
    visit_sequence: input.visitSequence || 1,
    visit_result: input.visitResult || null,
    incomplete_reason: input.incompleteReason || null,
    next_action: input.nextAction || null,
    actual_arrival_at: input.actualArrivalAt || null,
    actual_finished_at: input.actualFinishedAt || null,
    created_at: '2026-06-02T01:00:00.000Z',
    updated_at: '2026-06-02T01:00:00.000Z',
    ...overrides,
  };
}

function createHarness(options = {}) {
  const { dispatchAssignment } = options;
  const resolvedDispatchAssignment = Object.prototype.hasOwnProperty.call(options, 'dispatchAssignment')
    ? dispatchAssignment
    : { id: 'dispatch-1278', case_id: 'case-1278' };
  const calls = {
    getCaseById: [],
    assertAccess: [],
    findOpenAppointmentsByCaseId: [],
    getDispatchAssignmentById: [],
    getDispatchAssignmentByCaseId: [],
    createAppointment: [],
    updateAppointmentSummary: [],
    createMessage: [],
    auditRecord: [],
  };
  const appointmentRepository = {
    async findOpenAppointmentsByCaseId(caseId, options, client) {
      calls.findOpenAppointmentsByCaseId.push({ caseId, options, client });

      return [];
    },
    async createAppointment(input, client) {
      calls.createAppointment.push({ input, client });

      return appointmentRowFromInput(input);
    },
  };
  const dispatchRepository = {
    async getDispatchAssignmentById(dispatchAssignmentId, client) {
      calls.getDispatchAssignmentById.push({ dispatchAssignmentId, client });

      return resolvedDispatchAssignment &&
        resolvedDispatchAssignment.id === 'dispatch-1278'
        ? { ...resolvedDispatchAssignment, id: dispatchAssignmentId }
        : resolvedDispatchAssignment;
    },
    async getDispatchAssignmentByCaseId(caseId, client) {
      calls.getDispatchAssignmentByCaseId.push({ caseId, client });

      return { id: 'dispatch-by-case-1278', case_id: caseId };
    },
  };
  const caseRepository = {
    async getCaseById(caseId, client) {
      calls.getCaseById.push({ caseId, client });

      return { id: caseId, organization_id: 'org-1278' };
    },
    async updateAppointmentSummary(caseId, summary, actorId, client) {
      calls.updateAppointmentSummary.push({ caseId, summary, actorId, client });
    },
  };
  const organizationAccessService = {
    async assertAccess(actor, organizationId, client) {
      calls.assertAccess.push({ actor, organizationId, client });
    },
  };
  const messageService = {
    async createMessage(caseId, message, actor, req, client) {
      calls.createMessage.push({ caseId, message, actor, req, client });
    },
  };
  const auditService = {
    async record(event, client) {
      calls.auditRecord.push({ event, client });
    },
  };

  return {
    calls,
    service: new AppointmentService({
      appointmentRepository,
      dispatchRepository,
      caseRepository,
      organizationAccessService,
      messageService,
      auditService,
    }),
  };
}

async function assertValidationError(action, expectedCode) {
  await assert.rejects(
    action,
    (error) => error instanceof ValidationError &&
      error.details.some((detail) => detail.code === expectedCode),
  );
}

function assertNoCreateSideEffects(calls) {
  assert.equal(calls.createAppointment.length, 0);
  assert.equal(calls.updateAppointmentSummary.length, 0);
  assert.equal(calls.createMessage.length, 0);
  assert.equal(calls.auditRecord.length, 0);
}

test('createAppointment accepts explicit same-case dispatchAssignmentId and creates scheduled appointment', async () => {
  const { calls, service } = createHarness({
    dispatchAssignment: { id: 'dispatch-1278', case_id: 'case-1278' },
  });
  const input = appointmentInput();
  const beforeInput = structuredClone(input);

  const result = await service.createAppointment(
    'case-1278',
    input,
    { id: 'actor-1278', userType: 'admin', displayName: 'Task1278 Actor' },
  );

  assert.deepEqual(input, beforeInput);
  assert.equal(result.dispatchAssignmentId, 'dispatch-1278');
  assert.equal(result.appointmentStatus, 'scheduled');
  assert.equal(calls.getDispatchAssignmentById.length, 1);
  assert.deepEqual(calls.getDispatchAssignmentById[0], {
    dispatchAssignmentId: 'dispatch-1278',
    client: syntheticClient,
  });
  assert.equal(calls.createAppointment.length, 1);
  assert.equal(calls.createAppointment[0].client, syntheticClient);
  assert.equal(calls.createAppointment[0].input.caseId, 'case-1278');
  assert.equal(calls.createAppointment[0].input.dispatchAssignmentId, 'dispatch-1278');
  assert.equal(calls.createAppointment[0].input.appointmentStatus, 'scheduled');
  assert.equal(calls.updateAppointmentSummary.length, 1);
  assert.equal(calls.createMessage.length, 1);
  assert.equal(calls.auditRecord.length, 1);
});

test('createAppointment rejects explicit cross-case dispatchAssignmentId without create message or audit side effects', async () => {
  const { calls, service } = createHarness({
    dispatchAssignment: { id: 'dispatch-1278', case_id: 'case-other-1278' },
  });

  await assertValidationError(
    () => service.createAppointment(
      'case-1278',
      appointmentInput(),
      { id: 'actor-1278', userType: 'admin' },
    ),
    'invalid_reference',
  );

  assert.equal(calls.getDispatchAssignmentById.length, 1);
  assertNoCreateSideEffects(calls);
});

test('createAppointment rejects missing explicit dispatchAssignmentId without create message or audit side effects', async () => {
  const { calls, service } = createHarness({ dispatchAssignment: null });

  await assertValidationError(
    () => service.createAppointment(
      'case-1278',
      appointmentInput(),
      { id: 'actor-1278', userType: 'admin' },
    ),
    'invalid_reference',
  );

  assert.equal(calls.getDispatchAssignmentById.length, 1);
  assertNoCreateSideEffects(calls);
});

test('createAppointment rejects invalid actual time range before create message or audit side effects', async () => {
  const { calls, service } = createHarness();

  await assertValidationError(
    () => service.createAppointment(
      'case-1278',
      appointmentInput({
        actualArrivalAt: '2026-06-02T10:30:00.000Z',
        actualFinishedAt: '2026-06-02T10:00:00.000Z',
      }),
      { id: 'actor-1278', userType: 'admin' },
    ),
    'invalid_actual_time_range',
  );

  assert.equal(calls.getCaseById.length, 0);
  assertNoCreateSideEffects(calls);
});

test('createAppointment currently normalizes caller appointmentStatus completed to scheduled for non-completed visitResult', async () => {
  const { calls, service } = createHarness();

  const result = await service.createAppointment(
    'case-1278',
    appointmentInput({
      appointmentStatus: 'completed',
      visitResult: 'pending_parts',
    }),
    { id: 'actor-1278', userType: 'admin' },
  );

  assert.equal(result.appointmentStatus, 'scheduled');
  assert.equal(result.visitResult, 'pending_parts');
  assert.equal(calls.createAppointment.length, 1);
  assert.equal(calls.createAppointment[0].input.appointmentStatus, 'scheduled');
  assert.equal(calls.createAppointment[0].input.visitResult, 'pending_parts');
});

test('createAppointment rejects completed visitResult because new appointments are scheduled by current source behavior', async () => {
  const { calls, service } = createHarness();

  await assertValidationError(
    () => service.createAppointment(
      'case-1278',
      appointmentInput({
        visitResult: 'completed',
      }),
      { id: 'actor-1278', userType: 'admin' },
    ),
    'completed_status_required',
  );

  assertNoCreateSideEffects(calls);
});
