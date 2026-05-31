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
          idempotencyKey: input.idempotencyKey,
          draftId: input.draftId,
          organizationId: input.organizationId,
          tenantId: input.tenantId,
          status: 'recorded',
          submitted: true,
          caseRef: input.caseRef,
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
          phone: '+886900000001',
          rawRows: [{ token: 'unsafe-token' }],
          providerPayload: { raw: 'unsafe-provider' },
        };
      },
    },
    planningPolicy: {
      async planCaseFromDraft(input) {
        calls.push({ name: 'plan.case', input });
        return {
          ok: true,
          status: 'planned',
          reasonCode: 'REPAIR_INTAKE_SYNTHETIC_PLAN_READY',
          candidate: {
            sourceDraftId: input.draftId,
            organizationId: input.organizationId,
            tenantId: input.tenantId,
          },
          rawRows: [{ token: 'unsafe-token' }],
        };
      },
    },
    caseCreationPort: {
      async createCaseFromDraft(input) {
        calls.push({ name: 'case.create', input });
        return {
          id: 'case-task2361',
          caseId: 'case-task2361',
          organizationId: input.organizationId,
          tenantId: input.tenantId,
          sourceDraftId: input.draftId,
          status: 'created',
          token: 'unsafe-token',
          providerPayload: { raw: 'unsafe-provider' },
        };
      },
    },
    auditPort: {
      async recordDraftToCaseDecision(input) {
        calls.push({ name: 'audit.record', input });
        return {
          ok: true,
          eventType: 'repair_intake_draft_to_case_decision',
          outcome: 'recorded',
          draftId: input.draftId,
          organizationId: input.organizationId,
          caseId: input.caseRef && input.caseRef.caseId,
          stack: 'unsafe stack',
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
      draftId: 'draft-task2361',
    },
    query: {
      organizationId: 'org-query-forbidden-task2361',
    },
    body: {
      approvalContext: {
        accepted: true,
      },
      organizationId: 'org-body-forbidden-task2361',
      actorId: 'actor-body-forbidden-task2361',
      repairIntakeDraftId: 'draft-body-forbidden-task2361',
      requestId: 'req-body-forbidden-task2361',
      idempotencyKey: 'idem-body-forbidden-task2361',
      requestBody: {
        organizationId: 'org-request-body-forbidden-task2361',
      },
      draftInput: {
        organizationId: 'org-draft-input-forbidden-task2361',
      },
      providerPayload: {
        raw: 'provider-payload-forbidden-task2361',
      },
      debug: {
        raw: 'debug-forbidden-task2361',
      },
      env: {
        DATABASE_URL: 'postgres://forbidden-task2361',
      },
      token: 'body-token-forbidden-task2361',
    },
    context: {
      organizationId: 'org-context-task2361',
      tenantId: 'tenant-context-task2361',
      actorRole: 'dispatcher',
      requestId: 'req-context-task2361',
      idempotencyKey: 'idem-context-task2361',
    },
    headers: {
      authorization: 'Bearer token-forbidden-task2361',
    },
    clientPayload: {
      organizationId: 'org-client-forbidden-task2361',
    },
    requestId: 'req-top-task2361',
    idempotencyKey: 'idem-top-task2361',
    user: {
      id: 'actor-user-task2361',
      organizationId: 'org-user-task2361',
      tenantId: 'tenant-user-task2361',
      permissions: [REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION],
      token: 'auth-token-forbidden-task2361',
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

function callNamed(calls, name) {
  const call = calls.find((item) => item.name === name);

  assert.ok(call, `missing call ${name}`);

  return call;
}

function assertNoRawLeak(value) {
  const serialized = JSON.stringify(value);

  for (const marker of [
    '+886900000001',
    'unsafe',
    'forbidden-task2361',
    'postgres://',
    'providerPayload',
    'provider-payload',
    'debug-forbidden',
    'DATABASE_URL',
    'authorization',
    'token',
    'rawRows',
    'stack',
  ]) {
    assert.equal(serialized.includes(marker), false, `leaked ${marker}`);
  }
}

test('synthetic admin route composition registers protected unchanged submit route', () => {
  const runtimeCalls = [];
  const routeCall = createMountedAdminRoute(runtimeCalls);

  assert.equal(routeCall.pathname, REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH);
  assert.equal(routeCall.handlers.length, 2);
  assert.equal(runtimeCalls.length, 0, 'mounting route must not execute runtime ports');
});

test('permission middleware keeps cases.create gate before submit handler', async () => {
  const runtimeCalls = [];
  const routeCall = createMountedAdminRoute(runtimeCalls);
  const output = await invokeAdminRoute(routeCall, request({
    user: {
      id: 'actor-denied-task2361',
      organizationId: 'org-denied-task2361',
      permissions: [],
    },
  }));

  assert.equal(output.error && output.error.code, 'PERMISSION_DENIED');
  assert.deepEqual(output.res.statusCalls, []);
  assert.deepEqual(output.res.jsonCalls, []);
  assert.deepEqual(runtimeCalls, []);
});

test('trusted route auth session context reaches downstream synthetic runtime safely', async () => {
  const runtimeCalls = [];
  const routeCall = createMountedAdminRoute(runtimeCalls);
  const req = request();
  const before = clone(req);
  const output = await invokeAdminRoute(routeCall, req);

  assert.ifError(output.error);
  assert.deepEqual(output.res.statusCalls, [200]);
  assert.equal(output.res.jsonCalls.length, 1);
  assert.equal(output.res.jsonCalls[0].ok, true);
  assert.equal(output.res.jsonCalls[0].submitted, true);
  assert.equal(output.res.jsonCalls[0].draftId, 'draft-task2361');
  assert.equal(output.res.jsonCalls[0].organizationId, 'org-user-task2361');
  assertNoRawLeak(output.res.jsonCalls);

  const draftRead = callNamed(runtimeCalls, 'draft.find');
  const idempotencyFind = callNamed(runtimeCalls, 'idempotency.find');
  const caseCreate = callNamed(runtimeCalls, 'case.create');
  const auditRecord = callNamed(runtimeCalls, 'audit.record');

  assert.equal(draftRead.input.draftId, 'draft-task2361');
  assert.equal(draftRead.input.organizationId, 'org-user-task2361');
  assert.equal(draftRead.input.tenantId, 'tenant-user-task2361');
  assert.equal(draftRead.input.actorId, 'actor-user-task2361');
  assert.equal(idempotencyFind.input.idempotencyKey, 'idem-top-task2361');
  assert.equal(caseCreate.input.organizationId, 'org-user-task2361');
  assert.equal(caseCreate.input.actor.actorId, 'actor-user-task2361');
  assert.equal(auditRecord.input.organizationId, 'org-user-task2361');

  assertNoRawLeak(draftRead.input);
  assertNoRawLeak(caseCreate.input);
  assertNoRawLeak(auditRecord.input);
  assert.deepEqual(req, before);
});

test('context fallback remains trusted when authenticated user lacks organization tenant fields', async () => {
  const runtimeCalls = [];
  const routeCall = createMountedAdminRoute(runtimeCalls);
  const output = await invokeAdminRoute(routeCall, request({
    requestId: undefined,
    idempotencyKey: undefined,
    user: {
      userId: 'actor-userid-task2361',
      permissions: [REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION],
    },
  }));

  assert.ifError(output.error);
  assert.equal(output.res.jsonCalls[0].ok, true);

  const draftRead = callNamed(runtimeCalls, 'draft.find');
  const caseCreate = callNamed(runtimeCalls, 'case.create');

  assert.equal(draftRead.input.organizationId, 'org-context-task2361');
  assert.equal(draftRead.input.tenantId, 'tenant-context-task2361');
  assert.equal(draftRead.input.actorId, 'actor-userid-task2361');
  assert.equal(caseCreate.input.actor.actorId, 'actor-userid-task2361');
  assert.equal(callNamed(runtimeCalls, 'idempotency.find').input.idempotencyKey, 'idem-context-task2361');
});

test('missing trusted organization fails closed without case creation or unsafe leakage', async () => {
  const runtimeCalls = [];
  const routeCall = createMountedAdminRoute(runtimeCalls);
  const output = await invokeAdminRoute(routeCall, request({
    context: {},
    user: {
      id: 'actor-missing-org-task2361',
      permissions: [REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION],
      token: 'auth-token-forbidden-task2361',
    },
  }));

  assert.ifError(output.error);
  assert.equal(output.res.jsonCalls.length, 1);
  assert.equal(output.res.jsonCalls[0].ok, false);
  assertNoRawLeak(output.res.jsonCalls);
  assert.equal(runtimeCalls.some((call) => call.name === 'case.create'), false);
  assert.equal(runtimeCalls.some((call) => call.name === 'audit.record'), false);
});

test('request abuse guard rejects unsafe deep request before downstream controller ports', async () => {
  const runtimeCalls = [];
  const routeCall = createMountedAdminRoute(runtimeCalls);
  const output = await invokeAdminRoute(routeCall, request({
    query: {
      safe: {
        a: {
          b: {
            c: {
              d: {
                e: {
                  f: {
                    g: 'too deep',
                  },
                },
              },
            },
          },
        },
      },
    },
  }));

  assert.ifError(output.error);
  assert.deepEqual(output.res.statusCalls, [500]);
  assert.equal(output.res.jsonCalls[0].ok, false);
  assert.equal(
    output.res.jsonCalls[0].body && output.res.jsonCalls[0].body.reasonCode,
    undefined,
  );
  assert.equal(
    output.res.jsonCalls[0].reasonCode,
    'REPAIR_INTAKE_DRAFT_TO_CASE_REQUEST_ABUSE_REJECTED',
  );
  assert.deepEqual(runtimeCalls, []);
  assertNoRawLeak(output.res.jsonCalls);
});
