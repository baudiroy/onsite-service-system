'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const task873DocPath = path.join(repoRoot, 'docs/task-873-data-correction-decision-audit-persistence-schema-proposal-no-migration-no-db.md');
const task872DocPath = path.join(repoRoot, 'docs/task-872-data-correction-decision-audit-persistence-readiness-packet-docs-only-no-runtime.md');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function assertIncludesAll(source, phrases) {
  for (const phrase of phrases) {
    assert.match(source, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `missing phrase: ${phrase}`);
  }
}

test('Task873 proposal and Task872 readiness packet exist', () => {
  assert.equal(fs.existsSync(task872DocPath), true);
  assert.equal(fs.existsSync(task873DocPath), true);
});

test('proposal states schema planning only with no migration no DB and no runtime', () => {
  const doc = read(task873DocPath);

  assertIncludesAll(doc, [
    'planning only',
    'does not authorize persistence',
    'No Migration / No DB Boundary',
    'create a migration file',
    'modify DB schema',
    'run DDL',
    'run `psql`',
    'run `npm run db:migrate`',
    'perform DB dry-run or apply',
    'add repository code',
    'add audit writer / sink code',
    'wire route/controller/app/server runtime',
    'change public API response shape',
  ]);
});

test('proposal defines future concept name without creating schema', () => {
  const doc = read(task873DocPath);

  assert.match(doc, /data_correction_decision_audit_events/);
  assert.match(doc, /This name is a proposal only/i);
  assert.match(doc, /not a migration, table creation, or schema change/i);
});

test('proposal lists only safe future column direction', () => {
  const doc = read(task873DocPath);

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
    assert.equal(doc.includes(`\`${column}\``), true, `missing safe column: ${column}`);
  });
});

test('proposal includes organization-scoped index direction', () => {
  const doc = read(task873DocPath);

  [
    '`organization_id`, `created_at`',
    '`organization_id`, `case_id`, `created_at`',
    '`organization_id`, `actor_id`, `created_at`',
    '`organization_id`, `event_type`, `created_at`',
    '`organization_id`, `request_id`',
    '`retention_until`, `deleted_at`',
    'organization-scoped',
    'tenant-isolated',
  ].forEach((phrase) => {
    assert.match(doc, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  });
});

test('proposal includes retention and redaction policy direction', () => {
  const doc = read(task873DocPath);

  assertIncludesAll(doc, [
    'retention period',
    '`retention_until` calculation',
    'soft-delete or archival policy',
    'hard-delete policy',
    'masking rules',
    'field allow-list',
    'export restrictions',
    'access review expectations',
  ]);
});

test('proposal forbids raw sensitive values and side-effect data', () => {
  const doc = read(task873DocPath);

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

test('proposal preserves non-effect boundary for business records', () => {
  const doc = read(task873DocPath);

  assertIncludesAll(doc, [
    'official correction application',
    'Case',
    'Appointment',
    'Field Service Report',
    '`finalAppointmentId`',
    'customer identity',
    'LINE / App binding',
    'provider sending',
    'AI / RAG result',
    'billing result',
    'settlement result',
    'customer-facing report',
    'must not drive official correction behavior',
  ]);
});

test('proposal avoids real-looking secrets database urls and phone values', () => {
  const doc = read(task873DocPath);

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
