'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROUTE_SOURCE_PATH = path.resolve(
  __dirname,
  '../../src/routes/repairIntakeDraftToCase.routes.js',
);
const SAFE_ERROR_UNIT_TEST_PATH = path.resolve(
  __dirname,
  './repairIntakeDraftToCaseAdminRouteCompositionSafeError.unit.test.js',
);

const SAFE_ERROR_FIELDS = [
  'ok: false',
  "status: 'unavailable'",
  "messageKey: 'repair_intake_draft_to_case.admin_route_unavailable'",
  "reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_SAFE_ERROR'",
  'caseId: null',
  'repairIntakeDraftId: null',
];

const PUBLIC_OPEN_ROUTE_MARKERS = [
  '/public',
  '/open',
  '/customer',
  '/intake/open',
  '/repair-intake/open',
  'openRepairIntake',
  'public.routes',
  'customer-access',
  'customerAccess',
];

const UNSAFE_ERROR_PATH_MARKERS = [
  'error.message',
  'error.stack',
  'JSON.stringify(error)',
  'next(error)',
  'req.body',
  'requestBody',
  'rawBody',
  'draftInput',
  'DATABASE_URL',
  'postgres://',
  'providerPayload',
  'openai',
  'rag',
  'billing',
  'settlement',
  'invoice',
  'auditActor',
  'token',
  'password',
  'secret',
  'customerPhone',
  'customerAddress',
  'privateAddress',
  'select *',
  'raw exception',
];

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function constObjectBlock(source, constName) {
  const marker = `const ${constName} = {`;
  const start = source.indexOf(marker);

  assert.notEqual(start, -1, `missing object ${constName}`);

  const openBrace = source.indexOf('{', start);
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

  assert.fail(`unterminated object ${constName}`);
}

function functionBlock(source, functionName) {
  const marker = `function ${functionName}`;
  const start = source.indexOf(marker);

  assert.notEqual(start, -1, `missing function ${functionName}`);

  const signatureEnd = source.indexOf(') {', start);

  assert.notEqual(signatureEnd, -1, `missing function body ${functionName}`);

  const openBrace = signatureEnd + 2;
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

function catchBlock(source) {
  const handler = functionBlock(source, 'createExpressSubmitHandler');
  const marker = '} catch (error) {';
  const start = handler.indexOf(marker);

  assert.notEqual(start, -1, 'missing safe-error catch block');

  const openBrace = handler.indexOf('{', start);
  let depth = 0;

  for (let index = openBrace; index < handler.length; index += 1) {
    const char = handler[index];

    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
    }

    if (depth === 0) {
      return handler.slice(start, index + 1);
    }
  }

  assert.fail('unterminated catch block');
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

test('Task2215 static safe-error guard reads current route source and Task2214 unit guard', () => {
  assert.equal(fs.existsSync(ROUTE_SOURCE_PATH), true);
  assert.equal(fs.existsSync(SAFE_ERROR_UNIT_TEST_PATH), true);
});

test('admin route safe-error envelope remains fixed and minimal', () => {
  const routeSource = readFile(ROUTE_SOURCE_PATH);
  const safeErrorBody = constObjectBlock(
    routeSource,
    'REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_SAFE_ERROR_BODY',
  );

  assertIncludesAll(safeErrorBody, SAFE_ERROR_FIELDS, 'safe error body');
  assertExcludesAll(safeErrorBody, [
    'requestId',
    'organizationId',
    'tenantId',
    'actorId',
    'source',
    'body',
    'error',
    'stack',
    'details',
    'debug',
    'internal',
  ], 'safe error body');
});

test('submit handler catch maps unexpected errors to fixed 503 safe envelope only', () => {
  const routeSource = readFile(ROUTE_SOURCE_PATH);
  const handlerCatch = catchBlock(routeSource);

  assertIncludesAll(handlerCatch, [
    'res.status(503).json(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_SAFE_ERROR_BODY)',
    'return;',
    'next({',
    'code: REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_SAFE_ERROR_BODY.reasonCode',
  ], 'safe submit catch');
  assertExcludesAll(handlerCatch, UNSAFE_ERROR_PATH_MARKERS, 'safe submit catch');
});

test('disabled registration missing ports and success behavior remain covered by Task2214 unit guard', () => {
  const unitSource = readFile(SAFE_ERROR_UNIT_TEST_PATH);

  assertIncludesAll(unitSource, [
    'disabled admin route registration remains fail-closed and sanitized',
    'missing injected runtime ports remain fail-closed and sanitized',
    'route composition mount exceptions return sanitized registration summary',
    'permission middleware failure does not expose unsafe request or secret details',
    'malformed request-like input returns safe unavailable envelope without raw error leakage',
    'successful admin route composition remains unchanged and does not execute runtime ports',
    'assertNoUnsafeLeak',
  ], 'Task2214 unit guard');
});

test('route remains admin scoped permission gated and has no public open exposure markers', () => {
  const routeSource = readFile(ROUTE_SOURCE_PATH);

  assertIncludesAll(routeSource, [
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_BASE_PATH = '/api/v1/admin'",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH = '/api/v1/admin/repair-intake/drafts/:draftId/case/submit'",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION = 'cases.create'",
    'requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION)',
  ], 'admin route source');
  assertExcludesAll(routeSource, PUBLIC_OPEN_ROUTE_MARKERS, 'admin route source');
});
