'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  RepairIntakeCasePlannerPortAdapterError,
  createRepairIntakeCasePlannerPortAdapter,
} = require('../../src/repairIntake/repairIntakeCasePlannerPortAdapter');

const UNSAFE_ERROR_MESSAGE = [
  'SQL select * from unsafe_case_planner_table',
  'DATABASE_URL=postgres://unsafe-case-planner',
  'phone +886900001029',
  'address unsafe planner address',
  'customer unsafe planner name',
  'lineUserId unsafe_planner_line',
  'LINE access token unsafe_planner_line_token',
  'finalAppointmentId unsafe_planner_final',
  'stack trace at unsafe planner',
].join(' ');

function unsafePlanningInput() {
  return {
    draftId: 'draft_task1029_top',
    organizationId: 'org_task1029_top',
    tenantId: 'tenant_task1029_top',
    requestId: 'req_task1029_top',
    actor: {
      actorId: 'actor_task1029',
      token: 'unsafe actor token',
    },
    metadata: {
      source: 'integration_test',
      sql: 'select * from unsafe_metadata',
    },
    warnings: ['needs_review'],
    draft: {
      id: 'draft_task1029',
      organizationId: 'org_task1029',
      tenantId: 'tenant_task1029',
      status: 'ready',
      source: 'repair_intake',
      sourceRef: 'source_task1029',
      intakeSource: 'manual',
      reasonCode: 'DRAFT_READY_TASK1029',
      requiredActions: [],
      summary: {
        title: 'safe draft summary',
        phone: '+886900001029',
      },
      rawRows: [{ phone: '+886900001029' }],
      phone: '+886900001029',
      address: 'unsafe planner address',
      customerName: 'unsafe planner customer',
      lineUserId: 'unsafe_planner_line',
      finalAppointmentId: 'unsafe_planner_final',
      sql: 'select * from unsafe_draft',
      stack: 'unsafe draft stack',
    },
    rawInput: {
      db: 'unsafe raw input',
    },
    headers: {
      authorization: 'Bearer unsafe',
    },
  };
}

function createPlanningPolicy(calls, options = {}) {
  return {
    planCaseFromDraft: async (planningInput) => {
      calls.push(planningInput);

      if (options.throwPlan) {
        throw new Error(UNSAFE_ERROR_MESSAGE);
      }

      if (options.rejectPlan) {
        return Promise.reject(new Error(UNSAFE_ERROR_MESSAGE));
      }

      if (options.invalidResult) {
        return null;
      }

      return {
        status: 'planned',
        reasonCode: 'PLAN_READY_TASK1029',
        requiredActions: [],
        candidate: {
          sourceDraftId: 'draft_task1029',
          organizationId: 'org_task1029',
          tenantId: 'tenant_task1029',
          customerPhone: '+886900001029',
        },
        metadata: {
          plannedBy: 'synthetic_policy',
          token: 'unsafe metadata token',
        },
        warnings: ['safe_warning'],
        rawRows: [{ unsafe: true }],
        finalAppointmentId: 'unsafe_planner_final',
        stack: 'unsafe planner stack',
      };
    },
  };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'select *',
    'unsafe_case_planner_table',
    'unsafe_metadata',
    'unsafe_draft',
    'DATABASE_URL',
    'postgres://',
    '+886900001029',
    'unsafe planner address',
    'unsafe planner customer',
    'unsafe planner name',
    'unsafe_planner_line',
    'unsafe_planner_line_token',
    'LINE access token',
    'unsafe_planner_final',
    'unsafe actor token',
    'unsafe raw input',
    'unsafe draft stack',
    'unsafe planner stack',
    'unsafe metadata token',
    'stack trace',
    'Bearer unsafe',
    'rawRows',
    'rawInput',
    'authorization',
    'phone',
    'address',
    'customerName',
    'customerPhone',
    'lineUserId',
    'lineAccessToken',
    'finalAppointmentId',
    'sql',
    'stack',
    'token',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('factory accepts no planningPolicy and uses deterministic default planner', async () => {
  const adapter = createRepairIntakeCasePlannerPortAdapter();

  const result = await adapter.planCaseFromDraft(unsafePlanningInput());

  assert.equal(result.ok, true);
  assert.equal(result.status, 'planned');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_CASE_PLANNER_PORT_ADAPTER_PLAN_READY');
  assert.equal(result.candidate.sourceDraftId, 'draft_task1029_top');
  assert.equal(result.candidate.organizationId, 'org_task1029_top');
  assert.equal(result.candidate.tenantId, 'tenant_task1029_top');
  assert.equal(result.draft.id, 'draft_task1029');
  assert.equal(result.draft.summary.title, 'safe draft summary');
  assertNoUnsafeText(result);
});

test('factory rejects invalid planningPolicy shapes with sanitized configuration error', () => {
  for (const planningPolicy of [
    null,
    {},
    { planCaseFromDraft: 'not-a-function' },
  ]) {
    assert.throws(
      () => createRepairIntakeCasePlannerPortAdapter({ planningPolicy }),
      (error) => {
        assert.equal(error instanceof RepairIntakeCasePlannerPortAdapterError, true);
        assert.equal(
          error.reasonCode,
          'REPAIR_INTAKE_CASE_PLANNER_PORT_ADAPTER_POLICY_REQUIRED',
        );
        assert.deepEqual(error.requiredActions, ['configure_planning_policy_plan_case_from_draft']);
        assertNoUnsafeText(error);
        return true;
      },
    );
  }
});

test('injected planningPolicy receives only sanitized planning context and returns sanitized plan', async () => {
  const calls = [];
  const adapter = createRepairIntakeCasePlannerPortAdapter({
    planningPolicy: createPlanningPolicy(calls),
  });

  const result = await adapter.planCaseFromDraft(unsafePlanningInput());

  assert.equal(calls.length, 1);
  assert.equal(calls[0].draftId, 'draft_task1029_top');
  assert.equal(calls[0].organizationId, 'org_task1029_top');
  assert.equal(calls[0].tenantId, 'tenant_task1029_top');
  assert.equal(calls[0].requestId, 'req_task1029_top');
  assert.equal(calls[0].actor.actorId, 'actor_task1029');
  assert.equal(calls[0].metadata.source, 'integration_test');
  assert.deepEqual(calls[0].warnings, ['needs_review']);
  assert.equal(calls[0].draft.id, 'draft_task1029');
  assert.equal(calls[0].draft.summary.title, 'safe draft summary');
  assert.equal(result.ok, true);
  assert.equal(result.reasonCode, 'PLAN_READY_TASK1029');
  assert.equal(result.candidate.sourceDraftId, 'draft_task1029');
  assert.deepEqual(result.warnings, ['safe_warning']);
  assertNoUnsafeText(calls);
  assertNoUnsafeText(result);
});

test('invalid input fails closed before planningPolicy call', async () => {
  for (const invalidInput of [undefined, null, 'input', 42, true, [], () => {}, {}, { draft: null }]) {
    const calls = [];
    const adapter = createRepairIntakeCasePlannerPortAdapter({
      planningPolicy: createPlanningPolicy(calls),
    });

    const result = await adapter.planCaseFromDraft(invalidInput);

    assert.equal(result.ok, false);
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_CASE_PLANNER_PORT_ADAPTER_INPUT_INVALID');
    assert.deepEqual(calls, []);
    assertNoUnsafeText(result);
  }
});

test('planningPolicy thrown errors and rejections return sanitized plan failure envelopes', async () => {
  for (const options of [{ throwPlan: true }, { rejectPlan: true }, { invalidResult: true }]) {
    const calls = [];
    const adapter = createRepairIntakeCasePlannerPortAdapter({
      planningPolicy: createPlanningPolicy(calls, options),
    });

    const result = await adapter.planCaseFromDraft(unsafePlanningInput());

    assert.equal(calls.length, 1);
    assert.equal(result.ok, false);
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_CASE_PLANNER_PORT_ADAPTER_PLAN_FAILED');
    assertNoUnsafeText(calls);
    assertNoUnsafeText(result);
  }
});
