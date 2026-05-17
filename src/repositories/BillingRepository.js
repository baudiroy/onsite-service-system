const { BaseRepository } = require('./BaseRepository');

const BILLING_SELECT = `
  SELECT *
  FROM billing_records
`;

class BillingRepository extends BaseRepository {
  async createBillingRecord(data, client) {
    return this.queryOne(
      `
        INSERT INTO billing_records (
          case_id,
          field_service_report_id,
          labor_amount,
          parts_amount,
          transport_amount,
          additional_amount,
          total_amount,
          warranty_amount,
          customer_charge_amount,
          manufacturer_claim_amount,
          billing_status,
          billing_note,
          created_by,
          updated_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $13)
        RETURNING *
      `,
      [
        data.caseId,
        data.fieldServiceReportId || null,
        data.laborAmount || 0,
        data.partsAmount || 0,
        data.transportAmount || 0,
        data.additionalAmount || 0,
        data.totalAmount || 0,
        data.warrantyAmount || 0,
        data.customerChargeAmount || 0,
        data.manufacturerClaimAmount || 0,
        data.billingStatus || 'draft',
        data.billingNote || null,
        data.actorId || null
      ],
      client
    );
  }

  async getBillingRecordByCaseId(caseId, client) {
    return this.queryOne(
      `
        ${BILLING_SELECT}
        WHERE case_id = $1
          AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [caseId],
      client
    );
  }

  async getBillingRecordById(billingId, client) {
    return this.queryOne(
      `
        ${BILLING_SELECT}
        WHERE id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [billingId],
      client
    );
  }

  async updateBillingRecord(billingId, data, client) {
    return this.queryOne(
      `
        UPDATE billing_records
        SET labor_amount = coalesce($2, labor_amount),
            parts_amount = coalesce($3, parts_amount),
            transport_amount = coalesce($4, transport_amount),
            additional_amount = coalesce($5, additional_amount),
            total_amount = coalesce($6, total_amount),
            warranty_amount = coalesce($7, warranty_amount),
            customer_charge_amount = coalesce($8, customer_charge_amount),
            manufacturer_claim_amount = coalesce($9, manufacturer_claim_amount),
            billing_status = coalesce($10, billing_status),
            billing_note = coalesce($11, billing_note),
            updated_by = $12
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING *
      `,
      [
        billingId,
        data.laborAmount ?? null,
        data.partsAmount ?? null,
        data.transportAmount ?? null,
        data.additionalAmount ?? null,
        data.totalAmount ?? null,
        data.warrantyAmount ?? null,
        data.customerChargeAmount ?? null,
        data.manufacturerClaimAmount ?? null,
        data.billingStatus || null,
        data.billingNote || null,
        data.actorId || null
      ],
      client
    );
  }

  async listBillingRecords({ filters = {}, pagination = {} } = {}, client) {
    const normalizedPagination = this.getPagination(pagination);
    const clauses = ['deleted_at IS NULL'];
    const params = [];

    function add(sql, value) {
      params.push(value);
      clauses.push(sql.replace('?', `$${params.length}`));
    }

    if (filters.caseId) add('case_id = ?', filters.caseId);
    if (filters.billingStatus) add('billing_status = ?', filters.billingStatus);

    params.push(normalizedPagination.limit);
    const limitParam = `$${params.length}`;
    params.push(normalizedPagination.offset);
    const offsetParam = `$${params.length}`;

    const rows = await this.queryMany(
      `
        ${BILLING_SELECT}
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
        FROM billing_records
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
  BillingRepository
};
