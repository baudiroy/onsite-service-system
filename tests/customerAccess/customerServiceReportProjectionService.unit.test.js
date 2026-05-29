'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  getCustomerServiceReportProjection,
} = require('../../src/customerAccess/customerServiceReportProjectionService');

function authorizedContext(overrides = {}) {
  return {
    organizationId: 'org_projection_001',
    customerId: 'customer_projection_001',
    caseId: 'case_projection_001',
    organizationScopeMatched: true,
    customerIdentityVerified: true,
    caseLinkedToCustomer: true,
    publicationAllowed: true,
    customerVisiblePolicyPassed: true,
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
    approved_service_summary: 'Display-safe service summary',
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
  const callArgs = [];
  const mutationCalls = [];
  const dbClient = {
    callArgs,
    calls,
    mutationCalls,
    query(...args) {
      const [querySpec] = args;

      callArgs.push(args);
      calls.push(querySpec);

      if (Object.prototype.hasOwnProperty.call(options, 'throwWith')) {
        throw options.throwWith;
      }

      if (options.throwOnQuery) {
        throw new Error('database hostname token_should_not_leak');
      }

      if (Object.prototype.hasOwnProperty.call(options, 'rejectWith')) {
        return Promise.reject(options.rejectWith);
      }

      if (Object.prototype.hasOwnProperty.call(options, 'result')) {
        return options.result;
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
    'legacy_service_summary_should_not_leak',
    'legacy_service_summary_column_should_not_leak',
  ]) {
    assert.equal(serialized.includes(value), false, `projection leaked ${value}`);
  }
}

function assertNoForbiddenFragments(output, values) {
  const serialized = JSON.stringify(output);

  for (const value of values) {
    assert.equal(serialized.includes(value), false, `projection leaked ${value}`);
  }
}

function assertQueryValuesAreExpectedPrimitives(querySpec) {
  assert.deepEqual(querySpec.values, [
    'org_projection_001',
    'customer_projection_001',
    'case_projection_001',
    'report_public_projection_001',
  ]);

  for (const value of querySpec.values) {
    assert.equal(typeof value, 'string');
    assert.equal(Array.isArray(value), false);
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

function assertOnlyPublicAttachmentKeys(attachment) {
  for (const key of Object.keys(attachment)) {
    assert.equal(
      ['attachmentId', 'label', 'mimeType'].includes(key),
      true,
      `unexpected public attachment key ${key}`,
    );
  }
}

function collectObjectKeys(value, keys = []) {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectObjectKeys(item, keys);
    }

    return keys;
  }

  if (!value || typeof value !== 'object') {
    return keys;
  }

  for (const [key, child] of Object.entries(value)) {
    keys.push(key);
    collectObjectKeys(child, keys);
  }

  return keys;
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

  for (const customerAccessContext of [
    undefined,
    null,
    {},
    authorizedContext({ customerVisiblePolicyPassed: false }),
  ]) {
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

test('missing malformed or suspicious top-level service identifiers fail closed before query', async () => {
  class IdentifierContainer {}

  const dbClient = createDbClient([reportRow()]);
  const promiseIdentifier = Promise.resolve('case_projection_001');
  promiseIdentifier.id = 'promise_identifier_should_not_leak';
  const thenableIdentifier = { then() {}, id: 'thenable_identifier_should_not_leak' };
  const invalidIdentifierValues = [
    undefined,
    null,
    '',
    '   ',
    123,
    true,
    ['identifier_array_should_not_leak'],
    { id: 'identifier_object_should_not_leak' },
    new Date('2026-05-21T04:00:00.000Z'),
    new Error('identifier_error_should_not_leak'),
    Buffer.from('identifier_buffer_should_not_leak'),
    promiseIdentifier,
    thenableIdentifier,
    Object.assign(new IdentifierContainer(), { id: 'identifier_class_should_not_leak' }),
    "case_projection_001' or '1'='1",
    'case_projection_001/../internal',
    'case_projection_001;select secret',
    '../report_public_projection_001',
    'Bearer token_should_not_leak',
    'headers.authorization',
  ];

  for (const key of ['caseId', 'reportId']) {
    for (const value of invalidIdentifierValues) {
      const input = {
        dbClient,
        customerAccessContext: authorizedContext(),
        caseId: 'case_projection_001',
        reportId: 'report_public_projection_001',
        [key]: value,
      };
      const output = await getCustomerServiceReportProjection(input);

      assertSafeDeny(output);
      assert.equal(JSON.stringify(output).includes('should_not_leak'), false);
      assertNoSensitiveLeak(output);
    }
  }

  assert.equal(dbClient.calls.length, 0);
});

test('service input identifiers do not fall back to aliases wrappers or context report aliases', async () => {
  const dbClient = createDbClient([reportRow()]);

  for (const aliasPayload of [
    {
      public_report_id: 'report_public_projection_001',
      case_id: 'case_projection_001',
    },
    {
      publicReportId: 'report_public_projection_001',
      customerReportReference: 'report_public_projection_001',
      caseReference: 'case_projection_001',
    },
    {
      row: {
        caseId: 'case_projection_001',
        reportId: 'report_public_projection_001',
      },
    },
    {
      rows: [
        {
          caseId: 'case_projection_001',
          reportId: 'report_public_projection_001',
        },
      ],
    },
    {
      data: {
        caseId: 'case_projection_001',
        reportId: 'report_public_projection_001',
      },
    },
    {
      payload: {
        caseId: 'case_projection_001',
        reportId: 'report_public_projection_001',
      },
    },
    {
      result: {
        caseId: 'case_projection_001',
        public_report_id: 'report_public_projection_001',
      },
    },
    {
      raw: {
        case_id: 'case_projection_001',
        report_id: 'report_public_projection_001',
      },
    },
    {
      rawRow: {
        caseId: 'case_projection_001',
        reportId: 'report_public_projection_001',
      },
    },
    {
      dbRow: {
        case_id: 'case_projection_001',
        public_report_id: 'report_public_projection_001',
      },
    },
    {
      customerAccessContext: authorizedContext({
        reportId: 'report_public_projection_001',
      }),
    },
    {
      customerAccessContext: authorizedContext({
        public_report_id: 'report_public_projection_001',
      }),
    },
  ]) {
    const output = await getCustomerServiceReportProjection({
      dbClient,
      customerAccessContext: authorizedContext(),
      ...aliasPayload,
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
      organizationId: "org_projection_001'--",
    }),
    authorizedContext({
      customerId: '../customer_projection_001',
    }),
    authorizedContext({
      caseId: 'case_projection_001;select secret',
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

test('customerAccessContext must be a flat plain allowlisted object', async () => {
  class ContextContainer {}

  const promiseContext = Promise.resolve(authorizedContext());
  promiseContext.organizationId = 'org_projection_001';
  promiseContext.customerId = 'customer_projection_001';
  promiseContext.caseId = 'case_projection_001';

  const dbClient = createDbClient([reportRow()]);

  for (const customerAccessContext of [
    [],
    'context_string_should_not_leak',
    123,
    true,
    new Date('2026-05-21T04:00:00.000Z'),
    new Error('context_error_should_not_leak'),
    Buffer.from('context_buffer_should_not_leak'),
    promiseContext,
    { ...authorizedContext(), then() {} },
    Object.assign(new ContextContainer(), authorizedContext()),
    authorizedContext({
      auth: {
        organizationId: 'org_projection_001',
      },
    }),
    authorizedContext({
      access: {
        publicationAllowed: true,
      },
    }),
    authorizedContext({
      raw: {
        customerAccessContext: 'raw_context_should_not_leak',
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
    assert.equal(JSON.stringify(output).includes('should_not_leak'), false);
    assertNoSensitiveLeak(output);
  }

  assert.equal(dbClient.calls.length, 0);
});

test('customerAccessContext policy flags require exact booleans', async () => {
  const dbClient = createDbClient([reportRow()]);
  const invalidBooleanValues = ['true', 'false', '1', '0', 1, 0, 'yes', 'no', null, undefined];

  for (const key of [
    'organizationScopeMatched',
    'customerIdentityVerified',
    'caseLinkedToCustomer',
    'publicationAllowed',
    'customerVisiblePolicyPassed',
  ]) {
    for (const value of [...invalidBooleanValues, false]) {
      const output = await getCustomerServiceReportProjection({
        dbClient,
        customerAccessContext: authorizedContext({ [key]: value }),
        caseId: 'case_projection_001',
        reportId: 'report_public_projection_001',
      });

      assertSafeDeny(output);
      assertNoSensitiveLeak(output);
    }
  }

  assert.equal(dbClient.calls.length, 0);
});

test('customerAccessContext ID fields require safe strings only', async () => {
  const dbClient = createDbClient([reportRow()]);
  const invalidIds = [
    undefined,
    null,
    '',
    '   ',
    123,
    true,
    ['context_id_array_should_not_leak'],
    { id: 'context_id_object_should_not_leak' },
    '../case_projection_001',
    "case_projection_001' or '1'='1",
    'case_projection_001;select secret',
    'Bearer token_should_not_leak',
    'headers.authorization',
  ];

  for (const key of ['organizationId', 'customerId', 'caseId']) {
    for (const value of invalidIds) {
      const output = await getCustomerServiceReportProjection({
        dbClient,
        customerAccessContext: authorizedContext({ [key]: value }),
        caseId: 'case_projection_001',
        reportId: 'report_public_projection_001',
      });

      assertSafeDeny(output);
      assert.equal(JSON.stringify(output).includes('should_not_leak'), false);
      assertNoSensitiveLeak(output);
    }
  }

  assert.equal(dbClient.calls.length, 0);
});

test('customerAccessContext unknown raw fields fail closed without leaking values', async () => {
  const rawContextFields = {
    request: 'raw_request_should_not_leak',
    auth: { token: 'auth_token_should_not_leak' },
    user: { id: 'user_should_not_leak' },
    session: { id: 'session_should_not_leak' },
    headers: { authorization: 'authorization_should_not_leak' },
    cookies: { session: 'cookies_should_not_leak' },
    token: 'token_should_not_leak',
    line_user_id: 'line_user_id_should_not_leak',
    customer_phone_raw: 'customer_phone_raw_should_not_leak',
    customer_address_raw: 'customer_address_raw_should_not_leak',
    provider_payload: 'provider_payload_should_not_leak',
    raw_payload: 'raw_payload_should_not_leak',
    debug: { sql: 'select secret' },
    sql: 'select secret',
    internal_notes: 'internal_notes_should_not_leak',
  };
  const dbClient = createDbClient([reportRow()]);
  const output = await getCustomerServiceReportProjection({
    dbClient,
    customerAccessContext: authorizedContext(rawContextFields),
    caseId: 'case_projection_001',
    reportId: 'report_public_projection_001',
  });
  const serialized = JSON.stringify(output);

  assertSafeDeny(output);
  for (const value of [
    'raw_request_should_not_leak',
    'auth_token_should_not_leak',
    'user_should_not_leak',
    'session_should_not_leak',
    'authorization_should_not_leak',
    'cookies_should_not_leak',
    'token_should_not_leak',
    'line_user_id_should_not_leak',
    'customer_phone_raw_should_not_leak',
    'customer_address_raw_should_not_leak',
    'provider_payload_should_not_leak',
    'raw_payload_should_not_leak',
    'select secret',
    'internal_notes_should_not_leak',
  ]) {
    assert.equal(serialized.includes(value), false, `response leaked raw context value ${value}`);
  }
  assertNoSensitiveLeak(output);
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
      customerIdentityVerified: false,
    }),
    caseId: 'case_projection_001',
    reportId: 'report_public_projection_001',
  });
  const mismatchedCaseOutput = await getCustomerServiceReportProjection({
    dbClient,
    customerAccessContext: authorizedContext({
      caseId: 'case_other_001',
    }),
    caseId: 'case_projection_001',
    reportId: 'report_public_projection_001',
  });

  assertSafeDeny(unauthorizedOutput);
  assertSafeDeny(mismatchedCaseOutput);
  assert.equal(JSON.stringify(mismatchedCaseOutput).includes('case_other_001'), false);
  assertNoSensitiveLeak(unauthorizedOutput);
  assertNoSensitiveLeak(mismatchedCaseOutput);
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

test('multiple DB result rows fail closed without projecting the first row', async () => {
  const firstRowSummary = 'first_row_summary_should_not_leak';
  const duplicateRowSummary = 'duplicate_row_summary_should_not_leak';
  const dbClient = createDbClient([
    reportRow({
      approved_service_summary: firstRowSummary,
    }),
    reportRow({
      public_report_id: 'report_public_projection_001',
      approved_service_summary: duplicateRowSummary,
    }),
  ]);
  const output = await getCustomerServiceReportProjection({
    dbClient,
    customerAccessContext: authorizedContext(),
    caseId: 'case_projection_001',
    reportId: 'report_public_projection_001',
  });
  const serialized = JSON.stringify(output);

  assertSafeDeny(output);
  assert.equal(serialized.includes(firstRowSummary), false);
  assert.equal(serialized.includes(duplicateRowSummary), false);
  assert.equal(serialized.includes('2'), false);
  assertNoSensitiveLeak(output);
  assert.equal(dbClient.calls.length, 1);
});

test('malformed DB result shapes fail closed without raw result leak', async () => {
  class ResultContainer {}

  const malformedRow = {
    then() {},
    approved_service_summary: 'malformed_row_summary_should_not_leak',
  };
  const malformedResults = [
    null,
    undefined,
    [reportRow({ approved_service_summary: 'array_direct_summary_should_not_leak' })],
    'db_result_string_should_not_leak',
    123,
    true,
    new Date('2026-05-21T04:00:00.000Z'),
    new Error('db_result_error_should_not_leak'),
    Buffer.from('db_result_buffer_should_not_leak'),
    Object.assign(new ResultContainer(), {
      rows: [reportRow({ approved_service_summary: 'class_result_summary_should_not_leak' })],
    }),
    {},
    { rows: null, raw: 'null_rows_should_not_leak' },
    { rows: {}, raw: 'object_rows_should_not_leak' },
    { rows: 'rows_string_should_not_leak' },
    { rows: [malformedRow] },
  ];

  for (const result of malformedResults) {
    const dbClient = createDbClient([], { result });
    const output = await getCustomerServiceReportProjection({
      dbClient,
      customerAccessContext: authorizedContext(),
      caseId: 'case_projection_001',
      reportId: 'report_public_projection_001',
    });
    const serialized = JSON.stringify(output);

    assertSafeDeny(output);
    assert.equal(serialized.includes('should_not_leak'), false);
    assertNoSensitiveLeak(output);
    assert.equal(dbClient.calls.length, 1);
  }
});

test('DB driver metadata is ignored and never leaks into response JSON', async () => {
  const dbClient = createDbClient([], {
    result: {
      rows: [reportRow()],
      rowCount: 'row_count_should_not_leak',
      fields: [{ name: 'fields_should_not_leak' }],
      command: 'command_should_not_leak',
      oid: 'oid_should_not_leak',
      queryText: 'select sql_should_not_leak',
      parameters: ['parameter_should_not_leak'],
      debug: 'debug_should_not_leak',
      stack: 'stack_should_not_leak',
      sql: 'sql_should_not_leak',
      rawRow: 'raw_row_should_not_leak',
      dbRow: 'db_row_should_not_leak',
      payload: 'payload_should_not_leak',
      result: 'result_should_not_leak',
    },
  });
  const output = await getCustomerServiceReportProjection({
    dbClient,
    customerAccessContext: authorizedContext(),
    caseId: 'case_projection_001',
    reportId: 'report_public_projection_001',
  });
  const serialized = JSON.stringify(output);

  assert.equal(output.status, 'allow');
  assertStableAllowEnvelopeShape(output);
  for (const forbiddenValue of [
    'row_count_should_not_leak',
    'fields_should_not_leak',
    'command_should_not_leak',
    'oid_should_not_leak',
    'sql_should_not_leak',
    'parameter_should_not_leak',
    'debug_should_not_leak',
    'stack_should_not_leak',
    'raw_row_should_not_leak',
    'db_row_should_not_leak',
    'payload_should_not_leak',
    'result_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbiddenValue), false, `response leaked ${forbiddenValue}`);
  }
  assertNoSensitiveLeak(output);
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

test('malformed projection row containers fail closed with safe deny envelope', async () => {
  class ReportRowContainer {}

  const promiseRow = Promise.resolve(reportRow({
    approved_service_summary: 'promise_row_summary_should_not_leak',
  }));
  promiseRow.organization_id = 'org_projection_001';
  promiseRow.customer_id = 'customer_projection_001';
  promiseRow.case_id = 'case_projection_001';
  promiseRow.public_report_id = 'report_public_projection_001';
  promiseRow.publication_allowed = true;
  promiseRow.publication_state = 'published';
  promiseRow.customer_visible_policy_passed = true;
  promiseRow.approved_service_summary = 'promise_direct_summary_should_not_leak';

  const malformedRows = [
    null,
    undefined,
    ['array_row_summary_should_not_leak'],
    'string_row_summary_should_not_leak',
    42,
    true,
    Object.assign(new Date('2026-05-21T04:00:00.000Z'), reportRow({
      approved_service_summary: 'date_row_summary_should_not_leak',
    })),
    Object.assign(new Error('error_row_message_should_not_leak'), reportRow({
      approved_service_summary: 'error_row_summary_should_not_leak',
    })),
    Object.assign(Buffer.from('buffer_row_value_should_not_leak'), reportRow({
      approved_service_summary: 'buffer_row_summary_should_not_leak',
    })),
    promiseRow,
    Object.assign(new ReportRowContainer(), reportRow({
      approved_service_summary: 'class_row_summary_should_not_leak',
    })),
    {
      ...reportRow({
        approved_service_summary: 'thenable_row_summary_should_not_leak',
      }),
      then() {},
    },
  ];

  for (const malformedRow of malformedRows) {
    const dbClient = createDbClient([malformedRow]);
    const output = await getCustomerServiceReportProjection({
      dbClient,
      customerAccessContext: authorizedContext(),
      caseId: 'case_projection_001',
      reportId: 'report_public_projection_001',
    });

    assertSafeDeny(output);
    assertNoSensitiveLeak(output);
    assert.equal(JSON.stringify(output).includes('should_not_leak'), false);
  }
});

test('projection does not unwrap unsafe row wrapper containers', async () => {
  const wrapperNames = [
    'row',
    'rows',
    'data',
    'payload',
    'result',
    'report',
    'reportRow',
    'serviceReport',
    'raw',
    'rawRow',
    'dbRow',
  ];
  const rows = wrapperNames.map((wrapperName) => ({
    [wrapperName]: reportRow({
      approved_service_summary: `${wrapperName}_wrapper_summary_should_not_leak`,
      completion_time: '2026-05-21T04:00:00.000Z',
      internal_notes: `${wrapperName}_wrapper_internal_notes_should_not_leak`,
      provider_payload: `${wrapperName}_wrapper_provider_payload_should_not_leak`,
      token: `${wrapperName}_wrapper_token_should_not_leak`,
      storage_key: `${wrapperName}_wrapper_storage_key_should_not_leak`,
    }),
  }));
  const dbClient = createDbClient(rows);
  const output = await getCustomerServiceReportProjection({
    dbClient,
    customerAccessContext: authorizedContext(),
    caseId: 'case_projection_001',
    reportId: 'report_public_projection_001',
  });
  const serialized = JSON.stringify(output);

  assertSafeDeny(output);
  for (const wrapperName of wrapperNames) {
    assert.equal(
      serialized.includes(`${wrapperName}_wrapper_`),
      false,
      `response leaked nested wrapper value from ${wrapperName}`,
    );
  }
  assertNoSensitiveLeak(output);
});

test('authorized context denies unknown fields raw containers and row passthrough', async () => {
  const forbiddenValues = [
    'unknown_field_should_not_leak',
    'future_public_field_should_not_leak',
    'raw_container_should_not_leak',
    'payload_container_should_not_leak',
    'report_row_container_should_not_leak',
    'data_row_container_should_not_leak',
  ];
  const dbClient = createDbClient([
    reportRow({
      unknown_future_field: 'unknown_field_should_not_leak',
      futurePublicField: 'future_public_field_should_not_leak',
      row: { secret: 'raw_container_should_not_leak' },
      raw: { secret: 'raw_container_should_not_leak' },
      payload: { secret: 'payload_container_should_not_leak' },
      reportRow: { secret: 'report_row_container_should_not_leak' },
      data: {
        row: {
          secret: 'data_row_container_should_not_leak',
        },
      },
    }),
  ]);
  const output = await getCustomerServiceReportProjection({
    dbClient,
    customerAccessContext: authorizedContext(),
    caseId: 'case_projection_001',
    reportId: 'report_public_projection_001',
  });
  const serialized = JSON.stringify(output);
  const serviceReportKeys = Object.keys(output.data.serviceReport).sort();
  const allKeys = collectObjectKeys(output);

  assert.equal(output.status, 'allow');
  assert.deepEqual(serviceReportKeys, [
    'appointmentWindow',
    'caseReference',
    'completionTime',
    'customerReportReference',
    'engineerDisplayName',
    'publicAttachments',
    'serviceStatus',
    'serviceSummary',
  ].sort());
  assert.equal(Object.prototype.hasOwnProperty.call(output.data, 'row'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(output.data, 'reportRow'), false);

  for (const forbiddenKey of [
    'unknown_future_field',
    'futurePublicField',
    'row',
    'raw',
    'payload',
    'reportRow',
  ]) {
    assert.equal(allKeys.includes(forbiddenKey), false, `response leaked key ${forbiddenKey}`);
  }

  for (const forbiddenValue of forbiddenValues) {
    assert.equal(
      serialized.includes(forbiddenValue),
      false,
      `response leaked unknown/raw value ${forbiddenValue}`,
    );
  }

  assertNoSensitiveLeak(output);
});

test('authorized context denies explicit internal private debug and identity row fields', async () => {
  const forbiddenValues = [
    'internal_notes_should_not_leak',
    'engineer_notes_should_not_leak',
    'diagnosis_notes_should_not_leak',
    'completion_notes_should_not_leak',
    'private_report_body_should_not_leak',
    'ai_draft_summary_should_not_leak',
    'ai_generated_summary_should_not_leak',
    'provider_payload_should_not_leak',
    'raw_payload_should_not_leak',
    'debug_should_not_leak',
    'stack_should_not_leak',
    'sql_should_not_leak',
    'token_should_not_leak',
    'authorization_should_not_leak',
    'headers_should_not_leak',
    'customer_phone_raw_should_not_leak',
    'customer_address_raw_should_not_leak',
    'line_user_should_not_leak',
  ];
  const dbClient = createDbClient([
    reportRow({
      internal_notes: 'internal_notes_should_not_leak',
      engineer_notes: 'engineer_notes_should_not_leak',
      diagnosis_notes: 'diagnosis_notes_should_not_leak',
      completion_notes: 'completion_notes_should_not_leak',
      private_report_body: 'private_report_body_should_not_leak',
      ai_draft_summary: 'ai_draft_summary_should_not_leak',
      ai_generated_summary: 'ai_generated_summary_should_not_leak',
      provider_payload: 'provider_payload_should_not_leak',
      raw_payload: 'raw_payload_should_not_leak',
      debug: 'debug_should_not_leak',
      stack: 'stack_should_not_leak',
      sql: 'sql_should_not_leak',
      token: 'token_should_not_leak',
      authorization: 'authorization_should_not_leak',
      headers: { authorization: 'headers_should_not_leak' },
      customer_phone_raw: 'customer_phone_raw_should_not_leak',
      customer_address_raw: 'customer_address_raw_should_not_leak',
      line_user_id: 'line_user_should_not_leak',
    }),
  ]);
  const output = await getCustomerServiceReportProjection({
    dbClient,
    customerAccessContext: authorizedContext(),
    caseId: 'case_projection_001',
    reportId: 'report_public_projection_001',
  });
  const serialized = JSON.stringify(output);
  const allKeys = collectObjectKeys(output);

  assert.equal(output.status, 'allow');
  assertStableAllowEnvelopeShape(output);

  for (const forbiddenKey of [
    'internal_notes',
    'engineer_notes',
    'diagnosis_notes',
    'completion_notes',
    'private_report_body',
    'ai_draft_summary',
    'ai_generated_summary',
    'provider_payload',
    'raw_payload',
    'debug',
    'stack',
    'sql',
    'token',
    'authorization',
    'headers',
    'customer_phone_raw',
    'customer_address_raw',
    'line_user_id',
  ]) {
    assert.equal(allKeys.includes(forbiddenKey), false, `response leaked key ${forbiddenKey}`);
  }

  for (const forbiddenValue of forbiddenValues) {
    assert.equal(
      serialized.includes(forbiddenValue),
      false,
      `response leaked internal/private value ${forbiddenValue}`,
    );
  }

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
  for (const attachment of output.data.serviceReport.publicAttachments) {
    assertOnlyPublicAttachmentKeys(attachment);
  }
  assertNoSensitiveLeak(output);
});

test('publicAttachments deny unknown raw storage provider and private item fields', async () => {
  const forbiddenAttachmentFields = {
    arbitraryUnknownAttachmentProperty: 'unknown_attachment_field_should_not_leak',
    storage_key: 'storage_key_snake_should_not_leak',
    storageKey: 'storage_key_camel_should_not_leak',
    bucket: 'bucket_should_not_leak',
    internal_path: 'internal_path_snake_should_not_leak',
    internalPath: 'internal_path_camel_should_not_leak',
    local_path: 'local_path_snake_should_not_leak',
    localPath: 'local_path_camel_should_not_leak',
    signedUrl: 'https://signed.example.invalid/secret',
    upload_token: 'upload_token_snake_should_not_leak',
    uploadToken: 'upload_token_camel_should_not_leak',
    token: 'token_should_not_leak',
    authorization: 'authorization_should_not_leak',
    headers: 'headers_should_not_leak',
    checksum: 'checksum_should_not_leak',
    sha256: 'sha256_should_not_leak',
    md5: 'md5_should_not_leak',
    uploader_user_id: 'uploader_user_id_should_not_leak',
    uploaderUserId: 'uploader_user_id_camel_should_not_leak',
    engineer_user_id: 'engineer_user_id_should_not_leak',
    engineerUserId: 'engineer_user_id_camel_should_not_leak',
    line_user_id: 'line_user_id_should_not_leak',
    provider_payload: 'provider_payload_should_not_leak',
    providerPayload: 'provider_payload_camel_should_not_leak',
    raw_payload: 'raw_payload_should_not_leak',
    rawPayload: 'raw_payload_camel_should_not_leak',
    debug: 'debug_should_not_leak',
    stack: 'stack should not leak',
    sql: 'select secret',
    internal_notes: 'internal_notes_should_not_leak',
    private_report_body: 'private_report_body_should_not_leak',
  };
  const dbClient = createDbClient([
    reportRow({
      publicAttachments: [
        {
          attachmentId: 'att_visible_001',
          label: 'Visible photo',
          mimeType: 'image/jpeg',
          customerVisible: true,
          ...forbiddenAttachmentFields,
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

  assert.equal(output.status, 'allow');
  assert.deepEqual(output.data.serviceReport.publicAttachments, [
    {
      attachmentId: 'att_visible_001',
      label: 'Visible photo',
      mimeType: 'image/jpeg',
    },
  ]);
  assertOnlyPublicAttachmentKeys(output.data.serviceReport.publicAttachments[0]);

  const serialized = JSON.stringify(output);
  for (const value of Object.values(forbiddenAttachmentFields)) {
    assert.equal(serialized.includes(value), false, `response leaked attachment value ${value}`);
  }

  const allKeys = collectObjectKeys(output);
  for (const key of Object.keys(forbiddenAttachmentFields)) {
    assert.equal(allKeys.includes(key), false, `response leaked attachment key ${key}`);
  }
  assertNoSensitiveLeak(output);
});

test('invalid publicAttachments collections are omitted without placeholders', async () => {
  for (const publicAttachments of [
    undefined,
    null,
    {},
    'not-array',
    42,
    [],
    [
      null,
      42,
      'invalid_attachment_should_not_leak',
      ['nested_array_attachment_should_not_leak'],
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
      approved_service_summary: '',
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

test('authorized context emits completionTime only from completion_time source', async () => {
  const dbClient = createDbClient([
    reportRow({
      completion_time: '2026-05-21T04:00:00.000Z',
      completionTime: 'completion_time_camel_should_not_leak',
      completed_at: 'completed_at_should_not_leak',
    }),
  ]);
  const output = await getCustomerServiceReportProjection({
    dbClient,
    customerAccessContext: authorizedContext(),
    caseId: 'case_projection_001',
    reportId: 'report_public_projection_001',
  });
  const serialized = JSON.stringify(output);

  assert.equal(output.status, 'allow');
  assert.equal(output.data.serviceReport.completionTime, '2026-05-21T04:00:00.000Z');
  assert.equal(
    serialized.includes('completion_time_camel_should_not_leak'),
    false,
  );
  assert.equal(serialized.includes('completed_at_should_not_leak'), false);
  assertNoSensitiveLeak(output);
});

test('authorized context omits malformed completion time values', async () => {
  for (const completion_time of [
    null,
    undefined,
    '',
    '   ',
    123,
    true,
    ['completion_time_array_should_not_leak'],
    { value: 'completion_time_object_should_not_leak' },
    '2026-02-30T04:00:00.000Z',
    '2026-13-21T04:00:00.000Z',
    '2026-00-21T04:00:00.000Z',
    '2026-05-21T24:00:00.000Z',
    '2026-05-21T04:60:00.000Z',
    '2026-05-21T04:00:60.000Z',
    'not-a-date completion_time_token_should_not_leak',
    'select secret from cases',
    'stack trace\n    at internal.handler (/srv/app.js:1:1)',
    'Authorization: Bearer completion_time_token_should_not_leak',
    'provider payload should not leak',
  ]) {
    const dbClient = createDbClient([
      reportRow({
        completion_time,
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
  }
});

test('authorized context does not fall back to internal timestamp fields for completionTime', async () => {
  const fallbackTimestampFields = {
    completionTime: '2026-05-22T04:00:00.000Z',
    completed_at: '2026-05-23T04:00:00.000Z',
    created_at: '2026-05-24T04:00:00.000Z',
    updated_at: '2026-05-25T04:00:00.000Z',
    deleted_at: '2026-05-26T04:00:00.000Z',
    approved_at: '2026-05-27T04:00:00.000Z',
    published_at: '2026-05-28T04:00:00.000Z',
    submitted_at: '2026-05-29T04:00:00.000Z',
    generated_at: '2026-05-30T04:00:00.000Z',
    internal_completed_at: '2026-05-31T04:00:00.000Z',
    engineer_completed_at: '2026-06-01T04:00:00.000Z',
    report_created_at: '2026-06-02T04:00:00.000Z',
    report_updated_at: '2026-06-03T04:00:00.000Z',
    appointment_start_time: '2026-06-04T04:00:00.000Z',
    appointment_end_time: '2026-06-05T04:00:00.000Z',
    arbitrary_timestamp: '2026-06-06T04:00:00.000Z',
    arbitrary_time: '2026-06-07T04:00:00.000Z',
  };
  const dbClient = createDbClient([
    reportRow({
      completion_time: undefined,
      ...fallbackTimestampFields,
    }),
  ]);
  const output = await getCustomerServiceReportProjection({
    dbClient,
    customerAccessContext: authorizedContext(),
    caseId: 'case_projection_001',
    reportId: 'report_public_projection_001',
  });
  const serialized = JSON.stringify(output);
  const allKeys = collectObjectKeys(output);

  assert.equal(output.status, 'allow');
  assert.equal(
    Object.prototype.hasOwnProperty.call(output.data.serviceReport, 'completionTime'),
    false,
  );
  for (const [key, value] of Object.entries(fallbackTimestampFields)) {
    assert.equal(serialized.includes(value), false, `response leaked fallback timestamp ${key}`);
    assert.equal(allKeys.includes(key), false, `response leaked fallback timestamp key ${key}`);
  }
  assertNoSensitiveLeak(output);
});

test('authorized context trims approved service summary before customer display', async () => {
  const dbClient = createDbClient([
    reportRow({
      approved_service_summary: ' Safe completed repair summary ',
    }),
  ]);
  const output = await getCustomerServiceReportProjection({
    dbClient,
    customerAccessContext: authorizedContext(),
    caseId: 'case_projection_001',
    reportId: 'report_public_projection_001',
  });

  assert.equal(output.status, 'allow');
  assert.equal(output.data.serviceReport.serviceSummary, 'Safe completed repair summary');
  assertNoSensitiveLeak(output);
});

test('authorized context ignores legacy service summary fields and only emits approved source', async () => {
  const dbClient = createDbClient([
    reportRow({
      serviceSummary: 'legacy_service_summary_should_not_leak',
      service_summary: 'legacy_service_summary_column_should_not_leak',
      approved_service_summary: 'Approved customer-safe service summary',
    }),
  ]);
  const output = await getCustomerServiceReportProjection({
    dbClient,
    customerAccessContext: authorizedContext(),
    caseId: 'case_projection_001',
    reportId: 'report_public_projection_001',
  });

  assert.equal(output.status, 'allow');
  assert.equal(output.data.serviceReport.serviceSummary, 'Approved customer-safe service summary');
  assertNoSensitiveLeak(output);
});

test('authorized context omits serviceSummary when approved source is absent', async () => {
  const dbClient = createDbClient([
    reportRow({
      serviceSummary: 'legacy_service_summary_should_not_leak',
      service_summary: 'legacy_service_summary_column_should_not_leak',
      approved_service_summary: undefined,
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
    Object.prototype.hasOwnProperty.call(output.data.serviceReport, 'serviceSummary'),
    false,
  );
  assertNoSensitiveLeak(output);
});

test('authorized context omits unsafe approved service summary strings', async () => {
  for (const unsafeSummary of [
    'select secret from cases',
    'Authorization: Bearer token_should_not_leak',
    'stack trace\n    at internal.handler (/srv/app.js:1:1)',
    'provider payload should not leak',
    'engineer note should not leak',
    'AI draft summary should not leak',
    'completion note should not leak',
    'diagnosis note should not leak',
    'private report body should not leak',
  ]) {
    const dbClient = createDbClient([
      reportRow({
        approved_service_summary: unsafeSummary,
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
      Object.prototype.hasOwnProperty.call(output.data.serviceReport, 'serviceSummary'),
      false,
    );
    assert.equal(JSON.stringify(output).includes(unsafeSummary), false);
    assertNoSensitiveLeak(output);
  }
});

test('authorized context omits non-string approved service summary values', async () => {
  for (const approved_service_summary of [
    null,
    undefined,
    123,
    true,
    ['array summary should not leak'],
    { text: 'object summary should not leak' },
  ]) {
    const dbClient = createDbClient([
      reportRow({
        approved_service_summary,
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
      Object.prototype.hasOwnProperty.call(output.data.serviceReport, 'serviceSummary'),
      false,
    );
    assertNoSensitiveLeak(output);
  }
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

test('authorized context requires canonical public report id for row match', async () => {
  const dbClient = createDbClient([
    reportRow({
      public_report_id: undefined,
      publicReportId: undefined,
      customerReportReference: 'report_public_projection_001',
    }),
  ]);
  const output = await getCustomerServiceReportProjection({
    dbClient,
    customerAccessContext: authorizedContext(),
    caseId: 'case_projection_001',
    reportId: 'report_public_projection_001',
  });

  assertSafeDeny(output);
  assert.equal(dbClient.calls.length, 1);
});

test('publication state guard allows only explicit customer-published state before query', async () => {
  const dbClient = createDbClient([reportRow()]);

  for (const customerAccessContext of [
    authorizedContext({
      publicationAllowed: false,
    }),
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
      customerVisiblePolicyPassed: false,
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
  assertQueryValuesAreExpectedPrimitives(dbClient.calls[0]);
});

test('valid query invocation uses stable config shape and validated primitive values only', async () => {
  const dbClient = createDbClient([reportRow()]);
  const output = await getCustomerServiceReportProjection({
    dbClient,
    customerAccessContext: authorizedContext({
      headers: { authorization: 'Bearer context_header_should_not_bind' },
      rawPayload: { token: 'context_payload_should_not_bind' },
    }),
    caseId: 'case_projection_001',
    reportId: 'report_public_projection_001',
    request: { headers: { authorization: 'Bearer request_header_should_not_bind' } },
    headers: { authorization: 'Bearer top_level_header_should_not_bind' },
    body: { token: 'body_token_should_not_bind' },
    query: { sql: 'query_sql_should_not_bind' },
    params: { id: 'params_should_not_bind' },
    user: { id: 'user_should_not_bind' },
    session: { id: 'session_should_not_bind' },
    provider_payload: { id: 'provider_payload_should_not_bind' },
    raw_payload: { id: 'raw_payload_should_not_bind' },
    debug: { id: 'debug_should_not_bind' },
  });

  assert.equal(output.status, 'deny');
  assert.equal(dbClient.callArgs.length, 0);

  const validDbClient = createDbClient([reportRow()]);
  const validOutput = await getCustomerServiceReportProjection({
    dbClient: validDbClient,
    customerAccessContext: authorizedContext(),
    caseId: 'case_projection_001',
    reportId: 'report_public_projection_001',
  });

  assert.equal(validOutput.status, 'allow');
  assert.equal(validDbClient.callArgs.length, 1);
  assert.equal(validDbClient.callArgs[0].length, 1);

  const [querySpec] = validDbClient.callArgs[0];

  assert.deepEqual(Object.keys(querySpec).sort(), ['name', 'readOnly', 'text', 'values']);
  assert.equal(querySpec.name, 'customerServiceReportProjection');
  assert.equal(querySpec.readOnly, true);
  assert.match(querySpec.text, /^select /i);
  assert.match(querySpec.text, /where organization_id = \$1 and customer_id = \$2 and case_id = \$3 and public_report_id = \$4/);
  assert.equal(Object.isFrozen(querySpec), true);
  assert.equal(Array.isArray(querySpec.values), true);
  assert.equal(Object.isFrozen(querySpec.values), true);
  assertQueryValuesAreExpectedPrimitives(querySpec);

  for (const value of querySpec.values) {
    assert.equal(value && typeof value === 'object', false);
    assert.equal(typeof value === 'function', false);
  }
  assertNoForbiddenFragments(validOutput, [
    'context_header_should_not_bind',
    'context_payload_should_not_bind',
    'request_header_should_not_bind',
    'top_level_header_should_not_bind',
    'body_token_should_not_bind',
    'query_sql_should_not_bind',
    'params_should_not_bind',
    'user_should_not_bind',
    'session_should_not_bind',
    'provider_payload_should_not_bind',
    'raw_payload_should_not_bind',
    'debug_should_not_bind',
  ]);
});

test('dbClient query throws fail closed without raw error leak', async () => {
  const rawError = new Error([
    'select * from customer_visible_service_reports where token = $1',
    'database host db.internal.example table customer_visible_service_reports',
    'Authorization: Bearer token_should_not_leak',
    'parameter case_projection_001 report_public_projection_001',
  ].join(' '));
  rawError.code = 'DB_DRIVER_CODE_SHOULD_NOT_LEAK';
  rawError.detail = 'db_detail_should_not_leak';
  rawError.cause = new Error('db_cause_should_not_leak');
  rawError.stack = 'stack_should_not_leak\n    at queryProjection';
  const dbClient = createDbClient([], { throwWith: rawError });
  const output = await getCustomerServiceReportProjection({
    dbClient,
    customerAccessContext: authorizedContext(),
    caseId: 'case_projection_001',
    reportId: 'report_public_projection_001',
  });

  assertSafeDeny(output);
  assertNoSensitiveLeak(output);
  assertNoForbiddenFragments(output, [
    'customer_visible_service_reports',
    'db.internal.example',
    'DB_DRIVER_CODE_SHOULD_NOT_LEAK',
    'db_detail_should_not_leak',
    'db_cause_should_not_leak',
    'stack_should_not_leak',
    'case_projection_001',
    'report_public_projection_001',
  ]);
  assert.equal(dbClient.calls.length, 1);
});

test('dbClient query rejects fail closed without rejection reason leak', async () => {
  const rejectedError = new Error('rejected SQL select secret token_should_not_leak');
  rejectedError.stack = 'rejected_stack_should_not_leak';
  const rawRejections = [
    rejectedError,
    {
      message: 'raw_rejection_message_should_not_leak',
      sql: 'select raw_rejection_sql_should_not_leak',
      parameters: ['raw_rejection_parameter_should_not_leak'],
      stack: 'raw_rejection_stack_should_not_leak',
      token: 'raw_rejection_token_should_not_leak',
    },
    'raw_rejection_string_should_not_leak',
  ];

  for (const rejection of rawRejections) {
    const dbClient = createDbClient([], { rejectWith: rejection });
    const output = await getCustomerServiceReportProjection({
      dbClient,
      customerAccessContext: authorizedContext(),
      caseId: 'case_projection_001',
      reportId: 'report_public_projection_001',
    });

    assertSafeDeny(output);
    assertNoSensitiveLeak(output);
    assertNoForbiddenFragments(output, [
      'rejected SQL',
      'rejected_stack_should_not_leak',
      'raw_rejection_message_should_not_leak',
      'raw_rejection_sql_should_not_leak',
      'raw_rejection_parameter_should_not_leak',
      'raw_rejection_stack_should_not_leak',
      'raw_rejection_token_should_not_leak',
      'raw_rejection_string_should_not_leak',
    ]);
    assert.equal(dbClient.calls.length, 1);
  }
});

test('malformed dbClient and query shapes fail closed without raw client leak', async () => {
  class ClassDbClient {
    query() {
      throw new Error('class_db_client_query_should_not_run');
    }
  }

  let throwingGetterReadCount = 0;
  const throwingGetterDbClient = {};
  Object.defineProperty(throwingGetterDbClient, 'query', {
    get() {
      throwingGetterReadCount += 1;
      throw new Error('throwing_query_getter_should_not_leak');
    },
  });
  const promiseLikeDbClient = {
    then() {},
    query() {
      throw new Error('promise_like_query_should_not_run');
    },
  };
  const malformedDbClients = [
    undefined,
    null,
    'db_client_string_should_not_leak',
    123,
    true,
    {},
    { query: 'query_string_should_not_leak' },
    { query: null },
    throwingGetterDbClient,
    new Date('2026-05-21T04:00:00.000Z'),
    new Error('db_client_error_should_not_leak'),
    Buffer.from('db_client_buffer_should_not_leak'),
    promiseLikeDbClient,
    new ClassDbClient(),
  ];

  for (const dbClient of malformedDbClients) {
    const output = await getCustomerServiceReportProjection({
      dbClient,
      customerAccessContext: authorizedContext(),
      caseId: 'case_projection_001',
      reportId: 'report_public_projection_001',
    });

    assertSafeDeny(output);
    assertNoSensitiveLeak(output);
    assertNoForbiddenFragments(output, [
      'db_client_string_should_not_leak',
      'query_string_should_not_leak',
      'throwing_query_getter_should_not_leak',
      'db_client_error_should_not_leak',
      'db_client_buffer_should_not_leak',
      'promise_like_query_should_not_run',
      'class_db_client_query_should_not_run',
    ]);
  }

  assert.equal(throwingGetterReadCount, 1);
});

test('invalid preconditions fail before reading dbClient query', async () => {
  let queryGetterReadCount = 0;
  const dbClient = {};
  Object.defineProperty(dbClient, 'query', {
    get() {
      queryGetterReadCount += 1;
      throw new Error('invalid_precondition_query_should_not_be_read');
    },
  });

  for (const input of [
    {
      dbClient,
      customerAccessContext: undefined,
      caseId: 'case_projection_001',
      reportId: 'report_public_projection_001',
    },
    {
      dbClient,
      customerAccessContext: authorizedContext(),
      caseId: "case_projection_001' or '1'='1",
      reportId: 'report_public_projection_001',
    },
    {
      dbClient,
      customerAccessContext: authorizedContext({ caseId: 'case_projection_002' }),
      caseId: 'case_projection_001',
      reportId: 'report_public_projection_001',
    },
  ]) {
    const output = await getCustomerServiceReportProjection(input);

    assertSafeDeny(output);
    assertNoForbiddenFragments(output, ['invalid_precondition_query_should_not_be_read']);
  }

  assert.equal(queryGetterReadCount, 0);
});

test('caller service input context and row objects are not mutated', async () => {
  const row = reportRow();
  const context = authorizedContext();
  const serviceInput = {
    customerAccessContext: context,
    caseId: 'case_projection_001',
    reportId: 'report_public_projection_001',
    request: { headers: { authorization: 'Bearer caller_input_header_should_not_leak' } },
    raw_payload: { token: 'caller_input_raw_payload_should_not_leak' },
    debug: { marker: 'caller_input_debug_should_not_leak' },
  };
  const rowBefore = JSON.stringify(row);
  const contextBefore = JSON.stringify(context);
  const serviceInputBefore = JSON.stringify(serviceInput);
  const dbClient = createDbClient([row]);

  const output = await getCustomerServiceReportProjection({
    dbClient,
    ...serviceInput,
  });

  assert.equal(output.status, 'allow');
  assert.equal(JSON.stringify(row), rowBefore);
  assert.equal(JSON.stringify(context), contextBefore);
  assert.equal(JSON.stringify(serviceInput), serviceInputBefore);
  assert.equal(dbClient.callArgs.length, 1);
  assertNoForbiddenFragments(output, [
    'caller_input_header_should_not_leak',
    'caller_input_raw_payload_should_not_leak',
    'caller_input_debug_should_not_leak',
  ]);
});

test('raw context sentinel fields are untouched but fail closed before query', async () => {
  const customerAccessContext = authorizedContext({
    headers: { authorization: 'Bearer raw_context_header_should_not_leak' },
    rawPayload: { token: 'raw_context_payload_should_not_leak' },
    debug: { marker: 'raw_context_debug_should_not_leak' },
  });
  const contextBefore = JSON.stringify(customerAccessContext);
  const dbClient = createDbClient([reportRow()]);
  const output = await getCustomerServiceReportProjection({
    dbClient,
    customerAccessContext,
    caseId: 'case_projection_001',
    reportId: 'report_public_projection_001',
  });

  assertSafeDeny(output);
  assert.equal(JSON.stringify(customerAccessContext), contextBefore);
  assert.equal(dbClient.callArgs.length, 0);
  assertNoForbiddenFragments(output, [
    'raw_context_header_should_not_leak',
    'raw_context_payload_should_not_leak',
    'raw_context_debug_should_not_leak',
  ]);
});

test('dbClient query cannot mutate frozen query config or leak mutation sentinels', async () => {
  const mutationSentinels = [
    'mutated_query_name_should_not_leak',
    'mutated_query_text_should_not_leak',
    'mutated_query_value_should_not_leak',
    'mutated_query_values_array_should_not_leak',
    'mutated_query_debug_should_not_leak',
    'mutated_query_token_should_not_leak',
  ];
  let capturedQueryConfig;
  const dbClient = {
    callArgs: [],
    mutationCalls: [],
    query(queryConfig) {
      capturedQueryConfig = queryConfig;
      this.callArgs.push([queryConfig]);

      assert.equal(Object.isFrozen(queryConfig), true);
      assert.equal(Object.isFrozen(queryConfig.values), true);

      for (const mutate of [
        () => { queryConfig.name = mutationSentinels[0]; },
        () => { queryConfig.readOnly = false; },
        () => { queryConfig.text = mutationSentinels[1]; },
        () => { queryConfig.values[0] = mutationSentinels[2]; },
        () => { queryConfig.values = [mutationSentinels[3]]; },
        () => { queryConfig.debug = mutationSentinels[4]; },
        () => { queryConfig.headers = { authorization: mutationSentinels[5] }; },
      ]) {
        try {
          mutate();
        } catch (error) {
          assert.match(error.name, /TypeError/);
        }
      }

      return { rows: [reportRow()] };
    },
  };
  const output = await getCustomerServiceReportProjection({
    dbClient,
    customerAccessContext: authorizedContext(),
    caseId: 'case_projection_001',
    reportId: 'report_public_projection_001',
  });

  assert.equal(output.status, 'allow');
  assert.equal(dbClient.callArgs.length, 1);
  assert.equal(capturedQueryConfig.name, 'customerServiceReportProjection');
  assert.equal(capturedQueryConfig.readOnly, true);
  assert.match(capturedQueryConfig.text, /^select /i);
  assertQueryValuesAreExpectedPrimitives(capturedQueryConfig);
  assert.equal(Object.prototype.hasOwnProperty.call(capturedQueryConfig, 'debug'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(capturedQueryConfig, 'headers'), false);
  assertNoForbiddenFragments(output, mutationSentinels);
  assertNoForbiddenFragments(output, [
    'customerServiceReportProjection',
    'org_projection_001',
    'customer_projection_001',
    'case_projection_001',
  ]);
});

test('sequential valid calls receive distinct frozen query config and values objects', async () => {
  const callQueryConfigs = [];
  const dbClient = {
    query(queryConfig) {
      callQueryConfigs.push(queryConfig);
      const callNumber = callQueryConfigs.length;

      if (callNumber === 1) {
        try {
          queryConfig.values[2] = 'first_call_mutation_should_not_leak';
        } catch (error) {
          assert.match(error.name, /TypeError/);
        }
      }

      const [organizationId, customerId, caseId, reportId] = queryConfig.values;

      return {
        rows: [
          reportRow({
            organization_id: organizationId,
            customer_id: customerId,
            case_id: caseId,
            public_report_id: reportId,
            case_display_id: caseId,
            approved_service_summary: callNumber === 1
              ? 'First completed summary'
              : 'Second completed summary',
          }),
        ],
      };
    },
  };
  const firstOutput = await getCustomerServiceReportProjection({
    dbClient,
    customerAccessContext: authorizedContext(),
    caseId: 'case_projection_001',
    reportId: 'report_public_projection_001',
  });
  const secondOutput = await getCustomerServiceReportProjection({
    dbClient,
    customerAccessContext: authorizedContext({
      organizationId: 'org_projection_002',
      customerId: 'customer_projection_002',
      caseId: 'case_projection_002',
    }),
    caseId: 'case_projection_002',
    reportId: 'report_public_projection_002',
  });

  assert.equal(firstOutput.status, 'allow');
  assert.equal(secondOutput.status, 'allow');
  assert.equal(callQueryConfigs.length, 2);
  assert.notEqual(callQueryConfigs[0], callQueryConfigs[1]);
  assert.notEqual(callQueryConfigs[0].values, callQueryConfigs[1].values);
  assert.equal(Object.isFrozen(callQueryConfigs[0]), true);
  assert.equal(Object.isFrozen(callQueryConfigs[0].values), true);
  assert.equal(Object.isFrozen(callQueryConfigs[1]), true);
  assert.equal(Object.isFrozen(callQueryConfigs[1].values), true);
  assert.deepEqual(callQueryConfigs[0].values, [
    'org_projection_001',
    'customer_projection_001',
    'case_projection_001',
    'report_public_projection_001',
  ]);
  assert.deepEqual(callQueryConfigs[1].values, [
    'org_projection_002',
    'customer_projection_002',
    'case_projection_002',
    'report_public_projection_002',
  ]);
  assert.equal(firstOutput.data.serviceReport.serviceSummary, 'First completed summary');
  assert.equal(secondOutput.data.serviceReport.serviceSummary, 'Second completed summary');
  assertNoForbiddenFragments(firstOutput, ['first_call_mutation_should_not_leak']);
  assertNoForbiddenFragments(secondOutput, ['first_call_mutation_should_not_leak']);
});
