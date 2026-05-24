'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const SOURCE_PATH = path.resolve(
  __dirname,
  '../../src/repairIntake/repairIntakeDraftToCaseInjectedRuntimeComposer.js',
);

function readComposerSource() {
  return fs.readFileSync(SOURCE_PATH, 'utf8');
}

function assertIncludes(source, marker) {
  assert.equal(source.includes(marker), true, `missing source marker ${marker}`);
}

function assertInjectedMethodGuard(source, dependencyName, methodName) {
  assertIncludes(source, dependencyName);
  assertIncludes(source, `'${methodName}'`);
  assert.match(
    source,
    new RegExp(`hasMethod\\(options\\.${dependencyName},\\s*'${methodName}'\\)`),
    `missing injected method guard for ${dependencyName}.${methodName}`,
  );
}

test('composer static boundary reads Task1051 composer source', () => {
  assert.equal(fs.existsSync(SOURCE_PATH), true);
});

test('composer keeps expected factory and composition markers', () => {
  const source = readComposerSource();

  for (const marker of [
    'createRepairIntakeDraftToCaseInjectedRuntimeComposition',
    'createRepairIntakeIdempotencyPortAdapter',
    'createRepairIntakeDraftReaderPortAdapter',
    'createRepairIntakeCasePlannerPortAdapter',
    'createRepairIntakeCaseCreatorPortAdapter',
    'createRepairIntakeAuditWriterPortAdapter',
    'createRepairIntakeDraftToCaseApplicationService',
    'createRepairIntakeDraftToCaseController',
    'createRepairIntakeDraftToCaseApiModule',
    'mountRepairIntakeDraftToCaseApiModule',
    'validatePorts',
    'componentSummary',
    'routeSummary',
  ]) {
    assertIncludes(source, marker);
  }
});

test('composer keeps required and optional injected dependency guards', () => {
  const source = readComposerSource();

  assertInjectedMethodGuard(source, 'draftRepository', 'findDraftForConversion');
  assertInjectedMethodGuard(source, 'caseCreationPort', 'createCaseFromDraft');
  assertInjectedMethodGuard(source, 'auditPort', 'recordDraftToCaseDecision');
  assertInjectedMethodGuard(source, 'idempotencyStore', 'findExistingDraftToCaseResult');
  assertInjectedMethodGuard(source, 'idempotencyStore', 'recordDraftToCaseResult');
  assertInjectedMethodGuard(source, 'planningPolicy', 'planCaseFromDraft');

  for (const marker of [
    'idempotencyStore !== undefined',
    'planningPolicy !== undefined',
    'draftRepository,',
    'caseCreationPort,',
    'auditPort,',
    'mountTarget,',
    'basePath,',
  ]) {
    assertIncludes(source, marker);
  }
});

test('composer keeps sanitized summary and fail-closed reason code markers', () => {
  const source = readComposerSource();

  for (const marker of [
    'REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_COMPOSER_PORTS_REQUIRED',
    'REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_COMPOSER_COMPOSE_FAILED',
    'REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_COMPOSER_READY',
    'REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_COMPOSER_MOUNTED',
    'components',
    'mounted',
    'routes',
    'requiredActions',
    'function failure',
    'function safeCode',
    'function safeActions',
    'SAFE_CODE_PATTERN',
    'catch (error)',
  ]) {
    assertIncludes(source, marker);
  }
});

test('composer keeps unmounted and explicit mountTarget composition paths', () => {
  const source = readComposerSource();

  for (const marker of [
    'if (mountTarget !== undefined)',
    'mountRepairIntakeDraftToCaseApiModule({',
    'mountTarget,',
    'apiModule,',
    'basePath,',
    'routes: routeSummary(mountSummary.routes)',
    'routes: routeSummary(apiModule.routes)',
    'mounted: Number.isInteger(mountSummary.mounted) ? mountSummary.mounted : 0',
    'mounted: 0',
    'httpMount: mounted === true',
  ]) {
    assertIncludes(source, marker);
  }
});

test('composer source avoids forbidden app, DB, provider, AI, billing, and global runtime coupling', () => {
  const source = readComposerSource();

  for (const forbidden of [
    "require('../db')",
    "require('../repositories')",
    "require('../routes')",
    "require('../controllers')",
    "require('../app')",
    "require('../server')",
    'express()',
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
    assert.equal(source.includes(forbidden), false, `forbidden source marker ${forbidden}`);
  }

  assert.doesNotMatch(source, /(^|[^'"])listen\(/, 'forbidden bare listen call');
});
