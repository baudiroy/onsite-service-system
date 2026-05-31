'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildCustomerAccessCaseSummarySafeDenyEnvelope,
  buildCustomerAccessCaseSummarySafeEnvelope,
} = require('../../src/customerAccess/customerAccessCaseSummarySafeEnvelopePresenter');

function safeProjection(overrides = {}) {
  return {
    caseNo: ' CASE-2309 ',
    publicReportId: ' report-public-2309 ',
    status: ' completed ',
    summary: ' Customer-visible case summary ',
    finalAppointmentId: 'final_appointment_should_not_leak',
    rawCase: { id: 'raw_case_should_not_leak' },
    rawAppointment: { id: 'raw_appointment_should_not_leak' },
    rawCompletionReport: { id: 'raw_completion_report_should_not_leak' },
    rawFieldServiceReport: { id: 'raw_field_service_report_should_not_leak' },
    repositoryRow: { id: 'repository_row_should_not_leak' },
    dbRow: { id: 'db_row_should_not_leak' },
    auditActor: { id: 'audit_actor_should_not_leak' },
    auditContext: { id: 'audit_context_should_not_leak' },
    auditWriterResult: { id: 'audit_writer_result_should_not_leak' },
    providerPayload: { id: 'provider_payload_should_not_leak' },
    lineUserId: 'line_user_should_not_leak',
    smsPayload: 'sms_should_not_leak',
    emailPayload: 'email_should_not_leak',
    webhookPayload: 'webhook_should_not_leak',
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
    organizationInternal: 'organization_internal_payload_should_not_leak',
    phone: 'phone_should_not_leak',
    fullAddress: 'full_address_should_not_leak',
    signature: 'signature_should_not_leak',
    photo: 'photo_should_not_leak',
    privateNote: 'private_should_not_leak',
    debug: 'debug_should_not_leak',
    internalReason: 'internal_reason_should_not_leak',
    rawSql: 'select * from customer_access',
    token: 'token_should_not_leak',
    password: 'password_should_not_leak',
    secret: 'secret_should_not_leak',
    ...overrides,
  };
}

function assertNoForbiddenFragments(output) {
  const serialized = JSON.stringify(output);

  for (const fragment of [
    'final_appointment_should_not_leak',
    'raw_case_should_not_leak',
    'raw_appointment_should_not_leak',
    'raw_completion_report_should_not_leak',
    'raw_field_service_report_should_not_leak',
    'repository_row_should_not_leak',
    'db_row_should_not_leak',
    'audit_actor_should_not_leak',
    'audit_context_should_not_leak',
    'audit_writer_result_should_not_leak',
    'provider_payload_should_not_leak',
    'line_user_should_not_leak',
    'sms_should_not_leak',
    'email_should_not_leak',
    'webhook_should_not_leak',
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
    'organization_internal_payload_should_not_leak',
    'phone_should_not_leak',
    'full_address_should_not_leak',
    'signature_should_not_leak',
    'photo_should_not_leak',
    'private_should_not_leak',
    'debug_should_not_leak',
    'internal_reason_should_not_leak',
    'select * from',
    'token_should_not_leak',
    'password_should_not_leak',
    'secret_should_not_leak',
  ]) {
    assert.equal(serialized.includes(fragment), false, `${fragment} should not leak`);
  }
}

test('buildCustomerAccessCaseSummarySafeDenyEnvelope returns generic unavailable envelope', () => {
  assert.deepEqual(buildCustomerAccessCaseSummarySafeDenyEnvelope(), {
    status: 'deny',
    messageKey: 'customerAccess.unavailable',
    customerVisible: false,
    data: null,
    error: {
      messageKey: 'customerAccess.unavailable',
    },
  });
});

test('flat safe case summary projection returns explicit customer-facing envelope only', () => {
  const output = buildCustomerAccessCaseSummarySafeEnvelope(safeProjection());

  assert.deepEqual(output, {
    status: 'allow',
    messageKey: 'customerAccess.available',
    customerVisible: true,
    data: {
      caseSummary: {
        caseNo: 'CASE-2309',
        publicReportId: 'report-public-2309',
        status: 'completed',
        summary: 'Customer-visible case summary',
      },
    },
  });
  assertNoForbiddenFragments(output);
});

test('nested caseSummary projection is accepted without leaking envelope internals', () => {
  const output = buildCustomerAccessCaseSummarySafeEnvelope({
    status: 'allow',
    customerVisible: true,
    data: {
      caseSummary: safeProjection({
        caseNo: 'NESTED-2309',
      }),
      auditContext: { id: 'nested_audit_context_should_not_leak' },
    },
    auditWriterResult: { id: 'nested_audit_result_should_not_leak' },
  });
  const serialized = JSON.stringify(output);

  assert.equal(output.status, 'allow');
  assert.equal(output.data.caseSummary.caseNo, 'NESTED-2309');
  assert.equal(serialized.includes('nested_audit_context_should_not_leak'), false);
  assert.equal(serialized.includes('nested_audit_result_should_not_leak'), false);
  assertNoForbiddenFragments(output);
});

test('caseSummary wrapper projection is accepted without leaking sibling internals', () => {
  const output = buildCustomerAccessCaseSummarySafeEnvelope({
    caseSummary: safeProjection({
      publicReportId: 'wrapped-report-2309',
    }),
    rawCase: { id: 'wrapper_raw_case_should_not_leak' },
  });
  const serialized = JSON.stringify(output);

  assert.equal(output.status, 'allow');
  assert.equal(output.data.caseSummary.publicReportId, 'wrapped-report-2309');
  assert.equal(serialized.includes('wrapper_raw_case_should_not_leak'), false);
  assertNoForbiddenFragments(output);
});

test('finalAppointmentId and raw private system fields are never exposed', () => {
  const output = buildCustomerAccessCaseSummarySafeEnvelope(safeProjection({
    caseNo: 'CASE-PRIVATE-FILTER',
    finalAppointmentId: 'finalAppointmentId_should_not_leak',
    internalWorkflowState: 'workflow_state_should_not_leak',
    customerPhone: 'customer_phone_should_not_leak',
    customerAddress: 'customer_address_should_not_leak',
  }));
  const serialized = JSON.stringify(output);

  assert.equal(serialized.includes('finalAppointmentId'), false);
  assert.equal(serialized.includes('finalAppointmentId_should_not_leak'), false);
  assert.equal(serialized.includes('workflow_state_should_not_leak'), false);
  assert.equal(serialized.includes('customer_phone_should_not_leak'), false);
  assert.equal(serialized.includes('customer_address_should_not_leak'), false);
  assertNoForbiddenFragments(output);
});

test('missing denied unavailable unsafe or malformed projections return safe deny', () => {
  for (const input of [
    undefined,
    null,
    '',
    [],
    new Date('2026-05-31T00:00:00.000Z'),
    { status: 'deny', caseNo: 'case_should_not_leak' },
    { customerVisible: false, caseNo: 'case_should_not_leak' },
    { rawCase: { id: 'raw_case_should_not_leak' } },
    { caseNo: 'token_should_not_leak' },
    { summary: 'select * from customer_access' },
  ]) {
    assert.deepEqual(buildCustomerAccessCaseSummarySafeEnvelope(input), {
      status: 'deny',
      messageKey: 'customerAccess.unavailable',
      customerVisible: false,
      data: null,
      error: {
        messageKey: 'customerAccess.unavailable',
      },
    });
  }
});

test('input projection is not mutated and output is detached', () => {
  const input = safeProjection();
  const before = JSON.stringify(input);
  const output = buildCustomerAccessCaseSummarySafeEnvelope(input);

  assert.equal(output.status, 'allow');
  output.data.caseSummary.caseNo = 'MUTATED_OUTPUT';
  assert.equal(input.caseNo, ' CASE-2309 ');
  assert.equal(JSON.stringify(input), before);
});

test('output shape never contains fields outside the approved envelope keys', () => {
  const output = buildCustomerAccessCaseSummarySafeEnvelope(safeProjection());
  const allowedTopLevelKeys = new Set([
    'status',
    'messageKey',
    'customerVisible',
    'data',
  ]);
  const allowedDataKeys = new Set(['caseSummary']);
  const allowedSummaryKeys = new Set([
    'caseNo',
    'publicReportId',
    'status',
    'summary',
  ]);

  assert.deepEqual(Object.keys(output).filter((key) => !allowedTopLevelKeys.has(key)), []);
  assert.deepEqual(Object.keys(output.data).filter((key) => !allowedDataKeys.has(key)), []);
  assert.deepEqual(
    Object.keys(output.data.caseSummary).filter((key) => !allowedSummaryKeys.has(key)),
    [],
  );
});
