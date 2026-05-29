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
  'raw_request_service_report_should_not_leak',
  'alias_service_report_should_not_leak',
  'unknown_customer_visible_should_not_leak',
  'unknown_nested_should_not_leak',
  'stack_should_not_leak',
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

function assertFailClosed(mapped) {
  assert.deepEqual(mapped, {
    organizationId: undefined,
    caseId: undefined,
    customerId: undefined,
    isCustomerIdentityVerified: false,
    isCaseLinkedToCustomer: false,
    isPublicationAllowed: false,
    isCustomerVisiblePolicyPassed: false,
    organizationScopeMatches: false,
    channelIdentityPresent: false,
    scopedChannelIdentityPresent: false,
    customerVisibleData: {},
  });
  assertNoForbiddenValues(mapped);
}

function aliasServiceReport(value = 'alias_service_report_should_not_leak') {
  return {
    serviceReport: {
      caseNo: value,
      finalAppointmentId: value,
      publicReportId: value,
      status: value,
      summary: value,
    },
  };
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

  assertFailClosed(mapped);
});

test('malformed top-level adapter input maps to fail-closed request-like input', () => {
  class ClassInput {
    constructor() {
      this.caseId = 'case-synthetic';
      this.customerAccessContext = validContext();
    }
  }

  for (const candidate of [
    null,
    [],
    'raw_context_should_not_leak',
    123,
    true,
    new Date('2026-05-30T00:00:00.000Z'),
    new Error('raw_context_should_not_leak'),
    Buffer.from('raw_context_should_not_leak'),
    { then() {} },
    () => 'raw_context_should_not_leak',
    new ClassInput(),
  ]) {
    assertFailClosed(mapCustomerAccessHttpContext(candidate));
  }
});

test('raw HTTP-like inputs without narrow DTO fail closed', () => {
  for (const input of [
    { params: { caseId: 'case-synthetic' } },
    { request: validDto() },
    { req: validDto() },
    { query: { caseId: 'case-synthetic' } },
    { body: { caseId: 'case-synthetic', customerAccessContext: validContext() } },
    { headers: { 'x-case-id': 'case-synthetic', authorization: 'Bearer token_should_not_leak' } },
    { cookies: { caseId: 'case-synthetic', session: 'cookies_should_not_leak' } },
    { user: { customerAccessContext: validContext() } },
    { session: { customerAccessContext: validContext() } },
    { auth: validContext().auth, access: validContext().access, channel: validContext().channel },
  ]) {
    assertFailClosed(mapCustomerAccessHttpContext(input));
  }
});

test('valid DTO ignores raw HTTP-like aliases and does not merge overrides', () => {
  const context = validContext();
  context.customerVisibleData = {
    serviceReport: {
      caseNo: 'CASE-APPROVED',
      finalAppointmentId: 'appointment-approved-001',
      publicReportId: 'report-approved-001',
      status: 'available',
      summary: 'Approved summary.',
    },
  };
  const mapped = mapCustomerAccessHttpContext(validDto(context, {
    input: {
      params: { caseId: 'case_query_override' },
      query: { caseId: 'case_query_override' },
      body: { customerVisibleData: aliasServiceReport('raw_request_service_report_should_not_leak') },
      headers: { authorization: 'Bearer token_should_not_leak' },
      cookies: { session: 'cookies_should_not_leak' },
      user: { customerVisibleData: aliasServiceReport('raw_request_service_report_should_not_leak') },
      session: { customerVisibleData: aliasServiceReport('raw_request_service_report_should_not_leak') },
      request: { customerVisibleData: aliasServiceReport('raw_request_service_report_should_not_leak') },
    },
    customerAccessContext: {
      customerData: aliasServiceReport(),
      visibleData: aliasServiceReport(),
      publicData: aliasServiceReport(),
      report: aliasServiceReport(),
      serviceReport: aliasServiceReport(),
      data: aliasServiceReport(),
      payload: { customerVisibleData: aliasServiceReport() },
      auth: {
        ...context.auth,
        customerVisibleData: aliasServiceReport(),
      },
      access: {
        ...context.access,
        customerVisibleData: aliasServiceReport(),
      },
      channel: {
        ...context.channel,
        customerVisibleData: aliasServiceReport(),
      },
    },
  }));

  assert.equal(mapped.caseId, 'case-synthetic');
  assert.deepEqual(mapped.customerVisibleData, {
    serviceReport: {
      caseNo: 'CASE-APPROVED',
      finalAppointmentId: 'appointment-approved-001',
      publicReportId: 'report-approved-001',
      status: 'available',
      summary: 'Approved summary.',
    },
  });
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
  context.customerVisibleData.unknownTopLevel = 'unknown_customer_visible_should_not_leak';
  context.customerVisibleData.serviceReport.phone = '0912-345-678';
  context.customerVisibleData.serviceReport.address = '台北市信義區測試路1號';
  context.customerVisibleData.serviceReport.rawLineUserId = 'U1234567890abcdef';
  context.customerVisibleData.serviceReport.internalNote = 'internal note should never leak';
  context.customerVisibleData.serviceReport.auditLog = 'audit log should never leak';
  context.customerVisibleData.serviceReport.aiRawPayload = 'ai raw payload should never leak';
  context.customerVisibleData.serviceReport.internalBillingData = 'internal billing data should never leak';
  context.customerVisibleData.serviceReport.token = 'token should never leak';
  context.customerVisibleData.serviceReport.secret = 'secret should never leak';
  context.customerVisibleData.serviceReport.displayName = 'unknown_nested_should_not_leak';
  context.customerVisibleData.serviceReport.stack = 'at stackFrame (internal.js:1)';

  const mapped = mapCustomerAccessHttpContext(validDto(context));

  assert.deepEqual(mapped.customerVisibleData, {
    serviceReport: {
      caseNo: 'CASE-001',
      finalAppointmentId: 'appointment-final-001',
    },
  });
  assertNoForbiddenValues(mapped);
});

test('malformed customerVisibleData source and approved values are omitted safely', () => {
  class UnsafeValue {
    constructor() {
      this.value = 'unknown_nested_should_not_leak';
    }
  }

  for (const candidate of [
    null,
    [],
    'unknown_customer_visible_should_not_leak',
    123,
    true,
    new Date('2026-05-30T00:00:00.000Z'),
    new Error('unknown_customer_visible_should_not_leak'),
    Buffer.from('unknown_customer_visible_should_not_leak'),
    { then() {} },
    () => 'unknown_customer_visible_should_not_leak',
    new UnsafeValue(),
  ]) {
    const context = validContext();
    context.customerVisibleData = candidate;

    const mapped = mapCustomerAccessHttpContext(validDto(context));

    assert.deepEqual(mapped.customerVisibleData, {});
    assertNoForbiddenValues(mapped);
  }

  for (const candidate of [
    {},
    [],
    new Error('unknown_nested_should_not_leak'),
    new Date('2026-05-30T00:00:00.000Z'),
    Buffer.from('unknown_nested_should_not_leak'),
    { then() {} },
    () => 'unknown_nested_should_not_leak',
    new UnsafeValue(),
    'select secret_should_not_leak',
    'Bearer token_should_not_leak',
    'authorization header should not leak',
    'at stackFrame (internal.js:1)',
  ]) {
    const context = validContext();
    context.customerVisibleData = {
      serviceReport: {
        caseNo: candidate,
        finalAppointmentId: candidate,
        publicReportId: candidate,
        status: candidate,
        summary: candidate,
      },
    };

    const mapped = mapCustomerAccessHttpContext(validDto(context));

    assert.deepEqual(mapped.customerVisibleData, {});
    assertNoForbiddenValues(mapped);
  }
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
