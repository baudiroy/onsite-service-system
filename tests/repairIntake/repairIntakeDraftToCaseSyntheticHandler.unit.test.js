'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftToCaseSyntheticHandler,
} = require('../../src/repairIntake/repairIntakeDraftToCaseSyntheticHandler');

function syntheticInput(overrides = {}) {
  return {
    sessionContext: {
      organizationId: 'org-1221',
      actorId: 'actor-1221',
      actorRole: 'service_agent',
      token: 'hidden-session-token',
      permissionTrace: { raw: 'hidden-permission-trace' },
    },
    requestBody: {
      repairIntakeDraftId: 'draft-1221',
      organizationId: 'body-org-override',
      actorId: 'body-actor-override',
      draftInput: {
        issueSummary: 'dryer does not heat',
        preferredWindow: 'afternoon',
        phone: 'hidden-phone',
        address: 'hidden-address',
        email: 'hidden-email',
        providerPayload: { raw: 'hidden-provider-payload' },
        auditRecord: { raw: 'hidden-audit-record' },
        dbRow: { raw: 'hidden-db-row' },
        rawError: 'hidden-raw-error',
        sql: 'hidden-sql',
        query: 'hidden-query',
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
    organizationId: 'org-1221',
    actorId: 'actor-1221',
    repairIntakeDraftId: 'draft-1221',
    source: 'synthetic_handler',
    actorRole: 'service_agent',
    draftInput: {
      issueSummary: 'dryer does not heat',
      preferredWindow: 'afternoon',
      unknownField: 'hidden-unknown',
      providerPayload: { raw: 'hidden-provider-payload' },
      rawError: 'hidden-raw-error',
    },
    ...overrides,
  };
}

function adapterOutput(overrides = {}) {
  return {
    ok: true,
    status: 'created',
    messageKey: 'repair_intake_draft_to_case.created',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_CREATED',
    caseId: 'case-1221',
    repairIntakeDraftId: 'draft-1221',
    ...overrides,
  };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'body-org-override',
    'body-actor-override',
    'hidden-session-token',
    'hidden-permission-trace',
    'hidden-phone',
    'hidden-address',
    'hidden-email',
    'hidden-provider-payload',
    'hidden-audit-record',
    'hidden-db-row',
    'hidden-raw-error',
    'hidden-sql',
    'hidden-query',
    'hidden-stack',
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

test('valid synthetic input calls resolver first then controller adapter and returns adapter output', async () => {
  const calls = [];
  const handler = createRepairIntakeDraftToCaseSyntheticHandler({
    requestContextResolver: {
      resolveRepairIntakeDraftToCaseRequestContext(input) {
        calls.push(['resolver', input]);
        return resolvedContext();
      },
    },
    controllerAdapter: {
      async submitDraftToCase(input) {
        calls.push(['adapter', input]);
        return adapterOutput();
      },
    },
  });

  const result = await handler.handleDraftToCase(syntheticInput());

  assert.deepEqual(calls.map(([label]) => label), ['resolver', 'adapter']);
  assert.equal(result.ok, true);
  assert.equal(result.caseId, 'case-1221');
  assert.equal(result.repairIntakeDraftId, 'draft-1221');
  assertNoUnsafeText(result);
});

test('handler passes only sanitized resolver fields into controller adapter', async () => {
  let adapterInput;
  const handler = createRepairIntakeDraftToCaseSyntheticHandler({
    requestContextResolver() {
      return resolvedContext();
    },
    controllerAdapter: {
      handleDraftToCase(input) {
        adapterInput = input;
        return adapterOutput();
      },
    },
  });

  await handler.handleDraftToCase(syntheticInput());

  assert.deepEqual(adapterInput, {
    organizationId: 'org-1221',
    actorId: 'actor-1221',
    repairIntakeDraftId: 'draft-1221',
    source: 'synthetic_handler',
    actorRole: 'service_agent',
    draftInput: {
      problemDescription: 'dryer does not heat',
      preferredTimeDescription: 'afternoon',
    },
  });
  assertNoUnsafeText(adapterInput);
});

test('resolver invalid context result does not call controller adapter', async () => {
  const calls = [];
  const handler = createRepairIntakeDraftToCaseSyntheticHandler({
    requestContextResolver() {
      return {
        ok: false,
        status: 'invalid_context',
        messageKey: 'repair_intake_draft_to_case.invalid_context',
        reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_REQUEST_CONTEXT_ORGANIZATION_REQUIRED',
        organizationId: null,
        actorId: 'actor-1221',
        repairIntakeDraftId: 'draft-1221',
        rawError: 'hidden-raw-error',
      };
    },
    controllerAdapter: {
      submitDraftToCase(input) {
        calls.push(input);
        return adapterOutput();
      },
    },
  });

  const result = await handler.handleDraftToCase(syntheticInput());

  assert.deepEqual(calls, []);
  assert.equal(result.ok, false);
  assert.equal(result.status, 'invalid_context');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_REQUEST_CONTEXT_ORGANIZATION_REQUIRED');
  assertNoUnsafeText(result);
});

test('resolver throws and handler returns generic safe failure without raw leak', async () => {
  const handler = createRepairIntakeDraftToCaseSyntheticHandler({
    requestContextResolver() {
      throw new Error('hidden-raw-error hidden-sql hidden-phone');
    },
    controllerAdapter: {
      submitDraftToCase() {
        return adapterOutput();
      },
    },
  });

  const result = await handler.handleDraftToCase(syntheticInput());

  assert.equal(result.ok, false);
  assert.equal(result.status, 'failed');
  assert.equal(
    result.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_SYNTHETIC_HANDLER_CONTEXT_RESOLVER_FAILED',
  );
  assertNoUnsafeText(result);
});

test('adapter throws and handler returns generic safe unavailable failure without raw leak', async () => {
  const handler = createRepairIntakeDraftToCaseSyntheticHandler({
    requestContextResolver() {
      return resolvedContext();
    },
    controllerAdapter: {
      submitDraftToCase() {
        throw new Error('hidden-raw-error hidden-sql hidden-phone');
      },
    },
  });

  const result = await handler.handleDraftToCase(syntheticInput());

  assert.equal(result.ok, false);
  assert.equal(result.status, 'failed');
  assert.equal(
    result.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_SYNTHETIC_HANDLER_CONTROLLER_ADAPTER_FAILED',
  );
  assert.equal(result.organizationId, 'org-1221');
  assert.equal(result.actorId, 'actor-1221');
  assertNoUnsafeText(result);
});

test('missing resolver returns safe invalid dependency', async () => {
  const handler = createRepairIntakeDraftToCaseSyntheticHandler({
    controllerAdapter: {
      submitDraftToCase() {
        return adapterOutput();
      },
    },
  });

  const result = await handler.handleDraftToCase(syntheticInput());

  assert.equal(result.ok, false);
  assert.equal(result.status, 'invalid_dependency');
  assert.equal(
    result.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_SYNTHETIC_HANDLER_CONTEXT_RESOLVER_REQUIRED',
  );
  assertNoUnsafeText(result);
});

test('missing controller adapter returns safe invalid dependency', async () => {
  const handler = createRepairIntakeDraftToCaseSyntheticHandler({
    requestContextResolver() {
      return resolvedContext();
    },
  });

  const result = await handler.handleDraftToCase(syntheticInput());

  assert.equal(result.ok, false);
  assert.equal(result.status, 'invalid_dependency');
  assert.equal(
    result.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_SYNTHETIC_HANDLER_CONTROLLER_ADAPTER_REQUIRED',
  );
  assertNoUnsafeText(result);
});

test('resolver missing required method returns safe invalid dependency', async () => {
  const handler = createRepairIntakeDraftToCaseSyntheticHandler({
    requestContextResolver: {},
    controllerAdapter: {
      submitDraftToCase() {
        return adapterOutput();
      },
    },
  });

  const result = await handler.handleDraftToCase(syntheticInput());

  assert.equal(result.status, 'invalid_dependency');
  assert.equal(
    result.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_SYNTHETIC_HANDLER_CONTEXT_RESOLVER_REQUIRED',
  );
  assertNoUnsafeText(result);
});

test('controller adapter missing required method returns safe invalid dependency', async () => {
  const handler = createRepairIntakeDraftToCaseSyntheticHandler({
    requestContextResolver() {
      return resolvedContext();
    },
    controllerAdapter: {},
  });

  const result = await handler.handleDraftToCase(syntheticInput());

  assert.equal(result.status, 'invalid_dependency');
  assert.equal(
    result.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_SYNTHETIC_HANDLER_CONTROLLER_ADAPTER_REQUIRED',
  );
  assertNoUnsafeText(result);
});

test('handler does not mutate original handler input', async () => {
  const input = syntheticInput();
  const before = JSON.parse(JSON.stringify(input));
  const handler = createRepairIntakeDraftToCaseSyntheticHandler({
    requestContextResolver() {
      return resolvedContext();
    },
    controllerAdapter: {
      submitDraftToCase() {
        return adapterOutput();
      },
    },
  });

  await handler.handleDraftToCase(input);

  assert.deepEqual(input, before);
});

test('handler does not mutate resolver result', async () => {
  const resolverResult = resolvedContext();
  const before = JSON.parse(JSON.stringify(resolverResult));
  const handler = createRepairIntakeDraftToCaseSyntheticHandler({
    requestContextResolver() {
      return resolverResult;
    },
    controllerAdapter: {
      submitDraftToCase() {
        return adapterOutput();
      },
    },
  });

  await handler.handleDraftToCase(syntheticInput());

  assert.deepEqual(resolverResult, before);
});

test('handler does not mutate adapter result', async () => {
  const output = adapterOutput({
    rawError: 'hidden-raw-error',
  });
  const before = JSON.parse(JSON.stringify(output));
  const handler = createRepairIntakeDraftToCaseSyntheticHandler({
    requestContextResolver() {
      return resolvedContext();
    },
    controllerAdapter: {
      submitDraftToCase() {
        return output;
      },
    },
  });

  const result = await handler.handleDraftToCase(syntheticInput());

  assert.deepEqual(output, before);
  assert.equal(result.rawError, undefined);
  assertNoUnsafeText(result);
});

test('unsafe fields from session and body are not forwarded', async () => {
  let adapterInput;
  const handler = createRepairIntakeDraftToCaseSyntheticHandler({
    requestContextResolver() {
      return resolvedContext({
        token: 'hidden-session-token',
        permissionTrace: { raw: 'hidden-permission-trace' },
        draftInput: {
          issueSummary: 'dryer does not heat',
          phone: 'hidden-phone',
          organizationId: 'hidden-draft-organization',
          caseId: 'hidden-case-id',
          providerPayload: { raw: 'hidden-provider-payload' },
          rawError: 'hidden-raw-error',
        },
      });
    },
    controllerAdapter: {
      submitDraftToCase(input) {
        adapterInput = input;
        return adapterOutput();
      },
    },
  });

  await handler.handleDraftToCase(syntheticInput());

  assert.deepEqual(adapterInput.draftInput, {
    problemDescription: 'dryer does not heat',
  });
  assertNoUnsafeText(adapterInput);
});
