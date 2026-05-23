'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  getEngineerAssignedAppointmentsProjection,
} = require('../../src/engineerMobile/engineerAssignedAppointmentsProjectionService');

function engineerContext(overrides = {}) {
  return {
    organizationId: 'org_engineer_mobile_921',
    engineerId: 'eng_engineer_mobile_921',
    organizationScopeMatched: true,
    engineerAssignmentScopeMatched: true,
    permissions: ['engineer_mobile.assigned_appointments.read'],
    ...overrides,
  };
}

function row(overrides = {}) {
  return {
    appointment_id: 'apt_921_001',
    case_reference: 'CASE-921-001',
    appointment_window: '2026-05-24 09:00-11:00',
    scheduled_start: '2026-05-24T01:00:00.000Z',
    scheduled_end: '2026-05-24T03:00:00.000Z',
    service_type: 'onsite',
    customer_display_name: '王○○',
    location_label: '台北市大安區',
    appointment_status: 'confirmed',
    priority_label: 'normal',
    organization_id: 'org_engineer_mobile_921',
    assigned_engineer_id: 'eng_engineer_mobile_921',
    phone: 'raw_phone_should_not_leak',
    mobile: 'raw_mobile_should_not_leak',
    tel: 'raw_tel_should_not_leak',
    address: 'raw_address_should_not_leak',
    line_user_id: 'line_user_should_not_leak',
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
    rawCasePayload: {
      phone: 'nested_phone_should_not_leak',
      token: 'nested_token_should_not_leak',
    },
    ...overrides,
  };
}

function syntheticDbClient(rowsOrError = [row()]) {
  const calls = [];
  const client = {
    calls,
    async query(querySpec) {
      calls.push({
        method: 'query',
        querySpec,
      });

      if (rowsOrError instanceof Error) {
        throw rowsOrError;
      }

      return {
        rows: rowsOrError,
      };
    },
    insert() {
      throw new Error('insert must not be called');
    },
    update() {
      throw new Error('update must not be called');
    },
    delete() {
      throw new Error('delete must not be called');
    },
  };

  return client;
}

function assertSafeDeny(result) {
  assert.deepEqual(result, {
    status: 'deny',
    messageKey: 'engineerMobile.assignedAppointments.unavailable',
    engineerMobileVisible: false,
    data: {
      appointments: [],
    },
    error: {
      messageKey: 'engineerMobile.assignedAppointments.unavailable',
    },
  });
}

function assertNoSensitiveLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'raw_phone_should_not_leak',
    'raw_mobile_should_not_leak',
    'raw_tel_should_not_leak',
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
    'nested_phone_should_not_leak',
    'nested_token_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test('missing dbClient fails closed', async () => {
  assertSafeDeny(await getEngineerAssignedAppointmentsProjection({
    engineerContext: engineerContext(),
  }));
  assertSafeDeny(await getEngineerAssignedAppointmentsProjection({
    dbClient: {},
    engineerContext: engineerContext(),
  }));
});

test('missing engineerContext fails closed', async () => {
  assertSafeDeny(await getEngineerAssignedAppointmentsProjection({
    dbClient: syntheticDbClient(),
  }));
});

test('missing organizationId fails closed', async () => {
  assertSafeDeny(await getEngineerAssignedAppointmentsProjection({
    dbClient: syntheticDbClient(),
    engineerContext: engineerContext({ organizationId: '' }),
  }));
});

test('missing engineerId fails closed', async () => {
  assertSafeDeny(await getEngineerAssignedAppointmentsProjection({
    dbClient: syntheticDbClient(),
    engineerContext: engineerContext({ engineerId: '' }),
  }));
});

test('unauthorized engineer context fails closed', async () => {
  assertSafeDeny(await getEngineerAssignedAppointmentsProjection({
    dbClient: syntheticDbClient(),
    engineerContext: engineerContext({ permissions: [] }),
  }));
  assertSafeDeny(await getEngineerAssignedAppointmentsProjection({
    dbClient: syntheticDbClient(),
    engineerContext: engineerContext({ engineerAssignmentScopeMatched: false }),
  }));
});

test('valid authorized context returns allowlisted appointment projections', async () => {
  const dbClient = syntheticDbClient([
    row({
      appointment_id: 'apt_921_later',
      case_reference: 'CASE-921-LATER',
      scheduled_start: '2026-05-24T05:00:00.000Z',
    }),
    row({
      appointment_id: 'apt_921_first',
      case_reference: 'CASE-921-FIRST',
      scheduled_start: '2026-05-24T01:00:00.000Z',
      appointment_status: 'scheduled',
    }),
  ]);

  const result = await getEngineerAssignedAppointmentsProjection({
    dbClient,
    engineerContext: engineerContext(),
    dateRange: {
      from: '2026-05-24T00:00:00.000Z',
      to: '2026-05-24T23:59:59.999Z',
    },
    statusFilter: null,
  });

  assert.equal(result.status, 'allow');
  assert.equal(result.engineerMobileVisible, true);
  assert.deepEqual(
    result.data.appointments.map((appointment) => appointment.appointmentId),
    ['apt_921_first', 'apt_921_later'],
  );
  assert.deepEqual(Object.keys(result.data.appointments[0]).sort(), [
    'appointmentId',
    'appointmentWindow',
    'canOpenDetails',
    'canPrepareCompletionDraft',
    'canRecordArrival',
    'canStartTravel',
    'caseReference',
    'customerDisplayName',
    'locationLabel',
    'priorityLabel',
    'scheduledEnd',
    'scheduledStart',
    'serviceType',
    'status',
  ]);
  assert.equal(result.data.appointments[0].canOpenDetails, true);
  assert.equal(result.data.appointments[0].canStartTravel, true);
  assert.equal(result.data.appointments[0].canRecordArrival, false);
  assert.equal(result.data.appointments[0].canPrepareCompletionDraft, false);
  assertNoSensitiveLeak(result);
});

test('organization mismatch rows are excluded', async () => {
  const result = await getEngineerAssignedAppointmentsProjection({
    dbClient: syntheticDbClient([
      row({ appointment_id: 'apt_allowed' }),
      row({
        appointment_id: 'apt_wrong_org',
        organization_id: 'org_other',
      }),
    ]),
    engineerContext: engineerContext(),
  });

  assert.deepEqual(
    result.data.appointments.map((appointment) => appointment.appointmentId),
    ['apt_allowed'],
  );
});

test('non-assigned engineer rows are excluded', async () => {
  const result = await getEngineerAssignedAppointmentsProjection({
    dbClient: syntheticDbClient([
      row({ appointment_id: 'apt_allowed' }),
      row({
        appointment_id: 'apt_wrong_engineer',
        assigned_engineer_id: 'eng_other',
      }),
    ]),
    engineerContext: engineerContext(),
  });

  assert.deepEqual(
    result.data.appointments.map((appointment) => appointment.appointmentId),
    ['apt_allowed'],
  );
});

test('statusFilter scopes query and returned rows', async () => {
  const dbClient = syntheticDbClient([
    row({
      appointment_id: 'apt_confirmed',
      appointment_status: 'confirmed',
    }),
    row({
      appointment_id: 'apt_completed',
      appointment_status: 'completed',
    }),
  ]);

  const result = await getEngineerAssignedAppointmentsProjection({
    dbClient,
    engineerContext: engineerContext(),
    statusFilter: 'confirmed',
  });

  assert.deepEqual(
    result.data.appointments.map((appointment) => appointment.appointmentId),
    ['apt_confirmed'],
  );
  assert.equal(dbClient.calls[0].querySpec.values[4], 'confirmed');
});

test('display eligibility hints are delegated to pre-departure helper', async () => {
  const result = await getEngineerAssignedAppointmentsProjection({
    dbClient: syntheticDbClient([
      row({
        appointment_id: 'apt_assigned',
        appointment_status: 'assigned',
      }),
      row({
        appointment_id: 'apt_arrived',
        appointment_status: 'arrived',
      }),
    ]),
    engineerContext: engineerContext(),
  });

  const byId = Object.fromEntries(
    result.data.appointments.map((appointment) => [appointment.appointmentId, appointment]),
  );

  assert.equal(byId.apt_assigned.canStartTravel, true);
  assert.equal(byId.apt_assigned.canRecordArrival, false);
  assert.equal(byId.apt_assigned.canPrepareCompletionDraft, false);
  assert.equal(byId.apt_arrived.canStartTravel, false);
  assert.equal(byId.apt_arrived.canRecordArrival, false);
  assert.equal(byId.apt_arrived.canPrepareCompletionDraft, false);
  assertNoSensitiveLeak(result);
});

test('query error returns generic safe deny without raw error leakage', async () => {
  const result = await getEngineerAssignedAppointmentsProjection({
    dbClient: syntheticDbClient(new Error('database stack trace should not leak')),
    engineerContext: engineerContext(),
  });

  assertSafeDeny(result);
  assert.equal(JSON.stringify(result).includes('database stack trace should not leak'), false);
});

test('read-only through injected synthetic dbClient query only', async () => {
  const dbClient = syntheticDbClient([row()]);

  const result = await getEngineerAssignedAppointmentsProjection({
    dbClient,
    engineerContext: engineerContext(),
    dateRange: {
      from: '2026-05-24T00:00:00.000Z',
      to: '2026-05-24T23:59:59.999Z',
    },
  });

  assert.equal(result.status, 'allow');
  assert.equal(dbClient.calls.length, 1);
  assert.equal(dbClient.calls[0].method, 'query');
  assert.equal(dbClient.calls[0].querySpec.name, 'engineerMobileAssignedAppointmentsProjection');
  assert.equal(dbClient.calls[0].querySpec.readOnly, true);
  assert.match(dbClient.calls[0].querySpec.text, /^select /i);
  assert.doesNotMatch(dbClient.calls[0].querySpec.text, /\binsert\b|\bupdate\b|\bdelete\b/i);
  assert.deepEqual(dbClient.calls[0].querySpec.values, [
    'org_engineer_mobile_921',
    'eng_engineer_mobile_921',
    '2026-05-24T00:00:00.000Z',
    '2026-05-24T23:59:59.999Z',
    null,
  ]);
});

test('input context and row objects are not mutated', async () => {
  const context = engineerContext();
  const rows = [row()];
  const beforeContext = clone(context);
  const beforeRows = clone(rows);

  await getEngineerAssignedAppointmentsProjection({
    dbClient: syntheticDbClient(rows),
    engineerContext: context,
  });

  assert.deepEqual(context, beforeContext);
  assert.deepEqual(rows, beforeRows);
});
