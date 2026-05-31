'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const CONTRACT_SOURCE_PATH = path.resolve(
  __dirname,
  '../../src/repairIntake/repairIntakeCaseRepositoryContract.js',
);

function readContractSource() {
  return fs.readFileSync(CONTRACT_SOURCE_PATH, 'utf8');
}

function stripConstArrayBlock(source, constName) {
  const marker = `const ${constName} = new Set([`;
  const start = source.indexOf(marker);

  if (start === -1) {
    return source;
  }

  const end = source.indexOf(']);', start);

  if (end === -1) {
    return source;
  }

  return `${source.slice(0, start)}${source.slice(end + 3)}`;
}

function sourceWithoutAllowedDenyList(source) {
  return stripConstArrayBlock(source, 'UNSAFE_FIELD_NAMES')
    .replace("normalized.startsWith('raw')", '');
}

test('Task1080 static boundary reads the case repository contract source', () => {
  assert.equal(fs.existsSync(CONTRACT_SOURCE_PATH), true);
});

test('Task1079 case contract source keeps expected contract markers and reason codes', () => {
  const source = readContractSource();

  for (const marker of [
    'createRepairIntakeCaseRepositoryContract',
    'createCaseFromDraft',
    'REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_REQUIRED',
    'REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_INPUT_INVALID',
    'REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_CREATE_FAILED',
    'REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_CASE_CREATED',
  ]) {
    assert.equal(source.includes(marker), true, `missing case contract marker ${marker}`);
  }
});

test('Task1079 case contract source keeps fail-closed validation and envelope concepts', () => {
  const source = readContractSource();

  for (const marker of [
    'function isPlainObject',
    'if (!isPlainObject(input) || !isPlainObject(input.draft) || !isPlainObject(input.plan))',
    '!isPlainObject(creationInput.draft)',
    '!isPlainObject(creationInput.plan)',
    'function failureEnvelope',
    'function createdEnvelope',
    'repository.createCaseFromDraft(creationInput)',
    'catch (error)',
    "'REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_CREATE_FAILED'",
  ]) {
    assert.equal(source.includes(marker), true, `missing fail-closed marker ${marker}`);
  }
});

test('Task1079 case contract source keeps safe creation and result field allow-list', () => {
  const source = readContractSource();

  for (const fieldName of [
    'draftId',
    'caseId',
    'caseRef',
    'organizationId',
    'tenantId',
    'requestId',
    'actorId',
    'status',
    'source',
    'sourceDraftId',
    'draft',
    'plan',
    'summary',
    'metadata',
    'warnings',
  ]) {
    assert.match(
      source,
      new RegExp(`'${fieldName}'`),
      `missing safe field allow-list marker ${fieldName}`,
    );
  }

  assert.equal(source.includes('sanitizeContractFields(input)'), true);
  assert.equal(source.includes('sanitizeContractFields(caseResult)'), true);
});

test('Task1079 case contract source lists sensitive fields only as deny-list markers', () => {
  const source = readContractSource();
  const sourceWithoutDenyList = sourceWithoutAllowedDenyList(source);

  for (const sensitiveField of [
    'raw',
    'rawDraft',
    'rawPlan',
    'rawRow',
    'rawRows',
    'sql',
    'query',
    'paramsSql',
    'db',
    'databaseUrl',
    'DATABASE_URL',
    'authorization',
    'cookie',
    'headers',
    'phone',
    'address',
    'customerPhone',
    'customerName',
    'lineUserId',
    'lineAccessToken',
    'finalAppointmentId',
    'stack',
    'error',
    'repository',
    'connection',
  ]) {
    assert.equal(source.includes(`'${sensitiveField}'`), true, `missing deny-list marker ${sensitiveField}`);
  }

  for (const forbiddenOutsideDenyList of [
    "'raw'",
    "'rawDraft'",
    "'rawPlan'",
    "'rawRow'",
    "'rawRows'",
    "'sql'",
    "'query'",
    "'paramsSql'",
    "'db'",
    "'databaseUrl'",
    "'DATABASE_URL'",
    "'authorization'",
    "'cookie'",
    "'headers'",
    "'phone'",
    "'address'",
    "'customerPhone'",
    "'customerName'",
    "'lineUserId'",
    "'lineAccessToken'",
    "'finalAppointmentId'",
    "'stack'",
    "'error'",
    "'connection'",
  ]) {
    assert.equal(
      sourceWithoutDenyList.includes(forbiddenOutsideDenyList),
      false,
      `sensitive field escaped deny-list ${forbiddenOutsideDenyList}`,
    );
  }
});

test('Task1079 case contract source avoids forbidden DB, repository writer, runtime, provider, and API coupling', () => {
  const source = sourceWithoutAllowedDenyList(readContractSource());

  for (const forbidden of [
    "require('../db')",
    "require('../repositories')",
    "require('../routes')",
    "require('../controllers')",
    "require('../app')",
    "require('../server')",
    'src/db',
    'src/repositories',
    'src/routes',
    'src/controllers',
    'src/app',
    'src/server',
    'express()',
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
    assert.equal(source.includes(forbidden), false, `forbidden case contract marker ${forbidden}`);
  }

  assert.doesNotMatch(source, /(^|[^'"])listen\(/, 'forbidden bare listen call');
});
