'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const READINESS_TEST_PATH = path.resolve(
  __dirname,
  'repairIntakeSyntheticRouteReadiness.unit.test.js',
);

function readReadinessSource() {
  return fs.readFileSync(READINESS_TEST_PATH, 'utf8');
}

function stripFunction(source, functionName) {
  const marker = `function ${functionName}`;
  const start = source.indexOf(marker);

  if (start === -1) {
    return source;
  }

  const signatureEnd = source.indexOf(') {', start);
  const firstBrace = signatureEnd === -1
    ? source.indexOf('{', start)
    : signatureEnd + 2;

  if (firstBrace === -1) {
    return source;
  }

  let depth = 0;

  for (let index = firstBrace; index < source.length; index += 1) {
    const char = source[index];

    if (char === '{') {
      depth += 1;
    }

    if (char === '}') {
      depth -= 1;

      if (depth === 0) {
        return `${source.slice(0, start)}${source.slice(index + 1)}`;
      }
    }
  }

  return source;
}

function stripTestBlock(source, testName) {
  const marker = `test('${testName}'`;
  const start = source.indexOf(marker);

  if (start === -1) {
    return source;
  }

  const firstBrace = source.indexOf('{', start);
  if (firstBrace === -1) {
    return source;
  }

  let depth = 0;

  for (let index = firstBrace; index < source.length; index += 1) {
    const char = source[index];

    if (char === '{') {
      depth += 1;
    }

    if (char === '}') {
      depth -= 1;

      if (depth === 0) {
        const blockEnd = source.indexOf(');', index);
        const end = blockEnd === -1 ? index + 1 : blockEnd + 2;
        return `${source.slice(0, start)}${source.slice(end)}`;
      }
    }
  }

  return source;
}

function sourceWithoutAllowedUnsafeFixtures(source) {
  let sanitized = source;

  for (const functionName of [
    'unsafeRequestLike',
    'createRuntimePorts',
    'assertNoUnsafeText',
  ]) {
    sanitized = stripFunction(sanitized, functionName);
  }

  sanitized = stripTestBlock(
    sanitized,
    'synthetic route readiness test keeps future-mount safety invariants in source',
  );

  return sanitized;
}

test('Task1068 static boundary reads the synthetic route readiness test', () => {
  assert.equal(fs.existsSync(READINESS_TEST_PATH), true);
});

test('Task1067 readiness test imports only the synthetic app harness from Repair Intake runtime code', () => {
  const source = readReadinessSource();
  const repairIntakeRequires = Array.from(
    source.matchAll(/require\('\.\.\/\.\.\/src\/repairIntake\/([^']+)'\)/g),
    (match) => match[1],
  );

  assert.deepEqual(repairIntakeRequires, [
    'repairIntakeSyntheticAppCompositionHarness',
  ]);
});

test('Task1067 readiness test blocks lower-level route composition, composer, and component imports', () => {
  const source = readReadinessSource();

  for (const forbiddenModule of [
    'repairIntakeDraftToCaseInjectedRouteComposition',
    'repairIntakeDraftToCaseInjectedRuntimeComposer',
    'repairIntakeIdempotencyPortAdapter',
    'repairIntakeDraftReaderPortAdapter',
    'repairIntakeCasePlannerPortAdapter',
    'repairIntakeCaseCreatorPortAdapter',
    'repairIntakeAuditWriterPortAdapter',
    'repairIntakeDraftToCaseApplicationService',
    'repairIntakeDraftToCaseController',
    'repairIntakeDraftToCaseApiModule',
    'repairIntakeDraftToCaseHttpMountAdapter',
  ]) {
    assert.equal(source.includes(`/${forbiddenModule}`), false, `direct component source import ${forbiddenModule}`);
    assert.equal(source.includes(`require('../../src/repairIntake/${forbiddenModule}')`), false);
  }
});

test('Task1067 readiness test keeps expected route and dispatch markers', () => {
  const source = readReadinessSource();

  for (const marker of [
    '/synthetic-route-readiness',
    'repair-intake/drafts/:draftId/case/plan',
    'repair-intake/drafts/:draftId/case/submit',
    'handleSyntheticRequest',
    'REPAIR_INTAKE_SYNTHETIC_APP_COMPOSITION_HARNESS_ROUTE_NOT_FOUND',
    'REPAIR_INTAKE_SYNTHETIC_APP_COMPOSITION_HARNESS_METHOD_NOT_ALLOWED',
    'PLAN_READY_TASK1067',
    'CASE_CREATED_TASK1067',
    'idempotencyStore.find',
    'draftRepository',
    'planningPolicy',
    'caseCreationPort',
    'auditPort',
    'idempotencyStore.record',
  ]) {
    assert.equal(source.includes(marker), true, `missing readiness marker ${marker}`);
  }

  assert.match(
    source,
    /\[\s*'idempotencyStore\.find',\s*'draftRepository',\s*'planningPolicy',\s*'caseCreationPort',\s*'auditPort',\s*'idempotencyStore\.record',\s*\]/,
  );
});

test('Task1067 readiness test avoids forbidden app, DB, provider, AI, billing, and global runtime coupling', () => {
  const source = sourceWithoutAllowedUnsafeFixtures(readReadinessSource());

  for (const forbidden of [
    "require('../../src/app')",
    "require('../../src/server')",
    "require('../../src/routes')",
    "require('../../src/repositories')",
    "require('../../src/db')",
    'src/app',
    'src/server',
    'src/routes',
    'src/repositories',
    'src/db',
    'app.listen',
    'server.listen',
    'fetch(',
    'axios',
    'process.env',
    'DATABASE_URL',
    'lineAccessToken',
    'lineUserId',
    'finalAppointmentId',
    'INSERT INTO',
    'UPDATE ',
    'DELETE FROM',
    'SELECT ',
    'sendLine',
    'sendSms',
    'sendEmail',
    'openai',
    'vector',
    'billing',
    'invoice',
    'payment',
    'scripts/smoke',
    'shared runtime',
    'Zeabur',
    'production',
    'staging',
    'DATABASE_URL=',
  ]) {
    assert.equal(source.includes(forbidden), false, `forbidden readiness source marker ${forbidden}`);
  }

  assert.doesNotMatch(source, /(^|[^'"])listen\(/, 'forbidden bare listen call');
});

test('Task1067 readiness test confines sensitive markers to unsafe fixture and redaction assertions', () => {
  const source = readReadinessSource();
  const runtimeBody = sourceWithoutAllowedUnsafeFixtures(source);

  for (const forbidden of [
    '+886900001067',
    'unsafe_',
    'unsafe address task1067',
    'unsafe customer task1067',
    'unsafe_final_task1067',
    'unsafe_line_task1067',
    'unsafe raw body task1067',
    'Bearer unsafe_task1067',
    'DATABASE_URL',
    'databaseUrl',
    'lineAccessToken',
    'lineUserId',
    'finalAppointmentId',
    'rawRows',
    'postgres://',
    'stack',
    'token',
  ]) {
    assert.equal(runtimeBody.includes(forbidden), false, `unsafe marker escaped fixture guard ${forbidden}`);
  }
});
