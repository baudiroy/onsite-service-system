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

function createAppRouterOptionsBlock(source) {
  const match = source.match(/app\.use\(createAppRouter\(\{[\s\S]*?\}\)\);/);

  assert.ok(match, 'missing app.use(createAppRouter({ ... })) block');
  return match[0];
}

function createPublicRouterBlock(source) {
  const match = source.match(/const publicRouter = createPublicRouter\(\{[\s\S]*?\}\);/);

  assert.ok(match, 'missing createPublicRouter block');
  return match[0];
}

test('Task1117 inspected app factory routing sources exist', () => {
  Object.values(SOURCE_PATHS).forEach((sourcePath) => {
    assert.equal(fs.existsSync(sourcePath), true, `missing inspected source ${sourcePath}`);
  });
});

test('app factory shape and createApp export are detected', () => {
  const appSource = readSource(SOURCE_PATHS.app);
  const specifiers = requireSpecifiers(appSource);

  assert.equal(specifiers.includes('./routes'), true);
  assert.match(appSource, /const \{ createAppRouter \} = require\('\.\/routes'\);/);
  assert.match(appSource, /function createApp\(options = \{\}\) \{/);
  assert.match(appSource, /const app = createApp\(\);/);
  assert.match(appSource, /module\.exports = \{[\s\S]*?app,[\s\S]*?createApp[\s\S]*?\};/);
});

test('app factory passes route options into createAppRouter with authorized Repair Intake options', () => {
  const appSource = readSource(SOURCE_PATHS.app);
  const routeOptionsBlock = createAppRouterOptionsBlock(appSource);

  assert.match(routeOptionsBlock, /repairIntakeDraftToCaseRuntimePorts: options\.repairIntakeDraftToCaseRuntimePorts/);
  assert.match(routeOptionsBlock, /repairIntakeDraftToCase: options\.repairIntakeDraftToCase/);
  assert.match(routeOptionsBlock, /customerAccess: options\.customerAccess/);
  assert.match(routeOptionsBlock, /dataCorrection: buildDataCorrectionOptions\(options\)/);
  assert.match(routeOptionsBlock, /engineerMobile: buildEngineerMobileOptions\(options\)/);
  assert.match(routeOptionsBlock, /engineerMobileWorkbench: buildEngineerMobileWorkbenchOptions\(options\)/);
});

test('server startup separation remains outside app factory route option propagation', () => {
  const serverSource = readSource(SOURCE_PATHS.server);

  assert.match(serverSource, /const \{ app: defaultApp, createApp \} = require\('\.\/app'\);/);
  assert.match(serverSource, /function withServerAppOptions\(appFactoryOptions = \{\}, options = \{\}\) \{/);
  assert.match(serverSource, /function startServer\(options = \{\}\) \{/);
  assert.match(serverSource, /const server = app\.listen\(port, \(\) => \{/);
  assert.match(serverSource, /if \(require\.main === module\) \{[\s\S]*?startServer\(\);[\s\S]*?\}/);
  assert.equal(serverSource.includes('repairIntakeDraftToCaseRuntimePorts'), false);
  assert.equal(serverSource.includes('repairIntakeDraftToCase'), false);
});

test('current router propagation and public route skeleton are present', () => {
  const routesIndexSource = readSource(SOURCE_PATHS.routesIndex);
  const publicRoutesSource = readSource(SOURCE_PATHS.publicRoutes);
  const publicRouterBlock = createPublicRouterBlock(routesIndexSource);

  assert.match(routesIndexSource, /function createAppRouter\(options = \{\}\) \{/);
  assert.match(routesIndexSource, /const \{ createPublicRouter \} = require\('\.\/public\.routes'\);/);
  assert.match(publicRouterBlock, /repairIntakeDraftToCaseRuntimePorts: options\.repairIntakeDraftToCaseRuntimePorts/);
  assert.match(publicRouterBlock, /repairIntakeDraftToCase: options\.repairIntakeDraftToCase/);
  assert.match(publicRoutesSource, /createRepairIntakeDraftToCaseInjectedRouteComposition/);
  assert.match(publicRoutesSource, /repairIntakeDraftToCaseRuntimePorts/);
  assert.match(publicRoutesSource, /repairIntakeDraftToCase\.runtimePorts/);
  assert.match(publicRoutesSource, /mountTarget: \{[\s\S]*?post: router\.post\.bind\(router\)[\s\S]*?\}/);
});

test('src/app.js propagation target is confirmed without server changes', () => {
  const appSource = readSource(SOURCE_PATHS.app);
  const routeOptionsBlock = createAppRouterOptionsBlock(appSource);

  assert.match(appSource, /function createApp\(options = \{\}\) \{/);
  assert.match(routeOptionsBlock, /createAppRouter\(\{/);
  assert.match(routeOptionsBlock, /repairIntakeDraftToCaseRuntimePorts: options\.repairIntakeDraftToCaseRuntimePorts/);
  assert.match(routeOptionsBlock, /repairIntakeDraftToCase: options\.repairIntakeDraftToCase/);
  assert.match(routeOptionsBlock, /customerAccess: options\.customerAccess/);
  assert.match(routeOptionsBlock, /engineerMobileWorkbench: buildEngineerMobileWorkbenchOptions\(options\)/);
});

test('app factory preflight avoids forbidden Repair Intake coupling markers', () => {
  const appSource = readSource(SOURCE_PATHS.app);
  const serverSource = readSource(SOURCE_PATHS.server);
  const routeOptionsBlock = createAppRouterOptionsBlock(appSource);
  const appSpecifiers = requireSpecifiers(appSource);

  appSpecifiers.forEach((specifier) => {
    assert.equal(specifier.includes('./repairIntake/'), false, `forbidden Repair Intake import ${specifier}`);
    assert.equal(specifier.includes('./repositories'), false, `forbidden repository import ${specifier}`);
    assert.equal(specifier.includes('./db'), false, `forbidden DB import ${specifier}`);
  });

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
    'process.env.REPAIR_INTAKE',
    'DATABASE_URL',
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
    assert.equal(routeOptionsBlock.includes(marker), false, `forbidden app route options marker ${marker}`);
  });

  assert.match(routeOptionsBlock, /repairIntakeDraftToCaseRuntimePorts/);
  assert.equal(serverSource.includes('repairIntakeDraftToCaseRuntimePorts'), false);
});
