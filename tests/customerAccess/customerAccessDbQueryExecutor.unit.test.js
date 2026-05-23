'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  buildCustomerAccessReadModelQuerySpec,
} = require('../../src/customerAccess/customerAccessDbReadModelMapper');
const {
  createCustomerAccessDbQueryExecutor,
} = require('../../src/customerAccess/customerAccessDbQueryExecutor');

const repoRoot = path.resolve(__dirname, '../..');

function querySpec(overrides) {
  return {
    ...buildCustomerAccessReadModelQuerySpec({
      organizationId: 'org_db_001',
      caseId: 'case_db_001',
      customerId: 'customer_db_001',
      rawPhone: 'raw_phone_should_not_leak',
      rawAddress: 'raw_address_should_not_leak',
      rawLineUserId: 'line_user_should_not_leak',
    }),
    ...(overrides || {}),
  };
}

function rowForKey(key) {
  const rowsByKey = {
    case: {
      id: 'case_db_001',
      organization_id: 'org_db_001',
      customer_id: 'customer_db_001',
      raw_phone: 'raw_phone_should_not_leak',
    },
    customerIdentity: {
      customer_id: 'customer_db_001',
      organization_id: 'org_db_001',
      verified: true,
      line_channel_id: 'line_channel_db_001',
      line_user_id: 'line_user_should_not_leak',
      token: 'token_should_not_leak',
    },
    publication: {
      case_id: 'case_db_001',
      organization_id: 'org_db_001',
      publication_allowed: true,
      customer_visible_policy_passed: true,
      secret: 'secret_should_not_leak',
    },
    serviceReport: {
      public_report_id: 'report_public_db_001',
      status: 'available',
      final_appointment_id: 'appt_should_not_be_in_output',
      internal_note: 'internal_note_should_not_leak',
    },
  };

  return rowsByKey[key];
}

function dbClientWithRows(rowsByStatementKey, calls) {
  const safeCalls = Array.isArray(calls) ? calls : [];

  return {
    query(sql, params) {
      safeCalls.push({ sql, params });
      const statement = querySpec().statements.find((candidate) => candidate.sql === sql);
      const row = rowsByStatementKey[statement && statement.key];

      return row ? { rows: [row] } : { rows: [] };
    },
  };
}

function validRowsByStatementKey() {
  return {
    case: rowForKey('case'),
    customerIdentity: rowForKey('customerIdentity'),
    publication: rowForKey('publication'),
    serviceReport: rowForKey('serviceReport'),
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertNoLeak(output) {
  const serialized = JSON.stringify(output);

  for (const value of [
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'internal_error_should_not_leak',
    'internal_note_should_not_leak',
    'appt_should_not_be_in_output',
  ]) {
    assert.equal(serialized.includes(value), false, `executor output leaked ${value}`);
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

test('exports createCustomerAccessDbQueryExecutor', () => {
  assert.equal(typeof createCustomerAccessDbQueryExecutor, 'function');
});

test('missing dbClient returns executor that fail-closes without throw', () => {
  const executor = createCustomerAccessDbQueryExecutor();

  assert.deepEqual(executor(querySpec()), {});
});

test('non-executable querySpec does not call dbClient', () => {
  let callCount = 0;
  const executor = createCustomerAccessDbQueryExecutor({
    dbClient: {
      query() {
        callCount += 1;
        return { rows: [rowForKey('case')] };
      },
    },
  });

  assert.deepEqual(executor(querySpec({ executable: false })), {});
  assert.equal(callCount, 0);
});

test('valid querySpec calls dbClient with parameterized SQL and params', () => {
  const calls = [];
  const executor = createCustomerAccessDbQueryExecutor({
    dbClient: dbClientWithRows(validRowsByStatementKey(), calls),
  });

  executor(querySpec());

  assert.equal(calls.length, 4);
  for (const call of calls) {
    assert.match(call.sql, /\$\d/);
    assert.equal(call.sql.includes('org_db_001'), false);
    assert.equal(call.sql.includes('case_db_001'), false);
    assert.equal(call.sql.includes('customer_db_001'), false);
    assert.equal(call.params.includes('raw_phone_should_not_leak'), false);
    assert.equal(call.params.includes('raw_address_should_not_leak'), false);
    assert.equal(call.params.includes('line_user_should_not_leak'), false);
  }
});

test('valid dbClient results map to expected row bundle keys', () => {
  const executor = createCustomerAccessDbQueryExecutor({
    dbClient: dbClientWithRows(validRowsByStatementKey()),
  });

  assert.deepEqual(executor(querySpec()), {
    caseRow: {
      id: 'case_db_001',
      organization_id: 'org_db_001',
      customer_id: 'customer_db_001',
    },
    customerIdentityRow: {
      customer_id: 'customer_db_001',
      organization_id: 'org_db_001',
      verified: true,
      line_channel_id: 'line_channel_db_001',
    },
    publicationRow: {
      case_id: 'case_db_001',
      organization_id: 'org_db_001',
      publication_allowed: true,
      customer_visible_policy_passed: true,
    },
    serviceReportRow: {
      public_report_id: 'report_public_db_001',
      status: 'available',
    },
  });
});

test('dbClient throw fail-closes without raw error leak', () => {
  const executor = createCustomerAccessDbQueryExecutor({
    dbClient: {
      query() {
        throw new Error('internal_error_should_not_leak');
      },
    },
  });
  const output = executor(querySpec());

  assert.deepEqual(output, {});
  assertNoLeak(output);
});

test('malformed dbClient result fail-closes for that row bundle', () => {
  const executor = createCustomerAccessDbQueryExecutor({
    dbClient: {
      query() {
        return { row: rowForKey('case') };
      },
    },
  });

  assert.deepEqual(executor(querySpec()), {});
});

test('query spec with missing statements fail-closes', () => {
  const executor = createCustomerAccessDbQueryExecutor({
    dbClient: dbClientWithRows(validRowsByStatementKey()),
  });

  assert.deepEqual(executor(querySpec({ statements: undefined })), {});
  assert.deepEqual(executor(querySpec({ statements: [] })), {});
});

test('raw phone, address, and LINE id are not used as params or output fields', () => {
  const calls = [];
  const executor = createCustomerAccessDbQueryExecutor({
    dbClient: dbClientWithRows(validRowsByStatementKey(), calls),
  });
  const output = executor(querySpec());

  assertNoLeak(output);
  assert.equal(JSON.stringify(calls).includes('raw_phone_should_not_leak'), false);
  assert.equal(JSON.stringify(calls).includes('raw_address_should_not_leak'), false);
  assert.equal(JSON.stringify(calls).includes('line_user_should_not_leak'), false);
});

test('output does not expose token, secret, or internal error', () => {
  assertNoLeak(createCustomerAccessDbQueryExecutor({
    dbClient: dbClientWithRows(validRowsByStatementKey()),
  })(querySpec()));
});

test('input querySpec is not mutated', () => {
  const spec = querySpec();
  const before = clone(spec);

  createCustomerAccessDbQueryExecutor({
    dbClient: dbClientWithRows(validRowsByStatementKey()),
  })(spec);

  assert.deepEqual(spec, before);
});

test('dbClient object is not mutated', () => {
  const dbClient = dbClientWithRows(validRowsByStatementKey());
  const beforeKeys = Object.keys(dbClient);

  createCustomerAccessDbQueryExecutor({ dbClient })(querySpec());

  assert.deepEqual(Object.keys(dbClient), beforeKeys);
});

test('module has no real DB, transaction, repository, provider, or AI imports', () => {
  const source = fs.readFileSync(
    path.join(repoRoot, 'src/customerAccess/customerAccessDbQueryExecutor.js'),
    'utf8',
  );

  assert.deepEqual(requireSpecifiers(source), []);
  assert.doesNotMatch(source, /pg|pool|transaction|begin|commit|rollback/i);
  assert.doesNotMatch(source, /repositories?|routes?|controllers?|middlewares?/i);
});
