'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  handoff: 'docs/task-881-pm-continuation-handoff-after-data-correction-decision-audit-no-db-closure-docs-only-no-runtime.md',
  task882: 'docs/task-882-data-correction-decision-audit-handoff-static-guard-docs-only-no-runtime.md',
});

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

function assertIncludesAll(source, phrases) {
  for (const phrase of phrases) {
    assert.match(source, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `missing phrase: ${phrase}`);
  }
}

test('Task881 handoff and Task882 guard document exist', () => {
  assert.equal(exists(FILES.handoff), true);
  assert.equal(exists(FILES.task882), true);
});

test('Task881 summarizes Task869 through Task871 auditIntent side-channel closure', () => {
  const handoff = read(FILES.handoff);

  assertIncludesAll(handoff, [
    'Task869 added a pure Data Correction decision `auditIntent` builder',
    'Task870 added an internal opt-in side-channel',
    'Task871 closed the side-channel branch',
    '`auditIntent` remains internal opt-in only',
    '`auditIntent.auditWritten` remains `false`',
    'default / public service response shape remains unchanged',
  ]);
});

test('Task881 summarizes Task872 through Task880 persistence no-DB closure', () => {
  const handoff = read(FILES.handoff);

  assertIncludesAll(handoff, [
    'Task872 created the persistence readiness packet',
    'Task873 proposed the future safe schema',
    'Task874 created the migration authorization packet',
    'Task875 created the non-executable migration draft plan',
    'Task876 created the migration file creation preflight gate',
    'Task877 created `migrations/025_create_data_correction_decision_audit_events.sql` as a no-apply migration file only',
    'Task878 created the disposable DB dry-run authorization packet',
    'Task879 created the redacted future disposable DB dry-run result template',
    'Task880 closed the Data Correction decision audit persistence no-DB branch',
  ]);
});

test('Task881 keeps Migration 025 no DB no execution no dry-run no apply', () => {
  const handoff = read(FILES.handoff);

  assertIncludesAll(handoff, [
    'Migration 025 exists',
    'Migration 025 remains no DB',
    'Migration 025 remains no `psql`',
    'Migration 025 remains no `npm run db:migrate`',
    'Migration 025 remains no DDL execution',
    'Migration 025 remains no SQL execution',
    'Migration 025 remains no dry-run',
    'Migration 025 remains no apply',
  ]);
});

test('Task881 preserves request/apply separation and valid pre_departure_apply boundary', () => {
  const handoff = read(FILES.handoff);

  assertIncludesAll(handoff, [
    '`data_correction_request` remains a manual-handling / decision path',
    '`data_correction_request` must not create official correction applications',
    'official correction application remains limited to valid `pre_departure_apply`',
    'phone / LINE / App channel identity changes remain re-verification paths',
    'post-departure correction remains manual contact / dispatch note / audit intent metadata',
    'follow-up proposal remains a draft / proposal',
  ]);
});

test('Task881 hard no-go boundaries cover runtime DB API provider AI billing permission smoke package and secrets', () => {
  const handoff = read(FILES.handoff);

  assertIncludesAll(handoff, [
    'DB connection',
    '`psql`',
    '`npm run db:migrate`',
    'DDL',
    'SQL execution',
    'disposable DB dry-run',
    'migration apply',
    'migration 025 modification',
    'audit writer / sink runtime',
    'repository runtime',
    'route / controller / DTO / public API body change',
    'permission runtime expansion',
    'provider / LINE / SMS / App push / webhook / email traffic',
    'AI / RAG runtime',
    'billing / settlement runtime',
    'smoke / integration test expansion',
    'package changes',
    'secret / credential / provider config changes',
  ]);
});

test('Task881 future candidates require explicit approval only', () => {
  const handoff = read(FILES.handoff);

  assertIncludesAll(handoff, [
    'Future Explicit-approval Branches',
    'Disposable local/test DB dry-run for Migration 025',
    'Migration 025 apply after dry-run acceptance',
    'Repository / writer runtime using injected DB only',
    'Service-layer injected writer path for decision audit persistence',
    'Route/controller/API exposure, if product explicitly accepts a public shape change',
    'Permission runtime expansion for audit event access',
    'Smoke / integration coverage after DB and runtime approval',
  ]);
});

test('Task881 generic continuation language is explicitly non-authorizing', () => {
  const handoff = read(FILES.handoff);

  assertIncludesAll(handoff, [
    'Generic wording such as "continue", "go ahead", "approved", "keep going", "I agree", or "authorized" must not be treated as approval for DB execution',
    'migration apply',
    'audit writer runtime',
    'repository runtime',
    'public API shape changes',
  ]);
});

test('Task881 sensitive data boundary stays explicit and does not include example secrets', () => {
  const handoff = read(FILES.handoff);

  assertIncludesAll(handoff, [
    'before / after values',
    'raw correction payload',
    'raw phone / mobile',
    'raw address',
    'raw LINE user id',
    'token',
    'secret',
    'DB URL',
    '`finalAppointmentId`',
    'Field Service Report id / report id',
    'audit raw payload',
    'AI raw payload',
    'billing / settlement internals',
    'full payload',
    'provider payload',
    'customer-visible report body',
    'file contents',
  ]);

  [
    /postgres(?:ql)?:\/\/[^\s)]+/i,
    /mysql:\/\/[^\s)]+/i,
    /(?:^|[\s"'=])sk-[A-Za-z0-9_-]{20,}/,
    /Bearer\s+[A-Za-z0-9._-]+/i,
    /09\d{2}[-\s]?\d{3}[-\s]?\d{3}/,
    /LINE(?:_|-)?ACCESS(?:_|-)?TOKEN\s*[:=]/i,
  ].forEach((pattern) => {
    assert.equal(pattern.test(handoff), false, `unexpected sensitive-looking pattern: ${pattern}`);
  });
});

test('Task882 guard remains static and imports no runtime modules', () => {
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
