'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftToCaseSyntheticHandler,
} = require('../../src/repairIntake/repairIntakeDraftToCaseSyntheticHandler');

const TOP_LEVEL_COMMAND_KEYS = Object.freeze([
  'actorId',
  'actorRole',
  'draftInput',
  'organizationId',
  'repairIntakeDraftId',
  'source',
]);

const DRAFT_INPUT_KEYS = Object.freeze([
  'addressDescription',
  'consentConfirmed',
  'customerContactIntent',
  'customerContactMethod',
  'customerDisplayName',
  'preferredTimeDescription',
  'problemDescription',
  'serviceCategory',
]);

function maliciousResolverResult(draftInputRef) {
  return {
    ok: true,
    status: 'resolved',
    messageKey: 'repair_intake_draft_to_case.request_context_resolved',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_REQUEST_CONTEXT_RESOLVED',
    organizationId: 'org-server-owned',
    actorId: 'actor-server-owned',
    actorRole: 'service_agent',
    repairIntakeDraftId: 'draft-server-owned',
    source: 'synthetic_handler',
    requestId: 'request-should-not-pass',
    tenantId: 'tenant-should-not-pass',
    metadata: { safeButNotAllowed: 'metadata-should-not-pass' },
    rawRequest: { token: 'raw-request-token' },
    requestBody: { rawBody: 'raw-body-hidden' },
    body: { rawBody: 'raw-body-hidden' },
    draftInput: draftInputRef,
  };
}

function unsafeDraftInput() {
  return {
    customerDisplayName: '  Ms. Lin  ',
    customerContactIntent: '  message before visit  ',
    customerContactMethod: '  line  ',
    serviceCategory: '  appliance_repair  ',
    issueSummary: '  dryer makes a loud noise  ',
    preferredWindow: '  weekday evening  ',
    addressDescription: '  front desk  ',
    source: 'draft-source-hidden',
    consentConfirmed: true,
    unknownField: 'unknown-hidden',
    organizationId: 'client-org-hidden',
    actorId: 'client-actor-hidden',
    actorRole: 'admin',
    repairIntakeDraftId: 'client-draft-hidden',
    caseId: 'case-hidden',
    appointmentId: 'appointment-hidden',
    completionReportId: 'completion-hidden',
    finalAppointmentId: 'final-hidden',
    status: 'accepted',
    createdBy: 'created-hidden',
    updatedBy: 'updated-hidden',
    assignedEngineerId: 'assigned-hidden',
    engineerId: 'engineer-hidden',
    provider: 'provider-hidden',
    providerPayload: { token: 'provider-token-hidden' },
    ai: { prompt: 'ai-hidden' },
    rag: { context: 'rag-hidden' },
    billing: { amount: 1 },
    settlement: { amount: 1 },
    invoice: { id: 'invoice-hidden' },
    audit: { actor: 'audit-hidden' },
    auditActor: 'audit-actor-hidden',
    permission: 'cases.create',
    role: 'admin',
    token: 'token-hidden',
    password: 'password-hidden',
    raw: 'raw-hidden',
    rawBody: 'raw-body-hidden',
    debug: 'debug-hidden',
    internal: 'internal-hidden',
    sql: 'select * from repair_intake',
  };
}

function assertNoForbiddenCommandText(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'should-not-pass',
    'metadata-should-not-pass',
    'raw-request-token',
    'raw-body-hidden',
    'unknown-hidden',
    'draft-source-hidden',
    'client-org-hidden',
    'client-actor-hidden',
    'client-draft-hidden',
    'case-hidden',
    'appointment-hidden',
    'completion-hidden',
    'final-hidden',
    'accepted',
    'created-hidden',
    'updated-hidden',
    'assigned-hidden',
    'engineer-hidden',
    'provider-hidden',
    'provider-token-hidden',
    'ai-hidden',
    'rag-hidden',
    'invoice-hidden',
    'audit-hidden',
    'cases.create',
    'admin',
    'token-hidden',
    'password-hidden',
    'debug-hidden',
    'internal-hidden',
    'select *',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked ${marker}`);
  }
}

test('Task2192 injected service command uses explicit top-level and draftInput allowlists', async () => {
  let serviceCommand;
  const draftInputRef = unsafeDraftInput();
  const resolverResult = maliciousResolverResult(draftInputRef);
  const before = JSON.parse(JSON.stringify(resolverResult));
  const handler = createRepairIntakeDraftToCaseSyntheticHandler({
    requestContextResolver() {
      return resolverResult;
    },
    controllerAdapter: {
      submitDraftToCase(input) {
        serviceCommand = input;

        return {
          ok: true,
          status: 'created',
          messageKey: 'repair_intake_draft_to_case.created',
          reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PUBLIC_CREATED',
          caseId: 'case-public',
          repairIntakeDraftId: input.repairIntakeDraftId,
        };
      },
    },
  });

  await handler.handleDraftToCase({
    rawRequest: { token: 'raw-request-token' },
    requestBody: { draftInput: draftInputRef },
  });

  assert.deepEqual(Object.keys(serviceCommand).sort(), [...TOP_LEVEL_COMMAND_KEYS].sort());
  assert.deepEqual(Object.keys(serviceCommand.draftInput).sort(), [...DRAFT_INPUT_KEYS].sort());
  assert.deepEqual(serviceCommand, {
    organizationId: 'org-server-owned',
    actorId: 'actor-server-owned',
    repairIntakeDraftId: 'draft-server-owned',
    source: 'synthetic_handler',
    actorRole: 'service_agent',
    draftInput: {
      customerDisplayName: 'Ms. Lin',
      customerContactIntent: 'message before visit',
      customerContactMethod: 'line',
      serviceCategory: 'appliance_repair',
      problemDescription: 'dryer makes a loud noise',
      preferredTimeDescription: 'weekday evening',
      addressDescription: 'front desk',
      consentConfirmed: true,
    },
  });
  assert.notEqual(serviceCommand.draftInput, draftInputRef);
  assert.deepEqual(resolverResult, before);
  assertNoForbiddenCommandText(serviceCommand);
});

test('Task2192 server-owned context wins over client-supplied draftInput fields', async () => {
  let serviceCommand;
  const handler = createRepairIntakeDraftToCaseSyntheticHandler({
    requestContextResolver() {
      return maliciousResolverResult({
        customerDisplayName: 'Customer',
        problemDescription: 'Needs repair',
        organizationId: 'client-org-hidden',
        actorId: 'client-actor-hidden',
        actorRole: 'admin',
        repairIntakeDraftId: 'client-draft-hidden',
      });
    },
    controllerAdapter: {
      submitDraftToCase(input) {
        serviceCommand = input;
        return { ok: true };
      },
    },
  });

  await handler.handleDraftToCase({});

  assert.equal(serviceCommand.organizationId, 'org-server-owned');
  assert.equal(serviceCommand.actorId, 'actor-server-owned');
  assert.equal(serviceCommand.actorRole, 'service_agent');
  assert.equal(serviceCommand.repairIntakeDraftId, 'draft-server-owned');
  assert.deepEqual(serviceCommand.draftInput, {
    customerDisplayName: 'Customer',
    problemDescription: 'Needs repair',
  });
  assertNoForbiddenCommandText(serviceCommand);
});
