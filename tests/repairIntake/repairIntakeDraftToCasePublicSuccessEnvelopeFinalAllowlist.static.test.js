'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const PRESENTER_SOURCE_PATH = path.resolve(
  __dirname,
  '../../src/repairIntake/repairIntakeDraftToCasePublicResultPresenter.js',
);
const HTTP_MAPPER_SOURCE_PATH = path.resolve(
  __dirname,
  '../../src/repairIntake/repairIntakeDraftToCaseHttpResultMapper.js',
);
const ROUTE_SOURCE_PATH = path.resolve(
  __dirname,
  '../../src/routes/repairIntakeDraftToCase.routes.js',
);
const TASK2209_UNIT_TEST_PATH = path.resolve(
  __dirname,
  './repairIntakeDraftToCasePublicSuccessEnvelopeFinalAllowlist.unit.test.js',
);

const PUBLIC_SUCCESS_FIELDS = Object.freeze([
  'ok',
  'status',
  'messageKey',
  'reasonCode',
  'caseId',
  'repairIntakeDraftId',
]);

const FORBIDDEN_PUBLIC_OUTPUT_FIELDS = Object.freeze([
  'organizationId',
  'tenantId',
  'actorId',
  'actorRole',
  'source',
  'draftInput',
  'request',
  'requestBody',
  'rawBody',
  'rawRequest',
  'customer',
  'customerName',
  'customerPhone',
  'customerAddress',
  'privateAddress',
  'appointmentId',
  'completionReportId',
  'finalAppointmentId',
  'assignedEngineerId',
  'engineerId',
  'provider',
  'providerPayload',
  'ai',
  'rag',
  'billing',
  'settlement',
  'invoice',
  'audit',
  'auditActor',
  'auditContext',
  'permission',
  'internal',
  'debug',
  'sql',
  'stack',
  'rawError',
  'token',
  'password',
  'secret',
]);

const UNSAFE_ID_MARKERS = Object.freeze([
  'address',
  'appointment',
  'audit',
  'authorization',
  'billing',
  'cookie',
  'customer',
  'database',
  'debug',
  'engineer',
  'error',
  'invoice',
  'password',
  'permission',
  'phone',
  'provider',
  'rag',
  'raw',
  'secret',
  'select ',
  'settlement',
  'sql',
  'stack',
  'token',
]);

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function constArrayStrings(source, constName) {
  const match = new RegExp(`const ${constName} = \\[([\\s\\S]*?)\\];`).exec(source);

  assert.ok(match, `missing const array ${constName}`);

  return Array.from(match[1].matchAll(/'([^']+)'/g)).map((item) => item[1]);
}

function functionBlock(source, functionName) {
  const marker = `function ${functionName}`;
  const start = source.indexOf(marker);

  assert.notEqual(start, -1, `missing function ${functionName}`);

  const openBrace = source.indexOf('{', start);
  assert.notEqual(openBrace, -1, `missing function body ${functionName}`);

  let depth = 0;

  for (let index = openBrace; index < source.length; index += 1) {
    const char = source[index];

    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
    }

    if (depth === 0) {
      return source.slice(start, index + 1);
    }
  }

  assert.fail(`unterminated function ${functionName}`);
}

function assertIncludesAll(source, markers, label) {
  for (const marker of markers) {
    assert.equal(source.includes(marker), true, `${label} missing marker ${marker}`);
  }
}

function assertExcludesAll(source, markers, label) {
  for (const marker of markers) {
    assert.equal(source.includes(marker), false, `${label} contains marker ${marker}`);
  }
}

function assertObjectHasPublicFields(source, fields, label) {
  for (const field of fields) {
    const propertyPattern = new RegExp(`(^|[^a-zA-Z0-9_$])${field}\\s*(:|[,}\\n])`);

    assert.match(source, propertyPattern, `${label} missing public field ${field}`);
  }
}

function assertNoForbiddenPropertyNames(source, fields, label) {
  for (const field of fields) {
    const propertyPattern = new RegExp(`(^|[^a-zA-Z0-9_$])${field}\\s*:`);

    assert.doesNotMatch(source, propertyPattern, `${label} contains forbidden property ${field}`);
  }
}

test('Task2210 static boundary reads current Repair Intake public envelope files', () => {
  for (const filePath of [
    PRESENTER_SOURCE_PATH,
    HTTP_MAPPER_SOURCE_PATH,
    ROUTE_SOURCE_PATH,
    TASK2209_UNIT_TEST_PATH,
  ]) {
    assert.equal(fs.existsSync(filePath), true, `missing ${filePath}`);
  }
});

test('HTTP mapper keeps the public success envelope field allowlist exact', () => {
  const mapperSource = readFile(HTTP_MAPPER_SOURCE_PATH);
  const publicFieldNames = constArrayStrings(mapperSource, 'PUBLIC_FIELD_NAMES');
  const normalizeBody = functionBlock(mapperSource, 'normalizeBody');

  assert.deepEqual(publicFieldNames, PUBLIC_SUCCESS_FIELDS);
  assert.equal(publicFieldNames.includes('requestId'), false);
  assertObjectHasPublicFields(normalizeBody, PUBLIC_SUCCESS_FIELDS, 'normalizeBody');
  assertExcludesAll(normalizeBody, ['requestId:', '...safeResult', '...publicResult', 'Object.assign'], 'normalizeBody');
});

test('presenter shapes success through the public presenter boundary without raw result spread', () => {
  const presenterSource = readFile(PRESENTER_SOURCE_PATH);
  const publicBase = functionBlock(presenterSource, 'publicBase');
  const presentSuccess = functionBlock(presenterSource, 'presentSuccess');
  const publicEntryPoint = functionBlock(presenterSource, 'presentRepairIntakeDraftToCaseResult');

  assertObjectHasPublicFields(publicBase, PUBLIC_SUCCESS_FIELDS, 'publicBase');
  assertIncludesAll(presentSuccess, [
    'publicBase(PUBLIC_RESULTS.success, true)',
    'caseId: safeScalar(result.caseId)',
    'repairIntakeDraftId: safeDraftId(result)',
  ], 'presentSuccess');
  assertIncludesAll(publicEntryPoint, [
    'presentSuccess(orchestratorResult)',
    'presentDenied(orchestratorResult)',
    'presentInvalidRequest(orchestratorResult)',
    'presentSkipped(orchestratorResult)',
    'presentUnavailable(orchestratorResult)',
  ], 'public entry point');
  assertExcludesAll(presentSuccess, ['...result', '...orchestratorResult', 'Object.assign'], 'presentSuccess');
});

test('safe scalar ID filtering remains nonblank length-limited safe-character and unsafe-marker denied', () => {
  const presenterSource = readFile(PRESENTER_SOURCE_PATH);
  const mapperSource = readFile(HTTP_MAPPER_SOURCE_PATH);
  const presenterSafeScalar = functionBlock(presenterSource, 'safeScalar');
  const mapperSafePublicString = functionBlock(mapperSource, 'safePublicString');

  for (const [label, block] of [
    ['presenter safeScalar', presenterSafeScalar],
    ['HTTP mapper safePublicString', mapperSafePublicString],
  ]) {
    assertIncludesAll(block, [
      "typeof value !== 'string'",
      'const trimmed = value.trim()',
      'trimmed.length === 0',
      'trimmed.length > 160',
      '/^[a-zA-Z0-9_.:-]+$/.test(trimmed)',
      'stringLooksUnsafe(trimmed)',
      'return null',
      'return trimmed',
    ], label);
  }

  assert.deepEqual(constArrayStrings(presenterSource, 'UNSAFE_PUBLIC_VALUE_MARKERS'), UNSAFE_ID_MARKERS);
  assertIncludesAll(constArrayStrings(mapperSource, 'UNSAFE_VALUE_MARKERS'), [
    'address',
    'audit',
    'authorization',
    'billing',
    'cookie',
    'customer',
    'database',
    'debug',
    'internal',
    'invoice',
    'password',
    'permission',
    'phone',
    'provider',
    'rag',
    'raw',
    'secret',
    'select ',
    'settlement',
    'stack',
    'token',
  ], 'HTTP mapper unsafe marker list');
});

test('public success constructors do not name private system provider or service fields', () => {
  const presenterSource = readFile(PRESENTER_SOURCE_PATH);
  const mapperSource = readFile(HTTP_MAPPER_SOURCE_PATH);
  const publicOutputConstructors = [
    functionBlock(presenterSource, 'publicBase'),
    functionBlock(presenterSource, 'presentSuccess'),
    functionBlock(presenterSource, 'presentDenied'),
    functionBlock(presenterSource, 'presentInvalidRequest'),
    functionBlock(presenterSource, 'presentSkipped'),
    functionBlock(presenterSource, 'presentUnavailable'),
    functionBlock(mapperSource, 'normalizeBody'),
  ].join('\n');

  assertNoForbiddenPropertyNames(
    publicOutputConstructors,
    FORBIDDEN_PUBLIC_OUTPUT_FIELDS,
    'public output constructors',
  );
});

test('Task2209 unit guard still proves unsafe output IDs mutation and generic failure safety', () => {
  const unitSource = readFile(TASK2209_UNIT_TEST_PATH);

  assertIncludesAll(unitSource, [
    'Task2209 public success presenter exposes final allowlisted fields only',
    'Task2209 unsafe scalar public identifiers are stripped before synthetic or HTTP envelope',
    'Task2209 malformed or nested public identifiers do not pass through wholesale',
    'Task2209 denied failure and permission envelopes remain generic and sanitized',
    'PUBLIC_SUCCESS_KEYS',
    'FORBIDDEN_FIELDS',
    'assertPublicSuccessShape',
    'assertHttpPublicShape',
    'assertNoForbiddenText',
    'assert.deepEqual(input, before)',
    'requestId',
    'permissionTrace',
  ], 'Task2209 unit guard');

  assertIncludesAll(unitSource, FORBIDDEN_PUBLIC_OUTPUT_FIELDS, 'Task2209 forbidden fixture coverage');
});

test('route file remains admin-mounted and does not add public open route expansion', () => {
  const routeSource = readFile(ROUTE_SOURCE_PATH);

  assertIncludesAll(routeSource, [
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_BASE_PATH = '/api/v1/admin'",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH = '/api/v1/admin/repair-intake/drafts/:draftId/case/submit'",
    'requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION)',
  ], 'admin route boundary');
  assertExcludesAll(routeSource, [
    'openRepairIntake',
    '/api/v1/public',
    '/public/repair-intake',
    '/open/repair-intake',
  ], 'route boundary');
});
