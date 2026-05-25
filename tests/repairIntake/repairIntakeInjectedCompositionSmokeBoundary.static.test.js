'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const SMOKE_TEST_PATH = path.resolve(
  __dirname,
  'repairIntakeInjectedComposition.smoke.test.js',
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

function stripObjectLiteralAfter(source, marker) {
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

function sourceWithoutAllowedUnsafeFixtures(source) {
  let sanitized = source;

  for (const functionName of [
    'unsafeRequestLike',
    'createSyntheticPorts',
    'assertNoUnsafeText',
  ]) {
    sanitized = stripFunction(sanitized, functionName);
  }

  sanitized = stripObjectLiteralAfter(sanitized, 'existingResult:');

  return sanitized;
}

test('Task1048 smoke test keeps expected pure injected composition factories', () => {
  const source = readSmokeSource();

  for (const marker of [
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
    assert.match(source, new RegExp(`\\b${marker}\\b`));
  }
});

test('Task1048 smoke test keeps expected plan, submit, and replay scenario markers', () => {
  const source = readSmokeSource();

  for (const marker of [
    '/local-smoke/repair-intake/drafts/:draftId/case/plan',
    '/local-smoke/repair-intake/drafts/:draftId/case/submit',
    'case/plan',
    'no-existing submit',
    'idempotency result',
    'idempotencyStore.find',
    'draftRepository',
    'planningPolicy',
    'caseCreationPort',
    'auditPort',
    'idempotencyStore.record',
    'suppresses downstream ports',
    'idempotentReplay',
  ]) {
    assert.equal(source.includes(marker), true, `missing scenario marker ${marker}`);
  }

  assert.match(
    source,
    /\[\s*'idempotencyStore\.find',\s*'draftRepository',\s*'planningPolicy',\s*'caseCreationPort',\s*'auditPort',\s*'idempotencyStore\.record',\s*\]/,
  );
});

test('Task1048 smoke test does not import or call production, DB, provider, or repository runtime', () => {
  const source = readSmokeSource();

  for (const forbidden of [
    "require('../../src/app')",
    "require('../../src/server')",
    "require('../../src/routes')",
    "require('../../src/repositories')",
    "require('../../src/db')",
    "require('../../src/providers')",
    'app.listen',
    'server.listen',
    'fetch(',
    'axios',
    'process.env',
    'sendLine',
    'sendSms',
    'sendEmail',
    'openai',
    'vector',
    'billing',
    'invoice',
    'payment',
  ]) {
    assert.equal(source.includes(forbidden), false, `forbidden coupling marker ${forbidden}`);
  }

  assert.doesNotMatch(source, /(^|[^'"])listen\(/, 'forbidden bare listen call');
});

test('Task1048 smoke unsafe data markers stay confined to synthetic fixtures and redaction assertions', () => {
  const source = readSmokeSource();
  const runtimeBody = sourceWithoutAllowedUnsafeFixtures(source);

  for (const forbidden of [
    'DATABASE_URL',
    'lineAccessToken',
    'lineUserId',
    'finalAppointmentId',
    'INSERT INTO',
    'UPDATE ',
    ' DELETE FROM ',
    'SELECT ',
    'select *',
    'postgres://',
  ]) {
    assert.equal(runtimeBody.includes(forbidden), false, `unsafe marker escaped fixture guard ${forbidden}`);
  }
});

test('Task1048 smoke test does not contain production smoke script markers', () => {
  const source = readSmokeSource();

  for (const forbidden of [
    'scripts/smoke',
    'shared runtime',
    'Zeabur',
    'production',
    'staging',
    'DATABASE_URL=',
  ]) {
    assert.equal(source.includes(forbidden), false, `production smoke marker ${forbidden}`);
  }
});
