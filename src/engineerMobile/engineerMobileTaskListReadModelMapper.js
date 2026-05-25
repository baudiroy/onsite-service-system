'use strict';

const ENGINEER_MOBILE_TASK_LIST_QUERY_NAME = 'engineerMobileTaskListReadModel';

const ENGINEER_MOBILE_TASK_LIST_REQUIRED_PARAMS = [
  'organizationId',
  'engineerId',
];

const ENGINEER_MOBILE_TASK_LIST_QUERY_FIELDS = [
  'case_id',
  'appointment_id',
  'organization_id',
  'assigned_engineer_id',
  'scheduled_start',
  'scheduled_end',
  'appointment_status',
  'customer_name_masked',
  'customer_phone_masked',
  'address_summary',
  'product_summary',
  'issue_summary',
  'service_type',
];

const ENGINEER_MOBILE_TASK_LIST_SQL = `
select
  c.id as case_id,
  a.id as appointment_id,
  a.organization_id,
  a.assigned_engineer_id,
  a.scheduled_start,
  a.scheduled_end,
  a.appointment_status,
  c.customer_name_masked,
  c.customer_phone_masked,
  c.address_summary,
  c.product_summary,
  c.issue_summary,
  c.service_type
from appointments a
join cases c
  on c.id = a.case_id
  and c.organization_id = a.organization_id
where a.organization_id = $1
  and a.assigned_engineer_id = $2
  and ($3::timestamptz is null or a.scheduled_start >= $3::timestamptz)
  and ($4::timestamptz is null or a.scheduled_start <= $4::timestamptz)
order by a.scheduled_start asc, a.id asc, c.id asc
`.trim();

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function firstPresent(source, keys) {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null && source[key] !== '') {
      return source[key];
    }
  }

  return undefined;
}

function asIsoString(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}

function mapEngineerMobileTaskRow(row) {
  if (!isPlainObject(row)) {
    return null;
  }

  const organizationId = firstPresent(row, ['organization_id', 'organizationId']);
  const caseId = firstPresent(row, ['case_id', 'caseId']);
  const appointmentId = firstPresent(row, ['appointment_id', 'appointmentId']);
  const assignedEngineerId = firstPresent(row, ['assigned_engineer_id', 'assignedEngineerId']);

  if (!organizationId || !caseId || !appointmentId || !assignedEngineerId) {
    return null;
  }

  const mapped = {
    assignedEngineerId,
    appointmentId,
    caseId,
    organizationId,
  };

  const scheduledStart = firstPresent(row, ['scheduled_start', 'scheduledStart', 'scheduled_date']);
  const scheduledEnd = firstPresent(row, ['scheduled_end', 'scheduledEnd']);
  const status = firstPresent(row, ['appointment_status', 'status']);
  const customerNameMasked = firstPresent(row, ['customer_name_masked', 'customerNameMasked']);
  const customerPhoneMasked = firstPresent(row, ['customer_phone_masked', 'customerPhoneMasked']);
  const addressSummary = firstPresent(row, ['address_summary', 'addressSummary']);
  const productSummary = firstPresent(row, ['product_summary', 'productSummary']);
  const issueSummary = firstPresent(row, ['issue_summary', 'issueSummary']);
  const serviceType = firstPresent(row, ['service_type', 'serviceType']);

  if (scheduledStart !== undefined) {
    mapped.scheduledStart = asIsoString(scheduledStart);
  }
  if (scheduledEnd !== undefined) {
    mapped.scheduledEnd = asIsoString(scheduledEnd);
  }
  if (status !== undefined) {
    mapped.status = String(status);
  }
  if (customerNameMasked !== undefined) {
    mapped.customerNameMasked = String(customerNameMasked);
  }
  if (customerPhoneMasked !== undefined) {
    mapped.customerPhoneMasked = String(customerPhoneMasked);
  }
  if (addressSummary !== undefined) {
    mapped.addressSummary = String(addressSummary);
  }
  if (productSummary !== undefined) {
    mapped.productSummary = String(productSummary);
  }
  if (issueSummary !== undefined) {
    mapped.issueSummary = String(issueSummary);
  }
  if (serviceType !== undefined) {
    mapped.serviceType = String(serviceType);
  }

  return mapped;
}

function sortTask(a, b) {
  const aStart = a.scheduledStart || '';
  const bStart = b.scheduledStart || '';

  if (aStart !== bStart) {
    return aStart.localeCompare(bStart);
  }

  if (a.appointmentId !== b.appointmentId) {
    return a.appointmentId.localeCompare(b.appointmentId);
  }

  return a.caseId.localeCompare(b.caseId);
}

function mapEngineerMobileTaskListRows(rows, filters = {}) {
  const safeFilters = isPlainObject(filters) ? filters : {};

  if (!Array.isArray(rows)) {
    return [];
  }

  return rows
    .map(mapEngineerMobileTaskRow)
    .filter(Boolean)
    .filter((task) => (
      !safeFilters.organizationId || task.organizationId === safeFilters.organizationId
    ))
    .filter((task) => (
      !safeFilters.engineerId || task.assignedEngineerId === safeFilters.engineerId
    ))
    .sort(sortTask);
}

function buildFailClosedQuerySpec(input = {}) {
  const source = isPlainObject(input) ? input : {};

  return {
    ok: false,
    executable: false,
    name: ENGINEER_MOBILE_TASK_LIST_QUERY_NAME,
    requiredParams: [...ENGINEER_MOBILE_TASK_LIST_REQUIRED_PARAMS],
    params: {
      organizationId: source.organizationId || null,
      engineerId: source.engineerId || null,
      from: null,
      to: null,
    },
    sql: null,
    fields: [],
    messageKey: 'engineerMobileTaskListQuerySpec.missingRequiredParams',
  };
}

function buildEngineerMobileTaskListQuerySpec(input = {}) {
  const source = isPlainObject(input) ? input : {};
  const organizationId = source.organizationId;
  const engineerId = source.engineerId;

  if (!organizationId || !engineerId) {
    return buildFailClosedQuerySpec(source);
  }

  const dateRange = isPlainObject(source.dateRange) ? source.dateRange : {};

  return {
    ok: true,
    executable: false,
    name: ENGINEER_MOBILE_TASK_LIST_QUERY_NAME,
    requiredParams: [...ENGINEER_MOBILE_TASK_LIST_REQUIRED_PARAMS],
    params: {
      organizationId,
      engineerId,
      from: dateRange.from || null,
      to: dateRange.to || null,
    },
    sql: ENGINEER_MOBILE_TASK_LIST_SQL,
    fields: [...ENGINEER_MOBILE_TASK_LIST_QUERY_FIELDS],
  };
}

module.exports = {
  ENGINEER_MOBILE_TASK_LIST_QUERY_FIELDS,
  ENGINEER_MOBILE_TASK_LIST_QUERY_NAME,
  ENGINEER_MOBILE_TASK_LIST_REQUIRED_PARAMS,
  buildEngineerMobileTaskListQuerySpec,
  mapEngineerMobileTaskListRows,
  mapEngineerMobileTaskRow,
};
