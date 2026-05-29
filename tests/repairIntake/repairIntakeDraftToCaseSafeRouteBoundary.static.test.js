'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  boundary: 'src/repairIntake/repairIntakeDraftToCaseSafeRouteBoundary.js',
  unitTest: 'tests/repairIntake/repairIntakeDraftToCaseSafeRouteBoundary.unit.test.js',
  doc: 'docs/task-1891-repair-intake-draft-to-case-route-safe-runtime-boundary.md',
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

test('Task1891 source test and doc files exist', () => {
  for (const file of Object.values(FILES)) {
    assert.equal(fs.existsSync(path.join(repoRoot, file)), true, `${file} should exist`);
  }
});

test('safe route boundary remains dependency-injected and no-DB no-provider no-submit', () => {
  const source = read(FILES.boundary);

  assert.deepEqual(requireSpecifiers(source), []);
  assert.match(source, /createRepairIntakeDraftToCaseSafeRouteBoundary/);
  assert.match(source, /planDraftToCase/);
  assert.match(source, /caseId: null/);
  assert.match(source, /\/repair-intake\/drafts\/:draftId\/case\/plan/);
  assert.doesNotMatch(source, /case\/submit/);

  for (const forbidden of [
    /DATABASE_URL|process\.env/,
    /dbClient|new Pool|createPool|require\(['"]pg['"]\)|query\(/,
    /migrations?|psql|npm run db|db:migrate|db:seed/i,
    /createCaseFromDraft|submitDraftToCase|linkDraftToCase|markDraftLinkedToCase/i,
    /INSERT\s+INTO\s+cases|UPDATE\s+cases|DELETE\s+FROM\s+cases/i,
    /Completion Report|Field Service Report|field_service_reports|completion_reports/i,
    /finalAppointmentId\s*=|final_appointment_id\s*=/,
    /providerClient|providerAdapter|sendProvider|lineClient|smsClient|emailClient|webhookClient/i,
    /aiProvider|openai|rag|vector/i,
    /billing|settlement|payment|invoice/i,
    /customer-visible publication|publish\s*\(|revoke\s*\(/i,
  ]) {
    assert.doesNotMatch(source, forbidden);
  }
});

test('Task1891 behavior coverage locks safe allow deny and failure paths', () => {
  const unitTest = read(FILES.unitTest);

  assert.match(unitTest, /safe allow path calls planning service/);
  assert.match(unitTest, /missing draft id fails before planning service/);
  assert.match(unitTest, /missing context fails closed/);
  assert.match(unitTest, /organization mismatch maps to safe deny/);
  assert.match(unitTest, /duplicate review-required plan maps to non-creating review response/);
  assert.match(unitTest, /missing planning dependency returns unavailable/);
  assert.match(unitTest, /planning service failure is sanitized/);
});

test('Task1891 documentation records no Case creation route submit DB smoke deploy provider AI or billing work', () => {
  const doc = read(FILES.doc);

  assert.match(doc, /No formal Case creation/);
  assert.match(doc, /No draft-to-formal-Case linking/);
  assert.match(doc, /No submit route/);
  assert.match(doc, /No DB/);
  assert.match(doc, /No migration/);
  assert.match(doc, /No seed/);
  assert.match(doc, /No smoke/);
  assert.match(doc, /No deploy/);
  assert.match(doc, /No provider sending/);
  assert.match(doc, /No AI\/RAG/);
  assert.match(doc, /No billing/);
  assert.match(doc, /No Completion Report \/ Field Service Report creation/);
  assert.match(doc, /No finalAppointmentId mutation/);
});
