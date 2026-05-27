'use strict';

const ASSIGNED_APPOINTMENT_LIST_QUERY_NAME = 'engineerMobileAssignedAppointmentListReadOnlySql';
const ASSIGNED_APPOINTMENT_DETAIL_QUERY_NAME = 'engineerMobileAssignedAppointmentDetailReadOnlySql';

const ASSIGNED_APPOINTMENT_SAFE_SELECTED_FIELDS = Object.freeze([
  'appointment_id',
  'case_reference',
  'appointment_window',
  'scheduled_start',
  'scheduled_end',
  'service_type',
  'customer_display_name',
  'location_label',
  'appointment_status',
  'priority_label',
  'service_summary',
  'public_customer_notes',
  'checklist_preview',
]);

const LIST_REQUIRED_PARAMS = Object.freeze([
  'organizationId',
  'engineerUserId',
]);

const DETAIL_REQUIRED_PARAMS = Object.freeze([
  'organizationId',
  'engineerUserId',
  'appointmentId',
]);

const LIST_SQL = `
SELECT
  a.id AS appointment_id,
  c.case_reference AS case_reference,
  a.appointment_window AS appointment_window,
  a.scheduled_start AS scheduled_start,
  a.scheduled_end AS scheduled_end,
  c.service_type AS service_type,
  c.customer_display_name AS customer_display_name,
  c.location_label AS location_label,
  a.status AS appointment_status,
  a.priority_label AS priority_label,
  c.service_summary AS service_summary,
  c.public_customer_notes AS public_customer_notes,
  a.checklist_preview AS checklist_preview
FROM appointments a
JOIN cases c
  ON c.id = a.case_id
  AND c.organization_id = a.organization_id
WHERE a.organization_id = $1
  AND a.assigned_engineer_id = $2
  AND ($3::timestamptz IS NULL OR a.scheduled_start >= $3::timestamptz)
  AND ($4::timestamptz IS NULL OR a.scheduled_start <= $4::timestamptz)
  AND ($5::text IS NULL OR a.status = $5::text)
ORDER BY a.scheduled_start ASC, a.id ASC
`.trim();

const DETAIL_SQL = `
SELECT
  a.id AS appointment_id,
  c.case_reference AS case_reference,
  a.appointment_window AS appointment_window,
  a.scheduled_start AS scheduled_start,
  a.scheduled_end AS scheduled_end,
  c.service_type AS service_type,
  c.customer_display_name AS customer_display_name,
  c.location_label AS location_label,
  a.status AS appointment_status,
  a.priority_label AS priority_label,
  c.service_summary AS service_summary,
  c.public_customer_notes AS public_customer_notes,
  a.checklist_preview AS checklist_preview
FROM appointments a
JOIN cases c
  ON c.id = a.case_id
  AND c.organization_id = a.organization_id
WHERE a.organization_id = $1
  AND a.assigned_engineer_id = $2
  AND a.id = $3
LIMIT 1
`.trim();

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeString(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : undefined;
  }

  return String(value);
}

function firstString(source, keys) {
  for (const key of keys) {
    const value = safeString(source[key]);

    if (value) {
      return value;
    }
  }

  return undefined;
}

function normalizeAppointmentId(value) {
  const appointmentId = safeString(value);

  if (!appointmentId || appointmentId.length > 128 || !/^[a-zA-Z0-9_.:-]+$/.test(appointmentId)) {
    return undefined;
  }

  return appointmentId;
}

function normalizeFilters(value) {
  const source = isPlainObject(value) ? value : {};
  const dateRange = isPlainObject(source.dateRange) ? source.dateRange : {};
  const from = firstString(source, ['from', 'scheduledFrom']) || safeString(dateRange.from);
  const to = firstString(source, ['to', 'scheduledTo']) || safeString(dateRange.to);
  const status = firstString(source, ['status', 'appointmentStatus']);

  return Object.freeze({
    from: from || null,
    status: status || null,
    to: to || null,
  });
}

function freezeSpec(spec) {
  Object.freeze(spec.fields);
  Object.freeze(spec.params);
  Object.freeze(spec.requiredParams);
  Object.freeze(spec.values);

  if (spec.filters) {
    Object.freeze(spec.filters);
  }

  return Object.freeze(spec);
}

function failClosedSpec({ name, requiredParams, reason }) {
  return freezeSpec({
    executable: false,
    fields: [],
    name,
    ok: false,
    params: {},
    reason,
    requiredParams: [...requiredParams],
    sql: '',
    values: [],
  });
}

function scopedBaseInput(input) {
  const source = isPlainObject(input) ? input : {};
  const organizationId = firstString(source, ['organizationId', 'organization_id']);
  const engineerUserId = firstString(source, [
    'engineerUserId',
    'engineer_user_id',
    'engineerId',
    'engineer_id',
  ]);

  return {
    engineerUserId,
    organizationId,
    source,
  };
}

function buildEngineerMobileAssignedAppointmentListQuerySpec(input = {}) {
  const { engineerUserId, organizationId, source } = scopedBaseInput(input);

  if (!organizationId || !engineerUserId) {
    return failClosedSpec({
      name: ASSIGNED_APPOINTMENT_LIST_QUERY_NAME,
      reason: 'missing_required_scope',
      requiredParams: LIST_REQUIRED_PARAMS,
    });
  }

  const filters = normalizeFilters(source.filters);

  return freezeSpec({
    executable: false,
    fields: [...ASSIGNED_APPOINTMENT_SAFE_SELECTED_FIELDS],
    filters,
    name: ASSIGNED_APPOINTMENT_LIST_QUERY_NAME,
    ok: true,
    params: {
      engineerUserId,
      from: filters.from,
      organizationId,
      status: filters.status,
      to: filters.to,
    },
    requiredParams: [...LIST_REQUIRED_PARAMS],
    sql: LIST_SQL,
    values: [
      organizationId,
      engineerUserId,
      filters.from,
      filters.to,
      filters.status,
    ],
  });
}

function buildEngineerMobileAssignedAppointmentDetailQuerySpec(input = {}) {
  const { engineerUserId, organizationId, source } = scopedBaseInput(input);
  const appointmentId = normalizeAppointmentId(firstString(source, ['appointmentId', 'appointment_id']));

  if (!organizationId || !engineerUserId || !appointmentId) {
    return failClosedSpec({
      name: ASSIGNED_APPOINTMENT_DETAIL_QUERY_NAME,
      reason: 'missing_required_scope',
      requiredParams: DETAIL_REQUIRED_PARAMS,
    });
  }

  return freezeSpec({
    executable: false,
    fields: [...ASSIGNED_APPOINTMENT_SAFE_SELECTED_FIELDS],
    name: ASSIGNED_APPOINTMENT_DETAIL_QUERY_NAME,
    ok: true,
    params: {
      appointmentId,
      engineerUserId,
      organizationId,
    },
    requiredParams: [...DETAIL_REQUIRED_PARAMS],
    sql: DETAIL_SQL,
    values: [
      organizationId,
      engineerUserId,
      appointmentId,
    ],
  });
}

module.exports = {
  ASSIGNED_APPOINTMENT_DETAIL_QUERY_NAME,
  ASSIGNED_APPOINTMENT_LIST_QUERY_NAME,
  ASSIGNED_APPOINTMENT_SAFE_SELECTED_FIELDS,
  buildEngineerMobileAssignedAppointmentDetailQuerySpec,
  buildEngineerMobileAssignedAppointmentListQuerySpec,
};
