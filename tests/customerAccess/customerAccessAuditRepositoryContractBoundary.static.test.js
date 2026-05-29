'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  contract: 'src/customerAccess/customerAccessAuditRepositoryContract.js',
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

function requireSpecifiers(source) {
  const specifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers;
}

test('audit repository contract has no DB env runtime provider AI billing or migration imports', () => {
  const source = read(FILES.contract);
  const serializedSpecifiers = JSON.stringify(requireSpecifiers(source));

  assert.match(source, /buildCustomerAccessAuditRepositoryRecord/);
  assert.match(source, /normalizeCustomerAccessAuditRepositoryResult/);
  assert.match(source, /CUSTOMER_ACCESS_AUDIT_REPOSITORY_RECORD_KEYS/);
  assert.doesNotMatch(
    serializedSpecifiers,
    /pg|knex|sequelize|prisma|migrations?|sql|repository|dbAdapter|app|server|routes|controller|provider|openai|rag|billing|stripe|line|sms|email/i,
  );
  assert.doesNotMatch(
    source,
    /process\.env|DATABASE_URL|JWT_SECRET|new Pool|createPool|psql|db:migrate|db:seed|fetch\(|axios|http\.request|https\.request|app\.listen|server\.listen|express\s*\(/i,
  );
});

test('audit repository contract stays pure deterministic and non-runtime', () => {
  const source = read(FILES.contract);

  assert.doesNotMatch(source, /Date\.now|new Date\(|Math\.random|crypto|randomUUID|createHash|setTimeout|setInterval/i);
  assert.doesNotMatch(source, /fs\.|writeFile|readFile|appendFile|mkdir|unlink|rm\(|child_process|exec\(|spawn\(/i);
  assert.doesNotMatch(source, /\binsert\s*\(|\bupdate\s*\(|\bdelete\s*\(|\bupsert\s*\(|\btransaction\b/i);
  assert.doesNotMatch(source, /CREATE TABLE|ALTER TABLE|DROP TABLE|SELECT |INSERT |UPDATE |DELETE |VALUES\s*\(/i);
});

test('audit repository contract is not integrated into customer access runtime files', () => {
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
    assert.doesNotMatch(read(file), /customerAccessAuditRepositoryContract/, file);
  }
});
