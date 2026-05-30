'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const MAPPER_PATH = 'src/repairIntake/repairIntakeDraftToCaseHttpResultMapper.js';
const TASK2238_TEST_PATH = 'tests/repairIntake/repairIntakeDraftToCaseHttpEnvelopeMapperFailureNormalizer.unit.test.js';
const MAPPER_UNIT_TEST_PATH = 'tests/repairIntake/repairIntakeDraftToCaseHttpResultMapper.unit.test.js';
const MAPPER_STATIC_TEST_PATH = 'tests/repairIntake/repairIntakeDraftToCaseHttpResultMapperBoundary.static.test.js';
const TASK2238_DOC_PATH = 'docs/task-2238-repair-intake-draft-to-case-http-envelope-mapper-failure-normalizer-no-db-no-smoke-no-provider.md';

const PUBLIC_FIELDS = Object.freeze([
  'ok',
  'status',
  'messageKey',
  'reasonCode',
  'caseId',
  'repairIntakeDraftId',
]);

const UNSAFE_MARKERS = Object.freeze([
  'address',
  'audit',
  'authorization',
  'billing',
  'cookie',
  'customer',
  'database',
  'database_url',
  'dbrow',
  'debug',
  'email',
  'internal',
  'invoice',
  'openai',
  'password',
  'permission',
  'phone',
  'postgres://',
  'postgresql://',
  'process.env',
  'provider',
  'query',
  'rag',
  'raw',
  'secret',
  'select ',
  'settlement',
  'stack',
  'token',
  'vector',
]);

function projectPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(projectPath(relativePath), 'utf8');
}

function constArrayValues(source, constName) {
  const marker = `const ${constName} = [`;
  const start = source.indexOf(marker);

  assert.notEqual(start, -1, `missing ${constName}`);

  const end = source.indexOf('];', start);

  assert.notEqual(end, -1, `missing end for ${constName}`);

  return Array.from(source.slice(start, end).matchAll(/'([^']+)'/g), (match) => match[1]);
}

function functionBlock(source, functionName) {
  const marker = `function ${functionName}(`;
  const start = source.indexOf(marker);

  assert.notEqual(start, -1, `missing function ${functionName}`);

  const signatureEnd = source.indexOf(')', start);
  const firstBrace = source.indexOf('{', signatureEnd + 1);
  let depth = 0;

  for (let index = firstBrace; index < source.length; index += 1) {
    if (source[index] === '{') {
      depth += 1;
    } else if (source[index] === '}') {
      depth -= 1;

      if (depth === 0) {
        return source.slice(start, index + 1);
      }
    }
  }

  assert.fail(`missing end of function ${functionName}`);
}

function constObjectBlock(source, constName) {
  const marker = `const ${constName} = {`;
  const start = source.indexOf(marker);

  assert.notEqual(start, -1, `missing ${constName}`);

  const end = source.indexOf('};', start);

  assert.notEqual(end, -1, `missing end for ${constName}`);

  return source.slice(start, end + 2);
}

function assertIncludesAll(source, snippets, label) {
  for (const snippet of snippets) {
    assert.ok(source.includes(snippet), `${label} missing ${snippet}`);
  }
}

function assertExcludesAll(source, patterns, label) {
  for (const pattern of patterns) {
    assert.doesNotMatch(source, pattern, `${label} includes forbidden ${pattern}`);
  }
}

test('Task2239 static guard reads source test and doc files only', () => {
  for (const relativePath of [
    MAPPER_PATH,
    TASK2238_TEST_PATH,
    MAPPER_UNIT_TEST_PATH,
    MAPPER_STATIC_TEST_PATH,
    TASK2238_DOC_PATH,
  ]) {
    assert.ok(fs.existsSync(projectPath(relativePath)), `missing ${relativePath}`);
  }

  const ownSource = fs.readFileSync(__filename, 'utf8');
  const ownRequires = Array.from(ownSource.matchAll(/^\s*const\s+[^\n]+?=\s*require\(\s*['"]([^'"]+)['"]\s*\)/gm), (match) => match[1]);

  assert.deepEqual(ownRequires, [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
});

test('HTTP mapper public envelope fields remain exactly allowlisted', () => {
  const source = read(MAPPER_PATH);

  assert.deepEqual(constArrayValues(source, 'PUBLIC_FIELD_NAMES'), PUBLIC_FIELDS);
  assertIncludesAll(functionBlock(source, 'normalizeBody'), [
    'ok:',
    'status,',
    'messageKey:',
    'reasonCode:',
    'caseId:',
    'repairIntakeDraftId:',
  ], 'HTTP body explicit shape');
});

test('HTTP mapper failure normalizes malformed and unsafe success-shaped results', () => {
  const source = read(MAPPER_PATH);
  const normalizeBody = functionBlock(source, 'normalizeBody');
  const mapToHttp = functionBlock(source, 'mapRepairIntakeDraftToCasePublicResultToHttpResponse');
  const defaultPublicResult = constObjectBlock(source, 'DEFAULT_PUBLIC_RESULT');

  assertIncludesAll(normalizeBody, [
    'if (!isPlainObject(publicResult))',
    'return { ...DEFAULT_PUBLIC_RESULT }',
    'const messageKey = safePublicString(safeResult.messageKey)',
    'const reasonCode = safePublicString(safeResult.reasonCode)',
    'const successStatus = STATUS_CODE_BY_STATUS[status] === 201',
    'safeResult.ok === true && successStatus && (!messageKey || !reasonCode)',
  ], 'HTTP mapper failure normalization');
  assertIncludesAll(defaultPublicResult, [
    'ok: false',
    "status: 'unavailable'",
    "messageKey: 'repair_intake_draft_to_case.unavailable'",
    'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_RESULT_MAPPER_INVALID_RESULT',
    'caseId: null',
    'repairIntakeDraftId: null',
  ], 'HTTP mapper default failure result');
  assertIncludesAll(mapToHttp, [
    'const body = normalizeBody(publicResult)',
    'STATUS_CODE_BY_STATUS[body.status]',
    'body,',
  ], 'HTTP status/body mapping');
  assert.doesNotMatch(normalizeBody, /\.\.\.\s*(?:publicResult|safeResult|body|input|result)/);
});

test('HTTP mapper unsafe scalar markers remain denied', () => {
  const source = read(MAPPER_PATH);
  const unsafeMarkers = constArrayValues(source, 'UNSAFE_VALUE_MARKERS');
  const safePublicString = functionBlock(source, 'safePublicString');

  for (const marker of UNSAFE_MARKERS) {
    assert.ok(unsafeMarkers.includes(marker), `missing unsafe marker ${marker}`);
  }

  assertIncludesAll(safePublicString, [
    'stringLooksUnsafe(trimmed)',
    'return null',
  ], 'safe public string unsafe marker denial');
});

test('HTTP body construction excludes raw private system and provider leakage', () => {
  const normalizeBody = functionBlock(read(MAPPER_PATH), 'normalizeBody');
  const forbiddenPatterns = [
    /message\s*:/i,
    /stack/i,
    /sql/i,
    /database_url|databaseurl|process\.env|secret/i,
    /token|password/i,
    /provider|providerPayload/i,
    /raw(?:request|body|draft|draftInput|input|error)|requestBody|draftInput/i,
    /customer(?:phone|address|private|name)|fullAddress|address/i,
    /auditActor|auditContext|auditInternal/i,
    /debug|internal|rawError/i,
    /\b(?:AI|RAG|OpenAI|vector)\b/i,
    /billing|settlement|invoice/i,
  ];

  assertExcludesAll(normalizeBody, forbiddenPatterns, 'HTTP body construction');
});

test('Task2238 tests docs and existing mapper guards freeze behavior and scope', () => {
  const task2238Test = read(TASK2238_TEST_PATH);
  const mapperUnitTest = read(MAPPER_UNIT_TEST_PATH);
  const mapperStaticTest = read(MAPPER_STATIC_TEST_PATH);
  const task2238Doc = read(TASK2238_DOC_PATH);

  assertIncludesAll(task2238Test, [
    'malformed null and non-object route-facing results fail closed',
    'unsafe success-shaped core strings fail closed instead of producing 201',
    'unsafe public scalar ids are stripped without leaking raw private or system fields',
    'sanitized denied and unavailable paths remain unchanged',
    'existing allowed success path remains unchanged and detached from input',
    'assertNoUnsafeText(result)',
  ], 'Task2238 unit evidence');
  assertIncludesAll(mapperUnitTest, [
    'safe public success maps to 201 and safe body',
    'malformed and null input map safely to generic unavailable',
    'unsafe fields and unsafe public string values are stripped from body',
  ], 'existing mapper unit evidence');
  assertIncludesAll(mapperStaticTest, [
    'HTTP result mapper source is dependency-free and exports pure mapper',
    'HTTP result mapper source avoids runtime persistence provider route and auth library coupling',
    'HTTP result mapper source has no route app registration framework or SQL statements',
  ], 'existing mapper static evidence');
  assertIncludesAll(task2238Doc, [
    'Malformed/null/non-object route-facing results fail closed',
    'Unsafe success-shaped route-facing results with unsafe or missing core `messageKey` / `reasonCode` no longer produce a 201 HTTP envelope',
    'HTTP response bodies remain limited to `ok`, `status`, `messageKey`, `reasonCode`, `caseId`, and `repairIntakeDraftId`',
    'No route path or route mount changes',
    'The 7 held historical untracked docs were not touched',
  ], 'Task2238 doc evidence');
});
