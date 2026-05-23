'use strict';

const { createCustomerAccessDbAdapter } = require('../customerAccess/customerAccessDbAdapter');
const { buildCustomerAccessContextMiddleware } = require('../customerAccess/customerAccessContextMiddleware');
const { handleCustomerAccessRequest } = require('../controllers/customerAccessController');

const CUSTOMER_ACCESS_ROUTE_PATH = '/customer-access/:caseId';
function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function middlewareOptionsFromRouteOptions(options) {
  if (!isObject(options)) {
    return options;
  }

  if (options.repository) {
    return options;
  }

  const dbAdapter = isObject(options.dbAdapter) ? options.dbAdapter : undefined;

  if (dbAdapter && dbAdapter.repository) {
    return {
      ...options,
      repository: dbAdapter.repository,
    };
  }

  if (options.queryExecutor) {
    return options;
  }

  if (dbAdapter && dbAdapter.queryExecutor) {
    return {
      ...options,
      queryExecutor: dbAdapter.queryExecutor,
    };
  }

  if (options.dbClient) {
    const adapter = createCustomerAccessDbAdapter({ dbClient: options.dbClient });

    return {
      ...options,
      repository: adapter.repository,
    };
  }

  if (Object.prototype.hasOwnProperty.call(options, 'dbAdapter')) {
    return {
      ...options,
      repository: {},
    };
  }

  return options;
}

function registerCustomerAccessRoutes(router, options) {
  if (!router || typeof router.get !== 'function') {
    return router;
  }

  const customerAccessContextMiddleware = buildCustomerAccessContextMiddleware(
    middlewareOptionsFromRouteOptions(options),
  );

  router.get(CUSTOMER_ACCESS_ROUTE_PATH, customerAccessContextMiddleware, handleCustomerAccessRequest);

  return router;
}

module.exports = {
  CUSTOMER_ACCESS_ROUTE_PATH,
  registerCustomerAccessRoutes,
};
