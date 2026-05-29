'use strict';

const {
  registerCustomerAccessRoutes,
} = require('../routes/customerAccessRoutes');

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function createCustomerAccessProductionMountComposition(input = {}) {
  const options = isObject(input) ? input : {};

  return registerCustomerAccessRoutes(options.router, {
    dbClient: options.dbClient,
    repository: options.repository,
    auditWriter: options.auditWriter,
  });
}

module.exports = {
  createCustomerAccessProductionMountComposition,
};
