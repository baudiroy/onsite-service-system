'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const DOC_PATH = path.resolve(
  __dirname,
  '../../docs/task-1261-repair-intake-draft-to-case-route-path-method-decision-gate-no-runtime-change.md',
);

const TASK1261_FILES = [
  'docs/task-1261-repair-intake-draft-to-case-route-path-method-decision-gate-no-runtime-change.md',
  'tests/repairIntake/repairIntakeDraftToCaseRoutePathMethodDecisionGate.static.test.js',
];

const FORBIDDEN_TASK1261_PATH_PREFIXES = [
  'src/app.js',
  'src/server.js',
  'src/routes/',
  'src/controllers/',
  'src/db/',
  'migrations/',
  'admin/',
  'package.json',
  'package-lock.json',
];

function readDoc() {
  return fs.readFileSync(DOC_PATH, 'utf8');
}

test('Task1261 decision gate doc exists', () => {
  assert.equal(fs.existsSync(DOC_PATH), true);
});

test('Task1261 doc records exact proposed method and path', () => {
  const doc = readDoc();

  assert.equal(
    doc.includes('POST /internal/repair-intake/drafts/:repairIntakeDraftId/submit-to-case'),
    true,
  );
});

test('Task1261 doc records current latest commit and non-mounted chain', () => {
  const doc = readDoc();

  for (const marker of [
    '23e54b9 Add repair intake draft-to-case route adapter composition test',
    'route adapter contract',
    'pre-route handler factory',
    'context resolver',
    'idempotency policy builder',
    'audit intent builder',
    'synthetic handler',
    'HTTP result mapper',
    'repository / application / orchestrator stack',
  ]) {
    assert.equal(doc.includes(marker), true, `missing ${marker}`);
  }
});

test('Task1261 doc records rationale and future approval requirements', () => {
  const doc = readDoc();

  for (const marker of [
    'internal',
    'not customer-facing',
    'formal Case creation starts from a Repair Intake draft',
    'state-changing action',
    'does not implement path parsing',
    'real auth/session context source injection',
    'real permission resolver enforcing organization isolation',
    'path `repairIntakeDraftId` reconciliation with body value, or body value forbidden',
    'idempotency header source',
    'request ID header source',
    'audit persistence source',
    'DB-backed repository verification',
    'smoke scope',
  ]) {
    assert.equal(doc.includes(marker), true, `missing ${marker}`);
  }
});

test('Task1261 doc contains no-go list', () => {
  const doc = readDoc();

  for (const marker of [
    'no route file creation',
    'no controller file creation',
    'no app/server mount',
    'no Express/Fastify/Koa request/response object',
    'no DB/cache/audit persistence',
    'no provider/AI/billing/customer-visible runtime',
    'no auth/JWT/token parsing',
    'no `src/app.js` modification',
    'no `src/server.js` modification',
    'no `src/routes/**` modification',
    'no `src/controllers/**` modification',
    'no `src/db/**` modification',
    'no `migrations/**` modification',
    'no `admin/**` modification',
    'no `package.json` or `package-lock.json` modification',
  ]) {
    assert.equal(doc.includes(marker), true, `missing ${marker}`);
  }
});

test('Task1261 allowlist does not add or modify forbidden runtime path families', () => {
  for (const filePath of TASK1261_FILES) {
    for (const forbiddenPrefix of FORBIDDEN_TASK1261_PATH_PREFIXES) {
      assert.equal(
        filePath === forbiddenPrefix || filePath.startsWith(forbiddenPrefix),
        false,
        `${filePath} is outside Task1261 docs/static allowlist`,
      );
    }
  }
});
