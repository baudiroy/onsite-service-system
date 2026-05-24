'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftToCaseControllerAdapter,
} = require('../../src/repairIntake/repairIntakeDraftToCaseControllerAdapter');

function syntheticInput(overrides = {}) {
  return {
    organizationId: 'org-1217',
    actorId: 'actor-1217',
    repairIntakeDraftId: 'draft-1217',
    source: 'repair_intake',
    actorRole: 'service_agent',
    requestId: 'request-1217',
    tenantId: 'tenant-1217',
    draftInput: {
      status: 'ready',
      summary: { title: 'safe draft title', phone: 'hidden' },
      rawRows: [{ phone: 'hidden' }],
    },
    metadata: {
      safeKey: 'safe metadata',
      headers: { authorization: 'hidden' },
    },
    query: { unsafe: true },
    headers: { authorization: 'hidden' },
    rawRequest: { phone: 'hidden' },
    customerPhone: 'hidden',
    ...overrides,
  };
}

function publicOutput(overrides = {}) {
  return {
    ok: true,
    status: 'created',
    messageKey: 'repair_intake_draft_to_case.created',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_CREATED',
    caseId: 'case-1217',
    repairIntakeDraftId: 'draft-1217',
    ...overrides,
  };
}

function orchestratorSuccess(overrides = {}) {
  return {
    ok: true,
    status: 'created',
    caseId: 'case-1217',
    repairIntakeDraftId: 'draft-1217',
    organizationId: 'org-1217',
    actorId: 'actor-1217',
    rawRows: [{ phone: 'hidden' }],
    stack: 'hidden',
    ...overrides,
  };
}

function createAdapter(calls, options = {}) {
  return createRepairIntakeDraftToCaseControllerAdapter({
    orchestrator: {
      async submitDraftToCase(input) {
        calls.push({ dependency: 'orchestrator', input });

        if (options.orchestratorThrows) {
          throw new Error('hidden orchestrator raw failure stack');
        }

        return options.orchestratorResult || orchestratorSuccess();
      },
    },
    publicResultPresenter: {
      presentRepairIntakeDraftToCaseResult(result) {
        calls.push({ dependency: 'presenter', input: result });

        if (options.presenterThrows) {
          throw new Error('hidden presenter raw failure stack');
        }

        return options.presenterResult || publicOutput();
      },
    },
  });
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'hidden',
    'rawRequest',
    'rawRows',
    'raw',
    'headers',
    'customerPhone',
    'phone',
    'query',
    'stack',
    'error',
    'token',
    'authorization',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked unsafe marker ${marker}`);
  }
}

test('valid synthetic request calls orchestrator then presenter and returns presenter output', async () => {
  const calls = [];
  const adapter = createAdapter(calls);

  const result = await adapter.submitDraftToCase(syntheticInput());

  assert.deepEqual(calls.map(({ dependency }) => dependency), ['orchestrator', 'presenter']);
  assert.deepEqual(result, publicOutput());
  assertNoUnsafeText(calls[0].input);
  assertNoUnsafeText(result);
});

test('adapter passes only expected safe request fields to orchestrator', async () => {
  const calls = [];
  const adapter = createAdapter(calls);

  await adapter.submitDraftToCase(syntheticInput());

  assert.deepEqual(calls[0].input, {
    organizationId: 'org-1217',
    actorId: 'actor-1217',
    repairIntakeDraftId: 'draft-1217',
    source: 'repair_intake',
    actorRole: 'service_agent',
    requestId: 'request-1217',
    tenantId: 'tenant-1217',
    draftInput: {
      status: 'ready',
      summary: {
        title: 'safe draft title',
      },
    },
    metadata: {
      safeKey: 'safe metadata',
    },
  });
});

test('orchestrator denied result is mapped by presenter', async () => {
  const calls = [];
  const adapter = createAdapter(calls, {
    orchestratorResult: orchestratorSuccess({
      ok: false,
      status: 'denied',
      caseId: null,
    }),
    presenterResult: publicOutput({
      ok: false,
      status: 'denied',
      messageKey: 'repair_intake_draft_to_case.denied',
      reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_DENIED',
      caseId: null,
    }),
  });

  const result = await adapter.submitDraftToCase(syntheticInput());

  assert.deepEqual(calls.map(({ dependency }) => dependency), ['orchestrator', 'presenter']);
  assert.equal(result.status, 'denied');
  assert.equal(result.caseId, null);
  assertNoUnsafeText(result);
});

test('orchestrator skipped result is mapped by presenter', async () => {
  const calls = [];
  const adapter = createAdapter(calls, {
    orchestratorResult: orchestratorSuccess({
      ok: false,
      status: 'skipped',
      caseId: null,
    }),
    presenterResult: publicOutput({
      ok: false,
      status: 'not_created',
      messageKey: 'repair_intake_draft_to_case.not_created',
      reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_NOT_CREATED',
      caseId: null,
    }),
  });

  const result = await adapter.submitDraftToCase(syntheticInput());

  assert.equal(result.status, 'not_created');
  assert.equal(result.caseId, null);
  assertNoUnsafeText(result);
});

test('orchestrator throws and adapter returns presenter-mapped generic failure without raw leakage', async () => {
  const calls = [];
  const adapter = createAdapter(calls, {
    orchestratorThrows: true,
    presenterResult: publicOutput({
      ok: false,
      status: 'unavailable',
      messageKey: 'repair_intake_draft_to_case.unavailable',
      reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_UNAVAILABLE',
      caseId: null,
    }),
  });

  const result = await adapter.submitDraftToCase(syntheticInput());

  assert.deepEqual(calls.map(({ dependency }) => dependency), ['orchestrator', 'presenter']);
  assert.equal(calls[1].input.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_ADAPTER_ORCHESTRATOR_FAILED');
  assert.equal(result.status, 'unavailable');
  assertNoUnsafeText(result);
});

test('presenter throws and adapter returns minimal generic safe failure without raw leakage', async () => {
  const calls = [];
  const adapter = createAdapter(calls, { presenterThrows: true });

  const result = await adapter.submitDraftToCase(syntheticInput());

  assert.deepEqual(calls.map(({ dependency }) => dependency), ['orchestrator', 'presenter']);
  assert.equal(result.ok, false);
  assert.equal(result.status, 'unavailable');
  assert.equal(result.messageKey, 'repair_intake_draft_to_case.unavailable');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_ADAPTER_PRESENTER_FAILED');
  assert.equal(result.caseId, null);
  assert.equal(result.repairIntakeDraftId, 'draft-1217');
  assertNoUnsafeText(result);
});

test('missing orchestrator returns safe invalid dependency without calling presenter unexpectedly', async () => {
  const adapter = createRepairIntakeDraftToCaseControllerAdapter({
    publicResultPresenter: () => publicOutput(),
  });

  const result = await adapter.submitDraftToCase(syntheticInput());

  assert.equal(result.ok, false);
  assert.equal(result.status, 'unavailable');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_ADAPTER_ORCHESTRATOR_REQUIRED');
  assert.equal(result.repairIntakeDraftId, 'draft-1217');
  assertNoUnsafeText(result);
});

test('missing presenter returns safe invalid dependency', async () => {
  const adapter = createRepairIntakeDraftToCaseControllerAdapter({
    orchestrator: { async submitDraftToCase() { return orchestratorSuccess(); } },
  });

  const result = await adapter.submitDraftToCase(syntheticInput());

  assert.equal(result.ok, false);
  assert.equal(result.status, 'unavailable');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_ADAPTER_PRESENTER_REQUIRED');
  assert.equal(result.repairIntakeDraftId, 'draft-1217');
  assertNoUnsafeText(result);
});

test('adapter does not mutate request object', async () => {
  const input = syntheticInput();
  const before = JSON.parse(JSON.stringify(input));
  const adapter = createAdapter([]);

  await adapter.submitDraftToCase(input);

  assert.deepEqual(input, before);
});

test('adapter does not mutate orchestrator result', async () => {
  const calls = [];
  const orchestratorResult = orchestratorSuccess();
  const before = JSON.parse(JSON.stringify(orchestratorResult));
  const adapter = createAdapter(calls, { orchestratorResult });

  await adapter.submitDraftToCase(syntheticInput());

  assert.deepEqual(orchestratorResult, before);
});

test('adapter does not mutate presenter result', async () => {
  const calls = [];
  const presenterResult = publicOutput();
  const before = JSON.parse(JSON.stringify(presenterResult));
  const adapter = createAdapter(calls, { presenterResult });

  await adapter.submitDraftToCase(syntheticInput());

  assert.deepEqual(presenterResult, before);
});

test('unsafe fields from synthetic request are not forwarded', async () => {
  const calls = [];
  const adapter = createAdapter(calls);

  await adapter.submitDraftToCase(syntheticInput({
    sql: 'hidden',
    rawRows: [{ phone: 'hidden' }],
    providerPayload: { token: 'hidden' },
  }));

  assertNoUnsafeText(calls[0].input);
});
