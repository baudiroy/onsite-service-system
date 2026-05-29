'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createCustomerServiceReportProjectionHandler,
  handleCustomerServiceReportProjectionRequest,
} = require('../../src/customerAccess/customerServiceReportProjectionHandler');

function authorizedContext(overrides = {}) {
  return {
    auth: {
      organizationId: 'org_handler_001',
      customerId: 'customer_handler_001',
      customerIdentityVerified: true,
    },
    params: {
      caseId: 'case_handler_001',
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
      caseId: 'case_handler_001',
      reportId: 'report_public_handler_001',
    },
    customerAccessContext: authorizedContext(),
    body: {
      rawPhone: '0912345678',
      rawAddress: 'No. 1 Secret Road',
      lineUserId: 'line_user_should_not_leak',
    },
    ...overrides,
  };
}

function reportRow(overrides = {}) {
  return {
    organization_id: 'org_handler_001',
    customer_id: 'customer_handler_001',
    case_id: 'case_handler_001',
    public_report_id: 'report_public_handler_001',
    publication_allowed: true,
    publication_state: 'published',
    customer_visible_policy_passed: true,
    customer_visible: true,
    case_display_id: 'CASE-HANDLER-001',
    service_status_display: 'Completed',
    appointment_window: '2026-05-22 14:00-16:00',
    engineer_display_name: 'Engineer Handler',
    service_summary: 'Customer-safe handler service summary',
    completion_time: '2026-05-22T08:00:00.000Z',
    publicAttachments: [
      {
        attachmentId: 'att_public_handler_001',
        label: 'Public service photo',
        mimeType: 'image/jpeg',
        customerVisible: true,
        signedUrl: 'https://signed.example.invalid/secret',
      },
    ],
    rawPhone: '0912345678',
    rawAddress: 'No. 1 Secret Road',
    lineUserId: 'line_user_should_not_leak',
    finalAppointmentId: 'appt_final_should_not_leak',
    internalNote: 'internal note should not leak',
    engineerOnlyNote: 'engineer_only_note_should_not_leak',
    technicianPrivateNote: 'technician note should not leak',
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
    aiRawPayload: { id: 'ai_should_not_leak' },
    billingInternalData: { amount: 999 },
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

function dbClientWithRows(rows, options = {}) {
  const calls = [];
  const mutationCalls = [];

  return {
    calls,
    mutationCalls,
    query(querySpec) {
      calls.push(querySpec);

      if (options.throwOnQuery) {
        throw new Error('database sql token_should_not_leak');
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
}

function selectListFromQuerySpec(querySpec) {
  return String(querySpec && querySpec.text || '')
    .toLowerCase()
    .split(' from ')[0];
}

function syntheticRes() {
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
  assertNoSensitiveLeak(response);
}

function assertNoSensitiveLeak(output) {
  const serialized = JSON.stringify(output);

  for (const forbidden of [
    '0912345678',
    'No. 1 Secret Road',
    'line_user_should_not_leak',
    'appt_final_should_not_leak',
    'internal note should not leak',
    'engineer_only_note_should_not_leak',
    'technician note should not leak',
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
    'projection_query_config_should_not_leak',
    'raw_projection_row_should_not_leak',
    'connector_internal_should_not_leak',
    'stack should not leak',
    'token_should_not_leak',
    'provider_should_not_leak',
    'provider_payload_should_not_leak',
    'webhook_payload_should_not_leak',
    'audit_metadata_should_not_leak',
    'ai_should_not_leak',
    'signed.example.invalid',
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
    'database sql',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `handler response leaked ${forbidden}`);
  }
}

function assertStableHandlerDtoShape(response) {
  assert.deepEqual(Object.keys(response).sort(), ['body', 'statusCode']);
  assert.deepEqual(Object.keys(response.body).sort(), [
    'customerVisible',
    'data',
    'messageKey',
    'status',
  ].sort());
  assert.deepEqual(Object.keys(response.body.data).sort(), ['serviceReport']);
  assert.deepEqual(Object.keys(response.body.data.serviceReport).sort(), [
    'appointmentWindow',
    'caseReference',
    'completionTime',
    'customerReportReference',
    'engineerDisplayName',
    'publicAttachments',
    'serviceStatus',
    'serviceSummary',
  ].sort());
  assert.deepEqual(Object.keys(response.body.data.serviceReport.publicAttachments[0]).sort(), [
    'attachmentId',
    'label',
    'mimeType',
  ].sort());
}

test('missing injected dbClient returns generic safe-deny without real DB access', async () => {
  const response = await handleCustomerServiceReportProjectionRequest({
    request: request(),
  });

  assertGenericSafeDeny(response);
});

test('missing or invalid customerAccessContext returns generic safe-deny before query', async () => {
  const dbClient = dbClientWithRows([reportRow()]);

  for (const candidate of [
    request({ customerAccessContext: undefined }),
    request({ customerAccessContext: {} }),
    request({
      customerAccessContext: authorizedContext({
        access: {
          organizationScopeMatched: true,
          caseLinkedToCustomer: true,
          publicationAllowed: true,
          customerVisiblePolicyPassed: false,
        },
      }),
    }),
  ]) {
    const response = await handleCustomerServiceReportProjectionRequest({
      request: candidate,
      dbClient,
    });

    assertGenericSafeDeny(response);
  }

  assert.equal(dbClient.calls.length, 0);
});

test('missing empty or suspicious request params return generic safe-deny before query', async () => {
  const dbClient = dbClientWithRows([reportRow()]);

  for (const params of [
    { reportId: 'report_public_handler_001' },
    { caseId: '', reportId: 'report_public_handler_001' },
    { caseId: 'case_handler_001', reportId: '' },
    { caseId: "case_handler_001' or '1'='1", reportId: 'report_public_handler_001' },
    { caseId: 'case_handler_001/../internal', reportId: 'report_public_handler_001' },
    { caseId: 'case_handler_001', reportId: 'report_public_handler_001;select secret' },
    { caseId: 'case_handler_001', reportId: '../report_public_handler_001' },
  ]) {
    const response = await handleCustomerServiceReportProjectionRequest({
      request: request({ params }),
      dbClient,
    });

    assertGenericSafeDeny(response);
  }

  assert.equal(dbClient.calls.length, 0);
});

test('query body and headers cannot supply or override route report identifiers', async () => {
  const dbClient = dbClientWithRows([reportRow()]);
  const missingRouteReportResponse = await handleCustomerServiceReportProjectionRequest({
    request: request({
      params: {
        caseId: 'case_handler_001',
      },
      query: {
        reportId: 'report_public_handler_001',
      },
      body: {
        caseId: 'case_body_override_should_not_win',
        reportId: 'report_body_override_should_not_win',
      },
      headers: {
        'x-case-id': 'case_header_override_should_not_win',
        'x-report-id': 'report_header_override_should_not_win',
      },
    }),
    dbClient,
  });

  assertGenericSafeDeny(missingRouteReportResponse);
  assert.equal(dbClient.calls.length, 0);

  const allowResponse = await handleCustomerServiceReportProjectionRequest({
    request: request({
      query: {
        caseId: 'case_query_override_should_not_win',
        reportId: 'report_query_override_should_not_win',
      },
      body: {
        caseId: 'case_body_override_should_not_win',
        reportId: 'report_body_override_should_not_win',
      },
      headers: {
        'x-case-id': 'case_header_override_should_not_win',
        'x-report-id': 'report_header_override_should_not_win',
      },
    }),
    dbClient,
  });

  assert.equal(allowResponse.statusCode, 200);
  assert.equal(allowResponse.body.status, 'allow');
  assert.deepEqual(dbClient.calls[0].values, [
    'org_handler_001',
    'customer_handler_001',
    'case_handler_001',
    'report_public_handler_001',
  ]);
  assertNoSensitiveLeak(allowResponse);
});

test('unauthorized org mismatch and not found return generic safe-deny without existence leak', async () => {
  const mismatchDbClient = dbClientWithRows([
    reportRow({
      organization_id: 'org_other_001',
    }),
  ]);
  const notFoundDbClient = dbClientWithRows([]);

  const unauthorizedResponse = await handleCustomerServiceReportProjectionRequest({
    request: request({
      customerAccessContext: authorizedContext({
        auth: {
          organizationId: 'org_handler_001',
          customerId: 'customer_handler_001',
          customerIdentityVerified: false,
        },
      }),
    }),
    dbClient: mismatchDbClient,
  });
  const mismatchResponse = await handleCustomerServiceReportProjectionRequest({
    request: request(),
    dbClient: mismatchDbClient,
  });
  const notFoundResponse = await handleCustomerServiceReportProjectionRequest({
    request: request(),
    dbClient: notFoundDbClient,
  });

  assertGenericSafeDeny(unauthorizedResponse);
  assertGenericSafeDeny(mismatchResponse);
  assertGenericSafeDeny(notFoundResponse);
  assert.equal(mismatchDbClient.calls.length, 1);
  assert.equal(notFoundDbClient.calls.length, 1);
});

test('valid authorized request returns HTTP 200 with only Task908 safe projection allowlist', async () => {
  const dbClient = dbClientWithRows([reportRow()]);
  const response = await handleCustomerServiceReportProjectionRequest({
    request: request(),
    dbClient,
  });

  assert.deepEqual(response, {
    statusCode: 200,
    body: {
      status: 'allow',
      messageKey: 'customerAccess.serviceReport.available',
      customerVisible: true,
      data: {
        serviceReport: {
          customerReportReference: 'report_public_handler_001',
          caseReference: 'CASE-HANDLER-001',
          serviceStatus: 'Completed',
          appointmentWindow: '2026-05-22 14:00-16:00',
          engineerDisplayName: 'Engineer Handler',
          serviceSummary: 'Customer-safe handler service summary',
          completionTime: '2026-05-22T08:00:00.000Z',
          publicAttachments: [
            {
              attachmentId: 'att_public_handler_001',
              label: 'Public service photo',
              mimeType: 'image/jpeg',
            },
          ],
        },
      },
    },
  });
  assertNoSensitiveLeak(response);
  assertStableHandlerDtoShape(response);
  assert.equal(dbClient.calls.length, 1);
  assert.equal(dbClient.calls[0].readOnly, true);
});

test('valid handler response omits null empty optional DTO fields safely', async () => {
  const dbClient = dbClientWithRows([
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
      ],
    }),
  ]);
  const response = await handleCustomerServiceReportProjectionRequest({
    request: request(),
    dbClient,
  });

  assert.deepEqual(response, {
    statusCode: 200,
    body: {
      status: 'allow',
      messageKey: 'customerAccess.serviceReport.available',
      customerVisible: true,
      data: {
        serviceReport: {
          customerReportReference: 'report_public_handler_001',
        },
      },
    },
  });
  assertNoSensitiveLeak(response);
});

test('projection DB query selects internal scope and publication fields required by post-filter', async () => {
  const dbClient = dbClientWithRows([reportRow()]);
  const response = await handleCustomerServiceReportProjectionRequest({
    request: request(),
    dbClient,
  });
  const selectList = selectListFromQuerySpec(dbClient.calls[0]);

  for (const field of [
    'organization_id',
    'customer_id',
    'case_id',
    'public_report_id',
    'publication_allowed',
    'customer_visible_policy_passed',
    'publication_state',
  ]) {
    assert.match(selectList, new RegExp(`\\b${field}\\b`), `projection query should select ${field}`);
  }

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'allow');
  assertNoSensitiveLeak(response);
});

test('DB-backed projection row without explicit publication fields returns generic safe-deny', async () => {
  const {
    publication_allowed,
    customer_visible_policy_passed,
    publication_state,
    customer_visible,
    ...rowWithoutPublication
  } = reportRow();
  const dbClient = dbClientWithRows([rowWithoutPublication]);
  const response = await handleCustomerServiceReportProjectionRequest({
    request: request(),
    dbClient,
  });

  assertGenericSafeDeny(response);
  assert.equal(dbClient.calls.length, 1);
});

test('DB-backed projection row without required scope fields returns generic safe-deny', async () => {
  const {
    organization_id,
    customer_id,
    case_id,
    publication_allowed,
    customer_visible_policy_passed,
    publication_state,
    customer_visible,
    ...displayOnlyRow
  } = reportRow({
    publication_allowed: true,
    customer_visible_policy_passed: true,
    publication_state: 'published',
    customer_visible: true,
  });
  const dbClient = dbClientWithRows([displayOnlyRow]);
  const response = await handleCustomerServiceReportProjectionRequest({
    request: request(),
    dbClient,
  });

  assertGenericSafeDeny(response);
});

test('query throw returns generic safe-deny without stack SQL or raw error leakage', async () => {
  const dbClient = dbClientWithRows([reportRow()], {
    throwOnQuery: true,
  });
  const response = await handleCustomerServiceReportProjectionRequest({
    request: request(),
    dbClient,
  });

  assertGenericSafeDeny(response);
  assert.equal(dbClient.calls.length, 1);
});

test('query rejection and malformed projection result return generic safe-deny without internals', async () => {
  const rejectingDbClient = {
    calls: [],
    query(querySpec) {
      this.calls.push(querySpec);

      return Promise.reject(new Error(
        'connector_internal_should_not_leak select secret projection_query_config_should_not_leak',
      ));
    },
  };
  const malformedResultDbClient = {
    calls: [],
    query(querySpec) {
      this.calls.push(querySpec);

      return {
        row: {
          rawProjectionRow: 'raw_projection_row_should_not_leak',
          stack: 'stack should not leak',
          sql: 'select secret',
        },
      };
    },
  };

  const rejectedResponse = await handleCustomerServiceReportProjectionRequest({
    request: request(),
    dbClient: rejectingDbClient,
  });
  const malformedResponse = await handleCustomerServiceReportProjectionRequest({
    request: request(),
    dbClient: malformedResultDbClient,
  });

  assertGenericSafeDeny(rejectedResponse);
  assertGenericSafeDeny(malformedResponse);
  assert.equal(rejectingDbClient.calls.length, 1);
  assert.equal(malformedResultDbClient.calls.length, 1);
});

test('handler factory writes synthetic res status and json without listen or route registration', async () => {
  const dbClient = dbClientWithRows([reportRow()]);
  const handler = createCustomerServiceReportProjectionHandler({ dbClient });
  const res = syntheticRes();
  const body = await handler(request(), res);

  assert.equal(typeof handler, 'function');
  assert.deepEqual(res.calls.status, [200]);
  assert.equal(res.calls.json.length, 1);
  assert.deepEqual(body, res.calls.json[0]);
  assert.equal(body.status, 'allow');
  assertNoSensitiveLeak(body);
});

test('handler can return synthetic response object when no res is provided', async () => {
  const dbClient = dbClientWithRows([reportRow()]);
  const handler = createCustomerServiceReportProjectionHandler({ dbClient });
  const response = await handler(request());

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'allow');
  assertNoSensitiveLeak(response);
});

test('request context and DB row are not mutated', async () => {
  const req = request();
  const row = reportRow();
  const beforeReq = JSON.parse(JSON.stringify(req));
  const beforeRow = JSON.parse(JSON.stringify(row));
  const dbClient = dbClientWithRows([row]);

  await handleCustomerServiceReportProjectionRequest({
    request: req,
    dbClient,
  });

  assert.deepEqual(req, beforeReq);
  assert.deepEqual(row, beforeRow);
  assert.equal(row.finalAppointmentId, 'appt_final_should_not_leak');
  assert.deepEqual(dbClient.mutationCalls, []);
});
