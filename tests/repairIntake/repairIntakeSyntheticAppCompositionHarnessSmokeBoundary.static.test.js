'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const SMOKE_TEST_PATH = path.resolve(
  __dirname,
  'repairIntakeSyntheticAppCompositionHarness.smoke.test.js',
);

function readSmokeSource() {
  return fs.readFileSync(SMOKE_TEST_PATH, 'utf8');
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
    'synthetic app harness smoke replays idempotency result and suppresses downstream ports',
  );
  sanitized = stripTestBlock(
    sanitized,
    'synthetic app harness smoke source imports harness only and avoids forbidden runtime mentions',
  );

  return sanitized;
}

test('Task1064 smoke static boundary reads the synthetic app harness smoke test', () => {
  assert.equal(fs.existsSync(SMOKE_TEST_PATH), true);
});

test('Task1063 smoke imports only the synthetic app harness from Repair Intake runtime code', () => {
  const source = readSmokeSource();
  const repairIntakeRequires = Array.from(
    source.matchAll(/require\('\.\.\/\.\.\/src\/repairIntake\/([^']+)'\)/g),
    (match) => match[1],
  );

  assert.deepEqual(repairIntakeRequires, [
    'repairIntakeSyntheticAppCompositionHarness',
  ]);
});

test('Task1063 smoke blocks lower-level route composition, composer, and component imports', () => {
  const source = readSmokeSource();

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

test('Task1063 smoke keeps harness-only dispatch scenarios and call-order markers', () => {
  const source = readSmokeSource();

  for (const marker of [
    'createRepairIntakeSyntheticAppCompositionHarness',
    'handleSyntheticRequest',
    '/synthetic-harness-smoke',
    '/synthetic-harness-smoke/repair-intake/drafts/:draftId/case/plan',
    '/synthetic-harness-smoke/repair-intake/drafts/:draftId/case/submit',
    'synthetic app harness smoke dispatches plan and no-existing submit through harness only',
    'synthetic app harness smoke replays idempotency result and suppresses downstream ports',
    'synthetic app harness smoke returns sanitized unmatched path and unsupported method envelopes',
    'REPAIR_INTAKE_SYNTHETIC_APP_COMPOSITION_HARNESS_ROUTE_NOT_FOUND',
    'REPAIR_INTAKE_SYNTHETIC_APP_COMPOSITION_HARNESS_METHOD_NOT_ALLOWED',
    'idempotencyStore.find',
    'draftRepository',
    'planningPolicy',
    'caseCreationPort',
    'auditPort',
    'idempotencyStore.record',
    'assert.equal(response.body.idempotentReplay, true)',
  ]) {
    assert.equal(source.includes(marker), true, `missing smoke marker ${marker}`);
  }

  assert.match(
    source,
    /\[\s*'idempotencyStore\.find',\s*'draftRepository',\s*'planningPolicy',\s*'caseCreationPort',\s*'auditPort',\s*'idempotencyStore\.record',\s*\]/,
  );
  assert.match(
    source,
    /\[\s*'idempotencyStore\.find',?\s*\]/,
  );
});

test('Task1063 smoke avoids forbidden app, DB, provider, AI, billing, and global runtime coupling', () => {
  const source = sourceWithoutAllowedUnsafeFixtures(readSmokeSource());

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
    assert.equal(source.includes(forbidden), false, `forbidden smoke source marker ${forbidden}`);
  }

  assert.doesNotMatch(source, /(^|[^'"])listen\(/, 'forbidden bare listen call');
});

test('Task1063 smoke confines sensitive markers to unsafe fixture and redaction assertions', () => {
  const source = readSmokeSource();
  const runtimeBody = sourceWithoutAllowedUnsafeFixtures(source);

  for (const forbidden of [
    '+886900001063',
    'unsafe_',
    'unsafe address task1063',
    'unsafe customer task1063',
    'unsafe_final_task1063',
    'unsafe_line_task1063',
    'unsafe raw body task1063',
    'Bearer unsafe_task1063',
    'DATABASE_URL',
    'databaseUrl',
    'lineAccessToken',
    'lineUserId',
    'finalAppointmentId',
    'rawRows',
    'select *',
    'postgres://',
    'stack',
    'token',
  ]) {
    assert.equal(runtimeBody.includes(forbidden), false, `unsafe marker escaped fixture guard ${forbidden}`);
  }
});
