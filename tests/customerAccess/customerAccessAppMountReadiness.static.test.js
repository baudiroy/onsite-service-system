'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const requiredCustomerAccessFiles = [
  'src/customerAccess/customerAccessRouteRegistry.js',
  'src/routes/customerAccessRoutes.js',
  'src/controllers/customerAccessController.js',
];

const routeAggregationFile = 'src/routes/index.js';
const appBootstrapFile = 'src/app.js';
const serverListenFile = 'src/server.js';

function filePath(file) {
  return path.join(repoRoot, file);
}

function readSource(file) {
  return fs.readFileSync(filePath(file), 'utf8');
}

function assertDoesNotContain(source, patterns, label) {
  for (const pattern of patterns) {
    assert.equal(pattern.test(source), false, `${label} should not contain ${pattern}`);
  }
}

const customerAccessMountPatterns = [
  /customerAccessRouteRegistry/,
  /customerAccessRoutes/,
  /registerCustomerAccess/,
  /customer-access/,
  /\/customer-access/,
];

test('customer access mount-prep files exist', () => {
  for (const file of requiredCustomerAccessFiles) {
    assert.equal(fs.existsSync(filePath(file)), true, `${file} should exist before app mount work`);
  }
});

test('route aggregation layer mounts feature routers and customer access registration', () => {
  assert.equal(fs.existsSync(filePath(routeAggregationFile)), true, `${routeAggregationFile} should exist`);

  const source = readSource(routeAggregationFile);

  assert.match(source, /express\.Router\(\)/, 'route index should build the central router');
  assert.match(source, /appRouter\.use\(/, 'route index should mount feature routers');
  assert.match(source, /registerCustomerAccessRoutesWithOptions\(appRouter,\s*options\.customerAccess\)/, 'route index should register customer access routes with options');
  assert.match(source, /module\.exports\s*=\s*\{[\s\S]*createAppRouter[\s\S]*router[\s\S]*\}/, 'route index should export the router factory and default router');
});

test('app bootstrap mounts the central route aggregation router factory', () => {
  assert.equal(fs.existsSync(filePath(appBootstrapFile)), true, `${appBootstrapFile} should exist`);

  const source = readSource(appBootstrapFile);

  assert.match(source, /require\(['"]\.\/routes['"]\)/, 'app bootstrap should import central routes');
  assert.match(source, /app\.use\(createAppRouter\(/, 'app bootstrap should mount the central router factory');
});

test('server listen layer is not the future customer access mount target', () => {
  assert.equal(fs.existsSync(filePath(serverListenFile)), true, `${serverListenFile} should exist`);

  const source = readSource(serverListenFile);

  assert.match(source, /app\.listen\(/, 'server file should remain the listen layer');
  assertDoesNotContain(source, customerAccessMountPatterns, serverListenFile);
});

test('customer access is mounted through route aggregation layer only', () => {
  const source = readSource(routeAggregationFile);

  assert.match(source, /registerCustomerAccessRoutesWithOptions/);
  assert.match(source, /registerCustomerAccessModuleRoutes/);
  assert.match(source, /registerCustomerAccessRoutes/);
  assert.doesNotMatch(source, /\/api\/v1\/customer-access|\/customer-access/);
});

test('customer access is not directly mounted in app bootstrap', () => {
  const source = readSource(appBootstrapFile);

  assertDoesNotContain(source, customerAccessMountPatterns, appBootstrapFile);
});

test('current app bootstrap does not directly expose customer access route path', () => {
  const routeSource = readSource(routeAggregationFile);
  const appSource = readSource(appBootstrapFile);
  const combinedBootstrapSource = `${routeSource}\n${appSource}`;

  assert.doesNotMatch(appSource, /\/customer-access/);
  assert.match(combinedBootstrapSource, /registerCustomerAccess/);
});
