'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftToCaseRequestContextResolver,
  resolveRepairIntakeDraftToCaseRequestContext,
} = require('../../src/repairIntake/repairIntakeDraftToCaseRequestContextResolver');

function validInput(overrides = {}) {
  return {
    sessionContext: {
      organizationId: 'org-1220',
      actorId: 'actor-1220',
      actorRole: 'service_agent',
      token: 'hidden-session-token',
      permissionTrace: { raw: 'hidden-permission-trace' },
      phone: 'hidden-session-phone',
    },
    requestBody: {
      repairIntakeDraftId: 'draft-1220',
      organizationId: 'body-org-override',
      actorId: 'body-actor-override',
      draftInput: {
        issueSummary: 'washer does not drain',
        preferredWindow: 'morning',
        organizationId: 'draft-org-override',
        actorId: 'draft-actor-override',
        providerPayload: { raw: 'hidden-provider-payload' },
        auditRecord: { raw: 'hidden-audit-record' },
        dbRow: { raw: 'hidden-db-row' },
        rawError: 'hidden-raw-error',
        sql: 'hidden-sql',
        query: 'hidden-query',
        stack: 'hidden-stack',
        phone: 'hidden-phone',
        address: 'hidden-address',
        email: 'hidden-email',
      },
      rawBody: 'hidden-raw-body',
    },
    requestSource: 'synthetic_controller_adapter',
    ...overrides,
  };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'body-org-override',
    'body-actor-override',
    'draft-org-override',
    'draft-actor-override',
    'hidden-session-token',
    'hidden-permission-trace',
    'hidden-session-phone',
    'hidden-provider-payload',
    'hidden-audit-record',
    'hidden-db-row',
    'hidden-raw-error',
    'hidden-sql',
    'hidden-query',
    'hidden-stack',
    'hidden-phone',
    'hidden-address',
    'hidden-email',
    'hidden-raw-body',
    'providerPayload',
    'auditRecord',
    'dbRow',
    'rawError',
    'permissionTrace',
    'phone',
    'address',
    'email',
    'token',
    'sql',
    'query',
    'stack',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked unsafe marker ${marker}`);
  }
}

test('valid synthetic session and body returns safe context', () => {
  const result = resolveRepairIntakeDraftToCaseRequestContext(validInput());

  assert.equal(result.ok, true);
  assert.equal(result.status, 'resolved');
  assert.equal(result.messageKey, 'repair_intake_draft_to_case.request_context_resolved');
  assert.equal(result.organizationId, 'org-1220');
  assert.equal(result.actorId, 'actor-1220');
  assert.equal(result.repairIntakeDraftId, 'draft-1220');
  assert.equal(result.source, 'synthetic_controller_adapter');
  assert.equal(result.actorRole, 'service_agent');
  assert.deepEqual(result.draftInput, {
    issueSummary: 'washer does not drain',
    preferredWindow: 'morning',
  });
  assertNoUnsafeText(result);
});

test('factory exposes the pure resolver method', () => {
  const resolver = createRepairIntakeDraftToCaseRequestContextResolver();
  const result = resolver.resolveRepairIntakeDraftToCaseRequestContext(validInput());

  assert.equal(result.ok, true);
  assert.equal(result.organizationId, 'org-1220');
});

test('missing sessionContext organizationId returns invalid_context', () => {
  const result = resolveRepairIntakeDraftToCaseRequestContext(validInput({
    sessionContext: {
      actorId: 'actor-1220',
    },
  }));

  assert.equal(result.ok, false);
  assert.equal(result.status, 'invalid_context');
  assert.equal(result.messageKey, 'repair_intake_draft_to_case.invalid_context');
  assert.equal(
    result.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_REQUEST_CONTEXT_ORGANIZATION_REQUIRED',
  );
  assertNoUnsafeText(result);
});

test('missing sessionContext actorId returns invalid_context', () => {
  const result = resolveRepairIntakeDraftToCaseRequestContext(validInput({
    sessionContext: {
      organizationId: 'org-1220',
    },
  }));

  assert.equal(result.ok, false);
  assert.equal(result.status, 'invalid_context');
  assert.equal(
    result.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_REQUEST_CONTEXT_ACTOR_REQUIRED',
  );
  assertNoUnsafeText(result);
});

test('missing requestBody repairIntakeDraftId returns invalid_input', () => {
  const input = validInput({
    requestBody: {
      draftInput: {
        issueSummary: 'safe summary',
      },
    },
  });

  const result = resolveRepairIntakeDraftToCaseRequestContext(input);

  assert.equal(result.ok, false);
  assert.equal(result.status, 'invalid_input');
  assert.equal(result.messageKey, 'repair_intake_draft_to_case.invalid_input');
  assert.equal(
    result.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_REQUEST_CONTEXT_DRAFT_REQUIRED',
  );
  assertNoUnsafeText(result);
});

test('body-provided organizationId is ignored and does not override session org', () => {
  const result = resolveRepairIntakeDraftToCaseRequestContext(validInput({
    requestBody: {
      repairIntakeDraftId: 'draft-1220',
      organizationId: 'body-org-override',
      draftInput: {
        organizationId: 'draft-org-override',
        issueSummary: 'safe summary',
      },
    },
  }));

  assert.equal(result.organizationId, 'org-1220');
  assert.equal(result.draftInput.organizationId, undefined);
  assertNoUnsafeText(result);
});

test('body-provided actorId is ignored and does not override session actor', () => {
  const result = resolveRepairIntakeDraftToCaseRequestContext(validInput({
    requestBody: {
      repairIntakeDraftId: 'draft-1220',
      actorId: 'body-actor-override',
      draftInput: {
        actorId: 'draft-actor-override',
        preferredWindow: 'afternoon',
      },
    },
  }));

  assert.equal(result.actorId, 'actor-1220');
  assert.equal(result.draftInput.actorId, undefined);
  assertNoUnsafeText(result);
});

test('draftInput must be object if provided', () => {
  const result = resolveRepairIntakeDraftToCaseRequestContext(validInput({
    requestBody: {
      repairIntakeDraftId: 'draft-1220',
      draftInput: 'not an object',
    },
  }));

  assert.equal(result.ok, false);
  assert.equal(result.status, 'invalid_input');
  assert.equal(
    result.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_REQUEST_CONTEXT_DRAFT_INPUT_INVALID',
  );
  assert.deepEqual(result.draftInput, {});
});

test('unsafe body fields are stripped', () => {
  const result = resolveRepairIntakeDraftToCaseRequestContext(validInput());

  assert.deepEqual(Object.keys(result.draftInput).sort(), ['issueSummary', 'preferredWindow']);
  assertNoUnsafeText(result);
});

test('unsafe session fields are stripped', () => {
  const result = resolveRepairIntakeDraftToCaseRequestContext(validInput());

  assert.equal(result.organizationId, 'org-1220');
  assert.equal(result.actorId, 'actor-1220');
  assert.equal(result.actorRole, 'service_agent');
  assert.equal(result.token, undefined);
  assert.equal(result.permissionTrace, undefined);
  assertNoUnsafeText(result);
});

test('resolver does not mutate sessionContext', () => {
  const input = validInput();
  const before = JSON.parse(JSON.stringify(input.sessionContext));

  resolveRepairIntakeDraftToCaseRequestContext(input);

  assert.deepEqual(input.sessionContext, before);
});

test('resolver does not mutate requestBody', () => {
  const input = validInput();
  const before = JSON.parse(JSON.stringify(input.requestBody));

  resolveRepairIntakeDraftToCaseRequestContext(input);

  assert.deepEqual(input.requestBody, before);
});

test('returned draftInput is detached from requestBody draftInput', () => {
  const input = validInput();
  const result = resolveRepairIntakeDraftToCaseRequestContext(input);

  result.draftInput.issueSummary = 'changed after return';

  assert.equal(input.requestBody.draftInput.issueSummary, 'washer does not drain');
});

test('resolver does not expose raw error SQL PII provider or audit fields', () => {
  const result = resolveRepairIntakeDraftToCaseRequestContext(validInput());

  assertNoUnsafeText(result);
});
