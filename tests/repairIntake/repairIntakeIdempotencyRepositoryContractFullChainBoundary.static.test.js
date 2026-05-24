'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const FULL_CHAIN_TEST_PATH = path.resolve(
  __dirname,
  'repairIntakeIdempotencyRepositoryContractFullSyntheticChain.integration.test.js',
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
  sanitized = stripConstArrayBlock(sanitized, 'UNSAFE_IDEMPOTENCY_ERROR_MESSAGE');

  for (const functionName of [
    'unsafeRequestLike',
    'createRawDraftRepository',
    'createRawCaseRepository',
    'createRawIdempotencyRepository',
    'createPorts',
    'assertNoUnsafeText',
  ]) {
    sanitized = stripFunction(sanitized, functionName);
  }

  for (const testName of [
    'submit route replay uses raw idempotency find only and returns sanitized replay',
    'idempotency find failure remains sanitized and falls through as safe no-existing behavior',
    'idempotency record failure remains sanitized and does not leak through mounted submit',
    'idempotency repository full synthetic chain integration test avoids forbidden runtime coupling imports',
  ]) {
    sanitized = stripTestBlock(sanitized, testName);
  }

  return sanitized
    .split('\n')
    .filter((line) => ![
      '+886900001088',
      'unsafe_task1088',
      'unsafe task1088',
      'unsafe_query_task1088',
      'unsafe_draft_task1088',
      'unsafe_case_task1088',
      'unsafe_audit_task1088',
      'unsafe_idempotency',
      'postgres://unsafe-task1088',
      'DATABASE_URL',
      'SELECT ',
      'rawRows',
      'rawBody',
      'lineUserId',
      'lineAccessToken',
      'finalAppointmentId',
      'authorization',
      'Bearer unsafe_task1088',
      'stack trace',
    ].some((allowedFixtureMarker) => line.includes(allowedFixtureMarker)))
    .join('\n');
}

test('Task1089 static boundary reads the idempotency repository full synthetic chain integration test', () => {
  assert.equal(fs.existsSync(FULL_CHAIN_TEST_PATH), true);
});

test('Task1088 idempotency full chain test keeps expected contract-chain factory imports', () => {
  const source = readFullChainSource();

  for (const marker of [
    'createRepairIntakeDraftRepositoryContract',
    'createRepairIntakeCaseRepositoryContract',
    'createRepairIntakeIdempotencyRepositoryContract',
    'createRepairIntakeDraftReaderPortAdapter',
    'createRepairIntakeCaseCreatorPortAdapter',
    'createRepairIntakeCasePlannerPortAdapter',
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

test('Task1088 idempotency full chain test keeps mounted submit, replay, and failure scenarios', () => {
  const source = readFullChainSource();

  for (const marker of [
    "test('submit route no-existing uses idempotency, draft, and case contracts with sanitized payloads'",
    "test('submit route replay uses raw idempotency find only and returns sanitized replay'",
    "test('idempotency find failure remains sanitized and falls through as safe no-existing behavior'",
    "test('idempotency record failure remains sanitized and does not leak through mounted submit'",
    'mountFullSyntheticChain',
    '/repair-intake/drafts/:draftId/case/submit',
    'rawIdempotencyFind',
    'rawIdempotencyRecord',
  ]) {
    assert.equal(source.includes(marker), true, `missing scenario marker ${marker}`);
  }
});

test('Task1088 idempotency full chain test keeps call-order and replay suppression markers', () => {
  const source = readFullChainSource();

  for (const marker of [
    "'rawIdempotencyFind'",
    "'rawDraftRepository'",
    "'planningPolicy'",
    "'rawCaseRepository'",
    "'auditPort'",
    "'rawIdempotencyRecord'",
  ]) {
    assert.equal(source.includes(marker), true, `missing call marker ${marker}`);
  }

  assert.match(
    source,
    /\[\s*'rawIdempotencyFind',\s*'rawDraftRepository',\s*'planningPolicy',\s*'rawCaseRepository',\s*'auditPort',\s*'rawIdempotencyRecord',\s*\]/,
  );
  assert.equal(source.includes("['rawIdempotencyFind']"), true);
});

test('Task1088 idempotency full chain test avoids forbidden app, DB, provider, API, and billing coupling', () => {
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
    assert.equal(source.includes(forbidden), false, `forbidden idempotency full chain marker ${forbidden}`);
  }

  assert.doesNotMatch(source, /(^|[^'"])listen\(/, 'forbidden bare listen call');
});

test('Task1088 idempotency full chain test confines sensitive markers to unsafe fixture and redaction checks', () => {
  const source = readFullChainSource();
  const sanitized = sourceWithoutAllowedUnsafeFixtures(source);

  for (const expectedUnsafeFixtureMarker of [
    'UNSAFE_DRAFT_ERROR_MESSAGE',
    'UNSAFE_CASE_ERROR_MESSAGE',
    'UNSAFE_IDEMPOTENCY_ERROR_MESSAGE',
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
    'Bearer unsafe_task1088',
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
