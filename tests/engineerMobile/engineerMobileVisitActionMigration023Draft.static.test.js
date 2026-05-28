'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const migrationPath = path.join(repoRoot, 'migrations/023_engineer_mobile_visit_action_persistence_fields.sql');
const taskDocPath = path.join(repoRoot, 'docs/task-1838-engineer-mobile-visit-action-migration-023-draft-no-db-execution.md');

const allowedColumns = [
  'mobile_visit_status',
  'visit_result',
  'mobile_visit_status_updated_at',
  'mobile_visit_status_updated_by',
  'work_started_at',
  'work_finished_at',
  'arrived_at',
  'travel_started_at',
];

const mobileVisitStatuses = [
  'traveling',
  'arrived',
  'working',
  'work_finished',
  'visit_result_recorded',
];

const visitResults = [
  'resolved',
  'follow_up_required',
  'parts_required',
  'cannot_repair',
  'customer_unavailable',
  'cancelled_on_site',
];

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function stripSqlComments(source) {
  return source
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('--'))
    .join('\n');
}

function assertIncludesAll(source, phrases) {
  for (const phrase of phrases) {
    assert.equal(source.includes(phrase), true, `missing phrase: ${phrase}`);
  }
}

test('Task1838 migration file and doc exist', () => {
  assert.equal(fs.existsSync(migrationPath), true);
  assert.equal(fs.existsSync(taskDocPath), true);
});

test('migration draft alters only appointments and adds the eight allowed columns idempotently', () => {
  const migration = read(migrationPath);
  const activeSql = stripSqlComments(migration);

  assert.match(activeSql, /\bALTER TABLE appointments\b/i);

  for (const column of allowedColumns) {
    assert.match(
      activeSql,
      new RegExp(`ADD COLUMN IF NOT EXISTS\\s+${column}\\b`, 'i'),
      `missing idempotent column add for ${column}`,
    );
  }

  assert.doesNotMatch(activeSql, /\bCREATE TABLE\b/i);
  assert.doesNotMatch(activeSql, /\bALTER TABLE\s+(?!appointments\b)[a-z0-9_]+/i);
});

test('migration draft documents supported status and result values', () => {
  const migration = read(migrationPath);

  assertIncludesAll(migration, mobileVisitStatuses);
  assertIncludesAll(migration, visitResults);
});

test('migration draft includes only safe index creation', () => {
  const activeSql = stripSqlComments(read(migrationPath));
  const createIndexMatches = activeSql.match(/\bCREATE INDEX IF NOT EXISTS\b/gi) || [];

  assert.equal(createIndexMatches.length >= 1, true, 'missing safe index creation');
  assert.doesNotMatch(activeSql, /\bCREATE\s+(?!INDEX IF NOT EXISTS\b)[A-Z_]+\b/i);
  assert.doesNotMatch(activeSql, /\bCREATE UNIQUE INDEX\b/i);
  assert.doesNotMatch(activeSql, /\bCREATE INDEX\b(?! IF NOT EXISTS\b)/i);
});

test('migration draft does not contain destructive SQL or forbidden runtime fields', () => {
  const migration = read(migrationPath);
  const activeSql = stripSqlComments(migration);

  [
    /\bDROP TABLE\b/i,
    /\bDROP COLUMN\b/i,
    /\bTRUNCATE\b/i,
    /\bDELETE FROM\b/i,
    /\bUPDATE\b/i,
    /\bINSERT INTO\b/i,
    /\bALTER TYPE\b/i,
    /\bCREATE TYPE\b/i,
    /\bCREATE TABLE\s+appointments\b/i,
    /\bCREATE TABLE\s+field_service_reports\b/i,
    /\bALTER TABLE\s+field_service_reports\b/i,
  ].forEach((pattern) => {
    assert.doesNotMatch(activeSql, pattern);
  });

  [
    'finalAppointmentId',
    'final_appointment_id',
    'customer_phone',
    'customer_address',
    'phone',
    'address',
    'provider_payload',
    'line_user_id',
    'report_draft',
    'report_body',
    'field_service_report_id',
  ].forEach((forbidden) => {
    assert.equal(migration.includes(forbidden), false, `forbidden migration token: ${forbidden}`);
  });
});

test('migration draft contains no DB execution commands or real-looking credentials', () => {
  const migration = read(migrationPath);
  const activeSql = stripSqlComments(migration);

  [
    /\bpsql\s+[-\w]/i,
    /\bnpm\s+run\s+db:migrate\b/i,
  ].forEach((pattern) => {
    assert.equal(pattern.test(activeSql), false, `unexpected execution-looking pattern: `);
  });

  [
    /postgres(?:ql)?:\/\/[^\s)]+/i,
    /mysql:\/\/[^\s)]+/i,
    /redis:\/\/[^\s)]+/i,
    /mongodb(?:\+srv)?:\/\/[^\s)]+/i,
    /(?:^|[\s"'=])sk-(?:proj-)?[A-Za-z0-9_-]{20,}/,
    /Bearer\s+[A-Za-z0-9._-]+/i,
    /LINE(?:_|-)?CHANNEL(?:_|-)?ACCESS(?:_|-)?TOKEN\s*=/i,
    /(?:access[_-]?token|api[_-]?key|client[_-]?secret|password|secret)\s*=/i,
  ].forEach((pattern) => {
    assert.equal(pattern.test(migration), false, `unexpected sensitive-looking pattern: ${pattern}`);
  });
});

test('Task1838 doc contains required no-execution boundary statements and references Task1836', () => {
  const doc = read(taskDocPath);

  assertIncludesAll(doc, [
    'Task1836',
    'Migration draft only',
    'No DB execution',
    'No psql',
    'No npm run db:migrate',
    'No migration apply',
    'No SQL dry-run',
    'No schema verification against shared DB',
    'No runtime code change',
    'No repository implementation',
    'No provider sending',
    'No Completion Report / Field Service Report creation',
    'No finalAppointmentId mutation',
    'No customer-visible publication',
    'Future disposable local/test DB dry-run requires separate explicit approval',
  ]);
});

test('static test itself does not execute SQL, spawn processes, import DB, or call migration scripts', () => {
  const source = fs.readFileSync(__filename, 'utf8');
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  const imports = [];
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    imports.push(match[1]);
  }

  assert.deepEqual(imports.sort(), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);

  assert.equal(imports.includes('child_process'), false);
  assert.equal(imports.some((moduleName) => ["pg", "postgres", "mysql", "knex", "sequelize", "sqlite3", "better-sqlite3"].includes(moduleName)), false);
  assert.doesNotMatch(source, /\bprocess\./);
});
