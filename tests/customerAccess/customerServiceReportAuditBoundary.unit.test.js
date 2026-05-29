'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  AUDIT_EVENT_TYPE,
  buildCustomerServiceReportAuditEvent,
  recordCustomerServiceReportAuditEvent,
} = require('../../src/customerAccess/customerServiceReportAuditBoundary');

function request(overrides = {}) {
  return {
    requestId: 'request_audit_001',
    params: {
      caseId: 'case_audit_001',
      reportId: 'report_audit_001',
    },
    auth: {
      organizationId: 'org_audit_001',
      customerId: 'customer_audit_001',
    },
    access: {
      publicationAllowed: true,
      customerVisiblePolicyPassed: true,
    },
    customerAccessContext: {
      organizationId: 'org_audit_001',
      customerId: 'customer_audit_001',
      customerAccessContextId: 'ctx_audit_001',
      customerIdentityLinkId: 'link_audit_001',
      access: {
        publicationAllowed: true,
        customerVisiblePolicyPassed: true,
      },
    },
    rawPhone: '0912-345-678',
    rawAddress: 'No. 1 Secret Road',
    providerRawPayload: {
      token: 'provider_payload_should_not_leak',
    },
    token: 'token_should_not_leak',
    ...overrides,
  };
}

function allowBody() {
  return {
    status: 'allow',
    messageKey: 'customerAccess.serviceReport.available',
    customerVisible: true,
    data: {
      serviceReport: {
        customerReportReference: 'report_audit_001',
        serviceSummary: 'summary_should_not_be_in_audit',
        finalAppointmentId: 'final_appointment_should_not_leak',
        internalNote: 'internal_note_should_not_leak',
      },
    },
  };
}

function denyBody() {
  return {
    status: 'deny',
    messageKey: 'customerAccess.unavailable',
    customerVisible: false,
    data: null,
    error: {
      messageKey: 'customerAccess.unavailable',
    },
  };
}

function assertNoLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    '0912-345-678',
    'No. 1 Secret Road',
    'provider_payload_should_not_leak',
    'token_should_not_leak',
    'summary_should_not_be_in_audit',
    'final_appointment_should_not_leak',
    'internal_note_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `audit leaked ${forbidden}`);
  }
}

test('builds minimal sanitized allow audit event', () => {
  const event = buildCustomerServiceReportAuditEvent({
    request: request(),
    responseBody: allowBody(),
    occurredAt: '2026-05-29T00:00:00.000Z',
  });

  assert.deepEqual(event, {
    eventType: AUDIT_EVENT_TYPE,
    action: 'customer_service_report_access',
    outcome: 'allow',
    decision: {
      status: 'allow',
      messageKey: 'customerAccess.serviceReport.available',
      customerVisible: true,
      publicationAllowed: true,
      customerVisiblePolicyPassed: true,
    },
    organizationId: 'org_audit_001',
    customerId: 'customer_audit_001',
    caseId: 'case_audit_001',
    reportId: 'report_audit_001',
    customerAccessContextId: 'ctx_audit_001',
    customerIdentityLinkId: 'link_audit_001',
    requestId: 'request_audit_001',
    occurredAt: '2026-05-29T00:00:00.000Z',
  });
  assertNoLeak(event);
});

test('builds sanitized deny audit event without customer-visible data', () => {
  const event = buildCustomerServiceReportAuditEvent({
    request: request({
      access: {
        publicationAllowed: false,
        customerVisiblePolicyPassed: false,
      },
    }),
    responseBody: denyBody(),
  });

  assert.equal(event.outcome, 'deny');
  assert.equal(event.decision.status, 'deny');
  assert.equal(event.decision.messageKey, 'customerAccess.unavailable');
  assert.equal(event.decision.customerVisible, false);
  assert.equal(event.decision.publicationAllowed, false);
  assert.equal(event.decision.customerVisiblePolicyPassed, false);
  assert.equal(event.caseId, 'case_audit_001');
  assert.equal(event.reportId, 'report_audit_001');
  assertNoLeak(event);
});

test('writer failure is swallowed and reports sanitized failure state', async () => {
  const writes = [];
  const result = await recordCustomerServiceReportAuditEvent({
    request: request(),
    responseBody: denyBody(),
    auditWriter(event) {
      writes.push(event);
      throw new Error('token_should_not_leak');
    },
  });

  assert.equal(result.written, false);
  assert.equal(result.failed, true);
  assert.equal(result.skipped, false);
  assert.equal(writes.length, 1);
  assertNoLeak(result);
});

test('missing writer skips without throwing', async () => {
  const result = await recordCustomerServiceReportAuditEvent({
    request: request(),
    responseBody: denyBody(),
  });

  assert.equal(result.written, false);
  assert.equal(result.skipped, true);
  assertNoLeak(result);
});
