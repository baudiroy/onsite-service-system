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

function dbEnabledEnv(overrides = {}) {
  return {
    CUSTOMER_ACCESS_ENABLED: 'true',
    CUSTOMER_ACCESS_DB_ENABLED: 'true',
    ...overrides,
  };
}

function readOnlyConfig(overrides = {}) {
  return {
    readOnly: true,
    connectionString: 'postgres://db-url-should-not-leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    password: 'password_should_not_leak',
    ...overrides,
  };
}

function createQueryTarget(calls, result) {
  const safeCalls = Array.isArray(calls) ? calls : [];

  return {
    query(sql, params) {
      safeCalls.push({ sql, params });
      return result || { rows: [] };
    },
  };
}

function createConnector(calls, dbClient) {
  const safeCalls = Array.isArray(calls) ? calls : [];

  return {
    createReadOnlyClient(config) {
      safeCalls.push(config);
      return dbClient || createQueryTarget([]);
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

function assertNoLeak(value) {
  const serialized = JSON.stringify(value);

  for (const unsafeValue of [
    'postgres://db-url-should-not-leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'password_should_not_leak',
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
    'internal_pool_error_should_not_leak',
  ]) {
    assert.equal(serialized.includes(unsafeValue), false, `leaked ${unsafeValue}`);
  }
}

test('pool support exists without breaking explicit connector path', () => {
  const connectorCalls = [];
  const result = composeCustomerAccessBootstrap({
    env: dbEnabledEnv(),
    connector: createConnector(connectorCalls),
    dbClientConfig: readOnlyConfig(),
  });

  assert.equal(result.enabled, true);
  assert.equal(result.safeSummary.hasGeneratedDbClient, true);
  assert.equal(result.safeSummary.hasDbClient, true);
  assert.equal(typeof result.customerAccessBootstrap.customerAccess.dbClient.query, 'function');
  assert.equal(connectorCalls.length, 1);
});

test('explicit connector priority wins over pool and db', () => {
  const connectorCalls = [];
  const poolCalls = [];
  const dbCalls = [];
  const explicitDbClient = createQueryTarget([]);
  const result = composeCustomerAccessBootstrap({
    env: dbEnabledEnv(),
    connector: createConnector(connectorCalls, explicitDbClient),
    pool: createQueryTarget(poolCalls),
    db: createQueryTarget(dbCalls),
    dbClientConfig: readOnlyConfig(),
  });

  assert.equal(result.customerAccessBootstrap.customerAccess.dbClient, explicitDbClient);
  assert.equal(connectorCalls.length, 1);
  assert.deepEqual(poolCalls, []);
  assert.deepEqual(dbCalls, []);
});

test('DB flag enabled with pool and readOnly true creates dbClient', () => {
  const poolCalls = [];
  const result = composeCustomerAccessBootstrap({
    env: dbEnabledEnv(),
    pool: createQueryTarget(poolCalls),
    dbClientConfig: readOnlyConfig(),
  });

  assert.equal(result.safeSummary.hasGeneratedDbClient, true);
  assert.equal(result.safeSummary.hasDbClient, true);
  assert.equal(typeof result.customerAccessBootstrap.customerAccess.dbClient.query, 'function');
  assert.deepEqual(poolCalls, []);
});

test('DB flag enabled with db and readOnly true creates dbClient', () => {
  const dbCalls = [];
  const result = composeCustomerAccessBootstrap({
    env: dbEnabledEnv(),
    db: createQueryTarget(dbCalls),
    dbClientConfig: readOnlyConfig(),
  });

  assert.equal(result.safeSummary.hasGeneratedDbClient, true);
  assert.equal(result.safeSummary.hasDbClient, true);
  assert.equal(typeof result.customerAccessBootstrap.customerAccess.dbClient.query, 'function');
  assert.deepEqual(dbCalls, []);
});

test('readOnly false does not create dbClient and does not call pool or db', () => {
  const poolCalls = [];
  const dbCalls = [];
  const result = composeCustomerAccessBootstrap({
    env: dbEnabledEnv(),
    pool: createQueryTarget(poolCalls),
    db: createQueryTarget(dbCalls),
    dbClientConfig: readOnlyConfig({ readOnly: false }),
  });

  assert.equal(result.safeSummary.hasGeneratedDbClient, false);
  assert.equal(result.safeSummary.hasDbClient, false);
  assert.equal(result.customerAccessBootstrap.customerAccess.dbClient, undefined);
  assert.deepEqual(poolCalls, []);
  assert.deepEqual(dbCalls, []);
});

test('DB flag disabled does not create dbClient and does not call pool or db', () => {
  const poolCalls = [];
  const dbCalls = [];
  const result = composeCustomerAccessBootstrap({
    env: {
      CUSTOMER_ACCESS_ENABLED: 'true',
      CUSTOMER_ACCESS_DB_ENABLED: 'false',
    },
    pool: createQueryTarget(poolCalls),
    db: createQueryTarget(dbCalls),
    dbClientConfig: readOnlyConfig(),
  });

  assert.equal(result.enabled, true);
  assert.equal(result.safeSummary.dbEnabled, false);
  assert.equal(result.safeSummary.hasGeneratedDbClient, false);
  assert.equal(result.customerAccessBootstrap.customerAccess.dbClient, undefined);
  assert.deepEqual(poolCalls, []);
  assert.deepEqual(dbCalls, []);
});

test('pool query is not called during compose and is only used by future query path', () => {
  const poolCalls = [];
  const result = composeCustomerAccessBootstrap({
    env: dbEnabledEnv(),
    pool: createQueryTarget(poolCalls, { rows: [{ id: 'row_001' }] }),
    dbClientConfig: readOnlyConfig(),
  });

  assert.deepEqual(poolCalls, []);

  const queryResult = result.customerAccessBootstrap.customerAccess.dbClient.query('select $1', ['case_001']);

  assert.deepEqual(queryResult, { rows: [{ id: 'row_001' }] });
  assert.deepEqual(poolCalls, [{ sql: 'select $1', params: ['case_001'] }]);
});

test('caller-provided runtime options have priority over generated pool client', () => {
  for (const runtimeKey of ['repository', 'dbAdapter', 'queryExecutor', 'dbClient']) {
    const poolCalls = [];
    const runtimeValue = runtimeKey === 'queryExecutor' ? () => ({}) : { runtimeKey };
    const result = composeCustomerAccessBootstrap({
      env: dbEnabledEnv(),
      pool: createQueryTarget(poolCalls),
      dbClientConfig: readOnlyConfig(),
      customerAccess: {
        [runtimeKey]: runtimeValue,
      },
    });

    assert.equal(result.customerAccessBootstrap.customerAccess[runtimeKey], runtimeValue);
    assert.equal(result.safeSummary.hasGeneratedDbClient, false);
    assert.deepEqual(poolCalls, []);
  }
});

test('malformed pool or db without query produces no dbClient', () => {
  const result = composeCustomerAccessBootstrap({
    env: dbEnabledEnv(),
    pool: { notQuery: true },
    db: { alsoNotQuery: true },
    dbClientConfig: readOnlyConfig(),
  });

  assert.equal(result.safeSummary.hasGeneratedDbClient, false);
  assert.equal(result.customerAccessBootstrap.customerAccess.dbClient, undefined);
});

test('pool throw during future query path uses generic error without secret leak', () => {
  const result = composeCustomerAccessBootstrap({
    env: dbEnabledEnv(),
    pool: {
      query() {
        throw new Error('internal_pool_error_should_not_leak postgres://db-url-should-not-leak token_should_not_leak');
      },
    },
    dbClientConfig: readOnlyConfig(),
  });
  const client = result.customerAccessBootstrap.customerAccess.dbClient;

  assert.throws(
    () => client.query('select $1', ['case_001']),
    (error) => {
      assert.equal(error.message, 'customer_access_read_only_query_failed');
      assertNoLeak(error);
      return true;
    }
  );
});

test('output does not expose connectionString, token, secret, password, raw phone, address, or LINE id', () => {
  const result = composeCustomerAccessBootstrap({
    env: dbEnabledEnv({
      rawPhone: 'raw_phone_should_not_leak',
      rawAddress: 'raw_address_should_not_leak',
      rawLineUserId: 'line_user_should_not_leak',
    }),
    pool: createQueryTarget([]),
    dbClientConfig: readOnlyConfig(),
  });

  assertNoLeak(result);
});

test('input, env, config, pool, db, and customerAccess are not mutated', () => {
  const env = dbEnabledEnv();
  const dbClientConfig = readOnlyConfig();
  const pool = createQueryTarget([]);
  const db = createQueryTarget([]);
  const customerAccess = {
    getInput: () => ({}),
  };
  const input = {
    env,
    pool,
    db,
    dbClientConfig,
    customerAccess,
  };
  const before = {
    env: JSON.stringify(env),
    dbClientConfig: JSON.stringify(dbClientConfig),
    poolKeys: Object.keys(pool),
    dbKeys: Object.keys(db),
    customerAccessKeys: Object.keys(customerAccess),
  };

  composeCustomerAccessBootstrap(input);

  assert.equal(JSON.stringify(env), before.env);
  assert.equal(JSON.stringify(dbClientConfig), before.dbClientConfig);
  assert.deepEqual(Object.keys(pool), before.poolKeys);
  assert.deepEqual(Object.keys(db), before.dbKeys);
  assert.deepEqual(Object.keys(customerAccess), before.customerAccessKeys);
});

test('composer pool support has no logging side effects', () => {
  withConsoleSpy((calls) => {
    composeCustomerAccessBootstrap({
      env: dbEnabledEnv(),
      pool: createQueryTarget([]),
      dbClientConfig: readOnlyConfig(),
    });

    assert.deepEqual(calls, []);
  });
});

test('module import boundary remains env, db factory, and read-only connector only', () => {
  const source = fs.readFileSync(composerFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, [
    './customerAccessEnvBoundary',
    './customerAccessDbClientFactory',
  ]);
  assert.equal(source.includes('customerAccessReadOnlyDbConnector'), true);
  assert.doesNotMatch(source, /process\.env/i);
  assert.doesNotMatch(source, /require\(['"].*(server|app|route|controller|repository|transaction|provider|line|sms|email|push|ai|rag|vector)/i);
});
