'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  workbenchPresenter: 'src/engineerMobile/engineerMobileWorkbenchSafeEnvelopePresenter.js',
  decisionHelper: 'src/engineerMobile/engineerMobileVisitActionDecisionHelper.js',
  workbenchBoundary: 'tests/engineerMobile/engineerMobileWorkbenchSafeEnvelopePresenterBoundary.static.test.js',
  decisionBoundary: 'tests/engineerMobile/engineerMobileVisitActionDecisionHelperBoundary.static.test.js',
  workbenchUnit: 'tests/engineerMobile/engineerMobileWorkbenchSafeEnvelopePresenter.unit.test.js',
  decisionUnit: 'tests/engineerMobile/engineerMobileVisitActionDecisionHelper.unit.test.js',
  task2269Doc: 'docs/task-2269-engineer-mobile-safe-workbench-envelope-pure-helper-no-route-no-db-no-smoke-no-provider.md',
  task2270Doc: 'docs/task-2270-engineer-mobile-workbench-safe-envelope-presenter-static-boundary-guard-no-runtime-change-no-db-no-smoke-no-provider.md',
  task2275Doc: 'docs/task-2275-engineer-mobile-assignment-permission-context-branch-checkpoint-no-runtime-change-no-db-no-smoke-no-provider.md',
  task2276Doc: 'docs/task-2276-engineer-mobile-pure-visit-action-decision-helper-no-route-no-db-no-smoke-no-provider.md',
  task2277Doc: 'docs/task-2277-engineer-mobile-visit-action-decision-helper-static-boundary-guard-no-runtime-change-no-db-no-smoke-no-provider.md',
  task2278Doc: 'docs/task-2278-engineer-mobile-visit-action-decision-helper-branch-checkpoint-no-runtime-change-no-db-no-smoke-no-provider.md',
});

const WORKBENCH_OUTPUT_FIELDS = Object.freeze([
  'ok',
  'status',
  'messageKey',
  'assignmentReference',
  'caseReference',
  'appointmentReference',
  'serviceStatus',
  'appointmentWindow',
  'customerDisplay',
  'locationSummary',
  'workOrderSummary',
  'eligibility',
  'actions',
]);

const DECISION_OUTPUT_FIELDS = Object.freeze([
  'allowed',
  'status',
  'reasonCode',
  'action',
  'assignmentReference',
  'appointmentReference',
  'transitionIntent',
]);

const SUPPORTED_ACTIONS = Object.freeze([
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

const FORBIDDEN_DEPENDENCY_PATTERNS = Object.freeze([
  /require\(['"].*(?:db|pool|pg|sql|database|transaction|repositories?|queryExecutor)['"]\)/i,
  /require\(['"].*(?:line|sms|email|push|provider|webhook)['"]\)/i,
  /require\(['"].*(?:openai|ai|rag|vector|embedding|prompt)['"]\)/i,
  /require\(['"].*(?:billing|settlement|payment|invoice)['"]\)/i,
  /require\(['"].*(?:routes?|controllers?|app|server|listen|bootstrap|runtime|smoke)['"]\)/i,
  /process\.env|DATABASE_URL|ZEABUR/i,
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

function engineerMobileSourceFiles() {
  return fs.readdirSync(absolutePath('src/engineerMobile'))
    .filter((file) => file.endsWith('.js'))
    .map((file) => `src/engineerMobile/${file}`);
}

test('Task2279 static guard input files exist and this guard is text-only', () => {
  for (const file of Object.values(FILES)) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }

  const thisSource = fs.readFileSync(__filename, 'utf8');

  assert.doesNotMatch(thisSource, /require\(['"]\.\.\/\.\.\/src\//);
  assert.doesNotMatch(thisSource, /require\(['"]node:child_process['"]\)/);
});

test('pure helper files remain dependency-light and export accepted contracts', () => {
  const workbench = read(FILES.workbenchPresenter);
  const decision = read(FILES.decisionHelper);

  assert.deepEqual(requireSpecifiers(workbench), []);
  assert.deepEqual(requireSpecifiers(decision), ['./engineerMobileVisitActionPolicyRegistry']);
  assertIncludesAll(workbench, [
    'ENGINEER_MOBILE_WORKBENCH_SAFE_ENVELOPE_PRESENTER_KIND',
    'presentEngineerMobileWorkbenchSafeEnvelope',
    'module.exports = {',
  ], 'workbench exports');
  assertIncludesAll(decision, [
    'decideEngineerMobileVisitAction',
    'module.exports = {',
  ], 'decision helper exports');
  assertNoPattern(workbench, FORBIDDEN_DEPENDENCY_PATTERNS, 'workbench helper dependencies');
  assertNoPattern(decision, FORBIDDEN_DEPENDENCY_PATTERNS, 'decision helper dependencies');
});

test('pure helpers keep explicit safe output allowlists', () => {
  const workbench = read(FILES.workbenchPresenter);
  const decision = read(FILES.decisionHelper);
  const workbenchBody = functionBody(workbench, 'presentEngineerMobileWorkbenchSafeEnvelope');
  const decisionBody = functionBody(decision, 'decideEngineerMobileVisitAction');
  const workbenchBoundary = read(FILES.workbenchBoundary);
  const decisionBoundary = read(FILES.decisionBoundary);

  assertIncludesAll(workbenchBody, WORKBENCH_OUTPUT_FIELDS.map((field) => `${field}:`), 'workbench output fields');
  assertIncludesAll(decisionBody, DECISION_OUTPUT_FIELDS, 'decision output fields');
  assertIncludesAll(workbenchBoundary, WORKBENCH_OUTPUT_FIELDS, 'workbench boundary allowlist evidence');
  assertIncludesAll(decisionBoundary, DECISION_OUTPUT_FIELDS, 'decision boundary allowlist evidence');
  assertNoPattern(workbenchBody, [
    /\.\.\.\s*(source|input|projection|workOrder|assignment)\b/,
    /return\s+(source|input|projection|workOrder|assignment)\b/,
  ], 'workbench raw pass-through');
  assertNoPattern(decision, [
    /\.\.\.\s*source\b/,
    /\.\.\.\s*input\b/,
    /\.\.\.\s*permissionContext\b/,
    /\.\.\.\s*assignmentContext\b/,
    /\.\.\.\s*actionSubject\b/,
    /return\s+(source|input|permissionContext|assignmentContext|actionSubject)\b/,
  ], 'decision raw pass-through');
});

test('safe unavailable and generic ineligible behavior remains visible', () => {
  const workbench = read(FILES.workbenchPresenter);
  const decision = read(FILES.decisionHelper);
  const workbenchBoundary = read(FILES.workbenchBoundary);
  const decisionBoundary = read(FILES.decisionBoundary);
  const presentUnavailableBody = functionBody(workbench, 'presentUnavailable');
  const denyBody = functionBody(decision, 'deny');

  assertIncludesAll(presentUnavailableBody, [
    'ok: false',
    "status: safeStatus(safeSource.status, 'unavailable')",
    'DEFAULT_UNAVAILABLE_MESSAGE_KEY',
    'actions: []',
  ], 'workbench unavailable envelope');
  assertIncludesAll(denyBody, [
    'allowed: false',
    "status: 'ineligible'",
    'reasonCode,',
    'action,',
  ], 'decision generic deny');
  assert.equal(denyBody.includes('transitionIntent'), false, 'decision deny must not include transition intent');
  assertIncludesAll(workbenchBoundary, [
    'generic unavailable deny envelope remains safe',
    'actions: []',
  ], 'workbench deny boundary evidence');
  assertIncludesAll(decisionBoundary, [
    'generic deny shape',
    'deny must not include transition intent',
  ], 'decision deny boundary evidence');
});

test('visit-action decision helper keeps explicit actions transition intent and report boundary protection', () => {
  const decision = read(FILES.decisionHelper);
  const decisionBoundary = read(FILES.decisionBoundary);
  const decisionUnit = read(FILES.decisionUnit);
  const transitionBody = functionBody(decision, 'buildTransitionIntent');

  assertIncludesAll(decision, SUPPORTED_ACTIONS, 'decision supported actions');
  assertIncludesAll(decision, [
    "'engineer_mobile.start_travel': 'traveling'",
    "'engineer_mobile.arrive': 'arrived'",
    "'engineer_mobile.start_work': 'working'",
    "'engineer_mobile.finish_work': 'work_finished'",
    "'engineer_mobile.record_visit_result': 'visit_result_recorded'",
  ], 'decision transition mapping');
  assertIncludesAll(transitionBody, [
    'mobileVisitStatus: ACTION_TRANSITION_STATUSES[action]',
    "visitResult: action === 'engineer_mobile.record_visit_result' ? visitResult : undefined",
  ], 'transition intent explicit mapping');
  assertIncludesAll(decisionBoundary, [
    'completionReportId',
    'fieldServiceReportId',
    'finalAppointmentId',
    'publishReport',
    'report workflow behavior',
  ], 'decision report boundary static evidence');
  assertIncludesAll(decisionUnit, [
    'does not accept or emit report creation approval publication or final appointment fields',
    "reasonCode: 'report_boundary'",
    'assertSafeOutput(decision)',
  ], 'decision report boundary unit evidence');
  assertNoPattern(decision, [
    /createFieldServiceReport\s*\(/,
    /approveFieldServiceReport\s*\(/,
    /publishFieldServiceReport\s*\(/,
    /createCompletionReport\s*\(/,
    /approveCompletionReport\s*\(/,
    /publishCompletionReport\s*\(/,
    /formalize[A-Z]\w*Report\s*\(/,
    /finalAppointmentId\s*[:=]/,
    /final_appointment_id\s*[:=]/,
  ], 'decision report workflow behavior');
});

test('unit and static evidence covers raw private internal non-exposure and immutability', () => {
  const evidence = [
    read(FILES.workbenchBoundary),
    read(FILES.decisionBoundary),
    read(FILES.workbenchUnit),
    read(FILES.decisionUnit),
  ].join('\n');

  assertIncludesAll(evidence, [
    'raw_case_should_not_leak',
    'raw_appointment_should_not_leak',
    'raw_provider_payload_should_not_leak',
    'raw_ai_payload_should_not_leak',
    'raw_billing_should_not_leak',
    'debug_should_not_leak',
    'token_should_not_leak',
    'password_should_not_leak',
    'secret_should_not_leak',
    'presenter returns a new object and does not mutate input',
    'does not mutate input and returns a new decision object',
  ], 'portfolio non-exposure and immutability evidence');
  assertIncludesAll(evidence, [
    'providerPayload',
    'auditContext',
    'aiRawPayload',
    'billingInternal',
    'debugPayload',
    'rawSql',
  ], 'portfolio unsafe marker evidence');
});

test('Engineer Mobile runtime source does not import pure helpers yet', () => {
  const sourceFiles = engineerMobileSourceFiles()
    .filter((file) => file !== FILES.workbenchPresenter)
    .filter((file) => file !== FILES.decisionHelper);

  for (const file of sourceFiles) {
    const source = read(file);

    assert.equal(
      source.includes('engineerMobileWorkbenchSafeEnvelopePresenter'),
      false,
      `${file} should not import workbench presenter helper`,
    );
    assert.equal(
      source.includes('presentEngineerMobileWorkbenchSafeEnvelope'),
      false,
      `${file} should not call workbench presenter helper`,
    );
    assert.equal(
      source.includes('engineerMobileVisitActionDecisionHelper'),
      false,
      `${file} should not import visit-action decision helper`,
    );
    assert.equal(
      source.includes('decideEngineerMobileVisitAction'),
      false,
      `${file} should not call visit-action decision helper`,
    );
  }
});

test('recent docs preserve non-authorized no-runtime pure helper portfolio status', () => {
  const docs = [
    read(FILES.task2269Doc),
    read(FILES.task2270Doc),
    read(FILES.task2275Doc),
    read(FILES.task2276Doc),
    read(FILES.task2277Doc),
    read(FILES.task2278Doc),
  ].join('\n');

  assertIncludesAll(docs, [
    'No route/runtime wiring was added',
    'No runtime wiring of the visit-action decision helper is authorized',
    'No runtime wiring of the safe Workbench envelope helper is authorized',
    'No Engineer Mobile route/API/DTO/projection/handler/mobile behavior change',
    'No DB, repository, or audit persistence behavior',
    'No provider sending',
    'No auth/session middleware',
    'No AI/RAG/OpenAI/vector DB',
    'No billing, settlement, payment, or invoice',
    'The same 7 held historical docs remain untracked and untouched',
  ], 'recent non-authorized portfolio docs');
});
