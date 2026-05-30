'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildCustomerAccessResolverDecision,
  buildCustomerAccessResolverDenyDecision,
} = require('../../src/customerAccess/customerAccessResolverDecisionHelper');

function trustedContext(overrides = {}) {
  return {
    params: {
      caseId: ' case_context_001 ',
      reportId: ' report_context_001 ',
      ...(overrides.params || {}),
    },
    auth: {
      organizationId: ' org_context_001 ',
      customerId: ' customer_context_001 ',
      customerIdentityVerified: true,
      ...(overrides.auth || {}),
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
        .filter(([key]) => !['params', 'auth', 'access'].includes(key)),
    ),
  };
}

function safeProjection(overrides = {}) {
  return {
    customerReportReference: ' report-public-001 ',
    caseReference: ' CASE-001 ',
    serviceStatus: ' completed ',
    appointmentWindow: ' 2026-05-31 10:00-12:00 ',
    engineerDisplayName: ' Engineer A ',
    serviceSummary: ' Display-safe summary ',
    completionTime: ' 2026-05-31T04:00:00.000Z ',
    publicAttachments: [
      {
        attachmentId: ' att-001 ',
        label: ' Service photo ',
        mimeType: ' image/jpeg ',
        storageKey: 'storage_key_should_not_leak',
        signedUrl: 'signed_url_should_not_leak',
      },
      {
        token: 'token_only_attachment_should_not_leak',
      },
    ],
    rawCase: { id: 'raw_case_should_not_leak' },
    rawAppointment: { id: 'raw_appointment_should_not_leak' },
    rawCompletionReport: { id: 'raw_completion_should_not_leak' },
    rawFieldServiceReport: { id: 'raw_fsr_should_not_leak' },
    repositoryRow: { id: 'repository_row_should_not_leak' },
    dbRow: { id: 'db_row_should_not_leak' },
    auditActor: { id: 'audit_actor_should_not_leak' },
    auditContext: { id: 'audit_context_should_not_leak' },
    auditWriterResult: { id: 'audit_writer_result_should_not_leak' },
    providerPayload: { id: 'provider_payload_should_not_leak' },
    lineUserId: 'line_user_should_not_leak',
    smsPayload: 'sms_should_not_leak',
    emailPayload: 'email_should_not_leak',
    appPushPayload: 'app_push_should_not_leak',
    webhookPayload: 'webhook_should_not_leak',
    aiRawPayload: { id: 'ai_raw_should_not_leak' },
    ragResult: { id: 'rag_result_should_not_leak' },
    vectorResult: { id: 'vector_result_should_not_leak' },
    openAiTrace: { id: 'openai_should_not_leak' },
    billingInternalData: { id: 'billing_internal_should_not_leak' },
    settlementInternalData: { id: 'settlement_internal_should_not_leak' },
    paymentId: 'payment_should_not_leak',
    invoiceId: 'invoice_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    internalActorId: 'internal_actor_should_not_leak',
    engineerUserId: 'engineer_user_should_not_leak',
    role: 'role_should_not_leak',
    permissionDetails: 'permission_should_not_leak',
    debug: 'debug_should_not_leak',
    sql: 'select secret_should_not_leak',
    token: 'token_should_not_leak',
    password: 'password_should_not_leak',
    secret: 'secret_should_not_leak',
    ...overrides,
  };
}

function validInput(overrides = {}) {
  return {
    customerAccessContext: trustedContext(overrides.customerAccessContext || {}),
    projection: safeProjection(overrides.projection || {}),
    ...Object.fromEntries(
      Object.entries(overrides)
        .filter(([key]) => !['customerAccessContext', 'projection'].includes(key)),
    ),
  };
}

function assertNoForbiddenFragments(output) {
  const serialized = JSON.stringify(output);

  for (const fragment of [
    'raw_case_should_not_leak',
    'raw_appointment_should_not_leak',
    'raw_completion_should_not_leak',
    'raw_fsr_should_not_leak',
    'repository_row_should_not_leak',
    'db_row_should_not_leak',
    'audit_actor_should_not_leak',
    'audit_context_should_not_leak',
    'audit_writer_result_should_not_leak',
    'provider_payload_should_not_leak',
    'line_user_should_not_leak',
    'sms_should_not_leak',
    'email_should_not_leak',
    'app_push_should_not_leak',
    'webhook_should_not_leak',
    'ai_raw_should_not_leak',
    'rag_result_should_not_leak',
    'vector_result_should_not_leak',
    'openai_should_not_leak',
    'billing_internal_should_not_leak',
    'settlement_internal_should_not_leak',
    'payment_should_not_leak',
    'invoice_should_not_leak',
    'final_appointment_should_not_leak',
    'internal_actor_should_not_leak',
    'engineer_user_should_not_leak',
    'role_should_not_leak',
    'permission_should_not_leak',
    'debug_should_not_leak',
    'secret_should_not_leak',
    'token_should_not_leak',
    'password_should_not_leak',
    'storage_key_should_not_leak',
    'signed_url_should_not_leak',
    'token_only_attachment_should_not_leak',
    'case_exists_should_not_leak',
    'report_exists_should_not_leak',
    'org_mismatch_should_not_leak',
    'raw_denial_reason_should_not_leak',
  ]) {
    assert.equal(serialized.includes(fragment), false, `${fragment} should not leak`);
  }
}

function assertGenericDeny(output) {
  assert.deepEqual(output, {
    allowed: false,
    status: 'deny',
    messageKey: 'customerAccess.unavailable',
  });
  assertNoForbiddenFragments(output);
}

test('buildCustomerAccessResolverDenyDecision returns generic safe-deny only', () => {
  assertGenericDeny(buildCustomerAccessResolverDenyDecision());
});

test('valid trusted context and safe projection return allow decision with explicit shape', () => {
  const output = buildCustomerAccessResolverDecision(validInput());

  assert.deepEqual(output, {
    allowed: true,
    status: 'allow',
    messageKey: 'customerAccess.allowed',
    projection: {
      customerReportReference: 'report-public-001',
      caseReference: 'CASE-001',
      serviceStatus: 'completed',
      appointmentWindow: '2026-05-31 10:00-12:00',
      engineerDisplayName: 'Engineer A',
      serviceSummary: 'Display-safe summary',
      completionTime: '2026-05-31T04:00:00.000Z',
      publicAttachments: [
        {
          attachmentId: 'att-001',
          label: 'Service photo',
          mimeType: 'image/jpeg',
        },
      ],
    },
  });
  assertNoForbiddenFragments(output);
});

test('projection lookup wrapper is accepted only when it contains an already-safe projection', () => {
  const output = buildCustomerAccessResolverDecision({
    customerAccessContext: trustedContext(),
    projectionLookup: {
      status: 'found',
      projection: safeProjection({
        customerReportReference: 'lookup-report-001',
      }),
      repositoryRow: { id: 'repository_row_should_not_leak' },
      rawCase: { id: 'raw_case_should_not_leak' },
    },
  });

  assert.equal(output.allowed, true);
  assert.equal(output.projection.customerReportReference, 'lookup-report-001');
  assertNoForbiddenFragments(output);
});

test('missing malformed unauthorized conflicting cross-scope or unavailable input returns generic deny', () => {
  for (const input of [
    undefined,
    null,
    '',
    [],
    new Date('2026-05-31T00:00:00.000Z'),
    validInput({ customerAccessContext: { auth: { customerIdentityVerified: false } } }),
    validInput({ customerAccessContext: { access: { organizationScopeMatched: false } } }),
    validInput({ customerAccessContext: { access: { caseLinkedToCustomer: false } } }),
    validInput({ customerAccessContext: { access: { publicationAllowed: false } } }),
    validInput({ customerAccessContext: { access: { customerVisiblePolicyPassed: false } } }),
    validInput({ customerAccessContext: { params: { caseId: 'case with spaces' } } }),
    validInput({ customerAccessContext: { caseId: 'different_case_001' } }),
    {
      customerAccessContext: trustedContext(),
      projectionLookup: {
        status: 'not_found',
        projection: safeProjection({ customerReportReference: 'report_exists_should_not_leak' }),
      },
      denialReason: 'raw_denial_reason_should_not_leak',
    },
    {
      customerAccessContext: trustedContext(),
      projectionLookup: {
        available: false,
        projection: safeProjection({ customerReportReference: 'case_exists_should_not_leak' }),
      },
      organizationMismatchReason: 'org_mismatch_should_not_leak',
    },
    {
      customerAccessContext: trustedContext(),
      projection: {
        rawCase: { id: 'raw_case_should_not_leak' },
      },
    },
  ]) {
    assertGenericDeny(buildCustomerAccessResolverDecision(input));
  }
});

test('raw request containers and client-controlled internal fields cannot authorize access', () => {
  assertGenericDeny(buildCustomerAccessResolverDecision({
    body: {
      customerAccessContext: trustedContext(),
      projection: safeProjection(),
    },
    query: {
      organizationId: 'org_context_001',
      caseId: 'case_context_001',
    },
    headers: {
      authorization: 'Bearer token_should_not_leak',
    },
    cookies: {
      session: 'secret_should_not_leak',
    },
    session: {
      userId: 'customer_context_001',
    },
    user: {
      role: 'role_should_not_leak',
    },
    providerPayload: {
      lineUserId: 'line_user_should_not_leak',
    },
    debug: 'debug_should_not_leak',
    env: {
      DATABASE_URL: 'secret_should_not_leak',
    },
  }));

  const output = buildCustomerAccessResolverDecision(validInput({
    appointmentId: 'appointment_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    completionReportId: 'completion_report_should_not_leak',
    fieldServiceReportId: 'field_service_report_should_not_leak',
    internalActorId: 'internal_actor_should_not_leak',
    engineerUserId: 'engineer_user_should_not_leak',
    role: 'role_should_not_leak',
    permissionDetails: 'permission_should_not_leak',
    debug: 'debug_should_not_leak',
  }));

  assert.equal(output.allowed, true);
  assertNoForbiddenFragments(output);
});

test('safe-deny never reveals case or report existence or raw denial details', () => {
  const output = buildCustomerAccessResolverDecision({
    customerAccessContext: trustedContext({
      access: {
        organizationScopeMatched: false,
      },
    }),
    projection: safeProjection({
      customerReportReference: 'case_exists_should_not_leak',
      caseReference: 'report_exists_should_not_leak',
    }),
    internalReasonCode: 'raw_denial_reason_should_not_leak',
    organizationMismatchReason: 'org_mismatch_should_not_leak',
  });

  assertGenericDeny(output);
});

test('input context projection and attachments are not mutated', () => {
  const input = validInput();
  const before = JSON.stringify(input);
  const output = buildCustomerAccessResolverDecision(input);

  assert.equal(output.allowed, true);
  assert.equal(JSON.stringify(input), before);
});

test('output shape never contains fields outside approved decision and projection keys', () => {
  const output = buildCustomerAccessResolverDecision(validInput());
  const allowedDecisionKeys = new Set(['allowed', 'status', 'messageKey', 'projection']);
  const allowedProjectionKeys = new Set([
    'customerReportReference',
    'caseReference',
    'serviceStatus',
    'appointmentWindow',
    'engineerDisplayName',
    'serviceSummary',
    'completionTime',
    'publicAttachments',
  ]);
  const allowedAttachmentKeys = new Set(['attachmentId', 'label', 'mimeType']);

  assert.deepEqual(Object.keys(output).filter((key) => !allowedDecisionKeys.has(key)), []);
  assert.deepEqual(Object.keys(output.projection).filter((key) => !allowedProjectionKeys.has(key)), []);

  for (const attachment of output.projection.publicAttachments) {
    assert.deepEqual(Object.keys(attachment).filter((key) => !allowedAttachmentKeys.has(key)), []);
  }
});
