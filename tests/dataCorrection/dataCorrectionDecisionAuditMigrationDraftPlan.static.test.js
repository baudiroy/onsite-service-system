'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const task873DocPath = path.join(repoRoot, 'docs/task-873-data-correction-decision-audit-persistence-schema-proposal-no-migration-no-db.md');
const task874DocPath = path.join(repoRoot, 'docs/task-874-data-correction-decision-audit-persistence-migration-authorization-packet-no-migration-no-db.md');
const task875DocPath = path.join(repoRoot, 'docs/task-875-data-correction-decision-audit-migration-draft-plan-no-migration-no-db.md');
const migrationsDir = path.join(repoRoot, 'migrations');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function assertIncludesAll(source, phrases) {
  for (const phrase of phrases) {
    assert.match(source, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `missing phrase: ${phrase}`);
  }
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(absolute));
    } else {
      files.push(absolute);
    }
  }

  return files;
}

test('Task875 draft plan and Task873/874 evidence exist', () => {
  assert.equal(fs.existsSync(task873DocPath), true);
  assert.equal(fs.existsSync(task874DocPath), true);
  assert.equal(fs.existsSync(task875DocPath), true);
});

test('draft plan states no migration no DB no runtime boundary', () => {
  const doc = read(task875DocPath);

  assertIncludesAll(doc, [
    'no migration file is created',
    'no migration file is modified',
    'no DDL is executed',
    'no `psql` is executed',
    'no DB connection is opened',
    'no dry-run is performed',
    'no migration apply is performed',
    'no repository is implemented',
    'no audit writer / sink is implemented',
    'no transaction behavior is implemented',
    'Future migration-file creation requires separate explicit approval',
  ]);
});

test('draft plan proposes future table and safe columns only', () => {
  const doc = read(task875DocPath);

  assert.match(doc, /data_correction_decision_audit_events/);

  [
    'id',
    'organization_id',
    'case_id',
    'appointment_id',
    'actor_id',
    'actor_role',
    'action',
    'field_key',
    'field_group',
    'event_type',
    'decision',
    'reason_code',
    'safe_message_key',
    'result_status',
    'request_id',
    'created_at',
    'retention_until',
    'deleted_at',
  ].forEach((column) => {
    assert.equal(doc.includes(`\`${column}\``), true, `missing column: ${column}`);
  });
});

test('draft plan proposes organization-scoped indexes', () => {
  const doc = read(task875DocPath);

  [
    '`organization_id`, `created_at`',
    '`organization_id`, `case_id`, `created_at`',
    '`organization_id`, `actor_id`, `created_at`',
    '`organization_id`, `event_type`, `created_at`',
    '`organization_id`, `request_id`',
    '`organization_id`, `retention_until`',
    '`organization_id`, `deleted_at`',
    'tenant isolation',
    'Cross-organization lookup indexes are not allowed',
  ].forEach((phrase) => {
    assert.match(doc, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  });
});

test('pseudo-SQL is explicitly non-executable and DO NOT RUN', () => {
  const doc = read(task875DocPath);

  assertIncludesAll(doc, [
    'Non-executable Pseudo-SQL',
    'DO NOT RUN',
    'Draft only. This is not a migration',
    '-- CREATE TABLE data_correction_decision_audit_events',
    '-- CREATE INDEX ... ON data_correction_decision_audit_events',
    'intentionally commented and non-executable',
  ]);
});

test('rollback outline is bounded and requires separate shared rollback approval', () => {
  const doc = read(task875DocPath);

  assertIncludesAll(doc, [
    'drop only approved-created indexes',
    'drop only the approved-created table',
    'avoid unrelated tables, indexes, constraints, functions, triggers, and data',
    'avoid shared-data assumptions',
    'avoid destructive cleanup',
    'require separate approval for shared, production, staging, or Zeabur rollback',
    'Rollback outline does not authorize rollback execution',
  ]);
});

test('draft plan forbids unsafe columns and stored values', () => {
  const doc = read(task875DocPath);

  assertIncludesAll(doc, [
    'before / after values',
    'raw correction payload',
    'raw phone / mobile',
    'raw address',
    'raw LINE user id',
    'token',
    'secret',
    'DB URL',
    'stack traces',
    'SQL input',
    '`finalAppointmentId`',
    'Field Service Report id / report id',
    'internal note',
    'audit raw payload',
    'AI raw payload',
    'billing / settlement internals',
    'full payload',
    'cross-organization data',
    'provider payload',
    'customer-visible report body',
    'photos',
    'signatures',
    'files',
    'file contents',
  ]);
});

test('draft plan keeps future runtime behavior separately approved', () => {
  const doc = read(task875DocPath);

  assertIncludesAll(doc, [
    'migration creation',
    'migration apply',
    'repository implementation',
    'audit writer / sink implementation',
    'transaction wiring',
    'service writer injection',
    'route/controller/app exposure',
    'public API response body change',
    'smoke/integration test against DB',
    'Case / Appointment / Field Service Report mutation',
    '`finalAppointmentId` inference or update',
    'customer identity mutation',
    'phone / LINE / App binding change',
    'provider sending',
    'AI/RAG execution',
    'billing / settlement behavior',
    'requires a separate bounded task and explicit approval',
  ]);
});

test('only the explicitly approved Task877 migration file exists for data correction decision audit events', () => {
  const migrationFiles = listFiles(migrationsDir).filter((filePath) => filePath.endsWith('.sql'));
  const matchingFiles = migrationFiles.filter((filePath) => {
    const name = path.basename(filePath).toLowerCase();
    if (name.includes('data_correction_decision_audit')) return true;
    return read(filePath).includes('data_correction_decision_audit_events');
  });

  assert.deepEqual(matchingFiles.map((filePath) => path.basename(filePath)), [
    '025_create_data_correction_decision_audit_events.sql',
  ]);
});

test('draft plan avoids real-looking secrets database urls and phone values', () => {
  const doc = read(task875DocPath);

  [
    /postgres(?:ql)?:\/\/[^\s)]+/i,
    /mysql:\/\/[^\s)]+/i,
    /(?:^|[\s"'=])sk-[A-Za-z0-9_-]{20,}/,
    /[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    /09\d{2}[-\s]?\d{3}[-\s]?\d{3}/,
    /Bearer\s+[A-Za-z0-9._-]+/i,
    /LINE(?:_|-)?ACCESS(?:_|-)?TOKEN\s*[:=]/i,
  ].forEach((pattern) => {
    assert.equal(pattern.test(doc), false, `unexpected secret-like pattern: ${pattern}`);
  });
});

test('static test itself imports no runtime modules', () => {
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
});
