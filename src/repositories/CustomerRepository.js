const { BaseRepository } = require('./BaseRepository');

const CUSTOMER_SELECT = `
  SELECT
    c.id,
    c.organization_id,
    o.organization_code,
    o.organization_name,
    c.customer_name,
    c.mobile,
    c.tel,
    c.line_user_id,
    c.city,
    c.address,
    c.source,
    c.created_at,
    c.updated_at
  FROM customers c
  LEFT JOIN organizations o ON o.id = c.organization_id
`;

const CUSTOMER_SORTS = Object.freeze({
  createdAtDesc: 'c.created_at DESC',
  createdAtAsc: 'c.created_at ASC',
  updatedAtDesc: 'c.updated_at DESC',
  nameAsc: 'c.customer_name ASC'
});

const CUSTOMER_CASES_SELECT = `
  SELECT
    ca.*,
    c.customer_name,
    c.mobile AS customer_mobile,
    c.tel AS customer_tel,
    c.city AS customer_city,
    c.address AS customer_address,
    o.organization_code,
    o.organization_name
  FROM cases ca
  JOIN customers c ON c.id = ca.customer_id
  LEFT JOIN organizations o ON o.id = ca.organization_id
`;

class CustomerRepository extends BaseRepository {
  async createCustomer(customer, client) {
    return this.queryOne(
      `
        INSERT INTO customers (
          organization_id,
          customer_name,
          mobile,
          tel,
          line_user_id,
          city,
          address,
          source,
          metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `,
      [
        customer.organizationId || null,
        customer.customerName,
        customer.mobile,
        customer.tel || null,
        customer.lineUserId || null,
        customer.city,
        customer.address,
        customer.source || 'admin',
        customer.metadata || null
      ],
      client
    ).then((row) => this.getCustomerById(row.id, client));
  }

  async findById(customerId, client) {
    return this.getCustomerById(customerId, client);
  }

  async getCustomerById(customerId, client) {
    return this.queryOne(
      `
        ${CUSTOMER_SELECT}
        WHERE c.id = $1
          AND c.deleted_at IS NULL
        LIMIT 1
      `,
      [customerId],
      client
    );
  }

  async updateCustomer(customerId, updates, client) {
    const fieldMap = {
      organizationId: 'organization_id',
      customerName: 'customer_name',
      mobile: 'mobile',
      tel: 'tel',
      lineUserId: 'line_user_id',
      city: 'city',
      address: 'address',
      source: 'source'
    };

    const entries = Object.entries(updates)
      .filter(([key]) => Object.prototype.hasOwnProperty.call(fieldMap, key));

    if (entries.length === 0) {
      return this.getCustomerById(customerId, client);
    }

    const assignments = [];
    const params = [];

    for (const [key, value] of entries) {
      params.push(value);
      assignments.push(`${fieldMap[key]} = $${params.length}`);
    }

    params.push(customerId);

    await this.queryOne(
      `
        UPDATE customers
        SET ${assignments.join(', ')}
        WHERE id = $${params.length}
          AND deleted_at IS NULL
        RETURNING id
      `,
      params,
      client
    );

    return this.getCustomerById(customerId, client);
  }

  async listCustomers({ filters = {}, pagination = {}, sort = 'createdAtDesc' } = {}, client) {
    const clauses = ['c.deleted_at IS NULL'];
    const params = [];

    function addFilter(sql, value) {
      params.push(value);
      clauses.push(sql.replace('?', `$${params.length}`));
    }

    if (filters.organizationId) addFilter('c.organization_id = ?', filters.organizationId);
    if (Array.isArray(filters.organizationIds)) {
      if (filters.organizationIds.length === 0) clauses.push('false');
      else addFilter('c.organization_id = ANY(?)', filters.organizationIds);
    }
    if (filters.mobile) addFilter('c.mobile = ?', filters.mobile);
    if (filters.lineUserId) addFilter('c.line_user_id = ?', filters.lineUserId);
    if (filters.city) addFilter('c.city = ?', filters.city);
    if (filters.source) addFilter('c.source = ?', filters.source);
    if (filters.q) {
      params.push(`%${filters.q}%`);
      clauses.push(`(
        c.customer_name ILIKE $${params.length}
        OR c.mobile ILIKE $${params.length}
        OR coalesce(c.tel, '') ILIKE $${params.length}
        OR c.address ILIKE $${params.length}
      )`);
    }

    const whereSql = `WHERE ${clauses.join(' AND ')}`;
    const orderSql = CUSTOMER_SORTS[sort] || CUSTOMER_SORTS.createdAtDesc;
    const normalizedPagination = this.getPagination(pagination);

    params.push(normalizedPagination.limit);
    const limitParam = `$${params.length}`;
    params.push(normalizedPagination.offset);
    const offsetParam = `$${params.length}`;

    const rows = await this.queryMany(
      `
        ${CUSTOMER_SELECT}
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
        FROM customers c
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

  async getCasesByCustomerId(customerId, { filters = {}, pagination = {}, sort = 'createdAtDesc' } = {}, client) {
    const normalizedPagination = this.getPagination(pagination);
    const orderSql = {
      createdAtDesc: 'ca.created_at DESC',
      createdAtAsc: 'ca.created_at ASC',
      submittedAtDesc: 'ca.submitted_at DESC NULLS LAST'
    }[sort] || 'ca.created_at DESC';
    const clauses = ['ca.customer_id = $1', 'ca.deleted_at IS NULL', 'c.deleted_at IS NULL'];
    const params = [customerId];

    if (filters.organizationId) {
      params.push(filters.organizationId);
      clauses.push(`ca.organization_id = $${params.length}`);
    }
    if (Array.isArray(filters.organizationIds)) {
      if (filters.organizationIds.length === 0) clauses.push('false');
      else {
        params.push(filters.organizationIds);
        clauses.push(`ca.organization_id = ANY($${params.length})`);
      }
    }

    params.push(normalizedPagination.limit);
    const limitParam = `$${params.length}`;
    params.push(normalizedPagination.offset);
    const offsetParam = `$${params.length}`;

    const rows = await this.queryMany(
      `
        ${CUSTOMER_CASES_SELECT}
        WHERE ${clauses.join(' AND ')}
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
        FROM cases ca
        JOIN customers c ON c.id = ca.customer_id
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

  async findCustomerByMobile(mobile, organizationId, client) {
    return this.queryOne(
      `
        ${CUSTOMER_SELECT}
        WHERE c.mobile = $1
          AND c.organization_id IS NOT DISTINCT FROM $2
          AND c.deleted_at IS NULL
        ORDER BY c.created_at ASC
        LIMIT 1
      `,
      [mobile, organizationId || null],
      client
    );
  }

  async findCustomerByLineUserId(lineUserId, organizationId, client) {
    return this.queryOne(
      `
        ${CUSTOMER_SELECT}
        WHERE c.line_user_id = $1
          AND c.organization_id IS NOT DISTINCT FROM $2
          AND c.deleted_at IS NULL
        LIMIT 1
      `,
      [lineUserId, organizationId || null],
      client
    );
  }
}

module.exports = {
  CustomerRepository
};
