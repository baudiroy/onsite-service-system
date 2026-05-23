'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  ACTION,
  AUDIT_ATTACHMENT_REVIEW_ACTION,
  createRepairIntakeDraftCaseSubmissionService,
} = require('../../src/repairIntake/repairIntakeDraftCaseSubmissionService');

const SOURCE_PATH = path.join(__dirname, '../../src/repairIntake/repairIntakeDraftCaseSubmissionService.js');

function lookupInput(overrides = {}) {
  return {
    draftId: 'draft_task938_001',
    organizationId: 'org_task938',
    actorId: 'actor_task938',
    requestId: 'request_task938',
    idempotencyKey: 'idem_task938',
    approvalContext: {
      accepted: true,
      approvalId: 'approval_task938',
      acceptedByActorId: 'actor_task938',
    },
    permissionContext: {
      canCreateCaseFromRepairIntakeDraft: true,
      permissionSource: 'injected_test_context',
    },
    ...overrides,
  };
}

function caseCandidate(overrides = {}) {
  return {
    sourceDraftId: 'draft_task938_001',
    organizationId: 'org_task938',
    brandId: 'brand_task938',
    serviceProviderId: 'provider_task938',
    intakeSource: 'web',
    serviceType: 'onsite',
    priority: 'normal',
    reporterRef: { refId: 'reporter_ref_task938', type: 'reporter' },
    customerRef: { refId: 'customer_ref_task938', type: 'customer' },
    billingContactRef: { refId: 'billing_ref_task938', type: 'billing_contact' },
    siteRef: { refId: 'site_ref_task938', type: 'service_site' },
    issueSummaryRef: { refId: 'issue_ref_task938', type: 'issue_summary' },
    createdByActorId: 'actor_task938',
    ...overrides,
  };
}

function allowedPlan(overrides = {}) {
  return {
    ok: true,
    action: 'repair_intake_draft_to_case_plan',
    draftId: 'draft_task938_001',
    organizationId: 'org_task938',
    eligible: true,
    status: 'eligible',
    reasonCode: 'candidate_ready',
    requiredActions: [],
    caseCreationAllowed: true,
    candidateReady: true,
    caseCandidate: caseCandidate(),
    ...overrides,
  };
}

function blockedPlan(overrides = {}) {
  return {
    ok: false,
    action: 'repair_intake_draft_to_case_plan',
    draftId: 'draft_task938_001',
    organizationId: 'org_task938',
    eligible: false,
    status: 'blocked',
    reasonCode: 'duplicate_confirmed',
    requiredActions: ['link_or_close_duplicate_draft'],
    caseCreationAllowed: false,
    candidateReady: false,
    caseCandidate: null,
    ...overrides,
  };
}

function caseRef(overrides = {}) {
  return {
    id: 'case_ref_task938',
    organizationId: 'org_task938',
    sourceDraftId: 'draft_task938_001',
    status: 'created',
    ...overrides,
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertNoForbiddenFields(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'caseId',
    'case_id',
    'finalAppointmentId',
    'final_appointment_id',
    'phone',
    'address',
    'customerPayload',
    'rawImportedRowPayload',
    'rawPayload',
    'select *',
    'stack trace',
    'providerPayload',
    'token',
    'secret',
    'lineAccessToken',
    'LINE access token',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function submittedAuditEvent(overrides = {}) {
  return {
    eventType: 'repair_intake_draft_to_case_submission',
    outcome: 'submitted',
    draftId: 'draft_task938_001',
    organizationId: 'org_task938',
    actorId: 'actor_task938',
    requestId: 'request_task938',
    idempotencyKey: 'idem_task938',
    caseRef: {
      id: 'case_ref_task938',
      organizationId: 'org_task938',
      sourceDraftId: 'draft_task938_001',
      status: 'created',
    },
    reasonCode: 'CASE_REF_NORMALIZED',
    requiredActions: [],
    ...overrides,
  };
}

function createService(options = {}) {
  return createRepairIntakeDraftCaseSubmissionService({
    idempotencyChecker: async () => ({ decision: 'available' }),
    ...options,
  });
}

test('eligible plan calls injected caseCreator and returns sanitized caseRef', async () => {
  let creatorInput;
  const service = createService({
    planner: async () => allowedPlan(),
    caseCreator: async (input) => {
      creatorInput = input;

      return caseRef();
    },
  });

  const result = await service.submitDraftToCase(lookupInput());

  assert.equal(result.ok, true);
  assert.equal(result.action, ACTION);
  assert.equal(result.draftId, 'draft_task938_001');
  assert.equal(result.organizationId, 'org_task938');
  assert.equal(result.submitted, true);
  assert.equal(result.caseCreationAllowed, true);
  assert.equal(result.candidateReady, true);
  assert.equal(result.reasonCode, 'CASE_SUBMITTED');
  assert.deepEqual(result.requiredActions, []);
  assert.deepEqual(result.caseRef, {
    id: 'case_ref_task938',
    organizationId: 'org_task938',
    sourceDraftId: 'draft_task938_001',
    status: 'created',
  });
  assert.deepEqual(result.auditEvent, submittedAuditEvent());
  assert.deepEqual(creatorInput, {
    command: {
      draftId: 'draft_task938_001',
      organizationId: 'org_task938',
      actorId: 'actor_task938',
      requestId: 'request_task938',
      idempotencyKey: 'idem_task938',
    },
    caseCandidate: caseCandidate(),
  });
  assertNoForbiddenFields(result);
});

test('blocked plan does not call caseCreator', async () => {
  let called = false;
  const service = createService({
    planner: async () => blockedPlan(),
    caseCreator: async () => {
      called = true;
      return caseRef();
    },
  });

  const result = await service.submitDraftToCase(lookupInput());

  assert.equal(called, false);
  assert.equal(result.submitted, false);
  assert.equal(result.reasonCode, 'duplicate_confirmed');
  assert.deepEqual(result.requiredActions, ['link_or_close_duplicate_draft']);
  assert.equal(result.caseRef, null);
  assert.equal(result.auditEvent.outcome, 'blocked');
  assert.equal(result.auditEvent.reasonCode, 'duplicate_confirmed');
  assert.equal(result.auditEvent.caseRef, null);
});

test('needs-review plan does not call caseCreator', async () => {
  let called = false;
  const service = createService({
    planner: async () => blockedPlan({
      status: 'needs_review',
      reasonCode: 'duplicate_unresolved',
      requiredActions: ['resolve_duplicate_review'],
    }),
    caseCreator: async () => {
      called = true;
      return caseRef();
    },
  });

  const result = await service.submitDraftToCase(lookupInput());

  assert.equal(called, false);
  assert.equal(result.reasonCode, 'duplicate_unresolved');
  assert.deepEqual(result.requiredActions, ['resolve_duplicate_review']);
  assert.equal(result.auditEvent.outcome, 'blocked');
  assert.equal(result.auditEvent.reasonCode, 'duplicate_unresolved');
});

test('missing candidate does not call caseCreator', async () => {
  let called = false;
  const service = createService({
    planner: async () => allowedPlan({ caseCandidate: null }),
    caseCreator: async () => {
      called = true;
      return caseRef();
    },
  });

  const result = await service.submitDraftToCase(lookupInput());

  assert.equal(called, false);
  assert.equal(result.reasonCode, 'CASE_CANDIDATE_NOT_READY');
  assert.equal(result.caseRef, null);
  assert.equal(result.auditEvent.outcome, 'blocked');
  assert.equal(result.auditEvent.reasonCode, 'CASE_CANDIDATE_NOT_READY');
});

test('missing or invalid planner returns safe blocked envelope', async () => {
  const missing = createService({
    caseCreator: async () => caseRef(),
  });
  const invalid = createService({
    planner: {},
    caseCreator: async () => caseRef(),
  });

  const missingResult = await missing.submitDraftToCase(lookupInput());

  assert.deepEqual(missingResult, {
    ok: false,
    action: ACTION,
    draftId: 'draft_task938_001',
    organizationId: 'org_task938',
    submitted: false,
    caseCreationAllowed: false,
    candidateReady: false,
    reasonCode: 'PLANNER_NOT_CONFIGURED',
    requiredActions: ['configure_planner'],
    caseRef: null,
    auditEvent: {
      eventType: 'repair_intake_draft_to_case_submission',
      outcome: 'blocked',
      draftId: 'draft_task938_001',
      organizationId: 'org_task938',
      actorId: 'actor_task938',
      requestId: 'request_task938',
      idempotencyKey: 'idem_task938',
      caseRef: null,
      reasonCode: 'PLANNER_NOT_CONFIGURED',
      requiredActions: ['configure_planner'],
    },
  });
  assert.equal((await invalid.submitDraftToCase(lookupInput())).reasonCode, 'PLANNER_NOT_CONFIGURED');
});

test('missing or invalid caseCreator returns safe blocked envelope after allowed plan', async () => {
  const service = createService({
    planner: async () => allowedPlan(),
    caseCreator: {},
  });

  const result = await service.submitDraftToCase(lookupInput());

  assert.equal(result.reasonCode, 'CASE_CREATOR_NOT_CONFIGURED');
  assert.deepEqual(result.requiredActions, ['configure_case_creator']);
  assert.equal(result.caseRef, null);
  assert.equal(result.auditEvent.outcome, 'blocked');
  assert.equal(result.auditEvent.reasonCode, 'CASE_CREATOR_NOT_CONFIGURED');
});

test('planner receives only sanitized input', async () => {
  let plannerInput;
  const service = createService({
    planner: async (input) => {
      plannerInput = input;

      return blockedPlan();
    },
    caseCreator: async () => caseRef(),
  });

  await service.submitDraftToCase({
    ...lookupInput(),
    phone: 'phone',
    address: 'address',
    customerPayload: 'customerPayload',
    rawPayload: 'rawPayload',
  });

  assert.deepEqual(plannerInput, {
    draftId: 'draft_task938_001',
    organizationId: 'org_task938',
    actorId: 'actor_task938',
    requestId: 'request_task938',
    idempotencyKey: 'idem_task938',
  });
});

test('command guard blocks before planner and caseCreator', async () => {
  let idempotencyCalled = false;
  let plannerCalled = false;
  let creatorCalled = false;
  const service = createRepairIntakeDraftCaseSubmissionService({
    idempotencyChecker: async () => {
      idempotencyCalled = true;
      return { decision: 'available' };
    },
    planner: async () => {
      plannerCalled = true;
      return allowedPlan();
    },
    caseCreator: async () => {
      creatorCalled = true;
      return caseRef();
    },
  });

  const result = await service.submitDraftToCase(lookupInput({ idempotencyKey: '' }));

  assert.equal(idempotencyCalled, false);
  assert.equal(plannerCalled, false);
  assert.equal(creatorCalled, false);
  assert.equal(result.reasonCode, 'SUBMISSION_COMMAND_IDEMPOTENCY_KEY_MISSING');
  assert.equal(result.caseRef, null);
  assert.equal(result.auditEvent, null);
});

test('missing idempotency checker blocks before planner and caseCreator', async () => {
  let plannerCalled = false;
  let creatorCalled = false;
  const service = createRepairIntakeDraftCaseSubmissionService({
    planner: async () => {
      plannerCalled = true;
      return allowedPlan();
    },
    caseCreator: async () => {
      creatorCalled = true;
      return caseRef();
    },
  });

  const result = await service.submitDraftToCase(lookupInput());

  assert.equal(plannerCalled, false);
  assert.equal(creatorCalled, false);
  assert.equal(result.reasonCode, 'IDEMPOTENCY_CHECKER_NOT_CONFIGURED');
  assert.deepEqual(result.requiredActions, ['configure_idempotency_checker']);
  assert.equal(result.auditEvent.outcome, 'blocked');
  assert.equal(result.auditEvent.reasonCode, 'IDEMPOTENCY_CHECKER_NOT_CONFIGURED');
});

test('invalid idempotency checker blocks before planner and caseCreator', async () => {
  let plannerCalled = false;
  let creatorCalled = false;
  const service = createRepairIntakeDraftCaseSubmissionService({
    idempotencyChecker: {},
    planner: async () => {
      plannerCalled = true;
      return allowedPlan();
    },
    caseCreator: async () => {
      creatorCalled = true;
      return caseRef();
    },
  });

  const result = await service.submitDraftToCase(lookupInput());

  assert.equal(plannerCalled, false);
  assert.equal(creatorCalled, false);
  assert.equal(result.reasonCode, 'IDEMPOTENCY_CHECKER_NOT_CONFIGURED');
});

test('idempotency checker receives only sanitized command fields', async () => {
  let checkerInput;
  const service = createService({
    idempotencyChecker: async (input) => {
      checkerInput = input;
      return { decision: 'available' };
    },
    planner: async () => allowedPlan(),
    caseCreator: async () => caseRef(),
  });

  await service.submitDraftToCase(lookupInput({
    phone: 'phone',
    address: 'address',
    customerPayload: 'customerPayload',
    rawImportedRowPayload: 'rawImportedRowPayload',
    rawPayload: 'rawPayload',
    token: 'token',
    secret: 'secret',
    finalAppointmentId: 'final_should_not_copy',
  }));

  assert.deepEqual(checkerInput, {
    draftId: 'draft_task938_001',
    organizationId: 'org_task938',
    actorId: 'actor_task938',
    requestId: 'request_task938',
    idempotencyKey: 'idem_task938',
  });
});

test('idempotency conflict blocks before planner and caseCreator with sanitized existing caseRef', async () => {
  let plannerCalled = false;
  let creatorCalled = false;
  const service = createService({
    idempotencyChecker: async () => ({
      decision: 'conflict',
      caseRef: caseRef({
        phone: 'phone',
        address: 'address',
        customerPayload: 'customerPayload',
        rawImportedRowPayload: 'rawImportedRowPayload',
        finalAppointmentId: 'final_should_not_copy',
      }),
    }),
    planner: async () => {
      plannerCalled = true;
      return allowedPlan();
    },
    caseCreator: async () => {
      creatorCalled = true;
      return caseRef();
    },
  });

  const result = await service.submitDraftToCase(lookupInput());

  assert.equal(plannerCalled, false);
  assert.equal(creatorCalled, false);
  assert.equal(result.reasonCode, 'IDEMPOTENCY_CONFLICT');
  assert.deepEqual(result.requiredActions, ['REVIEW_EXISTING_DRAFT_TO_CASE_SUBMISSION']);
  assert.deepEqual(result.caseRef, caseRef());
  assert.equal(result.auditEvent.outcome, 'blocked');
  assert.deepEqual(result.auditEvent.caseRef, caseRef());
  assertNoForbiddenFields(result);
});

test('idempotency checker throw returns safe blocked envelope without raw error leakage', async () => {
  const service = createService({
    idempotencyChecker: async () => {
      throw new Error('select * stack trace providerPayload token secret phone address customerPayload lineAccessToken');
    },
    planner: async () => allowedPlan(),
    caseCreator: async () => caseRef(),
  });

  const result = await service.submitDraftToCase(lookupInput());

  assert.equal(result.ok, false);
  assert.equal(result.submitted, false);
  assert.equal(result.reasonCode, 'IDEMPOTENCY_CHECK_FAILED');
  assert.equal(result.caseRef, null);
  assert.equal(result.auditEvent.outcome, 'blocked');
  assertNoForbiddenFields(result);
});

test('idempotency failed or unknown result blocks safely', async () => {
  const failed = createService({
    idempotencyChecker: async () => ({ decision: 'failed' }),
    planner: async () => allowedPlan(),
    caseCreator: async () => caseRef(),
  });
  const unknown = createService({
    idempotencyChecker: async () => ({ decision: 'maybe' }),
    planner: async () => allowedPlan(),
    caseCreator: async () => caseRef(),
  });

  assert.equal((await failed.submitDraftToCase(lookupInput())).reasonCode, 'IDEMPOTENCY_CHECK_FAILED');
  assert.equal((await unknown.submitDraftToCase(lookupInput())).reasonCode, 'IDEMPOTENCY_RESULT_UNRECOGNIZED');
});

test('custom command guard can pass sanitized command to planner', async () => {
  let plannerInput;
  const service = createService({
    commandGuard: () => ({
      ok: true,
      reasonCode: 'CUSTOM_COMMAND_ACCEPTED',
      requiredActions: [],
      sanitizedCommand: {
        draftId: 'draft_custom_guard',
        organizationId: 'org_task938',
        actorId: 'actor_custom_guard',
        requestId: 'request_custom_guard',
        idempotencyKey: 'idem_custom_guard',
      },
    }),
    planner: async (input) => {
      plannerInput = input;
      return allowedPlan({
        draftId: 'draft_custom_guard',
        caseCandidate: caseCandidate({ sourceDraftId: 'draft_custom_guard' }),
      });
    },
    caseCreator: async () => caseRef({ sourceDraftId: 'draft_custom_guard' }),
  });

  const result = await service.submitDraftToCase(lookupInput());

  assert.deepEqual(plannerInput, {
    draftId: 'draft_custom_guard',
    organizationId: 'org_task938',
    actorId: 'actor_custom_guard',
    requestId: 'request_custom_guard',
    idempotencyKey: 'idem_custom_guard',
  });
  assert.equal(result.submitted, true);
});

test('caseCreator receives only sanitized candidate and context', async () => {
  let creatorInput;
  const service = createService({
    planner: async () => allowedPlan({
      caseCandidate: caseCandidate({
        phone: 'phone',
        address: 'address',
        customerPayload: 'customerPayload',
        rawPayload: 'rawPayload',
        token: 'token',
        secret: 'secret',
        reporterRef: {
          refId: 'reporter_ref_task938',
          type: 'reporter',
          phone: 'phone',
        },
      }),
    }),
    caseCreator: async (input) => {
      creatorInput = input;

      return caseRef();
    },
  });

  await service.submitDraftToCase(lookupInput());

  assert.deepEqual(creatorInput.caseCandidate.reporterRef, {
    refId: 'reporter_ref_task938',
    type: 'reporter',
  });
  assertNoForbiddenFields(creatorInput);
});

test('caseCreator is not called when creator input normalization blocks', async () => {
  let creatorCalled = false;
  const service = createService({
    planner: async () => allowedPlan({
      caseCandidate: caseCandidate({ organizationId: 'org_other' }),
    }),
    caseCreator: async () => {
      creatorCalled = true;
      return caseRef();
    },
  });

  const result = await service.submitDraftToCase(lookupInput());

  assert.equal(creatorCalled, false);
  assert.equal(result.reasonCode, 'CREATOR_INPUT_ORGANIZATION_MISMATCH');
  assert.equal(result.caseRef, null);
  assert.equal(result.auditEvent.outcome, 'blocked');
  assert.equal(result.auditEvent.reasonCode, 'CREATOR_INPUT_ORGANIZATION_MISMATCH');
});

test('creator result unsafe fields are stripped from caseRef', async () => {
  const service = createService({
    planner: async () => allowedPlan(),
    caseCreator: async () => caseRef({
      phone: 'phone',
      address: 'address',
      customerPayload: 'customerPayload',
      rawPayload: 'rawPayload',
      finalAppointmentId: 'final_should_not_copy',
      token: 'token',
      secret: 'secret',
    }),
  });

  const result = await service.submitDraftToCase(lookupInput());

  assert.deepEqual(result.caseRef, {
    id: 'case_ref_task938',
    organizationId: 'org_task938',
    sourceDraftId: 'draft_task938_001',
    status: 'created',
  });
  assertNoForbiddenFields(result);
});

test('creator result normalization blocks organization mismatch', async () => {
  const service = createService({
    planner: async () => allowedPlan(),
    caseCreator: async () => caseRef({ organizationId: 'org_other' }),
  });

  const result = await service.submitDraftToCase(lookupInput());

  assert.equal(result.reasonCode, 'CASE_REF_ORGANIZATION_MISMATCH');
  assert.deepEqual(result.requiredActions, ['manual_review']);
  assert.equal(result.caseRef, null);
  assert.equal(result.auditEvent.outcome, 'failed');
  assert.equal(result.auditEvent.reasonCode, 'CASE_REF_ORGANIZATION_MISMATCH');
});

test('creator throwing returns safe failed envelope without raw error leakage', async () => {
  const service = createService({
    planner: async () => allowedPlan(),
    caseCreator: async () => {
      throw new Error('select * stack trace providerPayload token secret phone address customerPayload');
    },
  });

  const result = await service.submitDraftToCase(lookupInput());

  assert.equal(result.reasonCode, 'CASE_CREATOR_FAILED');
  assert.deepEqual(result.requiredActions, ['retry_or_manual_review']);
  assert.equal(result.caseRef, null);
  assert.equal(result.auditEvent.outcome, 'failed');
  assert.equal(result.auditEvent.reasonCode, 'CASE_CREATOR_FAILED');
  assertNoForbiddenFields(result);
});

test('no generated caseId when creator is not called', async () => {
  const service = createService({
    planner: async () => blockedPlan(),
    caseCreator: async () => caseRef(),
  });

  const result = await service.submitDraftToCase(lookupInput());

  assert.equal(result.submitted, false);
  assertNoForbiddenFields(result);
});

test('input is not mutated', async () => {
  const service = createService({
    planner: async () => allowedPlan(),
    caseCreator: async () => caseRef(),
  });
  const input = lookupInput();
  const before = clone(input);

  await service.submitDraftToCase(input);

  assert.deepEqual(input, before);
});

test('object planner and caseCreator methods are supported', async () => {
  const service = createService({
    planner: {
      async planDraftToCase() {
        return allowedPlan();
      },
    },
    caseCreator: {
      async createCaseFromCandidate() {
        return caseRef();
      },
    },
  });

  const result = await service.submitDraftToCase(lookupInput());

  assert.equal(result.submitted, true);
});

test('custom injected audit event builder is supported', async () => {
  let auditInput;
  const service = createService({
    planner: async () => allowedPlan(),
    caseCreator: async () => caseRef(),
    auditEventBuilder: (input) => {
      auditInput = input;

      return {
        ok: true,
        auditEvent: {
          eventType: 'repair_intake_draft_to_case_submission',
          outcome: input.outcome,
          draftId: input.sanitizedCommand.draftId,
          organizationId: input.sanitizedCommand.organizationId,
          actorId: input.sanitizedCommand.actorId,
          requestId: input.sanitizedCommand.requestId,
          idempotencyKey: input.sanitizedCommand.idempotencyKey,
          caseRef: input.submissionResult.caseRef,
          reasonCode: 'CUSTOM_AUDIT_EVENT',
          requiredActions: [],
        },
      };
    },
  });

  const result = await service.submitDraftToCase(lookupInput());

  assert.equal(auditInput.outcome, 'submitted');
  assert.deepEqual(auditInput.sanitizedCommand, {
    draftId: 'draft_task938_001',
    organizationId: 'org_task938',
    actorId: 'actor_task938',
    requestId: 'request_task938',
    idempotencyKey: 'idem_task938',
  });
  assert.equal(result.auditEvent.reasonCode, 'CUSTOM_AUDIT_EVENT');
});

test('audit event builder throwing does not throw from submission service', async () => {
  const service = createService({
    planner: async () => allowedPlan(),
    caseCreator: async () => caseRef(),
    auditEventBuilder: () => {
      throw new Error('select * stack trace providerPayload token secret phone address customerPayload lineAccessToken');
    },
  });

  const result = await service.submitDraftToCase(lookupInput());

  assert.equal(result.ok, true);
  assert.equal(result.submitted, true);
  assert.equal(result.reasonCode, 'CASE_SUBMITTED');
  assert.deepEqual(result.requiredActions, [AUDIT_ATTACHMENT_REVIEW_ACTION]);
  assert.equal(result.auditEvent, null);
  assertNoForbiddenFields(result);
});

test('audit event builder failure does not change successful submission into failed submission', async () => {
  const service = createService({
    planner: async () => allowedPlan(),
    caseCreator: async () => caseRef(),
    auditEventBuilder: () => ({
      ok: false,
      reasonCode: 'AUDIT_EVENT_NOT_BUILT',
      requiredActions: ['manual_review'],
      auditEvent: null,
    }),
  });

  const result = await service.submitDraftToCase(lookupInput());

  assert.equal(result.ok, true);
  assert.equal(result.submitted, true);
  assert.equal(result.reasonCode, 'CASE_SUBMITTED');
  assert.deepEqual(result.requiredActions, [AUDIT_ATTACHMENT_REVIEW_ACTION]);
  assert.equal(result.auditEvent, null);
});

test('auditEvent does not include raw phone address customer SQL stack provider token secret LINE token finalAppointmentId or unsafe caseId', async () => {
  const service = createService({
    planner: async () => allowedPlan({
      caseCandidate: caseCandidate({
        phone: 'phone',
        address: 'address',
        customerPayload: 'customerPayload',
        rawImportedRowPayload: 'rawImportedRowPayload',
        sql: 'select *',
        stack: 'stack trace',
        providerPayload: 'providerPayload',
        token: 'token',
        secret: 'secret',
        lineAccessToken: 'LINE access token',
        caseId: 'unsafe_case_id',
        finalAppointmentId: 'final_should_not_copy',
      }),
    }),
    caseCreator: async () => caseRef({
      phone: 'phone',
      address: 'address',
      customerPayload: 'customerPayload',
      rawImportedRowPayload: 'rawImportedRowPayload',
      sql: 'select *',
      stack: 'stack trace',
      providerPayload: 'providerPayload',
      token: 'token',
      secret: 'secret',
      lineAccessToken: 'LINE access token',
      caseId: 'unsafe_case_id',
      finalAppointmentId: 'final_should_not_copy',
    }),
  });

  const result = await service.submitDraftToCase(lookupInput({
    phone: 'phone',
    address: 'address',
    customerPayload: 'customerPayload',
    rawImportedRowPayload: 'rawImportedRowPayload',
    sql: 'select *',
    stack: 'stack trace',
    providerPayload: 'providerPayload',
    token: 'token',
    secret: 'secret',
    lineAccessToken: 'LINE access token',
    caseId: 'unsafe_case_id',
    finalAppointmentId: 'final_should_not_copy',
  }));

  assert.equal(result.auditEvent.caseRef.id, 'case_ref_task938');
  assertNoForbiddenFields(result.auditEvent);
});

test('existing submission envelope fields remain stable with only auditEvent added', async () => {
  const service = createService({
    planner: async () => allowedPlan(),
    caseCreator: async () => caseRef(),
  });

  const result = await service.submitDraftToCase(lookupInput());

  assert.deepEqual(Object.keys(result), [
    'ok',
    'action',
    'draftId',
    'organizationId',
    'submitted',
    'caseCreationAllowed',
    'candidateReady',
    'reasonCode',
    'requiredActions',
    'caseRef',
    'auditEvent',
  ]);
});

test('submission service delegates final return paths through envelope normalizer', () => {
  const source = fs.readFileSync(SOURCE_PATH, 'utf8');

  assert.equal(source.includes('normalizeRepairIntakeDraftCaseSubmissionEnvelope'), true);
  assert.equal(source.includes("require('./repairIntakeDraftCaseSubmissionEnvelopeNormalizer')"), true);
});

test('source has no DB repository provider or audit dependencies', () => {
  const source = fs.readFileSync(SOURCE_PATH, 'utf8');

  for (const forbidden of [
    'Repository',
    'query(',
    'execute(',
    'store.',
    'defaultChecker',
    'defaultIdempotencyChecker',
    'auditWriter',
    'defaultAuditWriter',
    'axios',
    'fetch(',
  ]) {
    assert.equal(source.includes(forbidden), false, `source should not include ${forbidden}`);
  }
});
