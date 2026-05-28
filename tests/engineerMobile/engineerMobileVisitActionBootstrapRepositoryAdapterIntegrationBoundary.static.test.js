'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const INTEGRATION_TEST_FILE =
  'tests/engineerMobile/engineerMobileVisitActionBootstrapRepositoryAdapter.integration.unit.test.js';
const BOUNDARY_TEST_FILE =
  'tests/engineerMobile/engineerMobileVisitActionBootstrapRepositoryAdapterIntegrationBoundary.static.test.js';
const TASK_DOC =
  'docs/task-1850-engineer-mobile-bootstrap-repository-adapter-synthetic-db-client-integration-no-db.md';

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

function assertNoPattern(source, patterns, label) {
  for (const pattern of patterns) {
    assert.doesNotMatch(source, pattern, `${label} contains forbidden pattern ${pattern}`);
  }
}

function assertContainsAll(source, phrases, label) {
  for (const phrase of phrases) {
    assert.equal(source.includes(phrase), true, `${label} should include ${phrase}`);
  }
}

test('Task1850 allowed files exist', () => {
  for (const file of [INTEGRATION_TEST_FILE, BOUNDARY_TEST_FILE, TASK_DOC]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('Task1850 integration test imports only accepted modules and node test helpers', () => {
  const source = read(INTEGRATION_TEST_FILE);

  assert.deepEqual(requireSpecifiers(source), [
    'node:assert/strict',
    'node:test',
    '../../src/engineerMobile/engineerMobileStartTravelActionPolicy',
    '../../src/engineerMobile/engineerMobileRecordVisitResultActionPolicy',
    '../../src/engineerMobile/engineerMobileVisitActionRuntimeBootstrap',
    '../../src/engineerMobile/engineerMobileVisitActionRepositoryAdapter',
  ]);
});

test('Task1850 integration test composes bootstrap and repository adapter with synthetic execute only', () => {
  const source = read(INTEGRATION_TEST_FILE);

  assert.match(source, /createEngineerMobileVisitActionRuntimeBootstrap/);
  assert.match(source, /createEngineerMobileVisitActionRepositoryAdapter/);
  assert.match(source, /execute\(operationIntent\)/);
  assertNoPattern(source, [
    /require\(['"].*(?:pg|postgres|mysql|mysql2|knex|sequelize|prisma|typeorm|mongodb|mssql|sqlite3?)['"]\)/i,
    /require\(['"].*(?:dbClient|databaseClient|pool|connection|transaction)['"]\)/i,
    /require\(['"]node:child_process['"]\)/,
    /require\(['"]node:http['"]\)/,
    /require\(['"]node:https['"]\)/,
    /process\.env/,
    /globalThis/,
    /window\./,
    /\.query\s*\(/,
    /\.connect\s*\(/,
    /\.transaction\s*\(/,
    /\.save\s*\(/,
    /\.create\s*\(/,
    /\.update\s*\(/,
    /\.delete\s*\(/,
    /db:migrate/i,
    /\bpsql\b/i,
    /migrations?\//i,
    /CREATE\s+TABLE/i,
    /ALTER\s+TABLE/i,
    /DROP\s+TABLE/i,
    /\bSELECT\s+\*/i,
    /\bINSERT\s+INTO/i,
    /\bUPDATE\s+\w+\s+SET/i,
    /\bDELETE\s+FROM/i,
    /\bexpress\b/i,
    /\bRouter\b/,
    /routes\/index/i,
    /src\/app\.js/i,
    /src\/server\.js/i,
    /\bfetch\b/,
    /\baxios\b/i,
    /require\([\'"].*(?:line|sms|email|webhook|notification|provider)[\'"]\)/i,
    /\bsend(?:Line|Sms|Email|Webhook|Push)\b/,
    /\b(?:line|sms|email|webhook|push)Provider\b/i,
    /\bpushNotification\b/i,
    /\bai\b/i,
    /\brag\b/i,
    /\bbilling\b/i,
    /\bsettlement\b/i,
    /\badmin\b/i,
    /package\.json/i,
    /package-lock\.json/i,
    /\bseed\b/i,
    /createFieldServiceReport\s*\(/,
    /approveFieldServiceReport\s*\(/,
    /publishFieldServiceReport\s*\(/,
    /createCompletionReport\s*\(/,
    /approveCompletionReport\s*\(/,
    /publishCompletionReport\s*\(/,
    /finalAppointmentId\s*[:=]/,
  ], 'Task1850 integration test');
});

test('Task1850 integration test and doc contain no real-looking secrets or target URLs', () => {
  const combined = [
    read(INTEGRATION_TEST_FILE),
    read(TASK_DOC),
  ].join('\n');

  assertNoPattern(combined, [
    /postgres(?:ql)?:\/\//i,
    /mysql(?:2)?:\/\//i,
    /mongodb(?:\+srv)?:\/\//i,
    /mssql:\/\//i,
    /redis:\/\//i,
    /\b(?:PASSWORD|DB_PASSWORD|TOKEN|SECRET|ACCESS_TOKEN)\s*=\s*[^<\s][^\s]*/i,
    /\bDATABASE_URL\s*=\s*[^<\s][^\s]*/i,
    /(?:^|[\s"'=])sk-(?:proj-)?[A-Za-z0-9_-]{20,}/,
    /Bearer\s+[A-Za-z0-9._-]{12,}/i,
    /https?:\/\/(?:[^/\s]+\.)?(?:zeabur|supabase|railway|render|neon|rds|amazonaws)\.[^\s)]+/i,
  ], 'Task1850 touched files');
});

test('Task1850 doc records the required boundary and future sequence', () => {
  const doc = read(TASK_DOC);

  assertContainsAll(doc, [
    'Purpose: integration-style unit coverage for bootstrap to repository adapter to synthetic DB client.',
    'runtime bootstrap',
    'repository adapter',
    'repository persistence-port bridge through bootstrap',
    'integrated persistence writer through bootstrap',
    'No DB execution',
    'No SQL execution',
    'No raw SQL strings',
    'No SQL statement builder',
    'No migration',
    'No DB client import',
    'Injected synthetic DB client only',
    'No real persistence',
    'No audit log persistence',
    'No provider sending',
    'No route/global mount',
    'No Express import/listen',
    'No Completion Report / Field Service Report creation',
    'No finalAppointmentId mutation',
    'No customer-visible publication',
    'keep synthetic integration green',
    'disposable DB dry-run only after Task1840-style explicit approval',
    'real repository SQL implementation only after migration 023 dry-run acceptance',
    'global route/mount only after separate approval',
  ], 'Task1850 doc');

  for (const file of [INTEGRATION_TEST_FILE, BOUNDARY_TEST_FILE]) {
    assert.equal(doc.includes(file), true, `doc should include ${file}`);
  }
});

test('Task1850 static boundary test itself stays read-only', () => {
  const source = read(BOUNDARY_TEST_FILE);

  assert.deepEqual(requireSpecifiers(source), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
});
