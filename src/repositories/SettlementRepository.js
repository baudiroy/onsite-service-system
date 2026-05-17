const { BaseRepository } = require('./BaseRepository');

const SETTLEMENT_SELECT = `
  SELECT *
  FROM settlement_records
`;

class SettlementRepository extends BaseRepository {
  async createSettlementRecord(data, client) {
    return this.queryOne(
      `
        INSERT INTO settlement_records (
          billing_record_id,
          settlement_target_type,
          settlement_target_id,
          settlement_amount,
          settlement_status,
          settlement_rule_code,
          settlement_policy_version,
          settlement_metadata,
          settlement_note,
          settled_at,
          created_by,
          updated_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)
        RETURNING *
      `,
      [
        data.billingRecordId,
        data.settlementTargetType,
        data.settlementTargetId || null,
        data.settlementAmount || 0,
        data.settlementStatus || 'submitted',
        data.settlementRuleCode || null,
        data.settlementPolicyVersion || null,
        data.settlementMetadata || null,
        data.settlementNote || null,
        data.settledAt || null,
        data.actorId || null
      ],
      client
    );
  }

  async getSettlementRecordById(settlementId, client) {
    return this.queryOne(
      `
        ${SETTLEMENT_SELECT}
        WHERE id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [settlementId],
      client
    );
  }

  async listSettlementRecords(billingRecordId, { pagination = {} } = {}, client) {
    const normalizedPagination = this.getPagination(pagination);

    const rows = await this.queryMany(
      `
        ${SETTLEMENT_SELECT}
        WHERE billing_record_id = $1
          AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT $2
        OFFSET $3
      `,
      [billingRecordId, normalizedPagination.limit, normalizedPagination.offset],
      client
    );

    const countResult = await this.queryOne(
      `
        SELECT count(*)::int AS total
        FROM settlement_records
        WHERE billing_record_id = $1
          AND deleted_at IS NULL
      `,
      [billingRecordId],
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

  async hasOpenSettlementRecords(billingRecordId, client) {
    const result = await this.queryOne(
      `
        SELECT EXISTS (
          SELECT 1
          FROM settlement_records
          WHERE billing_record_id = $1
            AND settlement_status IN ('pending', 'submitted')
            AND deleted_at IS NULL
        ) AS has_open
      `,
      [billingRecordId],
      client
    );

    return Boolean(result?.has_open);
  }

  async updateSettlementRecord(settlementId, data, client) {
    return this.queryOne(
      `
        UPDATE settlement_records
        SET settlement_target_type = coalesce($2, settlement_target_type),
            settlement_target_id = coalesce($3, settlement_target_id),
            settlement_amount = coalesce($4, settlement_amount),
            settlement_status = coalesce($5, settlement_status),
            settlement_rule_code = coalesce($6, settlement_rule_code),
            settlement_policy_version = coalesce($7, settlement_policy_version),
            settlement_metadata = coalesce($8, settlement_metadata),
            settlement_note = coalesce($9, settlement_note),
            settled_at = coalesce($10, settled_at),
            updated_by = $11
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING *
      `,
      [
        settlementId,
        data.settlementTargetType || null,
        data.settlementTargetId || null,
        data.settlementAmount ?? null,
        data.settlementStatus || null,
        data.settlementRuleCode || null,
        data.settlementPolicyVersion || null,
        data.settlementMetadata || null,
        data.settlementNote || null,
        data.settledAt || null,
        data.actorId || null
      ],
      client
    );
  }
}

module.exports = {
  SettlementRepository
};
