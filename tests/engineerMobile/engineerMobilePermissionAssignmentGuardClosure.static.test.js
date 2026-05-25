'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_ACTIONS,
  ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REASON_KEYS,
  evaluateEngineerMobilePermissionAssignment,
} = require('../../src/engineerMobile/engineerMobilePermissionAssignmentGuard');

const repoRoot = path.resolve(__dirname, '../..');
const guardFile = path.join(
  repoRoot,
  'src/engineerMobile/engineerMobilePermissionAssignmentGuard.js',
);
const task793Doc = path.join(
  repoRoot,
  'docs/task-793-engineer-mobile-permission-assignment-guard-pure-runtime-module-no-api-no-db.md',
);
const task793Test = path.join(
  repoRoot,
  'tests/engineerMobile/engineerMobilePermissionAssignmentGuard.unit.test.js',
);
const task794Doc = path.join(
  repoRoot,
  'docs/task-794-engineer-mobile-permission-assignment-guard-closure-no-api-no-db.md',
);
const designDoc = path.join(repoRoot, 'docs/design/engineer-mobile-workbench.md');

function auth(overrides = {}) {
  return {
    engineerId: 'eng_guard_closure_001',
    organizationId: 'org_guard_closure_001',
    permissions: ['engineer_mobile.tasks.read'],
    role: 'engineer',
    userId: 'user_guard_closure_001',
    ...overrides,
  };
}

function assignment(overrides = {}) {
  return {
    assignedEngineerId: 'eng_guard_closure_001',
    organizationId: 'org_guard_closure_001',
    ...overrides,
  };
}

function decision(overrides = {}) {
  return evaluateEngineerMobilePermissionAssignment({
    action: ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_ACTIONS.TASK_LIST,
    assignment: assignment(),
    auth: auth(),
    ...overrides,
  });
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
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

function assertNoSensitive(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'DATABASE_URL',
    'access_token',
    'aiRawPayload',
    'auditRawPayload',
    'billingInternalData',
    'channel_secret',
    'finalAppointmentId',
    'fieldServiceReportId',
    'fullAddress',
    'fullPayload',
    'internalNote',
    'rawAddress',
    'rawLineUserId',
    'rawPhone',
    'reportId',
    'secret',
    'sql',
    'stack',
    'token',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('Task793 evidence and Task794 closure files exist', () => {
  for (const file of [task793Doc, task793Test, task794Doc, designDoc]) {
    assert.equal(fs.existsSync(file), true, `${path.basename(file)} should exist`);
  }
});

test('guard source remains pure and imports no runtime sinks', () => {
  const source = read(guardFile);

  assert.deepEqual(requireSpecifiers(source), []);

  for (const pattern of [
    /db|pool|transaction|repositories?|queryexecutor/i,
    /routes?|controllers?|app|server|http|express/i,
    /process\.env|config|logger|console\./i,
    /fetch\s*\(|axios|XMLHttpRequest|node:http|node:https/i,
    /line|sms|email|push|provider|webhook/i,
    /rag|vector|openai|embedding|prompt/i,
    /completion|fieldservicereport|finalappointment/i,
    /admin\/|admin\\|package\.json|smoke/i,
  ]) {
    assert.equal(pattern.test(source), false, `forbidden source pattern ${pattern}`);
  }
});

test('guard supports only task_list and task_detail decisions', () => {
  assert.deepEqual(Object.values(ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_ACTIONS).sort(), [
    'task_detail',
    'task_list',
  ]);

  const listDecision = decision();
  const detailDecision = decision({
    action: ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_ACTIONS.TASK_DETAIL,
  });
  const unsupportedDecision = decision({ action: 'completion_submit' });

  assert.equal(listDecision.allowed, true);
  assert.equal(detailDecision.allowed, true);
  assert.equal(unsupportedDecision.allowed, false);
  assert.equal(
    unsupportedDecision.reasonKey,
    ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REASON_KEYS.UNSUPPORTED_ACTION,
  );
});

test('fail-closed conditions remain locked', () => {
  const cases = [
    [
      'missing organization',
      decision({ auth: auth({ organizationId: undefined }) }),
      ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REASON_KEYS.MISSING_SCOPE,
    ],
    [
      'missing user',
      decision({ auth: auth({ userId: undefined }) }),
      ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REASON_KEYS.MISSING_SCOPE,
    ],
    [
      'missing engineer',
      decision({ auth: auth({ engineerId: undefined }) }),
      ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REASON_KEYS.MISSING_SCOPE,
    ],
    [
      'unknown role',
      decision({ auth: auth({ role: 'customer_service' }) }),
      ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REASON_KEYS.ROLE_NOT_ALLOWED,
    ],
    [
      'unknown permission',
      decision({ auth: auth({ permissions: ['cases.read'] }) }),
      ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REASON_KEYS.MISSING_PERMISSION,
    ],
    [
      'missing assignment',
      evaluateEngineerMobilePermissionAssignment({
        action: ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_ACTIONS.TASK_LIST,
        auth: auth(),
      }),
      ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REASON_KEYS.MISSING_ASSIGNMENT,
    ],
    [
      'cross organization',
      decision({ assignment: assignment({ organizationId: 'org_other' }) }),
      ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REASON_KEYS.CROSS_ORGANIZATION,
    ],
  ];

  for (const [label, result, reasonKey] of cases) {
    assert.equal(result.allowed, false, `${label} should deny`);
    assert.equal(result.decision, 'deny', `${label} should be deny`);
    assert.equal(result.reasonKey, reasonKey, `${label} reason`);
    assertNoSensitive(result);
  }
});

test('decision result shape remains safe metadata only', () => {
  const allowDecision = decision();
  const denyDecision = decision({
    assignment: {
      assignedEngineerId: 'eng_other',
      finalAppointmentId: 'finalAppointmentId',
      fieldServiceReportId: 'fieldServiceReportId',
      fullAddress: 'fullAddress',
      organizationId: 'org_guard_closure_001',
      rawPhone: 'rawPhone',
      reportId: 'reportId',
    },
  });

  for (const result of [allowDecision, denyDecision]) {
    assert.deepEqual(Object.keys(result).sort(), [
      'action',
      'allowed',
      'auditIntent',
      'decision',
      'reasonKey',
      'scope',
    ]);
    assert.deepEqual(Object.keys(result.auditIntent).sort(), [
      'action',
      'engineerId',
      'organizationId',
      'reasonKey',
      'result',
      'role',
      'type',
      'userId',
    ]);
    assertNoSensitive(result);
  }
});

test('Task794 docs record closure without promoting runtime', () => {
  const doc = read(task794Doc);
  const design = read(designDoc);

  for (const required of [
    'Task793',
    'pure',
    'no API',
    'no DB',
    'no audit writer',
    'no completion writes',
    'finalAppointmentId',
    'no provider',
    'no AI/RAG',
  ]) {
    assert.equal(doc.includes(required), true, `doc should include ${required}`);
  }

  assert.equal(design.includes('Task793-794 Permission Assignment Guard Closure'), true);
  assert.equal(design.includes('pure decision helper'), true);
  assert.equal(design.includes('not wired into API'), true);
});
