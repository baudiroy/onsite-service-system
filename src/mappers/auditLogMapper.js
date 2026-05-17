const { sanitizeAuditPayload } = require('../utils/auditRedaction');

function toAuditLogDTO(row) {
  if (!row) return null;

  const metadata = sanitizeAuditPayload(row.metadata || null);

  return {
    id: row.id,
    actorUserId: row.actor_id,
    actorType: row.actor_type,
    actorDisplayName: row.actor_display_name,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    beforeData: sanitizeAuditPayload(row.before_data || null),
    afterData: sanitizeAuditPayload(row.after_data || null),
    metadata,
    requestId: metadata?.requestId || null,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    createdAt: row.created_at
  };
}

module.exports = {
  toAuditLogDTO
};
