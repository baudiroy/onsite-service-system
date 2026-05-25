'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const SMOKE_TEST_PATH = path.resolve(
  __dirname,
  'repairIntakeInjectedRuntimeComposer.smoke.test.js',
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
        return `${source.slice(0, start)}${source.slice(index + 1)}`;
      }
    }
  }

  return source;
}

function stripSectionBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);

  if (start === -1) {
    return source;
  }

  const end = source.indexOf(endMarker, start);

  if (end === -1) {
    return source.slice(0, start);
  }

  return `${source.slice(0, start)}${source.slice(end)}`;
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
  let sanitized = stripSectionBetween(
    source,
    'function unsafeRequestLike',
    'function createSyntheticPorts',
  );
  sanitized = stripSectionBetween(
    sanitized,
    'function createSyntheticPorts',
    'function collectEntries',
  );
  sanitized = stripFunction(sanitized, 'assertNoUnsafeText');

  sanitized = stripTestBlock(
    sanitized,
    'composer smoke replays existing idempotency result and suppresses downstream ports',
  );

  return sanitized;
}

test('Task1053 smoke static boundary reads the composer smoke test', () => {
  assert.equal(fs.existsSync(SMOKE_TEST_PATH), true);
});

test('Task1053 smoke imports only the composer Repair Intake runtime source', () => {
  const source = readSmokeSource();
  const repairIntakeRequires = Array.from(
    source.matchAll(/require\('\.\.\/\.\.\/src\/repairIntake\/([^']+)'\)/g),
    (match) => match[1],
  );

  assert.deepEqual(repairIntakeRequires, [
    'repairIntakeDraftToCaseInjectedRuntimeComposer',
  ]);

  for (const forbiddenModule of [
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
  }
});

test('Task1053 smoke keeps composer-only scenario and call-order markers', () => {
  const source = readSmokeSource();

  for (const marker of [
    'createRepairIntakeDraftToCaseInjectedRuntimeComposition',
    'composer smoke builds no-mount composition without calling synthetic ports',
    'composer smoke mounts explicit synthetic target and exercises plan and submit',
    'composer smoke replays existing idempotency result and suppresses downstream ports',
    '/composer-smoke/repair-intake/drafts/:draftId/case/plan',
    '/composer-smoke/repair-intake/drafts/:draftId/case/submit',
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

test('Task1053 smoke does not directly reference individual component factory functions', () => {
  const source = readSmokeSource();

  for (const forbiddenFactory of [
    'createRepairIntakeIdempotencyPortAdapter',
    'createRepairIntakeDraftReaderPortAdapter',
    'createRepairIntakeCasePlannerPortAdapter',
    'createRepairIntakeCaseCreatorPortAdapter',
    'createRepairIntakeAuditWriterPortAdapter',
    'createRepairIntakeDraftToCaseApplicationService',
    'createRepairIntakeDraftToCaseController',
    'createRepairIntakeDraftToCaseApiModule',
    'mountRepairIntakeDraftToCaseApiModule',
  ]) {
    assert.equal(source.includes(forbiddenFactory), false, `direct component factory marker ${forbiddenFactory}`);
  }
});

test('Task1053 smoke avoids forbidden production, provider, AI, billing, and shared-runtime markers', () => {
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
    assert.equal(source.includes(forbidden), false, `forbidden smoke marker ${forbidden}`);
  }

  assert.doesNotMatch(source, /(^|[^'"])listen\(/, 'forbidden bare listen call');
});

test('Task1053 smoke confines unsafe markers to fixtures and redaction assertions', () => {
  const runtimeBody = sourceWithoutAllowedUnsafeFixtures(readSmokeSource());

  for (const forbidden of [
    '+886900001053',
    'unsafe_',
    'select *',
    'postgres://',
    'lineAccessToken',
    'lineUserId',
    'finalAppointmentId',
    'DATABASE_URL',
    'rawRows',
    'stack',
    'token',
  ]) {
    assert.equal(runtimeBody.includes(forbidden), false, `unsafe marker escaped fixture guard ${forbidden}`);
  }
});
