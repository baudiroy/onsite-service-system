'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const SOURCE_PATH = path.join(__dirname, '../../src/repairIntake/repairIntakeCaseCreatorRepositoryAdapter.js');
const SOURCE = fs.readFileSync(SOURCE_PATH, 'utf8');

function importSpecifiers(source) {
  const specifiers = [];
  const requirePattern = /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g;
  const importPattern = /\bfrom\s+['"]([^'"]+)['"]/g;

  for (const pattern of [requirePattern, importPattern]) {
    let match;

    while ((match = pattern.exec(source)) !== null) {
      specifiers.push(match[1]);
    }
  }

  return specifiers;
}

function sourceWithoutForbiddenInputDenyList(source) {
  return source.replace(
    /const FORBIDDEN_INPUT_FIELDS = new Set\(\[[\s\S]*?\]\);\n\n/,
    'const FORBIDDEN_INPUT_FIELDS = new Set([]);\n\n',
  );
}

test('adapter imports only accepted local normalizer and audit event builder helpers', () => {
  assert.deepEqual(importSpecifiers(SOURCE).sort(), [
    './repairIntakeDraftCaseSubmissionAuditEventBuilder',
    './repairIntakeDraftCaseSubmissionResultNormalizer',
  ].sort());
});

test('adapter does not import forbidden concrete runtime dependencies', () => {
  for (const specifier of importSpecifiers(SOURCE)) {
    for (const forbidden of [
      /(?:^|\/)(?:db|database|sql|migrations?)(?:\/|$)/i,
      /(?:^|\/)repositories?(?:\/|$)/i,
      /(?:^|\/)(?:routes?|controllers?|dto|openapi)(?:\/|$)/i,
      /(?:^|\/)(?:providers?|line|sms|app|email|webhooks?)(?:\/|$)/i,
      /(?:^|\/)(?:ai|rag|vector)(?:\/|$)/i,
      /(?:^|\/)(?:billing|settlement|payment|invoice)(?:\/|$)/i,
      /(?:^|\/)admin(?:\/|$)/i,
      /(?:^|\/)(?:smoke|shared)(?:\/|$)/i,
      /^(?:pg|sequelize|knex|mysql|mysql2|postgres|sqlite3|openai)$/i,
    ]) {
      assert.equal(forbidden.test(specifier), false, `forbidden import ${specifier}`);
    }
  }
});

test('adapter does not construct default repositories writers DB clients or providers', () => {
  for (const forbidden of [
    /\bnew\s+[A-Za-z0-9_]*(?:Repository|Writer|Provider|Client|Pool)\b/,
    /\bcreateDefault[A-Za-z0-9_]*(?:Repository|Writer|Provider|Client|Pool)\b/,
    /\bdefault(?:Repository|Writer|AuditWriter|IdempotencyChecker|IdempotencyStore|Provider)\b/,
    /\brepositoryBackedWriter\b/,
    /\bauditPersistence\b/,
    /\bwriteAuditPersistence\b/,
    /\brawSql\b/i,
    /\bexecuteSql\b/i,
    /\bqueryExecutor\b/,
  ]) {
    assert.equal(forbidden.test(SOURCE), false, `forbidden concrete dependency pattern ${forbidden}`);
  }
});

test('adapter does not contain forbidden sensitive fields outside the explicit input deny-list', () => {
  const source = sourceWithoutForbiddenInputDenyList(SOURCE);

  for (const forbidden of [
    'finalAppointmentId',
    'fullAddress',
    'rawAddress',
    'phoneNumber',
    'lineAccessToken',
    'tokenSecret',
    'rawCustomerPayload',
    'rawImportedRow',
  ]) {
    assert.equal(source.includes(forbidden), false, `forbidden sensitive field outside deny-list ${forbidden}`);
  }
});

test('adapter keeps accepted injected seam names without concrete imports', () => {
  for (const allowed of [
    'caseRepository',
    'repairIntakeDraftRepository',
    'transactionRunner',
    'auditWriter',
    'caseRef',
    'sourceDraftId',
    'organizationId',
    'idempotencyKey',
  ]) {
    assert.equal(SOURCE.includes(allowed), true, `expected injected/safe term ${allowed}`);
  }
});
