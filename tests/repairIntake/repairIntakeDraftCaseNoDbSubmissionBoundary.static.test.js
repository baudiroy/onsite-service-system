'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const SRC_DIR = path.join(__dirname, '../../src/repairIntake');

const EXPECTED_MODULES = [
  'repairIntakeContactRoleDtoGuard.js',
  'repairIntakeDuplicateCandidateGuard.js',
  'repairIntakeDraftCaseCandidateBuilder.js',
  'repairIntakeDraftCaseCreatorInputNormalizer.js',
  'repairIntakeDraftCaseEligibility.js',
  'repairIntakeDraftCasePlanningService.js',
  'repairIntakeDraftCasePreflightService.js',
  'repairIntakeDraftCaseSubmissionAuditEventBuilder.js',
  'repairIntakeDraftCaseSubmissionCommandGuard.js',
  'repairIntakeDraftCaseSubmissionEnvelopeNormalizer.js',
  'repairIntakeDraftCaseSubmissionIdempotencyResultNormalizer.js',
  'repairIntakeDraftCaseSubmissionResultNormalizer.js',
  'repairIntakeDraftCaseSubmissionService.js',
];

const LATER_PHASE_RUNTIME_MODULES = [
  'repairIntakeDraftCaseApplicationServiceFactory.js',
  'repairIntakeDraftCaseAuditWriterAdapter.js',
  'repairIntakeDraftCaseControllerAdapter.js',
  'repairIntakeDraftCaseIdempotencyCheckerAdapter.js',
  'repairIntakeDraftCaseRouteFactory.js',
  'repairIntakeDraftCaseRuntimeDependencyFactory.js',
];

const FORBIDDEN_IMPORT_SPECIFIERS = [
  /(?:^|\/)(?:db|database|sql|transaction|migrations?)(?:\/|$)/i,
  /(?:^|\/)repositories?(?:\/|$)/i,
  /(?:^|\/)(?:routes?|controllers?|dto|openapi)(?:\/|$)/i,
  /(?:^|\/)(?:providers?|line|sms|email|webhooks?)(?:\/|$)/i,
  /(?:^|\/)(?:ai|rag|vector)(?:\/|$)/i,
  /(?:^|\/)(?:billing|settlement|payment|invoice)(?:\/|$)/i,
  /(?:^|\/)admin(?:\/|$)/i,
  /(?:^|\/)(?:smoke|shared)(?:\/|$)/i,
];

const FORBIDDEN_SOURCE_PATTERNS = [
  /\b(?:dbClient|databaseClient|databasePool|sqlClient|transactionClient|queryExecutor)\b/i,
  /\b(?:repository|Repository|repositories)\b/,
  /\b(?:route|router|controller|openapi|dto)\b/i,
  /\b(?:lineClient|lineProvider|smsClient|emailClient|webhookClient|providerPayload)\b/,
  /\b(?:aiProvider|rag|vectorStore|embeddingProvider)\b/i,
  /\b(?:billing|settlement|payment|invoice)\b/i,
  /\b(?:auditWriter|auditPersistence|persistAudit|writeAudit|defaultAuditWriter)\b/,
  /\b(?:defaultWriter|repositoryBackedWriter|defaultIdempotencyChecker|idempotencyStore|idempotencyWriter)\b/,
  /\b(?:adminFrontend|admin\/src|smoke\/|shared\/runtime)\b/,
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

const FORBIDDEN_CASE_ID_GENERATION_PATTERNS = [
  /\bcaseId\s*:/,
  /\bcase_id\s*:/,
  /\bformalCaseId\s*:/,
  /\blinkedCaseId\s*:/,
  /\b(?:generate|create|new)[A-Za-z0-9_]*CaseId\b/,
  /\bcaseId\b[\s\S]{0,80}\brandomUUID\b/,
  /\brandomUUID\b[\s\S]{0,80}\bcaseId\b/,
  /\bcaseId\b[\s\S]{0,80}\buuid\b/i,
  /\buuid\b[\s\S]{0,80}\bcaseId\b/i,
];

function readModule(fileName) {
  return fs.readFileSync(path.join(SRC_DIR, fileName), 'utf8');
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

test('covers every current repair intake draft-to-case no-DB submission module', () => {
  const actualModules = fs.readdirSync(SRC_DIR)
    .filter((fileName) => (
      /^repairIntakeDraftCase.*\.js$/.test(fileName)
      || fileName === 'repairIntakeDuplicateCandidateGuard.js'
      || fileName === 'repairIntakeContactRoleDtoGuard.js'
    ))
    .filter((fileName) => !LATER_PHASE_RUNTIME_MODULES.includes(fileName))
    .sort();

  assert.deepEqual(actualModules, EXPECTED_MODULES.slice().sort());
});

test('later-phase runtime modules are excluded from no-DB submission inventory', () => {
  const files = fs.readdirSync(SRC_DIR);

  for (const fileName of LATER_PHASE_RUNTIME_MODULES) {
    assert.equal(files.includes(fileName), true, `${fileName} should exist as an explicit later-phase runtime module`);
    assert.equal(EXPECTED_MODULES.includes(fileName), false, `${fileName} should not be treated as a no-DB submission module`);
  }
});

test('covered modules only import accepted local no-DB submission modules', () => {
  for (const fileName of EXPECTED_MODULES) {
    const specifiers = importSpecifiers(readModule(fileName));

    for (const specifier of specifiers) {
      assert.match(
        specifier,
        /^\.\/(?:repairIntakeDraftCase[A-Za-z0-9]+|repairIntakeDuplicateCandidateGuard|repairIntakeContactRoleDtoGuard)$/,
        `${fileName} imports non-local module ${specifier}`,
      );

      for (const pattern of FORBIDDEN_IMPORT_SPECIFIERS) {
        assert.equal(pattern.test(specifier), false, `${fileName} imports forbidden dependency ${specifier}`);
      }
    }
  }
});

test('covered modules do not contain forbidden runtime boundary identifiers', () => {
  for (const fileName of EXPECTED_MODULES) {
    const source = readModule(fileName);

    for (const pattern of FORBIDDEN_SOURCE_PATTERNS) {
      assert.equal(pattern.test(source), false, `${fileName} contains forbidden boundary pattern ${pattern}`);
    }
  }
});

test('covered modules do not contain forbidden sensitive field names', () => {
  for (const fileName of EXPECTED_MODULES) {
    const source = readModule(fileName);

    for (const field of FORBIDDEN_SENSITIVE_FIELDS) {
      assert.equal(source.includes(field), false, `${fileName} contains forbidden sensitive field ${field}`);
    }
  }
});

test('covered modules do not generate or expose unsafe caseId fields', () => {
  for (const fileName of EXPECTED_MODULES) {
    const source = readModule(fileName);

    for (const pattern of FORBIDDEN_CASE_ID_GENERATION_PATTERNS) {
      assert.equal(pattern.test(source), false, `${fileName} contains unsafe caseId generation/exposure pattern ${pattern}`);
    }
  }
});
