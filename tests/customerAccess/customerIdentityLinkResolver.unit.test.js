'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  resolveCustomerIdentityLink,
} = require('../../src/customerAccess/customerIdentityLinkResolver');

function linkedLineIdentity(overrides = {}) {
  return {
    provider: 'line',
    channel: 'line',
    organizationId: 'org_identity_001',
    customerId: 'customer_identity_001',
    contactId: 'contact_identity_001',
    caseId: 'case_identity_001',
    lineChannelId: 'line_channel_identity_001',
    lineUserId: 'line_user_should_not_leak',
    status: 'active',
    verified: true,
    providerPayload: {
      token: 'provider_payload_should_not_leak',
    },
    token: 'token_should_not_leak',
    ...overrides,
  };
}

function resolverInput(overrides = {}) {
  return {
    organizationId: 'org_identity_001',
    customerId: 'customer_identity_001',
    contactId: 'contact_identity_001',
    caseId: 'case_identity_001',
    lineChannelId: 'line_channel_identity_001',
    lineUserId: 'line_user_should_not_leak',
    customerIdentityLink: linkedLineIdentity(),
    rawPhone: '0912345678',
    rawAddress: 'No. 1 Secret Road',
    ...overrides,
  };
}

function assertDenied(output) {
  assert.deepEqual(output, {
    resolved: false,
    status: 'deny',
    messageKey: 'customerAccess.unavailable',
    customerVisible: false,
  });
  assertNoSensitiveLeak(output);
}

function assertNoSensitiveLeak(output) {
  const serialized = JSON.stringify(output);

  for (const value of [
    '0912345678',
    'No. 1 Secret Road',
    'line_user_should_not_leak',
    'provider_payload_should_not_leak',
    'token_should_not_leak',
  ]) {
    assert.equal(serialized.includes(value), false, `identity link output leaked ${value}`);
  }
}

test('allowed synthetic linked LINE identity resolves only scoped non-provider metadata', () => {
  const input = resolverInput();
  const before = JSON.parse(JSON.stringify(input));
  const output = resolveCustomerIdentityLink(input);

  assert.deepEqual(output, {
    resolved: true,
    status: 'allow',
    messageKey: 'customerAccess.identityLink.resolved',
    customerVisible: false,
    organizationId: 'org_identity_001',
    customerId: 'customer_identity_001',
    contactId: 'contact_identity_001',
    provider: 'line',
    channel: 'line',
  });
  assertNoSensitiveLeak(output);
  assert.deepEqual(input, before);
});

test('missing identity link fails closed', () => {
  const input = resolverInput();
  delete input.customerIdentityLink;

  assertDenied(resolveCustomerIdentityLink(input));
});

test('ambiguous identity links fail closed', () => {
  assertDenied(resolveCustomerIdentityLink(resolverInput({
    customerIdentityLink: undefined,
    customerIdentityLinks: [
      linkedLineIdentity(),
      linkedLineIdentity({ contactId: 'contact_identity_002' }),
    ],
  })));
});

test('revoked disabled or inactive links fail closed', () => {
  for (const link of [
    linkedLineIdentity({ revoked: true }),
    linkedLineIdentity({ disabled: true }),
    linkedLineIdentity({ status: 'revoked' }),
    linkedLineIdentity({ status: 'inactive' }),
  ]) {
    assertDenied(resolveCustomerIdentityLink(resolverInput({
      customerIdentityLink: link,
    })));
  }
});

test('organization customer case and contact mismatches fail closed', () => {
  for (const link of [
    linkedLineIdentity({ organizationId: 'org_other_001' }),
    linkedLineIdentity({ customerId: 'customer_other_001' }),
    linkedLineIdentity({ caseId: 'case_other_001' }),
    linkedLineIdentity({ contactId: 'contact_other_001' }),
  ]) {
    assertDenied(resolveCustomerIdentityLink(resolverInput({
      customerIdentityLink: link,
    })));
  }
});

test('LINE user id is not a global identity without organization customer and channel scope', () => {
  for (const link of [
    linkedLineIdentity({ organizationId: undefined }),
    linkedLineIdentity({ customerId: undefined }),
    linkedLineIdentity({ lineChannelId: undefined }),
    linkedLineIdentity({ lineUserId: undefined }),
  ]) {
    assertDenied(resolveCustomerIdentityLink(resolverInput({
      customerIdentityLink: link,
    })));
  }
});

test('unsupported provider or channel fails closed without provider execution', () => {
  for (const link of [
    linkedLineIdentity({ provider: 'wechat', channel: 'wechat' }),
    linkedLineIdentity({ provider: 'line', channel: 'webhook' }),
  ]) {
    assertDenied(resolveCustomerIdentityLink(resolverInput({
      customerIdentityLink: link,
    })));
  }
});
