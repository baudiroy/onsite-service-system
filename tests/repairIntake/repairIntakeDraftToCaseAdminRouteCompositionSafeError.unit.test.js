'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH,
  registerRepairIntakeDraftToCaseAdminRoutes,
} = require('../../src/routes/repairIntakeDraftToCase.routes');

const SAFE_ADMIN_ROUTE_ERROR_BODY = Object.freeze({
  ok: false,
  status: 'unavailable',
  messageKey: 'repair_intake_draft_to_case.admin_route_unavailable',
  reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_SAFE_ERROR',
  caseId: null,
  repairIntakeDraftId: null,
});

const UNSAFE_MARKERS = Object.freeze([
  'raw exception',
  'stack',
  'postgres://',
  'DATABASE_URL',
  'providerPayload',
  'openai',
  'rag',
  'billing',
  'settlement',
  'invoice',
  'auditActor',
  'token',
  'password',
  'secret',
  'rawBody',
  'requestBody',
  'draftInput',
  'customerPhone',
  'customerAddress',
  'privateAddress',
  'select *',
  'debug',
  'internal',
]);

function createRuntimePorts() {
  return {
    draftRepository: {
      findDraftForConversion: async () => ({
        id: 'draft_admin_safe_error_001',
        organizationId: 'org_admin_safe_error_001',
        status: 'ready',
      }),
    },
    caseCreationPort: {
      createCaseFromDraft: async () => ({
        id: 'case_admin_safe_error_001',
      }),
    },
    auditPort: {
      recordDraftToCaseDecision: async () => ({
        ok: true,
      }),
    },
  };
}

function createRouter(options = {}) {
  return {
    calls: [],
    post(pathname, ...handlers) {
      if (options.throwOnPost) {
        throw new Error(
          'raw exception postgres://unsafe DATABASE_URL token secret stack rawBody customerPhone select *',
        );
      }

      this.calls.push({ pathname, handlers });
    },
  };
}

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

function assertNoUnsafeLeak(value) {
  const serialized = JSON.stringify(value);

  for (const marker of UNSAFE_MARKERS) {
    assert.equal(serialized.includes(marker), false, `unsafe marker leaked: ${marker}`);
  }
}

function registerWithRuntimePorts(router = createRouter()) {
  const summary = registerRepairIntakeDraftToCaseAdminRoutes(router, {
    repairIntakeDraftToCaseRoutesEnabled: true,
    repairIntakeDraftToCaseRuntimePorts: createRuntimePorts(),
  });

  return {
    router,
    summary,
  };
}

async function invoke(handler, req) {
  const res = createResponse();
  let nextError = null;

  await handler(req, res, (error) => {
    nextError = error || null;
  });

  return {
    res,
    nextError,
  };
}

test('disabled admin route registration remains fail-closed and sanitized', () => {
  const router = createRouter();
  const summary = registerRepairIntakeDraftToCaseAdminRoutes(router, {
    repairIntakeDraftToCaseRoutesEnabled: false,
    repairIntakeDraftToCaseRuntimePorts: createRuntimePorts(),
  });

  assert.equal(summary.ok, false);
  assert.equal(summary.mounted, 0);
  assert.deepEqual(summary.routes, []);
  assert.equal(summary.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_NOT_MOUNTED');
  assert.equal(router.calls.length, 0);
  assertNoUnsafeLeak(summary);
});

test('missing injected runtime ports remain fail-closed and sanitized', () => {
  const router = createRouter();
  const summary = registerRepairIntakeDraftToCaseAdminRoutes(router, {
    repairIntakeDraftToCaseRoutesEnabled: true,
  });

  assert.equal(summary.ok, false);
  assert.equal(summary.mounted, 0);
  assert.deepEqual(summary.routes, []);
  assert.equal(summary.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_NOT_MOUNTED');
  assert.equal(router.calls.length, 0);
  assertNoUnsafeLeak(summary);
});

test('route composition mount exceptions return sanitized registration summary', () => {
  const { router, summary } = registerWithRuntimePorts(createRouter({ throwOnPost: true }));

  assert.equal(summary.ok, false);
  assert.equal(summary.mounted, 0);
  assert.deepEqual(summary.routes, []);
  assert.equal(summary.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_NOT_MOUNTED');
  assert.equal(summary.compositionSummary.ok, false);
  assert.equal(
    summary.compositionSummary.reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_COMPOSITION_FAILED',
  );
  assert.deepEqual(summary.compositionSummary.requiredActions, ['retry_or_manual_review']);
  assert.equal(router.calls.length, 0);
  assertNoUnsafeLeak(summary);
});

test('permission middleware failure does not expose unsafe request or secret details', async () => {
  const { router, summary } = registerWithRuntimePorts();
  const route = router.calls[0];
  let nextError = null;

  assert.equal(summary.ok, true);
  assert.equal(route.pathname, REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH);

  await route.handlers[0]({
    user: {
      id: 'user_permission_denied_safe_error_001',
      permissions: [],
      token: 'secret token should not leak',
    },
    body: {
      rawBody: 'rawBody should not leak',
      customerPhone: '+886900000000',
    },
  }, createResponse(), (error) => {
    nextError = error || null;
  });

  assert.ok(nextError);
  assert.equal(nextError.name, 'PermissionError');
  assert.equal(nextError.statusCode, 403);
  assertNoUnsafeLeak({
    name: nextError.name,
    statusCode: nextError.statusCode,
    code: nextError.code,
    message: nextError.message,
  });
});

test('malformed request-like input returns safe unavailable envelope without raw error leakage', async () => {
  const { router } = registerWithRuntimePorts();
  const route = router.calls[0];
  const throwingRequest = {
    params: {
      draftId: 'draft_admin_safe_error_001',
    },
    user: {
      id: 'user_admin_safe_error_001',
      permissions: ['cases.create'],
    },
    get body() {
      throw new Error(
        'raw exception stack postgres://unsafe token secret rawBody customerAddress select *',
      );
    },
  };

  const output = await invoke(route.handlers[1], throwingRequest);

  assert.equal(output.nextError, null);
  assert.deepEqual(output.res.statusCalls, [503]);
  assert.deepEqual(output.res.jsonCalls, [SAFE_ADMIN_ROUTE_ERROR_BODY]);
  assertNoUnsafeLeak(output.res.jsonCalls);
});

test('successful admin route composition remains unchanged and does not execute runtime ports', () => {
  const { router, summary } = registerWithRuntimePorts();

  assert.equal(summary.ok, true);
  assert.equal(summary.mounted, 1);
  assert.deepEqual(summary.routes, [{
    method: 'POST',
    path: REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH,
  }]);
  assert.equal(summary.reasonCode, 'REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_MOUNTED');
  assert.equal(router.calls.length, 1);
  assert.equal(router.calls[0].pathname, REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH);
  assert.equal(router.calls[0].handlers.length, 2);
  assertNoUnsafeLeak(summary);
});
