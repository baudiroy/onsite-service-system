'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const adapterPath = 'src/customerAccess/customerAccessProductionMountCompositionAdapter.js';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function requireSpecifiers(source) {
  return [...source.matchAll(/require\('([^']+)'\)/g)].map((match) => match[1]);
}

test('Task2142 production mount composition adapter source and tests exist', () => {
  for (const file of [
    adapterPath,
    'tests/customerAccess/customerAccessProductionMountCompositionAdapter.unit.test.js',
    'tests/customerAccess/customerAccessProductionMountCompositionAdapterBoundary.static.test.js',
  ]) {
    assert.equal(fs.existsSync(path.join(repoRoot, file)), true, `${file} should exist`);
  }
});

test('production mount composition adapter imports only the existing customer access route registration module', () => {
  const source = read(adapterPath);

  assert.deepEqual(requireSpecifiers(source), [
    '../routes/customerAccessRoutes',
  ]);
  assert.match(source, /registerCustomerAccessRoutes\(options\.router,\s*\{/);
  assert.doesNotMatch(source, /import\s/);
});

test('production mount composition adapter has no global app server public route db env provider ai or billing imports', () => {
  const source = read(adapterPath);
  const serializedSpecifiers = JSON.stringify(requireSpecifiers(source));
  const forbiddenSourcePattern = /src\/app|src\/server|public\.routes|routes\/index|customerAccessRouteRegistry|customerAccessDbClientFactory|customerAccessReadOnlyDbConnector|createCustomerAccessDbAdapter|process\.env|DATABASE_URL|Zeabur|provider|OpenAI|RAG|model|billing|payment|settlement|invoice/i;
  const forbiddenSpecifierPattern = /app|server|public\.routes|routes\/index|RouteRegistry|DbClientFactory|ReadOnlyDbConnector|DbAdapter|env|zeabur|provider|openai|rag|model|billing|payment|settlement|invoice/i;

  assert.doesNotMatch(source, forbiddenSourcePattern);
  assert.doesNotMatch(serializedSpecifiers, forbiddenSpecifierPattern);
});

test('production mount composition adapter has no import side effects or runtime startup/db execution calls', () => {
  const source = read(adapterPath);

  assert.doesNotMatch(source, /listen\s*\(|server\.listen|app\.listen|express\s*\(|Router\s*\(|router\.(get|post|use)|\.use\s*\(|\.post\s*\(/);
  assert.doesNotMatch(source, /connect\s*\(|query\s*\(|Pool\s*\(|Client\s*\(|pg\b|knex|sequelize|prisma|mysql|sqlite|psql|migration|schema|seed/i);
  assert.doesNotMatch(source, /fetch\s*\(|axios|http\.request|https\.request|child_process|exec\s*\(|spawn\s*\(|fs\.|readFile|writeFile|appendFile|console\./i);
  assert.doesNotMatch(source, /globalThis|global\.|Date\.now|new Date|Math\.random|crypto|randomUUID|randomBytes/i);
});

test('production mount composition adapter exposes only the injected composition API', () => {
  const source = read(adapterPath);

  assert.match(source, /function createCustomerAccessProductionMountComposition\(input = \{\}\)/);
  assert.match(source, /router:?\s*options\.router|options\.router/);
  assert.match(source, /dbClient:\s*options\.dbClient/);
  assert.match(source, /repository:\s*options\.repository/);
  assert.match(source, /auditWriter:\s*options\.auditWriter/);
  assert.match(source, /module\.exports\s*=\s*\{\s*createCustomerAccessProductionMountComposition,\s*\}/);
  assert.doesNotMatch(source, /module\.exports\s*=\s*function|class\s+|new\s+/);
});
