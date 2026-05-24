'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const SOURCE_PATHS = Object.freeze({
  appRouterRuntimeBehaviorTest: path.resolve(
    __dirname,
    './repairIntakeAppRouterPublicRoutePropagation.runtime-behavior.test.js'
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

function createPublicRouterBlock(source) {
  const match = source.match(/const publicRouter = createPublicRouter\(\{[\s\S]*?\}\);/);

  assert.ok(match, 'missing createPublicRouter invocation block');
  return match[0];
}

test('Task1115 inspected sources and Task1114 runtime evidence exist', () => {
  Object.values(SOURCE_PATHS).forEach((sourcePath) => {
    assert.equal(fs.existsSync(sourcePath), true, `missing inspected source ${sourcePath}`);
  });
});

test('app router keeps createAppRouter options signature and createPublicRouter invocation', () => {
  const source = readSource(SOURCE_PATHS.routesIndex);
  const propagationBlock = createPublicRouterBlock(source);

  assert.match(source, /function createAppRouter\(options = \{\}\) \{/);
  assert.match(source, /const \{ createPublicRouter \} = require\('\.\/public\.routes'\);/);
  assert.match(propagationBlock, /repairIntakeDraftToCaseRuntimePorts: options\.repairIntakeDraftToCaseRuntimePorts/);
  assert.match(propagationBlock, /repairIntakeDraftToCase: options\.repairIntakeDraftToCase/);
  assert.match(source, /appRouter\.use\('\/api\/v1\/public', publicRouter\);/);
});

test('route index blocks lower-level Repair Intake imports and markers', () => {
  const source = readSource(SOURCE_PATHS.routesIndex);
  const specifiers = requireSpecifiers(source);

  specifiers.forEach((specifier) => {
    assert.equal(specifier.includes('../repairIntake/'), false, `forbidden Repair Intake import ${specifier}`);
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
    assert.equal(source.includes(marker), false, `forbidden lower-level Repair Intake marker ${marker}`);
  });
});

test('public routes remain the only owner of the Repair Intake wrapper mount skeleton', () => {
  const routeIndexSource = readSource(SOURCE_PATHS.routesIndex);
  const publicRoutesSource = readSource(SOURCE_PATHS.publicRoutes);
  const publicRepairIntakeSpecifiers = requireSpecifiers(publicRoutesSource).filter((specifier) => (
    specifier.includes('../repairIntake/')
  ));

  assert.equal(routeIndexSource.includes('createRepairIntakeDraftToCaseInjectedRouteComposition'), false);
  assert.deepEqual(publicRepairIntakeSpecifiers, [
    '../repairIntake/repairIntakeDraftToCaseInjectedRouteComposition',
  ]);
  assert.match(publicRoutesSource, /createRepairIntakeDraftToCaseInjectedRouteComposition/);
  assert.match(publicRoutesSource, /function createPublicRouter\(options = \{\}\) \{/);
  assert.match(publicRoutesSource, /repairIntakeDraftToCaseRuntimePorts/);
  assert.match(publicRoutesSource, /repairIntakeDraftToCase\.runtimePorts/);
  assert.match(publicRoutesSource, /if \(!runtimePorts\) \{[\s\S]*?return null;[\s\S]*?\}/);
  assert.match(publicRoutesSource, /mountTarget: \{[\s\S]*?post: router\.post\.bind\(router\)[\s\S]*?\}/);
  assert.doesNotMatch(publicRoutesSource, /mountTarget:\s*router[,}]/);
});

test('app router propagation creates no default synthetic or real runtime ports', () => {
  const routeIndexSource = readSource(SOURCE_PATHS.routesIndex);
  const propagationBlock = createPublicRouterBlock(routeIndexSource);

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
    assert.equal(propagationBlock.includes(marker), false, `forbidden default port marker ${marker}`);
  });
});

test('app router propagation avoids forbidden DB repository app server provider API admin AI billing coupling', () => {
  const routeIndexSource = readSource(SOURCE_PATHS.routesIndex);
  const publicRoutesSource = readSource(SOURCE_PATHS.publicRoutes);
  const propagationBlock = createPublicRouterBlock(routeIndexSource);
  const routeIndexSpecifiers = requireSpecifiers(routeIndexSource);

  routeIndexSpecifiers.forEach((specifier) => {
    assert.equal(specifier.includes('../repositories'), false, `forbidden repository import ${specifier}`);
    assert.equal(specifier.includes('../db'), false, `forbidden DB import ${specifier}`);
    assert.equal(specifier.includes('../app'), false, `forbidden app import ${specifier}`);
    assert.equal(specifier.includes('../server'), false, `forbidden server import ${specifier}`);
  });

  [
    'app.listen',
    'server.listen',
    'listen(',
    "require('../repositories",
    "require('../db",
    "require('../app",
    "require('../server",
  ].forEach((marker) => {
    assert.equal(routeIndexSource.includes(marker), false, `forbidden route index coupling marker ${marker}`);
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
    'billing',
    'settlement',
    'payment',
    'invoice',
    'openapi',
    'swagger',
    'admin/src',
    'package.json',
  ].forEach((marker) => {
    assert.equal(propagationBlock.includes(marker), false, `forbidden propagation block marker ${marker}`);
    assert.equal(publicRoutesSource.includes(marker), false, `forbidden public route marker ${marker}`);
  });
});

test('Task1114 runtime behavior evidence path is locked by the regression guard', () => {
  const runtimeTestSource = readSource(SOURCE_PATHS.appRouterRuntimeBehaviorTest);

  assert.match(runtimeTestSource, /createAppRouter/);
  assert.match(runtimeTestSource, /repairIntakeDraftToCaseRuntimePorts/);
  assert.match(runtimeTestSource, /repairIntakeDraftToCase: \{/);
  assert.match(runtimeTestSource, /\/api\/v1\/public\/repair-intake/);
  assert.match(runtimeTestSource, /dispatchMountedRoute/);
});
