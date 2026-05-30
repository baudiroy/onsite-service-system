'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ALLOWED_ACTOR_ROLES,
  ALLOWED_SOURCES,
  decideRepairIntakeDraftToCasePermission,
} = require('../../src/repairIntake/repairIntakeDraftToCasePermissionGate');

function validContext(overrides = {}) {
  return {
    organizationId: 'org-permission-gate-2195',
    actorId: 'actor-permission-gate-2195',
    actorRole: 'service_agent',
    repairIntakeDraftId: 'draft-permission-gate-2195',
    source: 'repair_intake',
    ...overrides,
  };
}

function unsafeClientControlledContext(overrides = {}) {
  return {
    requestBody: {
      organizationId: 'body-org-should-not-authorize',
      actorId: 'body-actor-should-not-authorize',
      actorRole: 'service_agent',
      repairIntakeDraftId: 'body-draft-should-not-authorize',
      source: 'repair_intake',
      permission: 'cases.create',
    },
    draftInput: {
      organizationId: 'draft-org-should-not-authorize',
      actorId: 'draft-actor-should-not-authorize',
      actorRole: 'service_agent',
      repairIntakeDraftId: 'draft-id-should-not-authorize',
      source: 'repair_intake',
      permission: 'cases.create',
    },
    rawBody: {
      organizationId: 'raw-org-should-not-authorize',
      actorId: 'raw-actor-should-not-authorize',
      actorRole: 'service_agent',
      repairIntakeDraftId: 'raw-draft-should-not-authorize',
      source: 'repair_intake',
    },
    providerPayload: { allowed: true },
    ai: { allowed: true },
    billing: { allowed: true },
    audit: { allowed: true },
    permission: 'cases.create',
    ...overrides,
  };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'should-not-authorize',
    'requestBody',
    'draftInput',
    'rawBody',
    'providerPayload',
    'cases.create',
    'billing',
    'audit',
    '"ai"',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked unsafe marker ${marker}`);
  }
}

test('Task2195 exposes conservative role and source allowlists', () => {
  assert.deepEqual(ALLOWED_ACTOR_ROLES, ['service_agent']);
  assert.ok(ALLOWED_SOURCES.includes('repair_intake'));
  assert.ok(ALLOWED_SOURCES.includes('synthetic_handler'));
  assert.ok(ALLOWED_SOURCES.includes('trusted_route_context'));
  assert.ok(ALLOWED_SOURCES.includes('admin_route_injected_test'));
});

test('allows a trusted service agent with a known Repair Intake source', () => {
  const decision = decideRepairIntakeDraftToCasePermission(validContext());

  assert.deepEqual(decision, {
    allowed: true,
    reasonCode: 'allowed',
    organizationId: 'org-permission-gate-2195',
    actorId: 'actor-permission-gate-2195',
    actorRole: 'service_agent',
    repairIntakeDraftId: 'draft-permission-gate-2195',
    source: 'repair_intake',
  });
});

test('normalizes trusted role and source strings without mutating input', () => {
  const input = validContext({
    actorRole: ' SERVICE_AGENT ',
    source: ' Synthetic_Handler ',
  });
  const before = JSON.parse(JSON.stringify(input));
  const decision = decideRepairIntakeDraftToCasePermission(input);

  assert.equal(decision.allowed, true);
  assert.equal(decision.actorRole, 'service_agent');
  assert.equal(decision.source, 'synthetic_handler');
  assert.deepEqual(input, before);
});

test('returns missing_trusted_context for malformed or non-object input without throwing', () => {
  for (const input of [null, undefined, '', 42, true, [], () => ({})]) {
    assert.doesNotThrow(() => decideRepairIntakeDraftToCasePermission(input));

    const decision = decideRepairIntakeDraftToCasePermission(input);

    assert.equal(decision.allowed, false);
    assert.equal(decision.reasonCode, 'missing_trusted_context');
    assertNoUnsafeText(decision);
  }
});

test('denies missing or blank trusted organization actor role or draft id', () => {
  for (const [field, value] of [
    ['organizationId', ''],
    ['actorId', '   '],
    ['actorRole', null],
    ['repairIntakeDraftId', undefined],
  ]) {
    const decision = decideRepairIntakeDraftToCasePermission(validContext({ [field]: value }));

    assert.equal(decision.allowed, false, `${field} should be denied`);
    assert.equal(decision.reasonCode, 'missing_trusted_context');
  }
});

test('denies public customer admin and self-declared roles that are not trusted service_agent context', () => {
  for (const actorRole of ['customer', 'public', 'admin', 'operator', 'self_declared_service_agent']) {
    const decision = decideRepairIntakeDraftToCasePermission(validContext({ actorRole }));

    assert.equal(decision.allowed, false, `${actorRole} should be denied`);
    assert.equal(decision.reasonCode, 'role_not_allowed');
  }
});

test('denies blank or unknown source values', () => {
  for (const source of ['', '   ', null, undefined, 'public_form', 'customer_access', 'web', 'unknown_source']) {
    const decision = decideRepairIntakeDraftToCasePermission(validContext({ source }));

    assert.equal(decision.allowed, false, `${source} should be denied`);
    assert.equal(decision.reasonCode, 'invalid_source');
  }
});

test('does not authorize from raw body requestBody draftInput permission or unsafe payload fields', () => {
  const decision = decideRepairIntakeDraftToCasePermission(unsafeClientControlledContext());

  assert.equal(decision.allowed, false);
  assert.equal(decision.reasonCode, 'missing_trusted_context');
  assertNoUnsafeText(decision);
});

test('top-level untrusted role cannot be upgraded by nested requestBody or draftInput role and permission', () => {
  const decision = decideRepairIntakeDraftToCasePermission(unsafeClientControlledContext(validContext({
    actorRole: 'customer',
    source: 'repair_intake',
  })));

  assert.equal(decision.allowed, false);
  assert.equal(decision.reasonCode, 'role_not_allowed');
  assert.equal(decision.actorRole, 'customer');
  assertNoUnsafeText(decision);
});

test('top-level unknown source cannot be upgraded by nested requestBody or draftInput source', () => {
  const decision = decideRepairIntakeDraftToCasePermission(unsafeClientControlledContext(validContext({
    source: 'customer_access',
  })));

  assert.equal(decision.allowed, false);
  assert.equal(decision.reasonCode, 'invalid_source');
  assert.equal(decision.source, 'customer_access');
  assertNoUnsafeText(decision);
});
