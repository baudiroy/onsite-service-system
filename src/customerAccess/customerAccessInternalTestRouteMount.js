'use strict';

const {
  DEFAULT_INTERNAL_PROJECTION_PATH,
  registerCustomerServiceReportProjectionRoute,
} = require('./customerServiceReportProjectionAppAdapter');

const SAFE_UNAVAILABLE_MESSAGE_KEY = 'customerAccess.unavailable';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function safeNotMounted() {
  return {
    mounted: false,
    messageKey: SAFE_UNAVAILABLE_MESSAGE_KEY,
    customerVisible: false,
  };
}

function isInternalTestPath(path) {
  return typeof path === 'string' && path.startsWith('/__internal/');
}

function mountCustomerAccessInternalTestRoutes(options = {}) {
  if (!isObject(options)) {
    return safeNotMounted();
  }

  const target = options.app || options.router;

  if (!target || typeof target.get !== 'function') {
    return safeNotMounted();
  }

  if (!options.dbClient || typeof options.dbClient.query !== 'function') {
    return safeNotMounted();
  }

  const path = stringValue(options.path) || DEFAULT_INTERNAL_PROJECTION_PATH;

  if (!isInternalTestPath(path)) {
    return safeNotMounted();
  }

  const result = registerCustomerServiceReportProjectionRoute({
    app: target,
    dbClient: options.dbClient,
    path,
  });

  if (!result.registered) {
    return safeNotMounted();
  }

  return {
    mounted: true,
    registered: true,
    internalOnly: true,
    testOnly: true,
    method: result.method,
    path: result.path,
    handler: result.handler,
  };
}

module.exports = {
  DEFAULT_INTERNAL_TEST_ROUTE_PATH: DEFAULT_INTERNAL_PROJECTION_PATH,
  mountCustomerAccessInternalTestRoutes,
};
