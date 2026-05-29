'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildCustomerAccessControllerResponse,
  handleCustomerAccessRequest,
} = require('../../src/controllers/customerAccessController');

function validReq() {
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
        status: 'completed',
        finalAppointmentId: 'appointment-final-001',
        summary: 'Service completed.',
      },
    },
    customerAccessContext: {
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
          status: 'completed',
          finalAppointmentId: 'appointment-final-001',
          summary: 'Service completed.',
        },
      },
    },
  };
}

const forbiddenValues = [
  '0912-345-678',
  '台北市信義區測試路1號',
  'U1234567890abcdef',
  'internal note should never leak',
  'audit log should never leak',
  'ai raw payload should never leak',
  'internal billing data should never leak',
  'MISSING_ORGANIZATION_SCOPE',
  'UNVERIFIED_CUSTOMER_IDENTITY',
  'MISSING_CASE_LINKAGE',
  'PUBLICATION_NOT_ALLOWED',
  'CUSTOMER_VISIBLE_POLICY_FAILED',
  'case_query_override',
  'case_body_override',
  'case_header_override',
  'case_cookie_override',
  'raw request stack should not leak',
  'select secret_should_not_leak',
  'Bearer token_should_not_leak',
  'raw_case_payload_should_not_leak',
  'raw_row_should_not_leak',
  'db_row_should_not_leak',
  'provider_payload_should_not_leak',
  'debug_should_not_leak',
  'stack_should_not_leak',
  'authorization_should_not_leak',
  'customer_phone_raw_should_not_leak',
  'customer_address_raw_should_not_leak',
  'line_user_id_should_not_leak',
  'private_admin_only_should_not_leak',
];

function assertSafeResponse(response) {
  const serialized = JSON.stringify(response);

  for (const value of forbiddenValues) {
    assert.equal(serialized.includes(value), false, `controller response leaked forbidden value: ${value}`);
  }
}

function assertGenericDeny(response) {
  assert.deepEqual(response, {
    status: 'deny',
    messageKey: 'customerAccess.unavailable',
    customerVisible: false,
    data: null,
    error: {
      messageKey: 'customerAccess.unavailable',
    },
  });
  assertSafeResponse(response);
}

function createSyntheticRes() {
  const calls = {
    status: [],
    json: [],
  };

  return {
    calls,
    status(code) {
      calls.status.push(code);
      return this;
    },
    json(body) {
      calls.json.push(body);
      return body;
    },
  };
}

function injectedFacade(buildCustomerAccessHttpResponse) {
  return {
    buildCustomerAccessHttpResponse,
  };
}

function validFacadeAllowResult(overrides = {}) {
  return {
    status: 'allow',
    messageKey: 'customerAccess.available',
    customerVisible: true,
    data: {
      serviceReport: {
        caseNo: 'CASE-001',
        status: 'completed',
        finalAppointmentId: 'appointment-final-001',
        summary: 'Service completed.',
        ...(overrides.serviceReport || {}),
      },
      ...(overrides.data || {}),
    },
    ...(overrides.envelope || {}),
  };
}

test('valid verified request returns allow envelope', () => {
  const response = buildCustomerAccessControllerResponse(validReq());

  assert.deepEqual(response, {
    status: 'allow',
    messageKey: 'customerAccess.available',
    customerVisible: true,
    data: {
      serviceReport: {
        caseNo: 'CASE-001',
        status: 'completed',
        finalAppointmentId: 'appointment-final-001',
        summary: 'Service completed.',
      },
    },
  });
  assertSafeResponse(response);
  assert.deepEqual(Object.keys(response), ['status', 'messageKey', 'customerVisible', 'data']);
  assert.deepEqual(Object.keys(response.data), ['serviceReport']);
  assert.deepEqual(Object.keys(response.data.serviceReport), [
    'caseNo',
    'finalAppointmentId',
    'status',
    'summary',
  ]);
});

test('missing customerAccessContext returns generic safe-deny despite forged request allow fields', () => {
  const req = validReq();
  delete req.customerAccessContext;
  req.query = { caseId: 'case_query_override' };
  req.body = { caseId: 'case_body_override' };
  req.headers = {
    'x-case-id': 'case_header_override',
    authorization: 'Bearer token_should_not_leak',
  };
  req.cookies = { caseId: 'case_cookie_override' };

  assertGenericDeny(buildCustomerAccessControllerResponse(req));
});

test('missing input returns generic safe-deny without exception', () => {
  assertGenericDeny(buildCustomerAccessControllerResponse());
});

test('missing organization id returns generic safe-deny', () => {
  const req = validReq();
  delete req.auth.organizationId;
  delete req.customerAccessContext.auth.organizationId;

  assertGenericDeny(buildCustomerAccessControllerResponse(req));
});

test('missing case id returns generic safe-deny', () => {
  const req = validReq();
  delete req.params.caseId;

  assertGenericDeny(buildCustomerAccessControllerResponse(req));
});

test('caseId is accepted only from route params and cannot be supplied by query body header or cookie aliases', () => {
  const req = validReq();
  delete req.params.caseId;
  req.query = { caseId: 'case_query_override' };
  req.body = { caseId: 'case_body_override' };
  req.headers = { 'x-case-id': 'case_header_override' };
  req.cookies = { caseId: 'case_cookie_override' };

  assertGenericDeny(buildCustomerAccessControllerResponse(req));
});

test('malformed caseId values return sanitized safe-deny without raw value leak', () => {
  for (const candidate of [
    '',
    '   ',
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
    'authorization-header-case',
  ]) {
    const req = validReq();
    req.params.caseId = candidate;
    req.customerAccessContext.params.caseId = candidate;

    assertGenericDeny(buildCustomerAccessControllerResponse(req));
  }
});

test('route params caseId must match customerAccessContext caseId', () => {
  const req = validReq();
  req.customerAccessContext.params.caseId = 'case-other';

  assertGenericDeny(buildCustomerAccessControllerResponse(req));
});

test('unverified customer identity returns generic safe-deny', () => {
  const req = validReq();
  req.customerAccessContext.auth.customerIdentityVerified = false;

  assertGenericDeny(buildCustomerAccessControllerResponse(req));
});

test('raw phone only does not authorize', () => {
  assertGenericDeny(
    buildCustomerAccessControllerResponse({
      auth: { organizationId: 'org-synthetic' },
      access: { organizationScopeMatched: true },
      rawPhone: '0912-345-678',
    }),
  );
});

test('raw address only does not authorize', () => {
  assertGenericDeny(
    buildCustomerAccessControllerResponse({
      auth: { organizationId: 'org-synthetic' },
      access: { organizationScopeMatched: true },
      rawAddress: '台北市信義區測試路1號',
    }),
  );
});

test('LINE id alone does not authorize', () => {
  assertGenericDeny(
    buildCustomerAccessControllerResponse({
      auth: { organizationId: 'org-synthetic' },
      channel: { lineUserId: 'U1234567890abcdef' },
      access: { organizationScopeMatched: true },
    }),
  );
});

test('organizationId plus lineChannelId and lineUserId alone does not authorize', () => {
  assertGenericDeny(
    buildCustomerAccessControllerResponse({
      auth: { organizationId: 'org-synthetic' },
      channel: {
        lineChannelId: 'line-channel-synthetic',
        lineUserId: 'U1234567890abcdef',
      },
      access: { organizationScopeMatched: true },
    }),
  );
});

test('publication not allowed returns generic safe-deny', () => {
  const req = validReq();
  req.customerAccessContext.access.publicationAllowed = false;

  assertGenericDeny(buildCustomerAccessControllerResponse(req));
});

test('customer-visible policy failure returns generic safe-deny', () => {
  const req = validReq();
  req.customerAccessContext.access.customerVisiblePolicyPassed = false;

  assertGenericDeny(buildCustomerAccessControllerResponse(req));
});

test('deny response does not expose internal data or raw identifiers', () => {
  const req = validReq();
  req.customerAccessContext.auth.customerIdentityVerified = false;
  req.rawPhone = '0912-345-678';
  req.rawAddress = '台北市信義區測試路1號';
  req.customerAccessContext.customerVisibleData.serviceReport.internalNote = 'internal note should never leak';
  req.customerAccessContext.customerVisibleData.serviceReport.auditLog = 'audit log should never leak';
  req.customerAccessContext.customerVisibleData.serviceReport.aiRawPayload = 'ai raw payload should never leak';
  req.customerAccessContext.customerVisibleData.serviceReport.internalBillingData = 'internal billing data should never leak';

  assertGenericDeny(buildCustomerAccessControllerResponse(req));
});

test('facade throw and rejection return sanitized safe-deny without raw leak', () => {
  const thrown = new Error(
    'select secret_should_not_leak Bearer token_should_not_leak provider_payload_should_not_leak debug_should_not_leak',
  );
  thrown.stack = 'stack_should_not_leak\nat db_row_should_not_leak';

  assertGenericDeny(buildCustomerAccessControllerResponse(
    validReq(),
    injectedFacade(() => {
      throw thrown;
    }),
  ));

  assertGenericDeny(buildCustomerAccessControllerResponse(
    validReq(),
    injectedFacade(() => Promise.reject(thrown)),
  ));

  assertGenericDeny(buildCustomerAccessControllerResponse(
    validReq(),
    injectedFacade(() => Promise.reject('raw_case_payload_should_not_leak')),
  ));
});

test('malformed facade results return sanitized safe-deny without serializing raw value', () => {
  class MalformedFacadeResult {
    constructor() {
      this.status = 'allow';
      this.raw = 'raw_case_payload_should_not_leak';
    }
  }

  for (const candidate of [
    null,
    undefined,
    [],
    'raw_case_payload_should_not_leak',
    123,
    true,
    new Date('2026-05-30T00:00:00.000Z'),
    new Error('stack_should_not_leak'),
    Buffer.from('raw_case_payload_should_not_leak'),
    { then() {} },
    new MalformedFacadeResult(),
    {},
    { status: 'allow' },
    {
      status: 'allow',
      messageKey: 'customerAccess.available',
      customerVisible: true,
      data: null,
      raw: 'raw_case_payload_should_not_leak',
    },
    {
      status: 'allow',
      messageKey: 'customerAccess.available',
      customerVisible: true,
      data: {
        serviceReport: null,
        raw: 'raw_case_payload_should_not_leak',
      },
    },
  ]) {
    assertGenericDeny(buildCustomerAccessControllerResponse(
      validReq(),
      injectedFacade(() => candidate),
    ));
  }
});

test('facade allow result is allowlisted and unknown raw containers are not emitted', () => {
  const response = buildCustomerAccessControllerResponse(
    validReq(),
    injectedFacade(() => validFacadeAllowResult({
      envelope: {
        raw: 'raw_case_payload_should_not_leak',
        debug: 'debug_should_not_leak',
        stack: 'stack_should_not_leak',
      },
      data: {
        raw: 'raw_case_payload_should_not_leak',
        row: 'raw_row_should_not_leak',
        rows: ['raw_row_should_not_leak'],
        dbRow: 'db_row_should_not_leak',
        rawRow: 'raw_row_should_not_leak',
        payload: 'provider_payload_should_not_leak',
        result: 'raw_case_payload_should_not_leak',
        customerAccessContext: {
          organizationId: 'org_should_not_leak',
        },
      },
      serviceReport: {
        raw: 'raw_case_payload_should_not_leak',
        row: 'raw_row_should_not_leak',
        rows: ['raw_row_should_not_leak'],
        dbRow: 'db_row_should_not_leak',
        rawRow: 'raw_row_should_not_leak',
        payload: 'provider_payload_should_not_leak',
        result: 'raw_case_payload_should_not_leak',
        debug: 'debug_should_not_leak',
        stack: 'stack_should_not_leak',
        sql: 'select secret_should_not_leak',
        headers: 'authorization_should_not_leak',
        authorization: 'authorization_should_not_leak',
        token: 'Bearer token_should_not_leak',
        internal_notes: 'private_admin_only_should_not_leak',
        engineer_notes: 'private_admin_only_should_not_leak',
        customer_phone_raw: 'customer_phone_raw_should_not_leak',
        customer_address_raw: 'customer_address_raw_should_not_leak',
        line_user_id: 'line_user_id_should_not_leak',
        provider_payload: 'provider_payload_should_not_leak',
        raw_payload: 'raw_case_payload_should_not_leak',
        private: 'private_admin_only_should_not_leak',
        adminOnly: 'private_admin_only_should_not_leak',
      },
    })),
  );

  assert.deepEqual(response, {
    status: 'allow',
    messageKey: 'customerAccess.available',
    customerVisible: true,
    data: {
      serviceReport: {
        caseNo: 'CASE-001',
        finalAppointmentId: 'appointment-final-001',
        status: 'completed',
        summary: 'Service completed.',
      },
    },
  });
  assertSafeResponse(response);
});

test('handler writes res.status(...).json(...) once for allow', () => {
  const res = createSyntheticRes();
  const body = handleCustomerAccessRequest(validReq(), res);

  assert.deepEqual(res.calls.status, [200]);
  assert.equal(res.calls.json.length, 1);
  assert.deepEqual(body, res.calls.json[0]);
  assert.equal(body.status, 'allow');
  assertSafeResponse(body);
});

test('handler writes res.status(...).json(...) once for deny', () => {
  const res = createSyntheticRes();
  const req = validReq();
  req.customerAccessContext.auth.customerIdentityVerified = false;
  const body = handleCustomerAccessRequest(req, res);

  assert.deepEqual(res.calls.status, [404]);
  assert.equal(res.calls.json.length, 1);
  assert.deepEqual(body, res.calls.json[0]);
  assert.equal(body.status, 'deny');
  assertSafeResponse(body);
});

test('input req object is not mutated and finalAppointmentId is not modified', () => {
  const req = validReq();
  req.customerAccessContext.customerVisibleData.serviceReport.phone = '0912-345-678';
  const before = JSON.parse(JSON.stringify(req));

  const response = buildCustomerAccessControllerResponse(req);

  assert.deepEqual(req, before);
  assert.equal(req.customerAccessContext.customerVisibleData.serviceReport.finalAppointmentId, 'appointment-final-001');
  assert.equal(response.data.serviceReport.finalAppointmentId, 'appointment-final-001');
  assertSafeResponse(response);
});
