'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { buildCustomerAccessResponse } = require('../../src/customerAccess/customerAccessService');

const validInput = () => ({
  organizationScope: { present: true, matches: true },
  customerIdentity: { verified: true },
  caseLinkage: { linked: true },
  publication: { allowed: true },
  customerVisiblePolicy: { passed: true },
  finalAppointmentId: 'appointment-final-001',
  customerVisibleData: {
    serviceReport: {
      caseNo: 'CASE-001',
      status: 'completed',
      finalAppointmentId: 'appointment-final-001',
      summary: 'Service completed.',
    },
  },
});

const forbiddenValues = [
  '0912-345-678',
  '台北市信義區測試路1號',
  'U1234567890abcdef',
  'internal note should never leak',
  'audit log should never leak',
  'ai raw payload should never leak',
  'internal billing data should never leak',
  'MISSING_ORGANIZATION_SCOPE',
  'RAW_PHONE_ONLY',
  'RAW_ADDRESS_ONLY',
  'LINE_ID_ONLY',
  'SCOPED_CHANNEL_IDENTITY_ONLY',
];

function assertSafeResponse(response) {
  const serialized = JSON.stringify(response);

  for (const value of forbiddenValues) {
    assert.equal(serialized.includes(value), false, `response leaked forbidden value: ${value}`);
  }
}

test('valid access returns allow envelope', () => {
  const response = buildCustomerAccessResponse(validInput());

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
});

test('deny access returns generic safe-deny envelope', () => {
  const input = validInput();
  input.customerIdentity = { verified: false };

  const response = buildCustomerAccessResponse(input);

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
});

test('missing input returns generic safe-deny envelope', () => {
  const response = buildCustomerAccessResponse();

  assert.equal(response.status, 'deny');
  assert.equal(response.messageKey, 'customerAccess.unavailable');
  assert.equal(response.data, null);
  assertSafeResponse(response);
});

test('raw phone only returns generic safe-deny envelope', () => {
  const response = buildCustomerAccessResponse({
    organizationScope: { present: true, matches: true },
    rawPhone: '0912-345-678',
  });

  assert.equal(response.status, 'deny');
  assertSafeResponse(response);
});

test('raw address only returns generic safe-deny envelope', () => {
  const response = buildCustomerAccessResponse({
    organizationScope: { present: true, matches: true },
    rawAddress: '台北市信義區測試路1號',
  });

  assert.equal(response.status, 'deny');
  assertSafeResponse(response);
});

test('LINE id alone returns generic safe-deny envelope', () => {
  const response = buildCustomerAccessResponse({
    organizationScope: { present: true, matches: true },
    rawLineUserId: 'U1234567890abcdef',
  });

  assert.equal(response.status, 'deny');
  assertSafeResponse(response);
});

test('scoped channel identity only returns generic safe-deny envelope', () => {
  const response = buildCustomerAccessResponse({
    organizationScope: { present: true, matches: true },
    organization_id: 'org-synthetic',
    line_channel_id: 'line-channel-synthetic',
    line_user_id: 'U1234567890abcdef',
  });

  assert.equal(response.status, 'deny');
  assertSafeResponse(response);
});

test('allow response strips forbidden customer-visible fields via envelope helper', () => {
  const input = validInput();
  input.customerVisibleData.serviceReport.phone = '0912-345-678';
  input.customerVisibleData.serviceReport.address = '台北市信義區測試路1號';
  input.customerVisibleData.serviceReport.rawLineUserId = 'U1234567890abcdef';
  input.customerVisibleData.serviceReport.internalNote = 'internal note should never leak';
  input.customerVisibleData.serviceReport.auditLog = 'audit log should never leak';
  input.customerVisibleData.serviceReport.aiRawPayload = 'ai raw payload should never leak';
  input.customerVisibleData.serviceReport.internalBillingData = 'internal billing data should never leak';
  input.customerVisibleData.serviceReport.maskedPhone = '09xx-xxx-678';

  const response = buildCustomerAccessResponse(input);

  assert.deepEqual(response.data, {
    serviceReport: {
      caseNo: 'CASE-001',
      status: 'completed',
      finalAppointmentId: 'appointment-final-001',
      summary: 'Service completed.',
      maskedPhone: '09xx-xxx-678',
    },
  });
  assertSafeResponse(response);
});

test('input object is not mutated and finalAppointmentId is not modified', () => {
  const input = validInput();
  input.customerVisibleData.serviceReport.phone = '0912-345-678';
  const before = JSON.parse(JSON.stringify(input));

  const response = buildCustomerAccessResponse(input);

  assert.deepEqual(input, before);
  assert.equal(input.finalAppointmentId, 'appointment-final-001');
  assert.equal(input.customerVisibleData.serviceReport.finalAppointmentId, 'appointment-final-001');
  assert.equal(response.data.serviceReport.finalAppointmentId, 'appointment-final-001');
  assertSafeResponse(response);
});
