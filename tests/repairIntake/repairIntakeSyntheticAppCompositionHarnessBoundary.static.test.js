'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const SOURCE_PATH = path.resolve(
  __dirname,
  '../../src/repairIntake/repairIntakeSyntheticAppCompositionHarness.js',
);

function readHarnessSource() {
  return fs.readFileSync(SOURCE_PATH, 'utf8');
}

test('synthetic app harness static boundary reads Task1061 source', () => {
  assert.equal(fs.existsSync(SOURCE_PATH), true);
});

test('synthetic app harness keeps expected factory, input, dispatch, and reason markers', () => {
  const source = readHarnessSource();

  for (const marker of [
    'createRepairIntakeSyntheticAppCompositionHarness',
    'createRepairIntakeDraftToCaseInjectedRouteComposition',
    'runtimePorts',
    'basePath',
    'mountTarget',
    'handleSyntheticRequest',
    'createSyntheticMountTarget',
    'dispatch(method, routePath, request)',
    'REPAIR_INTAKE_SYNTHETIC_APP_COMPOSITION_HARNESS_PORTS_REQUIRED',
    'REPAIR_INTAKE_SYNTHETIC_APP_COMPOSITION_HARNESS_COMPOSE_FAILED',
    'REPAIR_INTAKE_SYNTHETIC_APP_COMPOSITION_HARNESS_READY',
    'REPAIR_INTAKE_SYNTHETIC_APP_COMPOSITION_HARNESS_ROUTE_NOT_FOUND',
    'REPAIR_INTAKE_SYNTHETIC_APP_COMPOSITION_HARNESS_METHOD_NOT_ALLOWED',
  ]) {
    assert.equal(source.includes(marker), true, `missing harness marker ${marker}`);
  }
});

test('synthetic app harness imports only the route-composition wrapper from Repair Intake runtime code', () => {
  const source = readHarnessSource();
  const repairIntakeRequires = Array.from(
    source.matchAll(/require\('\.\/([^']+)'\)/g),
    (match) => match[1],
  );

  assert.deepEqual(repairIntakeRequires, [
    'repairIntakeDraftToCaseInjectedRouteComposition',
  ]);
});

test('synthetic app harness blocks lower-level composer and component imports', () => {
  const source = readHarnessSource();

  for (const forbiddenModule of [
    'repairIntakeDraftToCaseInjectedRuntimeComposer',
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
    assert.equal(source.includes(`require('./${forbiddenModule}')`), false);
  }
});

test('synthetic app harness avoids forbidden app, DB, provider, AI, billing, and global runtime coupling', () => {
  const source = readHarnessSource();

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
    'listen(',
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
    assert.equal(source.includes(forbidden), false, `forbidden harness source marker ${forbidden}`);
  }
});
