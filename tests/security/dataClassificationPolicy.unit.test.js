'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DATA_ACCESS_PURPOSES,
  DATA_CLASSIFICATIONS,
  DEFAULT_CLASSIFICATION,
  canExposeClassificationForPurpose,
  canExposeFieldForPurpose,
  classifyField,
  isAtLeastClassification,
  normalizeFieldKey,
} = require('../../src/security/dataClassificationPolicy');

test('exports stable classification levels and pure helpers', () => {
  assert.deepEqual(Object.values(DATA_CLASSIFICATIONS), [
    'public',
    'customer_visible',
    'internal',
    'confidential',
    'restricted',
    'secret',
  ]);
  assert.equal(DEFAULT_CLASSIFICATION, DATA_CLASSIFICATIONS.INTERNAL);
  assert.equal(typeof classifyField, 'function');
  assert.equal(typeof canExposeFieldForPurpose, 'function');
  assert.equal(typeof canExposeClassificationForPurpose, 'function');
  assert.equal(typeof isAtLeastClassification, 'function');
  assert.equal(Object.isFrozen(DATA_CLASSIFICATIONS), true);
});

test('normalizes field names without tenant or organization scope decisions', () => {
  assert.equal(normalizeFieldKey('customerPhoneNumber'), 'customer_phone_number');
  assert.equal(normalizeFieldKey('AI Raw Payload'), 'a_i_raw_payload');
  assert.equal(normalizeFieldKey(' organization_id '), 'organization_id');

  assert.equal('organizationId' in DATA_CLASSIFICATIONS, false);
  assert.equal('tenantId' in DATA_CLASSIFICATIONS, false);
});

test('unknown fields fail closed to internal by default', () => {
  assert.equal(classifyField('newFutureOperationalField'), DATA_CLASSIFICATIONS.INTERNAL);
  assert.equal(classifyField(''), DATA_CLASSIFICATIONS.INTERNAL);
  assert.equal(classifyField(null), DATA_CLASSIFICATIONS.INTERNAL);
});

test('classifies customer-facing and public safe fields narrowly', () => {
  assert.equal(classifyField('case_no'), DATA_CLASSIFICATIONS.CUSTOMER_VISIBLE);
  assert.equal(classifyField('appointmentWindow'), DATA_CLASSIFICATIONS.CUSTOMER_VISIBLE);
  assert.equal(classifyField('public_service_area'), DATA_CLASSIFICATIONS.PUBLIC);
});

test('classifies secret fields as secret', () => {
  const secretFields = [
    'token',
    'binding_token',
    'line_access_token',
    'line_channel_secret',
    'webhook_secret',
    'api_key',
    'credential_json',
    'password_hash',
    'database_url',
    'private_key',
  ];

  for (const fieldKey of secretFields) {
    assert.equal(classifyField(fieldKey), DATA_CLASSIFICATIONS.SECRET, fieldKey);
  }
});

test('classifies restricted sensitive operational fields as restricted', () => {
  const restrictedFields = [
    'raw_line_user_id',
    'line_user_id',
    'customer_full_phone',
    'customer_mobile',
    'customer_tel',
    'full_address',
    'service_address',
    'customer_signature',
    'unmasked_photo',
    'audit_raw_payload',
    'ai_raw_payload',
    'internal_note',
    'engineer_internal_comment',
    'billing_internal_data',
    'settlement_internal_data',
  ];

  for (const fieldKey of restrictedFields) {
    assert.equal(classifyField(fieldKey), DATA_CLASSIFICATIONS.RESTRICTED, fieldKey);
  }
});

test('classifies financial working fields as confidential unless explicitly internal-only', () => {
  assert.equal(classifyField('quote_amount'), DATA_CLASSIFICATIONS.CONFIDENTIAL);
  assert.equal(classifyField('invoice_price'), DATA_CLASSIFICATIONS.CONFIDENTIAL);
  assert.equal(classifyField('payment_status'), DATA_CLASSIFICATIONS.CONFIDENTIAL);
  assert.equal(classifyField('settlement_internal_amount'), DATA_CLASSIFICATIONS.RESTRICTED);
});

test('customer-visible purpose exposes only public or customer-visible fields', () => {
  assert.equal(canExposeFieldForPurpose('case_no', DATA_ACCESS_PURPOSES.CUSTOMER_VISIBLE), true);
  assert.equal(
    canExposeFieldForPurpose('public_service_area', DATA_ACCESS_PURPOSES.CUSTOMER_VISIBLE),
    true,
  );
  assert.equal(canExposeFieldForPurpose('case_status', DATA_ACCESS_PURPOSES.CUSTOMER_VISIBLE), false);
  assert.equal(
    canExposeFieldForPurpose('quote_amount', DATA_ACCESS_PURPOSES.CUSTOMER_VISIBLE),
    false,
  );
  assert.equal(
    canExposeFieldForPurpose('customer_full_phone', DATA_ACCESS_PURPOSES.CUSTOMER_VISIBLE),
    false,
  );
  assert.equal(
    canExposeFieldForPurpose('line_access_token', DATA_ACCESS_PURPOSES.CUSTOMER_VISIBLE),
    false,
  );
});

test('export and RAG retrieval deny restricted or secret fields by default', () => {
  for (const purpose of [
    DATA_ACCESS_PURPOSES.EXPORT,
    DATA_ACCESS_PURPOSES.RAG_RETRIEVAL,
  ]) {
    assert.equal(canExposeFieldForPurpose('case_status', purpose), true, purpose);
    assert.equal(canExposeFieldForPurpose('quote_amount', purpose), true, purpose);
    assert.equal(canExposeFieldForPurpose('internal_note', purpose), false, purpose);
    assert.equal(canExposeFieldForPurpose('audit_raw_payload', purpose), false, purpose);
    assert.equal(canExposeFieldForPurpose('ai_raw_payload', purpose), false, purpose);
    assert.equal(canExposeFieldForPurpose('line_user_id', purpose), false, purpose);
    assert.equal(canExposeFieldForPurpose('line_access_token', purpose), false, purpose);
  }
});

test('unknown access purpose fails closed', () => {
  assert.equal(canExposeClassificationForPurpose(DATA_CLASSIFICATIONS.PUBLIC, 'unknown'), false);
  assert.equal(canExposeFieldForPurpose('case_no', 'unknown'), false);
});

test('classification rank treats unknown classifications as high risk', () => {
  assert.equal(
    isAtLeastClassification(DATA_CLASSIFICATIONS.RESTRICTED, DATA_CLASSIFICATIONS.RESTRICTED),
    true,
  );
  assert.equal(
    isAtLeastClassification(DATA_CLASSIFICATIONS.CONFIDENTIAL, DATA_CLASSIFICATIONS.RESTRICTED),
    false,
  );
  assert.equal(isAtLeastClassification('unexpected_future_classification', DATA_CLASSIFICATIONS.PUBLIC), true);
});
