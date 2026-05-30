'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const ROUTE_SOURCE_PATH = 'src/routes/repairIntakeDraftToCase.routes.js';
const REQUEST_DTO_SANITIZER_PATH = 'src/repairIntake/repairIntakePublicOpenRequestDtoSanitizer.js';
const HTTP_MAPPER_PATH = 'src/repairIntake/repairIntakeDraftToCaseHttpResultMapper.js';
const TASK2211_DOC_PATH = 'docs/task-2211-repair-intake-draft-to-case-route-mount-readiness-inventory-no-runtime-change-no-db-no-smoke-no-provider.md';
const TASK2212_DOC_PATH = 'docs/task-2212-repair-intake-draft-to-case-production-route-exposure-decision-gate-no-runtime-change-no-db-no-smoke-no-provider.md';
const TASK2222_DOC_PATH = 'docs/task-2222-repair-intake-draft-to-case-production-auth-session-readiness-decision-gate-no-runtime-change-no-db-no-smoke-no-provider.md';
const TASK2223_DOC_PATH = 'docs/task-2223-repair-intake-draft-to-case-rate-limit-payload-size-readiness-decision-gate-no-runtime-change-no-db-no-smoke-no-provider.md';

const BOUNDARY_SOURCE_PATHS = Object.freeze([
  ROUTE_SOURCE_PATH,
  'src/repairIntake/repairIntakeDraftToCaseApiModule.js',
  'src/repairIntake/repairIntakeDraftToCaseApplicationService.js',
  'src/repairIntake/repairIntakeDraftToCaseController.js',
  'src/repairIntake/repairIntakeDraftToCaseControllerAdapter.js',
  'src/repairIntake/repairIntakeDraftToCaseHttpMountAdapter.js',
  'src/repairIntake/repairIntakeDraftToCaseHttpResultMapper.js',
  'src/repairIntake/repairIntakeDraftToCaseInjectedRouteComposition.js',
  'src/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposer.js',
  'src/repairIntake/repairIntakeDraftToCasePermissionGate.js',
  'src/repairIntake/repairIntakeDraftToCasePreRouteHandlerFactory.js',
  'src/repairIntake/repairIntakeDraftToCaseRequestContextResolver.js',
  'src/repairIntake/repairIntakeDraftToCaseRouteHandlerFactory.js',
  'src/repairIntake/repairIntakeDraftToCaseRouteRegistrar.js',
  'src/repairIntake/repairIntakeDraftToCaseSafeRouteBoundary.js',
  'src/repairIntake/repairIntakeDraftToCaseSyntheticHandler.js',
]);

const PUBLIC_ROUTE_MARKERS = Object.freeze([
  '/public',
  '/open',
  '/customer',
  '/intake/open',
  '/repair-intake/open',
  'public.routes',
  'openRepairIntake',
  'customerAccess',
  'customer-access',
]);

const RATE_LIMIT_OR_PAYLOAD_IMPORT_PATTERNS = Object.freeze([
  /^express-rate-limit$/i,
  /^rate-limiter-flexible$/i,
  /^@fastify\/rate-limit$/i,
  /^body-parser$/i,
  /^raw-body$/i,
  /^bytes$/i,
  /(?:^|\/)(?:rateLimit|rate-limit|rateLimiter|rate-limiter|throttle|throttling)(?:$|\/)/i,
  /(?:^|\/)(?:bodyParser|body-parser|payload-size|body-size|request-size)(?:$|\/)/i,
  /(?:^|\/)(?:multer|busboy|formidable)(?:$|\/)/i,
]);

const RATE_LIMIT_OR_PAYLOAD_SOURCE_PATTERNS = Object.freeze([
  /\brateLimit\s*\(/,
  /\brateLimiter\b/,
  /\bthrottle(?:Request|Middleware)?\b/i,
  /\bbodyParser\b/,
  /\bexpress\.json\s*\(/,
  /\bexpress\.urlencoded\s*\(/,
  /\bjson\s*\(\s*\{\s*limit\b/i,
  /\burlencoded\s*\(\s*\{\s*limit\b/i,
  /\braw\s*\(\s*\{\s*limit\b/i,
  /\btext\s*\(\s*\{\s*limit\b/i,
  /\bpayloadSize\b/,
  /\bmaxBodySize\b/,
  /\bbodyLimit\b/,
  /\brequestSizeLimit\b/,
  /\bRetry-After\b/i,
  /\btoo_many_requests\b/i,
  /\bTOO_MANY_REQUESTS\b/,
  /\bpayload_too_large\b/i,
  /\bPAYLOAD_TOO_LARGE\b/,
  /\b413\b/,
  /\b429\b/,
  /\bmulter\b/,
  /\bbusboy\b/,
  /\bformidable\b/,
]);

const PUBLIC_SUCCESS_FIELDS = Object.freeze([
  'ok',
  'status',
  'messageKey',
  'reasonCode',
  'caseId',
  'repairIntakeDraftId',
]);

const THROTTLE_OR_LIMIT_FIELDS = Object.freeze([
  'retryAfter',
  'retryAfterSeconds',
  'rateLimit',
  'limit',
  'remaining',
  'resetAt',
  'throttled',
  'payloadLimit',
  'maxBodySize',
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

function constArrayStrings(source, constName) {
  const pattern = new RegExp(`const ${constName} = (?:Object\\.freeze\\()?\\[([\\s\\S]*?)\\]\\)?;`);
  const match = source.match(pattern);

  assert.ok(match, `missing const array ${constName}`);

  return Array.from(match[1].matchAll(/'([^']+)'/g), (item) => item[1]);
}

function functionBlock(source, functionName) {
  const marker = `function ${functionName}`;
  const start = source.indexOf(marker);

  assert.notEqual(start, -1, `missing function ${functionName}`);

  const paramsStart = source.indexOf('(', start);
  let paramsDepth = 0;
  let paramsEnd = -1;

  for (let index = paramsStart; index < source.length; index += 1) {
    const char = source[index];

    if (char === '(') {
      paramsDepth += 1;
    } else if (char === ')') {
      paramsDepth -= 1;

      if (paramsDepth === 0) {
        paramsEnd = index;
        break;
      }
    }
  }

  assert.notEqual(paramsEnd, -1, `unterminated params for ${functionName}`);

  const bodyStart = source.indexOf('{', paramsEnd);
  let depth = 0;

  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index];

    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;

      if (depth === 0) {
        return source.slice(start, index + 1);
      }
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

function assertDoesNotMatchAny(source, patterns, label) {
  for (const pattern of patterns) {
    assert.doesNotMatch(source, pattern, `${label} should not contain ${pattern}`);
  }
}

test('Task2223 static guard reads current rate-limit payload-size decision inputs only', () => {
  for (const relativePath of [
    ...BOUNDARY_SOURCE_PATHS,
    REQUEST_DTO_SANITIZER_PATH,
    HTTP_MAPPER_PATH,
    TASK2211_DOC_PATH,
    TASK2212_DOC_PATH,
    TASK2222_DOC_PATH,
    TASK2223_DOC_PATH,
  ]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('draft-to-case route remains admin scoped permission gated and not public/open/customer intake', () => {
  const routeSource = read(ROUTE_SOURCE_PATH);

  assertIncludesAll(routeSource, [
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_BASE_PATH = '/api/v1/admin'",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH = '/api/v1/admin/repair-intake/drafts/:draftId/case/submit'",
    "REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION = 'cases.create'",
    'requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION)',
    "method: 'POST'",
    'registerRepairIntakeDraftToCaseAdminRoutes',
  ], 'admin route boundary');
  assertExcludesAll(routeSource, PUBLIC_ROUTE_MARKERS, 'draft-to-case route source');
});

test('rate limit middleware packages are not imported by route admin API controller application or synthetic boundaries', () => {
  for (const relativePath of BOUNDARY_SOURCE_PATHS) {
    const source = read(relativePath);

    for (const specifier of requireSpecifiers(source)) {
      for (const pattern of RATE_LIMIT_OR_PAYLOAD_IMPORT_PATTERNS) {
        assert.doesNotMatch(
          specifier,
          pattern,
          `${relativePath} must not import rate-limit or payload-size middleware ${specifier}`,
        );
      }
    }
  }
});

test('body parser payload-size and throttle middleware markers are absent from current boundaries', () => {
  for (const relativePath of BOUNDARY_SOURCE_PATHS) {
    const source = read(relativePath);

    assertDoesNotMatchAny(source, RATE_LIMIT_OR_PAYLOAD_SOURCE_PATTERNS, relativePath);
  }
});

test('request DTO sanitizer remains separate from abuse-protection middleware policy', () => {
  const sanitizerSource = read(REQUEST_DTO_SANITIZER_PATH);
  const allowlist = constArrayStrings(sanitizerSource, 'PUBLIC_OPEN_REPAIR_INTAKE_REQUEST_DTO_ALLOWLIST');
  const denylist = constArrayStrings(sanitizerSource, 'PUBLIC_OPEN_REPAIR_INTAKE_REQUEST_DTO_DENYLIST');
  const sanitizer = functionBlock(sanitizerSource, 'sanitizeRepairIntakePublicOpenRequestDto');

  assert.deepEqual(allowlist, [
    'customerDisplayName',
    'customerContactIntent',
    'customerContactMethod',
    'serviceCategory',
    'problemDescription',
    'preferredTimeDescription',
    'addressDescription',
    'source',
    'consentConfirmed',
  ]);
  assertIncludesAll(denylist, [
    'organizationId',
    'providerPayload',
    'token',
    'password',
    'rawBody',
    'DATABASE_URL',
  ], 'request DTO denylist');
  assertIncludesAll(sanitizer, [
    'if (!isPlainObject(rawInput))',
    'assignString(result, \'customerDisplayName\'',
    'assignString(result, \'problemDescription\'',
    'assignString(result, \'addressDescription\'',
    'const consentConfirmed = firstBoolean(rawInput,',
    'return result',
  ], 'request DTO sanitizer');
  assertDoesNotMatchAny(sanitizerSource, RATE_LIMIT_OR_PAYLOAD_SOURCE_PATTERNS, 'request DTO sanitizer');
});

test('final public envelope allowlist remains separate from throttle retry or payload-size fields', () => {
  const mapperSource = read(HTTP_MAPPER_PATH);
  const publicFieldNames = constArrayStrings(mapperSource, 'PUBLIC_FIELD_NAMES');
  const normalizeBody = functionBlock(mapperSource, 'normalizeBody');

  assert.deepEqual(publicFieldNames, PUBLIC_SUCCESS_FIELDS);

  for (const field of THROTTLE_OR_LIMIT_FIELDS) {
    assert.equal(publicFieldNames.includes(field), false, `public fields should not include ${field}`);
    assert.doesNotMatch(normalizeBody, new RegExp(`(^|[^a-zA-Z0-9_$])${field}\\s*:`));
  }

  assertDoesNotMatchAny(mapperSource, RATE_LIMIT_OR_PAYLOAD_SOURCE_PATTERNS, 'HTTP mapper');
});

test('Task2223 doc records rate-limit payload-size policy as future non-authorized work', () => {
  const doc = read(TASK2223_DOC_PATH);

  for (const marker of [
    'Current route remains admin/injected-only',
    'Current route remains permission-gated by `requirePermission` / `cases.create`',
    'Current route is not public/open/customer intake',
    'No rate limiting middleware is authorized by this task',
    'No payload-size/body-parser policy change is authorized by this task',
    'No route exposure or public/open route expansion is authorized by this task',
    'Future rate limiting / payload-size policy requires a separate exact PM-authorized task',
    'Per-IP vs per-user vs per-organization rate limit key',
    'Request body max size',
    'Failure envelope and reason codes',
    'Staging/smoke/production rollout authorization',
  ]) {
    assert.equal(doc.includes(marker), true, `Task2223 doc missing marker ${marker}`);
  }
});
