'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createCustomerAccessReadOnlyRepository,
} = require('../../src/customerAccess/customerAccessReadOnlyRepository');

const repoRoot = path.resolve(__dirname, '../..');

function allowReadModel(overrides) {
  const config = overrides || {};

  return {
    organizationScope: config.organizationScope || {
      matched: true,
      organizationId: 'org_read_001',
    },
    customerIdentity: config.customerIdentity || {
      verified: true,
      customerId: 'customer_read_001',
    },
    caseLinkage: config.caseLinkage || {
      linked: true,
      caseId: 'case_read_001',
    },
    publication: config.publication || {
      allowed: true,
      customerVisiblePolicyPassed: true,
    },
    customerVisibleProjection: config.customerVisibleProjection || {
      available: true,
      data: {
        serviceReport: {
          publicReportId: 'report_public_read_001',
          status: 'available',
          finalAppointmentId: 'appt_final_read_001',
        },
      },
    },
  };
}

function riskyInput() {
  return {
    rawPhone: '0912-345-678',
    rawAddress: '台北市信義區測試路1號',
    lineUserId: 'line_user_should_not_leak',
  };
}

function assertNoLeak(output) {
  const serialized = JSON.stringify(output);

  for (const value of [
    '0912-345-678',
    '台北市信義區測試路1號',
    'line_user_should_not_leak',
    'must_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
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

test('exports createCustomerAccessReadOnlyRepository', () => {
  assert.equal(typeof createCustomerAccessReadOnlyRepository, 'function');
});

test('missing readModel makes all methods fail closed', () => {
  const repository = createCustomerAccessReadOnlyRepository();

  assert.deepEqual(repository.getOrganizationScope(riskyInput()), {
    available: false,
    matched: false,
    organizationId: null,
  });
  assert.deepEqual(repository.getVerifiedCustomerIdentity(riskyInput()), {
    available: false,
    verified: false,
    customerId: null,
  });
  assert.deepEqual(repository.getCaseLinkage(riskyInput()), {
    available: false,
    linked: false,
    caseId: null,
  });
  assert.deepEqual(repository.getPublicationState(riskyInput()), {
    available: false,
    allowed: false,
    customerVisiblePolicyPassed: false,
  });
  assert.deepEqual(repository.getCustomerVisibleProjection(riskyInput()), {
    available: false,
    data: {},
  });
});

test('all-allow readModel returns allow pieces', () => {
  const repository = createCustomerAccessReadOnlyRepository({
    readModel: allowReadModel(),
  });

  assert.deepEqual(repository.getOrganizationScope(riskyInput()), {
    available: true,
    matched: true,
    organizationId: 'org_read_001',
  });
  assert.deepEqual(repository.getVerifiedCustomerIdentity(riskyInput()), {
    available: true,
    verified: true,
    customerId: 'customer_read_001',
  });
  assert.deepEqual(repository.getCaseLinkage(riskyInput()), {
    available: true,
    linked: true,
    caseId: 'case_read_001',
  });
  assert.deepEqual(repository.getPublicationState(riskyInput()), {
    available: true,
    allowed: true,
    customerVisiblePolicyPassed: false,
  });
  assert.deepEqual(repository.getCustomerVisibleProjection(riskyInput()), {
    available: true,
    data: {
      serviceReport: {
        publicReportId: 'report_public_read_001',
        status: 'available',
        finalAppointmentId: 'appt_final_read_001',
      },
    },
  });
});

test('organization unmatched returns unmatched result', () => {
  const repository = createCustomerAccessReadOnlyRepository({
    readModel: allowReadModel({
      organizationScope: {
        matched: false,
        organizationId: 'org_read_001',
      },
    }),
  });

  assert.deepEqual(repository.getOrganizationScope(riskyInput()), {
    available: false,
    matched: false,
    organizationId: null,
  });
});

test('identity unverified returns unverified result and raw identifiers do not verify', () => {
  const repository = createCustomerAccessReadOnlyRepository({
    readModel: allowReadModel({
      customerIdentity: {
        verified: false,
        customerId: 'customer_read_001',
        rawPhone: '0912-345-678',
        rawAddress: '台北市信義區測試路1號',
        lineUserId: 'line_user_should_not_leak',
      },
    }),
  });
  const output = repository.getVerifiedCustomerIdentity(riskyInput());

  assert.deepEqual(output, {
    available: false,
    verified: false,
    customerId: null,
  });
  assertNoLeak(output);
});

test('case not linked returns not linked', () => {
  const repository = createCustomerAccessReadOnlyRepository({
    readModel: allowReadModel({
      caseLinkage: {
        linked: false,
        caseId: 'case_read_001',
      },
    }),
  });

  assert.deepEqual(repository.getCaseLinkage(riskyInput()), {
    available: false,
    linked: false,
    caseId: null,
  });
});

test('publication not allowed returns not allowed', () => {
  const repository = createCustomerAccessReadOnlyRepository({
    readModel: allowReadModel({
      publication: {
        allowed: false,
      },
    }),
  });

  assert.deepEqual(repository.getPublicationState(riskyInput()), {
    available: false,
    allowed: false,
    customerVisiblePolicyPassed: false,
  });
});

test('projection unavailable returns unavailable empty data', () => {
  const repository = createCustomerAccessReadOnlyRepository({
    readModel: allowReadModel({
      customerVisibleProjection: {
        available: false,
        data: {
          serviceReport: {
            publicReportId: 'report_public_read_001',
          },
        },
      },
    }),
  });

  assert.deepEqual(repository.getCustomerVisibleProjection(riskyInput()), {
    available: false,
    data: {},
  });
});

test('forbidden and internal fields are stripped from projection', () => {
  const repository = createCustomerAccessReadOnlyRepository({
    readModel: allowReadModel({
      customerVisibleProjection: {
        available: true,
        data: {
          serviceReport: {
            publicReportId: 'report_public_read_001',
            status: 'available',
            finalAppointmentId: 'appt_final_read_001',
            internalNote: 'must_not_leak',
            auditLog: 'must_not_leak',
            aiRawPayload: 'must_not_leak',
            internalBillingData: 'must_not_leak',
            internalSettlementData: 'must_not_leak',
            rawPhone: '0912-345-678',
            rawAddress: '台北市信義區測試路1號',
            rawLineId: 'line_user_should_not_leak',
            token: 'token_should_not_leak',
            secret: 'secret_should_not_leak',
          },
        },
      },
    }),
  });
  const output = repository.getCustomerVisibleProjection(riskyInput());

  assert.deepEqual(output, {
    available: true,
    data: {
      serviceReport: {
        publicReportId: 'report_public_read_001',
        status: 'available',
        finalAppointmentId: 'appt_final_read_001',
      },
    },
  });
  assertNoLeak(output);
});

test('readModel method throw or malformed result fails closed', () => {
  const repository = createCustomerAccessReadOnlyRepository({
    dataProvider: {
      organizationScope() {
        throw new Error('must_not_leak');
      },
      customerIdentity: 'bad',
      caseLinkage: null,
      publication: {},
      customerVisibleProjection: {
        available: true,
        data: 'bad',
      },
    },
  });

  assert.deepEqual(repository.getOrganizationScope(riskyInput()), {
    available: false,
    matched: false,
    organizationId: null,
  });
  assert.deepEqual(repository.getVerifiedCustomerIdentity(riskyInput()), {
    available: false,
    verified: false,
    customerId: null,
  });
  assert.deepEqual(repository.getCaseLinkage(riskyInput()), {
    available: false,
    linked: false,
    caseId: null,
  });
  assert.deepEqual(repository.getPublicationState(riskyInput()), {
    available: false,
    allowed: false,
    customerVisiblePolicyPassed: false,
  });
  assert.deepEqual(repository.getCustomerVisibleProjection(riskyInput()), {
    available: false,
    data: {},
  });
});

test('input, readModel, and finalAppointmentId are not mutated', () => {
  const input = riskyInput();
  const readModel = allowReadModel();
  const originalInput = JSON.parse(JSON.stringify(input));
  const originalReadModel = JSON.parse(JSON.stringify(readModel));
  const repository = createCustomerAccessReadOnlyRepository({ readModel });

  const output = repository.getCustomerVisibleProjection(input);

  assert.deepEqual(input, originalInput);
  assert.deepEqual(readModel, originalReadModel);
  assert.equal(output.data.serviceReport.finalAppointmentId, 'appt_final_read_001');
});

test('repository module imports only the DB read model mapper and no DB runtime, transaction, provider, AI, or route imports', () => {
  const source = fs.readFileSync(
    path.join(repoRoot, 'src/customerAccess/customerAccessReadOnlyRepository.js'),
    'utf8',
  );

  assert.deepEqual(requireSpecifiers(source), [
    './customerAccessDbReadModelMapper',
  ]);
});
