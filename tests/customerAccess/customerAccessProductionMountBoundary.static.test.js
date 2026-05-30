'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  app: 'src/app.js',
  adapter: 'src/customerAccess/customerAccessProductionMountCompositionAdapter.js',
  routeIndex: 'src/routes/index.js',
  routes: 'src/routes/customerAccessRoutes.js',
  server: 'src/server.js',
});

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function requireSpecifiers(source) {
  return [...source.matchAll(/require\(['"]([^'"]+)['"]\)/g)].map((match) => match[1]);
}

function functionSource(source, functionName, nextFunctionName) {
  const start = source.indexOf(`function ${functionName}`);
  const end = nextFunctionName
    ? source.indexOf(`function ${nextFunctionName}`, start + 1)
    : -1;

  assert.notEqual(start, -1, `${functionName} should exist`);

  return source.slice(start, end === -1 ? undefined : end);
}

function customerAccessSpecifiers(source) {
  return requireSpecifiers(source).filter((specifier) => /customerAccess|CustomerAccess/.test(specifier));
}

test('Task2148 production mount boundary source files exist', () => {
  for (const file of Object.values(FILES)) {
    assert.equal(fs.existsSync(path.join(repoRoot, file)), true, `${file} should exist`);
  }
});

test('production route composition imports Customer Access through registry and production mount adapter only', () => {
  const routeIndex = read(FILES.routeIndex);

  assert.deepEqual(customerAccessSpecifiers(routeIndex), [
    '../customerAccess/customerAccessRouteRegistry',
    '../customerAccess/customerAccessProductionMountCompositionAdapter',
  ]);
  assert.equal(requireSpecifiers(routeIndex).includes('./customerAccessRoutes'), false);
  assert.equal(requireSpecifiers(routeIndex).includes('../customerAccess/customerAccessDbClientFactory'), false);
  assert.equal(requireSpecifiers(routeIndex).includes('../customerAccess/customerAccessReadOnlyDbConnector'), false);
  assert.equal(requireSpecifiers(routeIndex).includes('../customerAccess/customerAccessDbAdapter'), false);
});

test('production mount adapter keeps a single delegated route-registration dependency', () => {
  const adapter = read(FILES.adapter);

  assert.deepEqual(requireSpecifiers(adapter), [
    '../routes/customerAccessRoutes',
  ]);
  assert.match(adapter, /registerCustomerAccessRoutes\(options\.router,\s*\{/);
  assert.doesNotMatch(adapter, /customerAccessController|handleCustomerAccessRequest|handleCustomerServiceReportProjectionRequest|buildCustomerAccessContextMiddleware/);
  assert.doesNotMatch(adapter, /\/__internal\/customer-access|\/customer-access\/:caseId|service-report/);
});

test('src/routes/index.js explicit Customer Access production mount uses the accepted adapter API', () => {
  const routeIndex = read(FILES.routeIndex);
  const mountFunction = functionSource(
    routeIndex,
    'registerCustomerAccessRoutesWithOptions',
    'createAppRouter',
  );

  assert.match(mountFunction, /if \(customerAccessOptions === undefined\) \{\s*return registerCustomerAccessModuleRoutes\(appRouter\);\s*\}/);
  assert.match(mountFunction, /createCustomerAccessProductionMountComposition\(\{\s*router:\s*appRouter,\s*dbClient:\s*customerAccessOptions\.dbClient,\s*repository:\s*customerAccessOptions\.repository,\s*auditWriter:\s*customerAccessOptions\.auditWriter,\s*\}\)/);
  assert.doesNotMatch(mountFunction, /registerCustomerAccessRoutes\(appRouter,\s*customerAccessOptions\)/);
  assert.doesNotMatch(mountFunction, /handleCustomerAccessRequest|handleCustomerServiceReportProjectionRequest|createCustomerAccessReportRouteHandler|buildCustomerAccessContextMiddleware/);
});

test('Customer Access production mount path has no listener server DB env provider AI billing or network calls', () => {
  const routeIndex = read(FILES.routeIndex);
  const adapter = read(FILES.adapter);
  const mountFunction = functionSource(
    routeIndex,
    'registerCustomerAccessRoutesWithOptions',
    'createAppRouter',
  );
  const scopedSources = [
    mountFunction,
    adapter,
  ].join('\n');

  assert.doesNotMatch(scopedSources, /listen\s*\(|server\.listen|app\.listen|http\.createServer/);
  assert.doesNotMatch(scopedSources, /connect\s*\(|\.query\s*\(|Pool\s*\(|Client\s*\(|pg\b|knex|sequelize|prisma|mysql|sqlite|psql|migration|schema|seed/i);
  assert.doesNotMatch(scopedSources, /process\.env|DATABASE_URL|Zeabur|config\/env|env\.|secret|credential/i);
  assert.doesNotMatch(scopedSources, /fetch\s*\(|axios|http\.request|https\.request|XMLHttpRequest|WebSocket|provider|OpenAI|RAG|model/i);
  assert.doesNotMatch(scopedSources, /billing|payment|settlement|invoice|adminFrontend/i);
});

test('production composition source does not expose internal route path or extra Customer Access public routes', () => {
  const productionSources = [
    read(FILES.routeIndex),
    read(FILES.app),
    read(FILES.adapter),
  ].join('\n');
  const customerRoutes = read(FILES.routes);

  assert.doesNotMatch(productionSources, /\/__internal\/customer-access\/service-reports\/:caseId\/:reportId/);
  assert.match(customerRoutes, /const CUSTOMER_ACCESS_ROUTE_PATH = '\/customer-access\/:caseId'/);
  assert.match(customerRoutes, /const CUSTOMER_ACCESS_REPORT_ROUTE_PATH = '\/customer-access\/:caseId\/service-report\/:reportId'/);
  assert.equal((customerRoutes.match(/\/customer-access\/:caseId/g) || []).length >= 2, true);
  assert.doesNotMatch(customerRoutes, /\/customer-access\/:caseId\/(?!service-report)/);
  assert.doesNotMatch(customerRoutes, /\/__internal\/customer-access/);
});

test('app and server boundaries do not import the Customer Access production mount adapter directly', () => {
  const app = read(FILES.app);
  const server = read(FILES.server);

  assert.equal(requireSpecifiers(app).includes('./customerAccess/customerAccessProductionMountCompositionAdapter'), false);
  assert.equal(requireSpecifiers(server).includes('./customerAccess/customerAccessProductionMountCompositionAdapter'), false);
  assert.match(app, /customerAccess:\s*options\.customerAccess/);
  assert.doesNotMatch(app, /registerCustomerAccessRoutes|handleCustomerAccessRequest|handleCustomerServiceReportProjectionRequest|\/__internal\/customer-access/);
  assert.doesNotMatch(server, /createCustomerAccessProductionMountComposition|\/__internal\/customer-access\/service-reports/);
});

test('production mount summary boundary does not expose raw dependency or audit result objects', () => {
  const routeIndex = read(FILES.routeIndex);
  const adapter = read(FILES.adapter);
  const mountFunction = functionSource(
    routeIndex,
    'registerCustomerAccessRoutesWithOptions',
    'createAppRouter',
  );
  const scopedSources = [
    mountFunction,
    adapter,
  ].join('\n');

  assert.doesNotMatch(scopedSources, /JSON\.stringify|res\.json|return\s+\{[^}]*router|return\s+\{[^}]*dbClient|return\s+\{[^}]*repository|return\s+\{[^}]*auditWriter/s);
  assert.doesNotMatch(scopedSources, /auditWritten|persisted|writerResult|auditResult|rawRouter|rawDbClient|rawRepository|rawAuditWriter/);
});
