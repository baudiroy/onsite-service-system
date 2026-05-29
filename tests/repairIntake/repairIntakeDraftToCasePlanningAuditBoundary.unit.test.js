'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ACTION,
  EVENT_TYPE,
  buildRepairIntakeDraftToCasePlanningAuditEvent,
  createRepairIntakeDraftToCasePlanningAuditBoundary,
} = require('../../src/repairIntake/repairIntakeDraftToCasePlanningAuditBoundary');

function planResult(overrides = {}) {
  return {
    ok: true,
    action: 'repair_intake_draft_to_case_plan',
    draftId: 'draft_task1895',
    organizationId: 'org_task1895',
    eligible: true,
    status: 'eligible',
    reasonCode: 'candidate_ready',
    requiredActions: [],
    caseCreationAllowed: true,
    candidateReady: true,
    caseCandidate: {
      sourceDraftId: 'draft_task1895',
      organizationId: 'org_task1895',
      phone: 'unsafe phone',
      address: 'unsafe address',
    },
    rawRows: [{ phone: 'unsafe phone' }],
    providerPayload: 'unsafe provider payload',
    token: 'unsafe token',
    secret: 'unsafe secret',
    sql: 'select * from unsafe_table',
    stack: 'unsafe stack trace',
    ...overrides,
  };
}

function auditInput(overrides = {}) {
  return {
    draftId: 'draft_task1895',
    organizationId: 'org_task1895',
    actorId: 'actor_task1895',
    requestId: 'request_task1895',
    sourceBoundary: 'repair_intake_draft_case_planning_service',
    occurredAt: '2026-05-29T01:05:00.000Z',
    planResult: planResult(),
    ...overrides,
  };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'unsafe phone',
    'unsafe address',
    'unsafe provider payload',
    'unsafe token',
    'unsafe secret',
    'select *',
    'unsafe_table',
    'unsafe stack trace',
    'rawRows',
    'providerPayload',
    'token',
    'secret',
    'sql',
    'stack',
    'caseCandidate',
    'caseId',
    'caseRef',
    'finalAppointmentId',
    'DATABASE_URL',
    'JWT_SECRET',
    'LINE_CHANNEL_ACCESS_TOKEN',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('builds internal-only planning audit event with safe metadata only', () => {
  const result = buildRepairIntakeDraftToCasePlanningAuditEvent(auditInput());

  assert.deepEqual(result, {
    ok: true,
    status: 'audit_event_built',
    recorded: false,
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PLANNING_AUDIT_EVENT_BUILT',
    requiredActions: [],
    auditEvent: {
      eventType: EVENT_TYPE,
      action: ACTION,
      visibility: 'internal_only',
      draftId: 'draft_task1895',
      organizationId: 'org_task1895',
      actorId: 'actor_task1895',
      requestId: 'request_task1895',
      sourceBoundary: 'repair_intake_draft_case_planning_service',
      decisionStatus: 'planned',
      planningStatus: 'eligible',
      reasonCode: 'candidate_ready',
      requiredActions: [],
      eligible: true,
      caseCreationAllowed: true,
      candidateReady: true,
      occurredAt: '2026-05-29T01:05:00.000Z',
    },
  });
  assertNoUnsafeText(result);
});

test('supports review-required and blocked decision metadata without creating Case data', () => {
  const review = buildRepairIntakeDraftToCasePlanningAuditEvent(auditInput({
    planResult: planResult({
      ok: false,
      eligible: false,
      status: 'needs_review',
      reasonCode: 'duplicate_unresolved',
      requiredActions: ['resolve_duplicate_review'],
      caseCreationAllowed: false,
      candidateReady: false,
      caseCandidate: null,
    }),
  }));
  const blocked = buildRepairIntakeDraftToCasePlanningAuditEvent(auditInput({
    planResult: planResult({
      ok: false,
      eligible: false,
      status: 'blocked',
      reasonCode: 'duplicate_confirmed',
      requiredActions: ['link_or_close_duplicate_draft'],
      caseCreationAllowed: false,
      candidateReady: false,
      caseCandidate: null,
    }),
  }));

  assert.equal(review.auditEvent.decisionStatus, 'review_required');
  assert.equal(review.auditEvent.duplicateDecisionStatus, 'review_required');
  assert.deepEqual(review.auditEvent.requiredActions, ['resolve_duplicate_review']);
  assert.equal(blocked.auditEvent.decisionStatus, 'blocked');
  assert.equal(blocked.auditEvent.duplicateDecisionStatus, 'blocked');
  assert.deepEqual(blocked.auditEvent.requiredActions, ['link_or_close_duplicate_draft']);
  assertNoUnsafeText(review);
  assertNoUnsafeText(blocked);
});

test('records planning audit with injected synthetic writer only', async () => {
  const calls = [];
  const boundary = createRepairIntakeDraftToCasePlanningAuditBoundary({
    auditWriter: {
      async recordPlanningDecision(payload) {
        calls.push(payload);

        return {
          ok: true,
          reasonCode: 'SYNTHETIC_PLANNING_AUDIT_RECORDED',
          rawRows: [{ phone: 'unsafe phone' }],
          sql: 'select * from unsafe_table',
          token: 'unsafe token',
        };
      },
    },
  });

  const result = await boundary.recordPlanningDecision(auditInput());

  assert.equal(calls.length, 1);
  assert.equal(calls[0].auditEvent.eventType, EVENT_TYPE);
  assert.equal(calls[0].auditEvent.visibility, 'internal_only');
  assert.equal(result.ok, true);
  assert.equal(result.recorded, true);
  assert.equal(result.reasonCode, 'SYNTHETIC_PLANNING_AUDIT_RECORDED');
  assertNoUnsafeText(calls);
  assertNoUnsafeText(result);
});

test('audit writer failure is sanitized and does not expose raw errors', async () => {
  const boundary = createRepairIntakeDraftToCasePlanningAuditBoundary({
    auditWriter: async () => {
      throw new Error('unsafe phone unsafe address select * unsafe token unsafe secret stack trace');
    },
  });

  const result = await boundary.recordPlanningDecision(auditInput());

  assert.equal(result.ok, false);
  assert.equal(result.recorded, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_PLANNING_AUDIT_WRITE_FAILED');
  assert.equal(result.auditEvent, null);
  assertNoUnsafeText(result);
});

test('custom audit event builder output is normalized before writer receives it', async () => {
  const calls = [];
  const boundary = createRepairIntakeDraftToCasePlanningAuditBoundary({
    auditEventBuilder: () => ({
      ok: true,
      auditEvent: {
        eventType: EVENT_TYPE,
        action: ACTION,
        visibility: 'public',
        draftId: 'draft_task1895',
        organizationId: 'org_task1895',
        actorId: 'actor_task1895',
        requestId: 'request_task1895',
        decisionStatus: 'planned',
        planningStatus: 'eligible',
        reasonCode: 'candidate_ready',
        requiredActions: [],
        eligible: true,
        caseCreationAllowed: true,
        candidateReady: true,
        caseCandidate: { phone: 'unsafe phone' },
        caseId: 'case_should_not_exist',
        rawRows: [{ phone: 'unsafe phone' }],
        providerPayload: 'unsafe provider payload',
        token: 'unsafe token',
        secret: 'unsafe secret',
        sql: 'select * from unsafe_table',
        stack: 'unsafe stack trace',
      },
    }),
    auditWriter: async (payload) => {
      calls.push(payload);

      return { ok: true };
    },
  });

  const result = await boundary.recordPlanningDecision(auditInput());

  assert.equal(result.ok, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].auditEvent.visibility, 'internal_only');
  assert.equal(Object.prototype.hasOwnProperty.call(calls[0].auditEvent, 'caseCandidate'), false);
  assertNoUnsafeText(calls);
  assertNoUnsafeText(result);
});

test('invalid audit context fails before writer call', async () => {
  const calls = [];
  const boundary = createRepairIntakeDraftToCasePlanningAuditBoundary({
    auditWriter: async (payload) => {
      calls.push(payload);
      return { ok: true };
    },
  });

  const result = await boundary.recordPlanningDecision({
    organizationId: 'org_task1895',
    planResult: planResult({ draftId: '' }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_PLANNING_AUDIT_DRAFT_REQUIRED');
  assert.deepEqual(calls, []);
  assertNoUnsafeText(result);
});

test('boundary without writer fails safely without DB or global runtime dependencies', async () => {
  const boundary = createRepairIntakeDraftToCasePlanningAuditBoundary();

  const result = await boundary.recordPlanningDecision(auditInput());

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_PLANNING_AUDIT_WRITER_REQUIRED');
  assert.deepEqual(result.requiredActions, ['configure_planning_audit_writer']);
  assertNoUnsafeText(result);
});
