'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const API_MODULE_PATH = 'src/repairIntake/repairIntakeDraftToCaseApiModule.js';
const CONTROLLER_ADAPTER_PATH = 'src/repairIntake/repairIntakeDraftCaseControllerAdapter.js';
const TASK2228_TEST_PATH = 'tests/repairIntake/repairIntakeDraftToCaseControllerAdapterApplicationServiceFailureNormalizer.unit.test.js';
const TASK2228_DOC_PATH = 'docs/task-2228-repair-intake-draft-to-case-controller-adapter-application-service-failure-normalizer-no-db-no-smoke-no-provider.md';
const TASK2229_TEST_PATH = 'tests/repairIntake/repairIntakeDraftToCaseControllerAdapterFailureBoundary.static.test.js';
const TASK2229_DOC_PATH = 'docs/task-2229-repair-intake-draft-to-case-controller-adapter-failure-static-boundary-guard-no-runtime-change-no-db-no-smoke-no-provider.md';

const FORBIDDEN_IMPORT_PATTERNS = Object.freeze([
  /(?:^|\/)(?:db|database|repositories?|migrations?|providers?|line|sms|email|webhooks?|server|app|smoke|shared|runtime|openai|rag|billing|settlement|invoice|zeabur|env)(?:$|\/)/i,
  /^(?:pg|postgres|knex|sequelize|typeorm|prisma|mysql2|sqlite3|mongodb|mongoose|redis|openai)$/i,
]);

const UNSAFE_REQUEST_MARKERS = Object.freeze([
  'address',
  'authorization',
  'cookie',
  'customerphone',
  'database_url',
  'finalappointmentid',
  'headers',
  'lineaccesstoken',
  'lineuserid',
  'phone',
  'rawbody',
  'rawheaders',
  'req',
  'res',
  'session',
  'socket',
  'sql',
]);

const UNSAFE_OUTPUT_MARKERS = Object.freeze([
  'applicationservice',
  'customername',
  'customerphone',
  'database_url',
  'databaseurl',
  'db',
  'error',
  'finalappointmentid',
  'handler',
  'headers',
  'lineaccesstoken',
  'lineuserid',
  'paramssql',
  'raw',
  'rawbody',
  'rawheaders',
  'rawrows',
  'req',
  'res',
  'response',
  'route',
  'session',
  'socket',
  'sql',
  'stack',
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

test('Task2230 static guard reads only source test and doc files', () => {
  for (const relativePath of [
    API_MODULE_PATH,
    CONTROLLER_ADAPTER_PATH,
    TASK2228_TEST_PATH,
    TASK2228_DOC_PATH,
    TASK2229_TEST_PATH,
    TASK2229_DOC_PATH,
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

test('API module imports only bounded injected controller route helpers and no runtime DB provider packages', () => {
  const source = read(API_MODULE_PATH);
  const specifiers = requireSpecifiers(source);

  assert.deepEqual(specifiers, [
    './repairIntakeDraftCaseControllerAdapter',
    './repairIntakeDraftCaseRouteFactory',
    './repairIntakeDraftToCaseRouteRegistrar',
    './repairIntakeDraftToCaseRequestAbuseGuard',
  ]);
  assertExcludesAll(specifiers.join('\n'), FORBIDDEN_IMPORT_PATTERNS, 'API module imports');
  assertExcludesAll(specifiers.join('\n'), [
    /process\.env|DATABASE_URL|Zeabur|createServer|listen|healthz|OpenAI|vector|rag/i,
  ], 'API module import runtime names');
});

test('API module builds application-service routes through controller adapter normalization', () => {
  const source = read(API_MODULE_PATH);
  const applicationServiceIsValid = functionBlock(source, 'applicationServiceIsValid');
  const buildController = functionBlock(source, 'buildController');
  const buildRoutes = functionBlock(source, 'buildRoutes');

  assertIncludesAll(source, [
    'createRepairIntakeDraftCaseControllerAdapter',
    'applicationServiceIsValid(options.applicationService)',
    'createSafeController(controller)',
    'createRepairIntakeDraftCaseRoutes({ controller })',
  ], 'API module controller adapter wiring');
  assertIncludesAll(applicationServiceIsValid, [
    "typeof applicationService.planDraftToCase === 'function'",
    "typeof applicationService.submitDraftToCase === 'function'",
  ], 'application service shape validation');
  assertIncludesAll(buildController, [
    'if (controllerWasProvided(options))',
    'return options.controller',
    'createRepairIntakeDraftCaseControllerAdapter({',
    'applicationService: options.applicationService',
  ], 'buildController adapter path');
  assertIncludesAll(buildRoutes, [
    'createRepairIntakeDraftCaseRoutes({ controller })',
  ], 'buildRoutes controller path');
  assert.doesNotMatch(buildRoutes, /applicationService\.(?:planDraftToCase|submitDraftToCase)/);
});

test('API module safe controller sanitizes request and handler output paths', () => {
  const source = read(API_MODULE_PATH);
  const safeRequestFields = constBlock(source, 'SAFE_REQUEST_INPUT_FIELDS');
  const unsafeRequestFields = constBlock(source, 'UNSAFE_REQUEST_FIELD_NAMES');
  const unsafeOutputFields = constBlock(source, 'UNSAFE_OUTPUT_FIELD_NAMES');
  const sanitizeRequestInput = functionBlock(source, 'sanitizeRequestInput');
  const sanitizeRequestValue = functionBlock(source, 'sanitizeRequestValue');
  const sanitizeHandlerOutputValue = functionBlock(source, 'sanitizeHandlerOutputValue');
  const sanitizeHandlerOutput = functionBlock(source, 'sanitizeHandlerOutput');
  const callSafeController = functionBlock(source, 'callSafeController');
  const createSafeController = functionBlock(source, 'createSafeController');

  assertIncludesAll(safeRequestFields, [
    "'body'",
    "'context'",
    "'idempotencyKey'",
    "'params'",
    "'requestId'",
    "'tenantId'",
  ], 'safe request input allowlist');

  for (const marker of UNSAFE_REQUEST_MARKERS) {
    assert.match(unsafeRequestFields, new RegExp(`['"]${marker}['"]`, 'i'), `missing unsafe request marker ${marker}`);
  }

  for (const marker of UNSAFE_OUTPUT_MARKERS) {
    assert.match(unsafeOutputFields, new RegExp(`['"]${marker}['"]`, 'i'), `missing unsafe output marker ${marker}`);
  }

  assertIncludesAll(sanitizeRequestInput, [
    'for (const key of SAFE_REQUEST_INPUT_FIELDS)',
    'sanitizeRequestValue(source[key])',
  ], 'request input sanitizer');
  assertIncludesAll(sanitizeRequestValue, [
    'requestFieldIsUnsafe(key)',
    'result[key] = sanitized',
  ], 'request value sanitizer');
  assertIncludesAll(sanitizeHandlerOutputValue, [
    'outputFieldIsUnsafe(key)',
    'result[key] = sanitized',
  ], 'handler output sanitizer');
  assertIncludesAll(sanitizeHandlerOutput, [
    'const output = await outputPromise',
    'REPAIR_INTAKE_DRAFT_TO_CASE_API_MODULE_CONTROLLER_OUTPUT_INVALID',
    'sanitizeHandlerOutputValue(output)',
  ], 'handler output promise sanitizer');
  assertIncludesAll(callSafeController, [
    'sanitizeHandlerOutput(',
    'method.call(',
    'sanitizeRequestInput(requestLike)',
    'REPAIR_INTAKE_DRAFT_CASE_ROUTE_HANDLER_FAILED',
  ], 'safe controller call normalizer');
  assertIncludesAll(createSafeController, [
    'callSafeController(',
    'controller.planDraftToCase',
    'controller.submitDraftToCase',
  ], 'safe controller adapter');
  assert.doesNotMatch(createSafeController, /\.\.\.\s*(?:requestLike|body|draftInput|output|result)/);
});

test('API module does not directly expose raw service output or raw request values', () => {
  const source = read(API_MODULE_PATH);
  const createSafeController = functionBlock(source, 'createSafeController');
  const success = functionBlock(source, 'success');
  const failure = functionBlock(source, 'failure');

  assert.doesNotMatch(createSafeController, /applicationService\.(?:planDraftToCase|submitDraftToCase)/);
  assert.doesNotMatch(createSafeController, /\bbody\s*:\s*requestLike\.body\b/);
  assert.doesNotMatch(createSafeController, /\bdraftInput\b/);
  assert.doesNotMatch(createSafeController, /\braw(?:Body|Request|Draft|Input|Rows)?\b/);
  assert.doesNotMatch(success, /\.\.\.\s*(?:controller|routes|registration|output|result|body|request)/);
  assert.doesNotMatch(failure, /\.\.\.\s*(?:error|output|result|body|request)/);
});

test('Task2228 and Task2229 evidence keeps controller adapter normalization as required boundary', () => {
  const controllerAdapter = read(CONTROLLER_ADAPTER_PATH);
  const task2228Test = read(TASK2228_TEST_PATH);
  const task2228Doc = read(TASK2228_DOC_PATH);
  const task2229Test = read(TASK2229_TEST_PATH);
  const task2229Doc = read(TASK2229_DOC_PATH);
  const callService = functionBlock(controllerAdapter, 'callService');

  assertIncludesAll(callService, [
    'const output = await method(input)',
    'CONTROLLER_APPLICATION_SERVICE_RESULT_INVALID',
    'CONTROLLER_APPLICATION_SERVICE_FAILED',
    'sanitizeEnvelopeBody(output)',
  ], 'controller adapter callService boundary');
  assertIncludesAll(task2228Test, [
    'api module application-service route handlers inherit controller adapter failure normalization',
    'CONTROLLER_APPLICATION_SERVICE_FAILED',
    'CONTROLLER_APPLICATION_SERVICE_RESULT_INVALID',
    'assertNoUnsafeText(plan)',
    'assertNoUnsafeText(submit)',
  ], 'Task2228 API module inheritance coverage');
  assertIncludesAll(task2228Doc, [
    'Hardened the existing Repair Intake draft-to-case controller adapter boundary',
    'Existing allowed success output remains unchanged',
  ], 'Task2228 doc boundary');
  assertIncludesAll(task2229Test, [
    'API module builds injected application service route handlers through controller adapter',
    'createRepairIntakeDraftCaseControllerAdapter',
  ], 'Task2229 static guard boundary');
  assertIncludesAll(task2229Doc, [
    'Confirms `src/repairIntake/repairIntakeDraftToCaseApiModule.js` builds injected application-service route handlers through `createRepairIntakeDraftCaseControllerAdapter()`',
    'do not spread raw service results wholesale',
    'No source/runtime behavior was changed',
  ], 'Task2229 doc boundary');
});
