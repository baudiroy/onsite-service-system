const test = require('node:test');
const assert = require('node:assert/strict');

const {
  CUSTOMER_FACING_FORBIDDEN_FIELD_NAME_PATTERNS,
  isCustomerFacingForbiddenFieldName
} = require('../../../../src/utils/customerFacingForbiddenFields');

test('exports frozen forbidden field patterns and pure helper', () => {
  assert.equal(Array.isArray(CUSTOMER_FACING_FORBIDDEN_FIELD_NAME_PATTERNS), true);
  assert.equal(Object.isFrozen(CUSTOMER_FACING_FORBIDDEN_FIELD_NAME_PATTERNS), true);
  assert.equal(CUSTOMER_FACING_FORBIDDEN_FIELD_NAME_PATTERNS.length > 0, true);
  assert.equal(typeof isCustomerFacingForbiddenFieldName, 'function');
});

test('detects token provider channel and raw payload field names as forbidden', () => {
  [
    'rawToken',
    'tokenHash',
    'rawLineId',
    'line_user_id',
    'rawProviderPayload',
    'provider_payload',
    'rawPayload'
  ].forEach((fieldName) => {
    assert.equal(isCustomerFacingForbiddenFieldName(fieldName), true);
  });
});

test('detects internal ids personal contact and audit field names as forbidden', () => {
  [
    'organizationId',
    'customerId',
    'caseId',
    'appointmentId',
    'reportId',
    'fullPhone',
    'fullMobile',
    'fullAddress',
    'auditReason',
    'auditLog',
    'internalDenialReason',
    'internalNotes'
  ].forEach((fieldName) => {
    assert.equal(isCustomerFacingForbiddenFieldName(fieldName), true);
  });
});

test('detects AI billing settlement inventory and staff-internal field names as forbidden', () => {
  [
    'aiRawPayload',
    'billingSettlementRules',
    'inventoryInternals',
    'engineerInternalComments',
    'supervisorNotes',
    'debugMetadata',
    'metadata',
    'rawSource',
    'source'
  ].forEach((fieldName) => {
    assert.equal(isCustomerFacingForbiddenFieldName(fieldName), true);
  });
});

test('allows customer-safe display field names', () => {
  [
    'serviceDisplayTitle',
    'customerCaseReference',
    'appointmentStatusDisplay',
    'supportContactHint',
    'customerSafeSummary',
    'visitOutcomeSummary',
    'warrantyOrFollowUpHint'
  ].forEach((fieldName) => {
    assert.equal(isCustomerFacingForbiddenFieldName(fieldName), false);
  });
});

test('handles malformed field names without throwing', () => {
  [
    null,
    undefined,
    '',
    42,
    false,
    {},
    []
  ].forEach((fieldName) => {
    assert.doesNotThrow(() => isCustomerFacingForbiddenFieldName(fieldName));
  });
});

test('malformed names do not imply a safe echo policy', () => {
  assert.equal(isCustomerFacingForbiddenFieldName(null), false);
  assert.equal(isCustomerFacingForbiddenFieldName(undefined), false);
  assert.equal(isCustomerFacingForbiddenFieldName(''), false);

  // The helper classifies field names only. Callers must still use allow-listing
  // and must not echo arbitrary unknown values just because a malformed key is
  // not classified as a known forbidden field name.
  assert.equal(isCustomerFacingForbiddenFieldName('unknownCustomerSafeCandidate'), false);
});
