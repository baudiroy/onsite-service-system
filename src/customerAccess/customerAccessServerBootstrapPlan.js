'use strict';

const {
  buildCustomerAccessBootstrapOptions,
} = require('./customerAccessBootstrapConfig');

function buildSafeSummary(customerAccess, enabled) {
  const runtimeOptions = customerAccess || {};

  return {
    customerAccessEnabled: Boolean(enabled),
    hasRepository: Boolean(runtimeOptions.repository),
    hasDbAdapter: Boolean(runtimeOptions.dbAdapter),
    hasQueryExecutor: Boolean(runtimeOptions.queryExecutor),
    hasDbClient: Boolean(runtimeOptions.dbClient),
  };
}

function buildDisabledPlan(warnings) {
  return {
    enabled: false,
    shouldCreateCustomerAccessEnabledApp: false,
    appFactoryOptions: {},
    warnings: Array.isArray(warnings) ? warnings.slice() : [],
    safeSummary: buildSafeSummary(null, false),
  };
}

function buildCustomerAccessServerBootstrapPlan(input) {
  const bootstrapOptions = buildCustomerAccessBootstrapOptions(input);

  if (!bootstrapOptions.enabled) {
    return buildDisabledPlan();
  }

  const customerAccess = bootstrapOptions.customerAccess || {};

  return {
    enabled: true,
    shouldCreateCustomerAccessEnabledApp: true,
    appFactoryOptions: {
      customerAccess,
    },
    warnings: [],
    safeSummary: buildSafeSummary(customerAccess, true),
  };
}

module.exports = {
  buildCustomerAccessServerBootstrapPlan,
};
