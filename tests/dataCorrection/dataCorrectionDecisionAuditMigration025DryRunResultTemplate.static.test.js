'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const migrationPath = path.join(repoRoot, 'migrations/025_create_data_correction_decision_audit_events.sql');
const task879DocPath = path.join(repoRoot, 'docs/task-879-data-correction-decision-audit-migration-025-disposable-db-dry-run-result-template-no-db-execution.md');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function assertIncludesAll(source, phrases) {
  for (const phrase of phrases) {
    assert.match(source, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `missing phrase: ${phrase}`);
  }
}

test('Task879 result template and migration 025 exist', () => {
  assert.equal(fs.existsSync(task879DocPath), true);
  assert.equal(fs.existsSync(migrationPath), true);
});

test('template references migration 025 without authorizing modification', () => {
  const doc = read(task879DocPath);

  assertIncludesAll(doc, [
    'migrations/025_create_data_correction_decision_audit_events.sql',
    'Task879 does not modify the migration file',
    'no migration file modification',
  ]);
});

test('template keeps no DB execution wording explicit', () => {
  const doc = read(task879DocPath);

  assertIncludesAll(doc, [
    'no DB execution',
    'no DB connection',
    'no `psql`',
    'no `npm run db:migrate`',
    'no DDL',
    'no dry-run',
    'no apply',
    'no SQL execution',
  ]);
});

test('template includes required future dry-run result sections', () => {
  const doc = read(task879DocPath);

  [
    'Explicit Authorization Reference',
    'Disposable DB Target Confirmation',
    'Migration File Integrity / Hash / Check',
    'Command Envelope Placeholder',
    'Sanitized Success / Failure Summary',
    'Created Objects Checklist',
    'Index Checklist',
    'Rollback Readiness',
    'Runtime / Provider / AI Disabled Confirmation',
    'Stop Conditions',
    'Sensitive-output Review',
  ].forEach((heading) => {
    assert.match(doc, new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  });
});

test('template requires authorization and disposable target confirmation', () => {
  const doc = read(task879DocPath);

  assertIncludesAll(doc, [
    'Approval task id',
    'Approval wording',
    'Disposable local/test DB confirmed',
    'Shared/prod/staging/Zeabur target excluded',
    'Runtime disabled confirmation',
    'Target classification: disposable local/test DB',
    'Connection string printed: no',
    'Credentials printed: no',
    'Customer data present: no',
  ]);
});

test('template includes command envelope and sanitized result placeholders', () => {
  const doc = read(task879DocPath);

  assertIncludesAll(doc, [
    'Command class: migration 025 dry-run only',
    'Full command printed: no',
    'Connection values printed: no',
    'More than migration 025 attempted: no',
    'Runtime app started: no',
    'Provider traffic started: no',
    'Result: success / failed / stopped',
    'Safe failure category',
    'Sensitive details redacted: yes',
    'Runtime payloads included: no',
  ]);
});

test('template includes created object index and rollback checks', () => {
  const doc = read(task879DocPath);

  assertIncludesAll(doc, [
    'Table `data_correction_decision_audit_events` checked',
    'Columns checked against approved safe list',
    'No seed data inserted',
    'No unrelated tables modified',
    'No runtime records created',
    '`organization_id`, `created_at`',
    '`organization_id`, `case_id`, `created_at`',
    '`organization_id`, `actor_id`, `created_at`',
    '`organization_id`, `event_type`, `created_at`',
    '`organization_id`, `request_id`',
    '`organization_id`, `retention_until`',
    '`organization_id`, `deleted_at`',
    'Cross-organization indexes absent',
    'Rollback was executed: no',
    'Rollback needs separate approval: yes',
  ]);
});

test('template requires runtime provider AI audit and mutation disabled confirmation', () => {
  const doc = read(task879DocPath);

  assertIncludesAll(doc, [
    'runtime traffic',
    'provider sending',
    'LINE / SMS / App push / webhook / email',
    'AI / RAG',
    'audit writer / sink runtime',
    'repository / writer runtime',
    'Case / Appointment / Field Service Report mutation',
    '`finalAppointmentId` mutation',
    'correction application creation',
    'billing / settlement behavior',
  ]);
});

test('template stop conditions cover unsafe targets logs traffic and mutations', () => {
  const doc = read(task879DocPath);

  assertIncludesAll(doc, [
    'disposable local/test DB confirmation is missing',
    'target could be shared, production, staging, or Zeabur',
    'command attempts to run more than migration 025',
    'command attempts to print or echo a DB URL',
    'command attempts to print or echo credentials',
    'command attempts provider traffic',
    'command attempts LINE / SMS / App push / webhook / email notification sending',
    'command attempts AI / RAG execution',
    'command attempts audit writer / sink runtime',
    'command attempts repository / writer runtime',
    'command attempts Case / Appointment / Field Service Report mutation',
    'command attempts `finalAppointmentId` mutation',
    'command attempts correction application creation',
    'command attempts billing / settlement behavior',
  ]);
});

test('template forbids sensitive output categories', () => {
  const doc = read(task879DocPath);

  assertIncludesAll(doc, [
    '`DATABASE_URL`',
    'credentials',
    'tokens',
    'LINE access token',
    'channel secret',
    'raw phone',
    'raw address',
    'raw LINE id',
    'full PII',
    'correction payload',
    'before / after values',
    'provider payload',
    'AI payload',
    'SQL logs with secrets',
    'full runtime payloads',
    '`finalAppointmentId`',
    'Field Service Report id / report id',
    'internal note',
    'billing / settlement internals',
    'customer-visible report body',
    'file / photo / signature contents',
  ]);
});

test('template avoids real-looking database urls credentials and phone values', () => {
  const doc = read(task879DocPath);

  [
    /postgres(?:ql)?:\/\/[^\s)]+/i,
    /mysql:\/\/[^\s)]+/i,
    /(?:^|[\s"'=])sk-[A-Za-z0-9_-]{20,}/,
    /[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    /09\d{2}[-\s]?\d{3}[-\s]?\d{3}/,
    /Bearer\s+[A-Za-z0-9._-]+/i,
    /LINE(?:_|-)?ACCESS(?:_|-)?TOKEN\s*[:=]/i,
  ].forEach((pattern) => {
    assert.equal(pattern.test(doc), false, `unexpected sensitive-looking pattern: ${pattern}`);
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
