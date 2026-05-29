'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  guard: 'src/repairIntake/repairIntakeDuplicateCandidateGuard.js',
  eligibility: 'src/repairIntake/repairIntakeDraftCaseEligibility.js',
  guardTest: 'tests/repairIntake/repairIntakeDuplicateCandidateGuard.unit.test.js',
  eligibilityTest: 'tests/repairIntake/repairIntakeDraftCaseEligibility.unit.test.js',
  doc: 'docs/task-1890-repair-intake-duplicate-candidate-guard.md',
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

test('Task1890 source test and doc files exist', () => {
  for (const file of Object.values(FILES)) {
    assert.equal(fs.existsSync(path.join(repoRoot, file)), true, `${file} should exist`);
  }
});

test('duplicate candidate guard is local no-DB no-route and no-provider', () => {
  const source = read(FILES.guard);

  assert.deepEqual(requireSpecifiers(source), []);
  assert.match(source, /evaluateRepairIntakeDuplicateCandidateGuard/);
  assert.match(source, /duplicate_signal_missing/);
  assert.match(source, /duplicate_candidate_review_required/);
  assert.match(source, /duplicate_confirmed/);

  for (const forbidden of [
    /DATABASE_URL|process\.env/,
    /dbClient|new Pool|createPool|require\(['"]pg['"]\)|query\(/,
    /migrations?|psql|npm run db|db:migrate|db:seed/i,
    /require\(['"][^'"]*(app|server|routes?|controllers?)[^'"]*['"]\)/i,
    /create[A-Za-z0-9]*(Route|Router|Controller)|mount[A-Za-z0-9]*(Route|Router)|register[A-Za-z0-9]*Route/i,
    /createCaseFromDraft|linkDraftToCase|markDraftLinkedToCase|INSERT\s+INTO\s+cases|UPDATE\s+cases/i,
    /providerClient|providerAdapter|sendProvider|lineClient|smsClient|emailClient|webhookClient/i,
    /aiProvider|openai|rag|vector/i,
    /billing|settlement|payment|invoice/i,
    /finalAppointmentId\s*=|final_appointment_id\s*=/,
  ]) {
    assert.doesNotMatch(source, forbidden);
  }
});

test('eligibility uses duplicate guard instead of raw duplicate status branching', () => {
  const eligibility = read(FILES.eligibility);

  assert.match(eligibility, /evaluateRepairIntakeDuplicateCandidateGuard/);
  assert.doesNotMatch(eligibility, /UNRESOLVED_DUPLICATE_STATUSES/);
  assert.doesNotMatch(eligibility, /CONFIRMED_DUPLICATE_STATUSES/);
});

test('Task1890 behavior coverage locks advisory candidate and fail-closed semantics', () => {
  const guardTest = read(FILES.guardTest);
  const eligibilityTest = read(FILES.eligibilityTest);

  assert.match(guardTest, /clear no-duplicate path/);
  assert.match(guardTest, /duplicate candidate remains advisory/);
  assert.match(guardTest, /not automatically inferred as confirmed duplicate/);
  assert.match(guardTest, /missing duplicate signal fails closed/);
  assert.match(guardTest, /organization mismatch blocks safely/);
  assert.match(eligibilityTest, /missing duplicate signal requires review/);
});

test('Task1890 documentation records no Case link merge DB route smoke deploy provider AI or billing work', () => {
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
  assert.match(doc, /No formal Case creation/);
  assert.match(doc, /No draft-to-formal-Case linking/);
  assert.match(doc, /No draft merge/);
  assert.match(doc, /No Completion Report \/ Field Service Report mutation/);
  assert.match(doc, /No finalAppointmentId mutation/);
});
