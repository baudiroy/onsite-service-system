'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const TASK908_FILES = [
  'src/customerAccess/customerServiceReportProjectionService.js',
  'tests/customerAccess/customerServiceReportProjectionService.unit.test.js',
  'tests/customerAccess/customerServiceReportProjectionServiceClosure.static.test.js',
  'docs/task-908-customer-access-read-only-service-report-projection-injected-db-client-no-route-no-migration.md',
];

const TASK909_FILES = [
  'src/customerAccess/customerServiceReportProjectionHandler.js',
  'tests/customerAccess/customerServiceReportProjectionHandler.http-behavior.unit.test.js',
  'tests/customerAccess/customerServiceReportProjectionHandlerClosure.static.test.js',
  'docs/task-909-customer-access-service-report-projection-http-handler-injected-db-client-no-listen-no-real-db.md',
];

const TASK910_FILES = [
  'tests/customerAccess/customerServiceReportProjectionBranchClosure.static.test.js',
  'docs/task-910-customer-access-service-report-projection-branch-closure-patch-inclusion-no-runtime-change.md',
];

const SERVICE_FILE = TASK908_FILES[0];
const HANDLER_FILE = TASK909_FILES[0];
const TASK910_DOC = TASK910_FILES[1];

function absolutePath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(absolutePath(relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(absolutePath(relativePath));
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

test('Task908 Task909 and Task910 patch candidate files are explicitly present', () => {
  for (const file of [...TASK908_FILES, ...TASK909_FILES, ...TASK910_FILES]) {
    assert.equal(exists(file), true, `${file} should exist`);
  }
});

test('handler remains a thin delegate to the Task908 projection service', () => {
  const handlerSource = read(HANDLER_FILE);
  const directProjectionFieldNames = [
    'customerReportReference',
    'caseReference',
    'serviceStatus',
    'appointmentWindow',
    'engineerDisplayName',
    'serviceSummary',
    'completionTime',
    'publicAttachments',
  ];

  assert.deepEqual(requireSpecifiers(handlerSource), ['./customerServiceReportProjectionService']);
  assert.match(handlerSource, /getCustomerServiceReportProjection/);

  for (const fieldName of directProjectionFieldNames) {
    assert.equal(
      handlerSource.includes(fieldName),
      false,
      `handler should not duplicate projection field mapping for ${fieldName}`,
    );
  }
});

test('projection service and handler require injected dbClient and expose no default writer or repository path', () => {
  const source = `${read(SERVICE_FILE)}\n${read(HANDLER_FILE)}`;

  assert.match(source, /dbClient/);
  assert.match(read(SERVICE_FILE), /typeof dbClient\.query !== 'function'/);
  assert.match(read(HANDLER_FILE), /dbClient:\s*options\.dbClient|const dbClient =/);
  assert.doesNotMatch(source, /default.*writer|repositoryBacked|create.*Repository|new\s+\w*Repository|baseRepository/i);
});

test('projection files import no real DB repository transaction provider AI billing env config route or listen dependencies', () => {
  for (const file of [SERVICE_FILE, HANDLER_FILE]) {
    const source = read(file);
    const specifiers = requireSpecifiers(source);

    for (const specifier of specifiers) {
      assert.equal(
        /(db|pool|repositories?|transaction|provider|line|sms|email|push|webhook|ai|rag|vector|search|billing|settlement|env|config|credential|logger|network|server|app|routes?)/i.test(specifier),
        false,
        `${file} imports forbidden dependency ${specifier}`,
      );
    }

    assert.doesNotMatch(source, /process\.env|console\.|fetch\(|axios|http\.request|https\.request|new Pool|createPool/i);
    assert.doesNotMatch(source, /app\.listen|listen\(|express\s*\(|Router\s*\(|router\.(get|post|use)|register.*Route/i);
  }
});

test('projection response remains allowlist based and forbidden fields are not assigned to customer output', () => {
  const serviceSource = read(SERVICE_FILE);
  const handlerSource = read(HANDLER_FILE);

  for (const allowed of [
    'customerReportReference',
    'caseReference',
    'serviceStatus',
    'appointmentWindow',
    'engineerDisplayName',
    'serviceSummary',
    'completionTime',
    'publicAttachments',
  ]) {
    assert.match(serviceSource, new RegExp(`serviceReport\\.${allowed}`));
  }

  for (const forbidden of [
    'phone',
    'mobile',
    'tel',
    'address',
    'lineUserId',
    'line_user_id',
    'finalAppointmentId',
    'internalNote',
    'technicianPrivateNote',
    'dispatchNote',
    'sql',
    'stack',
    'dbUrl',
    'connectionString',
    'token',
    'secret',
    'password',
    'apiKey',
    'aiRawPayload',
    'providerRawPayload',
    'billingInternalData',
    'settlementInternalData',
    'rawCasePayload',
    'rawFieldServiceReportId',
  ]) {
    assert.doesNotMatch(serviceSource, new RegExp(`serviceReport\\.${forbidden}\\b`));
    assert.doesNotMatch(handlerSource, new RegExp(`\\.${forbidden}\\b`));
  }
});

test('Task910 evidence doc lists Task908 Task909 and Task910 files as final patch candidates', () => {
  const doc = read(TASK910_DOC);

  for (const file of [...TASK908_FILES, ...TASK909_FILES, ...TASK910_FILES]) {
    assert.match(doc, new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(doc, /final patch candidate/i);
  assert.match(doc, /local \/ uncommitted \/ untracked/i);
});

test('Task910 evidence doc preserves no runtime expansion boundary', () => {
  const doc = read(TASK910_DOC);

  assert.match(doc, /No production source change/);
  assert.match(doc, /No route/);
  assert.match(doc, /No listen/);
  assert.match(doc, /No real DB/);
  assert.match(doc, /No migration/);
  assert.match(doc, /No provider sending/);
  assert.match(doc, /No AI\/RAG/);
  assert.match(doc, /No billing\/settlement/);
  assert.match(doc, /No smoke\/shared runtime/);
});
