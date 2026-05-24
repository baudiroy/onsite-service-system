'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { DispatchRepository } = require('../../src/repositories/DispatchRepository');
const { ValidationError } = require('../../src/utils/errors');

const transactionModulePath = require.resolve('../../src/db/transaction');
const syntheticClient = Object.freeze({ id: 'synthetic-task1275-client' });

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

function createQueryClient(rows) {
  const calls = [];

  return {
    calls,
    async query(sql, params) {
      calls.push({ sql, params });

      return { rows };
    },
  };
}

function appointmentRow(overrides = {}) {
  return {
    id: 'appointment-1275',
    case_id: 'case-1275',
    dispatch_assignment_id: 'dispatch-1275',
    scheduled_start_at: '2026-06-01T10:00:00.000Z',
    scheduled_end_at: '2026-06-01T12:00:00.000Z',
    appointment_status: 'scheduled',
    visit_type: 'onsite',
    timezone: 'Asia/Taipei',
    reschedule_reason: null,
    note: null,
    visit_sequence: 1,
    visit_result: null,
    incomplete_reason: null,
    next_action: null,
    actual_arrival_at: null,
    actual_finished_at: null,
    created_at: '2026-06-01T01:00:00.000Z',
    updated_at: '2026-06-01T01:00:00.000Z',
    deleted_at: null,
    ...overrides,
  };
}

function createAppointmentServiceHarness(options = {}) {
  const { existingAppointment, dispatchAssignment } = options;
  const resolvedDispatchAssignment = Object.prototype.hasOwnProperty.call(options, 'dispatchAssignment')
    ? dispatchAssignment
    : { id: 'dispatch-1275', case_id: 'case-1275' };
  const calls = {
    getAppointmentById: [],
    updateAppointment: [],
    getCaseById: [],
    assertAccess: [],
    createMessage: [],
    auditRecord: [],
    findOpenAppointmentsByCaseId: [],
    getDispatchAssignmentById: [],
  };
  const appointmentRepository = {
    async getAppointmentById(appointmentId, client) {
      calls.getAppointmentById.push({ appointmentId, client });

      return existingAppointment || appointmentRow();
    },
    async updateAppointment(appointmentId, input, client) {
      calls.updateAppointment.push({ appointmentId, input, client });

      return appointmentRow({
        id: appointmentId,
        case_id: (existingAppointment || appointmentRow()).case_id,
        dispatch_assignment_id: (existingAppointment || appointmentRow()).dispatch_assignment_id,
        appointment_status: input.appointmentStatus || (existingAppointment || appointmentRow()).appointment_status,
        visit_result: input.visitResult || (existingAppointment || appointmentRow()).visit_result,
        actual_arrival_at: input.actualArrivalAt || (existingAppointment || appointmentRow()).actual_arrival_at,
        actual_finished_at: input.actualFinishedAt || (existingAppointment || appointmentRow()).actual_finished_at,
      });
    },
    async findOpenAppointmentsByCaseId(caseId, options, client) {
      calls.findOpenAppointmentsByCaseId.push({ caseId, options, client });

      return [];
    },
  };
  const caseRepository = {
    async getCaseById(caseId, client) {
      calls.getCaseById.push({ caseId, client });

      return { id: caseId, organization_id: 'org-1275' };
    },
    async updateAppointmentSummary() {},
  };
  const organizationAccessService = {
    async assertAccess(actor, organizationId, client) {
      calls.assertAccess.push({ actor, organizationId, client });
    },
  };
  const dispatchRepository = {
    async getDispatchAssignmentById(dispatchAssignmentId, client) {
      calls.getDispatchAssignmentById.push({ dispatchAssignmentId, client });

      return resolvedDispatchAssignment &&
        resolvedDispatchAssignment.id === 'dispatch-1275'
        ? { ...resolvedDispatchAssignment, id: dispatchAssignmentId }
        : resolvedDispatchAssignment;
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
      caseRepository,
      organizationAccessService,
      dispatchRepository,
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

test('DispatchRepository.getDispatchAssignmentById delegates to injected query client and returns found assignment', async () => {
  const assignment = { id: 'dispatch-1275', case_id: 'case-1275', deleted_at: null };
  const client = createQueryClient([assignment]);
  const repository = new DispatchRepository(client);

  const result = await repository.getDispatchAssignmentById('dispatch-1275');

  assert.equal(result, assignment);
  assert.equal(client.calls.length, 1);
  assert.match(client.calls[0].sql, /FROM dispatch_assignments/);
  assert.match(client.calls[0].sql, /WHERE id = \$1/);
  assert.match(client.calls[0].sql, /deleted_at IS NULL/);
  assert.match(client.calls[0].sql, /LIMIT 1/);
  assert.deepEqual(client.calls[0].params, ['dispatch-1275']);
});

test('DispatchRepository.getDispatchAssignmentById returns null when injected client finds no assignment', async () => {
  const client = createQueryClient([]);
  const repository = new DispatchRepository(client);

  const result = await repository.getDispatchAssignmentById('missing-dispatch-1275');

  assert.equal(result, null);
  assert.deepEqual(client.calls[0].params, ['missing-dispatch-1275']);
});

test('DispatchRepository.getDispatchAssignmentById encodes deleted assignment exclusion in SQL', async () => {
  const client = createQueryClient([]);
  const repository = new DispatchRepository(client);

  await repository.getDispatchAssignmentById('deleted-dispatch-1275');

  assert.match(client.calls[0].sql, /deleted_at IS NULL/);
});

test('AppointmentService.ensureDispatchAssignmentForCase accepts same-case dispatch assignment', async () => {
  const { calls, service } = createAppointmentServiceHarness({
    dispatchAssignment: { id: 'dispatch-1275', case_id: 'case-1275' },
  });

  const result = await service.ensureDispatchAssignmentForCase(
    'dispatch-1275',
    'case-1275',
    syntheticClient,
  );

  assert.deepEqual(result, { id: 'dispatch-1275', case_id: 'case-1275' });
  assert.deepEqual(calls.getDispatchAssignmentById, [
    {
      dispatchAssignmentId: 'dispatch-1275',
      client: syntheticClient,
    },
  ]);
});

test('AppointmentService.ensureDispatchAssignmentForCase rejects missing dispatch assignment', async () => {
  const { service } = createAppointmentServiceHarness({ dispatchAssignment: null });

  await assertValidationError(
    () => service.ensureDispatchAssignmentForCase('missing-dispatch-1275', 'case-1275', syntheticClient),
    'invalid_reference',
  );
});

test('AppointmentService.ensureDispatchAssignmentForCase rejects cross-case dispatch assignment', async () => {
  const { service } = createAppointmentServiceHarness({
    dispatchAssignment: { id: 'dispatch-1275', case_id: 'case-other-1275' },
  });

  await assertValidationError(
    () => service.ensureDispatchAssignmentForCase('dispatch-1275', 'case-1275', syntheticClient),
    'invalid_reference',
  );
});

test('AppointmentService.rescheduleAppointment rejects invalid actual arrival and finish range without updating', async () => {
  const { calls, service } = createAppointmentServiceHarness({
    existingAppointment: appointmentRow({
      actual_arrival_at: '2026-06-01T10:00:00.000Z',
    }),
  });

  await assertValidationError(
    () => service.rescheduleAppointment(
      'appointment-1275',
      { actualFinishedAt: '2026-06-01T09:59:00.000Z' },
      { id: 'actor-1275', userType: 'admin' },
    ),
    'invalid_actual_time_range',
  );

  assert.equal(calls.updateAppointment.length, 0);
  assert.equal(calls.createMessage.length, 0);
  assert.equal(calls.auditRecord.length, 0);
});

test('AppointmentService.rescheduleAppointment rejects completed status without completed visitResult', async () => {
  const { calls, service } = createAppointmentServiceHarness();

  await assertValidationError(
    () => service.rescheduleAppointment(
      'appointment-1275',
      {
        appointmentStatus: 'completed',
        visitResult: 'pending_parts',
      },
      { id: 'actor-1275', userType: 'admin' },
    ),
    'completed_visit_result_required',
  );

  assert.equal(calls.updateAppointment.length, 0);
  assert.equal(calls.createMessage.length, 0);
  assert.equal(calls.auditRecord.length, 0);
});

test('AppointmentService.rescheduleAppointment derives completed appointment status from completed visitResult', async () => {
  const { calls, service } = createAppointmentServiceHarness();

  const result = await service.rescheduleAppointment(
    'appointment-1275',
    {
      visitResult: 'completed',
      actualArrivalAt: '2026-06-01T10:00:00.000Z',
      actualFinishedAt: '2026-06-01T10:30:00.000Z',
    },
    { id: 'actor-1275', userType: 'admin', displayName: 'Task1275 Actor' },
  );

  assert.equal(result.appointmentStatus, 'completed');
  assert.equal(result.visitResult, 'completed');
  assert.equal(calls.updateAppointment.length, 1);
  assert.equal(calls.updateAppointment[0].client, syntheticClient);
  assert.equal(calls.updateAppointment[0].input.appointmentStatus, 'completed');
  assert.equal(calls.updateAppointment[0].input.visitResult, 'completed');
  assert.equal(calls.createMessage.length, 1);
  assert.equal(calls.auditRecord.length, 1);
});
