'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createEngineerMobileWorkbenchDenyEnvelope,
  createEngineerMobileWorkbenchErrorEnvelope,
  createEngineerMobileWorkbenchSuccessEnvelope,
  sanitizeWorkbenchMetadata,
  sanitizeWorkbenchPayload,
} = require('../../src/engineerMobile/engineerMobileWorkbenchSafeEnvelope');

const ENVELOPE_SOURCE = path.join(
  __dirname,
  '../../src/engineerMobile/engineerMobileWorkbenchSafeEnvelope.js',
);

function unsafePayload() {
  return {
    appointmentId: 'apt_1752_001',
    customerDisplayName: 'Safe customer',
    finalAppointmentId: 'final_appointment_should_not_leak',
    internalNote: 'internal_note_should_not_leak',
    rawSql: 'select * from appointments',
    token: 'token_should_not_leak',
    nested: {
      status: 'confirmed',
      providerDebug: 'provider_debug_should_not_leak',
      rawSession: 'raw_session_should_not_leak',
    },
    rows: [
      {
        label: 'safe row',
        secret: 'secret_should_not_leak',
        rawUser: 'raw_user_should_not_leak',
      },
    ],
  };
}

function unsafeMetadata() {
  return {
    requestId: 'req_1752',
    traceId: 'trace_1752',
    organizationId: 'org_1752',
    engineerUserId: 'eng_1752',
    appointmentId: 'apt_1752_001',
    reason: 'repository_unavailable',
    token: 'token_should_not_leak',
    cookie: 'cookie_should_not_leak',
    authorization: 'authorization_should_not_leak',
    rawSql: 'select * from appointments',
    rawUser: 'raw_user_should_not_leak',
    unsafeReason: 'unsafe reason with spaces',
  };
}

function assertNoForbiddenLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'authorization_should_not_leak',
    'cookie_should_not_leak',
    'final_appointment_should_not_leak',
    'internal_note_should_not_leak',
    'provider_debug_should_not_leak',
    'raw_session_should_not_leak',
    'raw_user_should_not_leak',
    'secret_should_not_leak',
    'select * from appointments',
    'stack_trace_should_not_leak',
    'token_should_not_leak',
    'unsafe reason with spaces',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('success envelope includes safe data and safe metadata only', () => {
  const envelope = createEngineerMobileWorkbenchSuccessEnvelope({
    messageKey: 'engineerMobile.assignedAppointments.available',
    data: {
      appointments: [unsafePayload()],
    },
    metadata: unsafeMetadata(),
  });

  assert.equal(envelope.status, 'allow');
  assert.equal(envelope.engineerMobileVisible, true);
  assert.equal(envelope.data.appointments[0].appointmentId, 'apt_1752_001');
  assert.equal(envelope.data.appointments[0].customerDisplayName, 'Safe customer');
  assert.deepEqual(envelope.metadata, {
    appointmentId: 'apt_1752_001',
    engineerUserId: 'eng_1752',
    organizationId: 'org_1752',
    reason: 'repository_unavailable',
    requestId: 'req_1752',
    traceId: 'trace_1752',
  });
  assertNoForbiddenLeak(envelope);
});

test('deny envelope preserves existing public shape when no reason or metadata is supplied', () => {
  const envelope = createEngineerMobileWorkbenchDenyEnvelope({
    messageKey: 'engineerMobile.assignedAppointments.unavailable',
    data: {
      appointments: [],
    },
  });

  assert.deepEqual(envelope, {
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
});

test('deny envelope includes safe reason only', () => {
  const envelope = createEngineerMobileWorkbenchDenyEnvelope({
    messageKey: 'engineerMobile.assignedAppointmentDetail.unavailable',
    data: {
      appointment: null,
    },
    reason: 'missing_engineer_identity',
    metadata: {
      reason: 'missing_engineer_identity',
      token: 'token_should_not_leak',
    },
  });

  assert.deepEqual(envelope.error, {
    messageKey: 'engineerMobile.assignedAppointmentDetail.unavailable',
    reason: 'missing_engineer_identity',
  });
  assert.deepEqual(envelope.metadata, {
    reason: 'missing_engineer_identity',
  });
  assertNoForbiddenLeak(envelope);
});

test('error envelope does not leak raw thrown error or stack', () => {
  const rawError = new Error('raw db failure stack_trace_should_not_leak token_should_not_leak');
  const envelope = createEngineerMobileWorkbenchErrorEnvelope({
    messageKey: 'engineerMobile.assignedAppointments.unavailable',
    data: {
      rawError,
      stack: rawError.stack,
      appointments: [unsafePayload()],
    },
    reason: 'repository_unavailable',
    metadata: {
      rawError,
      stack: rawError.stack,
      reason: 'repository_unavailable',
    },
  });

  assert.equal(envelope.status, 'error');
  assert.deepEqual(envelope.error, {
    messageKey: 'engineerMobile.assignedAppointments.unavailable',
    reason: 'repository_unavailable',
  });
  assert.deepEqual(envelope.metadata, {
    reason: 'repository_unavailable',
  });
  assertNoForbiddenLeak(envelope);
});

test('metadata sanitizer strips unsafe fields and unsafe values', () => {
  assert.deepEqual(sanitizeWorkbenchMetadata({
    ...unsafeMetadata(),
    requestId: '../unsafe',
    traceId: 'trace with spaces',
    statusCode: 404,
  }), {
    appointmentId: 'apt_1752_001',
    engineerUserId: 'eng_1752',
    organizationId: 'org_1752',
    reason: 'repository_unavailable',
    statusCode: '404',
  });
});

test('payload sanitizer strips unsafe fields without mutating input', () => {
  const source = unsafePayload();
  const snapshot = JSON.stringify(source);
  const sanitized = sanitizeWorkbenchPayload(source);

  assert.equal(JSON.stringify(source), snapshot);
  assert.equal(sanitized.appointmentId, 'apt_1752_001');
  assert.equal(sanitized.nested.status, 'confirmed');
  assert.deepEqual(sanitized.rows, [{ label: 'safe row' }]);
  assertNoForbiddenLeak(sanitized);
});

test('source has no DB app server route listen provider or mutation dependency', () => {
  const source = fs.readFileSync(ENVELOPE_SOURCE, 'utf8');

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
