'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  RepairIntakeDraftCaseRouteFactoryError,
  createRepairIntakeDraftCaseRoutes,
} = require('../../src/repairIntake/repairIntakeDraftCaseRouteFactory');

const SOURCE_PATH = path.join(__dirname, '../../src/repairIntake/repairIntakeDraftCaseRouteFactory.js');

function requestLike(overrides = {}) {
  return {
    params: {
      draftId: 'draft_task960_001',
    },
    body: {
      organizationId: 'org_task960',
      idempotencyKey: 'idem_task960',
      phone: '+886900000000',
      finalAppointmentId: 'final_task960',
    },
    headers: {
      authorization: 'Bearer unsafe_token',
      token: 'unsafe_header_token',
    },
    context: {
      actorId: 'actor_task960',
      requestId: 'request_task960',
    },
    ...overrides,
  };
}

function controllerEnvelope(overrides = {}) {
  return {
    ok: true,
    statusCode: 200,
    body: {
      ok: true,
      action: 'repair_intake_draft_to_case_submit',
      draftId: 'draft_task960_001',
      organizationId: 'org_task960',
      reasonCode: 'CASE_SUBMITTED',
      requiredActions: [],
      caseRef: {
        id: 'case_task960_001',
        organizationId: 'org_task960',
        sourceDraftId: 'draft_task960_001',
        status: 'created',
      },
      auditEvent: null,
    },
    ...overrides,
  };
}

function assertNoForbiddenFields(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'finalAppointmentId',
    'final_appointment_id',
    'phone',
    'address',
    'customerPayload',
    'rawPayload',
    'select *',
    'stack trace',
    'providerPayload',
    'token',
    'secret',
    'lineAccessToken',
    'LINE access token',
    'authorization',
    'sql',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('factory requires injected controller', () => {
  assert.throws(
    () => createRepairIntakeDraftCaseRoutes(),
    (error) => {
      assert.equal(error instanceof RepairIntakeDraftCaseRouteFactoryError, true);
      assert.equal(error.reasonCode, 'REPAIR_INTAKE_DRAFT_CASE_ROUTE_FACTORY_CONTROLLER_REQUIRED');
      assertNoForbiddenFields(error);
      return true;
    },
  );
});

test('returns exactly the expected route definitions', () => {
  const routes = createRepairIntakeDraftCaseRoutes({
    controller: {
      planDraftToCase: async () => controllerEnvelope(),
      submitDraftToCase: async () => controllerEnvelope(),
    },
  });

  assert.equal(routes.length, 2);
  assert.deepEqual(routes.map(({ method, path }) => ({ method, path })), [
    {
      method: 'POST',
      path: '/repair-intake/drafts/:draftId/case/plan',
    },
    {
      method: 'POST',
      path: '/repair-intake/drafts/:draftId/case/submit',
    },
  ]);
  assert.equal(typeof routes[0].handler, 'function');
  assert.equal(typeof routes[1].handler, 'function');
});

test('plan route calls controller.planDraftToCase', async () => {
  const calls = [];
  const routes = createRepairIntakeDraftCaseRoutes({
    controller: {
      planDraftToCase: async (request) => {
        calls.push(request);
        return controllerEnvelope({
          body: {
            ok: true,
            action: 'repair_intake_draft_to_case_plan',
            draftId: 'draft_task960_001',
            organizationId: 'org_task960',
            reasonCode: 'candidate_ready',
            requiredActions: [],
          },
        });
      },
      submitDraftToCase: async () => {
        throw new Error('submit route should not be called');
      },
    },
  });
  const request = requestLike();

  const result = await routes[0].handler(request);

  assert.equal(calls[0], request);
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.action, 'repair_intake_draft_to_case_plan');
});

test('submit route calls controller.submitDraftToCase', async () => {
  const calls = [];
  const routes = createRepairIntakeDraftCaseRoutes({
    controller: {
      planDraftToCase: async () => {
        throw new Error('plan route should not be called');
      },
      submitDraftToCase: async (request) => {
        calls.push(request);
        return controllerEnvelope();
      },
    },
  });
  const request = requestLike();

  const result = await routes[1].handler(request);

  assert.equal(calls[0], request);
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.reasonCode, 'CASE_SUBMITTED');
});

test('handler passes request-like object through without mutation', async () => {
  const request = requestLike();
  const before = JSON.stringify(request);
  const routes = createRepairIntakeDraftCaseRoutes({
    controller: {
      planDraftToCase: async () => controllerEnvelope(),
      submitDraftToCase: async () => controllerEnvelope(),
    },
  });

  await routes[1].handler(request);

  assert.equal(JSON.stringify(request), before);
});

test('missing controller method returns safe 500 envelope', async () => {
  const routes = createRepairIntakeDraftCaseRoutes({
    controller: {
      planDraftToCase: async () => controllerEnvelope(),
    },
  });

  const result = await routes[1].handler(requestLike());

  assert.equal(result.ok, false);
  assert.equal(result.statusCode, 500);
  assert.equal(result.body.reasonCode, 'REPAIR_INTAKE_DRAFT_CASE_ROUTE_HANDLER_NOT_CONFIGURED');
  assert.deepEqual(result.body.requiredActions, ['configure_controller_method']);
  assertNoForbiddenFields(result);
});

test('controller throw returns generic safe 500 envelope without raw leakage', async () => {
  const routes = createRepairIntakeDraftCaseRoutes({
    controller: {
      planDraftToCase: async () => controllerEnvelope(),
      submitDraftToCase: async () => {
        throw new Error('raw SQL select * stack trace token secret finalAppointmentId');
      },
    },
  });

  const result = await routes[1].handler(requestLike());

  assert.equal(result.ok, false);
  assert.equal(result.statusCode, 500);
  assert.equal(result.body.reasonCode, 'REPAIR_INTAKE_DRAFT_CASE_ROUTE_HANDLER_FAILED');
  assert.deepEqual(result.body.requiredActions, ['retry_or_manual_review']);
  assertNoForbiddenFields(result);
});

test('route handler returns controller envelope without adding unsafe data', async () => {
  const routes = createRepairIntakeDraftCaseRoutes({
    controller: {
      planDraftToCase: async () => controllerEnvelope(),
      submitDraftToCase: async () => controllerEnvelope(),
    },
  });

  const result = await routes[1].handler(requestLike());

  assert.equal(result.statusCode, 200);
  assertNoForbiddenFields(result);
});

test('source has no app bootstrap router registration OpenAPI DB provider AI admin billing or smoke imports', () => {
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
