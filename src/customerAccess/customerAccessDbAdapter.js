'use strict';

const { createCustomerAccessDbQueryExecutor } = require('./customerAccessDbQueryExecutor');
const { createCustomerAccessReadOnlyRepository } = require('./customerAccessReadOnlyRepository');

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function createCustomerAccessDbAdapter(options) {
  const safeOptions = isObject(options) ? options : {};
  const queryExecutor = createCustomerAccessDbQueryExecutor({
    dbClient: safeOptions.dbClient,
  });
  const repository = createCustomerAccessReadOnlyRepository({
    queryExecutor,
  });

  return {
    queryExecutor,
    repository,
  };
}

module.exports = {
  createCustomerAccessDbAdapter,
};
