'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftToCaseApiModule,
} = require('../../src/repairIntake/repairIntakeDraftToCaseApiModule');

function unsafeSuccessEnvelope(routeName) {
  return {
    ok: true,
    statusCode: 200,
    body: {
      ok: true,
      status: 'ready',
      reasonCode: `${routeName.toUpperCase()}_READY`,
      requiredActions: [],
      draftId: 'draft_task1005',
      caseId: 'case_task1005',
      caseRef: {
        id: 'case_task1005',
        organizationId: 'org_task1005',
        sourceDraftId: 'draft_task1005',
        status: 'created',
        phone: '+886944444444',
        finalAppointmentId: 'unsafe_final_ref',
      },
      plan: {
        routeName,
        safe: true,
        query: 'select * from unsafe_plan',
      },
      result: {
        accepted: true,
        rawRows: [{ phone: '+886944444444' }],
      },
      warnings: [
        {
          code: 'SAFE_WARNING',
          stack: 'unsafe stack',
        },
      ],
      metadata: {
        source: 'synthetic_task1005',
        headers: {
          authorization: 'Bearer unsafe',
        },
      },
      req: { unsafe: true },
      res: { unsafe: true },
      response: { unsafe: true },
      next: 'unsafe next',
      socket: { unsafe: true },
      connection: { unsafe: true },
      headers: { authorization: 'Bearer unsafe' },
      rawHeaders: ['authorization', 'Bearer unsafe'],
      cookies: { session: 'unsafe' },
      signedCookies: { session: 'unsafe' },
      session: { token: 'unsafe' },
      app: { unsafe: true },
      route: { unsafe: true },
      raw: { unsafe: true },
      rawRows: [{ unsafe: true }],
      sql: 'select * from unsafe_table',
      query: 'select * from unsafe_query',
      paramsSql: 'unsafe params sql',
      db: { unsafe: true },
      databaseUrl: 'postgres://unsafe',
      DATABASE_URL: 'postgres://unsafe',
      authorization: 'Bearer unsafe',
      cookie: 'unsafe_cookie',
      lineUserId: 'unsafe_line',
      lineAccessToken: 'unsafe_line_token',
      phone: '+886944444444',
      address: 'unsafe address',
      customerPhone: '+886955555555',
      customerName: 'unsafe customer',
      finalAppointmentId: 'unsafe_final',
      stack: 'unsafe stack',
      error: 'unsafe error',
      handler: 'unsafe handler',
      controller: 'unsafe controller',
      applicationService: 'unsafe application service',
    },
    headers: {
      authorization: 'Bearer unsafe',
    },
  };
}

function requestLike() {
  return {
    params: {
      draftId: 'draft_task1005',
    },
    body: {
      organizationId: 'org_task1005',
    },
    context: {
      organizationId: 'org_task1005',
      actorId: 'actor_task1005',
      requestId: 'req_task1005',
    },
  };
}

function assertSafeOutput(output, expectedReasonCode) {
  assert.equal(output.ok, true);
  assert.equal(output.statusCode, 200);
  assert.equal(output.body.ok, true);
  assert.equal(output.body.status, 'ready');
  assert.equal(output.body.reasonCode, expectedReasonCode);
  assert.deepEqual(output.body.requiredActions, []);
  assert.equal(output.body.draftId, 'draft_task1005');
  assert.equal(output.body.caseId, 'case_task1005');
  assert.deepEqual(output.body.caseRef, {
    id: 'case_task1005',
    organizationId: 'org_task1005',
    sourceDraftId: 'draft_task1005',
    status: 'created',
  });
  assert.equal(output.body.plan.safe, true);
  assert.equal(output.body.result.accepted, true);
  assert.deepEqual(output.body.warnings, [{ code: 'SAFE_WARNING' }]);
  assert.deepEqual(output.body.metadata, { source: 'synthetic_task1005' });

  const keys = new Set();
  const collectKeys = (value) => {
    if (!value || typeof value !== 'object') {
      return;
    }

    for (const [key, fieldValue] of Object.entries(value)) {
      keys.add(key);
      collectKeys(fieldValue);
    }
  };
  collectKeys(output);

  for (const forbiddenKey of [
    'req',
    'res',
    'response',
    'socket',
    'connection',
    'headers',
    'rawHeaders',
    'cookies',
    'signedCookies',
    'session',
    'rawRows',
    'databaseUrl',
    'lineUserId',
    'lineAccessToken',
    'finalAppointmentId',
    'stack',
    'error',
    'handler',
    'controller',
    'applicationService',
  ]) {
    assert.equal(keys.has(forbiddenKey), false, `forwarded unsafe key ${forbiddenKey}`);
  }

  const serialized = JSON.stringify(output);

  for (const forbidden of [
    'unsafe next',
    'unsafe handler',
    'unsafe controller',
    'unsafe application service',
    'select *',
    'unsafe_table',
    'unsafe_query',
    'params sql',
    'postgres://',
    'DATABASE_URL',
    'Bearer unsafe',
    'unsafe_cookie',
    'unsafe_line',
    'unsafe_line_token',
    '+886944444444',
    '+886955555555',
    'unsafe address',
    'unsafe customer',
    'unsafe_final',
    'unsafe stack',
    'unsafe error',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function unsafeOutputController() {
  return {
    planDraftToCase: async () => unsafeSuccessEnvelope('plan'),
    submitDraftToCase: async () => unsafeSuccessEnvelope('submit'),
  };
}

function unsafeOutputApplicationService() {
  return {
    planDraftToCase: async () => ({
      ok: true,
      action: 'repair_intake_draft_to_case_plan',
      draftId: 'draft_task1005',
      organizationId: 'org_task1005',
      status: 'ready',
      reasonCode: 'PLAN_READY',
      requiredActions: [],
      caseRef: {
        id: 'case_task1005',
        organizationId: 'org_task1005',
        sourceDraftId: 'draft_task1005',
        status: 'created',
      },
      phone: '+886944444444',
      headers: { authorization: 'Bearer unsafe' },
      rawRows: [{ unsafe: true }],
      stack: 'unsafe stack',
      error: 'unsafe error',
    }),
    submitDraftToCase: async () => ({
      ok: true,
      action: 'repair_intake_draft_to_case_submit',
      draftId: 'draft_task1005',
      organizationId: 'org_task1005',
      submitted: true,
      status: 'ready',
      reasonCode: 'SUBMIT_READY',
      requiredActions: [],
      caseRef: {
        id: 'case_task1005',
        organizationId: 'org_task1005',
        sourceDraftId: 'draft_task1005',
        status: 'created',
      },
      lineAccessToken: 'unsafe_line_token',
      databaseUrl: 'postgres://unsafe',
      finalAppointmentId: 'unsafe_final',
    }),
  };
}

test('injected controller route handler outputs are sanitized recursively', async () => {
  const moduleEnvelope = createRepairIntakeDraftToCaseApiModule({
    controller: unsafeOutputController(),
  });

  assert.equal(moduleEnvelope.ok, true);

  const planOutput = await moduleEnvelope.routes[0].handler(requestLike());
  const submitOutput = await moduleEnvelope.routes[1].handler(requestLike());

  assertSafeOutput(planOutput, 'PLAN_READY');
  assertSafeOutput(submitOutput, 'SUBMIT_READY');
});

test('applicationService adapter route handler outputs stay sanitized recursively', async () => {
  const moduleEnvelope = createRepairIntakeDraftToCaseApiModule({
    applicationService: unsafeOutputApplicationService(),
  });

  assert.equal(moduleEnvelope.ok, true);

  const planOutput = await moduleEnvelope.routes[0].handler(requestLike());
  const submitOutput = await moduleEnvelope.routes[1].handler(requestLike());

  assert.equal(planOutput.ok, true);
  assert.equal(planOutput.statusCode, 200);
  assert.equal(planOutput.body.reasonCode, 'PLAN_READY');
  assert.equal(planOutput.body.draftId, 'draft_task1005');
  assert.equal(planOutput.body.organizationId, 'org_task1005');

  assert.equal(submitOutput.ok, true);
  assert.equal(submitOutput.statusCode, 200);
  assert.equal(submitOutput.body.reasonCode, 'SUBMIT_READY');
  assert.equal(submitOutput.body.caseRef.id, 'case_task1005');

  for (const output of [planOutput, submitOutput]) {
    const serialized = JSON.stringify(output);

    for (const forbidden of [
      '+886944444444',
      'Bearer unsafe',
      'rawRows',
      'unsafe stack',
      'unsafe error',
      'unsafe_line_token',
      'postgres://',
      'databaseUrl',
      'finalAppointmentId',
      'unsafe_final',
    ]) {
      assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
    }
  }
});
