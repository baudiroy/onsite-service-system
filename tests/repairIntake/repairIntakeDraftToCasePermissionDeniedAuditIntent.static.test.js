'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const SYNTHETIC_HANDLER_PATH = 'src/repairIntake/repairIntakeDraftToCaseSyntheticHandler.js';

const SAFE_AUDIT_INTENT_MARKERS = Object.freeze([
  'eventType',
  'phase',
  'status',
  'outcome',
  'organizationId',
  'actorId',
  'actorRole',
  'repairIntakeDraftId',
  'source',
  'permissionReasonCode',
  'reasonCode',
]);

const UNSAFE_AUDIT_INTENT_MARKERS = Object.freeze([
  /\breq\b/i,
  /\brequest\b/i,
  /\bbody\b/i,
  /requestBody/i,
  /rawBody/i,
  /draftInput/i,
  /customer(?:Name|Phone|Contact|Address|Data)?/i,
  /address/i,
  /private/i,
  /provider/i,
  /providerPayload/i,
  /\bai\b/i,
  /\brag\b/i,
  /billing/i,
  /settlement/i,
  /invoice/i,
  /token/i,
  /password/i,
  /\bsql\b/i,
  /debug/i,
  /internal/i,
  /stack/i,
  /rawError/i,
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

test('Task2199 static guard reads the synthetic handler source', () => {
  assert.equal(fs.existsSync(projectPath(SYNTHETIC_HANDLER_PATH)), true);
});

test('permission-denied branch writes audit intent before returning and never invokes adapter on denied path', () => {
  const source = read(SYNTHETIC_HANDLER_PATH);
  const factory = functionBlock(source, 'createRepairIntakeDraftToCaseSyntheticHandler');

  const permissionDecision = indexOfMarker(
    factory,
    'const permissionDecision = decideRepairIntakeDraftToCasePermission(resolverResult);',
  );
  const deniedGuard = indexOfMarker(factory, 'if (permissionDecision.allowed !== true)');
  const denyEnvelope = indexOfMarker(factory, 'const deniedEnvelope = permissionDeniedEnvelope(permissionDecision);');
  const auditWrite = indexOfMarker(
    factory,
    'await writePermissionDeniedAuditIntent(writePermissionDeniedAudit, permissionDecision, deniedEnvelope);',
  );
  const denyReturn = indexOfMarker(factory, 'return deniedEnvelope;');
  const adapterInput = indexOfMarker(factory, 'const adapterInput = createAdapterInput(resolverResult);');
  const controllerAdapter = indexOfMarker(factory, 'callControllerAdapter(adapterInput)');

  assert.ok(permissionDecision < deniedGuard);
  assert.ok(deniedGuard < denyEnvelope);
  assert.ok(denyEnvelope < auditWrite);
  assert.ok(auditWrite < denyReturn);
  assert.ok(denyReturn < adapterInput);
  assert.ok(adapterInput < controllerAdapter);

  const deniedPath = factory.slice(deniedGuard, adapterInput);

  assert.doesNotMatch(deniedPath, /callControllerAdapter/);
  assert.doesNotMatch(deniedPath, /createAdapterInput/);
});

test('injected permission-denied audit sink names remain explicit and narrow', () => {
  const source = read(SYNTHETIC_HANDLER_PATH);
  const resolver = functionBlock(source, 'resolvePermissionDeniedAuditWriter');
  const factory = functionBlock(source, 'createRepairIntakeDraftToCaseSyntheticHandler');

  assert.match(resolver, /typeof auditWriter === 'function'/);

  for (const marker of [
    'recordRepairIntakeDraftToCasePermissionDenied',
    'recordDraftToCasePermissionDenied',
    'recordPermissionDenied',
    'record',
  ]) {
    assert.equal(resolver.includes(marker), true, `missing audit sink marker ${marker}`);
  }

  assert.match(
    factory,
    /safeOptions\.permissionDeniedAuditWriter \|\| safeOptions\.auditWriter \|\| safeOptions\.auditSink/,
  );
});

test('audit writer absence and failure stay swallowed before public deny response returns', () => {
  const source = read(SYNTHETIC_HANDLER_PATH);
  const writer = functionBlock(source, 'writePermissionDeniedAuditIntent');

  assert.match(writer, /if \(!writeAudit\) \{\s*return;\s*\}/);
  assert.match(writer, /try \{\s*await writeAudit\(sanitizeNestedValue\(\{ auditIntent \}\)\);\s*\} catch \(error\) \{\s*\}/);
  assert.doesNotMatch(writer, /throw\b/);
  assert.doesNotMatch(writer, /failureEnvelope|dependencyEnvelope|permissionDeniedEnvelope/);
});

test('permission-denial audit intent shape is safe and allowlisted', () => {
  const source = read(SYNTHETIC_HANDLER_PATH);
  const auditIntent = functionBlock(source, 'permissionDeniedAuditIntent');

  for (const marker of SAFE_AUDIT_INTENT_MARKERS) {
    assert.equal(auditIntent.includes(marker), true, `missing safe audit marker ${marker}`);
  }

  assert.match(auditIntent, /eventType: 'repair_intake_draft_to_case_permission_denied'/);
  assert.match(auditIntent, /permissionReasonCode: permissionReasonCode\(reasonCode\)/);
  assert.match(auditIntent, /reasonCode: safeString\(safeEnvelope\.reasonCode\) \|\| permissionReasonCode\(reasonCode\)/);

  for (const unsafeMarker of UNSAFE_AUDIT_INTENT_MARKERS) {
    assert.doesNotMatch(auditIntent, unsafeMarker, `audit intent leaked unsafe marker ${unsafeMarker}`);
  }
});

test('permission-denied audit writing stays independent from raw client body and draft input', () => {
  const source = read(SYNTHETIC_HANDLER_PATH);
  const writer = functionBlock(source, 'writePermissionDeniedAuditIntent');
  const auditIntent = functionBlock(source, 'permissionDeniedAuditIntent');
  const combined = `${writer}\n${auditIntent}`;

  for (const forbidden of [
    /handlerInput/,
    /requestBody/,
    /rawBody/,
    /draftInput/,
    /body\./,
    /req\./,
    /providerPayload/,
    /\btoken\b/,
    /password/,
    /\bsql\b/i,
    /stack/,
  ]) {
    assert.doesNotMatch(combined, forbidden, `permission denied audit path should not read ${forbidden}`);
  }
});
