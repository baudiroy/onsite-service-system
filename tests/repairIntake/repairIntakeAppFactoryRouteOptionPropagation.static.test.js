'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const SOURCE_PATHS = Object.freeze({
  app: path.resolve(__dirname, '../../src/app.js'),
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

test('Task1118 app factory and route sources exist', () => {
  Object.values(SOURCE_PATHS).forEach((sourcePath) => {
    assert.equal(fs.existsSync(sourcePath), true, `missing inspected source ${sourcePath}`);
  });
});

test('app factory preserves createApp signature and exported app behavior', () => {
  const source = readSource(SOURCE_PATHS.app);

  assert.match(source, /function createApp\(options = \{\}\) \{/);
  assert.match(source, /const app = createApp\(\);/);
  assert.match(source, /module\.exports = \{[\s\S]*?app,[\s\S]*?createApp[\s\S]*?\};/);
});

test('app factory propagates direct and nested Repair Intake route options into createAppRouter', () => {
  const source = readSource(SOURCE_PATHS.app);
  const routeOptionsBlock = createAppRouterOptionsBlock(source);

  assert.match(routeOptionsBlock, /repairIntakeDraftToCaseRuntimePorts: options\.repairIntakeDraftToCaseRuntimePorts/);
  assert.match(routeOptionsBlock, /repairIntakeDraftToCase: options\.repairIntakeDraftToCase/);
  assert.match(routeOptionsBlock, /customerAccess: options\.customerAccess/);
  assert.match(routeOptionsBlock, /dataCorrection: buildDataCorrectionOptions\(options\)/);
  assert.match(routeOptionsBlock, /engineerMobile: buildEngineerMobileOptions\(options\)/);
  assert.match(routeOptionsBlock, /engineerMobileWorkbench: buildEngineerMobileWorkbenchOptions\(options\)/);
});

test('app factory imports no Repair Intake internals DB repositories server or route internals', () => {
  const source = readSource(SOURCE_PATHS.app);
  const specifiers = requireSpecifiers(source);

  assert.equal(specifiers.includes('./routes'), true);

  specifiers.forEach((specifier) => {
    assert.equal(specifier.includes('./repairIntake/'), false, `forbidden Repair Intake import ${specifier}`);
    assert.equal(specifier.includes('./repositories'), false, `forbidden repository import ${specifier}`);
    assert.equal(specifier.includes('./db'), false, `forbidden DB import ${specifier}`);
    assert.equal(specifier.includes('./server'), false, `forbidden server import ${specifier}`);
    assert.equal(specifier.includes('./routes/'), false, `forbidden route-internal import ${specifier}`);
  });
});

test('app factory creates no default synthetic or real Repair Intake runtime ports', () => {
  const source = readSource(SOURCE_PATHS.app);
  const routeOptionsBlock = createAppRouterOptionsBlock(source);

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
    'DATABASE_URL',
  ].forEach((marker) => {
    assert.equal(routeOptionsBlock.includes(marker), false, `forbidden app route options marker ${marker}`);
    assert.equal(source.includes(marker), false, `forbidden app source marker ${marker}`);
  });
});

test('server startup remains untouched and free of Repair Intake route option markers', () => {
  const serverSource = readSource(SOURCE_PATHS.server);

  assert.match(serverSource, /function startServer\(options = \{\}\) \{/);
  assert.match(serverSource, /const server = app\.listen\(port, \(\) => \{/);
  assert.equal(serverSource.includes('repairIntakeDraftToCaseRuntimePorts'), false);
  assert.equal(serverSource.includes('repairIntakeDraftToCase'), false);
});

test('route index remains the downstream owner of public route propagation', () => {
  const routesIndexSource = readSource(SOURCE_PATHS.routesIndex);

  assert.match(routesIndexSource, /function createAppRouter\(options = \{\}\) \{/);
  assert.match(routesIndexSource, /const \{ createPublicRouter \} = require\('\.\/public\.routes'\);/);
  assert.match(routesIndexSource, /repairIntakeDraftToCaseRuntimePorts: options\.repairIntakeDraftToCaseRuntimePorts/);
  assert.match(routesIndexSource, /repairIntakeDraftToCase: options\.repairIntakeDraftToCase/);
});

test('app route option propagation block has no provider server listen API admin AI billing coupling', () => {
  const source = readSource(SOURCE_PATHS.app);
  const routeOptionsBlock = createAppRouterOptionsBlock(source);

  [
    'provider',
    'sendLine',
    'sendSms',
    'sendEmail',
    'webhook',
    'openai',
    'vector',
    'rag',
    'app.listen',
    'server.listen',
    'listen(',
    'openapi',
    'swagger',
    'admin/src',
    'billing',
    'settlement',
    'payment',
    'invoice',
    'package.json',
  ].forEach((marker) => {
    assert.equal(routeOptionsBlock.includes(marker), false, `forbidden app route options marker ${marker}`);
  });
});
