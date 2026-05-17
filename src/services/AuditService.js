const { AuditLogRepository } = require('../repositories/AuditLogRepository');

const SYSTEM_ENTITY_ID = '00000000-0000-0000-0000-000000000000';

class AuditService {
  constructor({ auditLogRepository = new AuditLogRepository() } = {}) {
    this.auditLogRepository = auditLogRepository;
  }

  async record(event, client) {
    return this.auditLogRepository.createAuditLog({
      actorType: event.actorType || 'system',
      actorId: event.actorId || null,
      actorDisplayName: event.actorDisplayName || null,
      action: event.action,
      entityType: event.entityType || 'system',
      entityId: event.entityId || SYSTEM_ENTITY_ID,
      beforeData: event.beforeData || null,
      afterData: event.afterData || null,
      ipAddress: event.ipAddress || null,
      userAgent: event.userAgent || null,
      metadata: event.metadata || null
    }, client);
  }

  async recordLoginFailure({ email, reason, user = null, req = null }, client) {
    return this.record({
      actorType: user ? 'admin' : 'system',
      actorId: user?.id || null,
      actorDisplayName: user?.display_name || email,
      action: 'auth.login_failed',
      entityType: user ? 'user' : 'system',
      entityId: user?.id || SYSTEM_ENTITY_ID,
      ipAddress: req?.ip || null,
      userAgent: req?.get?.('user-agent') || null,
      metadata: {
        email,
        reason,
        requestId: req?.requestId || null
      }
    }, client);
  }

  async recordLoginSuccess({ user, req = null }, client) {
    return this.record({
      actorType: 'admin',
      actorId: user.id,
      actorDisplayName: user.display_name,
      action: 'auth.login_success',
      entityType: 'user',
      entityId: user.id,
      ipAddress: req?.ip || null,
      userAgent: req?.get?.('user-agent') || null,
      metadata: {
        requestId: req?.requestId || null
      }
    }, client);
  }
}

module.exports = {
  AuditService,
  SYSTEM_ENTITY_ID
};
