'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const DOC_PATH = path.resolve(
  PROJECT_ROOT,
  'docs/task-1234-repair-intake-draft-to-case-route-readiness-gate-no-route-no-runtime-change.md',
);
const TEST_PATH = __filename;

const BASELINE_COMMITS = [
  '035f1cf Add repair intake draft-to-case injected runtime chain',
  '05661ff Document repair intake draft-to-case branch closure',
  'ac9d513 Document repair intake draft-to-case push decision gate',
];

const CHAIN_MARKERS = [
  'Repository contract/output boundary',
  'Repository consumer',
  'Application service',
  'Authorization gate',
  'Orchestrator',
  'Public result presenter',
  'Controller adapter contract',
  'Request context resolver',
  'Synthetic handler',
  'HTTP result mapper',
  'Full synthetic `{ statusCode, body }` integration',
];

const BLOCKER_MARKERS = [
  'Real auth/session/JWT context resolver is not implemented',
  'Route/controller mount is not approved',
  'Route path and HTTP method are not approved',
  'Production app/server integration is not approved',
  'DB-backed repository verification is not approved',
  'Migration or dry-run is not approved',
  'Customer-visible API contract is not approved',
  'Permission resolver must be wired to real organization isolation before route exposure',
  'Audit log strategy for the draft-to-Case route is not approved',
  'Rate limit, abuse handling, and idempotency behavior are not approved',
];

const APPROVAL_MARKERS = [
  'Exact route path',
  'Exact HTTP method',
  'Auth/session context source',
  'Permission resolver source',
  'Organization isolation enforcement',
  'Request DTO fields',
  'Response DTO fields',
  'Idempotency behavior',
  'Audit log event shape',
  'Safe-deny/error message keys',
  'DB target and migration status',
  'Smoke/integration test scope',
  'Explicit PM approval to touch route/controller/app/server files',
];

const NO_GO_MARKERS = [
  'No route registration',
  'No controller folder integration',
  'No app/server mount',
  'No Express/Fastify/Koa request/response runtime',
  'No DB execution',
  'No migration',
  'No provider sending',
  'No Admin code',
  'No AI/RAG',
  'No billing or settlement runtime',
  'No customer-visible runtime rollout',
  'No real auth/session/JWT runtime',
  'No token parsing or JWT verification',
  'No push',
];

const FORBIDDEN_TEST_RUNTIME_MARKERS = [
  'app' + '.post',
  'router' + '.post',
  'express' + '.Router',
  'listen' + '(',
  'res' + '.json',
  'process.env.DATA' + 'BASE_URL',
  'd' + 'b:migrate',
  'ps' + 'ql',
];

function readDoc() {
  return fs.readFileSync(DOC_PATH, 'utf8');
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

function testSourceWithoutGuardLists() {
  return [
    'BASELINE_COMMITS',
    'CHAIN_MARKERS',
    'BLOCKER_MARKERS',
    'APPROVAL_MARKERS',
    'NO_GO_MARKERS',
    'FORBIDDEN_TEST_RUNTIME_MARKERS',
  ].reduce((current, constName) => stripConstArrayBlock(current, constName), fs.readFileSync(TEST_PATH, 'utf8'));
}

test('Task1234 route readiness gate files exist', () => {
  assert.equal(fs.existsSync(DOC_PATH), true, 'Task1234 route readiness doc should exist');
  assert.equal(fs.existsSync(TEST_PATH), true, 'Task1234 static guard should exist');
});

test('Task1234 doc records current committed baseline', () => {
  const doc = readDoc();

  for (const marker of BASELINE_COMMITS) {
    assert.equal(doc.includes(marker), true, `doc missing baseline commit ${marker}`);
  }
});

test('Task1234 doc records non-HTTP chain, blockers, and approval checklist', () => {
  const doc = readDoc();

  for (const marker of [...CHAIN_MARKERS, ...BLOCKER_MARKERS, ...APPROVAL_MARKERS]) {
    assert.equal(doc.includes(marker), true, `doc missing marker ${marker}`);
  }
});

test('Task1234 doc records route no-go boundaries and future task shape', () => {
  const doc = readDoc();

  for (const marker of [
    ...NO_GO_MARKERS,
    'Use an injected route adapter only',
    'Do not access repositories directly from the route layer',
    'Call the existing path in order: context resolver to synthetic handler to HTTP mapper',
    'Do not bypass the authorization gate',
  ]) {
    assert.equal(doc.includes(marker), true, `doc missing no-go or future-shape marker ${marker}`);
  }
});

test('Task1234 only adds the route readiness doc and static guard path', () => {
  const allowedPaths = [
    'docs/task-1234-repair-intake-draft-to-case-route-readiness-gate-no-route-no-runtime-change.md',
    'tests/repairIntake/repairIntakeDraftToCaseRouteReadinessGate.static.test.js',
  ];

  for (const allowedPath of allowedPaths) {
    assert.equal(
      fs.existsSync(path.resolve(PROJECT_ROOT, allowedPath)),
      true,
      `expected Task1234 file missing: ${allowedPath}`,
    );
  }
});

test('Task1234 static guard source does not execute route or runtime markers', () => {
  const source = testSourceWithoutGuardLists();

  for (const marker of FORBIDDEN_TEST_RUNTIME_MARKERS) {
    assert.equal(source.includes(marker), false, `static guard source contains runtime marker ${marker}`);
  }
});
