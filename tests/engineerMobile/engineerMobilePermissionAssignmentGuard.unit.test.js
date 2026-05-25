'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_ACTIONS,
  ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_ALLOWED_ROLES,
  ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REASON_KEYS,
  ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REQUIRED_PERMISSIONS,
  evaluateEngineerMobilePermissionAssignment,
} = require('../../src/engineerMobile/engineerMobilePermissionAssignmentGuard');

const repoRoot = path.resolve(__dirname, '../..');
const sourceFile = path.join(
  repoRoot,
  'src/engineerMobile/engineerMobilePermissionAssignmentGuard.js',
);

function auth(overrides = {}) {
  return {
    engineerId: 'eng_task_guard_001',
    organizationId: 'org_task_guard_001',
    permissions: ['engineer_mobile.tasks.read'],
    role: 'engineer',
    userId: 'user_task_guard_001',
    ...unsafeExtras(),
    ...overrides,
  };
}

function assignment(overrides = {}) {
  return {
    appointmentId: 'apt_should_not_be_copied',
    assignedEngineerId: 'eng_task_guard_001',
    finalAppointmentId: 'final_appointment_should_not_leak',
    fieldServiceReportId: 'fsr_should_not_leak',
    organizationId: 'org_task_guard_001',
    rawAddress: 'raw_address_should_not_leak',
    rawPhone: 'raw_phone_should_not_leak',
    reportId: 'report_should_not_leak',
    ...overrides,
  };
}

function request(overrides = {}) {
  return {
    action: ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_ACTIONS.TASK_LIST,
    assignment: assignment(),
    auth: auth(),
    body: {
      rawPhone: 'body_raw_phone_should_not_leak',
      secret: 'body_secret_should_not_leak',
    },
    ...overrides,
  };
}

function unsafeExtras() {
  return {
    DATABASE_URL: 'DATABASE_URL_should_not_leak',
    aiRawPayload: 'ai_raw_payload_should_not_leak',
    auditRawPayload: 'audit_raw_payload_should_not_leak',
    billingInternalData: 'billing_internal_should_not_leak',
    fullAddress: 'full_address_should_not_leak',
    fullPayload: 'full_payload_should_not_leak',
    internalNote: 'internal_note_should_not_leak',
    lineAccessToken: 'line_access_token_should_not_leak',
    rawLineUserId: 'raw_line_user_should_not_leak',
    secret: 'secret_should_not_leak',
    token: 'token_should_not_leak',
  };
}

function assertAllowed(decision, action = ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_ACTIONS.TASK_LIST) {
  assert.equal(decision.allowed, true);
  assert.equal(decision.decision, 'allow');
  assert.equal(decision.reasonKey, ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REASON_KEYS.ALLOWED);
  assert.equal(decision.action, action);
  assertNoSensitive(decision);
}

function assertDenied(decision, reasonKey) {
  assert.equal(decision.allowed, false);
  assert.equal(decision.decision, 'deny');
  assert.equal(decision.reasonKey, reasonKey);
  assertNoSensitive(decision);
}

function assertDecisionShape(decision) {
  assert.deepEqual(Object.keys(decision).sort(), [
    'action',
    'allowed',
    'auditIntent',
    'decision',
    'reasonKey',
    'scope',
  ]);
}

function assertNoSensitive(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'DATABASE_URL_should_not_leak',
    'ai_raw_payload_should_not_leak',
    'audit_raw_payload_should_not_leak',
    'billing_internal_should_not_leak',
    'body_raw_phone_should_not_leak',
    'body_secret_should_not_leak',
    'final_appointment_should_not_leak',
    'fsr_should_not_leak',
    'full_address_should_not_leak',
    'full_payload_should_not_leak',
    'internal_note_should_not_leak',
    'line_access_token_should_not_leak',
    'raw_address_should_not_leak',
    'raw_line_user_should_not_leak',
    'raw_phone_should_not_leak',
    'report_should_not_leak',
    'secret_should_not_leak',
    'token_should_not_leak',
    'DATABASE_URL',
    'aiRawPayload',
    'auditRawPayload',
    'billingInternalData',
    'finalAppointmentId',
    'fieldServiceReportId',
    'fullAddress',
    'fullPayload',
    'internalNote',
    'lineAccessToken',
    'rawAddress',
    'rawLineUserId',
    'rawPhone',
    'reportId',
    'secret',
    'token',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
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

test('exports actions roles permissions and evaluator', () => {
  assert.equal(typeof evaluateEngineerMobilePermissionAssignment, 'function');
  assert.deepEqual(ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_ACTIONS, {
    TASK_DETAIL: 'task_detail',
    TASK_LIST: 'task_list',
  });
  assert.deepEqual(ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REQUIRED_PERMISSIONS, [
    'engineer_mobile.tasks.read',
    'engineer_mobile.tasks.read.assigned',
    'engineer_mobile.workbench.access',
  ]);
  assert.deepEqual(ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_ALLOWED_ROLES, [
    'admin',
    'dispatch_assistant',
    'engineer',
    'supervisor',
  ]);
});

test('allows task list for assigned engineer in same organization', () => {
  const decision = evaluateEngineerMobilePermissionAssignment(request());

  assertDecisionShape(decision);
  assertAllowed(decision);
  assert.deepEqual(decision.scope, {
    assignedEngineerId: 'eng_task_guard_001',
    engineerId: 'eng_task_guard_001',
    organizationId: 'org_task_guard_001',
  });
});

test('allows task detail for assigned engineer in same organization', () => {
  const decision = evaluateEngineerMobilePermissionAssignment(request({
    action: ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_ACTIONS.TASK_DETAIL,
  }));

  assertDecisionShape(decision);
  assertAllowed(decision, ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_ACTIONS.TASK_DETAIL);
});

test('compatible permissions allow task list and task detail', () => {
  for (const permission of [
    'engineer_mobile.tasks.read.assigned',
    'engineer_mobile.workbench.access',
  ]) {
    const listDecision = evaluateEngineerMobilePermissionAssignment(request({
      auth: auth({ permissions: [permission] }),
    }));
    const detailDecision = evaluateEngineerMobilePermissionAssignment(request({
      action: ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_ACTIONS.TASK_DETAIL,
      auth: auth({ permissions: [permission] }),
    }));

    assertAllowed(listDecision);
    assertAllowed(detailDecision, ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_ACTIONS.TASK_DETAIL);
  }
});

test('missing organization user engineer role or action fails closed', () => {
  for (const field of ['organizationId', 'userId', 'engineerId', 'role']) {
    const decision = evaluateEngineerMobilePermissionAssignment(request({
      auth: auth({ [field]: undefined }),
    }));

    assertDenied(decision, ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REASON_KEYS.MISSING_SCOPE);
  }

  const unsupported = evaluateEngineerMobilePermissionAssignment(request({ action: 'delete_task' }));

  assertDenied(unsupported, ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REASON_KEYS.UNSUPPORTED_ACTION);
  assert.equal(unsupported.action, 'unknown');
});

test('missing assignment fails closed before task access', () => {
  const decision = evaluateEngineerMobilePermissionAssignment({
    action: ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_ACTIONS.TASK_LIST,
    auth: auth(),
  });

  assertDenied(decision, ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REASON_KEYS.MISSING_ASSIGNMENT);
});

test('cross-organization assignment fails closed', () => {
  const decision = evaluateEngineerMobilePermissionAssignment(request({
    assignment: assignment({ organizationId: 'org_other' }),
  }));

  assertDenied(decision, ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REASON_KEYS.CROSS_ORGANIZATION);
});

test('engineer not assigned or eligible for task fails closed', () => {
  const decision = evaluateEngineerMobilePermissionAssignment(request({
    assignment: assignment({ assignedEngineerId: 'eng_other' }),
  }));

  assertDenied(decision, ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REASON_KEYS.ASSIGNMENT_NOT_ALLOWED);
});

test('eligible engineer list can explicitly allow list access', () => {
  const decision = evaluateEngineerMobilePermissionAssignment(request({
    assignment: assignment({
      assignedEngineerId: undefined,
      eligibleEngineerIds: ['eng_other', 'eng_task_guard_001'],
    }),
  }));

  assertAllowed(decision);
});

test('unknown permission role and AI role fail closed', () => {
  const missingPermission = evaluateEngineerMobilePermissionAssignment(request({
    auth: auth({ permissions: ['cases.read'] }),
  }));
  const unknownRole = evaluateEngineerMobilePermissionAssignment(request({
    auth: auth({ role: 'customer_service' }),
  }));
  const aiRole = evaluateEngineerMobilePermissionAssignment(request({
    auth: auth({
      permissions: [
        'engineer_mobile.tasks.read',
        'engineer_mobile.tasks.read.assigned',
        'engineer_mobile.workbench.access',
      ],
      role: 'ai',
    }),
  }));

  assertDenied(missingPermission, ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REASON_KEYS.MISSING_PERMISSION);
  assertDenied(unknownRole, ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REASON_KEYS.ROLE_NOT_ALLOWED);
  assertDenied(aiRole, ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REASON_KEYS.ROLE_NOT_ALLOWED);
});

test('dispatcher supervisor and admin can inspect explicit same-organization assignment', () => {
  for (const role of ['dispatch_assistant', 'supervisor', 'admin']) {
    const decision = evaluateEngineerMobilePermissionAssignment(request({
      action: ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_ACTIONS.TASK_DETAIL,
      assignment: assignment({ assignedEngineerId: 'eng_different_in_scope' }),
      auth: auth({ engineerId: 'eng_dispatch_context', role }),
    }));

    assertAllowed(decision, ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_ACTIONS.TASK_DETAIL);
  }
});

test('privileged roles still require explicit assignment scope', () => {
  const decision = evaluateEngineerMobilePermissionAssignment({
    action: ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_ACTIONS.TASK_DETAIL,
    auth: auth({ role: 'admin' }),
  });

  assertDenied(decision, ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REASON_KEYS.MISSING_ASSIGNMENT);
});

test('snake_case auth and assignment fields are accepted without copying raw payload', () => {
  const decision = evaluateEngineerMobilePermissionAssignment({
    action: ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_ACTIONS.TASK_DETAIL,
    assignment: {
      assigned_engineer_id: 'eng_task_guard_001',
      organization_id: 'org_task_guard_001',
      ...unsafeExtras(),
    },
    auth: {
      engineer_id: 'eng_task_guard_001',
      organization_id: 'org_task_guard_001',
      permissions: ['engineer_mobile.tasks.read'],
      role: 'engineer',
      user_id: 'user_task_guard_001',
      ...unsafeExtras(),
    },
  });

  assertAllowed(decision, ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_ACTIONS.TASK_DETAIL);
});

test('decision output contains safe audit intent only and no raw task payload', () => {
  const decision = evaluateEngineerMobilePermissionAssignment(request({
    assignment: assignment({ organizationId: 'org_other' }),
  }));

  assertDecisionShape(decision);
  assert.deepEqual(Object.keys(decision.auditIntent).sort(), [
    'action',
    'engineerId',
    'organizationId',
    'reasonKey',
    'result',
    'role',
    'type',
    'userId',
  ]);
  assert.equal(JSON.stringify(decision).includes('apt_should_not_be_copied'), false);
  assertNoSensitive(decision);
});

test('module is pure and imports no DB API repository route provider AI completion or config code', () => {
  const source = fs.readFileSync(sourceFile, 'utf8');
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, []);

  for (const pattern of [
    /db|pool|transaction|repositories?|queryexecutor/i,
    /routes?|controllers?|app|server|http|express/i,
    /line|sms|email|push|provider|webhook/i,
    /rag|vector|openai|embedding|prompt/i,
    /completion|fieldservicereport|finalappointment/i,
    /process\.env|config|logger|console\./i,
    /admin\/|admin\\|package\.json|smoke/i,
  ]) {
    assert.equal(pattern.test(source), false, `forbidden source pattern ${pattern}`);
  }
});
