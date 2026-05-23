'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const docsDir = path.join(repoRoot, 'docs');
const migrationsDir = path.join(repoRoot, 'migrations');

const task873DocPath = path.join(docsDir, 'task-873-data-correction-decision-audit-persistence-schema-proposal-no-migration-no-db.md');
const task874DocPath = path.join(docsDir, 'task-874-data-correction-decision-audit-persistence-migration-authorization-packet-no-migration-no-db.md');
const task875DocPath = path.join(docsDir, 'task-875-data-correction-decision-audit-migration-draft-plan-no-migration-no-db.md');
const task876DocPath = path.join(docsDir, 'task-876-data-correction-decision-audit-migration-file-creation-preflight-gate-no-migration-no-db.md');

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

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(absolute) : [absolute];
  });
}

test('Task873 through Task876 evidence docs exist', () => {
  [
    task873DocPath,
    task874DocPath,
    task875DocPath,
    task876DocPath,
  ].forEach((filePath) => {
    assert.equal(fs.existsSync(filePath), true, `${filePath} missing`);
  });
});

test('preflight gate keeps no migration no DB no runtime boundary explicit', () => {
  const doc = read(task876DocPath);

  assertIncludesAll(doc, [
    'no migration file creation',
    'no migration file modification',
    'no DDL',
    'no `psql`',
    'no DB connection',
    'no DB dry-run',
    'no migration apply',
    'no `npm run db:migrate`',
    'no repository implementation',
    'no audit writer / sink implementation',
    'no route/controller/API change',
    'no public response body change',
  ]);
});

test('preflight gate requires future task to name filename table and no-apply boundary', () => {
  const doc = read(task876DocPath);

  assertIncludesAll(doc, [
    'Migration filename / number',
    'The exact migration filename must be provided',
    'The task must confirm no filename collision',
    '`data_correction_decision_audit_events`',
    'SQL file creation permission',
    'SQL file creation does not authorize running SQL',
    'No-apply boundary',
    'no DDL, no DB connection, no dry-run, and no apply',
    'separate explicitly approved disposable local/test DB task',
  ]);
});

test('preflight gate restates safe columns from Task873 through Task875', () => {
  const doc = read(task876DocPath);

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

test('preflight gate forbids unsafe columns and stored values', () => {
  const doc = read(task876DocPath);

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

test('future migration acceptance checklist is explicit', () => {
  const doc = read(task876DocPath);

  assertIncludesAll(doc, [
    '`CREATE TABLE data_correction_decision_audit_events`',
    'required `organization_id` tenant scope',
    'safe organization-scoped indexes',
    '`retention_until`',
    '`deleted_at`',
    'no raw sensitive columns',
    'rollback section',
    'rollback limited to approved-created objects only',
    'no credential printing',
    'no `DATABASE_URL` printing',
    'no shared DB target',
    'no production DB target',
    'no staging DB target',
    'no Zeabur DB target',
    'explicit no-apply wording',
    'explicit no-dry-run wording unless separately approved',
    'explicit runtime-disabled wording',
  ]);
});

test('preflight gate references Task873 Task874 and Task875 evidence chain', () => {
  const doc = read(task876DocPath);

  assertIncludesAll(doc, [
    'Task873: schema proposal / no migration / no DB',
    'Task874: migration authorization packet / no migration / no DB',
    'Task875: migration draft plan / no migration / no DB',
    'final stop before any future migration-file creation task',
  ]);
});

test('only the explicitly approved Task877 migration file exists for data correction decision audit events', () => {
  const migrationFiles = listFiles(migrationsDir).filter((filePath) => filePath.endsWith('.sql'));
  const matchingFiles = migrationFiles.filter((filePath) => {
    const fileName = path.basename(filePath).toLowerCase();
    return fileName.includes('data_correction_decision_audit') || read(filePath).includes('data_correction_decision_audit_events');
  });

  assert.deepEqual(matchingFiles.map((filePath) => path.basename(filePath)), [
    '025_create_data_correction_decision_audit_events.sql',
  ]);
});

test('touched docs/tests avoid real-looking secrets database urls and phone values', () => {
  const combined = [
    task876DocPath,
    __filename,
  ].map(read).join('\n');

  [
    /postgres(?:ql)?:\/\/[^\s)]+/i,
    /mysql:\/\/[^\s)]+/i,
    /(?:^|[\s"'=])sk-[A-Za-z0-9_-]{20,}/,
    /[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    /09\d{2}[-\s]?\d{3}[-\s]?\d{3}/,
    /Bearer\s+[A-Za-z0-9._-]+/i,
    /LINE(?:_|-)?ACCESS(?:_|-)?TOKEN\s*[:=]/i,
  ].forEach((pattern) => {
    assert.equal(pattern.test(combined), false, `unexpected secret-like pattern: ${pattern}`);
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
