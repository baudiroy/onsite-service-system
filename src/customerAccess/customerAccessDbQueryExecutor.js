'use strict';

const ROW_MAPPERS = Object.freeze({
  case: mapCaseRow,
  customerIdentity: mapCustomerIdentityRow,
  publication: mapPublicationRow,
  serviceReport: mapServiceReportRow,
});

const ROW_BUNDLE_KEYS = Object.freeze({
  case: 'caseRow',
  customerIdentity: 'customerIdentityRow',
  publication: 'publicationRow',
  serviceReport: 'serviceReportRow',
});

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function booleanValue(value) {
  return value === true;
}

function isExecutableQuerySpec(querySpec) {
  return isObject(querySpec)
    && querySpec.executable === true
    && isObject(querySpec.params)
    && Array.isArray(querySpec.statements)
    && querySpec.statements.length > 0;
}

function statementParamValues(statement, querySpec) {
  if (!isObject(statement) || !Array.isArray(statement.params)) {
    return undefined;
  }

  const values = [];

  for (const paramName of statement.params) {
    const value = querySpec.params[paramName];

    if (!stringValue(value)) {
      return undefined;
    }

    values.push(value);
  }

  return values;
}

function firstResultRow(result) {
  if (Array.isArray(result)) {
    return isObject(result[0]) ? result[0] : undefined;
  }

  if (isObject(result) && Array.isArray(result.rows)) {
    return isObject(result.rows[0]) ? result.rows[0] : undefined;
  }

  return undefined;
}

function isPromiseLike(value) {
  return Boolean(value) && typeof value.then === 'function';
}

function mapCaseRow(row) {
  return {
    ...(stringValue(row.id) ? { id: stringValue(row.id) } : {}),
    ...(stringValue(row.organization_id) ? { organization_id: stringValue(row.organization_id) } : {}),
    ...(stringValue(row.customer_id) ? { customer_id: stringValue(row.customer_id) } : {}),
  };
}

function mapCustomerIdentityRow(row) {
  return {
    ...(stringValue(row.customer_id) ? { customer_id: stringValue(row.customer_id) } : {}),
    ...(stringValue(row.organization_id) ? { organization_id: stringValue(row.organization_id) } : {}),
    verified: booleanValue(row.verified),
    ...(stringValue(row.line_channel_id) ? { line_channel_id: stringValue(row.line_channel_id) } : {}),
  };
}

function mapPublicationRow(row) {
  return {
    ...(stringValue(row.case_id) ? { case_id: stringValue(row.case_id) } : {}),
    ...(stringValue(row.organization_id) ? { organization_id: stringValue(row.organization_id) } : {}),
    publication_allowed: booleanValue(row.publication_allowed),
    customer_visible_policy_passed: booleanValue(row.customer_visible_policy_passed),
  };
}

function mapServiceReportRow(row) {
  return {
    ...(stringValue(row.public_report_id) ? { public_report_id: stringValue(row.public_report_id) } : {}),
    ...(stringValue(row.status) ? { status: stringValue(row.status) } : {}),
  };
}

function executeStatement(dbClient, statement, querySpec) {
  if (!isObject(statement) || !stringValue(statement.key) || !stringValue(statement.sql)) {
    return undefined;
  }

  const statementParams = statementParamValues(statement, querySpec);

  if (!statementParams || typeof dbClient.query !== 'function') {
    return undefined;
  }

  return dbClient.query(statement.sql, statementParams);
}

async function executeStatementsAsync(pendingResult, startIndex, statements, querySpec, dbClient, rowBundle) {
  try {
    for (let index = startIndex; index < statements.length; index += 1) {
      const statement = statements[index];
      const mapper = ROW_MAPPERS[statement && statement.key];
      const bundleKey = ROW_BUNDLE_KEYS[statement && statement.key];

      if (!mapper || !bundleKey) {
        return {};
      }

      const result = index === startIndex
        ? await pendingResult
        : await executeStatement(dbClient, statement, querySpec);
      const row = firstResultRow(result);

      if (row) {
        rowBundle[bundleKey] = mapper(row);
      }
    }

    return rowBundle;
  } catch (error) {
    return {};
  }
}

function createCustomerAccessDbQueryExecutor(options) {
  const dbClient = isObject(options) ? options.dbClient : undefined;

  return function customerAccessDbQueryExecutor(querySpec) {
    if (!isObject(dbClient) || typeof dbClient.query !== 'function') {
      return {};
    }

    if (!isExecutableQuerySpec(querySpec)) {
      return {};
    }

    try {
      const rowBundle = {};

      for (let index = 0; index < querySpec.statements.length; index += 1) {
        const statement = querySpec.statements[index];
        const mapper = ROW_MAPPERS[statement && statement.key];
        const bundleKey = ROW_BUNDLE_KEYS[statement && statement.key];

        if (!mapper || !bundleKey) {
          return {};
        }

        const result = executeStatement(dbClient, statement, querySpec);

        if (isPromiseLike(result)) {
          return executeStatementsAsync(result, index, querySpec.statements, querySpec, dbClient, rowBundle);
        }

        const row = firstResultRow(result);

        if (row) {
          rowBundle[bundleKey] = mapper(row);
        }
      }

      return rowBundle;
    } catch (error) {
      return {};
    }
  };
}

module.exports = {
  createCustomerAccessDbQueryExecutor,
};
