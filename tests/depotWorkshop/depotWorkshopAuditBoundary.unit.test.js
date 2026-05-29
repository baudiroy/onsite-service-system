'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DEPOT_WORKSHOP_AUDIT_BOUNDARY_KIND,
  buildDepotWorkshopAuditEvent,
  createDepotWorkshopAuditBoundary,
} = require('../../src/depotWorkshop/depotWorkshopAuditBoundary');

const ORG_ID = 'org_task_1915';
const ACTOR_ID = 'actor_task_1915';
const DEPOT_INTAKE_ID = 'depot_intake_task_1915';
const DEPOT_REPAIR_ID = 'depot_repair_task_1915';
const CASE_ID = 'case_task_1915';
const BRAND_ID = 'brand_task_1915';
const SERVICE_PROVIDER_ID = 'service_provider_task_1915';
const SUBCONTRACTOR_ID = 'subcontractor_task_1915';
const REQUEST_ID = 'req_task_1915';
const NOW = '2026-05-29T12:00:00.000Z';

function auditInput(overrides = {}) {
  return {
    actionType: 'depot.status.transition.allowed',
    organizationId: ORG_ID,
    depotIntakeId: DEPOT_INTAKE_ID,
    depotRepairId: DEPOT_REPAIR_ID,
    caseId: CASE_ID,
    brandId: BRAND_ID,
    serviceProviderId: SERVICE_PROVIDER_ID,
    subcontractorId: SUBCONTRACTOR_ID,
    actorId: ACTOR_ID,
    requestId: REQUEST_ID,
    depotStatus: 'diagnosis_pending',
    assignmentStatus: 'prepared',
    accessDecision: 'allowed',
    permissionDecision: 'allowed',
    routeDecision: 'prepared',
    dataProfile: 'depot_internal',
    occurredAt: NOW,
    ...overrides,
  };
}

function assertFailure(result, reasonCode) {
  assert.equal(result.ok, false);
  assert.equal(result.auditRecorded, false);
  assert.equal(result.boundaryKind, DEPOT_WORKSHOP_AUDIT_BOUNDARY_KIND);
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
    'completion report should not leak',
    'field service report should not leak',
    'final appointment should not leak',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('builds sanitized internal-only depot workshop audit event', () => {
  const result = buildDepotWorkshopAuditEvent(auditInput());

  assert.equal(result.ok, true);
  assert.equal(result.auditRecorded, true);
  assert.equal(result.boundaryKind, DEPOT_WORKSHOP_AUDIT_BOUNDARY_KIND);
  assert.equal(result.reasonCode, 'depot_workshop_audit_recorded');
  assert.deepEqual(result.auditEvent, {
    eventKind: 'depot_workshop.audit_event',
    action: 'depot.status.transition.allowed',
    entityType: 'depot_workshop',
    entityId: DEPOT_REPAIR_ID,
    actorType: 'internal',
    actorId: ACTOR_ID,
    organizationId: ORG_ID,
    internalOnly: true,
    customerVisible: false,
    metadata: {
      actionType: 'depot.status.transition.allowed',
      organizationId: ORG_ID,
      depotIntakeId: DEPOT_INTAKE_ID,
      depotRepairId: DEPOT_REPAIR_ID,
      caseId: CASE_ID,
      brandId: BRAND_ID,
      serviceProviderId: SERVICE_PROVIDER_ID,
      subcontractorId: SUBCONTRACTOR_ID,
      actorId: ACTOR_ID,
      requestId: REQUEST_ID,
      depotStatus: 'diagnosis_pending',
      assignmentStatus: 'prepared',
      accessDecision: 'allowed',
      permissionDecision: 'allowed',
      routeDecision: 'prepared',
      dataProfile: 'depot_internal',
      occurredAt: NOW,
    },
  });
  assertNoUnsafeLeak(result);
});

test('records audit event through injected synthetic writer', async () => {
  const writes = [];
  const boundary = createDepotWorkshopAuditBoundary({
    auditWriter: async (event) => {
      writes.push(event);
    },
  });

  const result = await boundary.record(auditInput());

  assert.equal(boundary.kind, DEPOT_WORKSHOP_AUDIT_BOUNDARY_KIND);
  assert.equal(result.ok, true);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].action, 'depot.status.transition.allowed');
  assert.equal(writes[0].internalOnly, true);
  assert.equal(writes[0].customerVisible, false);
  assertNoUnsafeLeak(writes[0]);
});

test('denied access audit metadata is supported and remains internal-only', () => {
  const result = buildDepotWorkshopAuditEvent(auditInput({
    actionType: 'depot.access.denied',
    accessDecision: 'denied',
    permissionDecision: 'denied',
    routeDecision: 'access_denied',
    dataProfile: 'subcontractor_minimized',
  }));

  assert.equal(result.ok, true);
  assert.equal(result.auditEvent.customerVisible, false);
  assert.equal(result.auditEvent.metadata.accessDecision, 'denied');
  assert.equal(result.auditEvent.metadata.permissionDecision, 'denied');
  assert.equal(result.auditEvent.metadata.routeDecision, 'access_denied');
  assert.equal(result.auditEvent.metadata.dataProfile, 'subcontractor_minimized');
  assertNoUnsafeLeak(result);
});

test('audit writer failure is sanitized', async () => {
  const boundary = createDepotWorkshopAuditBoundary({
    auditWriter: async () => {
      throw new Error('raw writer failure should not leak token secret');
    },
  });

  const result = await boundary.record(auditInput());

  assertFailure(result, 'depot_workshop_audit_writer_failed');
  assertNoUnsafeLeak(result);
});

test('forbidden fields fail closed before writer and are never customer-visible', async () => {
  const writes = [];
  const boundary = createDepotWorkshopAuditBoundary({
    auditWriter: async (event) => {
      writes.push(event);
    },
  });
  const result = await boundary.record(auditInput({
    rawDbRow: 'raw db row should not leak',
    rawCustomerData: 'raw customer data should not leak',
    rawPhone: 'raw phone should not leak',
    rawAddress: 'raw address should not leak',
    providerPayload: 'raw provider payload should not leak',
    completionReport: 'completion report should not leak',
    fieldServiceReport: 'field service report should not leak',
    finalAppointmentId: 'final appointment should not leak',
    customerVisibleReportBody: 'customer visible report should not leak',
  }));

  assertFailure(result, 'audit_payload_forbidden_fields');
  assert.equal(writes.length, 0);
  assertNoUnsafeLeak(result);
});

test('missing writer and required metadata fail safely', async () => {
  const boundary = createDepotWorkshopAuditBoundary({});

  assertFailure(await boundary.record(auditInput()), 'audit_writer_required');
  assertFailure(buildDepotWorkshopAuditEvent(auditInput({ actionType: undefined })), 'audit_action_required');
  assertFailure(buildDepotWorkshopAuditEvent(auditInput({ organizationId: undefined })), 'organization_id_required');
  assertFailure(buildDepotWorkshopAuditEvent(auditInput({ actorId: undefined })), 'audit_actor_required');
});
