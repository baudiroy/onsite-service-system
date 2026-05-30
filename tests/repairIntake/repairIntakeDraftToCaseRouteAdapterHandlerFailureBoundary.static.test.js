'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const ROUTE_ADAPTER_PATH = 'src/repairIntake/repairIntakeDraftToCaseRouteAdapterContract.js';
const ROUTE_HANDLER_PATH = 'src/repairIntake/repairIntakeDraftToCaseRouteHandlerFactory.js';
const TASK2235_TEST_PATH = 'tests/repairIntake/repairIntakeDraftToCaseRouteAdapterHandlerFailureNormalizer.unit.test.js';
const TASK2235_DOC_PATH = 'docs/task-2235-repair-intake-draft-to-case-route-adapter-handler-failure-normalizer-no-db-no-smoke-no-provider.md';

const UNSAFE_FIELD_MARKERS = Object.freeze([
  'address',
  'ai',
  'audit',
  'auditactor',
  'authorization',
  'billing',
  'cookie',
  'customer',
  'customerdata',
  'customername',
  'customerphone',
  'databaseurl',
  'dbrow',
  'debug',
  'email',
  'error',
  'headers',
  'internal',
  'invoice',
  'lineaccesstoken',
  'password',
  'phone',
  'provider',
  'providerpayload',
  'query',
  'rag',
  'rawbody',
  'rawerror',
  'rawinput',
  'rawrequest',
  'secret',
  'settlement',
  'stack',
  'token',
]);

const UNSAFE_TEXT_MARKERS = Object.freeze([
  'audit internal',
  'billing',
  'customer address',
  'customer phone',
  'customer private',
  'database_url',
  'debug detail',
  'invoice',
  'line access token',
  'password',
  'postgres://',
  'postgresql://',
  'process.env',
  'provider payload',
  'rag',
  'raw body',
  'raw draft',
  'raw draftinput',
  'raw error',
  'raw request',
  'secret',
  'select *',
  'settlement',
  'stack trace',
  'token',
]);

function projectPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(projectPath(relativePath), 'utf8');
}

function constBlock(source, constName) {
  const marker = `const ${constName}`;
  const start = source.indexOf(marker);

  assert.notEqual(start, -1, `missing ${constName}`);

  const setEnd = source.indexOf(']);', start);
  const arrayEnd = source.indexOf('];', start);
  const end = setEnd === -1 ? arrayEnd : setEnd;

  assert.notEqual(end, -1, `missing end for ${constName}`);

  return source.slice(start, end + (setEnd === -1 ? 2 : 3));
}

function functionBlock(source, functionName) {
  const functionMarker = `function ${functionName}(`;
  const asyncFunctionMarker = `async function ${functionName}(`;
  const marker = source.includes(functionMarker) ? functionMarker : asyncFunctionMarker;
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

test('Task2236 static guard reads source test and doc files only', () => {
  for (const relativePath of [
    ROUTE_ADAPTER_PATH,
    ROUTE_HANDLER_PATH,
    TASK2235_TEST_PATH,
    TASK2235_DOC_PATH,
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

test('route adapter boundary normalizes thrown rejected and malformed pre-route output', () => {
  const source = read(ROUTE_ADAPTER_PATH);
  const handleRouteLikeRequest = functionBlock(source, 'handleRouteLikeRequest');
  const sanitizeRouteOutput = functionBlock(source, 'sanitizeRouteOutput');
  const sanitizeNestedValue = functionBlock(source, 'sanitizeNestedValue');
  const safeScalar = functionBlock(source, 'safeScalar');

  assertIncludesAll(handleRouteLikeRequest, [
    'try {',
    'routeLikeToPreRouteInput(routeLikeInput)',
    'await handlePreRoute(preRouteInput)',
    'sanitizeRouteOutput(preRouteOutput)',
    'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_ADAPTER_PRE_ROUTE_HANDLER_FAILED',
  ], 'route adapter handler failure boundary');
  assertIncludesAll(sanitizeRouteOutput, [
    'if (!isPlainObject(output))',
    'unavailableEnvelope(',
    'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_ADAPTER_OUTPUT_INVALID',
    'sanitizeNestedValue(output)',
  ], 'route adapter malformed output boundary');
  assertIncludesAll(sanitizeNestedValue, [
    'fieldIsUnsafe(key)',
    'stringHasUnsafeText(value)',
    'return undefined',
  ], 'route adapter nested sanitizer');
  assertIncludesAll(safeScalar, [
    'stringHasUnsafeText(trimmed)',
    'return null',
  ], 'route adapter scalar sanitizer');
});

test('route handler boundary normalizes thrown rejected and malformed adapter output', () => {
  const source = read(ROUTE_HANDLER_PATH);
  const handle = functionBlock(source, 'handle');
  const sanitizeRouteOutput = functionBlock(source, 'sanitizeRouteOutput');
  const sanitizeNestedValue = functionBlock(source, 'sanitizeNestedValue');
  const safeScalar = functionBlock(source, 'safeScalar');

  assertIncludesAll(handle, [
    'try {',
    'routeLikeInputFromFutureRouterInput(safeInput, repairIntakeDraftId)',
    'await handleRouteLikeRequest(routeLikeInput)',
    'sanitizeRouteOutput(output)',
    'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_HANDLER_ADAPTER_FAILED',
  ], 'route handler adapter failure boundary');
  assertIncludesAll(sanitizeRouteOutput, [
    'if (!isPlainObject(output))',
    'dependencyFailure(',
    'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_HANDLER_ADAPTER_OUTPUT_INVALID',
    'sanitizeNestedValue(output)',
  ], 'route handler malformed output boundary');
  assertIncludesAll(sanitizeNestedValue, [
    'fieldIsUnsafe(key)',
    'stringHasUnsafeText(value)',
    'return undefined',
  ], 'route handler nested sanitizer');
  assertIncludesAll(safeScalar, [
    'stringHasUnsafeText(trimmed)',
    'return null',
  ], 'route handler scalar sanitizer');
});

test('unsafe request output fields and unsafe text markers remain denied in both boundaries', () => {
  for (const relativePath of [ROUTE_ADAPTER_PATH, ROUTE_HANDLER_PATH]) {
    const source = read(relativePath);
    const unsafeFields = constBlock(source, 'UNSAFE_FIELD_NAMES');
    const unsafeText = constBlock(source, 'UNSAFE_TEXT_MARKERS');

    for (const marker of UNSAFE_FIELD_MARKERS) {
      assert.match(unsafeFields, new RegExp(`['"]${marker}['"]`, 'i'), `${relativePath} missing unsafe field ${marker}`);
    }

    for (const marker of UNSAFE_TEXT_MARKERS) {
      assert.ok(unsafeText.includes(`'${marker}'`), `${relativePath} missing unsafe text marker ${marker}`);
    }
  }
});

test('route facing output avoids raw pass-through and route path or mount changes', () => {
  for (const relativePath of [ROUTE_ADAPTER_PATH, ROUTE_HANDLER_PATH]) {
    const source = read(relativePath);

    assertExcludesAll(source, [
      /return\s+(?:preRouteOutput|output|routeLikeInput|safeInput)\b/,
      /\.\.\.\s*(?:preRouteOutput|output|routeLikeInput|safeInput|input|body|request|raw)/,
      /app\.(?:get|post|put|patch|delete)\s*\(/i,
      /router\.(?:get|post|put|patch|delete)\s*\(/i,
      /express\.Router|listen\(|\/repair-intake|\/cases|req\s*,\s*res|res\.json/i,
    ], `${relativePath} route-facing boundary`);
  }
});

test('failure envelopes exclude unsafe leakage markers', () => {
  const adapterFailure = functionBlock(read(ROUTE_ADAPTER_PATH), 'unavailableEnvelope');
  const handlerFailure = functionBlock(read(ROUTE_HANDLER_PATH), 'dependencyFailure');
  const handlerInvalidRequest = functionBlock(read(ROUTE_HANDLER_PATH), 'invalidRequest');
  const forbiddenPatterns = [
    /message/i,
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
    /\.\.\.\s*(?:error|output|result|body|request)/,
  ];

  assertExcludesAll(adapterFailure, forbiddenPatterns, 'route adapter failure envelope');
  assertExcludesAll(handlerFailure, forbiddenPatterns, 'route handler failure envelope');
  assertExcludesAll(handlerInvalidRequest, forbiddenPatterns, 'route handler invalid request envelope');
});

test('Task2235 test and doc freeze failure coverage success path and scope', () => {
  const testSource = read(TASK2235_TEST_PATH);
  const docSource = read(TASK2235_DOC_PATH);

  assertIncludesAll(testSource, [
    'route adapter normalizes thrown and rejected pre-route handler failures',
    'route handler normalizes thrown and rejected route adapter failures',
    'route adapter and route handler fail closed for malformed delegate outputs',
    'route adapter sanitizes unsafe request input before pre-route invocation',
    'route handler sanitizes unsafe request input before adapter invocation',
    'route adapter and route handler strip unsafe output fields without mutating delegate output',
    'route adapter and route handler preserve existing allowed success path',
    'assertNoUnsafeText(result)',
    'assertNoUnsafeText(adapterResult)',
    'assertNoUnsafeText(handlerResult)',
  ], 'Task2235 unit evidence');
  assertIncludesAll(docSource, [
    'Route adapter now fails closed when the pre-route handler returns `null`, an array, a string, a number, or another non-object output',
    'Route handler now fails closed when the route adapter returns `null`, an array, a string, a number, or another non-object output',
    'Route adapter and route handler sanitizers now drop unsafe string markers as well as unsafe field names',
    'Existing allowed success output remains unchanged',
    'No route path or route mount changes',
    'The 7 held historical untracked docs were not touched',
  ], 'Task2235 doc evidence');
});
