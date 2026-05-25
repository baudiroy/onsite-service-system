'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  builder: 'src/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilder.js',
  invocation: 'src/dataCorrection/dataCorrectionDecisionAuditWriterInvocation.js',
  requestService: 'src/dataCorrection/dataCorrectionRequestService.js',
  applyService: 'src/dataCorrection/preDepartureCorrectionApplicationService.js',
  invocationUnitTest: 'tests/dataCorrection/dataCorrectionDecisionAuditWriterInvocation.unit.test.js',
  builderUnitTest: 'tests/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilder.unit.test.js',
  builderClosureTest: 'tests/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilderClosure.static.test.js',
  task1102Guard: 'tests/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilderSanitizationBoundary.static.test.js',
});

const SENSITIVE_WRITER_INPUT_FIELDS = Object.freeze([
  'raw',
  'rawRequest',
  'rawInput',
  'rawPayload',
  'rawRows',
  'sql',
  'query',
  'paramsSql',
  'db',
  'databaseUrl',
  'DATABASE_URL',
  'authorization',
  'cookie',
  'headers',
  'phone',
  'address',
  'customerPhone',
  'customerName',
  'lineUserId',
  'lineAccessToken',
  'finalAppointmentId',
  'stack',
  'repository',
  'connection',
]);

function filePath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(filePath(relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(filePath(relativePath));
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

function assertNoForbiddenCoupling(relativePath) {
  const source = read(relativePath);

  [
    /require\(['"]\.\.\/db['"]\)/,
    /require\(['"]\.\.\/repositories['"]\)/,
    /require\(['"]\.\.\/routes['"]\)/,
    /require\(['"]\.\.\/controllers['"]\)/,
    /require\(['"]\.\.\/app['"]\)/,
    /require\(['"]\.\.\/server['"]\)/,
    /src\/db/,
    /src\/repositories/,
    /src\/routes/,
    /src\/controllers/,
    /src\/app/,
    /src\/server/,
    /express\(\)/,
    /app\.listen/,
    /server\.listen/,
    /listen\(/,
    /fetch\(/,
    /axios/,
    /process\.env\.DATABASE_URL/,
    /INSERT INTO/i,
    /UPDATE\s+/i,
    /DELETE FROM/i,
    /SELECT\s+/i,
    /sendLine/,
    /sendSms/,
    /sendEmail/,
    /openai/i,
    /vector/i,
    /billing/i,
    /invoice/i,
    /payment/i,
  ].forEach((pattern) => {
    assert.equal(pattern.test(source), false, `${relativePath} forbidden coupling marker: ${pattern}`);
  });
}

test('invocation builder usage guard source files are present', () => {
  Object.values(FILES).forEach((relativePath) => {
    assert.equal(exists(relativePath), true, `${relativePath} is missing`);
  });
});

test('invocation helper imports the input builder and only pure local helpers', () => {
  const invocationSource = read(FILES.invocation);

  assert.deepEqual(requireSpecifiers(invocationSource), [
    './dataCorrectionDecisionAuditWriterInputBuilder',
    './dataCorrectionDecisionAuditWriterResultNormalizer',
  ]);
  assert.match(invocationSource, /buildDataCorrectionDecisionAuditWriterInput/);
});

test('decision audit writer input is built through builder before writer invocation', () => {
  const invocationSource = read(FILES.invocation);
  const buildIndex = invocationSource.indexOf(
    'const writerInput = buildDataCorrectionDecisionAuditWriterInput(auditIntent);',
  );
  const syncWriteIndex = invocationSource.indexOf('const result = write(writerInput);');
  const asyncWriteIndex = invocationSource.indexOf('const result = await write(writerInput);');

  assert.notEqual(buildIndex, -1, 'writerInput must be built through input builder');
  assert.notEqual(syncWriteIndex, -1, 'sync writer must receive writerInput');
  assert.notEqual(asyncWriteIndex, -1, 'async writer must receive writerInput');
  assert.ok(buildIndex < syncWriteIndex, 'sync writer input must be built before write');
  assert.ok(buildIndex < asyncWriteIndex, 'async writer input must be built before write');
});

test('decision audit writer is not called with raw request application payload or audit intent directly', () => {
  const invocationSource = read(FILES.invocation);

  [
    /write\(\s*auditIntent\s*\)/,
    /write\(\s*input\s*\)/,
    /write\(\s*request\s*\)/,
    /write\(\s*payload\s*\)/,
    /write\(\s*context\s*\)/,
    /write\(\s*raw/i,
    /await write\(\s*auditIntent\s*\)/,
    /await write\(\s*input\s*\)/,
    /await write\(\s*request\s*\)/,
    /await write\(\s*payload\s*\)/,
    /await write\(\s*context\s*\)/,
    /await write\(\s*raw/i,
  ].forEach((pattern) => {
    assert.doesNotMatch(invocationSource, pattern, `raw direct writer input pattern: ${pattern}`);
  });
});

test('services delegate decision audit writer calls through invocation helper only', () => {
  [
    FILES.requestService,
    FILES.applyService,
  ].forEach((relativePath) => {
    const source = read(relativePath);

    assert.match(source, /buildDataCorrectionDecisionAuditIntent/);
    assert.match(source, /callInjectedDecisionAuditWriter/);
    assert.match(source, /callInjectedDecisionAuditWriterAsync/);
    assert.doesNotMatch(source, /options\.decisionAuditWriter\s*\(/);
    assert.doesNotMatch(source, /options\.decisionAuditWriter\.write/);
  });
});

test('invocation helper does not construct unsafe writer input fields directly', () => {
  const invocationSource = read(FILES.invocation);

  SENSITIVE_WRITER_INPUT_FIELDS.forEach((field) => {
    assert.doesNotMatch(
      invocationSource,
      new RegExp(`${field}\\s*:`, 'i'),
      `${field} must not be directly constructed in invocation writer input`,
    );
  });
});

test('invocation path has no forbidden DB runtime provider API AI or billing coupling', () => {
  [
    FILES.invocation,
    FILES.requestService,
    FILES.applyService,
  ].forEach(assertNoForbiddenCoupling);
});

test('existing regression tests still assert sanitized input builder and invocation boundaries', () => {
  assert.match(read(FILES.task1102Guard), /sanitized audit input is constructed through allowlist/);
  assert.match(read(FILES.builderUnitTest), /excludes sensitive top-level and nested fields/);
  assert.match(read(FILES.builderClosureTest), /invocation helper sends sanitized writer input rather than raw audit intent/);
  assert.match(read(FILES.invocationUnitTest), /sync writer success returns recorded and never echoes writer internals/);
});
