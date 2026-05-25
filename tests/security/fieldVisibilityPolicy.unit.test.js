'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DATA_CLASSIFICATIONS,
} = require('../../src/security/dataClassificationPolicy');

const {
  FIELD_VISIBILITY_DECISIONS,
  FIELD_VISIBILITY_PURPOSES,
  FIELD_VISIBILITY_REASON_KEYS,
  FIELD_VISIBILITY_ROLES,
  evaluateFieldVisibility,
} = require('../../src/security/fieldVisibilityPolicy');

function visible(overrides = {}) {
  return evaluateFieldVisibility({
    organizationId: 'org_visibility_test',
    role: FIELD_VISIBILITY_ROLES.ADMIN,
    purpose: FIELD_VISIBILITY_PURPOSES.INTERNAL_VIEW,
    fieldKey: 'case_status',
    ...overrides,
  });
}

function assertDenied(result, reasonKey) {
  assert.equal(result.allowed, false);
  assert.equal(result.decision, FIELD_VISIBILITY_DECISIONS.DENY);
  assert.equal(result.reasonKey, reasonKey);
}

test('exports supported synthetic roles and purposes', () => {
  assert.deepEqual(Object.values(FIELD_VISIBILITY_ROLES), [
    'customer',
    'engineer',
    'dispatcher',
    'admin',
    'auditor',
    'brand',
    'serviceProvider',
    'subcontractor',
    'aiRetrieval',
  ]);
  assert.equal(FIELD_VISIBILITY_PURPOSES.CUSTOMER_VISIBLE, 'customer_visible');
  assert.equal(FIELD_VISIBILITY_PURPOSES.ENGINEER_TASK, 'engineer_task');
  assert.equal(FIELD_VISIBILITY_PURPOSES.INTERNAL_VIEW, 'internal_view');
  assert.equal(FIELD_VISIBILITY_PURPOSES.EXPORT, 'export');
  assert.equal(FIELD_VISIBILITY_PURPOSES.RAG_RETRIEVAL, 'rag_retrieval');
});

test('unknown role, unknown purpose, and missing organization scope fail closed', () => {
  assertDenied(visible({ role: 'unknown_role' }), FIELD_VISIBILITY_REASON_KEYS.UNKNOWN_ROLE);
  assertDenied(visible({ purpose: 'unknown_purpose' }), FIELD_VISIBILITY_REASON_KEYS.UNKNOWN_PURPOSE);
  assertDenied(
    visible({ organizationId: undefined, tenantId: undefined }),
    FIELD_VISIBILITY_REASON_KEYS.MISSING_SCOPE,
  );
});

test('cross organization scope fails closed', () => {
  assertDenied(
    visible({
      organizationId: 'org_a',
      resourceOrganizationId: 'org_b',
    }),
    FIELD_VISIBILITY_REASON_KEYS.CROSS_SCOPE,
  );
});

test('customer-visible purpose exposes only customer-visible or public fields to customer role', () => {
  assert.equal(
    visible({
      role: FIELD_VISIBILITY_ROLES.CUSTOMER,
      purpose: FIELD_VISIBILITY_PURPOSES.CUSTOMER_VISIBLE,
      fieldKey: 'case_no',
    }).allowed,
    true,
  );
  assert.equal(
    visible({
      role: FIELD_VISIBILITY_ROLES.CUSTOMER,
      purpose: FIELD_VISIBILITY_PURPOSES.CUSTOMER_VISIBLE,
      fieldKey: 'public_service_area',
    }).allowed,
    true,
  );

  for (const fieldKey of [
    'case_status',
    'quote_amount',
    'customer_full_phone',
    'internal_note',
    'audit_raw_payload',
    'ai_raw_payload',
    'line_access_token',
  ]) {
    assertDenied(
      visible({
        role: FIELD_VISIBILITY_ROLES.CUSTOMER,
        purpose: FIELD_VISIBILITY_PURPOSES.CUSTOMER_VISIBLE,
        fieldKey,
      }),
      FIELD_VISIBILITY_REASON_KEYS.CUSTOMER_VISIBLE_DENIED,
    );
  }
});

test('non-customer roles cannot use customer-visible purpose as a bypass', () => {
  assertDenied(
    visible({
      role: FIELD_VISIBILITY_ROLES.ADMIN,
      purpose: FIELD_VISIBILITY_PURPOSES.CUSTOMER_VISIBLE,
      fieldKey: 'case_no',
    }),
    FIELD_VISIBILITY_REASON_KEYS.CUSTOMER_VISIBLE_DENIED,
  );
});

test('engineer task-visible context allows bounded operational fields only', () => {
  for (const fieldKey of [
    'case_no',
    'appointment_window',
    'product_model',
    'product_type',
    'issue_summary',
    'service_attention_note',
  ]) {
    assert.equal(
      visible({
        role: FIELD_VISIBILITY_ROLES.ENGINEER,
        purpose: FIELD_VISIBILITY_PURPOSES.ENGINEER_TASK,
        fieldKey,
      }).allowed,
      true,
      fieldKey,
    );
  }

  for (const fieldKey of [
    'customer_full_phone',
    'full_address',
    'raw_line_user_id',
    'internal_note',
    'audit_raw_payload',
    'ai_raw_payload',
    'billing_internal_data',
    'settlement_internal_data',
    'line_access_token',
    'provider_secret',
  ]) {
    assertDenied(
      visible({
        role: FIELD_VISIBILITY_ROLES.ENGINEER,
        purpose: FIELD_VISIBILITY_PURPOSES.ENGINEER_TASK,
        fieldKey,
      }),
      FIELD_VISIBILITY_REASON_KEYS.ENGINEER_TASK_DENIED,
    );
  }
});

test('export purpose denies restricted and secret fields by default', () => {
  assert.equal(
    visible({
      role: FIELD_VISIBILITY_ROLES.ADMIN,
      purpose: FIELD_VISIBILITY_PURPOSES.EXPORT,
      fieldKey: 'case_status',
    }).allowed,
    true,
  );
  assert.equal(
    visible({
      role: FIELD_VISIBILITY_ROLES.ADMIN,
      purpose: FIELD_VISIBILITY_PURPOSES.EXPORT,
      fieldKey: 'quote_amount',
    }).allowed,
    true,
  );

  for (const fieldKey of [
    'line_user_id',
    'customer_full_phone',
    'internal_note',
    'audit_raw_payload',
    'ai_raw_payload',
    'billing_internal_data',
    'line_access_token',
  ]) {
    assertDenied(
      visible({
        role: FIELD_VISIBILITY_ROLES.ADMIN,
        purpose: FIELD_VISIBILITY_PURPOSES.EXPORT,
        fieldKey,
      }),
      FIELD_VISIBILITY_REASON_KEYS.EXPORT_DENIED,
    );
  }
});

test('RAG retrieval purpose denies restricted and secret fields by default', () => {
  assert.equal(
    visible({
      role: FIELD_VISIBILITY_ROLES.AI_RETRIEVAL,
      purpose: FIELD_VISIBILITY_PURPOSES.RAG_RETRIEVAL,
      fieldKey: 'case_status',
    }).allowed,
    true,
  );

  for (const fieldKey of [
    'line_user_id',
    'full_address',
    'internal_note',
    'audit_raw_payload',
    'ai_raw_payload',
    'settlement_internal_data',
    'line_access_token',
  ]) {
    assertDenied(
      visible({
        role: FIELD_VISIBILITY_ROLES.AI_RETRIEVAL,
        purpose: FIELD_VISIBILITY_PURPOSES.RAG_RETRIEVAL,
        fieldKey,
      }),
      FIELD_VISIBILITY_REASON_KEYS.RAG_DENIED,
    );
  }
});

test('internal view allows non-secret fields only for internal roles', () => {
  assert.equal(
    visible({
      role: FIELD_VISIBILITY_ROLES.ADMIN,
      purpose: FIELD_VISIBILITY_PURPOSES.INTERNAL_VIEW,
      fieldKey: 'case_status',
    }).allowed,
    true,
  );
  assert.equal(
    visible({
      role: FIELD_VISIBILITY_ROLES.AUDITOR,
      purpose: FIELD_VISIBILITY_PURPOSES.INTERNAL_VIEW,
      fieldKey: 'internal_note',
    }).classification,
    DATA_CLASSIFICATIONS.RESTRICTED,
  );
  assert.equal(
    visible({
      role: FIELD_VISIBILITY_ROLES.AUDITOR,
      purpose: FIELD_VISIBILITY_PURPOSES.INTERNAL_VIEW,
      fieldKey: 'internal_note',
    }).allowed,
    true,
  );
  assertDenied(
    visible({
      role: FIELD_VISIBILITY_ROLES.BRAND,
      purpose: FIELD_VISIBILITY_PURPOSES.INTERNAL_VIEW,
      fieldKey: 'case_status',
    }),
    FIELD_VISIBILITY_REASON_KEYS.INTERNAL_VIEW_DENIED,
  );
  assertDenied(
    visible({
      role: FIELD_VISIBILITY_ROLES.ADMIN,
      purpose: FIELD_VISIBILITY_PURPOSES.INTERNAL_VIEW,
      fieldKey: 'line_access_token',
    }),
    FIELD_VISIBILITY_REASON_KEYS.INTERNAL_VIEW_DENIED,
  );
});

test('decision envelope is safe and does not include field value or raw payload', () => {
  const result = visible({
    role: FIELD_VISIBILITY_ROLES.CUSTOMER,
    purpose: FIELD_VISIBILITY_PURPOSES.CUSTOMER_VISIBLE,
    fieldKey: 'line_access_token',
    fieldValue: 'sk-test-token-value',
    rawPayload: {
      token: 'another-secret-token',
    },
  });
  const serialized = JSON.stringify(result);

  assertDenied(result, FIELD_VISIBILITY_REASON_KEYS.CUSTOMER_VISIBLE_DENIED);
  assert.equal(serialized.includes('sk-test-token-value'), false);
  assert.equal(serialized.includes('another-secret-token'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result, 'fieldValue'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result, 'rawPayload'), false);
});
