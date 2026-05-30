'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildCustomerServiceReportSafeDenyEnvelope,
  buildCustomerServiceReportSafeEnvelope,
} = require('../../src/customerAccess/customerServiceReportSafeEnvelopePresenter');

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
        signedUrl: 'https://signed.example.invalid/secret',
        rawPhoto: 'raw_photo_should_not_leak',
      },
      {
        attachmentId: 'att-002',
        label: '',
        mimeType: 'application/pdf',
        storageKey: 'storage_key_should_not_leak',
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
    auditContext: { id: 'audit_context_should_not_leak' },
    auditWriterResult: { id: 'audit_writer_result_should_not_leak' },
    providerPayload: { id: 'provider_payload_should_not_leak' },
    lineUserId: 'line_user_should_not_leak',
    aiRawPayload: { id: 'ai_raw_should_not_leak' },
    ragResult: { id: 'rag_result_should_not_leak' },
    billingInternalData: { id: 'billing_internal_should_not_leak' },
    settlementInternalData: { id: 'settlement_internal_should_not_leak' },
    paymentId: 'payment_should_not_leak',
    invoiceId: 'invoice_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    internalEngineerId: 'internal_engineer_should_not_leak',
    organizationInternal: 'organization_internal_should_not_leak',
    rawAddress: 'raw_address_should_not_leak',
    rawSignature: 'raw_signature_should_not_leak',
    privateNote: 'private_note_should_not_leak',
    debug: 'debug_should_not_leak',
    sql: 'select secret_should_not_leak',
    token: 'token_should_not_leak',
    password: 'password_should_not_leak',
    secret: 'secret_should_not_leak',
    ...overrides,
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
    'audit_context_should_not_leak',
    'audit_writer_result_should_not_leak',
    'provider_payload_should_not_leak',
    'line_user_should_not_leak',
    'ai_raw_should_not_leak',
    'rag_result_should_not_leak',
    'billing_internal_should_not_leak',
    'settlement_internal_should_not_leak',
    'payment_should_not_leak',
    'invoice_should_not_leak',
    'final_appointment_should_not_leak',
    'internal_engineer_should_not_leak',
    'organization_internal_should_not_leak',
    'raw_address_should_not_leak',
    'raw_signature_should_not_leak',
    'private_note_should_not_leak',
    'debug_should_not_leak',
    'secret_should_not_leak',
    'token_should_not_leak',
    'password_should_not_leak',
    'storage_key_should_not_leak',
    'token_only_attachment_should_not_leak',
  ]) {
    assert.equal(serialized.includes(fragment), false, `${fragment} should not leak`);
  }
}

test('buildCustomerServiceReportSafeDenyEnvelope returns generic unavailable envelope', () => {
  assert.deepEqual(buildCustomerServiceReportSafeDenyEnvelope(), {
    ok: false,
    status: 'deny',
    messageKey: 'customerAccess.unavailable',
  });
});

test('flat safe projection returns allowed customer-facing envelope only', () => {
  const output = buildCustomerServiceReportSafeEnvelope(safeProjection());

  assert.deepEqual(output, {
    ok: true,
    status: 'allow',
    messageKey: 'customerAccess.serviceReport.available',
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
      {
        attachmentId: 'att-002',
        mimeType: 'application/pdf',
      },
    ],
  });
  assertNoForbiddenFragments(output);
});

test('nested serviceReport projection is accepted without leaking envelope internals', () => {
  const output = buildCustomerServiceReportSafeEnvelope({
    status: 'allow',
    customerVisible: true,
    data: {
      serviceReport: safeProjection({
        customerReportReference: 'nested-report-001',
      }),
      auditContext: { id: 'nested_audit_context_should_not_leak' },
    },
    auditWriterResult: { id: 'nested_audit_result_should_not_leak' },
  });
  const serialized = JSON.stringify(output);

  assert.equal(output.ok, true);
  assert.equal(output.customerReportReference, 'nested-report-001');
  assert.equal(serialized.includes('nested_audit_context_should_not_leak'), false);
  assert.equal(serialized.includes('nested_audit_result_should_not_leak'), false);
  assertNoForbiddenFragments(output);
});

test('missing denied unavailable or malformed projections return safe deny', () => {
  for (const input of [
    undefined,
    null,
    '',
    [],
    new Date('2026-05-31T00:00:00.000Z'),
    { status: 'deny', customerReportReference: 'report_should_not_leak' },
    { customerVisible: false, customerReportReference: 'report_should_not_leak' },
    { rawCase: { id: 'raw_case_should_not_leak' } },
    { publicAttachments: [{ token: 'token_should_not_leak' }] },
  ]) {
    assert.deepEqual(buildCustomerServiceReportSafeEnvelope(input), {
      ok: false,
      status: 'deny',
      messageKey: 'customerAccess.unavailable',
    });
  }
});

test('input projection and attachments are not mutated', () => {
  const input = safeProjection();
  const before = JSON.stringify(input);
  const output = buildCustomerServiceReportSafeEnvelope(input);

  assert.equal(output.ok, true);
  assert.equal(JSON.stringify(input), before);
});

test('output shape never contains fields outside the approved envelope keys', () => {
  const output = buildCustomerServiceReportSafeEnvelope(safeProjection());
  const allowedTopLevelKeys = new Set([
    'ok',
    'status',
    'messageKey',
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

  assert.deepEqual(Object.keys(output).filter((key) => !allowedTopLevelKeys.has(key)), []);

  for (const attachment of output.publicAttachments) {
    assert.deepEqual(Object.keys(attachment).filter((key) => !allowedAttachmentKeys.has(key)), []);
  }
});
