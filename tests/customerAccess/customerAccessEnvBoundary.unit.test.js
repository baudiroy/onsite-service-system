'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  buildCustomerAccessBootstrapInputFromEnv,
  sanitizeCustomerAccessEnv,
} = require('../../src/customerAccess/customerAccessEnvBoundary');
const {
  buildCustomerAccessServerBootstrapPlan,
} = require('../../src/customerAccess/customerAccessServerBootstrapPlan');

const repoRoot = path.resolve(__dirname, '../..');
const boundaryFile = path.join(repoRoot, 'src/customerAccess/customerAccessEnvBoundary.js');

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
  ]) {
    assert.equal(serialized.includes(sensitiveValue), false, `leaked ${sensitiveValue}`);
  }
}

test('exports env boundary functions', () => {
  assert.equal(typeof buildCustomerAccessBootstrapInputFromEnv, 'function');
  assert.equal(typeof sanitizeCustomerAccessEnv, 'function');
});

test('missing input returns disabled bootstrap input', () => {
  assert.deepEqual(buildCustomerAccessBootstrapInputFromEnv(), {
    enabled: false,
    customerAccess: {
      enabled: false,
    },
    safeSummary: {
      enabled: false,
      readOnlyEnabled: false,
      dbEnabled: false,
    },
  });
});

test('empty env returns disabled bootstrap input', () => {
  assert.equal(buildCustomerAccessBootstrapInputFromEnv({}).enabled, false);
});

test('CUSTOMER_ACCESS_ENABLED true enables customerAccess', () => {
  const result = buildCustomerAccessBootstrapInputFromEnv({
    CUSTOMER_ACCESS_ENABLED: 'true',
  });

  assert.equal(result.enabled, true);
  assert.equal(result.customerAccess.enabled, true);
  assert.deepEqual(result.safeSummary, {
    enabled: true,
    readOnlyEnabled: false,
    dbEnabled: false,
  });
});

test('CUSTOMER_ACCESS_READ_ONLY_ENABLED true enables read-only safe flag', () => {
  const result = buildCustomerAccessBootstrapInputFromEnv({
    CUSTOMER_ACCESS_READ_ONLY_ENABLED: true,
  });

  assert.equal(result.enabled, true);
  assert.equal(result.customerAccess.enabled, true);
  assert.equal(result.safeSummary.readOnlyEnabled, true);
});

test('CUSTOMER_ACCESS_DB_ENABLED true sets dbEnabled safe flag without DB URL or dbClient', () => {
  const result = buildCustomerAccessBootstrapInputFromEnv({
    CUSTOMER_ACCESS_ENABLED: '1',
    CUSTOMER_ACCESS_DB_ENABLED: 'true',
    DATABASE_URL: 'postgres://db-url-should-not-leak',
  });

  assert.equal(result.enabled, true);
  assert.equal(result.safeSummary.dbEnabled, true);
  assert.equal(result.customerAccess.dbClient, undefined);
  assert.equal(result.databaseUrl, undefined);
  assertNoSensitiveLeak(result);
});

test('false, zero, no, and off values disable customer access', () => {
  for (const value of ['false', '0', 'no', 'off', false, '', ' disabled ']) {
    const result = buildCustomerAccessBootstrapInputFromEnv({
      CUSTOMER_ACCESS_ENABLED: value,
      CUSTOMER_ACCESS_READ_ONLY_ENABLED: value,
    });

    assert.equal(result.enabled, false);
  }
});

test('token, secret, DATABASE_URL, connection string, and password are stripped', () => {
  const result = buildCustomerAccessBootstrapInputFromEnv({
    CUSTOMER_ACCESS_ENABLED: 'true',
    token: 'token_should_not_leak',
    SECRET_KEY: 'secret_should_not_leak',
    DATABASE_URL: 'postgres://db-url-should-not-leak',
    connectionString: 'connection_string_should_not_leak',
    PASSWORD: 'password_should_not_leak',
  });

  assertNoSensitiveLeak(result);
});

test('raw phone, address, and LINE id are stripped', () => {
  const result = buildCustomerAccessBootstrapInputFromEnv({
    CUSTOMER_ACCESS_ENABLED: 'true',
    rawPhone: 'raw_phone_should_not_leak',
    rawAddress: 'raw_address_should_not_leak',
    rawLineUserId: 'line_user_should_not_leak',
  });

  assertNoSensitiveLeak(result);
});

test('sanitizeCustomerAccessEnv only keeps supported non-secret feature flags', () => {
  const result = sanitizeCustomerAccessEnv({
    CUSTOMER_ACCESS_ENABLED: 'true',
    CUSTOMER_ACCESS_READ_ONLY_ENABLED: 'true',
    CUSTOMER_ACCESS_DB_ENABLED: 'true',
    UNSUPPORTED_KEY: 'unsupported',
    DATABASE_URL: 'postgres://db-url-should-not-leak',
  });

  assert.deepEqual(result, {
    CUSTOMER_ACCESS_ENABLED: 'true',
    CUSTOMER_ACCESS_READ_ONLY_ENABLED: 'true',
    CUSTOMER_ACCESS_DB_ENABLED: 'true',
  });
});

test('safeSummary contains no sensitive values', () => {
  const result = buildCustomerAccessBootstrapInputFromEnv({
    CUSTOMER_ACCESS_ENABLED: 'true',
    DATABASE_URL: 'postgres://db-url-should-not-leak',
    token: 'token_should_not_leak',
  });

  assert.deepEqual(Object.keys(result.safeSummary), ['enabled', 'readOnlyEnabled', 'dbEnabled']);
  assertNoSensitiveLeak(result.safeSummary);
});

test('input env object is not mutated', () => {
  const input = {
    CUSTOMER_ACCESS_ENABLED: 'true',
    DATABASE_URL: 'postgres://db-url-should-not-leak',
  };
  const before = JSON.stringify(input);

  buildCustomerAccessBootstrapInputFromEnv(input);

  assert.equal(JSON.stringify(input), before);
});

test('env boundary has no logging side effects', () => {
  withConsoleSpy((calls) => {
    buildCustomerAccessBootstrapInputFromEnv({
      CUSTOMER_ACCESS_ENABLED: 'true',
    });

    assert.deepEqual(calls, []);
  });
});

test('module has no process.env, app, server, real DB, transaction, repository, provider, or AI imports', () => {
  const source = fs.readFileSync(boundaryFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, []);
  assert.doesNotMatch(source, /process\.env/i);
});

test('output can be passed to server bootstrap plan without leaking sensitive values', () => {
  const bootstrapInput = buildCustomerAccessBootstrapInputFromEnv({
    CUSTOMER_ACCESS_ENABLED: 'true',
    DATABASE_URL: 'postgres://db-url-should-not-leak',
    token: 'token_should_not_leak',
  });
  const plan = buildCustomerAccessServerBootstrapPlan(bootstrapInput);

  assert.equal(plan.enabled, false);
  assertNoSensitiveLeak({ bootstrapInput, plan });
});
