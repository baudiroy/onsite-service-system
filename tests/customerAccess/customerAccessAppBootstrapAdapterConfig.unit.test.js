'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createCustomerAccessEnabledApp,
} = require('../../src/customerAccess/customerAccessAppBootstrapAdapter');

const repoRoot = path.resolve(__dirname, '../..');
const adapterFile = path.join(repoRoot, 'src/customerAccess/customerAccessAppBootstrapAdapter.js');

function createDbClient(calls) {
  const safeCalls = Array.isArray(calls) ? calls : [];

  return {
    query(sql, params) {
      safeCalls.push({ sql, params });
      return { rows: [] };
    },
  };
}

function createAppSpy(calls, appValue) {
  return function createApp(options) {
    calls.push(options || {});
    return appValue || {
      kind: 'synthetic-app',
      listen() {
        throw new Error('listen_should_not_be_called');
      },
    };
  };
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

function requireSpecifiers(source) {
  const specifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers;
}

test('adapter uses sanitized customerAccess options', () => {
  const createAppCalls = [];
  const dbClient = createDbClient();
  const repository = { kind: 'repository' };

  createCustomerAccessEnabledApp({
    createApp: createAppSpy(createAppCalls),
    dbClient,
    customerAccess: {
      repository,
      token: 'token_should_not_leak',
      rawPhone: 'raw_phone_should_not_leak',
    },
  });

  assert.equal(createAppCalls.length, 1);
  assert.equal(createAppCalls[0].customerAccess.dbClient, dbClient);
  assert.equal(createAppCalls[0].customerAccess.repository, repository);
  assert.equal(createAppCalls[0].customerAccess.token, undefined);
  assert.equal(createAppCalls[0].customerAccess.rawPhone, undefined);
  assertNoSensitiveLeak(createAppCalls);
});

test('disabled config creates safe no-options app behavior', () => {
  const createAppCalls = [];

  createCustomerAccessEnabledApp({
    createApp: createAppSpy(createAppCalls),
    enabled: false,
    dbClient: createDbClient(),
    customerAccess: {
      repository: { kind: 'repository' },
    },
  });

  assert.deepEqual(createAppCalls, [{}]);
});

test('enabled config passes sanitized dbClient to createApp', () => {
  const createAppCalls = [];
  const dbClient = createDbClient();

  createCustomerAccessEnabledApp({
    createApp: createAppSpy(createAppCalls),
    enabled: true,
    dbClient,
  });

  assert.equal(createAppCalls[0].customerAccess.dbClient, dbClient);
});

test('malformed sensitive config does not reach createApp', () => {
  const createAppCalls = [];

  createCustomerAccessEnabledApp({
    createApp: createAppSpy(createAppCalls),
    enabled: true,
    customerAccess: 'postgres://db-url-should-not-leak?secret=secret_should_not_leak',
    token: 'token_should_not_leak',
  });

  assert.deepEqual(createAppCalls, [{}]);
  assertNoSensitiveLeak(createAppCalls);
});

test('customerAccess.repository, dbAdapter, and queryExecutor are preserved', () => {
  const createAppCalls = [];
  const repository = { kind: 'repository' };
  const dbAdapter = { kind: 'dbAdapter' };
  const queryExecutor = () => ({});

  createCustomerAccessEnabledApp({
    createApp: createAppSpy(createAppCalls),
    enabled: true,
    customerAccess: {
      repository,
      dbAdapter,
      queryExecutor,
    },
  });

  assert.equal(createAppCalls[0].customerAccess.repository, repository);
  assert.equal(createAppCalls[0].customerAccess.dbAdapter, dbAdapter);
  assert.equal(createAppCalls[0].customerAccess.queryExecutor, queryExecutor);
});

test('top-level dbClient does not override explicit customerAccess.dbClient', () => {
  const createAppCalls = [];
  const topLevelDbClient = createDbClient();
  const customerAccessDbClient = createDbClient();

  createCustomerAccessEnabledApp({
    createApp: createAppSpy(createAppCalls),
    enabled: true,
    dbClient: topLevelDbClient,
    customerAccess: {
      dbClient: customerAccessDbClient,
    },
  });

  assert.equal(createAppCalls[0].customerAccess.dbClient, customerAccessDbClient);
});

test('adapter creation does not call dbClient', () => {
  const createAppCalls = [];
  const dbCalls = [];

  createCustomerAccessEnabledApp({
    createApp: createAppSpy(createAppCalls),
    enabled: true,
    dbClient: createDbClient(dbCalls),
  });

  assert.equal(createAppCalls.length, 1);
  assert.deepEqual(dbCalls, []);
});

test('adapter does not call listen', () => {
  const createAppCalls = [];
  let listenCallCount = 0;

  createCustomerAccessEnabledApp({
    createApp: createAppSpy(createAppCalls, {
      listen() {
        listenCallCount += 1;
      },
    }),
    enabled: true,
    dbClient: createDbClient(),
  });

  assert.equal(listenCallCount, 0);
});

test('adapter does not import server or restricted runtime modules', () => {
  const source = fs.readFileSync(adapterFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.equal(specifiers.includes('../server'), false);
  assert.equal(specifiers.some((specifier) => /db\/pool|transaction|repositories?|provider|line|sms|email|push|ai|rag|vector/i.test(specifier)), false);
  assert.doesNotMatch(source, /listen\(|app\.listen|process\.env|transaction|begin|commit|rollback/i);
});

test('no token, secret, or DB URL leak in returned object', () => {
  const createAppCalls = [];
  const app = createCustomerAccessEnabledApp({
    createApp: createAppSpy(createAppCalls),
    enabled: true,
    customerAccess: {
      token: 'token_should_not_leak',
      secret: 'secret_should_not_leak',
      databaseUrl: 'postgres://db-url-should-not-leak',
      connectionString: 'connection_string_should_not_leak',
      password: 'password_should_not_leak',
      rawPhone: 'raw_phone_should_not_leak',
      rawAddress: 'raw_address_should_not_leak',
      rawLineUserId: 'line_user_should_not_leak',
    },
  });

  assertNoSensitiveLeak({ app, createAppCalls });
});
