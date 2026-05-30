'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  resolveRepairIntakeDraftToCaseRequestContext,
} = require('../../src/repairIntake/repairIntakeDraftToCaseRequestContextResolver');

function validInput(draftInput) {
  return {
    sessionContext: {
      organizationId: 'org-task2190',
      actorId: 'actor-task2190',
      actorRole: 'service_agent',
    },
    repairIntakeDraftId: 'draft-task2190',
    requestBody: {
      repairIntakeDraftId: 'body-draft-client-controlled',
      organizationId: 'body-org-client-controlled',
      actorId: 'body-actor-client-controlled',
      draftInput,
    },
    requestSource: 'admin_route_injected_test',
  };
}

test('Task2190 resolver wires public/open sanitizer before downstream draftInput', () => {
  const rawDraftInput = {
    customerDisplayName: '  Ms. Wang  ',
    customerContactIntent: '  call after lunch  ',
    serviceCategory: '  appliance_repair  ',
    issueSummary: '  refrigerator is not cold  ',
    preferredWindow: '  tomorrow morning  ',
    addressDescription: '  building lobby  ',
    source: 'customer_access',
    consentConfirmed: true,
    unknownField: 'must not pass',
    organizationId: 'draft-org-client-controlled',
    caseId: 'case-client-controlled',
    appointmentId: 'appointment-client-controlled',
    finalAppointmentId: 'final-appointment-client-controlled',
    status: 'accepted',
    assignedEngineerId: 'engineer-client-controlled',
    providerPayload: { token: 'provider-token' },
    ai: { prompt: 'unsafe' },
    billing: { amount: 1000 },
    audit: { actor: 'client' },
    token: 'unsafe-token',
    password: 'unsafe-password',
    rawBody: 'unsafe-raw-body',
    debug: 'unsafe-debug',
    internal: 'unsafe-internal',
    sql: 'select * from repair_intake',
  };
  const input = validInput(rawDraftInput);
  const before = JSON.stringify(input);

  const result = resolveRepairIntakeDraftToCaseRequestContext(input);

  assert.equal(result.ok, true);
  assert.deepEqual(result.draftInput, {
    customerDisplayName: 'Ms. Wang',
    customerContactIntent: 'call after lunch',
    serviceCategory: 'appliance_repair',
    problemDescription: 'refrigerator is not cold',
    preferredTimeDescription: 'tomorrow morning',
    addressDescription: 'building lobby',
    consentConfirmed: true,
  });

  assert.equal(result.organizationId, 'org-task2190');
  assert.equal(result.actorId, 'actor-task2190');
  assert.equal(result.repairIntakeDraftId, 'draft-task2190');
  assert.equal(result.source, 'admin_route_injected_test');
  assert.equal(JSON.stringify(input), before);
});

test('Task2190 resolver does not accept client-owned context from draftInput', () => {
  const result = resolveRepairIntakeDraftToCaseRequestContext(validInput({
    customerDisplayName: 'Customer',
    problemDescription: 'Needs repair',
    organizationId: 'draft-org-client-controlled',
    actorId: 'draft-actor-client-controlled',
    repairIntakeDraftId: 'draft-id-client-controlled',
    createdBy: 'client-created-by',
    updatedBy: 'client-updated-by',
    role: 'admin',
    permission: 'cases.create',
  }));

  assert.equal(result.organizationId, 'org-task2190');
  assert.equal(result.actorId, 'actor-task2190');
  assert.equal(result.repairIntakeDraftId, 'draft-task2190');
  assert.deepEqual(result.draftInput, {
    customerDisplayName: 'Customer',
    problemDescription: 'Needs repair',
  });

  const serialized = JSON.stringify(result.draftInput);

  for (const forbidden of [
    'client-controlled',
    'client-created-by',
    'client-updated-by',
    'admin',
    'cases.create',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
});
