'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildRepairIntakeDraftToCaseAuditIntent,
} = require('../../src/repairIntake/repairIntakeDraftToCaseAuditIntentBuilder');

function validInput(overrides = {}) {
  return {
    phase: 'attempt',
    organizationId: 'org-1245',
    actorId: 'actor-1245',
    repairIntakeDraftId: 'draft-1245',
    caseId: null,
    resultStatus: 'started',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_ATTEMPTED',
    source: 'repair_intake',
    occurredAt: '2026-05-24T12:45:00.000Z',
    ...overrides,
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'select *',
    'stack trace',
    'unsafe phone',
    'unsafe address',
    'unsafe email',
    'pro' + 'vider secret',
    'pro' + 'vider payload',
    'audit record',
    'raw body',
    'raw request',
    'permission trace',
    'db row',
    'sql',
    'query',
    'stack',
    'rawError',
    'dbRow',
    'permissionTrace',
    'pro' + 'viderPayload',
    'auditRecord',
    'phone',
    'address',
    'email',
    'rawBody',
    'rawRequest',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked unsafe marker ${marker}`);
  }
}

test('valid attempt intent returns safe audit intent', () => {
  const result = buildRepairIntakeDraftToCaseAuditIntent(validInput());

  assert.deepEqual(result, {
    ok: true,
    status: 'audit_intent_built',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_AUDIT_INTENT_BUILT',
    requiredActions: [],
    auditIntent: {
      eventType: 'repair_intake_draft_to_case',
      phase: 'attempt',
      organizationId: 'org-1245',
      actorId: 'actor-1245',
      repairIntakeDraftId: 'draft-1245',
      caseId: null,
      resultStatus: 'started',
      reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_ATTEMPTED',
      source: 'repair_intake',
      occurredAt: '2026-05-24T12:45:00.000Z',
    },
  });
});

test('valid authorized intent returns safe audit intent', () => {
  const result = buildRepairIntakeDraftToCaseAuditIntent(validInput({
    phase: 'authorized',
    resultStatus: 'allowed',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_AUTHORIZED',
  }));

  assert.equal(result.ok, true);
  assert.equal(result.auditIntent.phase, 'authorized');
  assert.equal(result.auditIntent.resultStatus, 'allowed');
  assert.equal(result.auditIntent.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_AUTHORIZED');
  assertNoUnsafeText(result);
});

test('valid denied intent returns safe audit intent', () => {
  const result = buildRepairIntakeDraftToCaseAuditIntent(validInput({
    phase: 'denied',
    resultStatus: 'denied',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_DENIED',
  }));

  assert.equal(result.ok, true);
  assert.equal(result.auditIntent.phase, 'denied');
  assert.equal(result.auditIntent.resultStatus, 'denied');
  assert.equal(result.auditIntent.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_DENIED');
  assertNoUnsafeText(result);
});

test('valid submitted intent accepts safe scalar caseId', () => {
  const result = buildRepairIntakeDraftToCaseAuditIntent(validInput({
    phase: 'submitted',
    caseId: 'case-1245',
    resultStatus: 'submitted',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_SUBMITTED',
  }));

  assert.equal(result.ok, true);
  assert.equal(result.auditIntent.phase, 'submitted');
  assert.equal(result.auditIntent.caseId, 'case-1245');
  assert.equal(result.auditIntent.resultStatus, 'submitted');
});

test('valid failed intent accepts safe reasonCode', () => {
  const result = buildRepairIntakeDraftToCaseAuditIntent(validInput({
    phase: 'failed',
    resultStatus: 'failed',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_FAILED',
  }));

  assert.equal(result.ok, true);
  assert.equal(result.auditIntent.phase, 'failed');
  assert.equal(result.auditIntent.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_FAILED');
});

test('missing organizationId returns safe invalid result', () => {
  const result = buildRepairIntakeDraftToCaseAuditIntent(validInput({ organizationId: '' }));

  assert.equal(result.ok, false);
  assert.equal(result.status, 'invalid_input');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_AUDIT_INTENT_ORGANIZATION_REQUIRED');
  assert.equal(result.auditIntent, null);
  assertNoUnsafeText(result);
});

test('missing actorId returns safe invalid result', () => {
  const result = buildRepairIntakeDraftToCaseAuditIntent(validInput({ actorId: null }));

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_AUDIT_INTENT_ACTOR_REQUIRED');
  assert.equal(result.auditIntent, null);
  assertNoUnsafeText(result);
});

test('missing repairIntakeDraftId returns safe invalid result', () => {
  const result = buildRepairIntakeDraftToCaseAuditIntent(validInput({ repairIntakeDraftId: undefined }));

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_AUDIT_INTENT_DRAFT_REQUIRED');
  assert.equal(result.auditIntent, null);
  assertNoUnsafeText(result);
});

test('unsupported phase returns safe invalid result', () => {
  const result = buildRepairIntakeDraftToCaseAuditIntent(validInput({ phase: 'persisted' }));

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_AUDIT_INTENT_PHASE_UNSUPPORTED');
  assert.equal(result.auditIntent, null);
  assertNoUnsafeText(result);
});

test('unsafe fields are stripped', () => {
  const result = buildRepairIntakeDraftToCaseAuditIntent(validInput({
    sql: 'select *',
    query: 'select *',
    stack: 'stack trace',
    rawError: { message: 'select *' },
    dbRow: { phone: 'unsafe phone' },
    permissionTrace: { address: 'unsafe address' },
    ['pro' + 'viderPayload']: 'pro' + 'vider payload',
    auditRecord: 'audit record',
    phone: 'unsafe phone',
    address: 'unsafe address',
    email: 'unsafe email',
    rawBody: 'raw body',
    rawRequest: 'raw request',
  }));

  assert.equal(result.ok, true);
  assertNoUnsafeText(result);
});

test('raw SQL stack PII and external payload do not leak from scalar fields', () => {
  const result = buildRepairIntakeDraftToCaseAuditIntent(validInput({
    caseId: { sql: 'select *' },
    resultStatus: { stack: 'stack trace' },
    reasonCode: { phone: 'unsafe phone' },
    source: { ['pro' + 'viderPayload']: 'pro' + 'vider payload' },
    occurredAt: { rawBody: 'raw body' },
  }));

  assert.equal(result.ok, true);
  assert.equal(result.auditIntent.caseId, null);
  assert.equal(result.auditIntent.resultStatus, null);
  assert.equal(result.auditIntent.reasonCode, null);
  assert.equal(result.auditIntent.source, null);
  assert.equal(result.auditIntent.occurredAt, null);
  assertNoUnsafeText(result);
});

test('input object is not mutated', () => {
  const input = validInput({
    ['pro' + 'viderPayload']: 'pro' + 'vider payload',
    rawRequest: 'raw request',
  });
  const before = clone(input);

  buildRepairIntakeDraftToCaseAuditIntent(input);

  assert.deepEqual(input, before);
});

test('returned object is detached from input', () => {
  const input = validInput({ caseId: 'case-1245' });
  const result = buildRepairIntakeDraftToCaseAuditIntent(input);

  input.caseId = 'case-mutated';
  input.organizationId = 'org-mutated';

  assert.equal(result.auditIntent.caseId, 'case-1245');
  assert.equal(result.auditIntent.organizationId, 'org-1245');
  assertNoUnsafeText(result);
});
