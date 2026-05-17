const { BaseRepository } = require('./BaseRepository');

const AI_JOB_SELECT = `
  SELECT *
  FROM ai_jobs
`;

class AIJobRepository extends BaseRepository {
  async createAIJob(data, client) {
    return this.queryOne(
      `
        INSERT INTO ai_jobs (
          organization_id,
          line_channel_id,
          customer_id,
          case_id,
          job_type,
          provider,
          entity_type,
          entity_id,
          status,
          request_payload,
          response_payload,
          error_message,
          requested_by_user_id,
          started_at,
          completed_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `,
      [
        data.organizationId || null,
        data.lineChannelId || null,
        data.customerId || null,
        data.caseId || null,
        data.jobType,
        data.provider || 'placeholder',
        data.entityType,
        data.entityId,
        data.status || 'pending',
        data.requestPayload || null,
        data.responsePayload || null,
        data.errorMessage || null,
        data.requestedByUserId || null,
        data.startedAt || null,
        data.completedAt || null
      ],
      client
    );
  }

  async getAIJobById(jobId, client) {
    return this.queryOne(
      `
        ${AI_JOB_SELECT}
        WHERE id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [jobId],
      client
    );
  }

  async updateAIJobStatus(jobId, data, client) {
    return this.queryOne(
      `
        UPDATE ai_jobs
        SET status = coalesce($2, status),
            response_payload = coalesce($3, response_payload),
            error_message = coalesce($4, error_message),
            started_at = coalesce($5, started_at),
            completed_at = coalesce($6, completed_at)
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING *
      `,
      [
        jobId,
        data.status || null,
        data.responsePayload || null,
        data.errorMessage || null,
        data.startedAt || null,
        data.completedAt || null
      ],
      client
    );
  }

  async listAIJobs({ filters = {}, pagination = {} } = {}, client) {
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
    if (filters.caseId) add('case_id = ?', filters.caseId);
    if (filters.customerId) add('customer_id = ?', filters.customerId);
    if (filters.lineChannelId) add('line_channel_id = ?', filters.lineChannelId);
    if (filters.jobType) add('job_type = ?', filters.jobType);
    if (filters.provider) add('provider = ?', filters.provider);
    if (filters.entityType) add('entity_type = ?', filters.entityType);
    if (filters.entityId) add('entity_id = ?', filters.entityId);
    if (filters.status) add('status = ?', filters.status);
    if (filters.requestedByUserId) add('requested_by_user_id = ?', filters.requestedByUserId);

    params.push(normalizedPagination.limit);
    const limitParam = `$${params.length}`;
    params.push(normalizedPagination.offset);
    const offsetParam = `$${params.length}`;

    const rows = await this.queryMany(
      `
        ${AI_JOB_SELECT}
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
        FROM ai_jobs
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
}

module.exports = {
  AIJobRepository
};
