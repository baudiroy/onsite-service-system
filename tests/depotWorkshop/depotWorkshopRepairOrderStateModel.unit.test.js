'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DEPOT_WORKSHOP_REPAIR_ORDER_CUSTOMER_VISIBLE_FIELDS,
  DEPOT_WORKSHOP_REPAIR_ORDER_INTERNAL_ONLY_FIELDS,
  DEPOT_WORKSHOP_REPAIR_ORDER_STATUSES,
  DEPOT_WORKSHOP_REPAIR_ORDER_TERMINAL_STATUSES,
  isDepotWorkshopRepairOrderStatus,
  isDepotWorkshopRepairOrderTerminalStatus,
  sanitizeDepotWorkshopRepairOrderPublicProjection,
} = require('../../src/depotWorkshop/depotWorkshopRepairOrderStateModel');

const ACTIVE_STATUSES = Object.freeze([
  'intake_received',
  'diagnosis_pending',
  'diagnosis_completed',
  'quote_pending',
  'quote_approved',
  'repair_in_progress',
  'quality_check',
  'ready_for_return',
  'returned',
  'cancelled',
  'closed',
]);

function unsafeRepairOrder(overrides = {}) {
  return {
    customerRepairReference: 'DEPOT-2373',
    workflowType: 'depot',
    displayStatus: 'diagnosis_pending',
    statusSummary: 'Diagnosis is in progress.',
    issueSummary: 'Device cannot power on.',
    workSummary: 'Workshop is checking the device.',
    nextCustomerAction: ['Wait for diagnosis update.', 'token should not leak'],
    estimatedReadyAt: '2026-06-01T10:00:00.000Z',
    readyForReturnAt: '2026-06-02T10:00:00.000Z',
    returnedAt: '2026-06-03T10:00:00.000Z',
    lastCustomerUpdateAt: '2026-05-31T10:00:00.000Z',
    supportContactHint: 'Contact support via service portal.',
    repairOrderId: 'repair_order_internal',
    caseId: 'case_internal',
    depotIntakeId: 'depot_intake_internal',
    organizationId: 'org_internal',
    tenantId: 'tenant_internal',
    depotStatus: 'diagnosis_pending',
    workshopJobId: 'workshop_job_internal',
    finalAppointmentId: 'final appointment should not leak',
    fieldServiceReport: 'fsr should not leak',
    fieldServiceReportId: 'fsr_id_should_not_leak',
    completionReport: 'completion report should not leak',
    completionReportId: 'completion_id_should_not_leak',
    customerVisiblePublication: { publish: true },
    customerName: 'customer name should not leak',
    customerPhone: '0912 should not leak',
    customerAddress: 'full address should not leak',
    rawCustomerData: 'raw customer should not leak',
    rawDbRow: 'raw db row should not leak',
    rawRows: ['raw row should not leak'],
    providerPayload: 'provider payload should not leak',
    billingInternals: 'billing should not leak',
    invoice: 'invoice should not leak',
    settlement: 'settlement should not leak',
    payment: 'payment should not leak',
    aiOutput: 'ai output should not leak',
    aiProviderOutput: 'ai provider should not leak',
    vectorSearchTrace: 'vector should not leak',
    debugTrace: 'debug should not leak',
    DATABASE_URL: 'DATABASE_URL should not leak',
    token: 'token should not leak',
    password: 'password should not leak',
    secret: 'secret should not leak',
    sql: 'select * from secrets',
    stack: 'stack should not leak',
    ...overrides,
  };
}

function assertNoUnsafeLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'repair_order_internal',
    'case_internal',
    'depot_intake_internal',
    'org_internal',
    'tenant_internal',
    'workshop_job_internal',
    'final appointment should not leak',
    'fsr should not leak',
    'fsr_id_should_not_leak',
    'completion report should not leak',
    'completion_id_should_not_leak',
    'customerVisiblePublication',
    'publish',
    'customer name should not leak',
    '0912 should not leak',
    'full address should not leak',
    'raw customer should not leak',
    'raw db row should not leak',
    'raw row should not leak',
    'provider payload should not leak',
    'billing should not leak',
    'invoice should not leak',
    'settlement should not leak',
    'payment should not leak',
    'ai output should not leak',
    'ai provider should not leak',
    'vector should not leak',
    'debug should not leak',
    'DATABASE_URL should not leak',
    'token should not leak',
    'password should not leak',
    'secret should not leak',
    'select * from secrets',
    'stack should not leak',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('status constants contain only approved active depot workshop repair order statuses', () => {
  assert.deepEqual(DEPOT_WORKSHOP_REPAIR_ORDER_STATUSES, ACTIVE_STATUSES);
  assert.equal(Object.isFrozen(DEPOT_WORKSHOP_REPAIR_ORDER_STATUSES), true);
  assert.equal(DEPOT_WORKSHOP_REPAIR_ORDER_STATUSES.includes('repair_waiting_parts'), false);

  for (const status of ACTIVE_STATUSES) {
    assert.equal(isDepotWorkshopRepairOrderStatus(status), true, `${status} should be active`);
  }

  for (const status of ['repair_waiting_parts', 'onsite_completed', 'finalized', '', null, undefined]) {
    assert.equal(isDepotWorkshopRepairOrderStatus(status), false, `${status} should be rejected`);
  }
});

test('terminal status helper recognizes terminal states only', () => {
  assert.deepEqual(DEPOT_WORKSHOP_REPAIR_ORDER_TERMINAL_STATUSES, ['cancelled', 'closed']);
  assert.equal(Object.isFrozen(DEPOT_WORKSHOP_REPAIR_ORDER_TERMINAL_STATUSES), true);
  assert.equal(isDepotWorkshopRepairOrderTerminalStatus('cancelled'), true);
  assert.equal(isDepotWorkshopRepairOrderTerminalStatus('closed'), true);

  for (const status of ACTIVE_STATUSES.filter((status) => !['cancelled', 'closed'].includes(status))) {
    assert.equal(isDepotWorkshopRepairOrderTerminalStatus(status), false, `${status} is not terminal`);
  }
});

test('public projection sanitizer allowlists only customer-safe fields', () => {
  const projection = sanitizeDepotWorkshopRepairOrderPublicProjection(unsafeRepairOrder());

  assert.deepEqual(projection, {
    customerRepairReference: 'DEPOT-2373',
    workflowType: 'depot',
    displayStatus: 'diagnosis_pending',
    statusSummary: 'Diagnosis is in progress.',
    issueSummary: 'Device cannot power on.',
    workSummary: 'Workshop is checking the device.',
    nextCustomerAction: ['Wait for diagnosis update.'],
    estimatedReadyAt: '2026-06-01T10:00:00.000Z',
    readyForReturnAt: '2026-06-02T10:00:00.000Z',
    returnedAt: '2026-06-03T10:00:00.000Z',
    lastCustomerUpdateAt: '2026-05-31T10:00:00.000Z',
    supportContactHint: 'Contact support via service portal.',
  });
  assert.deepEqual(Object.keys(projection), DEPOT_WORKSHOP_REPAIR_ORDER_CUSTOMER_VISIBLE_FIELDS);
  assertNoUnsafeLeak(projection);
});

test('formal report finalAppointment provider billing AI debug and raw fields are not emitted', () => {
  const projection = sanitizeDepotWorkshopRepairOrderPublicProjection(unsafeRepairOrder({
    statusSummary: 'field service report should not leak',
    issueSummary: 'completion report should not leak',
    workSummary: 'billing internals should not leak',
    nextCustomerAction: 'AI output should not leak',
    supportContactHint: 'Call 0912-345-678 for update',
  }));

  assert.equal(projection.statusSummary, undefined);
  assert.equal(projection.issueSummary, undefined);
  assert.equal(projection.workSummary, undefined);
  assert.equal(projection.nextCustomerAction, undefined);
  assert.equal(projection.supportContactHint, undefined);
  assertNoUnsafeLeak(projection);
});

test('input objects and nested arrays are not mutated and returned projection is detached', () => {
  const input = unsafeRepairOrder();
  const before = JSON.stringify(input);
  const projection = sanitizeDepotWorkshopRepairOrderPublicProjection(input);

  projection.nextCustomerAction.push('A detached customer-facing update.');
  projection.statusSummary = 'Mutated projection only.';

  assert.equal(JSON.stringify(input), before);
  assert.deepEqual(input.nextCustomerAction, ['Wait for diagnosis update.', 'token should not leak']);
  assert.notEqual(projection.nextCustomerAction, input.nextCustomerAction);
});

test('only plain object input is accepted and internal field constants stay explicit', () => {
  assert.deepEqual(sanitizeDepotWorkshopRepairOrderPublicProjection(null), {});
  assert.deepEqual(sanitizeDepotWorkshopRepairOrderPublicProjection([]), {});
  assert.deepEqual(sanitizeDepotWorkshopRepairOrderPublicProjection('unsafe'), {});

  assert.equal(Object.isFrozen(DEPOT_WORKSHOP_REPAIR_ORDER_INTERNAL_ONLY_FIELDS), true);

  for (const field of [
    'repairOrderId',
    'caseId',
    'depotIntakeId',
    'organizationId',
    'depotStatus',
    'finalAppointmentId',
    'fieldServiceReport',
    'completionReport',
    'providerPayload',
    'billingInternals',
    'aiOutput',
    'rawDbRow',
  ]) {
    assert.equal(DEPOT_WORKSHOP_REPAIR_ORDER_INTERNAL_ONLY_FIELDS.includes(field), true, `${field} should stay internal-only`);
    assert.equal(DEPOT_WORKSHOP_REPAIR_ORDER_CUSTOMER_VISIBLE_FIELDS.includes(field), false, `${field} must not be customer-visible`);
  }
});
