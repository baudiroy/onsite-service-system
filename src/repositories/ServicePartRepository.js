const { BaseRepository } = require('./BaseRepository');

const SERVICE_PART_SELECT = `
  SELECT *
  FROM service_parts
`;

class ServicePartRepository extends BaseRepository {
  async createServicePart(data, client) {
    return this.queryOne(
      `
        INSERT INTO service_parts (
          service_report_id,
          part_name,
          part_no,
          quantity,
          old_serial_no,
          new_serial_no,
          part_status,
          replaced_at,
          created_by,
          updated_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
        RETURNING *
      `,
      [
        data.serviceReportId,
        data.partName,
        data.partNo || null,
        data.quantity || 1,
        data.oldSerialNo || null,
        data.newSerialNo || null,
        data.partStatus || 'planned',
        data.replacedAt || null,
        data.actorId || null
      ],
      client
    );
  }

  async getServicePartById(partId, client) {
    return this.queryOne(
      `
        ${SERVICE_PART_SELECT}
        WHERE id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [partId],
      client
    );
  }

  async listServicePartsByReportId(reportId, { pagination = {} } = {}, client) {
    const normalizedPagination = this.getPagination(pagination);

    const rows = await this.queryMany(
      `
        ${SERVICE_PART_SELECT}
        WHERE service_report_id = $1
          AND deleted_at IS NULL
        ORDER BY created_at ASC
        LIMIT $2
        OFFSET $3
      `,
      [reportId, normalizedPagination.limit, normalizedPagination.offset],
      client
    );

    const countResult = await this.queryOne(
      `
        SELECT count(*)::int AS total
        FROM service_parts
        WHERE service_report_id = $1
          AND deleted_at IS NULL
      `,
      [reportId],
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

  async updateServicePart(partId, data, client) {
    return this.queryOne(
      `
        UPDATE service_parts
        SET part_name = coalesce($2, part_name),
            part_no = coalesce($3, part_no),
            quantity = coalesce($4, quantity),
            old_serial_no = coalesce($5, old_serial_no),
            new_serial_no = coalesce($6, new_serial_no),
            part_status = coalesce($7, part_status),
            replaced_at = coalesce($8, replaced_at),
            updated_by = $9
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING *
      `,
      [
        partId,
        data.partName || null,
        data.partNo || null,
        data.quantity || null,
        data.oldSerialNo || null,
        data.newSerialNo || null,
        data.partStatus || null,
        data.replacedAt || null,
        data.actorId || null
      ],
      client
    );
  }

  async softDeleteServicePart(partId, actorId, client) {
    return this.queryOne(
      `
        UPDATE service_parts
        SET deleted_at = now(),
            updated_by = $2
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING *
      `,
      [partId, actorId || null],
      client
    );
  }
}

module.exports = {
  ServicePartRepository
};
