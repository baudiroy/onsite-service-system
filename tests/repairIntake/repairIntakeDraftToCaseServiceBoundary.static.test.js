'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  service: 'src/repairIntake/repairIntakeDraftCasePlanningService.js',
  unitTest: 'tests/repairIntake/repairIntakeDraftCasePlanningService.unit.test.js',
  doc: 'docs/task-1889-repair-intake-draft-to-case-service-runtime-wiring-no-route.md',
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

test('Task1889 source test and doc files exist', () => {
  for (const file of Object.values(FILES)) {
    assert.equal(fs.existsSync(path.join(repoRoot, file)), true, `${file} should exist`);
  }
});

test('draft-to-case service boundary stays no-route no-DB and injected only', () => {
  const source = read(FILES.service);
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers.sort(), [
    './repairIntakeDraftCaseCandidateBuilder',
    './repairIntakeDraftCaseEligibility',
  ].sort());
  assert.match(source, /resolveReaderFunction/);
  assert.match(source, /draftReader/);
  assert.match(source, /planDraftToCase/);

  for (const forbidden of [
    /DATABASE_URL|process\.env/,
    /dbClient|new Pool|createPool|require\(['"]pg['"]\)|query\(/,
    /migrations?|psql|npm run db|db:migrate|db:seed/i,
    /require\(['"][^'"]*(app|server|routes?|controllers?)[^'"]*['"]\)/i,
    /create[A-Za-z0-9]*(Route|Router|Controller)|mount[A-Za-z0-9]*(Route|Router)|register[A-Za-z0-9]*Route/i,
    /caseCreator|createCaseFromDraft|submitDraftToCase|INSERT\s+INTO\s+cases/i,
    /providerClient|providerAdapter|sendProvider|lineClient|smsClient|emailClient|webhookClient/i,
    /aiProvider|openai|rag|vector/i,
    /billing|settlement|payment|invoice/i,
  ]) {
    assert.doesNotMatch(source, forbidden);
  }
});

test('draft-to-case service boundary hardens organization and sanitizer behavior', () => {
  const source = read(FILES.service);
  const unitTest = read(FILES.unitTest);

  assert.match(source, /organization_scope_mismatch/);
  assert.match(source, /draftMatchesLookupOrganization/);
  assert.match(source, /sanitizeValue/);
  assert.match(source, /UNSAFE_FIELD_NAMES/);

  assert.match(unitTest, /organization mismatch fails closed before candidate builder is called/);
  assert.match(unitTest, /custom injected candidate builder output is sanitized/);
  assert.match(unitTest, /duplicate candidate metadata stays advisory/);
});

test('Task1889 documentation records no route DB smoke deploy provider AI billing or formal Case creation', () => {
  const doc = read(FILES.doc);

  assert.match(doc, /No route/);
  assert.match(doc, /No DB/);
  assert.match(doc, /No migration/);
  assert.match(doc, /No seed/);
  assert.match(doc, /No smoke/);
  assert.match(doc, /No deploy/);
  assert.match(doc, /No provider sending/);
  assert.match(doc, /No AI\/RAG/);
  assert.match(doc, /No billing/);
  assert.match(doc, /No formal Case creation/);
  assert.match(doc, /No draft-to-Case persistence/);
  assert.match(doc, /No Completion Report \/ Field Service Report creation/);
  assert.match(doc, /No finalAppointmentId mutation/);
});
