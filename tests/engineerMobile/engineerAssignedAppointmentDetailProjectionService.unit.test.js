'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  getEngineerAssignedAppointmentDetailProjection,
} = require('../../src/engineerMobile/engineerAssignedAppointmentDetailProjectionService');

function engineerContext(overrides = {}) {
  return {
    organizationId: 'org_engineer_mobile_925',
    engineerId: 'eng_engineer_mobile_925',
    organizationScopeMatched: true,
    engineerAssignmentScopeMatched: true,
    permissions: ['engineer_mobile.assigned_appointments.read'],
    ...overrides,
  };
}

function row(overrides = {}) {
  return {
    appointment_id: 'apt_925_001',
    case_reference: 'CASE-925-001',
    appointment_window: '2026-05-25 13:00-15:00',
    scheduled_start: '2026-05-25T05:00:00.000Z',
    scheduled_end: '2026-05-25T07:00:00.000Z',
    service_type: 'onsite',
    customer_display_name: '王○○',
    location_label: '台北市大安區',
    appointment_status: 'arrived',
    priority_label: 'high',
    service_summary: '冷氣檢修',
    public_customer_notes: '客戶已同意到府確認。',
    checklist_preview: [
      {
        label: '確認設備型號',
        status: 'pending',
        phone: 'raw_phone_should_not_leak',
        finalAppointmentId: 'final_appointment_should_not_leak',
      },
      '拍攝外觀照片',
    ],
    organization_id: 'org_engineer_mobile_925',
    assigned_engineer_id: 'eng_engineer_mobile_925',
    phone: 'raw_phone_should_not_leak',
    mobile: 'raw_mobile_should_not_leak',
    address: 'raw_address_should_not_leak',
    line_user_id: 'line_user_should_not_leak',
    provider_raw_payload: 'provider_payload_should_not_leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    internal_note: 'internal_note_should_not_leak',
    dispatcher_note: 'dispatcher_note_should_not_leak',
    technician_private_note: 'technician_note_should_not_leak',
    billing_internal: 'billing_internal_should_not_leak',
    settlement_internal: 'settlement_internal_should_not_leak',
    ai_raw_payload: 'ai_raw_payload_should_not_leak',
    sql: 'select secret_should_not_leak',
    stack: 'stack_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    fieldServiceReportId: 'field_service_report_should_not_leak',
    completionReportId: 'completion_report_should_not_leak',
    privateAttachments: ['attachment_should_not_leak'],
    unpublishedCustomerReport: 'unpublished_report_should_not_leak',
    ...overrides,
  };
}

function dbClientWithRows(rows, options = {}) {
  const calls = {
    query: [],
    insert: [],
    update: [],
    delete: [],
  };

  return {
    calls,
    query(querySpec) {
      calls.query.push(querySpec);

      if (options.throwOnQuery) {
        throw new Error('database sql token_should_not_leak stack_should_not_leak');
      }

      return { rows };
    },
    insert(value) {
      calls.insert.push(value);
      throw new Error('insert should not be called');
    },
    update(value) {
      calls.update.push(value);
      throw new Error('update should not be called');
    },
    delete(value) {
      calls.delete.push(value);
      throw new Error('delete should not be called');
    },
  };
}

function safeDenyEnvelope() {
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
    'raw_mobile_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
    'provider_payload_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'internal_note_should_not_leak',
    'dispatcher_note_should_not_leak',
    'technician_note_should_not_leak',
    'billing_internal_should_not_leak',
    'settlement_internal_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'stack_should_not_leak',
    'final_appointment_should_not_leak',
    'field_service_report_should_not_leak',
    'completion_report_should_not_leak',
    'attachment_should_not_leak',
    'unpublished_report_should_not_leak',
    'database sql',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `detail projection leaked ${forbidden}`);
  }
}

test('missing dbClient fails closed', async () => {
  const result = await getEngineerAssignedAppointmentDetailProjection({
    engineerContext: engineerContext(),
    appointmentId: 'apt_925_001',
  });

  assert.deepEqual(result, safeDenyEnvelope());
});

test('missing engineerContext fails closed', async () => {
  const dbClient = dbClientWithRows([row()]);
  const result = await getEngineerAssignedAppointmentDetailProjection({
    dbClient,
    appointmentId: 'apt_925_001',
  });

  assert.deepEqual(result, safeDenyEnvelope());
  assert.equal(dbClient.calls.query.length, 0);
});

test('missing organizationId fails closed', async () => {
  const dbClient = dbClientWithRows([row()]);
  const result = await getEngineerAssignedAppointmentDetailProjection({
    dbClient,
    engineerContext: engineerContext({ organizationId: undefined }),
    appointmentId: 'apt_925_001',
  });

  assert.deepEqual(result, safeDenyEnvelope());
  assert.equal(dbClient.calls.query.length, 0);
});

test('missing engineerId fails closed', async () => {
  const dbClient = dbClientWithRows([row()]);
  const result = await getEngineerAssignedAppointmentDetailProjection({
    dbClient,
    engineerContext: engineerContext({ engineerId: undefined }),
    appointmentId: 'apt_925_001',
  });

  assert.deepEqual(result, safeDenyEnvelope());
  assert.equal(dbClient.calls.query.length, 0);
});

test('missing or invalid appointment id fails closed', async () => {
  for (const appointmentId of [undefined, '', '   ', '../unsafe', 'bad id with spaces']) {
    const dbClient = dbClientWithRows([row()]);
    const result = await getEngineerAssignedAppointmentDetailProjection({
      dbClient,
      engineerContext: engineerContext(),
      appointmentId,
    });

    assert.deepEqual(result, safeDenyEnvelope());
    assert.equal(dbClient.calls.query.length, 0);
  }
});

test('unauthorized engineer context fails closed', async () => {
  const dbClient = dbClientWithRows([row()]);
  const result = await getEngineerAssignedAppointmentDetailProjection({
    dbClient,
    engineerContext: engineerContext({ permissions: [] }),
    appointmentId: 'apt_925_001',
  });

  assert.deepEqual(result, safeDenyEnvelope());
  assert.equal(dbClient.calls.query.length, 0);
});

test('valid authorized row returns allowlisted mobile-safe detail projection', async () => {
  const dbClient = dbClientWithRows([row()]);
  const result = await getEngineerAssignedAppointmentDetailProjection({
    dbClient,
    engineerContext: engineerContext(),
    appointmentId: 'apt_925_001',
  });

  assert.deepEqual(result, {
    status: 'allow',
    messageKey: 'engineerMobile.assignedAppointmentDetail.available',
    engineerMobileVisible: true,
    data: {
      appointment: {
        appointmentId: 'apt_925_001',
        caseReference: 'CASE-925-001',
        canOpenDetails: true,
        appointmentWindow: '2026-05-25 13:00-15:00',
        scheduledStart: '2026-05-25T05:00:00.000Z',
        scheduledEnd: '2026-05-25T07:00:00.000Z',
        serviceType: 'onsite',
        customerDisplayName: '王○○',
        locationLabel: '台北市大安區',
        status: 'arrived',
        priorityLabel: 'high',
        serviceSummary: '冷氣檢修',
        publicCustomerNotes: '客戶已同意到府確認。',
        checklistPreview: [
          {
            label: '確認設備型號',
            status: 'pending',
          },
          {
            label: '拍攝外觀照片',
          },
        ],
        canStartTravel: false,
        canRecordArrival: false,
        canPrepareCompletionDraft: false,
      },
    },
  });
  assert.equal(dbClient.calls.query.length, 1);
  assert.equal(dbClient.calls.query[0].readOnly, true);
  assert.deepEqual(dbClient.calls.query[0].values, [
    'org_engineer_mobile_925',
    'eng_engineer_mobile_925',
    'apt_925_001',
  ]);
  assertNoSensitiveLeak(result);
});

test('detail display eligibility hints are delegated to pre-departure helper', async () => {
  const dbClient = dbClientWithRows([row({ appointment_status: 'confirmed' })]);
  const result = await getEngineerAssignedAppointmentDetailProjection({
    dbClient,
    engineerContext: engineerContext(),
    appointmentId: 'apt_925_001',
  });

  assert.equal(result.status, 'allow');
  assert.equal(result.data.appointment.canStartTravel, true);
  assert.equal(result.data.appointment.canRecordArrival, false);
  assert.equal(result.data.appointment.canPrepareCompletionDraft, false);
  assertNoSensitiveLeak(result);
});

test('organization mismatch fails closed without existence leakage', async () => {
  const dbClient = dbClientWithRows([row({ organization_id: 'org_other' })]);
  const result = await getEngineerAssignedAppointmentDetailProjection({
    dbClient,
    engineerContext: engineerContext(),
    appointmentId: 'apt_925_001',
  });

  assert.deepEqual(result, safeDenyEnvelope());
  assertNoSensitiveLeak(result);
});

test('non-assigned engineer row fails closed without existence leakage', async () => {
  const dbClient = dbClientWithRows([row({ assigned_engineer_id: 'eng_other' })]);
  const result = await getEngineerAssignedAppointmentDetailProjection({
    dbClient,
    engineerContext: engineerContext(),
    appointmentId: 'apt_925_001',
  });

  assert.deepEqual(result, safeDenyEnvelope());
  assertNoSensitiveLeak(result);
});

test('wrong appointment row fails closed without existence leakage', async () => {
  const dbClient = dbClientWithRows([row({ appointment_id: 'apt_other' })]);
  const result = await getEngineerAssignedAppointmentDetailProjection({
    dbClient,
    engineerContext: engineerContext(),
    appointmentId: 'apt_925_001',
  });

  assert.deepEqual(result, safeDenyEnvelope());
  assertNoSensitiveLeak(result);
});

test('query error returns generic safe deny without raw error leakage', async () => {
  const dbClient = dbClientWithRows([row()], { throwOnQuery: true });
  const result = await getEngineerAssignedAppointmentDetailProjection({
    dbClient,
    engineerContext: engineerContext(),
    appointmentId: 'apt_925_001',
  });

  assert.deepEqual(result, safeDenyEnvelope());
  assertNoSensitiveLeak(result);
});

test('synthetic DB client proves no mutation methods are called', async () => {
  const dbClient = dbClientWithRows([row()]);
  const result = await getEngineerAssignedAppointmentDetailProjection({
    dbClient,
    engineerContext: engineerContext(),
    appointmentId: 'apt_925_001',
  });

  assert.equal(result.status, 'allow');
  assert.equal(dbClient.calls.query.length, 1);
  assert.equal(dbClient.calls.insert.length, 0);
  assert.equal(dbClient.calls.update.length, 0);
  assert.equal(dbClient.calls.delete.length, 0);
});

test('input context and row objects are not mutated', async () => {
  const sourceRow = row();
  const sourceContext = engineerContext();
  const beforeRow = JSON.stringify(sourceRow);
  const beforeContext = JSON.stringify(sourceContext);

  await getEngineerAssignedAppointmentDetailProjection({
    dbClient: dbClientWithRows([sourceRow]),
    engineerContext: sourceContext,
    appointmentId: 'apt_925_001',
  });

  assert.equal(JSON.stringify(sourceRow), beforeRow);
  assert.equal(JSON.stringify(sourceContext), beforeContext);
});
