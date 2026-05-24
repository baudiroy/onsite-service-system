'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildRepairIntakeDraftToCaseIdempotencyPolicy,
} = require('../../src/repairIntake/repairIntakeDraftToCaseIdempotencyPolicyBuilder');

function validInput(overrides = {}) {
  return {
    organizationId: 'org-1248',
    actorId: 'actor-1248',
    repairIntakeDraftId: 'draft-1248',
    requestId: 'request-1248',
    idempotencyKey: 'idem-1248',
    source: 'repair_intake',
    ...overrides,
  };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'select *',
    'stack trace',
    'unsafe phone',
    'unsafe address',
    'unsafe email',
    'external payload',
    'permission trace',
    'db row',
    'sql',
    'query',
    'stack',
    'rawError',
    'dbRow',
    'permissionTrace',
    'pro' + 'viderPayload',
    'phone',
    'address',
    'email',
    'rawBody',
    'rawRequest',
    'cache' + '.set',
    'red' + 'is',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked unsafe marker ${marker}`);
  }
}

test('valid policy with explicit idempotencyKey', () => {
  const result = buildRepairIntakeDraftToCaseIdempotencyPolicy(validInput());

  assert.deepEqual(result, {
    ok: true,
    status: 'policy_built',
    messageKey: 'repair_intake_draft_to_case.idempotency_policy',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_IDEMPOTENCY_POLICY_BUILT',
    requiredActions: [],
    idempotencyScope: 'repair_intake_draft_to_case:organization:org-1248',
    idempotencyKey: 'idem-1248',
    dedupeKey: 'repair_intake_draft_to_case:organization:org-1248:draft:draft-1248:key:idem-1248',
    organizationId: 'org-1248',
    actorId: 'actor-1248',
    repairIntakeDraftId: 'draft-1248',
    requestId: 'request-1248',
    source: 'repair_intake',
  });
});

test('valid policy without idempotencyKey derives deterministic fallback from safe fields', () => {
  const input = validInput({ idempotencyKey: undefined });
  const first = buildRepairIntakeDraftToCaseIdempotencyPolicy(input);
  const second = buildRepairIntakeDraftToCaseIdempotencyPolicy(input);

  assert.equal(first.ok, true);
  assert.equal(first.idempotencyKey, 'request-1248');
  assert.equal(first.dedupeKey, second.dedupeKey);
  assert.equal(
    first.dedupeKey,
    'repair_intake_draft_to_case:organization:org-1248:draft:draft-1248:key:request-1248',
  );
});

test('fallback policy without idempotencyKey or requestId remains deterministic', () => {
  const result = buildRepairIntakeDraftToCaseIdempotencyPolicy(validInput({
    requestId: null,
    idempotencyKey: null,
  }));

  assert.equal(result.ok, true);
  assert.equal(result.idempotencyKey, 'fallback:actor-1248:draft-1248');
  assert.equal(
    result.dedupeKey,
    'repair_intake_draft_to_case:organization:org-1248:draft:draft-1248:key:fallback%3Aactor-1248%3Adraft-1248',
  );
});

test('organization boundary is included in scope and dedupe key', () => {
  const result = buildRepairIntakeDraftToCaseIdempotencyPolicy(validInput());

  assert.equal(result.idempotencyScope.includes('organization:org-1248'), true);
  assert.equal(result.dedupeKey.includes('organization:org-1248'), true);
});

test('different organizations produce different dedupeKey', () => {
  const first = buildRepairIntakeDraftToCaseIdempotencyPolicy(validInput({ organizationId: 'org-a' }));
  const second = buildRepairIntakeDraftToCaseIdempotencyPolicy(validInput({ organizationId: 'org-b' }));

  assert.notEqual(first.dedupeKey, second.dedupeKey);
});

test('different drafts produce different dedupeKey', () => {
  const first = buildRepairIntakeDraftToCaseIdempotencyPolicy(validInput({ repairIntakeDraftId: 'draft-a' }));
  const second = buildRepairIntakeDraftToCaseIdempotencyPolicy(validInput({ repairIntakeDraftId: 'draft-b' }));

  assert.notEqual(first.dedupeKey, second.dedupeKey);
});

test('missing organizationId returns invalid envelope', () => {
  const result = buildRepairIntakeDraftToCaseIdempotencyPolicy(validInput({ organizationId: '' }));

  assert.equal(result.ok, false);
  assert.equal(result.status, 'invalid_input');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_IDEMPOTENCY_POLICY_ORGANIZATION_REQUIRED');
  assert.equal(result.dedupeKey, null);
  assertNoUnsafeText(result);
});

test('missing actorId returns invalid envelope', () => {
  const result = buildRepairIntakeDraftToCaseIdempotencyPolicy(validInput({ actorId: null }));

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_IDEMPOTENCY_POLICY_ACTOR_REQUIRED');
  assert.equal(result.dedupeKey, null);
  assertNoUnsafeText(result);
});

test('missing repairIntakeDraftId returns invalid envelope', () => {
  const result = buildRepairIntakeDraftToCaseIdempotencyPolicy(validInput({ repairIntakeDraftId: undefined }));

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_IDEMPOTENCY_POLICY_DRAFT_REQUIRED');
  assert.equal(result.dedupeKey, null);
  assertNoUnsafeText(result);
});

test('unsafe fields are stripped', () => {
  const result = buildRepairIntakeDraftToCaseIdempotencyPolicy(validInput({
    sql: 'select *',
    query: 'select *',
    stack: 'stack trace',
    rawError: { message: 'select *' },
    dbRow: { phone: 'unsafe phone' },
    permissionTrace: { address: 'unsafe address' },
    ['pro' + 'viderPayload']: 'external payload',
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
  const result = buildRepairIntakeDraftToCaseIdempotencyPolicy(validInput({
    requestId: { sql: 'select *' },
    idempotencyKey: { stack: 'stack trace' },
    source: { phone: 'unsafe phone' },
  }));

  assert.equal(result.ok, true);
  assert.equal(result.requestId, null);
  assert.equal(result.source, null);
  assert.equal(result.idempotencyKey, 'fallback:actor-1248:draft-1248');
  assertNoUnsafeText(result);
});

test('input object is not mutated', () => {
  const input = validInput({
    ['pro' + 'viderPayload']: 'external payload',
    rawRequest: 'raw request',
  });
  const before = structuredClone(input);

  buildRepairIntakeDraftToCaseIdempotencyPolicy(input);

  assert.deepEqual(input, before);
});

test('returned object is detached from input', () => {
  const input = validInput();
  const result = buildRepairIntakeDraftToCaseIdempotencyPolicy(input);

  input.organizationId = 'org-mutated';
  input.repairIntakeDraftId = 'draft-mutated';

  assert.equal(result.organizationId, 'org-1248');
  assert.equal(result.repairIntakeDraftId, 'draft-1248');
  assert.equal(
    result.dedupeKey,
    'repair_intake_draft_to_case:organization:org-1248:draft:draft-1248:key:idem-1248',
  );
  assertNoUnsafeText(result);
});
