'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const CONTROLLER_ADAPTER_PATH = 'src/repairIntake/repairIntakeDraftCaseControllerAdapter.js';
const API_MODULE_PATH = 'src/repairIntake/repairIntakeDraftToCaseApiModule.js';
const TASK2228_TEST_PATH = 'tests/repairIntake/repairIntakeDraftToCaseControllerAdapterApplicationServiceFailureNormalizer.unit.test.js';
const TASK2228_DOC_PATH = 'docs/task-2228-repair-intake-draft-to-case-controller-adapter-application-service-failure-normalizer-no-db-no-smoke-no-provider.md';

const FORBIDDEN_IMPORT_PATTERNS = Object.freeze([
  /(?:^|\/)(?:db|database|repositories?|migrations?|providers?|line|sms|email|webhooks?|server|app|routes?|smoke|shared|runtime)(?:$|\/)/i,
  /^(?:pg|postgres|knex|sequelize|typeorm|prisma|mysql2|sqlite3|mongodb|mongoose|redis)$/i,
]);

const UNSAFE_DENYLIST_MARKERS = Object.freeze([
  'providerPayload',
  'auditInternal',
  'debug',
  'internal',
  'billing',
  'settlement',
  'invoice',
  'password',
  'rag',
  'raw',
  'rawBody',
  'rawDraft',
  'rawDraftInput',
  'rawError',
  'rawInput',
  'rawPortOutput',
  'error',
  'stack',
  'sql',
  'database_url',
  'databaseUrl',
  'token',
  'secret',
  'customer',
  'customerPhone',
  'customerAddress',
  'address',
  'phone',
]);

const UNSAFE_TEXT_MARKERS = Object.freeze([
  'select *',
  'postgres://',
  'DATABASE_URL',
  'process.env',
  'unsafe token',
  'unsafe password',
  'unsafe secret',
  'unsafe stack trace',
  'unsafe provider payload',
  'unsafe customer phone',
  'unsafe customer address',
  'unsafe raw draft',
  'unsafe raw request',
  'unsafe audit internal',
  'unsafe debug detail',
  'unsafe billing invoice settlement',
  'unsafe rag payload',
  'providerPayload',
  'auditInternal',
  'rawDraftInput',
]);

function projectPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(projectPath(relativePath), 'utf8');
}

function requireSpecifiers(source) {
  return Array.from(source.matchAll(/^\s*const\s+[^\n]+?=\s*require\(\s*['"]([^'"]+)['"]\s*\)/gm), (match) => match[1]);
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
  const marker = `function ${functionName}`;
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

test('Task2229 static guard reads only source test and doc files', () => {
  assert.ok(fs.existsSync(projectPath(CONTROLLER_ADAPTER_PATH)));
  assert.ok(fs.existsSync(projectPath(API_MODULE_PATH)));
  assert.ok(fs.existsSync(projectPath(TASK2228_TEST_PATH)));
  assert.ok(fs.existsSync(projectPath(TASK2228_DOC_PATH)));

  const ownSource = fs.readFileSync(__filename, 'utf8');

  assert.deepEqual(requireSpecifiers(ownSource), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
  assertExcludesAll(requireSpecifiers(ownSource).join('\n'), FORBIDDEN_IMPORT_PATTERNS, 'Task2229 static guard imports');
});

test('controller adapter freezes injected application service callService failure boundary', () => {
  const source = read(CONTROLLER_ADAPTER_PATH);
  const callService = functionBlock(source, 'callService');

  assertIncludesAll(source, [
    'async function callService(method, input)',
    'planDraftToCase(requestLike = {})',
    'submitDraftToCase(requestLike = {})',
    'applicationService.planDraftToCase',
    'applicationService.submitDraftToCase',
    'sanitizeRequestInput(requestLike)',
  ], 'controller adapter injected boundary');

  assertIncludesAll(callService, [
    'const output = await method(input)',
    'if (!isObject(output))',
    'CONTROLLER_APPLICATION_SERVICE_RESULT_INVALID',
    'CONTROLLER_APPLICATION_SERVICE_FAILED',
    'sanitizeEnvelopeBody(output)',
    'statusCode: statusCodeFor(body)',
    'catch (error)',
  ], 'callService failure normalization');

  assert.doesNotMatch(callService, /\.\.\.\s*(?:output|source|body|result)/);
});

test('controller adapter denylist and string filtering cover raw private provider DB and system markers', () => {
  const source = read(CONTROLLER_ADAPTER_PATH);
  const forbiddenFields = constBlock(source, 'FORBIDDEN_RESPONSE_FIELDS');
  const unsafeTextMarkers = constBlock(source, 'UNSAFE_TEXT_MARKERS');
  const stringValue = functionBlock(source, 'stringValue');
  const safeArray = functionBlock(source, 'safeArray');
  const sanitizeTopLevelEnvelopeSource = functionBlock(source, 'sanitizeTopLevelEnvelopeSource');
  const sanitizeEnvelopeBody = functionBlock(source, 'sanitizeEnvelopeBody');

  const controllerDenylistCoverage = `${forbiddenFields}\n${unsafeTextMarkers}`;

  for (const marker of UNSAFE_DENYLIST_MARKERS) {
    assert.match(controllerDenylistCoverage, new RegExp(`['"]${marker}['"]`, 'i'), `missing forbidden field marker ${marker}`);
  }

  for (const marker of [
    'select *',
    'postgres://',
    'process.env',
    'provider payload',
    'customer phone',
    'customer address',
    'raw draft',
    'raw request',
    'audit internal',
    'debug detail',
    'billing',
    'invoice',
    'settlement',
    'rag',
    'token',
    'password',
    'secret',
    'stack trace',
  ]) {
    assert.match(unsafeTextMarkers, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `missing unsafe text marker ${marker}`);
  }

  assertIncludesAll(stringValue, [
    'stringHasUnsafeText(trimmed)',
    'return undefined',
    'return trimmed',
  ], 'string sanitizer');
  assertIncludesAll(safeArray, [
    'value.map((item) => stringValue(item)).filter(Boolean)',
  ], 'array sanitizer');
  assertIncludesAll(sanitizeTopLevelEnvelopeSource, [
    'fieldIsForbidden(key)',
    'result[key] = fieldValue',
  ], 'top level envelope source sanitizer');
  assertIncludesAll(sanitizeEnvelopeBody, [
    'const source = sanitizeTopLevelEnvelopeSource(value)',
    'ok: source.ok === true',
    'action: stringValue(source.action) || null',
    'reasonCode: stringValue(source.reasonCode) ||',
    'requiredActions: safeArray(source.requiredActions)',
    'caseRef: sanitizeCaseRef(source.caseRef)',
    'caseCandidate: sanitizeCaseCandidate(source.caseCandidate)',
    'auditEvent: sanitizeAuditEvent(source.auditEvent)',
  ], 'explicit response shaping');
  assert.doesNotMatch(sanitizeEnvelopeBody, /\.\.\.\s*(?:source|value|output|result)/);
});

test('API module builds injected application service route handlers through controller adapter', () => {
  const source = read(API_MODULE_PATH);
  const buildController = functionBlock(source, 'buildController');
  const callSafeController = functionBlock(source, 'callSafeController');
  const createSafeController = functionBlock(source, 'createSafeController');

  assertIncludesAll(source, [
    "require('./repairIntakeDraftCaseControllerAdapter')",
    'createRepairIntakeDraftCaseControllerAdapter',
    'applicationServiceIsValid(options.applicationService)',
  ], 'API module imports and validates application service');
  assertIncludesAll(buildController, [
    'createRepairIntakeDraftCaseControllerAdapter({',
    'applicationService: options.applicationService',
  ], 'API module controller build path');
  assertIncludesAll(callSafeController, [
    'sanitizeHandlerOutput(',
    'method.call(',
    'controller',
    'sanitizeRequestInput(requestLike)',
  ], 'API module safe route handler call path');
  assertIncludesAll(createSafeController, [
    'callSafeController(',
    'controller.planDraftToCase',
    'controller.submitDraftToCase',
  ], 'API module safe controller delegated route handler path');
});

test('Task2228 unit coverage freezes failures unsafe leakage success path and immutability', () => {
  const testSource = read(TASK2228_TEST_PATH);
  const docSource = read(TASK2228_DOC_PATH);

  assertIncludesAll(testSource, [
    'controller adapter normalizes thrown and rejected application service failures',
    'controller adapter fails closed for null and non-object application service results',
    'controller adapter strips unsafe application service fields and does not mutate inputs or service result',
    'controller adapter preserves existing allowed success path',
    'api module application-service route handlers inherit controller adapter failure normalization',
    'CONTROLLER_APPLICATION_SERVICE_FAILED',
    'CONTROLLER_APPLICATION_SERVICE_RESULT_INVALID',
    'assertNoUnsafeText(result)',
    'assert.equal(JSON.stringify(request), requestBefore)',
    'assert.equal(JSON.stringify(serviceResult), serviceResultBefore)',
  ], 'Task2228 unit test coverage');

  for (const marker of UNSAFE_TEXT_MARKERS) {
    assert.ok(testSource.includes(marker), `Task2228 test missing unsafe marker ${marker}`);
  }

  assertIncludesAll(docSource, [
    'Hardened the existing Repair Intake draft-to-case controller adapter boundary',
    'non-object result',
    'Thrown/rejected application service failures',
    'Unsafe strings in controller-facing scalar/array fields',
    'Forbidden/raw/private/system fields',
    'Existing allowed success output remains unchanged',
    'No DB commands',
    'The 7 held historical untracked docs were not touched',
  ], 'Task2228 doc coverage');
});
