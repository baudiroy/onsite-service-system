'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DATA_CLASSIFICATIONS,
} = require('../../src/security/dataClassificationPolicy');
const {
  AI_RETRIEVAL_DECISIONS,
  AI_RETRIEVAL_PURPOSES,
  AI_RETRIEVAL_REASON_KEYS,
  AI_RETRIEVAL_ROLES,
  evaluateAiRetrievalGuard,
} = require('../../src/security/aiRetrievalGuardPolicy');

function retrieval(overrides = {}) {
  return evaluateAiRetrievalGuard({
    organizationId: 'org_ai_retrieval',
    role: AI_RETRIEVAL_ROLES.DISPATCHER,
    purpose: AI_RETRIEVAL_PURPOSES.DISPATCHER_AI,
    fieldKey: 'case_status',
    permissionContext: {
      aiRetrievalAllowed: true,
    },
    ...overrides,
  });
}

function assertDenied(result, reasonKey) {
  assert.equal(result.allowed, false);
  assert.equal(result.decision, AI_RETRIEVAL_DECISIONS.DENY);
  assert.equal(result.reasonKey, reasonKey);
}

test('unknown role, purpose, missing scope, cross scope, and missing permission context fail closed', () => {
  assertDenied(retrieval({ role: 'unknown_role' }), AI_RETRIEVAL_REASON_KEYS.UNKNOWN_ROLE);
  assertDenied(retrieval({ purpose: 'unknown_purpose' }), AI_RETRIEVAL_REASON_KEYS.UNKNOWN_PURPOSE);
  assertDenied(retrieval({ organizationId: undefined }), AI_RETRIEVAL_REASON_KEYS.MISSING_SCOPE);
  assertDenied(
    retrieval({ organizationId: 'org_a', resourceOrganizationId: 'org_b' }),
    AI_RETRIEVAL_REASON_KEYS.CROSS_SCOPE,
  );
  assertDenied(
    retrieval({ permissionContext: undefined }),
    AI_RETRIEVAL_REASON_KEYS.MISSING_PERMISSION_CONTEXT,
  );
});

test('restricted and secret fields are denied for AI retrieval by default', () => {
  for (const fieldKey of [
    'raw_line_user_id',
    'customer_full_phone',
    'full_address',
    'audit_raw_payload',
    'ai_raw_payload',
    'internal_note',
    'billing_internal_data',
    'settlement_internal_data',
    'line_access_token',
    'provider_secret',
    'database_url',
    'credential_json',
  ]) {
    assertDenied(
      retrieval({ fieldKey }),
      AI_RETRIEVAL_REASON_KEYS.RESTRICTED_OR_SECRET_DENIED,
    );
  }
});

test('customer-support AI can retrieve only public or customer-visible data', () => {
  assert.equal(
    retrieval({
      role: AI_RETRIEVAL_ROLES.CUSTOMER_SUPPORT_AI,
      purpose: AI_RETRIEVAL_PURPOSES.CUSTOMER_SUPPORT_AI,
      fieldKey: 'case_no',
    }).allowed,
    true,
  );
  assert.equal(
    retrieval({
      role: AI_RETRIEVAL_ROLES.CUSTOMER_SUPPORT_AI,
      purpose: AI_RETRIEVAL_PURPOSES.CUSTOMER_SUPPORT_AI,
      fieldKey: 'public_service_area',
    }).allowed,
    true,
  );

  for (const fieldKey of ['case_status', 'quote_amount']) {
    assertDenied(
      retrieval({
        role: AI_RETRIEVAL_ROLES.CUSTOMER_SUPPORT_AI,
        purpose: AI_RETRIEVAL_PURPOSES.CUSTOMER_SUPPORT_AI,
        fieldKey,
      }),
      AI_RETRIEVAL_REASON_KEYS.CUSTOMER_SUPPORT_DENIED,
    );
  }
});

test('engineer AI can retrieve only assigned task-visible data', () => {
  assert.equal(
    retrieval({
      role: AI_RETRIEVAL_ROLES.ENGINEER,
      purpose: AI_RETRIEVAL_PURPOSES.ENGINEER_AI,
      caseRelationship: 'assigned_engineer',
      fieldKey: 'appointment_window',
    }).allowed,
    true,
  );
  assertDenied(
    retrieval({
      role: AI_RETRIEVAL_ROLES.ENGINEER,
      purpose: AI_RETRIEVAL_PURPOSES.ENGINEER_AI,
      caseRelationship: 'unassigned',
      fieldKey: 'appointment_window',
    }),
    AI_RETRIEVAL_REASON_KEYS.ENGINEER_DENIED,
  );
  assertDenied(
    retrieval({
      role: AI_RETRIEVAL_ROLES.ENGINEER,
      purpose: AI_RETRIEVAL_PURPOSES.ENGINEER_AI,
      caseRelationship: 'assigned_engineer',
      fieldKey: 'case_status',
    }),
    AI_RETRIEVAL_REASON_KEYS.ENGINEER_DENIED,
  );
});

test('dispatcher and auditor AI can retrieve non-restricted scoped data', () => {
  assert.equal(retrieval({ fieldKey: 'case_status' }).allowed, true);
  assert.equal(retrieval({ fieldKey: 'quote_amount' }).allowed, true);

  assert.equal(
    retrieval({
      role: AI_RETRIEVAL_ROLES.AUDITOR,
      purpose: AI_RETRIEVAL_PURPOSES.AUDITOR_AI,
      fieldKey: 'quote_amount',
    }).allowed,
    true,
  );
});

test('chunk retrieval uses safe identifiers and classification without raw content', () => {
  const result = retrieval({
    role: AI_RETRIEVAL_ROLES.ENGINEER,
    purpose: AI_RETRIEVAL_PURPOSES.ENGINEER_AI,
    caseRelationship: 'assigned_engineer',
    fieldKey: undefined,
    classification: DATA_CLASSIFICATIONS.INTERNAL,
    taskVisible: true,
    documentId: 'DOC-123',
    chunkId: 'CHUNK-456',
    rawContent: 'raw customer content should not leak',
    prompt: 'prompt should not leak',
    embedding: [0.1, 0.2],
    token: 'secret-token-value',
  });
  const serialized = JSON.stringify(result);

  assert.equal(result.allowed, true);
  assert.equal(result.documentId, 'd_o_c-123');
  assert.equal(result.chunkId, 'c_h_u_n_k-456');
  assert.equal(serialized.includes('raw customer content should not leak'), false);
  assert.equal(serialized.includes('prompt should not leak'), false);
  assert.equal(serialized.includes('secret-token-value'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result, 'rawContent'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result, 'prompt'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result, 'embedding'), false);
});

test('audit intent is safe summary metadata only', () => {
  const result = retrieval({ fieldKey: 'case_status' });

  assert.deepEqual(Object.keys(result.auditIntent).sort(), ['eventType', 'required', 'safeSummary']);
  assert.deepEqual(Object.keys(result.auditIntent.safeSummary).sort(), [
    'allowed',
    'classification',
    'purpose',
  ]);
});
