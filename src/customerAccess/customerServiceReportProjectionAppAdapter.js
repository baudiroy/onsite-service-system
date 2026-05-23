'use strict';

const {
  createCustomerServiceReportProjectionHandler,
} = require('./customerServiceReportProjectionHandler');

const DEFAULT_INTERNAL_PROJECTION_PATH = '/__internal/customer-access/service-reports/:caseId';
const SAFE_UNAVAILABLE_MESSAGE_KEY = 'customerAccess.unavailable';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function safeNotRegistered() {
  return {
    registered: false,
    messageKey: SAFE_UNAVAILABLE_MESSAGE_KEY,
    customerVisible: false,
  };
}

function registerCustomerServiceReportProjectionRoute(options = {}) {
  if (!isObject(options)) {
    return safeNotRegistered();
  }

  const target = options.app || options.router;

  if (!target || typeof target.get !== 'function') {
    return safeNotRegistered();
  }

  if (!options.dbClient || typeof options.dbClient.query !== 'function') {
    return safeNotRegistered();
  }

  const path = stringValue(options.path) || DEFAULT_INTERNAL_PROJECTION_PATH;
  const handler = createCustomerServiceReportProjectionHandler({
    dbClient: options.dbClient,
  });

  try {
    target.get(path, handler);
  } catch (_error) {
    return safeNotRegistered();
  }

  return {
    registered: true,
    method: 'GET',
    path,
    handler,
  };
}

module.exports = {
  DEFAULT_INTERNAL_PROJECTION_PATH,
  registerCustomerServiceReportProjectionRoute,
};
