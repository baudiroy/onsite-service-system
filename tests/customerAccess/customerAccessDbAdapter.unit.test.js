'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createCustomerAccessDbAdapter,
} = require('../../src/customerAccess/customerAccessDbAdapter');

const repoRoot = path.resolve(__dirname, '../..');

function validInput(overrides) {
  return {
    organizationId: 'org_adapter_001',
    caseId: 'case_adapter_001',
    customerId: 'customer_adapter_001',
    rawPhone: 'raw_phone_should_not_leak',
    rawAddress: 'raw_address_should_not_leak',
    rawLineUserId: 'line_user_should_not_leak',
    ...(overrides || {}),
  };
}

function rowForKey(key, overrides) {
  const config = overrides || {};
  const rows = {
    case: {
      id: 'case_adapter_001',
      organization_id: 'org_adapter_001',
      customer_id: 'customer_adapter_001',
      raw_phone: 'raw_phone_should_not_leak',
      ...(config.case || {}),
    },
    customerIdentity: {
      customer_id: 'customer_adapter_001',
      organization_id: 'org_adapter_001',
      verified: true,
      line_channel_id: 'line_channel_adapter_001',
      line_user_id: 'line_user_should_not_leak',
      token: 'token_should_not_leak',
      ...(config.customerIdentity || {}),
    },
    publication: {
      case_id: 'case_adapter_001',
      organization_id: 'org_adapter_001',
      publication_allowed: true,
      customer_visible_policy_passed: true,
      secret: 'secret_should_not_leak',
      ...(config.publication || {}),
    },
    serviceReport: {
      public_report_id: 'report_public_adapter_001',
      status: 'available',
      final_appointment_id: 'appt_should_not_be_in_output',
      internal_note: 'internal_note_should_not_leak',
      audit_log: 'audit_log_should_not_leak',
      ai_raw_payload: 'ai_raw_payload_should_not_leak',
      billing_internal_data: 'billing_internal_data_should_not_leak',
      settlement_internal_data: 'settlement_internal_data_should_not_leak',
      ...(config.serviceReport || {}),
    },
  };

  return rows[key];
}

function createSyntheticDbClient(rowOverrides, calls) {
  const safeCalls = Array.isArray(calls) ? calls : [];
  const sqlToKey = {};
  const rowsByKey = {
    case: rowForKey('case', rowOverrides),
    customerIdentity: rowForKey('customerIdentity', rowOverrides),
    publication: rowForKey('publication', rowOverrides),
    serviceReport: rowForKey('serviceReport', rowOverrides),
  };

  if (rowOverrides && Object.prototype.hasOwnProperty.call(rowOverrides, 'serviceReport')
    && rowOverrides.serviceReport === undefined) {
    delete rowsByKey.serviceReport;
  }

  return {
    query(sql, params) {
      safeCalls.push({ sql, params });
      const statementKey = sqlToKey[sql];
      const row = rowsByKey[statementKey];

      return row ? { rows: [row] } : { rows: [] };
    },
    rememberSpec(querySpec) {
      for (const statement of querySpec.statements || []) {
        sqlToKey[statement.sql] = statement.key;
      }
    },
  };
}

function adapterWithDbClient(rowOverrides, calls) {
  const dbClient = createSyntheticDbClient(rowOverrides, calls);
  const adapter = createCustomerAccessDbAdapter({ dbClient });
  const originalQueryExecutor = adapter.queryExecutor;

  adapter.queryExecutor = (querySpec) => {
    dbClient.rememberSpec(querySpec);
    return originalQueryExecutor(querySpec);
  };
  adapter.repository = createCustomerAccessDbAdapter({
    dbClient: {
      query(sql, params) {
        dbClient.rememberSpec({ statements: [{ sql, key: undefined }] });
        return dbClient.query(sql, params);
      },
    },
  }).repository;

  return {
    adapter: createCustomerAccessDbAdapter({
      dbClient: {
        query(sql, params) {
          safeRememberQuerySql(dbClient, sql);
          return dbClient.query(sql, params);
        },
      },
    }),
    dbClient,
  };
}

function safeRememberQuerySql(dbClient, sql) {
  const knownStatements = [
    { key: 'case', token: 'from cases' },
    { key: 'customerIdentity', token: 'from customer_channel_identities' },
    { key: 'publication', token: 'from customer_access_publications' },
    { key: 'serviceReport', token: 'from customer_visible_service_reports' },
  ];
  const match = knownStatements.find((statement) => sql.includes(statement.token));

  if (match) {
    dbClient.rememberSpec({ statements: [{ sql, key: match.key }] });
  }
}

function collectContract(repository, input) {
  return {
    organizationScope: repository.getOrganizationScope(input),
    customerIdentity: repository.getVerifiedCustomerIdentity(input),
    caseLinkage: repository.getCaseLinkage(input),
    publication: repository.getPublicationState(input),
    customerVisibleProjection: repository.getCustomerVisibleProjection(input),
  };
}

function assertNoLeak(output) {
  const serialized = JSON.stringify(output);

  for (const value of [
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'internal_db_error_should_not_leak',
    'internal_note_should_not_leak',
    'audit_log_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'billing_internal_data_should_not_leak',
    'settlement_internal_data_should_not_leak',
    'appt_should_not_be_in_output',
  ]) {
    assert.equal(serialized.includes(value), false, `adapter output leaked ${value}`);
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
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

test('exports createCustomerAccessDbAdapter', () => {
  assert.equal(typeof createCustomerAccessDbAdapter, 'function');
});

test('factory returns queryExecutor and repository', () => {
  const adapter = createCustomerAccessDbAdapter();

  assert.equal(typeof adapter.queryExecutor, 'function');
  assert.equal(typeof adapter.repository.getOrganizationScope, 'function');
  assert.equal(typeof adapter.repository.getCustomerVisibleProjection, 'function');
});

test('factory creation does not call dbClient', () => {
  let callCount = 0;

  createCustomerAccessDbAdapter({
    dbClient: {
      query() {
        callCount += 1;
        return { rows: [] };
      },
    },
  });

  assert.equal(callCount, 0);
});

test('missing dbClient creates fail-closed repository behavior', () => {
  const adapter = createCustomerAccessDbAdapter();
  const output = collectContract(adapter.repository, validInput());

  assert.deepEqual(output.organizationScope, {
    available: false,
    matched: false,
    organizationId: null,
  });
  assert.deepEqual(output.customerVisibleProjection, {
    available: false,
    data: {},
  });
});

test('synthetic all-allow dbClient rows map to repository contract all-allow pieces', () => {
  const { adapter } = adapterWithDbClient();
  const output = collectContract(adapter.repository, validInput());

  assert.deepEqual(output, {
    organizationScope: {
      available: true,
      matched: true,
      organizationId: 'org_adapter_001',
    },
    customerIdentity: {
      available: true,
      verified: true,
      customerId: 'customer_adapter_001',
    },
    caseLinkage: {
      available: true,
      linked: true,
      caseId: 'case_adapter_001',
    },
    publication: {
      available: true,
      allowed: true,
      customerVisiblePolicyPassed: false,
    },
    customerVisibleProjection: {
      available: true,
      data: {
        serviceReport: {
          publicReportId: 'report_public_adapter_001',
          status: 'available',
        },
      },
    },
  });
});

test('dbClient throw maps to repository fail-closed without raw error leak', () => {
  const adapter = createCustomerAccessDbAdapter({
    dbClient: {
      query() {
        throw new Error('internal_db_error_should_not_leak');
      },
    },
  });
  const output = collectContract(adapter.repository, validInput());

  assert.deepEqual(output.organizationScope, {
    available: false,
    matched: false,
    organizationId: null,
  });
  assertNoLeak(output);
});

test('malformed dbClient result fail-closes', () => {
  const adapter = createCustomerAccessDbAdapter({
    dbClient: {
      query() {
        return { row: rowForKey('case') };
      },
    },
  });

  assert.deepEqual(collectContract(adapter.repository, validInput()).caseLinkage, {
    available: false,
    linked: false,
    caseId: null,
  });
});

test('organization mismatch rows fail-close unmatched', () => {
  const { adapter } = adapterWithDbClient({
    publication: {
      organization_id: 'org_other_001',
    },
  });

  assert.deepEqual(collectContract(adapter.repository, validInput()).organizationScope, {
    available: false,
    matched: false,
    organizationId: null,
  });
});

test('customer mismatch rows fail-close', () => {
  const { adapter } = adapterWithDbClient({
    customerIdentity: {
      customer_id: 'customer_other_001',
    },
  });

  assert.deepEqual(collectContract(adapter.repository, validInput()).customerIdentity, {
    available: false,
    verified: false,
    customerId: null,
  });
});

test('unverified identity rows map verified false', () => {
  const { adapter } = adapterWithDbClient({
    customerIdentity: {
      verified: false,
    },
  });

  assert.deepEqual(collectContract(adapter.repository, validInput()).customerIdentity, {
    available: false,
    verified: false,
    customerId: null,
  });
});

test('publication denied rows map allowed false', () => {
  const { adapter } = adapterWithDbClient({
    publication: {
      publication_allowed: false,
    },
  });

  assert.deepEqual(collectContract(adapter.repository, validInput()).publication, {
    available: false,
    allowed: false,
    customerVisiblePolicyPassed: false,
  });
});

test('projection unavailable rows map unavailable', () => {
  const { adapter } = adapterWithDbClient({
    serviceReport: undefined,
  });

  assert.deepEqual(collectContract(adapter.repository, validInput()).customerVisibleProjection, {
    available: false,
    data: {},
  });
});

test('forbidden/internal fields are stripped and finalAppointmentId is not included or modified', () => {
  const { adapter } = adapterWithDbClient();
  const output = collectContract(adapter.repository, validInput());

  assert.deepEqual(output.customerVisibleProjection, {
    available: true,
    data: {
      serviceReport: {
        publicReportId: 'report_public_adapter_001',
        status: 'available',
      },
    },
  });
  assert.equal(JSON.stringify(output).includes('finalAppointmentId'), false);
  assertNoLeak(output);
});

test('input query params and dbClient object are not mutated', () => {
  const calls = [];
  const dbClient = createSyntheticDbClient({}, calls);
  const adapter = createCustomerAccessDbAdapter({
    dbClient: {
      query(sql, params) {
        safeRememberQuerySql(dbClient, sql);
        return dbClient.query(sql, params);
      },
    },
  });
  const input = validInput();
  const beforeInput = clone(input);
  const beforeKeys = Object.keys(dbClient);

  collectContract(adapter.repository, input);

  assert.deepEqual(input, beforeInput);
  assert.deepEqual(Object.keys(dbClient), beforeKeys);
});

test('module has no real DB, transaction, existing repository, provider, or AI imports', () => {
  const source = fs.readFileSync(
    path.join(repoRoot, 'src/customerAccess/customerAccessDbAdapter.js'),
    'utf8',
  );

  assert.deepEqual(requireSpecifiers(source), [
    './customerAccessDbQueryExecutor',
    './customerAccessReadOnlyRepository',
  ]);
  assert.doesNotMatch(source, /pg|pool|transaction|begin|commit|rollback/i);
  assert.doesNotMatch(source, /routes?|controllers?|middlewares?/i);
});
