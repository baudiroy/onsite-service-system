'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const taskDocPath =
  'docs/task-1784-engineer-mobile-read-model-migration-022-dry-run-authorization-packet-no-db-execution.md';
const migrationPath = 'migrations/022_create_engineer_mobile_read_model.sql';

const inspectedReadOnlyFiles = [
  migrationPath,
  'docs/task-1782-engineer-mobile-read-model-migration-022-static-readiness-guard-no-db-no-apply.md',
  'docs/task-1778-engineer-mobile-read-model-path-decision-guard-no-db-no-migration.md',
];

function absolutePath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(absolutePath(relativePath), 'utf8');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function assertContainsAll(source, patterns, label) {
  for (const pattern of patterns) {
    assert.match(source, pattern, `${label} is missing ${pattern}`);
  }
}

function assertNoPattern(source, patterns, label) {
  for (const pattern of patterns) {
    assert.doesNotMatch(source, pattern, `${label} contains forbidden pattern ${pattern}`);
  }
}

test('Task1784 doc and read-only inspected files exist', () => {
  assert.equal(fs.existsSync(absolutePath(taskDocPath)), true, `${taskDocPath} should exist`);

  for (const file of inspectedReadOnlyFiles) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('Task1784 doc references migration 022 exactly and records read-only inspection', () => {
  const doc = read(taskDocPath);

  assert.match(
    doc,
    new RegExp(escapeRegExp(migrationPath)),
    'Task1784 doc should reference migration 022 exactly',
  );

  for (const file of inspectedReadOnlyFiles) {
    assert.match(doc, new RegExp(escapeRegExp(file)), `Task1784 doc should list ${file}`);
  }
});

test('Task1784 doc says this task performs no DB execution or migration action', () => {
  const doc = read(taskDocPath);

  assertContainsAll(doc, [
    /No DB execution is authorized by Task1784/,
    /No migration dry-run is authorized by Task1784/,
    /No migration apply is authorized by Task1784/,
    /No real DB connection is authorized by Task1784/,
    /No SQL execution, `psql`, `db:migrate`, DDL, schema\/index change, or shared runtime smoke is authorized by Task1784/,
    /Migration 022 is not assumed applied anywhere/,
  ], 'Task1784 no execution boundary');
});

test('Task1784 doc requires disposable local or test DB for any future dry-run', () => {
  const doc = read(taskDocPath);

  assertContainsAll(doc, [
    /future dry-run may proceed only if every condition below is explicitly true/,
    /target is a disposable local\/test DB only/,
    /target is not shared, staging, production, Zeabur, or any persistent customer\/org data DB/,
    /No migration apply to shared, staging, production, Zeabur, or any persistent customer\/org data DB/,
  ], 'Task1784 disposable dry-run boundary');
});

test('Task1784 doc forbids DB URL and credential printing', () => {
  const doc = read(taskDocPath);

  assertContainsAll(doc, [
    /DB URL \/ credentials must never be printed/,
    /DB URL, password, token, secret, connection string, or credential would be printed/,
    /no credential printing/,
    /must still not print a real DB URL or credential/,
  ], 'Task1784 credential safety boundary');
});

test('Task1784 doc requires explicit approval naming migration 022 and dry-run', () => {
  const doc = read(taskDocPath);

  assertContainsAll(doc, [
    /Generic approval phrases are insufficient/,
    /disposable DB/,
    /migration 022/,
    /dry-run allowed/,
    /no credential printing/,
  ], 'Task1784 explicit approval phrase elements');
});

test('Task1784 doc lists stop conditions before DB-adjacent commands', () => {
  const doc = read(taskDocPath);

  assertContainsAll(doc, [
    /Stop before any DB-adjacent command/,
    /explicit approval is missing/,
    /approval does not name disposable DB/,
    /approval does not name migration 022/,
    /approval does not say dry-run allowed/,
    /approval does not forbid credential printing/,
    /`DATABASE_URL` points to shared, staging, production, Zeabur, or any persistent customer\/org data DB/,
    /the migration target differs from `migrations\/022_create_engineer_mobile_read_model\.sql`/,
    /the command would apply beyond a disposable local\/test DB/,
  ], 'Task1784 stop conditions');
});

test('Task1784 doc contains placeholder-only command examples', () => {
  const doc = read(taskDocPath);

  assertContainsAll(doc, [
    /Placeholder-Only Future Command Examples/,
    /DATABASE_URL=<DISPOSABLE_LOCAL_TEST_DATABASE_URL>/,
    /<DRY_RUN_TOOL>/,
    /--migration migrations\/022_create_engineer_mobile_read_model\.sql --dry-run/,
    /<VERIFY_TOOL>/,
    /<DISPOSABLE_LOCAL_TEST_DB_ALIAS>/,
    /documentation placeholders only/,
  ], 'Task1784 placeholder examples');
});

test('Task1784 doc contains no real-looking DB URLs or assigned credentials', () => {
  const doc = read(taskDocPath);

  assertNoPattern(doc, [
    /postgres(?:ql)?:\/\//i,
    /mysql(?:2)?:\/\//i,
    /mongodb(?:\+srv)?:\/\//i,
    /mssql:\/\//i,
    /redis:\/\//i,
    /\b(?:PASSWORD|DB_PASSWORD|TOKEN|SECRET|ACCESS_TOKEN)\s*=\s*[^<\s][^\s]*/i,
    /\bDATABASE_URL\s*=\s*[^<\s][^\s]*/i,
  ], 'Task1784 doc');
});

test('Task1784 doc preserves core FSR and finalAppointmentId boundaries', () => {
  const doc = read(taskDocPath);

  assertContainsAll(doc, [
    /One Case \/ one formal FSR boundary remains untouched/,
    /`field_service_reports\.case_id` uniqueness remains untouched/,
    /This task cannot create a second formal Field Service Report/,
    /`finalAppointmentId` remains system-owned\/admin override only/,
    /must not be exposed, inferred, selected, or mutated/,
  ], 'Task1784 core boundary');
});

test('Task1784 static test itself does not import DB clients, execute SQL, or run migrations', () => {
  const source = read('tests/engineerMobile/engineerMobileReadModelMigration022DryRunAuthorization.static.test.js');
  const specifiers = Array.from(source.matchAll(/require\(['"]([^'"]+)['"]\)/g)).map((match) => match[1]);

  const forbiddenSpecifiers = [
    /^child_process$/,
    /^(?:pg|postgres|postgresql|mysql|mysql2|knex|sequelize|prisma|typeorm|mongodb|mssql|sqlite3?)$/i,
    /(?:^|[/.-])(?:dbClient|databaseClient|pool|connection|transaction)(?:$|[/.-])/i,
    /(?:^|[/.-])migrations?(?:$|[/.-])/i,
  ];

  for (const specifier of specifiers) {
    for (const pattern of forbiddenSpecifiers) {
      assert.equal(pattern.test(specifier), false, `static test imports forbidden specifier ${specifier}`);
    }
  }

  assert.deepEqual(specifiers.sort(), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
});
