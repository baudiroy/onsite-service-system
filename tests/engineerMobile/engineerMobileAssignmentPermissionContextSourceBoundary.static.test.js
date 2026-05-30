'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const SOURCE_FILES = Object.freeze({
  permissionGuard: 'src/engineerMobile/engineerMobilePermissionAssignmentGuard.js',
  taskListReadProviderAdapter: 'src/engineerMobile/engineerMobileTaskListReadProviderAdapter.js',
  visitActionHttpRequestNormalizer: 'src/engineerMobile/engineerMobileVisitActionHttpRequestNormalizer.js',
  visitActionPolicyRegistry: 'src/engineerMobile/engineerMobileVisitActionPolicyRegistry.js',
});

const POLICY_FILES = Object.freeze({
  arrive: 'src/engineerMobile/engineerMobileArriveActionPolicy.js',
  finishWork: 'src/engineerMobile/engineerMobileFinishWorkActionPolicy.js',
  recordVisitResult: 'src/engineerMobile/engineerMobileRecordVisitResultActionPolicy.js',
  startTravel: 'src/engineerMobile/engineerMobileStartTravelActionPolicy.js',
  startWork: 'src/engineerMobile/engineerMobileStartWorkActionPolicy.js',
});

const EVIDENCE_FILES = Object.freeze({
  permissionGuardUnit: 'tests/engineerMobile/engineerMobilePermissionAssignmentGuard.unit.test.js',
  permissionGuardClosure: 'tests/engineerMobile/engineerMobilePermissionAssignmentGuardClosure.static.test.js',
  taskListReadProviderUnit: 'tests/engineerMobile/engineerMobileTaskListReadProviderAdapter.unit.test.js',
  task2266Doc: 'docs/task-2266-engineer-mobile-branch-re-entry-planning-checkpoint-no-runtime-change-no-db-no-smoke-no-provider.md',
  task2272Doc: 'docs/task-2272-engineer-mobile-visit-action-eligibility-state-transition-static-guard-no-runtime-change-no-db-no-smoke-no-provider.md',
  task2273Doc: 'docs/task-2273-engineer-mobile-visit-action-eligibility-branch-checkpoint-no-runtime-change-no-db-no-smoke-no-provider.md',
});

const FORBIDDEN_CONTEXT_SOURCE_PATTERNS = Object.freeze([
  /\bbody\b/,
  /\bquery\b/,
  /\bheaders?\b/,
  /\bcookies?\b/,
  /\bsession\b/,
  /\bproviderPayload\b|\bproviderRawPayload\b|\bproviderDebug\b/i,
  /\bdebugPayload\b|\bdebug\b/,
  /\bprocess\.env\b|\bDATABASE_URL\b|\bZEABUR\b/i,
]);

const FORBIDDEN_DEPENDENCY_PATTERNS = Object.freeze([
  /require\(['"][^'"]*(?:db|pool|pg|sql|database|transaction|repositories?|queryExecutor)[^'"]*['"]\)/i,
  /require\(['"][^'"]*(?:line|sms|email|push|provider|webhook)[^'"]*['"]\)/i,
  /require\(['"][^'"]*(?:openai|ai|rag|vector|embedding|prompt)[^'"]*['"]\)/i,
  /require\(['"][^'"]*(?:billing|settlement|payment|invoice)[^'"]*['"]\)/i,
  /require\(['"][^'"]*(?:routes?|controllers?|app|server|listen|bootstrap|smoke)[^'"]*['"]\)/i,
  /process\.env/,
  /DATABASE_URL|ZEABUR/i,
  /\bnew\s+Pool\b|\bcreatePool\b|\.query\s*\(/,
  /\bfetch\s*\(|axios|XMLHttpRequest|node:http|node:https/i,
  /\.listen\s*\(/,
]);

function absolutePath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(absolutePath(relativePath), 'utf8');
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

function functionBody(source, name) {
  const signatureIndex = source.indexOf(`function ${name}(`);

  assert.notEqual(signatureIndex, -1, `missing function ${name}`);

  const closingParenIndex = source.indexOf(')', signatureIndex);
  const openingBraceIndex = source.indexOf('{', closingParenIndex);
  let depth = 0;

  for (let index = openingBraceIndex; index < source.length; index += 1) {
    const char = source[index];

    if (char === '{') {
      depth += 1;
    }

    if (char === '}') {
      depth -= 1;

      if (depth === 0) {
        return source.slice(openingBraceIndex + 1, index);
      }
    }
  }

  assert.fail(`unterminated function ${name}`);
}

function assertIncludesAll(source, values, label) {
  for (const value of values) {
    assert.equal(source.includes(value), true, `${label} missing ${value}`);
  }
}

function assertNoPattern(source, patterns, label) {
  for (const pattern of patterns) {
    assert.doesNotMatch(source, pattern, `${label} contains ${pattern}`);
  }
}

test('Task2274 static guard input files exist and this guard is text-only', () => {
  for (const file of [
    ...Object.values(SOURCE_FILES),
    ...Object.values(POLICY_FILES),
    ...Object.values(EVIDENCE_FILES),
  ]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }

  const thisSource = fs.readFileSync(__filename, 'utf8');

  assert.doesNotMatch(thisSource, /require\(['"]\.\.\/\.\.\/src\//);
  assert.doesNotMatch(thisSource, /require\(['"]node:child_process['"]\)/);
});

test('permission assignment guard keeps context and assignment sources explicit', () => {
  const source = read(SOURCE_FILES.permissionGuard);
  const extractAuthBody = functionBody(source, 'extractAuth');
  const extractAssignmentBody = functionBody(source, 'extractAssignment');
  const evaluatorBody = functionBody(source, 'evaluateEngineerMobilePermissionAssignment');

  assert.deepEqual(requireSpecifiers(source), []);
  assertIncludesAll(extractAuthBody, [
    'source.auth',
    'source.permissionContext',
    'source.actor',
    'source.context',
  ], 'permission auth source boundary');
  assertIncludesAll(extractAssignmentBody, [
    'source.assignment',
    'source.assignmentContext',
    'source.taskScope',
    'source.task',
  ], 'assignment source boundary');
  assertIncludesAll(evaluatorBody, [
    'const permissionContext = extractPermissionContext(extractAuth(request))',
    'const assignmentContext = extractAssignmentContext(extractAssignment(request))',
    'ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REASON_KEYS.MISSING_SCOPE',
    'ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REASON_KEYS.MISSING_PERMISSION',
    'ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REASON_KEYS.MISSING_ASSIGNMENT',
    'ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REASON_KEYS.CROSS_ORGANIZATION',
    'ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REASON_KEYS.ASSIGNMENT_NOT_ALLOWED',
  ], 'permission assignment fail-closed markers');
  assertNoPattern(extractAuthBody, FORBIDDEN_CONTEXT_SOURCE_PATTERNS, 'auth source extraction');
  assertNoPattern(extractAssignmentBody, FORBIDDEN_CONTEXT_SOURCE_PATTERNS, 'assignment source extraction');
  assertNoPattern(source, FORBIDDEN_DEPENDENCY_PATTERNS, 'permission assignment guard dependencies');
});

test('read provider request mapping keeps identity on auth and appointment on route params', () => {
  const source = read(SOURCE_FILES.taskListReadProviderAdapter);
  const listMapperBody = functionBody(source, 'mapEngineerMobileTaskListRequest');
  const detailMapperBody = functionBody(source, 'mapEngineerMobileTaskDetailRequest');
  const unitTest = read(EVIDENCE_FILES.taskListReadProviderUnit);

  assertIncludesAll(listMapperBody, [
    'const auth = isPlainObject(source.auth) ? source.auth : {}',
    'const organizationId = auth.organizationId',
    'const engineerId = auth.engineerId',
    'if (!organizationId || !engineerId)',
  ], 'task list request identity mapping');
  assertIncludesAll(detailMapperBody, [
    'const auth = isPlainObject(source.auth) ? source.auth : {}',
    'const params = isPlainObject(source.params) ? source.params : {}',
    'const organizationId = auth.organizationId',
    'const engineerId = auth.engineerId',
    'const appointmentId = params.appointmentId',
    'if (!organizationId || !engineerId || !appointmentId)',
  ], 'task detail request identity mapping');
  assert.doesNotMatch(listMapperBody, /source\.body|body\./);
  assert.doesNotMatch(detailMapperBody, /source\.body|body\./);
  assertIncludesAll(unitTest, [
    'body organizationId and engineerId are ignored',
    'body_org_should_be_ignored',
    'body_engineer_should_be_ignored',
    'missing auth fail-closes',
    'missing organizationId fail-closes',
    'missing engineerId fail-closes',
  ], 'task list provider body-ignore evidence');
});

test('visit action registry and policies keep action eligibility separate from raw request fields', () => {
  const registry = read(SOURCE_FILES.visitActionPolicyRegistry);

  assertIncludesAll(registry, [
    'const evaluatorInput = {',
    'actor: source.actor',
    'appointment: source.appointment',
    'evaluatorInput.visitResult = source.visitResult',
    'return evaluator(evaluatorInput)',
  ], 'visit action evaluator input boundary');
  assertNoPattern(registry, [
    /source\.body/,
    /source\.query/,
    /source\.params/,
    /source\.headers/,
    /source\.cookies/,
    /source\.session/,
    /source\.engineerId/,
    /source\.assignedEngineerId/,
    /source\.organizationId/,
  ], 'visit action registry raw request boundary');

  for (const [name, file] of Object.entries(POLICY_FILES)) {
    const source = read(file);

    assert.deepEqual(requireSpecifiers(source), [], `${file} should not import runtime dependencies`);
    assertIncludesAll(source, [
      'organizationId(actor) !== organizationId(appointment)',
      'includesPermission(actor)',
      'actorId(actor) !== assignedEngineerId(appointment)',
      'appointmentStatus(appointment)',
      'return deny(',
      'return allow(',
      'safeDecisionFields',
      'subject: {',
    ], `${name} assignment permission action-state gates`);
    assertNoPattern(source, FORBIDDEN_DEPENDENCY_PATTERNS, `${name} forbidden dependencies`);
    assertNoPattern(source, [
      /options\.body/,
      /options\.query/,
      /options\.params/,
      /options\.headers/,
      /options\.cookies/,
      /options\.session/,
      /providerPayload|providerRawPayload|providerDebug/i,
      /debugPayload|process\.env|DATABASE_URL|ZEABUR/i,
    ], `${name} raw request context`);
  }
});

test('visit action HTTP normalizer remains a subset normalizer and not an authorization source', () => {
  const source = read(SOURCE_FILES.visitActionHttpRequestNormalizer);

  assert.deepEqual(requireSpecifiers(source), []);
  assertIncludesAll(source, [
    'SAFE_ACTOR_KEYS',
    'SAFE_APPOINTMENT_KEYS',
    'function safeActor(actor)',
    'function safeAppointment(appointment)',
    "return failure('appointment_id_mismatch', { requestId })",
    'actor: safeActor(request.actor || body.actor)',
    'appointment: safeAppointment(rawAppointment)',
    'appointmentId: firstString(paramAppointmentId, bodyAppointmentId)',
  ], 'visit action request normalizer source boundary');
  assertNoPattern(source, [
    /request\.query/,
    /request\.headers/,
    /request\.cookies/,
    /request\.session/,
    /providerPayload|providerRawPayload|providerDebug/i,
    /debugPayload|process\.env|DATABASE_URL|ZEABUR/i,
    /permissionAssignmentGuard|evaluateEngineerMobilePermissionAssignment/,
    /return\s+allow|return\s+deny|allowed:\s*true|allowed:\s*false/,
  ], 'visit action normalizer forbidden authorization sources');
  assertNoPattern(source, FORBIDDEN_DEPENDENCY_PATTERNS, 'visit action normalizer dependencies');
});

test('docs and existing tests preserve assignment permission organization source guardrails', () => {
  const evidence = [
    read(EVIDENCE_FILES.permissionGuardUnit),
    read(EVIDENCE_FILES.permissionGuardClosure),
    read(EVIDENCE_FILES.task2266Doc),
    read(EVIDENCE_FILES.task2272Doc),
    read(EVIDENCE_FILES.task2273Doc),
  ].join('\n');

  assertIncludesAll(evidence, [
    'Engineer access must be based on assignment, permission, and organization scope, not raw client-provided engineer IDs',
    'Mobile action paths must require exact workflow eligibility, assignment/permission context, appointment state validation, and explicit state transitions',
    'Visit actions are not authorized by raw client-provided engineer IDs',
    'Assignment, permission, and organization scope markers remain represented in action policies',
    'Mobile visit actions are not authorized by raw client-provided engineer IDs',
    'Assignment, permission, organization scope, and appointment-state gates remain represented',
  ], 'assignment permission organization guardrail evidence');
});
