'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const POLICY_FILES = Object.freeze({
  arrive: 'src/engineerMobile/engineerMobileArriveActionPolicy.js',
  finishWork: 'src/engineerMobile/engineerMobileFinishWorkActionPolicy.js',
  recordVisitResult: 'src/engineerMobile/engineerMobileRecordVisitResultActionPolicy.js',
  startTravel: 'src/engineerMobile/engineerMobileStartTravelActionPolicy.js',
  startWork: 'src/engineerMobile/engineerMobileStartWorkActionPolicy.js',
});

const SUPPORT_FILES = Object.freeze({
  commandPlanner: 'src/engineerMobile/engineerMobileVisitActionCommandPlanner.js',
  httpResponsePresenter: 'src/engineerMobile/engineerMobileVisitActionHttpResponsePresenter.js',
  policyRegistry: 'src/engineerMobile/engineerMobileVisitActionPolicyRegistry.js',
  task2266Doc: 'docs/task-2266-engineer-mobile-branch-re-entry-planning-checkpoint-no-runtime-change-no-db-no-smoke-no-provider.md',
  task2271Doc: 'docs/task-2271-engineer-mobile-safe-workbench-envelope-branch-checkpoint-no-runtime-change-no-db-no-smoke-no-provider.md',
  transitionPatchBuilder: 'src/engineerMobile/engineerMobileVisitActionTransitionPatchBuilder.js',
});

const EXISTING_STATIC_TESTS = Object.freeze([
  'tests/engineerMobile/engineerMobileArriveActionPolicyBoundary.static.test.js',
  'tests/engineerMobile/engineerMobileFinishWorkActionPolicyBoundary.static.test.js',
  'tests/engineerMobile/engineerMobileRecordVisitResultActionPolicyBoundary.static.test.js',
  'tests/engineerMobile/engineerMobileStartTravelActionPolicyBoundary.static.test.js',
  'tests/engineerMobile/engineerMobileStartWorkActionPolicyBoundary.static.test.js',
  'tests/engineerMobile/engineerMobileVisitActionCommandPlannerBoundary.static.test.js',
  'tests/engineerMobile/engineerMobileVisitActionPolicyRegistryBoundary.static.test.js',
  'tests/engineerMobile/engineerMobileVisitActionTransitionPatchBuilderBoundary.static.test.js',
]);

const ACTIONS = Object.freeze([
  'engineer_mobile.start_travel',
  'engineer_mobile.arrive',
  'engineer_mobile.start_work',
  'engineer_mobile.finish_work',
  'engineer_mobile.record_visit_result',
]);

const ACTION_STATUS_MAP = Object.freeze({
  'engineer_mobile.arrive': 'arrived',
  'engineer_mobile.finish_work': 'work_finished',
  'engineer_mobile.record_visit_result': 'visit_result_recorded',
  'engineer_mobile.start_travel': 'traveling',
  'engineer_mobile.start_work': 'working',
});

const POLICY_EXPECTATIONS = Object.freeze({
  arrive: [
    'ENGINEER_MOBILE_ARRIVE_PERMISSION',
    'OPEN_ARRIVE_STATUSES',
    'hasTravelStarted',
    'hasAlreadyArrived',
    'hasAlreadyFinished',
    'hasTerminalVisitResult',
    'hasCompletionBoundaryIndicator',
  ],
  finishWork: [
    'ENGINEER_MOBILE_FINISH_WORK_PERMISSION',
    'OPEN_FINISH_WORK_STATUSES',
    'hasWorkStarted',
    'hasAlreadyFinished',
    'hasTerminalVisitResult',
    'hasCompletionBoundaryIndicator',
    'hasFinalAppointmentBoundaryIndicator',
  ],
  recordVisitResult: [
    'ENGINEER_MOBILE_RECORD_VISIT_RESULT_PERMISSION',
    'OPEN_RECORD_VISIT_RESULT_STATUSES',
    'hasWorkFinished',
    'hasVisitResultAlreadyRecorded',
    'hasCompletionBoundaryIndicator',
    'hasFinalAppointmentBoundaryIndicator',
    'normalizedVisitResult',
  ],
  startTravel: [
    'ENGINEER_MOBILE_START_TRAVEL_PERMISSION',
    'OPEN_START_TRAVEL_STATUSES',
    'hasAlreadyArrived',
    'hasAlreadyFinished',
    'hasTerminalVisitResult',
    'hasCompletionBoundaryIndicator',
  ],
  startWork: [
    'ENGINEER_MOBILE_START_WORK_PERMISSION',
    'OPEN_START_WORK_STATUSES',
    'hasArrivalEvidence',
    'hasAlreadyWorking',
    'hasAlreadyFinished',
    'hasTerminalVisitResult',
    'hasCompletionBoundaryIndicator',
  ],
});

const FORBIDDEN_DEPENDENCY_PATTERNS = Object.freeze([
  /require\(['"][^'"]*(db|pool|pg|sql|repositories?|route|router|app|server|listen|provider|line|sms|email|webhook|push|openai|ai|rag|vector|billing|settlement|payment|invoice|env|zeabur|credential|secret)[^'"]*['"]\)/i,
  /process\.env/,
  /DATABASE_URL/,
  /\bnew\s+Pool\b/,
  /\.query\s*\(/,
  /\bfetch\s*\(/,
  /\.listen\s*\(/,
]);

const FORBIDDEN_OUTPUT_PATTERNS = Object.freeze([
  /\.\.\.\s*(source|options|actor|appointment|policyDecision|transitionIntent|result|row|rows)\b/,
  /return\s+(source|options|actor|appointment|policyDecision|transitionIntent|row|rows)\b/,
  /\brawCase\b|\brawAppointment\b|\brawCompletionReport\b|\brawFieldServiceReport\b/,
  /\brawDbRow\b|\brawDbRows\b|\brepositoryRow\b|\brepositoryRows\b/,
  /\bauditActor\b|\bauditContext\b|\bauditWriter\b|\bauditResult\b/,
  /\bproviderPayload\b|\bproviderRawPayload\b|\bproviderDebug\b/,
  /\baiRawPayload\b|\bopenai\b|\brag\b|\bvectorDb\b/i,
  /\bbillingInternal\b|\bsettlementInternal\b|\bpaymentInternal\b|\binvoiceInternal\b/,
  /\bdebugPayload\b|\brawSql\b|\btoken\b|\bpassword\b|\bsecret\b/,
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

test('Task2272 static guard input files exist and this guard is text-only', () => {
  for (const file of [
    ...Object.values(POLICY_FILES),
    ...Object.values(SUPPORT_FILES),
    ...EXISTING_STATIC_TESTS,
  ]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }

  const thisSource = fs.readFileSync(__filename, 'utf8');

  assert.doesNotMatch(thisSource, /require\(['"]\.\.\/\.\.\/src\//);
  assert.doesNotMatch(thisSource, /require\(['"]node:child_process['"]\)/);
});

test('visit action registry keeps action-specific eligibility evaluators explicit', () => {
  const registry = read(SUPPORT_FILES.policyRegistry);

  assert.deepEqual(requireSpecifiers(registry), [
    './engineerMobileStartTravelActionPolicy',
    './engineerMobileArriveActionPolicy',
    './engineerMobileStartWorkActionPolicy',
    './engineerMobileFinishWorkActionPolicy',
    './engineerMobileRecordVisitResultActionPolicy',
  ]);
  assertIncludesAll(registry, [
    'ENGINEER_MOBILE_START_TRAVEL_ACTION',
    'ENGINEER_MOBILE_ARRIVE_ACTION',
    'ENGINEER_MOBILE_START_WORK_ACTION',
    'ENGINEER_MOBILE_FINISH_WORK_ACTION',
    'ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION',
    'ENGINEER_MOBILE_VISIT_ACTION_POLICY_REGISTRY',
    'ENGINEER_MOBILE_SUPPORTED_VISIT_ACTIONS',
    'const evaluator = ENGINEER_MOBILE_VISIT_ACTION_POLICY_REGISTRY[action]',
    'actor: source.actor',
    'appointment: source.appointment',
    'if (action === ENGINEER_MOBILE_RECORD_VISIT_RESULT_ACTION)',
    'evaluatorInput.visitResult = source.visitResult',
  ], 'visit action registry');
  assertNoPattern(registry, [
    /source\.engineerId/,
    /source\.assignedEngineerId/,
    /source\.organizationId/,
    /source\.body/,
    /source\.request/,
  ], 'registry raw client identity access');
});

test('visit action policies preserve assignment permission organization scope and appointment state gates', () => {
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
      'appointmentId: isObject(appointment) ? appointmentId(appointment) : undefined',
      'organizationId: isObject(appointment) ? organizationId(appointment) : undefined',
    ], `${name} base gates`);
    assertIncludesAll(source, POLICY_EXPECTATIONS[name], `${name} action-specific state gates`);
    assertNoPattern(source, FORBIDDEN_DEPENDENCY_PATTERNS, `${name} forbidden dependencies`);
  }
});

test('completion report and final appointment boundaries remain denied before mobile action approval', () => {
  for (const file of [
    POLICY_FILES.startTravel,
    POLICY_FILES.arrive,
    POLICY_FILES.startWork,
    POLICY_FILES.finishWork,
    POLICY_FILES.recordVisitResult,
  ]) {
    const source = read(file);

    assertIncludesAll(source, [
      'hasCompletionBoundaryIndicator',
      "return deny('completion_report_boundary'",
    ], `${file} completion report boundary`);
    assertNoPattern(source, [
      /createFieldServiceReport\s*\(/,
      /approveFieldServiceReport\s*\(/,
      /publishFieldServiceReport\s*\(/,
      /createCompletionReport\s*\(/,
      /approveCompletionReport\s*\(/,
      /publishCompletionReport\s*\(/,
      /completeAppointment\s*\(/,
      /finalAppointmentId\s*=/,
      /final_appointment_id\s*=/,
    ], `${file} forbidden completion/final mutation`);
  }

  for (const file of [POLICY_FILES.finishWork, POLICY_FILES.recordVisitResult]) {
    const source = read(file);

    assertIncludesAll(source, [
      'hasFinalAppointmentBoundaryIndicator',
      "return deny('final_appointment_boundary'",
    ], `${file} final appointment boundary`);
  }
});

test('command planner builds explicit transition intent from policy decision only', () => {
  const source = read(SUPPORT_FILES.commandPlanner);
  const transitionBody = functionBody(source, 'transitionIntentFor');
  const plannerBody = functionBody(source, 'planEngineerMobileVisitActionCommand');

  assert.deepEqual(requireSpecifiers(source), ['./engineerMobileVisitActionDecisionHelper']);
  for (const [action, status] of Object.entries(ACTION_STATUS_MAP)) {
    assert.equal(source.includes(`'${action}': '${status}'`), true, `missing ${action} -> ${status}`);
  }
  assertIncludesAll(transitionBody, [
    'kind: ENGINEER_MOBILE_VISIT_ACTION_TRANSITION_INTENT_KIND',
    'action,',
    'actorId: subject.actorId',
    'appointmentId: subject.appointmentId',
    'caseId: subject.caseId',
    'organizationId: subject.organizationId',
    'mobileVisitStatus: stringValue(helperTransitionIntent.mobileVisitStatus) || mobileVisitStatus',
    'visitResult: stringValue(helperTransitionIntent.visitResult) || stringValue(policyDecision.visitResult)',
    'requestId: stringValue(requestId)',
    'plannedAt: stringValue(helperTransitionIntent.plannedAt) || stringValue(now)',
  ], 'transition intent allowlist');
  assertIncludesAll(plannerBody, [
    'decideEngineerMobileVisitAction({',
    'action: source.action',
    'trustedContext: trustedContextFromActor(source.actor)',
    'assignmentContext: assignmentContextFromAppointment(source.appointment)',
    'actionSubject:',
    'visitResult: source.visitResult',
    'return deniedCommandResult',
    'return allowedCommandResult',
  ], 'command planner policy input');
  assertNoPattern(transitionBody, [
    /source\./,
    /options\./,
    /requestBody/i,
    /body\./,
    /completionReport|fieldServiceReport|finalAppointmentId/i,
  ], 'transition intent raw request/report fields');
});

test('transition patch builder keeps explicit supported state transitions and report boundaries', () => {
  const source = read(SUPPORT_FILES.transitionPatchBuilder);
  const builderBody = functionBody(source, 'buildEngineerMobileVisitActionTransitionPatch');

  assert.deepEqual(requireSpecifiers(source), []);
  assertIncludesAll(source, [
    'SUPPORTED_MOBILE_VISIT_STATUSES',
    "'traveling'",
    "'arrived'",
    "'working'",
    "'work_finished'",
    "'visit_result_recorded'",
    'SUPPORTED_VISIT_RESULTS',
    'hasCompletionBoundary',
    'hasFinalAppointmentBoundary',
  ], 'transition patch supported boundaries');
  assertIncludesAll(builderBody, [
    "return denied('transition_intent_required')",
    "return denied('completion_report_boundary')",
    "return denied('final_appointment_boundary')",
    'const appointmentId = stringValue(transitionIntent.appointmentId)',
    'const organizationId = stringValue(transitionIntent.organizationId)',
    'const actorId = stringValue(transitionIntent.actorId)',
    'const action = stringValue(transitionIntent.action)',
    'const mobileVisitStatus = stringValue(transitionIntent.mobileVisitStatus)',
    'const visitResult = stringValue(transitionIntent.visitResult)',
    'SUPPORTED_MOBILE_VISIT_STATUSES.includes(mobileVisitStatus)',
    'SUPPORTED_VISIT_RESULTS.includes(visitResult)',
    'patch = compactRecord({',
    'mobileVisitStatus,',
    "visitResult: mobileVisitStatus === 'visit_result_recorded' ? visitResult : undefined",
    'updatedBy: actorId',
  ], 'transition patch explicit output');
  assertNoPattern(builderBody, [
    /requestBody/i,
    /body\./,
    /completionReportId\s*:/,
    /fieldServiceReportId\s*:/,
    /finalAppointmentId\s*:/,
    /\.\.\.\s*transitionIntent/,
  ], 'transition patch raw body/report output');
});

test('visit-action output paths do not pass through raw internal objects or unsafe markers', () => {
  const outputSources = [
    ...Object.values(POLICY_FILES).map(read),
    read(SUPPORT_FILES.commandPlanner),
    read(SUPPORT_FILES.transitionPatchBuilder),
    read(SUPPORT_FILES.httpResponsePresenter),
  ];

  for (const [index, source] of outputSources.entries()) {
    assertNoPattern(source, FORBIDDEN_OUTPUT_PATTERNS, `visit action output source ${index}`);
  }
});

test('existing static tests and docs preserve visit-action no-runtime boundaries', () => {
  const combinedStaticTests = EXISTING_STATIC_TESTS.map(read).join('\n');
  const task2266Doc = read(SUPPORT_FILES.task2266Doc);
  const task2271Doc = read(SUPPORT_FILES.task2271Doc);

  assertIncludesAll(combinedStaticTests, [
    'No DB',
    'No provider sending',
    'No completion report',
    'No finalAppointmentId',
    'No customer-visible publication',
  ], 'existing visit action static/doc boundary markers');
  assertIncludesAll(task2266Doc, [
    'Mobile action paths must require exact workflow eligibility',
    'assignment/permission context',
    'appointment state validation',
    'explicit state transitions',
    '`finalAppointmentId` remains system-owned',
  ], 'Task2266 mobile action guardrails');
  assertIncludesAll(task2271Doc, [
    'Eligibility/state-transition static guard for mobile visit actions',
    'Assignment/permission context source boundary guard',
    'Bounded runtime wiring of the safe Workbench envelope presenter only if PM explicitly selects the exact source boundary',
  ], 'Task2271 next candidate guardrails');
});
