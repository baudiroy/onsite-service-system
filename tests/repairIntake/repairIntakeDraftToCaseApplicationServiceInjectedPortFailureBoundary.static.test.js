'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const APPLICATION_SERVICE_PATH = 'src/repairIntake/repairIntakeDraftToCaseApplicationService.js';
const TASK2226_TEST_PATH = 'tests/repairIntake/repairIntakeDraftToCaseApplicationServiceInjectedPortFailureNormalizer.unit.test.js';
const TASK2226_DOC_PATH = 'docs/task-2226-repair-intake-draft-to-case-application-service-injected-port-failure-normalizer-no-db-no-smoke-no-provider.md';
const TASK2227_DOC_PATH = 'docs/task-2227-repair-intake-draft-to-case-application-service-injected-port-failure-static-boundary-guard-no-runtime-change-no-db-no-smoke-no-provider.md';

const ALLOWED_TEST_IMPORTS = Object.freeze([
  'node:assert/strict',
  'node:fs',
  'node:path',
  'node:test',
]);

const FORBIDDEN_IMPORT_PATTERNS = Object.freeze([
  /(?:^|\/)(?:db|database|repositories?|migrations?|providers?|line|sms|email|webhooks?|server|app|routes?|smoke|shared|runtime)(?:$|\/)/i,
  /^(?:pg|postgres|knex|sequelize|typeorm|prisma|mysql2|sqlite3|mongodb|mongoose|redis)$/i,
]);

const UNSAFE_DENYLIST_MARKERS = Object.freeze([
  'providerpayload',
  'auditinternal',
  'debug',
  'internal',
  'billing',
  'settlement',
  'invoice',
  'password',
  'rag',
  'raw',
  'rawbody',
  'rawdraft',
  'rawinput',
  'rawportoutput',
  'rawrows',
  'error',
  'stack',
  'sql',
  'database_url',
  'databaseurl',
  'token',
  'secret',
  'customer',
  'customerphone',
  'address',
  'phone',
]);

const UNSAFE_TEST_MARKERS = Object.freeze([
  'select *',
  'postgres://',
  'DATABASE_URL',
  'process.env',
  'unsafe token',
  'unsafe password',
  'unsafe secret',
  'unsafe stack trace',
  'unsafe provider payload',
  'unsafe customer phone',
  'unsafe address',
  'unsafe raw draft',
  'unsafe audit internal',
  'unsafe debug detail',
  'customerPhone',
  'providerPayload',
  'auditInternal',
  'rawPortOutput',
]);

function projectPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(projectPath(relativePath), 'utf8');
}

function requireSpecifiers(source) {
  return Array.from(source.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g), (match) => match[1]);
}

function functionBlock(source, functionName) {
  const marker = `function ${functionName}`;
  const start = source.indexOf(marker);

  assert.notEqual(start, -1, `missing function ${functionName}`);

  const paramsStart = source.indexOf('(', start);
  let paramsDepth = 0;
  let paramsEnd = -1;

  for (let index = paramsStart; index < source.length; index += 1) {
    const char = source[index];

    if (char === '(') {
      paramsDepth += 1;
    } else if (char === ')') {
      paramsDepth -= 1;

      if (paramsDepth === 0) {
        paramsEnd = index;
        break;
      }
    }
  }

  assert.notEqual(paramsEnd, -1, `unterminated params for ${functionName}`);

  const bodyStart = source.indexOf('{', paramsEnd);
  let depth = 0;

  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index];

    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;

      if (depth === 0) {
        return source.slice(start, index + 1);
      }
    }
  }

  assert.fail(`unterminated function ${functionName}`);
}

function constSetBlock(source, constName) {
  const pattern = new RegExp(`const ${constName} = new Set\\(\\[([\\s\\S]*?)\\]\\);`);
  const match = source.match(pattern);

  assert.ok(match, `missing set ${constName}`);

  return match[1];
}

function assertIncludesAll(source, markers, label) {
  for (const marker of markers) {
    assert.equal(source.includes(marker), true, `${label} missing marker ${marker}`);
  }
}

function assertExcludesAll(source, markers, label) {
  for (const marker of markers) {
    assert.equal(source.includes(marker), false, `${label} contains marker ${marker}`);
  }
}

test('Task2227 static guard reads current source test and doc evidence only', () => {
  for (const relativePath of [
    APPLICATION_SERVICE_PATH,
    TASK2226_TEST_PATH,
    TASK2226_DOC_PATH,
    TASK2227_DOC_PATH,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }

  assert.deepEqual(requireSpecifiers(read(TASK2227_DOC_PATH)), []);
  assert.deepEqual(requireSpecifiers(read('tests/repairIntake/repairIntakeDraftToCaseApplicationServiceInjectedPortFailureBoundary.static.test.js')), ALLOWED_TEST_IMPORTS);
});

test('application service stays injected-port based without concrete DB repository provider or route imports', () => {
  const source = read(APPLICATION_SERVICE_PATH);

  assert.deepEqual(requireSpecifiers(source), []);

  for (const specifier of requireSpecifiers(source)) {
    for (const pattern of FORBIDDEN_IMPORT_PATTERNS) {
      assert.doesNotMatch(specifier, pattern, `unexpected concrete import ${specifier}`);
    }
  }

  assertIncludesAll(source, [
    "portMethodIsValid(ports.draftReader, 'getDraftForConversion')",
    "portMethodIsValid(ports.casePlanner, 'planCaseFromDraft')",
    "portMethodIsValid(ports.caseCreator, 'createCaseFromDraft')",
    "portMethodIsValid(ports.auditWriter, 'recordDraftToCaseDecision')",
    "portMethodIsValid(idempotencyPort, 'findExistingDraftToCaseResult')",
    "portMethodIsValid(idempotencyPort, 'recordDraftToCaseResult')",
  ], 'application service injected port contract');
});

test('planDraftToCase keeps fail-closed catch paths and malformed case planner guard', () => {
  const source = read(APPLICATION_SERVICE_PATH);
  const planDraftToCase = functionBlock(source, 'planDraftToCase');

  assertIncludesAll(planDraftToCase, [
    'try {',
    'draftReader.getDraftForConversion(createInputPayload(safeInput))',
    'if (draftReadFailed(draft))',
    "draftReadFailureEnvelope(safeInput, draft, 'repair_intake_draft_to_case_plan')",
    'casePlanner.planCaseFromDraft(createPlanPayload(safeInput, draft))',
    'if (!isObject(plan))',
    "return safeFailure('REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_PLAN_FAILED')",
    'return planEnvelope(safeInput, draft, plan)',
    '} catch (error) {',
    "return safeFailure('REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_PLAN_FAILED')",
  ], 'planDraftToCase failure boundary');
});

test('submitDraftToCase keeps fail-closed port guards before success envelope construction', () => {
  const source = read(APPLICATION_SERVICE_PATH);
  const submitDraftToCase = functionBlock(source, 'submitDraftToCase');

  assertIncludesAll(submitDraftToCase, [
    'idempotencyPort.findExistingDraftToCaseResult(createInputPayload(safeInput))',
    'draftReader.getDraftForConversion(createInputPayload(safeInput))',
    'if (draftReadFailed(draft))',
    "draftReadFailureEnvelope(safeInput, draft, 'repair_intake_draft_to_case_submit')",
    'casePlanner.planCaseFromDraft(createPlanPayload(safeInput, draft))',
    'if (!isObject(plan))',
    'caseCreator.createCaseFromDraft(createCasePayload(safeInput, draft, plan))',
    'if (!isObject(caseRef))',
    'auditWriter.recordDraftToCaseDecision(createAuditPayload(safeInput, draft, plan, caseRef))',
    'if (!isObject(auditEvent))',
    "return safeFailure('REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_SUBMIT_FAILED')",
    'const result = submitEnvelope(safeInput, draft, plan, caseRef, auditEvent)',
    'idempotencyPort.recordDraftToCaseResult(createIdempotencyRecordPayload(safeInput, result))',
    "error.reasonCode === 'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_IDEMPOTENCY_FAILED'",
    "return safeFailure(error.reasonCode)",
  ], 'submitDraftToCase failure boundary');

  assert.match(
    submitDraftToCase,
    /if \(!isObject\(plan\)\) \{[\s\S]*?return safeFailure\('REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_SUBMIT_FAILED'\);[\s\S]*?\}/,
  );
  assert.match(
    submitDraftToCase,
    /if \(!isObject\(caseRef\)\) \{[\s\S]*?return safeFailure\('REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_SUBMIT_FAILED'\);[\s\S]*?\}/,
  );
  assert.match(
    submitDraftToCase,
    /if \(!isObject\(auditEvent\)\) \{[\s\S]*?return safeFailure\('REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_SUBMIT_FAILED'\);[\s\S]*?\}/,
  );
});

test('unsafe sanitizer denylist freezes Task2226 raw private and system leakage markers', () => {
  const source = read(APPLICATION_SERVICE_PATH);
  const denylist = constSetBlock(source, 'UNSAFE_FIELD_NAMES').toLowerCase();

  for (const marker of UNSAFE_DENYLIST_MARKERS) {
    assert.equal(denylist.includes(`'${marker}'`), true, `denylist missing ${marker}`);
  }
});

test('success envelopes remain explicitly shaped and do not spread raw port output wholesale', () => {
  const source = read(APPLICATION_SERVICE_PATH);
  const planEnvelope = functionBlock(source, 'planEnvelope');
  const submitEnvelope = functionBlock(source, 'submitEnvelope');
  const createPlanSummary = functionBlock(source, 'createPlanSummary');
  const createCaseRefSummary = functionBlock(source, 'createCaseRefSummary');

  assertIncludesAll(planEnvelope, [
    'ok: true',
    "action: 'repair_intake_draft_to_case_plan'",
    'plan,',
    'caseRef: null',
    'auditEvent: null',
  ], 'plan envelope');
  assertIncludesAll(submitEnvelope, [
    'ok: true',
    "action: 'repair_intake_draft_to_case_submit'",
    'plan,',
    'caseRef,',
    'auditEvent,',
  ], 'submit envelope');
  assertIncludesAll(createPlanSummary, [
    'status: plan.status',
    'reasonCode: plan.reasonCode',
    'requiredActions: plan.requiredActions',
    'candidate: plan.candidate',
    'caseCandidate: plan.caseCandidate',
    'summary: plan.summary',
  ], 'plan summary');
  assertIncludesAll(createCaseRefSummary, [
    'id: caseRef.id',
    'caseId: caseRef.caseId || caseRef.id',
    'organizationId: caseRef.organizationId',
    'sourceDraftId: caseRef.sourceDraftId',
    'status: caseRef.status',
    'reasonCode: caseRef.reasonCode',
    'requiredActions: caseRef.requiredActions',
    'summary: caseRef.summary',
  ], 'case ref summary');
  assertExcludesAll(planEnvelope, ['...plan', '...draft', 'Object.assign'], 'plan envelope');
  assertExcludesAll(submitEnvelope, ['...plan', '...caseRef', '...auditEvent', 'Object.assign'], 'submit envelope');
});

test('Task2226 unit coverage proves unsafe leakage denial success preservation and immutability', () => {
  const unitTestSource = read(TASK2226_TEST_PATH);

  assertIncludesAll(unitTestSource, [
    'success path remains unchanged and sanitized',
    'planDraftToCase normalizes thrown rejected and malformed injected port failures',
    'submitDraftToCase normalizes thrown rejected and malformed injected port failures',
    'idempotency port failures fail closed without leaking raw internals',
    'input objects and injected port result objects are not mutated',
    'assertNoUnsafeText(result)',
  ], 'Task2226 unit test coverage');

  for (const marker of UNSAFE_TEST_MARKERS) {
    assert.equal(unitTestSource.includes(marker), true, `Task2226 unit test missing unsafe marker ${marker}`);
  }
});

test('Task2226 and Task2227 docs record source-only authorization boundaries', () => {
  const task2226Doc = read(TASK2226_DOC_PATH);
  const task2227Doc = read(TASK2227_DOC_PATH);

  assertIncludesAll(task2226Doc, [
    'Hardens the existing Repair Intake draft-to-case application service injected-port boundary',
    'Does not add DB execution, repository implementation behavior, migrations, smoke probes, providers, route exposure',
    'Case planner, case creator, and audit writer thrown/rejected/malformed outputs fail closed',
    'Input objects and injected port result objects are not mutated',
  ], 'Task2226 doc');
  assertIncludesAll(task2227Doc, [
    'Reads source, test, and doc files only',
    'Does not change runtime/source behavior',
    'Application service calls injected ports only',
    'The guard imports only Node core source-reading modules',
  ], 'Task2227 doc');
});
