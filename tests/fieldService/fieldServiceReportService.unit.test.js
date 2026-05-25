'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { ConflictError } = require('../../src/utils/errors');

const transactionModulePath = require.resolve('../../src/db/transaction');
const serviceModulePath = require.resolve('../../src/services/FieldServiceReportService');

function withStubbedTransaction() {
  const originalTransactionModule = require.cache[transactionModulePath];
  const originalServiceModule = require.cache[serviceModulePath];

  require.cache[transactionModulePath] = {
    ...originalTransactionModule,
    exports: {
      withTransaction: async (runner) => runner({})
    }
  };

  if (originalServiceModule) {
    delete require.cache[serviceModulePath];
  }

  const { FieldServiceReportService } = require(serviceModulePath);

  return {
    FieldServiceReportService,
    restore() {
      if (originalTransactionModule) {
        require.cache[transactionModulePath] = originalTransactionModule;
      } else {
        delete require.cache[transactionModulePath];
      }
      if (originalServiceModule) {
        require.cache[serviceModulePath] = originalServiceModule;
      } else {
        delete require.cache[serviceModulePath];
      }
    }
  };
}

function makeRepositoryRecorder() {
  const calls = [];
  return {
    calls,
    fieldServiceReportRepository: {
      getServiceReportByIdForUpdate: async (...args) => {
        calls.push({ method: 'getServiceReportByIdForUpdate', args });
        return null;
      },
      completeServiceReportFirstTransition: async (...args) => {
        calls.push({ method: 'completeServiceReportFirstTransition', args });
        return null;
      },
      updateServiceSummary: async () => {
        calls.push({ method: 'updateServiceSummary' });
        return null;
      }
    },
    caseRepository: {
      getCaseById: async () => {
        calls.push({ method: 'getCaseById' });
        return null;
      },
      updateServiceSummary: async () => {
        calls.push({ method: 'caseRepoUpdateServiceSummary' });
        return null;
      }
    },
    appointmentRepository: {
      getAppointmentById: async () => {
        calls.push({ method: 'getAppointmentById' });
        return null;
      },
      hasAppointmentsByCaseId: async () => {
        calls.push({ method: 'hasAppointmentsByCaseId' });
        return false;
      },
      findEligibleFinalAppointmentForCase: async () => {
        calls.push({ method: 'findEligibleFinalAppointmentForCase' });
        return null;
      }
    },
    auditService: {
      record: async () => {
        calls.push({ method: 'recordAudit' });
        return null;
      }
    },
    messageService: {
      createMessage: async () => {
        calls.push({ method: 'createMessage' });
        return null;
      }
    },
    organizationAccessService: {
      assertAccess: async () => {
        calls.push({ method: 'assertAccess' });
        return null;
      }
    },
    servicePartRepository: {},
  };
}

function getCall(calls, method) {
  return calls.find((entry) => entry.method === method);
}

test('completeServiceReport rejects already completed report before mutation', async () => {
  const recorder = makeRepositoryRecorder();
  const completedReport = {
    id: 'fsr_001',
    case_id: 'case_001',
    service_status: 'completed'
  };
  let completedUpdateCalled = false;

  recorder.fieldServiceReportRepository.getServiceReportByIdForUpdate = async () => completedReport;
  recorder.caseRepository.getCaseById = async () => ({ id: 'case_001', organization_id: 'org_001', status: 'scheduled' });
  recorder.fieldServiceReportRepository.completeServiceReportFirstTransition = async () => {
    completedUpdateCalled = true;
    return {};
  };

  const { FieldServiceReportService, restore } = withStubbedTransaction();
  try {
    const service = new FieldServiceReportService(recorder);
    await assert.rejects(
      async () => service.completeServiceReport('fsr_001', {}, { id: 'actor_001', userType: 'admin' }),
      (error) => error instanceof ConflictError
    );
  } finally {
    restore();
  }

  assert.equal(completedUpdateCalled, false, 'complete transition should not be called for already completed report');
  assert.equal(getCall(recorder.calls, 'assertAccess')?.method, 'assertAccess');
});

test('completeServiceReport infers final appointment when case has appointments and finalAppointmentId omitted', async () => {
  const recorder = makeRepositoryRecorder();
  const report = {
    id: 'fsr_002',
    case_id: 'case_002',
    service_status: 'in_progress',
    final_appointment_id: null
  };
  let capturedCompleteInput = null;

  recorder.fieldServiceReportRepository.getServiceReportByIdForUpdate = async () => report;
  recorder.caseRepository.getCaseById = async () => ({ id: 'case_002', organization_id: 'org_002', status: 'assigned' });
  recorder.appointmentRepository.hasAppointmentsByCaseId = async () => true;
  recorder.appointmentRepository.findEligibleFinalAppointmentForCase = async () => ({ id: 'apt_completed_001', visit_result: 'completed' });
  recorder.fieldServiceReportRepository.completeServiceReportFirstTransition = async (_reportId, payload) => {
    recorder.calls.push({ method: 'completeServiceReportFirstTransition', args: [_reportId, payload] });
    capturedCompleteInput = payload;
    return {
      ...report,
      service_status: 'completed',
      final_appointment_id: payload.finalAppointmentId,
      onsite_completed_at: payload.onsiteCompletedAt
    };
  };
  recorder.fieldServiceReportRepository.updateServiceSummary = async () => ({});
  recorder.caseRepository.updateServiceSummary = async () => ({});

  const { FieldServiceReportService, restore } = withStubbedTransaction();
  try {
    const service = new FieldServiceReportService(recorder);
    const result = await service.completeServiceReport('fsr_002', {}, { id: 'actor_002', userType: 'admin' });
    assert.equal(result.finalAppointmentId, 'apt_completed_001');
    assert.equal(capturedCompleteInput.finalAppointmentId, 'apt_completed_001');
  } finally {
    restore();
  }

  const completeCall = getCall(recorder.calls, 'completeServiceReportFirstTransition');
  assert.equal(completeCall?.method, 'completeServiceReportFirstTransition');
  assert.equal(recorder.calls.some((item) => item.method === 'getAppointmentById'), false);
});

test('completeServiceReport rejects with no completed final appointment when no inference target exists', async () => {
  const recorder = makeRepositoryRecorder();
  const report = {
    id: 'fsr_003',
    case_id: 'case_003',
    service_status: 'in_progress',
    final_appointment_id: null
  };
  let completeCalled = false;

  recorder.fieldServiceReportRepository.getServiceReportByIdForUpdate = async () => report;
  recorder.caseRepository.getCaseById = async () => ({ id: 'case_003', organization_id: 'org_003', status: 'assigned' });
  recorder.appointmentRepository.hasAppointmentsByCaseId = async () => true;
  recorder.appointmentRepository.findEligibleFinalAppointmentForCase = async () => null;
  recorder.fieldServiceReportRepository.completeServiceReportFirstTransition = async () => {
    recorder.calls.push({ method: 'completeServiceReportFirstTransition' });
    completeCalled = true;
    return {};
  };

  const { FieldServiceReportService, restore } = withStubbedTransaction();
  try {
    const service = new FieldServiceReportService(recorder);
    let thrown;
    try {
      await service.completeServiceReport('fsr_003', {}, { id: 'actor_003', userType: 'admin' });
      assert.fail('Expected completeServiceReport to reject when no final appointment is available.');
    } catch (error) {
      thrown = error;
    }
    assert.equal(thrown?.code, 'VALIDATION_ERROR');
    assert.equal(thrown?.details?.[0]?.code, 'no_completed_appointment');
  } finally {
    restore();
  }

  assert.equal(completeCalled, false, 'should not call complete update when no eligible final appointment');
});
