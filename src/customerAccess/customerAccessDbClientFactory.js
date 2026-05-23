'use strict';

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function buildSafeSummary(flags = {}) {
  return {
    enabled: Boolean(flags.enabled),
    readOnly: Boolean(flags.readOnly),
    hasQuery: Boolean(flags.hasQuery),
  };
}

function buildDisabledResult() {
  return {
    enabled: false,
    dbClient: null,
    safeSummary: buildSafeSummary({
      enabled: false,
      readOnly: false,
      hasQuery: false,
    }),
  };
}

function resolveConnector(options = {}) {
  if (isPlainObject(options.connector) && typeof options.connector.createReadOnlyClient === 'function') {
    return options.connector.createReadOnlyClient;
  }

  if (typeof options.createReadOnlyClient === 'function') {
    return options.createReadOnlyClient;
  }

  return null;
}

function cloneConfig(config) {
  if (!isPlainObject(config)) {
    return null;
  }

  return {
    ...config,
  };
}

function buildCustomerAccessDbClient(options = {}) {
  if (!isPlainObject(options)) {
    return buildDisabledResult();
  }

  const createReadOnlyClient = resolveConnector(options);
  const config = cloneConfig(options.config);

  if (!createReadOnlyClient || !config || config.readOnly !== true) {
    return buildDisabledResult();
  }

  try {
    const dbClient = createReadOnlyClient(config);

    if (!dbClient || typeof dbClient.query !== 'function') {
      return buildDisabledResult();
    }

    return {
      enabled: true,
      dbClient,
      safeSummary: buildSafeSummary({
        enabled: true,
        readOnly: true,
        hasQuery: true,
      }),
    };
  } catch (error) {
    return buildDisabledResult();
  }
}

function createCustomerAccessDbClientFactory(options = {}) {
  const factoryOptions = {
    ...options,
    config: cloneConfig(options.config),
  };

  return {
    build() {
      return buildCustomerAccessDbClient(factoryOptions);
    },
  };
}

module.exports = {
  buildCustomerAccessDbClient,
  createCustomerAccessDbClientFactory,
};
