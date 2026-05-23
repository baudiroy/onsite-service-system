'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Readable, Writable } = require('node:stream');
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

function createRequest(pathname) {
  const req = new Readable({
    read() {
      this.push(null);
    },
  });

  req.method = 'GET';
  req.url = pathname;
  req.originalUrl = pathname;
  req.headers = {};
  req.connection = {};

  return req;
}

function createResponse() {
  const chunks = [];
  const headers = {};

  const res = new Writable({
    write(chunk, encoding, callback) {
      chunks.push(Buffer.from(chunk));
      callback();
    },
  });

  res.statusCode = 200;
  res.setHeader = (name, value) => {
    headers[name.toLowerCase()] = value;
  };
  res.getHeader = (name) => headers[name.toLowerCase()];
  res.removeHeader = (name) => {
    delete headers[name.toLowerCase()];
  };
  res.writeHead = (statusCode, headerValues) => {
    res.statusCode = statusCode;
    if (headerValues && typeof headerValues === 'object') {
      for (const [name, value] of Object.entries(headerValues)) {
        res.setHeader(name, value);
      }
    }
    return res;
  };
  res.end = (chunk, encoding, callback) => {
    if (chunk) {
      chunks.push(Buffer.from(chunk, encoding));
    }
    Writable.prototype.end.call(res, callback);
    return res;
  };
  res.bodyText = () => Buffer.concat(chunks).toString('utf8');
  res.bodyJson = () => JSON.parse(res.bodyText());

  return res;
}

function requestApp(app, pathname) {
  return new Promise((resolve, reject) => {
    const req = createRequest(pathname);
    const res = createResponse();

    res.on('finish', () => {
      try {
        resolve({
          body: res.bodyJson(),
          bodyText: res.bodyText(),
          statusCode: res.statusCode,
        });
      } catch (error) {
        reject(error);
      }
    });
    res.on('error', reject);
    app.handle(req, res);
  });
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

function assertNoLeak(value) {
  const serialized = JSON.stringify(value);

  for (const unsafeValue of [
    'token_should_not_leak',
    'secret_should_not_leak',
    'postgres://db-url-should-not-leak',
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
    'internal_db_error_should_not_leak',
    'select ',
    'from cases',
  ]) {
    assert.equal(serialized.includes(unsafeValue), false, `leaked ${unsafeValue}`);
  }
}

test('options.app priority still wins over env', () => {
  const injectedApp = createSyntheticApp([]);
  const resolved = resolveServerApp({
    app: injectedApp,
    env: {
      CUSTOMER_ACCESS_ENABLED: 'true',
    },
  });

  assert.equal(resolved, injectedApp);
});

test('explicit customerAccessBootstrap priority wins over env', () => {
  const dbCalls = [];
  const app = resolveServerApp({
    customerAccessBootstrap: {
      enabled: true,
      dbClient: createSyntheticDbClient(dbCalls),
    },
    env: {
      CUSTOMER_ACCESS_ENABLED: 'false',
    },
  });

  assert.notEqual(app, defaultApp);
  assert.deepEqual(dbCalls, []);
});

test('missing env uses default app', () => {
  assert.equal(resolveServerApp(), defaultApp);
});

test('env CUSTOMER_ACCESS_ENABLED true creates customer-access-enabled app without DB client', async () => {
  const bootstrap = createServerBootstrap({
    env: {
      CUSTOMER_ACCESS_ENABLED: 'true',
    },
  });
  const response = await requestApp(bootstrap.app, '/customer-access/case_env_options_001');

  assert.notEqual(bootstrap.app, defaultApp);
  assert.equal(response.statusCode, 404);
  assert.equal(response.body.status, 'deny');
  assert.equal(response.body.messageKey, 'customerAccess.unavailable');
  assertNoLeak(response.body);
});

test('env CUSTOMER_ACCESS_DB_ENABLED true does not create DB client or call DB', async () => {
  const bootstrap = createServerBootstrap({
    env: {
      CUSTOMER_ACCESS_ENABLED: 'true',
      CUSTOMER_ACCESS_DB_ENABLED: 'true',
      DATABASE_URL: 'postgres://db-url-should-not-leak',
    },
  });
  const response = await requestApp(bootstrap.app, '/customer-access/case_env_options_001');

  assert.equal(response.statusCode, 404);
  assert.equal(response.body.status, 'deny');
  assertNoLeak(response.body);
});

test('env containing DATABASE_URL, token, and secret does not leak into response', async () => {
  const bootstrap = createServerBootstrap({
    env: {
      CUSTOMER_ACCESS_ENABLED: 'true',
      DATABASE_URL: 'postgres://db-url-should-not-leak',
      token: 'token_should_not_leak',
      secret: 'secret_should_not_leak',
      rawPhone: 'raw_phone_should_not_leak',
      rawAddress: 'raw_address_should_not_leak',
      rawLineUserId: 'line_user_should_not_leak',
    },
  });
  const response = await requestApp(bootstrap.app, '/customer-access/case_env_options_001');

  assert.equal(response.statusCode, 404);
  assertNoLeak(response.body);
});

test('env false values keep default safe-deny behavior through default app', async () => {
  const bootstrap = createServerBootstrap({
    env: {
      CUSTOMER_ACCESS_ENABLED: 'false',
      CUSTOMER_ACCESS_READ_ONLY_ENABLED: '0',
    },
  });
  const response = await requestApp(bootstrap.app, '/customer-access/case_env_options_001');

  assert.equal(bootstrap.app, defaultApp);
  assert.equal(response.statusCode, 404);
  assert.equal(response.body.status, 'deny');
});

test('direct-run behavior remains guarded by require.main === module', () => {
  const source = fs.readFileSync(serverFile, 'utf8');

  assert.match(source, /require\.main\s*===\s*module/);
  assert.match(source, /startServer\(\)/);
});

test('server module reads only safe Customer Access env flags through helper', () => {
  const source = fs.readFileSync(serverFile, 'utf8');

  assert.match(source, /getCustomerAccessSafeEnvFlags\(envLike = process\.env\)/);
  assert.doesNotMatch(source, /process\.env\.(CUSTOMER_ACCESS|DATABASE_URL|TOKEN|SECRET|PASSWORD|LINE_CHANNEL)/i);
});

test('server module imports env boundary but no restricted DB, repository, provider, or AI modules', () => {
  const source = fs.readFileSync(serverFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.equal(specifiers.includes('./customerAccess/customerAccessEnvBoundary'), true);
  assert.equal(specifiers.includes('./customerAccess/customerAccessDbAdapter'), false);
  assert.equal(specifiers.includes('./customerAccess/customerAccessDbQueryExecutor'), false);
  assert.equal(specifiers.includes('./customerAccess/customerAccessReadOnlyRepository'), false);
  assert.equal(specifiers.some((specifier) => /repositories?|transaction|provider|line|sms|email|push|ai|rag|vector/i.test(specifier)), false);
});

test('startServer with env and injected app uses injected app priority and listens only when explicit', () => {
  const listenCalls = [];
  const injectedApp = createSyntheticApp(listenCalls);
  const bootstrap = createServerBootstrap({
    app: injectedApp,
    env: {
      CUSTOMER_ACCESS_ENABLED: 'true',
    },
    port: 4057,
  });

  assert.equal(bootstrap.app, injectedApp);
  assert.deepEqual(listenCalls, []);

  startServer({
    app: bootstrap.app,
    env: {
      CUSTOMER_ACCESS_ENABLED: 'true',
    },
    port: bootstrap.port,
    logger: createLogger([]),
    pool: { end: async () => {} },
    registerSignals: false,
  });

  assert.deepEqual(listenCalls, [{ event: 'listen', port: 4057 }]);
});
