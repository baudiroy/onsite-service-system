'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DEPOT_REPAIR_CUSTOMER_VISIBLE_ALLOWED_FIELDS,
  DEPOT_REPAIR_CUSTOMER_VISIBLE_DTO_TYPE,
  DEPOT_REPAIR_CUSTOMER_VISIBLE_FILTER_KIND,
  buildDepotRepairCustomerVisibleDto,
} = require('../../src/depotWorkshop/depotRepairCustomerVisibleDataFilter');

function unsafeSource(overrides = {}) {
  return {
    customerRepairReference: 'DEPOT-REF-1914',
    workflowType: 'depot',
    displayStatus: 'diagnosis_pending',
    statusSummary: 'Diagnosis is in progress.',
    issueSummary: 'Device cannot power on.',
    workSummary: 'Workshop is checking the device.',
    nextCustomerAction: 'Wait for diagnosis update.',
    estimatedReadyAt: '2026-05-30T10:00:00.000Z',
    readyForReturnAt: '2026-05-31T10:00:00.000Z',
    returnedAt: '2026-06-01T10:00:00.000Z',
    lastCustomerUpdateAt: '2026-05-29T10:00:00.000Z',
    supportContactHint: 'Contact support via service portal.',
    rawDbRow: 'raw db row should not leak',
    rawRows: [{ id: 'raw row should not leak' }],
    internalNotes: 'internal notes should not leak',
    technicianInternalRepairNotes: 'technician notes should not leak',
    brandInternalNotes: 'brand notes should not leak',
    providerInternalNotes: 'provider notes should not leak',
    subcontractorInternalNotes: 'subcontractor notes should not leak',
    subcontractorCustomerPhone: '0912 should not leak',
    customerPhone: '0912 should not leak',
    rawPhone: '0912 should not leak',
    address: 'full address should not leak',
    rawAddress: 'full address should not leak',
    providerPayload: 'provider payload should not leak',
    token: 'token should not leak',
    DATABASE_URL: 'DATABASE_URL should not leak',
    JWT_SECRET: 'JWT_SECRET should not leak',
    stack: 'stack should not leak',
    sql: 'select * from secrets',
    billingInternals: 'billing should not leak',
    aiOutput: 'ai output should not leak',
    finalAppointmentId: 'final appointment should not leak',
    completionReport: 'completion report should not leak',
    fieldServiceReport: 'fsr should not leak',
    assignmentInternalState: 'assignment internals should not leak',
    ...overrides,
  };
}

function assertNoUnsafeLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'raw db row should not leak',
    'raw row should not leak',
    'internal notes should not leak',
    'technician notes should not leak',
    'brand notes should not leak',
    'provider notes should not leak',
    'subcontractor notes should not leak',
    '0912 should not leak',
    'full address should not leak',
    'provider payload should not leak',
    'token should not leak',
    'DATABASE_URL should not leak',
    'JWT_SECRET should not leak',
    'stack should not leak',
    'select * from secrets',
    'billing should not leak',
    'ai output should not leak',
    'final appointment should not leak',
    'completion report should not leak',
    'fsr should not leak',
    'assignment internals should not leak',
    'rawDbRow',
    'rawRows',
    'internalNotes',
    'technicianInternalRepairNotes',
    'brandInternalNotes',
    'providerInternalNotes',
    'subcontractorInternalNotes',
    'subcontractorCustomerPhone',
    'customerPhone',
    'rawPhone',
    'address',
    'rawAddress',
    'providerPayload',
    'token',
    'DATABASE_URL',
    'JWT_SECRET',
    'stack',
    'sql',
    'billingInternals',
    'aiOutput',
    'finalAppointmentId',
    'completionReport',
    'fieldServiceReport',
    'assignmentInternalState',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('allowed safe customer-visible DTO shape includes only explicit fields', () => {
  const result = buildDepotRepairCustomerVisibleDto({
    source: unsafeSource(),
  });

  assert.equal(result.ok, true);
  assert.equal(result.filterKind, DEPOT_REPAIR_CUSTOMER_VISIBLE_FILTER_KIND);
  assert.equal(result.reasonCode, 'depot_customer_visible_dto_filtered');
  assert.deepEqual(result.dto, {
    dtoType: DEPOT_REPAIR_CUSTOMER_VISIBLE_DTO_TYPE,
    customerRepairReference: 'DEPOT-REF-1914',
    workflowType: 'depot',
    displayStatus: 'diagnosis_pending',
    statusSummary: 'Diagnosis is in progress.',
    issueSummary: 'Device cannot power on.',
    workSummary: 'Workshop is checking the device.',
    nextCustomerAction: 'Wait for diagnosis update.',
    estimatedReadyAt: '2026-05-30T10:00:00.000Z',
    readyForReturnAt: '2026-05-31T10:00:00.000Z',
    returnedAt: '2026-06-01T10:00:00.000Z',
    lastCustomerUpdateAt: '2026-05-29T10:00:00.000Z',
    supportContactHint: 'Contact support via service portal.',
  });
  assert.deepEqual(Object.keys(result.dto), [
    'dtoType',
    ...DEPOT_REPAIR_CUSTOMER_VISIBLE_ALLOWED_FIELDS,
  ]);
  assertNoUnsafeLeak(result);
});

test('forbidden fields and nested raw structures are excluded', () => {
  const result = buildDepotRepairCustomerVisibleDto(unsafeSource({
    statusSummary: {
      rawDbRow: 'raw nested should not leak',
    },
    nextCustomerAction: ['Safe customer next step.', 'token should not leak'],
  }));

  assert.equal(result.dto.statusSummary, undefined);
  assert.deepEqual(result.dto.nextCustomerAction, ['Safe customer next step.']);
  assertNoUnsafeLeak(result);
});

test('subcontractor-sensitive fields and raw phone or address values are excluded', () => {
  const result = buildDepotRepairCustomerVisibleDto({
    source: unsafeSource({
      supportContactHint: 'Call 0912-345-678 for update',
      issueSummary: 'Customer address is full address should not leak',
      workSummary: 'Safe workshop customer-facing summary.',
    }),
    viewerScope: 'subcontractor',
  });

  assert.equal(result.dto.supportContactHint, undefined);
  assert.equal(result.dto.issueSummary, undefined);
  assert.equal(result.dto.workSummary, 'Safe workshop customer-facing summary.');
  assertNoUnsafeLeak(result);
});

test('filter does not create publication mutation or FSR/finalAppointment behavior', () => {
  const result = buildDepotRepairCustomerVisibleDto(unsafeSource({
    customerVisiblePublication: {
      publish: true,
      reportBody: 'customer visible report should not leak',
    },
    publishedAt: '2026-05-29T10:00:00.000Z',
    finalAppointmentId: 'final appointment should not leak',
    fieldServiceReport: {
      reportBody: 'fsr should not leak',
    },
  }));
  const serialized = JSON.stringify(result);

  assert.equal(serialized.includes('customerVisiblePublication'), false);
  assert.equal(serialized.includes('publishedAt'), false);
  assert.equal(serialized.includes('publish'), false);
  assertNoUnsafeLeak(result);
});

test('unsafe provider AI billing and secret text in allowed fields is rejected', () => {
  const result = buildDepotRepairCustomerVisibleDto(unsafeSource({
    statusSummary: 'DATABASE_URL should not leak',
    issueSummary: 'provider payload should not leak',
    workSummary: 'billing internals should not leak',
    nextCustomerAction: 'AI output should not leak',
    supportContactHint: 'secret token should not leak',
  }));

  assert.equal(result.dto.statusSummary, undefined);
  assert.equal(result.dto.issueSummary, undefined);
  assert.equal(result.dto.workSummary, undefined);
  assert.equal(result.dto.nextCustomerAction, undefined);
  assert.equal(result.dto.supportContactHint, undefined);
  assertNoUnsafeLeak(result);
});
