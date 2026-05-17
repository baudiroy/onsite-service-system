const { BaseRepository } = require('./BaseRepository');

const DISPATCH_SELECT = `
  SELECT *
  FROM dispatch_assignments
`;

class DispatchRepository extends BaseRepository {
  async createDispatchAssignment(data, client) {
    return this.queryOne(
      `
        INSERT INTO dispatch_assignments (
          case_id,
          dispatch_unit_id,
          assigned_engineer_id,
          dispatch_status,
          assignment_note,
          assigned_at,
          assigned_by_user_id,
          created_by,
          updated_by
        )
        VALUES ($1, $2, $3, $4, $5, now(), $6, $6, $6)
        RETURNING *
      `,
      [
        data.caseId,
        data.dispatchUnitId,
        data.assignedEngineerId || null,
        data.dispatchStatus || 'pending',
        data.assignmentNote || null,
        data.actorId || null
      ],
      client
    );
  }

  async getDispatchAssignmentByCaseId(caseId, client) {
    return this.queryOne(
      `
        ${DISPATCH_SELECT}
        WHERE case_id = $1
          AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [caseId],
      client
    );
  }

  async updateDispatchAssignment(assignmentId, data, client) {
    return this.queryOne(
      `
        UPDATE dispatch_assignments
        SET dispatch_unit_id = coalesce($2, dispatch_unit_id),
            assigned_engineer_id = coalesce($3, assigned_engineer_id),
            dispatch_status = coalesce($4, dispatch_status),
            assignment_note = coalesce($5, assignment_note),
            assigned_at = CASE WHEN $3::uuid IS NOT NULL THEN now() ELSE assigned_at END,
            reassigned_by_user_id = CASE
              WHEN $3::uuid IS NOT NULL OR $2::uuid IS NOT NULL THEN $6
              ELSE reassigned_by_user_id
            END,
            reassigned_at = CASE
              WHEN $3::uuid IS NOT NULL OR $2::uuid IS NOT NULL THEN now()
              ELSE reassigned_at
            END,
            updated_by = $6
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING *
      `,
      [
        assignmentId,
        data.dispatchUnitId || null,
        data.assignedEngineerId || null,
        data.dispatchStatus || null,
        data.assignmentNote || null,
        data.actorId || null
      ],
      client
    );
  }

  async listDispatchAssignments({ filters = {}, pagination = {} } = {}, client) {
    const normalizedPagination = this.getPagination(pagination);
    const clauses = ['deleted_at IS NULL'];
    const params = [];

    function add(sql, value) {
      params.push(value);
      clauses.push(sql.replace('?', `$${params.length}`));
    }

    if (filters.caseId) add('case_id = ?', filters.caseId);
    if (filters.dispatchStatus) add('dispatch_status = ?', filters.dispatchStatus);
    if (filters.dispatchUnitId) add('dispatch_unit_id = ?', filters.dispatchUnitId);
    if (filters.assignedEngineerId) add('assigned_engineer_id = ?', filters.assignedEngineerId);

    params.push(normalizedPagination.limit);
    const limitParam = `$${params.length}`;
    params.push(normalizedPagination.offset);
    const offsetParam = `$${params.length}`;

    const rows = await this.queryMany(
      `
        ${DISPATCH_SELECT}
        WHERE ${clauses.join(' AND ')}
        ORDER BY assigned_at DESC
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
  DispatchRepository
};
