const { CaseRepository } = require('../repositories/CaseRepository');
const { BillingRepository } = require('../repositories/BillingRepository');
const { SettlementRepository } = require('../repositories/SettlementRepository');
const { AuditService } = require('./AuditService');
const { MessageService } = require('./MessageService');
const { OrganizationAccessService } = require('./OrganizationAccessService');
const { withTransaction } = require('../db/transaction');
const {
  InvalidStatusTransitionError,
  NotFoundError,
  PermissionError,
  ValidationError
} = require('../utils/errors');
const { toAdminCaseDTO } = require('../mappers/caseMapper');

const TRANSITIONS = Object.freeze({
  submit: {
    toStatus: 'submitted',
    fromStatuses: ['draft', 'pending_customer'],
    timestampField: 'submittedAt'
  },
  review: {
    toStatus: 'reviewing',
    fromStatuses: ['submitted'],
    timestampField: 'reviewedAt'
  },
  accept: {
    toStatus: 'accepted',
    fromStatuses: ['reviewing'],
    timestampField: 'acceptedAt',
    humanFinalDecision: true
  },
  reject: {
    toStatus: 'rejected',
    fromStatuses: ['reviewing'],
    timestampField: 'rejectedAt',
    humanFinalDecision: true,
    reasonRequired: true
  },
  cancel: {
    toStatus: 'cancelled',
    fromStatuses: ['submitted', 'reviewing'],
    timestampField: 'cancelledAt',
    humanFinalDecision: true,
    reasonRequired: true
  },
  close: {
    toStatus: 'closed',
    fromStatuses: ['completed'],
    timestampField: 'closedAt',
    humanFinalDecision: true
  }
});

const BILLING_CLOSE_READY_STATUSES = new Set(['approved', 'settled']);

function isBlank(value) {
  return typeof value !== 'string' || value.trim().length === 0;
}

function validateSubmittedRequirements(caseRow) {
  const details = [];

  const requiredCaseFields = [
    ['customerId', caseRow.customer_id],
    ['brand', caseRow.brand],
    ['caseType', caseRow.case_type],
    ['productType', caseRow.product_type],
    ['modelNo', caseRow.model_no],
    ['problemDescription', caseRow.problem_description]
  ];

  for (const [field, value] of requiredCaseFields) {
    if (isBlank(value)) {
      details.push({
        field,
        message: `${field} is required before submitting a case.`,
        code: 'required'
      });
    }
  }

  if (isBlank(caseRow.customer_mobile)) {
    details.push({
      field: 'customer.mobile',
      message: 'Customer mobile is required before submitting a case.',
      code: 'required'
    });
  }

  if (isBlank(caseRow.customer_city)) {
    details.push({
      field: 'customer.city',
      message: 'Customer city is required before submitting a case.',
      code: 'required'
    });
  }

  if (isBlank(caseRow.customer_address)) {
    details.push({
      field: 'customer.address',
      message: 'Customer address is required before submitting a case.',
      code: 'required'
    });
  }

  if (details.length > 0) {
    throw new ValidationError('Case is missing required fields for submission.', details);
  }
}

class WorkflowService {
  constructor({
    caseRepository = new CaseRepository(),
    billingRepository = new BillingRepository(),
    settlementRepository = new SettlementRepository(),
    auditService = new AuditService(),
    messageService = new MessageService(),
    organizationAccessService = new OrganizationAccessService()
  } = {}) {
    this.caseRepository = caseRepository;
    this.billingRepository = billingRepository;
    this.settlementRepository = settlementRepository;
    this.auditService = auditService;
    this.messageService = messageService;
    this.organizationAccessService = organizationAccessService;
  }

  ensureAllowedTransition(action, currentStatus) {
    const transition = TRANSITIONS[action];

    if (!transition || !transition.fromStatuses.includes(currentStatus)) {
      throw new InvalidStatusTransitionError(
        `Cannot ${action} case from status ${currentStatus}.`
      );
    }

    return transition;
  }

  ensureAiBoundary(action, actor) {
    const transition = TRANSITIONS[action];

    if (transition?.humanFinalDecision && actor?.userType === 'ai') {
      throw new PermissionError('AI cannot make final workflow decisions.');
    }
  }

  async transitionCase(caseId, action, input = {}, actor, req = null) {
    const transition = TRANSITIONS[action];

    if (!transition) {
      throw new InvalidStatusTransitionError('Unsupported workflow transition.');
    }

    if (transition.reasonRequired && isBlank(input.reason)) {
      throw new ValidationError('Reason is required for this transition.', [
        {
          field: 'reason',
          message: 'Reason is required.',
          code: 'required'
        }
      ]);
    }

    this.ensureAiBoundary(action, actor);

    return withTransaction(async (client) => {
      const existing = await this.caseRepository.getCaseById(caseId, client);

      if (!existing) {
        throw new NotFoundError('Case not found.');
      }

      await this.organizationAccessService.assertAccess(actor, existing.organization_id, client);
      this.ensureAllowedTransition(action, existing.status);

      if (action === 'submit') {
        validateSubmittedRequirements(existing);
      }

      if (action === 'close') {
        await this.validateCloseRequirements(existing, client);
      }

      const beforeDto = toAdminCaseDTO(existing);
      const updated = await this.caseRepository.updateCaseStatus({
        caseId,
        status: transition.toStatus,
        timestampField: transition.timestampField,
        actorId: actor?.id || null
      }, client);
      const afterDto = toAdminCaseDTO(updated);

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'case.status_changed',
        entityType: 'case',
        entityId: caseId,
        beforeData: {
          status: beforeDto.status,
          [transition.timestampField]: beforeDto[transition.timestampField] || null
        },
        afterData: {
          status: afterDto.status,
          [transition.timestampField]: afterDto[transition.timestampField] || null
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: {
          requestId: req?.requestId || null,
          transition: action,
          note: input.note || null,
          reason: input.reason || null,
          futureNote: action === 'reject' || action === 'cancel'
            ? 'Reason may also be recorded in case_messages when MessageService is implemented.'
            : null
        }
      }, client);

      return afterDto;
    });
  }

  async validateCloseRequirements(caseRow, client) {
    if (!caseRow.completed_at) {
      throw new ValidationError('completedAt is required before closing a case.', [
        { field: 'completedAt', message: 'completedAt is required before closing a case.', code: 'required' }
      ]);
    }

    const billing = await this.billingRepository.getBillingRecordByCaseId(caseRow.id, client);

    if (!billing) return;

    if (!BILLING_CLOSE_READY_STATUSES.has(billing.billing_status)) {
      throw new ValidationError('Billing record is not ready for case close.', [
        {
          field: 'billingStatus',
          message: 'Billing status must be approved or settled before closing.',
          code: 'invalid_state'
        }
      ]);
    }

    const hasOpenSettlements = await this.settlementRepository.hasOpenSettlementRecords(billing.id, client);

    if (hasOpenSettlements) {
      throw new ValidationError('Open settlement records must be completed or rejected before closing.', [
        {
          field: 'settlements',
          message: 'Settlement records cannot remain pending or submitted before closing.',
          code: 'invalid_state'
        }
      ]);
    }
  }

  async closeCase(caseId, input = {}, actor, req = null) {
    this.ensureAiBoundary('close', actor);

    return withTransaction(async (client) => {
      const existing = await this.caseRepository.getCaseById(caseId, client);

      if (!existing) {
        throw new NotFoundError('Case not found.');
      }

      await this.organizationAccessService.assertAccess(actor, existing.organization_id, client);
      const transition = this.ensureAllowedTransition('close', existing.status);
      await this.validateCloseRequirements(existing, client);

      const beforeDto = toAdminCaseDTO(existing);
      const updated = await this.caseRepository.updateCaseStatus({
        caseId,
        status: transition.toStatus,
        timestampField: transition.timestampField,
        actorId: actor?.id || null
      }, client);
      const afterDto = toAdminCaseDTO(updated);

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'case.closed',
        entityType: 'case',
        entityId: caseId,
        beforeData: {
          status: beforeDto.status,
          closedAt: beforeDto.closedAt || null
        },
        afterData: {
          status: afterDto.status,
          closedAt: afterDto.closedAt || null
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: {
          requestId: req?.requestId || null,
          previousStatus: beforeDto.status,
          newStatus: afterDto.status,
          note: input.note || null,
          closedByUserId: actor?.id || null,
          organizationId: existing.organization_id || null
        }
      }, client);

      await this.messageService.createMessage(
        caseId,
        {
          messageType: 'workflow_event',
          senderType: 'system',
          channel: 'admin',
          bodyText: '案件已結案',
          metadata: {
            timelineSource: 'workflow',
            transition: 'close',
            customerVisible: false,
            note: input.note || null
          }
        },
        actor,
        req,
        client
      );

      return afterDto;
    });
  }
}

module.exports = {
  WorkflowService,
  TRANSITIONS,
  validateSubmittedRequirements,
  BILLING_CLOSE_READY_STATUSES
};
