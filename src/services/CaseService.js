const crypto = require('node:crypto');

const { CaseRepository } = require('../repositories/CaseRepository');
const { CustomerService } = require('./CustomerService');
const { AuditService } = require('./AuditService');
const { OrganizationAccessService } = require('./OrganizationAccessService');
const { withTransaction } = require('../db/transaction');
const { ConflictError, NotFoundError, ValidationError } = require('../utils/errors');
const { toAdminCaseDTO } = require('../mappers/caseMapper');

const FORBIDDEN_UPDATE_FIELDS = new Set([
  'id',
  'organizationId',
  'intakeLineChannelId',
  'caseNo',
  'customerId',
  'customer',
  'status',
  'appointmentStatus',
  'completionStatus',
  'source',
  'aiSummary',
  'aiClassification',
  'aiConfidence',
  'aiSuggestedDispatchUnitId',
  'aiOcrStatus',
  'dispatchUnitId',
  'dispatchAssignmentSource',
  'customerSnapshot',
  'metadata',
  'createdAt',
  'updatedAt',
  'createdBy',
  'updatedBy',
  'submittedAt',
  'reviewedAt',
  'acceptedAt',
  'rejectedAt',
  'cancelledAt',
  'scheduledAt',
  'completedAt',
  'lastCustomerMessageAt',
  'lastInternalActivityAt',
  'deletedAt'
]);

const IMPORTANT_FIELDS = [
  'priority',
  'warrantyStatus',
  'brand',
  'caseType',
  'productType',
  'modelNo',
  'serialNo',
  'invoiceDate',
  'problemDescription',
  'preferredVisitTime',
  'serviceRegion'
];

function createCaseNo(now = new Date()) {
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const random = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  return `TW-${yyyy}${mm}${dd}-${random}`;
}

function buildCustomerSnapshot(customer) {
  return {
    organization_id: customer.organization_id || null,
    organization_code: customer.organization_code || null,
    organization_name: customer.organization_name || null,
    customer_name: customer.customer_name,
    mobile: customer.mobile,
    tel: customer.tel,
    city: customer.city,
    address: customer.address
  };
}

function pickImportantChanges(beforeDto, afterDto) {
  const beforeData = {};
  const afterData = {};

  for (const field of IMPORTANT_FIELDS) {
    if (beforeDto[field] !== afterDto[field]) {
      beforeData[field] = beforeDto[field] ?? null;
      afterData[field] = afterDto[field] ?? null;
    }
  }

  return {
    beforeData,
    afterData,
    hasChanges: Object.keys(afterData).length > 0
  };
}

class CaseService {
  constructor({
    caseRepository = new CaseRepository(),
    customerService = new CustomerService(),
    auditService = new AuditService(),
    organizationAccessService = new OrganizationAccessService()
  } = {}) {
    this.caseRepository = caseRepository;
    this.customerService = customerService;
    this.auditService = auditService;
    this.organizationAccessService = organizationAccessService;
  }

  async createCase(input, actor, req = null) {
    return withTransaction(async (client) => {
      const caseInput = input.case;
      if (input.organizationId && caseInput.organizationId && input.organizationId !== caseInput.organizationId) {
        throw new ValidationError('Conflicting organizationId values.', [
          { field: 'organizationId', message: 'Top-level organizationId and case.organizationId must match.', code: 'conflict' }
        ]);
      }
      const requestedOrganizationId = input.organizationId || caseInput.organizationId || null;
      const organizationId = this.organizationAccessService.resolveCreateOrganizationId(
        actor,
        requestedOrganizationId
      );
      await this.organizationAccessService.assertAccess(actor, organizationId, client);

      const customerLink = await this.customerService.findOrCreateCustomerForAdminCase(
        input.customer,
        actor,
        req,
        client,
        organizationId
      );

      const createdCase = await this.caseRepository.createCase({
        ...caseInput,
        organizationId,
        intakeLineChannelId: caseInput.intakeLineChannelId || null,
        customerId: customerLink.customer.id,
        caseNo: createCaseNo(),
        customerSnapshot: buildCustomerSnapshot(customerLink.customer),
        actorId: actor?.id || null
      }, client);

      const createdCaseWithCustomer = await this.caseRepository.getCaseById(createdCase.id, client);
      const dto = toAdminCaseDTO(createdCaseWithCustomer);

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'case.created',
        entityType: 'case',
        entityId: createdCase.id,
        afterData: {
          id: dto.id,
          organizationId: dto.organizationId,
          caseNo: dto.caseNo,
          status: dto.status,
          source: dto.source,
          customerId: dto.customerId
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: {
          requestId: req?.requestId || null,
          customerLinkMode: customerLink.linkMode,
          customerCreated: customerLink.created
        }
      }, client);

      return dto;
    });
  }

  async getCaseById(caseId, actor) {
    const row = await this.caseRepository.getCaseById(caseId);

    if (!row) {
      throw new NotFoundError('Case not found.');
    }

    await this.organizationAccessService.assertAccess(actor, row.organization_id);
    return toAdminCaseDTO(row);
  }

  async listCases(query, actor) {
    const scopedFilter = await this.organizationAccessService.buildScopedFilter(actor, query.organizationId || null);
    const result = await this.caseRepository.listCases({
      filters: {
        ...query,
        ...scopedFilter
      },
      pagination: {
        limit: query.limit,
        offset: query.offset
      },
      sort: query.sort
    });

    return {
      data: result.rows.map(toAdminCaseDTO),
      pagination: result.pagination
    };
  }

  async updateCase(caseId, updates, actor, req = null) {
    for (const field of Object.keys(updates)) {
      if (FORBIDDEN_UPDATE_FIELDS.has(field)) {
        throw new ConflictError(`Field cannot be updated through this endpoint: ${field}`);
      }
    }

    return withTransaction(async (client) => {
      const existing = await this.caseRepository.getCaseById(caseId, client);

      if (!existing) {
        throw new NotFoundError('Case not found.');
      }

      await this.organizationAccessService.assertAccess(actor, existing.organization_id, client);
      const beforeDto = toAdminCaseDTO(existing);
      const updated = await this.caseRepository.updateCase(
        caseId,
        updates,
        actor?.id || null,
        client
      );
      const afterDto = toAdminCaseDTO(updated);
      const changes = pickImportantChanges(beforeDto, afterDto);

      if (changes.hasChanges) {
        await this.auditService.record({
          actorType: actor?.userType || 'admin',
          actorId: actor?.id || null,
          actorDisplayName: actor?.displayName || null,
          action: 'case.updated',
          entityType: 'case',
          entityId: caseId,
          beforeData: changes.beforeData,
          afterData: changes.afterData,
          ipAddress: req?.ip || null,
          userAgent: req?.get?.('user-agent') || null,
          metadata: {
            requestId: req?.requestId || null,
            organizationId: existing.organization_id || null
          }
        }, client);
      }

      return afterDto;
    });
  }
}

module.exports = {
  CaseService,
  createCaseNo,
  buildCustomerSnapshot
};
