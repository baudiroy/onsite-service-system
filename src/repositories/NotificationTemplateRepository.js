const { BaseRepository } = require('./BaseRepository');

const TEMPLATE_SELECT = `
  SELECT *
  FROM notification_templates
`;

class NotificationTemplateRepository extends BaseRepository {
  async createTemplate(data, client) {
    return this.queryOne(
      `
        INSERT INTO notification_templates (
          event_key,
          channel,
          template_name,
          subject,
          body_template,
          enabled,
          version,
          created_by,
          updated_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
        RETURNING *
      `,
      [
        data.eventKey,
        data.channel,
        data.templateName,
        data.subject || null,
        data.bodyTemplate,
        data.enabled ?? true,
        data.version || 1,
        data.actorId || null
      ],
      client
    );
  }

  async getTemplateById(templateId, client) {
    return this.queryOne(
      `
        ${TEMPLATE_SELECT}
        WHERE id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [templateId],
      client
    );
  }

  async findTemplate({ eventKey, channel }, client) {
    return this.queryOne(
      `
        ${TEMPLATE_SELECT}
        WHERE event_key = $1
          AND channel = $2
          AND enabled = true
          AND deleted_at IS NULL
        ORDER BY version DESC
        LIMIT 1
      `,
      [eventKey, channel],
      client
    );
  }

  async listTemplates({ filters = {}, pagination = {} } = {}, client) {
    const normalizedPagination = this.getPagination(pagination);
    const clauses = ['deleted_at IS NULL'];
    const params = [];

    function add(sql, value) {
      params.push(value);
      clauses.push(sql.replace('?', `$${params.length}`));
    }

    if (filters.eventKey) add('event_key = ?', filters.eventKey);
    if (filters.channel) add('channel = ?', filters.channel);
    if (filters.enabled !== undefined) add('enabled = ?', filters.enabled);

    params.push(normalizedPagination.limit);
    const limitParam = `$${params.length}`;
    params.push(normalizedPagination.offset);
    const offsetParam = `$${params.length}`;

    const rows = await this.queryMany(
      `
        ${TEMPLATE_SELECT}
        WHERE ${clauses.join(' AND ')}
        ORDER BY event_key ASC, channel ASC, version DESC
        LIMIT ${limitParam}
        OFFSET ${offsetParam}
      `,
      params,
      client
    );

    const countResult = await this.queryOne(
      `
        SELECT count(*)::int AS total
        FROM notification_templates
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

  async updateTemplate(templateId, data, client) {
    return this.queryOne(
      `
        UPDATE notification_templates
        SET template_name = coalesce($2, template_name),
            subject = coalesce($3, subject),
            body_template = coalesce($4, body_template),
            enabled = coalesce($5, enabled),
            version = coalesce($6, version),
            updated_by = $7
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING *
      `,
      [
        templateId,
        data.templateName || null,
        data.subject || null,
        data.bodyTemplate || null,
        data.enabled ?? null,
        data.version || null,
        data.actorId || null
      ],
      client
    );
  }
}

module.exports = {
  NotificationTemplateRepository
};
