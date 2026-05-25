'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftToCaseApplicationService,
} = require('../../src/repairIntake/repairIntakeDraftToCaseApplicationService');
const {
  createRepairIntakeDraftToCaseController,
} = require('../../src/repairIntake/repairIntakeDraftToCaseController');
const {
  createRepairIntakeDraftToCaseApiModule,
} = require('../../src/repairIntake/repairIntakeDraftToCaseApiModule');
const {
  mountRepairIntakeDraftToCaseApiModule,
} = require('../../src/repairIntake/repairIntakeDraftToCaseHttpMountAdapter');

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
          statusCode: 404,
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
        statusCode: response && response.statusCode,
        body: response && (response.body || response),
      };
    },
  };
}

function unsafeRequestLike() {
  return {
    params: {
      draftId: 'draft_task1017',
      phone: '+886900000000',
    },
    query: {
      preview: 'true',
      sql: 'select * from unsafe_query',
    },
    body: {
      organizationId: 'org_task1017',
      tenantId: 'tenant_task1017',
      idempotencyKey: 'idem_task1017',
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
      },
      approvalContext: {
        accepted: true,
      },
      phone: '+886900000000',
      address: 'unsafe address',
      customerName: 'unsafe customer',
      lineUserId: 'unsafe_line',
      lineAccessToken: 'unsafe_line_token',
      finalAppointmentId: 'unsafe_final',
      DATABASE_URL: 'postgres://unsafe',
    },
    context: {
      organizationId: 'org_task1017',
      actorId: 'actor_task1017',
      requestId: 'req_task1017',
    },
    requestId: 'req_task1017',
    tenantId: 'tenant_task1017',
    req: { unsafe: true },
    res: { unsafe: true },
    headers: { authorization: 'Bearer unsafe' },
    rawBody: 'unsafe raw body',
  };
}

function createPorts(calls) {
  return {
    draftReader: {
      getDraftForConversion: async (input) => {
        calls.push({ port: 'draftReader', input });
        return {
          id: 'draft_task1017',
          organizationId: 'org_task1017',
          status: 'ready',
          rawRows: [{ phone: '+886900000000' }],
          phone: '+886900000000',
          address: 'unsafe address',
          sql: 'select * from unsafe_draft',
        };
      },
    },
    casePlanner: {
      planCaseFromDraft: async (input) => {
        calls.push({ port: 'casePlanner', input });
        return {
          status: 'planned',
          reasonCode: 'PLAN_READY',
          requiredActions: [],
          candidate: {
            sourceDraftId: 'draft_task1017',
            organizationId: 'org_task1017',
          },
          rawRows: [{ unsafe: true }],
          lineUserId: 'unsafe_line',
        };
      },
    },
    caseCreator: {
      createCaseFromDraft: async (input) => {
        calls.push({ port: 'caseCreator', input });
        return {
          id: 'case_task1017',
          organizationId: 'org_task1017',
          sourceDraftId: 'draft_task1017',
          status: 'created',
          reasonCode: 'SUBMIT_READY',
          requiredActions: [],
          finalAppointmentId: 'unsafe_final',
          databaseUrl: 'postgres://unsafe',
        };
      },
    },
    auditWriter: {
      recordDraftToCaseDecision: async (input) => {
        calls.push({ port: 'auditWriter', input });
        return {
          eventType: 'repair_intake_draft_to_case_decision',
          outcome: 'submitted',
          draftId: 'draft_task1017',
          organizationId: 'org_task1017',
          stack: 'unsafe stack',
          token: 'unsafe_token',
        };
      },
    },
  };
}

function createFullInjectedApiModule(calls) {
  const applicationService = createRepairIntakeDraftToCaseApplicationService(createPorts(calls));
  const controller = createRepairIntakeDraftToCaseController({ applicationService });

  return createRepairIntakeDraftToCaseApiModule({ controller });
}

function assertNoUnsafeText(value) {
  const keys = new Set();
  const collectKeys = (candidate) => {
    if (!candidate || typeof candidate !== 'object') {
      return;
    }

    for (const [key, fieldValue] of Object.entries(candidate)) {
      keys.add(key);
      collectKeys(fieldValue);
    }
  };
  collectKeys(value);

  for (const forbiddenKey of [
    'handler',
    'applicationService',
    'controller',
    'module',
    'port',
    'req',
    'res',
    'headers',
    'rawBody',
    'rawRows',
    'sql',
    'DATABASE_URL',
    'databaseUrl',
    'authorization',
    'phone',
    'address',
    'customerName',
    'lineUserId',
    'lineAccessToken',
    'finalAppointmentId',
    'stack',
    'token',
  ]) {
    assert.equal(keys.has(forbiddenKey), false, `forwarded unsafe key ${forbiddenKey}`);
  }

  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'select *',
    'unsafe_query',
    'unsafe_draft',
    'DATABASE_URL',
    'postgres://',
    '+886900000000',
    'unsafe address',
    'unsafe customer',
    'unsafe_line',
    'unsafe_line_token',
    'unsafe_final',
    'unsafe raw body',
    'unsafe stack',
    'unsafe_token',
    'Bearer unsafe',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function assertSafePortInput(input) {
  assert.equal(input.params.draftId, 'draft_task1017');
  assert.equal(input.query.preview, 'true');
  assert.equal(input.body.organizationId, 'org_task1017');
  assert.equal(input.body.tenantId, 'tenant_task1017');
  assert.equal(input.body.idempotencyKey, 'idem_task1017');
  assert.equal(input.context.organizationId, 'org_task1017');
  assert.equal(input.context.actorId, 'actor_task1017');
  assert.equal(input.context.requestId, 'req_task1017');
  assert.equal(input.requestId, 'req_task1017');
  assert.equal(input.tenantId, 'tenant_task1017');
  assertNoUnsafeText(input);
}

test('full injected chain dispatches plan flow through applicationService without create/audit ports', async () => {
  const calls = [];
  const apiModule = createFullInjectedApiModule(calls);
  const mountTarget = createSyntheticMountTarget();
  const summary = mountRepairIntakeDraftToCaseApiModule({
    mountTarget,
    apiModule,
  });

  assert.equal(apiModule.ok, true);
  assert.equal(summary.ok, true);
  assert.equal(summary.mounted, 2);
  assertNoUnsafeText(summary.routes);

  const response = await mountTarget.dispatch(
    'POST',
    '/repair-intake/drafts/:draftId/case/plan',
    unsafeRequestLike(),
  );

  assert.deepEqual(calls.map(({ port }) => port), ['draftReader', 'casePlanner']);
  assertSafePortInput(calls[0].input);
  assertSafePortInput(calls[1].input);
  assert.equal(response.ok, true);
  assert.equal(response.body.reasonCode, 'PLAN_READY');
  assert.equal(response.body.submitted, false);
  assert.equal(response.body.plan.status, 'planned');
  assert.equal(response.body.caseRef, null);
  assert.equal(response.body.auditEvent, null);
  assertNoUnsafeText(response);
});

test('full injected chain dispatches submit flow through all applicationService ports in order', async () => {
  const calls = [];
  const mountTarget = createSyntheticMountTarget();
  const summary = mountRepairIntakeDraftToCaseApiModule({
    mountTarget,
    apiModule: createFullInjectedApiModule(calls),
  });

  assert.equal(summary.ok, true);
  assertNoUnsafeText(summary.routes);

  const response = await mountTarget.dispatch(
    'POST',
    '/repair-intake/drafts/:draftId/case/submit',
    unsafeRequestLike(),
  );

  assert.deepEqual(calls.map(({ port }) => port), [
    'draftReader',
    'casePlanner',
    'caseCreator',
    'auditWriter',
  ]);
  for (const call of calls) {
    assertSafePortInput(call.input);
  }
  assert.equal(response.ok, true);
  assert.equal(response.body.reasonCode, 'SUBMIT_READY');
  assert.equal(response.body.submitted, true);
  assert.equal(response.body.caseRef.id, 'case_task1017');
  assert.equal(response.body.auditEvent.eventType, 'repair_intake_draft_to_case_decision');
  assertNoUnsafeText(response);
});
