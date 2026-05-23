'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const EXPECTED_SOURCE_FILES = [
  'src/controllers/dataCorrectionController.js',
  'src/dataCorrection/dataCorrectionGovernanceOrchestrator.js',
  'src/dataCorrection/dataCorrectionDecisionAuditIntentBuilder.js',
  'src/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilder.js',
  'src/dataCorrection/dataCorrectionDecisionAuditWriterInvocation.js',
  'src/dataCorrection/dataCorrectionDecisionAuditWriterResultNormalizer.js',
  'src/dataCorrection/dataCorrectionPermissionMiddleware.js',
  'src/dataCorrection/dataCorrectionPolicyEngine.js',
  'src/dataCorrection/dataCorrectionRequestService.js',
  'src/dataCorrection/dataCorrectionSafeWriters.js',
  'src/dataCorrection/followUpAppointmentProposalService.js',
  'src/dataCorrection/postDepartureCorrectionFreezeService.js',
  'src/dataCorrection/preDepartureCorrectionApplicationService.js',
  'src/dataCorrection/unableToCompleteAppointmentResultService.js',
  'src/routes/dataCorrectionRoutes.js',
];

const EXPECTED_IMPORTS = new Map([
  ['src/routes/dataCorrectionRoutes.js', [
    '../controllers/dataCorrectionController',
    '../dataCorrection/dataCorrectionPermissionMiddleware',
  ]],
  ['src/controllers/dataCorrectionController.js', [
    '../dataCorrection/dataCorrectionGovernanceOrchestrator',
  ]],
  ['src/dataCorrection/dataCorrectionGovernanceOrchestrator.js', [
    './dataCorrectionRequestService',
    './followUpAppointmentProposalService',
    './postDepartureCorrectionFreezeService',
    './preDepartureCorrectionApplicationService',
    './unableToCompleteAppointmentResultService',
  ]],
  ['src/dataCorrection/preDepartureCorrectionApplicationService.js', [
    './dataCorrectionDecisionAuditIntentBuilder',
    './dataCorrectionDecisionAuditWriterInvocation',
    './dataCorrectionPolicyEngine',
    './dataCorrectionRequestService',
  ]],
  ['src/dataCorrection/postDepartureCorrectionFreezeService.js', [
    './dataCorrectionPolicyEngine',
    './dataCorrectionRequestService',
  ]],
  ['src/dataCorrection/dataCorrectionRequestService.js', [
    './dataCorrectionDecisionAuditIntentBuilder',
    './dataCorrectionDecisionAuditWriterInvocation',
    './dataCorrectionPolicyEngine',
  ]],
  ['src/dataCorrection/dataCorrectionDecisionAuditWriterInvocation.js', [
    './dataCorrectionDecisionAuditWriterInputBuilder',
    './dataCorrectionDecisionAuditWriterResultNormalizer',
  ]],
]);

function sourcePath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function sourceText(relativePath) {
  return fs.readFileSync(sourcePath(relativePath), 'utf8');
}

function requireSpecifiers(source) {
  const specifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers.sort();
}

function allSourceEntries() {
  return EXPECTED_SOURCE_FILES.map((relativePath) => ({
    relativePath,
    source: sourceText(relativePath),
  }));
}

test('all expected Data Correction source files exist', () => {
  for (const relativePath of EXPECTED_SOURCE_FILES) {
    assert.equal(fs.existsSync(sourcePath(relativePath)), true, `${relativePath} missing`);
  }
});

test('Data Correction source files do not import DB, repository, transaction, provider, or AI modules', () => {
  const forbiddenImportPattern = /(?:^|\/)(?:db|pool|repositories?|services?|providers?|ai|rag|vector|openai)(?:\/|$)|transaction|line|sms|email|push|provider/i;

  for (const { relativePath, source } of allSourceEntries()) {
    for (const specifier of requireSpecifiers(source)) {
      assert.equal(
        forbiddenImportPattern.test(specifier),
        false,
        `${relativePath} imports forbidden dependency ${specifier}`,
      );
    }
  }
});

test('Data Correction services do not import route, controller, app, or server modules', () => {
  const serviceFiles = EXPECTED_SOURCE_FILES.filter((relativePath) => (
    relativePath.startsWith('src/dataCorrection/')
  ));
  const upperLayerImportPattern = /(^|\/)(routes?|controllers?|app|server)(\/|$)|^\.\.\/(routes?|controllers?|app|server)$/i;

  for (const relativePath of serviceFiles) {
    for (const specifier of requireSpecifiers(sourceText(relativePath))) {
      assert.equal(
        upperLayerImportPattern.test(specifier),
        false,
        `${relativePath} imports upper-layer dependency ${specifier}`,
      );
    }
  }
});

test('route, controller, and orchestrator dependency direction is explicit', () => {
  for (const relativePath of EXPECTED_SOURCE_FILES) {
    const expected = (EXPECTED_IMPORTS.get(relativePath) || []).sort();
    const actual = requireSpecifiers(sourceText(relativePath));

    assert.deepEqual(actual, expected, `${relativePath} dependency direction changed`);
  }
});

test('route file imports only controller and permission middleware', () => {
  assert.deepEqual(requireSpecifiers(sourceText('src/routes/dataCorrectionRoutes.js')), [
    '../controllers/dataCorrectionController',
    '../dataCorrection/dataCorrectionPermissionMiddleware',
  ]);
});

test('controller imports only orchestrator', () => {
  assert.deepEqual(requireSpecifiers(sourceText('src/controllers/dataCorrectionController.js')), [
    '../dataCorrection/dataCorrectionGovernanceOrchestrator',
  ]);
});

test('orchestrator imports only Data Correction services', () => {
  assert.deepEqual(requireSpecifiers(sourceText('src/dataCorrection/dataCorrectionGovernanceOrchestrator.js')), [
    './dataCorrectionRequestService',
    './followUpAppointmentProposalService',
    './postDepartureCorrectionFreezeService',
    './preDepartureCorrectionApplicationService',
    './unableToCompleteAppointmentResultService',
  ]);
});

test('no Data Correction source file reads process.env or logs payload/request/env/config', () => {
  for (const { relativePath, source } of allSourceEntries()) {
    assert.doesNotMatch(source, /process\.env/, `${relativePath} reads process.env`);
    assert.doesNotMatch(source, /console\.(log|info|warn|error|debug)/, `${relativePath} uses console logging`);
    assert.doesNotMatch(source, /logger\.(log|info|warn|error|debug)\s*\([^)]*(payload|request|req|env|config)/is, `${relativePath} logs sensitive context`);
  }
});

test('no source file echoes raw sensitive keys into responses or writer output patterns', () => {
  const unsafeOutputPatterns = [
    /res\.json\([^)]*(rawPhone|rawAddress|rawLineUserId|token|secret|password|DATABASE_URL|DB_URL|POSTGRES_URL)/is,
    /(rawPhone|rawAddress|rawLineUserId|token|secret|password|DATABASE_URL|DB_URL|POSTGRES_URL)\s*:\s*(request|req|payload|body|headers|cookies)\b/is,
    /(fromValue|toValue|internalNote|aiRawPayload|auditRawPayload|finalAppointmentId)\s*:\s*(request|req|payload|body|headers|cookies)\b/is,
  ];

  for (const { relativePath, source } of allSourceEntries()) {
    for (const pattern of unsafeOutputPatterns) {
      assert.doesNotMatch(source, pattern, `${relativePath} has unsafe output pattern ${pattern}`);
    }
  }
});

test('no official Field Service Report, appointment, case, or finalAppointmentId mutation pattern exists', () => {
  const mutationPatterns = [
    /createFieldServiceReport\s*\(/,
    /field_service_reports/i,
    /finalAppointmentId\s*=/,
    /createAppointment\s*\(/,
    /updateCase\s*\(/,
    /updateAppointment\s*\(/,
  ];

  for (const { relativePath, source } of allSourceEntries()) {
    for (const pattern of mutationPatterns) {
      assert.doesNotMatch(source, pattern, `${relativePath} has forbidden mutation pattern ${pattern}`);
    }
  }
});
