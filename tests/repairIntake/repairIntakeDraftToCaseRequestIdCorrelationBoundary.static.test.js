'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const SOURCE_PATHS = Object.freeze({
  routeFile: 'src/routes/repairIntakeDraftToCase.routes.js',
  routeHandler: 'src/repairIntake/repairIntakeDraftToCaseRouteHandlerFactory.js',
  routeAdapter: 'src/repairIntake/repairIntakeDraftToCaseRouteAdapterContract.js',
  preRouteHandler: 'src/repairIntake/repairIntakeDraftToCasePreRouteHandlerFactory.js',
  syntheticHandler: 'src/repairIntake/repairIntakeDraftToCaseSyntheticHandler.js',
  apiModule: 'src/repairIntake/repairIntakeDraftToCaseApiModule.js',
  controllerAdapter: 'src/repairIntake/repairIntakeDraftCaseControllerAdapter.js',
  applicationService: 'src/repairIntake/repairIntakeDraftToCaseApplicationService.js',
  unitTest: 'tests/repairIntake/repairIntakeDraftToCaseRequestIdCorrelationBoundary.unit.test.js',
});

const BODY_CONTEXT_MARKERS = Object.freeze([
  'caseid',
  'correlationid',
  'debugid',
  'dedupekey',
  'duplicate',
  'idempotencykey',
  'repairintakedraftid',
  'replay',
  'requestid',
  'traceid',
]);

const UNSAFE_CONTEXT_MARKERS = Object.freeze([
  /raw/i,
  /rawbody/i,
  /rawrequest/i,
  /rawinput/i,
  /rawerror/i,
  /customer/i,
  /customerphone/i,
  /address/i,
  /provider/i,
  /providerpayload/i,
  /\bai\b/i,
  /\brag\b/i,
  /billing/i,
  /settlement/i,
  /invoice/i,
  /auditactor/i,
  /token/i,
  /password/i,
  /\bsql\b/i,
  /debug/i,
  /internal/i,
  /stack/i,
]);

function projectPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(projectPath(relativePath), 'utf8');
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

function constSetBlock(source, constName) {
  const marker = `const ${constName} = new Set([`;
  const start = source.indexOf(marker);

  assert.notEqual(start, -1, `missing set ${constName}`);

  const end = source.indexOf(']);', start);

  assert.notEqual(end, -1, `unterminated set ${constName}`);

  return source.slice(start, end + 3);
}

function indexOfMarker(source, marker) {
  const index = source.indexOf(marker);

  assert.notEqual(index, -1, `missing marker ${marker}`);

  return index;
}

test('Task2206 static guard reads expected Repair Intake-only files', () => {
  for (const relativePath of Object.values(SOURCE_PATHS)) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('trusted request correlation sources stay top-level or header-like only', () => {
  const routeFile = read(SOURCE_PATHS.routeFile);
  const routeHandler = read(SOURCE_PATHS.routeHandler);
  const routeAdapter = read(SOURCE_PATHS.routeAdapter);
  const adminRequestId = functionBlock(routeFile, 'requestId');
  const adminIdempotencyKey = functionBlock(routeFile, 'idempotencyKey');
  const routeLikeInput = functionBlock(routeHandler, 'routeLikeInputFromFutureRouterInput');
  const routeAdapterInput = functionBlock(routeAdapter, 'routeLikeToPreRouteInput');
  const safeHeaderSet = constSetBlock(routeHandler, 'SAFE_HEADER_NAMES');

  assert.match(adminRequestId, /req\.requestId/);
  assert.match(adminRequestId, /req\.context && req\.context\.requestId/);
  assert.doesNotMatch(adminRequestId, /body\.requestId|bodyRequestId|correlationId|traceId|debugId/);

  assert.match(adminIdempotencyKey, /req\.idempotencyKey/);
  assert.match(adminIdempotencyKey, /req\.context && req\.context\.idempotencyKey/);
  assert.doesNotMatch(adminIdempotencyKey, /body\.idempotencyKey|bodyIdempotencyKey|dedupeKey/);

  assert.match(routeLikeInput, /requestId: safeScalar\(safeInput\.requestId\)/);
  assert.match(routeLikeInput, /idempotencyKey: safeScalar\(safeInput\.idempotencyKey\)/);
  assert.doesNotMatch(routeLikeInput, /safeInput\.body\.requestId|safeInput\.body\.correlationId|draftInput/);

  assert.match(routeAdapterInput, /requestId: safeIdempotencyContextValue\(safeInput\.requestId\)\s*\|\| safeIdempotencyContextValue\(safeHeaderValue\(headers, 'x-request-id'\)\)/);
  assert.match(routeAdapterInput, /idempotencyKey: safeIdempotencyContextValue\(safeHeaderValue\(headers, 'idempotency-key'\)\)\s*\|\| safeIdempotencyContextValue\(safeInput\.idempotencyKey\)/);
  assert.doesNotMatch(routeAdapterInput, /correlationId|traceId|debugId|x-correlation-id|requestBody\.requestId|draftInput/);

  for (const marker of ["'idempotency-key'", "'x-request-id'"]) {
    assert.equal(safeHeaderSet.includes(marker), true, `missing trusted header ${marker}`);
  }

  for (const forbidden of ['x-correlation-id', 'correlation-id', 'trace-id', 'debug-id']) {
    assert.equal(safeHeaderSet.includes(forbidden), false, `unsafe header should not be trusted: ${forbidden}`);
  }
});

test('body and nested draftInput correlation-like fields stay stripped before trusted context', () => {
  const routeFile = read(SOURCE_PATHS.routeFile);
  const routeHandler = read(SOURCE_PATHS.routeHandler);
  const routeAdapter = read(SOURCE_PATHS.routeAdapter);
  const routeBodyContextSet = constSetBlock(routeFile, 'BODY_CONTEXT_FIELD_NAMES');
  const stripBodyContextFields = functionBlock(routeFile, 'stripBodyContextFields');
  const bodyWithoutServerOwnedContext = functionBlock(routeFile, 'bodyWithoutServerOwnedContext');

  for (const marker of BODY_CONTEXT_MARKERS) {
    assert.equal(routeBodyContextSet.includes(`'${marker}'`), true, `admin route should strip ${marker}`);
  }

  assert.match(stripBodyContextFields, /Array\.isArray\(value\)/);
  assert.match(stripBodyContextFields, /stripBodyContextFields\(item\)/);
  assert.match(stripBodyContextFields, /stripBodyContextFields\(fieldValue\)/);
  assert.match(bodyWithoutServerOwnedContext, /return stripBodyContextFields\(safeBody\)/);

  for (const relativePath of [SOURCE_PATHS.routeHandler, SOURCE_PATHS.routeAdapter]) {
    const source = relativePath === SOURCE_PATHS.routeHandler ? routeHandler : routeAdapter;
    const overrideSet = constSetBlock(source, 'BODY_OVERRIDE_FIELD_NAMES');

    for (const marker of BODY_CONTEXT_MARKERS) {
      assert.equal(overrideSet.includes(`'${marker}'`), true, `${relativePath} should strip ${marker}`);
    }
  }
});

test('request correlation value sanitizer keeps unsafe blank malformed and overlong values omitted', () => {
  for (const relativePath of [SOURCE_PATHS.routeAdapter, SOURCE_PATHS.preRouteHandler]) {
    const source = read(relativePath);
    const sanitizer = functionBlock(source, 'safeIdempotencyContextValue');

    assert.equal(source.includes('const IDEMPOTENCY_CONTEXT_MAX_LENGTH = 128;'), true);
    assert.match(source, /const IDEMPOTENCY_CONTEXT_PATTERN = \/\^\[a-zA-Z0-9\._:-\]\+\$\/;/);
    assert.match(sanitizer, /const scalar = safe(?:Scalar|String)\(value\)/);
    assert.match(sanitizer, /!scalar/);
    assert.match(sanitizer, /scalar\.length > IDEMPOTENCY_CONTEXT_MAX_LENGTH/);
    assert.match(sanitizer, /IDEMPOTENCY_CONTEXT_PATTERN\.test\(scalar\) \? scalar : null/);
    assert.doesNotMatch(sanitizer, /requestBody|draftInput|provider|billing|audit|raw|stack|token|password/);
  }
});

test('safe API controller and application service boundary preserves trusted top-level context', () => {
  const apiModule = read(SOURCE_PATHS.apiModule);
  const controllerAdapter = read(SOURCE_PATHS.controllerAdapter);
  const applicationService = read(SOURCE_PATHS.applicationService);
  const safeInputFields = constSetBlock(apiModule, 'SAFE_REQUEST_INPUT_FIELDS');
  const unsafeRequestFields = constSetBlock(apiModule, 'UNSAFE_REQUEST_FIELD_NAMES');
  const controllerInput = functionBlock(controllerAdapter, 'sanitizeRequestInput');
  const submitPrecondition = functionBlock(applicationService, 'submitPreconditionFailure');

  assert.equal(safeInputFields.includes("'requestId'"), true);
  assert.equal(safeInputFields.includes("'idempotencyKey'"), true);
  assert.equal(safeInputFields.includes("'context'"), true);
  assert.equal(safeInputFields.includes("'body'"), true);

  for (const marker of ['headers', 'rawbody', 'rawheaders', 'req', 'res', 'socket']) {
    assert.equal(unsafeRequestFields.includes(`'${marker}'`), true, `API module should reject ${marker}`);
  }

  assert.match(controllerInput, /requestId: stringValue\(context\.requestId\)/);
  assert.match(controllerInput, /idempotencyKey: stringValue\(source\.idempotencyKey\) \|\| stringValue\(body\.idempotencyKey\)/);
  assert.match(submitPrecondition, /firstSafeString\(input\.idempotencyKey, body\.idempotencyKey\)/);
  assert.doesNotMatch(controllerInput, /correlationId|traceId|debugId|headers|rawBody|rawRequest|draftInput/);
});

test('audit intent and adapter failure envelopes do not expose unsafe client correlation', () => {
  const preRouteHandler = read(SOURCE_PATHS.preRouteHandler);
  const syntheticHandler = read(SOURCE_PATHS.syntheticHandler);
  const policyInputFromContext = functionBlock(preRouteHandler, 'policyInputFromContext');
  const permissionDeniedAuditIntent = functionBlock(syntheticHandler, 'permissionDeniedAuditIntent');
  const failureEnvelope = functionBlock(syntheticHandler, 'failureEnvelope');
  const normalizeAdapterOutput = functionBlock(syntheticHandler, 'normalizeAdapterOutput');

  assert.match(policyInputFromContext, /requestId: safeIdempotencyContextValue\(input\.requestId\)/);
  assert.match(policyInputFromContext, /idempotencyKey: safeIdempotencyContextValue\(input\.idempotencyKey\)/);
  assert.doesNotMatch(policyInputFromContext, /requestBody|draftInput|body\.|headers|correlationId|traceId|debugId/);

  for (const block of [permissionDeniedAuditIntent, failureEnvelope]) {
    assert.doesNotMatch(block, /requestId|correlationId|traceId|debugId|idempotencyKey|dedupeKey/);

    for (const unsafeMarker of UNSAFE_CONTEXT_MARKERS) {
      assert.doesNotMatch(block, unsafeMarker, `unsafe marker leaked in safe envelope path: ${unsafeMarker}`);
    }
  }

  assert.match(normalizeAdapterOutput, /sanitizeNestedValue\(adapterOutput\)/);
  assert.match(
    normalizeAdapterOutput,
    /REPAIR_INTAKE_DRAFT_TO_CASE_SYNTHETIC_HANDLER_CONTROLLER_ADAPTER_OUTPUT_INVALID/,
  );
  assert.match(normalizeAdapterOutput, /return failureEnvelope\(/);
});

test('permission-denied path still skips injected controller service adapter invocation', () => {
  const source = read(SOURCE_PATHS.syntheticHandler);
  const factory = functionBlock(source, 'createRepairIntakeDraftToCaseSyntheticHandler');
  const deniedGuard = indexOfMarker(factory, 'if (permissionDecision.allowed !== true)');
  const deniedReturn = indexOfMarker(factory, 'return deniedEnvelope;');
  const adapterInput = indexOfMarker(factory, 'const adapterInput = createAdapterInput(resolverResult);');
  const adapterCall = indexOfMarker(factory, 'callControllerAdapter(adapterInput)');

  assert.ok(deniedGuard < deniedReturn);
  assert.ok(deniedReturn < adapterInput);
  assert.ok(adapterInput < adapterCall);

  const deniedPath = factory.slice(deniedGuard, adapterInput);

  assert.doesNotMatch(deniedPath, /createAdapterInput|callControllerAdapter|requestId|correlationId|idempotencyKey/);
});

test('Task2205 unit coverage remains present for dynamic boundary behavior', () => {
  const source = read(SOURCE_PATHS.unitTest);

  for (const marker of [
    'route handler and adapter use trusted top-level/header request id only',
    'pre-route policy and audit omit unsafe body or draftInput request correlation',
    'malformed or overly long request correlation values are omitted safely',
    'admin request helper does not accept body request correlation fields',
    'permission-denied and adapter-failure envelopes remain sanitized',
    'trusted-header-request-2205',
    'body-request-hidden-2205',
    'body-correlation-hidden-2205',
    'draft-request-hidden-2205',
    'draft-correlation-hidden-2205',
  ]) {
    assert.equal(source.includes(marker), true, `missing Task2205 unit marker ${marker}`);
  }
});
