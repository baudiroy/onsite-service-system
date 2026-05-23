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

const TASK914_FILES = [
  'src/customerAccess/customerServiceReportProjectionAppAdapter.js',
  'tests/customerAccess/customerServiceReportProjectionAppAdapter.unit.test.js',
  'tests/customerAccess/customerServiceReportProjectionAppAdapterClosure.static.test.js',
  'docs/task-914-customer-access-projection-handler-app-adapter-no-public-route-no-listen.md',
];

const TASK915_FILES = [
  'tests/customerAccess/customerServiceReportProjectionAppAdapterBranchClosure.static.test.js',
  'docs/task-915-customer-access-app-adapter-branch-closure-patch-inclusion-no-runtime-change.md',
];

const SERVICE_FILE = TASK908_FILES[0];
const HANDLER_FILE = TASK909_FILES[0];
const RESOLVER_FILE = TASK911_FILES[0];
const APP_ADAPTER_FILE = TASK914_FILES[0];
const TASK915_DOC = TASK915_FILES[1];

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

test('Task908 through Task915 patch candidate files are present', () => {
  for (const file of [
    ...TASK908_FILES,
    ...TASK909_FILES,
    ...TASK910_FILES,
    ...TASK911_FILES,
    ...TASK912_FILES,
    ...TASK914_FILES,
    ...TASK915_FILES,
  ]) {
    assert.equal(exists(file), true, `${file} should exist`);
  }
});

test('projection flow remains synthetic context to service to handler to app adapter', () => {
  const serviceSource = read(SERVICE_FILE);
  const handlerSource = read(HANDLER_FILE);
  const resolverSource = read(RESOLVER_FILE);
  const appAdapterSource = read(APP_ADAPTER_FILE);

  assert.deepEqual(requireSpecifiers(handlerSource), ['./customerServiceReportProjectionService']);
  assert.match(handlerSource, /getCustomerServiceReportProjection/);
  assert.deepEqual(requireSpecifiers(resolverSource), []);
  assert.deepEqual(requireSpecifiers(appAdapterSource), ['./customerServiceReportProjectionHandler']);
  assert.match(appAdapterSource, /createCustomerServiceReportProjectionHandler/);
  assert.match(serviceSource, /typeof dbClient\.query !== 'function'/);
  assert.match(handlerSource, /const dbClient =/);
  assert.match(appAdapterSource, /typeof options\.dbClient\.query !== 'function'/);
});

test('app adapter registers only against injected synthetic app or router', () => {
  const appAdapterSource = read(APP_ADAPTER_FILE);
  const unitTestSource = read(TASK914_FILES[1]);

  assert.match(appAdapterSource, /const target = options\.app \|\| options\.router/);
  assert.match(appAdapterSource, /target\.get\(path, handler\)/);
  assert.match(unitTestSource, /registers exactly one GET-like handler on injected synthetic app/);
  assert.match(unitTestSource, /router option is supported without depending on a global app/);
  assert.doesNotMatch(appAdapterSource, /require\(['"][^'"]*(routes|app|server|bootstrap|express)/i);
});

test('customer access branch source imports no forbidden runtime dependencies', () => {
  for (const file of [SERVICE_FILE, HANDLER_FILE, RESOLVER_FILE, APP_ADAPTER_FILE]) {
    const source = read(file);

    for (const specifier of requireSpecifiers(source)) {
      assert.equal(
        /(db|pool|repositories?|transaction|baseRepository|auth|session|jwt|provider|line|sms|email|push|webhook|ai|rag|vector|search|billing|settlement|env|config|credential|logger|network|server|app|routes?|bootstrap|smoke)/i.test(specifier),
        false,
        `${file} imports forbidden dependency ${specifier}`,
      );
    }

    assert.doesNotMatch(source, /process\.env|console\.|fetch\(|axios|http\.request|https\.request|new Pool|createPool/i);
    assert.doesNotMatch(source, /\.listen\s*\(|express\s*\(|Router\s*\(|register.*RoutesWithOptions|registerCustomerAccessRoutes|registerCustomerAccessModuleRoutes/i);
  }
});

test('resolver remains synthetic pre-resolved only and is not auth middleware', () => {
  const resolverSource = read(RESOLVER_FILE);
  const appAdapterSource = read(APP_ADAPTER_FILE);
  const handlerSource = read(HANDLER_FILE);

  assert.match(resolverSource, /customerAccessContext/);
  assert.match(resolverSource, /syntheticCustomerAccessContext/);
  assert.doesNotMatch(resolverSource, /headers|authorization|cookie|verify\w*Token|jwt\.verify|decode\w*Token|sessionStore|passport|login|logout/i);
  assert.doesNotMatch(`${handlerSource}\n${appAdapterSource}`, /resolveCustomerAccessContextFromRequest|customerAccessRequestContextResolver/);
});

test('no production route registration exists for service report projection app adapter branch', () => {
  const routeFiles = [
    'src/routes/index.js',
    'src/routes/customerAccessRoutes.js',
    'src/app.js',
    'src/server.js',
  ];

  for (const file of routeFiles) {
    const source = read(file);

    assert.doesNotMatch(source, /customerServiceReportProjectionAppAdapter|registerCustomerServiceReportProjectionRoute/);
    assert.doesNotMatch(source, /customerServiceReportProjectionHandler|handleCustomerServiceReportProjectionRequest|createCustomerServiceReportProjectionHandler/);
  }
});

test('Task915 evidence doc lists Task908 through Task915 final patch candidates and no-runtime boundary', () => {
  const doc = read(TASK915_DOC);

  for (const file of [
    ...TASK908_FILES,
    ...TASK909_FILES,
    ...TASK910_FILES,
    ...TASK911_FILES,
    ...TASK912_FILES,
    ...TASK914_FILES,
    ...TASK915_FILES,
  ]) {
    assert.match(doc, new RegExp(escaped(file)), `${file} should be listed`);
  }

  assert.match(doc, /final patch candidate/i);
  assert.match(doc, /local \/ uncommitted \/ untracked/i);
  assert.match(doc, /No production source change/);
  assert.match(doc, /No public route/);
  assert.match(doc, /No route registration/);
  assert.match(doc, /No listen/);
  assert.match(doc, /No real DB/);
  assert.match(doc, /No auth\/session\/JWT runtime/);
  assert.match(doc, /No provider sending/);
  assert.match(doc, /No AI\/RAG/);
  assert.match(doc, /No billing\/settlement/);
  assert.match(doc, /No smoke\/shared runtime/);
});
