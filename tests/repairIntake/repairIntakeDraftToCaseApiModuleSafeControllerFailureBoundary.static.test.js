'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const API_MODULE_PATH = 'src/repairIntake/repairIntakeDraftToCaseApiModule.js';
const TASK2232_UNIT_TEST_PATH = 'tests/repairIntake/repairIntakeDraftToCaseApiModuleSafeControllerFailureNormalizer.unit.test.js';
const TASK2230_STATIC_TEST_PATH = 'tests/repairIntake/repairIntakeDraftToCaseApiModuleSafeControllerBoundary.static.test.js';
const TASK2232_DOC_PATH = 'docs/task-2232-repair-intake-draft-to-case-api-module-safe-controller-failure-normalizer-no-db-no-smoke-no-provider.md';

const FORBIDDEN_IMPORT_PATTERNS = Object.freeze([
  /(?:^|\/)(?:db|database|repositories?|migrations?|providers?|line|sms|email|webhooks?|server|app|smoke|shared|runtime|openai|rag|billing|settlement|invoice|zeabur|env)(?:$|\/)/i,
  /^(?:pg|postgres|knex|sequelize|typeorm|prisma|mysql2|sqlite3|mongodb|mongoose|redis|openai)$/i,
]);

const UNSAFE_FIELD_MARKERS = Object.freeze([
  'address',
  'auditinternal',
  'authorization',
  'billing',
  'customeraddress',
  'customerphone',
  'database_url',
  'databaseurl',
  'debug',
  'draftinput',
  'error',
  'fulladdress',
  'headers',
  'invoice',
  'lineaccesstoken',
  'lineuserid',
  'paramssql',
  'phone',
  'providerpayload',
  'rag',
  'raw',
  'rawbody',
  'rawdraft',
  'rawdraftinput',
  'rawerror',
  'rawheaders',
  'rawinput',
  'rawrequest',
  'req',
  'res',
  'session',
  'socket',
  'sql',
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

function requireSpecifiers(source) {
  return Array.from(source.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g), (match) => match[1]);
}

function constBlock(source, constName) {
  const marker = `const ${constName}`;
  const start = source.indexOf(marker);

  assert.notEqual(start, -1, `missing ${constName}`);

  const end = source.indexOf(']);', start);

  assert.notEqual(end, -1, `missing end for ${constName}`);

  return source.slice(start, end + 3);
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

test('Task2233 static guard reads source test and doc files only', () => {
  for (const relativePath of [
    API_MODULE_PATH,
    TASK2232_UNIT_TEST_PATH,
    TASK2230_STATIC_TEST_PATH,
    TASK2232_DOC_PATH,
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

test('API module keeps bounded imports and controller adapter construction path', () => {
  const source = read(API_MODULE_PATH);
  const specifiers = requireSpecifiers(source);
  const buildController = functionBlock(source, 'buildController');
  const buildRoutes = functionBlock(source, 'buildRoutes');

  assert.deepEqual(specifiers, [
    './repairIntakeDraftCaseControllerAdapter',
    './repairIntakeDraftCaseRouteFactory',
    './repairIntakeDraftToCaseRouteRegistrar',
  ]);
  assertExcludesAll(specifiers.join('\n'), FORBIDDEN_IMPORT_PATTERNS, 'API module imports');
  assertIncludesAll(buildController, [
    'createRepairIntakeDraftCaseControllerAdapter({',
    'applicationService: options.applicationService',
    'return options.controller',
  ], 'controller adapter construction path');
  assertIncludesAll(buildRoutes, [
    'createRepairIntakeDraftCaseRoutes({ controller })',
  ], 'route factory construction path');
  assert.doesNotMatch(buildRoutes, /applicationService\.(?:planDraftToCase|submitDraftToCase)/);
});

test('safe controller wraps handler invocation and normalizes thrown rejected and malformed outputs', () => {
  const source = read(API_MODULE_PATH);
  const sanitizeHandlerOutput = functionBlock(source, 'sanitizeHandlerOutput');
  const safeControllerFailure = functionBlock(source, 'safeControllerFailure');
  const callSafeController = functionBlock(source, 'callSafeController');
  const createSafeController = functionBlock(source, 'createSafeController');

  assertIncludesAll(callSafeController, [
    'function callSafeController(controller, method, requestLike = {})',
    'try {',
    'sanitizeHandlerOutput(',
    'method.call(',
    'controller',
    'sanitizeRequestInput(requestLike)',
    'REPAIR_INTAKE_DRAFT_CASE_ROUTE_HANDLER_FAILED',
    'safeControllerFailure(',
  ], 'safe controller call failure wrapper');
  assertIncludesAll(sanitizeHandlerOutput, [
    'const output = await outputPromise',
    'if (!isObject(output))',
    'REPAIR_INTAKE_DRAFT_TO_CASE_API_MODULE_CONTROLLER_OUTPUT_INVALID',
    'sanitizeHandlerOutputValue(output)',
  ], 'handler output malformed normalizer');
  assertIncludesAll(safeControllerFailure, [
    'ok: false',
    'statusCode: 500',
    'action: null',
    'draftId: null',
    'organizationId: null',
    'reasonCode',
    'requiredActions',
    'caseRef: null',
    'auditEvent: null',
  ], 'safe controller failure envelope');
  assertIncludesAll(createSafeController, [
    'callSafeController(',
    'controller.planDraftToCase',
    'controller.submitDraftToCase',
  ], 'safe controller methods');
  assert.doesNotMatch(createSafeController, /controller\.(?:planDraftToCase|submitDraftToCase)\(\s*requestLike\s*\)/);
});

test('safe controller sanitizes request input before invocation and handler output before return', () => {
  const source = read(API_MODULE_PATH);
  const sanitizeRequestInput = functionBlock(source, 'sanitizeRequestInput');
  const sanitizeRequestValue = functionBlock(source, 'sanitizeRequestValue');
  const sanitizeHandlerOutputValue = functionBlock(source, 'sanitizeHandlerOutputValue');
  const callSafeController = functionBlock(source, 'callSafeController');

  assertIncludesAll(sanitizeRequestInput, [
    'for (const key of SAFE_REQUEST_INPUT_FIELDS)',
    'sanitizeRequestValue(source[key])',
    'result[key] = sanitized',
  ], 'request input sanitizer');
  assertIncludesAll(sanitizeRequestValue, [
    'requestFieldIsUnsafe(key)',
    'stringHasUnsafeText(value)',
    'return undefined',
  ], 'request value sanitizer');
  assertIncludesAll(callSafeController, [
    'method.call(',
    'sanitizeRequestInput(requestLike)',
  ], 'handler invocation sanitized input');
  assertIncludesAll(sanitizeHandlerOutputValue, [
    'outputFieldIsUnsafe(key)',
    'stringHasUnsafeText(value)',
    'result[key] = sanitized',
    'return undefined',
  ], 'handler output sanitizer');
});

test('unsafe request output fields and unsafe text markers remain denied', () => {
  const source = read(API_MODULE_PATH);
  const unsafeRequestFields = constBlock(source, 'UNSAFE_REQUEST_FIELD_NAMES');
  const unsafeOutputFields = constBlock(source, 'UNSAFE_OUTPUT_FIELD_NAMES');
  const unsafeTextMarkers = constBlock(source, 'UNSAFE_TEXT_MARKERS');

  for (const marker of UNSAFE_FIELD_MARKERS) {
    const markerPattern = new RegExp(`['"]${marker}['"]`, 'i');
    const fieldBlock = `${unsafeRequestFields}\n${unsafeOutputFields}`;

    assert.match(fieldBlock, markerPattern, `missing unsafe request/output field ${marker}`);
  }

  for (const marker of UNSAFE_TEXT_MARKERS) {
    assert.ok(unsafeTextMarkers.includes(`'${marker}'`), `missing unsafe text marker ${marker}`);
  }
});

test('safe controller failure envelope excludes raw private system and provider leakage markers', () => {
  const source = read(API_MODULE_PATH);
  const safeControllerFailure = functionBlock(source, 'safeControllerFailure');
  const forbiddenFailurePatterns = [
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

  assertExcludesAll(safeControllerFailure, forbiddenFailurePatterns, 'safe controller failure envelope');
});

test('Task2232 evidence locks unsafe outputs and allowed success path', () => {
  const unitTest = read(TASK2232_UNIT_TEST_PATH);
  const staticTest = read(TASK2230_STATIC_TEST_PATH);
  const taskDoc = read(TASK2232_DOC_PATH);

  assertIncludesAll(unitTest, [
    'safe controller normalizes thrown and rejected controller handler failures',
    'safe controller fails closed for null and non-object controller outputs',
    'safe controller sanitizes unsafe request input before handler invocation',
    'safe controller strips unsafe handler output fields without mutating output object',
    'safe controller preserves existing allowed success path',
    'assertNoUnsafeText(result)',
    'assertNoUnsafeText(plan)',
    'assertNoUnsafeText(submit)',
    'assert.equal(JSON.stringify(request), requestBefore)',
    'assert.equal(JSON.stringify(unsafeOutput), unsafeOutputBefore)',
  ], 'Task2232 unit coverage');
  assertIncludesAll(staticTest, [
    'callSafeController',
    'REPAIR_INTAKE_DRAFT_CASE_ROUTE_HANDLER_FAILED',
    'REPAIR_INTAKE_DRAFT_TO_CASE_API_MODULE_CONTROLLER_OUTPUT_INVALID',
    'sanitizeRequestInput(requestLike)',
    'sanitizeHandlerOutputValue(output)',
  ], 'Task2230 static coverage');
  assertIncludesAll(taskDoc, [
    'Safe controller handler calls now fail closed when a controller throws or rejects',
    'Safe controller handler calls now fail closed when a controller returns `null`, an array, or another non-object result',
    'Safe controller request input filtering now drops raw/private/system field names and unsafe string markers before handler invocation',
    'Safe controller output filtering now drops raw/private/system field names and unsafe string markers before controller-facing output',
    'Existing allowed success output remains unchanged',
  ], 'Task2232 doc evidence');
});
