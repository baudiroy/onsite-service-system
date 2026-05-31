'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  handleCustomerServiceReportProjectionRequest,
} = require('../../src/customerAccess/customerServiceReportProjectionHandler');

function authorizedContext(overrides = {}) {
  return {
    auth: {
      organizationId: 'org_customer_report_wiring',
      customerId: 'customer_report_wiring',
      customerIdentityVerified: true,
    },
    params: {
      caseId: 'case_customer_report_wiring',
    },
    access: {
      organizationScopeMatched: true,
      caseLinkedToCustomer: true,
      publicationAllowed: true,
      customerVisiblePolicyPassed: true,
    },
    ...overrides,
  };
}

function request(overrides = {}) {
  return {
    params: {
      caseId: 'case_customer_report_wiring',
      reportId: 'report_customer_report_wiring',
    },
    customerAccessContext: authorizedContext(),
    ...overrides,
  };
}

function unsafeServiceReport(overrides = {}) {
  return {
    customerReportReference: ' report_customer_report_wiring ',
    caseReference: ' CASE-CUSTOMER-WIRING ',
    serviceStatus: ' completed ',
    appointmentWindow: ' 2026-05-31 13:00-15:00 ',
    engineerDisplayName: ' Engineer Customer ',
    serviceSummary: ' Customer-safe service report summary ',
    completionTime: ' 2026-05-31T07:00:00.000Z ',
    publicAttachments: [
      {
        attachmentId: ' attachment_public_001 ',
        label: ' Completion photo ',
        mimeType: ' image/jpeg ',
        signedUrl: 'https://signed.example.invalid/secret',
        storageKey: 'storage_key_should_not_leak',
        rawPhoto: 'raw_photo_should_not_leak',
      },
    ],
    rawCase: { marker: 'raw_case_should_not_leak' },
    rawAppointment: { marker: 'raw_appointment_should_not_leak' },
    rawCompletionReport: { marker: 'raw_completion_report_should_not_leak' },
    rawFieldServiceReport: { marker: 'raw_field_service_report_should_not_leak' },
    repositoryRow: { marker: 'raw_repository_row_should_not_leak' },
    dbRow: { marker: 'raw_db_row_should_not_leak' },
    auditInternals: { marker: 'raw_audit_should_not_leak' },
    providerPayload: { marker: 'raw_provider_payload_should_not_leak' },
    aiRawPayload: { marker: 'raw_ai_should_not_leak' },
    ragResult: { marker: 'raw_rag_should_not_leak' },
    openaiResult: { marker: 'raw_openai_should_not_leak' },
    vectorResult: { marker: 'raw_vector_should_not_leak' },
    billingInternalData: { marker: 'raw_billing_should_not_leak' },
    settlementInternalData: { marker: 'raw_settlement_should_not_leak' },
    paymentId: 'payment_should_not_leak',
    invoiceId: 'invoice_should_not_leak',
    debug: 'debug_should_not_leak',
    internal: 'internal_should_not_leak',
    sql: 'raw_sql_should_not_leak',
    token: 'token_should_not_leak',
    password: 'password_should_not_leak',
    secret: 'secret_should_not_leak',
    privateNote: 'private_note_should_not_leak',
    customerPhone: 'raw_phone_should_not_leak',
    customerAddress: 'raw_address_should_not_leak',
    fullAddress: 'full_address_should_not_leak',
    signature: 'signature_should_not_leak',
    photo: 'photo_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    ...overrides,
  };
}

function allowServiceResult(overrides = {}) {
  return {
    status: 'allow',
    messageKey: 'customerAccess.serviceReport.available',
    customerVisible: true,
    data: {
      serviceReport: unsafeServiceReport(),
    },
    ...overrides,
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertGenericSafeDeny(response) {
  assert.deepEqual(response, {
    statusCode: 404,
    body: {
      status: 'deny',
      messageKey: 'customerAccess.unavailable',
      customerVisible: false,
      data: null,
      error: {
        messageKey: 'customerAccess.unavailable',
      },
    },
  });
  assertNoForbiddenLeak(response);
}

function assertNoForbiddenLeak(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'signed.example.invalid',
    'storage_key_should_not_leak',
    'raw_photo_should_not_leak',
    'raw_case_should_not_leak',
    'raw_appointment_should_not_leak',
    'raw_completion_report_should_not_leak',
    'raw_field_service_report_should_not_leak',
    'raw_repository_row_should_not_leak',
    'raw_db_row_should_not_leak',
    'raw_audit_should_not_leak',
    'raw_provider_payload_should_not_leak',
    'raw_ai_should_not_leak',
    'raw_rag_should_not_leak',
    'raw_openai_should_not_leak',
    'raw_vector_should_not_leak',
    'raw_billing_should_not_leak',
    'raw_settlement_should_not_leak',
    'payment_should_not_leak',
    'invoice_should_not_leak',
    'debug_should_not_leak',
    'internal_should_not_leak',
    'raw_sql_should_not_leak',
    'token_should_not_leak',
    'password_should_not_leak',
    'secret_should_not_leak',
    'private_note_should_not_leak',
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'full_address_should_not_leak',
    'signature_should_not_leak',
    'photo_should_not_leak',
    'final_appointment_should_not_leak',
    'raw_service_result_should_not_leak',
  ]) {
    assert.equal(serialized.includes(marker), false, `${marker} leaked`);
  }
}

function assertStableTopLevelResponse(response) {
  assert.deepEqual(Object.keys(response).sort(), ['body', 'statusCode']);
  assert.deepEqual(Object.keys(response.body).sort(), [
    'customerVisible',
    'data',
    'messageKey',
    'status',
  ].sort());
  assert.deepEqual(Object.keys(response.body.data).sort(), ['serviceReport']);
}

test('existing allowed customer-facing report success output remains compatible and is shaped through safe envelope presenter', async () => {
  const sourceResult = allowServiceResult();
  const response = await handleCustomerServiceReportProjectionRequest({
    request: request(),
    projectionService: () => sourceResult,
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, {
    status: 'allow',
    messageKey: 'customerAccess.serviceReport.available',
    customerVisible: true,
    data: {
      serviceReport: {
        customerReportReference: 'report_customer_report_wiring',
        caseReference: 'CASE-CUSTOMER-WIRING',
        serviceStatus: 'completed',
        appointmentWindow: '2026-05-31 13:00-15:00',
        engineerDisplayName: 'Engineer Customer',
        serviceSummary: 'Customer-safe service report summary',
        completionTime: '2026-05-31T07:00:00.000Z',
        publicAttachments: [
          {
            attachmentId: 'attachment_public_001',
            label: 'Completion photo',
            mimeType: 'image/jpeg',
          },
        ],
      },
    },
  });
  assertStableTopLevelResponse(response);
  assertNoForbiddenLeak(response);
});

test('raw private system and internal report fields are not exposed from service report payload', async () => {
  const response = await handleCustomerServiceReportProjectionRequest({
    request: request({
      body: {
        providerPayload: 'raw_provider_payload_should_not_leak',
        token: 'token_should_not_leak',
      },
      query: {
        sql: 'raw_sql_should_not_leak',
      },
      headers: {
        authorization: 'token_should_not_leak',
      },
    }),
    projectionService: () => allowServiceResult(),
  });

  assert.equal(response.statusCode, 200);
  assertNoForbiddenLeak(response);
});

test('safe-deny and unavailable behavior remains generic and non-disclosing', async () => {
  for (const serviceResult of [
    {
      status: 'deny',
      messageKey: 'customerAccess.unavailable',
      customerVisible: false,
      data: null,
      error: {
        messageKey: 'customerAccess.unavailable',
        raw: 'raw_service_result_should_not_leak',
      },
    },
    {
      status: 'allow',
      messageKey: 'customerAccess.serviceReport.available',
      customerVisible: true,
      data: {
        row: { raw: 'raw_service_result_should_not_leak' },
        serviceReport: unsafeServiceReport(),
      },
    },
    {
      status: 'allow',
      messageKey: 'customerAccess.serviceReport.available',
      customerVisible: true,
      data: {
        serviceReport: {
          rawCase: { marker: 'raw_case_should_not_leak' },
        },
      },
    },
  ]) {
    const response = await handleCustomerServiceReportProjectionRequest({
      request: request(),
      projectionService: () => serviceResult,
    });

    assertGenericSafeDeny(response);
  }
});

test('input projection and handler result objects are not mutated', async () => {
  const sourceResult = allowServiceResult();
  const before = clone(sourceResult);
  const response = await handleCustomerServiceReportProjectionRequest({
    request: request(),
    projectionService: () => sourceResult,
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(sourceResult, before);
});
