'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  ENGINEER_MOBILE_PRODUCTION_ROUTES,
} = require('../../src/engineerMobile/engineerMobileProductionMountCompositionAdapter');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  adapter: 'src/engineerMobile/engineerMobileProductionMountCompositionAdapter.js',
  app: 'src/app.js',
  publicRoutes: 'src/routes/public.routes.js',
  routeIndex: 'src/routes/index.js',
  routeTaskDetail: 'src/routes/engineerMobileTaskDetailRoutes.js',
  routeTaskList: 'src/routes/engineerMobileRoutes.js',
  routeVisitAction: 'src/routes/engineerMobileVisitActionRoutes.js',
  server: 'src/server.js',
});

const ACCEPTED_ROUTE_TEMPLATES = Object.freeze([
  {
    method: 'GET',
    path: '/engineer-mobile/tasks',
  },
  {
    method: 'GET',
    path: '/engineer-mobile/tasks/:appointmentId',
  },
  {
    method: 'POST',
    path: '/engineer-mobile/appointments/:appointmentId/actions/:action',
  },
]);

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

function routeIndexEngineerMobileMountSource() {
  return functionSource(read(FILES.routeIndex), 'registerEngineerMobileRoutesWithOptions', 'registerCustomerAccessRoutesWithOptions');
}

function productionMountScopedSource() {
  return [
    routeIndexEngineerMobileMountSource(),
    read(FILES.adapter),
  ].join('\n');
}

function engineerMobileSpecifiers(source) {
  return requireSpecifiers(source).filter((specifier) => /engineerMobile|EngineerMobile/.test(specifier));
}

test('Task2181 production mount boundary source files exist', () => {
  for (const file of Object.values(FILES)) {
    assert.equal(fs.existsSync(path.join(repoRoot, file)), true, `${file} should exist`);
  }
});

test('production route index uses the accepted Engineer Mobile production mount adapter only', () => {
  const routeIndex = read(FILES.routeIndex);
  const mountFunction = routeIndexEngineerMobileMountSource();

  assert.deepEqual(engineerMobileSpecifiers(routeIndex), [
    './engineerMobileWorkbench.routes',
    '../engineerMobile/engineerMobileProductionMountCompositionAdapter',
  ]);
  assert.match(
    mountFunction,
    /createEngineerMobileProductionMountComposition\(\{\s*\.\.\.engineerMobileOptions,\s*router:\s*appRouter,\s*\}\)/,
  );
  assert.doesNotMatch(mountFunction, /createEngineerMobileTaskListHandler|createEngineerMobileTaskDetailHandler|createEngineerMobileVisitActionRouteHandler/);
  assert.doesNotMatch(mountFunction, /registerEngineerMobileRoutes\(appRouter|registerEngineerMobileTaskDetailRoutes\(appRouter|registerEngineerMobileVisitActionRoutes\(appRouter/);
});

test('direct Engineer Mobile route registrations are confined to approved production mount adapter', () => {
  const routeIndex = read(FILES.routeIndex);
  const app = read(FILES.app);
  const server = read(FILES.server);
  const publicRoutes = read(FILES.publicRoutes);
  const adapter = read(FILES.adapter);

  for (const source of [routeIndex, app, server, publicRoutes]) {
    assert.doesNotMatch(source, /registerEngineerMobileRoutes\(.*appRouter/);
    assert.doesNotMatch(source, /registerEngineerMobileTaskDetailRoutes\(.*appRouter/);
    assert.doesNotMatch(source, /registerEngineerMobileVisitActionRoutes\(.*appRouter/);
  }

  assert.match(adapter, /registerEngineerMobileRoutes\(router,\s*options\)/);
  assert.match(adapter, /registerEngineerMobileTaskDetailRoutes\(router,\s*options\)/);
  assert.match(adapter, /registerEngineerMobileVisitActionRoutes\(router,\s*options\)/);
});

test('Engineer Mobile production mount path imports no DB env Zeabur provider AI billing or network modules', () => {
  const routeIndex = read(FILES.routeIndex);
  const adapter = read(FILES.adapter);
  const mountSpecifiers = [
    ...requireSpecifiers(routeIndex).filter((specifier) => /engineerMobile|EngineerMobile/.test(specifier)),
    ...requireSpecifiers(adapter),
  ];

  for (const specifier of mountSpecifiers) {
    assert.doesNotMatch(specifier, /(^|[/.-])db($|[/.-])|pool|clientFactory|connector|repository|readModel|env|Zeabur|config/i);
    assert.doesNotMatch(specifier, /line|sms|email|webhook|push|provider|notification/i);
    assert.doesNotMatch(specifier, /openai|(^|[/._-])ai($|[/._-])|rag|model|billing|payment|settlement|invoice/i);
    assert.doesNotMatch(specifier, /fetch|axios|http-client|network|endpoint|smoke/i);
  }
});

test('Engineer Mobile production mount path has no listener DB env provider smoke network AI or billing side effects', () => {
  const scopedSource = productionMountScopedSource();

  assert.doesNotMatch(scopedSource, /listen\s*\(|server\.listen|app\.listen|http\.createServer/);
  assert.doesNotMatch(scopedSource, /\.query\s*\(|\.connect\s*\(|connect\s*\(|Pool\s*\(|Client\s*\(|pg\b|knex|sequelize|prisma|mysql|sqlite|psql/i);
  assert.doesNotMatch(scopedSource, /migration|schema|seed|ALTER\s+TABLE|CREATE\s+TABLE|DROP\s+TABLE/i);
  assert.doesNotMatch(scopedSource, /process\.env|DATABASE_URL|Zeabur|config\/env|env\.|secret|credential/i);
  assert.doesNotMatch(scopedSource, /fetch\s*\(|axios|http\.request|https\.request|XMLHttpRequest|WebSocket|endpoint probe|smoke|healthz/i);
  assert.doesNotMatch(scopedSource, /\.(send|push|publish|notify|enqueue)\s*\(|line|sms|email|webhook|app push/i);
  assert.doesNotMatch(scopedSource, /OpenAI|RAG|model|billing|payment|settlement|invoice|adminFrontend/i);
});

test('app server and public route boundaries do not import Engineer Mobile production mount adapter directly', () => {
  const app = read(FILES.app);
  const server = read(FILES.server);
  const publicRoutes = read(FILES.publicRoutes);

  assert.equal(
    requireSpecifiers(app).includes('./engineerMobile/engineerMobileProductionMountCompositionAdapter'),
    false,
  );
  assert.equal(
    requireSpecifiers(server).includes('./engineerMobile/engineerMobileProductionMountCompositionAdapter'),
    false,
  );
  assert.equal(
    requireSpecifiers(publicRoutes).includes('../engineerMobile/engineerMobileProductionMountCompositionAdapter'),
    false,
  );
});

test('production composition exposes only accepted Engineer Mobile route templates and no internal route', () => {
  const routeIndex = read(FILES.routeIndex);
  const adapter = read(FILES.adapter);
  const routeSources = [
    read(FILES.routeTaskList),
    read(FILES.routeTaskDetail),
    read(FILES.routeVisitAction),
  ].join('\n');

  assert.deepEqual(ENGINEER_MOBILE_PRODUCTION_ROUTES, ACCEPTED_ROUTE_TEMPLATES);
  assert.doesNotMatch(routeIndex, /\/__internal\/engineer-mobile|\/internal\/engineer-mobile/);
  assert.doesNotMatch(adapter, /\/__internal\/engineer-mobile|\/internal\/engineer-mobile/);
  assert.equal((routeSources.match(/\/engineer-mobile\/tasks/g) || []).length >= 2, true);
  assert.match(routeSources, /\/engineer-mobile\/appointments\/:appointmentId\/actions\/:action/);
  assert.doesNotMatch(routeSources, /\/__internal\/engineer-mobile/);
});

test('production mount summary boundary exposes no raw dependencies or audit results', () => {
  const scopedSource = productionMountScopedSource();

  assert.doesNotMatch(scopedSource, /JSON\.stringify|res\.json|return\s+\{[^}]*router|return\s+\{[^}]*dbClient|return\s+\{[^}]*repository|return\s+\{[^}]*auditWriter|return\s+\{[^}]*options/s);
  assert.doesNotMatch(scopedSource, /rawRouter|rawDbClient|rawRepository|rawProvider|rawAuditWriter|writerResult|auditResult|auditWritten|persisted|connectionString|providerPayload/);
  assert.match(scopedSource, /messageKey:\s*ENGINEER_MOBILE_PRODUCTION_MOUNT_MESSAGE_KEY/);
  assert.match(scopedSource, /customerVisible:\s*false/);
});

test('Engineer Mobile production dependency flow remains injected through engineerMobileOptions', () => {
  const routeIndex = read(FILES.routeIndex);
  const mountFunction = routeIndexEngineerMobileMountSource();

  assert.match(routeIndex, /registerEngineerMobileRoutesWithOptions\(appRouter,\s*options\.engineerMobile\)/);
  assert.match(mountFunction, /\.\.\.engineerMobileOptions/);
  assert.doesNotMatch(mountFunction, /new\s+Pool|createPool|loadDefaultPool|require\(['"][^'"]*db|process\.env|env\./);
  assert.doesNotMatch(mountFunction, /auditResult|providerPayload|dbClient\.query|repository\./);
});
