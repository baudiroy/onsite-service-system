const { BaseRepository } = require('./BaseRepository');

const APPOINTMENT_SELECT = `
  SELECT *
  FROM appointments
`;

class AppointmentRepository extends BaseRepository {
  async createAppointment(data, client) {
    return this.queryOne(
      `
        INSERT INTO appointments (
          case_id,
          dispatch_assignment_id,
          scheduled_start_at,
          scheduled_end_at,
          appointment_status,
          visit_type,
          timezone,
          reschedule_reason,
          note,
          visit_sequence,
          visit_result,
          incomplete_reason,
          next_action,
          actual_arrival_at,
          actual_finished_at,
          created_by,
          updated_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $16)
        RETURNING *
      `,
      [
        data.caseId,
        data.dispatchAssignmentId || null,
        data.scheduledStartAt,
        data.scheduledEndAt,
        data.appointmentStatus || 'scheduled',
        data.visitType,
        data.timezone || 'Asia/Taipei',
        data.rescheduleReason || null,
        data.note || null,
        data.visitSequence ?? null,
        data.visitResult || null,
        data.incompleteReason || null,
        data.nextAction || null,
        data.actualArrivalAt || null,
        data.actualFinishedAt || null,
        data.actorId || null
      ],
      client
    );
  }

  async getAppointmentByCaseId(caseId, client) {
    return this.queryOne(
      `
        ${APPOINTMENT_SELECT}
        WHERE case_id = $1
          AND deleted_at IS NULL
        ORDER BY scheduled_start_at DESC
        LIMIT 1
      `,
      [caseId],
      client
    );
  }

  async getAppointmentById(appointmentId, client) {
    return this.queryOne(
      `
        ${APPOINTMENT_SELECT}
        WHERE id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [appointmentId],
      client
    );
  }

  async hasAppointmentsByCaseId(caseId, client) {
    const row = await this.queryOne(
      `
        SELECT 1 AS exists
        FROM appointments
        WHERE case_id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [caseId],
      client
    );

    return Boolean(row);
  }

  async findEligibleFinalAppointmentForCase(caseId, client) {
    return this.queryOne(
      `
        ${APPOINTMENT_SELECT}
        WHERE case_id = $1
          AND deleted_at IS NULL
          AND visit_result = 'completed'
        ORDER BY
          visit_sequence DESC NULLS LAST,
          actual_finished_at DESC NULLS LAST,
          actual_arrival_at DESC NULLS LAST,
          scheduled_end_at DESC NULLS LAST,
          created_at DESC,
          id DESC
        LIMIT 1
      `,
      [caseId],
      client
    );
  }

  async findOpenAppointmentsByCaseId(caseId, options = {}, client) {
    const excludeAppointmentId = options.excludeAppointmentId || null;

    return this.queryMany(
      `
        ${APPOINTMENT_SELECT}
        WHERE case_id = $1
          AND deleted_at IS NULL
          AND ($2::uuid IS NULL OR id <> $2)
          AND appointment_status NOT IN ('cancelled', 'completed', 'no_show')
          AND (
            visit_result IS NULL
            OR visit_result NOT IN (
              'completed',
              'pending_parts',
              'pending_quote',
              'need_second_visit',
              'customer_not_home',
              'customer_cancelled',
              'unable_to_repair',
              'rescheduled',
              'no_show'
            )
          )
        ORDER BY scheduled_start_at ASC, created_at ASC
      `,
      [caseId, excludeAppointmentId],
      client
    );
  }

  async hasOpenAppointmentForCase(caseId, options = {}, client) {
    const rows = await this.findOpenAppointmentsByCaseId(caseId, options, client);
    return rows.length > 0;
  }

  async updateAppointment(appointmentId, data, client) {
    return this.queryOne(
      `
        UPDATE appointments
        SET scheduled_start_at = coalesce($2, scheduled_start_at),
            scheduled_end_at = coalesce($3, scheduled_end_at),
            appointment_status = coalesce($4, appointment_status),
            visit_type = coalesce($5, visit_type),
            timezone = coalesce($6, timezone),
            reschedule_reason = coalesce($7, reschedule_reason),
            note = coalesce($8, note),
            visit_sequence = coalesce($9, visit_sequence),
            visit_result = coalesce($10, visit_result),
            incomplete_reason = coalesce($11, incomplete_reason),
            next_action = coalesce($12, next_action),
            actual_arrival_at = coalesce($13, actual_arrival_at),
            actual_finished_at = coalesce($14, actual_finished_at),
            updated_by = $15
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING *
      `,
      [
        appointmentId,
        data.scheduledStartAt || null,
        data.scheduledEndAt || null,
        data.appointmentStatus || null,
        data.visitType || null,
        data.timezone || null,
        data.rescheduleReason || null,
        data.note || null,
        data.visitSequence ?? null,
        data.visitResult || null,
        data.incompleteReason || null,
        data.nextAction || null,
        data.actualArrivalAt || null,
        data.actualFinishedAt || null,
        data.actorId || null
      ],
      client
    );
  }

  async listAppointments({ filters = {}, pagination = {} } = {}, client) {
    const normalizedPagination = this.getPagination(pagination);
    const clauses = ['deleted_at IS NULL'];
    const params = [];

    function add(sql, value) {
      params.push(value);
      clauses.push(sql.replace('?', `$${params.length}`));
    }

    if (filters.caseId) add('case_id = ?', filters.caseId);
    if (filters.appointmentStatus) add('appointment_status = ?', filters.appointmentStatus);

    params.push(normalizedPagination.limit);
    const limitParam = `$${params.length}`;
    params.push(normalizedPagination.offset);
    const offsetParam = `$${params.length}`;

    const rows = await this.queryMany(
      `
        ${APPOINTMENT_SELECT}
        WHERE ${clauses.join(' AND ')}
        ORDER BY scheduled_start_at DESC
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
  AppointmentRepository
};
