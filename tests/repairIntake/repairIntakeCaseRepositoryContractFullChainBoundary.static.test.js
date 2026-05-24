'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const FULL_CHAIN_TEST_PATH = path.resolve(
  __dirname,
  'repairIntakeCaseRepositoryContractFullSyntheticChain.integration.test.js',
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
  let sanitized = stripConstArrayBlock(source, 'UNSAFE_DRAFT_ERROR_MESSAGE');
  sanitized = stripConstArrayBlock(sanitized, 'UNSAFE_CASE_ERROR_MESSAGE');

  for (const functionName of [
    'unsafeRequestLike',
    'createRawDraftRepository',
    'createRawCaseRepository',
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
    'case repository full synthetic chain integration test avoids forbidden runtime coupling imports',
  );

  return sanitized
    .split('\n')
    .filter((line) => ![
      '+886900001082',
      'unsafe_task1082',
      'unsafe task1082',
      'unsafe_query_task1082',
      'unsafe_draft_task1082',
      'unsafe_case_task1082',
      'unsafe_audit_task1082',
      'postgres://unsafe-task1082',
      'DATABASE_URL',
      'SELECT ',
      'rawRows',
      'rawBody',
      'lineUserId',
      'lineAccessToken',
      'finalAppointmentId',
      'authorization',
      'Bearer unsafe_task1082',
      'stack trace',
    ].some((allowedFixtureMarker) => line.includes(allowedFixtureMarker)))
    .join('\n');
}

test('Task1083 static boundary reads the case repository full synthetic chain integration test', () => {
  assert.equal(fs.existsSync(FULL_CHAIN_TEST_PATH), true);
});

test('Task1082 case full chain test keeps expected contract-chain factory imports', () => {
  const source = readFullChainSource();

  for (const marker of [
    'createRepairIntakeDraftRepositoryContract',
    'createRepairIntakeCaseRepositoryContract',
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

test('Task1082 case full chain test keeps mounted submit and failure scenarios', () => {
  const source = readFullChainSource();

  for (const marker of [
    "test('submit route no-existing uses draft and case contracts with sanitized payloads'",
    "test('submit route replay uses idempotency find only and returns sanitized replay'",
    "test('case repository contract failure remains sanitized through mounted submit route'",
    'mountFullSyntheticChain',
    '/repair-intake/drafts/:draftId/case/submit',
    'REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_CASE_CREATED',
    'REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_CREATE_FAILED',
  ]) {
    assert.equal(source.includes(marker), true, `missing scenario marker ${marker}`);
  }
});

test('Task1082 case full chain test keeps call-order and replay suppression markers', () => {
  const source = readFullChainSource();

  for (const marker of [
    "'idempotencyStore.find'",
    "'rawDraftRepository'",
    "'planningPolicy'",
    "'rawCaseRepository'",
    "'auditPort'",
    "'idempotencyStore.record'",
  ]) {
    assert.equal(source.includes(marker), true, `missing call marker ${marker}`);
  }

  assert.match(
    source,
    /\[\s*'idempotencyStore\.find',\s*'rawDraftRepository',\s*'planningPolicy',\s*'rawCaseRepository',\s*'auditPort',\s*'idempotencyStore\.record',\s*\]/,
  );
  assert.equal(source.includes("['idempotencyStore.find']"), true);
});

test('Task1082 case full chain test avoids forbidden app, DB, provider, API, and billing coupling', () => {
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
    assert.equal(source.includes(forbidden), false, `forbidden case full chain marker ${forbidden}`);
  }

  assert.doesNotMatch(source, /(^|[^'"])listen\(/, 'forbidden bare listen call');
});

test('Task1082 case full chain test confines sensitive markers to unsafe fixture and redaction checks', () => {
  const source = readFullChainSource();
  const sanitized = sourceWithoutAllowedUnsafeFixtures(source);

  for (const expectedUnsafeFixtureMarker of [
    'UNSAFE_DRAFT_ERROR_MESSAGE',
    'UNSAFE_CASE_ERROR_MESSAGE',
    'assertNoUnsafeText',
  ]) {
    assert.equal(
      source.includes(expectedUnsafeFixtureMarker),
      true,
      `missing unsafe fixture marker ${expectedUnsafeFixtureMarker}`,
    );
  }

  for (const expectedConfinedSensitiveMarker of [
    'lineAccessToken',
    'finalAppointmentId',
    'DATABASE_URL',
    'SELECT *',
    'Bearer unsafe_task1082',
  ]) {
    assert.equal(
      source.includes(expectedConfinedSensitiveMarker),
      true,
      `missing unsafe fixture marker ${expectedConfinedSensitiveMarker}`,
    );
    assert.equal(
      sanitized.includes(expectedConfinedSensitiveMarker),
      false,
      `unsafe fixture marker not confined ${expectedConfinedSensitiveMarker}`,
    );
  }
});
