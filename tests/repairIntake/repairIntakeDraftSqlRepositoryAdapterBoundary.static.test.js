'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  repository: 'src/repairIntake/repairIntakeDraftRepository.js',
  contract: 'src/repairIntake/repairIntakeDraftRepositoryContract.js',
  repositoryTest: 'tests/repairIntake/repairIntakeDraftRepository.unit.test.js',
  contractTest: 'tests/repairIntake/repairIntakeDraftRepositoryContract.unit.test.js',
  doc: 'docs/task-1888-repair-intake-draft-repository-sql-adapter-injected-db-client-no-db-execution.md',
});

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
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

test('Task1888 source test and doc files exist', () => {
  for (const file of Object.values(FILES)) {
    assert.equal(fs.existsSync(path.join(repoRoot, file)), true, `${file} should exist`);
  }
});

test('draft SQL repository remains injected dbClient only and parameterized', () => {
  const source = read(FILES.repository);

  assert.deepEqual(requireSpecifiers(source), []);
  assert.match(source, /const \{ dbClient \} = safeOptions;/);
  assert.match(source, /typeof dbClient\.query !== 'function'/);
  assert.match(source, /dbClient\.query\(statement\.text, statement\.params\)/);
  assert.match(source, /FROM repair_intake_drafts/);
  assert.match(source, /id = \$1/);
  assert.match(source, /params\.push\(lookup\.organizationId\)/);
  assert.match(source, /params\.push\(lookup\.tenantId\)/);

  for (const forbidden of [
    /process\.env/,
    /DATABASE_URL/,
    /new Pool|createPool|require\(['"]pg['"]\)/,
    /migrations?|psql|npm run db|db:migrate|db:seed/i,
    /\$\{lookup\./,
    /\$\{input\./,
  ]) {
    assert.doesNotMatch(source, forbidden);
  }
});

test('draft SQL repository preserves draft-boundary metadata without confirming duplicates', () => {
  const source = read(FILES.repository);
  const contract = read(FILES.contract);

  for (const marker of [
    'duplicateStatus',
    'duplicateCandidate',
    'reporterRef',
    'customerRef',
    'billingContactRef',
    'onSiteContactOverrideRef',
    'contactRoleSeparation',
    'platformAccepted',
    'importAccepted',
  ]) {
    assert.equal(source.includes(marker), true, `repository missing ${marker}`);
    assert.equal(contract.includes(marker), true, `contract missing ${marker}`);
  }

  assert.match(source, /safeDuplicateCandidate/);
  assert.match(source, /confirmedduplicate/);
  assert.match(source, /caseid/);
  assert.match(contract, /confirmedDuplicate/);
  assert.match(contract, /caseId/);
});

test('draft SQL repository boundary cannot create Case FSR publication provider AI or billing effects', () => {
  for (const file of [FILES.repository, FILES.contract]) {
    const source = read(file);

    for (const forbidden of [
      /require\([^)]*(app|server|routes|controllers|providers?|billing|ai|openai|line|sms|email)/i,
      /INSERT\s+INTO\s+(cases|field_service_reports|completion_reports)/i,
      /UPDATE\s+(cases|field_service_reports|completion_reports)/i,
      /DELETE\s+FROM\s+(cases|field_service_reports|completion_reports)/i,
      /create.*(Case|CompletionReport|FieldServiceReport)/,
      /publish\s*\(|revoke\s*\(|customer-visible publication/i,
      /finalAppointmentId\s*=|final_appointment_id\s*=/,
      /send(Line|Sms|SMS|Email|Webhook)|provider sending/i,
      /billing event|createSettlement|runSettlement|\bsettlement\b/i,
    ]) {
      assert.doesNotMatch(source, forbidden, file);
    }
  }
});

test('Task1888 behavior coverage locks synthetic dbClient and sanitized failure boundaries', () => {
  const repositoryTest = read(FILES.repositoryTest);
  const contractTest = read(FILES.contractTest);

  assert.match(repositoryTest, /valid lookup calls dbClient\.query once with parameterized scoped SELECT/);
  assert.match(repositoryTest, /safe metadata keeps draft-boundary fields without confirming duplicate or merging contacts/);
  assert.match(repositoryTest, /rejected query throws sanitized repository error/);
  assert.match(contractTest, /contract preserves safe draft-boundary fields and strips confirmed duplicate markers/);
  assert.match(contractTest, /thrown and rejected repository errors return sanitized read failure envelopes/);
});

test('Task1888 documentation records no DB migration smoke deploy provider AI billing or formal Case creation', () => {
  const doc = read(FILES.doc);

  assert.match(doc, /No real DB connection/);
  assert.match(doc, /No migration/);
  assert.match(doc, /No seed/);
  assert.match(doc, /No smoke/);
  assert.match(doc, /No deploy/);
  assert.match(doc, /No provider sending/);
  assert.match(doc, /No AI\/RAG/);
  assert.match(doc, /No billing/);
  assert.match(doc, /No formal Case creation/);
  assert.match(doc, /No Completion Report \/ Field Service Report creation/);
  assert.match(doc, /No finalAppointmentId mutation/);
});
