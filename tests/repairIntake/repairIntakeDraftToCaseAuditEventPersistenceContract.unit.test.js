'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftCaseAuditWriterAdapter,
} = require('../../src/repairIntake/repairIntakeDraftCaseAuditWriterAdapter');

function auditEvent(overrides = {}) {
  return {
    eventType: 'repair_intake_draft_to_case_submission',
    outcome: 'submitted',
    decision: 'submitted',
    draftId: 'draft_task2331_001',
    organizationId: 'org_task2331',
    tenantId: 'tenant_task2331',
    actorId: 'actor_task2331',
    actorType: 'admin_user',
    requestId: 'request_task2331',
    idempotencyKey: 'idem_task2331',
    source: 'repair_intake_admin',
    caseRef: {
      id: 'case_task2331_001',
      ref: 'case_ref_task2331_001',
    },
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_SUBMITTED',
    requiredActions: ['review_audit_trace'],
    ...overrides,
  };
}

function createAdapter(calls, client = {}) {
  return createRepairIntakeDraftCaseAuditWriterAdapter({
    dbClient: {
      insert: async (tableName, payload) => {
        calls.push({ method: 'insert', tableName, payload });
        return { ok: true };
      },
      ...client,
    },
    idGenerator: () => 'audit_task2331_001',
    clock: () => '2026-05-31T00:00:00.000Z',
  });
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'select *',
    'drop table',
    'postgres://',
    'DATABASE_URL',
    'stack trace',
    'providerPayload',
    'token',
    'password',
    'secret',
    'phone',
    'address',
    'customerPayload',
    'lineAccessToken',
    'finalAppointmentId',
    'field_service_reports',
    'openai',
    'vector',
    'billing',
    'settlement',
    'invoice',
    'payment',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('submitted audit event contract aligns to repair_intake_audit_events table shape', async () => {
  const calls = [];
  const adapter = createAdapter(calls);

  const result = await adapter.recordRepairIntakeDraftToCaseCreated({ auditEvent: auditEvent() });

  assert.deepEqual(result, {
    ok: true,
    auditEventId: 'audit_task2331_001',
    eventType: 'repair_intake_draft_to_case_submission',
    organizationId: 'org_task2331',
    subjectId: 'draft_task2331_001',
    status: 'recorded',
    reasonCode: 'REPAIR_INTAKE_DRAFT_CASE_AUDIT_RECORDED',
    requiredActions: [],
  });

  assert.deepEqual(calls, [{
    method: 'insert',
    tableName: 'repair_intake_audit_events',
    payload: {
      id: 'audit_task2331_001',
      event_type: 'repair_intake_draft_to_case_submission',
      organization_id: 'org_task2331',
      tenant_id: 'tenant_task2331',
      draft_id: 'draft_task2331_001',
      case_id: 'case_task2331_001',
      case_ref: 'case_ref_task2331_001',
      actor_id: 'actor_task2331',
      actor_type: 'admin_user',
      request_id: 'request_task2331',
      decision: 'submitted',
      outcome: 'submitted',
      reason_code: 'REPAIR_INTAKE_DRAFT_TO_CASE_SUBMITTED',
      safe_metadata: {
        source: 'repair_intake_admin',
        idempotencyKey: 'idem_task2331',
        requiredActions: ['review_audit_trace'],
      },
      visibility: 'internal_only',
      occurred_at: '2026-05-31T00:00:00.000Z',
    },
  }]);

  assert.equal(Object.hasOwn(calls[0].payload, 'subject_type'), false);
  assert.equal(Object.hasOwn(calls[0].payload, 'subject_id'), false);
  assert.equal(Object.hasOwn(calls[0].payload, 'related_case_id'), false);
  assert.equal(Object.hasOwn(calls[0].payload, 'required_actions'), false);
});

test('permission denied event is allowed as a safe contract marker without case fields', async () => {
  const calls = [];
  const adapter = createAdapter(calls);

  const result = await adapter.record({
    auditEvent: auditEvent({
      eventType: 'repair_intake_draft_to_case_permission_denied',
      outcome: 'blocked',
      decision: 'permission_denied',
      caseRef: null,
      reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PERMISSION_DENIED',
      requiredActions: ['check_permission'],
    }),
  });

  assert.equal(result.ok, true);
  assert.equal(result.eventType, 'repair_intake_draft_to_case_permission_denied');
  assert.equal(calls[0].payload.case_id, null);
  assert.equal(calls[0].payload.case_ref, null);
  assert.equal(calls[0].payload.decision, 'permission_denied');
  assert.equal(calls[0].payload.outcome, 'blocked');
});

test('unsafe optional audit values are stripped while trusted required scope is preserved', async () => {
  const calls = [];
  const adapter = createAdapter(calls);
  const input = {
    auditEvent: auditEvent({
      requestId: "request_task2331'; select * from field_service_reports; --",
      caseRef: {
        id: 'case_task2331_providerPayload_token_secret_phone_address',
        ref: 'case_ref_task2331_stack trace',
      },
      reasonCode: 'REPAIR_INTAKE_token_secret',
      idempotencyKey: 'idem_task2331_drop table audit_events',
      source: 'openai vector billing',
      requiredActions: ['retry_or_manual_review', 'providerPayload token'],
    }),
  };
  const snapshot = JSON.stringify(input);

  const result = await adapter.recordRepairIntakeDraftToCaseCreated(input);

  assert.equal(result.ok, true);
  assert.equal(JSON.stringify(input), snapshot);
  assert.equal(calls[0].payload.organization_id, 'org_task2331');
  assert.equal(calls[0].payload.tenant_id, 'tenant_task2331');
  assert.equal(calls[0].payload.draft_id, 'draft_task2331_001');
  assert.equal(calls[0].payload.request_id, null);
  assert.equal(calls[0].payload.case_id, null);
  assert.equal(calls[0].payload.case_ref, null);
  assert.equal(calls[0].payload.reason_code, null);
  assert.deepEqual(calls[0].payload.safe_metadata, {
    requiredActions: ['retry_or_manual_review'],
  });
  assertNoUnsafeText(calls[0]);
  assertNoUnsafeText(result);
});

test('malformed event contract fails closed before DB write', async () => {
  for (const event of [
    auditEvent({ eventType: 'repair_intake_unknown_event' }),
    auditEvent({ outcome: 'unsafe_outcome' }),
    auditEvent({ organizationId: '' }),
    auditEvent({ draftId: '' }),
    auditEvent({ actorId: '' }),
  ]) {
    const calls = [];
    const adapter = createAdapter(calls);
    const result = await adapter.recordRepairIntakeDraftToCaseCreated({ auditEvent: event });

    assert.equal(result.ok, false);
    assert.equal(result.status, 'blocked');
    assert.equal(calls.length, 0);
    assertNoUnsafeText(result);
  }
});
