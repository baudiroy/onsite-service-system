'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  builder: 'src/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilder.js',
  unitTest: 'tests/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilder.unit.test.js',
  closureTest: 'tests/dataCorrection/dataCorrectionDecisionAuditWriterInputBuilderClosure.static.test.js',
  nearestInvocationTest: 'tests/dataCorrection/dataCorrectionDecisionAuditWriterInvocation.unit.test.js',
});

const SENSITIVE_FIELDS = Object.freeze([
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
  'error',
  'repository',
  'connection',
]);

const SAFE_AUDIT_CONTEXT_FIELDS = Object.freeze([
  'requestId',
  'organizationId',
  'actorId',
  'decision',
  'reasonCode',
]);

const SAFE_AUDIT_CONTEXT_ALIASES = Object.freeze({
  decisionStatus: ['resultStatus'],
  requiredActions: ['safeMessageKey'],
  tenantId: ['organizationId'],
  source: [],
  metadata: [],
});

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

function extractSafeStringFields(source) {
  const match = source.match(/const SAFE_STRING_FIELDS = Object\.freeze\(\[([\s\S]*?)\]\);/);

  assert.ok(match, 'SAFE_STRING_FIELDS allowlist must exist');

  const fields = [];
  const fieldRegex = /'([^']+)'/g;
  let fieldMatch;

  while ((fieldMatch = fieldRegex.exec(match[1])) !== null) {
    fields.push(fieldMatch[1]);
  }

  return fields.sort();
}

function extractSensitiveKeyPatternSource(source) {
  const match = source.match(/const SENSITIVE_KEY_PATTERN = (\/[^\n]+\/[a-z]*);/);

  assert.ok(match, 'SENSITIVE_KEY_PATTERN deny-list marker must exist');

  return match[1];
}

function stripDenyListBlocks(source) {
  return source
    .replace(/const SENSITIVE_KEY_PATTERN = [\s\S]*?;\n/, '')
    .replace(/const SENSITIVE_VALUE_PATTERNS = Object\.freeze\(\[[\s\S]*?\]\);\n/, '');
}

test('input builder source and existing regression files are present', () => {
  [
    FILES.builder,
    FILES.unitTest,
    FILES.closureTest,
    FILES.nearestInvocationTest,
  ].forEach((relativePath) => {
    assert.equal(exists(relativePath), true, `${relativePath} is missing`);
  });
});

test('decision audit writer input builder factory and input-building path exist', () => {
  const source = read(FILES.builder);

  assert.match(source, /function buildDataCorrectionDecisionAuditWriterInput\(/);
  assert.match(source, /module\.exports\s*=\s*{[\s\S]*buildDataCorrectionDecisionAuditWriterInput[\s\S]*}/);
  assert.match(source, /const source = isPlainObject\(input\) \? input : {}/);
  assert.match(source, /const writerInput = {}/);
  assert.match(source, /for \(const key of SAFE_STRING_FIELDS\)/);
  assert.match(source, /writerInput\[key\] = value/);
  assert.match(source, /return writerInput/);
});

test('sanitized audit input is constructed through allowlist and sensitive-key checks', () => {
  const source = read(FILES.builder);
  const safeFields = extractSafeStringFields(source);

  assert.match(source, /function readSafeString\(source, key\)/);
  assert.match(source, /isSensitiveKey\(key\)/);
  assert.match(source, /safeString\(source\[key\]\)/);
  assert.match(source, /if \(key === 'fieldKey' && isSensitiveKey\(value\)\)/);

  SENSITIVE_FIELDS.forEach((field) => {
    assert.equal(
      safeFields.includes(field),
      false,
      `${field} must not be forwarded through SAFE_STRING_FIELDS`,
    );
  });
});

test('sensitive runtime and raw field groups are excluded before writer receives input', () => {
  const source = read(FILES.builder);
  const keyPatternSource = extractSensitiveKeyPatternSource(source);

  [
    'phone',
    'address',
    'line',
    'final',
    'sql',
    'dbUrl',
    'connectionString',
    'stack',
    'token',
    'secret',
    'password',
    'api',
    'payload',
    'raw',
    'billing',
    'settlement',
    'internal',
    'ai',
  ].forEach((marker) => {
    assert.match(
      keyPatternSource,
      new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
      `SENSITIVE_KEY_PATTERN should cover ${marker}`,
    );
  });
});

test('safe audit context remains available through explicit allowlist or accepted aliases', () => {
  const source = read(FILES.builder);
  const safeFields = extractSafeStringFields(source);

  SAFE_AUDIT_CONTEXT_FIELDS.forEach((field) => {
    assert.equal(safeFields.includes(field), true, `${field} should remain safe audit context`);
  });

  Object.entries(SAFE_AUDIT_CONTEXT_ALIASES).forEach(([field, aliases]) => {
    if (safeFields.includes(field) || aliases.some((alias) => safeFields.includes(alias))) {
      assert.ok(true, `${field} is represented in the local safe audit context`);
      return;
    }

    assert.doesNotMatch(
      source,
      new RegExp(`'${field}'`),
      `${field} is not present locally and must not be silently added by this guard`,
    );
  });
});

test('input builder source has no forbidden DB runtime provider API AI or billing coupling', () => {
  const source = read(FILES.builder);
  const nonDenyListSource = stripDenyListBlocks(source);

  assert.deepEqual(requireSpecifiers(source), []);

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
    assert.equal(pattern.test(nonDenyListSource), false, `forbidden coupling marker: ${pattern}`);
  });
});

test('existing regression tests still document sanitized writer invocation boundaries', () => {
  const unitTestSource = read(FILES.unitTest);
  const closureTestSource = read(FILES.closureTest);
  const invocationTestSource = read(FILES.nearestInvocationTest);

  assert.match(unitTestSource, /excludes sensitive top-level and nested fields/);
  assert.match(unitTestSource, /drops sensitive-looking allowed field values/);
  assert.match(closureTestSource, /invocation helper sends sanitized writer input rather than raw audit intent/);
  assert.match(invocationTestSource, /assertSafe\(result\)/);
});
