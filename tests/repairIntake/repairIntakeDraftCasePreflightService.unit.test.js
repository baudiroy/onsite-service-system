'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ACTION,
  createRepairIntakeDraftCasePreflightService,
} = require('../../src/repairIntake/repairIntakeDraftCasePreflightService');

function sanitizedDraft(overrides = {}) {
  return {
    draftId: 'draft_task935_001',
    intakeSource: 'web',
    organizationId: 'org_task935',
    serviceProviderId: 'provider_task935',
    duplicateStatus: 'cleared',
    contactRoleSeparation: 'complete',
    platformAccepted: true,
    ...overrides,
  };
}

function lookupInput(overrides = {}) {
  return {
    draftId: 'draft_task935_001',
    organizationId: 'org_task935',
    actorId: 'actor_task935',
    requestId: 'request_task935',
    ...overrides,
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertNoCreationFields(envelope) {
  for (const key of [
    'caseId',
    'case_id',
    'createdCaseId',
    'created_case_id',
    'finalAppointmentId',
    'final_appointment_id',
  ]) {
    assert.equal(Object.prototype.hasOwnProperty.call(envelope, key), false, `${key} must not be returned`);
  }
}

function assertNoRawPayloadFields(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'phone',
    'address',
    'customerPayload',
    'rawPayload',
    'stack trace',
    'select *',
    'provider secret',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function assertHappyPathFixtureIsSanitized(draft) {
  for (const key of [
    'phone',
    'address',
    'customerName',
    'customerPayload',
    'rawPayload',
  ]) {
    assert.equal(Object.prototype.hasOwnProperty.call(draft, key), false, `${key} should not be in happy path fixture`);
  }
}

test('happy path eligible preflight delegates to Task934 eligibility helper', async () => {
  const draft = sanitizedDraft();
  assertHappyPathFixtureIsSanitized(draft);

  const service = createRepairIntakeDraftCasePreflightService({
    draftReader: async () => draft,
  });

  const result = await service.preflightDraftToCase(lookupInput());

  assert.deepEqual(result, {
    ok: true,
    action: ACTION,
    draftId: 'draft_task935_001',
    organizationId: 'org_task935',
    eligible: true,
    status: 'eligible',
    reasonCode: 'eligible',
    requiredActions: [],
    caseCreationAllowed: true,
  });
  assertNoCreationFields(result);
  assertNoRawPayloadFields(result);
});

test('blocked result from Task934 is preserved without allowing Case creation', async () => {
  const service = createRepairIntakeDraftCasePreflightService({
    draftReader: async () => sanitizedDraft({ linkedCaseId: 'case_existing_task935' }),
  });

  const result = await service.preflightDraftToCase(lookupInput());

  assert.equal(result.ok, false);
  assert.equal(result.caseCreationAllowed, false);
  assert.equal(result.status, 'blocked');
  assert.equal(result.reasonCode, 'already_linked_case');
  assert.deepEqual(result.requiredActions, ['do_not_create_duplicate_case']);
  assertNoCreationFields(result);
});

test('needs-review result from Task934 is preserved without allowing Case creation', async () => {
  const service = createRepairIntakeDraftCasePreflightService({
    draftReader: async () => sanitizedDraft({ duplicateStatus: 'possible_duplicate' }),
  });

  const result = await service.preflightDraftToCase(lookupInput());

  assert.equal(result.ok, false);
  assert.equal(result.caseCreationAllowed, false);
  assert.equal(result.status, 'needs_review');
  assert.equal(result.reasonCode, 'duplicate_unresolved');
  assert.deepEqual(result.requiredActions, ['resolve_duplicate_review']);
});

test('missing draftId returns safe blocked preflight envelope', async () => {
  const service = createRepairIntakeDraftCasePreflightService({
    draftReader: async () => sanitizedDraft(),
  });

  assert.deepEqual(await service.preflightDraftToCase(lookupInput({ draftId: '' })), {
    ok: false,
    action: ACTION,
    draftId: null,
    organizationId: null,
    eligible: false,
    status: 'blocked',
    reasonCode: 'missing_draft_id',
    requiredActions: ['provide_draft_id'],
    caseCreationAllowed: false,
  });
});

test('missing organizationId returns safe blocked preflight envelope', async () => {
  const service = createRepairIntakeDraftCasePreflightService({
    draftReader: async () => sanitizedDraft(),
  });

  assert.deepEqual(await service.preflightDraftToCase(lookupInput({ organizationId: '' })), {
    ok: false,
    action: ACTION,
    draftId: 'draft_task935_001',
    organizationId: null,
    eligible: false,
    status: 'blocked',
    reasonCode: 'missing_organization_scope',
    requiredActions: ['provide_organization_scope'],
    caseCreationAllowed: false,
  });
});

test('missing or invalid draftReader is rejected at construction', () => {
  assert.throws(() => createRepairIntakeDraftCasePreflightService(), /draftReader_required/);
  assert.throws(() => createRepairIntakeDraftCasePreflightService({ draftReader: {} }), /draftReader_required/);
});

test('injected reader receives only sanitized lookup input', async () => {
  let readerInput;
  const service = createRepairIntakeDraftCasePreflightService({
    draftReader: async (lookup) => {
      readerInput = lookup;

      return sanitizedDraft();
    },
  });

  await service.preflightDraftToCase({
    ...lookupInput(),
    phone: 'phone',
    address: 'address',
    customerPayload: { value: 'customerPayload' },
    rawPayload: 'rawPayload',
  });

  assert.deepEqual(readerInput, {
    draftId: 'draft_task935_001',
    organizationId: 'org_task935',
    actorId: 'actor_task935',
    requestId: 'request_task935',
  });
});

test('reader returning null becomes safe blocked result', async () => {
  const service = createRepairIntakeDraftCasePreflightService({
    draftReader: async () => null,
  });

  const result = await service.preflightDraftToCase(lookupInput());

  assert.deepEqual(result, {
    ok: false,
    action: ACTION,
    draftId: 'draft_task935_001',
    organizationId: 'org_task935',
    eligible: false,
    status: 'blocked',
    reasonCode: 'draft_not_found',
    requiredActions: ['manual_review'],
    caseCreationAllowed: false,
  });
});

test('reader throwing returns safe blocked result without raw error leakage', async () => {
  const service = createRepairIntakeDraftCasePreflightService({
    draftReader: async () => {
      throw new Error('select * stack trace provider secret phone address customerPayload');
    },
  });

  const result = await service.preflightDraftToCase(lookupInput());

  assert.deepEqual(result, {
    ok: false,
    action: ACTION,
    draftId: 'draft_task935_001',
    organizationId: 'org_task935',
    eligible: false,
    status: 'blocked',
    reasonCode: 'draft_reader_failed',
    requiredActions: ['retry_or_manual_review'],
    caseCreationAllowed: false,
  });
  assertNoRawPayloadFields(result);
});

test('custom injected eligibility evaluator can be used without provider or DB access', async () => {
  let evaluatorInput;
  const service = createRepairIntakeDraftCasePreflightService({
    draftReader: async () => sanitizedDraft(),
    eligibilityEvaluator: (input) => {
      evaluatorInput = input;

      return {
        eligible: false,
        status: 'needs_review',
        reasonCode: 'custom_review',
        requiredActions: ['custom_manual_review'],
      };
    },
  });

  const result = await service.preflightDraftToCase(lookupInput());

  assert.deepEqual(evaluatorInput, { draft: sanitizedDraft() });
  assert.equal(result.status, 'needs_review');
  assert.equal(result.reasonCode, 'custom_review');
  assert.equal(result.caseCreationAllowed, false);
});

test('object reader with readDraftForCasePreflight method is supported', async () => {
  const service = createRepairIntakeDraftCasePreflightService({
    draftReader: {
      async readDraftForCasePreflight() {
        return sanitizedDraft();
      },
    },
  });

  const result = await service.preflightDraftToCase(lookupInput());

  assert.equal(result.caseCreationAllowed, true);
});

test('input is not mutated', async () => {
  const service = createRepairIntakeDraftCasePreflightService({
    draftReader: async () => sanitizedDraft(),
  });
  const input = lookupInput();
  const before = clone(input);

  await service.preflightDraftToCase(input);

  assert.deepEqual(input, before);
});
