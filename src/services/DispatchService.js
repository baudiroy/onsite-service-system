const { DispatchRepository } = require('../repositories/DispatchRepository');
const { CaseRepository } = require('../repositories/CaseRepository');
const { UserRepository } = require('../repositories/UserRepository');
const { DispatchUnitRepository } = require('../repositories/DispatchUnitRepository');
const { UserOrganizationRepository } = require('../repositories/UserOrganizationRepository');
const { AuditService } = require('./AuditService');
const { OrganizationAccessService } = require('./OrganizationAccessService');
const { MessageService } = require('./MessageService');
const { withTransaction } = require('../db/transaction');
const { InvalidStatusTransitionError, NotFoundError, ValidationError } = require('../utils/errors');
const { toDispatchAssignmentDTO } = require('../mappers/dispatchMapper');

class DispatchService {
  constructor({
    dispatchRepository = new DispatchRepository(),
    caseRepository = new CaseRepository(),
    userRepository = new UserRepository(),
    dispatchUnitRepository = new DispatchUnitRepository(),
    userOrganizationRepository = new UserOrganizationRepository(),
    auditService = new AuditService(),
    messageService = new MessageService(),
    organizationAccessService = new OrganizationAccessService()
  } = {}) {
    this.dispatchRepository = dispatchRepository;
    this.caseRepository = caseRepository;
    this.userRepository = userRepository;
    this.dispatchUnitRepository = dispatchUnitRepository;
    this.userOrganizationRepository = userOrganizationRepository;
    this.auditService = auditService;
    this.messageService = messageService;
    this.organizationAccessService = organizationAccessService;
  }

  async ensureCaseForDispatch(caseId, client, actor = null) {
    const caseRow = await this.caseRepository.getCaseById(caseId, client);

    if (!caseRow) throw new NotFoundError('Case not found.');

    if (actor) {
      await this.organizationAccessService.assertAccess(actor, caseRow.organization_id, client);
    }

    if (!['accepted', 'dispatch_pending', 'assigned'].includes(caseRow.status)) {
      throw new InvalidStatusTransitionError('Case must be accepted before dispatch assignment.');
    }

    return caseRow;
  }

  async ensureEngineer(engineerId, organizationId, client) {
    if (!engineerId) return null;
    const engineer = await this.userRepository.findById(engineerId, client);

    if (!engineer || engineer.user_type !== 'engineer') {
      throw new ValidationError('assignedEngineerId must reference an active engineer user.', [
        {
          field: 'assignedEngineerId',
          message: 'assignedEngineerId must reference an engineer user.',
          code: 'invalid_reference'
        }
      ]);
    }

    if (organizationId) {
      const hasMembership = await this.userOrganizationRepository.hasUserOrganization(engineerId, organizationId, client);
      if (!hasMembership) {
        throw new ValidationError('assignedEngineerId must be a member of the case organization.', [
          {
            field: 'assignedEngineerId',
            message: 'assignedEngineerId must be a member of the case organization.',
            code: 'organization_mismatch'
          }
        ]);
      }
    }

    return engineer;
  }

  async ensureDispatchUnitForCase(dispatchUnitId, caseRow, client) {
    const dispatchUnit = await this.dispatchUnitRepository.getDispatchUnitById(dispatchUnitId, client);

    if (!dispatchUnit) {
      throw new ValidationError('dispatchUnitId must reference an active dispatch unit.', [
        { field: 'dispatchUnitId', message: 'dispatchUnitId must reference an active dispatch unit.', code: 'invalid_reference' }
      ]);
    }

    if ((dispatchUnit.organization_id || null) !== (caseRow.organization_id || null)) {
      throw new ValidationError('dispatchUnitId must belong to the same organization as the case.', [
        { field: 'dispatchUnitId', message: 'dispatchUnitId must belong to the same organization as the case.', code: 'organization_mismatch' }
      ]);
    }

    return dispatchUnit;
  }

  async markDispatchPending(caseId, actor, req = null, client) {
    await this.ensureCaseForDispatch(caseId, client, actor);

    await this.caseRepository.updateDispatchSummary(
      caseId,
      { status: 'dispatch_pending' },
      actor?.id || null,
      client
    );

    await this.messageService.createMessage(
      caseId,
      {
        messageType: 'workflow_event',
        bodyText: '案件已進入待派工狀態',
        senderType: 'system',
        timelineSource: 'dispatch'
      },
      actor,
      req,
      client
    );
  }

  async assignDispatchUnit(caseId, input, actor, req = null) {
    return withTransaction(async (client) => {
      const caseRow = await this.ensureCaseForDispatch(caseId, client, actor);
      await this.ensureDispatchUnitForCase(input.dispatchUnitId, caseRow, client);
      await this.ensureEngineer(input.assignedEngineerId, caseRow.organization_id, client);

      const dispatchStatus = input.assignedEngineerId ? 'assigned' : 'pending';
      const assignment = await this.dispatchRepository.createDispatchAssignment({
        caseId,
        dispatchUnitId: input.dispatchUnitId,
        assignedEngineerId: input.assignedEngineerId,
        dispatchStatus,
        assignmentNote: input.assignmentNote,
        actorId: actor?.id || null
      }, client);

      await this.caseRepository.updateDispatchSummary(
        caseId,
        {
          status: input.assignedEngineerId ? 'assigned' : 'dispatch_pending',
          dispatchUnitId: input.dispatchUnitId,
          dispatchAssignmentSource: 'manual'
        },
        actor?.id || null,
        client
      );

      await this.messageService.createMessage(
        caseId,
        {
          messageType: 'workflow_event',
          bodyText: input.assignedEngineerId
            ? `已建立派工並指派工程師，派工人員：${actor?.displayName || '系統'}`
            : `已建立派工，派工人員：${actor?.displayName || '系統'}`,
          senderType: 'system',
          timelineSource: 'dispatch'
        },
        actor,
        req,
        client
      );

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'dispatch.created',
        entityType: 'case',
        entityId: caseId,
        afterData: {
          dispatchAssignmentId: assignment.id,
          dispatchUnitId: assignment.dispatch_unit_id,
          assignedEngineerId: assignment.assigned_engineer_id,
          assignedByUserId: assignment.assigned_by_user_id,
          dispatchStatus: assignment.dispatch_status
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: { requestId: req?.requestId || null }
      }, client);

      return toDispatchAssignmentDTO(assignment);
    });
  }

  async assignEngineer(caseId, input, actor, req = null) {
    return this.reassignEngineer(caseId, input, actor, req);
  }

  async reassignEngineer(caseId, input, actor, req = null) {
    return withTransaction(async (client) => {
      const caseRow = await this.ensureCaseForDispatch(caseId, client, actor);
      if (input.dispatchUnitId) await this.ensureDispatchUnitForCase(input.dispatchUnitId, caseRow, client);
      await this.ensureEngineer(input.assignedEngineerId, caseRow.organization_id, client);
      const existing = await this.dispatchRepository.getDispatchAssignmentByCaseId(caseId, client);

      if (!existing) throw new NotFoundError('Dispatch assignment not found.');

      const updated = await this.dispatchRepository.updateDispatchAssignment(
        existing.id,
        {
          dispatchUnitId: input.dispatchUnitId,
          assignedEngineerId: input.assignedEngineerId,
          dispatchStatus: input.dispatchStatus || 'assigned',
          assignmentNote: input.assignmentNote,
          actorId: actor?.id || null
        },
        client
      );

      await this.caseRepository.updateDispatchSummary(
        caseId,
        {
          status: updated.assigned_engineer_id ? 'assigned' : 'dispatch_pending',
          dispatchUnitId: updated.dispatch_unit_id,
          dispatchAssignmentSource: 'manual'
        },
        actor?.id || null,
        client
      );

      await this.messageService.createMessage(
        caseId,
        {
          messageType: 'workflow_event',
          bodyText: `已指派工程師，改派人員：${actor?.displayName || '系統'}`,
          senderType: 'system',
          timelineSource: 'dispatch'
        },
        actor,
        req,
        client
      );

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'dispatch.engineer_assigned',
        entityType: 'case',
        entityId: caseId,
        beforeData: {
          dispatchAssignmentId: existing.id,
          assignedEngineerId: existing.assigned_engineer_id,
          dispatchUnitId: existing.dispatch_unit_id
        },
        afterData: {
          dispatchAssignmentId: updated.id,
          assignedEngineerId: updated.assigned_engineer_id,
          dispatchUnitId: updated.dispatch_unit_id,
          reassignedByUserId: updated.reassigned_by_user_id,
          reassignedAt: updated.reassigned_at,
          dispatchStatus: updated.dispatch_status
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: { requestId: req?.requestId || null }
      }, client);

      return toDispatchAssignmentDTO(updated);
    });
  }
}

module.exports = {
  DispatchService
};
