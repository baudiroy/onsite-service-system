'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const TASK2218_DOC_PATH = 'docs/task-2218-repair-intake-draft-to-case-db-repository-transaction-boundary-decision-gate-no-runtime-change-no-db-no-smoke-no-provider.md';
const TASK2219_DOC_PATH = 'docs/task-2219-repair-intake-draft-to-case-db-runtime-port-contract-inventory-no-runtime-change-no-db-no-smoke-no-provider.md';
const TASK2219_TEST_PATH = 'tests/repairIntake/repairIntakeDraftToCaseDbRuntimePortContractInventory.static.test.js';
const TASK2220_DOC_PATH = 'docs/task-2220-repair-intake-draft-to-case-db-runtime-port-contract-static-boundary-guard-no-runtime-change-no-db-no-smoke-no-provider.md';

const BOUNDARY_SOURCE_PATHS = Object.freeze([
  'src/routes/repairIntakeDraftToCase.routes.js',
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

const CONTRACT_SOURCE_PATHS = Object.freeze([
  'src/repairIntake/repairIntakeDraftRepositoryContract.js',
  'src/repairIntake/repairIntakeCaseRepositoryContract.js',
  'src/repairIntake/repairIntakeIdempotencyRepositoryContract.js',
]);

const DB_CAPABLE_RUNTIME_FACTORY_PATH = 'src/repairIntake/repairIntakeDraftToCaseRuntimePortsFactory.js';

const DIRECT_DB_PACKAGE_PATTERNS = Object.freeze([
  /^(?:pg|postgres|node-postgres|knex|sequelize|typeorm|prisma|mysql2|sqlite3|mongodb|mongoose|redis)$/i,
]);

const REPOSITORY_IMPLEMENTATION_IMPORT_PATTERNS = Object.freeze([
  /repairIntake(?:Draft|Case|Idempotency).*Repository(?:Adapter|Consumer)?$/i,
  /repairIntakeTransactionRunnerAdapter$/i,
  /RepositoryAdapter$/i,
  /RepositoryConsumer$/i,
]);

const SQL_TRANSACTION_OR_MIGRATION_PATTERNS = Object.freeze([
  /\bDATABASE_URL\b/,
  /\bprocess\.env\b/,
  /\bSELECT\b/i,
  /\bINSERT\b/i,
  /\bUPDATE\b/i,
  /\bDELETE\s+FROM\b/i,
  /\bBEGIN\b/i,
  /\bCOMMIT\b/i,
  /\bROLLBACK\b/i,
  /\.query\s*\(/,
  /\.execute\s*\(/,
  /\.transaction\s*\(/,
  /\brunInTransaction\s*\(/,
  /\bwithTransaction\s*\(/,
  /\bmigrations?\//i,
  /\bmigration\s+(?:up|apply|latest|deploy|run|dry-run)\b/i,
  /\bdb:migrate\b/i,
]);

const AUDIT_PERSISTENCE_PATTERNS = Object.freeze([
  /repair_intake_audit_events/i,
  /recordAuditEventToDb/i,
  /auditRepository/i,
  /audit persistence implementation/i,
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

function stripConstFrozenArrayBlock(source, constName) {
  const marker = `const ${constName} = Object.freeze([`;
  const start = source.indexOf(marker);

  if (start === -1) {
    return source;
  }

  const end = source.indexOf(']);', start);

  assert.notEqual(end, -1, `unterminated frozen array ${constName}`);

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
    'UNSAFE_REQUEST_FIELD_NAMES',
  ].reduce((result, constName) => stripConstSetBlock(result, constName), source);

  const withoutArrays = [
    'UNSAFE_TEXT_MARKERS',
    'UNSAFE_TEXT_PATTERNS',
    'UNSAFE_PUBLIC_VALUE_MARKERS',
    'UNSAFE_VALUE_MARKERS',
  ].reduce((result, constName) => stripConstArrayBlock(result, constName), withoutSets);

  return [
    'UNSAFE_TEXT_PATTERNS',
  ].reduce((result, constName) => stripConstFrozenArrayBlock(result, constName), withoutArrays);
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

test('Task2220 static guard reads source and prior decision artifacts only', () => {
  for (const relativePath of [
    ...BOUNDARY_SOURCE_PATHS,
    ...CONTRACT_SOURCE_PATHS,
    DB_CAPABLE_RUNTIME_FACTORY_PATH,
    TASK2218_DOC_PATH,
    TASK2219_DOC_PATH,
    TASK2219_TEST_PATH,
    TASK2220_DOC_PATH,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('route/admin/API/controller/application/synthetic boundaries remain injected-port based', () => {
  const routeSource = read('src/routes/repairIntakeDraftToCase.routes.js');
  const apiModule = read('src/repairIntake/repairIntakeDraftToCaseApiModule.js');
  const controller = read('src/repairIntake/repairIntakeDraftToCaseController.js');
  const applicationService = read('src/repairIntake/repairIntakeDraftToCaseApplicationService.js');
  const syntheticHandler = read('src/repairIntake/repairIntakeDraftToCaseSyntheticHandler.js');
  const injectedRuntimeComposer = read('src/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposer.js');

  assertIncludesAll(routeSource, [
    'createRepairIntakeDraftToCaseInjectedRouteComposition',
    'getRepairIntakeDraftToCaseRuntimePorts',
    'requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION)',
  ], 'admin route boundary');

  assertIncludesAll(apiModule, [
    'createRepairIntakeDraftCaseControllerAdapter',
    'createSafeController(controller)',
    'registerRepairIntakeDraftToCaseRoutes',
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

test('boundary files do not import repository implementations DB packages or DB-capable runtime factory', () => {
  for (const relativePath of BOUNDARY_SOURCE_PATHS) {
    const source = read(relativePath);

    for (const specifier of requireSpecifiers(source)) {
      for (const pattern of [
        ...REPOSITORY_IMPLEMENTATION_IMPORT_PATTERNS,
        ...DIRECT_DB_PACKAGE_PATTERNS,
        /repairIntakeDraftToCaseRuntimePortsFactory$/i,
      ]) {
        assert.doesNotMatch(
          specifier,
          pattern,
          `${relativePath} must not import forbidden runtime/repository dependency ${specifier}`,
        );
      }
    }
  }
});

test('boundary files have no SQL transaction migration env or audit persistence markers', () => {
  for (const relativePath of BOUNDARY_SOURCE_PATHS) {
    const source = sourceWithoutDenyLists(read(relativePath));

    assertExcludesAll(source, SQL_TRANSACTION_OR_MIGRATION_PATTERNS, relativePath);
    assertExcludesAll(source, AUDIT_PERSISTENCE_PATTERNS, relativePath);
  }
});

test('repository contract modules remain contract seams and do not execute DB', () => {
  const expectedContracts = [
    {
      label: 'draft repository contract',
      path: 'src/repairIntake/repairIntakeDraftRepositoryContract.js',
      markers: [
        'createRepairIntakeDraftRepositoryContract',
        'repository.findDraftForConversion(lookup)',
        'sanitizeContractFields(input)',
        'failureEnvelope(',
      ],
    },
    {
      label: 'case repository contract',
      path: 'src/repairIntake/repairIntakeCaseRepositoryContract.js',
      markers: [
        'createRepairIntakeCaseRepositoryContract',
        'repository.createCaseFromDraft(creationInput)',
        'sanitizeContractFields(input)',
        'failureEnvelope(',
      ],
    },
    {
      label: 'idempotency repository contract',
      path: 'src/repairIntake/repairIntakeIdempotencyRepositoryContract.js',
      markers: [
        'createRepairIntakeIdempotencyRepositoryContract',
        'repository.findExistingDraftToCaseResult(lookup)',
        'repository.recordDraftToCaseResult(writerRecordInput)',
        'sanitizeContractFields(input)',
      ],
    },
  ];

  for (const contract of expectedContracts) {
    const source = read(contract.path);
    const stripped = sourceWithoutDenyLists(source);

    assertIncludesAll(source, contract.markers, contract.label);
    assertExcludesAll(stripped, [
      ...SQL_TRANSACTION_OR_MIGRATION_PATTERNS,
      /\bPool\b/,
      /\bknex\b/i,
      /\bsequelize\b/i,
      /\bprisma\b/i,
    ], contract.label);

    for (const specifier of requireSpecifiers(source)) {
      for (const pattern of DIRECT_DB_PACKAGE_PATTERNS) {
        assert.doesNotMatch(specifier, pattern, `${contract.label} must not import DB package ${specifier}`);
      }
    }
  }
});

test('DB-capable runtime port factory is inventoried but not imported or executed by this guard', () => {
  const source = read(DB_CAPABLE_RUNTIME_FACTORY_PATH);
  const testSource = read('tests/repairIntake/repairIntakeDraftToCaseDbRuntimePortContractBoundary.static.test.js');

  assertIncludesAll(source, [
    'function createRepairIntakeDraftToCaseRuntimePorts(options = {})',
    'assertDbClient(dbClient)',
    'createRepairIntakeDraftRepository({ dbClient })',
    'createRepairIntakeIdempotencyRepository({ dbClient })',
    'createRepairIntakeCaseRepositoryAdapter({',
    'function createConversionWriter({ dbClient, generateId: generate, now })',
    'function createAuditPort({ dbClient, generateId: generate, now })',
  ], 'DB-capable runtime port factory inventory');

  assert.equal(testSource.includes('fs.readFileSync'), true);
  assert.equal(testSource.includes(`require('../../${DB_CAPABLE_RUNTIME_FACTORY_PATH}')`), false);
});

test('Task2218 and Task2219 remain the governing decision and inventory artifacts', () => {
  const task2218 = read(TASK2218_DOC_PATH);
  const task2219 = read(TASK2219_DOC_PATH);
  const task2219Test = read(TASK2219_TEST_PATH);
  const task2220 = read(TASK2220_DOC_PATH);

  assertIncludesAll(task2218, [
    'No DB/repository transaction behavior is authorized by this task.',
    'Future DB/repository implementation requires a separate exact PM task.',
  ], 'Task2218 decision gate');

  assertIncludesAll(task2219, [
    'DB-capable but not authorized for execution by this task',
    'Future decisions are still required before DB-backed execution.',
  ], 'Task2219 inventory');

  assertIncludesAll(task2219Test, [
    'DB-capable runtime port factory is inventoried without executing it',
    'repository implementation imports are not pulled into route/admin/API/controller/application/synthetic boundaries',
  ], 'Task2219 inventory static guard');

  assertIncludesAll(task2220, [
    'static boundary guard',
    'reads source files only',
    'does not import or execute the DB-capable runtime ports factory',
    'does not authorize Task2221',
  ], 'Task2220 doc');
});
