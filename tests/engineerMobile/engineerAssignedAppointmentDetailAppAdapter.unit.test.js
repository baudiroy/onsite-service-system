'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DEFAULT_INTERNAL_ASSIGNED_APPOINTMENT_DETAIL_PATH,
  registerEngineerAssignedAppointmentDetailRoute,
} = require('../../src/engineerMobile/engineerAssignedAppointmentDetailAppAdapter');

function engineerContext(overrides = {}) {
  return {
    organizationId: 'org_engineer_mobile_927',
    engineerId: 'eng_engineer_mobile_927',
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
      appointmentId: 'apt_927_001',
    },
    body: {
      phone: 'raw_phone_should_not_leak',
      address: 'raw_address_should_not_leak',
      token: 'token_should_not_leak',
      finalAppointmentId: 'final_appointment_should_not_leak',
    },
    ...overrides,
  };
}

function row(overrides = {}) {
  return {
    appointment_id: 'apt_927_001',
    case_reference: 'CASE-927-001',
    appointment_window: '2026-05-27 10:00-12:00',
    scheduled_start: '2026-05-27T02:00:00.000Z',
    scheduled_end: '2026-05-27T04:00:00.000Z',
    service_type: 'onsite',
    customer_display_name: '黃○○',
    location_label: '台中市西屯區',
    appointment_status: 'confirmed',
    priority_label: 'normal',
    service_summary: '設備檢查',
    public_customer_notes: '管理室可代收證件。',
    checklist_preview: [{ label: '確認工具', status: 'pending', token: 'token_should_not_leak' }],
    organization_id: 'org_engineer_mobile_927',
    assigned_engineer_id: 'eng_engineer_mobile_927',
    phone: 'raw_phone_should_not_leak',
    address: 'raw_address_should_not_leak',
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

function safeNotRegisteredEnvelope() {
  return {
    registered: false,
    messageKey: 'engineerMobile.assignedAppointmentDetail.unavailable',
    engineerMobileVisible: false,
  };
}

function assertNoSensitiveLeak(output) {
  const serialized = JSON.stringify(output);

  for (const forbidden of [
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
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
    'route token',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `adapter output leaked ${forbidden}`);
  }
}

test('registers exactly one GET-like handler on injected synthetic app with explicit path', () => {
  const app = syntheticApp();
  const dbClient = dbClientWithRows([row()]);
  const result = registerEngineerAssignedAppointmentDetailRoute({
    app,
    dbClient,
    path: '/internal/engineer-mobile/assigned-appointments/:appointmentId',
  });

  assert.equal(result.registered, true);
  assert.equal(result.method, 'GET');
  assert.equal(result.path, '/internal/engineer-mobile/assigned-appointments/:appointmentId');
  assert.equal(typeof result.handler, 'function');
  assert.equal(app.calls.get.length, 1);
  assert.equal(app.calls.get[0].handler, result.handler);
  assert.equal(app.calls.listen.length, 0);
  assert.equal(dbClient.calls.length, 0);
});

test('uses internal default path when explicit path is missing or blank', () => {
  for (const candidate of [undefined, '', '   ']) {
    const app = syntheticApp();
    const result = registerEngineerAssignedAppointmentDetailRoute({
      app,
      dbClient: dbClientWithRows([row()]),
      path: candidate,
    });

    assert.equal(result.registered, true);
    assert.equal(result.path, DEFAULT_INTERNAL_ASSIGNED_APPOINTMENT_DETAIL_PATH);
    assert.equal(app.calls.get[0].path, DEFAULT_INTERNAL_ASSIGNED_APPOINTMENT_DETAIL_PATH);
    assert.equal(app.calls.listen.length, 0);
  }
});

test('registered handler preserves Task926 and Task925 safe allow behavior through synthetic request', async () => {
  const app = syntheticApp();
  const dbClient = dbClientWithRows([row()]);
  const result = registerEngineerAssignedAppointmentDetailRoute({
    app,
    dbClient,
    path: '/internal/engineer-mobile/assigned-appointments/:appointmentId',
  });

  const response = await app.calls.get[0].handler(request());

  assert.equal(result.registered, true);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'allow');
  assert.deepEqual(response.body.data.appointment, {
    appointmentId: 'apt_927_001',
    caseReference: 'CASE-927-001',
    canOpenDetails: true,
    appointmentWindow: '2026-05-27 10:00-12:00',
    scheduledStart: '2026-05-27T02:00:00.000Z',
    scheduledEnd: '2026-05-27T04:00:00.000Z',
    serviceType: 'onsite',
    customerDisplayName: '黃○○',
    locationLabel: '台中市西屯區',
    status: 'confirmed',
    priorityLabel: 'normal',
    serviceSummary: '設備檢查',
    publicCustomerNotes: '管理室可代收證件。',
    checklistPreview: [{ label: '確認工具', status: 'pending' }],
    canStartTravel: true,
    canRecordArrival: false,
    canPrepareCompletionDraft: false,
  });
  assert.equal(dbClient.calls.length, 1);
  assertNoSensitiveLeak(response);
});

test('missing synthetic app or router fails closed without leaking details', () => {
  const dbClient = dbClientWithRows([row()]);

  for (const candidate of [undefined, null, {}, { app: {} }, { router: {} }, { app: { post() {} } }]) {
    const result = registerEngineerAssignedAppointmentDetailRoute({
      ...candidate,
      dbClient,
    });

    assert.deepEqual(result, safeNotRegisteredEnvelope());
    assertNoSensitiveLeak(result);
  }

  assert.equal(dbClient.calls.length, 0);
});

test('missing injected dbClient fails closed and does not register handler', () => {
  for (const candidate of [undefined, null, {}, { query: 'not function' }]) {
    const app = syntheticApp();
    const result = registerEngineerAssignedAppointmentDetailRoute({
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
  const result = registerEngineerAssignedAppointmentDetailRoute({
    app,
    dbClient,
  });

  assert.deepEqual(result, safeNotRegisteredEnvelope());
  assert.equal(app.calls.get.length, 1);
  assert.equal(app.calls.listen.length, 0);
  assert.equal(dbClient.calls.length, 0);
  assertNoSensitiveLeak(result);
});

test('router option is supported without depending on a global app', () => {
  const router = syntheticApp();
  const result = registerEngineerAssignedAppointmentDetailRoute({
    router,
    dbClient: dbClientWithRows([row()]),
  });

  assert.equal(result.registered, true);
  assert.equal(router.calls.get.length, 1);
  assert.equal(router.calls.listen.length, 0);
});
