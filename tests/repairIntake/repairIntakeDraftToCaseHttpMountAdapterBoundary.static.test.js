'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const SOURCE_PATH = path.join(
  __dirname,
  '../../src/repairIntake/repairIntakeDraftToCaseHttpMountAdapter.js',
);

const FORBIDDEN_IMPORT_SPECIFIER_PATTERNS = [
  /(?:^|\/)(?:app|server)(?:\.js|\/|$)/i,
  /(?:^|\/)(?:bootstrap|routes\/index|public\.routes)(?:\.js|\/|$)/i,
  /(?:^|\/)(?:dto|openapi|swagger)(?:\.js|\/|$)/i,
  /(?:^|\/)(?:db|database|sql|migrations?)(?:\.js|\/|$)/i,
  /(?:^|\/)repositories?(?:\.js|\/|$)/i,
  /(?:^|\/)(?:runtimeDependencyFactory|applicationServiceFactory)(?:\.js|\/|$)/i,
  /(?:^|\/)(?:controllers?|routeFactory|apiModule)(?:\.js|\/|$)/i,
  /(?:^|\/)(?:providers?|line|sms|email|webhooks?)(?:\.js|\/|$)/i,
  /(?:^|\/)(?:ai|rag|vector)(?:\.js|\/|$)/i,
  /(?:^|\/)(?:billing|settlement|payment|invoice)(?:\.js|\/|$)/i,
  /(?:^|\/)admin(?:\.js|\/|$)/i,
  /(?:^|\/)(?:smoke|shared)(?:\.js|\/|$)/i,
  /(?:^|\/)(?:package|package\.json)(?:$|\/)/i,
];

const FORBIDDEN_SOURCE_PATTERNS = [
  /\b(?:express|Router)\s*\(/,
  /\b(?:defaultApp|defaultRouter|globalRouter|appRouter|serverRouter)\b/,
  /\b(?:defaultApplicationService|globalApplicationService)\b/,
  /\bcreateRepairIntakeDraftCaseRuntimeDependencyFactory\b/,
  /\brepairIntakeDraftCaseRuntimeDependencyFactory\b/,
  /\bcreateRepairIntakeDraftCaseApplicationServiceFactory\b/,
  /\brepairIntakeDraftCaseApplicationServiceFactory\b/,
  /\bcreateRepairIntakeDraftCaseControllerAdapter\b/,
  /\bcreateRepairIntakeDraftCaseRoutes\b/,
  /\bcreateRepairIntakeDraftToCaseApiModule\b/,
  /\b(?:dbClient|databaseClient|databasePool|sqlClient|queryExecutor|transactionRunner)\b/,
  /\b(?:query|insert|update|findOne|selectOne|transaction)\s*\(/,
  /\b(?:Repository|repositories|repositoryBacked)\b/,
  /\b(?:providerClient|lineClient|smsClient|emailClient|webhookClient)\b/,
  /\b(?:sendLine|sendSms|sendEmail|sendWebhook|providerPayload)\b/,
  /\b(?:aiProvider|rag|vectorStore|embeddingProvider)\b/i,
  /\b(?:billing|settlement|payment|invoice)\b/i,
  /\b(?:adminFrontend|admin\/src|smoke\/|shared\/runtime)\b/,
  /\b(?:openapi|swagger|dto)\b/i,
  /\b(?:app\.js|server\.js|routes\/index|public\.routes)\b/,
  /\bprocess\.env\b/,
  /\b(?:pg|knex|sequelize)\b/,
  /\bpackage\.json\b/,
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
  'mountTarget',
  'apiModule',
  'routes',
  'basePath',
  'handler',
  'register',
];

function readSource() {
  return fs.readFileSync(SOURCE_PATH, 'utf8');
}

function importSpecifiers(source) {
  const specifiers = [];
  const patterns = [
    /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\bfrom\s+['"]([^'"]+)['"]/g,
  ];

  for (const pattern of patterns) {
    let match;

    while ((match = pattern.exec(source)) !== null) {
      specifiers.push(match[1]);
    }
  }

  return specifiers;
}

test('HTTP mount adapter source exists for static boundary coverage', () => {
  assert.equal(fs.existsSync(SOURCE_PATH), true);
});

test('HTTP mount adapter does not import or require any modules', () => {
  assert.deepEqual(importSpecifiers(readSource()), []);
});

test('HTTP mount adapter does not import forbidden runtime dependencies', () => {
  const specifiers = importSpecifiers(readSource());

  for (const specifier of specifiers) {
    for (const pattern of FORBIDDEN_IMPORT_SPECIFIER_PATTERNS) {
      assert.equal(pattern.test(specifier), false, `forbidden import specifier ${specifier}`);
    }
  }
});

test('HTTP mount adapter does not construct default global dependencies', () => {
  const source = readSource();

  for (const pattern of FORBIDDEN_SOURCE_PATTERNS) {
    assert.equal(pattern.test(source), false, `mount adapter contains forbidden runtime pattern ${pattern}`);
  }
});

test('HTTP mount adapter source does not contain forbidden sensitive field strings', () => {
  const source = readSource();

  for (const field of FORBIDDEN_SENSITIVE_FIELDS) {
    assert.equal(source.includes(field), false, `mount adapter contains forbidden sensitive field ${field}`);
  }
});

test('accepted injected seam names remain allowed by the boundary guard', () => {
  const source = readSource();

  for (const seamName of ACCEPTED_INJECTED_SEAM_NAMES) {
    assert.equal(source.includes(seamName), true, `expected injected seam name ${seamName}`);
  }
});
