'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  preflightDoc: 'docs/task-884-data-correction-decision-audit-repository-writer-implementation-preflight-no-runtime-no-db.md',
  migration025: 'migrations/025_create_data_correction_decision_audit_events.sql',
});

const SAFE_COLUMNS = Object.freeze([
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
]);

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

test('Task884 preflight doc and Migration 025 exist', () => {
  assert.equal(exists(FILES.preflightDoc), true);
  assert.equal(exists(FILES.migration025), true);
});

test('preflight references full Task869 through Task883 evidence chain', () => {
  const doc = read(FILES.preflightDoc);

  [
    'Task869',
    'Task870',
    'Task871',
    'Task872',
    'Task873',
    'Task874',
    'Task875',
    'Task876',
    'Task877',
    'Task878',
    'Task879',
    'Task880',
    'Task881',
    'Task882',
    'Task883',
  ].forEach((taskId) => assert.match(doc, new RegExp(taskId)));
});

test('preflight keeps Migration 025 no-apply no-dry-run no-DB', () => {
  const doc = read(FILES.preflightDoc);
  const migration = read(FILES.migration025);

  assertIncludesAll(doc, [
    'Migration 025 exists',
    'no DB',
    'no `psql`',
    'no `npm run db:migrate`',
    'no DDL execution',
    'no SQL execution',
    'no dry-run',
    'no apply',
    'no migration execution authorization',
  ]);
  assertIncludesAll(migration, [
    'NOT APPLIED IN TASK 877',
    'FUTURE DRY-RUN OR APPLY REQUIRES EXPLICIT DISPOSABLE DB AUTHORIZATION',
    'NO DB CONNECTION, PSQL, OR SQL EXECUTION IS AUTHORIZED BY THIS FILE',
  ]);
});

test('preflight defines injected DB only fake unit test future implementation scope', () => {
  const doc = read(FILES.preflightDoc);

  assertIncludesAll(doc, [
    'repository / writer with injected `dbClient` or injected transaction only',
    'fake DB unit tests only',
    'no real DB connection',
    'no global DB import',
    'no `process.env` read',
    'no config / credential read',
    'no route/controller/API body change',
    'no public service response shape change',
    'no correction application behavior change',
    'no migration execution',
    'no smoke / integration test unless separately authorized after DB approval',
  ]);
});

test('preflight lists future source candidates without creating them', () => {
  const doc = read(FILES.preflightDoc);

  assertIncludesAll(doc, [
    'src/dataCorrection/dataCorrectionDecisionAuditEventRepository.js',
    'src/dataCorrection/dataCorrectionDecisionAuditEventWriter.js',
    'tests/dataCorrection/dataCorrectionDecisionAuditEventRepository.unit.test.js',
    'tests/dataCorrection/dataCorrectionDecisionAuditEventWriter.unit.test.js',
    'Those names are planning candidates only. Task884 creates none of them.',
  ]);

  [
    'src/dataCorrection/dataCorrectionDecisionAuditEventRepository.js',
    'src/dataCorrection/dataCorrectionDecisionAuditEventWriter.js',
    'tests/dataCorrection/dataCorrectionDecisionAuditEventRepository.unit.test.js',
    'tests/dataCorrection/dataCorrectionDecisionAuditEventWriter.unit.test.js',
  ].forEach((relativePath) => {
    assert.equal(exists(relativePath), false, `${relativePath} should not exist in Task884`);
  });
});

test('preflight safe insert payload columns match Migration 025 metadata columns', () => {
  const doc = read(FILES.preflightDoc);
  const migration = read(FILES.migration025);

  for (const column of SAFE_COLUMNS) {
    assert.match(doc, new RegExp(`- \`${column}\``), `preflight missing safe column: ${column}`);
    assert.match(migration, new RegExp(`\\b${column}\\b`), `migration missing safe column: ${column}`);
  }
});

test('preflight forbids unsafe fields and official mutation side effects', () => {
  const doc = read(FILES.preflightDoc);

  assertIncludesAll(doc, [
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
    'alter public service response shape',
    'create or modify official correction applications',
    'mutate Case',
    'mutate Appointment',
    'mutate Field Service Report',
    'mutate customer identity',
  ]);
});

test('preflight includes fail-closed cases and stop conditions', () => {
  const doc = read(FILES.preflightDoc);

  assertIncludesAll(doc, [
    'missing injected `dbClient` or transaction',
    'missing `organization_id`',
    'unsafe `event_type`',
    'unsafe `result_status`',
    'unsafe extras',
    'malformed `auditIntent`',
    'DB throw',
    'timeout-like failure',
    'duplicate `request_id`',
    'transaction failure',
    'malformed DB result',
    'injected DB only',
    'no real DB',
    'no environment / config / credential reads',
    'no route/controller/API changes',
    'no public response shape change',
    'no provider sending',
    'no AI/RAG',
    'no billing/settlement',
  ]);
});

test('preflight avoids real-looking credentials DB URLs phones and bearer tokens', () => {
  const doc = read(FILES.preflightDoc);

  [
    /postgres(?:ql)?:\/\/[^\s)]+/i,
    /mysql:\/\/[^\s)]+/i,
    /(?:^|[\s"'=])sk-[A-Za-z0-9_-]{20,}/,
    /Bearer\s+[A-Za-z0-9._-]+/i,
    /09\d{2}[-\s]?\d{3}[-\s]?\d{3}/,
    /LINE(?:_|-)?ACCESS(?:_|-)?TOKEN\s*[:=]/i,
  ].forEach((pattern) => {
    assert.equal(pattern.test(doc), false, `unexpected sensitive-looking pattern: ${pattern}`);
  });
});

test('Task884 static test imports no runtime modules', () => {
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
