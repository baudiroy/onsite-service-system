'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const TASK921_FILES = [
  'src/engineerMobile/engineerAssignedAppointmentsProjectionService.js',
  'tests/engineerMobile/engineerAssignedAppointmentsProjectionService.unit.test.js',
  'tests/engineerMobile/engineerAssignedAppointmentsProjectionServiceClosure.static.test.js',
  'docs/task-921-engineer-mobile-read-only-assigned-appointments-projection-injected-db-client-no-route-no-migration.md',
];

const TASK922_FILES = [
  'src/engineerMobile/engineerAssignedAppointmentsProjectionHandler.js',
  'tests/engineerMobile/engineerAssignedAppointmentsProjectionHandler.http-behavior.unit.test.js',
  'tests/engineerMobile/engineerAssignedAppointmentsProjectionHandlerClosure.static.test.js',
  'docs/task-922-engineer-mobile-assigned-appointments-http-handler-injected-db-client-no-route-no-real-db.md',
];

const TASK923_FILES = [
  'src/engineerMobile/engineerAssignedAppointmentsAppAdapter.js',
  'tests/engineerMobile/engineerAssignedAppointmentsAppAdapter.unit.test.js',
  'tests/engineerMobile/engineerAssignedAppointmentsAppAdapterClosure.static.test.js',
  'docs/task-923-engineer-mobile-assigned-appointments-app-adapter-synthetic-app-only-no-public-route-no-listen.md',
];

const TASK924_FILES = [
  'tests/engineerMobile/engineerAssignedAppointmentsBranchClosure.static.test.js',
  'docs/task-924-engineer-mobile-assigned-appointments-branch-closure-patch-inclusion-no-runtime-change.md',
];

const ALL_PATCH_FILES = [
  ...TASK921_FILES,
  ...TASK922_FILES,
  ...TASK923_FILES,
  ...TASK924_FILES,
];

const SERVICE_FILE = TASK921_FILES[0];
const HANDLER_FILE = TASK922_FILES[0];
const APP_ADAPTER_FILE = TASK923_FILES[0];
const TASK924_DOC = TASK924_FILES[1];

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

test('Task921 through Task924 assigned appointments files are present', () => {
  for (const file of ALL_PATCH_FILES) {
    assert.equal(exists(file), true, `${file} should exist`);
  }
});

test('assigned appointments branch delegates projection service to handler to app adapter', () => {
  const serviceSource = read(SERVICE_FILE);
  const handlerSource = read(HANDLER_FILE);
  const appAdapterSource = read(APP_ADAPTER_FILE);

  assert.deepEqual(requireSpecifiers(handlerSource), ['./engineerAssignedAppointmentsProjectionService']);
  assert.match(handlerSource, /getEngineerAssignedAppointmentsProjection/);
  assert.deepEqual(requireSpecifiers(appAdapterSource), ['./engineerAssignedAppointmentsProjectionHandler']);
  assert.match(appAdapterSource, /createEngineerAssignedAppointmentsProjectionHandler/);
  assert.match(serviceSource, /typeof dbClient\.query !== 'function'/);
  assert.match(handlerSource, /const dbClient =/);
  assert.match(appAdapterSource, /typeof options\.dbClient\.query !== 'function'/);
});

test('app adapter registers only against injected synthetic app or router', () => {
  const appAdapterSource = read(APP_ADAPTER_FILE);
  const unitTestSource = read(TASK923_FILES[1]);

  assert.match(appAdapterSource, /const target = options\.app \|\| options\.router/);
  assert.match(appAdapterSource, /target\.get\(path, handler\)/);
  assert.match(unitTestSource, /registers exactly one GET-like handler on injected synthetic app/);
  assert.match(unitTestSource, /registration failure fails closed/);
  assert.match(unitTestSource, /router option is supported without depending on a global app/);
  assert.match(unitTestSource, /assert\.equal\(dbClient\.calls\.length, 0\)/);
  assert.doesNotMatch(appAdapterSource, /\.listen\s*\(|express\s*\(|Router\s*\(/i);
});

test('assigned appointments branch source imports no forbidden runtime dependencies', () => {
  const allowedSpecifiersByFile = {
    [SERVICE_FILE]: ['./engineerPreDepartureActionEligibility'],
    [HANDLER_FILE]: ['./engineerAssignedAppointmentsProjectionService'],
    [APP_ADAPTER_FILE]: ['./engineerAssignedAppointmentsProjectionHandler'],
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

test('assigned appointments branch contains no mutation SQL or workflow action calls', () => {
  const source = [
    read(SERVICE_FILE),
    read(HANDLER_FILE),
    read(APP_ADAPTER_FILE),
  ].join('\n');

  assert.doesNotMatch(source, /\binsert\s+into\b|\bupdate\s+\w+\s+set\b|\bdelete\s+from\b|BEGIN|COMMIT|ROLLBACK/i);
  assert.doesNotMatch(source, /markArrived|markStarted|submitCompletion|createReport|updateReport|approveReport|publishReport/i);
  assert.doesNotMatch(source, /createFieldServiceReport|createCompletionReport|startTravel\s*\(|arrival\s*\(|completeAppointment/i);
  assert.doesNotMatch(source, /finalAppointmentId\s*=|caseStatus\s*=|appointmentStatus\s*=|fieldServiceReport\s*=/);
});

test('mobile assigned appointment projection allowlist excludes sensitive internal fields', () => {
  const serviceSource = read(SERVICE_FILE);
  const serviceUnitTestSource = read(TASK921_FILES[1]);

  for (const safeField of [
    'appointmentId',
    'caseReference',
    'appointmentWindow',
    'scheduledStart',
    'scheduledEnd',
    'serviceType',
    'customerDisplayName',
    'locationLabel',
    'priorityLabel',
    'canOpenDetails',
    'canStartTravel',
  ]) {
    assert.match(serviceSource, new RegExp(escaped(safeField)));
  }

  assert.match(serviceUnitTestSource, /assertNoSensitiveLeak/);
  assert.doesNotMatch(serviceSource, /['"](?:phone|mobile|tel|address|lineUserId|providerRawPayload|token|secret|password|apiKey)['"]/i);
  assert.doesNotMatch(serviceSource, /['"](?:internalNote|dispatcherNote|billingInternal|settlementInternal|aiRawPayload|finalAppointmentId)['"]/i);
});

test('no production route registration exists for assigned appointments branch', () => {
  const routeFiles = [
    'src/routes/index.js',
    'src/routes/engineerMobileRoutes.js',
    'src/app.js',
    'src/server.js',
  ];

  for (const file of routeFiles) {
    const source = read(file);

    assert.doesNotMatch(source, /engineerAssignedAppointmentsAppAdapter|registerEngineerAssignedAppointmentsRoute/);
    assert.doesNotMatch(source, /engineerAssignedAppointmentsProjectionHandler|handleEngineerAssignedAppointmentsProjectionRequest/);
    assert.doesNotMatch(source, /engineerAssignedAppointmentsProjectionService|getEngineerAssignedAppointmentsProjection/);
  }
});

test('Task924 evidence doc lists Task921 through Task924 final patch candidates and status', () => {
  const doc = read(TASK924_DOC);
  const statusLines = gitStatusFor(ALL_PATCH_FILES);

  assert.equal(statusLines.length, ALL_PATCH_FILES.length);

  for (const file of ALL_PATCH_FILES) {
    assert.match(doc, new RegExp(escaped(file)), `${file} should be listed in Task924 doc`);
  }

  for (const line of statusLines) {
    assert.match(doc, new RegExp(escaped(line)), `Task924 doc should record ${line}`);
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
});
