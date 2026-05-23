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

function createSpyAppFactory(calls, appValue) {
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

function createSyntheticDbClient(calls) {
  const safeCalls = Array.isArray(calls) ? calls : [];

  return {
    query(sql, params) {
      safeCalls.push({ sql, params });
      return { rows: [] };
    },
  };
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

test('exports createCustomerAccessEnabledApp', () => {
  assert.equal(typeof createCustomerAccessEnabledApp, 'function');
});

test('injected createApp is called with customerAccess.dbClient', () => {
  const createAppCalls = [];
  const dbCalls = [];
  const dbClient = createSyntheticDbClient(dbCalls);
  const app = createCustomerAccessEnabledApp({
    createApp: createSpyAppFactory(createAppCalls),
    dbClient,
  });

  assert.equal(app.kind, 'synthetic-app');
  assert.equal(createAppCalls.length, 1);
  assert.equal(createAppCalls[0].customerAccess.dbClient, dbClient);
  assert.deepEqual(dbCalls, []);
});

test('missing dbClient still creates app with no-options behavior', () => {
  const createAppCalls = [];

  createCustomerAccessEnabledApp({
    createApp: createSpyAppFactory(createAppCalls),
  });

  assert.deepEqual(createAppCalls, [{}]);
});

test('existing customerAccess.repository option is preserved', () => {
  const createAppCalls = [];
  const repository = { kind: 'repository' };
  const dbClient = createSyntheticDbClient();

  createCustomerAccessEnabledApp({
    createApp: createSpyAppFactory(createAppCalls),
    dbClient,
    customerAccess: {
      repository,
    },
  });

  assert.equal(createAppCalls[0].customerAccess.repository, repository);
  assert.equal(createAppCalls[0].customerAccess.dbClient, dbClient);
});

test('existing customerAccess.dbAdapter option is preserved', () => {
  const createAppCalls = [];
  const dbAdapter = { kind: 'dbAdapter' };

  createCustomerAccessEnabledApp({
    createApp: createSpyAppFactory(createAppCalls),
    dbClient: createSyntheticDbClient(),
    customerAccess: {
      dbAdapter,
    },
  });

  assert.equal(createAppCalls[0].customerAccess.dbAdapter, dbAdapter);
});

test('existing customerAccess.queryExecutor option is preserved', () => {
  const createAppCalls = [];
  const queryExecutor = () => ({});

  createCustomerAccessEnabledApp({
    createApp: createSpyAppFactory(createAppCalls),
    dbClient: createSyntheticDbClient(),
    customerAccess: {
      queryExecutor,
    },
  });

  assert.equal(createAppCalls[0].customerAccess.queryExecutor, queryExecutor);
});

test('customerAccess.dbClient option is not overwritten by top-level dbClient', () => {
  const createAppCalls = [];
  const topLevelDbClient = createSyntheticDbClient();
  const customerAccessDbClient = createSyntheticDbClient();

  createCustomerAccessEnabledApp({
    createApp: createSpyAppFactory(createAppCalls),
    dbClient: topLevelDbClient,
    customerAccess: {
      dbClient: customerAccessDbClient,
    },
  });

  assert.equal(createAppCalls[0].customerAccess.dbClient, customerAccessDbClient);
});

test('adapter does not call listen', () => {
  const createAppCalls = [];
  let listenCallCount = 0;

  createCustomerAccessEnabledApp({
    createApp(options) {
      createAppCalls.push(options || {});
      return {
        listen() {
          listenCallCount += 1;
        },
      };
    },
    dbClient: createSyntheticDbClient(),
  });

  assert.equal(listenCallCount, 0);
});

test('malformed options do not leak token, secret, or DB URL', () => {
  const createAppCalls = [];
  const app = createCustomerAccessEnabledApp({
    createApp: createSpyAppFactory(createAppCalls),
    customerAccess: 'postgres://token_secret_should_not_leak@example.test/db',
  });
  const serialized = JSON.stringify({ app, createAppCalls });

  assert.equal(serialized.includes('token_secret_should_not_leak'), false);
});

test('module has no server, real DB, transaction, repository, provider, or AI imports', () => {
  const source = fs.readFileSync(adapterFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, [
    '../app',
  ]);
  assert.equal(specifiers.includes('../server'), false);
  assert.equal(specifiers.some((specifier) => /db\/pool|transaction|repositories?|provider|line|sms|email|push|ai|rag|vector/i.test(specifier)), false);
  assert.doesNotMatch(source, /listen\(|app\.listen|transaction|begin|commit|rollback/i);
});
