'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  CUSTOMER_ACCESS_CONTEXT_REPOSITORY_METHODS,
  createCustomerAccessContextRepository,
} = require('../../src/customerAccess/customerAccessContextRepository');

const repoRoot = path.resolve(__dirname, '../..');

function repository() {
  return createCustomerAccessContextRepository();
}

function riskyInput() {
  return {
    organizationId: 'org_test_001',
    caseId: 'case_test_001',
    rawPhone: '0912-345-678',
    rawAddress: '台北市信義區測試路1號',
    lineUserId: 'line_user_test_001',
    customerVisibleData: {
      serviceReport: {
        finalAppointmentId: 'appt_final_test_001',
        internalNote: 'should-not-leak',
        auditLog: 'should-not-leak',
        aiRawPayload: 'should-not-leak',
        internalBillingData: 'should-not-leak',
      },
    },
  };
}

function assertNoLeak(output) {
  const serialized = JSON.stringify(output);

  for (const value of [
    '0912-345-678',
    '台北市信義區測試路1號',
    'line_user_test_001',
    'should-not-leak',
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

test('exports createCustomerAccessContextRepository', () => {
  assert.equal(typeof createCustomerAccessContextRepository, 'function');
});

test('repository exposes expected read-only contract methods', () => {
  const accessRepository = repository();

  assert.deepEqual(CUSTOMER_ACCESS_CONTEXT_REPOSITORY_METHODS, [
    'getOrganizationScope',
    'getVerifiedCustomerIdentity',
    'getCaseLinkage',
    'getPublicationState',
    'getCustomerVisibleProjection',
  ]);

  for (const methodName of CUSTOMER_ACCESS_CONTEXT_REPOSITORY_METHODS) {
    assert.equal(typeof accessRepository[methodName], 'function');
  }
});

test('default getOrganizationScope returns fail-closed unavailable result', () => {
  assert.deepEqual(repository().getOrganizationScope(riskyInput()), {
    available: false,
    organizationScopeMatched: false,
  });
});

test('default getVerifiedCustomerIdentity does not verify raw phone only', () => {
  const input = {
    rawPhone: '0912-345-678',
  };
  const output = repository().getVerifiedCustomerIdentity(input);

  assert.equal(output.customerIdentityVerified, false);
  assert.equal(output.customerId, null);
  assertNoLeak(output);
});

test('default getVerifiedCustomerIdentity does not verify raw address only', () => {
  const output = repository().getVerifiedCustomerIdentity({
    rawAddress: '台北市信義區測試路1號',
  });

  assert.equal(output.customerIdentityVerified, false);
  assert.equal(output.customerId, null);
  assertNoLeak(output);
});

test('default getVerifiedCustomerIdentity does not verify LINE id alone', () => {
  const output = repository().getVerifiedCustomerIdentity({
    lineUserId: 'line_user_test_001',
  });

  assert.equal(output.customerIdentityVerified, false);
  assert.equal(output.customerId, null);
  assertNoLeak(output);
});

test('default getCaseLinkage returns not linked', () => {
  assert.deepEqual(repository().getCaseLinkage(riskyInput()), {
    available: false,
    caseLinkedToCustomer: false,
  });
});

test('default getPublicationState returns not allowed', () => {
  assert.deepEqual(repository().getPublicationState(riskyInput()), {
    available: false,
    publicationAllowed: false,
    customerVisiblePolicyPassed: false,
  });
});

test('default getCustomerVisibleProjection returns empty unavailable projection', () => {
  assert.deepEqual(repository().getCustomerVisibleProjection(riskyInput()), {
    available: false,
    customerVisibleData: {},
  });
});

test('outputs do not expose raw identifiers or internal fields', () => {
  const accessRepository = repository();

  for (const methodName of CUSTOMER_ACCESS_CONTEXT_REPOSITORY_METHODS) {
    assertNoLeak(accessRepository[methodName](riskyInput()));
  }
});

test('input object is not mutated and finalAppointmentId is not modified', () => {
  const input = riskyInput();
  const original = JSON.parse(JSON.stringify(input));

  repository().getCustomerVisibleProjection(input);

  assert.deepEqual(input, original);
  assert.equal(input.customerVisibleData.serviceReport.finalAppointmentId, 'appt_final_test_001');
});

test('repository module has no DB, transaction, provider, AI, or route imports', () => {
  const source = fs.readFileSync(
    path.join(repoRoot, 'src/customerAccess/customerAccessContextRepository.js'),
    'utf8',
  );

  assert.deepEqual(requireSpecifiers(source), []);
});
