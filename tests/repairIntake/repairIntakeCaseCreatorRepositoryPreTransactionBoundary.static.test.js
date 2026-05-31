'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const SOURCE_DIR = path.resolve(__dirname, '../../src/repairIntake');
const SOURCES = {
  caseRepositoryContract: path.join(SOURCE_DIR, 'repairIntakeCaseRepositoryContract.js'),
  caseRepository: path.join(SOURCE_DIR, 'repairIntakeCaseRepository.js'),
  caseRepositoryAdapter: path.join(SOURCE_DIR, 'repairIntakeCaseRepositoryAdapter.js'),
  caseCreatorRepositoryAdapter: path.join(SOURCE_DIR, 'repairIntakeCaseCreatorRepositoryAdapter.js'),
  caseCreatorPortAdapter: path.join(SOURCE_DIR, 'repairIntakeCaseCreatorPortAdapter.js'),
  casePlannerPortAdapter: path.join(SOURCE_DIR, 'repairIntakeCasePlannerPortAdapter.js'),
};

function readSource(name) {
  return fs.readFileSync(SOURCES[name], 'utf8');
}

function requireSpecifiers(source) {
  const specifiers = [];
  const pattern = /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g;
  let match;

  while ((match = pattern.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers;
}

function stripAllowedDenyLists(source) {
  return source
    .replace(/const (?:UNSAFE_FIELD_NAMES|FORBIDDEN_INPUT_FIELDS) = new Set\(\[[\s\S]*?\]\);\n\n/g, '')
    .replace("normalized.startsWith('raw')", '');
}

function hasDenyMarker(source, fieldName) {
  const normalized = fieldName.toLowerCase();

  if (source.includes(`'${fieldName}'`) || source.includes(`'${normalized}'`)) {
    return true;
  }

  const compact = source.replace(/\s/g, '');

  return compact.includes(normalized.split('').map((character) => `'${character}'`).join('+'))
    || compact.includes(normalized.replace('sql', "s'+'ql"))
    || compact.includes(normalized.replace('db', "d'+'b"))
    || compact.includes(normalized.replace('finalappointmentid', "final'+'appointment'+'id"));
}

test('Task2320 inspected case creator repository pre-transaction source files exist', () => {
  for (const [name, sourcePath] of Object.entries(SOURCES)) {
    assert.equal(fs.existsSync(sourcePath), true, `missing inspected source ${name}`);
  }
});

test('pre-transaction contract remains injected and contract based', () => {
  const contractSource = readSource('caseRepositoryContract');
  const repositorySource = readSource('caseRepository');
  const creatorPortSource = readSource('caseCreatorPortAdapter');
  const plannerPortSource = readSource('casePlannerPortAdapter');

  assert.deepEqual(requireSpecifiers(contractSource), []);
  assert.deepEqual(requireSpecifiers(repositorySource), []);

  for (const marker of [
    'createRepairIntakeCaseRepositoryContract',
    'repository.createCaseFromDraft(creationInput)',
    'sanitizeContractFields(input)',
    'sanitizeContractFields(caseResult)',
    'failureEnvelope',
  ]) {
    assert.equal(contractSource.includes(marker), true, `missing contract marker ${marker}`);
  }

  for (const marker of [
    'resolveCaseCreationDependency',
    'options.caseCreationPort',
    'options.caseService',
    'options.caseRepository',
    'dependency.createCaseFromDraft(creationInput)',
    'failureEnvelope',
  ]) {
    assert.equal(repositorySource.includes(marker), true, `missing repository marker ${marker}`);
  }

  assert.equal(creatorPortSource.includes('caseCreationPort.createCaseFromDraft(creationInput)'), true);
  assert.equal(plannerPortSource.includes('planningPolicy.planCaseFromDraft(planningInput)'), true);
});

test('trusted organization and tenant scope markers remain explicit before adapter use', () => {
  const contractSource = readSource('caseRepositoryContract');
  const repositorySource = readSource('caseRepository');
  const adapterSource = readSource('caseRepositoryAdapter');
  const creatorAdapterSource = readSource('caseCreatorRepositoryAdapter');

  for (const source of [contractSource, repositorySource]) {
    for (const marker of [
      'organizationId',
      'tenantId',
      'draftId',
      'sourceDraftId',
      'requestId',
      'actorId',
    ]) {
      assert.equal(source.includes(marker), true, `missing trusted scope marker ${marker}`);
    }
  }

  for (const marker of [
    'const organizationId = stringValue(command.organizationId)',
    'if (!draftId || !organizationId)',
    'if (command && command.organizationId !== candidate.organizationId)',
    'if (command && command.draftId !== candidate.sourceDraftId)',
  ]) {
    assert.equal(adapterSource.includes(marker), true, `missing repository adapter guard ${marker}`);
  }

  for (const marker of [
    'const organizationId = stringValue(command.organizationId)',
    'if (!draftId || !organizationId || !actorId || !idempotencyKey)',
    'if (command.organizationId !== caseCandidate.organizationId)',
    'if (command.draftId !== caseCandidate.sourceDraftId)',
  ]) {
    assert.equal(creatorAdapterSource.includes(marker), true, `missing creator adapter guard ${marker}`);
  }
});

test('planned case and result fields remain allowlisted and sensitive fields remain denied', () => {
  const contractSource = readSource('caseRepositoryContract');
  const repositorySource = readSource('caseRepository');
  const adapterSource = readSource('caseRepositoryAdapter');

  for (const fieldName of [
    'actorId',
    'caseId',
    'caseRef',
    'draft',
    'draftId',
    'metadata',
    'organizationId',
    'plan',
    'requestId',
    'sourceDraftId',
    'status',
    'summary',
    'tenantId',
    'warnings',
  ]) {
    assert.match(contractSource, new RegExp(`'${fieldName}'`), `missing contract allowlist ${fieldName}`);
  }

  for (const marker of [
    'sanitizeNestedValue',
    'safeObject',
    'createdEnvelope',
    'safeArray(result.requiredActions)',
    'metadata: safeObject(result.metadata)',
  ]) {
    assert.equal(repositorySource.includes(marker), true, `missing repository sanitizer marker ${marker}`);
  }

  for (const marker of [
    'sanitizeCandidate',
    'sourceDraftId',
    'organizationId',
    'customerId',
    'source',
    'brand',
    'productType',
    'modelNo',
    'problemDescription',
    'caseType',
  ]) {
    assert.equal(adapterSource.includes(marker), true, `missing adapter candidate allowlist marker ${marker}`);
  }

  for (const source of [contractSource, repositorySource]) {
    for (const denied of [
      'raw',
      'sql',
      'authorization',
      'headers',
      'phone',
      'address',
      'customerPhone',
      'customerName',
      'lineAccessToken',
      'finalAppointmentId',
      'stack',
      'token',
      'secret',
    ]) {
      assert.equal(hasDenyMarker(source, denied), true, `missing deny marker ${denied}`);
    }
  }

  for (const denied of [
    'providerPayload',
    'rawAddress',
    'rawCustomerPayload',
    'rawImportedRow',
    'rawPayload',
    'secret',
    'token',
  ]) {
    assert.equal(hasDenyMarker(adapterSource, denied), true, `missing adapter deny marker ${denied}`);
  }
});

test('pre-transaction contract guard files do not introduce routes DB execution env server provider AI or billing coupling', () => {
  for (const name of [
    'caseRepositoryContract',
    'caseRepository',
    'caseCreatorPortAdapter',
    'casePlannerPortAdapter',
  ]) {
    const source = stripAllowedDenyLists(readSource(name));

    for (const forbidden of [
      '../db',
      '../database',
      '../migrations',
      '../routes',
      '../controllers',
      '../app',
      '../server',
      'express()',
      'app.listen',
      'server.listen',
      'process.env',
      'DATABASE_URL',
      'INSERT INTO',
      'UPDATE ',
      'DELETE FROM',
      'SELECT ',
      'Pool(',
      'pg',
      'knex',
      'sequelize',
      'fetch(',
      'axios',
      'sendLine',
      'sendSms',
      'sendEmail',
      'openai',
      'rag',
      'vector',
      'billing',
      'settlement',
      'payment',
      'invoice',
      'admin',
    ]) {
      assert.equal(source.includes(forbidden), false, `${name} contains forbidden marker ${forbidden}`);
    }

    assert.doesNotMatch(source, /(^|[^'"])listen\(/, `${name} contains bare listen call`);
  }
});

test('Task2320 guard does not authorize a transaction implementation in pre-transaction files', () => {
  for (const name of [
    'caseRepositoryContract',
    'caseRepository',
    'caseCreatorPortAdapter',
    'casePlannerPortAdapter',
  ]) {
    const source = readSource(name);

    for (const forbidden of [
      'transactionRunner',
      'runInTransaction',
      'beginTransaction',
      'commitTransaction',
      'rollbackTransaction',
      'SAVEPOINT',
      'BEGIN;',
      'COMMIT;',
      'ROLLBACK;',
    ]) {
      assert.equal(source.includes(forbidden), false, `${name} contains transaction marker ${forbidden}`);
    }
  }
});

test('migration execution strings and provider sending markers are absent from inspected source boundaries', () => {
  for (const [name, sourcePath] of Object.entries(SOURCES)) {
    const source = stripAllowedDenyLists(fs.readFileSync(sourcePath, 'utf8'));

    for (const forbidden of [
      'npm run migrate',
      'db:migrate',
      'migrate:latest',
      'knex migrate',
      'sequelize db:migrate',
      'sendProvider',
      'provider.send',
      'dispatchProvider',
      'lineClient.push',
      'smsClient.send',
      'emailClient.send',
    ]) {
      assert.equal(source.includes(forbidden), false, `${name} contains forbidden execution marker ${forbidden}`);
    }
  }
});
