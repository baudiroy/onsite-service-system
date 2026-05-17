const { BaseRepository } = require('./BaseRepository');

const LINE_EVENT_SELECT = `
  SELECT *
  FROM line_events
`;

class LineEventRepository extends BaseRepository {
  async createLineEvent(data, client) {
    return this.queryOne(
      `
        INSERT INTO line_events (
          organization_id,
          line_channel_id,
          line_user_id,
          event_type,
          message_type,
          external_event_id,
          raw_payload,
          linked_customer_id,
          linked_case_id,
          processed_status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `,
      [
        data.organizationId,
        data.lineChannelId,
        data.lineUserId || null,
        data.eventType,
        data.messageType || null,
        data.externalEventId || null,
        data.rawPayload || null,
        data.linkedCustomerId || null,
        data.linkedCaseId || null,
        data.processedStatus || 'received'
      ],
      client
    );
  }

  async updateLineEventStatus(eventId, data, client) {
    return this.queryOne(
      `
        UPDATE line_events
        SET processed_status = coalesce($2, processed_status),
            linked_customer_id = coalesce($3, linked_customer_id),
            linked_case_id = coalesce($4, linked_case_id)
        WHERE id = $1
        RETURNING *
      `,
      [eventId, data.processedStatus || null, data.linkedCustomerId || null, data.linkedCaseId || null],
      client
    );
  }

  async listLineEvents({ filters = {}, pagination = {} } = {}, client) {
    const normalizedPagination = this.getPagination(pagination);
    const clauses = ['1 = 1'];
    const params = [];

    function add(sql, value) {
      params.push(value);
      clauses.push(sql.replace('?', `$${params.length}`));
    }

    if (filters.organizationId) add('organization_id = ?', filters.organizationId);
    if (filters.lineChannelId) add('line_channel_id = ?', filters.lineChannelId);
    if (filters.lineUserId) add('line_user_id = ?', filters.lineUserId);
    if (filters.eventType) add('event_type = ?', filters.eventType);
    if (filters.processedStatus) add('processed_status = ?', filters.processedStatus);

    params.push(normalizedPagination.limit);
    const limitParam = `$${params.length}`;
    params.push(normalizedPagination.offset);
    const offsetParam = `$${params.length}`;

    const rows = await this.queryMany(
      `
        ${LINE_EVENT_SELECT}
        WHERE ${clauses.join(' AND ')}
        ORDER BY created_at DESC
        LIMIT ${limitParam}
        OFFSET ${offsetParam}
      `,
      params,
      client
    );

    return {
      rows,
      pagination: normalizedPagination
    };
  }
}

module.exports = {
  LineEventRepository
};
