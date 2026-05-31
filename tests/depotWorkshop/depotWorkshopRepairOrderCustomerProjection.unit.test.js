'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DEPOT_WORKSHOP_REPAIR_ORDER_CUSTOMER_PROJECTION_FIELDS,
  buildDepotWorkshopRepairOrderCustomerProjection,
  sanitizeDepotWorkshopRepairOrderCustomerProjection,
} = require('../../src/depotWorkshop/depotWorkshopRepairOrderCustomerProjection');

function unsafeProjectionInput(overrides = {}) {
  return {
    repairOrderReference: 'DEPOT-ORDER-2377',
    caseReference: 'CASE-2377',
    depotStatus: 'diagnosis_pending',
    statusLabelKey: 'depot.status.diagnosis_pending',
    lastUpdatedAt: '2026-05-31T10:00:00.000Z',
    customerMessageKey: 'depot.message.diagnosis_pending',
    estimatedReadyAt: '2026-06-01T10:00:00.000Z',
    returnMethod: 'pickup',
    publicNotes: 'Workshop is reviewing your item.',
    finalAppointmentId: 'final appointment should not leak',
    fieldServiceReport: 'fsr should not leak',
    completionReport: 'completion report should not leak',
    customerVisiblePublication: { publish: true },
    rawCase: 'raw case should not leak',
    rawAppointment: 'raw appointment should not leak',
    rawCompletionReport: 'raw completion should not leak',
    rawFieldServiceReport: 'raw fsr should not leak',
    rawDbRow: 'raw db row should not leak',
    rawRows: ['raw row should not leak'],
    customerPhone: '0912 should not leak',
    customerAddress: 'full address should not leak',
    customerSignature: 'signature should not leak',
    customerPhoto: 'photo should not leak',
    workshopId: 'workshop internal should not leak',
    workshopTeamId: 'team internal should not leak',
    assignedTechnicianId: 'technician internal should not leak',
    subcontractorOrganizationId: 'subcontractor internal should not leak',
    providerPayload: 'provider payload should not leak',
    billingInternals: 'billing should not leak',
    invoice: 'invoice should not leak',
    settlement: 'settlement should not leak',
    payment: 'payment should not leak',
    aiOutput: 'ai output should not leak',
    auditEvent: 'audit internal should not leak',
    token: 'token should not leak',
    password: 'password should not leak',
    secret: 'secret should not leak',
    sql: 'select * from secrets',
    stack: 'stack should not leak',
    ...overrides,
  };
}

function assertNoForbiddenLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'final appointment should not leak',
    'fsr should not leak',
    'completion report should not leak',
    'customerVisiblePublication',
    'publish',
    'raw case should not leak',
    'raw appointment should not leak',
    'raw completion should not leak',
    'raw fsr should not leak',
    'raw db row should not leak',
    'raw row should not leak',
    '0912 should not leak',
    'full address should not leak',
    'signature should not leak',
    'photo should not leak',
    'workshop internal should not leak',
    'team internal should not leak',
    'technician internal should not leak',
    'subcontractor internal should not leak',
    'provider payload should not leak',
    'billing should not leak',
    'invoice should not leak',
    'settlement should not leak',
    'payment should not leak',
    'ai output should not leak',
    'audit internal should not leak',
    'token should not leak',
    'password should not leak',
    'secret should not leak',
    'select * from secrets',
    'stack should not leak',
    'finalAppointmentId',
    'fieldServiceReport',
    'completionReport',
    'rawDbRow',
    'assignedTechnicianId',
    'subcontractorOrganizationId',
    'providerPayload',
    'billingInternals',
    'aiOutput',
    'auditEvent',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('valid customer projection is built from safe allowlisted scalar fields', () => {
  const result = buildDepotWorkshopRepairOrderCustomerProjection(unsafeProjectionInput());

  assert.equal(result.ok, true);
  assert.equal(result.built, true);
  assert.equal(result.reasonCode, 'depot_workshop_repair_order_customer_projection_built');
  assert.deepEqual(result.projection, {
    repairOrderReference: 'DEPOT-ORDER-2377',
    caseReference: 'CASE-2377',
    depotStatus: 'diagnosis_pending',
    statusLabelKey: 'depot.status.diagnosis_pending',
    lastUpdatedAt: '2026-05-31T10:00:00.000Z',
    customerMessageKey: 'depot.message.diagnosis_pending',
    estimatedReadyAt: '2026-06-01T10:00:00.000Z',
    returnMethod: 'pickup',
    publicNotes: 'Workshop is reviewing your item.',
  });
  assert.deepEqual(Object.keys(result.projection), DEPOT_WORKSHOP_REPAIR_ORDER_CUSTOMER_PROJECTION_FIELDS);
  assertNoForbiddenLeak(result);
});

test('malformed input fails closed and sanitizer returns an empty projection', () => {
  assert.deepEqual(sanitizeDepotWorkshopRepairOrderCustomerProjection(null), {});
  assert.deepEqual(sanitizeDepotWorkshopRepairOrderCustomerProjection([]), {});

  const result = buildDepotWorkshopRepairOrderCustomerProjection(null);

  assert.equal(result.ok, false);
  assert.equal(result.built, false);
  assert.equal(result.reasonCode, 'depot_workshop_repair_order_customer_projection_plain_object_required');
  assert.deepEqual(result.projection, {});
});

test('nested source objects are supported without exposing internals', () => {
  const result = buildDepotWorkshopRepairOrderCustomerProjection({
    repairOrder: unsafeProjectionInput({
      repairOrderReference: 'DEPOT-NESTED-2377',
      publicNotes: 'Safe customer note.',
    }),
  });

  assert.equal(result.ok, true);
  assert.equal(result.projection.repairOrderReference, 'DEPOT-NESTED-2377');
  assert.equal(result.projection.publicNotes, 'Safe customer note.');
  assertNoForbiddenLeak(result);
});

test('unsafe text in allowed fields is omitted', () => {
  const projection = sanitizeDepotWorkshopRepairOrderCustomerProjection(unsafeProjectionInput({
    publicNotes: 'field service report should not leak',
    customerMessageKey: 'token should not leak',
    returnMethod: 'provider payload should not leak',
    estimatedReadyAt: { unsafe: true },
  }));

  assert.equal(projection.publicNotes, undefined);
  assert.equal(projection.customerMessageKey, undefined);
  assert.equal(projection.returnMethod, undefined);
  assert.equal(projection.estimatedReadyAt, undefined);
  assertNoForbiddenLeak(projection);
});

test('internal assignment workshop subcontractor provider billing AI audit and debug fields are omitted', () => {
  const projection = sanitizeDepotWorkshopRepairOrderCustomerProjection(unsafeProjectionInput());

  for (const field of [
    'workshopId',
    'workshopTeamId',
    'assignedTechnicianId',
    'subcontractorOrganizationId',
    'providerPayload',
    'billingInternals',
    'aiOutput',
    'auditEvent',
    'token',
    'sql',
  ]) {
    assert.equal(Object.prototype.hasOwnProperty.call(projection, field), false, `${field} should not be projected`);
  }
  assertNoForbiddenLeak(projection);
});

test('input objects are not mutated and output is detached', () => {
  const input = unsafeProjectionInput();
  const before = JSON.stringify(input);
  const result = buildDepotWorkshopRepairOrderCustomerProjection(input);

  result.projection.publicNotes = 'mutated projection only';
  result.projection.depotStatus = 'closed';

  assert.equal(JSON.stringify(input), before);
  assert.equal(input.publicNotes, 'Workshop is reviewing your item.');
  assert.equal(input.depotStatus, 'diagnosis_pending');
});
