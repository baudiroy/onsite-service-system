'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  ENGINEER_MOBILE_ALLOWED_ROLES,
  ENGINEER_MOBILE_REQUIRED_PERMISSIONS,
  buildEngineerMobilePermissionContext,
  createEngineerMobilePermissionMiddleware,
} = require('../../src/engineerMobile/engineerMobilePermissionMiddleware');

const repoRoot = path.resolve(__dirname, '../..');
const sourceFile = path.join(
  repoRoot,
  'src/engineerMobile/engineerMobilePermissionMiddleware.js',
);

function auth(overrides = {}) {
  return {
    organizationId: 'org_engineer_mobile_permission_001',
    userId: 'user_engineer_mobile_permission_001',
    engineerId: 'eng_engineer_mobile_permission_001',
    role: 'engineer',
    permissions: ['engineer_mobile.tasks.read'],
    rawPhone: 'raw_phone_should_not_leak',
    rawAddress: 'raw_address_should_not_leak',
    rawLineUserId: 'raw_line_user_should_not_leak',
    token: 'token_should_not_leak',
    secret: 'secret_should_not_leak',
    DATABASE_URL: 'DATABASE_URL_should_not_leak',
    internalNote: 'internal_note_should_not_leak',
    aiRawPayload: 'ai_raw_should_not_leak',
    finalAppointmentId: 'final_appointment_should_not_leak',
    ...overrides,
  };
}

function request(authOverrides = {}) {
  return {
    auth: auth(authOverrides),
    untouched: {
      stable: true,
    },
    body: {
      rawPhone: 'body_raw_phone_should_not_leak',
      secret: 'body_secret_should_not_leak',
    },
  };
}

function response() {
  return {
    statusCode: undefined,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function assertNoSensitive(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'raw_phone_should_not_leak',
    'raw_address_should_not_leak',
    'raw_line_user_should_not_leak',
    'token_should_not_leak',
    'secret_should_not_leak',
    'DATABASE_URL_should_not_leak',
    'internal_note_should_not_leak',
    'ai_raw_should_not_leak',
    'final_appointment_should_not_leak',
    'body_raw_phone_should_not_leak',
    'body_secret_should_not_leak',
    'rawPhone',
    'rawAddress',
    'rawLineUserId',
    'DATABASE_URL',
    'internalNote',
    'aiRawPayload',
    'finalAppointmentId',
    'token',
    'secret',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function runMiddleware(req, next = () => {}) {
  const res = response();
  const middleware = createEngineerMobilePermissionMiddleware();
  const result = middleware(req, res, next);

  return {
    req,
    res,
    result,
  };
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
  assert.equal(typeof buildEngineerMobilePermissionContext, 'function');
  assert.equal(typeof createEngineerMobilePermissionMiddleware, 'function');
  assert.deepEqual(ENGINEER_MOBILE_REQUIRED_PERMISSIONS, [
    'engineer_mobile.tasks.read',
    'engineer_mobile.tasks.read.assigned',
    'engineer_mobile.workbench.access',
  ]);
  assert.deepEqual(ENGINEER_MOBILE_ALLOWED_ROLES, [
    'admin',
    'dispatch_assistant',
    'engineer',
    'supervisor',
  ]);
});

test('missing auth denied with generic 403', () => {
  const { res } = runMiddleware({});

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, {
    status: 'deny',
    messageKey: 'engineerMobile.unavailable',
    data: null,
  });
  assertNoSensitive(res.body);
});

test('missing required auth fields are denied', () => {
  for (const field of ['organizationId', 'userId', 'engineerId', 'role', 'permissions']) {
    const req = request({ [field]: field === 'permissions' ? [] : undefined });
    const decision = buildEngineerMobilePermissionContext(req);

    assert.equal(decision.allowed, false, `${field} should deny`);
    assert.equal(decision.statusCode, 403);
    assertNoSensitive(decision);
  }
});

test('engineer with task read permission passes and sets safe context', () => {
  const req = request();
  let nextCalls = 0;
  const { res } = runMiddleware(req, () => {
    nextCalls += 1;
  });

  assert.equal(nextCalls, 1);
  assert.equal(res.statusCode, undefined);
  assert.deepEqual(req.engineerMobilePermissionContext, {
    organizationId: 'org_engineer_mobile_permission_001',
    userId: 'user_engineer_mobile_permission_001',
    engineerId: 'eng_engineer_mobile_permission_001',
    role: 'engineer',
    permissions: ['engineer_mobile.tasks.read'],
  });
  assertNoSensitive(req.engineerMobilePermissionContext);
});

test('compatible assigned/read/workbench permissions pass for engineer', () => {
  for (const permission of [
    'engineer_mobile.tasks.read.assigned',
    'engineer_mobile.workbench.access',
  ]) {
    const decision = buildEngineerMobilePermissionContext(request({ permissions: [permission] }));

    assert.equal(decision.allowed, true, `${permission} should allow`);
    assert.deepEqual(decision.permissionContext.permissions, [permission]);
  }
});

test('supervisor admin and dispatch assistant pass only with permission and engineerId', () => {
  for (const role of ['supervisor', 'admin', 'dispatch_assistant']) {
    const allowDecision = buildEngineerMobilePermissionContext(request({ role }));

    assert.equal(allowDecision.allowed, true, `${role} should allow with engineerId`);

    const missingEngineerDecision = buildEngineerMobilePermissionContext(request({
      role,
      engineerId: undefined,
    }));

    assert.equal(missingEngineerDecision.allowed, false, `${role} should deny without engineerId`);
  }
});

test('customer service denied by default and AI role denied always', () => {
  const customerServiceDecision = buildEngineerMobilePermissionContext(request({
    role: 'customer_service',
  }));
  const aiDecision = buildEngineerMobilePermissionContext(request({
    role: 'ai',
    permissions: [
      'engineer_mobile.tasks.read',
      'engineer_mobile.tasks.read.assigned',
      'engineer_mobile.workbench.access',
    ],
  }));

  assert.equal(customerServiceDecision.allowed, false);
  assert.equal(aiDecision.allowed, false);
  assertNoSensitive([customerServiceDecision, aiDecision]);
});

test('denied response is generic and does not leak raw reason', () => {
  const { res } = runMiddleware(request({
    permissions: [],
    rawPhone: 'specific_raw_phone_reason_should_not_leak',
  }));

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, {
    status: 'deny',
    messageKey: 'engineerMobile.unavailable',
    data: null,
  });
  assert.equal(JSON.stringify(res.body).includes('missing'), false);
  assert.equal(JSON.stringify(res.body).includes('specific_raw_phone_reason_should_not_leak'), false);
});

test('malformed next and malformed response do not throw', () => {
  const middleware = createEngineerMobilePermissionMiddleware();
  const allowedReq = request();
  const deniedReq = {};

  assert.doesNotThrow(() => middleware(allowedReq, response(), undefined));
  assert.doesNotThrow(() => middleware(deniedReq, {}, undefined));
});

test('unrelated request fields are not mutated', () => {
  const req = request();
  const before = JSON.stringify(req.untouched);

  runMiddleware(req);

  assert.equal(JSON.stringify(req.untouched), before);
  assert.equal(req.body.rawPhone, 'body_raw_phone_should_not_leak');
});

test('module import boundary avoids DB repository provider AI route app and server imports', () => {
  const source = fs.readFileSync(sourceFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, []);

  for (const pattern of [
    /db|pool|transaction|repositories?/i,
    /line|sms|email|push|provider/i,
    /rag|vector|openai/i,
    /routes?|controllers?|app|server/i,
  ]) {
    assert.equal(pattern.test(source), false, `forbidden source pattern ${pattern}`);
  }
});
