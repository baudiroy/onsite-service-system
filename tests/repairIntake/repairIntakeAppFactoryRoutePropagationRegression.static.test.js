'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const SOURCE_PATHS = Object.freeze({
  app: path.resolve(__dirname, '../../src/app.js'),
  appFactoryRuntimeBehaviorTest: path.resolve(
    __dirname,
    './repairIntakeAppFactoryRouteOptionPropagation.runtime-behavior.test.js'
  ),
  publicRoutes: path.resolve(__dirname, '../../src/routes/public.routes.js'),
  routesIndex: path.resolve(__dirname, '../../src/routes/index.js'),
});

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

function createAppRouterOptionsBlock(source) {
  const match = source.match(/app\.use\(createAppRouter\(\{[\s\S]*?\}\)\);/);

  assert.ok(match, 'missing app.use(createAppRouter({ ... })) block');
  return match[0];
}

function createPublicRouterBlock(source) {
  const match = source.match(/const publicRouter = createPublicRouter\(\{[\s\S]*?\}\);/);

  assert.ok(match, 'missing createPublicRouter({ ... }) block');
  return match[0];
}

test('Task1120 inspected sources and Task1119 runtime evidence exist', () => {
  Object.values(SOURCE_PATHS).forEach((sourcePath) => {
    assert.equal(fs.existsSync(sourcePath), true, `missing inspected source ${sourcePath}`);
  });
});

test('app factory keeps createApp options signature createAppRouter invocation and exported app', () => {
  const appSource = readSource(SOURCE_PATHS.app);
  const routeOptionsBlock = createAppRouterOptionsBlock(appSource);

  assert.match(appSource, /function createApp\(options = \{\}\) \{/);
  assert.match(appSource, /const app = createApp\(\);/);
  assert.match(appSource, /module\.exports = \{[\s\S]*?app,[\s\S]*?createApp[\s\S]*?\};/);
  assert.match(routeOptionsBlock, /repairIntakeDraftToCaseRuntimePorts: options\.repairIntakeDraftToCaseRuntimePorts/);
  assert.match(routeOptionsBlock, /repairIntakeDraftToCase: options\.repairIntakeDraftToCase/);
  assert.match(routeOptionsBlock, /customerAccess: options\.customerAccess/);
  assert.match(routeOptionsBlock, /dataCorrection: buildDataCorrectionOptions\(options\)/);
  assert.match(routeOptionsBlock, /engineerMobile: buildEngineerMobileOptions\(options\)/);
  assert.match(routeOptionsBlock, /engineerMobileWorkbench: buildEngineerMobileWorkbenchOptions\(options\)/);
});

test('app factory blocks lower-level Repair Intake imports and markers', () => {
  const appSource = readSource(SOURCE_PATHS.app);
  const specifiers = requireSpecifiers(appSource);

  specifiers.forEach((specifier) => {
    assert.equal(specifier.includes('./repairIntake/'), false, `forbidden Repair Intake import ${specifier}`);
  });

  [
    'createRepairIntakeDraftToCaseInjectedRouteComposition',
    'repairIntakeDraftToCaseInjectedRouteComposition',
    'repairIntakeDraftToCaseInjectedRuntimeComposer',
    'repairIntakeDraftToCaseHttpMountAdapter',
    'repairIntakeDraftToCaseApiModule',
    'repairIntakeDraftToCaseController',
    'repairIntakeDraftToCaseApplicationService',
    'repairIntakeDraftReaderPortAdapter',
    'repairIntakeCasePlannerPortAdapter',
    'repairIntakeCaseCreatorPortAdapter',
    'repairIntakeAuditWriterPortAdapter',
    'repairIntakeIdempotencyPortAdapter',
    'repairIntakeSyntheticAppCompositionHarness',
  ].forEach((marker) => {
    assert.equal(appSource.includes(marker), false, `forbidden lower-level Repair Intake marker ${marker}`);
  });
});

test('router and public route ownership remains separated from app factory pass-through', () => {
  const appSource = readSource(SOURCE_PATHS.app);
  const routeIndexSource = readSource(SOURCE_PATHS.routesIndex);
  const publicRoutesSource = readSource(SOURCE_PATHS.publicRoutes);
  const routeIndexBlock = createPublicRouterBlock(routeIndexSource);
  const publicRepairIntakeSpecifiers = requireSpecifiers(publicRoutesSource).filter((specifier) => (
    specifier.includes('../repairIntake/')
  ));

  assert.equal(appSource.includes('createPublicRouter'), false);
  assert.equal(appSource.includes('createRepairIntakeDraftToCaseInjectedRouteComposition'), false);
  assert.match(routeIndexSource, /const \{ createPublicRouter \} = require\('\.\/public\.routes'\);/);
  assert.match(routeIndexBlock, /repairIntakeDraftToCaseRuntimePorts: options\.repairIntakeDraftToCaseRuntimePorts/);
  assert.match(routeIndexBlock, /repairIntakeDraftToCase: options\.repairIntakeDraftToCase/);
  assert.deepEqual(publicRepairIntakeSpecifiers, [
    '../repairIntake/repairIntakeDraftToCaseInjectedRouteComposition',
  ]);
  assert.match(publicRoutesSource, /createRepairIntakeDraftToCaseInjectedRouteComposition/);
});

test('app factory propagation creates no default synthetic or real runtime ports', () => {
  const appSource = readSource(SOURCE_PATHS.app);
  const routeOptionsBlock = createAppRouterOptionsBlock(appSource);

  [
    'defaultRepairIntake',
    'createRepairIntakeSyntheticAppCompositionHarness',
    'new DraftRepository',
    'new CaseRepository',
    'new IdempotencyRepository',
    'new AuditRepository',
    'process.env.REPAIR_INTAKE',
    'DATABASE_URL',
  ].forEach((marker) => {
    assert.equal(routeOptionsBlock.includes(marker), false, `forbidden route option marker ${marker}`);
    assert.equal(appSource.includes(marker), false, `forbidden app source marker ${marker}`);
  });
});

test('app factory propagation avoids forbidden server listen DB repository provider API admin AI billing coupling', () => {
  const appSource = readSource(SOURCE_PATHS.app);
  const routeOptionsBlock = createAppRouterOptionsBlock(appSource);
  const appSpecifiers = requireSpecifiers(appSource);

  appSpecifiers.forEach((specifier) => {
    assert.equal(specifier.includes('./server'), false, `forbidden server import ${specifier}`);
    assert.equal(specifier.includes('./repositories'), false, `forbidden repository import ${specifier}`);
    assert.equal(specifier.includes('./db'), false, `forbidden DB import ${specifier}`);
  });

  [
    'app.listen',
    'server.listen',
    'listen(',
    "require('./server",
    "require('./repositories",
    "require('./db",
  ].forEach((marker) => {
    assert.equal(appSource.includes(marker), false, `forbidden app source marker ${marker}`);
  });

  [
    'provider',
    'sendLine',
    'sendSms',
    'sendEmail',
    'webhook',
    'openai',
    'vector',
    'rag',
    'openapi',
    'swagger',
    'admin/src',
    'billing',
    'settlement',
    'payment',
    'invoice',
    'package.json',
  ].forEach((marker) => {
    assert.equal(routeOptionsBlock.includes(marker), false, `forbidden route option marker ${marker}`);
  });
});

test('Task1119 runtime behavior evidence path is locked by the regression guard', () => {
  const runtimeTestSource = readSource(SOURCE_PATHS.appFactoryRuntimeBehaviorTest);

  assert.match(runtimeTestSource, /createApp/);
  assert.match(runtimeTestSource, /repairIntakeDraftToCaseRuntimePorts/);
  assert.match(runtimeTestSource, /repairIntakeDraftToCase: \{/);
  assert.match(runtimeTestSource, /\/api\/v1\/public\/repair-intake/);
  assert.match(runtimeTestSource, /dispatchMountedRoute/);
  assert.equal(runtimeTestSource.includes("require('../../src/server')"), false);
});
