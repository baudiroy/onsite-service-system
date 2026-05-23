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

const TASK911_FILES = [
  'src/customerAccess/customerAccessRequestContextResolver.js',
  'tests/customerAccess/customerAccessRequestContextResolver.unit.test.js',
  'tests/customerAccess/customerAccessRequestContextResolverClosure.static.test.js',
  'docs/task-911-customer-access-request-context-resolver-synthetic-token-context-no-auth-runtime-no-route.md',
];

const TASK912_FILES = [
  'tests/customerAccess/customerAccessProjectionContextBranchClosure.static.test.js',
  'docs/task-912-customer-access-context-resolver-projection-branch-closure-patch-inclusion-no-runtime-change.md',
];

const SERVICE_FILE = TASK908_FILES[0];
const HANDLER_FILE = TASK909_FILES[0];
const RESOLVER_FILE = TASK911_FILES[0];
const TASK912_DOC = TASK912_FILES[1];

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

function escaped(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('Task908 through Task912 patch candidate files are present', () => {
  for (const file of [...TASK908_FILES, ...TASK909_FILES, ...TASK910_FILES, ...TASK911_FILES, ...TASK912_FILES]) {
    assert.equal(exists(file), true, `${file} should exist`);
  }
});

test('projection handler delegates to service and resolver remains separate from handler wiring', () => {
  const handlerSource = read(HANDLER_FILE);
  const resolverSource = read(RESOLVER_FILE);

  assert.deepEqual(requireSpecifiers(handlerSource), ['./customerServiceReportProjectionService']);
  assert.match(handlerSource, /getCustomerServiceReportProjection/);
  assert.deepEqual(requireSpecifiers(resolverSource), []);
  assert.doesNotMatch(handlerSource, /customerAccessRequestContextResolver|resolveCustomerAccessContextFromRequest/);
});

test('resolver remains synthetic pre-resolved only and does not implement auth runtime', () => {
  const resolverSource = read(RESOLVER_FILE);
  const resolverTestSource = read(TASK911_FILES[1]);

  assert.match(resolverSource, /customerAccessContext/);
  assert.match(resolverSource, /syntheticCustomerAccessContext/);
  assert.doesNotMatch(resolverSource, /headers|authorization|cookie|verify\w*Token|jwt\.verify|decode\w*Token|sessionStore|passport|login|logout/i);
  assert.match(resolverTestSource, /raw bearer token header and cookie alone are not trusted/);
  assert.match(resolverTestSource, /LINE user id alone is not trusted as global customer identity/);
});

test('projection service and handler still require injected dbClient', () => {
  const serviceSource = read(SERVICE_FILE);
  const handlerSource = read(HANDLER_FILE);

  assert.match(serviceSource, /typeof dbClient\.query !== 'function'/);
  assert.match(handlerSource, /const dbClient =/);
  assert.match(handlerSource, /dbClient,\n\s*}/);
  assert.doesNotMatch(`${serviceSource}\n${handlerSource}`, /default.*writer|repositoryBacked|create.*Repository|new\s+\w*Repository|baseRepository/i);
});

test('branch source imports no forbidden runtime dependencies', () => {
  for (const file of [SERVICE_FILE, HANDLER_FILE, RESOLVER_FILE]) {
    const source = read(file);

    for (const specifier of requireSpecifiers(source)) {
      assert.equal(
        /(db|pool|repositories?|transaction|baseRepository|auth|session|jwt|provider|line|sms|email|push|webhook|ai|rag|vector|search|billing|settlement|env|config|credential|logger|network|server|app|routes?)/i.test(specifier),
        false,
        `${file} imports forbidden dependency ${specifier}`,
      );
    }

    assert.doesNotMatch(source, /process\.env|console\.|fetch\(|axios|http\.request|https\.request|new Pool|createPool/i);
    assert.doesNotMatch(source, /app\.listen|listen\(|express\s*\(|Router\s*\(|router\.(get|post|use)|register.*Route/i);
  }
});

test('customer-facing projection remains allowlist based', () => {
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
    assert.equal(handlerSource.includes(allowed), false, `handler should not map ${allowed}`);
  }
});

test('resolver output remains minimal and excludes raw sensitive request identity', () => {
  const resolverSource = read(RESOLVER_FILE);
  const resolverTestSource = read(TASK911_FILES[1]);

  assert.match(resolverSource, /buildNormalizedContext/);
  assert.match(resolverSource, /customerAccessContext:\s*null/);
  assert.doesNotMatch(resolverSource, /rawPhone|rawAddress|lineUserId|line_user_id|providerRawPayload|aiRawPayload|billingInternalData|password|apiKey|fullRaw|internalNote/);

  for (const phrase of [
    'does not copy raw request, raw customer profile, token/header/cookie, phone/address, LINE id',
    'nested forbidden sensitive fields are excluded',
  ]) {
    assert.match(`${read(TASK911_FILES[3])}\n${resolverTestSource}`, new RegExp(escaped(phrase), 'i'));
  }
});

test('no production route registration exists for this projection branch', () => {
  const routeFiles = [
    'src/routes/index.js',
    'src/routes/customerAccessRoutes.js',
    'src/app.js',
    'src/server.js',
  ];

  for (const file of routeFiles) {
    const source = read(file);

    assert.doesNotMatch(source, /customerServiceReportProjectionHandler|handleCustomerServiceReportProjectionRequest|createCustomerServiceReportProjectionHandler/);
    assert.doesNotMatch(source, /customerAccessRequestContextResolver|resolveCustomerAccessContextFromRequest/);
  }
});

test('Task912 evidence doc lists Task908 through Task912 final patch candidates and no-runtime boundary', () => {
  const doc = read(TASK912_DOC);

  for (const file of [...TASK908_FILES, ...TASK909_FILES, ...TASK910_FILES, ...TASK911_FILES, ...TASK912_FILES]) {
    assert.match(doc, new RegExp(escaped(file)));
  }

  assert.match(doc, /final patch candidate/i);
  assert.match(doc, /local \/ uncommitted \/ untracked/i);
  assert.match(doc, /No production source change/);
  assert.match(doc, /No route/);
  assert.match(doc, /No listen/);
  assert.match(doc, /No auth runtime/);
  assert.match(doc, /No JWT verification/);
  assert.match(doc, /No real DB/);
  assert.match(doc, /No migration/);
  assert.match(doc, /No provider sending/);
  assert.match(doc, /No AI\/RAG/);
  assert.match(doc, /No billing\/settlement/);
  assert.match(doc, /No smoke\/shared runtime/);
});
