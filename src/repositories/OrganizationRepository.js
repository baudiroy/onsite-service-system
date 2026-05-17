const { BaseRepository } = require('./BaseRepository');

const ORGANIZATION_SELECT = `
  SELECT *
  FROM organizations
`;

const ORGANIZATION_SORTS = Object.freeze({
  createdAtDesc: 'created_at DESC',
  createdAtAsc: 'created_at ASC',
  codeAsc: 'organization_code ASC',
  nameAsc: 'organization_name ASC'
});

class OrganizationRepository extends BaseRepository {
  async createOrganization(data, client) {
    return this.queryOne(
      `
        INSERT INTO organizations (
          organization_code,
          organization_name,
          status
        )
        VALUES ($1, $2, $3)
        RETURNING *
      `,
      [data.organizationCode, data.organizationName, data.status || 'active'],
      client
    );
  }

  async getOrganizationById(organizationId, client) {
    return this.queryOne(
      `
        ${ORGANIZATION_SELECT}
        WHERE id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [organizationId],
      client
    );
  }

  async getOrganizationByCode(organizationCode, client) {
    return this.queryOne(
      `
        ${ORGANIZATION_SELECT}
        WHERE lower(organization_code) = lower($1)
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [organizationCode],
      client
    );
  }

  async listOrganizations({ filters = {}, pagination = {}, sort = 'createdAtDesc' } = {}, client) {
    const clauses = ['deleted_at IS NULL'];
    const params = [];

    function add(sql, value) {
      params.push(value);
      clauses.push(sql.replace('?', `$${params.length}`));
    }

    if (filters.status) add('status = ?', filters.status);
    if (filters.organizationCode) add('organization_code = ?', filters.organizationCode);
    if (Array.isArray(filters.organizationIds)) {
      if (filters.organizationIds.length === 0) clauses.push('false');
      else add('id = ANY(?)', filters.organizationIds);
    }
    if (filters.q) {
      params.push(`%${filters.q}%`);
      clauses.push(`(
        organization_code ILIKE $${params.length}
        OR organization_name ILIKE $${params.length}
      )`);
    }

    const normalizedPagination = this.getPagination(pagination);
    const whereSql = `WHERE ${clauses.join(' AND ')}`;
    const orderSql = ORGANIZATION_SORTS[sort] || ORGANIZATION_SORTS.createdAtDesc;

    params.push(normalizedPagination.limit);
    const limitParam = `$${params.length}`;
    params.push(normalizedPagination.offset);
    const offsetParam = `$${params.length}`;

    const rows = await this.queryMany(
      `
        ${ORGANIZATION_SELECT}
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
        FROM organizations
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

  async updateOrganization(organizationId, updates, client) {
    const fieldMap = {
      organizationName: 'organization_name',
      status: 'status'
    };
    const entries = Object.entries(updates).filter(([key]) => Object.prototype.hasOwnProperty.call(fieldMap, key));

    if (entries.length === 0) return this.getOrganizationById(organizationId, client);

    const assignments = [];
    const params = [];

    for (const [key, value] of entries) {
      params.push(value);
      assignments.push(`${fieldMap[key]} = $${params.length}`);
    }

    params.push(organizationId);

    await this.queryOne(
      `
        UPDATE organizations
        SET ${assignments.join(', ')}
        WHERE id = $${params.length}
          AND deleted_at IS NULL
        RETURNING *
      `,
      params,
      client
    );

    return this.getOrganizationById(organizationId, client);
  }
}

module.exports = {
  OrganizationRepository
};
