'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createCustomerAccessReadOnlyRepository,
} = require('../../src/customerAccess/customerAccessReadOnlyRepository');

const repoRoot = path.resolve(__dirname, '../..');

function validRows(overrides) {
  const config = overrides || {};

  return {
    caseRow: config.caseRow || {
      id: 'case_query_001',
      organization_id: 'org_query_001',
      customer_id: 'customer_query_001',
    },
    customerIdentityRow: config.customerIdentityRow || {
      customer_id: 'customer_query_001',
      organization_id: 'org_query_001',
      verified: true,
      line_channel_id: 'line_channel_query_001',
      line_user_id: 'line_user_should_not_leak',
      raw_phone: 'raw_phone_should_not_leak',
    },
    publicationRow: config.publicationRow || {
      case_id: 'case_query_001',
      organization_id: 'org_query_001',
      publication_allowed: true,
      customer_visible_policy_passed: true,
    },
    serviceReportRow: config.serviceReportRow || {
      public_report_id: 'report_public_query_001',
      status: 'available',
      final_appointment_id: 'appt_should_not_be_in_output',
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

function validInput(overrides) {
  return {
    organizationId: 'org_query_001',
    caseId: 'case_query_001',
    customerId: 'customer_query_001',
    rawPhone: 'raw_phone_should_not_leak',
    rawAddress: 'raw_address_should_not_leak',
    rawLineUserId: 'line_user_should_not_leak',
    ...(overrides || {}),
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function queryRepository(rowsOrExecutor) {
  const queryExecutor = typeof rowsOrExecutor === 'function'
    ? rowsOrExecutor
    : () => rowsOrExecutor;

  return createCustomerAccessReadOnlyRepository({ queryExecutor });
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
    'internal_note_should_not_leak',
    'audit_log_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'billing_internal_data_should_not_leak',
    'settlement_internal_data_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'appt_should_not_be_in_output',
    'executor_error_should_not_leak',
  ]) {
    assert.equal(serialized.includes(value), false, `repository output leaked ${value}`);
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

test('repository accepts injected queryExecutor and maps valid rows to all-allow contract results', () => {
  const seenSpecs = [];
  const repository = queryRepository((querySpec) => {
    seenSpecs.push(querySpec);
    return validRows();
  });

  assert.deepEqual(collectContract(repository, validInput()), {
    organizationScope: {
      available: true,
      matched: true,
      organizationId: 'org_query_001',
    },
    customerIdentity: {
      available: true,
      verified: true,
      customerId: 'customer_query_001',
    },
    caseLinkage: {
      available: true,
      linked: true,
      caseId: 'case_query_001',
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
          publicReportId: 'report_public_query_001',
          status: 'available',
        },
      },
    },
  });
  assert.equal(seenSpecs.length, 5);
  assert.equal(seenSpecs.every((spec) => spec.executable === true), true);
});

test('query spec missing required params fail-closes and executor is not called', () => {
  let callCount = 0;
  const repository = queryRepository(() => {
    callCount += 1;
    return validRows();
  });

  const output = collectContract(repository, validInput({ customerId: '' }));

  assert.equal(callCount, 0);
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

test('executor throws fail-closed without raw error leak', () => {
  const repository = queryRepository(() => {
    throw new Error('executor_error_should_not_leak');
  });
  const output = collectContract(repository, validInput());

  assert.deepEqual(output.organizationScope, {
    available: false,
    matched: false,
    organizationId: null,
  });
  assertNoLeak(output);
});

test('executor malformed result fail-closes', () => {
  const output = collectContract(queryRepository(() => 'not rows'), validInput());

  assert.deepEqual(output.caseLinkage, {
    available: false,
    linked: false,
    caseId: null,
  });
  assert.deepEqual(output.customerVisibleProjection, {
    available: false,
    data: {},
  });
});

test('organization mismatch rows fail-close unmatched', () => {
  const output = collectContract(queryRepository(validRows({
    publicationRow: {
      case_id: 'case_query_001',
      organization_id: 'org_other_001',
      publication_allowed: true,
      customer_visible_policy_passed: true,
    },
  })), validInput());

  assert.deepEqual(output.organizationScope, {
    available: false,
    matched: false,
    organizationId: null,
  });
});

test('customer mismatch rows fail-close', () => {
  const output = collectContract(queryRepository(validRows({
    customerIdentityRow: {
      customer_id: 'customer_other_001',
      organization_id: 'org_query_001',
      verified: true,
    },
  })), validInput());

  assert.deepEqual(output.customerIdentity, {
    available: false,
    verified: false,
    customerId: null,
  });
});

test('identity unverified rows map identity verified false', () => {
  const output = collectContract(queryRepository(validRows({
    customerIdentityRow: {
      customer_id: 'customer_query_001',
      organization_id: 'org_query_001',
      verified: false,
      raw_phone: 'raw_phone_should_not_leak',
      line_user_id: 'line_user_should_not_leak',
    },
  })), validInput());

  assert.deepEqual(output.customerIdentity, {
    available: false,
    verified: false,
    customerId: null,
  });
  assertNoLeak(output);
});

test('case unlinked rows map linked false', () => {
  const output = collectContract(queryRepository(validRows({
    caseRow: {
      id: 'case_query_001',
      organization_id: 'org_query_001',
    },
  })), validInput());

  assert.deepEqual(output.caseLinkage, {
    available: false,
    linked: false,
    caseId: null,
  });
});

test('publication not allowed rows map allowed false', () => {
  const output = collectContract(queryRepository(validRows({
    publicationRow: {
      case_id: 'case_query_001',
      organization_id: 'org_query_001',
      publication_allowed: false,
      customer_visible_policy_passed: true,
    },
  })), validInput());

  assert.deepEqual(output.publication, {
    available: false,
    allowed: false,
    customerVisiblePolicyPassed: false,
  });
});

test('projection unavailable rows map projection unavailable', () => {
  const rows = validRows();
  delete rows.serviceReportRow;

  const output = collectContract(queryRepository(rows), validInput());

  assert.deepEqual(output.customerVisibleProjection, {
    available: false,
    data: {},
  });
});

test('forbidden/internal fields stripped and finalAppointmentId not included or modified', () => {
  const output = collectContract(queryRepository(validRows()), validInput());

  assert.deepEqual(output.customerVisibleProjection, {
    available: true,
    data: {
      serviceReport: {
        publicReportId: 'report_public_query_001',
        status: 'available',
      },
    },
  });
  assert.equal(JSON.stringify(output).includes('finalAppointmentId'), false);
  assertNoLeak(output);
});

test('input object and executor result object are not mutated', () => {
  const input = validInput();
  const rows = validRows();
  const beforeInput = clone(input);
  const beforeRows = clone(rows);

  collectContract(queryRepository(rows), input);

  assert.deepEqual(input, beforeInput);
  assert.deepEqual(rows, beforeRows);
});

test('readModel behavior remains available when no queryExecutor is provided', () => {
  const repository = createCustomerAccessReadOnlyRepository({
    readModel: {
      organizationScope: {
        matched: true,
        organizationId: 'org_read_001',
      },
      customerIdentity: {
        verified: true,
        customerId: 'customer_read_001',
      },
      caseLinkage: {
        linked: true,
        caseId: 'case_read_001',
      },
      publication: {
        allowed: true,
      },
      customerVisibleProjection: {
        available: true,
        data: {
          serviceReport: {
            publicReportId: 'report_public_read_001',
            status: 'available',
          },
        },
      },
    },
  });

  assert.deepEqual(repository.getOrganizationScope(validInput()), {
    available: true,
    matched: true,
    organizationId: 'org_read_001',
  });
});

test('module only imports the mapper and no DB, transaction, provider, or AI module', () => {
  const source = fs.readFileSync(
    path.join(repoRoot, 'src/customerAccess/customerAccessReadOnlyRepository.js'),
    'utf8',
  );

  assert.deepEqual(requireSpecifiers(source), ['./customerAccessDbReadModelMapper']);
  assert.doesNotMatch(source, /pg|pool|client\.query|transaction|begin|commit|rollback/i);
  assert.doesNotMatch(source, /sms|email|push|rag|vector/i);
  assert.doesNotMatch(source, /model\.|completion|embedding|retrieval/i);
});
