'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const SERVICE_FILE = 'src/engineerMobile/engineerAssignedAppointmentDetailProjectionService.js';
const UNIT_TEST_FILE = 'tests/engineerMobile/engineerAssignedAppointmentDetailProjectionService.unit.test.js';
const CLOSURE_TEST_FILE = 'tests/engineerMobile/engineerAssignedAppointmentDetailProjectionServiceClosure.static.test.js';
const TASK_DOC = 'docs/task-925-engineer-mobile-assigned-appointment-detail-projection-injected-db-client-no-route-no-workflow.md';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
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

test('Task925 source test and doc files exist', () => {
  for (const file of [SERVICE_FILE, UNIT_TEST_FILE, CLOSURE_TEST_FILE, TASK_DOC]) {
    assert.equal(exists(file), true, `${file} should exist`);
  }
});

test('detail projection service has no runtime side-effect imports or forbidden dependencies', () => {
  const source = read(SERVICE_FILE);

  assert.deepEqual(requireSpecifiers(source), ['./engineerPreDepartureActionEligibility']);
  assert.doesNotMatch(
    source,
    /require\(['"].*(?:pg|database|pool|routes?|controllers?|server|app|listen|bootstrap|repositories?|transaction|baseRepository|auth|session|jwt|provider|line|sms|email|push|webhook|openai|ai|rag|vector|search|billing|settlement|env|config|credential|logger|network|smoke|migration|admin)['"]\)/i,
  );
  assert.doesNotMatch(source, /process\.env|console\.|fetch\(|axios|http\.request|https\.request|new Pool|createPool/i);
});

test('detail projection service remains read-only and has no workflow mutation path', () => {
  const source = read(SERVICE_FILE);

  assert.match(source, /readOnly:\s*true/);
  assert.match(source, /dbClient\.query\(querySpec\)/);
  assert.doesNotMatch(source, /\binsert\s+into\b|\bupdate\s+\w+\s+set\b|\bdelete\s+from\b|BEGIN|COMMIT|ROLLBACK/i);
  assert.doesNotMatch(source, /markArrived|markStarted|submitCompletion|createReport|updateReport|approveReport|publishReport/i);
  assert.doesNotMatch(source, /createFieldServiceReport|createCompletionReport|startTravel\s*\(|arrival\s*\(|completeAppointment/i);
  assert.doesNotMatch(source, /finalAppointmentId\s*=|caseStatus\s*=|appointmentStatus\s*=|fieldServiceReport\s*=/);
});

test('detail projection source locks context appointment and assigned engineer scope', () => {
  const source = read(SERVICE_FILE);

  assert.match(source, /contextOrganizationId/);
  assert.match(source, /contextEngineerId/);
  assert.match(source, /normalizeAppointmentId/);
  assert.match(source, /READ_PERMISSION/);
  assert.match(source, /organizationScopeMatched/);
  assert.match(source, /engineerAssignmentScopeMatched/);
  assert.match(source, /assigned_engineer_id/);
  assert.match(source, /appointment_id = \$3/);
  assert.match(source, /isExpectedRow/);
});

test('detail projection allowlist excludes forbidden sensitive and internal fields', () => {
  const source = read(SERVICE_FILE);
  const unitTestSource = read(UNIT_TEST_FILE);

  for (const safeField of [
    'appointmentId',
    'caseReference',
    'appointmentWindow',
    'scheduledStart',
    'scheduledEnd',
    'serviceType',
    'customerDisplayName',
    'locationLabel',
    'status',
    'priorityLabel',
    'serviceSummary',
    'publicCustomerNotes',
    'checklistPreview',
    'canOpenDetails',
    'canStartTravel',
    'canRecordArrival',
    'canPrepareCompletionDraft',
  ]) {
    assert.match(source, new RegExp(safeField));
  }

  assert.match(unitTestSource, /assertNoSensitiveLeak/);
  assert.doesNotMatch(source, /['"](?:phone|mobile|tel|address|line_user_id|lineUserId|provider_raw_payload|providerRawPayload|token|secret|password|apiKey)['"]/i);
  assert.doesNotMatch(source, /['"](?:internal_note|internalNote|dispatcher_note|dispatcherNote|technician_private_note|billing_internal|settlement_internal|ai_raw_payload|finalAppointmentId)['"]/i);
});

test('unit coverage locks fail-closed safe-deny and no-mutation behavior', () => {
  const source = read(UNIT_TEST_FILE);

  assert.match(source, /missing dbClient fails closed/);
  assert.match(source, /missing engineerContext fails closed/);
  assert.match(source, /missing organizationId fails closed/);
  assert.match(source, /missing engineerId fails closed/);
  assert.match(source, /missing or invalid appointment id fails closed/);
  assert.match(source, /unauthorized engineer context fails closed/);
  assert.match(source, /organization mismatch fails closed/);
  assert.match(source, /non-assigned engineer row fails closed/);
  assert.match(source, /query error returns generic safe deny/);
  assert.match(source, /valid authorized row returns allowlisted mobile-safe detail projection/);
  assert.match(source, /synthetic DB client proves no mutation methods are called/);
  assert.match(source, /input context and row objects are not mutated/);
  assert.doesNotMatch(source, /DATABASE_URL|npm run db:migrate|psql|OpenAI|LINE_CHANNEL_ACCESS_TOKEN/i);
});

test('Task925 evidence doc records no route no workflow and forbidden scope', () => {
  const doc = read(TASK_DOC);

  for (const file of [SERVICE_FILE, UNIT_TEST_FILE, CLOSURE_TEST_FILE]) {
    assert.match(doc, new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(doc, /Injected DB Client/);
  assert.match(doc, /No Route/);
  assert.match(doc, /No Workflow/);
  assert.match(doc, /No route\/controller\/API rollout/);
  assert.match(doc, /No real DB/);
  assert.match(doc, /No auth\/session\/JWT runtime/);
  assert.match(doc, /No provider sending/);
  assert.match(doc, /No AI\/RAG/);
  assert.match(doc, /No billing\/settlement/);
  assert.match(doc, /No migration/);
  assert.match(doc, /No smoke\/shared runtime/);
  assert.match(doc, /No check-in\/start travel\/arrival\/completion\/report creation\/report publish/);
  assert.match(doc, /finalAppointmentId/);
});
