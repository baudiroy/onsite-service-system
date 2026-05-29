'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ADMIN_DISPATCH_AUDIT_BOUNDARY_KIND,
  buildAdminDispatchAuditEvent,
  createAdminDispatchAuditBoundary,
} = require('../../src/guards/AdminDispatchAuditBoundary');

const ASSIGNMENT_ID = '11111111-1111-4111-8111-111111111111';
const APPOINTMENT_ID = '22222222-2222-4222-8222-222222222222';
const CASE_ID = '33333333-3333-4333-8333-333333333333';
const ORG_ID = '44444444-4444-4444-8444-444444444444';
const ACTOR_ID = '66666666-6666-4666-8666-666666666666';
const REQUEST_ID = 'req_task_1904';
const NOW = '2026-05-29T08:30:00.000Z';

function auditInput(overrides = {}) {
  return {
    actionType: 'dispatch.assignment_intent.accepted',
    organizationId: ORG_ID,
    assignmentId: ASSIGNMENT_ID,
    appointmentId: APPOINTMENT_ID,
    caseId: CASE_ID,
    adminActorId: ACTOR_ID,
    requestId: REQUEST_ID,
    permissionDecision: 'allowed',
    assignmentIntentStatus: 'assigned',
    occurredAt: NOW,
    ...overrides,
  };
}

function assertFailure(result, reasonCode) {
  assert.equal(result.ok, false);
  assert.equal(result.auditRecorded, false);
  assert.equal(result.boundaryKind, ADMIN_DISPATCH_AUDIT_BOUNDARY_KIND);
  assert.equal(result.reasonCode, reasonCode);
}

function assertNoUnsafeLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'raw db row should not leak',
    'raw customer data should not leak',
    'raw phone should not leak',
    'raw address should not leak',
    'raw provider payload should not leak',
    'raw writer failure should not leak',
    'DATABASE_URL',
    'JWT_SECRET',
    'postgres' + '://',
    'stack',
    'sql',
    'token',
    'secret',
    'billing internals should not leak',
    'AI provider output should not leak',
    'customer visible report should not leak',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('builds sanitized internal-only audit event for assignment allow path', () => {
  const result = buildAdminDispatchAuditEvent(auditInput());

  assert.equal(result.ok, true);
  assert.equal(result.auditRecorded, true);
  assert.equal(result.boundaryKind, ADMIN_DISPATCH_AUDIT_BOUNDARY_KIND);
  assert.equal(result.reasonCode, 'admin_dispatch_audit_recorded');
  assert.deepEqual(result.auditEvent, {
    eventKind: 'admin_dispatch.operations_audit_event',
    action: 'dispatch.assignment_intent.accepted',
    entityType: 'dispatch_assignment',
    entityId: ASSIGNMENT_ID,
    actorType: 'admin',
    actorId: ACTOR_ID,
    organizationId: ORG_ID,
    internalOnly: true,
    customerVisible: false,
    metadata: {
      actionType: 'dispatch.assignment_intent.accepted',
      organizationId: ORG_ID,
      assignmentId: ASSIGNMENT_ID,
      appointmentId: APPOINTMENT_ID,
      caseId: CASE_ID,
      adminActorId: ACTOR_ID,
      requestId: REQUEST_ID,
      permissionDecision: 'allowed',
      assignmentIntentStatus: 'assigned',
      occurredAt: NOW,
    },
  });
  assertNoUnsafeLeak(result);
});

test('records audit event through injected synthetic writer', async () => {
  const writes = [];
  const boundary = createAdminDispatchAuditBoundary({
    auditWriter: async (event) => {
      writes.push(event);
    },
  });

  const result = await boundary.record(auditInput());

  assert.equal(boundary.kind, ADMIN_DISPATCH_AUDIT_BOUNDARY_KIND);
  assert.equal(result.ok, true);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].action, 'dispatch.assignment_intent.accepted');
  assert.equal(writes[0].customerVisible, false);
  assertNoUnsafeLeak(writes[0]);
});

test('denied permission metadata is supported and remains internal-only', () => {
  const result = buildAdminDispatchAuditEvent(auditInput({
    actionType: 'dispatch.assignment_intent.denied',
    permissionDecision: 'denied',
    assignmentIntentStatus: 'denied',
  }));

  assert.equal(result.ok, true);
  assert.equal(result.auditEvent.customerVisible, false);
  assert.equal(result.auditEvent.metadata.permissionDecision, 'denied');
  assert.equal(result.auditEvent.metadata.assignmentIntentStatus, 'denied');
  assertNoUnsafeLeak(result);
});

test('audit writer failure is sanitized', async () => {
  const boundary = createAdminDispatchAuditBoundary({
    auditWriter: async () => {
      throw new Error('raw writer failure should not leak token secret');
    },
  });

  const result = await boundary.record(auditInput());

  assertFailure(result, 'admin_dispatch_audit_writer_failed');
  assertNoUnsafeLeak(result);
});

test('forbidden fields are excluded by failing closed', async () => {
  const boundary = createAdminDispatchAuditBoundary({
    auditWriter: async () => {
      throw new Error('writer should not be called');
    },
  });
  const result = await boundary.record(auditInput({
    rawDbRow: 'raw db row should not leak',
    rawCustomerData: 'raw customer data should not leak',
    rawPhone: 'raw phone should not leak',
    rawAddress: 'raw address should not leak',
    providerPayload: 'raw provider payload should not leak',
  }));

  assertFailure(result, 'audit_payload_forbidden_fields');
  assertNoUnsafeLeak(result);
});

test('missing writer and required metadata fail safely', async () => {
  const boundary = createAdminDispatchAuditBoundary({});

  assertFailure(await boundary.record(auditInput()), 'audit_writer_required');
  assertFailure(buildAdminDispatchAuditEvent(auditInput({ actionType: undefined })), 'audit_action_required');
  assertFailure(buildAdminDispatchAuditEvent(auditInput({ organizationId: undefined })), 'organization_id_required');
  assertFailure(buildAdminDispatchAuditEvent(auditInput({ adminActorId: undefined, actorId: undefined })), 'admin_actor_required');
});
