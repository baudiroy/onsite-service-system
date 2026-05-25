'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const SMOKE_TEST_PATH = path.resolve(
  __dirname,
  'repairIntakeInjectedRouteComposition.smoke.test.js',
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
    'route composition smoke replays idempotency result and suppresses downstream ports',
  );

  return sanitized;
}

test('Task1059 smoke static boundary reads the route-composition smoke test', () => {
  assert.equal(fs.existsSync(SMOKE_TEST_PATH), true);
});

test('Task1058 smoke imports only the route-composition wrapper from Repair Intake runtime source', () => {
  const source = readSmokeSource();
  const repairIntakeRequires = Array.from(
    source.matchAll(/require\('\.\.\/\.\.\/src\/repairIntake\/([^']+)'\)/g),
    (match) => match[1],
  );

  assert.deepEqual(repairIntakeRequires, [
    'repairIntakeDraftToCaseInjectedRouteComposition',
  ]);
});

test('Task1058 smoke blocks direct lower-level composer and component imports', () => {
  const source = readSmokeSource();

  for (const forbiddenModule of [
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

test('Task1058 smoke keeps route-composition scenarios and call-order markers', () => {
  const source = readSmokeSource();

  for (const marker of [
    'createRepairIntakeDraftToCaseInjectedRouteComposition',
    'route composition smoke builds no-mount summary without global route mount',
    'route composition smoke mounts explicit synthetic target and exercises plan and submit',
    'route composition smoke replays idempotency result and suppresses downstream ports',
    'createSyntheticMountTarget',
    "basePath: '/route-composition-smoke'",
    '/route-composition-smoke/repair-intake/drafts/:draftId/case/plan',
    '/route-composition-smoke/repair-intake/drafts/:draftId/case/submit',
    'idempotencyStore.find',
    'draftRepository',
    'planningPolicy',
    'caseCreationPort',
    'auditPort',
    'idempotencyStore.record',
    'assert.deepEqual(calls, [])',
    'assert.equal(summary.components.httpMount, false)',
    'assert.equal(summary.components.httpMount, true)',
    'assert.equal(response.body.idempotentReplay, true)',
  ]) {
    assert.equal(source.includes(marker), true, `missing scenario marker ${marker}`);
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

test('Task1058 smoke avoids forbidden app, DB, provider, AI, billing, and global runtime coupling', () => {
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

test('Task1058 smoke confines sensitive markers to unsafe fixture and redaction assertions', () => {
  const source = readSmokeSource();
  const runtimeBody = sourceWithoutAllowedUnsafeFixtures(source);

  for (const forbidden of [
    '+886900001058',
    'unsafe_',
    'unsafe address task1058',
    'unsafe customer task1058',
    'unsafe_final_task1058',
    'unsafe_line_task1058',
    'unsafe raw body task1058',
    'Bearer unsafe_task1058',
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
