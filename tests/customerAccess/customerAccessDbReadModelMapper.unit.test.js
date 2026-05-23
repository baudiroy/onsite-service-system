'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  CUSTOMER_ACCESS_READ_MODEL_QUERY_FIELDS,
  buildCustomerAccessReadModelQuerySpec,
  mapCustomerAccessDbRowsToReadModel,
} = require('../../src/customerAccess/customerAccessDbReadModelMapper');

const repoRoot = path.resolve(__dirname, '../..');
const mapperPath = path.join(repoRoot, 'src/customerAccess/customerAccessDbReadModelMapper.js');

function validRows(overrides) {
  const config = overrides || {};

  return {
    caseRow: config.caseRow || {
      id: 'case_test_001',
      organization_id: 'org_test_001',
      customer_id: 'customer_test_001',
    },
    customerIdentityRow: config.customerIdentityRow || {
      customer_id: 'customer_test_001',
      organization_id: 'org_test_001',
      verified: true,
      line_channel_id: 'line_channel_test_001',
      line_user_id: 'line_user_should_not_leak',
      raw_phone: 'raw_phone_should_not_leak',
    },
    publicationRow: config.publicationRow || {
      case_id: 'case_test_001',
      organization_id: 'org_test_001',
      publication_allowed: true,
      customer_visible_policy_passed: true,
    },
    serviceReportRow: config.serviceReportRow || {
      public_report_id: 'report_public_test_001',
      status: 'available',
      final_appointment_id: 'appt_should_not_be_in_mapper_output',
      internal_note: 'internal_note_should_not_leak',
      audit_log: 'audit_log_should_not_leak',
      ai_raw_payload: 'ai_raw_payload_should_not_leak',
      billing_internal_data: 'billing_internal_data_should_not_leak',
      settlement_internal_data: 'settlement_internal_data_should_not_leak',
      token: 'token_should_not_leak',
      secret: 'secret_should_not_leak',
    },
  };
}

function emptyReadModel() {
  return {
    organizationScope: {
      matched: false,
      organizationId: null,
    },
    customerIdentity: {
      verified: false,
      customerId: null,
    },
    caseLinkage: {
      linked: false,
      caseId: null,
    },
    publication: {
      allowed: false,
      customerVisiblePolicyPassed: false,
    },
    customerVisibleProjection: {
      available: false,
      data: {},
    },
  };
}

function assertNoSensitiveLeak(output) {
  const serialized = JSON.stringify(output);

  for (const value of [
    'line_user_should_not_leak',
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'internal_note_should_not_leak',
    'audit_log_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'billing_internal_data_should_not_leak',
    'settlement_internal_data_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'appt_should_not_be_in_mapper_output',
  ]) {
    assert.equal(serialized.includes(value), false, `output leaked ${value}`);
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

test('exports mapper, query spec builder, and query field constants', () => {
  assert.equal(typeof mapCustomerAccessDbRowsToReadModel, 'function');
  assert.equal(typeof buildCustomerAccessReadModelQuerySpec, 'function');
  assert.deepEqual(CUSTOMER_ACCESS_READ_MODEL_QUERY_FIELDS.requiredParams, [
    'organizationId',
    'caseId',
    'customerId',
  ]);
});

test('valid row bundle maps to all-allow readModel without raw channel identity', () => {
  const output = mapCustomerAccessDbRowsToReadModel(validRows());

  assert.deepEqual(output, {
    organizationScope: {
      matched: true,
      organizationId: 'org_test_001',
    },
    customerIdentity: {
      verified: true,
      customerId: 'customer_test_001',
      lineChannelId: 'line_channel_test_001',
    },
    caseLinkage: {
      linked: true,
      caseId: 'case_test_001',
    },
    publication: {
      allowed: true,
      customerVisiblePolicyPassed: true,
    },
    customerVisibleProjection: {
      available: true,
      data: {
        serviceReport: {
          publicReportId: 'report_public_test_001',
          status: 'available',
        },
      },
    },
  });
  assertNoSensitiveLeak(output);
});

test('missing input fail-closes', () => {
  assert.deepEqual(mapCustomerAccessDbRowsToReadModel(), emptyReadModel());
  assert.deepEqual(mapCustomerAccessDbRowsToReadModel(null), emptyReadModel());
});

test('missing caseRow fail-closes', () => {
  assert.deepEqual(mapCustomerAccessDbRowsToReadModel({
    customerIdentityRow: validRows().customerIdentityRow,
  }), emptyReadModel());
});

test('organization mismatch fail-closes', () => {
  const output = mapCustomerAccessDbRowsToReadModel(validRows({
    publicationRow: {
      case_id: 'case_test_001',
      organization_id: 'org_other_001',
      publication_allowed: true,
      customer_visible_policy_passed: true,
    },
  }));

  assert.deepEqual(output, emptyReadModel());
});

test('customer mismatch fail-closes', () => {
  const output = mapCustomerAccessDbRowsToReadModel(validRows({
    customerIdentityRow: {
      customer_id: 'customer_other_001',
      organization_id: 'org_test_001',
      verified: true,
    },
  }));

  assert.deepEqual(output, emptyReadModel());
});

test('unverified identity maps verified false without verifying raw values', () => {
  const output = mapCustomerAccessDbRowsToReadModel(validRows({
    customerIdentityRow: {
      customer_id: 'customer_test_001',
      organization_id: 'org_test_001',
      verified: false,
      raw_phone: 'raw_phone_should_not_leak',
      raw_address: 'raw_address_should_not_leak',
      line_user_id: 'line_user_should_not_leak',
    },
  }));

  assert.equal(output.organizationScope.matched, true);
  assert.deepEqual(output.customerIdentity, {
    verified: false,
    customerId: null,
  });
  assertNoSensitiveLeak(output);
});

test('case missing customer linkage maps linked false', () => {
  const output = mapCustomerAccessDbRowsToReadModel(validRows({
    caseRow: {
      id: 'case_test_001',
      organization_id: 'org_test_001',
    },
  }));

  assert.deepEqual(output.caseLinkage, {
    linked: false,
    caseId: 'case_test_001',
  });
  assert.equal(output.organizationScope.matched, true);
  assert.equal(output.customerIdentity.verified, false);
});

test('publication not allowed maps allowed false and projection unavailable', () => {
  const output = mapCustomerAccessDbRowsToReadModel(validRows({
    publicationRow: {
      case_id: 'case_test_001',
      organization_id: 'org_test_001',
      publication_allowed: false,
      customer_visible_policy_passed: true,
    },
  }));

  assert.deepEqual(output.publication, {
    allowed: false,
    customerVisiblePolicyPassed: false,
  });
  assert.deepEqual(output.customerVisibleProjection, {
    available: false,
    data: {},
  });
});

test('customer-visible policy failure maps policy false and projection unavailable', () => {
  const output = mapCustomerAccessDbRowsToReadModel(validRows({
    publicationRow: {
      case_id: 'case_test_001',
      organization_id: 'org_test_001',
      publication_allowed: true,
      customer_visible_policy_passed: false,
    },
  }));

  assert.deepEqual(output.publication, {
    allowed: true,
    customerVisiblePolicyPassed: false,
  });
  assert.deepEqual(output.customerVisibleProjection, {
    available: false,
    data: {},
  });
});

test('missing service report maps projection unavailable', () => {
  const rows = validRows({
    serviceReportRow: undefined,
  });
  delete rows.serviceReportRow;

  const output = mapCustomerAccessDbRowsToReadModel(rows);

  assert.deepEqual(output.customerVisibleProjection, {
    available: false,
    data: {},
  });
});

test('forbidden and internal fields are stripped from projection', () => {
  const output = mapCustomerAccessDbRowsToReadModel(validRows());

  assert.deepEqual(Object.keys(output.customerVisibleProjection.data.serviceReport), [
    'publicReportId',
    'status',
  ]);
  assertNoSensitiveLeak(output);
});

test('output does not include finalAppointmentId', () => {
  const output = mapCustomerAccessDbRowsToReadModel(validRows());
  const serialized = JSON.stringify(output);

  assert.equal(serialized.includes('finalAppointmentId'), false);
  assert.equal(serialized.includes('final_appointment_id'), false);
  assert.equal(serialized.includes('appt_should_not_be_in_mapper_output'), false);
});

test('input rows are not mutated', () => {
  const input = validRows();
  const before = clone(input);

  mapCustomerAccessDbRowsToReadModel(input);

  assert.deepEqual(input, before);
});

test('query spec has required organizationId, caseId, and customerId params', () => {
  const spec = buildCustomerAccessReadModelQuerySpec({
    organizationId: 'org_query_001',
    caseId: 'case_query_001',
    customerId: 'customer_query_001',
    rawPhone: 'raw_phone_should_not_leak',
    rawAddress: 'raw_address_should_not_leak',
    rawLineUserId: 'line_user_should_not_leak',
  });

  assert.equal(spec.name, 'customerAccessReadModel');
  assert.equal(spec.executable, true);
  assert.deepEqual(spec.requiredParams, ['organizationId', 'caseId', 'customerId']);
  assert.deepEqual(spec.params, {
    organizationId: 'org_query_001',
    caseId: 'case_query_001',
    customerId: 'customer_query_001',
  });
  assert.equal(JSON.stringify(spec).includes('raw_phone_should_not_leak'), false);
  assert.equal(JSON.stringify(spec).includes('raw_address_should_not_leak'), false);
  assert.equal(JSON.stringify(spec).includes('line_user_should_not_leak'), false);
});

test('query spec is not executable when required params are missing', () => {
  const spec = buildCustomerAccessReadModelQuerySpec({
    organizationId: 'org_query_001',
    caseId: '',
  });

  assert.equal(spec.executable, false);
  assert.deepEqual(spec.params, {
    organizationId: 'org_query_001',
    caseId: null,
    customerId: null,
  });
});

test('query spec SQL uses placeholders and does not interpolate raw values', () => {
  const spec = buildCustomerAccessReadModelQuerySpec({
    organizationId: 'org_query_001',
    caseId: 'case_query_001',
    customerId: 'customer_query_001',
    rawPhone: 'raw_phone_should_not_leak',
  });
  const serializedStatements = JSON.stringify(spec.statements);

  assert.equal(spec.statements.length >= 4, true);
  for (const statement of spec.statements) {
    assert.equal(typeof statement.sql, 'string');
    assert.match(statement.sql, /\$\d/);
    assert.equal(statement.sql.includes('org_query_001'), false);
    assert.equal(statement.sql.includes('case_query_001'), false);
    assert.equal(statement.sql.includes('customer_query_001'), false);
  }
  assert.equal(serializedStatements.includes('raw_phone_should_not_leak'), false);
});

test('module has no DB, transaction, provider, route, controller, middleware, repository, or AI imports', () => {
  const source = fs.readFileSync(mapperPath, 'utf8');

  assert.deepEqual(requireSpecifiers(source), []);
  assert.doesNotMatch(source, /pool|client\.query|transaction|begin|commit|rollback/i);
  assert.doesNotMatch(source, /provider|sms|email|push|rag|vector/i);
  assert.doesNotMatch(source, /model\.|completion|embedding|retrieval/i);
  assert.doesNotMatch(source, /routes?|controllers?|middlewares?|repositories?/i);
});
