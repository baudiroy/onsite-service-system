'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { ConflictError, ValidationError } = require('../../src/utils/errors');

const transactionModulePath = require.resolve('../../src/db/transaction');
const syntheticClient = Object.freeze({ id: 'synthetic-task1282-client' });

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

const { FieldServiceReportRepository } = require('../../src/repositories/FieldServiceReportRepository');
const { FieldServiceReportService } = require('../../src/services/FieldServiceReportService');

function createQueryClient(rows = []) {
  const calls = [];

  return {
    calls,
    async query(sql, params) {
      calls.push({ sql, params });

      return { rows };
    },
  };
}

function serviceReportRow(overrides = {}) {
  return {
    id: 'fsr-1282',
    case_id: 'case-1282',
    diagnosis_result: null,
    repair_action: null,
    repair_result: null,
    service_status: 'in_progress',
    engineer_note: null,
    customer_note: null,
    installation_checklist: null,
    onsite_started_at: '2026-06-03T01:00:00.000Z',
    onsite_completed_at: null,
    final_appointment_id: null,
    created_at: '2026-06-03T01:00:00.000Z',
    updated_at: '2026-06-03T01:00:00.000Z',
    deleted_at: null,
    ...overrides,
  };
}

function servicePartRow(overrides = {}) {
  return {
    id: 'part-1282',
    service_report_id: 'fsr-1282',
    part_name: 'Synthetic part',
    part_no: 'P-1282',
    quantity: 1,
    old_serial_no: null,
    new_serial_no: null,
    part_status: 'planned',
    replaced_at: null,
    created_at: '2026-06-03T01:00:00.000Z',
    updated_at: '2026-06-03T01:00:00.000Z',
    deleted_at: null,
    ...overrides,
  };
}

function duplicateServiceReportError() {
  const error = new Error('duplicate key value violates unique constraint');
  error.code = '23505';
  error.constraint = 'idx_field_service_reports_case_active_unique';

  return error;
}

function createHarness(options = {}) {
  const calls = {
    getCaseById: [],
    assertAccess: [],
    getServiceReportByCaseId: [],
    createServiceReport: [],
    getServiceReportById: [],
    getServiceReportByIdForUpdate: [],
    updateServiceReport: [],
    completeServiceReportFirstTransition: [],
    updateServiceSummary: [],
    createMessage: [],
    auditRecord: [],
    hasAppointmentsByCaseId: [],
    findEligibleFinalAppointmentForCase: [],
    getAppointmentById: [],
    getServicePartById: [],
    createServicePart: [],
    updateServicePart: [],
    softDeleteServicePart: [],
  };
  const caseRow = options.caseRow || { id: 'case-1282', organization_id: 'org-1282', status: 'scheduled' };
  const report = Object.prototype.hasOwnProperty.call(options, 'report')
    ? options.report
    : serviceReportRow();
  const reportForUpdate = Object.prototype.hasOwnProperty.call(options, 'reportForUpdate')
    ? options.reportForUpdate
    : report;
  const existingCaseReport = Object.prototype.hasOwnProperty.call(options, 'existingCaseReport')
    ? options.existingCaseReport
    : null;
  const appointment = Object.prototype.hasOwnProperty.call(options, 'appointment')
    ? options.appointment
    : { id: 'appointment-1282', case_id: 'case-1282', visit_result: 'completed' };
  const eligibleAppointment = Object.prototype.hasOwnProperty.call(options, 'eligibleAppointment')
    ? options.eligibleAppointment
    : { id: 'appointment-eligible-1282', case_id: 'case-1282', visit_result: 'completed' };
  const completeResult = Object.prototype.hasOwnProperty.call(options, 'completeResult')
    ? options.completeResult
    : serviceReportRow({
      service_status: 'completed',
      onsite_completed_at: '2026-06-03T02:00:00.000Z',
      final_appointment_id: 'appointment-eligible-1282',
    });

  const fieldServiceReportRepository = {
    async getServiceReportByCaseId(caseId, client) {
      calls.getServiceReportByCaseId.push({ caseId, client });

      return existingCaseReport;
    },
    async createServiceReport(input, client) {
      calls.createServiceReport.push({ input, client });
      if (options.createError) throw options.createError;

      return serviceReportRow({
        case_id: input.caseId,
        service_status: input.serviceStatus,
        final_appointment_id: input.finalAppointmentId || null,
      });
    },
    async getServiceReportById(reportId, client) {
      calls.getServiceReportById.push({ reportId, client });

      return report;
    },
    async getServiceReportByIdForUpdate(reportId, client) {
      calls.getServiceReportByIdForUpdate.push({ reportId, client });

      return reportForUpdate;
    },
    async updateServiceReport(reportId, input, client) {
      calls.updateServiceReport.push({ reportId, input, client });

      return serviceReportRow({ id: reportId, ...input });
    },
    async completeServiceReportFirstTransition(reportId, input, client) {
      calls.completeServiceReportFirstTransition.push({ reportId, input, client });

      return completeResult;
    },
  };
  const caseRepository = {
    async getCaseById(caseId, client) {
      calls.getCaseById.push({ caseId, client });

      return { ...caseRow, id: caseId };
    },
    async updateServiceSummary(caseId, summary, actorId, client) {
      calls.updateServiceSummary.push({ caseId, summary, actorId, client });
    },
  };
  const appointmentRepository = {
    async getAppointmentById(appointmentId, client) {
      calls.getAppointmentById.push({ appointmentId, client });

      return appointment && { ...appointment, id: appointmentId };
    },
    async hasAppointmentsByCaseId(caseId, client) {
      calls.hasAppointmentsByCaseId.push({ caseId, client });

      return options.caseHasAppointments !== false;
    },
    async findEligibleFinalAppointmentForCase(caseId, client) {
      calls.findEligibleFinalAppointmentForCase.push({ caseId, client });

      return eligibleAppointment;
    },
  };
  const servicePartRepository = {
    async getServicePartById(partId, client) {
      calls.getServicePartById.push({ partId, client });

      return servicePartRow({ id: partId });
    },
    async createServicePart(input, client) {
      calls.createServicePart.push({ input, client });

      return servicePartRow({ service_report_id: input.serviceReportId });
    },
    async updateServicePart(partId, input, client) {
      calls.updateServicePart.push({ partId, input, client });

      return servicePartRow({ id: partId, ...input });
    },
    async softDeleteServicePart(partId, actorId, client) {
      calls.softDeleteServicePart.push({ partId, actorId, client });

      return servicePartRow({ id: partId, deleted_at: '2026-06-03T02:00:00.000Z' });
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
    service: new FieldServiceReportService({
      fieldServiceReportRepository,
      servicePartRepository,
      caseRepository,
      appointmentRepository,
      auditService,
      messageService,
      organizationAccessService,
    }),
  };
}

async function assertConflict(action) {
  await assert.rejects(action, (error) => error instanceof ConflictError);
}

async function assertValidationCode(action, expectedCode) {
  await assert.rejects(
    action,
    (error) => error instanceof ValidationError &&
      error.details.some((detail) => detail.code === expectedCode),
  );
}

function assertNoWorkflowSideEffects(calls) {
  assert.equal(calls.updateServiceSummary.length, 0);
  assert.equal(calls.createMessage.length, 0);
  assert.equal(calls.auditRecord.length, 0);
}

test('FieldServiceReportRepository.getServiceReportByIdForUpdate uses row lock and deleted filter', async () => {
  const report = serviceReportRow();
  const client = createQueryClient([report]);
  const repository = new FieldServiceReportRepository(client);

  const result = await repository.getServiceReportByIdForUpdate('fsr-1282');

  assert.equal(result, report);
  assert.equal(client.calls.length, 1);
  assert.match(client.calls[0].sql, /FROM field_service_reports/);
  assert.match(client.calls[0].sql, /WHERE id = \$1/);
  assert.match(client.calls[0].sql, /deleted_at IS NULL/);
  assert.match(client.calls[0].sql, /FOR UPDATE/);
  assert.deepEqual(client.calls[0].params, ['fsr-1282']);
});

test('FieldServiceReportRepository.completeServiceReportFirstTransition encodes first-transition completion guard', async () => {
  const completed = serviceReportRow({ service_status: 'completed' });
  const client = createQueryClient([completed]);
  const repository = new FieldServiceReportRepository(client);

  const result = await repository.completeServiceReportFirstTransition(
    'fsr-1282',
    {
      diagnosisResult: 'diagnosed',
      repairAction: 'repaired',
      repairResult: 'fixed',
      onsiteCompletedAt: '2026-06-03T02:00:00.000Z',
      finalAppointmentId: 'appointment-final-1282',
      actorId: 'actor-1282',
    },
  );

  assert.equal(result, completed);
  assert.match(client.calls[0].sql, /UPDATE field_service_reports/);
  assert.match(client.calls[0].sql, /service_status = 'completed'/);
  assert.match(client.calls[0].sql, /deleted_at IS NULL/);
  assert.match(client.calls[0].sql, /service_status <> 'completed'/);
  assert.match(client.calls[0].sql, /final_appointment_id = CASE WHEN \$10 THEN \$11 ELSE final_appointment_id END/);
  assert.deepEqual(client.calls[0].params.slice(0, 2), ['fsr-1282', 'diagnosed']);
  assert.equal(client.calls[0].params[8], '2026-06-03T02:00:00.000Z');
  assert.equal(client.calls[0].params[9], true);
  assert.equal(client.calls[0].params[10], 'appointment-final-1282');
});

test('FieldServiceReportRepository.completeServiceReportFirstTransition returns null when no row is updated', async () => {
  const client = createQueryClient([]);
  const repository = new FieldServiceReportRepository(client);

  const result = await repository.completeServiceReportFirstTransition(
    'already-completed-1282',
    { onsiteCompletedAt: '2026-06-03T02:00:00.000Z' },
  );

  assert.equal(result, null);
  assert.equal(client.calls[0].params[9], false);
  assert.equal(client.calls[0].params[10], null);
});

test('FieldServiceReportService.createServiceReport maps active unique conflict without message or audit side effects', async () => {
  const { calls, service } = createHarness({ createError: duplicateServiceReportError() });

  await assertConflict(() => service.createServiceReport(
    'case-1282',
    {},
    { id: 'actor-1282', userType: 'admin' },
  ));

  assert.equal(calls.createServiceReport.length, 1);
  assertNoWorkflowSideEffects(calls);
});

test('FieldServiceReportService.updateServiceReport rejects completed report before update or side effects', async () => {
  const { calls, service } = createHarness({
    report: serviceReportRow({ service_status: 'completed' }),
  });

  await assertConflict(() => service.updateServiceReport(
    'fsr-1282',
    { repairResult: 'should-not-write' },
    { id: 'actor-1282', userType: 'admin' },
  ));

  assert.equal(calls.updateServiceReport.length, 0);
  assertNoWorkflowSideEffects(calls);
});

test('FieldServiceReportService.completeServiceReport rejects already completed report before completion side effects', async () => {
  const { calls, service } = createHarness({
    reportForUpdate: serviceReportRow({ service_status: 'completed' }),
  });

  await assertConflict(() => service.completeServiceReport(
    'fsr-1282',
    {},
    { id: 'actor-1282', userType: 'admin' },
  ));

  assert.equal(calls.completeServiceReportFirstTransition.length, 0);
  assert.equal(calls.hasAppointmentsByCaseId.length, 0);
  assertNoWorkflowSideEffects(calls);
});

test('FieldServiceReportService.completeServiceReport maps null first-transition update to ConflictError', async () => {
  const { calls, service } = createHarness({
    caseHasAppointments: false,
    reportForUpdate: serviceReportRow({ service_status: 'in_progress', final_appointment_id: null }),
    completeResult: null,
  });

  await assertConflict(() => service.completeServiceReport(
    'fsr-1282',
    {},
    { id: 'actor-1282', userType: 'admin' },
  ));

  assert.equal(calls.completeServiceReportFirstTransition.length, 1);
  assertNoWorkflowSideEffects(calls);
});

test('FieldServiceReportService.completeServiceReport infers finalAppointmentId when omitted and eligible completed appointment exists', async () => {
  const { calls, service } = createHarness({
    reportForUpdate: serviceReportRow({ service_status: 'in_progress', final_appointment_id: null }),
    eligibleAppointment: { id: 'appointment-inferred-1282', case_id: 'case-1282', visit_result: 'completed' },
    completeResult: serviceReportRow({
      service_status: 'completed',
      final_appointment_id: 'appointment-inferred-1282',
      onsite_completed_at: '2026-06-03T02:00:00.000Z',
    }),
  });

  const result = await service.completeServiceReport(
    'fsr-1282',
    {},
    { id: 'actor-1282', userType: 'admin' },
  );

  assert.equal(result.finalAppointmentId, 'appointment-inferred-1282');
  assert.equal(calls.findEligibleFinalAppointmentForCase.length, 1);
  assert.equal(calls.completeServiceReportFirstTransition[0].input.finalAppointmentId, 'appointment-inferred-1282');
  assert.equal(calls.updateServiceSummary.length, 1);
  assert.equal(calls.createMessage.length, 1);
  assert.equal(calls.auditRecord.length, 1);
});

test('FieldServiceReportService.completeServiceReport rejects supplied finalAppointmentId that is not completed', async () => {
  const { calls, service } = createHarness({
    appointment: { id: 'appointment-final-1282', case_id: 'case-1282', visit_result: 'pending_parts' },
  });

  await assertValidationCode(
    () => service.completeServiceReport(
      'fsr-1282',
      { finalAppointmentId: 'appointment-final-1282' },
      { id: 'actor-1282', userType: 'admin' },
    ),
    'final_appointment_not_completed',
  );

  assert.equal(calls.completeServiceReportFirstTransition.length, 0);
  assertNoWorkflowSideEffects(calls);
});

test('FieldServiceReportService.completeServiceReport rejects supplied finalAppointmentId from another case', async () => {
  const { calls, service } = createHarness({
    appointment: { id: 'appointment-final-1282', case_id: 'case-other-1282', visit_result: 'completed' },
  });

  await assertValidationCode(
    () => service.completeServiceReport(
      'fsr-1282',
      { finalAppointmentId: 'appointment-final-1282' },
      { id: 'actor-1282', userType: 'admin' },
    ),
    'appointment_case_mismatch',
  );

  assert.equal(calls.completeServiceReportFirstTransition.length, 0);
  assertNoWorkflowSideEffects(calls);
});

test('FieldServiceReportService.createServicePart rejects completed parent report before mutation side effects', async () => {
  const { calls, service } = createHarness({
    report: serviceReportRow({ service_status: 'completed' }),
  });

  await assertConflict(() => service.createServicePart(
    'fsr-1282',
    { partName: 'blocked' },
    { id: 'actor-1282', userType: 'admin' },
  ));

  assert.equal(calls.createServicePart.length, 0);
  assertNoWorkflowSideEffects(calls);
});

test('FieldServiceReportService.updateServicePart rejects completed parent report before mutation side effects', async () => {
  const { calls, service } = createHarness({
    report: serviceReportRow({ service_status: 'completed' }),
  });

  await assertConflict(() => service.updateServicePart(
    'part-1282',
    { quantity: 2 },
    { id: 'actor-1282', userType: 'admin' },
  ));

  assert.equal(calls.updateServicePart.length, 0);
  assert.equal(calls.softDeleteServicePart.length, 0);
  assertNoWorkflowSideEffects(calls);
});

test('FieldServiceReportService.softDeleteServicePart rejects completed parent report before mutation side effects', async () => {
  const { calls, service } = createHarness({
    report: serviceReportRow({ service_status: 'completed' }),
  });

  await assertConflict(() => service.softDeleteServicePart(
    'part-1282',
    { id: 'actor-1282', userType: 'admin' },
  ));

  assert.equal(calls.softDeleteServicePart.length, 0);
  assertNoWorkflowSideEffects(calls);
});
