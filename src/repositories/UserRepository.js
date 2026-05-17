const { BaseRepository } = require('./BaseRepository');

const USER_SELECT = `
  SELECT *
  FROM users
`;

const USER_SORTS = Object.freeze({
  createdAtDesc: 'u.created_at DESC',
  createdAtAsc: 'u.created_at ASC',
  emailAsc: 'lower(u.email) ASC NULLS LAST'
});

class UserRepository extends BaseRepository {
  async findByEmail(email, client) {
    return this.queryOne(
      `
        SELECT *
        FROM users
        WHERE lower(email) = lower($1)
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [email],
      client
    );
  }

  async findById(userId, client) {
    return this.queryOne(
      `
        SELECT *
        FROM users
        WHERE id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [userId],
      client
    );
  }

  async updateLastLoginAt(userId, client) {
    return this.queryOne(
      `
        UPDATE users
        SET last_login_at = now()
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING *
      `,
      [userId],
      client
    );
  }

  async createUser(user, client) {
    return this.queryOne(
      `
        INSERT INTO users (
          display_name,
          email,
          mobile,
          user_type,
          status,
          password_hash,
          auth_provider,
          external_auth_id,
          metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `,
      [
        user.displayName,
        user.email,
        user.mobile || null,
        user.userType,
        user.status,
        user.passwordHash || null,
        user.authProvider || 'password',
        user.externalAuthId || null,
        user.metadata || null
      ],
      client
    );
  }

  async getUserById(userId, client) {
    return this.findById(userId, client);
  }

  async getUserByEmail(email, client) {
    return this.findByEmail(email, client);
  }

  async listUsers({ filters = {}, pagination = {}, sort = 'createdAtDesc' } = {}, client) {
    const clauses = ['u.deleted_at IS NULL'];
    const params = [];

    function add(sql, value) {
      params.push(value);
      clauses.push(sql.replace('?', `$${params.length}`));
    }

    if (filters.email) add('lower(u.email) = lower(?)', filters.email);
    if (filters.status) add('u.status = ?', filters.status);
    if (filters.roleId) {
      params.push(filters.roleId);
      clauses.push(`EXISTS (
        SELECT 1
        FROM user_roles ur
        WHERE ur.user_id = u.id
          AND ur.role_id = $${params.length}
          AND ur.revoked_at IS NULL
          AND ur.deleted_at IS NULL
      )`);
    }
    if (filters.organizationId) {
      params.push(filters.organizationId);
      clauses.push(`EXISTS (
        SELECT 1
        FROM user_organizations uo
        WHERE uo.user_id = u.id
          AND uo.organization_id = $${params.length}
          AND uo.deleted_at IS NULL
      )`);
    }
    if (filters.q) {
      params.push(`%${filters.q}%`);
      clauses.push(`(
        u.display_name ILIKE $${params.length}
        OR u.email ILIKE $${params.length}
        OR u.mobile ILIKE $${params.length}
      )`);
    }

    const normalizedPagination = this.getPagination(pagination);
    const whereSql = `WHERE ${clauses.join(' AND ')}`;
    const orderSql = USER_SORTS[sort] || USER_SORTS.createdAtDesc;

    params.push(normalizedPagination.limit);
    const limitParam = `$${params.length}`;
    params.push(normalizedPagination.offset);
    const offsetParam = `$${params.length}`;

    const rows = await this.queryMany(
      `
        SELECT u.*
        FROM users u
        ${whereSql}
        ORDER BY ${orderSql}
        LIMIT ${limitParam}
        OFFSET ${offsetParam}
      `,
      params,
      client
    );

    const countResult = await this.queryOne(
      `
        SELECT count(*)::int AS total
        FROM users u
        ${whereSql}
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

  async updateUser(userId, updates, client) {
    const fieldMap = {
      displayName: 'display_name',
      status: 'status'
    };

    const entries = Object.entries(updates).filter(([key, value]) => (
      Object.prototype.hasOwnProperty.call(fieldMap, key)
      && value !== undefined
    ));

    if (entries.length === 0) return this.findById(userId, client);

    const assignments = [];
    const params = [];

    for (const [key, value] of entries) {
      params.push(value);
      assignments.push(`${fieldMap[key]} = $${params.length}`);
    }

    params.push(userId);

    await this.queryOne(
      `
        UPDATE users
        SET ${assignments.join(', ')}
        WHERE id = $${params.length}
          AND deleted_at IS NULL
        RETURNING *
      `,
      params,
      client
    );

    return this.findById(userId, client);
  }

  async disableUser(userId, client) {
    return this.updateUser(userId, { status: 'inactive' }, client);
  }

  async updateSeededAdminUser(userId, updates, client) {
    return this.queryOne(
      `
        UPDATE users
        SET display_name = $2,
            status = $3,
            password_hash = $4,
            auth_provider = 'password',
            updated_at = now()
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING *
      `,
      [userId, updates.displayName, updates.status, updates.passwordHash],
      client
    );
  }
}

module.exports = {
  UserRepository
};
