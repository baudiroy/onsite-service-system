'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const CHECKPOINT_DOC_PATH = path.resolve(
  __dirname,
  '../../docs/task-1219-repair-intake-draft-to-case-runtime-branch-checkpoint-no-runtime-change.md',
);

const TASK_SOURCE_PATHS = [
  '../../src/repairIntake/repairIntakeCaseRepositoryConsumer.js',
  '../../src/repairIntake/repairIntakeDraftToCaseApplicationService.js',
  '../../src/repairIntake/repairIntakeDraftToCaseAuthorizationGate.js',
  '../../src/repairIntake/repairIntakeDraftToCaseOrchestrator.js',
  '../../src/repairIntake/repairIntakeDraftToCasePublicResultPresenter.js',
  '../../src/repairIntake/repairIntakeDraftToCaseControllerAdapter.js',
];

const TASK_TEST_PATHS = [
  './repairIntakeCaseRepositoryConsumer.unit.test.js',
  './repairIntakeCaseRepositoryConsumerBoundary.static.test.js',
  './repairIntakeDraftToCaseApplicationService.unit.test.js',
  './repairIntakeDraftToCaseApplicationServiceBoundary.static.test.js',
  './repairIntakeDraftToCaseAuthorizationGate.unit.test.js',
  './repairIntakeDraftToCaseAuthorizationGateBoundary.static.test.js',
  './repairIntakeDraftToCaseOrchestrator.unit.test.js',
  './repairIntakeDraftToCaseOrchestratorBoundary.static.test.js',
  './repairIntakeDraftToCaseOrchestratorContractIntegration.unit.test.js',
  './repairIntakeDraftToCasePublicResultPresenter.unit.test.js',
  './repairIntakeDraftToCasePublicResultPresenterBoundary.static.test.js',
  './repairIntakeDraftToCaseControllerAdapter.unit.test.js',
  './repairIntakeDraftToCaseControllerAdapterBoundary.static.test.js',
  './repairIntakeDraftToCaseFullSyntheticAdapterIntegration.unit.test.js',
];

const TASK_DOC_PATHS = [
  '../../docs/task-1211-repair-intake-case-repository-consumer-injected-repository-only-no-db-no-route.md',
  '../../docs/task-1212-repair-intake-draft-to-case-application-service-injected-consumer-only-no-db-no-route.md',
  '../../docs/task-1213-repair-intake-draft-to-case-authorization-gate-injected-permission-resolver-only-no-db-no-route.md',
  '../../docs/task-1214-repair-intake-draft-to-case-orchestrator-injected-authorization-gate-application-service-no-db-no-route.md',
  '../../docs/task-1215-repair-intake-draft-to-case-orchestrator-contract-integration-synthetic-chain-no-db-no-route.md',
  '../../docs/task-1216-repair-intake-draft-to-case-public-result-presenter-pure-mapper-no-route-no-customer-runtime.md',
  '../../docs/task-1217-repair-intake-draft-to-case-controller-adapter-contract-injected-orchestrator-presenter-no-route-no-app-mount.md',
  '../../docs/task-1218-repair-intake-draft-to-case-full-synthetic-adapter-integration-no-route-no-http.md',
  '../../docs/task-1219-repair-intake-draft-to-case-runtime-branch-checkpoint-no-runtime-change.md',
];

const FORBIDDEN_IMPORT_MARKERS = [
  "require('../app')",
  "require('../server')",
  "require('../routes')",
  "require('../controllers')",
  "require('../d" + "b",
  "require('../repositories')",
  "require('../providers')",
  "require('../admin')",
  'src/app',
  'src/server',
  'src/routes',
  'src/controllers',
  'src/d' + 'b',
  'migrations/',
  'admin/',
  'openai',
  'RAG',
  'billing',
  'settlement',
];

const HARD_FORBIDDEN_RUNTIME_MARKERS = [
  'process.env.DATA' + 'BASE_URL',
  'd' + 'b:migrate',
  'ps' + 'ql',
  'listen(',
  'app.post',
  'router.post',
  'express.Router',
  'res.json',
  '/repair-intake',
  '/cases',
];

function resolveProjectPath(relativePath) {
  return path.resolve(__dirname, relativePath);
}

function readProjectFile(relativePath) {
  return fs.readFileSync(resolveProjectPath(relativePath), 'utf8');
}

function stripConstArrayBlock(source, constName) {
  const marker = `const ${constName} = [`;
  const start = source.indexOf(marker);

  if (start === -1) {
    return source;
  }

  const end = source.indexOf('];', start);

  if (end === -1) {
    return source;
  }

  return `${source.slice(0, start)}${source.slice(end + 2)}`;
}

function sourceWithoutGuardLists(source) {
  return [
    'FORBIDDEN_MARKERS',
    'FORBIDDEN_IMPORT_MARKERS',
    'HARD_FORBIDDEN_RUNTIME_MARKERS',
    'FORBIDDEN_POLICY_BYPASS_MARKERS',
  ].reduce((current, constName) => stripConstArrayBlock(current, constName), source);
}

test('Task1211 through Task1219 expected files exist', () => {
  for (const relativePath of [...TASK_SOURCE_PATHS, ...TASK_TEST_PATHS, ...TASK_DOC_PATHS]) {
    assert.equal(fs.existsSync(resolveProjectPath(relativePath)), true, `missing ${relativePath}`);
  }
});

test('Task1211 through Task1218 source files avoid forbidden runtime imports', () => {
  for (const relativePath of TASK_SOURCE_PATHS) {
    const source = sourceWithoutGuardLists(readProjectFile(relativePath));

    for (const marker of FORBIDDEN_IMPORT_MARKERS) {
      assert.equal(source.includes(marker), false, `${relativePath} contains forbidden import marker ${marker}`);
    }
  }
});

test('Task1211 through Task1218 source files avoid route DB provider and app/server runtime strings', () => {
  for (const relativePath of TASK_SOURCE_PATHS) {
    const source = sourceWithoutGuardLists(readProjectFile(relativePath));

    for (const marker of HARD_FORBIDDEN_RUNTIME_MARKERS) {
      assert.equal(source.includes(marker), false, `${relativePath} contains forbidden runtime marker ${marker}`);
    }
  }
});

test('Task1211 through Task1218 tests and docs avoid hard runtime execution markers', () => {
  for (const relativePath of [...TASK_TEST_PATHS, ...TASK_DOC_PATHS]) {
    const source = sourceWithoutGuardLists(readProjectFile(relativePath));

    for (const marker of [
      'process.env.DATA' + 'BASE_URL',
      'app.post',
      'router.post',
      'express.Router',
      'res.json',
      '/repair-intake',
      '/cases',
    ]) {
      assert.equal(source.includes(marker), false, `${relativePath} contains hard runtime marker ${marker}`);
    }
  }
});

test('checkpoint doc records accepted range, implemented chain, non-goals, and future options', () => {
  const doc = fs.readFileSync(CHECKPOINT_DOC_PATH, 'utf8');

  for (const marker of [
    'Task1211: repository consumer',
    'Task1212: application service',
    'Task1213: authorization gate',
    'Task1214: orchestrator',
    'Task1215: synthetic orchestrator integration',
    'Task1216: public result presenter',
    'Task1217: controller adapter contract',
    'Task1218: full synthetic adapter integration',
    'Synthetic request -> controller adapter contract -> orchestrator -> authorization gate -> application service -> repository consumer -> repository contract boundary -> presenter -> safe public-shaped result',
    'No route registration',
    'No controller folder integration',
    'No app/server mount',
    'No Express/Fastify/Koa request/response object',
    'No DB execution',
    'No migration',
    'No provider sending',
    'No Admin runtime',
    'No AI/RAG runtime',
    'No billing or settlement runtime',
    'No customer-visible runtime rollout',
    'No real auth/session/JWT runtime',
    'Route-readiness decision packet',
    'Injected HTTP adapter plan',
    'Auth/session context resolver design',
  ]) {
    assert.equal(doc.includes(marker), true, `checkpoint doc missing marker ${marker}`);
  }
});
