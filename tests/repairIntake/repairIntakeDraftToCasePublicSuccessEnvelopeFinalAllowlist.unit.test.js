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

const PUBLIC_SUCCESS_KEYS = Object.freeze([
  'caseId',
  'messageKey',
  'ok',
  'reasonCode',
  'repairIntakeDraftId',
  'status',
]);

const FORBIDDEN_FIELDS = Object.freeze([
  'organizationId',
  'tenantId',
  'actorId',
  'actorRole',
  'source',
  'draftInput',
  'requestBody',
  'rawBody',
  'rawRequest',
  'customerName',
  'customerPhone',
  'customerAddress',
  'privateAddress',
  'appointmentId',
  'completionReportId',
  'finalAppointmentId',
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
  'auditContext',
  'permission',
  'debug',
  'internal',
  'sql',
  'stack',
  'rawError',
  'token',
  'password',
  'secret',
]);

function unsafeSuccessResult(overrides = {}) {
  return {
    ok: true,
    status: 'created',
    reasonCode: 'REPAIR_INTAKE_INTERNAL_SUBMITTED_SHOULD_NOT_LEAK',
    messageKey: 'internal.message.should.not.leak',
    caseId: 'case-public-2209',
    repairIntakeDraftId: 'draft-public-2209',
    requestId: 'req-public-should-not-be-added-2209',
    organizationId: 'org-hidden-2209',
    tenantId: 'tenant-hidden-2209',
    actorId: 'actor-hidden-2209',
    actorRole: 'admin',
    source: 'admin_route',
    draftInput: {
      customerName: 'Hidden Customer 2209',
      customerPhone: 'Hidden Phone 2209',
      address: 'Hidden Address 2209',
      providerPayload: { token: 'hidden provider token 2209' },
    },
    requestBody: { rawBody: 'hidden raw request body 2209' },
    rawRequest: { authorization: 'Bearer hidden token 2209' },
    customerName: 'Hidden Name 2209',
    customerPhone: 'Hidden Phone 2209',
    customerAddress: 'Hidden Address 2209',
    privateAddress: 'Hidden Private Address 2209',
    appointmentId: 'appt-hidden-2209',
    completionReportId: 'completion-hidden-2209',
    finalAppointmentId: 'final-hidden-2209',
    assignedEngineerId: 'assigned-engineer-hidden-2209',
    engineerId: 'engineer-hidden-2209',
    provider: 'line-hidden-2209',
    providerPayload: { token: 'provider-token-hidden-2209' },
    ai: { prompt: 'hidden ai prompt 2209' },
    rag: { context: 'hidden rag context 2209' },
    billing: { amount: 1000 },
    settlement: { amount: 1000 },
    invoice: { id: 'invoice-hidden-2209' },
    audit: { actor: 'audit-hidden-2209' },
    auditActor: 'audit-actor-hidden-2209',
    auditContext: { actorId: 'audit-context-hidden-2209' },
    permission: 'cases.create',
    debug: 'debug-hidden-2209',
    internal: 'internal-hidden-2209',
    sql: 'select * from repair_intake',
    stack: 'stack-hidden-2209',
    rawError: 'raw-error-hidden-2209',
    token: 'token-hidden-2209',
    password: 'password-hidden-2209',
    secret: 'secret-hidden-2209',
    ...overrides,
  };
}

function presentAndMap(result) {
  const publicResult = presentRepairIntakeDraftToCaseResult(result);
  const httpEnvelope = mapRepairIntakeDraftToCasePublicResultToHttpResponse(publicResult);

  return {
    publicResult,
    httpEnvelope,
  };
}

function assertPublicSuccessShape(value) {
  assert.deepEqual(Object.keys(value).sort(), PUBLIC_SUCCESS_KEYS);
}

function assertHttpPublicShape(envelope) {
  assert.equal(Number.isInteger(envelope.statusCode), true);
  assert.deepEqual(Object.keys(envelope.body).sort(), [...PUBLIC_FIELD_NAMES].sort());
}

function assertNoForbiddenText(value) {
  const serialized = JSON.stringify(value);

  for (const field of FORBIDDEN_FIELDS) {
    assert.equal(serialized.includes(`"${field}"`), false, `leaked forbidden field ${field}`);
  }

  for (const marker of [
    'Hidden',
    'hidden',
    'admin',
    'admin_route',
    'cases.create',
    'select *',
    'Bearer',
    'provider-token',
    'token-hidden',
    'password-hidden',
    'secret-hidden',
    'raw-error',
    'stack-hidden',
    'internal-hidden',
    'debug-hidden',
    'req-public-should-not-be-added',
    'REPAIR_INTAKE_INTERNAL_SUBMITTED_SHOULD_NOT_LEAK',
    'internal.message.should.not.leak',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked forbidden marker ${marker}`);
  }
}

test('Task2209 public success presenter exposes final allowlisted fields only', () => {
  const input = unsafeSuccessResult();
  const before = structuredClone(input);
  const { publicResult, httpEnvelope } = presentAndMap(input);

  assertPublicSuccessShape(publicResult);
  assertHttpPublicShape(httpEnvelope);
  assert.deepEqual(publicResult, {
    ok: true,
    status: 'created',
    messageKey: 'repair_intake_draft_to_case.created',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_CREATED',
    caseId: 'case-public-2209',
    repairIntakeDraftId: 'draft-public-2209',
  });
  assert.deepEqual(httpEnvelope.body, publicResult);
  assert.equal(httpEnvelope.statusCode, 201);
  assertNoForbiddenText(publicResult);
  assertNoForbiddenText(httpEnvelope);
  assert.deepEqual(input, before);
});

test('Task2209 unsafe scalar public identifiers are stripped before synthetic or HTTP envelope', () => {
  const { publicResult, httpEnvelope } = presentAndMap(unsafeSuccessResult({
    caseId: 'case-provider-token-hidden-2209',
    repairIntakeDraftId: 'draft-billing-hidden-2209',
  }));

  assertPublicSuccessShape(publicResult);
  assert.equal(publicResult.ok, true);
  assert.equal(publicResult.caseId, null);
  assert.equal(publicResult.repairIntakeDraftId, null);
  assert.equal(httpEnvelope.statusCode, 201);
  assert.deepEqual(httpEnvelope.body, publicResult);
  assertNoForbiddenText(publicResult);
  assertNoForbiddenText(httpEnvelope);
});

test('Task2209 malformed or nested public identifiers do not pass through wholesale', () => {
  const { publicResult, httpEnvelope } = presentAndMap(unsafeSuccessResult({
    caseId: {
      id: 'case-nested-2209',
      customerPhone: 'Hidden Phone 2209',
      providerPayload: { token: 'hidden token 2209' },
    },
    repairIntakeDraftId: ['draft-array-2209'],
  }));

  assertPublicSuccessShape(publicResult);
  assert.equal(publicResult.caseId, null);
  assert.equal(publicResult.repairIntakeDraftId, null);
  assert.deepEqual(httpEnvelope.body, publicResult);
  assertNoForbiddenText(publicResult);
  assertNoForbiddenText(httpEnvelope);
});

test('Task2209 denied failure and permission envelopes remain generic and sanitized', () => {
  const cases = [
    unsafeSuccessResult({
      ok: false,
      status: 'denied',
      caseId: 'case-should-not-win-2209',
      repairIntakeDraftId: 'draft-public-2209',
      reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PERMISSION_GATE_ROLE_NOT_ALLOWED',
      permissionTrace: { role: 'admin', token: 'hidden token 2209' },
    }),
    unsafeSuccessResult({
      ok: false,
      status: 'failed',
      caseId: 'case-should-not-win-2209',
      repairIntakeDraftId: 'draft-public-2209',
      rawError: 'raw exception with token-hidden-2209 and select * from cases',
      stack: 'stack-hidden-2209',
    }),
  ];

  const [denied, failed] = cases.map(presentAndMap);

  assert.equal(denied.publicResult.ok, false);
  assert.equal(denied.publicResult.status, 'denied');
  assert.equal(denied.publicResult.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_DENIED');
  assert.equal(denied.publicResult.caseId, null);
  assert.equal(denied.httpEnvelope.statusCode, 403);

  assert.equal(failed.publicResult.ok, false);
  assert.equal(failed.publicResult.status, 'unavailable');
  assert.equal(failed.publicResult.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_UNAVAILABLE');
  assert.equal(failed.publicResult.caseId, null);
  assert.equal(failed.httpEnvelope.statusCode, 503);

  assertNoForbiddenText(denied);
  assertNoForbiddenText(failed);
});
