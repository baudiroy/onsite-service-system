'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  composeCustomerAccessBootstrap,
} = require('../../src/customerAccess/customerAccessBootstrapComposer');

const repoRoot = path.resolve(__dirname, '../..');
const composerFile = path.join(repoRoot, 'src/customerAccess/customerAccessBootstrapComposer.js');

function createDbClient(calls) {
  const safeCalls = Array.isArray(calls) ? calls : [];

  return {
    query(sql, params) {
      safeCalls.push({ sql, params });
      return { rows: [] };
    },
  };
}

function createConnector(calls, dbClient) {
  const safeCalls = Array.isArray(calls) ? calls : [];

  return {
    createReadOnlyClient(config) {
      safeCalls.push(config);
      return dbClient || createDbClient([]);
    },
  };
}

function withConsoleSpy(callback) {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  const calls = [];

  console.log = (...args) => calls.push(['log', ...args]);
  console.warn = (...args) => calls.push(['warn', ...args]);
  console.error = (...args) => calls.push(['error', ...args]);

  try {
    callback(calls);
  } finally {
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
  }
}

function requireSpecifiers(source) {
  const specifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers;
}

function assertNoSensitiveLeak(value) {
  const serialized = JSON.stringify(value);

  for (const sensitiveValue of [
    'token_should_not_leak',
    'secret_should_not_leak',
    'postgres://db-url-should-not-leak',
    'connection_string_should_not_leak',
    'password_should_not_leak',
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
    'internal_connector_error_should_not_leak',
  ]) {
    assert.equal(serialized.includes(sensitiveValue), false, `leaked ${sensitiveValue}`);
  }
}

function enabledEnv() {
  return {
    CUSTOMER_ACCESS_ENABLED: 'true',
  };
}

function dbEnabledEnv() {
  return {
    CUSTOMER_ACCESS_ENABLED: 'true',
    CUSTOMER_ACCESS_DB_ENABLED: 'true',
  };
}

function secretConfig() {
  return {
    readOnly: true,
    connectionString: 'postgres://db-url-should-not-leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    password: 'password_should_not_leak',
  };
}

test('exports composeCustomerAccessBootstrap', () => {
  assert.equal(typeof composeCustomerAccessBootstrap, 'function');
});

test('missing input returns disabled safe output', () => {
  assert.deepEqual(composeCustomerAccessBootstrap(), {
    enabled: false,
    customerAccessBootstrap: {
      enabled: false,
    },
    safeSummary: {
      enabled: false,
      readOnlyEnabled: false,
      dbEnabled: false,
      hasGeneratedDbClient: false,
      hasRepository: false,
      hasDbAdapter: false,
      hasQueryExecutor: false,
      hasDbClient: false,
    },
  });
});

test('env disabled returns disabled safe output', () => {
  assert.equal(composeCustomerAccessBootstrap({
    env: {
      CUSTOMER_ACCESS_ENABLED: 'false',
    },
  }).enabled, false);
});

test('CUSTOMER_ACCESS_ENABLED true returns enabled bootstrap without dbClient when no DB flag', () => {
  const result = composeCustomerAccessBootstrap({
    env: enabledEnv(),
  });

  assert.equal(result.enabled, true);
  assert.equal(result.customerAccessBootstrap.enabled, true);
  assert.equal(result.customerAccessBootstrap.customerAccess.dbClient, undefined);
  assert.equal(result.safeSummary.hasDbClient, false);
});

test('CUSTOMER_ACCESS_READ_ONLY_ENABLED true returns enabled read-only bootstrap without dbClient when no DB flag', () => {
  const result = composeCustomerAccessBootstrap({
    env: {
      CUSTOMER_ACCESS_READ_ONLY_ENABLED: 'true',
    },
  });

  assert.equal(result.enabled, true);
  assert.equal(result.safeSummary.readOnlyEnabled, true);
  assert.equal(result.safeSummary.hasDbClient, false);
});

test('CUSTOMER_ACCESS_DB_ENABLED true without connector or config does not create dbClient', () => {
  const result = composeCustomerAccessBootstrap({
    env: dbEnabledEnv(),
  });

  assert.equal(result.enabled, true);
  assert.equal(result.safeSummary.dbEnabled, true);
  assert.equal(result.safeSummary.hasGeneratedDbClient, false);
  assert.equal(result.customerAccessBootstrap.customerAccess.dbClient, undefined);
});

test('DB enabled with connector and readOnly config creates synthetic dbClient', () => {
  const connectorCalls = [];
  const dbClient = createDbClient([]);
  const result = composeCustomerAccessBootstrap({
    env: dbEnabledEnv(),
    connector: createConnector(connectorCalls, dbClient),
    dbClientConfig: {
      readOnly: true,
    },
  });

  assert.equal(result.customerAccessBootstrap.customerAccess.dbClient, dbClient);
  assert.equal(result.safeSummary.hasGeneratedDbClient, true);
  assert.equal(result.safeSummary.hasDbClient, true);
  assert.equal(connectorCalls.length, 1);
});

test('DB enabled with readOnly false fail-closes dbClient creation', () => {
  const connectorCalls = [];
  const result = composeCustomerAccessBootstrap({
    env: dbEnabledEnv(),
    connector: createConnector(connectorCalls),
    dbClientConfig: {
      readOnly: false,
    },
  });

  assert.equal(result.enabled, true);
  assert.equal(result.safeSummary.hasGeneratedDbClient, false);
  assert.equal(result.customerAccessBootstrap.customerAccess.dbClient, undefined);
  assert.deepEqual(connectorCalls, []);
});

test('connector throw does not leak raw error and no dbClient output', () => {
  const result = composeCustomerAccessBootstrap({
    env: dbEnabledEnv(),
    connector: {
      createReadOnlyClient() {
        throw new Error('internal_connector_error_should_not_leak');
      },
    },
    dbClientConfig: secretConfig(),
  });

  assert.equal(result.safeSummary.hasGeneratedDbClient, false);
  assert.equal(result.customerAccessBootstrap.customerAccess.dbClient, undefined);
  assertNoSensitiveLeak(result);
});

test('malformed connector client does not output dbClient', () => {
  const result = composeCustomerAccessBootstrap({
    env: dbEnabledEnv(),
    connector: createConnector([], { notQuery: true }),
    dbClientConfig: {
      readOnly: true,
    },
  });

  assert.equal(result.customerAccessBootstrap.customerAccess.dbClient, undefined);
  assert.equal(result.safeSummary.hasDbClient, false);
});

test('caller-provided customerAccess.repository has priority over generated dbClient', () => {
  const connectorCalls = [];
  const repository = { kind: 'repository' };
  const result = composeCustomerAccessBootstrap({
    env: dbEnabledEnv(),
    connector: createConnector(connectorCalls),
    dbClientConfig: {
      readOnly: true,
    },
    customerAccess: {
      repository,
    },
  });

  assert.equal(result.customerAccessBootstrap.customerAccess.repository, repository);
  assert.equal(result.customerAccessBootstrap.customerAccess.dbClient, undefined);
  assert.equal(result.safeSummary.hasRepository, true);
  assert.deepEqual(connectorCalls, []);
});

test('caller-provided customerAccess.dbAdapter has priority', () => {
  const connectorCalls = [];
  const dbAdapter = { kind: 'dbAdapter' };
  const result = composeCustomerAccessBootstrap({
    env: dbEnabledEnv(),
    connector: createConnector(connectorCalls),
    dbClientConfig: {
      readOnly: true,
    },
    customerAccess: {
      dbAdapter,
    },
  });

  assert.equal(result.customerAccessBootstrap.customerAccess.dbAdapter, dbAdapter);
  assert.equal(result.customerAccessBootstrap.customerAccess.dbClient, undefined);
  assert.equal(result.safeSummary.hasDbAdapter, true);
  assert.deepEqual(connectorCalls, []);
});

test('caller-provided customerAccess.queryExecutor has priority', () => {
  const connectorCalls = [];
  const queryExecutor = () => ({ rows: [] });
  const result = composeCustomerAccessBootstrap({
    env: dbEnabledEnv(),
    connector: createConnector(connectorCalls),
    dbClientConfig: {
      readOnly: true,
    },
    customerAccess: {
      queryExecutor,
    },
  });

  assert.equal(result.customerAccessBootstrap.customerAccess.queryExecutor, queryExecutor);
  assert.equal(result.customerAccessBootstrap.customerAccess.dbClient, undefined);
  assert.equal(result.safeSummary.hasQueryExecutor, true);
  assert.deepEqual(connectorCalls, []);
});

test('caller-provided customerAccess.dbClient is not overridden', () => {
  const connectorCalls = [];
  const callerDbClient = createDbClient([]);
  const result = composeCustomerAccessBootstrap({
    env: dbEnabledEnv(),
    connector: createConnector(connectorCalls),
    dbClientConfig: {
      readOnly: true,
    },
    customerAccess: {
      dbClient: callerDbClient,
    },
  });

  assert.equal(result.customerAccessBootstrap.customerAccess.dbClient, callerDbClient);
  assert.equal(result.safeSummary.hasGeneratedDbClient, false);
  assert.deepEqual(connectorCalls, []);
});

test('token, secret, databaseUrl, connectionString, and password are stripped from output', () => {
  const result = composeCustomerAccessBootstrap({
    env: {
      ...dbEnabledEnv(),
      token: 'token_should_not_leak',
      secret: 'secret_should_not_leak',
      databaseUrl: 'postgres://db-url-should-not-leak',
      connectionString: 'connection_string_should_not_leak',
      password: 'password_should_not_leak',
    },
    connector: createConnector([]),
    dbClientConfig: secretConfig(),
  });

  assertNoSensitiveLeak(result);
});

test('raw phone, address, and LINE id are stripped from output', () => {
  const result = composeCustomerAccessBootstrap({
    env: {
      ...enabledEnv(),
      rawPhone: 'raw_phone_should_not_leak',
      rawAddress: 'raw_address_should_not_leak',
      rawLineUserId: 'line_user_should_not_leak',
    },
  });

  assertNoSensitiveLeak(result);
});

test('input, env, config, customerAccess, and connector are not mutated', () => {
  const env = dbEnabledEnv();
  const dbClientConfig = secretConfig();
  const customerAccess = {
    getInput: () => ({}),
  };
  const connector = createConnector([]);
  const input = {
    env,
    connector,
    dbClientConfig,
    customerAccess,
  };
  const before = {
    env: JSON.stringify(env),
    dbClientConfig: JSON.stringify(dbClientConfig),
    customerAccessKeys: Object.keys(customerAccess),
    connectorKeys: Object.keys(connector),
  };

  composeCustomerAccessBootstrap(input);

  assert.equal(JSON.stringify(env), before.env);
  assert.equal(JSON.stringify(dbClientConfig), before.dbClientConfig);
  assert.deepEqual(Object.keys(customerAccess), before.customerAccessKeys);
  assert.deepEqual(Object.keys(connector), before.connectorKeys);
});

test('composer has no logging side effects', () => {
  withConsoleSpy((calls) => {
    composeCustomerAccessBootstrap({
      env: enabledEnv(),
    });

    assert.deepEqual(calls, []);
  });
});

test('module has no process.env, server, app, real DB, transaction, repository, provider, or AI imports', () => {
  const source = fs.readFileSync(composerFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, [
    './customerAccessEnvBoundary',
    './customerAccessDbClientFactory',
  ]);
  assert.doesNotMatch(source, /process\.env/i);
});
