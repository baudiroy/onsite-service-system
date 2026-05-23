'use strict';

const {
  buildCustomerAccessBootstrapInputFromEnv,
} = require('./customerAccessEnvBoundary');
const {
  buildCustomerAccessDbClient,
} = require('./customerAccessDbClientFactory');

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function copyAllowedCustomerAccessOptions(customerAccess) {
  if (!isPlainObject(customerAccess)) {
    return {};
  }

  const copied = {};

  for (const key of ['repository', 'dbAdapter', 'queryExecutor', 'dbClient', 'getInput']) {
    if (customerAccess[key]) {
      copied[key] = customerAccess[key];
    }
  }

  return copied;
}

function hasRuntimeOption(customerAccess) {
  return Boolean(
    customerAccess.repository
    || customerAccess.dbAdapter
    || customerAccess.queryExecutor
    || customerAccess.dbClient
  );
}

function loadReadOnlyDbConnectorFactory() {
  return require(['.', 'customerAccessReadOnlyDbConnector'].join('/'))
    .createCustomerAccessReadOnlyDbConnector;
}

function resolveConnector(input) {
  if (!isPlainObject(input)) {
    return null;
  }

  if (input.connector) {
    return input.connector;
  }

  if (input.pool || input.db) {
    const createCustomerAccessReadOnlyDbConnector = loadReadOnlyDbConnectorFactory();

    return createCustomerAccessReadOnlyDbConnector({
      pool: input.pool,
      db: input.db,
    });
  }

  return null;
}

function buildSafeSummary(flags = {}) {
  return {
    enabled: Boolean(flags.enabled),
    readOnlyEnabled: Boolean(flags.readOnlyEnabled),
    dbEnabled: Boolean(flags.dbEnabled),
    hasGeneratedDbClient: Boolean(flags.hasGeneratedDbClient),
    hasRepository: Boolean(flags.hasRepository),
    hasDbAdapter: Boolean(flags.hasDbAdapter),
    hasQueryExecutor: Boolean(flags.hasQueryExecutor),
    hasDbClient: Boolean(flags.hasDbClient),
  };
}

function buildDisabledOutput() {
  return {
    enabled: false,
    customerAccessBootstrap: {
      enabled: false,
    },
    safeSummary: buildSafeSummary(),
  };
}

function composeCustomerAccessBootstrap(input = {}) {
  if (!isPlainObject(input)) {
    return buildDisabledOutput();
  }

  const envBootstrap = buildCustomerAccessBootstrapInputFromEnv(input.env);
  const customerAccess = copyAllowedCustomerAccessOptions(input.customerAccess);
  const hasCallerRuntimeOption = hasRuntimeOption(customerAccess);
  let hasGeneratedDbClient = false;

  if (
    envBootstrap.safeSummary.dbEnabled
    && !hasCallerRuntimeOption
  ) {
    const dbClientResult = buildCustomerAccessDbClient({
      connector: resolveConnector(input),
      config: input.dbClientConfig,
    });

    if (dbClientResult.enabled) {
      customerAccess.dbClient = dbClientResult.dbClient;
      hasGeneratedDbClient = true;
    }
  }

  const enabled = Boolean(envBootstrap.enabled || hasCallerRuntimeOption || customerAccess.getInput);

  if (!enabled) {
    return buildDisabledOutput();
  }

  const hasDbClient = Boolean(customerAccess.dbClient);

  return {
    enabled: true,
    customerAccessBootstrap: {
      enabled: true,
      customerAccess: {
        enabled: true,
        ...customerAccess,
      },
    },
    safeSummary: buildSafeSummary({
      enabled: true,
      readOnlyEnabled: envBootstrap.safeSummary.readOnlyEnabled,
      dbEnabled: envBootstrap.safeSummary.dbEnabled,
      hasGeneratedDbClient,
      hasRepository: customerAccess.repository,
      hasDbAdapter: customerAccess.dbAdapter,
      hasQueryExecutor: customerAccess.queryExecutor,
      hasDbClient,
    }),
  };
}

module.exports = {
  composeCustomerAccessBootstrap,
};
