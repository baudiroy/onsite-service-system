'use strict';

const SENSITIVE_KEY_PATTERN = /token|secret|password|databaseurl|connectionstring|rawline|rawphone|rawaddress|lineuserid|phone|address/i;

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasRuntimeCustomerAccessOption(customerAccess) {
  return Boolean(
    customerAccess.repository
    || customerAccess.dbAdapter
    || customerAccess.queryExecutor
    || customerAccess.dbClient
  );
}

function copyAllowedCustomerAccessOptions(customerAccess) {
  if (!isPlainObject(customerAccess)) {
    return {};
  }

  const sanitized = {};

  for (const key of ['repository', 'dbAdapter', 'queryExecutor', 'dbClient', 'getInput']) {
    if (customerAccess[key]) {
      sanitized[key] = customerAccess[key];
    }
  }

  return sanitized;
}

function stripSensitiveKeys(value) {
  if (!isPlainObject(value)) {
    return {};
  }

  const sanitized = {};

  for (const [key, entry] of Object.entries(value)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      continue;
    }

    if (isPlainObject(entry)) {
      sanitized[key] = stripSensitiveKeys(entry);
      continue;
    }

    sanitized[key] = entry;
  }

  return sanitized;
}

function buildDisabledCustomerAccessBootstrapOptions() {
  return {
    enabled: false,
  };
}

function buildCustomerAccessBootstrapOptions(options) {
  if (!isPlainObject(options)) {
    return buildDisabledCustomerAccessBootstrapOptions();
  }

  if (options.enabled === false) {
    return buildDisabledCustomerAccessBootstrapOptions();
  }

  if (isPlainObject(options.customerAccess) && options.customerAccess.enabled === false) {
    return buildDisabledCustomerAccessBootstrapOptions();
  }

  const customerAccess = copyAllowedCustomerAccessOptions(options.customerAccess);

  if (!customerAccess.dbClient && options.dbClient) {
    customerAccess.dbClient = options.dbClient;
  }

  if (!hasRuntimeCustomerAccessOption(customerAccess)) {
    return buildDisabledCustomerAccessBootstrapOptions();
  }

  return {
    enabled: true,
    customerAccess,
  };
}

module.exports = {
  buildCustomerAccessBootstrapOptions,
  buildDisabledCustomerAccessBootstrapOptions,
  stripSensitiveKeys,
};
