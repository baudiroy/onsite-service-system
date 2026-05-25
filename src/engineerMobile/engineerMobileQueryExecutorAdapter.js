'use strict';

const ENGINEER_MOBILE_QUERY_PARAM_ORDER_BY_NAME = Object.freeze({
  engineerMobileTaskDetailReadModel: Object.freeze([
    'organizationId',
    'engineerId',
    'appointmentId',
  ]),
  engineerMobileTaskListReadModel: Object.freeze([
    'organizationId',
    'engineerId',
    'from',
    'to',
  ]),
});

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function emptyRows() {
  return {
    rows: [],
  };
}

function cloneRows(rows) {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map((row) => (
    isPlainObject(row)
      ? JSON.parse(JSON.stringify(row))
      : row
  ));
}

function resolveQueryMethod(queryClient) {
  if (typeof queryClient === 'function') {
    return queryClient;
  }

  if (queryClient && typeof queryClient.query === 'function') {
    return queryClient.query.bind(queryClient);
  }

  return undefined;
}

function valuesFromSpec(querySpec) {
  if (!isPlainObject(querySpec) || !isPlainObject(querySpec.params)) {
    return undefined;
  }

  const paramOrder = ENGINEER_MOBILE_QUERY_PARAM_ORDER_BY_NAME[querySpec.name];

  if (!paramOrder) {
    return undefined;
  }

  return paramOrder.map((key) => (
    querySpec.params[key] === undefined ? null : querySpec.params[key]
  ));
}

function isExecutableQuerySpec(querySpec) {
  return Boolean(
    isPlainObject(querySpec)
    && querySpec.ok === true
    && querySpec.executable === true
    && typeof querySpec.name === 'string'
    && Object.prototype.hasOwnProperty.call(
      ENGINEER_MOBILE_QUERY_PARAM_ORDER_BY_NAME,
      querySpec.name,
    )
    && typeof querySpec.sql === 'string'
    && querySpec.sql.trim()
  );
}

function rowsFromQueryResult(result) {
  if (Array.isArray(result)) {
    return cloneRows(result);
  }

  if (isPlainObject(result) && Array.isArray(result.rows)) {
    return cloneRows(result.rows);
  }

  return [];
}

function createEngineerMobileQueryExecutorAdapter(queryClient) {
  const query = resolveQueryMethod(queryClient);

  return async function engineerMobileQueryExecutorAdapter(querySpec) {
    if (typeof query !== 'function' || !isExecutableQuerySpec(querySpec)) {
      return emptyRows();
    }

    const values = valuesFromSpec(querySpec);

    if (!Array.isArray(values)) {
      return emptyRows();
    }

    try {
      const result = await query(querySpec.sql, values);

      return {
        rows: rowsFromQueryResult(result),
      };
    } catch (error) {
      return emptyRows();
    }
  };
}

module.exports = {
  ENGINEER_MOBILE_QUERY_PARAM_ORDER_BY_NAME,
  createEngineerMobileQueryExecutorAdapter,
};
