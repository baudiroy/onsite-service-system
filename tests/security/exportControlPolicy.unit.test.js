'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DATA_CLASSIFICATIONS,
} = require('../../src/security/dataClassificationPolicy');
const {
  FIELD_VISIBILITY_REASON_KEYS,
  FIELD_VISIBILITY_ROLES,
} = require('../../src/security/fieldVisibilityPolicy');
const {
  EXPORT_CONTROL_DECISIONS,
  EXPORT_CONTROL_PURPOSES,
  EXPORT_CONTROL_REASON_KEYS,
  evaluateExportControl,
} = require('../../src/security/exportControlPolicy');

function exportRequest(overrides = {}) {
  return evaluateExportControl({
    organizationId: 'org_export_policy',
    role: FIELD_VISIBILITY_ROLES.ADMIN,
    purpose: EXPORT_CONTROL_PURPOSES.EXPORT,
    fields: ['case_no', 'case_status', 'quote_amount'],
    ...overrides,
  });
}

function assertDenied(result, reasonKey) {
  assert.equal(result.allowed, false);
  assert.equal(result.decision, EXPORT_CONTROL_DECISIONS.DENY);
  assert.equal(result.reasonKey, reasonKey);
}

test('allows non-restricted export fields for authorized internal role', () => {
  const result = exportRequest();

  assert.equal(result.allowed, true);
  assert.equal(result.decision, EXPORT_CONTROL_DECISIONS.ALLOW);
  assert.equal(result.reasonKey, EXPORT_CONTROL_REASON_KEYS.ALLOWED);
  assert.equal(result.allowedFields.length, 3);
  assert.equal(result.deniedFields.length, 0);
  assert.equal(result.auditIntent.required, true);
  assert.equal(result.auditIntent.eventType, 'export_policy_evaluated');
  assert.equal(result.auditIntent.safeSummary.allowedFieldCount, 3);
});

test('missing scope, unknown role, unknown purpose, and cross-scope mismatch fail closed', () => {
  assertDenied(
    exportRequest({ organizationId: undefined }),
    FIELD_VISIBILITY_REASON_KEYS.MISSING_SCOPE,
  );
  assertDenied(
    exportRequest({ role: 'unknown_role' }),
    FIELD_VISIBILITY_REASON_KEYS.UNKNOWN_ROLE,
  );
  assertDenied(
    exportRequest({ purpose: 'unknown_purpose' }),
    EXPORT_CONTROL_REASON_KEYS.UNKNOWN_PURPOSE,
  );
  assertDenied(
    exportRequest({ organizationId: 'org_a', resourceOrganizationId: 'org_b' }),
    FIELD_VISIBILITY_REASON_KEYS.CROSS_SCOPE,
  );
});

test('empty field list fails closed', () => {
  const result = exportRequest({ fields: [] });

  assertDenied(result, EXPORT_CONTROL_REASON_KEYS.EMPTY_FIELDS);
  assert.deepEqual(result.deniedFields, [{
    fieldKey: 'fields',
    classification: DATA_CLASSIFICATIONS.INTERNAL,
    reasonKey: EXPORT_CONTROL_REASON_KEYS.EMPTY_FIELDS,
  }]);
});

test('restricted and secret fields are denied by default', () => {
  const result = exportRequest({
    fields: [
      'case_no',
      'customer_full_phone',
      'full_address',
      'internal_note',
      'audit_raw_payload',
      'ai_raw_payload',
      'billing_internal_data',
      'line_access_token',
      'database_url',
    ],
  });

  assert.equal(result.allowed, false);
  assert.deepEqual(result.allowedFields.map((field) => field.fieldKey), ['case_no']);
  assert.equal(result.deniedFields.length, 8);
  assert.equal(
    result.deniedFields.some((field) => field.reasonKey === EXPORT_CONTROL_REASON_KEYS.RESTRICTED_BY_DEFAULT),
    true,
  );
  assert.equal(
    result.deniedFields.some((field) => field.reasonKey === EXPORT_CONTROL_REASON_KEYS.SECRET_NEVER_EXPORTABLE),
    true,
  );
});

test('elevated restricted export can allow restricted fields for admin but never secret fields', () => {
  const result = exportRequest({
    elevatedRestrictedExport: true,
    fields: ['case_no', 'customer_full_phone', 'internal_note', 'line_access_token'],
  });

  assert.equal(result.allowed, false);
  assert.deepEqual(
    result.allowedFields.map((field) => field.fieldKey),
    ['case_no', 'customer_full_phone', 'internal_note'],
  );
  assert.deepEqual(result.deniedFields.map((field) => field.fieldKey), ['line_access_token']);
  assert.equal(result.deniedFields[0].reasonKey, EXPORT_CONTROL_REASON_KEYS.SECRET_NEVER_EXPORTABLE);
  assert.equal(result.auditIntent.safeSummary.elevatedRestrictedExport, true);
});

test('customer and engineer roles cannot export restricted or secret data', () => {
  for (const role of [FIELD_VISIBILITY_ROLES.CUSTOMER, FIELD_VISIBILITY_ROLES.ENGINEER]) {
    const result = exportRequest({
      role,
      elevatedRestrictedExport: true,
      fields: ['customer_full_phone', 'line_access_token'],
    });

    assert.equal(result.allowed, false);
    assert.deepEqual(
      result.deniedFields.map((field) => field.reasonKey),
      [
        EXPORT_CONTROL_REASON_KEYS.RESTRICTED_BY_DEFAULT,
        EXPORT_CONTROL_REASON_KEYS.SECRET_NEVER_EXPORTABLE,
      ],
    );
  }
});

test('brand export is still bounded by field visibility and classification', () => {
  const result = exportRequest({
    role: FIELD_VISIBILITY_ROLES.BRAND,
    fields: ['case_no', 'case_status', 'internal_note'],
  });

  assert.equal(result.allowed, false);
  assert.deepEqual(result.allowedFields.map((field) => field.fieldKey), ['case_no', 'case_status']);
  assert.deepEqual(result.deniedFields.map((field) => field.fieldKey), ['internal_note']);
});

test('field objects are summarized without leaking values or raw payloads', () => {
  const result = exportRequest({
    fields: [
      { fieldKey: 'case_no', value: 'CASE-SHOULD-NOT-LEAK' },
      { fieldKey: 'line_access_token', value: 'token-should-not-leak' },
    ],
    rawPayload: {
      database_url: 'postgres://should-not-leak',
    },
  });
  const serialized = JSON.stringify(result);

  assert.equal(serialized.includes('CASE-SHOULD-NOT-LEAK'), false);
  assert.equal(serialized.includes('token-should-not-leak'), false);
  assert.equal(serialized.includes('postgres://should-not-leak'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result, 'rawPayload'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result, 'fieldValues'), false);
});

test('audit intent is safe summary metadata only', () => {
  const result = exportRequest({
    fields: ['case_no', 'internal_note', 'line_access_token'],
  });

  assert.deepEqual(Object.keys(result.auditIntent).sort(), ['eventType', 'required', 'safeSummary']);
  assert.deepEqual(Object.keys(result.auditIntent.safeSummary).sort(), [
    'allowedFieldCount',
    'deniedFieldCount',
    'elevatedRestrictedExport',
  ]);
});
