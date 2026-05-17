const { BaseRepository } = require('./BaseRepository');

const DISPATCH_UNIT_SELECT = `
  SELECT *
  FROM dispatch_units
`;

const DISPATCH_UNIT_SORTS = Object.freeze({
  createdAtDesc: 'created_at DESC',
  createdAtAsc: 'created_at ASC',
  nameAsc: 'name ASC',
  priorityAsc: 'priority ASC, name ASC'
});

class DispatchUnitRepository extends BaseRepository {
  async createDispatchUnit(data, client) {
    return this.queryOne(
      `
        INSERT INTO dispatch_units (
          organization_id,
          name,
          code,
          service_region,
          city,
          product_types,
          enabled,
          priority,
          routing_rules,
          metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `,
      [
        data.organizationId || null,
        data.name,
        data.code,
        data.serviceRegion || null,
        data.city || null,
        data.productTypes || [],
        data.enabled ?? true,
        data.priority ?? 100,
        data.routingRules || null,
        data.metadata || null
      ],
      client
    );
  }

  async getDispatchUnitById(dispatchUnitId, client) {
    return this.queryOne(
      `
        ${DISPATCH_UNIT_SELECT}
        WHERE id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [dispatchUnitId],
      client
    );
  }

  async listDispatchUnits({ filters = {}, pagination = {}, sort = 'createdAtDesc' } = {}, client) {
    const clauses = ['deleted_at IS NULL'];
    const params = [];
    function add(sql, value) {
      params.push(value);
      clauses.push(sql.replace('?', `$${params.length}`));
    }

    if (filters.organizationId) add('organization_id = ?', filters.organizationId);
    if (Array.isArray(filters.organizationIds)) {
      if (filters.organizationIds.length === 0) clauses.push('false');
      else add('organization_id = ANY(?)', filters.organizationIds);
    }
    if (filters.enabled !== undefined) add('enabled = ?', filters.enabled);
    if (filters.status) add('enabled = ?', filters.status === 'active');
    if (filters.serviceRegion) add('service_region = ?', filters.serviceRegion);
    if (filters.city) add('city = ?', filters.city);
    if (filters.q) {
      params.push(`%${filters.q}%`);
      clauses.push(`(
        name ILIKE $${params.length}
        OR code ILIKE $${params.length}
        OR city ILIKE $${params.length}
        OR service_region ILIKE $${params.length}
      )`);
    }

    const normalizedPagination = this.getPagination(pagination);
    const whereSql = `WHERE ${clauses.join(' AND ')}`;
    const orderSql = DISPATCH_UNIT_SORTS[sort] || DISPATCH_UNIT_SORTS.createdAtDesc;

    params.push(normalizedPagination.limit);
    const limitParam = `$${params.length}`;
    params.push(normalizedPagination.offset);
    const offsetParam = `$${params.length}`;

    const rows = await this.queryMany(
      `
        ${DISPATCH_UNIT_SELECT}
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
        FROM dispatch_units
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

  async updateDispatchUnit(dispatchUnitId, updates, client) {
    const fieldMap = {
      name: 'name',
      code: 'code',
      serviceRegion: 'service_region',
      city: 'city',
      productTypes: 'product_types',
      enabled: 'enabled',
      priority: 'priority',
      routingRules: 'routing_rules',
      metadata: 'metadata'
    };

    const entries = Object.entries(updates).filter(([key, value]) => (
      Object.prototype.hasOwnProperty.call(fieldMap, key)
      && value !== undefined
    ));
    if (entries.length === 0) return this.getDispatchUnitById(dispatchUnitId, client);

    const assignments = [];
    const params = [];
    for (const [key, value] of entries) {
      params.push(value);
      assignments.push(`${fieldMap[key]} = $${params.length}`);
    }
    params.push(dispatchUnitId);

    await this.queryOne(
      `
        UPDATE dispatch_units
        SET ${assignments.join(', ')}
        WHERE id = $${params.length}
          AND deleted_at IS NULL
        RETURNING *
      `,
      params,
      client
    );

    return this.getDispatchUnitById(dispatchUnitId, client);
  }

  async disableDispatchUnit(dispatchUnitId, client) {
    await this.queryOne(
      `
        UPDATE dispatch_units
        SET enabled = false
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING *
      `,
      [dispatchUnitId],
      client
    );

    return this.getDispatchUnitById(dispatchUnitId, client);
  }
}

module.exports = {
  DispatchUnitRepository
};
