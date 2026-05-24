'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const SOURCE_PATHS = Object.freeze({
  app: path.resolve(__dirname, '../../src/app.js'),
  publicRoutes: path.resolve(__dirname, '../../src/routes/public.routes.js'),
  routesIndex: path.resolve(__dirname, '../../src/routes/index.js'),
  server: path.resolve(__dirname, '../../src/server.js'),
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

test('Task1112 inspected route aggregation sources exist', () => {
  Object.values(SOURCE_PATHS).forEach((sourcePath) => {
    assert.equal(fs.existsSync(sourcePath), true, `missing inspected source ${sourcePath}`);
  });
});

test('app router aggregation shape is detected without modifying route files', () => {
  const routesIndexSource = readSource(SOURCE_PATHS.routesIndex);
  const specifiers = requireSpecifiers(routesIndexSource);

  assert.match(routesIndexSource, /function createAppRouter\(options = \{\}\) \{/);
  assert.match(routesIndexSource, /const appRouter = express\.Router\(\);/);
  assert.equal(specifiers.includes('./public.routes'), true);
  assert.match(routesIndexSource, /const \{ createPublicRouter \} = require\('\.\/public\.routes'\);/);
  assert.match(routesIndexSource, /const publicRouter = createPublicRouter\(\{[\s\S]*?\}\);/);
  assert.match(routesIndexSource, /appRouter\.use\('\/api\/v1\/public', publicRouter\);/);
});

test('public route mount skeleton remains explicit-injection-only', () => {
  const publicRoutesSource = readSource(SOURCE_PATHS.publicRoutes);
  const repairIntakeSpecifiers = requireSpecifiers(publicRoutesSource).filter((specifier) => (
    specifier.includes('../repairIntake/')
  ));

  assert.deepEqual(repairIntakeSpecifiers, [
    '../repairIntake/repairIntakeDraftToCaseInjectedRouteComposition',
  ]);
  assert.match(publicRoutesSource, /createRepairIntakeDraftToCaseInjectedRouteComposition/);
  assert.match(publicRoutesSource, /function createPublicRouter\(options = \{\}\) \{/);
  assert.match(publicRoutesSource, /const publicRouter = createPublicRouter\(\);/);
  assert.match(publicRoutesSource, /repairIntakeDraftToCaseRuntimePorts/);
  assert.match(publicRoutesSource, /repairIntakeDraftToCase\.runtimePorts/);
  assert.match(publicRoutesSource, /if \(!runtimePorts\) \{[\s\S]*?return null;[\s\S]*?\}/);
  assert.match(publicRoutesSource, /mountTarget: \{[\s\S]*?post: router\.post\.bind\(router\)[\s\S]*?\}/);
  assert.doesNotMatch(publicRoutesSource, /mountTarget:\s*router[,}]/);

  [
    'createRepairIntakeSyntheticAppCompositionHarness',
    'createSyntheticMountTarget',
    'defaultRepairIntake',
    'new DraftRepository',
    'new CaseRepository',
    'new IdempotencyRepository',
    'new AuditRepository',
    'process.env.REPAIR_INTAKE',
  ].forEach((marker) => {
    assert.equal(publicRoutesSource.includes(marker), false, `forbidden default port marker ${marker}`);
  });
});

test('authorized Repair Intake propagation remains limited to routes index and app factory', () => {
  const routesIndexSource = readSource(SOURCE_PATHS.routesIndex);
  const appSource = readSource(SOURCE_PATHS.app);
  const serverSource = readSource(SOURCE_PATHS.server);

  assert.match(routesIndexSource, /repairIntakeDraftToCaseRuntimePorts: options\.repairIntakeDraftToCaseRuntimePorts/);
  assert.match(routesIndexSource, /repairIntakeDraftToCase: options\.repairIntakeDraftToCase/);
  assert.match(appSource, /repairIntakeDraftToCaseRuntimePorts: options\.repairIntakeDraftToCaseRuntimePorts/);
  assert.match(appSource, /repairIntakeDraftToCase: options\.repairIntakeDraftToCase/);
  assert.equal(routesIndexSource.includes('Repair Intake'), false);
  assert.equal(appSource.includes('Repair Intake'), false);
  assert.equal(serverSource.includes('repairIntake'), false);
  assert.equal(serverSource.includes('Repair Intake'), false);
});

test('future app-router propagation target is confirmed for a routes-index-only task', () => {
  const routesIndexSource = readSource(SOURCE_PATHS.routesIndex);
  const appSource = readSource(SOURCE_PATHS.app);
  const serverSource = readSource(SOURCE_PATHS.server);

  assert.match(routesIndexSource, /function createAppRouter\(options = \{\}\) \{/);
  assert.match(routesIndexSource, /appRouter\.use\('\/api\/v1\/public', publicRouter\);/);
  assert.match(routesIndexSource, /createPublicRouter\(\{[\s\S]*?repairIntakeDraftToCaseRuntimePorts[\s\S]*?repairIntakeDraftToCase[\s\S]*?\}\)/);
  assert.match(appSource, /app\.use\(createAppRouter\(\{/);
  assert.match(serverSource, /function withServerAppOptions\(appFactoryOptions = \{\}, options = \{\}\) \{/);
});

test('inspected sources keep forbidden coupling out of Repair Intake route mount propagation', () => {
  const sources = {
    app: readSource(SOURCE_PATHS.app),
    publicRoutes: readSource(SOURCE_PATHS.publicRoutes),
    routesIndex: readSource(SOURCE_PATHS.routesIndex),
    server: readSource(SOURCE_PATHS.server),
  };

  assert.match(sources.routesIndex, /repairIntakeDraftToCaseRuntimePorts/);
  assert.match(sources.routesIndex, /repairIntakeDraftToCase/);
  assert.match(sources.app, /repairIntakeDraftToCaseRuntimePorts/);
  assert.match(sources.app, /repairIntakeDraftToCase/);

  [
    ['server', 'repairIntakeDraftToCaseRuntimePorts'],
    ['server', 'repairIntakeDraftToCase'],
  ].forEach(([sourceName, marker]) => {
    assert.equal(sources[sourceName].includes(marker), false, `unexpected server Repair Intake marker ${marker}`);
  });

  [
    ['routesIndex', "require('../repairIntake/"],
    ['routesIndex', "require('../repositories/"],
    ['routesIndex', "require('../db"],
    ['publicRoutes', "require('../repositories/"],
    ['publicRoutes', "require('../db"],
    ['app', "require('./repairIntake/"],
    ['server', "require('./repairIntake/"],
    ['server', 'openapi'],
    ['server', 'swagger'],
    ['app', 'openapi'],
    ['app', 'swagger'],
    ['publicRoutes', 'openapi'],
    ['publicRoutes', 'swagger'],
    ['routesIndex', 'admin/src'],
    ['publicRoutes', 'admin/src'],
    ['app', 'admin/src'],
    ['server', 'admin/src'],
  ].forEach(([sourceName, marker]) => {
    assert.equal(sources[sourceName].includes(marker), false, `forbidden coupling marker ${marker}`);
  });

  [
    ['app', 'createRepairIntakeDraftToCaseInjectedRouteComposition'],
    ['app', 'repairIntakeDraftToCaseInjectedRuntimeComposer'],
    ['app', 'repairIntakeDraftToCaseHttpMountAdapter'],
    ['app', 'new DraftRepository'],
    ['app', 'new CaseRepository'],
    ['app', 'process.env.REPAIR_INTAKE'],
    ['app', 'DATABASE_URL'],
    ['routesIndex', 'createRepairIntakeDraftToCaseInjectedRouteComposition'],
    ['routesIndex', 'repairIntakeDraftToCaseInjectedRuntimeComposer'],
    ['routesIndex', 'repairIntakeDraftToCaseHttpMountAdapter'],
    ['routesIndex', 'new DraftRepository'],
    ['routesIndex', 'new CaseRepository'],
    ['routesIndex', 'process.env.REPAIR_INTAKE'],
    ['routesIndex', 'DATABASE_URL'],
  ].forEach(([sourceName, marker]) => {
    assert.equal(sources[sourceName].includes(marker), false, `forbidden propagation marker ${marker}`);
  });
});
