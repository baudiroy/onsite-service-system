'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const SOURCE_PATHS = Object.freeze({
  syntheticHandler: 'src/repairIntake/repairIntakeDraftToCaseSyntheticHandler.js',
  route: 'src/routes/repairIntakeDraftToCase.routes.js',
  unitTest: 'tests/repairIntake/repairIntakeDraftToCaseInjectedAdapterFailureSafeEnvelope.unit.test.js',
});

const SAFE_FAILURE_ENVELOPE_MARKERS = Object.freeze([
  'ok: false',
  "status: 'failed'",
  'messageKey: UNAVAILABLE_MESSAGE_KEY',
  'reasonCode,',
  'organizationId: safeString(safeContext.organizationId)',
  'actorId: safeString(safeContext.actorId)',
  'repairIntakeDraftId: safeString(safeContext.repairIntakeDraftId)',
  'source: safeString(safeContext.source)',
  'actorRole: safeString(safeContext.actorRole)',
  'draftInput: {}',
]);

const UNSAFE_FAILURE_ENVELOPE_MARKERS = Object.freeze([
  /rawBody/i,
  /requestBody/i,
  /rawRequest/i,
  /rawInput/i,
  /rawError/i,
  /rawResult/i,
  /stack/i,
  /\bsql\b/i,
  /token/i,
  /password/i,
  /provider(?:Payload)?/i,
  /\bAI\b/,
  /\bRAG\b/,
  /billing/i,
  /settlement/i,
  /invoice/i,
  /audit(?:Actor)?/i,
  /debug/i,
  /internal/i,
  /customer(?:Name|Phone|Contact|Address|Data)?/i,
  /address/i,
  /private/i,
  /exception/i,
  /error\./i,
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

function indexOfMarker(source, marker) {
  const index = source.indexOf(marker);

  assert.notEqual(index, -1, `missing marker ${marker}`);

  return index;
}

test('Task2201 static guard reads expected Repair Intake-only files', () => {
  for (const relativePath of Object.values(SOURCE_PATHS)) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('allowed path reaches adapter only after trusted context resolution and permission gate', () => {
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
  const deniedReturn = indexOfMarker(factory, 'return deniedEnvelope;');
  const adapterInput = indexOfMarker(factory, 'const adapterInput = createAdapterInput(resolverResult);');
  const adapterCall = indexOfMarker(factory, 'callControllerAdapter(adapterInput)');
  const adapterNormalize = indexOfMarker(factory, 'return normalizeAdapterOutput(adapterOutput, adapterInput);');

  assert.ok(resolverCall < resolverInvalidGuard);
  assert.ok(resolverInvalidGuard < permissionDecision);
  assert.ok(permissionDecision < deniedGuard);
  assert.ok(deniedGuard < deniedReturn);
  assert.ok(deniedReturn < adapterInput);
  assert.ok(adapterInput < adapterCall);
  assert.ok(adapterCall < adapterNormalize);
});

test('permission-denied path returns before adapter input construction and invocation', () => {
  const source = read(SOURCE_PATHS.syntheticHandler);
  const factory = functionBlock(source, 'createRepairIntakeDraftToCaseSyntheticHandler');

  const deniedGuard = indexOfMarker(factory, 'if (permissionDecision.allowed !== true)');
  const adapterInput = indexOfMarker(factory, 'const adapterInput = createAdapterInput(resolverResult);');
  const deniedPath = factory.slice(deniedGuard, adapterInput);

  assert.match(deniedPath, /const deniedEnvelope = permissionDeniedEnvelope\(permissionDecision\);/);
  assert.match(deniedPath, /await writePermissionDeniedAuditIntent\(writePermissionDeniedAudit, permissionDecision, deniedEnvelope\);/);
  assert.match(deniedPath, /return deniedEnvelope;/);
  assert.doesNotMatch(deniedPath, /createAdapterInput/);
  assert.doesNotMatch(deniedPath, /callControllerAdapter/);
  assert.doesNotMatch(deniedPath, /normalizeAdapterOutput/);
});

test('thrown and rejected adapter failures are caught and mapped to safe failure envelope', () => {
  const source = read(SOURCE_PATHS.syntheticHandler);
  const factory = functionBlock(source, 'createRepairIntakeDraftToCaseSyntheticHandler');
  const adapterInput = indexOfMarker(factory, 'const adapterInput = createAdapterInput(resolverResult);');
  const adapterCall = indexOfMarker(factory, 'const adapterOutput = await callControllerAdapter(adapterInput);');
  const normalize = indexOfMarker(factory, 'return normalizeAdapterOutput(adapterOutput, adapterInput);');
  const catchEnvelope = indexOfMarker(
    factory,
    "failureEnvelope(\n        'REPAIR_INTAKE_DRAFT_TO_CASE_SYNTHETIC_HANDLER_CONTROLLER_ADAPTER_FAILED',\n        adapterInput,\n      );",
  );
  const adapterTryPath = factory.slice(adapterInput, catchEnvelope);

  assert.ok(adapterInput < adapterCall);
  assert.ok(adapterCall < normalize);
  assert.ok(normalize < catchEnvelope);
  assert.match(adapterTryPath, /try \{/);
  assert.match(adapterTryPath, /catch \(error\) \{/);
  assert.doesNotMatch(adapterTryPath, /error\.(message|stack)|String\(error\)|throw error/);
});

test('malformed adapter output is normalized through fail-closed output guard', () => {
  const source = read(SOURCE_PATHS.syntheticHandler);
  const normalizer = functionBlock(source, 'normalizeAdapterOutput');

  assert.match(normalizer, /const safeOutput = sanitizeNestedValue\(adapterOutput\);/);
  assert.match(normalizer, /!isPlainObject\(safeOutput\)/);
  assert.match(normalizer, /safeOutput\.ok !== true && safeOutput\.ok !== false/);
  assert.match(normalizer, /failureEnvelope\(/);
  assert.match(
    normalizer,
    /'REPAIR_INTAKE_DRAFT_TO_CASE_SYNTHETIC_HANDLER_CONTROLLER_ADAPTER_OUTPUT_INVALID'/,
  );
  assert.match(normalizer, /context,/);
  assert.match(normalizer, /return safeOutput;/);
  assert.doesNotMatch(normalizer, /throw\b|error\.|stack|rawBody|requestBody|providerPayload/);
});

test('adapter failure reason codes remain distinct and sanitized', () => {
  const source = read(SOURCE_PATHS.syntheticHandler);
  const normalizer = functionBlock(source, 'normalizeAdapterOutput');
  const factory = functionBlock(source, 'createRepairIntakeDraftToCaseSyntheticHandler');

  assert.equal(
    normalizer.includes('REPAIR_INTAKE_DRAFT_TO_CASE_SYNTHETIC_HANDLER_CONTROLLER_ADAPTER_OUTPUT_INVALID'),
    true,
  );
  assert.equal(
    factory.includes('REPAIR_INTAKE_DRAFT_TO_CASE_SYNTHETIC_HANDLER_CONTROLLER_ADAPTER_FAILED'),
    true,
  );
  assert.equal(
    factory.includes('REPAIR_INTAKE_DRAFT_TO_CASE_SYNTHETIC_HANDLER_CONTROLLER_ADAPTER_OUTPUT_INVALID'),
    false,
    'malformed output reason should stay inside the output normalizer',
  );
});

test('safe failure envelope contains trusted context fields only and an empty draftInput', () => {
  const source = read(SOURCE_PATHS.syntheticHandler);
  const envelope = functionBlock(source, 'failureEnvelope');

  assert.match(envelope, /const safeContext = safeObject\(context\);/);
  assert.match(envelope, /return sanitizeNestedValue\(\{/);

  for (const marker of SAFE_FAILURE_ENVELOPE_MARKERS) {
    assert.equal(envelope.includes(marker), true, `missing safe failure envelope marker ${marker}`);
  }

  for (const unsafeMarker of UNSAFE_FAILURE_ENVELOPE_MARKERS) {
    assert.doesNotMatch(envelope, unsafeMarker, `failure envelope leaked unsafe marker ${unsafeMarker}`);
  }
});

test('Task2200 unit coverage remains present for thrown rejected malformed and deny-skip behavior', () => {
  const source = read(SOURCE_PATHS.unitTest);

  for (const marker of [
    'thrown injected adapter exception returns safe failure envelope without raw leak',
    'rejected injected adapter promise returns safe failure envelope without raw leak',
    'malformed injected adapter result maps to safe failure envelope',
    'permission-denied path still skips injected adapter',
    'adapter failure handling does not mutate handler input, resolver result, or adapter result',
    'REPAIR_INTAKE_DRAFT_TO_CASE_SYNTHETIC_HANDLER_CONTROLLER_ADAPTER_FAILED',
    'REPAIR_INTAKE_DRAFT_TO_CASE_SYNTHETIC_HANDLER_CONTROLLER_ADAPTER_OUTPUT_INVALID',
  ]) {
    assert.equal(source.includes(marker), true, `missing Task2200 unit marker ${marker}`);
  }
});
