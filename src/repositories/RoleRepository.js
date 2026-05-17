const { BaseRepository } = require('./BaseRepository');

class RoleRepository extends BaseRepository {
  async findByRoleKey(roleKey, client) {
    return this.queryOne(
      `
        SELECT *
        FROM roles
        WHERE role_key = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [roleKey],
      client
    );
  }

  async createRole(role, client) {
    return this.queryOne(
      `
        INSERT INTO roles (role_key, name, description, enabled, metadata)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
      [
        role.roleKey,
        role.name,
        role.description || null,
        role.enabled ?? true,
        role.metadata || null
      ],
      client
    );
  }

  async getRoleById(roleId, client) {
    return this.queryOne(
      `
        SELECT *
        FROM roles
        WHERE id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [roleId],
      client
    );
  }

  async getUserRoles(userId, client) {
    return this.queryMany(
      `
        SELECT r.*
        FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = $1
          AND ur.revoked_at IS NULL
          AND ur.deleted_at IS NULL
          AND r.enabled = true
          AND r.deleted_at IS NULL
        ORDER BY r.role_key
      `,
      [userId],
      client
    );
  }

  async assignRoleToUser({ userId, roleId, assignedBy = null }, client) {
    const existing = await this.queryOne(
      `
        SELECT id
        FROM user_roles
        WHERE user_id = $1
          AND role_id = $2
          AND revoked_at IS NULL
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [userId, roleId],
      client
    );

    if (existing) {
      return existing;
    }

    return this.queryOne(
      `
        INSERT INTO user_roles (user_id, role_id, assigned_by)
        VALUES ($1, $2, $3)
        RETURNING *
      `,
      [userId, roleId, assignedBy],
      client
    );
  }

  async listUserRoleAssignments(userId, client) {
    return this.queryMany(
      `
        SELECT
          ur.*,
          r.role_key,
          r.name,
          r.description,
          r.enabled
        FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = $1
          AND ur.revoked_at IS NULL
          AND ur.deleted_at IS NULL
          AND r.deleted_at IS NULL
        ORDER BY r.role_key
      `,
      [userId],
      client
    );
  }

  async removeRoleFromUser({ userId, roleId }, client) {
    return this.queryOne(
      `
        UPDATE user_roles
        SET revoked_at = now()
        WHERE user_id = $1
          AND role_id = $2
          AND revoked_at IS NULL
          AND deleted_at IS NULL
        RETURNING *
      `,
      [userId, roleId],
      client
    );
  }
}

module.exports = {
  RoleRepository
};
