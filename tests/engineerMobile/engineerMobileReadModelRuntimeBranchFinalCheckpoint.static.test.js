'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const taskDocPath =
  'docs/task-1786-engineer-mobile-read-model-runtime-branch-final-checkpoint-no-runtime-change.md';

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

test('Task1786 final checkpoint doc exists', () => {
  assert.equal(fs.existsSync(absolutePath(taskDocPath)), true, `${taskDocPath} should exist`);
});

test('Task1786 doc records Task1735 through Task1785 accepted range', () => {
  const doc = read(taskDocPath);

  assertContainsAll(doc, [
    /Task1735 through Task1785/,
    /Tasks1735-1785/,
    /Engineer Mobile read-only plus DB-adjacent read-model branch checkpoint range/,
  ], 'accepted task range');
});

test('Task1786 doc records current runtime capability list', () => {
  const doc = read(taskDocPath);

  assertContainsAll(doc, [
    /assigned appointments list handler/,
    /assigned appointment detail handler/,
    /injected-only HTTP adapter/,
    /Workbench read-only module/,
    /request context resolver/,
    /repository guard/,
    /safe projection normalizer/,
    /safe envelope normalizer/,
    /SQL query builder/,
    /DB repository adapter with injected query executor/,
    /DB row mapper/,
    /query executor guard/,
    /synthetic HTTP acceptance path/,
  ], 'runtime capability list');
});

test('Task1786 doc records DB status with no execution or apply', () => {
  const doc = read(taskDocPath);

  assertContainsAll(doc, [
    /Current DB status/,
    /no real DB connection/,
    /no real SQL execution/,
    /no migration apply/,
    /migration 022 not assumed applied/,
    /dry-run packet exists but does not authorize execution/,
  ], 'DB status');
});

test('Task1786 doc records injected-only route status', () => {
  const doc = read(taskDocPath);

  assertContainsAll(doc, [
    /Current route status/,
    /no global route mount/,
    /no `src\/app\.js`/,
    /no `src\/server\.js`/,
    /no `src\/routes\/\*\*`/,
    /injected-only \/ synthetic route testing only/,
  ], 'route status');
});

test('Task1786 doc records read-model path first and direct base-table path deferred', () => {
  const doc = read(taskDocPath);

  assertContainsAll(doc, [
    /Current read-model decision/,
    /read-model path first/,
    /direct base-table join path deferred/,
    /direct base-table join path remains a separate future decision/,
  ], 'read-model decision');
});

test('Task1786 doc records safety boundaries', () => {
  const doc = read(taskDocPath);

  assertContainsAll(doc, [
    /organization scoping/,
    /engineer scoping/,
    /appointment detail scoping/,
    /repository guard/,
    /query executor guard/,
    /projection allowlist/,
    /envelope sanitization/,
    /no provider sending/,
    /no workflow mutation/,
    /no `finalAppointmentId` exposure/,
  ], 'safety boundaries');
});

test('Task1786 doc records one Case / one formal FSR boundary', () => {
  const doc = read(taskDocPath);

  assertContainsAll(doc, [
    /One Case \/ one formal FSR boundary/,
    /untouched/,
    /`field_service_reports\.case_id` uniqueness untouched/,
    /no second formal FSR path introduced/,
    /do not create, update, submit, publish, or persist completion reports/,
    /`finalAppointmentId` remains system-owned\/admin override only/,
  ], 'one Case one formal FSR boundary');
});

test('Task1786 doc records future task candidates', () => {
  const doc = read(taskDocPath);

  assertContainsAll(doc, [
    /Future task candidates/,
    /optionally commit\/push branch when explicitly requested/,
    /migration 022 disposable DB dry-run only with explicit authorization packet language/,
    /future production route mount only after DB\/migration\/runtime auth decision/,
    /future direct base-table path only as separate bounded decision/,
  ], 'future task candidates');
});

test('Task1786 doc records explicit non-goals', () => {
  const doc = read(taskDocPath);

  assertContainsAll(doc, [
    /Explicit non-goals/,
    /no source\/runtime changes/,
    /no migration changes/,
    /no DB execution/,
    /no real SQL execution/,
    /no DDL/,
    /no schema\/index changes/,
    /no `psql`/,
    /no `db:migrate`/,
    /no smoke/,
    /no global mount/,
    /no provider/,
    /no admin UI/,
    /no package changes/,
  ], 'explicit non-goals');
});

test('Task1786 static test itself does not import DB clients, execute SQL, or run migrations', () => {
  const source = read('tests/engineerMobile/engineerMobileReadModelRuntimeBranchFinalCheckpoint.static.test.js');
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
