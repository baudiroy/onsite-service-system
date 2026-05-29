'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DEPOT_INTAKE_SQL_REPOSITORY_ADAPTER_KIND,
  createDepotIntakeSqlRepositoryAdapter,
} = require('../../src/repositories/DepotIntakeSqlRepositoryAdapter');

const DRAFT_ID = '11111111-1111-4111-8111-111111111111';
const ORG_ID = '22222222-2222-4222-8222-222222222222';
const TENANT_ID = '33333333-3333-4333-8333-333333333333';
const BRAND_ID = '44444444-4444-4444-8444-444444444444';
const SERVICE_PROVIDER_ID = '55555555-5555-4555-8555-555555555555';
const REQUEST_ID = 'req_task_1909';
const NOW = '2026-05-29T09:00:00.000Z';

function depotRow(overrides = {}) {
  return {
    id: DRAFT_ID,
    organization_id: ORG_ID,
    tenant_id: TENANT_ID,
    draft_status: 'ready_for_conversion',
    source: 'repair_intake',
    source_ref: 'depot_source_ref',
    intake_source: 'brand_api',
    validation_status: 'ready',
    safe_summary: {
      serviceType: 'depot',
      itemRef: 'item_ref_safe',
      productRef: 'product_ref_safe',
      modelRef: 'model_ref_safe',
      issueSummaryRef: 'issue_summary_ref_safe',
      customerPhone: 'unsafe phone should not leak',
      rawPayload: 'unsafe raw should not leak',
    },
    safe_metadata: {
      workflowType: 'depot',
      brandId: BRAND_ID,
      serviceProviderId: SERVICE_PROVIDER_ID,
      depotStatus: 'received',
      receivedAt: NOW,
      returnMethod: 'pickup',
      rawRow: {
        customerPhone: 'unsafe phone should not leak',
      },
      fieldServiceReport: 'unsafe FSR should not leak',
      finalAppointmentId: 'unsafe final appointment should not leak',
      providerPayload: 'unsafe provider payload should not leak',
    },
    validation_errors_safe: ['safe warning', '', 42],
    created_at: NOW,
    updated_at: NOW,
    raw_row: 'unsafe raw row should not leak',
    customer_phone: 'unsafe phone should not leak',
    address: 'unsafe address should not leak',
    finalAppointmentId: 'unsafe final appointment should not leak',
    ...overrides,
  };
}

function createSyntheticDbClient({ calls = [], queryImpl } = {}) {
  return {
    query(querySpec) {
      calls.push(querySpec);

      if (queryImpl) {
        return queryImpl(querySpec, calls.length);
      }

      return {
        rowCount: 1,
        rows: [depotRow()],
      };
    },
  };
}

function assertFailure(result, reasonCode) {
  assert.equal(result.ok, false);
  assert.equal(result.found, false);
  assert.equal(result.written, false);
  assert.equal(result.adapterKind, DEPOT_INTAKE_SQL_REPOSITORY_ADAPTER_KIND);
  assert.equal(result.reasonCode, reasonCode);
}

function assertNoUnsafeLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'unsafe phone should not leak',
    'unsafe address should not leak',
    'unsafe raw should not leak',
    'unsafe raw row should not leak',
    'unsafe provider payload should not leak',
    'unsafe final appointment should not leak',
    'unsafe FSR should not leak',
    'raw client failure should not leak',
    'database password should not leak',
    'postgres' + '://',
    'DATABASE_URL',
    'rows',
    'stack',
    'customer_phone',
    'raw_row',
    'providerPayload',
    'finalAppointmentId',
    'fieldServiceReport',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function assertParameterized(querySpec) {
  assert.equal(typeof querySpec.text, 'string');
  assert.equal(Array.isArray(querySpec.values), true);
  assert.equal(Object.isFrozen(querySpec.values), true);
  assert.equal(querySpec.text.includes('${'), false);

  for (const value of querySpec.values.filter(Boolean)) {
    assert.equal(querySpec.text.includes(String(value)), false, `query text includes raw value ${value}`);
  }
}

test('missing dbClient query or execute returns db_client_required', async () => {
  const missing = createDepotIntakeSqlRepositoryAdapter({});
  const malformed = createDepotIntakeSqlRepositoryAdapter({ dbClient: {} });

  assert.equal(missing.kind, DEPOT_INTAKE_SQL_REPOSITORY_ADAPTER_KIND);
  assertFailure(await missing.findDepotIntakeState({ draftId: DRAFT_ID, organizationId: ORG_ID }), 'db_client_required');
  assertFailure(await malformed.findDepotIntakeState({ draftId: DRAFT_ID, organizationId: ORG_ID }), 'db_client_required');
});

test('read by draft id uses organization-scoped parameterized query and sanitized envelope', async () => {
  const calls = [];
  const adapter = createDepotIntakeSqlRepositoryAdapter({
    dbClient: createSyntheticDbClient({ calls }),
  });

  const result = await adapter.findDepotIntakeState({
    draftId: DRAFT_ID,
    organizationId: ORG_ID,
    tenantId: TENANT_ID,
    brandId: BRAND_ID,
    serviceProviderId: SERVICE_PROVIDER_ID,
    requestId: REQUEST_ID,
  });

  assert.equal(result.ok, true);
  assert.equal(result.found, true);
  assert.equal(result.written, false);
  assert.equal(result.reasonCode, 'depot_intake_read_succeeded');
  assert.equal(result.requestId, REQUEST_ID);
  assert.deepEqual(result.depotIntake, {
    draftId: DRAFT_ID,
    organizationId: ORG_ID,
    tenantId: TENANT_ID,
    draftStatus: 'ready_for_conversion',
    source: 'repair_intake',
    sourceRef: 'depot_source_ref',
    intakeSource: 'brand_api',
    workflowType: 'depot',
    serviceType: 'depot',
    brandId: BRAND_ID,
    serviceProviderId: SERVICE_PROVIDER_ID,
    itemRef: 'item_ref_safe',
    productRef: 'product_ref_safe',
    modelRef: 'model_ref_safe',
    serialRef: null,
    issueSummaryRef: 'issue_summary_ref_safe',
    depotStatus: 'received',
    receivedAt: NOW,
    returnMethod: 'pickup',
    validationStatus: 'ready',
    warnings: ['safe warning'],
    createdAt: NOW,
    updatedAt: NOW,
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].name, 'depotWorkshopReadDepotIntakeByDraft');
  assert.match(calls[0].text, /^SELECT/);
  assert.match(calls[0].text, /FROM repair_intake_drafts/);
  assert.match(calls[0].text, /id = \$1::uuid/);
  assert.match(calls[0].text, /organization_id = \$2::uuid/);
  assert.match(calls[0].text, /\(\$3::uuid IS NULL OR tenant_id = \$3::uuid\)/);
  assert.deepEqual(calls[0].values, [DRAFT_ID, ORG_ID, TENANT_ID]);
  assertParameterized(calls[0]);
  assertNoUnsafeLeak(result);
});

test('null tenant remains parameterized without disabling organization isolation', async () => {
  const calls = [];
  const adapter = createDepotIntakeSqlRepositoryAdapter({
    dbClient: createSyntheticDbClient({
      calls,
      queryImpl() {
        return {
          rows: [depotRow({ tenant_id: null })],
        };
      },
    }),
  });

  const result = await adapter.findDepotIntakeState({
    draftId: DRAFT_ID,
    organizationId: ORG_ID,
  });

  assert.equal(result.ok, true);
  assert.deepEqual(calls[0].values, [DRAFT_ID, ORG_ID, null]);
  assert.match(calls[0].text, /organization_id = \$2::uuid/);
});

test('not found, non-depot workflow, and external scope mismatch return safe deny', async () => {
  const noRows = createDepotIntakeSqlRepositoryAdapter({
    dbClient: createSyntheticDbClient({
      queryImpl() {
        return { rows: [] };
      },
    }),
  });
  const onsite = createDepotIntakeSqlRepositoryAdapter({
    dbClient: createSyntheticDbClient({
      queryImpl() {
        return { rows: [depotRow({ safe_metadata: { workflowType: 'onsite' } })] };
      },
    }),
  });
  const scopeMismatch = createDepotIntakeSqlRepositoryAdapter({
    dbClient: createSyntheticDbClient(),
  });

  assertFailure(await noRows.findDepotIntakeState({
    draftId: DRAFT_ID,
    organizationId: ORG_ID,
  }), 'depot_intake_not_found_or_denied');
  assertFailure(await onsite.findDepotIntakeState({
    draftId: DRAFT_ID,
    organizationId: ORG_ID,
  }), 'depot_intake_not_found_or_denied');
  assertFailure(await scopeMismatch.findDepotIntakeState({
    draftId: DRAFT_ID,
    organizationId: ORG_ID,
    brandId: 'different_brand',
  }), 'depot_intake_not_found_or_denied');
});

test('subcontractor scope fails closed until assignment relationship exists', async () => {
  const calls = [];
  const adapter = createDepotIntakeSqlRepositoryAdapter({
    dbClient: createSyntheticDbClient({ calls }),
  });

  const result = await adapter.findDepotIntakeState({
    draftId: DRAFT_ID,
    organizationId: ORG_ID,
    subcontractorId: 'subcontractor_unsafe_unscoped',
  });

  assertFailure(result, 'depot_intake_subcontractor_scope_not_supported');
  assert.equal(calls.length, 0);
});

test('client failures and invalid inputs are sanitized', async () => {
  const calls = [];
  const adapter = createDepotIntakeSqlRepositoryAdapter({
    dbClient: createSyntheticDbClient({
      calls,
      queryImpl() {
        throw new Error('raw client failure should not leak database password should not leak');
      },
    }),
  });

  assertFailure(await adapter.findDepotIntakeState({
    draftId: DRAFT_ID,
    organizationId: ORG_ID,
    requestId: REQUEST_ID,
  }), 'depot_intake_read_failed');
  assertFailure(await adapter.findDepotIntakeState({
    organizationId: ORG_ID,
  }), 'depot_intake_draft_id_required');
  assertFailure(await adapter.findDepotIntakeState({
    draftId: DRAFT_ID,
  }), 'organization_id_required');
  assert.equal(calls.length, 1);
  assertNoUnsafeLeak(await adapter.findDepotIntakeState({
    draftId: DRAFT_ID,
    organizationId: ORG_ID,
    requestId: REQUEST_ID,
  }));
});

test('write intent is explicitly not approved and does not query dbClient', async () => {
  const calls = [];
  const adapter = createDepotIntakeSqlRepositoryAdapter({
    dbClient: createSyntheticDbClient({ calls }),
  });

  const result = await adapter.recordDepotIntakeIntent({
    draftId: DRAFT_ID,
    organizationId: ORG_ID,
    depotStatus: 'received',
    requestId: REQUEST_ID,
  });

  assertFailure(result, 'depot_intake_write_scope_not_approved');
  assert.equal(result.requestId, REQUEST_ID);
  assert.equal(calls.length, 0);
});
