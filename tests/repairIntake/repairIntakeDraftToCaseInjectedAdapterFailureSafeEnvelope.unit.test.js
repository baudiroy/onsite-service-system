'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftToCaseSyntheticHandler,
} = require('../../src/repairIntake/repairIntakeDraftToCaseSyntheticHandler');

function handlerInput(overrides = {}) {
  return {
    sessionContext: {
      organizationId: 'org-task-2200',
      actorId: 'actor-task-2200',
      actorRole: 'service_agent',
      token: 'hidden-session-token-task-2200',
      auditActor: { id: 'hidden-audit-actor-task-2200' },
    },
    requestBody: {
      organizationId: 'body-org-should-not-leak-task-2200',
      actorId: 'body-actor-should-not-leak-task-2200',
      repairIntakeDraftId: 'body-draft-should-not-leak-task-2200',
      rawBody: 'hidden-raw-request-body-task-2200',
      draftInput: {
        issueSummary: 'washer leaks under sink',
        preferredWindow: 'morning',
        customerName: 'hidden-customer-name-task-2200',
        customerPhone: 'hidden-customer-phone-task-2200',
        address: 'hidden-address-task-2200',
        privateNotes: 'hidden-private-notes-task-2200',
        token: 'hidden-draft-token-task-2200',
        password: 'hidden-password-task-2200',
        providerPayload: { raw: 'hidden-provider-payload-task-2200' },
        ai: { debug: 'hidden-ai-task-2200' },
        rag: { debug: 'hidden-rag-task-2200' },
        billing: { invoice: 'hidden-invoice-task-2200' },
        settlement: { payout: 'hidden-settlement-task-2200' },
        audit: { internal: 'hidden-audit-task-2200' },
        rawError: 'hidden-raw-error-task-2200',
        stack: 'hidden-stack-task-2200',
        sql: 'hidden-sql-task-2200',
      },
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
    organizationId: 'org-task-2200',
    actorId: 'actor-task-2200',
    actorRole: 'service_agent',
    repairIntakeDraftId: 'draft-task-2200',
    source: 'synthetic_handler',
    draftInput: {
      issueSummary: 'washer leaks under sink',
      preferredWindow: 'morning',
      customerName: 'hidden-customer-name-task-2200',
      customerPhone: 'hidden-customer-phone-task-2200',
      address: 'hidden-address-task-2200',
      privateNotes: 'hidden-private-notes-task-2200',
      token: 'hidden-draft-token-task-2200',
      password: 'hidden-password-task-2200',
      providerPayload: { raw: 'hidden-provider-payload-task-2200' },
      ai: { debug: 'hidden-ai-task-2200' },
      rag: { debug: 'hidden-rag-task-2200' },
      billing: { invoice: 'hidden-invoice-task-2200' },
      settlement: { payout: 'hidden-settlement-task-2200' },
      audit: { internal: 'hidden-audit-task-2200' },
      rawError: 'hidden-raw-error-task-2200',
      stack: 'hidden-stack-task-2200',
      sql: 'hidden-sql-task-2200',
    },
    rawBody: 'hidden-resolver-raw-body-task-2200',
    auditActor: { id: 'hidden-resolver-audit-actor-task-2200' },
    internal: 'hidden-internal-task-2200',
    ...overrides,
  };
}

function successOutput(input) {
  return {
    ok: true,
    status: 'created',
    messageKey: 'repair_intake_draft_to_case.created',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_CREATED',
    caseId: 'case-task-2200',
    repairIntakeDraftId: input.repairIntakeDraftId,
  };
}

function createFlow({
  context = resolvedContext(),
  submitDraftToCase = (input) => successOutput(input),
  permissionDeniedAuditWriter,
} = {}) {
  const adapterCalls = [];
  const resolverCalls = [];
  const handler = createRepairIntakeDraftToCaseSyntheticHandler({
    requestContextResolver(input) {
      resolverCalls.push(input);

      return context;
    },
    controllerAdapter: {
      submitDraftToCase(input) {
        adapterCalls.push(input);

        return submitDraftToCase(input);
      },
    },
    permissionDeniedAuditWriter,
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
    'body-org-should-not-leak-task-2200',
    'body-actor-should-not-leak-task-2200',
    'body-draft-should-not-leak-task-2200',
    'hidden-session-token-task-2200',
    'hidden-audit-actor-task-2200',
    'hidden-raw-request-body-task-2200',
    'hidden-customer-name-task-2200',
    'hidden-customer-phone-task-2200',
    'hidden-address-task-2200',
    'hidden-private-notes-task-2200',
    'hidden-draft-token-task-2200',
    'hidden-password-task-2200',
    'hidden-provider-payload-task-2200',
    'hidden-ai-task-2200',
    'hidden-rag-task-2200',
    'hidden-invoice-task-2200',
    'hidden-settlement-task-2200',
    'hidden-audit-task-2200',
    'hidden-raw-error-task-2200',
    'hidden-stack-task-2200',
    'hidden-sql-task-2200',
    'hidden-resolver-raw-body-task-2200',
    'hidden-resolver-audit-actor-task-2200',
    'hidden-internal-task-2200',
    'raw request body task 2200',
    'SELECT * FROM customers_task_2200',
    'providerPayload',
    'rawBody',
    'rawRequest',
    'rawError',
    'customerName',
    'customerPhone',
    'privateNotes',
    'address',
    'auditActor',
    'providerSecret',
    'password',
    'token',
    'billing',
    'settlement',
    'invoice',
    'audit',
    'debug',
    'internal',
    'stack',
    'sql',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked unsafe marker ${marker}`);
  }
}

function assertNoHiddenUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'body-org-should-not-leak-task-2200',
    'body-actor-should-not-leak-task-2200',
    'body-draft-should-not-leak-task-2200',
    'hidden-session-token-task-2200',
    'hidden-audit-actor-task-2200',
    'hidden-raw-request-body-task-2200',
    'hidden-customer-name-task-2200',
    'hidden-customer-phone-task-2200',
    'hidden-address-task-2200',
    'hidden-private-notes-task-2200',
    'hidden-draft-token-task-2200',
    'hidden-password-task-2200',
    'hidden-provider-payload-task-2200',
    'hidden-ai-task-2200',
    'hidden-rag-task-2200',
    'hidden-invoice-task-2200',
    'hidden-settlement-task-2200',
    'hidden-audit-task-2200',
    'hidden-raw-error-task-2200',
    'hidden-stack-task-2200',
    'hidden-sql-task-2200',
    'hidden-resolver-raw-body-task-2200',
    'hidden-resolver-audit-actor-task-2200',
    'hidden-internal-task-2200',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked hidden marker ${marker}`);
  }
}

test('Task2200 allowed path invokes injected adapter exactly once and returns sanitized success output', async () => {
  const flow = createFlow();
  const result = await flow.handler.handleDraftToCase(handlerInput());

  assert.equal(flow.resolverCalls.length, 1);
  assert.equal(flow.adapterCalls.length, 1);
  assert.equal(result.ok, true);
  assert.equal(result.status, 'created');
  assert.equal(result.caseId, 'case-task-2200');
  assert.deepEqual(flow.adapterCalls[0], {
    organizationId: 'org-task-2200',
    actorId: 'actor-task-2200',
    repairIntakeDraftId: 'draft-task-2200',
    source: 'synthetic_handler',
    actorRole: 'service_agent',
    draftInput: {
      problemDescription: 'washer leaks under sink',
      preferredTimeDescription: 'morning',
    },
  });
  assertNoUnsafeText(flow.adapterCalls[0]);
  assertNoUnsafeText(result);
});

test('Task2200 thrown injected adapter exception returns safe failure envelope without raw leak', async () => {
  const flow = createFlow({
    submitDraftToCase() {
      const error = new Error(
        'raw request body task 2200 SELECT * FROM customers_task_2200 hidden-password-task-2200',
      );
      error.stack = 'hidden-stack-task-2200';
      error.providerPayload = { providerSecret: 'hidden-provider-payload-task-2200' };

      throw error;
    },
  });

  const result = await flow.handler.handleDraftToCase(handlerInput());

  assert.equal(flow.adapterCalls.length, 1);
  assert.equal(result.ok, false);
  assert.equal(result.status, 'failed');
  assert.equal(
    result.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_SYNTHETIC_HANDLER_CONTROLLER_ADAPTER_FAILED',
  );
  assert.equal(result.organizationId, 'org-task-2200');
  assert.equal(result.actorId, 'actor-task-2200');
  assert.equal(result.actorRole, 'service_agent');
  assert.equal(result.repairIntakeDraftId, 'draft-task-2200');
  assert.equal(result.source, 'synthetic_handler');
  assert.deepEqual(result.draftInput, {});
  assertNoUnsafeText(result);
});

test('Task2200 rejected injected adapter promise returns safe failure envelope without raw leak', async () => {
  const flow = createFlow({
    async submitDraftToCase() {
      return Promise.reject(
        new Error('raw request body task 2200 hidden-sql-task-2200 hidden-provider-payload-task-2200'),
      );
    },
  });

  const result = await flow.handler.handleDraftToCase(handlerInput());

  assert.equal(flow.adapterCalls.length, 1);
  assert.equal(result.ok, false);
  assert.equal(result.status, 'failed');
  assert.equal(
    result.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_SYNTHETIC_HANDLER_CONTROLLER_ADAPTER_FAILED',
  );
  assert.deepEqual(result.draftInput, {});
  assertNoUnsafeText(result);
});

test('Task2200 malformed injected adapter result maps to safe failure envelope', async () => {
  for (const malformedResult of [
    null,
    'hidden-raw-error-task-2200',
    ['hidden-password-task-2200'],
    { status: 'created', rawError: 'hidden-raw-error-task-2200' },
  ]) {
    const flow = createFlow({
      submitDraftToCase() {
        return malformedResult;
      },
    });

    const result = await flow.handler.handleDraftToCase(handlerInput());

    assert.equal(flow.adapterCalls.length, 1);
    assert.equal(result.ok, false);
    assert.equal(result.status, 'failed');
    assert.equal(
      result.reasonCode,
      'REPAIR_INTAKE_DRAFT_TO_CASE_SYNTHETIC_HANDLER_CONTROLLER_ADAPTER_OUTPUT_INVALID',
    );
    assert.equal(result.organizationId, 'org-task-2200');
    assert.deepEqual(result.draftInput, {});
    assertNoUnsafeText(result);
  }
});

test('Task2200 permission-denied path still skips injected adapter and returns sanitized deny envelope', async () => {
  const auditCalls = [];
  const flow = createFlow({
    context: resolvedContext({
      actorRole: 'customer',
      source: 'customer_access',
    }),
    submitDraftToCase() {
      throw new Error('adapter should not be invoked');
    },
    permissionDeniedAuditWriter(payload) {
      auditCalls.push(payload);
    },
  });

  const result = await flow.handler.handleDraftToCase(handlerInput());

  assert.equal(flow.adapterCalls.length, 0);
  assert.equal(auditCalls.length, 1);
  assert.equal(result.ok, false);
  assert.equal(result.status, 'denied');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_PERMISSION_GATE_ROLE_NOT_ALLOWED');
  assert.equal(result.actorRole, 'customer');
  assert.equal(result.source, 'customer_access');
  assertNoUnsafeText(result);
  assertNoHiddenUnsafeText(auditCalls);
});

test('Task2200 adapter failure handling does not mutate handler input, resolver result, or adapter result', async () => {
  const input = handlerInput();
  const context = resolvedContext();
  const adapterResult = { status: 'created', rawError: 'hidden-raw-error-task-2200' };
  const inputBefore = structuredClone(input);
  const contextBefore = structuredClone(context);
  const adapterResultBefore = structuredClone(adapterResult);
  const flow = createFlow({
    context,
    submitDraftToCase() {
      return adapterResult;
    },
  });

  const result = await flow.handler.handleDraftToCase(input);

  assert.equal(result.ok, false);
  assert.deepEqual(input, inputBefore);
  assert.deepEqual(context, contextBefore);
  assert.deepEqual(adapterResult, adapterResultBefore);
  assertNoUnsafeText(result);
});
