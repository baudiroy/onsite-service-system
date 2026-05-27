'use strict';

const {
  ASSIGNED_APPOINTMENT_DETAIL_QUERY_NAME,
  ASSIGNED_APPOINTMENT_LIST_QUERY_NAME,
  ASSIGNED_APPOINTMENT_SAFE_SELECTED_FIELDS,
} = require('./engineerMobileAssignedAppointmentSqlQueryBuilder');

const SAFE_QUERY_EXECUTOR_GUARD_ERROR_MESSAGE = 'engineerMobile.assignedAppointmentQueryExecutorGuard.unavailable';

const ASSIGNED_APPOINTMENT_QUERY_INTENT_BY_NAME = Object.freeze({
  [ASSIGNED_APPOINTMENT_DETAIL_QUERY_NAME]: 'engineerMobileAssignedAppointments.readOnlyDetail',
  [ASSIGNED_APPOINTMENT_LIST_QUERY_NAME]: 'engineerMobileAssignedAppointments.readOnlyList',
});

const QUERY_CONTRACT_BY_NAME = Object.freeze({
  [ASSIGNED_APPOINTMENT_DETAIL_QUERY_NAME]: Object.freeze({
    intent: ASSIGNED_APPOINTMENT_QUERY_INTENT_BY_NAME[ASSIGNED_APPOINTMENT_DETAIL_QUERY_NAME],
    requiredParams: Object.freeze([
      'appointmentId',
      'engineerUserId',
      'organizationId',
    ]),
    valuesLength: 3,
  }),
  [ASSIGNED_APPOINTMENT_LIST_QUERY_NAME]: Object.freeze({
    intent: ASSIGNED_APPOINTMENT_QUERY_INTENT_BY_NAME[ASSIGNED_APPOINTMENT_LIST_QUERY_NAME],
    requiredParams: Object.freeze([
      'engineerUserId',
      'organizationId',
    ]),
    valuesLength: 5,
  }),
});

const UNSAFE_SQL_VERBS = Object.freeze([
  'INSERT',
  'UPDATE',
  'DELETE',
  'UPSERT',
  'MERGE',
  'ALTER',
  'DROP',
  'CREATE',
  'TRUNCATE',
]);

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function emptyRows() {
  return Object.freeze({
    rows: Object.freeze([]),
  });
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

function resolveDelegate(delegateExecutor) {
  if (typeof delegateExecutor === 'function') {
    return delegateExecutor;
  }

  if (!isObject(delegateExecutor)) {
    return undefined;
  }

  for (const methodName of ['execute', 'run']) {
    if (typeof delegateExecutor[methodName] === 'function') {
      return delegateExecutor[methodName].bind(delegateExecutor);
    }
  }

  return undefined;
}

function cloneSafeRow(row) {
  if (!isObject(row)) {
    return row;
  }

  return JSON.parse(JSON.stringify(row));
}

function rowsFromDelegateResult(result) {
  if (Array.isArray(result)) {
    return result.map(cloneSafeRow);
  }

  if (isObject(result) && Array.isArray(result.rows)) {
    return result.rows.map(cloneSafeRow);
  }

  return [];
}

function sqlIsSelectOnly(sql) {
  const normalizedSql = safeString(sql);

  if (!normalizedSql || !/^SELECT\b/i.test(normalizedSql)) {
    return false;
  }

  return UNSAFE_SQL_VERBS.every((verb) => {
    const pattern = new RegExp(`\\b${verb}\\b`, 'i');

    return pattern.test(normalizedSql) === false;
  });
}

function paramValue(params, key) {
  return isObject(params) ? safeString(params[key]) : undefined;
}

function safeParamsForContract(params, contract) {
  if (!isObject(params)) {
    return undefined;
  }

  const safeParams = {};

  for (const key of contract.requiredParams) {
    const value = paramValue(params, key);

    if (!value) {
      return undefined;
    }

    safeParams[key] = value;
  }

  for (const key of ['from', 'status', 'to']) {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      safeParams[key] = safeString(params[key]) || null;
    }
  }

  return Object.freeze(safeParams);
}

function fieldsMatchContract(fields) {
  return Array.isArray(fields)
    && fields.length === ASSIGNED_APPOINTMENT_SAFE_SELECTED_FIELDS.length
    && ASSIGNED_APPOINTMENT_SAFE_SELECTED_FIELDS.every((field, index) => fields[index] === field);
}

function valuesMatchContract(values, contract) {
  return Array.isArray(values) && values.length === contract.valuesLength;
}

function normalizeIntent(querySpec, contract) {
  const explicitIntent = safeString(querySpec.intent);

  if (explicitIntent && explicitIntent !== contract.intent) {
    return undefined;
  }

  return contract.intent;
}

function sanitizedQuerySpec(querySpec) {
  if (!isObject(querySpec) || typeof querySpec.sql === 'string' && querySpec.name === undefined) {
    return undefined;
  }

  const name = safeString(querySpec.name);
  const contract = QUERY_CONTRACT_BY_NAME[name];

  if (
    !contract
    || querySpec.ok !== true
    || querySpec.executable !== false
    || !sqlIsSelectOnly(querySpec.sql)
    || !fieldsMatchContract(querySpec.fields)
    || !valuesMatchContract(querySpec.values, contract)
  ) {
    return undefined;
  }

  const intent = normalizeIntent(querySpec, contract);
  const params = safeParamsForContract(querySpec.params, contract);

  if (!intent || !params) {
    return undefined;
  }

  return Object.freeze({
    executable: false,
    fields: Object.freeze([...ASSIGNED_APPOINTMENT_SAFE_SELECTED_FIELDS]),
    intent,
    name,
    ok: true,
    params,
    sql: querySpec.sql.trim(),
    values: Object.freeze([...querySpec.values]),
  });
}

async function emitSafeAudit(auditLogger, metadata) {
  if (!auditLogger) {
    return;
  }

  try {
    if (typeof auditLogger === 'function') {
      await auditLogger(metadata);
      return;
    }

    if (isObject(auditLogger) && typeof auditLogger.record === 'function') {
      await auditLogger.record(metadata);
      return;
    }

    if (isObject(auditLogger) && typeof auditLogger.log === 'function') {
      await auditLogger.log(metadata);
    }
  } catch (error) {
    // Optional guard audit metadata must never affect read behavior.
  }
}

function safeAuditMetadata({ intent, name, outcome, reason, rowCount }) {
  const metadata = {
    event: 'engineerMobile.assignedAppointmentQueryExecutorGuard.read',
    outcome,
  };

  if (intent) {
    metadata.intent = intent;
  }

  if (name) {
    metadata.name = name;
  }

  if (reason) {
    metadata.reason = reason;
  }

  if (Number.isInteger(rowCount)) {
    metadata.rowCount = rowCount;
  }

  return Object.freeze(metadata);
}

function createEngineerMobileAssignedAppointmentQueryExecutorGuard(options = {}) {
  const dependencies = isObject(options) ? options : {};
  const execute = resolveDelegate(dependencies.delegateExecutor);
  const { auditLogger } = dependencies;

  async function guardedAssignedAppointmentQueryExecutor(querySpec) {
    const safeSpec = sanitizedQuerySpec(querySpec);

    if (!execute || !safeSpec) {
      await emitSafeAudit(auditLogger, safeAuditMetadata({
        name: isObject(querySpec) ? safeString(querySpec.name) : undefined,
        outcome: 'deny',
        reason: execute ? 'unsafe_query_spec' : 'missing_delegate_executor',
      }));

      return emptyRows();
    }

    try {
      const rows = rowsFromDelegateResult(await execute(safeSpec));

      await emitSafeAudit(auditLogger, safeAuditMetadata({
        intent: safeSpec.intent,
        name: safeSpec.name,
        outcome: 'allow',
        rowCount: rows.length,
      }));

      return Object.freeze({
        rows: Object.freeze(rows),
      });
    } catch (error) {
      await emitSafeAudit(auditLogger, safeAuditMetadata({
        intent: safeSpec.intent,
        name: safeSpec.name,
        outcome: 'deny',
        reason: 'delegate_executor_unavailable',
      }));

      return emptyRows();
    }
  }

  guardedAssignedAppointmentQueryExecutor.execute = guardedAssignedAppointmentQueryExecutor;

  return Object.freeze(guardedAssignedAppointmentQueryExecutor);
}

module.exports = {
  ASSIGNED_APPOINTMENT_QUERY_INTENT_BY_NAME,
  SAFE_QUERY_EXECUTOR_GUARD_ERROR_MESSAGE,
  createEngineerMobileAssignedAppointmentQueryExecutorGuard,
};
