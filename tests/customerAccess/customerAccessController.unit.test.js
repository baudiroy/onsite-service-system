'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildCustomerAccessControllerResponse,
  handleCustomerAccessRequest,
} = require('../../src/controllers/customerAccessController');
const {
  CUSTOMER_ACCESS_AUDIT_EVENT_KEYS,
  CUSTOMER_ACCESS_AUDIT_METADATA_KEYS,
} = require('../../src/customerAccess/customerAccessAuditEventBuilder');

function validReq() {
  return {
    params: { caseId: 'case-synthetic' },
    auth: {
      organizationId: 'org-synthetic',
      customerId: 'customer-synthetic',
      customerIdentityVerified: true,
    },
    channel: {
      lineChannelId: 'line-channel-synthetic',
      lineUserId: 'U1234567890abcdef',
    },
    access: {
      organizationScopeMatched: true,
      caseLinkedToCustomer: true,
      publicationAllowed: true,
      customerVisiblePolicyPassed: true,
    },
    customerVisibleData: {
      serviceReport: {
        caseNo: 'CASE-001',
        status: 'completed',
        finalAppointmentId: 'appointment-final-001',
        summary: 'Service completed.',
      },
    },
    customerAccessContext: {
      params: { caseId: 'case-synthetic' },
      auth: {
        organizationId: 'org-synthetic',
        customerId: 'customer-synthetic',
        customerIdentityVerified: true,
      },
      channel: {
        lineChannelId: 'line-channel-synthetic',
        lineUserId: 'U1234567890abcdef',
      },
      access: {
        organizationScopeMatched: true,
        caseLinkedToCustomer: true,
        publicationAllowed: true,
        customerVisiblePolicyPassed: true,
      },
      customerVisibleData: {
        serviceReport: {
          caseNo: 'CASE-001',
          status: 'completed',
          finalAppointmentId: 'appointment-final-001',
          summary: 'Service completed.',
        },
      },
    },
  };
}

const forbiddenValues = [
  '0912-345-678',
  '台北市信義區測試路1號',
  'U1234567890abcdef',
  'internal note should never leak',
  'audit log should never leak',
  'ai raw payload should never leak',
  'internal billing data should never leak',
  'MISSING_ORGANIZATION_SCOPE',
  'UNVERIFIED_CUSTOMER_IDENTITY',
  'MISSING_CASE_LINKAGE',
  'PUBLICATION_NOT_ALLOWED',
  'CUSTOMER_VISIBLE_POLICY_FAILED',
  'case_query_override',
  'case_body_override',
  'case_header_override',
  'case_cookie_override',
  'raw request stack should not leak',
  'select secret_should_not_leak',
  'Bearer token_should_not_leak',
  'raw_case_payload_should_not_leak',
  'raw_row_should_not_leak',
  'db_row_should_not_leak',
  'provider_payload_should_not_leak',
  'debug_should_not_leak',
  'stack_should_not_leak',
  'authorization_should_not_leak',
  'customer_phone_raw_should_not_leak',
  'customer_address_raw_should_not_leak',
  'line_user_id_should_not_leak',
  'private_admin_only_should_not_leak',
  'report_container_should_not_leak',
  'appointment_container_should_not_leak',
  'case_container_should_not_leak',
  'internal_appointment_id_should_not_leak',
  'engineer_id_should_not_leak',
  'private_report_body_should_not_leak',
  'diagnosis_notes_should_not_leak',
  'completion_notes_should_not_leak',
  'auth_session_user_should_not_leak',
  'at stackFrame (internal.js:1)',
  'raw_status_should_not_leak',
  'internal_status_should_not_leak',
  'workflow_status_should_not_leak',
  'appointment_status_should_not_leak',
  'case_status_should_not_leak',
  'completion_status_should_not_leak',
  'repair_status_should_not_leak',
  'raw_summary_should_not_leak',
  'service_summary_should_not_leak',
  'approved_service_summary_should_not_leak',
  'ai_draft_summary_should_not_leak',
  'ai_generated_summary_should_not_leak',
  'case_id_should_not_leak',
  'raw_case_no_should_not_leak',
  'internal_case_no_should_not_leak',
  'case_reference_should_not_leak',
  'customer_case_id_should_not_leak',
  'appointment_id_should_not_leak',
  'appointment_reference_should_not_leak',
  'final_appointment_id_should_not_leak',
  'visit_id_should_not_leak',
  'engineer_visit_id_should_not_leak',
  'report_id_should_not_leak',
  'public_report_id_should_not_leak',
  'customer_report_reference_should_not_leak',
  'internal_report_id_should_not_leak',
  'private_report_id_should_not_leak',
  'customer_id_should_not_leak',
  'organization_id_should_not_leak',
];

function assertSafeResponse(response) {
  const serialized = JSON.stringify(response);

  for (const value of forbiddenValues) {
    assert.equal(serialized.includes(value), false, `controller response leaked forbidden value: ${value}`);
  }
}

function assertSafeAuditEvent(auditEvent) {
  const serialized = JSON.stringify(auditEvent);

  assert.deepEqual(
    Object.keys(auditEvent).sort(),
    Object.keys(auditEvent)
      .filter((key) => CUSTOMER_ACCESS_AUDIT_EVENT_KEYS.includes(key))
      .sort(),
  );

  if (auditEvent.metadata) {
    assert.deepEqual(
      Object.keys(auditEvent.metadata).sort(),
      Object.keys(auditEvent.metadata)
        .filter((key) => CUSTOMER_ACCESS_AUDIT_METADATA_KEYS.includes(key))
        .sort(),
    );
  }

  for (const value of forbiddenValues) {
    assert.equal(serialized.includes(value), false, `audit event leaked forbidden value: ${value}`);
  }
}

function assertGenericDeny(response) {
  assert.deepEqual(response, {
    status: 'deny',
    messageKey: 'customerAccess.unavailable',
    customerVisible: false,
    data: null,
    error: {
      messageKey: 'customerAccess.unavailable',
    },
  });
  assertSafeResponse(response);
}

function createSyntheticRes() {
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

function injectedFacade(buildCustomerAccessHttpResponse) {
  return {
    buildCustomerAccessHttpResponse,
  };
}

function validFacadeAllowResult(overrides = {}) {
  return {
    status: 'allow',
    messageKey: 'customerAccess.available',
    customerVisible: true,
    data: {
      serviceReport: {
        caseNo: 'CASE-001',
        status: 'completed',
        finalAppointmentId: 'appointment-final-001',
        summary: 'Service completed.',
        ...(overrides.serviceReport || {}),
      },
      ...(overrides.data || {}),
    },
    ...(overrides.envelope || {}),
  };
}

test('valid verified request returns allow envelope', () => {
  const response = buildCustomerAccessControllerResponse(validReq());

  assert.deepEqual(response, {
    status: 'allow',
    messageKey: 'customerAccess.available',
    customerVisible: true,
    data: {
      serviceReport: {
        caseNo: 'CASE-001',
        status: 'completed',
        finalAppointmentId: 'appointment-final-001',
        summary: 'Service completed.',
      },
    },
  });
  assertSafeResponse(response);
  assert.deepEqual(Object.keys(response), ['status', 'messageKey', 'customerVisible', 'data']);
  assert.deepEqual(Object.keys(response.data), ['serviceReport']);
  assert.deepEqual(Object.keys(response.data.serviceReport), [
    'caseNo',
    'finalAppointmentId',
    'status',
    'summary',
  ]);
});

test('valid request passes exact case overview DTO keys to facade', () => {
  const facadeInputs = [];
  const response = buildCustomerAccessControllerResponse(
    validReq(),
    injectedFacade((input) => {
      facadeInputs.push(input);
      return validFacadeAllowResult();
    }),
  );

  assert.equal(facadeInputs.length, 1);
  assert.deepEqual(Object.keys(facadeInputs[0]), ['caseId', 'customerAccessContext']);
  assert.equal(facadeInputs[0].caseId, 'case-synthetic');
  assert.deepEqual(Object.keys(facadeInputs[0].customerAccessContext), [
    'params',
    'auth',
    'channel',
    'access',
    'customerVisibleData',
  ]);
  assert.deepEqual(facadeInputs[0].customerAccessContext.params, { caseId: 'case-synthetic' });
  assert.equal(JSON.stringify(facadeInputs[0]).includes('case_query_override'), false);
  assert.equal(response.status, 'allow');
  assertSafeResponse(response);
});

test('missing customerAccessContext returns generic safe-deny despite forged request allow fields', () => {
  const req = validReq();
  delete req.customerAccessContext;
  req.query = { caseId: 'case_query_override' };
  req.body = { caseId: 'case_body_override' };
  req.headers = {
    'x-case-id': 'case_header_override',
    authorization: 'Bearer token_should_not_leak',
  };
  req.cookies = { caseId: 'case_cookie_override' };

  assertGenericDeny(buildCustomerAccessControllerResponse(req));
});

test('malformed customerAccessContext fails closed before facade call', () => {
  class ClassContext {
    constructor() {
      this.params = { caseId: 'case-synthetic' };
    }
  }

  for (const candidate of [
    null,
    undefined,
    'raw_case_payload_should_not_leak',
    [],
    new Date('2026-05-30T00:00:00.000Z'),
    new Error('raw request stack should not leak'),
    Buffer.from('raw_case_payload_should_not_leak'),
    { then() {} },
    new ClassContext(),
  ]) {
    const req = validReq();
    const facadeInputs = [];
    req.customerAccessContext = candidate;
    req.query = { caseId: 'case_query_override' };
    req.body = { caseId: 'case_body_override' };
    req.headers = { authorization: 'Bearer token_should_not_leak' };

    assertGenericDeny(buildCustomerAccessControllerResponse(
      req,
      injectedFacade((input) => {
        facadeInputs.push(input);
        return validFacadeAllowResult();
      }),
    ));
    assert.deepEqual(facadeInputs, []);
  }
});

test('missing input returns generic safe-deny without exception', () => {
  assertGenericDeny(buildCustomerAccessControllerResponse());
});

test('missing organization id returns generic safe-deny', () => {
  const req = validReq();
  delete req.auth.organizationId;
  delete req.customerAccessContext.auth.organizationId;

  assertGenericDeny(buildCustomerAccessControllerResponse(req));
});

test('missing case id returns generic safe-deny', () => {
  const req = validReq();
  delete req.params.caseId;

  assertGenericDeny(buildCustomerAccessControllerResponse(req));
});

test('caseId is accepted only from route params and cannot be supplied by query body header or cookie aliases', () => {
  const req = validReq();
  delete req.params.caseId;
  req.query = { caseId: 'case_query_override' };
  req.body = { caseId: 'case_body_override' };
  req.headers = { 'x-case-id': 'case_header_override' };
  req.cookies = { caseId: 'case_cookie_override' };

  assertGenericDeny(buildCustomerAccessControllerResponse(req));
});

test('malformed caseId values return sanitized safe-deny without raw value leak', () => {
  for (const candidate of [
    '',
    '   ',
    {},
    [],
    123,
    true,
    new Date('2026-05-30T00:00:00.000Z'),
    new Error('raw request stack should not leak'),
    Buffer.from('case-synthetic'),
    { then() {} },
    "case-synthetic' or '1'='1",
    'case-synthetic; select secret_should_not_leak',
    'Bearer token_should_not_leak',
    'authorization-header-case',
  ]) {
    const req = validReq();
    req.params.caseId = candidate;
    req.customerAccessContext.params.caseId = candidate;

    assertGenericDeny(buildCustomerAccessControllerResponse(req));
  }
});

test('route params caseId must match customerAccessContext caseId', () => {
  const req = validReq();
  req.customerAccessContext.params.caseId = 'case-other';

  assertGenericDeny(buildCustomerAccessControllerResponse(req));
});

test('unverified customer identity returns generic safe-deny', () => {
  const req = validReq();
  req.customerAccessContext.auth.customerIdentityVerified = false;

  assertGenericDeny(buildCustomerAccessControllerResponse(req));
});

test('raw phone only does not authorize', () => {
  assertGenericDeny(
    buildCustomerAccessControllerResponse({
      auth: { organizationId: 'org-synthetic' },
      access: { organizationScopeMatched: true },
      rawPhone: '0912-345-678',
    }),
  );
});

test('raw address only does not authorize', () => {
  assertGenericDeny(
    buildCustomerAccessControllerResponse({
      auth: { organizationId: 'org-synthetic' },
      access: { organizationScopeMatched: true },
      rawAddress: '台北市信義區測試路1號',
    }),
  );
});

test('LINE id alone does not authorize', () => {
  assertGenericDeny(
    buildCustomerAccessControllerResponse({
      auth: { organizationId: 'org-synthetic' },
      channel: { lineUserId: 'U1234567890abcdef' },
      access: { organizationScopeMatched: true },
    }),
  );
});

test('organizationId plus lineChannelId and lineUserId alone does not authorize', () => {
  assertGenericDeny(
    buildCustomerAccessControllerResponse({
      auth: { organizationId: 'org-synthetic' },
      channel: {
        lineChannelId: 'line-channel-synthetic',
        lineUserId: 'U1234567890abcdef',
      },
      access: { organizationScopeMatched: true },
    }),
  );
});

test('publication not allowed returns generic safe-deny', () => {
  const req = validReq();
  req.customerAccessContext.access.publicationAllowed = false;

  assertGenericDeny(buildCustomerAccessControllerResponse(req));
});

test('customer-visible policy failure returns generic safe-deny', () => {
  const req = validReq();
  req.customerAccessContext.access.customerVisiblePolicyPassed = false;

  assertGenericDeny(buildCustomerAccessControllerResponse(req));
});

test('deny response does not expose internal data or raw identifiers', () => {
  const req = validReq();
  req.customerAccessContext.auth.customerIdentityVerified = false;
  req.rawPhone = '0912-345-678';
  req.rawAddress = '台北市信義區測試路1號';
  req.customerAccessContext.customerVisibleData.serviceReport.internalNote = 'internal note should never leak';
  req.customerAccessContext.customerVisibleData.serviceReport.auditLog = 'audit log should never leak';
  req.customerAccessContext.customerVisibleData.serviceReport.aiRawPayload = 'ai raw payload should never leak';
  req.customerAccessContext.customerVisibleData.serviceReport.internalBillingData = 'internal billing data should never leak';

  assertGenericDeny(buildCustomerAccessControllerResponse(req));
});

test('facade throw and rejection return sanitized safe-deny without raw leak', () => {
  const thrown = new Error(
    'select secret_should_not_leak Bearer token_should_not_leak provider_payload_should_not_leak debug_should_not_leak',
  );
  thrown.stack = 'stack_should_not_leak\nat db_row_should_not_leak';

  assertGenericDeny(buildCustomerAccessControllerResponse(
    validReq(),
    injectedFacade(() => {
      throw thrown;
    }),
  ));

  assertGenericDeny(buildCustomerAccessControllerResponse(
    validReq(),
    injectedFacade(() => Promise.reject(thrown)),
  ));

  assertGenericDeny(buildCustomerAccessControllerResponse(
    validReq(),
    injectedFacade(() => Promise.reject('raw_case_payload_should_not_leak')),
  ));
});

test('malformed facade results return sanitized safe-deny without serializing raw value', () => {
  class MalformedFacadeResult {
    constructor() {
      this.status = 'allow';
      this.raw = 'raw_case_payload_should_not_leak';
    }
  }

  for (const candidate of [
    null,
    undefined,
    [],
    'raw_case_payload_should_not_leak',
    123,
    true,
    new Date('2026-05-30T00:00:00.000Z'),
    new Error('stack_should_not_leak'),
    Buffer.from('raw_case_payload_should_not_leak'),
    { then() {} },
    new MalformedFacadeResult(),
    {},
    { status: 'allow' },
    {
      status: 'allow',
      messageKey: 'customerAccess.available',
      customerVisible: true,
      data: null,
      raw: 'raw_case_payload_should_not_leak',
    },
    {
      status: 'allow',
      messageKey: 'customerAccess.available',
      customerVisible: true,
      data: {
        serviceReport: null,
        raw: 'raw_case_payload_should_not_leak',
      },
    },
  ]) {
    assertGenericDeny(buildCustomerAccessControllerResponse(
      validReq(),
      injectedFacade(() => candidate),
    ));
  }
});

test('facade allow result is allowlisted and unknown raw containers are not emitted', () => {
  const response = buildCustomerAccessControllerResponse(
    validReq(),
    injectedFacade(() => validFacadeAllowResult({
      envelope: {
        raw: 'raw_case_payload_should_not_leak',
        debug: 'debug_should_not_leak',
        stack: 'stack_should_not_leak',
      },
      data: {
        raw: 'raw_case_payload_should_not_leak',
        row: 'raw_row_should_not_leak',
        rows: ['raw_row_should_not_leak'],
        dbRow: 'db_row_should_not_leak',
        rawRow: 'raw_row_should_not_leak',
        payload: 'provider_payload_should_not_leak',
        result: 'raw_case_payload_should_not_leak',
        customerAccessContext: {
          organizationId: 'org_should_not_leak',
        },
      },
      serviceReport: {
        raw: 'raw_case_payload_should_not_leak',
        row: 'raw_row_should_not_leak',
        rows: ['raw_row_should_not_leak'],
        dbRow: 'db_row_should_not_leak',
        rawRow: 'raw_row_should_not_leak',
        payload: 'provider_payload_should_not_leak',
        result: 'raw_case_payload_should_not_leak',
        report: 'report_container_should_not_leak',
        appointment: 'appointment_container_should_not_leak',
        case: 'case_container_should_not_leak',
        debug: 'debug_should_not_leak',
        stack: 'stack_should_not_leak',
        sql: 'select secret_should_not_leak',
        headers: 'authorization_should_not_leak',
        authorization: 'authorization_should_not_leak',
        token: 'Bearer token_should_not_leak',
        internal_notes: 'private_admin_only_should_not_leak',
        engineer_notes: 'private_admin_only_should_not_leak',
        customer_phone_raw: 'customer_phone_raw_should_not_leak',
        customer_address_raw: 'customer_address_raw_should_not_leak',
        line_user_id: 'line_user_id_should_not_leak',
        provider_payload: 'provider_payload_should_not_leak',
        raw_payload: 'raw_case_payload_should_not_leak',
        private: 'private_admin_only_should_not_leak',
        adminOnly: 'private_admin_only_should_not_leak',
        appointmentId: 'appointment_container_should_not_leak',
        internalAppointmentId: 'internal_appointment_id_should_not_leak',
        engineerId: 'engineer_id_should_not_leak',
        private_report_body: 'private_report_body_should_not_leak',
        diagnosis_notes: 'diagnosis_notes_should_not_leak',
        completion_notes: 'completion_notes_should_not_leak',
        auth: 'auth_session_user_should_not_leak',
        session: 'auth_session_user_should_not_leak',
        user: 'auth_session_user_should_not_leak',
        rawStatus: 'raw_status_should_not_leak',
        internalStatus: 'internal_status_should_not_leak',
        workflowStatus: 'workflow_status_should_not_leak',
        appointmentStatus: 'appointment_status_should_not_leak',
        caseStatus: 'case_status_should_not_leak',
        completionStatus: 'completion_status_should_not_leak',
        repairStatus: 'repair_status_should_not_leak',
        rawSummary: 'raw_summary_should_not_leak',
        serviceSummary: 'service_summary_should_not_leak',
        service_summary: 'service_summary_should_not_leak',
        approved_service_summary: 'approved_service_summary_should_not_leak',
        ai_draft_summary: 'ai_draft_summary_should_not_leak',
        ai_generated_summary: 'ai_generated_summary_should_not_leak',
        caseId: 'case_id_should_not_leak',
        case_id: 'case_id_should_not_leak',
        id: 'case_id_should_not_leak',
        rawCaseNo: 'raw_case_no_should_not_leak',
        internalCaseNo: 'internal_case_no_should_not_leak',
        caseReference: 'case_reference_should_not_leak',
        customerCaseId: 'customer_case_id_should_not_leak',
        appointment_id: 'appointment_id_should_not_leak',
        final_appointment_id: 'final_appointment_id_should_not_leak',
        visitId: 'visit_id_should_not_leak',
        engineerVisitId: 'engineer_visit_id_should_not_leak',
        appointmentReference: 'appointment_reference_should_not_leak',
        reportId: 'report_id_should_not_leak',
        report_id: 'report_id_should_not_leak',
        public_report_id: 'public_report_id_should_not_leak',
        customerReportReference: 'customer_report_reference_should_not_leak',
        internalReportId: 'internal_report_id_should_not_leak',
        privateReportId: 'private_report_id_should_not_leak',
        customerId: 'customer_id_should_not_leak',
        organizationId: 'organization_id_should_not_leak',
      },
    })),
  );

  assert.deepEqual(response, {
    status: 'allow',
    messageKey: 'customerAccess.available',
    customerVisible: true,
    data: {
      serviceReport: {
        caseNo: 'CASE-001',
        finalAppointmentId: 'appointment-final-001',
        status: 'completed',
        summary: 'Service completed.',
      },
    },
  });
  assertSafeResponse(response);
});

test('facade allow result uses only approved customer-visible status and summary source fields', () => {
  const response = buildCustomerAccessControllerResponse(
    validReq(),
    injectedFacade(() => validFacadeAllowResult({
      serviceReport: {
        status: undefined,
        summary: undefined,
        rawStatus: 'raw_status_should_not_leak',
        internalStatus: 'internal_status_should_not_leak',
        workflowStatus: 'workflow_status_should_not_leak',
        appointmentStatus: 'appointment_status_should_not_leak',
        caseStatus: 'case_status_should_not_leak',
        completionStatus: 'completion_status_should_not_leak',
        repairStatus: 'repair_status_should_not_leak',
        rawSummary: 'raw_summary_should_not_leak',
        serviceSummary: 'service_summary_should_not_leak',
        service_summary: 'service_summary_should_not_leak',
        approved_service_summary: 'approved_service_summary_should_not_leak',
        internal_notes: 'private_admin_only_should_not_leak',
        engineer_notes: 'private_admin_only_should_not_leak',
        diagnosis_notes: 'diagnosis_notes_should_not_leak',
        completion_notes: 'completion_notes_should_not_leak',
        private_report_body: 'private_report_body_should_not_leak',
        ai_draft_summary: 'ai_draft_summary_should_not_leak',
        ai_generated_summary: 'ai_generated_summary_should_not_leak',
        provider_payload: 'provider_payload_should_not_leak',
        raw_payload: 'raw_case_payload_should_not_leak',
        debug: 'debug_should_not_leak',
      },
    })),
  );

  assert.deepEqual(response, {
    status: 'allow',
    messageKey: 'customerAccess.available',
    customerVisible: true,
    data: {
      serviceReport: {
        caseNo: 'CASE-001',
        finalAppointmentId: 'appointment-final-001',
      },
    },
  });
  assertSafeResponse(response);
});

test('facade allow result uses only approved customer-visible identifier source fields', () => {
  const response = buildCustomerAccessControllerResponse(
    validReq(),
    injectedFacade(() => validFacadeAllowResult({
      serviceReport: {
        caseNo: undefined,
        finalAppointmentId: undefined,
        publicReportId: undefined,
        caseId: 'case_id_should_not_leak',
        case_id: 'case_id_should_not_leak',
        id: 'case_id_should_not_leak',
        rawCaseNo: 'raw_case_no_should_not_leak',
        internalCaseNo: 'internal_case_no_should_not_leak',
        caseReference: 'case_reference_should_not_leak',
        customerCaseId: 'customer_case_id_should_not_leak',
        appointmentId: 'appointment_id_should_not_leak',
        appointment_id: 'appointment_id_should_not_leak',
        internalAppointmentId: 'internal_appointment_id_should_not_leak',
        final_appointment_id: 'final_appointment_id_should_not_leak',
        visitId: 'visit_id_should_not_leak',
        engineerVisitId: 'engineer_visit_id_should_not_leak',
        appointmentReference: 'appointment_reference_should_not_leak',
        reportId: 'report_id_should_not_leak',
        report_id: 'report_id_should_not_leak',
        public_report_id: 'public_report_id_should_not_leak',
        customerReportReference: 'customer_report_reference_should_not_leak',
        internalReportId: 'internal_report_id_should_not_leak',
        privateReportId: 'private_report_id_should_not_leak',
        customerId: 'customer_id_should_not_leak',
        organizationId: 'organization_id_should_not_leak',
        line_user_id: 'line_user_id_should_not_leak',
        customer_phone_raw: 'customer_phone_raw_should_not_leak',
        customer_address_raw: 'customer_address_raw_should_not_leak',
      },
    })),
  );

  assert.deepEqual(response, {
    status: 'allow',
    messageKey: 'customerAccess.available',
    customerVisible: true,
    data: {
      serviceReport: {
        status: 'completed',
        summary: 'Service completed.',
      },
    },
  });
  assertSafeResponse(response);
});

test('facade allow result omits malformed allowed serviceReport values without raw leak', () => {
  class UnsafeDisplayValue {
    constructor() {
      this.value = 'private_admin_only_should_not_leak';
    }
  }

  const unsafeCandidates = [
    {},
    [],
    new Error('stack_should_not_leak'),
    new Date('2026-05-30T00:00:00.000Z'),
    Buffer.from('raw_case_payload_should_not_leak'),
    { then() {} },
    () => 'private_admin_only_should_not_leak',
    new UnsafeDisplayValue(),
    'select secret_should_not_leak',
    'Bearer token_should_not_leak',
    'authorization header should not leak',
    'at stackFrame (internal.js:1)',
  ];

  for (const candidate of unsafeCandidates) {
    const unsafeSummaryResponse = buildCustomerAccessControllerResponse(
      validReq(),
      injectedFacade(() => validFacadeAllowResult({
        serviceReport: {
          caseNo: 'CASE-001',
          finalAppointmentId: candidate,
          publicReportId: candidate,
          status: 'completed',
          summary: candidate,
        },
      })),
    );

    assert.deepEqual(unsafeSummaryResponse, {
      status: 'allow',
      messageKey: 'customerAccess.available',
      customerVisible: true,
      data: {
        serviceReport: {
          caseNo: 'CASE-001',
          status: 'completed',
        },
      },
    });
    assertSafeResponse(unsafeSummaryResponse);

    const unsafeStatusResponse = buildCustomerAccessControllerResponse(
      validReq(),
      injectedFacade(() => validFacadeAllowResult({
        serviceReport: {
          caseNo: 'CASE-001',
          finalAppointmentId: 'appointment-final-001',
          publicReportId: 'report-public-001',
          status: candidate,
          summary: 'Service completed.',
        },
      })),
    );

    assert.deepEqual(unsafeStatusResponse, {
      status: 'allow',
      messageKey: 'customerAccess.available',
      customerVisible: true,
      data: {
        serviceReport: {
          caseNo: 'CASE-001',
          finalAppointmentId: 'appointment-final-001',
          publicReportId: 'report-public-001',
          summary: 'Service completed.',
        },
      },
    });
    assertSafeResponse(unsafeStatusResponse);

    const unsafeIdentifierResponse = buildCustomerAccessControllerResponse(
      validReq(),
      injectedFacade(() => validFacadeAllowResult({
        serviceReport: {
          caseNo: candidate,
          finalAppointmentId: candidate,
          publicReportId: candidate,
          status: 'completed',
          summary: 'Service completed.',
        },
      })),
    );

    assert.deepEqual(unsafeIdentifierResponse, {
      status: 'allow',
      messageKey: 'customerAccess.available',
      customerVisible: true,
      data: {
        serviceReport: {
          status: 'completed',
          summary: 'Service completed.',
        },
      },
    });
    assertSafeResponse(unsafeIdentifierResponse);
  }
});

test('handler writes res.status(...).json(...) once for allow', () => {
  const res = createSyntheticRes();
  const body = handleCustomerAccessRequest(validReq(), res);

  assert.deepEqual(res.calls.status, [200]);
  assert.equal(res.calls.json.length, 1);
  assert.deepEqual(body, res.calls.json[0]);
  assert.equal(body.status, 'allow');
  assertSafeResponse(body);
});

test('handler writes res.status(...).json(...) once for deny', () => {
  const res = createSyntheticRes();
  const req = validReq();
  req.customerAccessContext.auth.customerIdentityVerified = false;
  const body = handleCustomerAccessRequest(req, res);

  assert.deepEqual(res.calls.status, [404]);
  assert.equal(res.calls.json.length, 1);
  assert.deepEqual(body, res.calls.json[0]);
  assert.equal(body.status, 'deny');
  assertSafeResponse(body);
});

test('input req object is not mutated and finalAppointmentId is not modified', () => {
  const req = validReq();
  req.customerAccessContext.customerVisibleData.serviceReport.phone = '0912-345-678';
  const before = JSON.parse(JSON.stringify(req));

  const response = buildCustomerAccessControllerResponse(req);

  assert.deepEqual(req, before);
  assert.equal(req.customerAccessContext.customerVisibleData.serviceReport.finalAppointmentId, 'appointment-final-001');
  assert.equal(response.data.serviceReport.finalAppointmentId, 'appointment-final-001');
  assertSafeResponse(response);
});

test('case overview allow response writes one injected audit event without changing response', () => {
  const auditEvents = [];
  const response = buildCustomerAccessControllerResponse(
    validReq(),
    {
      buildCustomerAccessHttpResponse: () => validFacadeAllowResult(),
      auditWriter: (auditEvent) => {
        auditEvents.push(auditEvent);

        return {
          ok: true,
          status: 'recorded',
          auditWritten: true,
          persisted: true,
          rawResult: 'audit log should never leak',
        };
      },
    },
  );

  assert.deepEqual(response, {
    status: 'allow',
    messageKey: 'customerAccess.available',
    customerVisible: true,
    data: {
      serviceReport: {
        caseNo: 'CASE-001',
        finalAppointmentId: 'appointment-final-001',
        status: 'completed',
        summary: 'Service completed.',
      },
    },
  });
  assert.equal(auditEvents.length, 1);
  assert.deepEqual(auditEvents[0], {
    eventType: 'customer_access.case_overview.allow',
    organizationId: 'org-synthetic',
    customerId: 'customer-synthetic',
    caseId: 'case-synthetic',
    decision: 'allow',
    route: '/customer-access/:caseId',
    method: 'GET',
    source: 'customer_access_controller',
    metadata: {
      routeMatched: true,
      contextPresent: true,
      identifierValid: true,
    },
  });
  assertSafeAuditEvent(auditEvents[0]);
  assertSafeResponse(response);
});

test('case overview safe-deny response writes one injected deny audit event without changing response', () => {
  const auditEvents = [];
  const response = buildCustomerAccessControllerResponse(
    validReq(),
    {
      buildCustomerAccessHttpResponse: () => ({
        status: 'deny',
        reason: 'MISSING_ORGANIZATION_SCOPE',
        raw: 'raw_case_payload_should_not_leak',
      }),
      auditWriter: (auditEvent) => {
        auditEvents.push(auditEvent);

        return {
          ok: true,
          status: 'recorded',
          auditWritten: true,
          persisted: true,
        };
      },
    },
  );

  assertGenericDeny(response);
  assert.equal(auditEvents.length, 1);
  assert.deepEqual(auditEvents[0], {
    eventType: 'customer_access.case_overview.deny',
    organizationId: 'org-synthetic',
    customerId: 'customer-synthetic',
    caseId: 'case-synthetic',
    decision: 'deny',
    reasonCode: 'customerAccess.unavailable',
    route: '/customer-access/:caseId',
    method: 'GET',
    source: 'customer_access_controller',
    metadata: {
      routeMatched: true,
      contextPresent: true,
      identifierValid: true,
    },
  });
  assertSafeAuditEvent(auditEvents[0]);
});

test('case overview without auditWriter preserves allow and deny responses with no audit attempt', () => {
  const allowResponse = buildCustomerAccessControllerResponse(
    validReq(),
    injectedFacade(() => validFacadeAllowResult()),
  );
  const denyResponse = buildCustomerAccessControllerResponse(
    validReq(),
    injectedFacade(() => ({
      status: 'deny',
      raw: 'raw_case_payload_should_not_leak',
    })),
  );

  assert.equal(allowResponse.status, 'allow');
  assertGenericDeny(denyResponse);
  assert.equal(JSON.stringify(allowResponse).includes('auditWritten'), false);
  assert.equal(JSON.stringify(denyResponse).includes('auditWritten'), false);
});

test('audit writer throw reject or malformed result never changes customer response', async () => {
  const expectedAllow = buildCustomerAccessControllerResponse(
    validReq(),
    injectedFacade(() => validFacadeAllowResult()),
  );
  const expectedDeny = buildCustomerAccessControllerResponse(
    validReq(),
    injectedFacade(() => ({ status: 'deny' })),
  );

  for (const auditWriter of [
    () => {
      throw new Error('stack_should_not_leak');
    },
    async () => {
      throw new Error('stack_should_not_leak');
    },
    () => ({
      ok: true,
      status: 'recorded',
      auditWritten: false,
      persisted: true,
      raw: 'audit log should never leak',
    }),
  ]) {
    const allowResponse = buildCustomerAccessControllerResponse(
      validReq(),
      {
        buildCustomerAccessHttpResponse: () => validFacadeAllowResult(),
        auditWriter,
      },
    );
    const denyResponse = buildCustomerAccessControllerResponse(
      validReq(),
      {
        buildCustomerAccessHttpResponse: () => ({ status: 'deny' }),
        auditWriter,
      },
    );

    await Promise.resolve();

    assert.deepEqual(allowResponse, expectedAllow);
    assert.deepEqual(denyResponse, expectedDeny);
    assertSafeResponse(allowResponse);
    assertSafeResponse(denyResponse);
    assert.equal(JSON.stringify(allowResponse).includes('auditWritten'), false);
    assert.equal(JSON.stringify(denyResponse).includes('auditWritten'), false);
  }
});

test('case overview audit event does not include raw request context facade or private fields', () => {
  const req = validReq();
  const auditEvents = [];
  req.headers = { authorization: 'Bearer token_should_not_leak' };
  req.rawHeaders = ['authorization', 'Bearer token_should_not_leak'];
  req.body = { sql: 'select secret_should_not_leak' };
  req.query = { debug: 'debug_should_not_leak' };
  req.cookies = { session: 'auth_session_user_should_not_leak' };
  req.user = { private: 'private_admin_only_should_not_leak' };
  req.session = { token: 'Bearer token_should_not_leak' };
  req.customerAccessContext.raw = 'raw_case_payload_should_not_leak';
  req.customerAccessContext.auth.session = 'auth_session_user_should_not_leak';
  req.customerAccessContext.auth.authorization = 'Bearer token_should_not_leak';
  req.customerAccessContext.auth.customerPhone = 'customer_phone_raw_should_not_leak';
  req.customerAccessContext.auth.customerAddress = 'customer_address_raw_should_not_leak';
  req.customerAccessContext.channel.rawLineUserId = 'line_user_id_should_not_leak';
  req.customerAccessContext.customerVisibleData.serviceReport.provider_payload = 'provider_payload_should_not_leak';
  req.customerAccessContext.customerVisibleData.serviceReport.sql = 'select secret_should_not_leak';
  req.customerAccessContext.customerVisibleData.serviceReport.debug = 'debug_should_not_leak';
  req.customerAccessContext.customerVisibleData.serviceReport.private = 'private_admin_only_should_not_leak';

  const response = buildCustomerAccessControllerResponse(
    req,
    {
      buildCustomerAccessHttpResponse: () => validFacadeAllowResult({
        envelope: {
          raw: 'raw_case_payload_should_not_leak',
          debug: 'debug_should_not_leak',
        },
        data: {
          dbRow: 'db_row_should_not_leak',
        },
        serviceReport: {
          provider_payload: 'provider_payload_should_not_leak',
          sql: 'select secret_should_not_leak',
          debug: 'debug_should_not_leak',
          private: 'private_admin_only_should_not_leak',
        },
      }),
      auditWriter: (auditEvent) => {
        auditEvents.push(auditEvent);

        return {
          ok: true,
          status: 'recorded',
          auditWritten: true,
          persisted: true,
        };
      },
    },
  );

  assert.equal(response.status, 'allow');
  assert.equal(auditEvents.length, 1);
  assertSafeAuditEvent(auditEvents[0]);
  assertSafeResponse(response);
  assert.equal(JSON.stringify(response).includes('auditWritten'), false);
});

test('invalid overview input skips audit writer and keeps safe-deny response unchanged', () => {
  let auditCallCount = 0;
  const req = validReq();
  req.params.caseId = 'Bearer token_should_not_leak';
  req.customerAccessContext.params.caseId = 'Bearer token_should_not_leak';

  const response = buildCustomerAccessControllerResponse(
    req,
    {
      buildCustomerAccessHttpResponse: () => validFacadeAllowResult(),
      auditWriter: () => {
        auditCallCount += 1;

        return {
          ok: true,
          status: 'recorded',
          auditWritten: true,
          persisted: true,
        };
      },
    },
  );

  assertGenericDeny(response);
  assert.equal(auditCallCount, 0);
});
