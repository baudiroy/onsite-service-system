'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  engineerMobileReadModelRows,
} = require('./fixtures/engineerMobileReadModelRows.fixture');

const repoRoot = path.resolve(__dirname, '../..');
const migrationFile = path.join(repoRoot, 'migrations/022_create_engineer_mobile_read_model.sql');
const fixtureFile = path.join(repoRoot, 'tests/engineerMobile/fixtures/engineerMobileReadModelRows.fixture.js');
const docFile = path.join(repoRoot, 'docs/task-720-engineer-mobile-read-model-sanitized-fixture-contract-no-runtime.md');

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function uncommentedSql(source) {
  return source
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('--'))
    .join('\n');
}

function columnNames(sql) {
  const tableMatch = sql.match(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+engineer_mobile_task_read_models\s*\(([\s\S]*?)\n\);/i);

  assert.ok(tableMatch, 'table body not found');

  return tableMatch[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('CONSTRAINT'))
    .map((line) => line.replace(/,$/, '').split(/\s+/)[0])
    .filter((name) => /^[a-z_][a-z0-9_]*$/i.test(name));
}

function assertIncludesAll(source, values) {
  for (const value of values) {
    assert.equal(source.includes(value), true, `missing ${value}`);
  }
}

function flattenedValues(value) {
  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenedValues(item));
  }

  if (value && typeof value === 'object') {
    return Object.values(value).flatMap((item) => flattenedValues(item));
  }

  return [String(value)];
}

test('fixture contract files exist', () => {
  assert.equal(fs.existsSync(fixtureFile), true);
  assert.equal(fs.existsSync(docFile), true);
});

test('fixture exports synthetic read model rows only', () => {
  assert.equal(Array.isArray(engineerMobileReadModelRows), true);
  assert.equal(engineerMobileReadModelRows.length >= 4, true);

  for (const row of engineerMobileReadModelRows) {
    assert.equal(row && typeof row, 'object');
    assert.equal(Object.isFrozen(row), true);
  }
});

test('fixture row fields align with migration 022 read model fields', () => {
  const migrationColumns = columnNames(uncommentedSql(read(migrationFile))).sort();

  for (const row of engineerMobileReadModelRows) {
    assert.deepEqual(Object.keys(row).sort(), migrationColumns);
  }
});

test('fixture covers assigned multi-appointment completed and exclusion scenarios', () => {
  const rowsByCase = new Map();

  for (const row of engineerMobileReadModelRows) {
    if (!rowsByCase.has(row.case_id)) {
      rowsByCase.set(row.case_id, []);
    }
    rowsByCase.get(row.case_id).push(row);
  }

  assert.equal(engineerMobileReadModelRows.some((row) => row.assigned_engineer_id === 'eng_fixture_primary'), true);
  assert.equal(engineerMobileReadModelRows.some((row) => row.status === 'completed'), true);
  assert.equal(engineerMobileReadModelRows.some((row) => row.service_summary.includes('finalAppointmentId is resolved by backend/system outside this read model')), true);
  assert.equal(engineerMobileReadModelRows.some((row) => row.service_summary.includes('Unassigned source appointment must be excluded')), true);
  assert.equal(engineerMobileReadModelRows.some((row) => row.service_summary.includes('internal notes are intentionally excluded')), true);
  assert.equal([...rowsByCase.values()].some((rows) => rows.length > 1), true);
});

test('fixture supports one case one formal completion report concept with multiple appointments allowed', () => {
  const sameCaseRows = engineerMobileReadModelRows.filter((row) => row.case_id === 'case_fixture_multi_visit_001');

  assert.equal(sameCaseRows.length, 2);
  assert.deepEqual(sameCaseRows.map((row) => row.appointment_id), [
    'apt_fixture_multi_visit_001',
    'apt_fixture_multi_visit_002',
  ]);
  assert.equal(sameCaseRows.some((row) => row.service_summary.includes('not a formal completion report')), true);
  assert.equal(sameCaseRows.some((row) => row.checklist_summary.some((item) => item.key === 'one_formal_report_per_case')), true);
  assert.equal(sameCaseRows.some((row) => Object.prototype.hasOwnProperty.call(row, 'field_service_report_id')), false);
});

test('fixture does not introduce forbidden customer-sensitive fields', () => {
  const forbiddenFields = [
    'raw_phone',
    'raw_address',
    'raw_line_user_id',
    'line_user_id',
    'token',
    'secret',
    'password',
    'database_url',
    'internal_note',
    'audit_log',
    'ai_raw_payload',
    'billing_internal',
    'settlement_internal',
    'field_service_report_id',
    'full_customer_payload',
  ];

  for (const row of engineerMobileReadModelRows) {
    for (const forbidden of forbiddenFields) {
      assert.equal(Object.prototype.hasOwnProperty.call(row, forbidden), false, `forbidden field ${forbidden}`);
    }
  }
});

test('fixture data contains no real-looking sensitive values or credentials', () => {
  const combinedValues = flattenedValues(engineerMobileReadModelRows).join('\n');
  const combinedSource = `${read(fixtureFile)}\n${read(docFile)}`;

  assert.equal(/postgres:\/\/|postgresql:\/\/|mysql:\/\/|mongodb:\/\//i.test(combinedSource), false);
  assert.equal(/sk-[A-Za-z0-9_-]{12,}/.test(combinedSource), false);
  assert.equal(/Bearer\s+[A-Za-z0-9._-]{12,}/i.test(combinedSource), false);
  assert.equal(/09\d{2}[-\s]?\d{3}[-\s]?\d{3}/.test(combinedValues), false);
  assert.equal(/line_user/i.test(combinedValues), false);
});

test('task document explains purpose non-runtime scope redaction and future unit-test use', () => {
  const doc = read(docFile);

  assertIncludesAll(doc, [
    'sanitized synthetic fixture contract',
    'unit/static tests only',
    'no DB execution',
    'no migration dry-run',
    'no runtime access',
    'Redaction Rules',
    'Future unit tests may import this fixture',
  ]);
});
