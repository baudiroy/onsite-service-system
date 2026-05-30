'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  ENGINEER_MOBILE_WORKBENCH_SAFE_ENVELOPE_PRESENTER_KIND,
  presentEngineerMobileWorkbenchSafeEnvelope,
} = require('../../src/engineerMobile/engineerMobileWorkbenchSafeEnvelopePresenter');

const PRESENTER_SOURCE = path.join(
  __dirname,
  '../../src/engineerMobile/engineerMobileWorkbenchSafeEnvelopePresenter.js',
);

function safeProjection(overrides = {}) {
  return {
    ok: true,
    status: 'available',
    messageKey: 'engineerMobile.workbench.available',
    assignmentReference: 'assign_task_2269',
    caseReference: 'CASE-2269',
    appointmentId: 'apt_task_2269',
    serviceStatus: 'scheduled',
    appointmentWindow: '2026-06-01 09:00-11:00',
    customerDisplay: {
      displayName: 'Customer A',
      nameMasked: 'C*** A',
      phoneMasked: '09**-***-123',
      phone: 'raw_phone_should_not_leak',
      privateLineUserId: 'raw_line_user_should_not_leak',
    },
    locationSummary: {
      label: 'West District',
      addressSummary: 'West District service area',
      navigationHint: 'Use building lobby',
      fullAddress: 'raw_address_should_not_leak',
    },
    workOrderSummary: {
      serviceType: 'repair',
      productSummary: 'Washer',
      issueSummary: 'No drain',
      serviceSummary: 'Check drain pump',
      publicCustomerNotes: 'Customer available in the morning',
      priorityLabel: 'normal',
      checklistPreview: [
        { key: 'confirm_access', label: 'Confirm access', status: 'pending', rawSql: 'select * from checklist' },
        'Bring basic tools',
      ],
      completionReport: 'raw_completion_report_should_not_leak',
    },
    eligibility: {
      canOpenDetails: true,
      canStartTravel: true,
      canRecordArrival: false,
      canPrepareCompletionDraft: true,
      reasonCode: 'ready',
      messageKey: 'engineerMobile.workbench.ready',
      auditContext: 'raw_audit_context_should_not_leak',
    },
    actions: [
      {
        key: 'start_travel',
        label: 'Start travel',
        enabled: true,
        reasonCode: 'ready',
        messageKey: 'engineerMobile.action.startTravel',
        providerPayload: 'raw_provider_payload_should_not_leak',
      },
      {
        key: 'prepare_completion',
        label: 'Prepare completion',
        enabled: true,
        rawFieldServiceReport: 'raw_field_service_report_should_not_leak',
      },
    ],
    rawCase: 'raw_case_should_not_leak',
    rawAppointment: 'raw_appointment_should_not_leak',
    rawDbRow: 'raw_db_row_should_not_leak',
    auditActor: 'raw_audit_actor_should_not_leak',
    providerPayload: 'raw_provider_payload_should_not_leak',
    aiRawPayload: 'raw_ai_payload_should_not_leak',
    billingInternal: 'raw_billing_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    organizationId: 'org_internal_should_not_leak',
    assignedEngineerId: 'eng_internal_should_not_leak',
    debugPayload: 'debug_should_not_leak',
    rawSql: 'select * from engineer_mobile',
    token: 'token_should_not_leak',
    password: 'password_should_not_leak',
    secret: 'secret_should_not_leak',
    ...overrides,
  };
}

function assertNoForbiddenLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'raw_address_should_not_leak',
    'raw_ai_payload_should_not_leak',
    'raw_appointment_should_not_leak',
    'raw_audit_actor_should_not_leak',
    'raw_audit_context_should_not_leak',
    'raw_billing_should_not_leak',
    'raw_case_should_not_leak',
    'raw_completion_report_should_not_leak',
    'raw_db_row_should_not_leak',
    'raw_field_service_report_should_not_leak',
    'raw_line_user_should_not_leak',
    'raw_phone_should_not_leak',
    'raw_provider_payload_should_not_leak',
    'debug_should_not_leak',
    'eng_internal_should_not_leak',
    'final_appointment_should_not_leak',
    'org_internal_should_not_leak',
    'password_should_not_leak',
    'select * from',
    'secret_should_not_leak',
    'token_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('exports safe workbench envelope presenter kind', () => {
  assert.equal(
    ENGINEER_MOBILE_WORKBENCH_SAFE_ENVELOPE_PRESENTER_KIND,
    'engineer_mobile.workbench_safe_envelope_presenter',
  );
});

test('accepted projection maps to explicit engineer-facing mobile envelope shape', () => {
  const envelope = presentEngineerMobileWorkbenchSafeEnvelope(safeProjection());

  assert.deepEqual(envelope, {
    ok: true,
    status: 'available',
    messageKey: 'engineerMobile.workbench.available',
    assignmentReference: 'assign_task_2269',
    caseReference: 'CASE-2269',
    appointmentReference: 'apt_task_2269',
    serviceStatus: 'scheduled',
    appointmentWindow: '2026-06-01 09:00-11:00',
    customerDisplay: {
      displayName: 'Customer A',
      nameMasked: 'C*** A',
      phoneMasked: '09**-***-123',
    },
    locationSummary: {
      label: 'West District',
      addressSummary: 'West District service area',
      navigationHint: 'Use building lobby',
    },
    workOrderSummary: {
      serviceType: 'repair',
      productSummary: 'Washer',
      issueSummary: 'No drain',
      serviceSummary: 'Check drain pump',
      publicCustomerNotes: 'Customer available in the morning',
      priorityLabel: 'normal',
      checklistPreview: [
        { key: 'confirm_access', label: 'Confirm access', status: 'pending' },
        { label: 'Bring basic tools' },
      ],
    },
    eligibility: {
      canOpenDetails: true,
      canPrepareCompletionDraft: true,
      canRecordArrival: false,
      canStartTravel: true,
      reasonCode: 'ready',
      messageKey: 'engineerMobile.workbench.ready',
    },
    actions: [
      {
        key: 'start_travel',
        label: 'Start travel',
        enabled: true,
        reasonCode: 'ready',
        messageKey: 'engineerMobile.action.startTravel',
      },
      {
        key: 'prepare_completion',
        label: 'Prepare completion',
        enabled: true,
      },
    ],
  });
  assertNoForbiddenLeak(envelope);
});

test('output allowlist excludes raw private system provider AI billing and debug fields', () => {
  const envelope = presentEngineerMobileWorkbenchSafeEnvelope(safeProjection({
    appointmentReference: 'apt_public_reference',
    caseId: 'case_internal_should_not_leak',
    fieldServiceReportId: 'field_service_report_should_not_leak',
    completionReportId: 'completion_report_id_should_not_leak',
    settlementInternal: 'settlement_should_not_leak',
    paymentInternal: 'payment_should_not_leak',
    invoiceInternal: 'invoice_should_not_leak',
    openaiTrace: 'openai_should_not_leak',
    vectorPayload: 'vector_should_not_leak',
    webhookPayload: 'webhook_should_not_leak',
  }));

  assert.deepEqual(Object.keys(envelope).sort(), [
    'actions',
    'appointmentReference',
    'appointmentWindow',
    'assignmentReference',
    'caseReference',
    'customerDisplay',
    'eligibility',
    'locationSummary',
    'messageKey',
    'ok',
    'serviceStatus',
    'status',
    'workOrderSummary',
  ].sort());
  assert.equal(envelope.appointmentReference, 'apt_public_reference');
  assert.equal(JSON.stringify(envelope).includes('case_internal_should_not_leak'), false);
  assert.equal(JSON.stringify(envelope).includes('field_service_report_should_not_leak'), false);
  assert.equal(JSON.stringify(envelope).includes('completion_report_id_should_not_leak'), false);
  assert.equal(JSON.stringify(envelope).includes('settlement_should_not_leak'), false);
  assert.equal(JSON.stringify(envelope).includes('payment_should_not_leak'), false);
  assert.equal(JSON.stringify(envelope).includes('invoice_should_not_leak'), false);
  assert.equal(JSON.stringify(envelope).includes('openai_should_not_leak'), false);
  assert.equal(JSON.stringify(envelope).includes('vector_should_not_leak'), false);
  assert.equal(JSON.stringify(envelope).includes('webhook_should_not_leak'), false);
  assertNoForbiddenLeak(envelope);
});

test('eligibility and actions are allowlisted and display-oriented only', () => {
  const envelope = presentEngineerMobileWorkbenchSafeEnvelope(safeProjection({
    eligibility: {
      canStartTravel: true,
      canRecordArrival: true,
      canFinishWork: true,
      transitionWriter: 'transition_writer_should_not_leak',
      rawAppointmentState: 'raw_state_should_not_leak',
    },
    actions: [
      {
        key: 'record_arrival',
        label: 'Record arrival',
        enabled: true,
        href: 'https://signed-url-should-not-leak.example',
        token: 'token_should_not_leak',
      },
      {
        label: 'Missing key is dropped',
        enabled: true,
      },
    ],
  }));

  assert.deepEqual(envelope.eligibility, {
    canRecordArrival: true,
    canStartTravel: true,
    canFinishWork: true,
  });
  assert.deepEqual(envelope.actions, [
    {
      key: 'record_arrival',
      label: 'Record arrival',
      enabled: true,
    },
  ]);
  assert.equal(JSON.stringify(envelope).includes('transition_writer_should_not_leak'), false);
  assert.equal(JSON.stringify(envelope).includes('raw_state_should_not_leak'), false);
  assertNoForbiddenLeak(envelope);
});

test('deny unavailable and missing input produce generic safe envelope', () => {
  assert.deepEqual(presentEngineerMobileWorkbenchSafeEnvelope(), {
    ok: false,
    status: 'unavailable',
    messageKey: 'engineerMobile.workbench.unavailable',
    actions: [],
  });
  assert.deepEqual(presentEngineerMobileWorkbenchSafeEnvelope('raw_request_should_not_leak'), {
    ok: false,
    status: 'unavailable',
    messageKey: 'engineerMobile.workbench.unavailable',
    actions: [],
  });

  const denied = presentEngineerMobileWorkbenchSafeEnvelope(safeProjection({
    ok: false,
    status: 'deny',
    messageKey: 'engineerMobile.workbench.denied',
    finalAppointmentId: 'final_appointment_should_not_leak',
    rawDbRow: 'raw_db_row_should_not_leak',
  }));

  assert.deepEqual(denied, {
    ok: false,
    status: 'deny',
    messageKey: 'engineerMobile.workbench.denied',
    assignmentReference: 'assign_task_2269',
    caseReference: 'CASE-2269',
    appointmentReference: 'apt_task_2269',
    eligibility: {
      canOpenDetails: true,
      canPrepareCompletionDraft: true,
      canRecordArrival: false,
      canStartTravel: true,
      reasonCode: 'ready',
      messageKey: 'engineerMobile.workbench.ready',
    },
    actions: [],
  });
  assertNoForbiddenLeak(denied);
});

test('presenter returns a new object and does not mutate input', () => {
  const projection = safeProjection();
  const before = structuredClone(projection);
  const envelope = presentEngineerMobileWorkbenchSafeEnvelope(projection);

  assert.notEqual(envelope, projection);
  assert.notEqual(envelope.customerDisplay, projection.customerDisplay);
  assert.notEqual(envelope.locationSummary, projection.locationSummary);
  assert.notEqual(envelope.workOrderSummary, projection.workOrderSummary);
  assert.notEqual(envelope.eligibility, projection.eligibility);
  assert.notEqual(envelope.actions, projection.actions);
  assert.deepEqual(projection, before);
});

test('presenter source stays pure and isolated from runtime boundaries', () => {
  const source = fs.readFileSync(PRESENTER_SOURCE, 'utf8');

  for (const forbidden of [
    'require(',
    'import ',
    'process.env',
    'dbClient',
    '.query(',
    'sql`',
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
    'openai',
    'vectorDb',
    'billingService',
    'settlementService',
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
