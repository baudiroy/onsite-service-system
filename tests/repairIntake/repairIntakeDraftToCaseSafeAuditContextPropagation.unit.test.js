'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { createAppRouter } = require('../../src/routes');
const {
  REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION,
  REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH,
} = require('../../src/routes/repairIntakeDraftToCase.routes');
const {
  createRepairIntakeAuditWriterPortAdapter,
} = require('../../src/repairIntake/repairIntakeAuditWriterPortAdapter');
const {
  createRepairIntakeDraftToCaseSyntheticHandler,
} = require('../../src/repairIntake/repairIntakeDraftToCaseSyntheticHandler');

function createResponse() {
  return {
    statusCalls: [],
    jsonCalls: [],
    status(statusCode) {
      this.statusCalls.push(statusCode);
      return this;
    },
    json(body) {
      this.jsonCalls.push(body);
      return this;
    },
  };
}

function findRoute(expressRouter, method, pathname) {
  return expressRouter.stack.find((layer) => (
    layer
    && layer.route
    && layer.route.path === pathname
    && layer.route.methods[method.toLowerCase()]
  ));
}

async function invokeRoute(route, req) {
  const res = createResponse();
  const stack = route.route.stack;
  let routeError = null;

  await new Promise((resolve) => {
    const maybePromise = stack[0].handle(req, res, (error) => {
      routeError = error || null;
      resolve();
    });

    if (maybePromise && typeof maybePromise.then === 'function') {
      maybePromise.catch((error) => {
        routeError = error;
        resolve();
      });
    }
  });

  if (!routeError) {
    await stack[1].handle(req, res, (error) => {
      routeError = error || null;
    });
  }

  return {
    error: routeError,
    res,
  };
}

function unsafeAdminRequest(overrides = {}) {
  return {
    params: {
      draftId: 'draft-audit-safe-2207',
    },
    body: {
      organizationId: 'org-body-should-not-audit-2207',
      actorId: 'actor-body-should-not-audit-2207',
      actorRole: 'admin',
      requestId: 'req-body-should-not-audit-2207',
      correlationId: 'corr-body-should-not-audit-2207',
      traceId: 'trace-body-should-not-audit-2207',
      debugId: 'debug-body-should-not-audit-2207',
      audit: { actorId: 'audit-body-should-not-win-2207' },
      auditActor: { actorId: 'audit-actor-should-not-win-2207' },
      auditContext: { organizationId: 'audit-context-should-not-win-2207' },
      providerPayload: { token: 'hidden-provider-token-2207' },
      ai: { debug: 'hidden-ai-debug-2207' },
      rag: { debug: 'hidden-rag-debug-2207' },
      billing: { internal: 'hidden-billing-2207' },
      settlement: { internal: 'hidden-settlement-2207' },
      invoice: { internal: 'hidden-invoice-2207' },
      token: 'hidden-token-2207',
      password: 'hidden-password-2207',
      sql: 'hidden-sql-2207',
      stack: 'hidden-stack-2207',
      rawBody: 'hidden-raw-body-2207',
      draftInput: {
        organizationId: 'draft-org-should-not-audit-2207',
        actorId: 'draft-actor-should-not-audit-2207',
        requestId: 'draft-request-should-not-audit-2207',
        auditContext: { actorId: 'draft-audit-should-not-win-2207' },
        providerPayload: { token: 'draft-provider-hidden-2207' },
        customerPhone: 'hidden-phone-2207',
        address: 'hidden-address-2207',
      },
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: false,
      },
      approvalContext: {
        accepted: true,
      },
    },
    context: {
      organizationId: 'org-context-should-not-win-2207',
      actorId: 'actor-context-should-not-win-2207',
      requestId: 'req-context-should-not-win-2207',
    },
    requestId: 'req-trusted-2207',
    idempotencyKey: 'idem-trusted-2207',
    user: {
      id: 'actor-trusted-2207',
      organizationId: 'org-trusted-2207',
      tenantId: 'tenant-trusted-2207',
      permissions: [REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION],
    },
    ...overrides,
  };
}

function createRuntimePorts(auditCalls, options = {}) {
  return {
    idempotencyStore: {
      findExistingDraftToCaseResult: async () => null,
      recordDraftToCaseResult: async (input) => ({
        ok: true,
        status: 'recorded',
        result: input.result,
      }),
    },
    draftRepository: {
      findDraftForConversion: async () => ({
        id: 'draft-audit-safe-2207',
        organizationId: 'org-trusted-2207',
        tenantId: 'tenant-trusted-2207',
        status: 'ready',
        summary: { title: 'safe audit context draft' },
        phone: 'hidden-phone-2207',
        address: 'hidden-address-2207',
        rawRows: [{ token: 'hidden-draft-row-2207' }],
      }),
    },
    planningPolicy: {
      planCaseFromDraft: async () => ({
        status: 'planned',
        reasonCode: 'REPAIR_INTAKE_AUDIT_CONTEXT_PLAN_READY',
        candidate: {
          sourceDraftId: 'draft-audit-safe-2207',
          organizationId: 'org-trusted-2207',
        },
        rawRows: [{ token: 'hidden-plan-row-2207' }],
      }),
    },
    caseCreationPort: {
      createCaseFromDraft: async () => ({
        id: 'case-audit-safe-2207',
        organizationId: 'org-trusted-2207',
        sourceDraftId: 'draft-audit-safe-2207',
        status: 'created',
        databaseUrl: 'postgres://hidden-2207',
      }),
    },
    auditPort: {
      recordDraftToCaseDecision: async (input) => {
        auditCalls.push(input);

        if (options.auditThrows) {
          throw new Error('hidden-audit-writer-error-2207 hidden-sql-2207 hidden-stack-2207');
        }

        return {
          eventType: 'repair_intake_draft_to_case_decision',
          outcome: 'submitted',
          draftId: input.draftId,
          organizationId: input.organizationId,
          actorId: input.actorId,
          requestId: input.requestId,
          stack: 'hidden-audit-stack-2207',
          token: 'hidden-audit-token-2207',
        };
      },
    },
  };
}

function resolvedDeniedContext(overrides = {}) {
  return {
    ok: true,
    status: 'resolved',
    messageKey: 'repair_intake_draft_to_case.request_context_resolved',
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_REQUEST_CONTEXT_RESOLVED',
    organizationId: 'org-denied-audit-2207',
    actorId: 'actor-denied-audit-2207',
    actorRole: 'customer',
    repairIntakeDraftId: 'draft-denied-audit-2207',
    source: 'synthetic_handler',
    draftInput: {
      actorId: 'draft-denied-actor-should-not-win-2207',
      auditContext: { actorId: 'draft-audit-context-hidden-2207' },
      customerPhone: 'hidden-denied-phone-2207',
      address: 'hidden-denied-address-2207',
      providerPayload: { token: 'hidden-denied-provider-2207' },
      ai: { debug: 'hidden-denied-ai-2207' },
      rag: { debug: 'hidden-denied-rag-2207' },
      billing: { internal: 'hidden-denied-billing-2207' },
      token: 'hidden-denied-token-2207',
      sql: 'hidden-denied-sql-2207',
      stack: 'hidden-denied-stack-2207',
    },
    rawBody: 'hidden-denied-raw-body-2207',
    rawRequest: 'hidden-denied-raw-request-2207',
    ...overrides,
  };
}

function createDeniedFlow(options = {}) {
  const adapterCalls = [];
  const auditCalls = [];
  const context = options.context || resolvedDeniedContext();
  const handler = createRepairIntakeDraftToCaseSyntheticHandler({
    requestContextResolver() {
      return context;
    },
    controllerAdapter: {
      submitDraftToCase(input) {
        adapterCalls.push(input);

        return {
          ok: true,
          status: 'created',
          caseId: 'case-should-not-be-created-2207',
        };
      },
    },
    permissionDeniedAuditWriter: options.auditWriter === undefined ? {
      recordRepairIntakeDraftToCasePermissionDenied(payload) {
        auditCalls.push(payload);
      },
    } : options.auditWriter,
  });

  return {
    adapterCalls,
    auditCalls,
    context,
    handler,
  };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'should-not-audit-2207',
    'should-not-win-2207',
    'draft-org-should-not-audit-2207',
    'draft-actor-should-not-audit-2207',
    'draft-request-should-not-audit-2207',
    'hidden-provider-token-2207',
    'hidden-ai-debug-2207',
    'hidden-rag-debug-2207',
    'hidden-billing-2207',
    'hidden-settlement-2207',
    'hidden-invoice-2207',
    'hidden-token-2207',
    'hidden-password-2207',
    'hidden-sql-2207',
    'hidden-stack-2207',
    'hidden-raw-body-2207',
    'hidden-phone-2207',
    'hidden-address-2207',
    'hidden-audit-stack-2207',
    'hidden-audit-token-2207',
    'hidden-audit-writer-error-2207',
    'hidden-denied',
    'providerPayload',
    'auditContext',
    'auditActor',
    'rawBody',
    'rawRequest',
    'customerPhone',
    'password',
    'token',
    'billing',
    'settlement',
    'invoice',
    'debug',
    'stack',
    'sql',
    'postgres://',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked unsafe marker ${marker}`);
  }
}

test('admin injected path sends trusted sanitized audit context to audit port', async () => {
  const auditCalls = [];
  const appRouter = createAppRouter({
    repairIntakeDraftToCaseRoutesEnabled: true,
    repairIntakeDraftToCaseRuntimePorts: createRuntimePorts(auditCalls),
  });
  const route = findRoute(appRouter, 'post', REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH);
  const req = unsafeAdminRequest();
  const before = structuredClone(req);

  const output = await invokeRoute(route, req);

  assert.ifError(output.error);
  assert.deepEqual(output.res.statusCalls, [200]);
  assert.equal(output.res.jsonCalls[0].ok, true);
  assert.equal(auditCalls.length, 1);

  const auditInput = auditCalls[0];

  assert.equal(auditInput.organizationId, 'org-trusted-2207');
  assert.equal(auditInput.tenantId, 'tenant-trusted-2207');
  assert.equal(auditInput.draftId, 'draft-audit-safe-2207');
  assert.equal(auditInput.repairIntakeDraftId, 'draft-audit-safe-2207');
  assert.equal(auditInput.actorId, 'actor-trusted-2207');
  assert.equal(auditInput.requestId, 'req-trusted-2207');
  assert.equal(auditInput.decision, 'submitted');
  assert.equal(auditInput.caseRef.id, 'case-audit-safe-2207');
  assertNoUnsafeText(auditInput);
  assertNoUnsafeText(output.res.jsonCalls);
  assert.deepEqual(req, before);
});

test('audit writer port adapter keeps explicit trusted actor role source and request context', async () => {
  const auditPortCalls = [];
  const adapter = createRepairIntakeAuditWriterPortAdapter({
    auditPort: {
      recordDraftToCaseDecision(input) {
        auditPortCalls.push(input);

        return {
          ok: true,
          outcome: 'submitted',
          draftId: input.draftId,
          organizationId: input.organizationId,
        };
      },
    },
  });
  const input = {
    draftId: 'draft-adapter-audit-2207',
    repairIntakeDraftId: 'draft-adapter-audit-2207',
    organizationId: 'org-adapter-audit-2207',
    tenantId: 'tenant-adapter-audit-2207',
    actorId: 'actor-adapter-audit-2207',
    actorRole: 'service_agent',
    requestId: 'req-adapter-audit-2207',
    source: 'route_adapter_contract',
    decision: 'submitted',
    body: {
      actorId: 'body-adapter-actor-should-not-win-2207',
      auditContext: { actorId: 'body-adapter-audit-should-not-win-2207' },
      rawBody: 'hidden-raw-body-2207',
    },
    draft: {
      id: 'draft-adapter-audit-2207',
      organizationId: 'org-adapter-audit-2207',
      tenantId: 'tenant-adapter-audit-2207',
      status: 'ready',
      source: 'body-source-should-not-win-2207',
      rawRows: [{ token: 'hidden-draft-row-2207' }],
    },
    plan: {
      status: 'planned',
      reasonCode: 'PLAN_READY_2207',
      rawRows: [{ token: 'hidden-plan-row-2207' }],
    },
    caseRef: {
      id: 'case-adapter-audit-2207',
      organizationId: 'org-adapter-audit-2207',
      sourceDraftId: 'draft-adapter-audit-2207',
      status: 'created',
      databaseUrl: 'postgres://hidden-2207',
    },
  };
  const before = structuredClone(input);

  const result = await adapter.recordDraftToCaseDecision(input);

  assert.equal(result.ok, true);
  assert.equal(auditPortCalls.length, 1);
  assert.equal(auditPortCalls[0].organizationId, 'org-adapter-audit-2207');
  assert.equal(auditPortCalls[0].actorId, 'actor-adapter-audit-2207');
  assert.equal(auditPortCalls[0].actorRole, 'service_agent');
  assert.equal(auditPortCalls[0].requestId, 'req-adapter-audit-2207');
  assert.equal(auditPortCalls[0].source, 'route_adapter_contract');
  assert.equal(auditPortCalls[0].repairIntakeDraftId, 'draft-adapter-audit-2207');
  assertNoUnsafeText(auditPortCalls[0]);
  assert.deepEqual(input, before);
});

test('permission-denied audit absence and failure remain safe without adapter invocation', async () => {
  const missingWriterFlow = createDeniedFlow({ auditWriter: null });
  const missingWriterInput = unsafeAdminRequest();
  const failureFlow = createDeniedFlow({
    auditWriter: {
      recordPermissionDenied() {
        throw new Error('hidden-denied-audit-writer-error-2207 hidden-denied-sql-2207');
      },
    },
  });

  const missingWriterResult = await missingWriterFlow.handler.handleDraftToCase(missingWriterInput);
  const failureResult = await failureFlow.handler.handleDraftToCase(unsafeAdminRequest());

  assert.equal(missingWriterFlow.adapterCalls.length, 0);
  assert.equal(missingWriterFlow.auditCalls.length, 0);
  assert.equal(missingWriterResult.ok, false);
  assert.equal(missingWriterResult.status, 'denied');
  assert.equal(failureFlow.adapterCalls.length, 0);
  assert.equal(failureResult.ok, false);
  assert.equal(failureResult.status, 'denied');
  assertNoUnsafeText(missingWriterResult);
  assertNoUnsafeText(failureResult);
});

test('permission-denied audit intent uses trusted resolver context only', async () => {
  const flow = createDeniedFlow();
  const input = unsafeAdminRequest();
  const beforeInput = structuredClone(input);
  const beforeContext = structuredClone(flow.context);

  const result = await flow.handler.handleDraftToCase(input);

  assert.equal(flow.adapterCalls.length, 0);
  assert.equal(flow.auditCalls.length, 1);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_PERMISSION_GATE_ROLE_NOT_ALLOWED');
  assert.deepEqual(flow.auditCalls[0], {
    auditIntent: {
      eventType: 'repair_intake_draft_to_case_permission_denied',
      phase: 'denied',
      status: 'denied',
      outcome: 'permission_denied',
      organizationId: 'org-denied-audit-2207',
      actorId: 'actor-denied-audit-2207',
      actorRole: 'customer',
      repairIntakeDraftId: 'draft-denied-audit-2207',
      source: 'synthetic_handler',
      permissionReasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PERMISSION_GATE_ROLE_NOT_ALLOWED',
      reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PERMISSION_GATE_ROLE_NOT_ALLOWED',
    },
  });
  assertNoUnsafeText(flow.auditCalls[0]);
  assertNoUnsafeText(result);
  assert.deepEqual(input, beforeInput);
  assert.deepEqual(flow.context, beforeContext);
});
