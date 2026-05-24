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

test('Task1122 inspected server app router and public route sources exist', () => {
  Object.values(SOURCE_PATHS).forEach((sourcePath) => {
    assert.equal(fs.existsSync(sourcePath), true, `missing inspected source ${sourcePath}`);
  });
});

test('server startup and listen ownership remain separated from Repair Intake route options', () => {
  const serverSource = readSource(SOURCE_PATHS.server);

  assert.match(serverSource, /function resolveServerApp\(options = \{\}\) \{/);
  assert.match(serverSource, /function createServerBootstrap\(options = \{\}\) \{/);
  assert.match(serverSource, /function startServer\(options = \{\}\) \{/);
  assert.match(serverSource, /const server = app\.listen\(port, \(\) => \{/);
  assert.match(serverSource, /if \(require\.main === module\) \{[\s\S]*?startServer\(\);[\s\S]*?\}/);
  assert.match(serverSource, /module\.exports = \{[\s\S]*?createServerBootstrap,[\s\S]*?resolveServerApp,[\s\S]*?startServer[\s\S]*?\};/);
  assert.equal(serverSource.includes('repairIntakeDraftToCaseRuntimePorts'), false);
  assert.equal(serverSource.includes('repairIntakeDraftToCase'), false);
  assert.equal(serverSource.includes('Repair Intake'), false);
});

test('server does not construct Repair Intake runtime ports or environment-driven enablement', () => {
  const serverSource = readSource(SOURCE_PATHS.server);

  [
    'createRepairIntake',
    'repairIntakeDraftToCaseInjectedRouteComposition',
    'repairIntakeDraftToCaseInjectedRuntimeComposer',
    'repairIntakeDraftToCaseHttpMountAdapter',
    'repairIntakeDraftToCaseApiModule',
    'repairIntakeDraftToCaseController',
    'repairIntakeDraftToCaseApplicationService',
    'new DraftRepository',
    'new CaseRepository',
    'new IdempotencyRepository',
    'new AuditRepository',
    'defaultRepairIntake',
    'process.env.REPAIR_INTAKE',
    'REPAIR_INTAKE_ENABLED',
    'DATABASE_URL',
  ].forEach((marker) => {
    assert.equal(serverSource.includes(marker), false, `forbidden server Repair Intake marker ${marker}`);
  });
});

test('app factory remains the current top Repair Intake route option boundary', () => {
  const appSource = readSource(SOURCE_PATHS.app);
  const routeOptionsBlock = createAppRouterOptionsBlock(appSource);

  assert.match(appSource, /function createApp\(options = \{\}\) \{/);
  assert.match(routeOptionsBlock, /repairIntakeDraftToCaseRuntimePorts: options\.repairIntakeDraftToCaseRuntimePorts/);
  assert.match(routeOptionsBlock, /repairIntakeDraftToCase: options\.repairIntakeDraftToCase/);
  assert.equal(appSource.includes("require('./repairIntake/"), false);
  assert.equal(appSource.includes('defaultRepairIntake'), false);
  assert.equal(appSource.includes('new DraftRepository'), false);
  assert.equal(appSource.includes('process.env.REPAIR_INTAKE'), false);
});

test('router and public route propagation remain intact and explicit-injection-only', () => {
  const routesIndexSource = readSource(SOURCE_PATHS.routesIndex);
  const publicRoutesSource = readSource(SOURCE_PATHS.publicRoutes);
  const publicRouterBlock = createPublicRouterBlock(routesIndexSource);

  assert.match(routesIndexSource, /function createAppRouter\(options = \{\}\) \{/);
  assert.match(publicRouterBlock, /repairIntakeDraftToCaseRuntimePorts: options\.repairIntakeDraftToCaseRuntimePorts/);
  assert.match(publicRouterBlock, /repairIntakeDraftToCase: options\.repairIntakeDraftToCase/);
  assert.match(publicRoutesSource, /createRepairIntakeDraftToCaseInjectedRouteComposition/);
  assert.match(publicRoutesSource, /repairIntakeDraftToCaseRuntimePorts/);
  assert.match(publicRoutesSource, /repairIntakeDraftToCase\.runtimePorts/);
  assert.match(publicRoutesSource, /if \(!runtimePorts\) \{[\s\S]*?return null;[\s\S]*?\}/);
  assert.match(publicRoutesSource, /mountTarget: \{[\s\S]*?post: router\.post\.bind\(router\)[\s\S]*?\}/);
});

test('Repair Intake route mount has no environment DB provider admin AI billing enablement', () => {
  const sources = {
    app: readSource(SOURCE_PATHS.app),
    publicRoutes: readSource(SOURCE_PATHS.publicRoutes),
    routesIndex: readSource(SOURCE_PATHS.routesIndex),
    server: readSource(SOURCE_PATHS.server),
  };
  const appRouteOptionsBlock = createAppRouterOptionsBlock(sources.app);
  const publicRouterBlock = createPublicRouterBlock(sources.routesIndex);

  [
    'process.env.REPAIR_INTAKE',
    'REPAIR_INTAKE_ENABLED',
    'DATABASE_URL',
    'postgres://',
  ].forEach((marker) => {
    Object.entries(sources).forEach(([sourceName, source]) => {
      assert.equal(source.includes(marker), false, `forbidden ${sourceName} environment marker ${marker}`);
    });
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
  ].forEach((marker) => {
    assert.equal(appRouteOptionsBlock.includes(marker), false, `forbidden app route option marker ${marker}`);
    assert.equal(publicRouterBlock.includes(marker), false, `forbidden app router option marker ${marker}`);
  });
});

test('future server-level propagation remains paused unless separately authorized', () => {
  const serverSource = readSource(SOURCE_PATHS.server);

  assert.match(serverSource, /withServerAppOptions\(appFactoryOptions = \{\}, options = \{\}\)/);
  assert.equal(serverSource.includes('repairIntakeDraftToCaseRuntimePorts'), false);
  assert.equal(serverSource.includes('repairIntakeDraftToCase'), false);
});
