'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const taskDocPath =
  'docs/task-1840-engineer-mobile-migration-023-disposable-db-dry-run-authorization-packet-no-db-execution.md';
const migrationPath = 'migrations/023_engineer_mobile_visit_action_persistence_fields.sql';

function absolutePath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(absolutePath(relativePath), 'utf8');
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

test('Task1840 doc exists and references migration 023 exactly', () => {
  assert.equal(fs.existsSync(absolutePath(taskDocPath)), true, `${taskDocPath} should exist`);

  const doc = read(taskDocPath);
  assert.match(doc, new RegExp(migrationPath.replace(/\./g, '\\.')));
});

test('Task1840 doc states authorization packet only and forbids execution in this task', () => {
  const doc = read(taskDocPath);

  assertContainsAll(doc, [
    /Task1840 is authorization-packet-only/,
    /No DB execution in Task1840/,
    /No migration dry-run in Task1840/,
    /No migration apply in Task1840/,
    /No SQL execution in Task1840/,
    /No psql in Task1840/,
    /No npm run db:migrate in Task1840/,
    /No DATABASE_URL printing in Task1840/,
  ], 'Task1840 no-execution boundary');
});

test('Task1840 doc forbids shared Zeabur staging production and runtime DB targets', () => {
  const doc = read(taskDocPath);

  assertContainsAll(doc, [
    /No shared Zeabur \/ staging \/ production target/,
    /Future dry-run must not use shared runtime DB/,
    /shared runtime, Zeabur, staging, production, or any persistent customer\/org data DB/,
  ], 'Task1840 target boundary');
});

test('Task1840 doc requires future explicit approval naming disposable local or test DB only', () => {
  const doc = read(taskDocPath);

  assertContainsAll(doc, [
    /future dry-run may proceed only after explicit approval naming a disposable local\/test DB only/i,
    /I approve a disposable local\/test DB dry-run of migration 023 only/,
    /Do not use shared Zeabur, staging, or production/,
    /Do not print DATABASE_URL or credentials/,
    /Do not send providers/,
    /Stop on any destructive SQL/,
  ], 'Task1840 explicit approval phrase');
});

test('Task1840 doc lists generic phrases as insufficient', () => {
  const doc = read(taskDocPath);

  assertContainsAll(doc, [
    /Generic phrases are insufficient authorization/,
    /ok/,
    /go ahead/,
    /run it/,
    /approved/,
    /do it/,
    /continue/,
    /可以/,
    /繼續/,
    /請繼續/,
    /下一步/,
  ], 'Task1840 generic phrase boundary');
});

test('Task1840 doc forbids credential or DB URL printing and provider sending', () => {
  const doc = read(taskDocPath);

  assertContainsAll(doc, [
    /Future dry-run must not print credentials or DB URLs/,
    /Future dry-run must not send providers/,
    /DATABASE_URL, passwords, tokens, secrets, connection strings, or credentials/,
    /The placeholder `<DISPOSABLE_LOCAL_TEST_DB_URL>` is documentation-only/,
  ], 'Task1840 credential and provider boundary');
});

test('Task1840 doc forbids completion report field service report and finalAppointmentId mutation', () => {
  const doc = read(taskDocPath);

  assertContainsAll(doc, [
    /Future dry-run must not create Completion Report \/ Field Service Report/,
    /Future dry-run must not mutate finalAppointmentId/,
    /One Case ultimately has only one formal Field Service Report/,
    /`field_service_reports.case_id` uniqueness remains untouched/,
    /This task cannot create a second formal Field Service Report/,
    /`finalAppointmentId` remains system-owned\/admin override only/,
    /`finalAppointmentId` must not be exposed, inferred, selected, or mutated/,
  ], 'Task1840 completion and finalAppointmentId boundary');
});

test('Task1840 doc includes example-only placeholder command envelope', () => {
  const doc = read(taskDocPath);

  assertContainsAll(doc, [
    /Example-Only Command Envelope/,
    /example-only command envelope and is not executed in Task1840/,
    /DATABASE_URL=<DISPOSABLE_LOCAL_TEST_DB_URL>/,
    /<DRY_RUN_TOOL>/,
    /--migration migrations\/023_engineer_mobile_visit_action_persistence_fields\.sql --dry-run/,
  ], 'Task1840 example-only command envelope');
});

test('Task1840 doc contains stop conditions for unsafe future dry-run attempts', () => {
  const doc = read(taskDocPath);

  assertContainsAll(doc, [
    /Stop before any DB-adjacent command/,
    /explicit approval is missing/,
    /approval does not name disposable local\/test DB/,
    /approval does not name migration 023/,
    /approval does not say dry-run only/,
    /approval does not forbid credential printing/,
    /the command would apply rather than dry-run/,
    /unexpected destructive SQL appears/,
  ], 'Task1840 stop conditions');
});

test('Task1840 doc contains no real-looking DB URL or assigned credentials', () => {
  const doc = read(taskDocPath);

  assertNoPattern(doc, [
    /postgres(?:ql)?:\/\//i,
    /mysql(?:2)?:\/\//i,
    /mongodb(?:\+srv)?:\/\//i,
    /mssql:\/\//i,
    /redis:\/\//i,
    /\b(?:PASSWORD|DB_PASSWORD|TOKEN|SECRET|ACCESS_TOKEN)\s*=\s*[^<\s][^\s]*/i,
    /\bDATABASE_URL\s*=\s*[^<\s][^\s]*/i,
    /(?:^|[\s"'=])sk-(?:proj-)?[A-Za-z0-9_-]{20,}/,
    /Bearer\s+[A-Za-z0-9._-]{12,}/i,
  ], 'Task1840 doc');
});

test('Task1840 static test itself does not import DB clients, execute SQL, or call migration scripts', () => {
  const source = read('tests/engineerMobile/engineerMobileMigration023DryRunAuthorization.static.test.js');
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
