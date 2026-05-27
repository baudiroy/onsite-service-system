'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const taskDoc = path.join(
  repoRoot,
  'docs/task-1756-engineer-mobile-workbench-read-only-db-query-design-contract-no-db-no-migration.md',
);

function readDoc() {
  return fs.readFileSync(taskDoc, 'utf8');
}

function assertIncludesAll(source, values) {
  for (const value of values) {
    assert.equal(source.includes(value), true, `missing ${value}`);
  }
}

function assertMatchesAll(source, patterns) {
  for (const pattern of patterns) {
    assert.match(source, pattern, `missing pattern ${pattern}`);
  }
}

test('Task1756 DB query design contract doc exists', () => {
  assert.equal(fs.existsSync(taskDoc), true);
});

test('future repository method names are explicitly defined', () => {
  const source = readDoc();

  assertIncludesAll(source, [
    'findAssignedAppointments({ organizationId, engineerUserId, ...safeFilters })',
    'findAssignedAppointmentDetail({ organizationId, engineerUserId, appointmentId })',
    'Task1750 repository guard',
    'equivalent scoped guard',
  ]);
});

test('required organization engineer and appointment scoping is documented', () => {
  const source = readDoc();

  assertIncludesAll(source, [
    'Every list query must filter by `organizationId`.',
    'Every list query must filter by `engineerUserId`.',
    'Every detail query must filter by `organizationId`.',
    'Every detail query must filter by `engineerUserId`.',
    'Every detail query must filter by `appointmentId`.',
    'injected context resolver',
  ]);
});

test('read-only SELECT-only intent is documented with mutation blockers', () => {
  const source = readDoc();

  assertIncludesAll(source, [
    'Future DB behavior is SELECT-only intent.',
    'parameterized SELECT-style reads only',
    'no raw value interpolation',
    'no insert/update/delete/upsert',
    'no workflow transition writes',
    'no Completion Report creation or update',
    'no Field Service Report creation or update',
    'no Field Service Report publish or submit path',
  ]);
});

test('no DB execution migration or schema change authorization is documented', () => {
  const source = readDoc();

  assertIncludesAll(source, [
    'Task1756 does not authorize SQL execution',
    'DB connection',
    'DB dry-run',
    'migration dry-run',
    'migration apply',
    'schema change',
    'index change',
    'DDL',
    'DML',
    'psql',
  ]);
});

test('safe selected fields align with projection normalizer', () => {
  const source = readDoc();

  assertIncludesAll(source, [
    'Task1748 projection normalizer',
    'projection normalizer and safe envelope sanitizer',
    '`appointmentId`',
    '`caseReference`',
    '`appointmentWindow`',
    '`scheduledStart`',
    '`scheduledEnd`',
    '`serviceType`',
    '`customerDisplayName`',
    '`locationLabel`',
    '`status`',
    '`priorityLabel`',
    '`serviceSummary`',
    '`publicCustomerNotes`',
    '`checklistPreview`',
  ]);
});

test('forbidden selected fields and sensitive data are documented', () => {
  const source = readDoc();

  assertIncludesAll(source, [
    '`finalAppointmentId`',
    '`final_appointment_id`',
    'raw SQL/debug fields',
    'raw DB rows',
    'provider/debug/private fields',
    'token',
    'secret',
    'password',
    'cookie',
    'authorization header',
    'raw session',
    'raw user object',
    'internal notes',
    'raw phone',
    'raw address',
    'unfiltered customer phone/address',
  ]);
});

test('global route mount provider package admin and source changes remain forbidden', () => {
  const source = readDoc();

  assertIncludesAll(source, [
    'No source/runtime changes.',
    'No smoke.',
    'No global route mount.',
    'No `src/app.js`.',
    'No `src/server.js`.',
    'No `src/routes/**`.',
    'No provider sending.',
    'No LINE / SMS / email / webhook.',
    'No AI / RAG.',
    'No billing / settlement.',
    'No admin UI.',
    'No package changes.',
  ]);
});

test('core Case appointment and FSR invariants are preserved', () => {
  const source = readDoc();

  assertIncludesAll(source, [
    'One Case still has at most one formal Field Service Report.',
    '`field_service_reports.case_id` uniqueness is not touched.',
    '`finalAppointmentId` remains system-owned except explicit admin override.',
    'A Case may still have multiple appointments and dispatch visits.',
    'must not create a second formal Field Service Report',
  ]);
});

test('static test remains file-only and credential-safe', () => {
  const source = readDoc();
  const testSource = fs.readFileSync(__filename, 'utf8');

  assertMatchesAll(source, [
    /design contract only \/ no DB execution \/ no migration/,
    /No DB execution\./,
    /No SQL execution\./,
  ]);

  const directQueryCallPattern = new RegExp('\\.query\\s*\\(');

  assert.equal(/require\(['"](?:pg|postgres|postgresql|mysql|knex|sequelize)['"]\)/i.test(testSource), false);
  assert.equal(directQueryCallPattern.test(testSource), false);
  assert.equal(/postgres:\/\/|postgresql:\/\/|mysql:\/\/|mongodb:\/\//i.test(source), false);
  assert.equal(/sk-[A-Za-z0-9]{20,}/.test(source), false);
  assert.equal(/Bearer\s+[A-Za-z0-9._-]{20,}/i.test(source), false);
});
