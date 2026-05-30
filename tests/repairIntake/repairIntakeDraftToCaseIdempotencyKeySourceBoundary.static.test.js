'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const SOURCE_PATHS = Object.freeze({
  routeAdapter: 'src/repairIntake/repairIntakeDraftToCaseRouteAdapterContract.js',
  preRouteHandler: 'src/repairIntake/repairIntakeDraftToCasePreRouteHandlerFactory.js',
  routeHandler: 'src/repairIntake/repairIntakeDraftToCaseRouteHandlerFactory.js',
  syntheticHandler: 'src/repairIntake/repairIntakeDraftToCaseSyntheticHandler.js',
  routeFile: 'src/routes/repairIntakeDraftToCase.routes.js',
  unitTest: 'tests/repairIntake/repairIntakeDraftToCaseIdempotencyKeySourceBoundary.unit.test.js',
});

const BODY_OVERRIDE_MARKERS = Object.freeze([
  'caseid',
  'dedupekey',
  'duplicate',
  'idempotencykey',
  'repairintakedraftid',
  'replay',
  'requestid',
]);

const UNSAFE_CONTEXT_MARKERS = Object.freeze([
  'address',
  'ai',
  'audit',
  'auditactor',
  'billing',
  'customer',
  'customerdata',
  'customername',
  'customerphone',
  'debug',
  'internal',
  'invoice',
  'password',
  'provider',
  'providerpayload',
  'rag',
  'rawbody',
  'rawerror',
  'rawinput',
  'rawrequest',
  'settlement',
  "'s' + 'ql'",
  'stack',
  'token',
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

test('Task2204 static guard reads expected Repair Intake-only files', () => {
  for (const relativePath of Object.values(SOURCE_PATHS)) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('idempotency context is derived only at route-adapter and pre-route policy boundary', () => {
  const routeAdapter = read(SOURCE_PATHS.routeAdapter);
  const preRouteHandler = read(SOURCE_PATHS.preRouteHandler);
  const syntheticHandler = read(SOURCE_PATHS.syntheticHandler);
  const routeLikeToPreRouteInput = functionBlock(routeAdapter, 'routeLikeToPreRouteInput');
  const policyInputFromContext = functionBlock(preRouteHandler, 'policyInputFromContext');
  const createAdapterInput = functionBlock(syntheticHandler, 'createAdapterInput');

  assert.match(routeLikeToPreRouteInput, /idempotencyKey: safeIdempotencyContextValue\(safeHeaderValue\(headers, 'idempotency-key'\)\)\s*\|\| safeIdempotencyContextValue\(safeInput\.idempotencyKey\)/);
  assert.match(routeLikeToPreRouteInput, /requestId: safeIdempotencyContextValue\(safeInput\.requestId\)\s*\|\| safeIdempotencyContextValue\(safeHeaderValue\(headers, 'x-request-id'\)\)/);
  assert.match(policyInputFromContext, /requestId: safeIdempotencyContextValue\(input\.requestId\)/);
  assert.match(policyInputFromContext, /idempotencyKey: safeIdempotencyContextValue\(input\.idempotencyKey\)/);
  assert.doesNotMatch(policyInputFromContext, /requestBody|draftInput|body\.|headers|dedupeKey|caseId|replay|duplicate/);
  assert.doesNotMatch(createAdapterInput, /idempotencyKey|requestId|dedupeKey|replay|duplicate/);
});

test('body-level idempotency and replay fields are stripped before trusted route context', () => {
  for (const relativePath of [SOURCE_PATHS.routeAdapter, SOURCE_PATHS.routeHandler]) {
    const source = read(relativePath);
    const overrideSet = constSetBlock(source, 'BODY_OVERRIDE_FIELD_NAMES');

    for (const marker of BODY_OVERRIDE_MARKERS) {
      assert.equal(overrideSet.includes(`'${marker}'`), true, `${relativePath} should strip ${marker}`);
    }
  }
});

test('unsafe raw private provider ai billing audit and debug fields are denied near route context', () => {
  for (const relativePath of [SOURCE_PATHS.routeAdapter, SOURCE_PATHS.routeHandler]) {
    const source = read(relativePath);
    const unsafeSet = constSetBlock(source, 'UNSAFE_FIELD_NAMES');

    for (const marker of UNSAFE_CONTEXT_MARKERS) {
      assert.equal(unsafeSet.includes(marker), true, `${relativePath} should deny ${marker}`);
    }
  }
});

test('idempotency value sanitizer keeps max length and safe character class', () => {
  for (const relativePath of [SOURCE_PATHS.routeAdapter, SOURCE_PATHS.preRouteHandler]) {
    const source = read(relativePath);
    const sanitizer = functionBlock(source, 'safeIdempotencyContextValue');

    assert.equal(source.includes('const IDEMPOTENCY_CONTEXT_MAX_LENGTH = 128;'), true);
    assert.match(source, /const IDEMPOTENCY_CONTEXT_PATTERN = \/\^\[a-zA-Z0-9\._:-\]\+\$\/;/);
    assert.match(sanitizer, /scalar\.length > IDEMPOTENCY_CONTEXT_MAX_LENGTH/);
    assert.match(sanitizer, /IDEMPOTENCY_CONTEXT_PATTERN\.test\(scalar\) \? scalar : null/);
    assert.doesNotMatch(sanitizer, /requestBody|draftInput|provider|billing|audit|raw|stack|token|password/);
  }
});

test('permission-denied branch still returns before adapter input and adapter invocation', () => {
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

  assert.doesNotMatch(deniedPath, /createAdapterInput|callControllerAdapter|idempotencyKey|requestId/);
});

test('Task2203 unit coverage remains present for body draftInput unsafe values and deny-skip behavior', () => {
  const source = read(SOURCE_PATHS.unitTest);

  for (const marker of [
    'body and draftInput idempotency fields cannot provide fallback idempotency context',
    'unsafe malformed or overly long idempotency context is omitted safely',
    'route adapter accepts header-like idempotency context and strips body overrides',
    'permission-denied synthetic path still skips injected controller adapter',
    'trusted-idem-2203',
    'trusted-header-idem-2203',
    'body-idem-hidden-2203',
    'draft-idem-hidden-2203',
    'fallback:actor-idem-boundary-2203:draft-idem-boundary-2203',
  ]) {
    assert.equal(source.includes(marker), true, `missing Task2203 unit marker ${marker}`);
  }
});
