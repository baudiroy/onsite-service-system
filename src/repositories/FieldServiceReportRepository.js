const { BaseRepository } = require('./BaseRepository');

const FIELD_SERVICE_REPORT_SELECT = `
  SELECT *
  FROM field_service_reports
`;

class FieldServiceReportRepository extends BaseRepository {
  async createServiceReport(data, client) {
    return this.queryOne(
      `
        INSERT INTO field_service_reports (
          case_id,
          diagnosis_result,
          repair_action,
          repair_result,
          service_status,
          engineer_note,
          customer_note,
          installation_checklist,
          onsite_started_at,
          onsite_completed_at,
          final_appointment_id,
          created_by,
          updated_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, coalesce($9, now()), $10, $11, $12, $12)
        RETURNING *
      `,
      [
        data.caseId,
        data.diagnosisResult || null,
        data.repairAction || null,
        data.repairResult || null,
        data.serviceStatus || 'in_progress',
        data.engineerNote || null,
        data.customerNote || null,
        data.installationChecklist || null,
        data.onsiteStartedAt || null,
        data.onsiteCompletedAt || null,
        data.finalAppointmentId || null,
        data.actorId || null
      ],
      client
    );
  }

  async getServiceReportByCaseId(caseId, client) {
    return this.queryOne(
      `
        ${FIELD_SERVICE_REPORT_SELECT}
        WHERE case_id = $1
          AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [caseId],
      client
    );
  }

  async getServiceReportById(reportId, client) {
    return this.queryOne(
      `
        ${FIELD_SERVICE_REPORT_SELECT}
        WHERE id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [reportId],
      client
    );
  }

  async updateServiceReport(reportId, data, client) {
    return this.queryOne(
      `
        UPDATE field_service_reports
        SET diagnosis_result = coalesce($2, diagnosis_result),
            repair_action = coalesce($3, repair_action),
            repair_result = coalesce($4, repair_result),
            service_status = coalesce($5, service_status),
            engineer_note = coalesce($6, engineer_note),
            customer_note = coalesce($7, customer_note),
            installation_checklist = coalesce($8, installation_checklist),
            onsite_started_at = coalesce($9, onsite_started_at),
            onsite_completed_at = coalesce($10, onsite_completed_at),
            final_appointment_id = CASE WHEN $11 THEN $12 ELSE final_appointment_id END,
            updated_by = $13
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING *
      `,
      [
        reportId,
        data.diagnosisResult || null,
        data.repairAction || null,
        data.repairResult || null,
        data.serviceStatus || null,
        data.engineerNote || null,
        data.customerNote || null,
        data.installationChecklist || null,
        data.onsiteStartedAt || null,
        data.onsiteCompletedAt || null,
        Object.prototype.hasOwnProperty.call(data, 'finalAppointmentId'),
        data.finalAppointmentId || null,
        data.actorId || null
      ],
      client
    );
  }

  async listServiceReports({ filters = {}, pagination = {} } = {}, client) {
    const normalizedPagination = this.getPagination(pagination);
    const clauses = ['deleted_at IS NULL'];
    const params = [];

    function add(sql, value) {
      params.push(value);
      clauses.push(sql.replace('?', `$${params.length}`));
    }

    if (filters.caseId) add('case_id = ?', filters.caseId);
    if (filters.serviceStatus) add('service_status = ?', filters.serviceStatus);

    params.push(normalizedPagination.limit);
    const limitParam = `$${params.length}`;
    params.push(normalizedPagination.offset);
    const offsetParam = `$${params.length}`;

    const rows = await this.queryMany(
      `
        ${FIELD_SERVICE_REPORT_SELECT}
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
        FROM field_service_reports
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
  FieldServiceReportRepository
};
