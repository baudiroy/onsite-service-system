'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  READ_PERMISSION,
  createEngineerMobileWorkbenchRequestContextResolver,
  resolveEngineerMobileWorkbenchRequestContext,
} = require('../../src/engineerMobile/engineerMobileWorkbenchRequestContextResolver');

const RESOLVER_SOURCE = path.join(
  __dirname,
  '../../src/engineerMobile/engineerMobileWorkbenchRequestContextResolver.js',
);

function validRequest(overrides = {}) {
  return {
    context: {
      organizationId: 'org_engineer_mobile_1744',
      engineerUserId: 'eng_user_1744',
      assignedAppointmentsReadAllowed: true,
      requestId: 'ctx_req_1744',
    },
    headers: {
      'x-request-id': 'header_req_1744',
      'x-trace-id': 'trace_1744',
    },
    ...overrides,
  };
}

function assertNoForbiddenLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'authorization_header_should_not_leak',
    'cookie_should_not_leak',
    'token_should_not_leak',
    'password_should_not_leak',
    'secret_should_not_leak',
    'raw_session_should_not_leak',
    'raw_user_should_not_leak',
    'raw sql',
    'raw DB row',
    'stack_trace_should_not_leak',
    'provider_debug_should_not_leak',
    'finalAppointmentId_should_not_leak',
    'internal_note_should_not_leak',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `resolver output leaked ${forbidden}`);
  }
}

test('valid injected request resolves normalized handler-compatible context', () => {
  const result = resolveEngineerMobileWorkbenchRequestContext({
    request: validRequest(),
    now: '2026-05-27T12:00:00.000Z',
  });

  assert.equal(result.status, 'allow');
  assert.equal(result.engineerMobileVisible, true);
  assert.deepEqual(result.context, {
    organizationId: 'org_engineer_mobile_1744',
    engineerUserId: 'eng_user_1744',
    assignedAppointmentsReadAllowed: true,
    permissions: [READ_PERMISSION],
    requestMetadata: {
      requestId: 'ctx_req_1744',
      traceId: 'trace_1744',
      resolvedAt: '2026-05-27T12:00:00.000Z',
    },
  });
  assert.deepEqual(result.requestMetadata, result.context.requestMetadata);
  assertNoForbiddenLeak(result);
});

test('resolver supports expected safe input locations', () => {
  const fromAuth = resolveEngineerMobileWorkbenchRequestContext({
    request: {
      auth: {
        organizationId: 'org_auth_1744',
        engineerUserId: 'eng_auth_1744',
        permissions: [READ_PERMISSION],
      },
    },
  });
  const fromSession = resolveEngineerMobileWorkbenchRequestContext({
    request: {
      session: {
        organizationId: 'org_session_1744',
        engineerUserId: 'eng_session_1744',
        permissions: [READ_PERMISSION],
      },
    },
  });
  const fromUserIdWithPermission = resolveEngineerMobileWorkbenchRequestContext({
    request: {
      auth: {
        organizationId: 'org_user_1744',
        permissions: [READ_PERMISSION],
      },
      user: {
        id: 'eng_user_id_1744',
      },
    },
  });

  assert.equal(fromAuth.status, 'allow');
  assert.equal(fromAuth.context.organizationId, 'org_auth_1744');
  assert.equal(fromAuth.context.engineerUserId, 'eng_auth_1744');
  assert.equal(fromSession.status, 'allow');
  assert.equal(fromSession.context.organizationId, 'org_session_1744');
  assert.equal(fromSession.context.engineerUserId, 'eng_session_1744');
  assert.equal(fromUserIdWithPermission.status, 'allow');
  assert.equal(fromUserIdWithPermission.context.engineerUserId, 'eng_user_id_1744');
});

test('missing request fails closed', () => {
  const result = resolveEngineerMobileWorkbenchRequestContext();

  assert.equal(result.status, 'deny');
  assert.equal(result.error.reason, 'missing_request');
  assert.equal(result.context, null);
  assertNoForbiddenLeak(result);
});

test('missing organization fails closed', () => {
  const result = resolveEngineerMobileWorkbenchRequestContext({
    request: {
      context: {
        engineerUserId: 'eng_missing_org_1744',
        assignedAppointmentsReadAllowed: true,
      },
    },
  });

  assert.equal(result.status, 'deny');
  assert.equal(result.error.reason, 'missing_organization');
  assert.equal(result.context, null);
});

test('missing engineer identity fails closed', () => {
  const result = resolveEngineerMobileWorkbenchRequestContext({
    request: {
      context: {
        organizationId: 'org_missing_engineer_1744',
        assignedAppointmentsReadAllowed: true,
      },
    },
  });

  assert.equal(result.status, 'deny');
  assert.equal(result.error.reason, 'missing_engineer_identity');
  assert.equal(result.context, null);
});

test('missing read permission fails closed', () => {
  const result = resolveEngineerMobileWorkbenchRequestContext({
    request: {
      context: {
        organizationId: 'org_missing_permission_1744',
        engineerUserId: 'eng_missing_permission_1744',
      },
    },
  });

  assert.equal(result.status, 'deny');
  assert.equal(result.error.reason, 'missing_read_permission');
  assert.equal(result.context, null);
});

test('conflicting organization identities fail closed', () => {
  const result = resolveEngineerMobileWorkbenchRequestContext({
    request: {
      context: {
        organizationId: 'org_a_1744',
        engineerUserId: 'eng_conflict_org_1744',
        assignedAppointmentsReadAllowed: true,
      },
      auth: {
        organizationId: 'org_b_1744',
      },
    },
  });

  assert.equal(result.status, 'deny');
  assert.equal(result.error.reason, 'conflicting_organization');
  assert.equal(result.context, null);
});

test('conflicting engineer identities fail closed', () => {
  const result = resolveEngineerMobileWorkbenchRequestContext({
    request: {
      context: {
        organizationId: 'org_conflict_engineer_1744',
        engineerUserId: 'eng_a_1744',
        assignedAppointmentsReadAllowed: true,
      },
      auth: {
        engineerUserId: 'eng_b_1744',
      },
    },
  });

  assert.equal(result.status, 'deny');
  assert.equal(result.error.reason, 'conflicting_engineer_identity');
  assert.equal(result.context, null);
});

test('unsupported role fails closed', () => {
  const result = resolveEngineerMobileWorkbenchRequestContext({
    request: {
      context: {
        organizationId: 'org_role_1744',
        engineerUserId: 'eng_role_1744',
        assignedAppointmentsReadAllowed: true,
        roles: ['finance'],
      },
    },
  });

  assert.equal(result.status, 'deny');
  assert.equal(result.error.reason, 'unsupported_role');
  assert.equal(result.context, null);
});

test('malformed request context fails closed without raw error leak', () => {
  const result = resolveEngineerMobileWorkbenchRequestContext({
    request: {
      context: 'raw sql stack_trace_should_not_leak token_should_not_leak',
      auth: {
        organizationId: 'org_malformed_1744',
        engineerUserId: 'eng_malformed_1744',
        permissions: [READ_PERMISSION],
      },
    },
  });

  assert.equal(result.status, 'deny');
  assert.equal(result.error.reason, 'malformed_context');
  assert.equal(result.context, null);
  assertNoForbiddenLeak(result);
});

test('output excludes raw sensitive request fields', () => {
  const result = resolveEngineerMobileWorkbenchRequestContext({
    request: validRequest({
      headers: {
        authorization: 'authorization_header_should_not_leak',
        cookie: 'cookie_should_not_leak',
        'x-request-id': 'safe_req_1744',
      },
      auth: {
        token: 'token_should_not_leak',
        password: 'password_should_not_leak',
        secret: 'secret_should_not_leak',
      },
      session: {
        raw: 'raw_session_should_not_leak',
      },
      user: {
        raw: 'raw_user_should_not_leak',
      },
      rawSql: 'raw sql should_not_leak',
      rawDbRow: 'raw DB row should_not_leak',
      stack: 'stack_trace_should_not_leak',
      debugPayload: 'provider_debug_should_not_leak',
      finalAppointmentId: 'finalAppointmentId_should_not_leak',
      internalNotes: 'internal_note_should_not_leak',
    }),
  });

  assert.equal(result.status, 'allow');
  assert.deepEqual(result.requestMetadata, {
    requestId: 'ctx_req_1744',
  });
  assertNoForbiddenLeak(result);
});

test('resolver does not mutate the input request', () => {
  const request = validRequest({
    auth: {
      permissions: [READ_PERMISSION],
    },
  });
  const before = JSON.stringify(request);

  const result = resolveEngineerMobileWorkbenchRequestContext({ request });

  assert.equal(result.status, 'allow');
  assert.equal(JSON.stringify(request), before);
});

test('factory emits optional safe audit intent without requiring persistence', async () => {
  const records = [];
  const resolver = createEngineerMobileWorkbenchRequestContextResolver({
    clock: () => '2026-05-27T12:01:00.000Z',
    auditLogger: {
      async record(metadata) {
        records.push(metadata);
      },
    },
  });

  const result = await resolver({
    request: validRequest(),
  });

  assert.equal(result.status, 'allow');
  assert.deepEqual(records, [
    {
      event: 'engineerMobile.workbenchRequestContext.resolve',
      outcome: 'allow',
      reason: undefined,
      organizationId: 'org_engineer_mobile_1744',
      engineerUserId: 'eng_user_1744',
      requestMetadata: {
        requestId: 'ctx_req_1744',
        traceId: 'trace_1744',
        resolvedAt: '2026-05-27T12:01:00.000Z',
      },
    },
  ]);
  assertNoForbiddenLeak(records);
});

test('resolver source stays isolated from DB app server routes provider and mutation surfaces', () => {
  const source = fs.readFileSync(RESOLVER_SOURCE, 'utf8');

  for (const forbidden of [
    "require('../app')",
    "require('../server')",
    "require('../routes",
    'src/app',
    'src/server',
    'src/routes',
    'listen(',
    'postgres',
    'psql',
    'db:migrate',
    'migration',
    'smoke',
    'line',
    'sms',
    'email',
    'webhook',
    'rag',
    'billing',
    'settlement',
    'finalAppointmentId',
    'fieldServiceReport',
    'completeAppointment',
    'submitFieldServiceReport',
  ]) {
    assert.equal(source.includes(forbidden), false, `resolver source includes forbidden token ${forbidden}`);
  }
});
