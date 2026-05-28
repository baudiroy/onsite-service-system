'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const ADAPTER_FILE = 'src/engineerMobile/engineerMobileVisitActionSqlRepositoryAdapter.js';
const TASK1865_UNIT_TEST = 'tests/engineerMobile/engineerMobileVisitActionSqlRepositoryAdapter.unit.test.js';
const TASK1865_BOUNDARY_TEST = 'tests/engineerMobile/engineerMobileVisitActionSqlRepositoryAdapterBoundary.static.test.js';
const CONTRACT_UNIT_TEST = 'tests/engineerMobile/engineerMobileVisitActionSqlRepositoryAdapterContract.unit.test.js';
const CONTRACT_BOUNDARY_TEST = 'tests/engineerMobile/engineerMobileVisitActionSqlRepositoryAdapterContractBoundary.static.test.js';
const TASK_DOC = 'docs/task-1866-engineer-mobile-visit-action-sql-repository-contract-hardening-no-db-execution.md';

function absolutePath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(absolutePath(relativePath), 'utf8');
}

function requireSpecifiers(source) {
  const specifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers;
}

function stripSqlStrings(source) {
  return source.replace(/`[\s\S]*?`/g, '');
}

test('Task1866 hardening files exist', () => {
  for (const file of [CONTRACT_UNIT_TEST, CONTRACT_BOUNDARY_TEST, TASK_DOC]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('contract hardening unit test uses only synthetic injected client and local contract modules', () => {
  const source = read(CONTRACT_UNIT_TEST);

  assert.deepEqual(requireSpecifiers(source).sort(), [
    '../../src/engineerMobile/engineerMobileVisitActionRepositoryContract',
    '../../src/engineerMobile/engineerMobileVisitActionSqlRepositoryAdapter',
    '../../src/engineerMobile/engineerMobileVisitActionWriterResultNormalizer',
    'node:assert/strict',
    'node:test',
  ].sort());

  for (const pattern of [
    /require\(['"]pg['"]\)/,
    /DATABASE_URL/,
    /process\.env/,
    /child_process/,
    /\bpsql\b/i,
    /db:migrate/i,
    /fetch\s*\(/,
    /\.listen\s*\(/,
  ]) {
    assert.doesNotMatch(source, pattern, `contract unit test contains forbidden pattern ${pattern}`);
  }
});

test('SQL adapter source still has no direct env pool app server migration provider or runtime execution path', () => {
  const source = read(ADAPTER_FILE);

  for (const pattern of [
    /require\(['"]pg['"]\)/,
    /require\(['"]node:net['"]\)/,
    /require\(['"]node:http['"]\)/,
    /require\(['"]node:https['"]\)/,
    /\bPool\b/,
    /DATABASE_URL/,
    /process\.env/,
    /src\/app/,
    /src\/server/,
    /\bapp\.js\b/,
    /\bserver\.js\b/,
    /db:migrate/i,
    /\bpsql\b/i,
    /\bseed\b/i,
    /\bdeploy\b/i,
    /\bsmoke\b/i,
    /\bprovider\b/i,
    /\bwebhook\b/i,
    /\bsend[A-Z]\w*\s*\(/,
  ]) {
    assert.doesNotMatch(source, pattern, `adapter contains forbidden runtime boundary pattern ${pattern}`);
  }
});

test('SQL adapter active JavaScript does not create reports publish customer data or mutate final appointment', () => {
  const activeJs = stripSqlStrings(read(ADAPTER_FILE));

  for (const pattern of [
    /CompletionReport/,
    /completionReport/,
    /FieldServiceReport/,
    /fieldServiceReport/,
    /finalAppointmentId/,
    /final_appointment_id/,
    /customerVisiblePublication/,
    /publish/i,
    /approve/i,
    /createFieldServiceReport/i,
  ]) {
    assert.doesNotMatch(activeJs, pattern, `adapter active JS contains forbidden product behavior ${pattern}`);
  }
});

test('SQL statements are bounded to appointment migration-023 fields and audit_logs insert only', () => {
  const source = read(ADAPTER_FILE);

  assert.match(source, /UPDATE appointments AS a/);
  assert.match(source, /FROM cases AS c/);
  assert.match(source, /INSERT INTO audit_logs/);

  for (const pattern of [
    /\bDELETE\s+FROM\b/i,
    /\bDROP\b/i,
    /\bALTER\b/i,
    /\bCREATE\b/i,
    /\bTRUNCATE\b/i,
    /\bfield_service_reports\b/i,
    /\bcompletion_reports\b/i,
    /\bprovider_payload\b/i,
    /\bcustomer_phone\b/i,
    /\bcustomer_address\b/i,
    /\bline_user_id\b/i,
  ]) {
    assert.doesNotMatch(source, pattern, `adapter SQL contains forbidden pattern ${pattern}`);
  }
});

test('hardening docs record Phase 1 stop and no-execution boundary', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'Task1866',
    'Task1865',
    'No DB connection',
    'No SQL execution',
    'No psql',
    'No npm run db',
    'No migration',
    'No seed',
    'No runtime start',
    'No Zeabur',
    'No deploy',
    'No smoke',
    'No provider sending',
    'No Completion Report / Field Service Report creation',
    'No finalAppointmentId mutation',
    'No customer-visible publication behavior',
    'Stop before Task1867',
    ADAPTER_FILE,
    TASK1865_UNIT_TEST,
    TASK1865_BOUNDARY_TEST,
    CONTRACT_UNIT_TEST,
    CONTRACT_BOUNDARY_TEST,
  ]) {
    assert.equal(doc.includes(phrase), true, `doc should include ${phrase}`);
  }
});
