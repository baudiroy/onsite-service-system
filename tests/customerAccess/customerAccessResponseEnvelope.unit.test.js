'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildCustomerAccessAllowEnvelope,
  buildCustomerAccessDenyEnvelope,
  buildCustomerAccessEnvelope,
} = require('../../src/customerAccess/customerAccessResponseEnvelope');

const forbiddenValues = [
  'CASE_EXISTS_INTERNAL',
  'CUSTOMER_EXISTS_INTERNAL',
  'ORG_MISMATCH_INTERNAL',
  'IDENTITY_MISMATCH_INTERNAL',
  'PUBLICATION_DRAFT_INTERNAL',
  '0912-345-678',
  '台北市信義區測試路1號',
  'U1234567890abcdef',
  'internal note should never leak',
  'audit log should never leak',
  'ai raw payload should never leak',
  'internal billing data should never leak',
  'token should never leak',
  'secret should never leak',
];

function assertSafeEnvelope(envelope) {
  const serialized = JSON.stringify(envelope);

  for (const value of forbiddenValues) {
    assert.equal(serialized.includes(value), false, `envelope leaked forbidden value: ${value}`);
  }
}

test('deny envelope uses generic safe-deny', () => {
  const envelope = buildCustomerAccessDenyEnvelope({
    internalReasonCode: 'CASE_EXISTS_INTERNAL',
  });

  assert.deepEqual(envelope, {
    status: 'deny',
    messageKey: 'customerAccess.unavailable',
    customerVisible: false,
    data: null,
    error: {
      messageKey: 'customerAccess.unavailable',
    },
  });
  assertSafeEnvelope(envelope);
});

test('deny envelope does not expose internal resolver reason or existence hints', () => {
  const envelope = buildCustomerAccessEnvelope({
    decision: {
      allowed: false,
      internalReasonCode: 'CASE_EXISTS_INTERNAL',
      customerExists: 'CUSTOMER_EXISTS_INTERNAL',
      organizationMismatchReason: 'ORG_MISMATCH_INTERNAL',
      identityMismatchReason: 'IDENTITY_MISMATCH_INTERNAL',
      publicationInternalReason: 'PUBLICATION_DRAFT_INTERNAL',
      permissionDetails: 'permission details should never leak',
    },
  });

  assert.equal(envelope.status, 'deny');
  assert.equal(envelope.messageKey, 'customerAccess.unavailable');
  assert.equal(envelope.data, null);
  assert.equal(envelope.error.messageKey, 'customerAccess.unavailable');
  assert.equal('internalReasonCode' in envelope, false);
  assertSafeEnvelope(envelope);
});

test('deny envelope does not expose raw phone, address, or LINE id', () => {
  const envelope = buildCustomerAccessEnvelope({
    decision: { allowed: false },
    rawPhone: '0912-345-678',
    rawAddress: '台北市信義區測試路1號',
    rawLineUserId: 'U1234567890abcdef',
  });

  assert.equal(envelope.status, 'deny');
  assertSafeEnvelope(envelope);
});

test('allow envelope wraps only provided customer-visible service report data', () => {
  const envelope = buildCustomerAccessAllowEnvelope({
    data: {
      serviceReport: {
        caseNo: 'CASE-001',
        status: 'completed',
        completedAt: '2026-05-21T10:00:00.000Z',
        summary: 'Service completed.',
      },
    },
  });

  assert.deepEqual(envelope, {
    status: 'allow',
    messageKey: 'customerAccess.available',
    customerVisible: true,
    data: {
      serviceReport: {
        caseNo: 'CASE-001',
        status: 'completed',
        completedAt: '2026-05-21T10:00:00.000Z',
        summary: 'Service completed.',
      },
    },
  });
  assertSafeEnvelope(envelope);
});

test('allow envelope strips internal note, audit log, AI payload, and internal billing data', () => {
  const envelope = buildCustomerAccessEnvelope({
    decision: { allowed: true },
    data: {
      serviceReport: {
        caseNo: 'CASE-001',
        summary: 'Service completed.',
        internalNote: 'internal note should never leak',
        auditLog: 'audit log should never leak',
        aiRawPayload: 'ai raw payload should never leak',
        internalBillingData: 'internal billing data should never leak',
      },
    },
  });

  assert.equal(envelope.status, 'allow');
  assert.deepEqual(envelope.data, {
    serviceReport: {
      caseNo: 'CASE-001',
      summary: 'Service completed.',
    },
  });
  assertSafeEnvelope(envelope);
});

test('allow envelope strips raw LINE id, token, and secret', () => {
  const envelope = buildCustomerAccessEnvelope({
    decision: { allowed: true },
    data: {
      serviceReport: {
        caseNo: 'CASE-001',
        rawLineUserId: 'U1234567890abcdef',
        line_user_id: 'U1234567890abcdef',
        token: 'token should never leak',
        secret: 'secret should never leak',
      },
    },
  });

  assert.equal(envelope.status, 'allow');
  assert.deepEqual(envelope.data, {
    serviceReport: {
      caseNo: 'CASE-001',
    },
  });
  assertSafeEnvelope(envelope);
});

test('allow envelope strips unmasked phone and address while keeping masked public-safe values', () => {
  const envelope = buildCustomerAccessEnvelope({
    decision: { allowed: true },
    data: {
      serviceReport: {
        caseNo: 'CASE-001',
        phone: '0912-345-678',
        address: '台北市信義區測試路1號',
        maskedPhone: '09xx-xxx-678',
        publicAddressSummary: '台北市信義區',
      },
    },
  });

  assert.deepEqual(envelope.data, {
    serviceReport: {
      caseNo: 'CASE-001',
      maskedPhone: '09xx-xxx-678',
      publicAddressSummary: '台北市信義區',
    },
  });
  assertSafeEnvelope(envelope);
});

test('malformed or missing input returns generic deny', () => {
  assert.deepEqual(buildCustomerAccessEnvelope(), buildCustomerAccessDenyEnvelope());
  assert.deepEqual(buildCustomerAccessEnvelope(null), buildCustomerAccessDenyEnvelope());
  assert.deepEqual(buildCustomerAccessAllowEnvelope({ decision: { allowed: true } }), buildCustomerAccessDenyEnvelope());
});

test('does not mutate input or finalAppointmentId', () => {
  const input = {
    decision: { allowed: true },
    data: {
      serviceReport: {
        caseNo: 'CASE-001',
        finalAppointmentId: 'appointment-final-001',
        phone: '0912-345-678',
        address: '台北市信義區測試路1號',
      },
    },
  };
  const before = JSON.parse(JSON.stringify(input));

  const envelope = buildCustomerAccessEnvelope(input);

  assert.deepEqual(input, before);
  assert.equal(input.data.serviceReport.finalAppointmentId, 'appointment-final-001');
  assert.equal(envelope.data.serviceReport.finalAppointmentId, 'appointment-final-001');
  assertSafeEnvelope(envelope);
});
