'use strict';

const {
  mapEngineerMobileTaskListRows,
} = require('./engineerMobileTaskListReadModelMapper');
const {
  mapEngineerMobileTaskDetailRowsToReadModel,
} = require('./engineerMobileTaskDetailReadModelMapper');

const ENGINEER_MOBILE_READ_MODEL_TABLE = 'engineer_mobile_task_read_models';

const ENGINEER_MOBILE_READ_MODEL_COLUMNS = Object.freeze([
  'organization_id',
  'case_id',
  'appointment_id',
  'assigned_engineer_id',
  'scheduled_start',
  'scheduled_end',
  'status',
  'customer_name_masked',
  'customer_phone_masked',
  'address_summary',
  'product_summary',
  'issue_summary',
  'service_summary',
  'service_type',
  'site_note_safe',
  'checklist_summary',
  'evidence_refs',
]);

const LIST_SQL = `
select
  ${ENGINEER_MOBILE_READ_MODEL_COLUMNS.join(',\n  ')}
from ${ENGINEER_MOBILE_READ_MODEL_TABLE}
where organization_id = $1
  and assigned_engineer_id = $2
  and ($3::timestamptz is null or scheduled_start >= $3::timestamptz)
  and ($4::timestamptz is null or scheduled_start <= $4::timestamptz)
order by scheduled_start asc, appointment_id asc, case_id asc
`.trim();

const DETAIL_SQL = `
select
  ${ENGINEER_MOBILE_READ_MODEL_COLUMNS.join(',\n  ')}
from ${ENGINEER_MOBILE_READ_MODEL_TABLE}
where organization_id = $1
  and assigned_engineer_id = $2
  and appointment_id = $3
limit 1
`.trim();

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function emptyTaskList() {
  return {
    tasks: [],
  };
}

function emptyTaskDetail() {
  return {
    task: null,
  };
}

function resolveQueryClient(options) {
  if (!isPlainObject(options)) {
    return undefined;
  }

  const dbClient = options.dbClient || options.transaction;

  if (typeof dbClient === 'function') {
    return dbClient;
  }

  if (dbClient && typeof dbClient.query === 'function') {
    return dbClient.query.bind(dbClient);
  }

  return undefined;
}

function rowsFromQueryResult(result) {
  if (Array.isArray(result)) {
    return result;
  }

  if (isPlainObject(result) && Array.isArray(result.rows)) {
    return result.rows;
  }

  return [];
}

function listValues(input = {}) {
  const source = isPlainObject(input) ? input : {};
  const organizationId = safeString(source.organizationId);
  const engineerId = safeString(source.engineerId);

  if (!organizationId || !engineerId) {
    return undefined;
  }

  const dateRange = isPlainObject(source.dateRange) ? source.dateRange : {};

  return [
    organizationId,
    engineerId,
    safeString(dateRange.from) || null,
    safeString(dateRange.to) || null,
  ];
}

function detailValues(input = {}) {
  const source = isPlainObject(input) ? input : {};
  const organizationId = safeString(source.organizationId);
  const engineerId = safeString(source.engineerId);
  const appointmentId = safeString(source.appointmentId);

  if (!organizationId || !engineerId || !appointmentId) {
    return undefined;
  }

  return [
    organizationId,
    engineerId,
    appointmentId,
  ];
}

function mapTaskList(rows, values) {
  return {
    tasks: mapEngineerMobileTaskListRows(rows, {
      engineerId: values[1],
      organizationId: values[0],
    }),
  };
}

function mapTaskDetail(rows, values) {
  return mapEngineerMobileTaskDetailRowsToReadModel({
    appointmentId: values[2],
    engineerId: values[1],
    organizationId: values[0],
    rows,
  });
}

function createEngineerMobileReadModelRepository(options = {}) {
  const query = resolveQueryClient(options);

  async function getTaskList(input = {}) {
    const values = listValues(input);

    if (!values || typeof query !== 'function') {
      return emptyTaskList();
    }

    try {
      const result = await query(LIST_SQL, values);

      return mapTaskList(rowsFromQueryResult(result), values);
    } catch (_error) {
      return emptyTaskList();
    }
  }

  async function getTaskDetail(input = {}) {
    const values = detailValues(input);

    if (!values || typeof query !== 'function') {
      return emptyTaskDetail();
    }

    try {
      const result = await query(DETAIL_SQL, values);

      return mapTaskDetail(rowsFromQueryResult(result), values);
    } catch (_error) {
      return emptyTaskDetail();
    }
  }

  async function getReadModel(input = {}) {
    const source = isPlainObject(input) ? input : {};

    if (source.appointmentId) {
      return getTaskDetail(source);
    }

    return getTaskList(source);
  }

  return {
    getReadModel,
    getTaskDetail,
    getTaskList,
    name: 'engineerMobileReadModelRepository',
  };
}

module.exports = {
  DETAIL_SQL,
  ENGINEER_MOBILE_READ_MODEL_COLUMNS,
  ENGINEER_MOBILE_READ_MODEL_TABLE,
  LIST_SQL,
  createEngineerMobileReadModelRepository,
};
