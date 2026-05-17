const { BaseRepository } = require('./BaseRepository');

const LOG_SELECT = `
  SELECT *
  FROM notification_logs
`;

class NotificationLogRepository extends BaseRepository {
  async createNotificationLog(data, client) {
    return this.queryOne(
      `
        INSERT INTO notification_logs (
          event_key,
          channel,
          target_type,
          target_id,
          recipient,
          status,
          payload,
          provider_response,
          error_message,
          sent_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `,
      [
        data.eventKey,
        data.channel,
        data.targetType,
        data.targetId || null,
        data.recipient || null,
        data.status || 'pending',
        data.payload || null,
        data.providerResponse || null,
        data.errorMessage || null,
        data.sentAt || null
      ],
      client
    );
  }

  async getNotificationLogById(logId, client) {
    return this.queryOne(
      `
        ${LOG_SELECT}
        WHERE id = $1
        LIMIT 1
      `,
      [logId],
      client
    );
  }

  async listNotificationLogs({ filters = {}, pagination = {} } = {}, client) {
    const normalizedPagination = this.getPagination(pagination);
    const clauses = ['1 = 1'];
    const params = [];

    function add(sql, value) {
      params.push(value);
      clauses.push(sql.replace('?', `$${params.length}`));
    }

    if (filters.eventKey) add('event_key = ?', filters.eventKey);
    if (filters.channel) add('channel = ?', filters.channel);
    if (filters.targetType) add('target_type = ?', filters.targetType);
    if (filters.targetId) add('target_id = ?', filters.targetId);
    if (filters.status) add('status = ?', filters.status);

    params.push(normalizedPagination.limit);
    const limitParam = `$${params.length}`;
    params.push(normalizedPagination.offset);
    const offsetParam = `$${params.length}`;

    const rows = await this.queryMany(
      `
        ${LOG_SELECT}
        WHERE ${clauses.join(' AND ')}
        ORDER BY created_at DESC
        LIMIT ${limitParam}
        OFFSET ${offsetParam}
      `,
      params,
      client
    );

    const countResult = await this.queryOne(
      `
        SELECT count(*)::int AS total
        FROM notification_logs
        WHERE ${clauses.join(' AND ')}
      `,
      params.slice(0, -2),
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

  async updateNotificationLog(logId, data, client) {
    return this.queryOne(
      `
        UPDATE notification_logs
        SET status = coalesce($2, status),
            provider_response = coalesce($3, provider_response),
            error_message = coalesce($4, error_message),
            sent_at = coalesce($5, sent_at)
        WHERE id = $1
        RETURNING *
      `,
      [
        logId,
        data.status || null,
        data.providerResponse || null,
        data.errorMessage || null,
        data.sentAt || null
      ],
      client
    );
  }
}

module.exports = {
  NotificationLogRepository
};
