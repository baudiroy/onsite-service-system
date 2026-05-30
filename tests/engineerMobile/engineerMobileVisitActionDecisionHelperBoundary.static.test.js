'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  helper: 'src/engineerMobile/engineerMobileVisitActionDecisionHelper.js',
  unitTest: 'tests/engineerMobile/engineerMobileVisitActionDecisionHelper.unit.test.js',
  task2276Doc: 'docs/task-2276-engineer-mobile-pure-visit-action-decision-helper-no-route-no-db-no-smoke-no-provider.md',
});

const SUPPORTED_ACTION_MARKERS = Object.freeze([
  'start_travel',
  'arrive',
  'start_work',
  'finish_work',
  'record_visit_result',
  'engineer_mobile.start_travel',
  'engineer_mobile.arrive',
  'engineer_mobile.start_work',
  'engineer_mobile.finish_work',
  'engineer_mobile.record_visit_result',
]);

const SAFE_DECISION_FIELD_MARKERS = Object.freeze([
  'allowed',
  'status',
  'reasonCode',
  'action',
  'assignmentReference',
  'appointmentReference',
  'transitionIntent',
]);

const UNSAFE_CONTAINER_MARKERS = Object.freeze([
  'body',
  'query',
  'header',
  'headers',
  'cookie',
  'cookies',
  'session',
  'provider',
  'debug',
  'env',
]);

const UNSAFE_FIELD_MARKERS = Object.freeze([
  'audit',
  'billing',
  'completionreport',
  'fieldservicereport',
  'finalappointment',
  'invoice',
  'password',
  'payment',
  'provider',
  'raw',
  'report',
  'secret',
  'settlement',
  'token',
  'vector',
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

test('Task2277 static guard input files exist and this guard is text-only', () => {
  for (const file of Object.values(FILES)) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }

  const thisSource = fs.readFileSync(__filename, 'utf8');

  assert.doesNotMatch(thisSource, /require\(['"]\.\.\/\.\.\/src\//);
  assert.doesNotMatch(thisSource, /require\(['"]node:child_process['"]\)/);
});

test('decision helper exports the accepted helper and imports no runtime sinks', () => {
  const source = read(FILES.helper);

  assert.deepEqual(requireSpecifiers(source), ['./engineerMobileVisitActionPolicyRegistry']);
  assertIncludesAll(source, [
    'decideEngineerMobileVisitAction',
    'ACTION_ALIASES',
    'module.exports = {',
    'decideEngineerMobileVisitAction,',
  ], 'helper export markers');
  assertNoPattern(source, [
    /require\(['"].*(?:db|pool|pg|sql|database|transaction|repositories?|queryExecutor)['"]\)/i,
    /require\(['"].*(?:line|sms|email|push|provider|webhook)['"]\)/i,
    /require\(['"].*(?:openai|ai|rag|vector|embedding|prompt)['"]\)/i,
    /require\(['"].*(?:billing|settlement|payment|invoice)['"]\)/i,
    /require\(['"].*(?:routes?|controllers?|app|server|listen|bootstrap|runtime|smoke)['"]\)/i,
    /process\.env|DATABASE_URL|ZEABUR/i,
    /\bnew\s+Pool\b|\bcreatePool\b|\.query\s*\(/,
    /\bfetch\s*\(|axios|XMLHttpRequest|node:http|node:https/i,
    /\.listen\s*\(/,
  ], 'helper forbidden runtime sinks');
});

test('supported actions and canonical aliases remain explicit', () => {
  const source = read(FILES.helper);
  const unitTest = read(FILES.unitTest);
  const doc = read(FILES.task2276Doc);

  assertIncludesAll(source, SUPPORTED_ACTION_MARKERS, 'helper action aliases');
  assertIncludesAll(unitTest, SUPPORTED_ACTION_MARKERS, 'unit supported action evidence');
  assertIncludesAll(doc, SUPPORTED_ACTION_MARKERS, 'doc supported action evidence');
  assertIncludesAll(source, [
    "'engineer_mobile.start_travel': 'traveling'",
    "'engineer_mobile.arrive': 'arrived'",
    "'engineer_mobile.start_work': 'working'",
    "'engineer_mobile.finish_work': 'work_finished'",
    "'engineer_mobile.record_visit_result': 'visit_result_recorded'",
  ], 'explicit transition status mapping');
});

test('allow shape remains safe and transition intent is allowed-only', () => {
  const source = read(FILES.helper);
  const denyBody = functionBody(source, 'deny');
  const transitionBody = functionBody(source, 'buildTransitionIntent');
  const decideBody = functionBody(source, 'decideEngineerMobileVisitAction');
  const unitTest = read(FILES.unitTest);

  assertIncludesAll(denyBody, [
    'allowed: false',
    "status: 'ineligible'",
    'reasonCode,',
    'action,',
  ], 'generic deny shape');
  assert.equal(denyBody.includes('transitionIntent'), false, 'deny must not include transition intent');
  assertIncludesAll(transitionBody, [
    'action,',
    'actorId,',
    'appointmentId,',
    'caseId,',
    'organizationId,',
    'mobileVisitStatus: ACTION_TRANSITION_STATUSES[action]',
    "visitResult: action === 'engineer_mobile.record_visit_result' ? visitResult : undefined",
    'requestId,',
    'plannedAt: stringValue(now)',
  ], 'transition intent allowlist');
  assertIncludesAll(decideBody, SAFE_DECISION_FIELD_MARKERS, 'allow decision field markers');
  assertIncludesAll(unitTest, [
    'allows each supported action with explicit safe transition intent',
    'assignmentReference',
    'appointmentReference',
    'transitionIntent',
    'assertSafeOutput(decision)',
  ], 'unit allow decision evidence');
  assertNoPattern(source, [
    /\.\.\.\s*source\b/,
    /\.\.\.\s*input\b/,
    /\.\.\.\s*permissionContext\b/,
    /\.\.\.\s*assignmentContext\b/,
    /\.\.\.\s*actionSubject\b/,
    /\.\.\.\s*policyDecision\b/,
    /return\s+source\b/,
    /return\s+input\b/,
    /return\s+permissionContext\b/,
    /return\s+assignmentContext\b/,
    /return\s+actionSubject\b/,
  ], 'raw object pass-through');
});

test('raw request containers and client-controlled identity sources stay rejected', () => {
  const source = read(FILES.helper);
  const unitTest = read(FILES.unitTest);
  const decideBody = functionBody(source, 'decideEngineerMobileVisitAction');
  const containerCheckIndex = decideBody.indexOf('hasUnsafeContainer(source)');
  const contextReadIndex = decideBody.indexOf('const permissionContext = firstObject');

  assert.notEqual(containerCheckIndex, -1, 'missing unsafe container check');
  assert.notEqual(contextReadIndex, -1, 'missing trusted context extraction');
  assert.equal(containerCheckIndex < contextReadIndex, true, 'unsafe containers must be denied before trusted context extraction');
  assertIncludesAll(source, UNSAFE_CONTAINER_MARKERS, 'unsafe container markers');
  assertNoPattern(source, [
    /source\.body/,
    /source\.query/,
    /source\.headers?/,
    /source\.cookies?/,
    /source\.session/,
    /source\.provider/,
    /source\.debug/,
    /source\.env/,
  ], 'raw container property reads');
  assertIncludesAll(unitTest, [
    'does not trust raw request containers or client-controlled identity fields',
    'withOnlyClientFields',
    'withClientOverride',
    "reasonCode: 'invalid_context'",
    'eng_attacker',
    'org_attacker',
    'apt_attacker',
  ], 'unit raw request rejection evidence');
});

test('report boundary and unsafe output protections remain visible', () => {
  const source = read(FILES.helper);
  const unitTest = read(FILES.unitTest);
  const doc = read(FILES.task2276Doc);

  assertIncludesAll(source, UNSAFE_FIELD_MARKERS, 'unsafe field markers');
  assertIncludesAll(source, [
    'hasUnsafeField(permissionContext)',
    'hasUnsafeField(assignmentContext)',
    'hasUnsafeField(actionSubject)',
    "return deny(action, 'report_boundary')",
  ], 'unsafe field deny markers');
  assertIncludesAll(unitTest, [
    'does not accept or emit report creation approval publication or final appointment fields',
    'completionReportId',
    'fieldServiceReportId',
    'finalAppointmentId',
    'publishReport',
    "reasonCode: 'report_boundary'",
    'does not expose raw internal provider audit AI billing debug or secret fields',
    'rawCase',
    'rawAppointment',
    'providerPayload',
    'aiRawPayload',
    'billingInternal',
    'debugPayload',
    'token',
    'password',
    'secret',
  ], 'unit unsafe output evidence');
  assertIncludesAll(doc, [
    'does not approve, publish, formalize, or create Field Service Report or Completion Report records',
    '`finalAppointmentId` remains system-owned and is not accepted from input or emitted',
  ], 'doc report boundary evidence');
  assertNoPattern(source, [
    /createFieldServiceReport\s*\(/,
    /approveFieldServiceReport\s*\(/,
    /publishFieldServiceReport\s*\(/,
    /createCompletionReport\s*\(/,
    /approveCompletionReport\s*\(/,
    /publishCompletionReport\s*\(/,
    /formalize[A-Z]\w*Report\s*\(/,
    /finalAppointmentId\s*[:=]/,
    /final_appointment_id\s*[:=]/,
  ], 'report workflow behavior');
});

test('Task2276 doc records pure no-runtime helper boundaries', () => {
  const doc = read(FILES.task2276Doc);

  assertIncludesAll(doc, [
    'pure Engineer Mobile visit-action decision helper',
    'does not wire the helper into routes',
    'No route/runtime wiring was added',
    'No DB command',
    'provider sending',
    'AI/RAG/OpenAI/vector DB',
    'admin frontend',
    'billing, settlement, payment, invoice',
    'The same 7 held historical docs remain untracked and untouched',
  ], 'Task2276 doc boundaries');
});
