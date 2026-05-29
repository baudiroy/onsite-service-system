'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ROUTE,
  createRepairIntakeDraftToCaseSafeRouteBoundary,
} = require('../../src/repairIntake/repairIntakeDraftToCaseSafeRouteBoundary');

function request(overrides = {}) {
  return {
    params: {
      repairIntakeDraftId: 'draft_task1891',
    },
    context: {
      organizationId: 'org_task1891',
      actorId: 'actor_task1891',
      requestId: 'request_context_task1891',
    },
    requestId: 'request_task1891',
    body: {
      organizationId: 'org_body_should_not_override',
      actorId: 'actor_body_should_not_override',
      phone: 'phone',
      address: 'address',
      rawRows: [{ phone: 'phone' }],
      providerPayload: 'providerPayload',
      token: 'token',
      secret: 'secret',
    },
    ...overrides,
  };
}

function planResult(overrides = {}) {
  return {
    ok: true,
    action: 'repair_intake_draft_to_case_plan',
    draftId: 'draft_task1891',
    organizationId: 'org_task1891',
    status: 'eligible',
    reasonCode: 'candidate_ready',
    requiredActions: [],
    caseCreationAllowed: true,
    candidateReady: true,
    caseCandidate: {
      sourceDraftId: 'draft_task1891',
      organizationId: 'org_task1891',
      reporterRef: { refId: 'reporter_ref_task1891', type: 'reporter' },
      customerRef: { refId: 'customer_ref_task1891', type: 'customer' },
      billingContactRef: { refId: 'billing_ref_task1891', type: 'billing_contact' },
      onSiteContactOverrideRef: { refId: 'site_override_ref_task1891', type: 'on_site_contact_override' },
      phone: 'phone',
      address: 'address',
    },
    ...overrides,
  };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'org_body_should_not_override',
    'actor_body_should_not_override',
    'caseCandidate',
    'reporter_ref_task1891',
    'customer_ref_task1891',
    'billing_ref_task1891',
    'site_override_ref_task1891',
    'phone',
    'address',
    'rawRows',
    'providerPayload',
    'token',
    'secret',
    'stack',
    'sql',
    'DATABASE_URL',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked unsafe marker ${marker}`);
  }
}

test('safe route boundary exposes plan route only', () => {
  const boundary = createRepairIntakeDraftToCaseSafeRouteBoundary({
    planningService: { async planDraftToCase() { return planResult(); } },
  });

  assert.equal(boundary.ok, true);
  assert.equal(boundary.routes.length, 1);
  assert.deepEqual(boundary.routes[0], {
    ...ROUTE,
    handler: boundary.handlePlanRoute,
  });
  assert.equal(ROUTE.method, 'POST');
  assert.equal(ROUTE.path, '/repair-intake/drafts/:draftId/case/plan');
});

test('safe allow path calls planning service with sanitized context and returns no Case data', async () => {
  const calls = [];
  const boundary = createRepairIntakeDraftToCaseSafeRouteBoundary({
    planningService: {
      async planDraftToCase(input) {
        calls.push(input);
        return planResult();
      },
    },
  });

  const result = await boundary.handlePlanRoute(request());

  assert.deepEqual(calls, [{
    draftId: 'draft_task1891',
    organizationId: 'org_task1891',
    actorId: 'actor_task1891',
    requestId: 'request_task1891',
  }]);
  assert.deepEqual(result, {
    statusCode: 200,
    body: {
      ok: true,
      status: 'planned',
      messageKey: 'repair_intake_draft_to_case.planned',
      reasonCode: 'candidate_ready',
      caseId: null,
      repairIntakeDraftId: 'draft_task1891',
      requiredActions: [],
    },
  });
  assertNoUnsafeText(result);
});

test('missing draft id fails before planning service', async () => {
  const calls = [];
  const boundary = createRepairIntakeDraftToCaseSafeRouteBoundary({
    planningService: async (input) => {
      calls.push(input);
      return planResult();
    },
  });

  const result = await boundary.handlePlanRoute(request({ params: {} }));

  assert.deepEqual(calls, []);
  assert.equal(result.statusCode, 400);
  assert.equal(result.body.status, 'invalid_request');
  assert.equal(result.body.caseId, null);
  assert.deepEqual(result.body.requiredActions, ['provide_repair_intake_draft_id']);
});

test('missing context fails closed before planning service', async () => {
  const calls = [];
  const boundary = createRepairIntakeDraftToCaseSafeRouteBoundary({
    planningService: async (input) => {
      calls.push(input);
      return planResult();
    },
  });

  const result = await boundary.handlePlanRoute(request({ context: { organizationId: 'org_task1891' } }));

  assert.deepEqual(calls, []);
  assert.equal(result.statusCode, 403);
  assert.equal(result.body.status, 'denied');
  assert.equal(result.body.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_SAFE_ROUTE_CONTEXT_REQUIRED');
  assert.equal(result.body.caseId, null);
  assertNoUnsafeText(result);
});

test('organization mismatch maps to safe deny', async () => {
  const boundary = createRepairIntakeDraftToCaseSafeRouteBoundary({
    planningService: async () => planResult({
      ok: false,
      status: 'blocked',
      reasonCode: 'organization_scope_mismatch',
      requiredActions: ['retry_with_matching_organization_scope'],
      caseCandidate: { phone: 'phone' },
    }),
  });

  const result = await boundary.handlePlanRoute(request());

  assert.equal(result.statusCode, 403);
  assert.equal(result.body.status, 'denied');
  assert.equal(result.body.reasonCode, 'organization_scope_mismatch');
  assert.equal(result.body.caseId, null);
  assert.deepEqual(result.body.requiredActions, ['retry_with_matching_organization_scope']);
  assertNoUnsafeText(result);
});

test('duplicate review-required plan maps to non-creating review response', async () => {
  const boundary = createRepairIntakeDraftToCaseSafeRouteBoundary({
    planningService: async () => planResult({
      ok: false,
      status: 'needs_review',
      reasonCode: 'duplicate_unresolved',
      requiredActions: ['resolve_duplicate_review'],
      caseCandidate: null,
    }),
  });

  const result = await boundary.handlePlanRoute(request());

  assert.equal(result.statusCode, 202);
  assert.equal(result.body.status, 'review_required');
  assert.equal(result.body.caseId, null);
  assert.deepEqual(result.body.requiredActions, ['resolve_duplicate_review']);
  assertNoUnsafeText(result);
});

test('missing planning dependency returns unavailable without route side effects', async () => {
  const boundary = createRepairIntakeDraftToCaseSafeRouteBoundary();
  const result = await boundary.handlePlanRoute(request());

  assert.equal(result.statusCode, 503);
  assert.equal(result.body.status, 'unavailable');
  assert.equal(result.body.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_SAFE_ROUTE_PLANNER_REQUIRED');
  assert.equal(result.body.caseId, null);
  assert.deepEqual(result.body.requiredActions, ['configure_planning_service']);
});

test('planning service failure is sanitized', async () => {
  const boundary = createRepairIntakeDraftToCaseSafeRouteBoundary({
    planningService: async () => {
      throw new Error('hidden stack sql phone address providerPayload token secret DATABASE_URL');
    },
  });

  const result = await boundary.handlePlanRoute(request());

  assert.equal(result.statusCode, 503);
  assert.equal(result.body.status, 'unavailable');
  assert.equal(result.body.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_SAFE_ROUTE_PLANNER_FAILED');
  assert.equal(result.body.caseId, null);
  assertNoUnsafeText(result);
});

test('audit metadata from planning result is never exposed in public route envelope', async () => {
  const boundary = createRepairIntakeDraftToCaseSafeRouteBoundary({
    planningService: async () => planResult({
      auditEvent: {
        eventType: 'repair_intake_draft_to_case_planning_decision',
        visibility: 'internal_only',
        phone: 'phone',
        address: 'address',
        token: 'token',
        sql: 'select *',
      },
      auditRecord: {
        rawRows: [{ phone: 'phone' }],
      },
    }),
  });

  const result = await boundary.handlePlanRoute(request());

  assert.equal(result.statusCode, 200);
  assert.equal(result.body.ok, true);
  assert.equal(result.body.caseId, null);
  assert.equal(Object.prototype.hasOwnProperty.call(result.body, 'auditEvent'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.body, 'auditRecord'), false);
  assertNoUnsafeText(result);
});
