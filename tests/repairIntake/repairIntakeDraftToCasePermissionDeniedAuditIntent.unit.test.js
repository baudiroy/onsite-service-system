'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftToCaseSyntheticHandler,
} = require('../../src/repairIntake/repairIntakeDraftToCaseSyntheticHandler');

function handlerInput(overrides = {}) {
  return {
    sessionContext: {
      organizationId: 'org-permission-audit-2198',
      actorId: 'actor-permission-audit-2198',
      actorRole: 'service_agent',
      token: 'hidden-session-token',
    },
    repairIntakeDraftId: 'draft-permission-audit-2198',
    requestBody: {
      organizationId: 'body-org-should-not-audit',
      actorId: 'body-actor-should-not-audit',
      actorRole: 'service_agent',
      repairIntakeDraftId: 'body-draft-should-not-audit',
      source: 'repair_intake',
      draftInput: {
        customerName: 'hidden-customer-name',
        customerPhone: 'hidden-customer-phone',
        address: 'hidden-address',
        privateNotes: 'hidden-private-notes',
        actorRole: 'service_agent',
        source: 'repair_intake',
        token: 'hidden-token',
        password: 'hidden-password',
        providerPayload: { token: 'hidden-provider-token' },
        ai: { debug: 'hidden-ai-debug' },
        rag: { debug: 'hidden-rag-debug' },
        billing: { internal: 'hidden-billing' },
        settlement: { internal: 'hidden-settlement' },
        invoice: { internal: 'hidden-invoice' },
        audit: { internal: 'hidden-audit' },
        sql: 'hidden-sql',
        stack: 'hidden-stack',
        rawError: 'hidden-raw-error',
      },
      rawBody: 'hidden-raw-body',
    },
    rawRequest: 'hidden-raw-request',
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
    organizationId: 'org-permission-audit-2198',
    actorId: 'actor-permission-audit-2198',
    actorRole: 'customer',
    repairIntakeDraftId: 'draft-permission-audit-2198',
    source: 'synthetic_handler',
    draftInput: {
      customerName: 'hidden-customer-name',
      customerPhone: 'hidden-customer-phone',
      address: 'hidden-address',
      privateNotes: 'hidden-private-notes',
      actorRole: 'service_agent',
      source: 'repair_intake',
      providerPayload: { token: 'hidden-provider-token' },
      token: 'hidden-token',
      password: 'hidden-password',
      ai: { debug: 'hidden-ai-debug' },
      rag: { debug: 'hidden-rag-debug' },
      billing: { internal: 'hidden-billing' },
      settlement: { internal: 'hidden-settlement' },
      invoice: { internal: 'hidden-invoice' },
      audit: { internal: 'hidden-audit' },
      sql: 'hidden-sql',
      stack: 'hidden-stack',
      rawError: 'hidden-raw-error',
    },
    rawBody: 'hidden-raw-body',
    rawRequest: 'hidden-raw-request',
    internal: 'hidden-internal',
    debug: 'hidden-debug',
    ...overrides,
  };
}

function createDeniedFlow(options = {}) {
  const adapterCalls = [];
  const auditCalls = [];
  const context = options.context || resolvedContext();
  const handler = createRepairIntakeDraftToCaseSyntheticHandler({
    requestContextResolver() {
      return context;
    },
    controllerAdapter: {
      submitDraftToCase(input) {
        adapterCalls.push(input);

        return {
          ok: true,
          status: 'created',
          caseId: 'case-should-not-be-created',
          repairIntakeDraftId: input.repairIntakeDraftId,
        };
      },
    },
    permissionDeniedAuditWriter: options.auditWriter === undefined ? {
      recordRepairIntakeDraftToCasePermissionDenied(payload) {
        auditCalls.push(payload);
      },
    } : options.auditWriter,
  });

  return {
    adapterCalls,
    auditCalls,
    context,
    handler,
  };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'should-not-audit',
    'hidden-session-token',
    'hidden-customer-name',
    'hidden-customer-phone',
    'hidden-address',
    'hidden-private-notes',
    'hidden-token',
    'hidden-password',
    'hidden-provider-token',
    'hidden-ai-debug',
    'hidden-rag-debug',
    'hidden-billing',
    'hidden-settlement',
    'hidden-invoice',
    'hidden-audit',
    'hidden-sql',
    'hidden-stack',
    'hidden-raw-error',
    'hidden-raw-body',
    'hidden-raw-request',
    'hidden-internal',
    'hidden-debug',
    'requestBody',
    'rawBody',
    'rawRequest',
    'providerPayload',
    'customerName',
    'customerPhone',
    'privateNotes',
    'password',
    'token',
    'billing',
    'settlement',
    'invoice',
    'debug',
    'internal',
    'stack',
    'sql',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked unsafe marker ${marker}`);
  }
}

test('permission denied path writes sanitized audit intent and skips injected controller adapter', async () => {
  const flow = createDeniedFlow();

  const result = await flow.handler.handleDraftToCase(handlerInput());

  assert.equal(flow.adapterCalls.length, 0);
  assert.equal(flow.auditCalls.length, 1);
  assert.equal(result.status, 'denied');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_PERMISSION_GATE_ROLE_NOT_ALLOWED');
  assert.deepEqual(flow.auditCalls[0], {
    auditIntent: {
      eventType: 'repair_intake_draft_to_case_permission_denied',
      phase: 'denied',
      status: 'denied',
      outcome: 'permission_denied',
      organizationId: 'org-permission-audit-2198',
      actorId: 'actor-permission-audit-2198',
      actorRole: 'customer',
      repairIntakeDraftId: 'draft-permission-audit-2198',
      source: 'synthetic_handler',
      permissionReasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PERMISSION_GATE_ROLE_NOT_ALLOWED',
      reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PERMISSION_GATE_ROLE_NOT_ALLOWED',
    },
  });
  assertNoUnsafeText(result);
  assertNoUnsafeText(flow.auditCalls[0]);
});

test('missing audit writer does not throw and preserves public permission denied response', async () => {
  const flow = createDeniedFlow({ auditWriter: null });

  const result = await flow.handler.handleDraftToCase(handlerInput());

  assert.equal(flow.adapterCalls.length, 0);
  assert.equal(flow.auditCalls.length, 0);
  assert.equal(result.ok, false);
  assert.equal(result.status, 'denied');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_PERMISSION_GATE_ROLE_NOT_ALLOWED');
  assertNoUnsafeText(result);
});

test('audit writer failure does not expose raw error details in public response', async () => {
  const flow = createDeniedFlow({
    auditWriter: {
      recordPermissionDenied() {
        throw new Error('hidden-audit-writer-error hidden-sql hidden-stack hidden-token');
      },
    },
  });

  const result = await flow.handler.handleDraftToCase(handlerInput());

  assert.equal(flow.adapterCalls.length, 0);
  assert.equal(result.ok, false);
  assert.equal(result.status, 'denied');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_PERMISSION_GATE_ROLE_NOT_ALLOWED');
  assertNoUnsafeText(result);
});

test('invalid source denial writes sanitized permission audit intent', async () => {
  const flow = createDeniedFlow({
    context: resolvedContext({
      actorRole: 'service_agent',
      source: 'customer_access',
    }),
  });

  const result = await flow.handler.handleDraftToCase(handlerInput());

  assert.equal(flow.adapterCalls.length, 0);
  assert.equal(flow.auditCalls.length, 1);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_PERMISSION_GATE_INVALID_SOURCE');
  assert.equal(flow.auditCalls[0].auditIntent.permissionReasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_PERMISSION_GATE_INVALID_SOURCE');
  assert.equal(flow.auditCalls[0].auditIntent.source, 'customer_access');
  assertNoUnsafeText(flow.auditCalls[0]);
});

test('client body and draftInput fields cannot upgrade permission audit outcome', async () => {
  const input = handlerInput();
  const context = resolvedContext({
    actorRole: 'customer',
    source: 'customer_access',
  });
  const contextBefore = structuredClone(context);
  const inputBefore = structuredClone(input);
  const flow = createDeniedFlow({ context });

  const result = await flow.handler.handleDraftToCase(input);

  assert.equal(flow.adapterCalls.length, 0);
  assert.equal(flow.auditCalls.length, 1);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_PERMISSION_GATE_ROLE_NOT_ALLOWED');
  assert.equal(flow.auditCalls[0].auditIntent.actorRole, 'customer');
  assert.equal(flow.auditCalls[0].auditIntent.source, 'customer_access');
  assert.deepEqual(input, inputBefore);
  assert.deepEqual(context, contextBefore);
  assertNoUnsafeText(result);
  assertNoUnsafeText(flow.auditCalls[0]);
});
