'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  DATA_CORRECTION_ACTION_PERMISSION_ALIASES,
  DATA_CORRECTION_ACTION_PERMISSION_MAP,
  DATA_CORRECTION_PERMISSION_ACTION_PERMISSION_CONTRACT,
  DATA_CORRECTION_PERMISSION_ACTIONS,
  DATA_CORRECTION_PERMISSION_ACTION_ORDER,
  DATA_CORRECTION_PERMISSION_ACTION_SOURCE_PATHS,
  DATA_CORRECTION_PERMISSION_CONTEXT_KEYS,
  DATA_CORRECTION_PERMISSION_REQUEST_CONTEXT_KEYS,
  DATA_CORRECTION_PERMISSION_ROLE_CONTRACT,
  DATA_CORRECTION_PERMISSION_SAFE_DENY_RESPONSE,
  DATA_CORRECTION_PERMISSION_STATUS_CODES,
  createDataCorrectionPermissionMiddleware,
  evaluateDataCorrectionPermission,
} = require('../../src/dataCorrection/dataCorrectionPermissionMiddleware');

const repoRoot = path.resolve(__dirname, '../..');
const middlewareFile = path.join(repoRoot, 'src/dataCorrection/dataCorrectionPermissionMiddleware.js');

function auth(overrides = {}) {
  return {
    organizationId: 'org_data_correction_permission_001',
    userId: 'user_data_correction_permission_001',
    role: 'customer_service',
    permissions: ['case.correction.request'],
    ...overrides,
  };
}

function req(overrides = {}) {
  const { auth: authOverrides, body: bodyOverrides, ...rest } = overrides;

  return {
    auth: auth(authOverrides),
    body: {
      actionType: DATA_CORRECTION_PERMISSION_ACTIONS.DATA_CORRECTION_REQUEST,
      payload: {
        rawPhone: 'raw_phone_should_not_leak',
        rawAddress: 'raw_address_should_not_leak',
        rawLineUserId: 'line_user_should_not_leak',
        token: 'token_should_not_leak',
        secret: 'secret_should_not_leak',
        internalNote: 'internal_note_should_not_leak',
        aiRawPayload: 'ai_raw_payload_should_not_leak',
      },
      ...bodyOverrides,
    },
    untouched: {
      keep: true,
    },
    ...rest,
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

function callMiddleware(request, next) {
  const middleware = createDataCorrectionPermissionMiddleware();
  const response = createResponse();
  const nextCalls = [];
  const nextFn = next === undefined
    ? () => {
      nextCalls.push('next');
    }
    : next;

  const result = middleware(request, response, nextFn);

  return {
    nextCalls,
    request,
    response,
    result,
  };
}

function assertDenied(output) {
  assert.deepEqual(output.response.statusCalls, [
    DATA_CORRECTION_PERMISSION_STATUS_CODES.FORBIDDEN,
  ]);
  assert.deepEqual(output.response.jsonCalls, [{
    ...DATA_CORRECTION_PERMISSION_SAFE_DENY_RESPONSE,
  }]);
  assert.deepEqual(output.nextCalls, []);
  assertNoSensitiveLeak(output.response.jsonCalls[0]);
}

function assertNoSensitiveLeak(value) {
  const serialized = JSON.stringify(value);

  for (const forbiddenValue of [
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'line_user_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'internal_note_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'MISSING_PERMISSION',
    'UNKNOWN_ACTION',
    'AI_ACTOR',
  ]) {
    assert.equal(serialized.includes(forbiddenValue), false, `leaked ${forbiddenValue}`);
  }
}

function requireSpecifiers(source) {
  const specifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers;
}

test('exports required functions and constants', () => {
  assert.equal(typeof createDataCorrectionPermissionMiddleware, 'function');
  assert.equal(typeof evaluateDataCorrectionPermission, 'function');
  assert.equal(Object.isFrozen(DATA_CORRECTION_PERMISSION_STATUS_CODES), true);
  assert.deepEqual(DATA_CORRECTION_PERMISSION_STATUS_CODES, {
    FORBIDDEN: 403,
    OK: 200,
  });
  assert.equal(Object.isFrozen(DATA_CORRECTION_PERMISSION_SAFE_DENY_RESPONSE), true);
  assert.deepEqual(DATA_CORRECTION_PERMISSION_SAFE_DENY_RESPONSE, {
    status: 'deny',
    messageKey: 'dataCorrection.unavailable',
    data: null,
  });
  assert.equal(Object.isFrozen(DATA_CORRECTION_PERMISSION_CONTEXT_KEYS), true);
  assert.deepEqual(DATA_CORRECTION_PERMISSION_CONTEXT_KEYS, [
    'organizationId',
    'userId',
    'role',
    'permissions',
    'allowedActionTypes',
  ]);
  assert.equal(Object.isFrozen(DATA_CORRECTION_PERMISSION_REQUEST_CONTEXT_KEYS), true);
  assert.deepEqual(DATA_CORRECTION_PERMISSION_REQUEST_CONTEXT_KEYS, {
    AUTH: 'auth',
    PERMISSION_CONTEXT: 'dataCorrectionPermissionContext',
  });
  assert.equal(Object.isFrozen(DATA_CORRECTION_PERMISSION_ACTION_ORDER), true);
  assert.deepEqual(DATA_CORRECTION_PERMISSION_ACTION_ORDER, [
    DATA_CORRECTION_PERMISSION_ACTIONS.DATA_CORRECTION_REQUEST,
    DATA_CORRECTION_PERMISSION_ACTIONS.FOLLOW_UP_PROPOSAL,
    DATA_CORRECTION_PERMISSION_ACTIONS.POST_DEPARTURE_FREEZE,
    DATA_CORRECTION_PERMISSION_ACTIONS.PRE_DEPARTURE_APPLY,
    DATA_CORRECTION_PERMISSION_ACTIONS.UNABLE_TO_COMPLETE_RESULT,
  ]);
  assert.deepEqual(
    [...DATA_CORRECTION_PERMISSION_ACTION_ORDER].sort(),
    Object.values(DATA_CORRECTION_PERMISSION_ACTIONS).sort(),
  );
  assert.deepEqual(
    [...DATA_CORRECTION_PERMISSION_ACTION_ORDER].sort(),
    Object.keys(DATA_CORRECTION_ACTION_PERMISSION_MAP).sort(),
  );
  assert.equal(Object.isFrozen(DATA_CORRECTION_PERMISSION_ACTION_SOURCE_PATHS), true);
  assert.deepEqual(DATA_CORRECTION_PERMISSION_ACTION_SOURCE_PATHS, [
    'body.actionType',
    'body.payload.actionType',
  ]);
  assert.equal(Object.isFrozen(DATA_CORRECTION_PERMISSION_ACTION_PERMISSION_CONTRACT), true);
  assert.deepEqual(Object.keys(DATA_CORRECTION_PERMISSION_ACTION_PERMISSION_CONTRACT), [
    'ACTION_ORDER',
    'CANONICAL_PERMISSION_MAP',
    'ALIAS_PERMISSION_MAP',
  ]);
  assert.equal(
    DATA_CORRECTION_PERMISSION_ACTION_PERMISSION_CONTRACT.ACTION_ORDER,
    DATA_CORRECTION_PERMISSION_ACTION_ORDER,
  );
  assert.equal(
    DATA_CORRECTION_PERMISSION_ACTION_PERMISSION_CONTRACT.CANONICAL_PERMISSION_MAP,
    DATA_CORRECTION_ACTION_PERMISSION_MAP,
  );
  assert.equal(
    DATA_CORRECTION_PERMISSION_ACTION_PERMISSION_CONTRACT.ALIAS_PERMISSION_MAP,
    DATA_CORRECTION_ACTION_PERMISSION_ALIASES,
  );
  assert.equal(Object.isFrozen(DATA_CORRECTION_PERMISSION_ROLE_CONTRACT), true);
  assert.equal(Object.isFrozen(DATA_CORRECTION_PERMISSION_ROLE_CONTRACT.GENERAL_CORRECTION_ROLES), true);
  assert.equal(Object.isFrozen(DATA_CORRECTION_PERMISSION_ROLE_CONTRACT.ENGINEER_ALLOWED_ACTIONS), true);
  assert.deepEqual(DATA_CORRECTION_PERMISSION_ROLE_CONTRACT, {
    GENERAL_CORRECTION_ROLES: [
      'admin',
      'customer_service',
      'dispatch_assistant',
      'supervisor',
    ],
    ENGINEER_ALLOWED_ACTIONS: [
      DATA_CORRECTION_PERMISSION_ACTIONS.UNABLE_TO_COMPLETE_RESULT,
    ],
  });
  assert.equal(
    DATA_CORRECTION_ACTION_PERMISSION_MAP[DATA_CORRECTION_PERMISSION_ACTIONS.PRE_DEPARTURE_APPLY],
    'case.correction.apply',
  );
  assert.equal(
    DATA_CORRECTION_ACTION_PERMISSION_MAP[DATA_CORRECTION_PERMISSION_ACTIONS.UNABLE_TO_COMPLETE_RESULT],
    'appointment.result.record',
  );
  assert.deepEqual(
    DATA_CORRECTION_ACTION_PERMISSION_ALIASES[DATA_CORRECTION_PERMISSION_ACTIONS.PRE_DEPARTURE_APPLY],
    ['data_correction.apply'],
  );
  assert.deepEqual(
    DATA_CORRECTION_ACTION_PERMISSION_ALIASES[DATA_CORRECTION_PERMISSION_ACTIONS.FOLLOW_UP_PROPOSAL],
    ['dispatch.follow_up.propose'],
  );

  assert.throws(() => {
    DATA_CORRECTION_PERMISSION_STATUS_CODES.FORBIDDEN = 401;
  }, TypeError);
  assert.throws(() => {
    DATA_CORRECTION_PERMISSION_SAFE_DENY_RESPONSE.messageKey = 'unsafe.message';
  }, TypeError);
  assert.throws(() => {
    DATA_CORRECTION_PERMISSION_CONTEXT_KEYS.push('rawPhone');
  }, TypeError);
  assert.throws(() => {
    DATA_CORRECTION_PERMISSION_REQUEST_CONTEXT_KEYS.AUTH = 'headers';
  }, TypeError);
  assert.throws(() => {
    DATA_CORRECTION_PERMISSION_ACTION_ORDER.push('unsafe_action');
  }, TypeError);
  assert.throws(() => {
    DATA_CORRECTION_PERMISSION_ACTION_SOURCE_PATHS.push('query.actionType');
  }, TypeError);
  assert.throws(() => {
    DATA_CORRECTION_PERMISSION_ACTION_PERMISSION_CONTRACT.ACTION_ORDER = [];
  }, TypeError);
  assert.throws(() => {
    DATA_CORRECTION_PERMISSION_ROLE_CONTRACT.GENERAL_CORRECTION_ROLES.push('ai');
  }, TypeError);
  assert.throws(() => {
    DATA_CORRECTION_PERMISSION_ROLE_CONTRACT.ENGINEER_ALLOWED_ACTIONS.push(
      DATA_CORRECTION_PERMISSION_ACTIONS.PRE_DEPARTURE_APPLY,
    );
  }, TypeError);
});

test('missing auth denied 403', () => {
  assertDenied(callMiddleware({ body: req().body }));
});

test('headers and session are not accepted as auth context sources', () => {
  assertDenied(callMiddleware({
    body: req().body,
    headers: {
      authorization: 'Bearer token_should_not_leak',
    },
    session: {
      auth: auth(),
    },
  }));
});

test('missing organizationId denied', () => {
  assertDenied(callMiddleware(req({ auth: { organizationId: undefined } })));
});

test('missing userId denied', () => {
  assertDenied(callMiddleware(req({ auth: { userId: undefined } })));
});

test('missing role denied', () => {
  assertDenied(callMiddleware(req({ auth: { role: undefined } })));
});

test('missing permissions denied', () => {
  assertDenied(callMiddleware(req({ auth: { permissions: [] } })));
});

test('customer_service with case.correction.request can pass data_correction_request', () => {
  const request = req({
    auth: {
      role: 'customer_service',
      permissions: ['case.correction.request'],
    },
  });
  const output = callMiddleware(request);

  assert.deepEqual(output.response.statusCalls, []);
  assert.deepEqual(output.nextCalls, ['next']);
  assert.equal(request.dataCorrectionPermissionContext.organizationId, 'org_data_correction_permission_001');
  assert.equal(request.dataCorrectionPermissionContext.userId, 'user_data_correction_permission_001');
  assert.equal(request.dataCorrectionPermissionContext.role, 'customer_service');
  assert.deepEqual(request.dataCorrectionPermissionContext.permissions, ['case.correction.request']);
  assert.deepEqual(request.dataCorrectionPermissionContext.allowedActionTypes, [
    DATA_CORRECTION_PERMISSION_ACTIONS.DATA_CORRECTION_REQUEST,
    DATA_CORRECTION_PERMISSION_ACTIONS.POST_DEPARTURE_FREEZE,
  ]);
  assert.deepEqual(Object.keys(request.dataCorrectionPermissionContext).sort(), [
    ...DATA_CORRECTION_PERMISSION_CONTEXT_KEYS,
  ].sort());
  assertNoSensitiveLeak(request.dataCorrectionPermissionContext);
});

test('dispatch_assistant with case.correction.apply can pass pre_departure_apply', () => {
  const output = callMiddleware(req({
    auth: {
      role: 'dispatch_assistant',
      permissions: ['case.correction.apply'],
    },
    body: {
      actionType: DATA_CORRECTION_PERMISSION_ACTIONS.PRE_DEPARTURE_APPLY,
    },
  }));

  assert.deepEqual(output.response.statusCalls, []);
  assert.deepEqual(output.nextCalls, ['next']);
  assert.deepEqual(output.request.dataCorrectionPermissionContext.allowedActionTypes, [
    DATA_CORRECTION_PERMISSION_ACTIONS.PRE_DEPARTURE_APPLY,
  ]);
});

test('dispatch_assistant with data_correction.apply alias can pass pre_departure_apply', () => {
  const output = callMiddleware(req({
    auth: {
      role: 'dispatch_assistant',
      permissions: ['data_correction.apply'],
    },
    body: {
      actionType: DATA_CORRECTION_PERMISSION_ACTIONS.PRE_DEPARTURE_APPLY,
    },
  }));

  assert.deepEqual(output.response.statusCalls, []);
  assert.deepEqual(output.nextCalls, ['next']);
  assert.deepEqual(output.request.dataCorrectionPermissionContext.allowedActionTypes, [
    DATA_CORRECTION_PERMISSION_ACTIONS.PRE_DEPARTURE_APPLY,
  ]);
});

test('supervisor with required permission can pass post_departure_freeze', () => {
  const output = callMiddleware(req({
    auth: {
      role: 'supervisor',
      permissions: ['case.correction.request'],
    },
    body: {
      actionType: DATA_CORRECTION_PERMISSION_ACTIONS.POST_DEPARTURE_FREEZE,
    },
  }));

  assert.deepEqual(output.response.statusCalls, []);
  assert.deepEqual(output.nextCalls, ['next']);
});

test('customer_service with data_correction.request alias can pass post_departure_freeze', () => {
  const output = callMiddleware(req({
    auth: {
      role: 'customer_service',
      permissions: ['data_correction.request'],
    },
    body: {
      actionType: DATA_CORRECTION_PERMISSION_ACTIONS.POST_DEPARTURE_FREEZE,
    },
  }));

  assert.deepEqual(output.response.statusCalls, []);
  assert.deepEqual(output.nextCalls, ['next']);
  assert.deepEqual(output.request.dataCorrectionPermissionContext.allowedActionTypes, [
    DATA_CORRECTION_PERMISSION_ACTIONS.DATA_CORRECTION_REQUEST,
    DATA_CORRECTION_PERMISSION_ACTIONS.POST_DEPARTURE_FREEZE,
  ]);
});

test('payload actionType fallback is accepted without query or header action source', () => {
  const output = callMiddleware(req({
    auth: {
      role: 'dispatch_assistant',
      permissions: ['case.correction.apply'],
    },
    body: {
      actionType: undefined,
      payload: {
        actionType: DATA_CORRECTION_PERMISSION_ACTIONS.PRE_DEPARTURE_APPLY,
        rawPhone: 'raw_phone_should_not_leak',
      },
    },
    query: {
      actionType: DATA_CORRECTION_PERMISSION_ACTIONS.UNABLE_TO_COMPLETE_RESULT,
    },
    headers: {
      'x-action-type': DATA_CORRECTION_PERMISSION_ACTIONS.FOLLOW_UP_PROPOSAL,
    },
  }));

  assert.deepEqual(output.response.statusCalls, []);
  assert.deepEqual(output.nextCalls, ['next']);
  assert.deepEqual(output.request.dataCorrectionPermissionContext.allowedActionTypes, [
    DATA_CORRECTION_PERMISSION_ACTIONS.PRE_DEPARTURE_APPLY,
  ]);
  assertNoSensitiveLeak(output.request.dataCorrectionPermissionContext);
});

test('admin with required permission can pass follow_up_proposal', () => {
  const output = callMiddleware(req({
    auth: {
      role: 'admin',
      permissions: ['appointment.follow_up.propose'],
    },
    body: {
      actionType: DATA_CORRECTION_PERMISSION_ACTIONS.FOLLOW_UP_PROPOSAL,
    },
  }));

  assert.deepEqual(output.response.statusCalls, []);
  assert.deepEqual(output.nextCalls, ['next']);
  assert.deepEqual(output.request.dataCorrectionPermissionContext.allowedActionTypes, [
    DATA_CORRECTION_PERMISSION_ACTIONS.FOLLOW_UP_PROPOSAL,
  ]);
});

test('admin with dispatch.follow_up.propose alias can pass follow_up_proposal', () => {
  const output = callMiddleware(req({
    auth: {
      role: 'admin',
      permissions: ['dispatch.follow_up.propose'],
    },
    body: {
      actionType: DATA_CORRECTION_PERMISSION_ACTIONS.FOLLOW_UP_PROPOSAL,
    },
  }));

  assert.deepEqual(output.response.statusCalls, []);
  assert.deepEqual(output.nextCalls, ['next']);
  assert.deepEqual(output.request.dataCorrectionPermissionContext.allowedActionTypes, [
    DATA_CORRECTION_PERMISSION_ACTIONS.FOLLOW_UP_PROPOSAL,
  ]);
});

test('engineer cannot pass general correction apply by default', () => {
  assertDenied(callMiddleware(req({
    auth: {
      role: 'engineer',
      permissions: ['case.correction.apply'],
    },
    body: {
      actionType: DATA_CORRECTION_PERMISSION_ACTIONS.PRE_DEPARTURE_APPLY,
    },
  })));
});

test('engineer with appointment.result.record can pass unable_to_complete_result', () => {
  const output = callMiddleware(req({
    auth: {
      role: 'engineer',
      permissions: ['appointment.result.record'],
    },
    body: {
      actionType: DATA_CORRECTION_PERMISSION_ACTIONS.UNABLE_TO_COMPLETE_RESULT,
    },
  }));

  assert.deepEqual(output.response.statusCalls, []);
  assert.deepEqual(output.nextCalls, ['next']);
  assert.deepEqual(output.request.dataCorrectionPermissionContext.allowedActionTypes, [
    DATA_CORRECTION_PERMISSION_ACTIONS.UNABLE_TO_COMPLETE_RESULT,
  ]);
});

test('AI role denied even with permissions', () => {
  assertDenied(callMiddleware(req({
    auth: {
      role: 'ai',
      permissions: [
        'case.correction.request',
        'case.correction.apply',
        'appointment.result.record',
        'appointment.follow_up.propose',
      ],
    },
  })));
});

test('unknown actionType denied with generic response', () => {
  assertDenied(callMiddleware(req({
    body: {
      actionType: 'unknown_action_type',
    },
  })));
});

test('allowed path calls next once and mutates only permission context', () => {
  const request = req();
  const beforeUntouched = JSON.parse(JSON.stringify(request.untouched));
  const output = callMiddleware(request);

  assert.deepEqual(output.nextCalls, ['next']);
  assert.deepEqual(request.untouched, beforeUntouched);
  assert.equal(Object.prototype.hasOwnProperty.call(request, 'dataCorrectionPermissionContext'), true);
  assertNoSensitiveLeak(request.dataCorrectionPermissionContext);
});

test('malformed next does not throw on allowed path', () => {
  const request = req();
  const middleware = createDataCorrectionPermissionMiddleware();
  const response = createResponse();

  assert.doesNotThrow(() => middleware(request, response, null));
  assert.deepEqual(response.statusCalls, []);
  assert.deepEqual(request.dataCorrectionPermissionContext.allowedActionTypes, [
    DATA_CORRECTION_PERMISSION_ACTIONS.DATA_CORRECTION_REQUEST,
    DATA_CORRECTION_PERMISSION_ACTIONS.POST_DEPARTURE_FREEZE,
  ]);
});

test('response and context do not leak raw phone, address, LINE id, token, or secret', () => {
  const allowed = callMiddleware(req());
  const denied = callMiddleware(req({
    auth: {
      permissions: [],
    },
  }));

  assertNoSensitiveLeak(allowed.request.dataCorrectionPermissionContext);
  assertNoSensitiveLeak(denied.response.jsonCalls[0]);
});

test('module import boundary has no DB, repository, provider, AI, or route/controller imports', () => {
  const source = fs.readFileSync(middlewareFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, []);
  assert.doesNotMatch(source, /require\(/);
  assert.doesNotMatch(source, /db|pool|repositories?|transaction|provider|lineProvider|sms|email|push|rag|vector/i);
});
