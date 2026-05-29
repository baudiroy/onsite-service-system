'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { mapCustomerAccessHttpContext } = require('../../src/customerAccess/customerAccessHttpContextAdapter');

const forbiddenValues = [
  '0912-345-678',
  '台北市信義區測試路1號',
  'U1234567890abcdef',
  'internal note should never leak',
  'audit log should never leak',
  'ai raw payload should never leak',
  'internal billing data should never leak',
  'token should never leak',
  'secret should never leak',
  'case_query_override',
  'case_body_override',
  'select secret_should_not_leak',
  'Bearer token_should_not_leak',
  'raw_context_should_not_leak',
  'headers_should_not_leak',
  'cookies_should_not_leak',
  'private_admin_only_should_not_leak',
];

function validContext() {
  return {
    params: { caseId: 'case-synthetic' },
    auth: {
      organizationId: 'org-synthetic',
      customerId: 'customer-synthetic',
      customerIdentityVerified: true,
    },
    channel: {
      lineChannelId: 'line-channel-synthetic',
      lineUserId: 'U1234567890abcdef',
    },
    access: {
      organizationScopeMatched: true,
      caseLinkedToCustomer: true,
      publicationAllowed: true,
      customerVisiblePolicyPassed: true,
    },
    customerVisibleData: {
      serviceReport: {
        caseNo: 'CASE-001',
        finalAppointmentId: 'appointment-final-001',
      },
    },
  };
}

function validDto(context = validContext(), overrides = {}) {
  return {
    caseId: 'case-synthetic',
    customerAccessContext: {
      params: { caseId: 'case-synthetic' },
      auth: context.auth,
      channel: context.channel,
      access: context.access,
      customerVisibleData: context.customerVisibleData,
      ...(overrides.customerAccessContext || {}),
    },
    ...(overrides.input || {}),
  };
}

function assertNoForbiddenValues(mapped) {
  const serialized = JSON.stringify(mapped);

  for (const value of forbiddenValues) {
    assert.equal(serialized.includes(value), false, `mapped context leaked forbidden value: ${value}`);
  }
}

test('maps valid case overview DTO into request-like facade input', () => {
  const mapped = mapCustomerAccessHttpContext(validDto());

  assert.deepEqual(mapped, {
    organizationId: 'org-synthetic',
    caseId: 'case-synthetic',
    customerId: 'customer-synthetic',
    isCustomerIdentityVerified: true,
    isCaseLinkedToCustomer: true,
    isPublicationAllowed: true,
    isCustomerVisiblePolicyPassed: true,
    organizationScopeMatches: true,
    channelIdentityPresent: true,
    scopedChannelIdentityPresent: true,
    customerVisibleData: {
      serviceReport: {
        caseNo: 'CASE-001',
        finalAppointmentId: 'appointment-final-001',
      },
    },
  });
  assertNoForbiddenValues(mapped);
});

test('maps narrow case overview DTO from caseId and customerAccessContext', () => {
  const context = validContext();
  const mapped = mapCustomerAccessHttpContext({
    caseId: 'case-synthetic',
    customerAccessContext: {
      params: { caseId: 'case-synthetic' },
      auth: context.auth,
      channel: context.channel,
      access: context.access,
      customerVisibleData: context.customerVisibleData,
    },
    params: { caseId: 'case_query_override' },
    query: { caseId: 'case_query_override' },
    body: { caseId: 'case_body_override' },
    headers: { authorization: 'Bearer token_should_not_leak' },
  });

  assert.equal(mapped.caseId, 'case-synthetic');
  assert.equal(mapped.organizationId, 'org-synthetic');
  assert.equal(mapped.customerId, 'customer-synthetic');
  assert.equal(mapped.isCaseLinkedToCustomer, true);
  assert.deepEqual(mapped.customerVisibleData, {
    serviceReport: {
      caseNo: 'CASE-001',
      finalAppointmentId: 'appointment-final-001',
    },
  });
  assertNoForbiddenValues(mapped);
});

test('missing input maps to fail-closed request-like input', () => {
  const mapped = mapCustomerAccessHttpContext();

  assert.equal(mapped.organizationId, undefined);
  assert.equal(mapped.caseId, undefined);
  assert.equal(mapped.customerId, undefined);
  assert.equal(mapped.isCustomerIdentityVerified, false);
  assert.equal(mapped.isCaseLinkedToCustomer, false);
  assert.equal(mapped.isPublicationAllowed, false);
  assert.equal(mapped.isCustomerVisiblePolicyPassed, false);
  assert.equal(mapped.organizationScopeMatches, false);
  assertNoForbiddenValues(mapped);
});

test('missing auth.organizationId maps to fail-closed input', () => {
  const context = validContext();
  delete context.auth.organizationId;

  const mapped = mapCustomerAccessHttpContext(validDto(context));

  assert.equal(mapped.organizationId, undefined);
  assert.equal(mapped.organizationScopeMatches, true);
  assertNoForbiddenValues(mapped);
});

test('missing params.caseId maps to fail-closed input', () => {
  const context = validContext();
  const dto = validDto(context, {
    customerAccessContext: {
      params: {},
    },
  });

  const mapped = mapCustomerAccessHttpContext(dto);

  assert.equal(mapped.caseId, undefined);
  assertNoForbiddenValues(mapped);
});

test('malformed caseId maps to fail-closed input without raw identifier leak', () => {
  for (const candidate of [
    {},
    [],
    123,
    true,
    new Date('2026-05-30T00:00:00.000Z'),
    new Error('raw request stack should not leak'),
    Buffer.from('case-synthetic'),
    { then() {} },
    "case-synthetic' or '1'='1",
    'case-synthetic; select secret_should_not_leak',
    'Bearer token_should_not_leak',
  ]) {
    const dto = validDto(validContext(), {
      input: {
        caseId: candidate,
      },
      customerAccessContext: {
        params: { caseId: candidate },
      },
    });

    const mapped = mapCustomerAccessHttpContext(dto);

    assert.equal(mapped.caseId, undefined);
    assert.equal(mapped.isCaseLinkedToCustomer, false);
    assertNoForbiddenValues(mapped);
  }
});

test('unverified identity remains unverified', () => {
  const context = validContext();
  context.auth.customerIdentityVerified = false;

  const mapped = mapCustomerAccessHttpContext(validDto(context));

  assert.equal(mapped.isCustomerIdentityVerified, false);
  assertNoForbiddenValues(mapped);
});

test('raw phone only does not become verified identity', () => {
  const mapped = mapCustomerAccessHttpContext({
    auth: { organizationId: 'org-synthetic' },
    access: { organizationScopeMatched: true },
    rawPhone: '0912-345-678',
  });

  assert.equal(mapped.isCustomerIdentityVerified, false);
  assertNoForbiddenValues(mapped);
});

test('raw address only does not become verified identity', () => {
  const mapped = mapCustomerAccessHttpContext({
    auth: { organizationId: 'org-synthetic' },
    access: { organizationScopeMatched: true },
    rawAddress: '台北市信義區測試路1號',
  });

  assert.equal(mapped.isCustomerIdentityVerified, false);
  assertNoForbiddenValues(mapped);
});

test('line user id alone does not become verified identity', () => {
  const mapped = mapCustomerAccessHttpContext({
    auth: { organizationId: 'org-synthetic' },
    channel: { lineUserId: 'U1234567890abcdef' },
    access: { organizationScopeMatched: true },
  });

  assert.equal(mapped.isCustomerIdentityVerified, false);
  assert.equal(mapped.channelIdentityPresent, false);
  assert.equal(mapped.scopedChannelIdentityPresent, false);
  assertNoForbiddenValues(mapped);
});

test('organizationId plus lineChannelId and lineUserId alone does not become verified identity', () => {
  const mapped = mapCustomerAccessHttpContext({
    auth: { organizationId: 'org-synthetic' },
    channel: {
      lineChannelId: 'line-channel-synthetic',
      lineUserId: 'U1234567890abcdef',
    },
    access: { organizationScopeMatched: true },
  });

  assert.equal(mapped.isCustomerIdentityVerified, false);
  assert.equal(mapped.channelIdentityPresent, false);
  assert.equal(mapped.scopedChannelIdentityPresent, false);
  assertNoForbiddenValues(mapped);
});

test('publication not allowed remains not allowed', () => {
  const context = validContext();
  context.access.publicationAllowed = false;

  const mapped = mapCustomerAccessHttpContext(validDto(context));

  assert.equal(mapped.isPublicationAllowed, false);
  assertNoForbiddenValues(mapped);
});

test('customer-visible policy failure remains failed', () => {
  const context = validContext();
  context.access.customerVisiblePolicyPassed = false;

  const mapped = mapCustomerAccessHttpContext(validDto(context));

  assert.equal(mapped.isCustomerVisiblePolicyPassed, false);
  assertNoForbiddenValues(mapped);
});

test('strips forbidden fields from customer-visible data', () => {
  const context = validContext();
  context.customerVisibleData.serviceReport.phone = '0912-345-678';
  context.customerVisibleData.serviceReport.address = '台北市信義區測試路1號';
  context.customerVisibleData.serviceReport.rawLineUserId = 'U1234567890abcdef';
  context.customerVisibleData.serviceReport.internalNote = 'internal note should never leak';
  context.customerVisibleData.serviceReport.auditLog = 'audit log should never leak';
  context.customerVisibleData.serviceReport.aiRawPayload = 'ai raw payload should never leak';
  context.customerVisibleData.serviceReport.internalBillingData = 'internal billing data should never leak';
  context.customerVisibleData.serviceReport.token = 'token should never leak';
  context.customerVisibleData.serviceReport.secret = 'secret should never leak';

  const mapped = mapCustomerAccessHttpContext(validDto(context));

  assert.deepEqual(mapped.customerVisibleData, {
    serviceReport: {
      caseNo: 'CASE-001',
      finalAppointmentId: 'appointment-final-001',
    },
  });
  assertNoForbiddenValues(mapped);
});

test('input object is not mutated and finalAppointmentId is not modified', () => {
  const context = validContext();
  context.customerVisibleData.serviceReport.phone = '0912-345-678';
  const before = JSON.parse(JSON.stringify(context));

  const dto = validDto(context);
  const mapped = mapCustomerAccessHttpContext(dto);

  assert.deepEqual(context, before);
  assert.equal(context.customerVisibleData.serviceReport.finalAppointmentId, 'appointment-final-001');
  assert.equal(mapped.customerVisibleData.serviceReport.finalAppointmentId, 'appointment-final-001');
  assertNoForbiddenValues(mapped);
});

test('missing or malformed DTO context fails closed before using raw aliases', () => {
  class ClassContext {
    constructor() {
      this.params = { caseId: 'case-synthetic' };
    }
  }

  for (const customerAccessContext of [
    undefined,
    null,
    'raw_context_should_not_leak',
    [],
    new Date('2026-05-30T00:00:00.000Z'),
    new Error('raw_context_should_not_leak'),
    Buffer.from('raw_context_should_not_leak'),
    { then() {} },
    new ClassContext(),
  ]) {
    const mapped = mapCustomerAccessHttpContext({
      caseId: 'case-synthetic',
      customerAccessContext,
      params: { caseId: 'case_query_override' },
      query: { caseId: 'case_query_override' },
      body: { caseId: 'case_body_override' },
      headers: { authorization: 'Bearer token_should_not_leak' },
      cookies: { token: 'token should never leak' },
    });

    assert.equal(mapped.caseId, undefined);
    assert.equal(mapped.isCaseLinkedToCustomer, false);
    assertNoForbiddenValues(mapped);
  }
});

test('top-level caseId must match customerAccessContext params caseId', () => {
  const mapped = mapCustomerAccessHttpContext(validDto(validContext(), {
    input: { caseId: 'case-synthetic' },
    customerAccessContext: {
      params: { caseId: 'case-other' },
    },
  }));

  assert.equal(mapped.caseId, undefined);
  assert.equal(mapped.isCaseLinkedToCustomer, false);
  assertNoForbiddenValues(mapped);
});

test('context booleans must be exact booleans and raw nested fields are not used', () => {
  for (const value of ['true', 1, {}, [], null, undefined]) {
    const context = validContext();
    context.access.organizationScopeMatched = value;
    context.access.caseLinkedToCustomer = value;
    context.access.publicationAllowed = value;
    context.access.customerVisiblePolicyPassed = value;
    context.auth.customerIdentityVerified = value;
    context.auth.headers = 'headers_should_not_leak';
    context.auth.cookies = 'cookies_should_not_leak';
    context.auth.token = 'token should never leak';
    context.access.private = 'private_admin_only_should_not_leak';

    const mapped = mapCustomerAccessHttpContext(validDto(context));

    assert.equal(mapped.isCustomerIdentityVerified, false);
    assert.equal(mapped.isCaseLinkedToCustomer, false);
    assert.equal(mapped.isPublicationAllowed, false);
    assert.equal(mapped.isCustomerVisiblePolicyPassed, false);
    assert.equal(mapped.organizationScopeMatches, false);
    assertNoForbiddenValues(mapped);
  }
});
