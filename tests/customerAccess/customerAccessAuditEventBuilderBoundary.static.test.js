'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  builder: 'src/customerAccess/customerAccessAuditEventBuilder.js',
  route: 'src/routes/customerAccessRoutes.js',
  controller: 'src/controllers/customerAccessController.js',
  serviceReportHandler: 'src/customerAccess/customerServiceReportProjectionHandler.js',
});

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function exists(file) {
  return fs.existsSync(path.join(repoRoot, file));
}

test('Task2101 through Task2103 audit event builder source tests and docs exist', () => {
  for (const file of [
    FILES.builder,
    'tests/customerAccess/customerAccessAuditEventBuilder.unit.test.js',
    'tests/customerAccess/customerAccessAuditEventBuilderBoundary.static.test.js',
    'docs/task-2101-customer-access-audit-event-contract-skeleton-no-db-no-provider-no-smoke.md',
    'docs/task-2102-customer-access-audit-event-builder-immutability-determinism-guard-no-db-no-provider-no-smoke.md',
    'docs/task-2103-customer-access-audit-event-builder-decision-reason-matrix-guard-no-db-no-provider-no-smoke.md',
  ]) {
    assert.equal(exists(file), true, `${file} should exist`);
  }
});

test('audit event builder has no forbidden imports or runtime side effects', () => {
  const source = read(FILES.builder);

  assert.doesNotMatch(source, /require\(|import\s/);
  assert.doesNotMatch(source, /process\.env|globalThis|global\.|Date\.now|new Date|Math\.random|crypto\.randomUUID|randomUUID|randomBytes|console\.|fetch\(|axios|http\.request|https\.request/i);
  assert.doesNotMatch(source, /fs\.|readFile|writeFile|appendFile|createWriteStream|createReadStream/i);
  assert.doesNotMatch(source, /app\.listen|server\.listen|listen\(|express\s*\(|Router\s*\(|router\.(get|post|use)|\.get\(.*handler/i);
  assert.doesNotMatch(source, /pg|knex|sequelize|prisma|mysql|sqlite|Pool\(|Client\(|connect\(|query\(|psql|migration|schema|index|seed/i);
  assert.doesNotMatch(source, /Zeabur|DATABASE_URL|JWT_SECRET|provider|OpenAI|RAG|model|billing|settlement|payment|invoice|LINE|SMS|Email|webhook/i);
  assert.doesNotMatch(source, /customerAccessRoutes|customerAccessController|Repository|DbAdapter|ProjectionHandler|AuditBoundary/i);
});

test('audit event builder output contract is explicit and allowlisted', () => {
  const source = read(FILES.builder);

  assert.match(source, /SUPPORTED_CUSTOMER_ACCESS_AUDIT_EVENT_TYPES = Object\.freeze\(\[/);
  assert.match(source, /'customer_access\.case_overview\.allow'/);
  assert.match(source, /'customer_access\.case_overview\.deny'/);
  assert.match(source, /'customer_access\.service_report\.allow'/);
  assert.match(source, /'customer_access\.service_report\.deny'/);
  assert.match(source, /'customer_access\.route_registration\.success'/);
  assert.match(source, /'customer_access\.route_registration\.failure'/);
  assert.match(source, /CUSTOMER_ACCESS_AUDIT_EVENT_KEYS = Object\.freeze\(\[/);
  assert.match(source, /CUSTOMER_ACCESS_AUDIT_METADATA_KEYS = Object\.freeze\(\[/);
  assert.match(source, /function sanitizedMetadata\(value\)/);
  assert.match(source, /const EVENT_MATRIX = Object\.freeze\(\{/);
  assert.match(source, /function normalizedMatrixFields\(input, eventType\)/);
  assert.match(source, /invalid_decision/);
  assert.match(source, /invalid_reason_code/);
  assert.match(source, /invalid_route/);
  assert.match(source, /invalid_method/);
  assert.match(source, /invalid_source/);
  assert.match(source, /function buildCustomerAccessAuditEvent\(input\)/);
  assert.match(source, /ok: true,\s*auditEvent/);
  assert.match(source, /ok: false,\s*reasonCode/);
  assert.doesNotMatch(source, /auditEvent\[[^[\\]]+\]\s*=/);
  assert.doesNotMatch(source, /Object\.assign\(\s*auditEvent|\.{3}\s*input|metadata\s*=\s*value/);
});

test('audit event builder is not integrated into runtime routes controllers or handlers', () => {
  for (const file of [FILES.route, FILES.controller, FILES.serviceReportHandler]) {
    const source = read(file);

    assert.doesNotMatch(source, /customerAccessAuditEventBuilder|buildCustomerAccessAuditEvent/, file);
  }
});
