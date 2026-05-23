'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DEFAULT_INTERNAL_ASSIGNED_APPOINTMENTS_PATH,
  registerEngineerAssignedAppointmentsRoute,
} = require('../../src/engineerMobile/engineerAssignedAppointmentsAppAdapter');

function engineerContext(overrides = {}) {
  return {
    organizationId: 'org_engineer_mobile_923',
    engineerId: 'eng_engineer_mobile_923',
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
    appointment_id: 'apt_923_001',
    case_reference: 'CASE-923-001',
    appointment_window: '2026-05-24 09:00-11:00',
    scheduled_start: '2026-05-24T01:00:00.000Z',
    scheduled_end: '2026-05-24T03:00:00.000Z',
    service_type: 'onsite',
    customer_display_name: '林○○',
    location_label: '桃園市中壢區',
    appointment_status: 'confirmed',
    priority_label: 'normal',
    organization_id: 'org_engineer_mobile_923',
    assigned_engineer_id: 'eng_engineer_mobile_923',
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

function syntheticApp(options = {}) {
  const calls = {
    get: [],
    listen: [],
  };

  return {
    calls,
    get(path, handler) {
      calls.get.push({ path, handler });

      if (options.throwOnGet) {
        throw new Error('route token_should_not_leak');
      }

      return this;
    },
    listen() {
      calls.listen.push('listen');
      throw new Error('listen should not be called');
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
    'dispatcher_note_should_not_leak',
    'billing_internal_should_not_leak',
    'settlement_internal_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'final_appointment_should_not_leak',
    'field_service_report_should_not_leak',
    'database sql',
    'route token',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `adapter output leaked ${forbidden}`);
  }
}

function safeNotRegisteredEnvelope() {
  return {
    registered: false,
    messageKey: 'engineerMobile.assignedAppointments.unavailable',
    engineerMobileVisible: false,
  };
}

test('registers exactly one GET-like handler on injected synthetic app with explicit path', () => {
  const app = syntheticApp();
  const dbClient = dbClientWithRows([row()]);
  const options = {
    app,
    dbClient,
    path: '/internal/engineer-mobile/assigned-appointments',
  };

  const result = registerEngineerAssignedAppointmentsRoute(options);

  assert.equal(result.registered, true);
  assert.equal(result.method, 'GET');
  assert.equal(result.path, '/internal/engineer-mobile/assigned-appointments');
  assert.equal(typeof result.handler, 'function');
  assert.equal(app.calls.get.length, 1);
  assert.equal(app.calls.get[0].path, '/internal/engineer-mobile/assigned-appointments');
  assert.equal(app.calls.get[0].handler, result.handler);
  assert.equal(app.calls.listen.length, 0);
  assert.equal(dbClient.calls.length, 0);
  assert.equal(options.dbClient, dbClient);
});

test('uses internal default path when explicit path is missing or blank', () => {
  for (const candidate of [undefined, '', '   ']) {
    const app = syntheticApp();
    const result = registerEngineerAssignedAppointmentsRoute({
      app,
      dbClient: dbClientWithRows([row()]),
      path: candidate,
    });

    assert.equal(result.registered, true);
    assert.equal(result.path, DEFAULT_INTERNAL_ASSIGNED_APPOINTMENTS_PATH);
    assert.equal(app.calls.get[0].path, DEFAULT_INTERNAL_ASSIGNED_APPOINTMENTS_PATH);
    assert.equal(app.calls.listen.length, 0);
  }
});

test('registered handler preserves Task922 and Task921 safe allow behavior through synthetic request', async () => {
  const app = syntheticApp();
  const dbClient = dbClientWithRows([row()]);
  const result = registerEngineerAssignedAppointmentsRoute({
    app,
    dbClient,
    path: '/internal/engineer-mobile/assigned-appointments',
  });

  const response = await app.calls.get[0].handler(request());

  assert.equal(result.registered, true);
  assert.deepEqual(response, {
    statusCode: 200,
    body: {
      status: 'allow',
      messageKey: 'engineerMobile.assignedAppointments.available',
      engineerMobileVisible: true,
      data: {
        appointments: [
          {
            appointmentId: 'apt_923_001',
            caseReference: 'CASE-923-001',
            appointmentWindow: '2026-05-24 09:00-11:00',
            scheduledStart: '2026-05-24T01:00:00.000Z',
            scheduledEnd: '2026-05-24T03:00:00.000Z',
            serviceType: 'onsite',
            customerDisplayName: '林○○',
            locationLabel: '桃園市中壢區',
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
  assert.equal(dbClient.calls.length, 1);
  assertNoSensitiveLeak(response);
});

test('missing synthetic app or router fails closed without leaking details', () => {
  const dbClient = dbClientWithRows([row()]);

  for (const candidate of [
    undefined,
    null,
    {},
    { app: {} },
    { router: {} },
    { app: { post() {} } },
  ]) {
    const result = registerEngineerAssignedAppointmentsRoute({
      ...candidate,
      dbClient,
    });

    assert.deepEqual(result, safeNotRegisteredEnvelope());
    assertNoSensitiveLeak(result);
  }

  assert.equal(dbClient.calls.length, 0);
});

test('missing injected dbClient fails closed and does not register handler', () => {
  for (const candidate of [
    undefined,
    null,
    {},
    { query: 'not function' },
  ]) {
    const app = syntheticApp();
    const result = registerEngineerAssignedAppointmentsRoute({
      app,
      dbClient: candidate,
    });

    assert.deepEqual(result, safeNotRegisteredEnvelope());
    assert.equal(app.calls.get.length, 0);
    assert.equal(app.calls.listen.length, 0);
    assertNoSensitiveLeak(result);
  }
});

test('synthetic app registration failure fails closed without raw error leak', () => {
  const app = syntheticApp({ throwOnGet: true });
  const dbClient = dbClientWithRows([row()]);

  const result = registerEngineerAssignedAppointmentsRoute({
    app,
    dbClient,
    path: '/internal/engineer-mobile/assigned-appointments',
  });

  assert.deepEqual(result, safeNotRegisteredEnvelope());
  assert.equal(app.calls.get.length, 1);
  assert.equal(app.calls.listen.length, 0);
  assert.equal(dbClient.calls.length, 0);
  assertNoSensitiveLeak(result);
});

test('router option is supported without depending on a global app', () => {
  const router = syntheticApp();
  const result = registerEngineerAssignedAppointmentsRoute({
    router,
    dbClient: dbClientWithRows([row()]),
    path: '/internal/engineer-mobile/assigned-appointments',
  });

  assert.equal(result.registered, true);
  assert.equal(router.calls.get.length, 1);
  assert.equal(router.calls.listen.length, 0);
});
