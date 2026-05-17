const { BaseRepository } = require('./BaseRepository');

const AUDIT_LOG_SELECT = `
  SELECT *
  FROM audit_logs
`;

class AuditLogRepository extends BaseRepository {
  async createAuditLog(event, client) {
    return this.queryOne(
      `
        INSERT INTO audit_logs (
          actor_type,
          actor_id,
          actor_display_name,
          action,
          entity_type,
          entity_id,
          before_data,
          after_data,
          ip_address,
          user_agent,
          metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `,
      [
        event.actorType,
        event.actorId || null,
        event.actorDisplayName || null,
        event.action,
        event.entityType,
        event.entityId,
        event.beforeData || null,
        event.afterData || null,
        event.ipAddress || null,
        event.userAgent || null,
        event.metadata || null
      ],
      client
    );
  }

  async getAuditLogById(auditLogId, client) {
    return this.queryOne(
      `
        ${AUDIT_LOG_SELECT}
        WHERE id = $1
      `,
      [auditLogId],
      client
    );
  }

  async listAuditLogs({ filters = {}, pagination = {}, sort = 'createdAtDesc' } = {}, client) {
    const normalizedPagination = this.getPagination(pagination);
    const clauses = [];
    const params = [];

    function add(sql, value) {
      params.push(value);
      clauses.push(sql.replace('?', `$${params.length}`));
    }

    if (filters.actorUserId) add('actor_id = ?', filters.actorUserId);
    if (filters.action) add('action = ?', filters.action);
    if (filters.entityType) add('entity_type = ?', filters.entityType);
    if (filters.entityId) add('entity_id = ?', filters.entityId);
    if (filters.requestId) add("metadata->>'requestId' = ?", filters.requestId);
    if (filters.createdFrom) add('created_at >= ?', filters.createdFrom);
    if (filters.createdTo) add('created_at <= ?', filters.createdTo);
    if (filters.organizationId) {
      params.push(filters.organizationId);
      const organizationParam = `$${params.length}`;
      clauses.push(`(
        metadata->>'organizationId' = ${organizationParam}
        OR metadata->>'organization_id' = ${organizationParam}
        OR before_data->>'organizationId' = ${organizationParam}
        OR before_data->>'organization_id' = ${organizationParam}
        OR after_data->>'organizationId' = ${organizationParam}
        OR after_data->>'organization_id' = ${organizationParam}
      )`);
    }

    const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const orderBy = sort === 'createdAtAsc' ? 'created_at ASC' : 'created_at DESC';

    params.push(normalizedPagination.limit);
    const limitParam = `$${params.length}`;
    params.push(normalizedPagination.offset);
    const offsetParam = `$${params.length}`;

    const rows = await this.queryMany(
      `
        ${AUDIT_LOG_SELECT}
        ${whereClause}
        ORDER BY ${orderBy}
        LIMIT ${limitParam}
        OFFSET ${offsetParam}
      `,
      params,
      client
    );

    const countParams = params.slice(0, params.length - 2);
    const countResult = await this.queryOne(
      `
        SELECT count(*)::int AS total
        FROM audit_logs
        ${whereClause}
      `,
      countParams,
      client
    );

    return {
      rows,
      pagination: {
        ...normalizedPagination,
        total: countResult?.total || 0
      }
    };
  }
}

module.exports = {
  AuditLogRepository
};
