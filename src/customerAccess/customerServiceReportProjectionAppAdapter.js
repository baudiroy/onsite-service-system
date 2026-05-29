'use strict';

const {
  createCustomerServiceReportProjectionHandler,
} = require('./customerServiceReportProjectionHandler');

const DEFAULT_INTERNAL_PROJECTION_PATH = '/customer-access/:caseId/service-report/:reportId';
const SAFE_UNAVAILABLE_MESSAGE_KEY = 'customerAccess.unavailable';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeProperty(value, key) {
  try {
    return value[key];
  } catch (_error) {
    return undefined;
  }
}

function hasPlainPrototype(value) {
  try {
    const prototype = Object.getPrototypeOf(value);

    return prototype === null || prototype === Object.prototype;
  } catch (_error) {
    return false;
  }
}

function isSafeMountTarget(value) {
  if (!isObject(value)) {
    return false;
  }

  if (Buffer.isBuffer(value) || value instanceof Date || value instanceof Error) {
    return false;
  }

  if (!hasPlainPrototype(value)) {
    return false;
  }

  if (typeof safeProperty(value, 'then') === 'function') {
    return false;
  }

  return typeof safeProperty(value, 'get') === 'function';
}

function mountTargetFromOptions(options) {
  for (const key of ['app', 'router']) {
    const target = safeProperty(options, key);

    if (isSafeMountTarget(target)) {
      return {
        target,
        get: safeProperty(target, 'get'),
      };
    }
  }

  return undefined;
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

  const registrationTarget = mountTargetFromOptions(options);

  if (!registrationTarget) {
    return safeNotRegistered();
  }

  if (!options.dbClient || typeof options.dbClient.query !== 'function') {
    return safeNotRegistered();
  }

  const path = stringValue(options.path) || DEFAULT_INTERNAL_PROJECTION_PATH;
  const handler = createCustomerServiceReportProjectionHandler({
    dbClient: options.dbClient,
    projectionService: options.projectionService,
  });

  try {
    registrationTarget.get.call(registrationTarget.target, path, handler);
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
