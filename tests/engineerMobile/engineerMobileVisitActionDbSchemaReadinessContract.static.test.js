'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const TASK_DOC = 'docs/task-1836-engineer-mobile-visit-action-db-schema-readiness-contract-no-migration-no-sql.md';

const REQUIRED_HEADINGS = Object.freeze([
  '# Task1836 Engineer Mobile Visit Action DB Schema Readiness Contract / No Migration No SQL',
  '## Status',
  '## Purpose',
  '## Current runtime contract source',
  '## Future DB persistence target',
  '## Candidate appointment fields',
  '## Candidate audit event fields',
  '## Required indexes / uniqueness considerations',
  '## Organization isolation requirements',
  '## Permission and assignment requirements',
  '## Customer-visible data restrictions',
  '## Completion Report / Field Service Report boundary',
  '## finalAppointmentId boundary',
  '## Migration authorization gates',
  '## Forbidden in Task1836',
  '## Future bounded implementation sequence',
  '## Verification',
]);

const RUNTIME_SOURCE_MODULES = Object.freeze([
  'engineerMobileVisitActionTransitionPatchBuilder',
  'engineerMobileVisitActionAuditEventBuilder',
  'engineerMobileVisitActionPersistencePortContract',
  'engineerMobileVisitActionPersistencePortWriterAdapter',
  'engineerMobileVisitActionIntegratedPersistenceWriter',
  'engineerMobileVisitActionRuntimeBootstrap',
]);

const CANDIDATE_APPOINTMENT_FIELDS = Object.freeze([
  'appointment_id',
  'organization_id',
  'case_id',
  'mobile_visit_status',
  'visit_result',
  'mobile_visit_status_updated_at',
  'mobile_visit_status_updated_by',
  'last_engineer_mobile_action',
  'last_engineer_mobile_request_id',
]);

const CANDIDATE_AUDIT_EVENT_FIELDS = Object.freeze([
  'organization_id',
  'entity_type',
  'entity_id',
  'actor_id',
  'action',
  'occurred_at',
  'case_id',
  'appointment_id',
  'request_id',
  'metadata',
]);

const MOBILE_VISIT_STATUSES = Object.freeze([
  'traveling',
  'arrived',
  'working',
  'work_finished',
  'visit_result_recorded',
]);

const VISIT_RESULTS = Object.freeze([
  'resolved',
  'follow_up_required',
  'parts_required',
  'cannot_repair',
  'customer_unavailable',
  'cancelled_on_site',
]);

const AUDIT_ACTIONS = Object.freeze([
  'engineer_mobile.start_travel.allowed',
  'engineer_mobile.arrive.allowed',
  'engineer_mobile.start_work.allowed',
  'engineer_mobile.finish_work.allowed',
  'engineer_mobile.record_visit_result.allowed',
]);

const REQUIRED_BOUNDARY_STATEMENTS = Object.freeze([
  'No migration created in Task1836',
  'No SQL file created in Task1836',
  'No DB execution in Task1836',
  'No psql in Task1836',
  'No npm run db:migrate in Task1836',
  'No schema/index change in Task1836',
  'No repository implementation in Task1836',
  'No runtime persistence implementation in Task1836',
  'No provider sending in Task1836',
  'No route/global mount in Task1836',
  'No Completion Report / Field Service Report creation in Task1836',
  'No finalAppointmentId mutation in Task1836',
  'No customer-visible publication in Task1836',
]);

function absolutePath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(absolutePath(relativePath), 'utf8');
}

function assertIncludesAll(source, values, label) {
  for (const value of values) {
    assert.equal(source.includes(value), true, `${label} missing ${value}`);
  }
}

test('Task1836 allowed files exist', () => {
  assert.equal(fs.existsSync(absolutePath(TASK_DOC)), true, `${TASK_DOC} should exist`);
  assert.equal(
    fs.existsSync(absolutePath('tests/engineerMobile/engineerMobileVisitActionDbSchemaReadinessContract.static.test.js')),
    true,
  );
});

test('Task1836 doc contains all required section headings', () => {
  assertIncludesAll(read(TASK_DOC), REQUIRED_HEADINGS, 'required heading');
});

test('Task1836 doc references accepted runtime source modules', () => {
  assertIncludesAll(read(TASK_DOC), RUNTIME_SOURCE_MODULES, 'runtime source module');
});

test('Task1836 doc records candidate appointment and audit event fields', () => {
  const doc = read(TASK_DOC);

  assertIncludesAll(doc, CANDIDATE_APPOINTMENT_FIELDS, 'candidate appointment field');
  assertIncludesAll(doc, CANDIDATE_AUDIT_EVENT_FIELDS, 'candidate audit event field');
});

test('Task1836 doc records supported visit statuses results and audit actions', () => {
  const doc = read(TASK_DOC);

  assertIncludesAll(doc, MOBILE_VISIT_STATUSES, 'mobile visit status');
  assertIncludesAll(doc, VISIT_RESULTS, 'visit result');
  assertIncludesAll(doc, AUDIT_ACTIONS, 'audit action');
});

test('Task1836 doc records required boundary statements', () => {
  assertIncludesAll(read(TASK_DOC), REQUIRED_BOUNDARY_STATEMENTS, 'boundary statement');
});

test('Task1836 doc records future bounded implementation sequence gates', () => {
  const doc = read(TASK_DOC);

  assertIncludesAll(doc, [
    'Migration draft file only, no apply',
    'Static migration boundary test',
    'Disposable DB dry-run authorization packet',
    'Disposable DB dry-run only after explicit approval',
    'Repository contract around persistence port',
    'Injected repository adapter tests with synthetic DB client',
    'Runtime bootstrap wiring with injected repository port',
    'Global route/mount only after separate explicit approval',
  ], 'future sequence gate');
});

test('Task1836 doc does not contain executable SQL statements', () => {
  const doc = read(TASK_DOC);

  for (const pattern of [
    /CREATE\s+TABLE/i,
    /ALTER\s+TABLE/i,
    /INSERT\s+INTO/i,
    /\bUPDATE\s+/i,
    /DELETE\s+FROM/i,
    /SELECT\s+/i,
    /DROP\s+TABLE/i,
  ]) {
    assert.doesNotMatch(doc, pattern, `doc contains executable SQL statement ${pattern}`);
  }
});

test('Task1836 doc does not contain real-looking credentials or DB URLs', () => {
  const doc = read(TASK_DOC);

  for (const pattern of [
    /postgres(?:ql)?:\/\//i,
    /mysql:\/\//i,
    /redis:\/\//i,
    /mongodb(?:\+srv)?:\/\//i,
    /sk-(?:proj-)?[A-Za-z0-9]{20,}/,
    /xox[baprs]-[A-Za-z0-9-]{20,}/,
    /BEGIN (?:RSA|OPENSSH|PRIVATE) KEY/,
    /LINE_CHANNEL_ACCESS_TOKEN\s*=/,
    /access[_-]?token\s*=/i,
    /api[_-]?key\s*=/i,
    /client[_-]?secret\s*=/i,
    /password\s*=/i,
    /secret\s*=/i,
  ]) {
    assert.doesNotMatch(doc, pattern, `doc contains sensitive value pattern ${pattern}`);
  }
});

test('Task1836 static test itself stays file-read only and does not import DB or process tools', () => {
  const source = read('tests/engineerMobile/engineerMobileVisitActionDbSchemaReadinessContract.static.test.js');
  const specifiers = Array.from(source.matchAll(/require\(['"]([^'"]+)['"]\)/g)).map((match) => match[1]);

  assert.deepEqual(specifiers.sort(), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
});
