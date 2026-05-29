'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  RepairIntakeDraftRepositoryContractError,
  createRepairIntakeDraftRepositoryContract,
} = require('../../src/repairIntake/repairIntakeDraftRepositoryContract');

const UNSAFE_ERROR_MESSAGE = [
  'SQL select * from unsafe_contract_table',
  'DATABASE_URL=postgres://unsafe-contract',
  'phone +886900001072',
  'address unsafe contract address',
  'customerName unsafe contract customer',
  'lineUserId unsafe_contract_line',
  'lineAccessToken unsafe_contract_line_token',
  'finalAppointmentId unsafe_contract_final',
  'stack trace at unsafe contract',
].join(' ');

function unsafeLookup() {
  return {
    draftId: 'draft_task1072',
    organizationId: 'org_task1072',
    tenantId: 'tenant_task1072',
    requestId: 'req_task1072',
    actorId: 'actor_task1072',
    status: 'ready',
    source: 'repair_intake',
    sourceRef: 'source_task1072',
    intakeSource: 'manual',
    summary: {
      title: 'safe lookup summary',
      phone: '+886900001072',
    },
    metadata: {
      safeKey: 'safe lookup metadata',
      headers: {
        authorization: 'Bearer unsafe',
      },
    },
    warnings: ['safe lookup warning'],
    raw: { phone: '+886900001072' },
    rawRow: { address: 'unsafe raw row address' },
    rawRows: [{ customerPhone: '+886900001072' }],
    sql: 'select * from unsafe_lookup',
    query: 'select unsafe query',
    paramsSql: ['unsafe param'],
    db: 'unsafe db',
    databaseUrl: 'postgres://unsafe-contract',
    DATABASE_URL: 'postgres://unsafe-contract-uppercase',
    authorization: 'Bearer unsafe',
    cookie: 'unsafe cookie',
    headers: { authorization: 'Bearer unsafe' },
    phone: '+886900001072',
    address: 'unsafe contract address',
    customerPhone: '+886900001072',
    customerName: 'unsafe contract customer',
    lineUserId: 'unsafe_contract_line',
    lineAccessToken: 'unsafe_contract_line_token',
    finalAppointmentId: 'unsafe_contract_final',
    stack: 'unsafe contract stack',
    error: new Error(UNSAFE_ERROR_MESSAGE),
    repository: { unsafe: true },
    connection: { unsafe: true },
  };
}

function createRepository(calls, options = {}) {
  return {
    findDraftForConversion: async (lookup) => {
      calls.push(lookup);

      if (options.throwRead) {
        throw new Error(UNSAFE_ERROR_MESSAGE);
      }

      if (options.rejectRead) {
        return Promise.reject(new Error(UNSAFE_ERROR_MESSAGE));
      }

      if (options.notFound) {
        return null;
      }

      if (options.nonObject) {
        return 'not-object';
      }

      return {
        draftId: 'draft_task1072_result',
        organizationId: 'org_task1072_result',
        tenantId: 'tenant_task1072_result',
        requestId: 'req_task1072_result',
        actorId: 'actor_task1072_result',
        status: 'ready',
        source: 'repair_intake',
        sourceRef: 'source_task1072_result',
        intakeSource: 'manual',
        summary: {
          title: 'safe draft summary',
          phone: '+886900001072',
        },
        metadata: {
          safeKey: 'safe result metadata',
          rawRow: {
            phone: '+886900001072',
          },
        },
        warnings: ['safe warning', '', 42],
        raw: { phone: '+886900001072' },
        rawRows: [{ customerPhone: '+886900001072' }],
        sql: 'select * from unsafe_result',
        query: 'select unsafe query',
        paramsSql: ['unsafe param'],
        db: 'unsafe db',
        databaseUrl: 'postgres://unsafe-contract',
        DATABASE_URL: 'postgres://unsafe-contract-uppercase',
        authorization: 'Bearer unsafe',
        cookie: 'unsafe cookie',
        headers: { authorization: 'Bearer unsafe' },
        phone: '+886900001072',
        address: 'unsafe contract address',
        customerPhone: '+886900001072',
        customerName: 'unsafe contract customer',
        lineUserId: 'unsafe_contract_line',
        lineAccessToken: 'unsafe_contract_line_token',
        finalAppointmentId: 'unsafe_contract_final',
        stack: 'unsafe contract stack',
        error: new Error(UNSAFE_ERROR_MESSAGE),
        repository: { unsafe: true },
        connection: { unsafe: true },
      };
    },
  };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'select *',
    'unsafe_contract_table',
    'unsafe_lookup',
    'unsafe_result',
    'unsafe query',
    'unsafe param',
    'DATABASE_URL',
    'databaseUrl',
    'postgres://',
    '+886900001072',
    'unsafe contract address',
    'unsafe contract customer',
    'unsafe_contract_line',
    'unsafe_contract_line_token',
    'unsafe_contract_final',
    'unsafe contract stack',
    'stack trace',
    'Bearer unsafe',
    'unsafe cookie',
    'unsafe raw row address',
    'rawRows',
    'rawRow',
    'raw',
    'sql',
    'query',
    'paramsSql',
    'db',
    'authorization',
    'cookie',
    'headers',
    'phone',
    'address',
    'customerPhone',
    'customerName',
    'lineUserId',
    'lineAccessToken',
    'finalAppointmentId',
    'stack',
    'error',
    'repository',
    'connection',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('factory requires injected findDraftForConversion dependency', () => {
  for (const options of [
    undefined,
    null,
    {},
    { draftRepository: null },
    { draftRepository: {} },
    { repository: { findDraftForConversion: 'not-a-function' } },
    { findDraftForConversion: 'not-a-function' },
  ]) {
    assert.throws(
      () => createRepairIntakeDraftRepositoryContract(options),
      (error) => {
        assert.equal(error instanceof RepairIntakeDraftRepositoryContractError, true);
        assert.equal(error.reasonCode, 'REPAIR_INTAKE_DRAFT_REPOSITORY_CONTRACT_REQUIRED');
        assert.deepEqual(error.requiredActions, ['configure_find_draft_for_conversion']);
        assertNoUnsafeText(error);
        return true;
      },
    );
  }
});

test('findDraftForConversion forwards only sanitized lookup fields', async () => {
  const calls = [];
  const contract = createRepairIntakeDraftRepositoryContract({
    draftRepository: createRepository(calls),
  });

  const result = await contract.findDraftForConversion(unsafeLookup());

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    draftId: 'draft_task1072',
    organizationId: 'org_task1072',
    tenantId: 'tenant_task1072',
    requestId: 'req_task1072',
    actorId: 'actor_task1072',
    status: 'ready',
    source: 'repair_intake',
    sourceRef: 'source_task1072',
    intakeSource: 'manual',
    summary: {
      title: 'safe lookup summary',
    },
    metadata: {
      safeKey: 'safe lookup metadata',
    },
    warnings: ['safe lookup warning'],
  });
  assert.equal(result.ok, true);
  assert.equal(result.draftId, 'draft_task1072_result');
  assert.equal(result.organizationId, 'org_task1072_result');
  assert.equal(result.tenantId, 'tenant_task1072_result');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_REPOSITORY_CONTRACT_DRAFT_READY');
  assert.deepEqual(result.warnings, ['safe warning']);
  assert.deepEqual(result.summary, { title: 'safe draft summary' });
  assert.deepEqual(result.metadata, { safeKey: 'safe result metadata' });
  assertNoUnsafeText(calls);
  assertNoUnsafeText(result);
});

test('factory accepts the repository-like object directly', async () => {
  const calls = [];
  const contract = createRepairIntakeDraftRepositoryContract(createRepository(calls));

  const result = await contract.findDraftForConversion({ draftId: 'draft_direct' });

  assert.deepEqual(calls, [{ draftId: 'draft_direct' }]);
  assert.equal(result.ok, true);
  assertNoUnsafeText(result);
});

test('contract preserves safe draft-boundary fields and strips confirmed duplicate markers', async () => {
  const contract = createRepairIntakeDraftRepositoryContract({
    draftRepository: {
      findDraftForConversion: async () => ({
        draftId: 'draft_task1888',
        organizationId: 'org_task1888',
        tenantId: 'tenant_task1888',
        status: 'ready_for_conversion',
        source: 'repair_intake',
        sourceRef: 'source_task1888',
        intakeSource: 'manual',
        brandId: 'brand_task1888',
        serviceProviderId: 'provider_task1888',
        duplicateStatus: 'possible_duplicate',
        duplicateCandidate: {
          candidateId: 'dup_candidate_task1888',
          candidateRef: 'dup_ref_task1888',
          status: 'candidate',
          confirmedDuplicate: true,
          caseId: 'case_should_not_escape',
          phone: '+886900001072',
        },
        reporterRef: { id: 'reporter_ref_task1888', role: 'reporter', phone: '+886900001072' },
        customerRef: { id: 'customer_ref_task1888', role: 'customer', address: 'unsafe contract address' },
        billingContactRef: { id: 'billing_ref_task1888', role: 'billing', token: 'unsafe token' },
        onSiteContactOverrideRef: { id: 'site_ref_task1888', role: 'onsite', lineUserId: 'unsafe_contract_line' },
        contactRoleSeparation: 'reviewed',
        platformAccepted: true,
        importAccepted: true,
        caseId: 'case_should_not_escape',
        finalAppointmentId: 'unsafe_contract_final',
      }),
    },
  });

  const result = await contract.findDraftForConversion({ draftId: 'draft_task1888' });

  assert.equal(result.ok, true);
  assert.equal(result.brandId, 'brand_task1888');
  assert.equal(result.serviceProviderId, 'provider_task1888');
  assert.equal(result.duplicateStatus, 'possible_duplicate');
  assert.deepEqual(result.duplicateCandidate, {
    candidateId: 'dup_candidate_task1888',
    candidateRef: 'dup_ref_task1888',
    status: 'candidate',
  });
  assert.deepEqual(result.reporterRef, { id: 'reporter_ref_task1888', role: 'reporter' });
  assert.deepEqual(result.customerRef, { id: 'customer_ref_task1888', role: 'customer' });
  assert.deepEqual(result.billingContactRef, { id: 'billing_ref_task1888', role: 'billing' });
  assert.deepEqual(result.onSiteContactOverrideRef, { id: 'site_ref_task1888', role: 'onsite' });
  assert.equal(result.contactRoleSeparation, 'reviewed');
  assert.equal(result.platformAccepted, true);
  assert.equal(result.importAccepted, true);
  assert.equal(JSON.stringify(result).includes('confirmedDuplicate'), false);
  assert.equal(JSON.stringify(result).includes('case_should_not_escape'), false);
  assertNoUnsafeText(result);
});

test('invalid lookup input fails closed before repository call', async () => {
  for (const invalidInput of [undefined, null, 'input', 42, true, [], () => {}, {}]) {
    const calls = [];
    const contract = createRepairIntakeDraftRepositoryContract({
      draftRepository: createRepository(calls),
    });

    const result = await contract.findDraftForConversion(invalidInput);

    assert.equal(result.ok, false);
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_REPOSITORY_CONTRACT_INPUT_INVALID');
    assert.deepEqual(calls, []);
    assertNoUnsafeText(result);
  }
});

test('null and non-object repository results return sanitized not-found envelopes', async () => {
  for (const options of [{ notFound: true }, { nonObject: true }]) {
    const calls = [];
    const contract = createRepairIntakeDraftRepositoryContract({
      repository: createRepository(calls, options),
    });

    const result = await contract.findDraftForConversion(unsafeLookup());

    assert.equal(calls.length, 1);
    assert.equal(result.ok, false);
    assert.equal(
      result.reasonCode,
      'REPAIR_INTAKE_DRAFT_REPOSITORY_CONTRACT_DRAFT_NOT_FOUND',
    );
    assert.deepEqual(result.requiredActions, ['verify_draft_exists']);
    assertNoUnsafeText(calls);
    assertNoUnsafeText(result);
  }
});

test('thrown and rejected repository errors return sanitized read failure envelopes', async () => {
  for (const options of [{ throwRead: true }, { rejectRead: true }]) {
    const calls = [];
    const contract = createRepairIntakeDraftRepositoryContract({
      draftRepository: createRepository(calls, options),
    });

    const result = await contract.findDraftForConversion(unsafeLookup());

    assert.equal(calls.length, 1);
    assert.equal(result.ok, false);
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_REPOSITORY_CONTRACT_READ_FAILED');
    assert.deepEqual(result.requiredActions, ['retry_or_manual_review']);
    assertNoUnsafeText(calls);
    assertNoUnsafeText(result);
  }
});
