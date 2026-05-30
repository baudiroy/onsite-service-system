'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  adapter: 'src/engineerMobile/engineerMobileProductionMountCompositionAdapter.js',
  app: 'src/app.js',
  routeIndex: 'src/routes/index.js',
  server: 'src/server.js',
});

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function requireSpecifiers(source) {
  return [...source.matchAll(/require\(['"]([^'"]+)['"]\)/g)].map((match) => match[1]);
}

test('Task2165 Engineer Mobile production mount adapter source files exist', () => {
  for (const file of Object.values(FILES)) {
    assert.equal(fs.existsSync(path.join(repoRoot, file)), true, `${file} should exist`);
  }
});

test('production mount adapter delegates to existing routes and audit side-channel modules only', () => {
  const adapter = read(FILES.adapter);

  assert.deepEqual(requireSpecifiers(adapter), [
    '../routes/engineerMobileRoutes',
    '../routes/engineerMobileTaskDetailRoutes',
    '../routes/engineerMobileVisitActionRoutes',
    './engineerMobileAuditEventBuilder',
    './engineerMobileAuditWriterAdapter',
  ]);
  assert.match(adapter, /registerEngineerMobileRoutes\(router,\s*options\)/);
  assert.match(adapter, /registerEngineerMobileTaskDetailRoutes\(router,\s*options\)/);
  assert.match(adapter, /registerEngineerMobileVisitActionRoutes\(router,\s*options\)/);
  assert.doesNotMatch(adapter, /createEngineerMobileTaskListHandler|createEngineerMobileTaskDetailHandler|createEngineerMobileVisitActionRouteHandler/);
  assert.doesNotMatch(adapter, /\/engineer-mobile\/tasks|\/engineer-mobile\/appointments/);
});

test('adapter avoids app server route-index public-routes DB env provider sending AI billing imports', () => {
  const adapter = read(FILES.adapter);
  const specifiers = requireSpecifiers(adapter);

  for (const forbidden of [
    '../app',
    '../server',
    '../routes',
    '../routes/index',
    '../routes/public.routes',
    './engineerMobileVisitActionRuntimeBootstrap',
  ]) {
    assert.equal(specifiers.includes(forbidden), false, `must not import ${forbidden}`);
  }

  for (const specifier of specifiers) {
    assert.doesNotMatch(specifier, /(^|[/.-])db($|[/.-])|pool|clientFactory|connector|env|Zeabur/i);
    assert.doesNotMatch(specifier, /line|sms|email|webhook|push|provider|notification/i);
    assert.doesNotMatch(specifier, /openai|(^|[/._-])ai($|[/._-])|rag|model|billing|payment|settlement/i);
  }
});

test('adapter source has no listener DB migration smoke network provider-send AI or billing side effects', () => {
  const adapter = read(FILES.adapter);

  assert.doesNotMatch(adapter, /listen\s*\(|server\.listen|app\.listen|http\.createServer/);
  assert.doesNotMatch(adapter, /\.query\s*\(|connect\s*\(|Pool\s*\(|Client\s*\(|pg\b|knex|sequelize|prisma|mysql|sqlite|psql/i);
  assert.doesNotMatch(adapter, /migration|schema|seed|ALTER\s+TABLE|CREATE\s+TABLE|DROP\s+TABLE/i);
  assert.doesNotMatch(adapter, /process\.env|DATABASE_URL|Zeabur|secret|credential|token/i);
  assert.doesNotMatch(adapter, /fetch\s*\(|axios|http\.request|https\.request|XMLHttpRequest|WebSocket/i);
  assert.doesNotMatch(adapter, /\.(send|push|publish|notify|enqueue)\s*\(|line|sms|email|webhook|app push/i);
  assert.doesNotMatch(adapter, /OpenAI|RAG|model|billing|payment|settlement|invoice/i);
});

test('adapter returns only sanitized summaries and never raw dependency objects', () => {
  const adapter = read(FILES.adapter);

  assert.doesNotMatch(adapter, /JSON\.stringify|res\.json|return\s+\{[^}]*router|return\s+\{[^}]*dbClient|return\s+\{[^}]*repository|return\s+\{[^}]*auditWriter/s);
  assert.doesNotMatch(adapter, /rawRouter|rawDbClient|rawRepository|rawAuditWriter|writerResult|auditResult|stack|connectionString/);
  assert.match(adapter, /messageKey:\s*ENGINEER_MOBILE_PRODUCTION_MOUNT_MESSAGE_KEY/);
  assert.match(adapter, /customerVisible:\s*false/);
});

test('only production route index imports the Engineer Mobile production mount adapter', () => {
  const app = read(FILES.app);
  const server = read(FILES.server);
  const routeIndex = read(FILES.routeIndex);

  assert.equal(
    requireSpecifiers(app).includes('./engineerMobile/engineerMobileProductionMountCompositionAdapter'),
    false,
  );
  assert.equal(
    requireSpecifiers(server).includes('./engineerMobile/engineerMobileProductionMountCompositionAdapter'),
    false,
  );
  assert.equal(
    requireSpecifiers(routeIndex).includes('../engineerMobile/engineerMobileProductionMountCompositionAdapter'),
    true,
  );
  assert.match(
    routeIndex,
    /createEngineerMobileProductionMountComposition\(\{\s*\.\.\.engineerMobileOptions,\s*router:\s*appRouter,\s*\}\)/,
  );
  assert.doesNotMatch(routeIndex, /registerEngineerMobileRoutes\(appRouter/);
  assert.doesNotMatch(routeIndex, /registerEngineerMobileTaskDetailRoutes\(appRouter/);
  assert.doesNotMatch(routeIndex, /registerEngineerMobileVisitActionRoutes\(appRouter/);
});
