'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  buildCustomerAccessDbClient,
  createCustomerAccessDbClientFactory,
} = require('../../src/customerAccess/customerAccessDbClientFactory');

const repoRoot = path.resolve(__dirname, '../..');
const factoryFile = path.join(repoRoot, 'src/customerAccess/customerAccessDbClientFactory.js');

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

function secretConfig() {
  return {
    readOnly: true,
    connectionString: 'postgres://db-url-should-not-leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    password: 'password_should_not_leak',
  };
}

test('exports factory functions', () => {
  assert.equal(typeof buildCustomerAccessDbClient, 'function');
  assert.equal(typeof createCustomerAccessDbClientFactory, 'function');
});

test('missing input fail-closes', () => {
  assert.deepEqual(buildCustomerAccessDbClient(), {
    enabled: false,
    dbClient: null,
    safeSummary: {
      enabled: false,
      readOnly: false,
      hasQuery: false,
    },
  });
});

test('missing connector fail-closes', () => {
  const result = buildCustomerAccessDbClient({
    config: {
      readOnly: true,
    },
  });

  assert.equal(result.enabled, false);
  assert.equal(result.dbClient, null);
});

test('missing config fail-closes', () => {
  const connectorCalls = [];
  const result = buildCustomerAccessDbClient({
    connector: createConnector(connectorCalls),
  });

  assert.equal(result.enabled, false);
  assert.deepEqual(connectorCalls, []);
});

test('readOnly not true fail-closes and connector is not called', () => {
  const connectorCalls = [];
  const result = buildCustomerAccessDbClient({
    connector: createConnector(connectorCalls),
    config: {
      readOnly: false,
    },
  });

  assert.equal(result.enabled, false);
  assert.deepEqual(connectorCalls, []);
});

test('valid injected connector returns dbClient with query function', () => {
  const connectorCalls = [];
  const dbCalls = [];
  const dbClient = createDbClient(dbCalls);
  const result = buildCustomerAccessDbClient({
    connector: createConnector(connectorCalls, dbClient),
    config: {
      readOnly: true,
    },
  });

  assert.equal(result.enabled, true);
  assert.equal(result.dbClient, dbClient);
  assert.deepEqual(result.safeSummary, {
    enabled: true,
    readOnly: true,
    hasQuery: true,
  });
  assert.equal(connectorCalls.length, 1);
  assert.deepEqual(dbCalls, []);
});

test('connector is called only when explicit build function is called', () => {
  const connectorCalls = [];
  const factory = createCustomerAccessDbClientFactory({
    connector: createConnector(connectorCalls),
    config: {
      readOnly: true,
    },
  });

  assert.deepEqual(connectorCalls, []);

  factory.build();

  assert.equal(connectorCalls.length, 1);
});

test('top-level createReadOnlyClient connector is supported', () => {
  const connectorCalls = [];
  const result = buildCustomerAccessDbClient({
    createReadOnlyClient(config) {
      connectorCalls.push(config);
      return createDbClient([]);
    },
    config: {
      readOnly: true,
    },
  });

  assert.equal(result.enabled, true);
  assert.equal(connectorCalls.length, 1);
});

test('connector throw fail-closes without raw error leak', () => {
  const result = buildCustomerAccessDbClient({
    connector: {
      createReadOnlyClient() {
        throw new Error('internal_connector_error_should_not_leak');
      },
    },
    config: secretConfig(),
  });

  assert.equal(result.enabled, false);
  assertNoSensitiveLeak(result);
});

test('connector returns malformed client fail-closes', () => {
  const result = buildCustomerAccessDbClient({
    connector: createConnector([], { notQuery: true }),
    config: {
      readOnly: true,
    },
  });

  assert.equal(result.enabled, false);
  assert.equal(result.dbClient, null);
});

test('output safeSummary has no connectionString, token, secret, or password', () => {
  const result = buildCustomerAccessDbClient({
    connector: createConnector([]),
    config: secretConfig(),
  });

  assert.deepEqual(Object.keys(result.safeSummary), ['enabled', 'readOnly', 'hasQuery']);
  assertNoSensitiveLeak(result.safeSummary);
});

test('result does not expose raw DB URL when fail-closed', () => {
  const result = buildCustomerAccessDbClient({
    connector: null,
    config: secretConfig(),
  });

  assertNoSensitiveLeak(result);
});

test('input config object is not mutated', () => {
  const connectorCalls = [];
  const config = secretConfig();
  const before = JSON.stringify(config);

  buildCustomerAccessDbClient({
    connector: createConnector(connectorCalls),
    config,
  });

  assert.equal(JSON.stringify(config), before);
});

test('connector object is not mutated', () => {
  const connectorCalls = [];
  const connector = createConnector(connectorCalls);
  const beforeKeys = Object.keys(connector);

  buildCustomerAccessDbClient({
    connector,
    config: {
      readOnly: true,
    },
  });

  assert.deepEqual(Object.keys(connector), beforeKeys);
});

test('factory has no logging side effects', () => {
  withConsoleSpy((calls) => {
    buildCustomerAccessDbClient({
      connector: createConnector([]),
      config: {
        readOnly: true,
      },
    });

    assert.deepEqual(calls, []);
  });
});

test('module has no process.env, real DB, transaction, repository, provider, AI, or server imports', () => {
  const source = fs.readFileSync(factoryFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, []);
  assert.doesNotMatch(source, /process\.env/i);
});
