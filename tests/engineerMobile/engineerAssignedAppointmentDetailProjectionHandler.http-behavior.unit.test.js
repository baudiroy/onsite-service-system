'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createEngineerAssignedAppointmentDetailProjectionHandler,
  handleEngineerAssignedAppointmentDetailProjectionRequest,
} = require('../../src/engineerMobile/engineerAssignedAppointmentDetailProjectionHandler');

function engineerContext(overrides = {}) {
  return {
    organizationId: 'org_engineer_mobile_926',
    engineerId: 'eng_engineer_mobile_926',
    organizationScopeMatched: true,
    engineerAssignmentScopeMatched: true,
    permissions: ['engineer_mobile.assigned_appointments.read'],
    ...overrides,
  };
}

function request(overrides = {}) {
  return {
    engineerContext: engineerContext(),
    params: {
      appointmentId: 'apt_926_001',
    },
    body: {
      appointmentId: 'body_appointment_should_be_ignored',
      phone: 'raw_phone_should_not_leak',
      address: 'raw_address_should_not_leak',
      lineUserId: 'line_user_should_not_leak',
      token: 'token_should_not_leak',
      finalAppointmentId: 'final_appointment_should_not_leak',
    },
    query: {
      appointmentId: 'query_appointment_should_be_ignored',
    },
    ...overrides,
  };
}

function row(overrides = {}) {
  return {
    appointment_id: 'apt_926_001',
    case_reference: 'CASE-926-001',
    appointment_window: '2026-05-26 09:00-11:00',
    scheduled_start: '2026-05-26T01:00:00.000Z',
    scheduled_end: '2026-05-26T03:00:00.000Z',
    service_type: 'onsite',
    customer_display_name: '陳○○',
    location_label: '新北市板橋區',
    appointment_status: 'traveling',
    priority_label: 'normal',
    service_summary: '例行檢測',
    public_customer_notes: '請先電話確認大樓管理室。',
    checklist_preview: [
      {
        label: '確認保固資料',
        status: 'done',
        phone: 'raw_phone_should_not_leak',
      },
    ],
    organization_id: 'org_engineer_mobile_926',
    assigned_engineer_id: 'eng_engineer_mobile_926',
    phone: 'raw_phone_should_not_leak',
    address: 'raw_address_should_not_leak',
    lineUserId: 'line_user_should_not_leak',
    providerRawPayload: 'provider_payload_should_not_leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    internalNote: 'internal_note_should_not_leak',
    billingInternal: 'billing_internal_should_not_leak',
    aiRawPayload: 'ai_raw_payload_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    fieldServiceReportId: 'field_service_report_should_not_leak',
    completionReportId: 'completion_report_should_not_leak',
    ...overrides,
  };
}

function dbClientWithRows(rows, options = {}) {
  const calls = [];

  return {
    calls,
    query(querySpec) {
      calls.push(querySpec);

      if (options.throwOnQuery) {
        throw new Error('database sql token_should_not_leak');
      }

      return { rows };
    },
  };
}

function safeDenyBody() {
  return {
    status: 'deny',
    messageKey: 'engineerMobile.assignedAppointmentDetail.unavailable',
    engineerMobileVisible: false,
    data: {
      appointment: null,
    },
    error: {
      messageKey: 'engineerMobile.assignedAppointmentDetail.unavailable',
    },
  };
}

function assertNoSensitiveLeak(output) {
  const serialized = JSON.stringify(output);

  for (const forbidden of [
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
    'provider_payload_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'internal_note_should_not_leak',
    'billing_internal_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'final_appointment_should_not_leak',
    'field_service_report_should_not_leak',
    'completion_report_should_not_leak',
    'database sql',
    'body_appointment_should_be_ignored',
    'query_appointment_should_be_ignored',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `handler output leaked ${forbidden}`);
  }
}

test('missing injected dbClient fails closed without real DB access', async () => {
  const response = await handleEngineerAssignedAppointmentDetailProjectionRequest({
    request: request(),
  });

  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.body, safeDenyBody());
  assertNoSensitiveLeak(response);
});

test('missing or invalid engineerContext fails closed before query', async () => {
  for (const engineerContext of [undefined, null, {}, engineerContextFactory({ permissions: [] })]) {
    const dbClient = dbClientWithRows([row()]);
    const response = await handleEngineerAssignedAppointmentDetailProjectionRequest({
      request: request({ engineerContext }),
      dbClient,
    });

    assert.equal(response.statusCode, 404);
    assert.deepEqual(response.body, safeDenyBody());
    assert.equal(dbClient.calls.length, 0);
  }
});

function engineerContextFactory(overrides) {
  return engineerContext(overrides);
}

test('missing or invalid appointment id fails closed before query', async () => {
  for (const params of [{}, { appointmentId: '' }, { appointmentId: '../unsafe' }, { appointmentId: 'bad id' }]) {
    const dbClient = dbClientWithRows([row()]);
    const response = await handleEngineerAssignedAppointmentDetailProjectionRequest({
      request: request({ params }),
      dbClient,
    });

    assert.equal(response.statusCode, 404);
    assert.deepEqual(response.body, safeDenyBody());
    assert.equal(dbClient.calls.length, 0);
  }
});

test('query throw returns generic safe-deny without stack SQL or raw error leakage', async () => {
  const response = await handleEngineerAssignedAppointmentDetailProjectionRequest({
    request: request(),
    dbClient: dbClientWithRows([row()], { throwOnQuery: true }),
  });

  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.body, safeDenyBody());
  assertNoSensitiveLeak(response);
});

test('valid authorized synthetic request returns Task925 allowlist detail projection', async () => {
  const dbClient = dbClientWithRows([row()]);
  const response = await handleEngineerAssignedAppointmentDetailProjectionRequest({
    request: request(),
    dbClient,
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, {
    status: 'allow',
    messageKey: 'engineerMobile.assignedAppointmentDetail.available',
    engineerMobileVisible: true,
    data: {
      appointment: {
        appointmentId: 'apt_926_001',
        caseReference: 'CASE-926-001',
        canOpenDetails: true,
        appointmentWindow: '2026-05-26 09:00-11:00',
        scheduledStart: '2026-05-26T01:00:00.000Z',
        scheduledEnd: '2026-05-26T03:00:00.000Z',
        serviceType: 'onsite',
        customerDisplayName: '陳○○',
        locationLabel: '新北市板橋區',
        status: 'traveling',
        priorityLabel: 'normal',
        serviceSummary: '例行檢測',
        publicCustomerNotes: '請先電話確認大樓管理室。',
        checklistPreview: [
          {
            label: '確認保固資料',
            status: 'done',
          },
        ],
        canStartTravel: false,
        canRecordArrival: false,
        canPrepareCompletionDraft: false,
      },
    },
  });
  assert.equal(dbClient.calls.length, 1);
  assert.deepEqual(dbClient.calls[0].values, [
    'org_engineer_mobile_926',
    'eng_engineer_mobile_926',
    'apt_926_001',
  ]);
  assertNoSensitiveLeak(response);
});

test('wrong scope and not found return generic safe-deny', async () => {
  for (const sourceRow of [
    row({ organization_id: 'org_other' }),
    row({ assigned_engineer_id: 'eng_other' }),
    row({ appointment_id: 'apt_other' }),
  ]) {
    const response = await handleEngineerAssignedAppointmentDetailProjectionRequest({
      request: request(),
      dbClient: dbClientWithRows([sourceRow]),
    });

    assert.equal(response.statusCode, 404);
    assert.deepEqual(response.body, safeDenyBody());
    assertNoSensitiveLeak(response);
  }
});

test('handler factory writes synthetic res status and json without listen or route registration', async () => {
  const dbClient = dbClientWithRows([row()]);
  const handler = createEngineerAssignedAppointmentDetailProjectionHandler({ dbClient });
  const calls = [];
  const res = {
    status(statusCode) {
      calls.push({ type: 'status', statusCode });
      return this;
    },
    json(body) {
      calls.push({ type: 'json', body });
      return { sent: true, body };
    },
  };

  const result = await handler(request(), res);

  assert.equal(result.sent, true);
  assert.deepEqual(calls.map((entry) => entry.type), ['status', 'json']);
  assert.equal(calls[0].statusCode, 200);
  assert.equal(dbClient.calls.length, 1);
  assertNoSensitiveLeak(result);
});

test('handler can return synthetic response object when no res is provided', async () => {
  const handler = createEngineerAssignedAppointmentDetailProjectionHandler({
    dbClient: dbClientWithRows([row()]),
  });
  const response = await handler(request());

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'allow');
  assertNoSensitiveLeak(response);
});

test('request context and DB row are not mutated', async () => {
  const sourceRequest = request();
  const sourceRow = row();
  const beforeRequest = JSON.stringify(sourceRequest);
  const beforeRow = JSON.stringify(sourceRow);

  await handleEngineerAssignedAppointmentDetailProjectionRequest({
    request: sourceRequest,
    dbClient: dbClientWithRows([sourceRow]),
  });

  assert.equal(JSON.stringify(sourceRequest), beforeRequest);
  assert.equal(JSON.stringify(sourceRow), beforeRow);
});
