'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const SOURCE_PATHS = Object.freeze({
  auditWriterAdapter: 'src/repairIntake/repairIntakeAuditWriterPortAdapter.js',
  applicationService: 'src/repairIntake/repairIntakeDraftToCaseApplicationService.js',
  syntheticHandler: 'src/repairIntake/repairIntakeDraftToCaseSyntheticHandler.js',
  routeFile: 'src/routes/repairIntakeDraftToCase.routes.js',
  unitTest: 'tests/repairIntake/repairIntakeDraftToCaseSafeAuditContextPropagation.unit.test.js',
});

const ACCEPTED_AUDIT_CONTEXT_MARKERS = Object.freeze([
  'organizationId',
  'tenantId',
  'actorId',
  'actorRole',
  'repairIntakeDraftId',
  'source',
  'requestId',
]);

const UNSAFE_AUDIT_CONTEXT_PATTERNS = Object.freeze([
  /\bbody\b/,
  /requestBody/,
  /rawBody/,
  /rawRequest/,
  /rawInput/,
  /rawError/,
  /draftInput/,
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
  /auditActor/i,
  /auditContext/i,
  /password/i,
  /\btoken\b/i,
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

test('Task2208 static guard reads expected Repair Intake-only files', () => {
  for (const relativePath of Object.values(SOURCE_PATHS)) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('audit writer port adapter keeps explicit sanitized server-owned audit context only', () => {
  const source = read(SOURCE_PATHS.auditWriterAdapter);
  const createAuditInput = functionBlock(source, 'createAuditInput');
  const unsafeSet = constSetBlock(source, 'UNSAFE_FIELD_NAMES');

  for (const marker of ACCEPTED_AUDIT_CONTEXT_MARKERS) {
    assert.equal(createAuditInput.includes(marker), true, `missing accepted audit context ${marker}`);
  }

  assert.match(createAuditInput, /draftId: repairIntakeDraftId/);
  assert.match(createAuditInput, /repairIntakeDraftId,/);
  assert.match(createAuditInput, /requestId: firstSafeString\(input\.requestId, input\.context && input\.context\.requestId\)/);
  assert.match(createAuditInput, /actorId: firstSafeString\(/);
  assert.match(createAuditInput, /actorRole: firstSafeString\(/);
  assert.match(createAuditInput, /source: firstSafeString\(input\.source, input\.context && input\.context\.source, draft\.source\)/);
  assert.match(createAuditInput, /return sanitizeValue\(compactObject\(\{/);

  for (const forbidden of [
    /input\.body/,
    /body\./,
    /draftInput/,
    /auditActor/,
    /auditContext/,
    /providerPayload/,
    /\bai\b/,
    /\brag\b/,
    /billing/,
    /settlement/,
    /invoice/,
    /rawRequest/,
    /rawBody/,
  ]) {
    assert.doesNotMatch(createAuditInput, forbidden, `audit context should not read ${forbidden}`);
  }

  for (const marker of [
    'raw',
    'rawaudit',
    'rawbody',
    'rawdraft',
    'rawinput',
    'rawplan',
    'rawportoutput',
    'customer',
    'customerphone',
    'address',
    'sql',
    'stack',
    'token',
  ]) {
    assert.equal(unsafeSet.includes(`'${marker}'`), true, `missing unsafe marker ${marker}`);
  }
});

test('application service allowed audit payload is sanitized before audit writer boundary', () => {
  const source = read(SOURCE_PATHS.applicationService);
  const createAuditPayload = functionBlock(source, 'createAuditPayload');
  const createInputPayload = functionBlock(source, 'createInputPayload');

  assert.match(createAuditPayload, /return sanitizeValue\(\{/);
  assert.match(createAuditPayload, /\.\.\.createInputPayload\(input\)/);
  assert.match(createAuditPayload, /draft: createDraftSummary\(draft\)/);
  assert.match(createAuditPayload, /plan: createPlanSummary\(plan\)/);
  assert.match(createAuditPayload, /caseRef: createCaseRefSummary\(caseRef\)/);
  assert.match(createAuditPayload, /decision: 'submitted'/);

  assert.match(createInputPayload, /requestId: firstSafeString\(/);
  assert.match(createInputPayload, /idempotencyKey: firstSafeString\(input\.idempotencyKey, input\.body && input\.body\.idempotencyKey\)/);

  for (const forbidden of [/auditActor/, /auditContext/, /providerPayload/, /rawRequest/, /rawBody/]) {
    assert.doesNotMatch(createAuditPayload, forbidden, `allowed audit payload should not read ${forbidden}`);
  }
});

test('permission-denied audit intent remains sanitized and resolver-context-only', () => {
  const source = read(SOURCE_PATHS.syntheticHandler);
  const auditIntent = functionBlock(source, 'permissionDeniedAuditIntent');
  const writeAudit = functionBlock(source, 'writePermissionDeniedAuditIntent');

  for (const marker of [
    'organizationId',
    'actorId',
    'actorRole',
    'repairIntakeDraftId',
    'source',
    'permissionReasonCode',
    'reasonCode',
  ]) {
    assert.equal(auditIntent.includes(marker), true, `missing permission audit marker ${marker}`);
  }

  assert.match(auditIntent, /const safeDecision = safeObject\(permissionDecision\)/);
  assert.match(auditIntent, /return sanitizeNestedValue\(\{/);
  assert.match(writeAudit, /if \(!writeAudit\) \{\s*return;\s*\}/);
  assert.match(writeAudit, /try \{\s*await writeAudit\(sanitizeNestedValue\(\{ auditIntent \}\)\);\s*\} catch \(error\) \{\s*\}/);

  for (const unsafePattern of UNSAFE_AUDIT_CONTEXT_PATTERNS) {
    assert.doesNotMatch(auditIntent, unsafePattern, `permission audit should not read ${unsafePattern}`);
  }
});

test('audit writer absence and failure remain safe in adapter and synthetic paths', () => {
  const auditWriterAdapter = read(SOURCE_PATHS.auditWriterAdapter);
  const syntheticHandler = read(SOURCE_PATHS.syntheticHandler);
  const recordDraftToCaseDecision = functionBlock(auditWriterAdapter, 'recordDraftToCaseDecision');
  const failureEnvelope = functionBlock(auditWriterAdapter, 'failureEnvelope');
  const writePermissionDeniedAuditIntent = functionBlock(syntheticHandler, 'writePermissionDeniedAuditIntent');

  assert.match(recordDraftToCaseDecision, /if \(!isObject\(input\)/);
  assert.match(recordDraftToCaseDecision, /return failureEnvelope\(/);
  assert.match(recordDraftToCaseDecision, /catch \(error\) \{\s*return failureEnvelope\('REPAIR_INTAKE_AUDIT_WRITER_PORT_ADAPTER_RECORD_FAILED'\)/);
  assert.match(failureEnvelope, /metadata: null/);
  assert.doesNotMatch(failureEnvelope, /error|stack|raw|token|password|sql/i);

  assert.match(writePermissionDeniedAuditIntent, /if \(!writeAudit\) \{\s*return;\s*\}/);
  assert.match(writePermissionDeniedAuditIntent, /catch \(error\) \{\s*\}/);
  assert.doesNotMatch(writePermissionDeniedAuditIntent, /throw\b|failureEnvelope|dependencyEnvelope/);
});

test('permission-denied path still returns before injected adapter on audit denial', () => {
  const source = read(SOURCE_PATHS.syntheticHandler);
  const factory = functionBlock(source, 'createRepairIntakeDraftToCaseSyntheticHandler');
  const deniedGuard = indexOfMarker(factory, 'if (permissionDecision.allowed !== true)');
  const auditWrite = indexOfMarker(
    factory,
    'await writePermissionDeniedAuditIntent(writePermissionDeniedAudit, permissionDecision, deniedEnvelope);',
  );
  const deniedReturn = indexOfMarker(factory, 'return deniedEnvelope;');
  const adapterInput = indexOfMarker(factory, 'const adapterInput = createAdapterInput(resolverResult);');
  const adapterCall = indexOfMarker(factory, 'callControllerAdapter(adapterInput)');

  assert.ok(deniedGuard < auditWrite);
  assert.ok(auditWrite < deniedReturn);
  assert.ok(deniedReturn < adapterInput);
  assert.ok(adapterInput < adapterCall);

  const deniedPath = factory.slice(deniedGuard, adapterInput);

  assert.doesNotMatch(deniedPath, /createAdapterInput|callControllerAdapter|body\.|draftInput|auditContext/);
});

test('Task2207 unit coverage remains present for dynamic audit propagation behavior', () => {
  const source = read(SOURCE_PATHS.unitTest);

  for (const marker of [
    'admin injected path sends trusted sanitized audit context to audit port',
    'audit writer port adapter keeps explicit trusted actor role source and request context',
    'permission-denied audit absence and failure remain safe without adapter invocation',
    'permission-denied audit intent uses trusted resolver context only',
    'org-body-should-not-audit-2207',
    'draft-audit-should-not-win-2207',
    'hidden-provider-token-2207',
    'actor-trusted-2207',
    'req-trusted-2207',
    'route_adapter_contract',
  ]) {
    assert.equal(source.includes(marker), true, `missing Task2207 unit marker ${marker}`);
  }
});
