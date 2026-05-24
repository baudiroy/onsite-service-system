'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const FULL_CHAIN_TEST_PATH = path.resolve(
  __dirname,
  'repairIntakeDraftRepositoryContractFullSyntheticChain.integration.test.js',
);

function readFullChainSource() {
  return fs.readFileSync(FULL_CHAIN_TEST_PATH, 'utf8');
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

function stripConstArrayBlock(source, constName) {
  const marker = `const ${constName} = [`;
  const start = source.indexOf(marker);

  if (start === -1) {
    return source;
  }

  const end = source.indexOf("].join(' ');", start);

  if (end === -1) {
    return source;
  }

  return `${source.slice(0, start)}${source.slice(end + "].join(' ');".length)}`;
}

function sourceWithoutAllowedUnsafeFixtures(source) {
  let sanitized = stripConstArrayBlock(source, 'UNSAFE_ERROR_MESSAGE');

  for (const functionName of [
    'unsafeRequestLike',
    'createRawRepository',
    'createIdempotencyStore',
    'createPorts',
    'assertNoUnsafeText',
  ]) {
    sanitized = stripFunction(sanitized, functionName);
  }

  sanitized = stripTestBlock(
    sanitized,
    'submit route replay uses idempotency find only and returns sanitized replay',
  );

  sanitized = stripTestBlock(
    sanitized,
    'full synthetic chain integration test avoids forbidden runtime coupling imports',
  );

  return sanitized
    .split('\n')
    .filter((line) => ![
      '+886900001076',
      'unsafe_task1076',
      'unsafe task1076',
      'unsafe_query_task1076',
      'unsafe_draft_task1076',
      'unsafe_audit_task1076',
      'postgres://unsafe-task1076',
      'DATABASE_URL',
      'SELECT ',
      'rawRows',
      'rawBody',
      'lineUserId',
      'lineAccessToken',
      'finalAppointmentId',
      'authorization',
      'Bearer unsafe_task1076',
      'stack trace',
    ].some((allowedFixtureMarker) => line.includes(allowedFixtureMarker)))
    .join('\n');
}

test('Task1077 static boundary reads the full synthetic chain integration test', () => {
  assert.equal(fs.existsSync(FULL_CHAIN_TEST_PATH), true);
});

test('Task1076 full chain test keeps expected contract-chain factory imports', () => {
  const source = readFullChainSource();

  for (const marker of [
    'createRepairIntakeDraftRepositoryContract',
    'createRepairIntakeDraftReaderPortAdapter',
    'createRepairIntakeCasePlannerPortAdapter',
    'createRepairIntakeCaseCreatorPortAdapter',
    'createRepairIntakeAuditWriterPortAdapter',
    'createRepairIntakeIdempotencyPortAdapter',
    'createRepairIntakeDraftToCaseApplicationService',
    'createRepairIntakeDraftToCaseController',
    'createRepairIntakeDraftToCaseApiModule',
    'mountRepairIntakeDraftToCaseApiModule',
  ]) {
    assert.equal(source.includes(marker), true, `missing chain marker ${marker}`);
  }
});

test('Task1076 full chain test keeps mounted plan, submit, replay, and failure scenarios', () => {
  const source = readFullChainSource();

  for (const marker of [
    "test('plan route uses repository contract at draft boundary and returns sanitized plan'",
    "test('submit route no-existing uses full call order and sanitized inter-port payloads'",
    "test('submit route replay uses idempotency find only and returns sanitized replay'",
    "test('repository contract read failure stays sanitized through mounted plan route'",
    'mountFullSyntheticChain',
    '/repair-intake/drafts/:draftId/case/plan',
    '/repair-intake/drafts/:draftId/case/submit',
    'REPAIR_INTAKE_DRAFT_REPOSITORY_CONTRACT_READ_FAILED',
  ]) {
    assert.equal(source.includes(marker), true, `missing scenario marker ${marker}`);
  }
});

test('Task1076 full chain test keeps call-order and replay suppression markers', () => {
  const source = readFullChainSource();

  for (const marker of [
    "'idempotencyStore.find'",
    "'rawRepository'",
    "'planningPolicy'",
    "'caseCreationPort'",
    "'auditPort'",
    "'idempotencyStore.record'",
  ]) {
    assert.equal(source.includes(marker), true, `missing call marker ${marker}`);
  }

  assert.match(
    source,
    /\[\s*'idempotencyStore\.find',\s*'rawRepository',\s*'planningPolicy',\s*'caseCreationPort',\s*'auditPort',\s*'idempotencyStore\.record',\s*\]/,
  );
  assert.equal(source.includes("['idempotencyStore.find']"), true);
});

test('Task1076 full chain test avoids forbidden app, DB, provider, API, and billing coupling', () => {
  const source = sourceWithoutAllowedUnsafeFixtures(readFullChainSource());

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
    'INSERT INTO',
    'UPDATE ',
    'DELETE FROM',
    'SELECT ',
    'new DraftRepository',
    'new CaseRepository',
    'Pool(',
    'pg',
    'knex',
    'sequelize',
    'mongoose',
    'sendLine',
    'sendSms',
    'sendEmail',
    'openai',
    'vector',
    'billing',
    'invoice',
    'payment',
  ]) {
    assert.equal(source.includes(forbidden), false, `forbidden full chain marker ${forbidden}`);
  }

  assert.doesNotMatch(source, /(^|[^'"])listen\(/, 'forbidden bare listen call');
});

test('Task1076 full chain test confines sensitive markers to unsafe fixtures and redaction assertions', () => {
  const source = readFullChainSource();
  const guardedSource = sourceWithoutAllowedUnsafeFixtures(source);

  for (const sensitive of [
    '+886900001076',
    'unsafe_task1076',
    'unsafe task1076',
    'postgres://unsafe-task1076',
    'DATABASE_URL',
    'lineUserId',
    'lineAccessToken',
    'finalAppointmentId',
    'rawRows',
    'rawBody',
    'authorization',
    'Bearer unsafe_task1076',
    'stack trace',
  ]) {
    assert.equal(guardedSource.includes(sensitive), false, `sensitive marker escaped fixture guard ${sensitive}`);
  }
});
