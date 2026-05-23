'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Readable, Writable } = require('node:stream');
const test = require('node:test');

const {
  createServerBootstrap,
  getCustomerAccessSafeEnvFlags,
  resolveServerApp,
} = require('../../src/server');

const { app: defaultApp } = require('../../src/app');

const repoRoot = path.resolve(__dirname, '../..');
const serverFile = path.join(repoRoot, 'src/server.js');

const safeEnvKeys = [
  'CUSTOMER_ACCESS_ENABLED',
  'CUSTOMER_ACCESS_READ_ONLY_ENABLED',
  'CUSTOMER_ACCESS_DB_ENABLED',
];

const unsafeEnvKeys = [
  'DATABASE_URL',
  'DB_URL',
  'POSTGRES_URL',
  'PGHOST',
  'PGUSER',
  'PGPASSWORD',
  'TOKEN',
  'SECRET',
  'PASSWORD',
  'LINE_ACCESS_TOKEN',
  'LINE_CHANNEL_SECRET',
  'AI_PROVIDER_KEY',
  'OPENAI_API_KEY',
];

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

function createSyntheticApp() {
  return {
    listen() {
      throw new Error('listen should not be called by this unit test');
    },
  };
}

function createBootstrap(calls) {
  const safeCalls = Array.isArray(calls) ? calls : [];

  return {
    enabled: true,
    customerAccess: {
      dbAdapter: {},
      getInput() {
        safeCalls.push('bootstrap-input');
        return {
          organizationId: 'org_task650_bootstrap',
          caseId: 'case_task650_bootstrap',
          customerId: 'customer_task650_bootstrap',
        };
      },
    },
  };
}

function createComposer(calls) {
  const safeCalls = Array.isArray(calls) ? calls : [];

  return {
    env: {
      CUSTOMER_ACCESS_ENABLED: 'true',
    },
    customerAccess: {
      getInput() {
        safeCalls.push('composer-input');
        return {
          organizationId: 'org_task650_composer',
          caseId: 'case_task650_composer',
          customerId: 'customer_task650_composer',
        };
      },
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
    'postgres://db-url-should-not-leak',
    'db-url-should-not-leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'password_should_not_leak',
    'line-secret-should-not-leak',
    'ai-key-should-not-leak',
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
  ]) {
    assert.equal(serialized.includes(unsafeValue), false, `leaked ${unsafeValue}`);
  }
}

function withTemporaryCustomerAccessProcessEnv(values, callback) {
  const keys = [...safeEnvKeys, ...unsafeEnvKeys];
  const previous = {};

  for (const key of keys) {
    previous[key] = process.env[key];
    delete process.env[key];
  }

  try {
    for (const [key, value] of Object.entries(values)) {
      process.env[key] = value;
    }

    return callback();
  } finally {
    for (const key of keys) {
      if (previous[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = previous[key];
      }
    }
  }
}

test('exports safe env flag helper', () => {
  assert.equal(typeof getCustomerAccessSafeEnvFlags, 'function');
});

test('helper returns only supported non-secret Customer Access flags', () => {
  const result = getCustomerAccessSafeEnvFlags({
    CUSTOMER_ACCESS_ENABLED: 'true',
    CUSTOMER_ACCESS_READ_ONLY_ENABLED: '1',
    CUSTOMER_ACCESS_DB_ENABLED: 'yes',
    DATABASE_URL: 'postgres://db-url-should-not-leak',
    TOKEN: 'token_should_not_leak',
    SECRET: 'secret_should_not_leak',
    PASSWORD: 'password_should_not_leak',
    LINE_ACCESS_TOKEN: 'token_should_not_leak',
    LINE_CHANNEL_SECRET: 'line-secret-should-not-leak',
    AI_PROVIDER_KEY: 'ai-key-should-not-leak',
    OPENAI_API_KEY: 'ai-key-should-not-leak',
  });

  assert.deepEqual(result, {
    CUSTOMER_ACCESS_ENABLED: 'true',
    CUSTOMER_ACCESS_READ_ONLY_ENABLED: '1',
    CUSTOMER_ACCESS_DB_ENABLED: 'yes',
  });
  assertNoLeak(result);
});

test('helper handles missing or malformed env objects safely', () => {
  assert.deepEqual(getCustomerAccessSafeEnvFlags(null), {});
  assert.deepEqual(getCustomerAccessSafeEnvFlags('CUSTOMER_ACCESS_ENABLED=true'), {});
  assert.deepEqual(getCustomerAccessSafeEnvFlags(['CUSTOMER_ACCESS_ENABLED']), {});
});

test('default bootstrap can use safe process env flags to create safe-deny customer access app', async () => {
  await withTemporaryCustomerAccessProcessEnv({
    CUSTOMER_ACCESS_ENABLED: 'true',
    DATABASE_URL: 'postgres://db-url-should-not-leak',
    TOKEN: 'token_should_not_leak',
  }, async () => {
    const bootstrap = createServerBootstrap();
    const response = await requestApp(bootstrap.app, '/customer-access/case_task650_env');

    assert.notEqual(bootstrap.app, defaultApp);
    assert.equal(response.statusCode, 404);
    assert.equal(response.body.status, 'deny');
    assert.equal(response.body.messageKey, 'customerAccess.unavailable');
    assertNoLeak(response.body);
  });
});

test('CUSTOMER_ACCESS_DB_ENABLED without explicit pool or dbClient does not create DB client or query', async () => {
  await withTemporaryCustomerAccessProcessEnv({
    CUSTOMER_ACCESS_ENABLED: 'true',
    CUSTOMER_ACCESS_READ_ONLY_ENABLED: 'true',
    CUSTOMER_ACCESS_DB_ENABLED: 'true',
    DATABASE_URL: 'postgres://db-url-should-not-leak',
  }, async () => {
    const bootstrap = createServerBootstrap();
    const response = await requestApp(bootstrap.app, '/customer-access/case_task650_db_flag');

    assert.notEqual(bootstrap.app, defaultApp);
    assert.equal(response.statusCode, 404);
    assert.equal(response.body.status, 'deny');
    assertNoLeak(response.body);
  });
});

test('false, off, and zero values keep default app safe-deny behavior', async () => {
  await withTemporaryCustomerAccessProcessEnv({
    CUSTOMER_ACCESS_ENABLED: 'false',
    CUSTOMER_ACCESS_READ_ONLY_ENABLED: 'off',
    CUSTOMER_ACCESS_DB_ENABLED: '0',
  }, async () => {
    const bootstrap = createServerBootstrap();
    const response = await requestApp(bootstrap.app, '/customer-access/case_task650_disabled');

    assert.equal(bootstrap.app, defaultApp);
    assert.equal(response.statusCode, 404);
    assert.equal(response.body.status, 'deny');
  });
});

test('options.app priority wins over default env flags', async () => {
  await withTemporaryCustomerAccessProcessEnv({
    CUSTOMER_ACCESS_ENABLED: 'true',
  }, async () => {
    const app = createSyntheticApp();
    assert.equal(resolveServerApp({ app }), app);
  });
});

test('explicit options.env priority wins over default safe env flags', async () => {
  await withTemporaryCustomerAccessProcessEnv({
    CUSTOMER_ACCESS_ENABLED: 'true',
  }, async () => {
    const bootstrap = createServerBootstrap({
      env: {
        CUSTOMER_ACCESS_ENABLED: 'false',
      },
    });

    assert.equal(bootstrap.app, defaultApp);
  });
});

test('explicit customerAccessBootstrap and customerAccessComposer priority remains unchanged', async () => {
  await withTemporaryCustomerAccessProcessEnv({
    CUSTOMER_ACCESS_ENABLED: 'false',
  }, async () => {
    const bootstrapCalls = [];
    const composerCalls = [];
    const bootstrapApp = createServerBootstrap({
      customerAccessBootstrap: createBootstrap(bootstrapCalls),
    }).app;
    const composerApp = createServerBootstrap({
      customerAccessComposer: createComposer(composerCalls),
    }).app;

    assert.notEqual(bootstrapApp, defaultApp);
    assert.notEqual(composerApp, defaultApp);
    assert.deepEqual(bootstrapCalls, []);
    assert.deepEqual(composerCalls, []);
  });
});

test('direct-run behavior remains guarded by require.main === module', () => {
  const source = fs.readFileSync(serverFile, 'utf8');

  assert.match(source, /require\.main\s*===\s*module/);
  assert.match(source, /startServer\(\)/);
});

test('server source reads only allowed Customer Access env flag keys', () => {
  const source = fs.readFileSync(serverFile, 'utf8');

  for (const key of safeEnvKeys) {
    assert.match(source, new RegExp(key));
  }

  for (const key of unsafeEnvKeys) {
    assert.doesNotMatch(source, new RegExp(key));
  }
});

test('server source does not log env, secrets, DB URLs, or raw identifiers', () => {
  const source = fs.readFileSync(serverFile, 'utf8');

  assert.doesNotMatch(source, /\b(console|logger)\.(log|info|warn|error)\([^)]*env/i);
  assert.doesNotMatch(source, /\b(console|logger)\.(log|info|warn|error)\([^)]*(DATABASE_URL|DB_URL|POSTGRES_URL|TOKEN|SECRET|PASSWORD|LINE_ACCESS_TOKEN|LINE_CHANNEL_SECRET|OPENAI_API_KEY|rawPhone|rawAddress|rawLineUserId)/i);
});

test('server source does not import real DB, transaction, repository, provider, AI, or RAG modules', () => {
  const source = fs.readFileSync(serverFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.equal(specifiers.includes('./customerAccess/customerAccessEnvBoundary'), true);
  assert.equal(specifiers.includes('./customerAccess/customerAccessDbAdapter'), false);
  assert.equal(specifiers.includes('./customerAccess/customerAccessDbQueryExecutor'), false);
  assert.equal(specifiers.includes('./customerAccess/customerAccessReadOnlyRepository'), false);
  assert.equal(specifiers.includes('./customerAccess/customerAccessReadOnlyDbConnector'), false);
  assert.equal(specifiers.some((specifier) => /repositories?|transaction|provider|line|sms|email|push|ai|rag|vector/i.test(specifier)), false);
});
