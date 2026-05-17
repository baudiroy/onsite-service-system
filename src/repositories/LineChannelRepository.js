const { BaseRepository } = require('./BaseRepository');

const LINE_CHANNEL_SELECT = `
  SELECT *
  FROM line_channels
`;

class LineChannelRepository extends BaseRepository {
  async createLineChannel(data, client) {
    return this.queryOne(
      `
        INSERT INTO line_channels (
          organization_id,
          channel_code,
          channel_name,
          channel_id,
          channel_secret,
          channel_access_token,
          webhook_path,
          enabled,
          created_by,
          updated_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
        RETURNING *
      `,
      [
        data.organizationId,
        data.channelCode,
        data.channelName,
        data.channelId || null,
        data.channelSecret,
        data.channelAccessToken || null,
        data.webhookPath,
        data.enabled ?? true,
        data.actorId || null
      ],
      client
    );
  }

  async getLineChannelById(channelId, client) {
    return this.queryOne(
      `
        ${LINE_CHANNEL_SELECT}
        WHERE id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [channelId],
      client
    );
  }

  async getLineChannelByCode(channelCode, client) {
    return this.queryOne(
      `
        ${LINE_CHANNEL_SELECT}
        WHERE channel_code = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [channelCode],
      client
    );
  }

  async listLineChannels({ filters = {}, pagination = {} } = {}, client) {
    const normalizedPagination = this.getPagination(pagination);
    const clauses = ['deleted_at IS NULL'];
    const params = [];

    function add(sql, value) {
      params.push(value);
      clauses.push(sql.replace('?', `$${params.length}`));
    }

    if (filters.organizationId) add('organization_id = ?', filters.organizationId);
    if (Array.isArray(filters.organizationIds)) {
      if (filters.organizationIds.length === 0) clauses.push('false');
      else add('organization_id = ANY(?)', filters.organizationIds);
    }
    if (filters.channelCode) add('channel_code = ?', filters.channelCode);
    if (filters.enabled !== undefined) add('enabled = ?', filters.enabled);

    params.push(normalizedPagination.limit);
    const limitParam = `$${params.length}`;
    params.push(normalizedPagination.offset);
    const offsetParam = `$${params.length}`;

    const rows = await this.queryMany(
      `
        ${LINE_CHANNEL_SELECT}
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
        FROM line_channels
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

  async updateLineChannel(channelId, data, client) {
    return this.queryOne(
      `
        UPDATE line_channels
        SET channel_name = coalesce($2, channel_name),
            channel_id = coalesce($3, channel_id),
            channel_secret = coalesce($4, channel_secret),
            channel_access_token = coalesce($5, channel_access_token),
            webhook_path = coalesce($6, webhook_path),
            enabled = coalesce($7, enabled),
            updated_by = $8
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING *
      `,
      [
        channelId,
        data.channelName || null,
        data.channelId || null,
        data.channelSecret || null,
        data.channelAccessToken || null,
        data.webhookPath || null,
        data.enabled ?? null,
        data.actorId || null
      ],
      client
    );
  }
}

module.exports = {
  LineChannelRepository
};
