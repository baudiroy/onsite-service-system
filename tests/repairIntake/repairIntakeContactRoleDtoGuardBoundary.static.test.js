'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  guard: 'src/repairIntake/repairIntakeContactRoleDtoGuard.js',
  candidateBuilder: 'src/repairIntake/repairIntakeDraftCaseCandidateBuilder.js',
  guardTest: 'tests/repairIntake/repairIntakeContactRoleDtoGuard.unit.test.js',
  candidateTest: 'tests/repairIntake/repairIntakeDraftCaseCandidateBuilder.unit.test.js',
  doc: 'docs/task-1892-repair-intake-reporter-customer-billing-contact-dto-guard.md',
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

test('Task1892 source test and doc files exist', () => {
  for (const file of Object.values(FILES)) {
    assert.equal(fs.existsSync(path.join(repoRoot, file)), true, `${file} should exist`);
  }
});

test('contact role DTO guard is local no-DB no-provider and no-mutation', () => {
  const source = read(FILES.guard);

  assert.deepEqual(requireSpecifiers(source), []);
  assert.match(source, /normalizeRepairIntakeContactRoleDto/);
  assert.match(source, /reporterRef/);
  assert.match(source, /customerRef/);
  assert.match(source, /billingContactRef/);
  assert.match(source, /onSiteContactOverrideRef/);

  for (const forbidden of [
    /DATABASE_URL|process\.env/,
    /dbClient|new Pool|createPool|require\(['"]pg['"]\)|query\(/,
    /migrations?|psql|npm run db|db:migrate|db:seed/i,
    /createCaseFromDraft|submitDraftToCase|linkDraftToCase|markDraftLinkedToCase/i,
    /INSERT\s+INTO|UPDATE\s+|DELETE\s+FROM/i,
    /providerClient|providerAdapter|sendProvider|lineClient|smsClient|emailClient|webhookClient/i,
    /aiProvider|openai|rag|vector/i,
    /billingProvider|settlement|payment|invoice/i,
    /finalAppointmentId\s*=|final_appointment_id\s*=/,
  ]) {
    assert.doesNotMatch(source, forbidden);
  }
});

test('candidate builder uses contact guard without adding DB route provider or billing dependencies', () => {
  const source = read(FILES.candidateBuilder);

  assert.match(source, /repairIntakeContactRoleDtoGuard/);
  assert.match(source, /onSiteContactOverrideRef/);
  assert.doesNotMatch(source, /dbClient|DATABASE_URL|process\.env|createCaseFromDraft|providerClient|aiProvider|billingProvider/);
});

test('Task1892 behavior coverage locks role separation and safe contact summary rules', () => {
  const guardTest = read(FILES.guardTest);
  const candidateTest = read(FILES.candidateTest);

  assert.match(guardTest, /all contact roles remain distinct/);
  assert.match(guardTest, /same person in multiple roles is represented explicitly/);
  assert.match(guardTest, /raw phone and address are excluded/);
  assert.match(guardTest, /billing contact reporter and on-site override are not treated as customer/);
  assert.match(candidateTest, /on-site contact override separately/);
  assert.match(candidateTest, /safe contact summary but strips raw phone address payloads/);
});

test('Task1892 documentation records no Case link DB route provider AI billing or contact mutation work', () => {
  const doc = read(FILES.doc);

  assert.match(doc, /No DB/);
  assert.match(doc, /No route/);
  assert.match(doc, /No migration/);
  assert.match(doc, /No seed/);
  assert.match(doc, /No smoke/);
  assert.match(doc, /No deploy/);
  assert.match(doc, /No provider sending/);
  assert.match(doc, /No AI\/RAG/);
  assert.match(doc, /No billing/);
  assert.match(doc, /No contact mutation/);
  assert.match(doc, /No formal Case creation/);
  assert.match(doc, /No draft-to-formal-Case linking/);
  assert.match(doc, /No Completion Report \/ Field Service Report mutation/);
  assert.match(doc, /No finalAppointmentId mutation/);
});
