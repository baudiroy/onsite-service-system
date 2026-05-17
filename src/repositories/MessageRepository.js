const { BaseRepository } = require('./BaseRepository');

const MESSAGE_SELECT = `
  SELECT *
  FROM case_messages
`;

class MessageRepository extends BaseRepository {
  async createMessage(data, client) {
    return this.queryOne(
      `
        INSERT INTO case_messages (
          case_id,
          attachment_id,
          sender_type,
          sender_id,
          sender_display_name,
          channel,
          message_type,
          body_text,
          external_message_id,
          raw_payload,
          metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `,
      [
        data.caseId,
        data.attachmentId || null,
        data.senderType,
        data.senderId || null,
        data.senderDisplayName || null,
        data.channel || 'admin',
        data.messageType,
        data.bodyText || null,
        data.externalMessageId || null,
        data.rawPayload || null,
        data.metadata || null
      ],
      client
    );
  }

  async listCaseMessages(caseId, { pagination = {}, sort = 'createdAtAsc' } = {}, client) {
    const normalizedPagination = this.getPagination(pagination);
    const orderSql = sort === 'createdAtDesc' ? 'created_at DESC' : 'created_at ASC';

    const rows = await this.queryMany(
      `
        ${MESSAGE_SELECT}
        WHERE case_id = $1
          AND deleted_at IS NULL
        ORDER BY ${orderSql}
        LIMIT $2
        OFFSET $3
      `,
      [caseId, normalizedPagination.limit, normalizedPagination.offset],
      client
    );

    const countResult = await this.queryOne(
      `
        SELECT count(*)::int AS total
        FROM case_messages
        WHERE case_id = $1
          AND deleted_at IS NULL
      `,
      [caseId],
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


  async getLatestCustomerVisibleMessage(caseId, client) {
    return this.queryOne(
      `
        ${MESSAGE_SELECT}
        WHERE case_id = $1
          AND deleted_at IS NULL
          AND (
            message_type = 'customer_note'
            OR (
              message_type = 'workflow_event'
              AND metadata->>'futureCustomerVisible' = 'true'
            )
            OR (
              message_type = 'workflow_event'
              AND metadata->>'customerVisible' = 'true'
            )
          )
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [caseId],
      client
    );
  }

  async getMessageById(messageId, client) {
    return this.queryOne(
      `
        ${MESSAGE_SELECT}
        WHERE id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [messageId],
      client
    );
  }

  async softDeleteMessage(messageId, client) {
    return this.queryOne(
      `
        UPDATE case_messages
        SET deleted_at = now()
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING *
      `,
      [messageId],
      client
    );
  }
}

module.exports = {
  MessageRepository
};
