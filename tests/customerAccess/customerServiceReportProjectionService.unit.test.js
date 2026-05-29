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
    dispatchNote: 'dispatch note should not leak',
    sql: 'select secret',
    stack: 'stack should not leak',
    token: 'token_should_not_leak',
    providerRawPayload: { id: 'provider_should_not_leak' },
    billingInternalData: { cost: 999 },
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
    'dispatch note should not leak',
    'select secret',
    'stack should not leak',
    'token_should_not_leak',
    'provider_should_not_leak',
    'signed.example.invalid',
    '999',
  ]) {
    assert.equal(serialized.includes(value), false, `projection leaked ${value}`);
  }
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
  assertNoSensitiveLeak(output);
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
    'technician_private_should_not_leak',
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
      technicianPrivateNote: 'technician_private_should_not_leak',
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
