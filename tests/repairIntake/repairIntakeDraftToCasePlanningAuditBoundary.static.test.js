'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const sourcePath = path.join(
  repoRoot,
  'src/repairIntake/repairIntakeDraftToCasePlanningAuditBoundary.js',
);

function readSource() {
  return fs.readFileSync(sourcePath, 'utf8');
}

test('planning audit boundary file exists and exports expected factory/builders', () => {
  const source = readSource();

  assert.match(source, /buildRepairIntakeDraftToCasePlanningAuditEvent/);
  assert.match(source, /createRepairIntakeDraftToCasePlanningAuditBoundary/);
  assert.match(source, /recordPlanningDecision/);
  assert.match(source, /visibility: 'internal_only'/);
});

test('planning audit boundary stays injected and avoids DB route provider AI billing coupling', () => {
  const source = readSource();

  assert.doesNotMatch(source, /require\(/);

  for (const forbidden of [
    /process\.env|DATABASE_URL|JWT_SECRET/,
    /require\(['"]pg['"]\)|new Pool|createPool|dbClient|query\(/,
    /migrations?|psql|npm run db|db:migrate|db:seed/i,
    /router\.|app\.|server\.|express|listen\(/,
    /createCaseFromDraft|submitDraftToCase|linkDraftToCase|markDraftLinkedToCase/i,
    /INSERT\s+INTO|UPDATE\s+|DELETE\s+FROM/i,
    /providerClient|providerAdapter|lineClient|smsClient|emailClient|webhookClient/i,
    /openai|aiProvider|rag|vector/i,
    /billingProvider|billingClient|settlement|payment|invoice/i,
    /Completion Report|Field Service Report|field_service_reports|completion_reports/i,
    /finalAppointmentId\s*=|final_appointment_id\s*=/,
    /customer-visible publication|publish\s*\(|revoke\s*\(/i,
  ]) {
    assert.doesNotMatch(source, forbidden);
  }
});
