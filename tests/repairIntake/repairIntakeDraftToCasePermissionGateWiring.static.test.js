'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const SOURCE_PATHS = Object.freeze({
  syntheticHandler: 'src/repairIntake/repairIntakeDraftToCaseSyntheticHandler.js',
  permissionGate: 'src/repairIntake/repairIntakeDraftToCasePermissionGate.js',
});

const UNSAFE_DENY_ENVELOPE_MARKERS = Object.freeze([
  /rawBody/i,
  /requestBody/i,
  /providerPayload/i,
  /token/i,
  /password/i,
  /\bAI\b/,
  /\bRAG\b/,
  /billing/i,
  /audit/i,
  /debug/i,
  /internal/i,
  /stack/i,
  /\bsql\b/i,
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

  assert.notEqual(paramsEnd, -1, `unterminated function params for ${functionName}`);

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

function indexOfMarker(source, marker) {
  const index = source.indexOf(marker);

  assert.notEqual(index, -1, `missing marker ${marker}`);

  return index;
}

test('Task2197 static guard reads expected permission wiring files', () => {
  for (const relativePath of Object.values(SOURCE_PATHS)) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('synthetic handler imports the pure permission gate decision helper', () => {
  const source = read(SOURCE_PATHS.syntheticHandler);

  assert.match(source, /decideRepairIntakeDraftToCasePermission,\s*\}\s*=\s*require\('\.\/repairIntakeDraftToCasePermissionGate'\);/);
});

test('permission gate decision is checked after trusted context resolution and before adapter invocation', () => {
  const source = read(SOURCE_PATHS.syntheticHandler);
  const factory = functionBlock(source, 'createRepairIntakeDraftToCaseSyntheticHandler');

  const resolverCall = indexOfMarker(
    factory,
    'resolverResult = await resolveRequestContext(isPlainObject(handlerInput) ? handlerInput : {});',
  );
  const resolverInvalidGuard = indexOfMarker(
    factory,
    'if (!isPlainObject(resolverResult) || resolverResult.ok !== true)',
  );
  const permissionDecision = indexOfMarker(
    factory,
    'const permissionDecision = decideRepairIntakeDraftToCasePermission(resolverResult);',
  );
  const deniedGuard = indexOfMarker(factory, 'if (permissionDecision.allowed !== true)');
  const adapterInput = indexOfMarker(factory, 'const adapterInput = createAdapterInput(resolverResult);');
  const controllerAdapter = indexOfMarker(factory, 'callControllerAdapter(adapterInput)');

  assert.ok(resolverCall < resolverInvalidGuard, 'resolver invalid guard should follow resolver call');
  assert.ok(resolverInvalidGuard < permissionDecision, 'permission check should follow trusted resolver ok guard');
  assert.ok(permissionDecision < deniedGuard, 'denied guard should follow permission decision');
  assert.ok(deniedGuard < adapterInput, 'denied guard should precede adapter input construction');
  assert.ok(adapterInput < controllerAdapter, 'controller adapter should receive post-permission adapter input');

  const deniedPath = factory.slice(deniedGuard, adapterInput);

  assert.match(deniedPath, /permissionDeniedEnvelope\(permissionDecision\);/);
  assert.match(deniedPath, /return deniedEnvelope;/);
  assert.doesNotMatch(deniedPath, /callControllerAdapter/);
  assert.doesNotMatch(deniedPath, /createAdapterInput/);
});

test('permission decision input is trusted resolver result only, not raw body or draft input', () => {
  const source = read(SOURCE_PATHS.syntheticHandler);
  const factory = functionBlock(source, 'createRepairIntakeDraftToCaseSyntheticHandler');
  const permissionCallLine = factory
    .split('\n')
    .find((line) => line.includes('decideRepairIntakeDraftToCasePermission('));

  assert.equal(
    permissionCallLine.trim(),
    'const permissionDecision = decideRepairIntakeDraftToCasePermission(resolverResult);',
  );
  assert.doesNotMatch(permissionCallLine, /handlerInput|requestBody|rawBody|draftInput|body|req/);
});

test('permission deny envelope remains generic and does not expose unsafe internals', () => {
  const source = read(SOURCE_PATHS.syntheticHandler);
  const reasonMapper = functionBlock(source, 'permissionReasonCode');
  const denyEnvelope = functionBlock(source, 'permissionDeniedEnvelope');

  for (const marker of [
    'REPAIR_INTAKE_DRAFT_TO_CASE_PERMISSION_GATE_MISSING_TRUSTED_CONTEXT',
    'REPAIR_INTAKE_DRAFT_TO_CASE_PERMISSION_GATE_ROLE_NOT_ALLOWED',
    'REPAIR_INTAKE_DRAFT_TO_CASE_PERMISSION_GATE_INVALID_SOURCE',
    'REPAIR_INTAKE_DRAFT_TO_CASE_PERMISSION_GATE_DENIED',
  ]) {
    assert.equal(reasonMapper.includes(marker), true, `missing generic reason marker ${marker}`);
  }

  for (const marker of [
    'ok: false',
    'messageKey',
    'reasonCode: permissionReasonCode(reasonCode)',
    'organizationId: safeString(safeDecision.organizationId)',
    'actorId: safeString(safeDecision.actorId)',
    'repairIntakeDraftId: safeString(safeDecision.repairIntakeDraftId)',
    'source: safeString(safeDecision.source)',
    'actorRole: safeString(safeDecision.actorRole)',
    'draftInput: {}',
  ]) {
    assert.equal(denyEnvelope.includes(marker), true, `missing deny envelope marker ${marker}`);
  }

  for (const unsafeMarker of UNSAFE_DENY_ENVELOPE_MARKERS) {
    assert.doesNotMatch(denyEnvelope, unsafeMarker, `deny envelope leaked marker ${unsafeMarker}`);
  }
});

test('permission gate helper remains pure and does not read nested client-controlled authorization fields', () => {
  const source = read(SOURCE_PATHS.permissionGate);
  const decision = functionBlock(source, 'decideRepairIntakeDraftToCasePermission');
  const context = functionBlock(source, 'trustedContext');

  assert.match(decision, /const context = trustedContext\(input\);/);

  for (const forbidden of [
    /requestBody/,
    /rawBody/,
    /draftInput/,
    /providerPayload/,
    /permission\b/,
    /password/,
    /\btoken\b/,
    /\bbilling\b/,
    /\baudit\b/,
  ]) {
    assert.doesNotMatch(context, forbidden, `trusted context should not read ${forbidden}`);
    assert.doesNotMatch(decision, forbidden, `permission decision should not read ${forbidden}`);
  }
});
