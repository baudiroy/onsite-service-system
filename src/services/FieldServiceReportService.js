const { FieldServiceReportRepository } = require('../repositories/FieldServiceReportRepository');
const { ServicePartRepository } = require('../repositories/ServicePartRepository');
const { CaseRepository } = require('../repositories/CaseRepository');
const { AppointmentRepository } = require('../repositories/AppointmentRepository');
const { AuditService } = require('./AuditService');
const { OrganizationAccessService } = require('./OrganizationAccessService');
const { MessageService } = require('./MessageService');
const { withTransaction } = require('../db/transaction');
const { ConflictError, InvalidStatusTransitionError, NotFoundError, ValidationError } = require('../utils/errors');
const { toFieldServiceReportDTO, toServicePartDTO } = require('../mappers/fieldServiceMapper');

const ONSITE_READY_STATUSES = new Set(['assigned', 'scheduled', 'on_site']);
const FIELD_SERVICE_REPORT_CASE_UNIQUE_INDEX = 'idx_field_service_reports_case_active_unique';
const DUPLICATE_SERVICE_REPORT_MESSAGE = 'Service report already exists for this case.';

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function isDuplicateServiceReportError(error) {
  return error?.code === '23505' && error.constraint === FIELD_SERVICE_REPORT_CASE_UNIQUE_INDEX;
}

class FieldServiceReportService {
  constructor({
    fieldServiceReportRepository = new FieldServiceReportRepository(),
    servicePartRepository = new ServicePartRepository(),
    caseRepository = new CaseRepository(),
    appointmentRepository = new AppointmentRepository(),
    auditService = new AuditService(),
    messageService = new MessageService(),
    organizationAccessService = new OrganizationAccessService()
  } = {}) {
    this.fieldServiceReportRepository = fieldServiceReportRepository;
    this.servicePartRepository = servicePartRepository;
    this.caseRepository = caseRepository;
    this.appointmentRepository = appointmentRepository;
    this.auditService = auditService;
    this.messageService = messageService;
    this.organizationAccessService = organizationAccessService;
  }

  async ensureCaseReadyForService(caseId, client, actor = null) {
    const caseRow = await this.caseRepository.getCaseById(caseId, client);

    if (!caseRow) throw new NotFoundError('Case not found.');

    if (actor) await this.organizationAccessService.assertAccess(actor, caseRow.organization_id, client);

    if (!ONSITE_READY_STATUSES.has(caseRow.status)) {
      throw new InvalidStatusTransitionError('Case must be assigned or scheduled before onsite service report creation.');
    }

    return caseRow;
  }


  async ensureCaseAccess(caseId, client, actor = null) {
    const caseRow = await this.caseRepository.getCaseById(caseId, client);
    if (!caseRow) throw new NotFoundError('Case not found.');
    if (actor) await this.organizationAccessService.assertAccess(actor, caseRow.organization_id, client);
    return caseRow;
  }

  async getReportOrThrow(reportId, client) {
    const report = await this.fieldServiceReportRepository.getServiceReportById(reportId, client);
    if (!report) throw new NotFoundError('Service report not found.');
    return report;
  }

  async getReportOrThrowForUpdate(reportId, client) {
    const report = await this.fieldServiceReportRepository.getServiceReportByIdForUpdate(reportId, client);
    if (!report) throw new NotFoundError('Service report not found.');
    return report;
  }

  ensureReportMutable(report) {
    if (report.service_status === 'completed') {
      throw new ConflictError('Completed service reports cannot be modified.');
    }
  }

  async ensureFinalAppointmentBelongsToCase(finalAppointmentId, caseId, client) {
    if (!finalAppointmentId) return null;

    const appointment = await this.appointmentRepository.getAppointmentById(finalAppointmentId, client);
    if (!appointment) throw new NotFoundError('Appointment not found.');

    if (appointment.case_id !== caseId) {
      throw new ValidationError('Final appointment must belong to the same case.', [
        {
          field: 'finalAppointmentId',
          message: 'Final appointment must belong to the same case.',
          code: 'appointment_case_mismatch'
        }
      ]);
    }

    return appointment;
  }

  async ensureFinalAppointmentCompletedForCase(finalAppointmentId, caseId, client) {
    if (!finalAppointmentId) return null;

    const appointment = await this.ensureFinalAppointmentBelongsToCase(finalAppointmentId, caseId, client);

    if (appointment.visit_result !== 'completed') {
      throw new ValidationError('finalAppointmentId must reference a completed appointment for this case.', [
        {
          field: 'finalAppointmentId',
          message: 'finalAppointmentId must reference a completed appointment for this case.',
          code: 'final_appointment_not_completed'
        }
      ]);
    }

    return appointment;
  }

  async ensureCompletionFinalAppointment(existingReport, input, client) {
    const caseHasAppointments = await this.appointmentRepository.hasAppointmentsByCaseId(existingReport.case_id, client);
    const suppliedFinalAppointmentId = hasOwn(input, 'finalAppointmentId') && input.finalAppointmentId
      ? input.finalAppointmentId
      : null;
    const existingFinalAppointmentId = existingReport.final_appointment_id || null;

    if (!caseHasAppointments) {
      const legacyFinalAppointmentId = suppliedFinalAppointmentId || existingFinalAppointmentId;
      if (legacyFinalAppointmentId) {
        await this.ensureFinalAppointmentCompletedForCase(legacyFinalAppointmentId, existingReport.case_id, client);
      }
      return legacyFinalAppointmentId || null;
    }

    if (suppliedFinalAppointmentId) {
      await this.ensureFinalAppointmentCompletedForCase(
        suppliedFinalAppointmentId,
        existingReport.case_id,
        client
      );
      return suppliedFinalAppointmentId;
    }

    if (existingFinalAppointmentId) {
      await this.ensureFinalAppointmentCompletedForCase(
        existingFinalAppointmentId,
        existingReport.case_id,
        client
      );
      return existingFinalAppointmentId;
    }

    const inferredAppointment = await this.appointmentRepository.findEligibleFinalAppointmentForCase(
      existingReport.case_id,
      client
    );

    if (!inferredAppointment) {
      throw new ValidationError('A completed appointment is required before completing a service report.', [
        {
          field: 'finalAppointmentId',
          message: 'A completed appointment is required before completing a service report.',
          code: 'no_completed_appointment'
        }
      ]);
    }

    return inferredAppointment.id;
  }

  async createServiceReport(caseId, input, actor, req = null) {
    return withTransaction(async (client) => {
      await this.ensureCaseReadyForService(caseId, client, actor);
      await this.ensureFinalAppointmentCompletedForCase(input.finalAppointmentId, caseId, client);

      const existing = await this.fieldServiceReportRepository.getServiceReportByCaseId(caseId, client);
      if (existing) {
        throw new ConflictError(DUPLICATE_SERVICE_REPORT_MESSAGE);
      }

      let report;
      try {
        report = await this.fieldServiceReportRepository.createServiceReport({
          ...input,
          caseId,
          serviceStatus: 'in_progress',
          actorId: actor?.id || null
        }, client);
      } catch (error) {
        if (isDuplicateServiceReportError(error)) {
          throw new ConflictError(DUPLICATE_SERVICE_REPORT_MESSAGE);
        }

        throw error;
      }

      await this.caseRepository.updateServiceSummary(
        caseId,
        {
          status: 'on_site',
          completionStatus: 'in_progress'
        },
        actor?.id || null,
        client
      );

      await this.messageService.createMessage(
        caseId,
        {
          messageType: 'workflow_event',
          bodyText: '工程師開始到府',
          senderType: 'system',
          timelineSource: 'field_service'
        },
        actor,
        req,
        client
      );

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'service_report.created',
        entityType: 'case',
        entityId: caseId,
        afterData: {
          serviceReportId: report.id,
          serviceStatus: report.service_status,
          finalAppointmentId: report.final_appointment_id,
          onsiteStartedAt: report.onsite_started_at
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: { requestId: req?.requestId || null }
      }, client);

      return toFieldServiceReportDTO(report);
    });
  }

  async getServiceReportByCaseId(caseId, actor) {
    await this.ensureCaseAccess(caseId, undefined, actor);
    const report = await this.fieldServiceReportRepository.getServiceReportByCaseId(caseId);
    if (!report) throw new NotFoundError('Service report not found.');
    return toFieldServiceReportDTO(report);
  }

  async updateDiagnosis(reportId, input, actor, req = null) {
    return this.updateServiceReport(reportId, input, actor, req, 'service_report.diagnosis_updated');
  }

  async updateRepairResult(reportId, input, actor, req = null) {
    return this.updateServiceReport(reportId, input, actor, req, 'service_report.repair_result_updated');
  }

  async updateServiceReport(reportId, input, actor, req = null, action = null) {
    if (input.serviceStatus === 'completed') {
      return this.completeServiceReport(reportId, input, actor, req);
    }

    return withTransaction(async (client) => {
      const existing = await this.getReportOrThrow(reportId, client);
      await this.ensureCaseAccess(existing.case_id, client, actor);
      this.ensureReportMutable(existing);
      await this.ensureFinalAppointmentCompletedForCase(input.finalAppointmentId, existing.case_id, client);
      const nextAction = action || (input.diagnosisResult
        ? 'service_report.diagnosis_updated'
        : 'service_report.repair_result_updated');
      const updated = await this.fieldServiceReportRepository.updateServiceReport(
        reportId,
        {
          ...input,
          actorId: actor?.id || null
        },
        client
      );

      if (updated.service_status === 'pending_parts') {
        await this.messageService.createMessage(
          updated.case_id,
          {
            messageType: 'workflow_event',
            bodyText: '待料追蹤',
            senderType: 'system',
            timelineSource: 'field_service'
          },
          actor,
          req,
          client
        );
      }

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: nextAction,
        entityType: 'service_report',
        entityId: reportId,
        beforeData: {
          diagnosisResult: existing.diagnosis_result,
          repairAction: existing.repair_action,
          repairResult: existing.repair_result,
          serviceStatus: existing.service_status,
          finalAppointmentId: existing.final_appointment_id
        },
        afterData: {
          diagnosisResult: updated.diagnosis_result,
          repairAction: updated.repair_action,
          repairResult: updated.repair_result,
          serviceStatus: updated.service_status,
          finalAppointmentId: updated.final_appointment_id
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: { requestId: req?.requestId || null }
      }, client);

      return toFieldServiceReportDTO(updated);
    });
  }

  async completeServiceReport(reportId, input = {}, actor, req = null) {
    return withTransaction(async (client) => {
      const existing = await this.getReportOrThrowForUpdate(reportId, client);
      await this.ensureCaseAccess(existing.case_id, client, actor);
      if (existing.service_status === 'completed') {
        throw new ConflictError('Service report is already completed.');
      }
      const finalAppointmentId = await this.ensureCompletionFinalAppointment(existing, input, client);
      const completedAt = input.onsiteCompletedAt || new Date().toISOString();
      const updated = await this.fieldServiceReportRepository.completeServiceReportFirstTransition(
        reportId,
        {
          ...input,
          finalAppointmentId,
          onsiteCompletedAt: completedAt,
          actorId: actor?.id || null
        },
        client
      );

      if (!updated) {
        throw new ConflictError('Service report is already completed.');
      }

      await this.caseRepository.updateServiceSummary(
        updated.case_id,
        {
          status: 'completed',
          completionStatus: 'completed',
          completedAt: updated.onsite_completed_at
        },
        actor?.id || null,
        client
      );

      await this.messageService.createMessage(
        updated.case_id,
        {
          messageType: 'workflow_event',
          bodyText: '已完成維修',
          senderType: 'system',
          timelineSource: 'field_service'
        },
        actor,
        req,
        client
      );

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'service_report.completed',
        entityType: 'service_report',
        entityId: reportId,
        beforeData: {
          serviceStatus: existing.service_status,
          onsiteCompletedAt: existing.onsite_completed_at,
          finalAppointmentId: existing.final_appointment_id
        },
        afterData: {
          caseId: updated.case_id,
          serviceStatus: updated.service_status,
          onsiteCompletedAt: updated.onsite_completed_at,
          finalAppointmentId: updated.final_appointment_id
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: { requestId: req?.requestId || null }
      }, client);

      return toFieldServiceReportDTO(updated);
    });
  }

  async listServiceReports(query = {}) {
    const result = await this.fieldServiceReportRepository.listServiceReports({
      filters: { serviceStatus: query.serviceStatus },
      pagination: { limit: query.limit, offset: query.offset }
    });

    return {
      data: result.rows.map(toFieldServiceReportDTO),
      pagination: result.pagination
    };
  }

  async createServicePart(reportId, input, actor, req = null) {
    return withTransaction(async (client) => {
      const report = await this.getReportOrThrow(reportId, client);
      await this.ensureCaseAccess(report.case_id, client, actor);
      this.ensureReportMutable(report);
      const part = await this.servicePartRepository.createServicePart({
        ...input,
        serviceReportId: reportId,
        actorId: actor?.id || null
      }, client);

      await this.messageService.createMessage(
        report.case_id,
        {
          messageType: 'workflow_event',
          bodyText: part.part_status === 'planned' ? '待料追蹤' : '更換零件',
          senderType: 'system',
          timelineSource: 'field_service'
        },
        actor,
        req,
        client
      );

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'service_part.added',
        entityType: 'service_part',
        entityId: part.id,
        afterData: {
          serviceReportId: reportId,
          caseId: report.case_id,
          partName: part.part_name,
          partNo: part.part_no,
          quantity: part.quantity,
          partStatus: part.part_status
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: { requestId: req?.requestId || null }
      }, client);

      return toServicePartDTO(part);
    });
  }

  async listServiceParts(reportId, query = {}, actor = null) {
    const report = await this.getReportOrThrow(reportId);
    await this.ensureCaseAccess(report.case_id, undefined, actor);
    const result = await this.servicePartRepository.listServicePartsByReportId(reportId, {
      pagination: { limit: query.limit, offset: query.offset }
    });

    return {
      data: result.rows.map(toServicePartDTO),
      pagination: result.pagination
    };
  }

  async updateServicePart(partId, input, actor, req = null) {
    return withTransaction(async (client) => {
      const existing = await this.servicePartRepository.getServicePartById(partId, client);
      if (!existing) throw new NotFoundError('Service part not found.');
      const report = await this.getReportOrThrow(existing.service_report_id, client);
      await this.ensureCaseAccess(report.case_id, client, actor);
      this.ensureReportMutable(report);

      const updated = await this.servicePartRepository.updateServicePart(
        partId,
        {
          ...input,
          actorId: actor?.id || null
        },
        client
      );

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'service_part.updated',
        entityType: 'service_part',
        entityId: partId,
        beforeData: {
          partName: existing.part_name,
          partNo: existing.part_no,
          quantity: existing.quantity,
          partStatus: existing.part_status
        },
        afterData: {
          partName: updated.part_name,
          partNo: updated.part_no,
          quantity: updated.quantity,
          partStatus: updated.part_status,
          replacedAt: updated.replaced_at
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: { requestId: req?.requestId || null }
      }, client);

      return toServicePartDTO(updated);
    });
  }

  async softDeleteServicePart(partId, actor, req = null) {
    return withTransaction(async (client) => {
      const existing = await this.servicePartRepository.getServicePartById(partId, client);
      if (!existing) throw new NotFoundError('Service part not found.');
      const report = await this.getReportOrThrow(existing.service_report_id, client);
      await this.ensureCaseAccess(report.case_id, client, actor);
      this.ensureReportMutable(report);

      const deleted = await this.servicePartRepository.softDeleteServicePart(partId, actor?.id || null, client);

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'service_part.deleted',
        entityType: 'service_part',
        entityId: partId,
        beforeData: {
          serviceReportId: existing.service_report_id,
          partName: existing.part_name,
          partNo: existing.part_no,
          quantity: existing.quantity,
          partStatus: existing.part_status
        },
        afterData: { deletedAt: deleted.deleted_at },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: { requestId: req?.requestId || null }
      }, client);

      return toServicePartDTO(deleted);
    });
  }
}

module.exports = {
  FieldServiceReportService
};
