'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const repairIntakeSourceDir = path.join(repoRoot, 'src/repairIntake');

const ROUTE_SOURCE_PATH = 'src/routes/repairIntakeDraftToCase.routes.js';
const TASK2211_DOC_PATH = 'docs/task-2211-repair-intake-draft-to-case-route-mount-readiness-inventory-no-runtime-change-no-db-no-smoke-no-provider.md';
const TASK2216_DOC_PATH = 'docs/task-2216-repair-intake-draft-to-case-admin-route-branch-checkpoint-no-runtime-change-no-db-no-smoke-no-provider.md';
const TASK2217_DOC_PATH = 'docs/task-2217-repair-intake-draft-to-case-audit-persistence-decision-gate-no-runtime-change-no-db-no-smoke-no-provider.md';
const TASK2218_DOC_PATH = 'docs/task-2218-repair-intake-draft-to-case-db-repository-transaction-boundary-decision-gate-no-runtime-change-no-db-no-smoke-no-provider.md';
const RUNTIME_PORTS_FACTORY_PATH = 'src/repairIntake/repairIntakeDraftToCaseRuntimePortsFactory.js';

const BOUNDARY_SOURCE_PATHS = Object.freeze([
  ROUTE_SOURCE_PATH,
  'src/repairIntake/repairIntakeDraftToCaseApiModule.js',
  'src/repairIntake/repairIntakeDraftToCaseApplicationService.js',
  'src/repairIntake/repairIntakeDraftToCaseController.js',
  'src/repairIntake/repairIntakeDraftToCaseControllerAdapter.js',
  'src/repairIntake/repairIntakeDraftToCaseHttpMountAdapter.js',
  'src/repairIntake/repairIntakeDraftToCaseHttpResultMapper.js',
  'src/repairIntake/repairIntakeDraftToCaseInjectedRouteComposition.js',
  'src/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposer.js',
  'src/repairIntake/repairIntakeDraftToCasePreRouteHandlerFactory.js',
  'src/repairIntake/repairIntakeDraftToCaseRequestContextResolver.js',
  'src/repairIntake/repairIntakeDraftToCaseRouteHandlerFactory.js',
  'src/repairIntake/repairIntakeDraftToCaseRouteRegistrar.js',
  'src/repairIntake/repairIntakeDraftToCaseSafeRouteBoundary.js',
  'src/repairIntake/repairIntakeDraftToCaseSyntheticHandler.js',
]);

const DIRECT_DB_PACKAGE_PATTERNS = Object.freeze([
  /^(?:pg|knex|sequelize|typeorm|prisma|mysql2|sqlite3|mongodb|mongoose|redis)$/i,
  /^(?:node-)?postgres$/i,
]);

const REPOSITORY_IMPLEMENTATION_IMPORT_PATTERNS = Object.freeze([
  /repairIntake(?:Draft|Case|Idempotency).*Repository(?:Adapter|Consumer)?$/i,
  /repairIntakeTransactionRunnerAdapter$/i,
  /RepositoryAdapter$/i,
  /RepositoryConsumer$/i,
]);

const SQL_OR_MIGRATION_MARKERS = Object.freeze([
  /\bDATABASE_URL\b/,
  /\bprocess\.env\b/,
  /\bCREATE\s+TABLE\b/i,
  /\bALTER\s+TABLE\b/i,
  /\bDROP\s+TABLE\b/i,
  /\bINSERT\s+INTO\b/i,
  /\bUPDATE\s+[a-z_]/i,
  /\bDELETE\s+FROM\b/i,
  /\bSELECT\s+.+\bFROM\b/i,
  /\bBEGIN\b.*\bCOMMIT\b/is,
  /\.query\s*\(/,
  /\bdb:migrate\b/i,
  /\bmigrations?\//i,
  /\bmigration\s+(?:up|apply|latest|deploy|run|dry-run)\b/i,
]);

const PROVIDER_OR_RUNTIME_MARKERS = Object.freeze([
  /\bsend(?:Line|Sms|Email|Notification)\b/,
  /\bwebhook\b/i,
  /\bopenai\b/i,
  /\bvector\b/i,
  /\bbilling\b/i,
  /\bsettlement\b/i,
  /\binvoice\b/i,
  /\bpayment\b/i,
]);

function projectPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(projectPath(relativePath), 'utf8');
}

function allDraftToCaseSourcePaths() {
  return fs.readdirSync(repairIntakeSourceDir)
    .filter((entry) => /^repairIntakeDraftToCase.*\.js$/.test(entry))
    .map((entry) => `src/repairIntake/${entry}`)
    .concat(ROUTE_SOURCE_PATH)
    .sort();
}

function requireSpecifiers(source) {
  return Array.from(source.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g), (match) => match[1]);
}

function stripConstSetBlock(source, constName) {
  const marker = `const ${constName} = new Set([`;
  const start = source.indexOf(marker);

  if (start === -1) {
    return source;
  }

  const end = source.indexOf(']);', start);

  assert.notEqual(end, -1, `unterminated set ${constName}`);

  return `${source.slice(0, start)}\n${source.slice(end + 3)}`;
}

function stripConstArrayBlock(source, constName) {
  const marker = `const ${constName} = [`;
  const start = source.indexOf(marker);

  if (start === -1) {
    return source;
  }

  const end = source.indexOf('];', start);

  assert.notEqual(end, -1, `unterminated array ${constName}`);

  return `${source.slice(0, start)}\n${source.slice(end + 3)}`;
}

function sourceWithoutDenyLists(source) {
  const withoutSets = [
    'BODY_CONTEXT_FIELD_NAMES',
    'BODY_OVERRIDE_FIELD_NAMES',
    'SAFE_HEADER_NAMES',
    'SAFE_HTTP_METHODS',
    'UNSAFE_FIELD_NAMES',
    'UNSAFE_INPUT_FIELD_NAMES',
    'UNSAFE_OUTPUT_FIELD_NAMES',
  ].reduce((result, constName) => stripConstSetBlock(result, constName), source);

  return [
    'UNSAFE_VALUE_MARKERS',
  ].reduce((result, constName) => stripConstArrayBlock(result, constName), withoutSets);
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

function assertIncludesAll(source, markers, label) {
  for (const marker of markers) {
    assert.equal(source.includes(marker), true, `${label} missing marker ${marker}`);
  }
}

function assertExcludesAll(source, patterns, label) {
  for (const pattern of patterns) {
    assert.doesNotMatch(source, pattern, `${label} should not contain ${pattern}`);
  }
}

test('Task2218 static guard reads current decision inputs and Repair Intake draft-to-case files', () => {
  for (const relativePath of [
    ...BOUNDARY_SOURCE_PATHS,
    RUNTIME_PORTS_FACTORY_PATH,
    TASK2211_DOC_PATH,
    TASK2216_DOC_PATH,
    TASK2217_DOC_PATH,
    TASK2218_DOC_PATH,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }

  assert.ok(allDraftToCaseSourcePaths().length > BOUNDARY_SOURCE_PATHS.length);
});

test('current draft-to-case files have no direct DB package imports', () => {
  for (const relativePath of allDraftToCaseSourcePaths()) {
    const source = read(relativePath);

    for (const specifier of requireSpecifiers(source)) {
      for (const pattern of DIRECT_DB_PACKAGE_PATTERNS) {
        assert.doesNotMatch(specifier, pattern, `${relativePath} must not import DB package ${specifier}`);
      }
    }
  }
});

test('route/admin/API/controller/application/synthetic boundary has no SQL execution or migration markers', () => {
  for (const relativePath of BOUNDARY_SOURCE_PATHS) {
    const source = sourceWithoutDenyLists(read(relativePath));

    assertExcludesAll(source, SQL_OR_MIGRATION_MARKERS, relativePath);
    assertExcludesAll(source, PROVIDER_OR_RUNTIME_MARKERS, relativePath);
  }
});

test('repository implementation imports stay outside route/admin/API/controller/application/synthetic boundary', () => {
  for (const relativePath of BOUNDARY_SOURCE_PATHS) {
    const source = read(relativePath);

    for (const specifier of requireSpecifiers(source)) {
      for (const pattern of REPOSITORY_IMPLEMENTATION_IMPORT_PATTERNS) {
        assert.doesNotMatch(
          specifier,
          pattern,
          `${relativePath} must not directly import repository implementation ${specifier}`,
        );
      }
    }
  }
});

test('route/admin/API/controller/application/synthetic boundary remains injected-port based', () => {
  const routeSource = read(ROUTE_SOURCE_PATH);
  const apiModule = read('src/repairIntake/repairIntakeDraftToCaseApiModule.js');
  const controller = read('src/repairIntake/repairIntakeDraftToCaseController.js');
  const applicationService = read('src/repairIntake/repairIntakeDraftToCaseApplicationService.js');
  const syntheticHandler = read('src/repairIntake/repairIntakeDraftToCaseSyntheticHandler.js');
  const injectedRuntimeComposer = read('src/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposer.js');

  assertIncludesAll(routeSource, [
    'createRepairIntakeDraftToCaseInjectedRouteComposition',
    'getRepairIntakeDraftToCaseRuntimePorts',
    'requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION)',
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH = '/api/v1/admin/repair-intake/drafts/:draftId/case/submit'",
  ], 'admin route');

  assertIncludesAll(apiModule, [
    'createRepairIntakeDraftCaseControllerAdapter',
    'createRepairIntakeDraftCaseRoutes',
    'registerRepairIntakeDraftToCaseRoutes',
    'createSafeController(controller)',
  ], 'api module');

  assertIncludesAll(controller, [
    'applicationServiceIsValid(applicationService)',
    'applicationService.planDraftToCase',
    'applicationService.submitDraftToCase',
    'callApplicationService(',
  ], 'controller');

  assertIncludesAll(applicationService, [
    "portMethodIsValid(ports.draftReader, 'getDraftForConversion')",
    "portMethodIsValid(ports.casePlanner, 'planCaseFromDraft')",
    "portMethodIsValid(ports.caseCreator, 'createCaseFromDraft')",
    "portMethodIsValid(ports.auditWriter, 'recordDraftToCaseDecision')",
    'draftReader.getDraftForConversion',
    'casePlanner.planCaseFromDraft',
    'caseCreator.createCaseFromDraft',
    'auditWriter.recordDraftToCaseDecision',
  ], 'application service');

  assertIncludesAll(syntheticHandler, [
    'resolveContextResolver(safeOptions.requestContextResolver)',
    'resolveControllerAdapter(safeOptions.controllerAdapter)',
    'resolvePermissionDeniedAuditWriter(',
    'callControllerAdapter(adapterInput)',
  ], 'synthetic handler');

  assertIncludesAll(injectedRuntimeComposer, [
    "hasMethod(options.draftRepository, 'findDraftForConversion')",
    "hasMethod(options.caseCreationPort, 'createCaseFromDraft')",
    "hasMethod(options.auditPort, 'recordDraftToCaseDecision')",
    'createRepairIntakeDraftReaderPortAdapter({',
    'createRepairIntakeCaseCreatorPortAdapter({',
    'createRepairIntakeAuditWriterPortAdapter({',
  ], 'injected runtime composer');
});

test('existing DB-capable runtime ports factory is inventoried but not expanded by this decision gate', () => {
  const source = read(RUNTIME_PORTS_FACTORY_PATH);

  assertIncludesAll(source, [
    'function createRepairIntakeDraftToCaseRuntimePorts(options = {})',
    'createRepairIntakeDraftRepository({ dbClient })',
    'createRepairIntakeIdempotencyRepository({ dbClient })',
    'createRepairIntakeCaseRepositoryAdapter({',
    'function createConversionWriter({ dbClient, generateId: generate, now })',
    'function createAuditPort({ dbClient, generateId: generate, now })',
    'await dbClient.query(',
    'INSERT INTO repair_intake_draft_case_conversions (',
    'UPDATE repair_intake_drafts',
    'INSERT INTO repair_intake_audit_events (',
  ], 'runtime ports factory inventory');

  assertExcludesAll(source, DIRECT_DB_PACKAGE_PATTERNS, 'runtime ports factory direct package imports');
});

test('decision gate doc records future DB decisions without authorizing implementation', () => {
  const doc = read(TASK2218_DOC_PATH);

  assertIncludesAll(doc, [
    'No DB/repository transaction behavior is authorized by this task',
    'No SQL execution or SQL string construction for runtime is authorized by this task',
    'No migration/schema change is authorized by this task',
    'No repository implementation change is authorized by this task',
    'No audit persistence is authorized by this task',
    'Future DB/repository implementation requires a separate exact PM task',
    'Source table/read model for Repair Intake draft',
    'Target Case creation tables and required fields',
    'Transaction boundary and rollback behavior',
    'Idempotency/replay behavior',
    'Organization isolation enforcement',
    'Permission and actor attribution',
    'Audit write coupling: same transaction vs independent/best-effort',
    'Validation and conflict handling',
    'Migration/schema/dry-run authorization',
    'Smoke/staging/prod rollout authorization',
  ], 'Task2218 decision gate doc');

  assertExcludesAll(doc, [
    /migrations\//i,
    /\bCREATE\s+TABLE\b/i,
    /\bALTER\s+TABLE\b/i,
    /\bINSERT\s+INTO\b/i,
    /\bUPDATE\s+[a-z_]/i,
    /\bSELECT\s+.+\bFROM\b/i,
    /\.query\s*\(/,
    /\bDATABASE_URL\b/,
  ], 'Task2218 decision gate doc');
});

test('audit persistence remains governed by Task2217 decision gate, not implemented by Task2218', () => {
  const task2217 = read(TASK2217_DOC_PATH);
  const task2218 = read(TASK2218_DOC_PATH);
  const boundarySource = BOUNDARY_SOURCE_PATHS
    .map((relativePath) => sourceWithoutDenyLists(read(relativePath)))
    .join('\n');

  assertIncludesAll(task2217, [
    'No DB audit persistence is authorized by this task.',
    'Future audit persistence requires a separate exact PM-authorized task.',
  ], 'Task2217 audit persistence decision gate');

  assertIncludesAll(task2218, [
    'Task2218 does not authorize audit persistence',
    'same transaction vs independent/best-effort',
  ], 'Task2218 audit persistence boundary');

  assertExcludesAll(boundarySource, [
    /repair_intake_audit_events/i,
    /recordAuditEventToDb/i,
    /auditRepository/i,
    /audit persistence/i,
  ], 'route/admin/API/controller/application/synthetic audit persistence boundary');
});
