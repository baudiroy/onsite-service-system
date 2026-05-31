'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DEPOT_WORKSHOP_REPAIR_ORDER_ALLOWED_TRANSITIONS,
  canTransitionDepotWorkshopRepairOrderStatus,
  planDepotWorkshopRepairOrderStatusTransition,
} = require('../../src/depotWorkshop/depotWorkshopRepairOrderTransitionPolicy');

function transitionInput(overrides = {}) {
  return {
    organizationId: 'org_2375',
    caseId: 'case_2375',
    depotIntakeId: 'depot_intake_2375',
    repairOrderId: 'repair_order_2375',
    tenantId: 'tenant_2375',
    fromStatus: 'intake_received',
    toStatus: 'diagnosis_pending',
    actorId: 'actor_2375',
    requestId: 'req_2375',
    finalAppointmentId: 'final appointment should not leak',
    fieldServiceReport: 'fsr should not leak',
    fieldServiceReportId: 'fsr_id_should_not_leak',
    completionReport: 'completion report should not leak',
    completionReportId: 'completion_id_should_not_leak',
    customerVisiblePublication: { publish: true },
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

function safeTransitionInput(overrides = {}) {
  const {
    finalAppointmentId,
    fieldServiceReport,
    fieldServiceReportId,
    completionReport,
    completionReportId,
    customerVisiblePublication,
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
  } = transitionInput(overrides);

  return safe;
}

function assertDenied(result, reasonCode) {
  assert.equal(result.ok, false);
  assert.equal(result.allowed, false);
  assert.equal(result.planned, false);
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

test('valid allowed transition returns safe planned transition result', () => {
  const result = planDepotWorkshopRepairOrderStatusTransition(safeTransitionInput());

  assert.equal(result.ok, true);
  assert.equal(result.allowed, true);
  assert.equal(result.planned, true);
  assert.equal(result.reasonCode, 'depot_workshop_repair_order_transition_planned');
  assert.deepEqual(result.plannedTransition, {
    organizationId: 'org_2375',
    caseId: 'case_2375',
    repairOrderId: 'repair_order_2375',
    depotIntakeId: 'depot_intake_2375',
    tenantId: 'tenant_2375',
    fromStatus: 'intake_received',
    toStatus: 'diagnosis_pending',
    actorId: 'actor_2375',
    requestId: 'req_2375',
  });
  assertNoForbiddenLeak(result);
});

test('allowed transition model covers directed lifecycle and cancellation from active states', () => {
  assert.deepEqual(DEPOT_WORKSHOP_REPAIR_ORDER_ALLOWED_TRANSITIONS.intake_received, ['diagnosis_pending', 'cancelled']);
  assert.deepEqual(DEPOT_WORKSHOP_REPAIR_ORDER_ALLOWED_TRANSITIONS.returned, ['closed', 'cancelled']);
  assert.deepEqual(DEPOT_WORKSHOP_REPAIR_ORDER_ALLOWED_TRANSITIONS.cancelled, []);
  assert.deepEqual(DEPOT_WORKSHOP_REPAIR_ORDER_ALLOWED_TRANSITIONS.closed, []);

  for (const fromStatus of [
    'intake_received',
    'diagnosis_pending',
    'diagnosis_completed',
    'quote_pending',
    'quote_approved',
    'repair_in_progress',
    'quality_check',
    'ready_for_return',
    'returned',
  ]) {
    const result = canTransitionDepotWorkshopRepairOrderStatus(safeTransitionInput({
      fromStatus,
      toStatus: 'cancelled',
    }));

    assert.equal(result.ok, true, `${fromStatus} should cancel`);
  }
});

test('invalid transition unknown status and terminal transitions fail closed', () => {
  assertDenied(planDepotWorkshopRepairOrderStatusTransition(safeTransitionInput({
    fromStatus: 'quote_pending',
    toStatus: 'quality_check',
  })), 'depot_workshop_repair_order_transition_not_allowed');

  assertDenied(planDepotWorkshopRepairOrderStatusTransition(safeTransitionInput({
    fromStatus: 'repair_waiting_parts',
    toStatus: 'quality_check',
  })), 'depot_workshop_repair_order_from_status_invalid');

  assertDenied(planDepotWorkshopRepairOrderStatusTransition(safeTransitionInput({
    fromStatus: 'quality_check',
    toStatus: 'repair_waiting_parts',
  })), 'depot_workshop_repair_order_to_status_invalid');

  assertDenied(planDepotWorkshopRepairOrderStatusTransition(safeTransitionInput({
    fromStatus: 'closed',
    toStatus: 'cancelled',
  })), 'depot_workshop_repair_order_terminal_transition_denied');
});

test('missing trusted scope fails closed', () => {
  assertDenied(planDepotWorkshopRepairOrderStatusTransition(safeTransitionInput({
    organizationId: undefined,
  })), 'organization_id_required');

  assertDenied(planDepotWorkshopRepairOrderStatusTransition(safeTransitionInput({
    caseId: undefined,
  })), 'case_id_required');

  assertDenied(planDepotWorkshopRepairOrderStatusTransition(safeTransitionInput({
    depotIntakeId: undefined,
    repairOrderId: undefined,
  })), 'repair_order_source_reference_required');

  assertDenied(planDepotWorkshopRepairOrderStatusTransition(null), 'depot_workshop_repair_order_transition_plain_object_required');
});

test('forbidden FSR Completion Report finalAppointment raw provider billing AI and debug fields fail closed without leaks', () => {
  for (const forbiddenInput of [
    { finalAppointmentId: 'final appointment should not leak' },
    { fieldServiceReport: 'fsr should not leak' },
    { completionReport: 'completion report should not leak' },
    { customerVisiblePublication: { publish: true } },
    { rawDbRow: 'raw db row should not leak' },
    { providerPayload: 'provider payload should not leak' },
    { billingInternals: 'billing should not leak' },
    { aiOutput: 'ai output should not leak' },
    { token: 'token should not leak' },
  ]) {
    const result = planDepotWorkshopRepairOrderStatusTransition({
      ...safeTransitionInput(),
      ...forbiddenInput,
    });

    assertDenied(result, 'depot_workshop_repair_order_transition_forbidden_fields');
    assertNoForbiddenLeak(result);
  }
});

test('input objects are not mutated and output is detached', () => {
  const input = safeTransitionInput();
  const before = JSON.stringify(input);
  const result = planDepotWorkshopRepairOrderStatusTransition(input);

  result.plannedTransition.toStatus = 'closed';
  result.plannedTransition.organizationId = 'mutated_result_only';

  assert.equal(JSON.stringify(input), before);
  assert.equal(input.toStatus, 'diagnosis_pending');
  assert.equal(input.organizationId, 'org_2375');
});
