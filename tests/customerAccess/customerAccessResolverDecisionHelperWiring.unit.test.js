'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  handleCustomerServiceReportProjectionRequest,
} = require('../../src/customerAccess/customerServiceReportProjectionHandler');

function authorizedContext(overrides = {}) {
  return {
    auth: {
      organizationId: 'org_resolver_wiring',
      customerId: 'customer_resolver_wiring',
      customerIdentityVerified: true,
      ...(overrides.auth || {}),
    },
    params: {
      caseId: 'case_resolver_wiring',
      reportId: 'report_resolver_wiring',
      ...(overrides.params || {}),
    },
    access: {
      organizationScopeMatched: true,
      caseLinkedToCustomer: true,
      publicationAllowed: true,
      customerVisiblePolicyPassed: true,
      ...(overrides.access || {}),
    },
    ...Object.fromEntries(
      Object.entries(overrides)
        .filter(([key]) => !['auth', 'params', 'access'].includes(key)),
    ),
  };
}

function request(overrides = {}) {
  return {
    params: {
      caseId: 'case_resolver_wiring',
      reportId: 'report_resolver_wiring',
    },
    customerAccessContext: authorizedContext(),
    body: {
      customerAccessContext: authorizedContext(),
      token: 'token_should_not_leak',
    },
    query: {
      organizationId: 'org_resolver_wiring',
      caseId: 'case_resolver_wiring',
      finalAppointmentId: 'final_appointment_should_not_leak',
    },
    headers: {
      authorization: 'Bearer token_should_not_leak',
    },
    ...overrides,
  };
}

function unsafeServiceReport(overrides = {}) {
  return {
    customerReportReference: ' report_resolver_wiring ',
    caseReference: ' CASE-RESOLVER-WIRING ',
    serviceStatus: ' completed ',
    appointmentWindow: ' 2026-05-31 16:00-18:00 ',
    engineerDisplayName: ' Engineer Resolver ',
    serviceSummary: ' Resolver-safe service report summary ',
    completionTime: ' 2026-05-31T10:00:00.000Z ',
    publicAttachments: [
      {
        attachmentId: ' attachment_resolver_001 ',
        label: ' Resolver photo ',
        mimeType: ' image/jpeg ',
        signedUrl: 'signed_url_should_not_leak',
        storageKey: 'storage_key_should_not_leak',
      },
      {
        token: 'token_only_attachment_should_not_leak',
      },
    ],
    rawCase: { marker: 'raw_case_should_not_leak' },
    rawAppointment: { marker: 'raw_appointment_should_not_leak' },
    rawCompletionReport: { marker: 'raw_completion_should_not_leak' },
    rawFieldServiceReport: { marker: 'raw_fsr_should_not_leak' },
    repositoryRow: { marker: 'repository_row_should_not_leak' },
    dbRow: { marker: 'db_row_should_not_leak' },
    auditInternals: { marker: 'audit_context_should_not_leak' },
    providerPayload: { marker: 'provider_payload_should_not_leak' },
    aiRawPayload: { marker: 'ai_raw_should_not_leak' },
    ragResult: { marker: 'rag_result_should_not_leak' },
    openAiTrace: { marker: 'openai_should_not_leak' },
    billingInternalData: { marker: 'billing_internal_should_not_leak' },
    settlementInternalData: { marker: 'settlement_internal_should_not_leak' },
    paymentId: 'payment_should_not_leak',
    invoiceId: 'invoice_should_not_leak',
    debug: 'debug_should_not_leak',
    internal: 'internal_should_not_leak',
    sql: 'select secret_should_not_leak',
    token: 'token_should_not_leak',
    password: 'password_should_not_leak',
    secret: 'secret_should_not_leak',
    privateNote: 'private_note_should_not_leak',
    customerPhone: 'customer_phone_should_not_leak',
    customerAddress: 'customer_address_should_not_leak',
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
    'signed_url_should_not_leak',
    'storage_key_should_not_leak',
    'token_only_attachment_should_not_leak',
    'raw_case_should_not_leak',
    'raw_appointment_should_not_leak',
    'raw_completion_should_not_leak',
    'raw_fsr_should_not_leak',
    'repository_row_should_not_leak',
    'db_row_should_not_leak',
    'audit_context_should_not_leak',
    'provider_payload_should_not_leak',
    'ai_raw_should_not_leak',
    'rag_result_should_not_leak',
    'openai_should_not_leak',
    'billing_internal_should_not_leak',
    'settlement_internal_should_not_leak',
    'payment_should_not_leak',
    'invoice_should_not_leak',
    'debug_should_not_leak',
    'internal_should_not_leak',
    'secret_should_not_leak',
    'token_should_not_leak',
    'password_should_not_leak',
    'private_note_should_not_leak',
    'customer_phone_should_not_leak',
    'customer_address_should_not_leak',
    'full_address_should_not_leak',
    'signature_should_not_leak',
    'photo_should_not_leak',
    'final_appointment_should_not_leak',
    'case_exists_should_not_leak',
    'report_exists_should_not_leak',
    'raw_denial_reason_should_not_leak',
  ]) {
    assert.equal(serialized.includes(marker), false, `${marker} leaked`);
  }
}

test('allowed service-report access remains compatible through resolver decision helper wiring', async () => {
  const response = await handleCustomerServiceReportProjectionRequest({
    request: request(),
    projectionService: () => allowServiceResult(),
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, {
    status: 'allow',
    messageKey: 'customerAccess.serviceReport.available',
    customerVisible: true,
    data: {
      serviceReport: {
        customerReportReference: 'report_resolver_wiring',
        caseReference: 'CASE-RESOLVER-WIRING',
        serviceStatus: 'completed',
        appointmentWindow: '2026-05-31 16:00-18:00',
        engineerDisplayName: 'Engineer Resolver',
        serviceSummary: 'Resolver-safe service report summary',
        completionTime: '2026-05-31T10:00:00.000Z',
        publicAttachments: [
          {
            attachmentId: 'attachment_resolver_001',
            label: 'Resolver photo',
            mimeType: 'image/jpeg',
          },
        ],
      },
    },
  });
  assertNoForbiddenLeak(response);
});

test('resolver decision helper fails closed when trusted context conflicts with route context', async () => {
  const response = await handleCustomerServiceReportProjectionRequest({
    request: request({
      customerAccessContext: authorizedContext({
        caseId: 'case_exists_should_not_leak',
        params: {
          caseId: 'case_resolver_wiring',
          reportId: 'report_resolver_wiring',
        },
      }),
    }),
    projectionService: () => allowServiceResult({
      data: {
        serviceReport: unsafeServiceReport({
          customerReportReference: 'report_exists_should_not_leak',
        }),
      },
    }),
  });

  assertGenericSafeDeny(response);
});

test('safe-deny unavailable remains generic for missing malformed cross-scope or unavailable data', async () => {
  for (const candidate of [
    request({ customerAccessContext: authorizedContext({ auth: { customerIdentityVerified: false } }) }),
    request({ customerAccessContext: authorizedContext({ access: { organizationScopeMatched: false } }) }),
    request({ customerAccessContext: authorizedContext({ access: { caseLinkedToCustomer: false } }) }),
    request({ customerAccessContext: authorizedContext({ access: { publicationAllowed: false } }) }),
    request({ customerAccessContext: authorizedContext({ access: { customerVisiblePolicyPassed: false } }) }),
    request({ customerAccessContext: authorizedContext({ params: { caseId: 'case with spaces' } }) }),
    request({ customerAccessContext: authorizedContext({ reportId: 'different_report' }) }),
  ]) {
    const response = await handleCustomerServiceReportProjectionRequest({
      request: candidate,
      projectionService: () => allowServiceResult(),
    });

    assertGenericSafeDeny(response);
  }
});

test('raw client-controlled request containers cannot authorize access or leak', async () => {
  let projectionServiceCalled = false;
  const response = await handleCustomerServiceReportProjectionRequest({
    request: request({
      customerAccessContext: undefined,
      body: {
        customerAccessContext: authorizedContext(),
        projection: unsafeServiceReport(),
      },
      query: {
        organizationId: 'org_resolver_wiring',
        caseId: 'case_resolver_wiring',
        reportId: 'report_resolver_wiring',
        finalAppointmentId: 'final_appointment_should_not_leak',
      },
      session: {
        customerId: 'customer_resolver_wiring',
      },
      user: {
        role: 'customer',
      },
      providerPayload: {
        lineUserId: 'line_user_should_not_leak',
      },
      env: {
        DATABASE_URL: 'secret_should_not_leak',
      },
    }),
    projectionService: () => {
      projectionServiceCalled = true;
      return allowServiceResult();
    },
  });

  assert.equal(projectionServiceCalled, false);
  assertGenericSafeDeny(response);
});

test('raw private system and internal fields are never exposed from resolver-wired response', async () => {
  const response = await handleCustomerServiceReportProjectionRequest({
    request: request({
      body: {
        token: 'token_should_not_leak',
        secret: 'secret_should_not_leak',
      },
      headers: {
        authorization: 'Bearer token_should_not_leak',
      },
    }),
    projectionService: () => allowServiceResult(),
  });

  assert.equal(response.statusCode, 200);
  assertNoForbiddenLeak(response);
});

test('input context projection and service result objects are not mutated', async () => {
  const sourceRequest = request();
  const sourceResult = allowServiceResult();
  const requestBefore = clone(sourceRequest);
  const resultBefore = clone(sourceResult);
  const response = await handleCustomerServiceReportProjectionRequest({
    request: sourceRequest,
    projectionService: () => sourceResult,
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(sourceRequest, requestBefore);
  assert.deepEqual(sourceResult, resultBefore);
});
