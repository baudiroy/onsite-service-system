const { DispatchUnitRepository } = require('../repositories/DispatchUnitRepository');
const { OrganizationRepository } = require('../repositories/OrganizationRepository');
const { AuditService } = require('./AuditService');
const { OrganizationAccessService, isSystemOrSuperAdmin } = require('./OrganizationAccessService');
const { withTransaction } = require('../db/transaction');
const { toDispatchUnitDTO } = require('../mappers/dispatchUnitMapper');
const { ConflictError, NotFoundError, PermissionError, ValidationError } = require('../utils/errors');

function statusToEnabled(status) {
  if (!status) return undefined;
  return status === 'active';
}

function dbErrorToConflict(error) {
  if (error?.code === '23505') {
    throw new ConflictError('dispatch unit code already exists in this organization.');
  }

  throw error;
}

function pickDispatchUnitChanges(beforeRow, afterRow) {
  const beforeData = {};
  const afterData = {};
  const fields = [
    ['name', 'name'],
    ['code', 'code'],
    ['serviceRegion', 'service_region'],
    ['status', 'enabled'],
    ['city', 'city'],
    ['productTypes', 'product_types'],
    ['priority', 'priority'],
    ['routingRules', 'routing_rules'],
    ['metadata', 'metadata']
  ];

  for (const [dtoField, dbField] of fields) {
    const beforeValue = dbField === 'enabled'
      ? (beforeRow[dbField] ? 'active' : 'disabled')
      : beforeRow[dbField];
    const afterValue = dbField === 'enabled'
      ? (afterRow[dbField] ? 'active' : 'disabled')
      : afterRow[dbField];

    if (JSON.stringify(beforeValue ?? null) !== JSON.stringify(afterValue ?? null)) {
      beforeData[dtoField] = beforeValue ?? null;
      afterData[dtoField] = afterValue ?? null;
    }
  }

  return {
    beforeData,
    afterData,
    hasChanges: Object.keys(afterData).length > 0
  };
}

class DispatchUnitService {
  constructor({
    dispatchUnitRepository = new DispatchUnitRepository(),
    organizationRepository = new OrganizationRepository(),
    organizationAccessService = new OrganizationAccessService(),
    auditService = new AuditService()
  } = {}) {
    this.dispatchUnitRepository = dispatchUnitRepository;
    this.organizationRepository = organizationRepository;
    this.organizationAccessService = organizationAccessService;
    this.auditService = auditService;
  }

  async assertDispatchUnitAccess(actor, dispatchUnit, client) {
    if (!dispatchUnit.organization_id && !isSystemOrSuperAdmin(actor)) {
      throw new PermissionError('Organization access denied.');
    }

    await this.organizationAccessService.assertAccess(actor, dispatchUnit.organization_id, client);
  }

  async assertOrganizationExistsAndAccessible(organizationId, actor, client) {
    const organization = await this.organizationRepository.getOrganizationById(organizationId, client);
    if (!organization) {
      throw new ValidationError('Invalid organizationId.', [
        { field: 'organizationId', message: 'Organization does not exist or is deleted.', code: 'invalid_reference' }
      ]);
    }

    await this.organizationAccessService.assertAccess(actor, organization.id, client);
    return organization;
  }

  async createDispatchUnit(input, actor, req = null) {
    return withTransaction(async (client) => {
      await this.assertOrganizationExistsAndAccessible(input.organizationId, actor, client);

      try {
        const dispatchUnit = await this.dispatchUnitRepository.createDispatchUnit({
          organizationId: input.organizationId,
          name: input.name,
          code: input.code,
          serviceRegion: input.serviceRegion || null,
          city: input.city || null,
          productTypes: input.productTypes || [],
          enabled: statusToEnabled(input.status) ?? true,
          priority: input.priority ?? 100,
          routingRules: input.routingRules || null,
          metadata: input.metadata || null
        }, client);

        await this.auditService.record({
          actorType: actor?.userType || 'admin',
          actorId: actor?.id || null,
          actorDisplayName: actor?.displayName || null,
          action: 'dispatch_unit.created',
          entityType: 'dispatch_unit',
          entityId: dispatchUnit.id,
          afterData: toDispatchUnitDTO(dispatchUnit),
          ipAddress: req?.ip || null,
          userAgent: req?.get?.('user-agent') || null,
          metadata: {
            requestId: req?.requestId || null,
            organizationId: dispatchUnit.organization_id
          }
        }, client);

        return toDispatchUnitDTO(dispatchUnit);
      } catch (error) {
        dbErrorToConflict(error);
      }
    });
  }

  async getDispatchUnit(dispatchUnitId, actor) {
    const dispatchUnit = await this.dispatchUnitRepository.getDispatchUnitById(dispatchUnitId);
    if (!dispatchUnit) throw new NotFoundError('Dispatch unit not found.');

    await this.assertDispatchUnitAccess(actor, dispatchUnit);
    return toDispatchUnitDTO(dispatchUnit);
  }

  async listDispatchUnits(query = {}, actor) {
    const scopedFilter = await this.organizationAccessService.buildScopedFilter(actor, query.organizationId || null);
    const result = await this.dispatchUnitRepository.listDispatchUnits({
      filters: {
        organizationId: scopedFilter.organizationId,
        organizationIds: scopedFilter.organizationIds,
        q: query.q,
        status: query.status,
        serviceRegion: query.serviceRegion
      },
      pagination: {
        limit: query.limit,
        offset: query.offset
      },
      sort: query.sort
    });

    return {
      data: result.rows.map(toDispatchUnitDTO),
      pagination: result.pagination
    };
  }

  async updateDispatchUnit(dispatchUnitId, input, actor, req = null) {
    return withTransaction(async (client) => {
      const existing = await this.dispatchUnitRepository.getDispatchUnitById(dispatchUnitId, client);
      if (!existing) throw new NotFoundError('Dispatch unit not found.');

      await this.assertDispatchUnitAccess(actor, existing, client);

      try {
        const updated = await this.dispatchUnitRepository.updateDispatchUnit(dispatchUnitId, {
          name: input.name,
          code: input.code,
          serviceRegion: input.serviceRegion,
          city: input.city,
          productTypes: input.productTypes,
          enabled: statusToEnabled(input.status),
          priority: input.priority,
          routingRules: input.routingRules,
          metadata: input.metadata
        }, client);

        const changes = pickDispatchUnitChanges(existing, updated);

        if (changes.hasChanges) {
          await this.auditService.record({
            actorType: actor?.userType || 'admin',
            actorId: actor?.id || null,
            actorDisplayName: actor?.displayName || null,
            action: 'dispatch_unit.updated',
            entityType: 'dispatch_unit',
            entityId: dispatchUnitId,
            beforeData: changes.beforeData,
            afterData: changes.afterData,
            ipAddress: req?.ip || null,
            userAgent: req?.get?.('user-agent') || null,
            metadata: {
              requestId: req?.requestId || null,
              organizationId: updated.organization_id
            }
          }, client);
        }

        return toDispatchUnitDTO(updated);
      } catch (error) {
        dbErrorToConflict(error);
      }
    });
  }

  async disableDispatchUnit(dispatchUnitId, actor, req = null) {
    return withTransaction(async (client) => {
      const existing = await this.dispatchUnitRepository.getDispatchUnitById(dispatchUnitId, client);
      if (!existing) throw new NotFoundError('Dispatch unit not found.');

      await this.assertDispatchUnitAccess(actor, existing, client);

      const updated = await this.dispatchUnitRepository.disableDispatchUnit(dispatchUnitId, client);

      if (existing.enabled) {
        await this.auditService.record({
          actorType: actor?.userType || 'admin',
          actorId: actor?.id || null,
          actorDisplayName: actor?.displayName || null,
          action: 'dispatch_unit.disabled',
          entityType: 'dispatch_unit',
          entityId: dispatchUnitId,
          beforeData: { status: 'active' },
          afterData: { status: 'disabled' },
          ipAddress: req?.ip || null,
          userAgent: req?.get?.('user-agent') || null,
          metadata: {
            requestId: req?.requestId || null,
            organizationId: updated.organization_id
          }
        }, client);
      }

      return toDispatchUnitDTO(updated);
    });
  }
}

module.exports = {
  DispatchUnitService
};
