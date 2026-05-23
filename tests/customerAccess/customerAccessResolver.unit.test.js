'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { resolveCustomerAccess } = require('../../src/customerAccess/customerAccessResolver');

const validInput = () => ({
  organizationScope: { present: true, matches: true },
  customerIdentity: { verified: true },
  caseLinkage: { linked: true },
  publication: { allowed: true },
  customerVisiblePolicy: { passed: true },
  finalAppointmentId: 'appointment-final-001',
});

const forbiddenValues = [
  '0912-345-678',
  '台北市信義區測試路1號',
  'U1234567890abcdef',
  'internal note should never leak',
  'audit log should never leak',
  'ai raw payload should never leak',
  'internal billing data should never leak',
];

function assertSafeOutput(decision) {
  const serialized = JSON.stringify(decision);

  for (const value of forbiddenValues) {
    assert.equal(serialized.includes(value), false, `decision leaked forbidden value: ${value}`);
  }
}

test('allows verified customer access to a linked and published case', () => {
  const decision = resolveCustomerAccess(validInput());

  assert.deepEqual(decision, {
    allowed: true,
    status: 'allow',
    messageKey: 'customerAccess.allowed',
    customerVisible: true,
  });
  assertSafeOutput(decision);
});

test('denies missing input', () => {
  const decision = resolveCustomerAccess();

  assert.equal(decision.allowed, false);
  assert.equal(decision.status, 'deny');
  assert.equal(decision.messageKey, 'customerAccess.unavailable');
  assert.equal(decision.customerVisible, false);
  assert.equal(decision.internalReasonCode, 'MISSING_INPUT');
  assertSafeOutput(decision);
});

test('denies missing organization scope', () => {
  const input = validInput();
  delete input.organizationScope;

  const decision = resolveCustomerAccess(input);

  assert.equal(decision.allowed, false);
  assert.equal(decision.internalReasonCode, 'MISSING_ORGANIZATION_SCOPE');
  assertSafeOutput(decision);
});

test('denies unverified customer identity', () => {
  const input = validInput();
  input.customerIdentity = { verified: false };

  const decision = resolveCustomerAccess(input);

  assert.equal(decision.allowed, false);
  assert.equal(decision.internalReasonCode, 'UNVERIFIED_CUSTOMER_IDENTITY');
  assertSafeOutput(decision);
});

test('denies raw phone only as an authorization basis', () => {
  const decision = resolveCustomerAccess({
    organizationScope: { present: true, matches: true },
    rawPhone: '0912-345-678',
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.internalReasonCode, 'RAW_PHONE_ONLY');
  assertSafeOutput(decision);
});

test('denies raw address only as an authorization basis', () => {
  const decision = resolveCustomerAccess({
    organizationScope: { present: true, matches: true },
    rawAddress: '台北市信義區測試路1號',
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.internalReasonCode, 'RAW_ADDRESS_ONLY');
  assertSafeOutput(decision);
});

test('denies LINE id alone as an authorization basis', () => {
  const decision = resolveCustomerAccess({
    organizationScope: { present: true, matches: true },
    rawLineUserId: 'U1234567890abcdef',
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.internalReasonCode, 'LINE_ID_ONLY');
  assertSafeOutput(decision);
});

test('denies scoped channel identity alone as an authorization basis', () => {
  const decision = resolveCustomerAccess({
    organizationScope: { present: true, matches: true },
    organization_id: 'org-synthetic',
    line_channel_id: 'line-channel-synthetic',
    line_user_id: 'U1234567890abcdef',
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.internalReasonCode, 'SCOPED_CHANNEL_IDENTITY_ONLY');
  assertSafeOutput(decision);
});

test('denies missing Case linkage', () => {
  const input = validInput();
  input.caseLinkage = { linked: false };

  const decision = resolveCustomerAccess(input);

  assert.equal(decision.allowed, false);
  assert.equal(decision.internalReasonCode, 'MISSING_CASE_LINKAGE');
  assertSafeOutput(decision);
});

test('denies when publication is not allowed', () => {
  const input = validInput();
  input.publication = { allowed: false };

  const decision = resolveCustomerAccess(input);

  assert.equal(decision.allowed, false);
  assert.equal(decision.internalReasonCode, 'PUBLICATION_NOT_ALLOWED');
  assertSafeOutput(decision);
});

test('denies when customer-visible policy fails', () => {
  const input = validInput();
  input.customerVisiblePolicy = { passed: false };

  const decision = resolveCustomerAccess(input);

  assert.equal(decision.allowed, false);
  assert.equal(decision.internalReasonCode, 'CUSTOMER_VISIBLE_POLICY_FAILED');
  assertSafeOutput(decision);
});

test('does not mutate input or finalAppointmentId', () => {
  const input = {
    ...validInput(),
    rawPhone: '0912-345-678',
    rawAddress: '台北市信義區測試路1號',
    rawLineUserId: 'U1234567890abcdef',
    internalNote: 'internal note should never leak',
    auditLog: 'audit log should never leak',
    aiRawPayload: 'ai raw payload should never leak',
    internalBillingData: 'internal billing data should never leak',
  };
  const before = JSON.parse(JSON.stringify(input));

  const decision = resolveCustomerAccess(input);

  assert.deepEqual(input, before);
  assert.equal(input.finalAppointmentId, 'appointment-final-001');
  assert.equal(decision.allowed, true);
  assertSafeOutput(decision);
});
