'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createServerBootstrap,
  resolveServerApp,
  startServer,
} = require('../../src/server');

const { app: defaultApp } = require('../../src/app');

const repoRoot = path.resolve(__dirname, '../..');
const serverFile = path.join(repoRoot, 'src/server.js');

function createSyntheticApp(calls) {
  const safeCalls = Array.isArray(calls) ? calls : [];

  return {
    listen(port, callback) {
      safeCalls.push({ event: 'listen', port });

      if (callback) {
        callback();
      }

      return {
        close(closeCallback) {
          safeCalls.push({ event: 'close' });

          if (closeCallback) {
            closeCallback();
          }
        },
      };
    },
  };
}

function createLogger(calls) {
  const safeCalls = Array.isArray(calls) ? calls : [];

  return {
    log(...args) {
      safeCalls.push(['log', ...args]);
    },
    error(...args) {
      safeCalls.push(['error', ...args]);
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

function assertNoSensitiveLeak(value) {
  const serialized = JSON.stringify(value);

  for (const sensitiveValue of [
    'token_should_not_leak',
    'secret_should_not_leak',
    'postgres://db-url-should-not-leak',
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
  ]) {
    assert.equal(serialized.includes(sensitiveValue), false, `leaked ${sensitiveValue}`);
  }
}

test('server module exports app injection helpers', () => {
  assert.equal(typeof createServerBootstrap, 'function');
  assert.equal(typeof resolveServerApp, 'function');
  assert.equal(typeof startServer, 'function');
});

test('resolveServerApp uses injected app when provided', () => {
  const app = createSyntheticApp([]);

  assert.equal(resolveServerApp({ app }), app);
});

test('createServerBootstrap falls back to default app when no injected app exists', () => {
  const bootstrap = createServerBootstrap();

  assert.equal(bootstrap.app, defaultApp);
  assert.equal(typeof bootstrap.port, 'number');
  assert.equal(typeof bootstrap.start, 'function');
});

test('importing server module in test does not call listen', () => {
  const listenCalls = [];
  const app = createSyntheticApp(listenCalls);

  createServerBootstrap({ app, port: 4050 });

  assert.deepEqual(listenCalls, []);
});

test('injected app listen is not called until explicit start', () => {
  const listenCalls = [];
  const app = createSyntheticApp(listenCalls);
  const bootstrap = createServerBootstrap({ app, port: 4051 });

  assert.deepEqual(listenCalls, []);

  bootstrap.start({
    logger: createLogger([]),
    pool: { end: async () => {} },
    registerSignals: false,
  });

  assert.deepEqual(listenCalls, [{ event: 'listen', port: 4051 }]);
});

test('startServer calls listen on provided app exactly once with synthetic port', () => {
  const listenCalls = [];
  const loggerCalls = [];
  const app = createSyntheticApp(listenCalls);

  startServer({
    app,
    port: 4052,
    logger: createLogger(loggerCalls),
    pool: { end: async () => {} },
    registerSignals: false,
  });

  assert.deepEqual(listenCalls, [{ event: 'listen', port: 4052 }]);
  assert.equal(loggerCalls.length, 1);
});

test('startServer does not create or call DB client before shutdown', () => {
  const listenCalls = [];
  let poolEndCalls = 0;

  startServer({
    app: createSyntheticApp(listenCalls),
    port: 4053,
    logger: createLogger([]),
    pool: {
      async end() {
        poolEndCalls += 1;
      },
    },
    registerSignals: false,
  });

  assert.deepEqual(listenCalls, [{ event: 'listen', port: 4053 }]);
  assert.equal(poolEndCalls, 0);
});

test('shutdown closes provided pool through explicit shutdown only', async () => {
  const listenCalls = [];
  let poolEndCalls = 0;
  const exits = [];
  const runtime = startServer({
    app: createSyntheticApp(listenCalls),
    port: 4054,
    logger: createLogger([]),
    pool: {
      async end() {
        poolEndCalls += 1;
      },
    },
    exit(code) {
      exits.push(code);
    },
    registerSignals: false,
  });

  runtime.shutdown('TEST_SIGNAL');
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(poolEndCalls, 1);
  assert.deepEqual(exits, [0]);
});

test('server helper logs do not leak token, secret, DB URL, or raw identifiers', () => {
  const listenCalls = [];
  const loggerCalls = [];

  startServer({
    app: createSyntheticApp(listenCalls),
    port: 4055,
    logger: createLogger(loggerCalls),
    pool: { end: async () => {} },
    registerSignals: false,
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    databaseUrl: 'postgres://db-url-should-not-leak',
    rawPhone: 'raw_phone_should_not_leak',
    rawAddress: 'raw_address_should_not_leak',
    rawLineUserId: 'line_user_should_not_leak',
  });

  assertNoSensitiveLeak(loggerCalls);
});

test('server source does not import customer access DB adapters, repositories, providers, or AI modules', () => {
  const source = fs.readFileSync(serverFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.equal(specifiers.includes('./customerAccess/customerAccessDbAdapter'), false);
  assert.equal(specifiers.includes('./customerAccess/customerAccessDbQueryExecutor'), false);
  assert.equal(specifiers.some((specifier) => /repositories?|transaction|provider|line|sms|email|push|ai|rag|vector/i.test(specifier)), false);
  assert.doesNotMatch(source, /new Pool|createCustomerAccessDbAdapter|createCustomerAccessDbQueryExecutor|createCustomerAccessReadOnlyRepository/i);
});
