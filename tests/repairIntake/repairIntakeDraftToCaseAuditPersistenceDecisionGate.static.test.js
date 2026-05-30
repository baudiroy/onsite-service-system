'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const AUDIT_SOURCE_PATHS = Object.freeze([
  'src/repairIntake/repairIntakeAuditWriterPortAdapter.js',
  'src/repairIntake/repairIntakeDraftToCasePlanningAuditBoundary.js',
  'src/repairIntake/repairIntakeDraftToCaseAuditIntentBuilder.js',
  'src/repairIntake/repairIntakeDraftToCaseSyntheticHandler.js',
]);

const EXISTING_GUARD_PATHS = Object.freeze({
  safeAuditContext: 'tests/repairIntake/repairIntakeDraftToCaseSafeAuditContextPropagation.static.test.js',
  permissionDeniedAudit: 'tests/repairIntake/repairIntakeDraftToCasePermissionDeniedAuditIntent.static.test.js',
  auditWriterAdapter: 'tests/repairIntake/repairIntakeAuditWriterPortAdapter.unit.test.js',
});

const DIRECT_RUNTIME_IMPORT_PATTERNS = Object.freeze([
  /(?:^|\/)(?:db|database)(?:$|\/)/i,
  /(?:^|\/)repositories?(?:$|\/)/i,
  /(?:^|\/)migrations?(?:$|\/)/i,
  /(?:^|\/)providers?(?:$|\/)/i,
  /(?:^|\/)notifications?(?:$|\/)/i,
  /(?:^|\/)billing(?:$|\/)/i,
  /(?:^|\/)settlements?(?:$|\/)/i,
  /(?:^|\/)invoices?(?:$|\/)/i,
  /(?:^|\/)payments?(?:$|\/)/i,
  /(?:^|\/)ai(?:$|\/)/i,
  /(?:^|\/)rag(?:$|\/)/i,
  /^(?:pg|knex|sequelize|typeorm|prisma|mysql2|sqlite3|mongodb|mongoose|redis)$/i,
]);

const FORBIDDEN_PERSISTENCE_MARKERS = Object.freeze([
  /\bDATABASE_URL\b/,
  /\bprocess\.env\b/,
  /\bCREATE\s+TABLE\b/i,
  /\bALTER\s+TABLE\b/i,
  /\bDROP\s+TABLE\b/i,
  /\bINSERT\s+INTO\b/i,
  /\bUPDATE\s+[a-z_]/i,
  /\bDELETE\s+FROM\b/i,
  /\bSELECT\s+.+\bFROM\b/i,
  /\bBEGIN\b.*\bCOMMIT\b/is,
  /\bdb:migrate\b/i,
  /\bmigrate\b.*\b(?:up|apply|latest|deploy|run)\b/i,
  /\bpsql\b/i,
  /\bnew\s+Pool\b/,
  /\.query\s*\(/,
  /\bauditRepository\b/i,
  /\brepository\.record\b/i,
  /\bnew\s+[A-Za-z0-9_]*Repository\b/,
  /\bsend(?:Line|Sms|Email|Notification)\b/,
  /\bwebhook\b/i,
  /\bopenai\b/i,
  /\bvector\b/i,
  /\bbilling\b/i,
  /\bsettlement\b/i,
  /\binvoice\b/i,
  /\bpayment\b/i,
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

function stripConstSetBlock(source, constName) {
  const marker = `const ${constName} = new Set([`;
  const start = source.indexOf(marker);

  if (start === -1) {
    return source;
  }

  const end = source.indexOf(']);', start);

  assert.notEqual(end, -1, `unterminated set ${constName}`);

  return `${source.slice(0, start)}\n${source.slice(end + 3)}`;
}

function sourceWithoutDenyLists(source) {
  return stripConstSetBlock(source, 'UNSAFE_FIELD_NAMES');
}

function requireSpecifiers(source) {
  return Array.from(source.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g), (match) => match[1]);
}

function assertIncludesAll(source, markers, label) {
  for (const marker of markers) {
    assert.equal(source.includes(marker), true, `${label} missing marker ${marker}`);
  }
}

function assertExcludesAll(source, patterns, label) {
  for (const pattern of patterns) {
    assert.doesNotMatch(source, pattern, `${label} should not contain ${pattern}`);
  }
}

test('Task2217 static guard reads only the current Repair Intake audit-related files', () => {
  for (const relativePath of [...AUDIT_SOURCE_PATHS, ...Object.values(EXISTING_GUARD_PATHS)]) {
    assert.equal(fs.existsSync(projectPath(relativePath)), true, `${relativePath} should exist`);
  }
});

test('audit-related source has no direct DB, migration, repository, provider, AI, or billing imports', () => {
  for (const relativePath of AUDIT_SOURCE_PATHS) {
    const source = read(relativePath);
    const imports = requireSpecifiers(source);

    for (const specifier of imports) {
      for (const pattern of DIRECT_RUNTIME_IMPORT_PATTERNS) {
        assert.doesNotMatch(
          specifier,
          pattern,
          `${relativePath} import ${specifier} must stay outside persistence/provider/runtime scope`,
        );
      }
    }
  }
});

test('audit-related source has no SQL, migration execution, env, or notification/provider markers', () => {
  for (const relativePath of AUDIT_SOURCE_PATHS) {
    const source = sourceWithoutDenyLists(read(relativePath));

    assertExcludesAll(source, FORBIDDEN_PERSISTENCE_MARKERS, relativePath);
  }
});

test('audit writer port adapter remains an injected port adapter, not a concrete DB repository', () => {
  const source = sourceWithoutDenyLists(read('src/repairIntake/repairIntakeAuditWriterPortAdapter.js'));

  assertIncludesAll(source, [
    'function createRepairIntakeAuditWriterPortAdapter(options = {})',
    'const { auditPort } = safeOptions;',
    "typeof auditPort.recordDraftToCaseDecision !== 'function'",
    'const auditResult = sanitizeValue(await auditPort.recordDraftToCaseDecision(auditInput));',
    'return failureEnvelope(\'REPAIR_INTAKE_AUDIT_WRITER_PORT_ADAPTER_RECORD_FAILED\');',
  ], 'audit writer port adapter');

  assertExcludesAll(source, [
    /\bPool\b/,
    /\bpg\b/,
    /\.query\s*\(/,
    /\bINSERT\s+INTO\b/i,
    /\bUPDATE\s+[a-z_]/i,
    /\bauditRepository\b/i,
    /\bRepository\b/,
    /\bmigration\b/i,
  ], 'audit writer port adapter');
});

test('permission-denied audit intent remains injected, sanitized, and safe on writer absence or failure', () => {
  const source = sourceWithoutDenyLists(read('src/repairIntake/repairIntakeDraftToCaseSyntheticHandler.js'));
  const auditIntent = functionBlock(source, 'permissionDeniedAuditIntent');
  const resolver = functionBlock(source, 'resolvePermissionDeniedAuditWriter');
  const writer = functionBlock(source, 'writePermissionDeniedAuditIntent');

  assertIncludesAll(auditIntent, [
    "eventType: 'repair_intake_draft_to_case_permission_denied'",
    "phase: 'denied'",
    "status: 'denied'",
    "outcome: 'permission_denied'",
    'organizationId',
    'actorId',
    'actorRole',
    'repairIntakeDraftId',
    'source',
    'permissionReasonCode',
    'reasonCode',
    'return sanitizeNestedValue({',
  ], 'permission-denied audit intent');

  assertIncludesAll(resolver, [
    "typeof auditWriter === 'function'",
    'recordRepairIntakeDraftToCasePermissionDenied',
    'recordDraftToCasePermissionDenied',
    'recordPermissionDenied',
    'record',
  ], 'permission-denied audit writer resolver');

  assertIncludesAll(writer, [
    'if (!writeAudit) {',
    'return;',
    'await writeAudit(sanitizeNestedValue({ auditIntent }));',
    'catch (error) {',
  ], 'permission-denied audit writer');

  assertExcludesAll(auditIntent, [
    /\bhandlerInput\b/,
    /\brequestBody\b/i,
    /\brawBody\b/i,
    /\bdraftInput\b/,
    /\bproviderPayload\b/i,
    /\bcustomer(?:Name|Phone|Contact|Address|Data)?\b/i,
    /\baddress\b/i,
    /\btoken\b/i,
    /\bpassword\b/i,
    /\bsql\b/i,
    /\bstack\b/i,
  ], 'permission-denied audit intent');
});

test('safe audit context propagation guard still freezes sanitized server-owned context', () => {
  const source = read(EXISTING_GUARD_PATHS.safeAuditContext);

  assertIncludesAll(source, [
    'Task2208 static guard reads expected Repair Intake-only files',
    'audit writer port adapter keeps explicit sanitized server-owned audit context only',
    'permission-denied audit intent remains sanitized and resolver-context-only',
    'audit writer absence and failure remain safe in adapter and synthetic paths',
    'organizationId',
    'tenantId',
    'actorId',
    'actorRole',
    'repairIntakeDraftId',
    'source',
    'requestId',
  ], 'safe audit context guard');
});

test('existing permission-denied and adapter guards still cover sanitized intent and port-only behavior', () => {
  const permissionGuard = read(EXISTING_GUARD_PATHS.permissionDeniedAudit);
  const adapterUnit = read(EXISTING_GUARD_PATHS.auditWriterAdapter);

  assertIncludesAll(permissionGuard, [
    'permission-denied branch writes audit intent before returning and never invokes adapter on denied path',
    'injected permission-denied audit sink names remain explicit and narrow',
    'audit writer absence and failure stay swallowed before public deny response returns',
    'permission-denial audit intent shape is safe and allowlisted',
    'permission-denied audit writing stays independent from raw client body and draft input',
  ], 'permission-denied static guard');

  assertIncludesAll(adapterUnit, [
    'factory requires injected auditPort.recordDraftToCaseDecision',
    'recordDraftToCaseDecision forwards only sanitized audit context and returns sanitized audit envelope',
    'downstream safe audit failure envelope is preserved without unsafe marker leakage',
    'invalid input fails closed before audit port call',
    'audit port thrown errors and rejections return sanitized record failure envelopes',
  ], 'audit writer adapter unit guard');
});
