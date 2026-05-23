'use strict';

const { createApp: defaultCreateApp } = require('../app');
const customerAccessBootstrapConfigModule = './customerAccessBootstrapConfig';
const {
  buildCustomerAccessBootstrapOptions,
} = require(customerAccessBootstrapConfigModule);

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function resolveCreateApp(options) {
  if (isObject(options) && typeof options.createApp === 'function') {
    return options.createApp;
  }

  if (typeof defaultCreateApp === 'function') {
    return defaultCreateApp;
  }

  throw new Error('customerAccess.bootstrapAdapter.unavailable');
}

function createCustomerAccessEnabledApp(options = {}) {
  const createApp = resolveCreateApp(options);
  const bootstrapOptions = buildCustomerAccessBootstrapOptions(options);

  return createApp(bootstrapOptions.enabled ? { customerAccess: bootstrapOptions.customerAccess } : {});
}

module.exports = {
  createCustomerAccessEnabledApp,
};
