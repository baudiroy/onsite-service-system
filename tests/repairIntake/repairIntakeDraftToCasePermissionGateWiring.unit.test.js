'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftToCaseSyntheticHandler,
} = require('../../src/repairIntake/repairIntakeDraftToCaseSyntheticHandler');

function handlerInput(overrides = {}) {
  return {
    sessionContext: {
      organizationId: 'org-permission-wiring-2196',
      actorId: 'actor-permission-wiring-2196',
      actorRole: 'service_agent',
      token: 'hidden-session-token',
    },
    repairIntakeDraftId: 'draft-permission-wiring-2196',
    requestBody: {
      organizationId: 'body-org-should-not-authorize',
      actorId: 'body-actor-should-not-authorize',
      actorRole: 'service_agent',
      repairIntakeDraftId: 'body-draft-should-not-authorize',
      source: 'repair_intake',
      permission: 'cases.create',
      draftInput: {
        issueSummary: 'safe issue summary',
        actorRole: 'service_agent',
        source: 'repair_intake',
        token: 'hidden-draft-token',
        password: 'hidden-password',
        providerPayload: { token: 'hidden-provider-token' },
        ai: { debug: 'hidden-ai-debug' },
        rag: { debug: 'hidden-rag-debug' },
        billing: { internal: 'hidden-billing' },
        audit: { internal: 'hidden-audit' },
        sql: 'hidden-sql',
        stack: 'hidden-stack',
      },
      rawBody: 'hidden-raw-body',
    },
    requestSource: 'synthetic_handler',
    ...overrides,
  };
}

function resolvedContext(overrides = {}) {
  return {
    ok: true,
    status: 'resolved',
    messageKey: 'repair_intake_draft_to_case.request_context_resolved',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_REQUEST_CONTEXT_RESOLVED',
    organizationId: 'org-permission-wiring-2196',
    actorId: 'actor-permission-wiring-2196',
    actorRole: 'service_agent',
    repairIntakeDraftId: 'draft-permission-wiring-2196',
    source: 'synthetic_handler',
    draftInput: {
      issueSummary: 'safe issue summary',
      actorRole: 'service_agent',
      source: 'repair_intake',
      token: 'hidden-draft-token',
      password: 'hidden-password',
      providerPayload: { token: 'hidden-provider-token' },
      ai: { debug: 'hidden-ai-debug' },
      rag: { debug: 'hidden-rag-debug' },
      billing: { internal: 'hidden-billing' },
      audit: { internal: 'hidden-audit' },
      sql: 'hidden-sql',
      stack: 'hidden-stack',
    },
    rawBody: 'hidden-raw-body',
    internal: 'hidden-internal',
    debug: 'hidden-debug',
    ...overrides,
  };
}

function adapterOutput(input) {
  return {
    ok: true,
    status: 'created',
    messageKey: 'repair_intake_draft_to_case.created',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_CREATED',
    caseId: 'case-permission-wiring-2196',
    repairIntakeDraftId: input.repairIntakeDraftId,
  };
}

function createHandlerWithResolvedContext(context) {
  const resolverCalls = [];
  const adapterCalls = [];
  const handler = createRepairIntakeDraftToCaseSyntheticHandler({
    requestContextResolver(input) {
      resolverCalls.push(input);

      return context;
    },
    controllerAdapter: {
      submitDraftToCase(input) {
        adapterCalls.push(input);

        return adapterOutput(input);
      },
    },
  });

  return {
    adapterCalls,
    handler,
    resolverCalls,
  };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'body-org-should-not-authorize',
    'body-actor-should-not-authorize',
    'body-draft-should-not-authorize',
    'hidden-session-token',
    'hidden-draft-token',
    'hidden-password',
    'hidden-provider-token',
    'hidden-ai-debug',
    'hidden-rag-debug',
    'hidden-billing',
    'hidden-audit',
    'hidden-sql',
    'hidden-stack',
    'hidden-raw-body',
    'hidden-internal',
    'hidden-debug',
    'rawBody',
    'requestBody',
    'providerPayload',
    'password',
    'token',
    'billing',
    'audit',
    'debug',
    'internal',
    'stack',
    'sql',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked unsafe marker ${marker}`);
  }
}

test('Task2196 allowed trusted context invokes injected controller adapter exactly once', async () => {
  const flow = createHandlerWithResolvedContext(resolvedContext());

  const result = await flow.handler.handleDraftToCase(handlerInput());

  assert.equal(flow.resolverCalls.length, 1);
  assert.equal(flow.adapterCalls.length, 1);
  assert.equal(result.ok, true);
  assert.equal(result.caseId, 'case-permission-wiring-2196');
  assert.equal(flow.adapterCalls[0].actorRole, 'service_agent');
  assert.equal(flow.adapterCalls[0].source, 'synthetic_handler');
  assertNoUnsafeText(result);
  assertNoUnsafeText(flow.adapterCalls[0]);
});

test('role_not_allowed permission denial does not invoke injected controller adapter', async () => {
  const flow = createHandlerWithResolvedContext(resolvedContext({
    actorRole: 'customer',
  }));

  const result = await flow.handler.handleDraftToCase(handlerInput());

  assert.equal(flow.adapterCalls.length, 0);
  assert.equal(result.ok, false);
  assert.equal(result.status, 'denied');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_PERMISSION_GATE_ROLE_NOT_ALLOWED');
  assert.equal(result.actorRole, 'customer');
  assertNoUnsafeText(result);
});

test('missing trusted context returns sanitized invalid-context envelope without controller adapter call', async () => {
  const flow = createHandlerWithResolvedContext(resolvedContext({
    actorRole: '',
  }));

  const result = await flow.handler.handleDraftToCase(handlerInput());

  assert.equal(flow.adapterCalls.length, 0);
  assert.equal(result.ok, false);
  assert.equal(result.status, 'invalid_context');
  assert.equal(
    result.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_PERMISSION_GATE_MISSING_TRUSTED_CONTEXT',
  );
  assertNoUnsafeText(result);
});

test('invalid_source permission denial returns sanitized deny envelope without controller adapter call', async () => {
  const flow = createHandlerWithResolvedContext(resolvedContext({
    source: 'customer_access',
  }));

  const result = await flow.handler.handleDraftToCase(handlerInput());

  assert.equal(flow.adapterCalls.length, 0);
  assert.equal(result.ok, false);
  assert.equal(result.status, 'denied');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_PERMISSION_GATE_INVALID_SOURCE');
  assert.equal(result.source, 'customer_access');
  assertNoUnsafeText(result);
});

test('client body and draftInput fields cannot upgrade permission decision', async () => {
  const input = handlerInput();
  const context = resolvedContext({
    actorRole: 'customer',
    source: 'customer_access',
  });
  const flow = createHandlerWithResolvedContext(context);

  const result = await flow.handler.handleDraftToCase(input);

  assert.equal(flow.adapterCalls.length, 0);
  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_PERMISSION_GATE_ROLE_NOT_ALLOWED');
  assert.equal(result.actorRole, 'customer');
  assert.equal(result.source, 'customer_access');
  assertNoUnsafeText(result);
});

test('permission gate wiring does not mutate handler input or resolver result', async () => {
  const input = handlerInput();
  const context = resolvedContext({
    actorRole: 'customer',
  });
  const inputBefore = structuredClone(input);
  const contextBefore = structuredClone(context);
  const flow = createHandlerWithResolvedContext(context);

  await flow.handler.handleDraftToCase(input);

  assert.deepEqual(input, inputBefore);
  assert.deepEqual(context, contextBefore);
  assert.equal(flow.adapterCalls.length, 0);
});
