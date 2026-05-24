const { AppointmentRepository } = require('../repositories/AppointmentRepository');
const { DispatchRepository } = require('../repositories/DispatchRepository');
const { CaseRepository } = require('../repositories/CaseRepository');
const { AuditService } = require('./AuditService');
const { OrganizationAccessService } = require('./OrganizationAccessService');
const { MessageService } = require('./MessageService');
const { withTransaction } = require('../db/transaction');
const { ConflictError, NotFoundError, ValidationError } = require('../utils/errors');
const { toAppointmentDTO } = require('../mappers/appointmentMapper');

const OPEN_APPOINTMENT_CONFLICT_MESSAGE = '此案件已有尚未結束的到府預約，請先完成、取消或標記結果後再建立下一筆預約。';
const TERMINAL_APPOINTMENT_STATUSES = new Set(['cancelled', 'completed', 'no_show']);
const TERMINAL_VISIT_RESULTS = new Set([
  'completed',
  'pending_parts',
  'pending_quote',
  'need_second_visit',
  'customer_not_home',
  'customer_cancelled',
  'unable_to_repair',
  'rescheduled',
  'no_show'
]);

function validateTimeRange(input) {
  const start = new Date(input.scheduledStartAt);
  const end = new Date(input.scheduledEndAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    throw new ValidationError('scheduledEndAt must be after scheduledStartAt.', [
      {
        field: 'scheduledEndAt',
        message: 'scheduledEndAt must be after scheduledStartAt.',
        code: 'invalid_time_range'
      }
    ]);
  }
}

function validateActualTimeRange(input, existing = {}) {
  const arrivalValue = input.actualArrivalAt || existing.actual_arrival_at;
  const finishedValue = input.actualFinishedAt || existing.actual_finished_at;
  if (!arrivalValue || !finishedValue) return;

  const arrival = new Date(arrivalValue);
  const finished = new Date(finishedValue);

  if (Number.isNaN(arrival.getTime()) || Number.isNaN(finished.getTime()) || finished < arrival) {
    throw new ValidationError('actualFinishedAt must be after or equal to actualArrivalAt.', [
      {
        field: 'actualFinishedAt',
        message: 'actualFinishedAt must be after or equal to actualArrivalAt.',
        code: 'invalid_actual_time_range'
      }
    ]);
  }
}

function isAppointmentOpen(row) {
  if (!row || row.deleted_at) return false;
  if (TERMINAL_APPOINTMENT_STATUSES.has(row.appointment_status)) return false;
  if (row.visit_result && TERMINAL_VISIT_RESULTS.has(row.visit_result)) return false;
  return true;
}

function buildNextAppointmentState(existing, input, nextStatus) {
  return {
    ...existing,
    appointment_status: nextStatus || existing.appointment_status,
    visit_result: input.visitResult || existing.visit_result
  };
}

function ensureAppointmentCompletionConsistency(existing, input, nextStatus) {
  const resultingStatus = nextStatus || existing.appointment_status;
  const resultingVisitResult = input.visitResult || existing.visit_result;

  if (resultingStatus === 'completed' && resultingVisitResult !== 'completed') {
    throw new ValidationError('Completed appointments require visitResult to be completed.', [
      {
        field: 'visitResult',
        message: 'Completed appointments require visitResult to be completed.',
        code: 'completed_visit_result_required'
      }
    ]);
  }

  if (resultingVisitResult === 'completed' && resultingStatus !== 'completed') {
    throw new ValidationError('visitResult completed requires appointmentStatus to be completed.', [
      {
        field: 'appointmentStatus',
        message: 'visitResult completed requires appointmentStatus to be completed.',
        code: 'completed_status_required'
      }
    ]);
  }
}

function getAppointmentUpdateAction(updated, input) {
  if (updated.appointment_status === 'cancelled') return 'appointment.cancelled';
  if (updated.appointment_status === 'rescheduled' || input.scheduledStartAt) return 'appointment.rescheduled';
  return 'appointment.updated';
}

function getAppointmentUpdateMessage(updated, input) {
  if (updated.appointment_status === 'cancelled') return '到府預約已取消';
  if (updated.appointment_status === 'rescheduled' || input.scheduledStartAt) return '到府時間改期';
  return '到府紀錄已更新';
}

class AppointmentService {
  constructor({
    appointmentRepository = new AppointmentRepository(),
    dispatchRepository = new DispatchRepository(),
    caseRepository = new CaseRepository(),
    auditService = new AuditService(),
    messageService = new MessageService(),
    organizationAccessService = new OrganizationAccessService()
  } = {}) {
    this.appointmentRepository = appointmentRepository;
    this.dispatchRepository = dispatchRepository;
    this.caseRepository = caseRepository;
    this.auditService = auditService;
    this.messageService = messageService;
    this.organizationAccessService = organizationAccessService;
  }

  async assertNoOtherOpenAppointment(caseId, options = {}, client) {
    const openAppointments = await this.appointmentRepository.findOpenAppointmentsByCaseId(
      caseId,
      options,
      client
    );

    if (openAppointments.length > 0) {
      throw new ConflictError(OPEN_APPOINTMENT_CONFLICT_MESSAGE);
    }
  }

  async ensureCase(caseId, client, actor = null) {
    const caseRow = await this.caseRepository.getCaseById(caseId, client);
    if (!caseRow) throw new NotFoundError('Case not found.');
    if (actor) await this.organizationAccessService.assertAccess(actor, caseRow.organization_id, client);
    return caseRow;
  }

  async ensureDispatchAssignmentForCase(dispatchAssignmentId, caseId, client) {
    const dispatch = await this.dispatchRepository.getDispatchAssignmentById(dispatchAssignmentId, client);

    if (!dispatch || dispatch.case_id !== caseId) {
      throw new ValidationError('dispatchAssignmentId must reference a dispatch assignment for this case.', [
        {
          field: 'dispatchAssignmentId',
          message: 'dispatchAssignmentId must reference a dispatch assignment for this case.',
          code: 'invalid_reference'
        }
      ]);
    }

    return dispatch;
  }

  async createAppointment(caseId, input, actor, req = null) {
    validateTimeRange(input);
    validateActualTimeRange(input);
    ensureAppointmentCompletionConsistency(
      { appointment_status: 'scheduled', visit_result: null },
      input,
      'scheduled'
    );

    return withTransaction(async (client) => {
      await this.ensureCase(caseId, client, actor);
      await this.assertNoOtherOpenAppointment(caseId, {}, client);
      const dispatch = input.dispatchAssignmentId
        ? await this.ensureDispatchAssignmentForCase(input.dispatchAssignmentId, caseId, client)
        : await this.dispatchRepository.getDispatchAssignmentByCaseId(caseId, client);
      const dispatchAssignmentId = dispatch?.id || null;
      const appointment = await this.appointmentRepository.createAppointment({
        ...input,
        caseId,
        dispatchAssignmentId,
        appointmentStatus: 'scheduled',
        actorId: actor?.id || null
      }, client);

      await this.caseRepository.updateAppointmentSummary(
        caseId,
        {
          status: 'scheduled',
          scheduledAt: appointment.scheduled_start_at,
          appointmentStatus: 'confirmed'
        },
        actor?.id || null,
        client
      );

      await this.messageService.createMessage(
        caseId,
        {
          messageType: 'workflow_event',
          bodyText: '已預約到府',
          senderType: 'system',
          timelineSource: 'appointment'
        },
        actor,
        req,
        client
      );

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'appointment.created',
        entityType: 'case',
        entityId: caseId,
        afterData: {
          appointmentId: appointment.id,
          scheduledStartAt: appointment.scheduled_start_at,
          scheduledEndAt: appointment.scheduled_end_at,
          visitType: appointment.visit_type,
          visitSequence: appointment.visit_sequence,
          visitResult: appointment.visit_result,
          nextAction: appointment.next_action,
          actualArrivalAt: appointment.actual_arrival_at,
          actualFinishedAt: appointment.actual_finished_at
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: { requestId: req?.requestId || null }
      }, client);

      return toAppointmentDTO(appointment);
    });
  }

  async rescheduleAppointment(appointmentId, input, actor, req = null) {
    if ((input.scheduledStartAt && !input.scheduledEndAt) || (!input.scheduledStartAt && input.scheduledEndAt)) {
      throw new ValidationError('Both scheduledStartAt and scheduledEndAt are required when rescheduling.', [
        { field: 'scheduledStartAt', message: 'Both start and end are required.', code: 'required_pair' }
      ]);
    }
    if (input.scheduledStartAt && input.scheduledEndAt) validateTimeRange(input);

    return withTransaction(async (client) => {
      const existing = await this.appointmentRepository.getAppointmentById(appointmentId, client);
      if (!existing) throw new NotFoundError('Appointment not found.');
      await this.ensureCase(existing.case_id, client, actor);
      validateActualTimeRange(input, existing);

      const nextStatus = input.appointmentStatus ||
        (input.visitResult === 'completed' ? 'completed' : undefined) ||
        (input.scheduledStartAt ? 'rescheduled' : undefined);
      ensureAppointmentCompletionConsistency(existing, input, nextStatus);
      const nextState = buildNextAppointmentState(existing, input, nextStatus);
      if (!isAppointmentOpen(existing) && isAppointmentOpen(nextState)) {
        await this.assertNoOtherOpenAppointment(
          existing.case_id,
          { excludeAppointmentId: existing.id },
          client
        );
      }
      const updated = await this.appointmentRepository.updateAppointment(
        appointmentId,
        {
          ...input,
          appointmentStatus: nextStatus,
          actorId: actor?.id || null
        },
        client
      );

      if (updated.appointment_status === 'rescheduled' || input.scheduledStartAt) {
        await this.caseRepository.updateAppointmentSummary(
          updated.case_id,
          {
            status: 'scheduled',
            scheduledAt: updated.scheduled_start_at,
            appointmentStatus: 'reschedule_requested'
          },
          actor?.id || null,
          client
        );
      }

      await this.messageService.createMessage(
        updated.case_id,
        {
          messageType: 'workflow_event',
          bodyText: getAppointmentUpdateMessage(updated, input),
          senderType: 'system',
          timelineSource: 'appointment'
        },
        actor,
        req,
        client
      );

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: getAppointmentUpdateAction(updated, input),
        entityType: 'case',
        entityId: updated.case_id,
        beforeData: {
          appointmentId: existing.id,
          scheduledStartAt: existing.scheduled_start_at,
          scheduledEndAt: existing.scheduled_end_at,
          appointmentStatus: existing.appointment_status,
          visitSequence: existing.visit_sequence,
          visitResult: existing.visit_result,
          nextAction: existing.next_action,
          actualArrivalAt: existing.actual_arrival_at,
          actualFinishedAt: existing.actual_finished_at
        },
        afterData: {
          appointmentId: updated.id,
          scheduledStartAt: updated.scheduled_start_at,
          scheduledEndAt: updated.scheduled_end_at,
          appointmentStatus: updated.appointment_status,
          rescheduleReason: updated.reschedule_reason,
          visitSequence: updated.visit_sequence,
          visitResult: updated.visit_result,
          nextAction: updated.next_action,
          actualArrivalAt: updated.actual_arrival_at,
          actualFinishedAt: updated.actual_finished_at
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: { requestId: req?.requestId || null }
      }, client);

      return toAppointmentDTO(updated);
    });
  }

  async cancelAppointment(appointmentId, input, actor, req = null) {
    return this.rescheduleAppointment(
      appointmentId,
      {
        ...input,
        appointmentStatus: 'cancelled'
      },
      actor,
      req
    );
  }

  async listAppointments(caseId, query, actor) {
    await this.ensureCase(caseId, undefined, actor);
    const result = await this.appointmentRepository.listAppointments({
      filters: { caseId },
      pagination: { limit: query.limit, offset: query.offset }
    });

    return {
      data: result.rows.map(toAppointmentDTO),
      pagination: result.pagination
    };
  }
}

module.exports = {
  AppointmentService,
  validateTimeRange
};
