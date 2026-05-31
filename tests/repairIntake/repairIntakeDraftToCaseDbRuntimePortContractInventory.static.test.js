'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const TASK2217_DOC_PATH = 'docs/task-2217-repair-intake-draft-to-case-audit-persistence-decision-gate-no-runtime-change-no-db-no-smoke-no-provider.md';
const TASK2218_DOC_PATH = 'docs/task-2218-repair-intake-draft-to-case-db-repository-transaction-boundary-decision-gate-no-runtime-change-no-db-no-smoke-no-provider.md';
const TASK2219_DOC_PATH = 'docs/task-2219-repair-intake-draft-to-case-db-runtime-port-contract-inventory-no-runtime-change-no-db-no-smoke-no-provider.md';

const ADMIN_AND_SYNTHETIC_BOUNDARY_PATHS = Object.freeze([
  'src/routes/repairIntakeDraftToCase.routes.js',
  'src/repairIntake/repairIntakeDraftToCaseApiModule.js',
  'src/repairIntake/repairIntakeDraftToCaseApplicationService.js',
  'src/repairIntake/repairIntakeDraftToCaseController.js',
  'src/repairIntake/repairIntakeDraftToCaseControllerAdapter.js',
  'src/repairIntake/repairIntakeDraftToCaseInjectedRouteComposition.js',
  'src/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposer.js',
  'src/repairIntake/repairIntakeDraftToCaseRequestContextResolver.js',
  'src/repairIntake/repairIntakeDraftToCaseRouteHandlerFactory.js',
  'src/repairIntake/repairIntakeDraftToCaseSyntheticHandler.js',
]);

const INVENTORY_SOURCE_PATHS = Object.freeze([
  ...ADMIN_AND_SYNTHETIC_BOUNDARY_PATHS,
  'src/repairIntake/repairIntakeDraftToCaseRuntimePortsFactory.js',
  'src/repairIntake/repairIntakeDraftRepositoryContract.js',
  'src/repairIntake/repairIntakeCaseRepositoryContract.js',
  'src/repairIntake/repairIntakeIdempotencyRepositoryContract.js',
  'src/repairIntake/repairIntakeAuditWriterPortAdapter.js',
  'src/repairIntake/repairIntakeIdempotencyPortAdapter.js',
  'src/repairIntake/repairIntakeDraftToCasePublicResultPresenter.js',
  'src/repairIntake/repairIntakeDraftToCaseHttpResultMapper.js',
]);

const REPOSITORY_IMPLEMENTATION_IMPORT_PATTERNS = Object.freeze([
  /repairIntake(?:Draft|Case|Idempotency).*Repository(?:Adapter|Consumer)?$/i,
  /repairIntakeTransactionRunnerAdapter$/i,
  /RepositoryAdapter$/i,
  /RepositoryConsumer$/i,
]);

const DIRECT_DB_PACKAGE_PATTERNS = Object.freeze([
  /^(?:pg|knex|sequelize|typeorm|prisma|mysql2|sqlite3|mongodb|mongoose|redis)$/i,
  /^(?:node-)?postgres$/i,
]);

const SQL_OR_MIGRATION_PATTERNS = Object.freeze([
  /\bDATABASE_URL\b/,
  /\bprocess\.env\b/,
  /\bCREATE\s+TABLE\b/i,
  /\bALTER\s+TABLE\b/i,
  /\bDROP\s+TABLE\b/i,
  /\bINSERT\s+INTO\b/i,
  /\bUPDATE\s+[a-z_]/i,
  /\bDELETE\s+FROM\b/i,
  /\bSELECT\s+.+\bFROM\b/i,
  /\.query\s*\(/,
  /\bmigrations?\//i,
  /\bmigration\s+(?:up|apply|latest|deploy|run|dry-run)\b/i,
  /\bdb:migrate\b/i,
]);

const TASK_DOC_SQL_OR_MIGRATION_PATTERNS = Object.freeze([
  /\bDATABASE_URL\b/,
  /\bprocess\.env\b/,
  /\bCREATE\s+TABLE\b/i,
  /\bALTER\s+TABLE\b/i,
  /\bDROP\s+TABLE\b/i,
  /\bINSERT\s+INTO\b/i,
  /\bUPDATE\s+[a-z_]/i,
  /\bDELETE\s+FROM\b/i,
  /\bSELECT\s+.+\bFROM\b/i,
  /\.query\s*\(/,
  /\bdb:migrate\b/i,
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
    'SAFE_FIELD_NAMES',
    'UNSAFE_FIELD_NAMES',
    'UNSAFE_INPUT_FIELD_NAMES',
    'UNSAFE_OUTPUT_FIELD_NAMES',
  ].reduce((result, constName) => stripConstSetBlock(result, constName), source);

  return [
    'UNSAFE_PUBLIC_VALUE_MARKERS',
    'UNSAFE_VALUE_MARKERS',
  ].reduce((result, constName) => stripConstArrayBlock(result, constName), withoutSets);
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

test('Task2219 static inventory reads the current contract and boundary files', () => {
  for (const relativePath of [
    ...INVENTORY_SOURCE_PATHS,
    TASK2217_DOC_PATH,
    TASK2218_DOC_PATH,
    TASK2219_DOC_PATH,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('route admin API controller application and synthetic boundaries remain injected-port based', () => {
  const routeSource = read('src/routes/repairIntakeDraftToCase.routes.js');
  const apiModule = read('src/repairIntake/repairIntakeDraftToCaseApiModule.js');
  const controller = read('src/repairIntake/repairIntakeDraftToCaseController.js');
  const applicationService = read('src/repairIntake/repairIntakeDraftToCaseApplicationService.js');
  const syntheticHandler = read('src/repairIntake/repairIntakeDraftToCaseSyntheticHandler.js');
  const injectedRuntimeComposer = read('src/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposer.js');

  assertIncludesAll(routeSource, [
    'getRepairIntakeDraftToCaseRuntimePorts',
    'createRepairIntakeDraftToCaseInjectedRouteComposition',
    'requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION)',
  ], 'admin route boundary');

  assertIncludesAll(apiModule, [
    'createRepairIntakeDraftCaseControllerAdapter',
    'createRepairIntakeDraftCaseRoutes',
    'registerRepairIntakeDraftToCaseRoutes',
    'createSafeController(controller)',
  ], 'API module boundary');

  assertIncludesAll(controller, [
    'applicationServiceIsValid(applicationService)',
    'applicationService.planDraftToCase',
    'applicationService.submitDraftToCase',
  ], 'controller boundary');

  assertIncludesAll(applicationService, [
    "portMethodIsValid(ports.draftReader, 'getDraftForConversion')",
    "portMethodIsValid(ports.casePlanner, 'planCaseFromDraft')",
    "portMethodIsValid(ports.caseCreator, 'createCaseFromDraft')",
    "portMethodIsValid(ports.auditWriter, 'recordDraftToCaseDecision')",
    'draftReader.getDraftForConversion',
    'casePlanner.planCaseFromDraft',
    'caseCreator.createCaseFromDraft',
    'auditWriter.recordDraftToCaseDecision',
  ], 'application service boundary');

  assertIncludesAll(syntheticHandler, [
    'resolveContextResolver(safeOptions.requestContextResolver)',
    'resolveControllerAdapter(safeOptions.controllerAdapter)',
    'resolvePermissionDeniedAuditWriter(',
    'callControllerAdapter(adapterInput)',
  ], 'synthetic handler boundary');

  assertIncludesAll(injectedRuntimeComposer, [
    "hasMethod(options.draftRepository, 'findDraftForConversion')",
    "hasMethod(options.caseCreationPort, 'createCaseFromDraft')",
    "hasMethod(options.auditPort, 'recordDraftToCaseDecision')",
    'createRepairIntakeDraftReaderPortAdapter({',
    'createRepairIntakeCaseCreatorPortAdapter({',
    'createRepairIntakeAuditWriterPortAdapter({',
  ], 'injected runtime composer boundary');
});

test('repository implementation imports are not pulled into route/admin/API/controller/application/synthetic boundaries', () => {
  for (const relativePath of ADMIN_AND_SYNTHETIC_BOUNDARY_PATHS) {
    const source = read(relativePath);

    for (const specifier of requireSpecifiers(source)) {
      for (const pattern of REPOSITORY_IMPLEMENTATION_IMPORT_PATTERNS) {
        assert.doesNotMatch(
          specifier,
          pattern,
          `${relativePath} must not import repository implementation ${specifier}`,
        );
      }
    }
  }
});

test('DB-capable runtime port factory is inventoried without executing it', () => {
  const source = read('src/repairIntake/repairIntakeDraftToCaseRuntimePortsFactory.js');

  assertIncludesAll(source, [
    'function createRepairIntakeDraftToCaseRuntimePorts(options = {})',
    'assertDbClient(dbClient)',
    'createRepairIntakeDraftRepository({ dbClient })',
    'createRepairIntakeIdempotencyRepository({ dbClient })',
    'createRepairIntakeCaseRepositoryAdapter({',
    'function createConversionWriter({ dbClient, generateId: generate, now })',
    'function createCaseCreationPort({ caseRepository, recordConversion })',
    'function createAuditPort({ dbClient, generateId: generate, now })',
    'const idempotencyStore = createIdempotencyStore(idempotencyRepository)',
    'const caseCreationPort = createCaseCreationPort({',
    'const auditPort = createAuditPort({',
    'return {',
    'draftRepository,',
    'idempotencyStore,',
    'caseCreationPort,',
    'auditPort,',
  ], 'DB-capable runtime port factory inventory');

  for (const specifier of requireSpecifiers(source)) {
    for (const pattern of DIRECT_DB_PACKAGE_PATTERNS) {
      assert.doesNotMatch(specifier, pattern, `runtime port factory must not import DB package ${specifier}`);
    }
  }
});

test('repository contract modules remain injected and sanitized contract seams', () => {
  const draftContract = read('src/repairIntake/repairIntakeDraftRepositoryContract.js');
  const caseContract = read('src/repairIntake/repairIntakeCaseRepositoryContract.js');
  const idempotencyContract = read('src/repairIntake/repairIntakeIdempotencyRepositoryContract.js');

  assertIncludesAll(draftContract, [
    'createRepairIntakeDraftRepositoryContract',
    'repository.findDraftForConversion(lookup)',
    'sanitizeContractFields(input)',
    'failureEnvelope(',
  ], 'draft repository contract');

  assertIncludesAll(caseContract, [
    'createRepairIntakeCaseRepositoryContract',
    'repository.createCaseFromDraft(creationInput)',
    'sanitizeContractFields(input)',
    'failureEnvelope(',
  ], 'case repository contract');

  assertIncludesAll(idempotencyContract, [
    'createRepairIntakeIdempotencyRepositoryContract',
    'repository.findExistingDraftToCaseResult(lookup)',
    'repository.recordDraftToCaseResult(writerRecordInput)',
    'createWriterRecordInput(recordInput)',
    'sanitizeContractFields(input)',
  ], 'idempotency repository contract');

  for (const [label, source] of [
    ['draft repository contract', draftContract],
    ['case repository contract', caseContract],
    ['idempotency repository contract', idempotencyContract],
  ]) {
    const stripped = sourceWithoutDenyLists(source);

    assertExcludesAll(stripped, [
      /\bDATABASE_URL\b/,
      /\bprocess\.env\b/,
      /\bINSERT\s+INTO\b/i,
      /\bUPDATE\s+[a-z_]/i,
      /\bDELETE\s+FROM\b/i,
      /\bSELECT\s+.+\bFROM\b/i,
      /\.query\s*\(/,
      /\bPool\b/,
      /\bknex\b/i,
      /\bsequelize\b/i,
    ], label);
  }
});

test('audit idempotency request correlation and public output seams remain inventoried and sanitized', () => {
  const auditWriter = read('src/repairIntake/repairIntakeAuditWriterPortAdapter.js');
  const idempotencyPort = read('src/repairIntake/repairIntakeIdempotencyPortAdapter.js');
  const requestContext = read('src/repairIntake/repairIntakeDraftToCaseRequestContextResolver.js');
  const presenter = read('src/repairIntake/repairIntakeDraftToCasePublicResultPresenter.js');
  const httpMapper = read('src/repairIntake/repairIntakeDraftToCaseHttpResultMapper.js');

  assertIncludesAll(auditWriter, [
    'createRepairIntakeAuditWriterPortAdapter',
    'auditPort.recordDraftToCaseDecision',
    'createAuditInput(sanitizeValue(input))',
  ], 'audit writer port adapter');

  assertIncludesAll(idempotencyPort, [
    'createRepairIntakeIdempotencyPortAdapter',
    'idempotencyStore.findExistingDraftToCaseResult',
    'idempotencyStore.recordDraftToCaseResult',
    'createLookupInput(input)',
    'createRecordInput(input)',
  ], 'idempotency port adapter');

  assertIncludesAll(requestContext, [
    'createRepairIntakeDraftToCaseRequestContextResolver',
    'resolveRepairIntakeDraftToCaseRequestContext',
    'sanitizeRepairIntakePublicOpenRequestDto',
    'BODY_OVERRIDE_FIELD_NAMES',
  ], 'request correlation boundary');

  assertIncludesAll(presenter, [
    'presentRepairIntakeDraftToCaseResult',
    'PUBLIC_RESULTS',
    'safeScalar',
  ], 'public presenter boundary');

  assertIncludesAll(httpMapper, [
    'mapRepairIntakeDraftToCasePublicResultToHttpResponse',
    'PUBLIC_FIELD_NAMES',
    'safePublicString',
  ], 'HTTP mapper boundary');
});

test('Task2219 adds no SQL migration DB execution or audit persistence implementation markers', () => {
  const task2219Doc = read(TASK2219_DOC_PATH);
  const task2219Test = read('tests/repairIntake/repairIntakeDraftToCaseDbRuntimePortContractInventory.static.test.js');
  const task2217Doc = read(TASK2217_DOC_PATH);
  const task2218Doc = read(TASK2218_DOC_PATH);
  const boundarySource = ADMIN_AND_SYNTHETIC_BOUNDARY_PATHS
    .map((relativePath) => sourceWithoutDenyLists(read(relativePath)))
    .join('\n');

  assertExcludesAll(task2219Doc, TASK_DOC_SQL_OR_MIGRATION_PATTERNS, 'Task2219 inventory doc');
  assert.equal(task2219Test.includes('fs.readFileSync'), true);

  assertIncludesAll(task2217Doc, [
    'Future audit persistence requires a separate exact PM-authorized task.',
  ], 'Task2217 audit persistence boundary');

  assertIncludesAll(task2218Doc, [
    'Future DB/repository implementation requires a separate exact PM task.',
  ], 'Task2218 DB decision boundary');

  assertExcludesAll(boundarySource, [
    /repair_intake_audit_events/i,
    /recordAuditEventToDb/i,
    /auditRepository/i,
    /audit persistence/i,
  ], 'admin/API/controller/application/synthetic audit persistence boundary');
});

test('Task2219 inventory doc covers required seams and non-authorized future decisions', () => {
  const doc = read(TASK2219_DOC_PATH);

  assertIncludesAll(doc, [
    'admin route boundary',
    'API module / controller adapter / application service boundary',
    'injected runtime ports / runtime port factory',
    'repository contract modules',
    'audit writer port adapter boundary',
    'idempotency / request correlation boundary',
    'public presenter / HTTP mapper boundary',
    'already hardened by Task2187-Task2218',
    'pure/injected/synthetic only',
    'DB-capable but not authorized for execution by this task',
    'Future decisions are still required before DB-backed execution',
    'Source table/read model for Repair Intake draft',
    'Target Case creation tables and required fields',
    'Transaction boundary and rollback behavior',
    'Idempotency/replay behavior',
    'Organization isolation enforcement',
    'Permission and actor attribution',
    'Audit write coupling',
    'Validation and conflict handling',
    'Migration/schema/dry-run authorization',
    'Smoke/staging/prod rollout authorization',
  ], 'Task2219 inventory doc');
});
