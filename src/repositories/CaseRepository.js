const { BaseRepository } = require('./BaseRepository');

const CASE_SELECT = `
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

const SORTS = Object.freeze({
  createdAtDesc: 'ca.created_at DESC',
  createdAtAsc: 'ca.created_at ASC',
  submittedAtDesc: 'ca.submitted_at DESC NULLS LAST',
  prioritySubmittedAt: 'ca.priority ASC, ca.submitted_at DESC NULLS LAST',
  lastCustomerMessageAtDesc: 'ca.last_customer_message_at DESC NULLS LAST',
  lastInternalActivityAtDesc: 'ca.last_internal_activity_at DESC NULLS LAST',
  scheduledAtAsc: 'ca.scheduled_at ASC NULLS LAST'
});

const TRANSITION_TIMESTAMP_COLUMNS = Object.freeze({
  submittedAt: 'submitted_at',
  reviewedAt: 'reviewed_at',
  acceptedAt: 'accepted_at',
  rejectedAt: 'rejected_at',
  cancelledAt: 'cancelled_at',
  closedAt: 'closed_at'
});

class CaseRepository extends BaseRepository {
  async createCase(caseData, client) {
    return this.queryOne(
      `
        INSERT INTO cases (
          organization_id,
          intake_line_channel_id,
          case_no,
          customer_id,
          source,
          brand,
          case_type,
          product_type,
          model_no,
          serial_no,
          invoice_date,
          problem_description,
          preferred_visit_time,
          priority,
          warranty_status,
          service_region,
          customer_snapshot,
          created_by,
          updated_by
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19
        )
        RETURNING *
      `,
      [
        caseData.organizationId || null,
        caseData.intakeLineChannelId || null,
        caseData.caseNo,
        caseData.customerId,
        caseData.source,
        caseData.brand,
        caseData.caseType,
        caseData.productType,
        caseData.modelNo,
        caseData.serialNo || null,
        caseData.invoiceDate || null,
        caseData.problemDescription,
        caseData.preferredVisitTime || null,
        caseData.priority || 'normal',
        caseData.warrantyStatus || 'unknown',
        caseData.serviceRegion || null,
        caseData.customerSnapshot || null,
        caseData.actorId || null,
        caseData.actorId || null
      ],
      client
    );
  }

  async getCaseById(caseId, client) {
    return this.queryOne(
      `
        ${CASE_SELECT}
        WHERE ca.id = $1
          AND ca.deleted_at IS NULL
          AND c.deleted_at IS NULL
        LIMIT 1
      `,
      [caseId],
      client
    );
  }

  async getCaseByCaseNoAndMobile(caseNo, mobile, client) {
    return this.queryOne(
      `
        ${CASE_SELECT}
        WHERE ca.case_no = $1
          AND c.mobile = $2
          AND ca.deleted_at IS NULL
          AND c.deleted_at IS NULL
        LIMIT 1
      `,
      [caseNo, mobile],
      client
    );
  }

  async getCaseByCaseNoAndCustomerId(caseNo, customerId, client) {
    return this.queryOne(
      `
        ${CASE_SELECT}
        WHERE ca.case_no = $1
          AND ca.customer_id = $2
          AND ca.deleted_at IS NULL
          AND c.deleted_at IS NULL
        LIMIT 1
      `,
      [caseNo, customerId],
      client
    );
  }

  async listCases({ filters = {}, pagination = {}, sort = 'createdAtDesc' } = {}, client) {
    const clauses = ['ca.deleted_at IS NULL', 'c.deleted_at IS NULL'];
    const params = [];

    function addFilter(sql, value) {
      params.push(value);
      clauses.push(sql.replace('?', `$${params.length}`));
    }

    if (filters.organizationId) addFilter('ca.organization_id = ?', filters.organizationId);
    if (Array.isArray(filters.organizationIds)) {
      if (filters.organizationIds.length === 0) clauses.push('false');
      else addFilter('ca.organization_id = ANY(?)', filters.organizationIds);
    }
    if (filters.status) addFilter('ca.status = ?', filters.status);
    if (filters.priority) addFilter('ca.priority = ?', filters.priority);
    if (filters.caseType) addFilter('ca.case_type = ?', filters.caseType);
    if (filters.source) addFilter('ca.source = ?', filters.source);
    if (filters.customerId) addFilter('ca.customer_id = ?', filters.customerId);
    if (filters.caseNo) addFilter('ca.case_no = ?', filters.caseNo);
    if (filters.createdFrom) addFilter('ca.created_at >= ?', filters.createdFrom);
    if (filters.createdTo) addFilter('ca.created_at <= ?', filters.createdTo);

    const whereSql = `WHERE ${clauses.join(' AND ')}`;
    const orderSql = SORTS[sort] || SORTS.createdAtDesc;
    const normalizedPagination = this.getPagination(pagination);

    params.push(normalizedPagination.limit);
    const limitParam = `$${params.length}`;
    params.push(normalizedPagination.offset);
    const offsetParam = `$${params.length}`;

    const rows = await this.queryMany(
      `
        ${CASE_SELECT}
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
        FROM cases ca
        JOIN customers c ON c.id = ca.customer_id
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

  async updateCase(caseId, updates, actorId, client) {
    const fieldMap = {
      priority: 'priority',
      warrantyStatus: 'warranty_status',
      brand: 'brand',
      caseType: 'case_type',
      productType: 'product_type',
      modelNo: 'model_no',
      serialNo: 'serial_no',
      invoiceDate: 'invoice_date',
      problemDescription: 'problem_description',
      preferredVisitTime: 'preferred_visit_time',
      serviceRegion: 'service_region'
    };

    const entries = Object.entries(updates)
      .filter(([key]) => Object.prototype.hasOwnProperty.call(fieldMap, key));

    if (entries.length === 0) {
      return this.getCaseById(caseId, client);
    }

    const assignments = [];
    const params = [];

    for (const [key, value] of entries) {
      params.push(value);
      assignments.push(`${fieldMap[key]} = $${params.length}`);
    }

    params.push(actorId || null);
    assignments.push(`updated_by = $${params.length}`);

    params.push(caseId);

    await this.queryOne(
      `
        UPDATE cases
        SET ${assignments.join(', ')}
        WHERE id = $${params.length}
          AND deleted_at IS NULL
        RETURNING *
      `,
      params,
      client
    );

    return this.getCaseById(caseId, client);
  }

  async touchInternalActivity(caseId, actorId, client) {
    return this.queryOne(
      `
        UPDATE cases
        SET last_internal_activity_at = now(),
            updated_by = $2
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING *
      `,
      [caseId, actorId || null],
      client
    );
  }

  async touchCustomerMessage(caseId, actorId, client) {
    return this.queryOne(
      `
        UPDATE cases
        SET last_customer_message_at = now(),
            updated_by = $2
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING *
      `,
      [caseId, actorId || null],
      client
    );
  }

  async getLatestOpenCaseByCustomerId(customerId, client) {
    return this.queryOne(
      `
        ${CASE_SELECT}
        WHERE ca.customer_id = $1
          AND ca.status NOT IN ('rejected', 'cancelled', 'completed', 'closed')
          AND ca.deleted_at IS NULL
          AND c.deleted_at IS NULL
        ORDER BY ca.updated_at DESC
        LIMIT 1
      `,
      [customerId],
      client
    );
  }

  async updateDispatchSummary(caseId, data, actorId, client) {
    return this.queryOne(
      `
        UPDATE cases
        SET status = coalesce($2, status),
            dispatch_unit_id = coalesce($3, dispatch_unit_id),
            dispatch_assignment_source = coalesce($4, dispatch_assignment_source),
            last_internal_activity_at = now(),
            updated_by = $5
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING *
      `,
      [
        caseId,
        data.status || null,
        data.dispatchUnitId || null,
        data.dispatchAssignmentSource || null,
        actorId || null
      ],
      client
    );
  }

  async updateAppointmentSummary(caseId, data, actorId, client) {
    return this.queryOne(
      `
        UPDATE cases
        SET status = coalesce($2, status),
            scheduled_at = coalesce($3, scheduled_at),
            appointment_status = coalesce($4, appointment_status),
            last_internal_activity_at = now(),
            updated_by = $5
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING *
      `,
      [
        caseId,
        data.status || null,
        data.scheduledAt || null,
        data.appointmentStatus || null,
        actorId || null
      ],
      client
    );
  }

  async updateServiceSummary(caseId, data, actorId, client) {
    return this.queryOne(
      `
        UPDATE cases
        SET status = coalesce($2, status),
            completion_status = coalesce($3, completion_status),
            completed_at = coalesce($4, completed_at),
            last_internal_activity_at = now(),
            updated_by = $5
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING *
      `,
      [
        caseId,
        data.status || null,
        data.completionStatus || null,
        data.completedAt || null,
        actorId || null
      ],
      client
    );
  }

  async updateCaseStatus({ caseId, status, timestampField, actorId }, client) {
    const timestampColumn = TRANSITION_TIMESTAMP_COLUMNS[timestampField];

    if (!timestampColumn) {
      throw new Error(`Unsupported transition timestamp field: ${timestampField}`);
    }

    await this.queryOne(
      `
        UPDATE cases
        SET status = $1,
            ${timestampColumn} = now(),
            last_internal_activity_at = now(),
            updated_by = $2
        WHERE id = $3
          AND deleted_at IS NULL
        RETURNING *
      `,
      [status, actorId || null, caseId],
      client
    );

    return this.getCaseById(caseId, client);
  }
}

module.exports = {
  CaseRepository
};
