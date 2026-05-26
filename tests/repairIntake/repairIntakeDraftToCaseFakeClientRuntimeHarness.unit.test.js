'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftToCaseInjectedRouteComposition,
} = require('../../src/repairIntake/repairIntakeDraftToCaseInjectedRouteComposition');

function createSyntheticMountTarget() {
  const routeHandlers = new Map();
  const registrations = [];

  function add(method, routePath, handler) {
    registrations.push({ method, path: routePath, handler });
    routeHandlers.set(`${method.toUpperCase()} ${routePath}`, handler);
  }

  return {
    registrations,
    post: (routePath, handler) => {
      add('POST', routePath, handler);
    },
    async dispatch(method, routePath, requestLike) {
      const handler = routeHandlers.get(`${method.toUpperCase()} ${routePath}`);

      if (!handler) {
        return {
          ok: false,
          body: {
            ok: false,
            reasonCode: 'SYNTHETIC_ROUTE_NOT_FOUND',
            requiredActions: ['configure_route'],
          },
        };
      }

      const response = await handler(requestLike);

      return {
        ok: response && response.ok === true,
        body: response && (response.body || response),
      };
    },
  };
}

function requestLike(overrides = {}) {
  const request = {
    params: {
      draftId: 'draft_task1625',
      phone: '+886900001625',
    },
    body: {
      organizationId: 'org_task1625',
      tenantId: 'tenant_task1625',
      idempotencyKey: 'idem_task1625',
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
      },
      approvalContext: {
        accepted: true,
      },
      phone: '+886900001625',
      address: 'unsafe address task1625',
      customerName: 'unsafe customer task1625',
      lineUserId: 'unsafe_line_task1625',
      lineAccessToken: 'unsafe_line_token_task1625',
      finalAppointmentId: 'unsafe_final_task1625',
      DATABASE_URL: 'postgres://unsafe_task1625',
      sql: 'select * from field_service_reports where token = secret',
      providerPayload: {
        lineAccessToken: 'unsafe_provider_token_task1625',
      },
    },
    context: {
      organizationId: 'org_task1625',
      actorId: 'actor_task1625',
      requestId: 'req_task1625',
      tenantId: 'tenant_task1625',
    },
    rawBody: 'unsafe raw body task1625',
    headers: {
      authorization: 'Bearer unsafe_task1625',
      cookie: 'unsafe_cookie_task1625=1',
    },
  };

  return {
    ...request,
    ...overrides,
    body: {
      ...request.body,
      ...(overrides.body || {}),
    },
    context: {
      ...request.context,
      ...(overrides.context || {}),
    },
  };
}

function createFakeClients(calls) {
  return {
    idempotencyClient: {
      findExistingDraftToCaseResult: async (lookup) => {
        calls.push({ name: 'idempotencyClient.findExistingDraftToCaseResult', payload: lookup });
        return null;
      },
      recordDraftToCaseResult: async (input) => {
        calls.push({ name: 'idempotencyClient.recordDraftToCaseResult', payload: input });
        return {
          ok: true,
          status: 'recorded',
          submitted: true,
          reasonCode: 'IDEMPOTENCY_RECORDED_TASK1625',
          result: input.result,
          token: 'unsafe_idempotency_token_task1625',
        };
      },
    },
    draftClient: {
      findDraftForConversion: async (lookup) => {
        calls.push({ name: 'draftClient.findDraftForConversion', payload: lookup });
        return {
          id: 'draft_task1625',
          organizationId: 'org_task1625',
          tenantId: 'tenant_task1625',
          status: 'ready',
          source: 'repair_intake',
          sourceRef: 'source_task1625',
          intakeSource: 'fake_client_harness',
          reasonCode: 'DRAFT_READY_TASK1625',
          requiredActions: [],
          summary: {
            title: 'safe draft summary task1625',
            phone: '+886900001625',
          },
          phone: '+886900001625',
          address: 'unsafe address task1625',
          lineUserId: 'unsafe_draft_line_task1625',
          lineAccessToken: 'unsafe_draft_token_task1625',
          finalAppointmentId: 'unsafe_final_task1625',
          rawRows: [{ phone: '+886900001625' }],
          stack: 'unsafe_draft_stack_task1625',
        };
      },
    },
    planningClient: {
      planCaseFromDraft: async (payload) => {
        calls.push({ name: 'planningClient.planCaseFromDraft', payload });
        return {
          status: 'planned',
          reasonCode: 'PLAN_READY_TASK1625',
          requiredActions: ['prepare_case'],
          candidate: {
            sourceDraftId: 'draft_task1625',
            organizationId: 'org_task1625',
            tenantId: 'tenant_task1625',
            customerPhone: '+886900001625',
          },
          summary: {
            title: 'safe plan summary task1625',
            phone: '+886900001625',
          },
          rawRows: [{ phone: '+886900001625' }],
          finalAppointmentId: 'unsafe_final_task1625',
          providerPayload: {
            token: 'unsafe_planning_provider_token_task1625',
          },
        };
      },
    },
    caseClient: {
      createCaseFromDraft: async (payload) => {
        calls.push({ name: 'caseClient.createCaseFromDraft', payload });
        return {
          id: 'case_task1625',
          organizationId: 'org_task1625',
          tenantId: 'tenant_task1625',
          sourceDraftId: 'draft_task1625',
          status: 'created',
          reasonCode: 'CASE_CREATED_TASK1625',
          requiredActions: [],
          summary: {
            title: 'safe case summary task1625',
            phone: '+886900001625',
          },
          finalAppointmentId: 'unsafe_final_task1625',
          databaseUrl: 'postgres://unsafe_task1625',
          rawRows: [{ phone: '+886900001625' }],
          stack: 'unsafe_case_stack_task1625',
        };
      },
    },
    auditClient: {
      recordDraftToCaseDecision: async (payload) => {
        calls.push({ name: 'auditClient.recordDraftToCaseDecision', payload });
        return {
          eventType: 'repair_intake_draft_to_case_decision',
          outcome: 'submitted',
          draftId: 'draft_task1625',
          organizationId: 'org_task1625',
          tenantId: 'tenant_task1625',
          caseId: 'case_task1625',
          reasonCode: 'AUDIT_RECORDED_TASK1625',
          metadata: {
            lineUserId: 'unsafe_audit_line_task1625',
            phone: '+886900001625',
            sql: 'select * from unsafe_audit_task1625',
          },
          token: 'unsafe_audit_token_task1625',
          stack: 'unsafe_audit_stack_task1625',
        };
      },
    },
  };
}

function createRuntimePortsFromFakeClients(fakeClients) {
  return {
    idempotencyStore: fakeClients.idempotencyClient,
    draftRepository: {
      findDraftForConversion: (lookup) => (
        fakeClients.draftClient.findDraftForConversion(lookup)
      ),
    },
    planningPolicy: {
      planCaseFromDraft: (payload) => (
        fakeClients.planningClient.planCaseFromDraft(payload)
      ),
    },
    caseCreationPort: {
      createCaseFromDraft: (payload) => (
        fakeClients.caseClient.createCaseFromDraft(payload)
      ),
    },
    auditPort: {
      recordDraftToCaseDecision: (payload) => (
        fakeClients.auditClient.recordDraftToCaseDecision(payload)
      ),
    },
  };
}

function collectEntries(value, entries = []) {
  if (!value || typeof value !== 'object') {
    return entries;
  }

  for (const [key, fieldValue] of Object.entries(value)) {
    entries.push([key, fieldValue]);
    collectEntries(fieldValue, entries);
  }

  return entries;
}

function assertNoUnsafeText(value) {
  for (const [key] of collectEntries(value)) {
    if (key === 'name') {
      continue;
    }

    for (const forbiddenKey of [
      'headers',
      'authorization',
      'cookie',
      'rawBody',
      'rawRows',
      'phone',
      'address',
      'customerName',
      'lineUserId',
      'lineAccessToken',
      'finalAppointmentId',
      'databaseUrl',
      'DATABASE_URL',
      'sql',
      'token',
      'secret',
      'stack',
      'providerPayload',
    ]) {
      assert.notEqual(key, forbiddenKey, `leaked key ${forbiddenKey}`);
    }
  }

  const serialized = JSON.stringify(value);

  for (const forbiddenText of [
    '+886900001625',
    'unsafe_',
    'postgres://',
    'Bearer unsafe_task1625',
    'field_service_reports',
    'finalAppointmentId',
    'lineAccessToken',
    'lineUserId',
    'DATABASE_URL',
    'databaseUrl',
    'rawRows',
    'raw body',
    'stack',
    'token',
    'secret',
    'providerPayload',
  ]) {
    assert.equal(serialized.includes(forbiddenText), false, `leaked ${forbiddenText}`);
  }
}

function createMountedHarness(calls) {
  const fakeClients = createFakeClients(calls);
  const mountTarget = createSyntheticMountTarget();
  const summary = createRepairIntakeDraftToCaseInjectedRouteComposition({
    runtimePorts: createRuntimePortsFromFakeClients(fakeClients),
    mountTarget,
    basePath: '/fake-client-runtime',
  });

  assert.equal(summary.ok, true);
  assert.equal(summary.mounted, 2);
  assert.equal(summary.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_COMPOSITION_MOUNTED');
  assert.deepEqual(
    mountTarget.registrations.map((registration) => registration.path),
    [
      '/fake-client-runtime/repair-intake/drafts/:draftId/case/plan',
      '/fake-client-runtime/repair-intake/drafts/:draftId/case/submit',
    ],
  );
  assertNoUnsafeText(summary);

  return mountTarget;
}

test('fake-client runtime harness plans and submits through injected route composition only', async () => {
  const calls = [];
  const mountTarget = createMountedHarness(calls);

  const planResponse = await mountTarget.dispatch(
    'POST',
    '/fake-client-runtime/repair-intake/drafts/:draftId/case/plan',
    requestLike(),
  );

  assert.equal(planResponse.ok, true);
  assert.equal(planResponse.body.reasonCode, 'PLAN_READY_TASK1625');
  assert.deepEqual(calls.map((call) => call.name), [
    'draftClient.findDraftForConversion',
    'planningClient.planCaseFromDraft',
  ]);
  assertNoUnsafeText(planResponse);
  assertNoUnsafeText(calls.map((call) => call.payload));

  const submitStart = calls.length;
  const submitResponse = await mountTarget.dispatch(
    'POST',
    '/fake-client-runtime/repair-intake/drafts/:draftId/case/submit',
    requestLike(),
  );
  const submitCalls = calls.slice(submitStart);

  assert.equal(submitResponse.ok, true);
  assert.equal(submitResponse.body.reasonCode, 'CASE_CREATED_TASK1625');
  assert.deepEqual(submitCalls.map((call) => call.name), [
    'idempotencyClient.findExistingDraftToCaseResult',
    'draftClient.findDraftForConversion',
    'planningClient.planCaseFromDraft',
    'caseClient.createCaseFromDraft',
    'auditClient.recordDraftToCaseDecision',
    'idempotencyClient.recordDraftToCaseResult',
  ]);
  assertNoUnsafeText(submitResponse);
  assertNoUnsafeText(submitCalls.map((call) => call.payload));
});

test('fake-client runtime harness submit permission denial stops before fake clients', async () => {
  const calls = [];
  const mountTarget = createMountedHarness(calls);

  const response = await mountTarget.dispatch(
    'POST',
    '/fake-client-runtime/repair-intake/drafts/:draftId/case/submit',
    requestLike({
      body: {
        permissionContext: {
          canCreateCaseFromRepairIntakeDraft: false,
        },
      },
    }),
  );

  assert.equal(response.ok, false);
  assert.equal(
    response.body.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_PERMISSION_REQUIRED',
  );
  assert.deepEqual(response.body.requiredActions, ['provide_case_creation_permission']);
  assert.deepEqual(calls, []);
  assertNoUnsafeText(response);
});
