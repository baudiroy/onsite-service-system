'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DEPOT_WORKSHOP_REPAIR_ORDER_AUDIT_EVENT_TYPES,
  buildDepotWorkshopRepairOrderAuditEvent,
  sanitizeDepotWorkshopRepairOrderAuditMetadata,
} = require('../../src/depotWorkshop/depotWorkshopRepairOrderAuditEvent');

function auditInput(overrides = {}) {
  return {
    eventType: 'depot_workshop_repair_status_transition_planned',
    organizationId: 'org_2376',
    caseId: 'case_2376',
    repairOrderId: 'repair_order_2376',
    depotIntakeId: 'depot_intake_2376',
    tenantId: 'tenant_2376',
    actorId: 'actor_2376',
    actorRole: 'internal',
    requestId: 'req_2376',
    correlationId: 'corr_2376',
    fromStatus: 'diagnosis_pending',
    toStatus: 'diagnosis_completed',
    transitionReasonCode: 'depot_workshop_repair_order_transition_planned',
    assignmentStatus: 'prepared',
    projectionStatus: 'prepared',
    auditStatus: 'sanitized',
    dataProfile: 'depot_workshop_internal',
    occurredAt: '2026-05-31T10:00:00.000Z',
    finalAppointmentId: 'final appointment should not leak',
    fieldServiceReport: 'fsr should not leak',
    fieldServiceReportId: 'fsr_id_should_not_leak',
    completionReport: 'completion report should not leak',
    completionReportId: 'completion_id_should_not_leak',
    customerVisiblePublication: { publish: true },
    customerVisibleReportBody: 'customer visible report should not leak',
    rawCustomerData: 'raw customer should not leak',
    rawDbRow: 'raw db row should not leak',
    rawRows: ['raw row should not leak'],
    customerName: 'customer name should not leak',
    customerPhone: '0912 should not leak',
    customerAddress: 'full address should not leak',
    providerPayload: 'provider payload should not leak',
    billingInternals: 'billing should not leak',
    invoice: 'invoice should not leak',
    settlement: 'settlement should not leak',
    payment: 'payment should not leak',
    aiOutput: 'ai output should not leak',
    aiProviderOutput: 'ai provider should not leak',
    vectorTrace: 'vector should not leak',
    debugTrace: 'debug should not leak',
    token: 'token should not leak',
    password: 'password should not leak',
    secret: 'secret should not leak',
    sql: 'select * from secrets',
    stack: 'stack should not leak',
    ...overrides,
  };
}

function safeAuditInput(overrides = {}) {
  const {
    finalAppointmentId,
    fieldServiceReport,
    fieldServiceReportId,
    completionReport,
    completionReportId,
    customerVisiblePublication,
    customerVisibleReportBody,
    rawCustomerData,
    rawDbRow,
    rawRows,
    customerName,
    customerPhone,
    customerAddress,
    providerPayload,
    billingInternals,
    invoice,
    settlement,
    payment,
    aiOutput,
    aiProviderOutput,
    vectorTrace,
    debugTrace,
    token,
    password,
    secret,
    sql,
    stack,
    ...safe
  } = auditInput(overrides);

  return safe;
}

function assertFailure(result, reasonCode) {
  assert.equal(result.ok, false);
  assert.equal(result.built, false);
  assert.equal(result.reasonCode, reasonCode);
}

function assertNoForbiddenLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'final appointment should not leak',
    'fsr should not leak',
    'fsr_id_should_not_leak',
    'completion report should not leak',
    'completion_id_should_not_leak',
    'customer visible report should not leak',
    'customerVisiblePublication',
    'publish',
    'raw customer should not leak',
    'raw db row should not leak',
    'raw row should not leak',
    'customer name should not leak',
    '0912 should not leak',
    'full address should not leak',
    'provider payload should not leak',
    'billing should not leak',
    'invoice should not leak',
    'settlement should not leak',
    'payment should not leak',
    'ai output should not leak',
    'ai provider should not leak',
    'vector should not leak',
    'debug should not leak',
    'token should not leak',
    'password should not leak',
    'secret should not leak',
    'select * from secrets',
    'stack should not leak',
    'finalAppointmentId',
    'fieldServiceReport',
    'completionReport',
    'providerPayload',
    'billingInternals',
    'aiOutput',
    'rawDbRow',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('valid internal audit event is built from trusted fields', () => {
  const result = buildDepotWorkshopRepairOrderAuditEvent(safeAuditInput());

  assert.equal(result.ok, true);
  assert.equal(result.built, true);
  assert.equal(result.reasonCode, 'depot_workshop_repair_order_audit_event_built');
  assert.deepEqual(result.auditEvent, {
    eventKind: 'depot_workshop.repair_order_audit_event',
    eventType: 'depot_workshop_repair_status_transition_planned',
    entityType: 'depot_workshop_repair_order',
    entityId: 'repair_order_2376',
    organizationId: 'org_2376',
    caseId: 'case_2376',
    repairOrderId: 'repair_order_2376',
    depotIntakeId: 'depot_intake_2376',
    tenantId: 'tenant_2376',
    actorId: 'actor_2376',
    actorRole: 'internal',
    requestId: 'req_2376',
    correlationId: 'corr_2376',
    internalOnly: true,
    customerVisible: false,
    metadata: {
      eventType: 'depot_workshop_repair_status_transition_planned',
      organizationId: 'org_2376',
      caseId: 'case_2376',
      repairOrderId: 'repair_order_2376',
      depotIntakeId: 'depot_intake_2376',
      tenantId: 'tenant_2376',
      actorId: 'actor_2376',
      actorRole: 'internal',
      requestId: 'req_2376',
      correlationId: 'corr_2376',
      fromStatus: 'diagnosis_pending',
      toStatus: 'diagnosis_completed',
      transitionReasonCode: 'depot_workshop_repair_order_transition_planned',
      assignmentStatus: 'prepared',
      projectionStatus: 'prepared',
      auditStatus: 'sanitized',
      dataProfile: 'depot_workshop_internal',
      occurredAt: '2026-05-31T10:00:00.000Z',
    },
  });
  assertNoForbiddenLeak(result);
});

test('missing trusted scope and invalid event type fail closed', () => {
  assertFailure(buildDepotWorkshopRepairOrderAuditEvent(safeAuditInput({
    organizationId: undefined,
  })), 'organization_id_required');

  assertFailure(buildDepotWorkshopRepairOrderAuditEvent(safeAuditInput({
    caseId: undefined,
  })), 'case_id_required');

  assertFailure(buildDepotWorkshopRepairOrderAuditEvent(safeAuditInput({
    repairOrderId: undefined,
    depotIntakeId: undefined,
  })), 'repair_order_source_reference_required');

  assertFailure(buildDepotWorkshopRepairOrderAuditEvent(safeAuditInput({
    eventType: 'unknown_event',
  })), 'depot_workshop_repair_order_audit_event_type_invalid');

  assertFailure(buildDepotWorkshopRepairOrderAuditEvent(null), 'depot_workshop_repair_order_audit_plain_object_required');
});

test('event taxonomy remains explicit and internal-only', () => {
  assert.deepEqual(DEPOT_WORKSHOP_REPAIR_ORDER_AUDIT_EVENT_TYPES, [
    'depot_workshop_repair_order_created',
    'depot_workshop_repair_status_transition_planned',
    'depot_workshop_repair_assignment_intent_prepared',
    'depot_workshop_repair_customer_projection_prepared',
    'depot_workshop_repair_audit_sanitized',
  ]);

  for (const eventType of DEPOT_WORKSHOP_REPAIR_ORDER_AUDIT_EVENT_TYPES) {
    const result = buildDepotWorkshopRepairOrderAuditEvent(safeAuditInput({ eventType }));

    assert.equal(result.ok, true, `${eventType} should build`);
    assert.equal(result.auditEvent.internalOnly, true);
    assert.equal(result.auditEvent.customerVisible, false);
  }
});

test('optional tenant actor and request refs are carried only when safe', () => {
  const metadata = sanitizeDepotWorkshopRepairOrderAuditMetadata(safeAuditInput({
    tenantId: 'tenant_safe',
    actorId: 'actor_safe',
    actorRole: 'provider payload should not leak',
    requestId: 'req_safe',
    correlationId: 'corr_safe',
  }));

  assert.equal(metadata.tenantId, 'tenant_safe');
  assert.equal(metadata.actorId, 'actor_safe');
  assert.equal(metadata.actorRole, undefined);
  assert.equal(metadata.requestId, 'req_safe');
  assert.equal(metadata.correlationId, 'corr_safe');
});

test('metadata is sanitized and allowlisted from nested metadata object', () => {
  const metadata = sanitizeDepotWorkshopRepairOrderAuditMetadata({
    metadata: safeAuditInput({
      extraUnsafeField: 'should not be emitted',
      transitionReasonCode: 'depot_workshop_repair_order_transition_planned',
    }),
    organizationId: 'org_override',
  });

  assert.equal(metadata.organizationId, 'org_override');
  assert.equal(metadata.transitionReasonCode, 'depot_workshop_repair_order_transition_planned');
  assert.equal(metadata.extraUnsafeField, undefined);
  assertNoForbiddenLeak(metadata);
});

test('forbidden FSR Completion Report finalAppointment raw provider billing AI debug fields fail closed without leaks', () => {
  for (const forbiddenInput of [
    { finalAppointmentId: 'final appointment should not leak' },
    { fieldServiceReport: 'fsr should not leak' },
    { completionReport: 'completion report should not leak' },
    { customerVisiblePublication: { publish: true } },
    { metadata: { rawDbRow: 'raw db row should not leak' } },
    { providerPayload: 'provider payload should not leak' },
    { billingInternals: 'billing should not leak' },
    { aiOutput: 'ai output should not leak' },
    { stack: 'stack should not leak' },
  ]) {
    const result = buildDepotWorkshopRepairOrderAuditEvent({
      ...safeAuditInput(),
      ...forbiddenInput,
    });

    assertFailure(result, 'depot_workshop_repair_order_audit_forbidden_fields');
    assertNoForbiddenLeak(result);
  }
});

test('input objects are not mutated and output is detached', () => {
  const input = safeAuditInput();
  const before = JSON.stringify(input);
  const result = buildDepotWorkshopRepairOrderAuditEvent(input);

  result.auditEvent.metadata.eventType = 'mutated_result_only';
  result.auditEvent.organizationId = 'mutated_result_only';

  assert.equal(JSON.stringify(input), before);
  assert.equal(input.eventType, 'depot_workshop_repair_status_transition_planned');
  assert.equal(input.organizationId, 'org_2376');
});
