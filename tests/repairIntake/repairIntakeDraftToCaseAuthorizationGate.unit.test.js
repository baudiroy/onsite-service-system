'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftToCaseAuthorizationGate,
} = require('../../src/repairIntake/repairIntakeDraftToCaseAuthorizationGate');

const UNSAFE_ERROR_TEXT = [
  'unsafe resolver detail',
  'unsafe customer contact',
  'unsafe stack detail',
  'unsafe infrastructure detail',
].join(' ');

function authorizationContext(overrides = {}) {
  return {
    organizationId: 'org-1213',
    actorId: 'actor-1213',
    repairIntakeDraftId: 'draft-1213',
    source: 'repair_intake',
    actorRole: 'service_agent',
    requestId: 'req-1213',
    tenantId: 'tenant-1213',
    metadata: {
      safeKey: 'safe context metadata',
      headers: { authorization: 'hidden' },
    },
    rawContext: { phone: 'hidden' },
    headers: { authorization: 'hidden' },
    customerPhone: 'hidden',
    ...overrides,
  };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'unsafe resolver detail',
    'unsafe customer contact',
    'unsafe stack detail',
    'unsafe infrastructure detail',
    'hidden',
    'rawContext',
    'rawRows',
    'raw',
    'headers',
    'customerPhone',
    'phone',
    'stack',
    'error',
    'token',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked unsafe marker ${marker}`);
  }
}

test('valid context and resolver allows returns safe allowed envelope', async () => {
  const calls = [];
  const gate = createRepairIntakeDraftToCaseAuthorizationGate({
    permissionResolver: {
      async canCreateCaseFromRepairIntakeDraft(context) {
        calls.push(context);
        return {
          allowed: true,
          reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_AUTHORIZATION_GATE_ALLOWED',
          metadata: {
            safeKey: 'safe resolver metadata',
            headers: { authorization: 'hidden' },
          },
          warnings: ['safe resolver warning'],
          rawRows: [{ phone: 'hidden' }],
        };
      },
    },
  });

  const result = await gate.authorizeDraftToCase(authorizationContext());

  assert.equal(calls.length, 1);
  assert.equal(calls[0].organizationId, 'org-1213');
  assert.equal(calls[0].actorId, 'actor-1213');
  assert.equal(calls[0].repairIntakeDraftId, 'draft-1213');
  assertNoUnsafeText(calls[0]);
  assert.equal(result.ok, true);
  assert.equal(result.allowed, true);
  assert.equal(result.status, 'allowed');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_AUTHORIZATION_GATE_ALLOWED');
  assert.equal(result.organizationId, 'org-1213');
  assert.equal(result.actorId, 'actor-1213');
  assert.equal(result.repairIntakeDraftId, 'draft-1213');
  assert.deepEqual(result.metadata, { safeKey: 'safe resolver metadata' });
  assert.deepEqual(result.warnings, ['safe resolver warning']);
  assertNoUnsafeText(result);
});

test('valid context and resolver denies returns safe denied envelope', async () => {
  const gate = createRepairIntakeDraftToCaseAuthorizationGate({
    permissionResolver: {
      async canCreateCaseFromRepairIntakeDraft() {
        return {
          allowed: false,
          reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_AUTHORIZATION_GATE_DENIED',
          requiredActions: ['request_permission_review'],
          rawRows: [{ phone: 'hidden' }],
          error: 'hidden',
        };
      },
    },
  });

  const result = await gate.authorizeDraftToCase(authorizationContext());

  assert.equal(result.ok, false);
  assert.equal(result.allowed, false);
  assert.equal(result.status, 'denied');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_AUTHORIZATION_GATE_DENIED');
  assert.deepEqual(result.requiredActions, ['request_permission_review']);
  assertNoUnsafeText(result);
});

test('missing organizationId returns invalid_input and resolver is not called', async () => {
  const calls = [];
  const gate = createRepairIntakeDraftToCaseAuthorizationGate({
    permissionResolver: {
      async canCreateCaseFromRepairIntakeDraft(context) {
        calls.push(context);
        return { allowed: true };
      },
    },
  });

  const result = await gate.authorizeDraftToCase(authorizationContext({ organizationId: '' }));

  assert.deepEqual(calls, []);
  assert.equal(result.status, 'invalid_input');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_AUTHORIZATION_GATE_ORGANIZATION_REQUIRED');
  assertNoUnsafeText(result);
});

test('missing actorId returns invalid_input and resolver is not called', async () => {
  const calls = [];
  const gate = createRepairIntakeDraftToCaseAuthorizationGate({
    permissionResolver: {
      async canCreateCaseFromRepairIntakeDraft(context) {
        calls.push(context);
        return { allowed: true };
      },
    },
  });

  const result = await gate.authorizeDraftToCase(authorizationContext({ actorId: null }));

  assert.deepEqual(calls, []);
  assert.equal(result.status, 'invalid_input');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_AUTHORIZATION_GATE_ACTOR_REQUIRED');
  assertNoUnsafeText(result);
});

test('missing repairIntakeDraftId returns invalid_input and resolver is not called', async () => {
  const calls = [];
  const gate = createRepairIntakeDraftToCaseAuthorizationGate({
    permissionResolver: {
      async canCreateCaseFromRepairIntakeDraft(context) {
        calls.push(context);
        return { allowed: true };
      },
    },
  });

  const result = await gate.authorizeDraftToCase(authorizationContext({ repairIntakeDraftId: undefined }));

  assert.deepEqual(calls, []);
  assert.equal(result.status, 'invalid_input');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_AUTHORIZATION_GATE_DRAFT_REQUIRED');
  assertNoUnsafeText(result);
});

test('missing resolver returns invalid_dependency', async () => {
  const gate = createRepairIntakeDraftToCaseAuthorizationGate();

  const result = await gate.authorizeDraftToCase(authorizationContext());

  assert.equal(result.ok, false);
  assert.equal(result.allowed, false);
  assert.equal(result.status, 'invalid_dependency');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_AUTHORIZATION_GATE_RESOLVER_REQUIRED');
  assert.deepEqual(result.requiredActions, ['configure_permission_resolver']);
  assertNoUnsafeText(result);
});

test('resolver missing required method returns invalid_dependency', async () => {
  const gate = createRepairIntakeDraftToCaseAuthorizationGate({ permissionResolver: {} });

  const result = await gate.authorizeDraftToCase(authorizationContext());

  assert.equal(result.ok, false);
  assert.equal(result.allowed, false);
  assert.equal(result.status, 'invalid_dependency');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_AUTHORIZATION_GATE_RESOLVER_METHOD_REQUIRED');
  assert.deepEqual(result.requiredActions, ['configure_permission_resolver']);
  assertNoUnsafeText(result);
});

test('resolver throws returns generic safe failure without raw error leakage', async () => {
  const gate = createRepairIntakeDraftToCaseAuthorizationGate({
    permissionResolver: {
      async canCreateCaseFromRepairIntakeDraft() {
        throw new Error(UNSAFE_ERROR_TEXT);
      },
    },
  });

  const result = await gate.authorizeDraftToCase(authorizationContext());

  assert.equal(result.ok, false);
  assert.equal(result.allowed, false);
  assert.equal(result.status, 'failed');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_AUTHORIZATION_GATE_RESOLVER_FAILED');
  assertNoUnsafeText(result);
});

test('gate does not mutate context object', async () => {
  const context = authorizationContext();
  const before = JSON.parse(JSON.stringify(context));
  const gate = createRepairIntakeDraftToCaseAuthorizationGate({
    permissionResolver: {
      async canCreateCaseFromRepairIntakeDraft() {
        return { allowed: true };
      },
    },
  });

  await gate.authorizeDraftToCase(context);

  assert.deepEqual(context, before);
});

test('gate does not mutate resolver result object', async () => {
  const resolverResult = {
    allowed: true,
    metadata: {
      safeKey: 'safe immutable resolver metadata',
      headers: { authorization: 'hidden' },
    },
    warnings: ['safe immutable resolver warning'],
    rawRows: [{ phone: 'hidden' }],
  };
  const before = JSON.parse(JSON.stringify(resolverResult));
  const gate = createRepairIntakeDraftToCaseAuthorizationGate({
    permissionResolver: {
      async canCreateCaseFromRepairIntakeDraft() {
        return resolverResult;
      },
    },
  });

  const result = await gate.authorizeDraftToCase(authorizationContext());

  assert.equal(result.allowed, true);
  assert.deepEqual(resolverResult, before);
  assertNoUnsafeText(result);
});

test('resolver result containing raw details does not leak unsafe fields', async () => {
  const gate = createRepairIntakeDraftToCaseAuthorizationGate({
    permissionResolver: {
      async canCreateCaseFromRepairIntakeDraft() {
        return {
          allowed: false,
          metadata: {
            safeKey: 'safe denied metadata',
            token: 'hidden',
            headers: { authorization: 'hidden' },
          },
          warnings: ['safe denied warning'],
          rawRows: [{ phone: 'hidden' }],
          stack: 'hidden',
          error: 'hidden',
        };
      },
    },
  });

  const result = await gate.authorizeDraftToCase(authorizationContext());

  assert.equal(result.allowed, false);
  assert.deepEqual(result.metadata, { safeKey: 'safe denied metadata' });
  assert.deepEqual(result.warnings, ['safe denied warning']);
  assertNoUnsafeText(result);
});
