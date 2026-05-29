'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  getCustomerServiceReportProjection,
} = require('../../src/customerAccess/customerServiceReportProjectionService');

function authorizedContext(overrides = {}) {
  return {
    auth: {
      organizationId: 'org_projection_001',
      customerId: 'customer_projection_001',
      customerIdentityVerified: true,
    },
    params: {
      caseId: 'case_projection_001',
    },
    access: {
      organizationScopeMatched: true,
      caseLinkedToCustomer: true,
      publicationAllowed: true,
      publicationState: 'published',
      customerVisiblePolicyPassed: true,
    },
    publication: {
      state: 'published',
      allowed: true,
      customerVisiblePolicyPassed: true,
    },
    ...overrides,
  };
}

function reportRow(overrides = {}) {
  return {
    organization_id: 'org_projection_001',
    customer_id: 'customer_projection_001',
    case_id: 'case_projection_001',
    public_report_id: 'report_public_projection_001',
    publication_allowed: true,
    publication_state: 'published',
    customer_visible_policy_passed: true,
    case_display_id: 'CASE-001',
    service_status_display: 'Completed',
    appointment_window: '2026-05-21 10:00-12:00',
    engineer_display_name: 'Engineer A',
    service_summary: 'Display-safe service summary',
    completion_time: '2026-05-21T04:00:00.000Z',
    publicAttachments: [
      {
        attachmentId: 'att_public_001',
        label: 'Service photo',
        mimeType: 'image/jpeg',
        customerVisible: true,
        signedUrl: 'https://signed.example.invalid/secret',
      },
      {
        attachmentId: 'att_internal_001',
        label: 'Internal only',
        customer_visible: false,
      },
    ],
    phone: '0912345678',
    rawAddress: 'No. 1 Secret Road',
    line_user_id: 'line_user_should_not_leak',
    finalAppointmentId: 'appt_final_should_not_leak',
    internalNote: 'internal note should not leak',
    engineerOnlyNote: 'engineer_only_note_should_not_leak',
    dispatcherNote: 'dispatcher_note_should_not_leak',
    dispatchNote: 'dispatch note should not leak',
    serviceProviderInternalNote: 'service_provider_internal_note_should_not_leak',
    subcontractorInternalNote: 'subcontractor_internal_note_should_not_leak',
    sql: 'select secret',
    queryMetadata: 'query_metadata_should_not_leak',
    queryConfig: 'query_config_should_not_leak',
    connectorInternals: 'connector_internals_should_not_leak',
    rawDbRows: 'raw_db_rows_should_not_leak',
    debugMarker: 'debug_marker_should_not_leak',
    stack: 'stack should not leak',
    token: 'token_should_not_leak',
    providerRawPayload: { id: 'provider_should_not_leak' },
    providerPayload: 'provider_payload_should_not_leak',
    webhookPayload: 'webhook_payload_should_not_leak',
    auditMetadata: 'audit_metadata_should_not_leak',
    billingInternalData: { cost: 999 },
    billingAmount: 'billing_amount_should_not_leak',
    settlementAmount: 'settlement_amount_should_not_leak',
    costAmount: 'cost_amount_should_not_leak',
    invoiceId: 'invoice_should_not_leak',
    paymentId: 'payment_should_not_leak',
    organizationInternalFields: 'organization_internal_should_not_leak',
    unpublishedReportDraft: 'unpublished_report_should_not_leak',
    rawCustomerPhone: 'raw_customer_phone_should_not_leak',
    rawCustomerAddress: 'raw_customer_address_should_not_leak',
    rawCustomerContact: 'raw_customer_contact_should_not_leak',
    completionReportApprovalState: 'completion_report_approval_should_not_leak',
    fsrPublicationWorkflow: 'fsr_publication_workflow_should_not_leak',
    ...overrides,
  };
}

function createDbClient(rows, options = {}) {
  const calls = [];
  const mutationCalls = [];
  const dbClient = {
    calls,
    mutationCalls,
    query(querySpec) {
      calls.push(querySpec);

      if (options.throwOnQuery) {
        throw new Error('database hostname token_should_not_leak');
      }

      return { rows };
    },
    insert() {
      mutationCalls.push('insert');
      throw new Error('insert should not be called');
    },
    update() {
      mutationCalls.push('update');
      throw new Error('update should not be called');
    },
    delete() {
      mutationCalls.push('delete');
      throw new Error('delete should not be called');
    },
  };

  return dbClient;
}

function assertSafeDeny(output) {
  assert.deepEqual(output, {
    status: 'deny',
    messageKey: 'customerAccess.unavailable',
    customerVisible: false,
    data: null,
    error: {
      messageKey: 'customerAccess.unavailable',
    },
  });
}

function assertNoSensitiveLeak(output) {
  const serialized = JSON.stringify(output);

  for (const value of [
    '0912345678',
    'No. 1 Secret Road',
    'line_user_should_not_leak',
    'appt_final_should_not_leak',
    'internal note should not leak',
    'engineer_only_note_should_not_leak',
    'dispatcher_note_should_not_leak',
    'dispatch note should not leak',
    'service_provider_internal_note_should_not_leak',
    'subcontractor_internal_note_should_not_leak',
    'select secret',
    'query_metadata_should_not_leak',
    'query_config_should_not_leak',
    'connector_internals_should_not_leak',
    'raw_db_rows_should_not_leak',
    'debug_marker_should_not_leak',
    'stack should not leak',
    'token_should_not_leak',
    'provider_should_not_leak',
    'provider_payload_should_not_leak',
    'webhook_payload_should_not_leak',
    'audit_metadata_should_not_leak',
    'signed.example.invalid',
    'storage_key_should_not_leak',
    'bucket_should_not_leak',
    'object_path_should_not_leak',
    'private_url_should_not_leak',
    'raw_url_should_not_leak',
    'upload_token_should_not_leak',
    'download_token_should_not_leak',
    'checksum_should_not_leak',
    'etag_should_not_leak',
    'file_metadata_should_not_leak',
    'uploader_identity_should_not_leak',
    'engineer_attachment_note_should_not_leak',
    'dispatcher_attachment_note_should_not_leak',
    'provider_attachment_note_should_not_leak',
    'subcontractor_attachment_note_should_not_leak',
    'attachment_audit_should_not_leak',
    'visibility_workflow_should_not_leak',
    'draft_attachment_should_not_leak',
    'deleted_attachment_should_not_leak',
    'rejected_attachment_should_not_leak',
    'implicit_attachment_should_not_leak',
    'invalid_attachment_should_not_leak',
    'attachment_phone_should_not_leak',
    'attachment_address_should_not_leak',
    'attachment_contact_should_not_leak',
    'attachment_billing_should_not_leak',
    'attachment_settlement_should_not_leak',
    'attachment_cost_should_not_leak',
    '999',
    'billing_amount_should_not_leak',
    'settlement_amount_should_not_leak',
    'cost_amount_should_not_leak',
    'invoice_should_not_leak',
    'payment_should_not_leak',
    'organization_internal_should_not_leak',
    'unpublished_report_should_not_leak',
    'raw_customer_phone_should_not_leak',
    'raw_customer_address_should_not_leak',
    'raw_customer_contact_should_not_leak',
    'completion_report_approval_should_not_leak',
    'fsr_publication_workflow_should_not_leak',
    'final_appointment_should_not_leak',
    'completion_time_token_should_not_leak',
    'service_status_token_should_not_leak',
    'engineer_display_token_should_not_leak',
    'appointment_window_token_should_not_leak',
    'case_reference_token_should_not_leak',
    'customer_report_reference_token_should_not_leak',
  ]) {
    assert.equal(serialized.includes(value), false, `projection leaked ${value}`);
  }
}

function assertStableAllowEnvelopeShape(output) {
  assert.deepEqual(Object.keys(output).sort(), [
    'customerVisible',
    'data',
    'messageKey',
    'status',
  ].sort());
  assert.deepEqual(Object.keys(output.data).sort(), ['serviceReport']);
  assert.deepEqual(Object.keys(output.data.serviceReport).sort(), [
    'appointmentWindow',
    'caseReference',
    'completionTime',
    'customerReportReference',
    'engineerDisplayName',
    'publicAttachments',
    'serviceStatus',
    'serviceSummary',
  ].sort());
  assert.deepEqual(Object.keys(output.data.serviceReport.publicAttachments[0]).sort(), [
    'attachmentId',
    'label',
    'mimeType',
  ].sort());
}

test('missing dbClient fails closed without reading', async () => {
  const output = await getCustomerServiceReportProjection({
    customerAccessContext: authorizedContext(),
    caseId: 'case_projection_001',
    reportId: 'report_public_projection_001',
  });

  assertSafeDeny(output);
});

test('missing or invalid customerAccessContext fails closed before query', async () => {
  const dbClient = createDbClient([reportRow()]);

  for (const customerAccessContext of [undefined, null, {}, authorizedContext({
    access: {
      organizationScopeMatched: true,
      caseLinkedToCustomer: true,
      publicationAllowed: true,
      customerVisiblePolicyPassed: false,
    },
  })]) {
    const output = await getCustomerServiceReportProjection({
      dbClient,
      customerAccessContext,
      caseId: 'case_projection_001',
      reportId: 'report_public_projection_001',
    });

    assertSafeDeny(output);
  }

  assert.equal(dbClient.calls.length, 0);
});

test('missing empty or suspicious route identifiers fail closed before query', async () => {
  const dbClient = createDbClient([reportRow()]);

  for (const candidate of [
    { caseId: undefined, reportId: 'report_public_projection_001' },
    { caseId: '', reportId: 'report_public_projection_001' },
    { caseId: '   ', reportId: 'report_public_projection_001' },
    { caseId: 'case_projection_001', reportId: undefined },
    { caseId: 'case_projection_001', reportId: '' },
    { caseId: 'case_projection_001', reportId: '   ' },
    { caseId: "case_projection_001' or '1'='1", reportId: 'report_public_projection_001' },
    { caseId: 'case_projection_001/../internal', reportId: 'report_public_projection_001' },
    { caseId: 'case_projection_001', reportId: 'report_public_projection_001;select secret' },
    { caseId: 'case_projection_001', reportId: '../report_public_projection_001' },
  ]) {
    const output = await getCustomerServiceReportProjection({
      dbClient,
      customerAccessContext: authorizedContext(),
      caseId: candidate.caseId,
      reportId: candidate.reportId,
    });

    assertSafeDeny(output);
    assertNoSensitiveLeak(output);
  }

  assert.equal(dbClient.calls.length, 0);
});

test('suspicious customer access context identifiers fail closed before query', async () => {
  const dbClient = createDbClient([reportRow()]);

  for (const customerAccessContext of [
    authorizedContext({
      auth: {
        organizationId: "org_projection_001'--",
        customerId: 'customer_projection_001',
        customerIdentityVerified: true,
      },
    }),
    authorizedContext({
      auth: {
        organizationId: 'org_projection_001',
        customerId: '../customer_projection_001',
        customerIdentityVerified: true,
      },
    }),
    authorizedContext({
      params: {
        caseId: 'case_projection_001;select secret',
      },
    }),
  ]) {
    const output = await getCustomerServiceReportProjection({
      dbClient,
      customerAccessContext,
      caseId: 'case_projection_001',
      reportId: 'report_public_projection_001',
    });

    assertSafeDeny(output);
    assertNoSensitiveLeak(output);
  }

  assert.equal(dbClient.calls.length, 0);
});

test('organization mismatch fails closed with generic deny and no existence leak', async () => {
  const dbClient = createDbClient([
    reportRow({
      organization_id: 'org_other_001',
    }),
  ]);
  const output = await getCustomerServiceReportProjection({
    dbClient,
    customerAccessContext: authorizedContext(),
    caseId: 'case_projection_001',
    reportId: 'report_public_projection_001',
  });

  assertSafeDeny(output);
  assertNoSensitiveLeak(output);
  assert.equal(dbClient.calls.length, 1);
});

test('unauthorized customer context and scoped case mismatch fail closed before query', async () => {
  const dbClient = createDbClient([reportRow()]);
  const unauthorizedOutput = await getCustomerServiceReportProjection({
    dbClient,
    customerAccessContext: authorizedContext({
      auth: {
        organizationId: 'org_projection_001',
        customerId: 'customer_projection_001',
        customerIdentityVerified: false,
      },
    }),
    caseId: 'case_projection_001',
    reportId: 'report_public_projection_001',
  });
  const mismatchedCaseOutput = await getCustomerServiceReportProjection({
    dbClient,
    customerAccessContext: authorizedContext({
      params: {
        caseId: 'case_other_001',
      },
    }),
    caseId: 'case_projection_001',
    reportId: 'report_public_projection_001',
  });

  assertSafeDeny(unauthorizedOutput);
  assertSafeDeny(mismatchedCaseOutput);
  assert.equal(dbClient.calls.length, 0);
});

test('not found fails closed without revealing whether a report exists', async () => {
  const dbClient = createDbClient([]);
  const output = await getCustomerServiceReportProjection({
    dbClient,
    customerAccessContext: authorizedContext(),
    caseId: 'case_projection_001',
    reportId: 'report_public_projection_001',
  });

  assertSafeDeny(output);
  assert.equal(dbClient.calls.length, 1);
});

test('authorized context returns only allowlisted customer-visible projection', async () => {
  const dbClient = createDbClient([reportRow()]);
  const output = await getCustomerServiceReportProjection({
    dbClient,
    customerAccessContext: authorizedContext(),
    caseId: 'case_projection_001',
    reportId: 'report_public_projection_001',
  });

  assert.deepEqual(output, {
    status: 'allow',
    messageKey: 'customerAccess.serviceReport.available',
    customerVisible: true,
    data: {
      serviceReport: {
        customerReportReference: 'report_public_projection_001',
        caseReference: 'CASE-001',
        serviceStatus: 'Completed',
        appointmentWindow: '2026-05-21 10:00-12:00',
        engineerDisplayName: 'Engineer A',
        serviceSummary: 'Display-safe service summary',
        completionTime: '2026-05-21T04:00:00.000Z',
        publicAttachments: [
          {
            attachmentId: 'att_public_001',
            label: 'Service photo',
            mimeType: 'image/jpeg',
          },
        ],
      },
    },
  });
  assertStableAllowEnvelopeShape(output);
  assertNoSensitiveLeak(output);
});

test('publicAttachments include only explicitly customer-visible metadata', async () => {
  const dbClient = createDbClient([
    reportRow({
      publicAttachments: [
        {
          attachmentId: 'att_visible_001',
          label: 'Visible photo',
          mimeType: 'image/jpeg',
          customer_visible: true,
          storageKey: 'storage_key_should_not_leak',
          bucket: 'bucket_should_not_leak',
          objectPath: 'object_path_should_not_leak',
          signedUrl: 'https://signed.example.invalid/secret',
          privateUrl: 'private_url_should_not_leak',
          rawUrl: 'raw_url_should_not_leak',
          uploadToken: 'upload_token_should_not_leak',
          downloadToken: 'download_token_should_not_leak',
          checksum: 'checksum_should_not_leak',
          etag: 'etag_should_not_leak',
          internalFileMetadata: 'file_metadata_should_not_leak',
          uploaderInternalIdentity: 'uploader_identity_should_not_leak',
          engineerAttachmentNote: 'engineer_attachment_note_should_not_leak',
          dispatcherNote: 'dispatcher_attachment_note_should_not_leak',
          providerNote: 'provider_attachment_note_should_not_leak',
          subcontractorNote: 'subcontractor_attachment_note_should_not_leak',
          auditMetadata: 'attachment_audit_should_not_leak',
          visibilityWorkflow: 'visibility_workflow_should_not_leak',
          rawPhone: 'attachment_phone_should_not_leak',
          rawAddress: 'attachment_address_should_not_leak',
          rawContact: 'attachment_contact_should_not_leak',
          billingMetadata: 'attachment_billing_should_not_leak',
          settlementMetadata: 'attachment_settlement_should_not_leak',
          costMetadata: 'attachment_cost_should_not_leak',
          finalAppointmentId: 'final_appointment_should_not_leak',
          completionReportWorkflow: 'completion_report_approval_should_not_leak',
          fsrPublicationWorkflow: 'fsr_publication_workflow_should_not_leak',
        },
        {
          publicAttachmentId: 'att_visible_002',
          displayName: 'Visible receipt',
          mime_type: 'application/pdf',
          visibility: 'customer_visible',
        },
        {
          attachmentId: 'att_visible_003',
          label: 'Visible attachment without trusted MIME',
          mimeType: 'text/html; charset=utf-8',
          customerVisible: true,
        },
        {
          attachmentId: 'att_visible_004',
          label: 'https://signed.example.invalid/private/internal-secret-photo.jpg',
          mimeType: 'image/jpeg',
          customerVisible: true,
        },
        {
          attachmentId: 'att_visible_005',
          fileName: '../private/internal-token-photo.jpg',
          mimeType: 'image/jpeg',
          visibility: 'public',
        },
        {
          attachmentId: 'https://signed.example.invalid/secret',
          label: 'invalid_attachment_should_not_leak',
          mimeType: 'image/png',
          customerVisible: true,
        },
        {
          attachment_id: '../internal/private',
          label: 'invalid_attachment_should_not_leak',
          mime_type: 'image/png',
          visibility: 'public',
        },
        {
          attachmentId: 'att_implicit_001',
          label: 'implicit_attachment_should_not_leak',
          mimeType: 'image/png',
        },
        {
          attachmentId: 'att_private_001',
          label: 'private_url_should_not_leak',
          mimeType: 'image/png',
          customer_visible: false,
        },
        {
          attachmentId: 'att_internal_001',
          label: 'storage_key_should_not_leak',
          mimeType: 'image/png',
          customerVisible: true,
          internal: true,
        },
        {
          attachmentId: 'att_draft_001',
          label: 'draft_attachment_should_not_leak',
          mimeType: 'image/png',
          visibility: 'draft',
        },
        {
          attachmentId: 'att_deleted_001',
          label: 'deleted_attachment_should_not_leak',
          mimeType: 'image/png',
          customerVisible: true,
          deleted: true,
        },
        {
          attachmentId: 'att_rejected_001',
          label: 'rejected_attachment_should_not_leak',
          mimeType: 'image/png',
          customerVisible: true,
          rejected: true,
        },
        {
          customerVisible: true,
          signedUrl: 'https://signed.example.invalid/secret',
        },
        null,
        'invalid_attachment_should_not_leak',
      ],
    }),
  ]);
  const output = await getCustomerServiceReportProjection({
    dbClient,
    customerAccessContext: authorizedContext(),
    caseId: 'case_projection_001',
    reportId: 'report_public_projection_001',
  });

  assert.equal(output.status, 'allow');
  assert.deepEqual(output.data.serviceReport.publicAttachments, [
    {
      attachmentId: 'att_visible_001',
      label: 'Visible photo',
      mimeType: 'image/jpeg',
    },
    {
      attachmentId: 'att_visible_002',
      label: 'Visible receipt',
      mimeType: 'application/pdf',
    },
    {
      attachmentId: 'att_visible_003',
      label: 'Visible attachment without trusted MIME',
    },
    {
      attachmentId: 'att_visible_004',
      mimeType: 'image/jpeg',
    },
    {
      attachmentId: 'att_visible_005',
      mimeType: 'image/jpeg',
    },
  ]);
  assertNoSensitiveLeak(output);
});

test('invalid publicAttachments collections are omitted without placeholders', async () => {
  for (const publicAttachments of [
    undefined,
    null,
    {},
    'not-array',
    [],
    [
      {
        attachmentId: 'att_denied_001',
        label: 'implicit_attachment_should_not_leak',
        mimeType: 'image/png',
      },
      {
        customerVisible: true,
        signedUrl: 'https://signed.example.invalid/secret',
      },
    ],
  ]) {
    const dbClient = createDbClient([reportRow({ publicAttachments })]);
    const output = await getCustomerServiceReportProjection({
      dbClient,
      customerAccessContext: authorizedContext(),
      caseId: 'case_projection_001',
      reportId: 'report_public_projection_001',
    });

    assert.equal(output.status, 'allow');
    assert.equal(
      Object.prototype.hasOwnProperty.call(output.data.serviceReport, 'publicAttachments'),
      false,
    );
    assertNoSensitiveLeak(output);
  }
});

test('authorized context omits null empty optional DTO fields without adding placeholders', async () => {
  const dbClient = createDbClient([
    reportRow({
      case_display_id: '',
      service_status_display: undefined,
      appointment_window: null,
      engineer_display_name: '   ',
      service_summary: '',
      completion_time: undefined,
      publicAttachments: [
        {
          attachmentId: '',
          label: '',
          mimeType: '',
          signedUrl: 'https://signed.example.invalid/secret',
        },
        {
          signedUrl: 'https://signed.example.invalid/secret',
          internalNote: 'internal note should not leak',
        },
      ],
    }),
  ]);
  const output = await getCustomerServiceReportProjection({
    dbClient,
    customerAccessContext: authorizedContext(),
    caseId: 'case_projection_001',
    reportId: 'report_public_projection_001',
  });

  assert.deepEqual(output, {
    status: 'allow',
    messageKey: 'customerAccess.serviceReport.available',
    customerVisible: true,
    data: {
      serviceReport: {
        customerReportReference: 'report_public_projection_001',
      },
    },
  });
  assertNoSensitiveLeak(output);
});

test('authorized context omits malformed completion time values', async () => {
  const dbClient = createDbClient([
    reportRow({
      completion_time: 'completion_time_token_should_not_leak',
    }),
  ]);
  const output = await getCustomerServiceReportProjection({
    dbClient,
    customerAccessContext: authorizedContext(),
    caseId: 'case_projection_001',
    reportId: 'report_public_projection_001',
  });

  assert.equal(output.status, 'allow');
  assert.equal(
    Object.prototype.hasOwnProperty.call(output.data.serviceReport, 'completionTime'),
    false,
  );
  assertNoSensitiveLeak(output);
});

test('authorized context omits malformed service status display values', async () => {
  const dbClient = createDbClient([
    reportRow({
      service_status_display: 'service_status_token_should_not_leak select secret from cases',
    }),
  ]);
  const output = await getCustomerServiceReportProjection({
    dbClient,
    customerAccessContext: authorizedContext(),
    caseId: 'case_projection_001',
    reportId: 'report_public_projection_001',
  });

  assert.equal(output.status, 'allow');
  assert.equal(
    Object.prototype.hasOwnProperty.call(output.data.serviceReport, 'serviceStatus'),
    false,
  );
  assertNoSensitiveLeak(output);
});

test('authorized context omits malformed engineer display names', async () => {
  const dbClient = createDbClient([
    reportRow({
      engineer_display_name: 'engineer_display_token_should_not_leak postgres://internal',
    }),
  ]);
  const output = await getCustomerServiceReportProjection({
    dbClient,
    customerAccessContext: authorizedContext(),
    caseId: 'case_projection_001',
    reportId: 'report_public_projection_001',
  });

  assert.equal(output.status, 'allow');
  assert.equal(
    Object.prototype.hasOwnProperty.call(output.data.serviceReport, 'engineerDisplayName'),
    false,
  );
  assertNoSensitiveLeak(output);
});

test('authorized context omits malformed appointment windows', async () => {
  const dbClient = createDbClient([
    reportRow({
      appointment_window: 'appointment_window_token_should_not_leak select secret from cases',
    }),
  ]);
  const output = await getCustomerServiceReportProjection({
    dbClient,
    customerAccessContext: authorizedContext(),
    caseId: 'case_projection_001',
    reportId: 'report_public_projection_001',
  });

  assert.equal(output.status, 'allow');
  assert.equal(
    Object.prototype.hasOwnProperty.call(output.data.serviceReport, 'appointmentWindow'),
    false,
  );
  assertNoSensitiveLeak(output);
});

test('authorized context omits malformed case references', async () => {
  const dbClient = createDbClient([
    reportRow({
      case_display_id: 'case_reference_token_should_not_leak postgres://internal',
    }),
  ]);
  const output = await getCustomerServiceReportProjection({
    dbClient,
    customerAccessContext: authorizedContext(),
    caseId: 'case_projection_001',
    reportId: 'report_public_projection_001',
  });

  assert.equal(output.status, 'allow');
  assert.equal(
    Object.prototype.hasOwnProperty.call(output.data.serviceReport, 'caseReference'),
    false,
  );
  assertNoSensitiveLeak(output);
});

test('authorized context omits malformed customer report references', async () => {
  const dbClient = createDbClient([
    reportRow({
      customerReportReference: 'customer_report_reference_token_should_not_leak postgres://internal',
    }),
  ]);
  const output = await getCustomerServiceReportProjection({
    dbClient,
    customerAccessContext: authorizedContext(),
    caseId: 'case_projection_001',
    reportId: 'report_public_projection_001',
  });

  assert.equal(output.status, 'allow');
  assert.equal(
    Object.prototype.hasOwnProperty.call(output.data.serviceReport, 'customerReportReference'),
    false,
  );
  assertNoSensitiveLeak(output);
});

test('publication state guard allows only explicit customer-published state before query', async () => {
  const dbClient = createDbClient([reportRow()]);
  const missingPublicationContext = authorizedContext();

  delete missingPublicationContext.publication;
  delete missingPublicationContext.access.publicationAllowed;
  delete missingPublicationContext.access.publicationState;

  for (const customerAccessContext of [
    missingPublicationContext,
    authorizedContext({
      publication: {
        state: 'draft',
        allowed: true,
      },
    }),
    authorizedContext({
      publication: {
        state: 'internal_only',
        allowed: true,
      },
    }),
    authorizedContext({
      publication: {
        state: 'revoked',
        allowed: true,
      },
    }),
    authorizedContext({
      publication: {
        state: 'unpublished',
        allowed: true,
      },
    }),
    authorizedContext({
      access: {
        organizationScopeMatched: true,
        caseLinkedToCustomer: true,
        publicationAllowed: false,
        customerVisiblePolicyPassed: true,
      },
    }),
  ]) {
    const output = await getCustomerServiceReportProjection({
      dbClient,
      customerAccessContext,
      caseId: 'case_projection_001',
      reportId: 'report_public_projection_001',
    });

    assertSafeDeny(output);
    assertNoSensitiveLeak(output);
  }

  assert.equal(dbClient.calls.length, 0);
});

test('publication row state guard denies unpublished or mismatched report case state', async () => {
  const deniedRows = [
    (() => {
      const {
        publication_allowed,
        customer_visible_policy_passed,
        publication_state,
        customer_visible,
        ...rowWithoutPublication
      } = reportRow();

      return rowWithoutPublication;
    })(),
    reportRow({
      publication_allowed: true,
      publication_state: 'published',
      customer_visible_policy_passed: undefined,
      customer_visible: true,
    }),
    reportRow({
      publication_allowed: undefined,
      publication_state: undefined,
      customer_visible_policy_passed: true,
      customer_visible: true,
    }),
    reportRow({
      publication_state: 'draft',
      publication_allowed: true,
    }),
    reportRow({
      publication_state: 'internal_only',
      publication_allowed: true,
    }),
    reportRow({
      revoked: true,
      publication_allowed: true,
    }),
    reportRow({
      publication_case_id: 'case_other_001',
      publication_allowed: true,
    }),
    reportRow({
      publication_report_id: 'report_other_001',
      publication_allowed: true,
    }),
  ];

  for (const row of deniedRows) {
    const dbClient = createDbClient([row]);
    const output = await getCustomerServiceReportProjection({
      dbClient,
      customerAccessContext: authorizedContext(),
      caseId: 'case_projection_001',
      reportId: 'report_public_projection_001',
    });

    assertSafeDeny(output);
    assertNoSensitiveLeak(output);
    assert.equal(dbClient.calls.length, 1);
    assert.deepEqual(dbClient.mutationCalls, []);
  }
});

test('filtered DTO never exposes raw case appointment report or organization internals', async () => {
  const forbiddenValues = [
    'raw_case_payload_should_not_leak',
    'raw_case_row_should_not_leak',
    'raw_appointment_row_should_not_leak',
    'raw_completion_report_should_not_leak',
    'raw_field_service_report_should_not_leak',
    'organization_internal_should_not_leak',
    'assignment_internal_should_not_leak',
    'audit_internal_should_not_leak',
    'billing_internal_should_not_leak',
    'provider_payload_should_not_leak',
    'webhook_payload_should_not_leak',
    'query_metadata_should_not_leak',
    'query_config_should_not_leak',
    'connector_internals_should_not_leak',
    'raw_db_rows_should_not_leak',
    'debug_marker_should_not_leak',
    'engineer_only_note_should_not_leak',
    'dispatcher_note_should_not_leak',
    'service_provider_internal_note_should_not_leak',
    'subcontractor_internal_note_should_not_leak',
    'audit_metadata_should_not_leak',
    'technician_private_should_not_leak',
    'settlement_amount_should_not_leak',
    'cost_amount_should_not_leak',
    'invoice_should_not_leak',
    'payment_should_not_leak',
    'unpublished_report_should_not_leak',
    'raw_customer_phone_should_not_leak',
    'raw_customer_address_should_not_leak',
    'raw_customer_contact_should_not_leak',
    'completion_report_approval_should_not_leak',
    'fsr_publication_workflow_should_not_leak',
    'final_appointment_should_not_leak',
  ];
  const dbClient = createDbClient([
    reportRow({
      rawCasePayload: 'raw_case_payload_should_not_leak',
      rawCaseRow: 'raw_case_row_should_not_leak',
      rawAppointmentRow: 'raw_appointment_row_should_not_leak',
      rawCompletionReport: 'raw_completion_report_should_not_leak',
      rawFieldServiceReport: 'raw_field_service_report_should_not_leak',
      organizationInternalFields: 'organization_internal_should_not_leak',
      assignmentInternals: 'assignment_internal_should_not_leak',
      auditInternals: 'audit_internal_should_not_leak',
      billingInternals: 'billing_internal_should_not_leak',
      providerPayload: 'provider_payload_should_not_leak',
      webhookPayload: 'webhook_payload_should_not_leak',
      queryMetadata: 'query_metadata_should_not_leak',
      queryConfig: 'query_config_should_not_leak',
      connectorInternals: 'connector_internals_should_not_leak',
      rawDbRows: 'raw_db_rows_should_not_leak',
      debugMarker: 'debug_marker_should_not_leak',
      engineerOnlyNote: 'engineer_only_note_should_not_leak',
      dispatcherNote: 'dispatcher_note_should_not_leak',
      serviceProviderInternalNote: 'service_provider_internal_note_should_not_leak',
      subcontractorInternalNote: 'subcontractor_internal_note_should_not_leak',
      auditMetadata: 'audit_metadata_should_not_leak',
      technicianPrivateNote: 'technician_private_should_not_leak',
      settlementAmount: 'settlement_amount_should_not_leak',
      costAmount: 'cost_amount_should_not_leak',
      invoiceId: 'invoice_should_not_leak',
      paymentId: 'payment_should_not_leak',
      unpublishedReportDraft: 'unpublished_report_should_not_leak',
      rawCustomerPhone: 'raw_customer_phone_should_not_leak',
      rawCustomerAddress: 'raw_customer_address_should_not_leak',
      rawCustomerContact: 'raw_customer_contact_should_not_leak',
      completionReportApprovalState: 'completion_report_approval_should_not_leak',
      fsrPublicationWorkflow: 'fsr_publication_workflow_should_not_leak',
      finalAppointmentId: 'final_appointment_should_not_leak',
    }),
  ]);
  const output = await getCustomerServiceReportProjection({
    dbClient,
    customerAccessContext: authorizedContext(),
    caseId: 'case_projection_001',
    reportId: 'report_public_projection_001',
  });

  assert.equal(output.status, 'allow');
  assertStableAllowEnvelopeShape(output);
  assertNoSensitiveLeak(output);

  const serialized = JSON.stringify(output);

  for (const forbiddenValue of forbiddenValues) {
    assert.equal(
      serialized.includes(forbiddenValue),
      false,
      `projection leaked forbidden internal value: ${forbiddenValue}`,
    );
  }
});

test('projection is read-only through injected synthetic dbClient query only', async () => {
  const dbClient = createDbClient([reportRow()]);
  const output = await getCustomerServiceReportProjection({
    dbClient,
    customerAccessContext: authorizedContext(),
    caseId: 'case_projection_001',
    reportId: 'report_public_projection_001',
  });

  assert.equal(output.status, 'allow');
  assert.equal(dbClient.calls.length, 1);
  assert.deepEqual(dbClient.mutationCalls, []);
  assert.equal(dbClient.calls[0].name, 'customerServiceReportProjection');
  assert.equal(dbClient.calls[0].readOnly, true);
  assert.match(dbClient.calls[0].text, /^select /i);
  assert.doesNotMatch(dbClient.calls[0].text, /\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\balter\b/i);
  assert.deepEqual(dbClient.calls[0].values, [
    'org_projection_001',
    'customer_projection_001',
    'case_projection_001',
    'report_public_projection_001',
  ]);
});

test('dbClient query errors fail closed without raw error leak', async () => {
  const dbClient = createDbClient([], { throwOnQuery: true });
  const output = await getCustomerServiceReportProjection({
    dbClient,
    customerAccessContext: authorizedContext(),
    caseId: 'case_projection_001',
    reportId: 'report_public_projection_001',
  });

  assertSafeDeny(output);
  assertNoSensitiveLeak(output);
});

test('input context and row objects are not mutated', async () => {
  const row = reportRow();
  const context = authorizedContext();
  const rowBefore = JSON.stringify(row);
  const contextBefore = JSON.stringify(context);
  const dbClient = createDbClient([row]);

  await getCustomerServiceReportProjection({
    dbClient,
    customerAccessContext: context,
    caseId: 'case_projection_001',
    reportId: 'report_public_projection_001',
  });

  assert.equal(JSON.stringify(row), rowBefore);
  assert.equal(JSON.stringify(context), contextBefore);
});
