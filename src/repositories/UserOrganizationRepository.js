const { BaseRepository } = require('./BaseRepository');

const USER_ORGANIZATION_SELECT = `
  SELECT
    uo.*,
    o.organization_code,
    o.organization_name,
    o.status AS organization_status,
    u.display_name AS user_display_name,
    u.email AS user_email
  FROM user_organizations uo
  JOIN organizations o ON o.id = uo.organization_id
  JOIN users u ON u.id = uo.user_id
`;

class UserOrganizationRepository extends BaseRepository {
  async getUserOrganizationIds(userId, client) {
    const rows = await this.queryMany(
      `
        SELECT organization_id
        FROM user_organizations
        WHERE user_id = $1
          AND deleted_at IS NULL
        ORDER BY created_at ASC
      `,
      [userId],
      client
    );

    return rows.map((row) => row.organization_id);
  }

  async hasUserOrganization(userId, organizationId, client) {
    const row = await this.queryOne(
      `
        SELECT id
        FROM user_organizations
        WHERE user_id = $1
          AND organization_id = $2
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [userId, organizationId],
      client
    );

    return Boolean(row);
  }

  async assignUserToOrganization({ userId, organizationId, roleNote = null }, client) {
    const existing = await this.queryOne(
      `
        SELECT *
        FROM user_organizations
        WHERE user_id = $1
          AND organization_id = $2
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [userId, organizationId],
      client
    );

    if (existing) return this.getMembershipById(existing.id, client);

    const row = await this.queryOne(
      `
        INSERT INTO user_organizations (user_id, organization_id, role_note)
        VALUES ($1, $2, $3)
        RETURNING *
      `,
      [userId, organizationId, roleNote],
      client
    );

    return this.getMembershipById(row.id, client);
  }

  async removeUserFromOrganization({ userId, organizationId }, client) {
    const row = await this.queryOne(
      `
        UPDATE user_organizations
        SET deleted_at = now()
        WHERE user_id = $1
          AND organization_id = $2
          AND deleted_at IS NULL
        RETURNING *
      `,
      [userId, organizationId],
      client
    );

    return row;
  }

  async listUserOrganizations(userId, client) {
    return this.queryMany(
      `
        ${USER_ORGANIZATION_SELECT}
        WHERE uo.user_id = $1
          AND uo.deleted_at IS NULL
          AND o.deleted_at IS NULL
          AND u.deleted_at IS NULL
        ORDER BY o.organization_code ASC
      `,
      [userId],
      client
    );
  }

  async getMembershipById(membershipId, client) {
    return this.queryOne(
      `
        ${USER_ORGANIZATION_SELECT}
        WHERE uo.id = $1
          AND uo.deleted_at IS NULL
        LIMIT 1
      `,
      [membershipId],
      client
    );
  }
}

module.exports = {
  UserOrganizationRepository
};
