const { BaseRepository } = require('./BaseRepository');

const IDENTITY_SELECT = `
  SELECT
    cli.*,
    lc.channel_code,
    lc.channel_name
  FROM customer_line_identities cli
  LEFT JOIN line_channels lc ON lc.id = cli.line_channel_id
`;

class CustomerLineIdentityRepository extends BaseRepository {
  async findByLineIdentity({ organizationId, lineChannelId, lineUserId }, client) {
    return this.queryOne(
      `
        ${IDENTITY_SELECT}
        WHERE cli.organization_id = $1
          AND cli.line_channel_id = $2
          AND cli.line_user_id = $3
          AND cli.unlinked_at IS NULL
        LIMIT 1
      `,
      [organizationId, lineChannelId, lineUserId],
      client
    );
  }

  async getIdentityById(identityId, client) {
    return this.queryOne(
      `
        ${IDENTITY_SELECT}
        WHERE cli.id = $1
          AND cli.unlinked_at IS NULL
        LIMIT 1
      `,
      [identityId],
      client
    );
  }

  async listByCustomerId(customerId, client) {
    return this.queryMany(
      `
        ${IDENTITY_SELECT}
        WHERE cli.customer_id = $1
          AND cli.unlinked_at IS NULL
        ORDER BY cli.created_at DESC
      `,
      [customerId],
      client
    );
  }

  async createPendingIdentity(data, client) {
    return this.queryOne(
      `
        INSERT INTO customer_line_identities (
          customer_id,
          organization_id,
          line_channel_id,
          line_user_id,
          display_name,
          linked_at
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
      [
        data.customerId || null,
        data.organizationId,
        data.lineChannelId,
        data.lineUserId,
        data.displayName || null,
        data.customerId ? new Date().toISOString() : null
      ],
      client
    );
  }

  async unlinkIdentity(identityId, client) {
    return this.queryOne(
      `
        UPDATE customer_line_identities
        SET unlinked_at = now()
        WHERE id = $1
          AND unlinked_at IS NULL
        RETURNING *
      `,
      [identityId],
      client
    );
  }

  async linkIdentityToCustomer(identityId, customerId, client) {
    return this.queryOne(
      `
        UPDATE customer_line_identities
        SET customer_id = $2,
            linked_at = coalesce(linked_at, now())
        WHERE id = $1
          AND unlinked_at IS NULL
        RETURNING *
      `,
      [identityId, customerId],
      client
    );
  }
}

module.exports = {
  CustomerLineIdentityRepository
};
