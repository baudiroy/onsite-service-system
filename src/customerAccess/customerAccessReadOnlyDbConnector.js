'use strict';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function safeError(message) {
  const error = new Error(message);
  error.code = 'CUSTOMER_ACCESS_READ_ONLY_DB_CONNECTOR_DENIED';
  return error;
}

function resolveQueryTarget(options = {}) {
  if (isObject(options.pool) && typeof options.pool.query === 'function') {
    return options.pool;
  }

  if (isObject(options.db) && typeof options.db.query === 'function') {
    return options.db;
  }

  return null;
}

function normalizeAllowedStatementNames(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => nonEmptyString(item))
    .filter(Boolean);
}

function statementNameFromConfig(config) {
  if (!isObject(config)) {
    return undefined;
  }

  return nonEmptyString(config.statementName)
    || nonEmptyString(config.statement)
    || nonEmptyString(config.name);
}

function statementNameIsAllowed(statementName, allowedStatementNames) {
  if (!statementName || allowedStatementNames.length === 0) {
    return true;
  }

  return allowedStatementNames.includes(statementName);
}

function queryArgsFromInput(sqlOrConfig, params) {
  if (typeof sqlOrConfig === 'string') {
    return {
      sql: nonEmptyString(sqlOrConfig),
      params,
    };
  }

  if (!isObject(sqlOrConfig) || sqlOrConfig.readOnly !== true) {
    return {
      sql: undefined,
      params: undefined,
    };
  }

  return {
    sql: nonEmptyString(sqlOrConfig.text),
    params: sqlOrConfig.values,
  };
}

function createCustomerAccessReadOnlyDbConnector(options = {}) {
  const queryTarget = resolveQueryTarget(options);
  const allowedStatementNames = normalizeAllowedStatementNames(options.allowedStatementNames);

  return {
    createReadOnlyClient(config = {}) {
      if (!queryTarget || !isObject(config) || config.readOnly !== true) {
        return null;
      }

      if (!statementNameIsAllowed(statementNameFromConfig(config), allowedStatementNames)) {
        return null;
      }

      return {
        query(sqlOrConfig, params) {
          const queryArgs = queryArgsFromInput(sqlOrConfig, params);
          const safeSql = queryArgs.sql;

          if (!safeSql) {
            throw safeError('customer_access_read_only_query_rejected');
          }

          if (!Array.isArray(queryArgs.params)) {
            throw safeError('customer_access_read_only_query_rejected');
          }

          try {
            return queryTarget.query(safeSql, queryArgs.params.slice());
          } catch (error) {
            throw safeError('customer_access_read_only_query_failed');
          }
        },
      };
    },
  };
}

module.exports = {
  createCustomerAccessReadOnlyDbConnector,
};
