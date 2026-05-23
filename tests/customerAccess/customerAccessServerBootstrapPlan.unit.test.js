'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  buildCustomerAccessServerBootstrapPlan,
} = require('../../src/customerAccess/customerAccessServerBootstrapPlan');

const repoRoot = path.resolve(__dirname, '../..');
const planFile = path.join(repoRoot, 'src/customerAccess/customerAccessServerBootstrapPlan.js');

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
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
  ]) {
    assert.equal(serialized.includes(sensitiveValue), false, `leaked ${sensitiveValue}`);
  }
}

test('exports buildCustomerAccessServerBootstrapPlan', () => {
  assert.equal(typeof buildCustomerAccessServerBootstrapPlan, 'function');
});

test('missing input returns disabled safe plan', () => {
  const plan = buildCustomerAccessServerBootstrapPlan();

  assert.deepEqual(plan, {
    enabled: false,
    shouldCreateCustomerAccessEnabledApp: false,
    appFactoryOptions: {},
    warnings: [],
    safeSummary: {
      customerAccessEnabled: false,
      hasRepository: false,
      hasDbAdapter: false,
      hasQueryExecutor: false,
      hasDbClient: false,
    },
  });
});

test('enabled false returns no appFactoryOptions customerAccess', () => {
  const plan = buildCustomerAccessServerBootstrapPlan({
    enabled: false,
    dbClient: createDbClient(),
    customerAccess: {
      repository: { kind: 'repository' },
    },
  });

  assert.equal(plan.enabled, false);
  assert.equal(plan.shouldCreateCustomerAccessEnabledApp, false);
  assert.deepEqual(plan.appFactoryOptions, {});
  assert.equal(plan.safeSummary.customerAccessEnabled, false);
  assert.equal(plan.safeSummary.hasRepository, false);
  assert.equal(plan.safeSummary.hasDbClient, false);
});

test('enabled true with dbClient returns enabled app factory plan and safe booleans', () => {
  const dbClient = createDbClient();
  const plan = buildCustomerAccessServerBootstrapPlan({
    enabled: true,
    dbClient,
  });

  assert.equal(plan.enabled, true);
  assert.equal(plan.shouldCreateCustomerAccessEnabledApp, true);
  assert.equal(plan.appFactoryOptions.customerAccess.dbClient, dbClient);
  assert.deepEqual(plan.safeSummary, {
    customerAccessEnabled: true,
    hasRepository: false,
    hasDbAdapter: false,
    hasQueryExecutor: false,
    hasDbClient: true,
  });
});

test('repository, dbAdapter, and queryExecutor presence is reflected in safeSummary booleans', () => {
  const repository = { kind: 'repository' };
  const dbAdapter = { kind: 'dbAdapter' };
  const queryExecutor = () => ({ rows: [] });
  const plan = buildCustomerAccessServerBootstrapPlan({
    enabled: true,
    customerAccess: {
      repository,
      dbAdapter,
      queryExecutor,
    },
  });

  assert.equal(plan.appFactoryOptions.customerAccess.repository, repository);
  assert.equal(plan.appFactoryOptions.customerAccess.dbAdapter, dbAdapter);
  assert.equal(plan.appFactoryOptions.customerAccess.queryExecutor, queryExecutor);
  assert.equal(plan.safeSummary.hasRepository, true);
  assert.equal(plan.safeSummary.hasDbAdapter, true);
  assert.equal(plan.safeSummary.hasQueryExecutor, true);
  assert.equal(plan.safeSummary.hasDbClient, false);
});

test('customerAccess.dbClient is not overridden by top-level dbClient through sanitizer behavior', () => {
  const topLevelDbClient = createDbClient();
  const customerAccessDbClient = createDbClient();
  const plan = buildCustomerAccessServerBootstrapPlan({
    enabled: true,
    dbClient: topLevelDbClient,
    customerAccess: {
      dbClient: customerAccessDbClient,
    },
  });

  assert.equal(plan.appFactoryOptions.customerAccess.dbClient, customerAccessDbClient);
  assert.equal(plan.appFactoryOptions.customerAccess.dbClient, customerAccessDbClient);
  assert.notEqual(plan.appFactoryOptions.customerAccess.dbClient, topLevelDbClient);
});

test('sensitive top-level and malformed customerAccess values are not present in plan output', () => {
  const plan = buildCustomerAccessServerBootstrapPlan({
    enabled: true,
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    databaseUrl: 'postgres://db-url-should-not-leak',
    connectionString: 'connection_string_should_not_leak',
    password: 'password_should_not_leak',
    rawPhone: 'raw_phone_should_not_leak',
    rawAddress: 'raw_address_should_not_leak',
    rawLineUserId: 'line_user_should_not_leak',
    customerAccess: 'secret_should_not_leak',
  });

  assert.equal(plan.enabled, false);
  assertNoSensitiveLeak(plan);
});

test('warnings do not leak sensitive values', () => {
  const plan = buildCustomerAccessServerBootstrapPlan({
    enabled: true,
    token: 'token_should_not_leak',
    customerAccess: 'postgres://db-url-should-not-leak',
  });

  assert.deepEqual(plan.warnings, []);
  assertNoSensitiveLeak(plan.warnings);
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

  buildCustomerAccessServerBootstrapPlan(input);

  assert.equal(JSON.stringify(input), before);
  assert.equal(input.dbClient, dbClient);
});

test('plan helper has no logging side effects', () => {
  withConsoleSpy((calls) => {
    buildCustomerAccessServerBootstrapPlan({
      enabled: true,
      dbClient: createDbClient(),
    });

    assert.deepEqual(calls, []);
  });
});

test('building the plan does not call dbClient', () => {
  const dbCalls = [];

  buildCustomerAccessServerBootstrapPlan({
    enabled: true,
    dbClient: createDbClient(dbCalls),
  });

  assert.deepEqual(dbCalls, []);
});

test('module only imports bootstrap config and no restricted runtime modules', () => {
  const source = fs.readFileSync(planFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, ['./customerAccessBootstrapConfig']);
  assert.equal(specifiers.includes('../app'), false);
  assert.equal(specifiers.includes('../server'), false);
  assert.equal(specifiers.some((specifier) => /db\/pool|transaction|repositories?|provider|line|sms|email|push|ai|rag|vector/i.test(specifier)), false);
  assert.doesNotMatch(source, /process\.env|listen\(|app\.listen|transaction|begin|commit|rollback/i);
});
