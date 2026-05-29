'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  adapter: 'src/customerAccess/customerAccessAuditWriterAdapter.js',
  route: 'src/routes/customerAccessRoutes.js',
  controller: 'src/controllers/customerAccessController.js',
  contextMiddleware: 'src/customerAccess/customerAccessContextMiddleware.js',
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

test('Task2109 audit writer adapter source tests and docs exist', () => {
  for (const file of [
    FILES.adapter,
    'tests/customerAccess/customerAccessAuditWriterAdapter.unit.test.js',
    'tests/customerAccess/customerAccessAuditWriterAdapterBoundary.static.test.js',
    'docs/task-2109-customer-access-audit-writer-adapter-skeleton-injected-writer-only-no-db-no-persistence-no-provider.md',
  ]) {
    assert.equal(exists(file), true, `${file} should exist`);
  }
});

test('audit writer adapter imports only accepted customer access audit contracts', () => {
  const source = read(FILES.adapter);

  assert.deepEqual(requireSpecifiers(source), [
    './customerAccessAuditEventBuilder',
    './customerAccessAuditWriterResultNormalizer',
  ]);
  assert.doesNotMatch(source, /import\s/);
});

test('audit writer adapter has no runtime, database, network, env, or route side effects', () => {
  const source = read(FILES.adapter);

  assert.doesNotMatch(source, /process\.env|globalThis|global\.|Date\.now|new Date|Math\.random|crypto\.randomUUID|randomUUID|randomBytes|console\.|fetch\(|axios|http\.request|https\.request/i);
  assert.doesNotMatch(source, /fs\.|readFile|writeFile|appendFile|createWriteStream|createReadStream/i);
  assert.doesNotMatch(source, /app\.listen|server\.listen|listen\(|express\s*\(|Router\s*\(|router\.(get|post|use)|\.get\(.*handler/i);
  assert.doesNotMatch(source, /pg|knex|sequelize|prisma|mysql|sqlite|Pool\(|Client\(|connect\(|query\(|psql|migration|schema|index|seed/i);
  assert.doesNotMatch(source, /Zeabur|DATABASE_URL|JWT_SECRET|OpenAI|RAG|model|billing|settlement|payment|invoice|LINE|SMS|Email|webhook/i);
  assert.doesNotMatch(source, /customerAccessRoutes|customerAccessController|Repository|DbAdapter|ProjectionHandler|AuditBoundary/i);
});

test('audit writer adapter contract is injected function writer only', () => {
  const source = read(FILES.adapter);

  assert.match(source, /function writeCustomerAccessAuditEvent\(input = \{\}\)/);
  assert.match(source, /typeof writer !== 'function'/);
  assert.match(source, /failed\('audit_writer_unavailable'\)/);
  assert.match(source, /failed\('audit_event_invalid'\)/);
  assert.match(source, /failed\('audit_persistence_failed'\)/);
  assert.match(source, /normalizeCustomerAccessAuditWriterResult\(writerResult\)/);
  assert.doesNotMatch(source, /\.write\(|writer\.write|writer\[['"]write['"]\]|Object\.assign|\.\.\.\s*value|\.\.\.\s*input/);
});

test('audit writer adapter is not integrated into runtime routes controllers or middleware', () => {
  for (const file of [FILES.route, FILES.controller, FILES.contextMiddleware]) {
    const source = read(file);

    assert.doesNotMatch(
      source,
      /customerAccessAuditWriterAdapter|writeCustomerAccessAuditEvent/,
      file,
    );
  }
});
