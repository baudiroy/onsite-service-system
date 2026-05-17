const { BaseRepository } = require('./BaseRepository');

class PermissionRepository extends BaseRepository {
  async findByPermissionKey(permissionKey, client) {
    return this.queryOne(
      `
        SELECT *
        FROM permissions
        WHERE permission_key = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [permissionKey],
      client
    );
  }

  async createPermission(permission, client) {
    return this.queryOne(
      `
        INSERT INTO permissions (permission_key, module, action, description, enabled, metadata)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
      [
        permission.permissionKey,
        permission.module,
        permission.action,
        permission.description || null,
        permission.enabled ?? true,
        permission.metadata || null
      ],
      client
    );
  }

  async getRolePermissions(roleId, client) {
    return this.queryMany(
      `
        SELECT p.*
        FROM role_permissions rp
        JOIN permissions p ON p.id = rp.permission_id
        WHERE rp.role_id = $1
          AND rp.revoked_at IS NULL
          AND rp.deleted_at IS NULL
          AND p.enabled = true
          AND p.deleted_at IS NULL
        ORDER BY p.permission_key
      `,
      [roleId],
      client
    );
  }

  async getUserPermissions(userId, client) {
    return this.queryMany(
      `
        SELECT DISTINCT p.*
        FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        JOIN role_permissions rp ON rp.role_id = r.id
        JOIN permissions p ON p.id = rp.permission_id
        WHERE ur.user_id = $1
          AND ur.revoked_at IS NULL
          AND ur.deleted_at IS NULL
          AND r.enabled = true
          AND r.deleted_at IS NULL
          AND rp.revoked_at IS NULL
          AND rp.deleted_at IS NULL
          AND p.enabled = true
          AND p.deleted_at IS NULL
        ORDER BY p.permission_key
      `,
      [userId],
      client
    );
  }

  async grantPermissionToRole({ roleId, permissionId, grantedBy = null }, client) {
    const existing = await this.queryOne(
      `
        SELECT id
        FROM role_permissions
        WHERE role_id = $1
          AND permission_id = $2
          AND revoked_at IS NULL
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [roleId, permissionId],
      client
    );

    if (existing) {
      return existing;
    }

    return this.queryOne(
      `
        INSERT INTO role_permissions (role_id, permission_id, granted_by)
        VALUES ($1, $2, $3)
        RETURNING *
      `,
      [roleId, permissionId, grantedBy],
      client
    );
  }
}

module.exports = {
  PermissionRepository
};
