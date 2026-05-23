'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  RepairIntakeDraftCaseControllerAdapterError,
  createRepairIntakeDraftCaseControllerAdapter,
} = require('../../src/repairIntake/repairIntakeDraftCaseControllerAdapter');

const SOURCE_PATH = path.join(__dirname, '../../src/repairIntake/repairIntakeDraftCaseControllerAdapter.js');

function requestLike(overrides = {}) {
  return {
    params: {
      draftId: 'draft_task959_001',
      unsafe: 'ignored',
    },
    body: {
      organizationId: 'org_body_task959',
      idempotencyKey: 'idem_task959',
      approvalContext: {
        accepted: true,
        approvalId: 'approval_task959',
        acceptedByActorId: 'actor_task959',
      },
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
        permissionSource: 'unit_test',
      },
      phone: '+886900000000',
      fullAddress: 'unsafe address',
      customerPayload: { raw: true },
      finalAppointmentId: 'final_task959',
    },
    headers: {
      authorization: 'Bearer unsafe_token',
      'x-line-access-token': 'unsafe_line_token',
      'x-sql': 'select * from unsafe',
    },
    context: {
      organizationId: 'org_context_task959',
      actorId: 'actor_task959',
      requestId: 'request_task959',
      phone: '+886911111111',
      token: 'context_token',
    },
    ...overrides,
  };
}

function planResult(overrides = {}) {
  return {
    ok: true,
    action: 'repair_intake_draft_to_case_plan',
    draftId: 'draft_task959_001',
    organizationId: 'org_context_task959',
    eligible: true,
    status: 'eligible',
    reasonCode: 'candidate_ready',
    requiredActions: [],
    caseCreationAllowed: true,
    candidateReady: true,
    caseCandidate: {
      sourceDraftId: 'draft_task959_001',
      organizationId: 'org_context_task959',
      brandId: 'brand_task959',
      serviceProviderId: 'provider_task959',
      intakeSource: 'web',
      serviceType: 'onsite',
      priority: 'normal',
      reporterRef: { refId: 'reporter_ref_task959', type: 'reporter', phone: 'unsafe' },
      customerRef: { refId: 'customer_ref_task959', type: 'customer', address: 'unsafe' },
      billingContactRef: { refId: 'billing_ref_task959', type: 'billing_contact' },
      siteRef: { refId: 'site_ref_task959', type: 'service_site' },
      issueSummaryRef: { refId: 'issue_ref_task959', type: 'issue_summary' },
      createdByActorId: 'actor_task959',
      rawCustomerPayload: { unsafe: true },
    },
    ...overrides,
  };
}

function submitResult(overrides = {}) {
  return {
    ok: true,
    action: 'repair_intake_draft_to_case_submit',
    draftId: 'draft_task959_001',
    organizationId: 'org_context_task959',
    submitted: true,
    caseCreationAllowed: true,
    candidateReady: true,
    reasonCode: 'CASE_SUBMITTED',
    requiredActions: [],
    caseRef: {
      id: 'case_task959_001',
      organizationId: 'org_context_task959',
      sourceDraftId: 'draft_task959_001',
      status: 'created',
      sql: 'select *',
      token: 'unsafe',
    },
    auditEvent: {
      eventType: 'repair_intake_draft_to_case_submission',
      outcome: 'submitted',
      draftId: 'draft_task959_001',
      organizationId: 'org_context_task959',
      actorId: 'actor_task959',
      requestId: 'request_task959',
      idempotencyKey: 'idem_task959',
      caseRef: {
        id: 'case_task959_001',
        organizationId: 'org_context_task959',
        sourceDraftId: 'draft_task959_001',
        status: 'created',
      },
      reasonCode: 'CASE_REF_NORMALIZED',
      requiredActions: [],
      stack: 'stack trace',
    },
    rows: [{ phone: 'unsafe' }],
    finalAppointmentId: 'final_task959',
    ...overrides,
  };
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
    'rawCustomerPayload',
    'rawPayload',
    'select *',
    'stack trace',
    'providerPayload',
    'token',
    'secret',
    'lineAccessToken',
    'LINE access token',
    'authorization',
    'rows',
    'sql',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('factory requires injected application service', () => {
  assert.throws(
    () => createRepairIntakeDraftCaseControllerAdapter(),
    (error) => {
      assert.equal(error instanceof RepairIntakeDraftCaseControllerAdapterError, true);
      assert.equal(
        error.reasonCode,
        'REPAIR_INTAKE_DRAFT_CASE_CONTROLLER_APPLICATION_SERVICE_REQUIRED',
      );
      assertNoForbiddenFields(error);
      return true;
    },
  );
});

test('plan handler calls applicationService.planDraftToCase with sanitized input only', async () => {
  const calls = [];
  const adapter = createRepairIntakeDraftCaseControllerAdapter({
    applicationService: {
      planDraftToCase: async (input) => {
        calls.push(input);
        return planResult();
      },
    },
  });

  const result = await adapter.planDraftToCase(requestLike());

  assert.deepEqual(calls, [{
    draftId: 'draft_task959_001',
    organizationId: 'org_context_task959',
    actorId: 'actor_task959',
    requestId: 'request_task959',
    idempotencyKey: 'idem_task959',
    approvalContext: {
      accepted: true,
      approvalId: 'approval_task959',
      acceptedByActorId: 'actor_task959',
    },
    permissionContext: {
      canCreateCaseFromRepairIntakeDraft: true,
      permissionSource: 'unit_test',
    },
  }]);
  assert.equal(result.statusCode, 200);
  assert.equal(result.ok, true);
  assert.equal(result.body.reasonCode, 'candidate_ready');
  assert.equal(result.body.caseCandidate.sourceDraftId, 'draft_task959_001');
  assertNoForbiddenFields(result);
});

test('submit handler calls applicationService.submitDraftToCase with sanitized input only', async () => {
  const calls = [];
  const adapter = createRepairIntakeDraftCaseControllerAdapter({
    applicationService: {
      submitDraftToCase: async (input) => {
        calls.push(input);
        return submitResult();
      },
    },
  });

  const result = await adapter.submitDraftToCase(requestLike());

  assert.equal(calls.length, 1);
  assert.equal(calls[0].draftId, 'draft_task959_001');
  assert.equal(calls[0].organizationId, 'org_context_task959');
  assert.equal(calls[0].actorId, 'actor_task959');
  assert.equal(calls[0].requestId, 'request_task959');
  assert.equal(calls[0].idempotencyKey, 'idem_task959');
  assert.equal(JSON.stringify(calls[0]).includes('unsafe'), false);
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.submitted, true);
  assert.deepEqual(result.body.caseRef, {
    id: 'case_task959_001',
    organizationId: 'org_context_task959',
    sourceDraftId: 'draft_task959_001',
    status: 'created',
  });
  assertNoForbiddenFields(result);
});

test('params body and context precedence is deterministic', async () => {
  const calls = [];
  const adapter = createRepairIntakeDraftCaseControllerAdapter({
    applicationService: {
      planDraftToCase: async (input) => {
        calls.push(input);
        return planResult({
          draftId: input.draftId,
          organizationId: input.organizationId,
        });
      },
    },
  });

  await adapter.planDraftToCase(requestLike({
    params: {
      draftId: 'draft_from_params',
    },
    body: {
      draftId: 'ignored_body_draft',
      organizationId: 'org_from_body',
      idempotencyKey: 'idem_from_body',
      approvalContext: {
        accepted: true,
      },
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
      },
    },
    context: {
      organizationId: 'org_from_context',
      actorId: 'actor_from_context',
      requestId: 'request_from_context',
    },
  }));

  assert.deepEqual(calls[0], {
    draftId: 'draft_from_params',
    organizationId: 'org_from_context',
    actorId: 'actor_from_context',
    requestId: 'request_from_context',
    idempotencyKey: 'idem_from_body',
    approvalContext: {
      accepted: true,
      approvalId: undefined,
      acceptedByActorId: undefined,
    },
    permissionContext: {
      canCreateCaseFromRepairIntakeDraft: true,
      permissionSource: undefined,
    },
  });
});

test('unsafe body and header fields are ignored', async () => {
  let observed;
  const adapter = createRepairIntakeDraftCaseControllerAdapter({
    applicationService: {
      submitDraftToCase: async (input) => {
        observed = input;
        return submitResult();
      },
    },
  });

  await adapter.submitDraftToCase(requestLike({
    body: {
      organizationId: 'org_body_task959',
      idempotencyKey: 'idem_task959',
      token: 'body_token',
      secret: 'body_secret',
      rawPayload: { sql: 'select *' },
      approvalContext: {
        accepted: true,
      },
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
      },
    },
    headers: {
      authorization: 'Bearer unsafe',
      token: 'header_token',
      lineAccessToken: 'header_line_token',
    },
  }));

  assertNoForbiddenFields(observed);
});

test('blocked submit maps to safe non-2xx status', async () => {
  const adapter = createRepairIntakeDraftCaseControllerAdapter({
    applicationService: {
      submitDraftToCase: async () => submitResult({
        ok: false,
        submitted: false,
        reasonCode: 'duplicate_confirmed',
        requiredActions: ['link_or_close_duplicate_draft'],
        caseRef: null,
      }),
    },
  });

  const result = await adapter.submitDraftToCase(requestLike());

  assert.equal(result.ok, false);
  assert.equal(result.statusCode, 409);
  assert.equal(result.body.reasonCode, 'duplicate_confirmed');
  assert.deepEqual(result.body.requiredActions, ['link_or_close_duplicate_draft']);
  assertNoForbiddenFields(result);
});

test('invalid service method maps to generic 500 without raw leakage', async () => {
  const adapter = createRepairIntakeDraftCaseControllerAdapter({
    applicationService: {},
  });

  const result = await adapter.submitDraftToCase(requestLike());

  assert.equal(result.ok, false);
  assert.equal(result.statusCode, 500);
  assert.equal(result.body.reasonCode, 'CONTROLLER_APPLICATION_SERVICE_NOT_CONFIGURED');
  assert.deepEqual(result.body.requiredActions, ['configure_application_service']);
  assertNoForbiddenFields(result);
});

test('service throw maps to generic 500 without raw error leakage', async () => {
  const adapter = createRepairIntakeDraftCaseControllerAdapter({
    applicationService: {
      submitDraftToCase: async () => {
        throw new Error('raw SQL stack trace token secret finalAppointmentId');
      },
    },
  });

  const result = await adapter.submitDraftToCase(requestLike());

  assert.equal(result.ok, false);
  assert.equal(result.statusCode, 500);
  assert.equal(result.body.reasonCode, 'CONTROLLER_APPLICATION_SERVICE_FAILED');
  assert.deepEqual(result.body.requiredActions, ['retry_or_manual_review']);
  assertNoForbiddenFields(result);
});

test('source has no route app DB provider AI admin billing smoke or OpenAPI imports', () => {
  const source = fs.readFileSync(SOURCE_PATH, 'utf8');

  assert.equal(source.includes('require('), false);

  for (const forbidden of [
    '../app',
    '../server',
    '../routes',
    '../controllers',
    '../repositories',
    '../providers',
    '../ai',
    '../admin',
    '../billing',
    '../smoke',
    '../migrations',
    '../db',
    'openapi',
    'process.env',
    'pg',
    'knex',
    'sequelize',
  ]) {
    assert.equal(source.includes(forbidden), false, `source imports forbidden runtime ${forbidden}`);
  }
});
