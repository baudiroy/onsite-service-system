'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftToCaseApplicationService,
} = require('../../src/repairIntake/repairIntakeDraftToCaseApplicationService');

const UNSAFE_TEXT = [
  'select * from unsafe_port_table',
  'postgres://unsafe-db-url',
  'DATABASE_URL',
  'process.env',
  'unsafe token',
  'unsafe password',
  'unsafe secret',
  'unsafe stack trace',
  'unsafe provider payload',
  'unsafe customer phone',
  'unsafe address',
  'unsafe raw draft',
  'unsafe audit internal',
  'unsafe debug detail',
].join(' ');

function submitInput() {
  return {
    draftId: 'draft-task2226',
    organizationId: 'org-task2226',
    actorId: 'actor-task2226',
    requestId: 'req-task2226',
    body: {
      idempotencyKey: 'idem-task2226',
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
      },
      approvalContext: {
        accepted: true,
      },
      customerPhone: 'unsafe customer phone',
      address: 'unsafe address',
      rawDraft: { value: 'unsafe raw draft' },
    },
  };
}

function planInput() {
  return {
    draftId: 'draft-plan-task2226',
    organizationId: 'org-plan-task2226',
    actorId: 'actor-plan-task2226',
    requestId: 'req-plan-task2226',
    body: {
      rawDraft: { value: 'unsafe raw draft' },
      providerPayload: 'unsafe provider payload',
    },
  };
}

function safeDraft(input = submitInput()) {
  return {
    ok: true,
    id: input.draftId,
    draftId: input.draftId,
    organizationId: input.organizationId,
    status: 'ready',
    summary: { title: 'safe draft task2226' },
    rawDraft: 'unsafe raw draft',
    customerPhone: 'unsafe customer phone',
  };
}

function safePlan() {
  return {
    status: 'planned',
    reasonCode: 'TASK2226_PLAN_READY',
    requiredActions: [],
    candidate: {
      sourceDraftId: 'draft-task2226',
      organizationId: 'org-task2226',
    },
    stack: 'unsafe stack trace',
  };
}

function safeCaseRef() {
  return {
    id: 'case-task2226',
    caseId: 'case-task2226',
    organizationId: 'org-task2226',
    sourceDraftId: 'draft-task2226',
    status: 'created',
    reasonCode: 'TASK2226_SUBMIT_READY',
    requiredActions: [],
    providerPayload: 'unsafe provider payload',
  };
}

function safeAuditEvent() {
  return {
    eventType: 'repair_intake_draft_to_case_submission',
    outcome: 'submitted',
    draftId: 'draft-task2226',
    organizationId: 'org-task2226',
    auditInternal: 'unsafe audit internal',
    token: 'unsafe token',
  };
}

function createPorts(overrides = {}, calls = []) {
  return {
    draftReader: {
      async getDraftForConversion(input) {
        calls.push({ method: 'draftReader', input });
        return safeDraft();
      },
      ...overrides.draftReader,
    },
    casePlanner: {
      async planCaseFromDraft(input) {
        calls.push({ method: 'casePlanner', input });
        return safePlan();
      },
      ...overrides.casePlanner,
    },
    caseCreator: {
      async createCaseFromDraft(input) {
        calls.push({ method: 'caseCreator', input });
        return safeCaseRef();
      },
      ...overrides.caseCreator,
    },
    auditWriter: {
      async recordDraftToCaseDecision(input) {
        calls.push({ method: 'auditWriter', input });
        return safeAuditEvent();
      },
      ...overrides.auditWriter,
    },
    idempotencyPort: overrides.idempotencyPort,
  };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'select *',
    'postgres://',
    'DATABASE_URL',
    'process.env',
    'unsafe token',
    'unsafe password',
    'unsafe secret',
    'unsafe stack trace',
    'unsafe provider payload',
    'unsafe customer phone',
    'unsafe address',
    'unsafe raw draft',
    'unsafe audit internal',
    'unsafe debug detail',
    'customerPhone',
    'address',
    'rawDraft',
    'providerPayload',
    'auditInternal',
    'stack',
    'token',
    'password',
    'secret',
    'rawPortOutput',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked unsafe marker ${marker}`);
  }
}

function unsafeError() {
  const error = new Error(UNSAFE_TEXT);
  error.stack = UNSAFE_TEXT;
  return error;
}

function assertGenericFailure(result, reasonCode) {
  assert.equal(result.ok, false);
  assert.equal(result.status, 'failed');
  assert.equal(result.submitted, false);
  assert.equal(result.reasonCode, reasonCode);
  assert.deepEqual(result.requiredActions, ['retry_or_manual_review']);
  assert.equal(result.plan, null);
  assert.equal(result.caseRef, null);
  assert.equal(result.auditEvent, null);
  assertNoUnsafeText(result);
}

test('success path remains unchanged and sanitized', async () => {
  const calls = [];
  const service = createRepairIntakeDraftToCaseApplicationService(createPorts({}, calls));
  const result = await service.submitDraftToCase(submitInput());

  assert.deepEqual(calls.map((call) => call.method), [
    'draftReader',
    'casePlanner',
    'caseCreator',
    'auditWriter',
  ]);
  assert.deepEqual(result, {
    ok: true,
    action: 'repair_intake_draft_to_case_submit',
    draftId: 'draft-task2226',
    organizationId: 'org-task2226',
    status: 'created',
    submitted: true,
    reasonCode: 'TASK2226_SUBMIT_READY',
    requiredActions: [],
    plan: {
      status: 'planned',
      reasonCode: 'TASK2226_PLAN_READY',
      requiredActions: [],
      candidate: {
        sourceDraftId: 'draft-task2226',
        organizationId: 'org-task2226',
      },
    },
    caseRef: {
      id: 'case-task2226',
      caseId: 'case-task2226',
      organizationId: 'org-task2226',
      sourceDraftId: 'draft-task2226',
      status: 'created',
      reasonCode: 'TASK2226_SUBMIT_READY',
      requiredActions: [],
    },
    auditEvent: {
      eventType: 'repair_intake_draft_to_case_submission',
      outcome: 'submitted',
      draftId: 'draft-task2226',
      organizationId: 'org-task2226',
    },
  });
  assertNoUnsafeText(calls);
  assertNoUnsafeText(result);
});

test('planDraftToCase normalizes thrown rejected and malformed injected port failures', async () => {
  const cases = [
    {
      name: 'draft reader throws',
      overrides: {
        draftReader: {
          async getDraftForConversion() {
            throw unsafeError();
          },
        },
      },
    },
    {
      name: 'draft reader rejects',
      overrides: {
        draftReader: {
          getDraftForConversion() {
            return Promise.reject(unsafeError());
          },
        },
      },
    },
    {
      name: 'draft reader null',
      overrides: {
        draftReader: {
          async getDraftForConversion() {
            return null;
          },
        },
      },
      draftFailure: true,
    },
    {
      name: 'case planner throws',
      overrides: {
        casePlanner: {
          async planCaseFromDraft() {
            throw unsafeError();
          },
        },
      },
    },
    {
      name: 'case planner malformed',
      overrides: {
        casePlanner: {
          async planCaseFromDraft() {
            return 'unsafe raw port output';
          },
        },
      },
    },
  ];

  for (const item of cases) {
    const service = createRepairIntakeDraftToCaseApplicationService(createPorts(item.overrides));
    const result = await service.planDraftToCase(planInput());

    if (item.draftFailure) {
      assert.equal(result.ok, false, item.name);
      assert.equal(
        result.reasonCode,
        'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_DRAFT_READ_FAILED',
      );
      assertNoUnsafeText(result);
    } else {
      assertGenericFailure(
        result,
        'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_PLAN_FAILED',
      );
    }
  }
});

test('submitDraftToCase normalizes thrown rejected and malformed injected port failures', async () => {
  const cases = [
    {
      name: 'draft reader throws',
      overrides: {
        draftReader: {
          async getDraftForConversion() {
            throw unsafeError();
          },
        },
      },
    },
    {
      name: 'draft reader malformed',
      overrides: {
        draftReader: {
          async getDraftForConversion() {
            return null;
          },
        },
      },
      draftFailure: true,
    },
    {
      name: 'case planner rejects',
      overrides: {
        casePlanner: {
          planCaseFromDraft() {
            return Promise.reject(unsafeError());
          },
        },
      },
    },
    {
      name: 'case planner malformed',
      overrides: {
        casePlanner: {
          async planCaseFromDraft() {
            return ['unsafe raw port output'];
          },
        },
      },
    },
    {
      name: 'case creator throws',
      overrides: {
        caseCreator: {
          async createCaseFromDraft() {
            throw unsafeError();
          },
        },
      },
    },
    {
      name: 'case creator malformed',
      overrides: {
        caseCreator: {
          async createCaseFromDraft() {
            return null;
          },
        },
      },
    },
    {
      name: 'audit writer throws',
      overrides: {
        auditWriter: {
          async recordDraftToCaseDecision() {
            throw unsafeError();
          },
        },
      },
    },
    {
      name: 'audit writer malformed',
      overrides: {
        auditWriter: {
          async recordDraftToCaseDecision() {
            return 'unsafe raw port output';
          },
        },
      },
    },
  ];

  for (const item of cases) {
    const service = createRepairIntakeDraftToCaseApplicationService(createPorts(item.overrides));
    const result = await service.submitDraftToCase(submitInput());

    if (item.draftFailure) {
      assert.equal(result.ok, false, item.name);
      assert.equal(
        result.reasonCode,
        'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_DRAFT_READ_FAILED',
      );
      assertNoUnsafeText(result);
    } else {
      assertGenericFailure(
        result,
        'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_SUBMIT_FAILED',
      );
    }
  }
});

test('idempotency port failures fail closed without leaking raw internals', async () => {
  const cases = [
    {
      name: 'idempotency find throws',
      idempotencyPort: {
        async findExistingDraftToCaseResult() {
          throw unsafeError();
        },
        async recordDraftToCaseResult() {
          return { ok: true };
        },
      },
    },
    {
      name: 'idempotency record rejects',
      idempotencyPort: {
        async findExistingDraftToCaseResult() {
          return null;
        },
        recordDraftToCaseResult() {
          return Promise.reject(unsafeError());
        },
      },
    },
  ];

  for (const item of cases) {
    const service = createRepairIntakeDraftToCaseApplicationService(createPorts({
      idempotencyPort: item.idempotencyPort,
    }));
    const result = await service.submitDraftToCase(submitInput());

    assertGenericFailure(
      result,
      'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_IDEMPOTENCY_FAILED',
    );
  }
});

test('input objects and injected port result objects are not mutated', async () => {
  const input = submitInput();
  const draft = safeDraft(input);
  const plan = safePlan();
  const caseRef = safeCaseRef();
  const auditEvent = safeAuditEvent();
  const before = {
    input: JSON.parse(JSON.stringify(input)),
    draft: JSON.parse(JSON.stringify(draft)),
    plan: JSON.parse(JSON.stringify(plan)),
    caseRef: JSON.parse(JSON.stringify(caseRef)),
    auditEvent: JSON.parse(JSON.stringify(auditEvent)),
  };
  const service = createRepairIntakeDraftToCaseApplicationService(createPorts({
    draftReader: {
      async getDraftForConversion() {
        return draft;
      },
    },
    casePlanner: {
      async planCaseFromDraft() {
        return plan;
      },
    },
    caseCreator: {
      async createCaseFromDraft() {
        return caseRef;
      },
    },
    auditWriter: {
      async recordDraftToCaseDecision() {
        return auditEvent;
      },
    },
  }));

  const result = await service.submitDraftToCase(input);

  assert.equal(result.ok, true);
  assert.deepEqual(input, before.input);
  assert.deepEqual(draft, before.draft);
  assert.deepEqual(plan, before.plan);
  assert.deepEqual(caseRef, before.caseRef);
  assert.deepEqual(auditEvent, before.auditEvent);
  assertNoUnsafeText(result);
});
