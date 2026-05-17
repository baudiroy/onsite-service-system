const { AuditLogRepository } = require('../repositories/AuditLogRepository');
const { isSystemOrSuperAdmin } = require('./OrganizationAccessService');
const { toAuditLogDTO } = require('../mappers/auditLogMapper');
const { NotFoundError, PermissionError } = require('../utils/errors');

class AuditLogService {
  constructor({ auditLogRepository = new AuditLogRepository() } = {}) {
    this.auditLogRepository = auditLogRepository;
  }

  assertCanReadGlobalAuditLogs(actor) {
    if (!isSystemOrSuperAdmin(actor)) {
      throw new PermissionError('System or super admin access required.');
    }
  }

  async listAuditLogs(query = {}, actor = null) {
    this.assertCanReadGlobalAuditLogs(actor);

    const result = await this.auditLogRepository.listAuditLogs({
      filters: {
        actorUserId: query.actorUserId,
        action: query.action,
        entityType: query.entityType,
        entityId: query.entityId,
        organizationId: query.organizationId,
        requestId: query.requestId,
        createdFrom: query.createdFrom,
        createdTo: query.createdTo
      },
      pagination: {
        limit: query.limit,
        offset: query.offset
      },
      sort: query.sort
    });

    return {
      data: result.rows.map(toAuditLogDTO),
      pagination: result.pagination
    };
  }

  async getAuditLogById(auditLogId, actor = null) {
    this.assertCanReadGlobalAuditLogs(actor);

    const auditLog = await this.auditLogRepository.getAuditLogById(auditLogId);
    if (!auditLog) {
      throw new NotFoundError('Audit log not found.');
    }

    return toAuditLogDTO(auditLog);
  }
}

module.exports = {
  AuditLogService
};
