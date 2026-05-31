'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  buildCustomerAccessControllerResponse,
  handleCustomerAccessRequest,
} = require('../../src/controllers/customerAccessController');
const {
  buildCustomerAccessCaseSummarySafeEnvelope,
} = require('../../src/customerAccess/customerAccessCaseSummarySafeEnvelopePresenter');

const controllerSourcePath = path.join(__dirname, '../../src/controllers/customerAccessController.js');

function validReq() {
  return {
    params: { caseId: 'case-2310' },
    customerAccessContext: {
      params: { caseId: 'case-2310' },
      auth: {
        organizationId: 'org-2310',
        customerId: 'customer-2310',
        customerIdentityVerified: true,
      },
      channel: {
        lineChannelId: 'line-channel-2310',
        lineUserId: 'U1234567890abcdef',
      },
      access: {
        organizationScopeMatched: true,
        caseLinkedToCustomer: true,
        publicationAllowed: true,
        customerVisiblePolicyPassed: true,
      },
      customerVisibleData: {
        serviceReport: safeCaseSummaryProjection(),
      },
    },
  };
}

function injectedFacade(buildCustomerAccessHttpResponse) {
  return {
    buildCustomerAccessHttpResponse,
  };
}

function safeCaseSummaryProjection(overrides = {}) {
  return {
    caseNo: ' CASE-2310 ',
    publicReportId: ' report-public-2310 ',
    status: ' completed ',
    summary: ' Safe customer case summary ',
    finalAppointmentId: 'final_appointment_should_not_leak',
    rawCase: { id: 'raw_case_should_not_leak' },
    rawAppointment: { id: 'raw_appointment_should_not_leak' },
    rawCompletionReport: { id: 'raw_completion_report_should_not_leak' },
    rawFieldServiceReport: { id: 'raw_field_service_report_should_not_leak' },
    repositoryRow: { id: 'repository_row_should_not_leak' },
    dbRow: { id: 'db_row_should_not_leak' },
    auditContext: { id: 'audit_context_should_not_leak' },
    auditWriterResult: { id: 'audit_writer_result_should_not_leak' },
    providerPayload: { id: 'provider_payload_should_not_leak' },
    lineUserId: 'line_user_should_not_leak',
    aiRawPayload: { id: 'ai_raw_should_not_leak' },
    ragResult: { id: 'rag_result_should_not_leak' },
    vectorPayload: { id: 'vector_payload_should_not_leak' },
    openaiTrace: 'openai_should_not_leak',
    billingInternalData: { id: 'billing_internal_should_not_leak' },
    settlementInternalData: { id: 'settlement_internal_should_not_leak' },
    paymentId: 'payment_should_not_leak',
    invoiceId: 'invoice_should_not_leak',
    internalActorId: 'actor_internal_should_not_leak',
    internalUserId: 'user_internal_should_not_leak',
    engineerUserId: 'engineer_internal_should_not_leak',
    organizationId: 'organization_internal_should_not_leak',
    phone: 'phone_should_not_leak',
    fullAddress: 'full_address_should_not_leak',
    signature: 'signature_should_not_leak',
    photo: 'photo_should_not_leak',
    privateNote: 'private_should_not_leak',
    debug: 'debug_should_not_leak',
    rawSql: 'select * from customer_access',
    token: 'token_should_not_leak',
    password: 'password_should_not_leak',
    secret: 'secret_should_not_leak',
    ...overrides,
  };
}

function validFacadeAllowResult(overrides = {}) {
  return {
    status: 'allow',
    messageKey: 'customerAccess.available',
    customerVisible: true,
    data: {
      serviceReport: safeCaseSummaryProjection(overrides.serviceReport),
      ...(overrides.data || {}),
    },
    ...(overrides.envelope || {}),
  };
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
}

function assertNoForbiddenLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'final_appointment_should_not_leak',
    'raw_case_should_not_leak',
    'raw_appointment_should_not_leak',
    'raw_completion_report_should_not_leak',
    'raw_field_service_report_should_not_leak',
    'repository_row_should_not_leak',
    'db_row_should_not_leak',
    'audit_context_should_not_leak',
    'audit_writer_result_should_not_leak',
    'provider_payload_should_not_leak',
    'line_user_should_not_leak',
    'ai_raw_should_not_leak',
    'rag_result_should_not_leak',
    'vector_payload_should_not_leak',
    'openai_should_not_leak',
    'billing_internal_should_not_leak',
    'settlement_internal_should_not_leak',
    'payment_should_not_leak',
    'invoice_should_not_leak',
    'actor_internal_should_not_leak',
    'user_internal_should_not_leak',
    'engineer_internal_should_not_leak',
    'organization_internal_should_not_leak',
    'phone_should_not_leak',
    'full_address_should_not_leak',
    'signature_should_not_leak',
    'photo_should_not_leak',
    'private_should_not_leak',
    'debug_should_not_leak',
    'select * from',
    'token_should_not_leak',
    'password_should_not_leak',
    'secret_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('controller boundary wires the case summary safe envelope presenter', () => {
  const controllerSource = fs.readFileSync(controllerSourcePath, 'utf8');

  assert.match(controllerSource, /customerAccessCaseSummarySafeEnvelopePresenter/);
  assert.match(controllerSource, /buildCustomerAccessCaseSummarySafeEnvelope\(\{/);
  assert.match(controllerSource, /buildCustomerAccessCaseSummarySafeDenyEnvelope\(\)/);
});

test('allowed case summary response remains compatible while using safe helper output', () => {
  const sourceProjection = safeCaseSummaryProjection();
  const expected = buildCustomerAccessCaseSummarySafeEnvelope({
    caseSummary: sourceProjection,
  });
  const response = buildCustomerAccessControllerResponse(
    validReq(),
    injectedFacade(() => validFacadeAllowResult({
      serviceReport: sourceProjection,
    })),
  );

  assert.equal(response.status, 'allow');
  assert.equal(response.messageKey, 'customerAccess.available');
  assert.equal(response.customerVisible, true);
  assert.deepEqual(Object.keys(response.data), ['serviceReport']);
  assert.deepEqual(response.data.serviceReport, expected.data.caseSummary);
  assert.deepEqual(Object.keys(response.data.serviceReport), [
    'caseNo',
    'publicReportId',
    'status',
    'summary',
  ]);
  assert.equal(JSON.stringify(response).includes('finalAppointmentId'), false);
  assertNoForbiddenLeak(response);
});

test('missing malformed unavailable and non-allow facade results stay generic safe-deny', () => {
  for (const candidate of [
    undefined,
    null,
    '',
    [],
    new Date('2026-05-31T00:00:00.000Z'),
    new Error('raw_case_should_not_leak'),
    Promise.resolve(validFacadeAllowResult()),
    { status: 'deny', data: { serviceReport: safeCaseSummaryProjection() } },
    { status: 'allow', messageKey: 'wrong.messageKey', customerVisible: true },
    { status: 'allow', messageKey: 'customerAccess.available', customerVisible: false },
    { status: 'allow', messageKey: 'customerAccess.available', customerVisible: true, data: null },
    {
      status: 'allow',
      messageKey: 'customerAccess.available',
      customerVisible: true,
      data: { serviceReport: null },
    },
  ]) {
    const response = buildCustomerAccessControllerResponse(
      validReq(),
      injectedFacade(() => candidate),
    );

    assertGenericDeny(response);
    assertNoForbiddenLeak(response);
  }
});

test('finalAppointmentId raw private system and internal fields are not exposed', () => {
  const response = buildCustomerAccessControllerResponse(
    validReq(),
    injectedFacade(() => validFacadeAllowResult({
      serviceReport: {
        finalAppointmentId: 'finalAppointmentId_should_not_leak',
        rawReportId: 'raw_report_id_should_not_leak',
        customerPhone: 'customer_phone_should_not_leak',
        customerAddress: 'customer_address_should_not_leak',
        fullAddress: 'full_address_should_not_leak',
        signature: 'signature_should_not_leak',
        photo: 'photo_should_not_leak',
      },
    })),
  );
  const serialized = JSON.stringify(response);

  assert.equal(response.status, 'allow');
  assert.equal(serialized.includes('finalAppointmentId'), false);
  assert.equal(serialized.includes('finalAppointmentId_should_not_leak'), false);
  assert.equal(serialized.includes('raw_report_id_should_not_leak'), false);
  assert.equal(serialized.includes('customer_phone_should_not_leak'), false);
  assert.equal(serialized.includes('customer_address_should_not_leak'), false);
  assertNoForbiddenLeak(response);
});

test('controller safe helper wiring does not mutate facade result or case summary input', () => {
  const serviceReport = safeCaseSummaryProjection();
  const facadeResult = validFacadeAllowResult({ serviceReport });
  const before = JSON.stringify(facadeResult);
  const response = buildCustomerAccessControllerResponse(
    validReq(),
    injectedFacade(() => facadeResult),
  );

  assert.equal(response.status, 'allow');
  response.data.serviceReport.caseNo = 'MUTATED_OUTPUT';
  assert.equal(serviceReport.caseNo, ' CASE-2310 ');
  assert.equal(JSON.stringify(facadeResult), before);
});

test('handler returns 200 allow and 404 deny with safe envelopes', () => {
  const allowRes = {
    statusCalls: [],
    jsonCalls: [],
    status(code) {
      this.statusCalls.push(code);
      return this;
    },
    json(body) {
      this.jsonCalls.push(body);
      return body;
    },
  };
  const denyRes = {
    statusCalls: [],
    jsonCalls: [],
    status(code) {
      this.statusCalls.push(code);
      return this;
    },
    json(body) {
      this.jsonCalls.push(body);
      return body;
    },
  };
  const allowBody = handleCustomerAccessRequest(validReq(), allowRes);
  const denyReq = validReq();
  denyReq.customerAccessContext.auth.customerIdentityVerified = false;
  const denyBody = handleCustomerAccessRequest(denyReq, denyRes);

  assert.deepEqual(allowRes.statusCalls, [200]);
  assert.equal(allowBody.status, 'allow');
  assertNoForbiddenLeak(allowBody);
  assert.deepEqual(denyRes.statusCalls, [404]);
  assertGenericDeny(denyBody);
});
