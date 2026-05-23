'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const task873DocPath = path.join(repoRoot, 'docs/task-873-data-correction-decision-audit-persistence-schema-proposal-no-migration-no-db.md');
const task874DocPath = path.join(repoRoot, 'docs/task-874-data-correction-decision-audit-persistence-migration-authorization-packet-no-migration-no-db.md');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function assertIncludesAll(source, phrases) {
  for (const phrase of phrases) {
    assert.match(source, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `missing phrase: ${phrase}`);
  }
}

test('Task874 authorization packet and Task873 schema proposal exist', () => {
  assert.equal(fs.existsSync(task873DocPath), true);
  assert.equal(fs.existsSync(task874DocPath), true);
});

test('authorization packet keeps no migration no DB stance explicit', () => {
  const doc = read(task874DocPath);

  assertIncludesAll(doc, [
    'creates no migration file',
    'runs no DDL',
    'connects to no DB',
    'performs no dry-run/apply',
    'implements no repository/writer',
    'changes no runtime behavior',
    'create or modify files under `migrations/`',
    'run `psql`',
    'run `npm run db:migrate`',
    'Future DDL requires a separate explicit bounded task and approval',
  ]);
});

test('authorization packet references Task873 concept and safe columns', () => {
  const doc = read(task874DocPath);

  assertIncludesAll(doc, [
    'Task873 proposed the future concept/table name',
    '`data_correction_decision_audit_events`',
    '`organization_id`',
    '`case_id`',
    '`appointment_id`',
    '`actor_id`',
    '`field_key`',
    '`field_group`',
    '`reason_code`',
    '`safe_message_key`',
    '`retention_until`',
    '`deleted_at`',
  ]);
});

test('authorization packet lists future migration creation approval gates', () => {
  const doc = read(task874DocPath);

  assertIncludesAll(doc, [
    'Migration filename / number',
    'Final columns and types',
    'Organization scope and indexes',
    'Retention and deletion fields',
    'Redaction policy',
    'DDL review',
    'Rollback plan',
    'Disposable local/test DB dry-run approval',
    'Runtime disabled confirmation',
  ]);
});

test('dry-run guard requires disposable local target and forbids shared targets and secret output', () => {
  const doc = read(task874DocPath);

  assertIncludesAll(doc, [
    'explicit user approval naming disposable local/test DB target',
    'no shared DB',
    'no production DB',
    'no staging DB',
    'no Zeabur DB',
    'no `DATABASE_URL` printing',
    'no credential printing',
    'no customer data printing',
    'Generic wording such as "continue", "go ahead", "approved", or "I agree" must not be treated as dry-run or apply approval',
  ]);
});

test('rollback requirements are bounded to approved-created objects only', () => {
  const doc = read(task874DocPath);

  assertIncludesAll(doc, [
    'drops only objects created by the approved migration',
    'avoids unrelated tables, indexes, constraints, functions, triggers, and data',
    'avoids destructive cleanup of shared runtime data',
    'requires separate approval for shared/prod/staging rollback',
    'Rollback guidance does not authorize executing rollback',
  ]);
});

test('authorization packet forbids unsafe columns and stored values', () => {
  const doc = read(task874DocPath);

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
    'SQL',
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

test('authorization packet keeps future runtime behavior separately approved', () => {
  const doc = read(task874DocPath);

  assertIncludesAll(doc, [
    'repository implementation',
    'audit writer / sink implementation',
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
    'requires a separate bounded runtime task',
  ]);
});

test('authorization packet avoids real-looking secrets database urls and phone values', () => {
  const doc = read(task874DocPath);

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
