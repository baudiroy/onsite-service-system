'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  buildCustomerAccessBootstrapOptions,
  buildDisabledCustomerAccessBootstrapOptions,
  stripSensitiveKeys,
} = require('../../src/customerAccess/customerAccessBootstrapConfig');

const repoRoot = path.resolve(__dirname, '../..');
const configFile = path.join(repoRoot, 'src/customerAccess/customerAccessBootstrapConfig.js');

function createDbClient(calls) {
  const safeCalls = Array.isArray(calls) ? calls : [];

  return {
    query(sql, params) {
      safeCalls.push({ sql, params });
      return { rows: [] };
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
    'line_user_should_not_leak',
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
  ]) {
    assert.equal(serialized.includes(sensitiveValue), false, `leaked ${sensitiveValue}`);
  }
}

test('exports bootstrap config sanitizer functions', () => {
  assert.equal(typeof buildCustomerAccessBootstrapOptions, 'function');
  assert.equal(typeof buildDisabledCustomerAccessBootstrapOptions, 'function');
  assert.equal(typeof stripSensitiveKeys, 'function');
});

test('missing input returns disabled safe config', () => {
  assert.deepEqual(buildCustomerAccessBootstrapOptions(), { enabled: false });
  assert.deepEqual(buildCustomerAccessBootstrapOptions(null), { enabled: false });
  assert.deepEqual(buildDisabledCustomerAccessBootstrapOptions(), { enabled: false });
});

test('enabled false strips dbClient and customerAccess runtime options', () => {
  const result = buildCustomerAccessBootstrapOptions({
    enabled: false,
    dbClient: createDbClient(),
    customerAccess: {
      repository: { kind: 'repository' },
      dbAdapter: { kind: 'dbAdapter' },
      queryExecutor: () => ({}),
    },
  });

  assert.deepEqual(result, { enabled: false });
});

test('customerAccess enabled false strips runtime options', () => {
  const result = buildCustomerAccessBootstrapOptions({
    dbClient: createDbClient(),
    customerAccess: {
      enabled: false,
      dbClient: createDbClient(),
    },
  });

  assert.deepEqual(result, { enabled: false });
});

test('enabled true with top-level dbClient returns customerAccess.dbClient', () => {
  const dbClient = createDbClient();
  const result = buildCustomerAccessBootstrapOptions({
    enabled: true,
    dbClient,
  });

  assert.equal(result.enabled, true);
  assert.equal(result.customerAccess.dbClient, dbClient);
});

test('existing customerAccess.repository is preserved and has priority', () => {
  const repository = { kind: 'repository' };
  const result = buildCustomerAccessBootstrapOptions({
    enabled: true,
    dbClient: createDbClient(),
    customerAccess: {
      repository,
    },
  });

  assert.equal(result.enabled, true);
  assert.equal(result.customerAccess.repository, repository);
});

test('existing customerAccess.dbAdapter is preserved', () => {
  const dbAdapter = { kind: 'dbAdapter' };
  const result = buildCustomerAccessBootstrapOptions({
    enabled: true,
    customerAccess: {
      dbAdapter,
    },
  });

  assert.equal(result.enabled, true);
  assert.equal(result.customerAccess.dbAdapter, dbAdapter);
});

test('existing customerAccess.queryExecutor is preserved', () => {
  const queryExecutor = () => ({});
  const result = buildCustomerAccessBootstrapOptions({
    enabled: true,
    customerAccess: {
      queryExecutor,
    },
  });

  assert.equal(result.enabled, true);
  assert.equal(result.customerAccess.queryExecutor, queryExecutor);
});

test('existing customerAccess.dbClient is not overridden by top-level dbClient', () => {
  const topLevelDbClient = createDbClient();
  const customerAccessDbClient = createDbClient();
  const result = buildCustomerAccessBootstrapOptions({
    enabled: true,
    dbClient: topLevelDbClient,
    customerAccess: {
      dbClient: customerAccessDbClient,
    },
  });

  assert.equal(result.customerAccess.dbClient, customerAccessDbClient);
});

test('malformed customerAccess object does not leak token, secret, or db URL', () => {
  const result = buildCustomerAccessBootstrapOptions({
    enabled: true,
    customerAccess: 'postgres://db-url-should-not-leak?token=token_should_not_leak',
  });

  assert.deepEqual(result, { enabled: false });
  assertNoSensitiveLeak(result);
});

test('sensitive keys are stripped from helper output', () => {
  const result = stripSensitiveKeys({
    keep: 'safe_value',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    databaseUrl: 'postgres://db-url-should-not-leak',
    connectionString: 'connection_string_should_not_leak',
    password: 'password_should_not_leak',
    rawLineId: 'line_user_should_not_leak',
    rawPhone: 'raw_phone_should_not_leak',
    rawAddress: 'raw_address_should_not_leak',
    nested: {
      secret: 'secret_should_not_leak',
      keepNested: 'safe_nested_value',
    },
  });

  assert.deepEqual(result, {
    keep: 'safe_value',
    nested: {
      keepNested: 'safe_nested_value',
    },
  });
  assertNoSensitiveLeak(result);
});

test('input object is not mutated', () => {
  const dbClient = createDbClient();
  const input = {
    enabled: true,
    dbClient,
    customerAccess: {
      token: 'token_should_not_leak',
    },
  };
  const before = JSON.stringify(input);

  buildCustomerAccessBootstrapOptions(input);

  assert.equal(JSON.stringify(input), before);
  assert.equal(input.dbClient, dbClient);
});

test('sanitizer has no logging side effects', () => {
  withConsoleSpy((calls) => {
    buildCustomerAccessBootstrapOptions({
      enabled: true,
      dbClient: createDbClient(),
      customerAccess: {
        token: 'token_should_not_leak',
      },
    });

    assert.deepEqual(calls, []);
  });
});

test('module has no app, server, real DB, transaction, repository, provider, or AI imports', () => {
  const source = fs.readFileSync(configFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, []);
  assert.equal(specifiers.includes('../app'), false);
  assert.equal(specifiers.includes('../server'), false);
  assert.equal(specifiers.some((specifier) => /db\/pool|transaction|repositories?|provider|line|sms|email|push|ai|rag|vector/i.test(specifier)), false);
  assert.doesNotMatch(source, /process\.env|listen\(|app\.listen|transaction|begin|commit|rollback/i);
});
