'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createEngineerAssignedAppointmentsProjectionHandler,
  handleEngineerAssignedAppointmentsProjectionRequest,
} = require('../../src/engineerMobile/engineerAssignedAppointmentsProjectionHandler');

function engineerContext(overrides = {}) {
  return {
    organizationId: 'org_engineer_mobile_922',
    engineerId: 'eng_engineer_mobile_922',
    organizationScopeMatched: true,
    engineerAssignmentScopeMatched: true,
    permissions: ['engineer_mobile.assigned_appointments.read'],
    ...overrides,
  };
}

function request(overrides = {}) {
  return {
    engineerContext: engineerContext(),
    query: {
      dateFrom: '2026-05-24T00:00:00.000Z',
      dateTo: '2026-05-24T23:59:59.999Z',
      status: 'confirmed',
    },
    body: {
      phone: 'raw_phone_should_not_leak',
      address: 'raw_address_should_not_leak',
      lineUserId: 'line_user_should_not_leak',
      token: 'token_should_not_leak',
      finalAppointmentId: 'final_appointment_should_not_leak',
    },
    ...overrides,
  };
}

function row(overrides = {}) {
  return {
    appointment_id: 'apt_922_001',
    case_reference: 'CASE-922-001',
    appointment_window: '2026-05-24 09:00-11:00',
    scheduled_start: '2026-05-24T01:00:00.000Z',
    scheduled_end: '2026-05-24T03:00:00.000Z',
    service_type: 'onsite',
    customer_display_name: '陳○○',
    location_label: '新北市板橋區',
    appointment_status: 'confirmed',
    priority_label: 'normal',
    organization_id: 'org_engineer_mobile_922',
    assigned_engineer_id: 'eng_engineer_mobile_922',
    phone: 'raw_phone_should_not_leak',
    address: 'raw_address_should_not_leak',
    lineUserId: 'line_user_should_not_leak',
    providerRawPayload: 'provider_payload_should_not_leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    internalNote: 'internal_note_should_not_leak',
    dispatcherNote: 'dispatcher_note_should_not_leak',
    billingInternal: 'billing_internal_should_not_leak',
    settlementInternal: 'settlement_internal_should_not_leak',
    aiRawPayload: 'ai_raw_payload_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    fieldServiceReportId: 'field_service_report_should_not_leak',
    sql: 'select secret',
    stack: 'stack should not leak',
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
        throw new Error('database sql token_should_not_leak stack should not leak');
      }

      return { rows };
    },
    insert() {
      mutationCalls.push('insert');
      throw new Error('insert must not be called');
    },
    update() {
      mutationCalls.push('update');
      throw new Error('update must not be called');
    },
    delete() {
      mutationCalls.push('delete');
      throw new Error('delete must not be called');
    },
  };
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
      messageKey: 'engineerMobile.assignedAppointments.unavailable',
      engineerMobileVisible: false,
      data: {
        appointments: [],
      },
      error: {
        messageKey: 'engineerMobile.assignedAppointments.unavailable',
      },
    },
  });
  assertNoSensitiveLeak(response);
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
    'dispatcher_note_should_not_leak',
    'billing_internal_should_not_leak',
    'settlement_internal_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'final_appointment_should_not_leak',
    'field_service_report_should_not_leak',
    'select secret',
    'stack should not leak',
    'database sql',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `handler response leaked ${forbidden}`);
  }
}

test('missing injected dbClient fails closed without real DB access', async () => {
  const response = await handleEngineerAssignedAppointmentsProjectionRequest({
    request: request(),
  });

  assertGenericSafeDeny(response);
});

test('missing or invalid engineerContext fails closed before query', async () => {
  const dbClient = dbClientWithRows([row()]);

  for (const candidate of [
    request({ engineerContext: undefined }),
    request({ engineerContext: {} }),
    request({ engineerContext: engineerContext({ permissions: [] }) }),
    request({ engineerContext: engineerContext({ engineerAssignmentScopeMatched: false }) }),
  ]) {
    const response = await handleEngineerAssignedAppointmentsProjectionRequest({
      request: candidate,
      dbClient,
    });

    assertGenericSafeDeny(response);
  }

  assert.equal(dbClient.calls.length, 0);
});

test('query throw returns generic safe-deny without stack SQL or raw error leakage', async () => {
  const dbClient = dbClientWithRows([row()], {
    throwOnQuery: true,
  });
  const response = await handleEngineerAssignedAppointmentsProjectionRequest({
    request: request(),
    dbClient,
  });

  assertGenericSafeDeny(response);
  assert.equal(dbClient.calls.length, 1);
});

test('valid authorized synthetic request returns Task921 allowlist projection', async () => {
  const dbClient = dbClientWithRows([row()]);
  const response = await handleEngineerAssignedAppointmentsProjectionRequest({
    request: request(),
    dbClient,
  });

  assert.deepEqual(response, {
    statusCode: 200,
    body: {
      status: 'allow',
      messageKey: 'engineerMobile.assignedAppointments.available',
      engineerMobileVisible: true,
      data: {
        appointments: [
          {
            appointmentId: 'apt_922_001',
            caseReference: 'CASE-922-001',
            appointmentWindow: '2026-05-24 09:00-11:00',
            scheduledStart: '2026-05-24T01:00:00.000Z',
            scheduledEnd: '2026-05-24T03:00:00.000Z',
            serviceType: 'onsite',
            customerDisplayName: '陳○○',
            locationLabel: '新北市板橋區',
            status: 'confirmed',
            canStartTravel: true,
            canRecordArrival: false,
            canPrepareCompletionDraft: false,
            priorityLabel: 'normal',
            canOpenDetails: true,
          },
        ],
      },
    },
  });
  assertNoSensitiveLeak(response);
  assert.equal(dbClient.calls.length, 1);
  assert.equal(dbClient.calls[0].readOnly, true);
  assert.deepEqual(dbClient.calls[0].values, [
    'org_engineer_mobile_922',
    'eng_engineer_mobile_922',
    '2026-05-24T00:00:00.000Z',
    '2026-05-24T23:59:59.999Z',
    'confirmed',
  ]);
  assert.deepEqual(dbClient.mutationCalls, []);
});

test('invalid date and status filters fail closed before query', async () => {
  const dbClient = dbClientWithRows([row()]);

  for (const candidate of [
    request({ query: { dateFrom: 'not-a-date' } }),
    request({ query: { dateTo: 'not-a-date' } }),
    request({ query: { status: 'confirmed;drop table appointments' } }),
  ]) {
    const response = await handleEngineerAssignedAppointmentsProjectionRequest({
      request: candidate,
      dbClient,
    });

    assertGenericSafeDeny(response);
  }

  assert.equal(dbClient.calls.length, 0);
});

test('handler factory writes synthetic res status and json without listen or route registration', async () => {
  const dbClient = dbClientWithRows([row()]);
  const handler = createEngineerAssignedAppointmentsProjectionHandler({ dbClient });
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
  const dbClient = dbClientWithRows([row()]);
  const handler = createEngineerAssignedAppointmentsProjectionHandler({ dbClient });
  const response = await handler(request());

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'allow');
  assertNoSensitiveLeak(response);
});

test('request context and DB row are not mutated', async () => {
  const req = request();
  const sourceRow = row();
  const beforeReq = JSON.parse(JSON.stringify(req));
  const beforeRow = JSON.parse(JSON.stringify(sourceRow));
  const dbClient = dbClientWithRows([sourceRow]);

  await handleEngineerAssignedAppointmentsProjectionRequest({
    request: req,
    dbClient,
  });

  assert.deepEqual(req, beforeReq);
  assert.deepEqual(sourceRow, beforeRow);
  assert.equal(sourceRow.finalAppointmentId, 'final_appointment_should_not_leak');
  assert.deepEqual(dbClient.mutationCalls, []);
});
