'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const TASK925_FILES = [
  'src/engineerMobile/engineerAssignedAppointmentDetailProjectionService.js',
  'tests/engineerMobile/engineerAssignedAppointmentDetailProjectionService.unit.test.js',
  'tests/engineerMobile/engineerAssignedAppointmentDetailProjectionServiceClosure.static.test.js',
  'docs/task-925-engineer-mobile-assigned-appointment-detail-projection-injected-db-client-no-route-no-workflow.md',
];

const TASK926_FILES = [
  'src/engineerMobile/engineerAssignedAppointmentDetailProjectionHandler.js',
  'tests/engineerMobile/engineerAssignedAppointmentDetailProjectionHandler.http-behavior.unit.test.js',
  'tests/engineerMobile/engineerAssignedAppointmentDetailProjectionHandlerClosure.static.test.js',
  'docs/task-926-engineer-mobile-assigned-appointment-detail-http-handler-injected-db-client-no-route-no-workflow.md',
];

const TASK927_FILES = [
  'src/engineerMobile/engineerAssignedAppointmentDetailAppAdapter.js',
  'tests/engineerMobile/engineerAssignedAppointmentDetailAppAdapter.unit.test.js',
  'tests/engineerMobile/engineerAssignedAppointmentDetailAppAdapterClosure.static.test.js',
  'docs/task-927-engineer-mobile-assigned-appointment-detail-app-adapter-synthetic-app-only-no-public-route-no-listen.md',
];

const TASK928_FILES = [
  'tests/engineerMobile/engineerAssignedAppointmentDetailBranchClosure.static.test.js',
  'docs/task-928-engineer-mobile-assigned-appointment-detail-branch-closure-patch-inclusion-no-runtime-change.md',
];

const ALL_PATCH_FILES = [
  ...TASK925_FILES,
  ...TASK926_FILES,
  ...TASK927_FILES,
  ...TASK928_FILES,
];

const SERVICE_FILE = TASK925_FILES[0];
const HANDLER_FILE = TASK926_FILES[0];
const APP_ADAPTER_FILE = TASK927_FILES[0];
const TASK928_DOC = TASK928_FILES[1];

function absolutePath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(absolutePath(relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(absolutePath(relativePath));
}

function escaped(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

function gitStatusFor(files) {
  return execFileSync('git', ['status', '--short', '--', ...files], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
    .split('\n')
    .map((line) => line.trimEnd())
    .filter(Boolean);
}

test('Task925 through Task928 assigned appointment detail files are present', () => {
  for (const file of ALL_PATCH_FILES) {
    assert.equal(exists(file), true, `${file} should exist`);
  }
});

test('assigned appointment detail branch delegates service to handler to app adapter', () => {
  const serviceSource = read(SERVICE_FILE);
  const handlerSource = read(HANDLER_FILE);
  const appAdapterSource = read(APP_ADAPTER_FILE);

  assert.deepEqual(requireSpecifiers(handlerSource), ['./engineerAssignedAppointmentDetailProjectionService']);
  assert.match(handlerSource, /getEngineerAssignedAppointmentDetailProjection/);
  assert.deepEqual(requireSpecifiers(appAdapterSource), ['./engineerAssignedAppointmentDetailProjectionHandler']);
  assert.match(appAdapterSource, /createEngineerAssignedAppointmentDetailProjectionHandler/);
  assert.match(serviceSource, /typeof dbClient\.query !== 'function'/);
  assert.match(handlerSource, /const dbClient =/);
  assert.match(appAdapterSource, /typeof options\.dbClient\.query !== 'function'/);
});

test('detail app adapter remains injected synthetic app or router only', () => {
  const appAdapterSource = read(APP_ADAPTER_FILE);
  const unitTestSource = read(TASK927_FILES[1]);

  assert.match(appAdapterSource, /const target = options\.app \|\| options\.router/);
  assert.match(appAdapterSource, /target\.get\(path, handler\)/);
  assert.match(unitTestSource, /registers exactly one GET-like handler on injected synthetic app/);
  assert.match(unitTestSource, /listen should not be called/);
  assert.match(unitTestSource, /assert\.equal\(dbClient\.calls\.length, 0\)/);
  assert.doesNotMatch(appAdapterSource, /\.listen\s*\(|express\s*\(|Router\s*\(|createServer\(/i);
  assert.doesNotMatch(appAdapterSource, /dbClient\.query\s*\(/);
});

test('detail branch source imports no forbidden runtime dependencies', () => {
  const allowedSpecifiersByFile = {
    [SERVICE_FILE]: ['./engineerPreDepartureActionEligibility'],
    [HANDLER_FILE]: ['./engineerAssignedAppointmentDetailProjectionService'],
    [APP_ADAPTER_FILE]: ['./engineerAssignedAppointmentDetailProjectionHandler'],
  };

  for (const file of [SERVICE_FILE, HANDLER_FILE, APP_ADAPTER_FILE]) {
    const source = read(file);
    const allowedSpecifiers = allowedSpecifiersByFile[file];

    for (const specifier of requireSpecifiers(source)) {
      assert.equal(
        allowedSpecifiers.includes(specifier),
        true,
        `${file} imports unexpected dependency ${specifier}`,
      );
    }

    assert.doesNotMatch(source, /process\.env|console\.|fetch\(|axios|http\.request|https\.request|new Pool|createPool/i);
    assert.doesNotMatch(source, /\.listen\s*\(|express\s*\(|Router\s*\(|createServer\(/i);
  }
});

test('detail branch source remains read-only with no workflow action or finalAppointmentId path', () => {
  const source = [
    read(SERVICE_FILE),
    read(HANDLER_FILE),
    read(APP_ADAPTER_FILE),
  ].join('\n');

  assert.match(read(SERVICE_FILE), /readOnly:\s*true/);
  assert.doesNotMatch(source, /\binsert\s+into\b|\bupdate\s+\w+\s+set\b|\bdelete\s+from\b|BEGIN|COMMIT|ROLLBACK/i);
  assert.doesNotMatch(source, /markArrived|markStarted|submitCompletion|createReport|updateReport|approveReport|publishReport/i);
  assert.doesNotMatch(source, /createFieldServiceReport|createCompletionReport|startTravel\s*\(|arrival\s*\(|completeAppointment/i);
  assert.doesNotMatch(source, /finalAppointmentId|final_appointment_id/i);
  assert.doesNotMatch(source, /caseStatus\s*=|appointmentStatus\s*=|fieldServiceReport\s*=/);
});

test('detail projection allowlist excludes sensitive internal fields', () => {
  const serviceSource = read(SERVICE_FILE);
  const serviceUnitTestSource = read(TASK925_FILES[1]);

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
    assert.match(serviceSource, new RegExp(escaped(safeField)));
  }

  assert.match(serviceUnitTestSource, /assertNoSensitiveLeak/);
  assert.doesNotMatch(serviceSource, /['"](?:phone|mobile|tel|address|line_user_id|lineUserId|provider_raw_payload|providerRawPayload|token|secret|password|apiKey)['"]/i);
  assert.doesNotMatch(serviceSource, /['"](?:internal_note|internalNote|dispatcher_note|dispatcherNote|technician_private_note|billing_internal|settlement_internal|ai_raw_payload|finalAppointmentId|final_appointment_id)['"]/i);
});

test('no production route registration exists for assigned appointment detail branch', () => {
  const routeFiles = [
    'src/routes/index.js',
    'src/routes/engineerMobileRoutes.js',
    'src/app.js',
    'src/server.js',
  ];

  for (const file of routeFiles) {
    const source = read(file);

    assert.doesNotMatch(source, /engineerAssignedAppointmentDetailAppAdapter|registerEngineerAssignedAppointmentDetailRoute/);
    assert.doesNotMatch(source, /engineerAssignedAppointmentDetailProjectionHandler|handleEngineerAssignedAppointmentDetailProjectionRequest/);
    assert.doesNotMatch(source, /engineerAssignedAppointmentDetailProjectionService|getEngineerAssignedAppointmentDetailProjection/);
  }
});

test('Task928 evidence doc lists Task925 through Task928 final patch candidates and status', () => {
  const doc = read(TASK928_DOC);
  const statusLines = gitStatusFor(ALL_PATCH_FILES);

  assert.equal(statusLines.length, ALL_PATCH_FILES.length);

  for (const file of ALL_PATCH_FILES) {
    assert.match(doc, new RegExp(escaped(file)), `${file} should be listed in Task928 doc`);
  }

  for (const line of statusLines) {
    assert.match(doc, new RegExp(escaped(line)), `Task928 doc should record ${line}`);
  }

  assert.match(doc, /final patch candidate/i);
  assert.match(doc, /local \/ uncommitted \/ untracked/i);
  assert.match(doc, /No production source change/);
  assert.match(doc, /No runtime behavior change/);
  assert.match(doc, /No production route/);
  assert.match(doc, /No listen/);
  assert.match(doc, /No real DB/);
  assert.match(doc, /No auth\/session\/JWT runtime/);
  assert.match(doc, /No provider/);
  assert.match(doc, /No AI\/RAG/);
  assert.match(doc, /No billing\/settlement/);
  assert.match(doc, /No migration/);
  assert.match(doc, /No smoke\/shared runtime/);
  assert.match(doc, /No start travel \/ arrival \/ completion \/ report creation \/ report publish/);
  assert.match(doc, /No finalAppointmentId exposure or mutation/);
});
