'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const SOURCE_PATH = path.join(__dirname, '../../src/repairIntake/repairIntakeDraftToCaseRouteRegistrar.js');

const FORBIDDEN_IMPORT_SPECIFIERS = [
  /(?:^|\/)(?:app|server)(?:\/|$)/i,
  /(?:^|\/)(?:routes?|routeRegistry|router|index)(?:\/|$)/i,
  /(?:^|\/)(?:controllers?|dto|openapi)(?:\/|$)/i,
  /(?:^|\/)(?:db|database|sql|transaction|migrations?)(?:\/|$)/i,
  /(?:^|\/)repositories?(?:\/|$)/i,
  /(?:^|\/)(?:providers?|line|sms|email|webhooks?)(?:\/|$)/i,
  /(?:^|\/)(?:ai|rag|vector)(?:\/|$)/i,
  /(?:^|\/)(?:billing|settlement|payment|invoice)(?:\/|$)/i,
  /(?:^|\/)admin(?:\/|$)/i,
  /(?:^|\/)(?:smoke|shared)(?:\/|$)/i,
];

const FORBIDDEN_SOURCE_PATTERNS = [
  /\brequire\(/,
  /\bimport\s+/,
  /\b(?:express|Router)\s*\(/,
  /\b(?:defaultRouter|globalRouter|appRouter|serverRouter)\b/,
  /\b(?:defaultApplicationService|defaultController|defaultRouteFactory)\b/,
  /\bcreateRepairIntakeDraftCaseRoutes\b/,
  /\bcreateRepairIntakeDraftCaseController\b/,
  /\bcreateRepairIntakeDraftCaseApplicationServiceFactory\b/,
  /\brepairIntakeDraftCaseRuntimeDependencyFactory\b/,
  /\b(?:dbClient|databaseClient|databasePool|sqlClient|queryExecutor|transactionRunner)\b/,
  /\b(?:Repository|repositories|repositoryBacked)\b/,
  /\b(?:providerClient|lineClient|smsClient|emailClient|webhookClient|sendLine|sendSms|sendEmail)\b/,
  /\b(?:aiProvider|rag|vectorStore|embeddingProvider)\b/i,
  /\b(?:billing|settlement|payment|invoice)\b/i,
  /\b(?:adminFrontend|admin\/src|smoke\/|shared\/runtime)\b/,
  /\b(?:openapi|swagger|dto)\b/i,
  /\bprocess\.env\b/,
  /\b(?:pg|knex|sequelize)\b/,
];

const FORBIDDEN_SENSITIVE_FIELDS = [
  'finalAppointmentId',
  'fullAddress',
  'rawAddress',
  'phoneNumber',
  'lineAccessToken',
  'tokenSecret',
  'rawCustomerPayload',
  'rawImportedRow',
];

const ACCEPTED_INJECTED_SEAM_NAMES = [
  'router',
  'routes',
  'basePath',
  'handler',
];

function readSource() {
  return fs.readFileSync(SOURCE_PATH, 'utf8');
}

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

test('registrar source exists for static boundary coverage', () => {
  assert.equal(fs.existsSync(SOURCE_PATH), true);
});

test('registrar does not import or require forbidden runtime dependencies', () => {
  const specifiers = importSpecifiers(readSource());

  assert.deepEqual(specifiers, []);

  for (const specifier of specifiers) {
    for (const pattern of FORBIDDEN_IMPORT_SPECIFIERS) {
      assert.equal(pattern.test(specifier), false, `forbidden import specifier ${specifier}`);
    }
  }
});

test('registrar does not construct default global dependencies', () => {
  const source = readSource();

  for (const pattern of FORBIDDEN_SOURCE_PATTERNS) {
    assert.equal(pattern.test(source), false, `registrar contains forbidden runtime pattern ${pattern}`);
  }
});

test('registrar source does not contain forbidden sensitive field strings', () => {
  const source = readSource();

  for (const field of FORBIDDEN_SENSITIVE_FIELDS) {
    assert.equal(source.includes(field), false, `registrar contains forbidden sensitive field ${field}`);
  }
});

test('accepted injected seam names remain allowed by the boundary guard', () => {
  const source = readSource();

  for (const seamName of ACCEPTED_INJECTED_SEAM_NAMES) {
    assert.equal(source.includes(seamName), true, `expected injected seam name ${seamName}`);
  }
});
