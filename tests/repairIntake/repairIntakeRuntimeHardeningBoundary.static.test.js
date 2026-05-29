'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const HARDENED_FILES = Object.freeze([
  'src/repairIntake/repairIntakeDraftToCaseSafeRouteBoundary.js',
  'src/repairIntake/repairIntakeDraftCasePlanningService.js',
  'src/repairIntake/repairIntakeDraftCaseCandidateBuilder.js',
  'src/repairIntake/repairIntakeContactRoleDtoGuard.js',
  'src/repairIntake/repairIntakeDuplicateCandidateGuard.js',
  'src/repairIntake/repairIntakeDraftToCasePlanningAuditBoundary.js',
]);

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

test('Task1896 hardened files exist', () => {
  for (const file of HARDENED_FILES) {
    assert.equal(fs.existsSync(path.join(repoRoot, file)), true, `${file} should exist`);
  }
});

test('safe runtime boundary remains no DB no migration no smoke no provider AI billing', () => {
  for (const file of HARDENED_FILES) {
    const source = read(file);

    for (const forbidden of [
      /process\.env|DATABASE_URL|JWT_SECRET/,
      /require\(['"]pg['"]\)|new Pool|createPool|dbClient|query\(/,
      /migrations?|psql|npm run db|db:migrate|db:seed/i,
      /smoke|zeabur/i,
      /router\.|app\.|server\.|express|listen\(/,
      /providerClient|providerAdapter|lineClient|smsClient|emailClient|webhookClient/i,
      /openai|aiProvider|rag|vector/i,
      /billingProvider|billingClient|settlement|payment|invoice/i,
    ]) {
      assert.doesNotMatch(source, forbidden, `${file} matched ${forbidden}`);
    }
  }
});

test('safe runtime boundary keeps Case submit FSR final appointment and publication behavior out', () => {
  for (const file of HARDENED_FILES) {
    const source = read(file);

    for (const forbidden of [
      /case\/submit/,
      /createCaseFromDraft|submitDraftToCase|linkDraftToCase|markDraftLinkedToCase/i,
      /INSERT\s+INTO\s+cases|UPDATE\s+cases|DELETE\s+FROM\s+cases/i,
      /Completion Report|Field Service Report|field_service_reports|completion_reports/i,
      /finalAppointmentId\s*=|final_appointment_id\s*=/,
      /customer-visible publication|publish\s*\(|revoke\s*\(/i,
      /mergeDraft|merge_draft|confirmedDuplicate\s*=/,
    ]) {
      assert.doesNotMatch(source, forbidden, `${file} matched ${forbidden}`);
    }
  }
});

test('runtime hardening source keeps explicit unsafe text filters', () => {
  const routeSource = read('src/repairIntake/repairIntakeDraftToCaseSafeRouteBoundary.js');
  const planningSource = read('src/repairIntake/repairIntakeDraftCasePlanningService.js');
  const candidateSource = read('src/repairIntake/repairIntakeDraftCaseCandidateBuilder.js');
  const contactSource = read('src/repairIntake/repairIntakeContactRoleDtoGuard.js');

  for (const source of [routeSource, planningSource, candidateSource, contactSource]) {
    assert.match(source, /UNSAFE_TEXT_PATTERNS/);
    assert.match(source, /textHasUnsafeMarker/);
  }

  assert.match(routeSource, /safeReasonCode/);
  assert.match(routeSource, /safeActions/);
  assert.match(planningSource, /safeReasonCode/);
  assert.match(planningSource, /safeRequiredActions/);
  assert.match(candidateSource, /safeRequiredActions/);
  assert.match(contactSource, /safeStringValue/);
});
