'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION,
  REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH,
  registerRepairIntakeDraftToCaseAdminRoutes,
} = require('../../src/routes/repairIntakeDraftToCase.routes');

function createFakeRouter() {
  return {
    calls: [],
    post(pathname, ...handlers) {
      this.calls.push({
        method: 'POST',
        pathname,
        handlers,
      });
    },
  };
}

function createResponse() {
  return {
    jsonCalls: [],
    statusCalls: [],
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

function createRuntimePorts(calls = []) {
  return {
    idempotencyStore: {
      async findExistingDraftToCaseResult(input) {
        calls.push({ name: 'idempotency.find', input });
        return null;
      },
      async recordDraftToCaseResult(input) {
        calls.push({ name: 'idempotency.record', input });
        return {
          ok: true,
          result: input.result,
        };
      },
    },
    draftRepository: {
      async findDraftForConversion(input) {
        calls.push({ name: 'draft.find', input });
        return {
          id: input.draftId,
          organizationId: input.organizationId,
          tenantId: input.tenantId,
          status: 'ready',
          summary: {
            title: 'safe synthetic draft',
          },
          providerPayload: { raw: 'unsafe-provider-task2365' },
        };
      },
    },
    planningPolicy: {
      async planCaseFromDraft(input) {
        calls.push({ name: 'plan.case', input });
        return {
          ok: true,
          status: 'planned',
          candidate: {
            sourceDraftId: input.draftId,
            organizationId: input.organizationId,
          },
        };
      },
    },
    caseCreationPort: {
      async createCaseFromDraft(input) {
        calls.push({ name: 'case.create', input });
        return {
          id: 'case-task2365',
          caseId: 'case-task2365',
          organizationId: input.organizationId,
          token: 'unsafe-token-task2365',
        };
      },
    },
    auditPort: {
      async recordDraftToCaseDecision(input) {
        calls.push({ name: 'audit.record', input });
        return {
          ok: true,
          eventType: 'repair_intake_draft_to_case_decision',
          organizationId: input.organizationId,
          stack: 'unsafe-stack-task2365',
        };
      },
    },
  };
}

function createMountedAdminRoute(runtimeCalls = []) {
  const router = createFakeRouter();
  const summary = registerRepairIntakeDraftToCaseAdminRoutes(router, {
    repairIntakeDraftToCaseRoutesEnabled: true,
    repairIntakeDraftToCaseRuntimePorts: createRuntimePorts(runtimeCalls),
  });

  assert.equal(summary.ok, true);
  assert.equal(summary.mounted, 1);
  assert.deepEqual(summary.routes, [{
    method: 'POST',
    path: REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH,
  }]);
  assert.equal(router.calls.length, 1);
  assert.equal(router.calls[0].method, 'POST');
  assert.equal(router.calls[0].pathname, REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH);
  assert.equal(router.calls[0].handlers.length, 2);

  return router.calls[0];
}

function request(overrides = {}) {
  return {
    params: {
      draftId: 'draft-task2365',
    },
    query: {
      organizationId: 'org-query-forbidden-task2365',
      actorId: 'actor-query-forbidden-task2365',
      permission: REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION,
    },
    body: {
      approvalContext: {
        accepted: true,
      },
      organizationId: 'org-body-forbidden-task2365',
      actorId: 'actor-body-forbidden-task2365',
      actorRole: 'owner-body-forbidden-task2365',
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
        permission: REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION,
      },
      requestBody: {
        organizationId: 'org-request-body-forbidden-task2365',
      },
      draftInput: {
        actorId: 'actor-draft-input-forbidden-task2365',
      },
      providerPayload: {
        raw: 'provider-payload-forbidden-task2365',
      },
      debug: {
        raw: 'debug-forbidden-task2365',
      },
      env: {
        DATABASE_URL: 'postgres://forbidden-task2365',
      },
      token: 'body-token-forbidden-task2365',
    },
    context: {
      organizationId: 'org-context-task2365',
      tenantId: 'tenant-context-task2365',
      actorRole: 'dispatcher',
      requestId: 'req-context-task2365',
      idempotencyKey: 'idem-context-task2365',
    },
    headers: {
      authorization: 'Bearer token-forbidden-task2365',
      'x-actor-id': 'actor-header-forbidden-task2365',
      'x-organization-id': 'org-header-forbidden-task2365',
    },
    get(headerName) {
      return this.headers && this.headers[String(headerName).toLowerCase()];
    },
    requestId: 'req-top-task2365',
    idempotencyKey: 'idem-top-task2365',
    user: {
      id: 'actor-user-task2365',
      organizationId: 'org-user-task2365',
      tenantId: 'tenant-user-task2365',
      permissions: [REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION],
      token: 'auth-token-forbidden-task2365',
    },
    ...overrides,
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function invokeMiddleware(handler, req, res) {
  return new Promise((resolve) => {
    const maybePromise = handler(req, res, (error) => {
      resolve(error || null);
    });

    if (maybePromise && typeof maybePromise.then === 'function') {
      maybePromise.catch((error) => resolve(error));
    }
  });
}

async function invokeAdminRoute(routeCall, req) {
  const res = createResponse();
  const [permissionMiddleware, submitHandler] = routeCall.handlers;
  const permissionError = await invokeMiddleware(permissionMiddleware, req, res);

  if (permissionError) {
    return {
      error: permissionError,
      res,
    };
  }

  let submitError = null;
  await submitHandler(req, res, (error) => {
    submitError = error || null;
  });

  return {
    error: submitError,
    res,
  };
}

function assertNoRawLeak(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    'forbidden-task2365',
    'postgres://',
    'providerPayload',
    'provider-payload',
    'debug-forbidden',
    'DATABASE_URL',
    'authorization',
    'Bearer',
    'token',
    'unsafe',
    'raw',
    'stack',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked ${marker}`);
  }
}

function assertNoDownstreamPorts(runtimeCalls) {
  assert.deepEqual(runtimeCalls, [], 'auth/session/permission failure must not execute runtime ports');
}

function assertRequestNotMutated(req, before) {
  assert.deepEqual(clone(req), before);
}

test('synthetic auth-failure matrix mounts unchanged admin route with permission middleware represented', () => {
  const runtimeCalls = [];
  const routeCall = createMountedAdminRoute(runtimeCalls);

  assert.equal(routeCall.pathname, REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH);
  assert.equal(routeCall.handlers.length, 2);
  assert.equal(runtimeCalls.length, 0, 'mounting route must not execute runtime ports');
});

test('missing authenticated user fails before submit handler without downstream runtime execution', async () => {
  const runtimeCalls = [];
  const routeCall = createMountedAdminRoute(runtimeCalls);
  const req = request({
    user: undefined,
    headers: {},
  });
  const before = clone(req);
  const output = await invokeAdminRoute(routeCall, req);

  assert.equal(output.error && output.error.code, 'AUTH_REQUIRED');
  assert.deepEqual(output.res.statusCalls, []);
  assert.deepEqual(output.res.jsonCalls, []);
  assertNoDownstreamPorts(runtimeCalls);
  assertNoRawLeak({
    code: output.error && output.error.code,
    statusCode: output.error && output.error.statusCode,
    response: output.res,
  });
  assertRequestNotMutated(req, before);
});

test('missing or insufficient permission context fails before submit handler despite client injection attempts', async () => {
  const runtimeCalls = [];
  const routeCall = createMountedAdminRoute(runtimeCalls);
  const req = request({
    user: {
      id: 'actor-denied-task2365',
      organizationId: 'org-denied-task2365',
      permissions: [],
      token: 'auth-token-forbidden-task2365',
    },
  });
  const before = clone(req);
  const output = await invokeAdminRoute(routeCall, req);

  assert.equal(output.error && output.error.code, 'PERMISSION_DENIED');
  assert.deepEqual(output.res.statusCalls, []);
  assert.deepEqual(output.res.jsonCalls, []);
  assertNoDownstreamPorts(runtimeCalls);
  assertNoRawLeak({
    code: output.error && output.error.code,
    statusCode: output.error && output.error.statusCode,
    response: output.res,
  });
  assertRequestNotMutated(req, before);
});

test('missing organization context fails closed without case creation audit write or raw leakage', async () => {
  const runtimeCalls = [];
  const routeCall = createMountedAdminRoute(runtimeCalls);
  const req = request({
    context: {},
    user: {
      id: 'actor-missing-org-task2365',
      permissions: [REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION],
      token: 'auth-token-forbidden-task2365',
    },
  });
  const before = clone(req);
  const output = await invokeAdminRoute(routeCall, req);

  assert.ifError(output.error);
  assert.equal(output.res.jsonCalls.length, 1);
  assert.equal(output.res.jsonCalls[0].ok, false);
  assertNoDownstreamPorts(runtimeCalls);
  assertNoRawLeak(output.res.jsonCalls);
  assertRequestNotMutated(req, before);
});

test('missing actor identity fails closed without downstream runtime execution or mutation', async () => {
  const runtimeCalls = [];
  const routeCall = createMountedAdminRoute(runtimeCalls);
  const req = request({
    context: {
      organizationId: 'org-context-task2365',
      tenantId: 'tenant-context-task2365',
    },
    user: {
      organizationId: 'org-user-task2365',
      permissions: [REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION],
      token: 'auth-token-forbidden-task2365',
    },
  });
  const before = clone(req);
  const output = await invokeAdminRoute(routeCall, req);

  assert.ifError(output.error);
  assert.equal(output.res.jsonCalls.length, 1);
  assert.equal(output.res.jsonCalls[0].ok, false);
  assertNoDownstreamPorts(runtimeCalls);
  assertNoRawLeak(output.res.jsonCalls);
  assertRequestNotMutated(req, before);
});

test('malformed auth session context fails closed despite body query header role and permission injection', async () => {
  const runtimeCalls = [];
  const routeCall = createMountedAdminRoute(runtimeCalls);
  const req = request({
    context: 'malformed-context-task2365',
    user: {
      id: { unsafe: 'actor-object-forbidden-task2365' },
      organizationId: { unsafe: 'org-object-forbidden-task2365' },
      permissions: [REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION],
      token: 'auth-token-forbidden-task2365',
    },
  });
  const before = clone(req);
  const output = await invokeAdminRoute(routeCall, req);

  assert.ifError(output.error);
  assert.equal(output.res.jsonCalls.length, 1);
  assert.equal(output.res.jsonCalls[0].ok, false);
  assertNoDownstreamPorts(runtimeCalls);
  assertNoRawLeak(output.res.jsonCalls);
  assertRequestNotMutated(req, before);
});

test('request abuse guard rejection still occurs before downstream controller application ports', async () => {
  const runtimeCalls = [];
  const routeCall = createMountedAdminRoute(runtimeCalls);
  const req = request({
    query: {
      safe: {
        a: {
          b: {
            c: {
              d: {
                e: {
                  f: {
                    g: 'too deep task2365',
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  const before = clone(req);
  const output = await invokeAdminRoute(routeCall, req);

  assert.ifError(output.error);
  assert.deepEqual(output.res.statusCalls, [500]);
  assert.equal(output.res.jsonCalls[0].ok, false);
  assert.equal(
    output.res.jsonCalls[0].reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_REQUEST_ABUSE_REJECTED',
  );
  assertNoDownstreamPorts(runtimeCalls);
  assertNoRawLeak(output.res.jsonCalls);
  assertRequestNotMutated(req, before);
});
