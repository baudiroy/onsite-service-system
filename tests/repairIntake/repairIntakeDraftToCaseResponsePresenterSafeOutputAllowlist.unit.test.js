'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  presentRepairIntakeDraftToCaseResult,
} = require('../../src/repairIntake/repairIntakeDraftToCasePublicResultPresenter');
const {
  PUBLIC_FIELD_NAMES,
  mapRepairIntakeDraftToCasePublicResultToHttpResponse,
} = require('../../src/repairIntake/repairIntakeDraftToCaseHttpResultMapper');

const FORBIDDEN_RESPONSE_FIELDS = Object.freeze([
  'organizationId',
  'appointmentId',
  'completionReportId',
  'finalAppointmentId',
  'createdBy',
  'updatedBy',
  'assignedEngineerId',
  'engineerId',
  'provider',
  'providerPayload',
  'ai',
  'rag',
  'billing',
  'settlement',
  'invoice',
  'audit',
  'auditActor',
  'permission',
  'role',
  'token',
  'password',
  'raw',
  'rawBody',
  'debug',
  'internal',
  'sql',
]);

function unsafeServiceResult(overrides = {}) {
  return {
    ok: true,
    status: 'created',
    caseId: 'case-task2191',
    repairIntakeDraftId: 'draft-task2191',
    draftInput: {
      customerDisplayName: 'Hidden Customer',
      problemDescription: 'Hidden raw draft input',
    },
    requestBody: {
      rawBody: 'hidden raw request body',
    },
    rawResult: {
      providerPayload: 'hidden provider payload',
    },
    customerName: 'Hidden Name',
    customerPhone: 'Hidden Phone',
    customerAddress: 'Hidden Address',
    privateAddress: 'Hidden Private Address',
    organizationId: 'org-hidden',
    appointmentId: 'appt-hidden',
    completionReportId: 'completion-hidden',
    finalAppointmentId: 'final-hidden',
    createdBy: 'creator-hidden',
    updatedBy: 'updater-hidden',
    assignedEngineerId: 'assigned-engineer-hidden',
    engineerId: 'engineer-hidden',
    provider: 'line-hidden',
    providerPayload: { token: 'provider-token-hidden' },
    ai: { prompt: 'hidden ai prompt' },
    rag: { context: 'hidden rag context' },
    billing: { amount: 1000 },
    settlement: { amount: 1000 },
    invoice: { id: 'invoice-hidden' },
    audit: { actor: 'audit-hidden' },
    auditActor: 'audit-actor-hidden',
    permission: 'cases.create',
    role: 'admin',
    token: 'token-hidden',
    password: 'password-hidden',
    raw: 'raw-hidden',
    rawBody: 'raw-body-hidden',
    debug: 'debug-hidden',
    internal: 'internal-hidden',
    sql: 'select * from repair_intake',
    ...overrides,
  };
}

function toHttpEnvelope(serviceResult) {
  return mapRepairIntakeDraftToCasePublicResultToHttpResponse(
    presentRepairIntakeDraftToCaseResult(serviceResult),
  );
}

function assertSafeEnvelope(envelope) {
  assert.equal(Number.isInteger(envelope.statusCode), true);
  assert.deepEqual(Object.keys(envelope.body).sort(), [...PUBLIC_FIELD_NAMES].sort());

  const serialized = JSON.stringify(envelope);

  for (const field of FORBIDDEN_RESPONSE_FIELDS) {
    assert.equal(
      Object.prototype.hasOwnProperty.call(envelope.body, field),
      false,
      `leaked forbidden field ${field}`,
    );
  }

  for (const marker of [
    'Hidden',
    'hidden',
    'provider-token',
    'cases.create',
    'admin',
    'select *',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked forbidden marker ${marker}`);
  }
}

test('Task2191 success service result becomes explicit safe HTTP envelope only', () => {
  const envelope = toHttpEnvelope(unsafeServiceResult());

  assert.equal(envelope.statusCode, 201);
  assert.deepEqual(envelope.body, {
    ok: true,
    status: 'created',
    messageKey: 'repair_intake_draft_to_case.created',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_CREATED',
    caseId: 'case-task2191',
    repairIntakeDraftId: 'draft-task2191',
  });
  assertSafeEnvelope(envelope);
});

test('Task2191 unsafe public id values are stripped by HTTP envelope mapper', () => {
  const envelope = toHttpEnvelope(unsafeServiceResult({
    caseId: 'case-provider-token-hidden',
    repairIntakeDraftId: 'draft-billing-hidden',
  }));

  assert.equal(envelope.statusCode, 201);
  assert.equal(envelope.body.caseId, null);
  assert.equal(envelope.body.repairIntakeDraftId, null);
  assertSafeEnvelope(envelope);
});

test('Task2191 error response stays generic without raw exception or debug leakage', () => {
  const envelope = toHttpEnvelope(unsafeServiceResult({
    ok: false,
    status: 'failed',
    caseId: null,
    rawError: 'raw exception with token-hidden and select * from cases',
    stack: 'stack trace hidden',
    debug: 'debug hidden',
    providerPayload: { token: 'provider-token-hidden' },
  }));

  assert.equal(envelope.statusCode, 503);
  assert.deepEqual(envelope.body, {
    ok: false,
    status: 'unavailable',
    messageKey: 'repair_intake_draft_to_case.unavailable',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_UNAVAILABLE',
    caseId: null,
    repairIntakeDraftId: 'draft-task2191',
  });
  assertSafeEnvelope(envelope);
});

test('Task2191 response presenter and HTTP mapper do not mutate service result', () => {
  const serviceResult = unsafeServiceResult();
  const before = JSON.parse(JSON.stringify(serviceResult));

  toHttpEnvelope(serviceResult);

  assert.deepEqual(serviceResult, before);
});
