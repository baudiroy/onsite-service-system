'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createEngineerMobileAssignedAppointmentDetailHandler,
  getEngineerMobileAssignedAppointmentDetail,
} = require('../../src/engineerMobile/engineerMobileAssignedAppointmentDetailHandler');

const HANDLER_SOURCE = path.join(
  __dirname,
  '../../src/engineerMobile/engineerMobileAssignedAppointmentDetailHandler.js',
);

function engineerContext(overrides = {}) {
  return {
    organizationId: 'org_engineer_mobile_1737',
    engineerUserId: 'eng_user_1737',
    permissions: ['engineer_mobile.assigned_appointments.read'],
    ...overrides,
  };
}

function appointmentDetail(overrides = {}) {
  return {
    appointmentId: 'apt_1737_001',
    caseReference: 'CASE-1737-001',
    appointmentWindow: '2026-05-29 09:00-11:00',
    scheduledStart: '2026-05-29T01:00:00.000Z',
    scheduledEnd: '2026-05-29T03:00:00.000Z',
    serviceType: 'onsite',
    customerDisplayName: 'Chen masked',
    locationLabel: 'Taipei Xinyi',
    status: 'confirmed',
    priorityLabel: 'normal',
    serviceSummary: 'Air conditioner inspection',
    publicCustomerNotes: 'Customer-visible preparation note.',
    checklistPreview: [
      {
        label: 'Confirm model',
        status: 'pending',
        phone: 'nested_phone_should_not_leak',
        finalAppointmentId: 'nested_final_appointment_should_not_leak',
      },
      'Take exterior photo',
    ],
    organizationId: 'org_engineer_mobile_1737',
    engineerUserId: 'eng_user_1737',
    phone: 'raw_phone_should_not_leak',
    mobile: 'raw_mobile_should_not_leak',
    tel: 'raw_tel_should_not_leak',
    address: 'raw_address_should_not_leak',
    fullAddress: 'full_address_should_not_leak',
    lineUserId: 'line_user_should_not_leak',
    providerRawPayload: 'provider_payload_should_not_leak',
    providerDebug: 'provider_debug_should_not_leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    internalNote: 'internal_note_should_not_leak',
    dispatcherNote: 'dispatcher_note_should_not_leak',
    rawSql: 'select * from appointments',
    stack: 'stack_trace_should_not_leak',
    billingInternal: 'billing_internal_should_not_leak',
    settlementInternal: 'settlement_internal_should_not_leak',
    aiRawPayload: 'ai_raw_payload_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    fieldServiceReportId: 'field_service_report_should_not_leak',
    privateAttachments: ['attachment_should_not_leak'],
    ...overrides,
  };
}

function repository(result) {
  const repositoryResult = arguments.length === 0 ? appointmentDetail() : result;
  const calls = [];

  return {
    calls,
    async findAssignedAppointmentDetail(params) {
      calls.push({
        method: 'findAssignedAppointmentDetail',
        params,
      });

      if (repositoryResult instanceof Error) {
        throw repositoryResult;
      }

      return repositoryResult;
    },
    findAssignedAppointments() {
      throw new Error('list reader must not be called');
    },
    create() {
      throw new Error('create must not be called');
    },
    update() {
      throw new Error('update must not be called');
    },
    insert() {
      throw new Error('insert must not be called');
    },
    delete() {
      throw new Error('delete must not be called');
    },
    save() {
      throw new Error('save must not be called');
    },
    complete() {
      throw new Error('complete must not be called');
    },
    publish() {
      throw new Error('publish must not be called');
    },
  };
}

function assertSafeDeny(result) {
  assert.deepEqual(result, {
    status: 'deny',
    messageKey: 'engineerMobile.assignedAppointmentDetail.unavailable',
    engineerMobileVisible: false,
    data: {
      appointment: null,
    },
    error: {
      messageKey: 'engineerMobile.assignedAppointmentDetail.unavailable',
    },
  });
}

function assertNoForbiddenLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'raw_phone_should_not_leak',
    'raw_mobile_should_not_leak',
    'raw_tel_should_not_leak',
    'raw_address_should_not_leak',
    'full_address_should_not_leak',
    'line_user_should_not_leak',
    'provider_payload_should_not_leak',
    'provider_debug_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'internal_note_should_not_leak',
    'dispatcher_note_should_not_leak',
    'select * from appointments',
    'stack_trace_should_not_leak',
    'billing_internal_should_not_leak',
    'settlement_internal_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'final_appointment_should_not_leak',
    'field_service_report_should_not_leak',
    'attachment_should_not_leak',
    'nested_phone_should_not_leak',
    'nested_final_appointment_should_not_leak',
    'raw db failure',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('valid engineer organization and appointment id returns safe appointment detail', async () => {
  const assignedAppointmentRepository = repository();
  const auditEvents = [];
  const result = await getEngineerMobileAssignedAppointmentDetail({
    assignedAppointmentRepository,
    auditLogger: auditEvents.push.bind(auditEvents),
    context: engineerContext(),
    input: {
      appointmentId: 'apt_1737_001',
      rawSql: 'must_not_pass',
    },
  });

  assert.deepEqual(result, {
    status: 'allow',
    messageKey: 'engineerMobile.assignedAppointmentDetail.available',
    engineerMobileVisible: true,
    data: {
      appointment: {
        ok: true,
        status: 'available',
        messageKey: 'engineerMobile.assignedAppointmentDetail.available',
        appointmentReference: 'apt_1737_001',
        caseReference: 'CASE-1737-001',
        serviceStatus: 'confirmed',
        appointmentWindow: '2026-05-29 09:00-11:00',
        customerDisplay: {
          displayName: 'Chen masked',
        },
        locationSummary: {
          label: 'Taipei Xinyi',
        },
        workOrderSummary: {
          serviceType: 'onsite',
          serviceSummary: 'Air conditioner inspection',
          publicCustomerNotes: 'Customer-visible preparation note.',
          priorityLabel: 'normal',
          checklistPreview: [
            {
              label: 'Confirm model',
              status: 'pending',
            },
            {
              label: 'Take exterior photo',
            },
          ],
        },
        eligibility: {
          canOpenDetails: true,
        },
        actions: [],
      },
    },
  });
  assertNoForbiddenLeak(result);
  assert.deepEqual(auditEvents, [
    {
      event: 'engineerMobile.assignedAppointmentDetail.read',
      outcome: 'allow',
      organizationId: 'org_engineer_mobile_1737',
      engineerUserId: 'eng_user_1737',
      appointmentId: 'apt_1737_001',
    },
  ]);
});

test('repository receives organization engineer and appointment scoped params only', async () => {
  const assignedAppointmentRepository = repository();

  await getEngineerMobileAssignedAppointmentDetail({
    assignedAppointmentRepository,
    context: engineerContext(),
    input: {
      appointmentId: 'apt_1737_001',
      finalAppointmentId: 'must_not_pass',
      rawSql: 'must_not_pass',
      phone: 'must_not_pass',
    },
  });

  assert.deepEqual(assignedAppointmentRepository.calls, [
    {
      method: 'findAssignedAppointmentDetail',
      params: {
        organizationId: 'org_engineer_mobile_1737',
        engineerUserId: 'eng_user_1737',
        appointmentId: 'apt_1737_001',
      },
    },
  ]);
});

test('missing organization fails closed without repository access', async () => {
  const assignedAppointmentRepository = repository();

  assertSafeDeny(await getEngineerMobileAssignedAppointmentDetail({
    assignedAppointmentRepository,
    context: engineerContext({ organizationId: '' }),
    input: { appointmentId: 'apt_1737_001' },
  }));
  assert.deepEqual(assignedAppointmentRepository.calls, []);
});

test('missing engineer identity fails closed without repository access', async () => {
  const assignedAppointmentRepository = repository();

  assertSafeDeny(await getEngineerMobileAssignedAppointmentDetail({
    assignedAppointmentRepository,
    context: engineerContext({ engineerUserId: '' }),
    input: { appointmentId: 'apt_1737_001' },
  }));
  assert.deepEqual(assignedAppointmentRepository.calls, []);
});

test('missing appointment id fails closed without repository access', async () => {
  for (const appointmentId of [undefined, '', '   ', '../unsafe', 'bad id with spaces']) {
    const assignedAppointmentRepository = repository();

    assertSafeDeny(await getEngineerMobileAssignedAppointmentDetail({
      assignedAppointmentRepository,
      context: engineerContext(),
      input: { appointmentId },
    }));
    assert.deepEqual(assignedAppointmentRepository.calls, []);
  }
});

test('missing read permission fails closed without repository access', async () => {
  const assignedAppointmentRepository = repository();

  assertSafeDeny(await getEngineerMobileAssignedAppointmentDetail({
    assignedAppointmentRepository,
    context: engineerContext({ permissions: [] }),
    input: { appointmentId: 'apt_1737_001' },
  }));
  assert.deepEqual(assignedAppointmentRepository.calls, []);
});

test('repository throw fails closed without leaking raw error details', async () => {
  const assignedAppointmentRepository = repository(new Error('raw db failure stack trace'));
  const auditEvents = [];
  const result = await getEngineerMobileAssignedAppointmentDetail({
    assignedAppointmentRepository,
    auditLogger: {
      record(event) {
        auditEvents.push(event);
      },
    },
    context: engineerContext(),
    input: { appointmentId: 'apt_1737_001' },
  });

  assertSafeDeny(result);
  assertNoForbiddenLeak(result);
  assert.deepEqual(auditEvents, [
    {
      event: 'engineerMobile.assignedAppointmentDetail.read',
      outcome: 'deny',
      organizationId: 'org_engineer_mobile_1737',
      engineerUserId: 'eng_user_1737',
      appointmentId: 'apt_1737_001',
      reason: 'repository_unavailable',
    },
  ]);
});

test('repository no result fails closed', async () => {
  for (const result of [undefined, null, [], { rows: [] }, { appointment: null }]) {
    const assignedAppointmentRepository = repository(result);

    assertSafeDeny(await getEngineerMobileAssignedAppointmentDetail({
      assignedAppointmentRepository,
      context: engineerContext(),
      input: { appointmentId: 'apt_1737_001' },
    }));
  }
});

test('cross-organization row is denied', async () => {
  const assignedAppointmentRepository = repository(appointmentDetail({
    organizationId: 'org_other',
  }));

  assertSafeDeny(await getEngineerMobileAssignedAppointmentDetail({
    assignedAppointmentRepository,
    context: engineerContext(),
    input: { appointmentId: 'apt_1737_001' },
  }));
});

test('cross-engineer row is denied', async () => {
  const assignedAppointmentRepository = repository(appointmentDetail({
    engineerUserId: 'eng_other',
  }));

  assertSafeDeny(await getEngineerMobileAssignedAppointmentDetail({
    assignedAppointmentRepository,
    context: engineerContext(),
    input: { appointmentId: 'apt_1737_001' },
  }));
});

test('cross-appointment row is denied', async () => {
  const assignedAppointmentRepository = repository(appointmentDetail({
    appointmentId: 'apt_other',
  }));

  assertSafeDeny(await getEngineerMobileAssignedAppointmentDetail({
    assignedAppointmentRepository,
    context: engineerContext(),
    input: { appointmentId: 'apt_1737_001' },
  }));
});

test('created handler accepts injected repository and synthetic request context', async () => {
  const assignedAppointmentRepository = repository();
  const handler = createEngineerMobileAssignedAppointmentDetailHandler({
    assignedAppointmentRepository,
  });

  const result = await handler({
    engineerContext: engineerContext(),
    params: {
      appointmentId: 'apt_1737_001',
    },
  });

  assert.equal(result.status, 'allow');
  assert.equal(result.data.appointment.appointmentReference, 'apt_1737_001');
  assert.equal(result.data.appointment.messageKey, 'engineerMobile.assignedAppointmentDetail.available');
  assert.deepEqual(assignedAppointmentRepository.calls[0].params, {
    organizationId: 'org_engineer_mobile_1737',
    engineerUserId: 'eng_user_1737',
    appointmentId: 'apt_1737_001',
  });
});

test('handler source has no DB app server route mount listen provider sending or mutation surface', () => {
  const source = fs.readFileSync(HANDLER_SOURCE, 'utf8');

  assert.equal(source.includes('engineerMobileAssignedAppointmentProjection'), true);
  assert.equal(source.includes('function mapAssignedAppointmentDetail'), false);

  for (const forbidden of [
    'require(\'pg\')',
    'require("pg")',
    'dbClient',
    '.query(',
    'psql',
    'db:migrate',
    'createServer',
    'listen(',
    'registerRoute',
    'router.',
    'app.',
    'sendLine',
    'sendSms',
    'sendEmail',
    'webhook',
    'finalAppointmentId',
    'fieldServiceReportId',
    'INSERT ',
    'UPDATE ',
    'DELETE ',
    '.create(',
    '.update(',
    '.insert(',
    '.delete(',
    '.save(',
    '.complete(',
    '.publish(',
  ]) {
    assert.equal(source.includes(forbidden), false, `source contains ${forbidden}`);
  }
});

test('handler exports no global route mount helper', () => {
  const moduleExports = require('../../src/engineerMobile/engineerMobileAssignedAppointmentDetailHandler');

  assert.equal(moduleExports.registerRoute, undefined);
  assert.equal(moduleExports.mount, undefined);
  assert.equal(moduleExports.router, undefined);
});
