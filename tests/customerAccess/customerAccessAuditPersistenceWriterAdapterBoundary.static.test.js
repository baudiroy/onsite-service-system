'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  adapter: 'src/customerAccess/customerAccessAuditPersistenceWriterAdapter.js',
  routes: 'src/routes/customerAccessRoutes.js',
  controller: 'src/controllers/customerAccessController.js',
  middleware: 'src/customerAccess/customerAccessContextMiddleware.js',
  projectionHandler: 'src/customerAccess/customerServiceReportProjectionHandler.js',
  projectionService: 'src/customerAccess/customerServiceReportProjectionService.js',
  app: 'src/app.js',
  server: 'src/server.js',
  publicRoutes: 'src/routes/public.routes.js',
});

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function exists(file) {
  return fs.existsSync(path.join(repoRoot, file));
}

function requireSpecifiers(source) {
  return [...source.matchAll(/require\('([^']+)'\)/g)].map((match) => match[1]);
}

test('Task2135 persistence writer adapter source tests and docs exist', () => {
  for (const file of [
    FILES.adapter,
    'tests/customerAccess/customerAccessAuditPersistenceWriterAdapter.unit.test.js',
    'tests/customerAccess/customerAccessAuditPersistenceWriterAdapterBoundary.static.test.js',
    'docs/task-2135-customer-access-audit-persistence-writer-adapter-skeleton-injected-repository-only-no-db-execution.md',
  ]) {
    assert.equal(exists(file), true, `${file} should exist`);
  }
});

test('persistence writer adapter imports only accepted repository contract', () => {
  const source = read(FILES.adapter);

  assert.deepEqual(requireSpecifiers(source), [
    './customerAccessAuditRepositoryContract',
  ]);
  assert.doesNotMatch(source, /import\s/);
});

test('persistence writer adapter has no DB env runtime network or random side effects', () => {
  const source = read(FILES.adapter);
  const serializedSpecifiers = JSON.stringify(requireSpecifiers(source));

  assert.doesNotMatch(source, /process\.env|globalThis|global\.|Date\.now|new Date|Math\.random|crypto|randomUUID|randomBytes|console\.|fetch\(|axios|http\.request|https\.request/i);
  assert.doesNotMatch(source, /fs\.|readFile|writeFile|appendFile|createWriteStream|createReadStream|child_process|exec\(|spawn\(/i);
  assert.doesNotMatch(source, /app\.listen|server\.listen|listen\(|express\s*\(|Router\s*\(|router\.(get|post|use)|\.get\(.*handler/i);
  assert.doesNotMatch(source, /pg|knex|sequelize|prisma|mysql|sqlite|Pool\(|Client\(|connect\(|query\(|psql|migration|schema|seed/i);
  assert.doesNotMatch(source, /Zeabur|DATABASE_URL|JWT_SECRET|OpenAI|RAG|model|settlement|invoice|LINE|SMS|Email|webhook/i);
  assert.doesNotMatch(serializedSpecifiers, /provider|openai|rag|billing|settlement|payment|invoice|line|sms|email|webhook/i);
  assert.doesNotMatch(source, /customerAccessRoutes|customerAccessController|ProjectionHandler|DbAdapter|ContextMiddleware/i);
});

test('persistence writer adapter contract stays injected repository only', () => {
  const source = read(FILES.adapter);

  assert.match(source, /function createCustomerAccessAuditPersistenceWriter\(input = \{\}\)/);
  assert.match(source, /function writeCustomerAccessAuditEvent\(input = \{\}\)/);
  assert.match(source, /recordCustomerAccessAuditEvent/);
  assert.match(source, /buildCustomerAccessAuditRepositoryRecord\(auditEvent\)/);
  assert.match(source, /normalizeCustomerAccessAuditRepositoryResult\(repositoryResult\)/);
  assert.match(source, /failed\(FAILED_REPOSITORY_REASON\)/);
  assert.match(source, /failed\(FAILED_AUDIT_EVENT_REASON\)/);
  assert.match(source, /failed\(FAILED_PERSISTENCE_REASON\)/);
  assert.doesNotMatch(source, /Object\.assign|\.\.\.\s*input|\.\.\.\s*options|\.\.\.\s*auditEvent|module\.exports\s*=\s*function/);
});

test('persistence writer adapter is not integrated into customer access runtime files', () => {
  for (const file of [
    FILES.routes,
    FILES.controller,
    FILES.middleware,
    FILES.projectionHandler,
    FILES.projectionService,
    FILES.app,
    FILES.server,
    FILES.publicRoutes,
  ]) {
    assert.doesNotMatch(
      read(file),
      /customerAccessAuditPersistenceWriterAdapter|createCustomerAccessAuditPersistenceWriter|recordCustomerAccessAuditEvent/,
      file,
    );
  }
});
