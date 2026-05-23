'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createCustomerAccessReadOnlyDbConnector,
} = require('../../src/customerAccess/customerAccessReadOnlyDbConnector');

const repoRoot = path.resolve(__dirname, '../..');
const connectorFile = path.join(repoRoot, 'src/customerAccess/customerAccessReadOnlyDbConnector.js');

function createPool(calls, result) {
  const safeCalls = Array.isArray(calls) ? calls : [];

  return {
    query(sql, params) {
      safeCalls.push({ sql, params });
      return result || { rows: [] };
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

test('exports createCustomerAccessReadOnlyDbConnector', () => {
  assert.equal(typeof createCustomerAccessReadOnlyDbConnector, 'function');
});

test('missing pool or db creates connector but createReadOnlyClient fail-closes', () => {
  const connector = createCustomerAccessReadOnlyDbConnector();

  assert.equal(typeof connector.createReadOnlyClient, 'function');
  assert.equal(connector.createReadOnlyClient({ readOnly: true }), null);
});

test('readOnly not true fail-closes and does not call pool', () => {
  const calls = [];
  const connector = createCustomerAccessReadOnlyDbConnector({
    pool: createPool(calls),
  });

  assert.equal(connector.createReadOnlyClient({ readOnly: false }), null);
  assert.equal(connector.createReadOnlyClient({}), null);
  assert.deepEqual(calls, []);
});

test('valid injected pool and readOnly true returns query client', () => {
  const calls = [];
  const connector = createCustomerAccessReadOnlyDbConnector({
    pool: createPool(calls),
  });
  const client = connector.createReadOnlyClient({ readOnly: true });

  assert.equal(typeof client.query, 'function');
  assert.deepEqual(calls, []);
});

test('client creation does not call pool or db', () => {
  const calls = [];
  const connector = createCustomerAccessReadOnlyDbConnector({
    db: createPool(calls),
  });

  connector.createReadOnlyClient({ readOnly: true });

  assert.deepEqual(calls, []);
});

test('query calls synthetic pool.query with SQL and params copy', () => {
  const calls = [];
  const connector = createCustomerAccessReadOnlyDbConnector({
    pool: createPool(calls, { rows: [{ id: 'row_001' }] }),
  });
  const client = connector.createReadOnlyClient({ readOnly: true });
  const params = ['org_001', 'case_001'];
  const result = client.query('select * from customer_access where id = $1', params);

  assert.deepEqual(result, { rows: [{ id: 'row_001' }] });
  assert.deepEqual(calls, [{
    sql: 'select * from customer_access where id = $1',
    params: ['org_001', 'case_001'],
  }]);
  assert.notEqual(calls[0].params, params);
});

test('query rejects empty SQL', () => {
  const connector = createCustomerAccessReadOnlyDbConnector({
    pool: createPool([]),
  });
  const client = connector.createReadOnlyClient({ readOnly: true });

  assert.throws(
    () => client.query(' ', []),
    /customer_access_read_only_query_rejected/
  );
});

test('query rejects non-array params', () => {
  const connector = createCustomerAccessReadOnlyDbConnector({
    pool: createPool([]),
  });
  const client = connector.createReadOnlyClient({ readOnly: true });

  assert.throws(
    () => client.query('select 1', { id: 'case_001' }),
    /customer_access_read_only_query_rejected/
  );
});

test('pool throw does not leak DB URL, token, or secret', () => {
  const connector = createCustomerAccessReadOnlyDbConnector({
    pool: {
      query() {
        throw new Error('internal_pool_error_should_not_leak postgres://db-url-should-not-leak token_should_not_leak secret_should_not_leak');
      },
    },
  });
  const client = connector.createReadOnlyClient({
    readOnly: true,
    connectionString: 'postgres://db-url-should-not-leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
  });

  assert.throws(
    () => client.query('select 1', []),
    (error) => {
      assert.equal(error.message, 'customer_access_read_only_query_failed');
      assertNoLeak(error);
      return true;
    }
  );
});

test('raw phone, address, and LINE id are not logged or returned by connector', () => {
  withConsoleSpy((consoleCalls) => {
    const connector = createCustomerAccessReadOnlyDbConnector({
      pool: createPool([]),
    });
    const client = connector.createReadOnlyClient({ readOnly: true });
    const result = client.query('select $1', [
      'raw_phone_should_not_leak',
      'raw_address_should_not_leak',
      'line_user_should_not_leak',
    ]);

    assert.deepEqual(result, { rows: [] });
    assert.deepEqual(consoleCalls, []);
    assertNoLeak(consoleCalls);
  });
});

test('params array is not mutated even if synthetic pool mutates received params', () => {
  const connector = createCustomerAccessReadOnlyDbConnector({
    pool: {
      query(sql, params) {
        params.push('mutated_inside_pool');
        return { rows: [] };
      },
    },
  });
  const client = connector.createReadOnlyClient({ readOnly: true });
  const params = ['org_001'];

  client.query('select $1', params);

  assert.deepEqual(params, ['org_001']);
});

test('pool object is not mutated', () => {
  const pool = createPool([]);
  const beforeKeys = Object.keys(pool);
  const connector = createCustomerAccessReadOnlyDbConnector({ pool });
  const client = connector.createReadOnlyClient({ readOnly: true });

  client.query('select 1', []);

  assert.deepEqual(Object.keys(pool), beforeKeys);
});

test('allowedStatementNames checks config statement metadata conservatively', () => {
  const connector = createCustomerAccessReadOnlyDbConnector({
    pool: createPool([]),
    allowedStatementNames: ['customer_access_publication_read'],
  });

  assert.equal(
    connector.createReadOnlyClient({
      readOnly: true,
      statementName: 'customer_access_publication_read',
    }) !== null,
    true
  );
  assert.equal(
    connector.createReadOnlyClient({
      readOnly: true,
      statementName: 'customer_access_internal_write',
    }),
    null
  );
});

test('connector has no logging side effects', () => {
  withConsoleSpy((calls) => {
    const connector = createCustomerAccessReadOnlyDbConnector({
      pool: createPool([]),
    });
    const client = connector.createReadOnlyClient({ readOnly: true });

    client.query('select 1', []);

    assert.deepEqual(calls, []);
  });
});

test('module has no process.env read, real DB, transaction, repository, server, provider, or AI imports', () => {
  const source = fs.readFileSync(connectorFile, 'utf8');

  assert.deepEqual(requireSpecifiers(source), []);
  assert.doesNotMatch(source, /process\.env/i);
  assert.doesNotMatch(source, /require\(['"].*(db|pool|repository|transaction|server|app|route|controller|provider|line|sms|email|push|ai|rag|vector)/i);
});
