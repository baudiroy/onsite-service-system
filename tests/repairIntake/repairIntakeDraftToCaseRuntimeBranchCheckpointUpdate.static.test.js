'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const CHECKPOINT_DOC_PATH = path.resolve(
  __dirname,
  '../../docs/task-1225-repair-intake-draft-to-case-runtime-branch-checkpoint-update-task1220-1224-no-runtime-change.md',
);

const TASK_SOURCE_PATHS = [
  '../../src/repairIntake/repairIntakeDraftToCaseRequestContextResolver.js',
  '../../src/repairIntake/repairIntakeDraftToCaseSyntheticHandler.js',
  '../../src/repairIntake/repairIntakeDraftToCaseHttpResultMapper.js',
];

const TASK_TEST_PATHS = [
  './repairIntakeDraftToCaseRequestContextResolver.unit.test.js',
  './repairIntakeDraftToCaseRequestContextResolverBoundary.static.test.js',
  './repairIntakeDraftToCaseSyntheticHandler.unit.test.js',
  './repairIntakeDraftToCaseSyntheticHandlerBoundary.static.test.js',
  './repairIntakeDraftToCaseFullSyntheticHandlerIntegration.unit.test.js',
  './repairIntakeDraftToCaseHttpResultMapper.unit.test.js',
  './repairIntakeDraftToCaseHttpResultMapperBoundary.static.test.js',
  './repairIntakeDraftToCaseFullSyntheticHttpEnvelopeIntegration.unit.test.js',
];

const TASK_DOC_PATHS = [
  '../../docs/task-1220-repair-intake-draft-to-case-request-context-resolver-injected-session-context-only-no-db-no-route.md',
  '../../docs/task-1221-repair-intake-draft-to-case-synthetic-handler-context-resolver-controller-adapter-no-route-no-http.md',
  '../../docs/task-1222-repair-intake-draft-to-case-full-synthetic-handler-integration-no-route-no-http.md',
  '../../docs/task-1223-repair-intake-draft-to-case-http-result-mapper-pure-response-envelope-no-route-no-http-framework.md',
  '../../docs/task-1224-repair-intake-draft-to-case-full-synthetic-http-envelope-integration-no-route-no-http-framework.md',
  '../../docs/task-1225-repair-intake-draft-to-case-runtime-branch-checkpoint-update-task1220-1224-no-runtime-change.md',
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
  "require('../../src/app')",
  "require('../../src/server')",
  "require('../../src/routes')",
  "require('../../src/controllers')",
  "require('../../src/d" + "b",
  "require('../../src/providers')",
  "require('../../admin')",
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
  'jsonwebtoken',
  'passport',
  'jwks',
  'jose',
  'auth0',
  'express()',
  'fastify',
  'koa',
];

const HARD_FORBIDDEN_RUNTIME_MARKERS = [
  'process.env.DATA' + 'BASE_URL',
  'd' + 'b:migrate',
  'ps' + 'ql',
  'listen(',
  'app.post',
  'router.post',
  'express.Router',
  'req.',
  'res.',
  'res.json',
  '/repair-intake',
  '/cases',
  'sendSms',
  'sendLine',
  'token parsing',
  'JWT verification',
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
    'UNSAFE_FIELD_NAMES',
    'UNSAFE_VALUE_MARKERS',
    'PUBLIC_FIELD_NAMES',
    'STATUS_CODE_BY_STATUS',
  ].reduce((current, constName) => stripConstArrayBlock(current, constName), source);
}

function docWithoutAllowedNonGoals(source) {
  return source
    .split('\n')
    .filter((line) => !line.includes('No token parsing') && !line.includes('No JWT verification'))
    .join('\n');
}

function stripInlineMarkerAssertions(source) {
  return source.replace(
    /for \(const marker of \[[\s\S]*?\]\) \{\n\s*assert\.equal\(source\.includes\(marker\), false,[\s\S]*?\n\s*\}/g,
    '',
  );
}

function safeBodyForRuntimeScan(relativePath) {
  let source = sourceWithoutGuardLists(readProjectFile(relativePath));

  if (relativePath.endsWith('Boundary.static.test.js')) {
    source = stripInlineMarkerAssertions(source);
  }

  if (relativePath.startsWith('../../docs/')) {
    return docWithoutAllowedNonGoals(source);
  }

  return source;
}

function requireSpecifiers(source) {
  return Array.from(source.matchAll(/require\((['"])([^'"]+)\1\)/g))
    .map((match) => match[2]);
}

test('Task1220 through Task1225 expected files exist', () => {
  for (const relativePath of [...TASK_SOURCE_PATHS, ...TASK_TEST_PATHS, ...TASK_DOC_PATHS]) {
    assert.equal(fs.existsSync(resolveProjectPath(relativePath)), true, `missing ${relativePath}`);
  }
});

test('Task1220 through Task1224 source files avoid forbidden runtime imports and frameworks', () => {
  for (const relativePath of TASK_SOURCE_PATHS) {
    const source = sourceWithoutGuardLists(readProjectFile(relativePath));

    assert.deepEqual(requireSpecifiers(source), [], `${relativePath} should stay dependency-free`);

    for (const marker of FORBIDDEN_IMPORT_MARKERS) {
      assert.equal(source.includes(marker), false, `${relativePath} contains forbidden import marker ${marker}`);
    }
  }
});

test('Task1220 through Task1224 source files avoid route DB provider auth and app/server runtime markers', () => {
  for (const relativePath of TASK_SOURCE_PATHS) {
    const source = sourceWithoutGuardLists(readProjectFile(relativePath));

    for (const marker of HARD_FORBIDDEN_RUNTIME_MARKERS) {
      assert.equal(source.includes(marker), false, `${relativePath} contains forbidden runtime marker ${marker}`);
    }
  }
});

test('Task1220 through Task1224 tests and docs avoid hard runtime execution markers outside guard lists and non-goals', () => {
  for (const relativePath of [...TASK_TEST_PATHS, ...TASK_DOC_PATHS]) {
    const source = safeBodyForRuntimeScan(relativePath);

    for (const marker of [
      'process.env.DATA' + 'BASE_URL',
      'app.post',
      'router.post',
      'express.Router',
      'req.',
      'res.',
      'res.json',
      '/repair-intake',
      '/cases',
      'sendSms',
      'sendLine',
    ]) {
      assert.equal(source.includes(marker), false, `${relativePath} contains hard runtime marker ${marker}`);
    }
  }
});

test('providerPayload appears only as an unsafe-field stripping example in tests or docs', () => {
  for (const relativePath of [...TASK_SOURCE_PATHS, ...TASK_TEST_PATHS, ...TASK_DOC_PATHS]) {
    const source = sourceWithoutGuardLists(readProjectFile(relativePath));

    if (!source.includes('providerPayload')) {
      continue;
    }

    assert.equal(
      relativePath.startsWith('./') || relativePath.startsWith('../../docs/'),
      true,
      `${relativePath} should not keep providerPayload outside tests/docs examples`,
    );
  }
});

test('checkpoint doc records Task1220-Task1224 range, chain, non-goals, and future options', () => {
  const doc = fs.readFileSync(CHECKPOINT_DOC_PATH, 'utf8');

  for (const marker of [
    'Task1220: request context resolver',
    'Task1221: synthetic handler',
    'Task1222: full synthetic handler integration',
    'Task1223: HTTP result mapper',
    'Task1224: full synthetic HTTP-envelope integration',
    'synthetic session/body/source input',
    '-> request context resolver',
    '-> synthetic handler',
    '-> controller adapter contract',
    '-> orchestrator',
    '-> authorization gate',
    '-> application service',
    '-> repository consumer',
    '-> repository contract boundary',
    '-> presenter',
    '-> HTTP result mapper',
    '-> { statusCode, body }',
    'Session-derived `organizationId` and `actorId` win over body override attempts',
    'No route registration',
    'No controller folder integration',
    'No Express/Fastify/Koa request/response object',
    'No app/server mount',
    'No DB execution',
    'No migration',
    'No provider sending',
    'No Admin runtime',
    'No AI/RAG runtime',
    'No billing or settlement runtime',
    'No customer-visible runtime rollout',
    'No real auth/session/JWT runtime',
    'No token parsing/JWT verification',
    'Route-readiness decision packet',
    'Injected route adapter plan',
    'Real auth/session context resolver design',
    'DB-backed repository dry-run only after separate explicit approval',
    'Route/controller mount only after separate PM approval',
    'Staging/commit packaging only after explicit PM approval',
  ]) {
    assert.equal(doc.includes(marker), true, `checkpoint doc missing marker ${marker}`);
  }
});
