'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  normalizer: 'src/dataCorrection/dataCorrectionDecisionAuditWriterResultNormalizer.js',
  invocation: 'src/dataCorrection/dataCorrectionDecisionAuditWriterInvocation.js',
  inputBuilder: 'src/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilder.js',
  requestService: 'src/dataCorrection/dataCorrectionRequestService.js',
  applyService: 'src/dataCorrection/preDepartureCorrectionApplicationService.js',
  route: 'src/routes/dataCorrectionRoutes.js',
  controller: 'src/controllers/dataCorrectionController.js',
  app: 'src/app.js',
  server: 'src/server.js',
  task900Doc: 'docs/task-900-data-correction-decision-audit-writer-result-normalizer-no-db-no-api-shape-change.md',
  task901Doc: 'docs/task-901-data-correction-decision-audit-writer-result-normalizer-closure-guard-no-db-no-api-shape-change.md',
  task902Doc: 'docs/task-902-data-correction-decision-audit-writer-invocation-boundary-helper-no-db-no-api-shape-change.md',
  task903Doc: 'docs/task-903-data-correction-decision-audit-writer-input-builder-sensitive-field-exclusion-no-db-no-api-shape-change.md',
  task904Doc: 'docs/task-904-data-correction-decision-audit-writer-sanitized-invocation-matrix-no-db-no-api-shape-change.md',
  task905Doc: 'docs/task-905-data-correction-decision-audit-writer-branch-closure-guard-no-db-no-api-shape-change.md',
  normalizerTest: 'tests/dataCorrection/dataCorrectionDecisionAuditWriterResultNormalizer.unit.test.js',
  invocationTest: 'tests/dataCorrection/dataCorrectionDecisionAuditWriterInvocation.unit.test.js',
  inputBuilderTest: 'tests/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilder.unit.test.js',
  matrixTest: 'tests/dataCorrection/dataCorrectionDecisionAuditSanitizedInvocationMatrix.unit.test.js',
  branchClosureTest: 'tests/dataCorrection/dataCorrectionDecisionAuditWriterBranchClosure.static.test.js',
});

function filePath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(filePath(relativePath), 'utf8');
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

function assertNoForbiddenImports(relativePath, extraAllowed = []) {
  const forbiddenImportPattern = /(?:^|\/)(?:db|database|pool|pg|repositories?|providers?|routes?|controllers?|app|server|ai|rag|vector|billing|settlement|admin|config|logger|permission|migrations?|smoke)(?:\/|$)|transaction|line|sms|email|push|webhook|process\.env/i;
  const allowed = new Set(extraAllowed);

  for (const specifier of requireSpecifiers(read(relativePath))) {
    if (allowed.has(specifier)) {
      continue;
    }

    assert.equal(
      forbiddenImportPattern.test(specifier),
      false,
      `${relativePath} imports forbidden dependency ${specifier}`,
    );
  }
}

function assertDocContains(relativePath, phrases) {
  const doc = read(relativePath);

  for (const phrase of phrases) {
    assert.match(
      doc,
      new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `${relativePath} missing phrase: ${phrase}`,
    );
  }
}

test('Task900 through Task905 branch evidence files are present', () => {
  Object.values(FILES).forEach((relativePath) => {
    assert.equal(fs.existsSync(filePath(relativePath)), true, `${relativePath} is missing`);
  });
});

test('normalizer invocation helper and input builder keep pure dependency boundaries', () => {
  assert.deepEqual(requireSpecifiers(read(FILES.normalizer)), []);
  assert.deepEqual(requireSpecifiers(read(FILES.inputBuilder)), []);
  assert.deepEqual(requireSpecifiers(read(FILES.invocation)), [
    './dataCorrectionDecisionAuditWriterInputBuilder',
    './dataCorrectionDecisionAuditWriterResultNormalizer',
  ]);

  [
    FILES.normalizer,
    FILES.inputBuilder,
    FILES.invocation,
  ].forEach((relativePath) => {
    assertNoForbiddenImports(relativePath);

    [
      /process\.env/,
      /console\./,
      /fetch\(/,
      /axios/,
      /createServer/,
      /listen\s*\(/,
      /client\.query/,
      /pool\.query/,
      /INSERT\s+INTO/i,
      /UPDATE\s+/i,
      /DELETE\s+/i,
    ].forEach((pattern) => {
      assert.doesNotMatch(read(relativePath), pattern, `${relativePath} has forbidden runtime pattern ${pattern}`);
    });
  });
});

test('Task900 through Task904 tests remain active and targeted at the injected writer path', () => {
  assertDocContains(FILES.task900Doc, [
    'Status: completed',
    'Public/default response body remains unchanged',
  ]);
  assertDocContains(FILES.task902Doc, [
    'Status: completed',
    'Invocation Boundary Helper',
  ]);
  assertDocContains(FILES.task903Doc, [
    'Status: completed',
    'allowlist',
    'Sensitive Field Exclusion',
  ]);
  assertDocContains(FILES.task904Doc, [
    'Status: completed',
    'synthetic writer',
    'actual service paths',
  ]);

  [
    FILES.normalizerTest,
    FILES.invocationTest,
    FILES.inputBuilderTest,
    FILES.matrixTest,
  ].forEach((relativePath) => {
    assert.equal(fs.existsSync(filePath(relativePath)), true, `${relativePath} is missing`);
  });
});

test('service path remains injected-only and does not wire default or repository-backed decision audit writer', () => {
  const requestSource = read(FILES.requestService);
  const applySource = read(FILES.applyService);
  const activeServiceSource = `${requestSource}\n${applySource}`;
  const appServerRouteControllerSource = [
    FILES.app,
    FILES.server,
    FILES.route,
    FILES.controller,
  ].map(read).join('\n');

  assert.deepEqual(requireSpecifiers(requestSource), [
    './dataCorrectionDecisionAuditIntentBuilder',
    './dataCorrectionDecisionAuditWriterInvocation',
    './dataCorrectionPolicyEngine',
  ]);
  assert.deepEqual(requireSpecifiers(applySource), [
    './dataCorrectionDecisionAuditIntentBuilder',
    './dataCorrectionDecisionAuditWriterInvocation',
    './dataCorrectionPolicyEngine',
    './dataCorrectionRequestService',
  ]);
  assert.match(activeServiceSource, /options\.decisionAuditWriter/);
  assert.doesNotMatch(activeServiceSource, /createDataCorrectionDecisionAuditWriter/);
  assert.doesNotMatch(activeServiceSource, /dataCorrectionDecisionAuditRepository/);
  assert.doesNotMatch(activeServiceSource, /defaultDecisionAuditWriter/);
  assert.doesNotMatch(activeServiceSource, /new\s+Pool|client\.query|pool\.query|INSERT\s+INTO|UPDATE\s+|DELETE\s+/i);
  assert.doesNotMatch(appServerRouteControllerSource, /createDataCorrectionDecisionAuditWriter/);
  assert.doesNotMatch(appServerRouteControllerSource, /dataCorrectionDecisionAuditRepository/);
  assert.doesNotMatch(appServerRouteControllerSource, /defaultDecisionAuditWriter/);
});

test('public route controller and default service responses keep audit side-channel fields closed', () => {
  [
    FILES.route,
    FILES.controller,
  ].forEach((relativePath) => {
    const source = read(relativePath);

    assert.doesNotMatch(source, /includeDecisionAuditIntent/);
    assert.doesNotMatch(source, /includeAuditIntent/);
    assert.doesNotMatch(source, /auditIntent/);
    assert.doesNotMatch(source, /decisionAuditWriterResult/);
    assert.doesNotMatch(source, /dataCorrectionDecisionAuditWriterInputBuilder/);
  });

  [
    FILES.requestService,
    FILES.applyService,
  ].forEach((relativePath) => {
    const source = read(relativePath);

    assert.match(source, /shouldIncludeDecisionAuditIntent/);
    assert.match(source, /options\.decisionAuditWriter/);
  });
});

test('request path remains manual and apply path remains pre-departure only', () => {
  const requestSource = read(FILES.requestService);
  const applySource = read(FILES.applyService);

  assert.doesNotMatch(requestSource, /correctionWriter/);
  assert.doesNotMatch(requestSource, /correctionApplied:\s*true/);
  assert.doesNotMatch(requestSource, /applyPreDepartureCorrection/);
  assert.match(applySource, /DATA_CORRECTION_AUDIT_ACTIONS\.APPLY/);
  assert.match(applySource, /isPreDepartureApplicationEligible/);
  assert.match(applySource, /correctionApplied:\s*true/);
  assert.doesNotMatch(applySource, /createFieldServiceReport|field_service_reports|createAppointment|updateCase|updateAppointment|finalAppointmentId\s*=/);
});

test('input builder allowlist excludes sensitive writer input fields', () => {
  const source = read(FILES.inputBuilder);
  const allowlistMatch = source.match(/SAFE_STRING_FIELDS = Object\.freeze\(\[([\s\S]*?)\]\);/);

  assert.notEqual(allowlistMatch, null, 'SAFE_STRING_FIELDS allowlist missing');

  const allowlistSource = allowlistMatch[1];

  [
    'phone',
    'mobile',
    'tel',
    'address',
    'lineUserId',
    'line_user_id',
    'finalAppointmentId',
    'fieldServiceReportId',
    'reportId',
    'token',
    'secret',
    'password',
    'apiKey',
    'rawPayload',
    'fullPayload',
    'internalNote',
    'aiRawPayload',
    'billingInternalData',
    'settlementInternalData',
  ].forEach((field) => {
    assert.doesNotMatch(allowlistSource, new RegExp(`['"]${field}['"]`), `${field} is allowlisted`);
  });

  [
    'action',
    'actorId',
    'actorRole',
    'appointmentId',
    'caseId',
    'decision',
    'eventType',
    'fieldGroup',
    'fieldKey',
    'organizationId',
    'reasonCode',
    'requestId',
    'resultStatus',
    'safeMessageKey',
    'timestamp',
  ].forEach((field) => {
    assert.match(allowlistSource, new RegExp(`['"]${field}['"]`), `${field} is missing from allowlist`);
  });
});

test('Task905 evidence doc lists Task903 and Task904 untracked file follow-up explicitly', () => {
  assertDocContains(FILES.task905Doc, [
    'Task903 and Task904 files are currently untracked in this worktree',
    'src/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilder.js',
    'src/dataCorrection/dataCorrectionDecisionAuditWriterInvocation.js',
    'tests/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilder.unit.test.js',
    'tests/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilderClosure.static.test.js',
    'docs/task-903-data-correction-decision-audit-writer-input-builder-sensitive-field-exclusion-no-db-no-api-shape-change.md',
    'tests/dataCorrection/dataCorrectionDecisionAuditSanitizedInvocationMatrix.unit.test.js',
    'tests/dataCorrection/dataCorrectionDecisionAuditSanitizedInvocationMatrixClosure.static.test.js',
    'docs/task-904-data-correction-decision-audit-writer-sanitized-invocation-matrix-no-db-no-api-shape-change.md',
  ]);
});

test('Task905 closure guard itself imports no production runtime or forbidden areas', () => {
  assert.deepEqual(requireSpecifiers(read(FILES.branchClosureTest)), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ].sort());
});
