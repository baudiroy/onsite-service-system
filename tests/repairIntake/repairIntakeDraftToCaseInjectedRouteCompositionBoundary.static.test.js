'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const SOURCE_PATH = path.resolve(
  __dirname,
  '../../src/repairIntake/repairIntakeDraftToCaseInjectedRouteComposition.js',
);

function readSource() {
  return fs.readFileSync(SOURCE_PATH, 'utf8');
}

function assertIncludes(source, marker) {
  assert.equal(source.includes(marker), true, `missing wrapper marker ${marker}`);
}

test('route composition static boundary reads Task1056 wrapper source', () => {
  assert.equal(fs.existsSync(SOURCE_PATH), true);
});

test('route composition wrapper keeps factory, input, and summary markers', () => {
  const source = readSource();

  for (const marker of [
    'createRepairIntakeDraftToCaseInjectedRouteComposition',
    'createRepairIntakeDraftToCaseInjectedRuntimeComposition',
    'runtimePorts',
    'mountTarget',
    'basePath',
    'routes',
    'components',
    'requiredActions',
    'safeBasePath',
    'sanitizeComposerSummary',
    'routeReasonCode',
    'componentSummary',
    'routeSummary',
  ]) {
    assertIncludes(source, marker);
  }
});

test('route composition wrapper keeps expected route-composition reason codes', () => {
  const source = readSource();

  for (const marker of [
    'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_COMPOSITION_PORTS_REQUIRED',
    'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_COMPOSITION_FAILED',
    'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_COMPOSITION_READY',
    'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_COMPOSITION_MOUNTED',
  ]) {
    assertIncludes(source, marker);
  }
});

test('route composition wrapper imports only the runtime composer from Repair Intake runtime code', () => {
  const source = readSource();
  const repairIntakeRequires = Array.from(
    source.matchAll(/require\('\.\/([^']+)'\)/g),
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
    assert.equal(source.includes(forbiddenModule), false, `direct component import ${forbiddenModule}`);
  }
});

test('route composition wrapper keeps no-mount and explicit mountTarget composition paths', () => {
  const source = readSource();

  for (const marker of [
    'if (safeOptions.mountTarget !== undefined)',
    'composerOptions.mountTarget = safeOptions.mountTarget',
    '...safeOptions.runtimePorts',
    'basePath,',
    'createRepairIntakeDraftToCaseInjectedRuntimeComposition(',
    'sanitizeComposerSummary(composerSummary, basePath, safeOptions.mountTarget)',
  ]) {
    assertIncludes(source, marker);
  }
});

test('route composition wrapper avoids forbidden app, DB, provider, AI, billing, and global runtime coupling', () => {
  const source = readSource();

  for (const forbidden of [
    "require('../db')",
    "require('../repositories')",
    "require('../routes')",
    "require('../controllers')",
    "require('../app')",
    "require('../server')",
    'src/app',
    'src/server',
    'src/routes',
    'src/repositories',
    'src/db',
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
    assert.equal(source.includes(forbidden), false, `forbidden wrapper marker ${forbidden}`);
  }

  assert.doesNotMatch(source, /(^|[^'"])listen\(/, 'forbidden bare listen call');
});
