'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  normalizer: 'src/customerAccess/customerAccessAuditWriterResultNormalizer.js',
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

test('Task2106 and Task2107 audit writer result normalizer source tests and docs exist', () => {
  for (const file of [
    FILES.normalizer,
    'tests/customerAccess/customerAccessAuditWriterResultNormalizer.unit.test.js',
    'tests/customerAccess/customerAccessAuditWriterResultNormalizerBoundary.static.test.js',
    'docs/task-2106-customer-access-audit-writer-contract-skeleton-no-db-no-persistence-no-provider.md',
    'docs/task-2107-customer-access-audit-writer-result-normalizer-status-matrix-guard-no-db-no-persistence-no-provider.md',
  ]) {
    assert.equal(exists(file), true, `${file} should exist`);
  }
});

test('audit writer result normalizer has no forbidden imports or side effects', () => {
  const source = read(FILES.normalizer);

  assert.doesNotMatch(source, /require\(|import\s/);
  assert.doesNotMatch(source, /process\.env|globalThis|global\.|Date\.now|new Date|Math\.random|crypto\.randomUUID|randomUUID|randomBytes|console\.|fetch\(|axios|http\.request|https\.request/i);
  assert.doesNotMatch(source, /fs\.|readFile|writeFile|appendFile|createWriteStream|createReadStream/i);
  assert.doesNotMatch(source, /app\.listen|server\.listen|listen\(|express\s*\(|Router\s*\(|router\.(get|post|use)/i);
  assert.doesNotMatch(source, /pg|knex|sequelize|prisma|mysql|sqlite|Pool\(|Client\(|connect\(|query\(|psql|migration|schema|index|seed/i);
  assert.doesNotMatch(source, /Zeabur|DATABASE_URL|JWT_SECRET|provider|OpenAI|RAG|model|billing|settlement|payment|invoice|LINE|SMS|Email|webhook/i);
  assert.doesNotMatch(source, /customerAccessRoutes|customerAccessController|Repository|DbAdapter|ProjectionHandler|AuditBoundary|AuditEventBuilder/i);
});

test('audit writer result normalizer exposes explicit allowlisted contract', () => {
  const source = read(FILES.normalizer);

  assert.match(source, /CUSTOMER_ACCESS_AUDIT_WRITER_RESULT_KEYS = Object\.freeze\(\[/);
  assert.match(source, /CUSTOMER_ACCESS_AUDIT_WRITER_STATUSES = Object\.freeze\(\[/);
  assert.match(source, /CUSTOMER_ACCESS_AUDIT_WRITER_REASON_CODES = Object\.freeze\(\[/);
  assert.match(source, /const SKIPPED_REASON_CODES = new Set\(\[/);
  assert.match(source, /const FAILED_REASON_CODES = new Set\(\[/);
  assert.match(source, /function normalizeCustomerAccessAuditWriterResult\(input\)/);
  assert.match(source, /status: STATUS_RECORDED/);
  assert.match(source, /status: STATUS_SKIPPED/);
  assert.match(source, /status: STATUS_FAILED/);
  assert.doesNotMatch(source, /Object\.assign|\.\.\.\s*input|result\[[^[\\]]+\]\s*=/);
});

test('audit writer result normalizer is not integrated into runtime routes controllers or middleware', () => {
  for (const file of [FILES.route, FILES.controller, FILES.contextMiddleware]) {
    const source = read(file);

    assert.doesNotMatch(
      source,
      /customerAccessAuditWriterResultNormalizer|normalizeCustomerAccessAuditWriterResult/,
      file,
    );
  }
});
