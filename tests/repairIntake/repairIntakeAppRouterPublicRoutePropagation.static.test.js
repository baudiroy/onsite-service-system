'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROUTES_INDEX_PATH = path.resolve(__dirname, '../../src/routes/index.js');
const PUBLIC_ROUTES_PATH = path.resolve(__dirname, '../../src/routes/public.routes.js');

function readSource(sourcePath) {
  return fs.readFileSync(sourcePath, 'utf8');
}

function requireSpecifiers(source) {
  const specifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers.sort();
}

test('Task1113 route index and public route sources exist', () => {
  assert.equal(fs.existsSync(ROUTES_INDEX_PATH), true);
  assert.equal(fs.existsSync(PUBLIC_ROUTES_PATH), true);
});

test('route index preserves createAppRouter signature and export', () => {
  const source = readSource(ROUTES_INDEX_PATH);

  assert.match(source, /function createAppRouter\(options = \{\}\) \{/);
  assert.match(source, /module\.exports = \{[\s\S]*?createAppRouter,[\s\S]*?router[\s\S]*?\};/);
});

test('route index creates public router through factory with Repair Intake options', () => {
  const source = readSource(ROUTES_INDEX_PATH);

  assert.match(source, /const \{ createPublicRouter \} = require\('\.\/public\.routes'\);/);
  assert.match(source, /const publicRouter = createPublicRouter\(\{[\s\S]*?repairIntakeDraftToCaseRuntimePorts: options\.repairIntakeDraftToCaseRuntimePorts,[\s\S]*?repairIntakeDraftToCase: options\.repairIntakeDraftToCase[\s\S]*?\}\);/);
  assert.match(source, /appRouter\.use\('\/api\/v1\/public', publicRouter\);/);
  assert.doesNotMatch(source, /const \{ publicRouter \} = require\('\.\/public\.routes'\);/);
});

test('route index does not create default synthetic or real Repair Intake ports', () => {
  const source = readSource(ROUTES_INDEX_PATH);

  [
    'createRepairIntake',
    'repairIntakeDraftToCaseInjected',
    'repairIntakeDraftToCaseHttpMountAdapter',
    'repairIntakeDraftToCaseController',
    'repairIntakeDraftToCaseApiModule',
    'repairIntakeDraftReaderPortAdapter',
    'repairIntakeCasePlannerPortAdapter',
    'repairIntakeCaseCreatorPortAdapter',
    'repairIntakeAuditWriterPortAdapter',
    'createRepairIntakeSyntheticAppCompositionHarness',
    'defaultRepairIntake',
    'new DraftRepository',
    'new CaseRepository',
    'new IdempotencyRepository',
    'new AuditRepository',
    'process.env.REPAIR_INTAKE',
  ].forEach((marker) => {
    assert.equal(source.includes(marker), false, `forbidden default or lower-level Repair Intake marker ${marker}`);
  });
});

test('route index imports no Repair Intake internals DB repositories app server providers or API expansion', () => {
  const source = readSource(ROUTES_INDEX_PATH);
  const specifiers = requireSpecifiers(source);

  assert.equal(specifiers.includes('./public.routes'), true);

  specifiers.forEach((specifier) => {
    assert.equal(specifier.includes('../repairIntake/'), false, `forbidden Repair Intake import ${specifier}`);
    assert.equal(specifier.includes('../repositories'), false, `forbidden repository import ${specifier}`);
    assert.equal(specifier.includes('../db'), false, `forbidden DB import ${specifier}`);
    assert.equal(specifier.includes('../app'), false, `forbidden app import ${specifier}`);
    assert.equal(specifier.includes('../server'), false, `forbidden server import ${specifier}`);
  });

  [
    'listen(',
    'app.listen',
    'server.listen',
    'DATABASE_URL',
    'psql',
    'db:migrate',
    'migration',
    'migrations',
    'sendLine',
    'sendSms',
    'sendEmail',
    'webhook',
    'openapi',
    'swagger',
    'admin/src',
    'vector',
    'rag',
    'billingRuntime',
    'settlementRuntime',
    'paymentRuntime',
    'invoiceRuntime',
  ].forEach((marker) => {
    assert.equal(source.includes(marker), false, `forbidden route index coupling marker ${marker}`);
  });
});

test('public routes still own the Repair Intake wrapper import and mount skeleton', () => {
  const source = readSource(PUBLIC_ROUTES_PATH);
  const repairIntakeSpecifiers = requireSpecifiers(source).filter((specifier) => (
    specifier.includes('../repairIntake/')
  ));

  assert.deepEqual(repairIntakeSpecifiers, [
    '../repairIntake/repairIntakeDraftToCaseInjectedRouteComposition',
  ]);
  assert.match(source, /function createPublicRouter\(options = \{\}\) \{/);
  assert.match(source, /repairIntakeDraftToCaseRuntimePorts/);
  assert.match(source, /repairIntakeDraftToCase\.runtimePorts/);
  assert.match(source, /mountTarget: \{[\s\S]*?post: router\.post\.bind\(router\)[\s\S]*?\}/);
  assert.doesNotMatch(source, /mountTarget:\s*router[,}]/);
});
