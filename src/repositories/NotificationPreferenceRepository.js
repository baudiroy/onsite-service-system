const { BaseRepository } = require('./BaseRepository');

const PREFERENCE_SELECT = `
  SELECT *
  FROM notification_preferences
`;

class NotificationPreferenceRepository extends BaseRepository {
  async createPreference(data, client) {
    return this.queryOne(
      `
        INSERT INTO notification_preferences (
          target_type,
          target_id,
          event_key,
          channel,
          enabled,
          created_by,
          updated_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $6)
        RETURNING *
      `,
      [
        data.targetType,
        data.targetId || null,
        data.eventKey,
        data.channel,
        data.enabled ?? true,
        data.actorId || null
      ],
      client
    );
  }

  async getPreferenceById(preferenceId, client) {
    return this.queryOne(
      `
        ${PREFERENCE_SELECT}
        WHERE id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [preferenceId],
      client
    );
  }

  async findPreference({ targetType, targetId = null, eventKey, channel }, client) {
    return this.queryOne(
      `
        ${PREFERENCE_SELECT}
        WHERE target_type = $1
          AND target_id IS NOT DISTINCT FROM $2
          AND event_key = $3
          AND channel = $4
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [targetType, targetId, eventKey, channel],
      client
    );
  }

  async listPreferences({ filters = {}, pagination = {} } = {}, client) {
    const normalizedPagination = this.getPagination(pagination);
    const clauses = ['deleted_at IS NULL'];
    const params = [];

    function add(sql, value) {
      params.push(value);
      clauses.push(sql.replace('?', `$${params.length}`));
    }

    if (filters.targetType) add('target_type = ?', filters.targetType);
    if (filters.targetId) add('target_id = ?', filters.targetId);
    if (filters.eventKey) add('event_key = ?', filters.eventKey);
    if (filters.channel) add('channel = ?', filters.channel);

    params.push(normalizedPagination.limit);
    const limitParam = `$${params.length}`;
    params.push(normalizedPagination.offset);
    const offsetParam = `$${params.length}`;

    const rows = await this.queryMany(
      `
        ${PREFERENCE_SELECT}
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
        FROM notification_preferences
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

  async updatePreference(preferenceId, data, client) {
    return this.queryOne(
      `
        UPDATE notification_preferences
        SET enabled = coalesce($2, enabled),
            event_key = coalesce($3, event_key),
            channel = coalesce($4, channel),
            updated_by = $5
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING *
      `,
      [
        preferenceId,
        data.enabled ?? null,
        data.eventKey || null,
        data.channel || null,
        data.actorId || null
      ],
      client
    );
  }
}

module.exports = {
  NotificationPreferenceRepository
};
