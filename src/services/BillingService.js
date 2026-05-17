const { BillingRepository } = require('../repositories/BillingRepository');
const { SettlementRepository } = require('../repositories/SettlementRepository');
const { CaseRepository } = require('../repositories/CaseRepository');
const { FieldServiceReportRepository } = require('../repositories/FieldServiceReportRepository');
const { AuditService } = require('./AuditService');
const { OrganizationAccessService } = require('./OrganizationAccessService');
const { MessageService } = require('./MessageService');
const { withTransaction } = require('../db/transaction');
const { ConflictError, InvalidStatusTransitionError, NotFoundError, ValidationError } = require('../utils/errors');
const { toBillingRecordDTO, toSettlementDTO } = require('../mappers/billingMapper');

const BILLING_READY_STATUSES = new Set(['completed', 'closed']);

function calculateTotal(input) {
  const baseTotal = Number(input.laborAmount || 0)
    + Number(input.partsAmount || 0)
    + Number(input.transportAmount || 0)
    + Number(input.additionalAmount || 0);

  return input.totalAmount ?? baseTotal;
}

function validateBillingAmounts(input) {
  const totalAmount = calculateTotal(input);
  const customerChargeAmount = Number(input.customerChargeAmount || 0);
  const manufacturerClaimAmount = Number(input.manufacturerClaimAmount || 0);
  const warrantyAmount = Number(input.warrantyAmount || 0);

  if (customerChargeAmount + manufacturerClaimAmount + warrantyAmount > totalAmount) {
    throw new ValidationError('Settlement source amounts cannot exceed totalAmount.', [
      {
        field: 'customerChargeAmount',
        message: 'customerChargeAmount + manufacturerClaimAmount + warrantyAmount must not exceed totalAmount.',
        code: 'amount_sum_exceeds_total'
      }
    ]);
  }

  return totalAmount;
}

function validateSettlementAmount(billing, settlementAmount) {
  if (Number(settlementAmount || 0) > Number(billing.total_amount || 0)) {
    throw new ValidationError('settlementAmount cannot exceed billing totalAmount.', [
      {
        field: 'settlementAmount',
        message: 'settlementAmount cannot exceed billing totalAmount.',
        code: 'amount_exceeds_total'
      }
    ]);
  }
}

class BillingService {
  constructor({
    billingRepository = new BillingRepository(),
    settlementRepository = new SettlementRepository(),
    caseRepository = new CaseRepository(),
    fieldServiceReportRepository = new FieldServiceReportRepository(),
    auditService = new AuditService(),
    messageService = new MessageService(),
    organizationAccessService = new OrganizationAccessService()
  } = {}) {
    this.billingRepository = billingRepository;
    this.settlementRepository = settlementRepository;
    this.caseRepository = caseRepository;
    this.fieldServiceReportRepository = fieldServiceReportRepository;
    this.auditService = auditService;
    this.messageService = messageService;
    this.organizationAccessService = organizationAccessService;
  }

  async ensureCaseReadyForBilling(caseId, client, actor = null) {
    const caseRow = await this.caseRepository.getCaseById(caseId, client);
    if (!caseRow) throw new NotFoundError('Case not found.');

    if (actor) await this.organizationAccessService.assertAccess(actor, caseRow.organization_id, client);

    if (!BILLING_READY_STATUSES.has(caseRow.status)) {
      throw new InvalidStatusTransitionError('Case must be completed before billing record creation.');
    }

    return caseRow;
  }


  async assertBillingAccess(billing, actor, client) {
    const caseRow = await this.caseRepository.getCaseById(billing.case_id, client);
    if (!caseRow) throw new NotFoundError('Case not found.');
    if (actor) await this.organizationAccessService.assertAccess(actor, caseRow.organization_id, client);
    return caseRow;
  }

  async getBillingOrThrow(billingId, client) {
    const billing = await this.billingRepository.getBillingRecordById(billingId, client);
    if (!billing) throw new NotFoundError('Billing record not found.');
    return billing;
  }

  async createBillingRecord(caseId, input, actor, req = null) {
    return withTransaction(async (client) => {
      await this.ensureCaseReadyForBilling(caseId, client, actor);

      const existing = await this.billingRepository.getBillingRecordByCaseId(caseId, client);
      if (existing) {
        throw new ConflictError('Billing record already exists for this case.');
      }

      const report = input.fieldServiceReportId
        ? await this.fieldServiceReportRepository.getServiceReportById(input.fieldServiceReportId, client)
        : await this.fieldServiceReportRepository.getServiceReportByCaseId(caseId, client);

      if (input.fieldServiceReportId && (!report || report.case_id !== caseId)) {
        throw new ValidationError('fieldServiceReportId must reference this case.', [
          {
            field: 'fieldServiceReportId',
            message: 'fieldServiceReportId must reference this case.',
            code: 'invalid_reference'
          }
        ]);
      }

      const totalAmount = validateBillingAmounts(input);
      const billing = await this.billingRepository.createBillingRecord({
        ...input,
        caseId,
        fieldServiceReportId: report?.id || null,
        totalAmount,
        actorId: actor?.id || null
      }, client);

      await this.messageService.createMessage(
        caseId,
        {
          messageType: 'workflow_event',
          bodyText: '已建立帳務',
          senderType: 'system',
          timelineSource: 'billing'
        },
        actor,
        req,
        client
      );

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'billing.created',
        entityType: 'billing_record',
        entityId: billing.id,
        afterData: {
          caseId,
          fieldServiceReportId: billing.field_service_report_id,
          totalAmount: billing.total_amount,
          customerChargeAmount: billing.customer_charge_amount,
          manufacturerClaimAmount: billing.manufacturer_claim_amount,
          billingStatus: billing.billing_status
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: { requestId: req?.requestId || null }
      }, client);

      return toBillingRecordDTO(billing);
    });
  }

  async getBillingRecordByCaseId(caseId, actor) {
    const caseRow = await this.caseRepository.getCaseById(caseId);
    if (!caseRow) throw new NotFoundError('Case not found.');
    await this.organizationAccessService.assertAccess(actor, caseRow.organization_id);
    const billing = await this.billingRepository.getBillingRecordByCaseId(caseId);
    if (!billing) throw new NotFoundError('Billing record not found.');
    return toBillingRecordDTO(billing);
  }

  async updateBillingAmounts(billingId, input, actor, req = null) {
    return withTransaction(async (client) => {
      const existing = await this.getBillingOrThrow(billingId, client);
      await this.assertBillingAccess(existing, actor, client);
      const mergedAmounts = {
        laborAmount: input.laborAmount ?? existing.labor_amount,
        partsAmount: input.partsAmount ?? existing.parts_amount,
        transportAmount: input.transportAmount ?? existing.transport_amount,
        additionalAmount: input.additionalAmount ?? existing.additional_amount,
        totalAmount: input.totalAmount ?? undefined,
        warrantyAmount: input.warrantyAmount ?? existing.warranty_amount,
        customerChargeAmount: input.customerChargeAmount ?? existing.customer_charge_amount,
        manufacturerClaimAmount: input.manufacturerClaimAmount ?? existing.manufacturer_claim_amount
      };
      const totalAmount = validateBillingAmounts(mergedAmounts);
      const updated = await this.billingRepository.updateBillingRecord(
        billingId,
        {
          ...input,
          totalAmount,
          actorId: actor?.id || null
        },
        client
      );

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'billing.updated',
        entityType: 'billing_record',
        entityId: billingId,
        beforeData: {
          laborAmount: existing.labor_amount,
          partsAmount: existing.parts_amount,
          transportAmount: existing.transport_amount,
          additionalAmount: existing.additional_amount,
          totalAmount: existing.total_amount,
          billingStatus: existing.billing_status
        },
        afterData: {
          laborAmount: updated.labor_amount,
          partsAmount: updated.parts_amount,
          transportAmount: updated.transport_amount,
          additionalAmount: updated.additional_amount,
          totalAmount: updated.total_amount,
          billingStatus: updated.billing_status
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: { requestId: req?.requestId || null }
      }, client);

      return toBillingRecordDTO(updated);
    });
  }

  async submitSettlement(billingId, input, actor, req = null) {
    return withTransaction(async (client) => {
      const billing = await this.getBillingOrThrow(billingId, client);
      await this.assertBillingAccess(billing, actor, client);
      validateSettlementAmount(billing, input.settlementAmount);

      const settlement = await this.settlementRepository.createSettlementRecord({
        ...input,
        billingRecordId: billingId,
        settlementStatus: input.settlementStatus || 'submitted',
        actorId: actor?.id || null
      }, client);

      await this.billingRepository.updateBillingRecord(
        billingId,
        {
          billingStatus: 'submitted',
          actorId: actor?.id || null
        },
        client
      );

      await this.messageService.createMessage(
        billing.case_id,
        {
          messageType: 'workflow_event',
          bodyText: '已送出請款',
          senderType: 'system',
          timelineSource: 'billing'
        },
        actor,
        req,
        client
      );

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'settlement.submitted',
        entityType: 'settlement_record',
        entityId: settlement.id,
        afterData: {
          billingRecordId: billingId,
          caseId: billing.case_id,
          settlementTargetType: settlement.settlement_target_type,
          settlementTargetId: settlement.settlement_target_id,
          settlementAmount: settlement.settlement_amount,
          settlementStatus: settlement.settlement_status,
          settlementRuleCode: settlement.settlement_rule_code,
          settlementPolicyVersion: settlement.settlement_policy_version
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: { requestId: req?.requestId || null }
      }, client);

      return toSettlementDTO(settlement);
    });
  }

  async listSettlementRecords(billingId, query = {}, actor = null) {
    const billing = await this.getBillingOrThrow(billingId);
    await this.assertBillingAccess(billing, actor);
    const result = await this.settlementRepository.listSettlementRecords(billingId, {
      pagination: { limit: query.limit, offset: query.offset }
    });

    return {
      data: result.rows.map(toSettlementDTO),
      pagination: result.pagination
    };
  }

  async markSettlementCompleted(settlementId, input, actor, req = null) {
    return this.updateSettlementRecord(settlementId, {
      ...input,
      settlementStatus: input.settlementStatus || 'completed'
    }, actor, req);
  }

  async updateSettlementRecord(settlementId, input, actor, req = null) {
    return withTransaction(async (client) => {
      const existing = await this.settlementRepository.getSettlementRecordById(settlementId, client);
      if (!existing) throw new NotFoundError('Settlement record not found.');

      const billing = await this.getBillingOrThrow(existing.billing_record_id, client);
      await this.assertBillingAccess(billing, actor, client);
      if (input.settlementAmount !== undefined) {
        validateSettlementAmount(billing, input.settlementAmount);
      }

      const nextStatus = input.settlementStatus || existing.settlement_status;
      const settledAt = nextStatus === 'completed'
        ? input.settledAt || existing.settled_at || new Date().toISOString()
        : input.settledAt;
      const updated = await this.settlementRepository.updateSettlementRecord(
        settlementId,
        {
          ...input,
          settlementStatus: nextStatus,
          settledAt,
          actorId: actor?.id || null
        },
        client
      );

      if (updated.settlement_status === 'completed') {
        await this.billingRepository.updateBillingRecord(
          billing.id,
          {
            billingStatus: 'settled',
            actorId: actor?.id || null
          },
          client
        );
      }

      const timelineText = updated.settlement_status === 'completed'
        ? '已完成結算'
        : updated.settlement_status === 'rejected'
          ? '原廠退件'
          : '已送出請款';

      await this.messageService.createMessage(
        billing.case_id,
        {
          messageType: 'workflow_event',
          bodyText: timelineText,
          senderType: 'system',
          timelineSource: 'billing'
        },
        actor,
        req,
        client
      );

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: updated.settlement_status === 'completed'
          ? 'settlement.completed'
          : updated.settlement_status === 'rejected'
            ? 'settlement.rejected'
            : 'settlement.updated',
        entityType: 'settlement_record',
        entityId: settlementId,
        beforeData: {
          settlementAmount: existing.settlement_amount,
          settlementStatus: existing.settlement_status,
          settledAt: existing.settled_at
        },
        afterData: {
          billingRecordId: updated.billing_record_id,
          settlementAmount: updated.settlement_amount,
          settlementStatus: updated.settlement_status,
          settlementRuleCode: updated.settlement_rule_code,
          settlementPolicyVersion: updated.settlement_policy_version,
          settledAt: updated.settled_at
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: { requestId: req?.requestId || null }
      }, client);

      return toSettlementDTO(updated);
    });
  }
}

module.exports = {
  BillingService,
  calculateTotal,
  validateBillingAmounts,
  validateSettlementAmount
};
