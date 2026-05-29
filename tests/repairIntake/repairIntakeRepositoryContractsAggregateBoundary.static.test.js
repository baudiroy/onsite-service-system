'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const CONTRACTS = [
  {
    key: 'draft',
    path: path.resolve(__dirname, '../../src/repairIntake/repairIntakeDraftRepositoryContract.js'),
    factory: 'createRepairIntakeDraftRepositoryContract',
    methods: ['findDraftForConversion'],
    reasonFamily: 'REPAIR_INTAKE_DRAFT_REPOSITORY_CONTRACT_',
    delegation: 'repository.findDraftForConversion(lookup)',
    inputValidation: 'if (!isPlainObject(input))',
  },
  {
    key: 'case',
    path: path.resolve(__dirname, '../../src/repairIntake/repairIntakeCaseRepositoryContract.js'),
    factory: 'createRepairIntakeCaseRepositoryContract',
    methods: ['createCaseFromDraft'],
    reasonFamily: 'REPAIR_INTAKE_CASE_REPOSITORY_CONTRACT_',
    delegation: 'repository.createCaseFromDraft(creationInput)',
    inputValidation: 'if (!isPlainObject(input) || !isPlainObject(input.draft) || !isPlainObject(input.plan))',
  },
  {
    key: 'idempotency',
    path: path.resolve(__dirname, '../../src/repairIntake/repairIntakeIdempotencyRepositoryContract.js'),
    factory: 'createRepairIntakeIdempotencyRepositoryContract',
    methods: ['findExistingDraftToCaseResult', 'recordDraftToCaseResult'],
    reasonFamily: 'REPAIR_INTAKE_IDEMPOTENCY_REPOSITORY_CONTRACT_',
    delegation: 'repository.findExistingDraftToCaseResult(lookup)',
    secondDelegation: 'repository.recordDraftToCaseResult(writerRecordInput)',
    additionalMarkers: ['createWriterRecordInput(recordInput)'],
    inputValidation: 'if (!isPlainObject(input))',
  },
];

function readSource(contract) {
  return fs.readFileSync(contract.path, 'utf8');
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

test('Task1091 aggregate static boundary reads all repository contract sources', () => {
  for (const contract of CONTRACTS) {
    assert.equal(fs.existsSync(contract.path), true, `missing ${contract.key} contract source`);
  }
});

test('Task1091 aggregate guard keeps all repository contract factories and methods', () => {
  for (const contract of CONTRACTS) {
    const source = readSource(contract);

    assert.equal(source.includes(contract.factory), true, `missing factory ${contract.factory}`);

    for (const methodName of contract.methods) {
      assert.equal(source.includes(methodName), true, `missing method ${methodName}`);
    }
  }
});

test('Task1091 aggregate guard keeps fail-closed and sanitization concepts in all contracts', () => {
  for (const contract of CONTRACTS) {
    const source = readSource(contract);

    for (const marker of [
      'function isPlainObject',
      'SAFE_FIELD_NAMES',
      'UNSAFE_FIELD_NAMES',
      'function sanitizeNestedValue',
      'function sanitizeContractFields',
      'function failureEnvelope',
      contract.inputValidation,
      'catch (error)',
      contract.delegation,
    ]) {
      assert.equal(source.includes(marker), true, `${contract.key} missing marker ${marker}`);
    }

    if (contract.secondDelegation) {
      assert.equal(
        source.includes(contract.secondDelegation),
        true,
        `${contract.key} missing marker ${contract.secondDelegation}`,
      );
    }

    for (const marker of contract.additionalMarkers || []) {
      assert.equal(source.includes(marker), true, `${contract.key} missing marker ${marker}`);
    }

    assert.equal(source.includes('error.message'), false, `${contract.key} must not expose error.message`);
    assert.equal(source.includes('error.stack'), false, `${contract.key} must not expose error.stack`);
    assert.equal(source.includes('throw error'), false, `${contract.key} must not rethrow raw errors`);
  }
});

test('Task1091 aggregate guard keeps repository contract reasonCode families', () => {
  for (const contract of CONTRACTS) {
    const source = readSource(contract);

    assert.equal(
      source.includes(contract.reasonFamily),
      true,
      `${contract.key} missing reason family ${contract.reasonFamily}`,
    );
  }
});

test('Task1091 aggregate guard keeps sensitive markers confined to explicit deny-lists', () => {
  for (const contract of CONTRACTS) {
    const source = readSource(contract);
    const sourceWithoutDenyList = sourceWithoutAllowedDenyList(source);

    assert.equal(source.includes('UNSAFE_FIELD_NAMES'), true, `${contract.key} missing deny-list`);

    for (const forbiddenOutsideDenyList of [
      "'raw'",
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
      "'token'",
      "'secret'",
    ]) {
      assert.equal(
        sourceWithoutDenyList.includes(forbiddenOutsideDenyList),
        false,
        `${contract.key} sensitive field escaped deny-list ${forbiddenOutsideDenyList}`,
      );
    }
  }
});

test('Task1091 aggregate guard avoids forbidden DB, repository writer, runtime, provider, and API coupling', () => {
  for (const contract of CONTRACTS) {
    const source = sourceWithoutAllowedDenyList(readSource(contract));

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
      "require('../billing')",
      "require('../../billing')",
      'billing event',
      'invoice',
      'payment',
    ]) {
      assert.equal(
        source.includes(forbidden),
        false,
        `${contract.key} forbidden repository contract marker ${forbidden}`,
      );
    }

    assert.doesNotMatch(source, /(^|[^'"])listen\(/, `${contract.key} forbidden bare listen call`);
  }
});
