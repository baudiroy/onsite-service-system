'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  routeIndex: 'src/routes/index.js',
  route: 'src/routes/customerAccessRoutes.js',
  controller: 'src/controllers/customerAccessController.js',
  middleware: 'src/customerAccess/customerAccessContextMiddleware.js',
  service: 'src/customerAccess/customerAccessService.js',
  resolver: 'src/customerAccess/customerAccessResolver.js',
  envelope: 'src/customerAccess/customerAccessResponseEnvelope.js',
  server: 'src/server.js',
});

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function requireSpecifiers(source) {
  const specifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers;
}

test('customer access route is registered through the central runtime router', () => {
  const source = read(FILES.routeIndex);

  assert.match(source, /const \{ registerCustomerAccessRoutes \} = require\('\.\/customerAccessRoutes'\);/);
  assert.match(source, /const \{ registerCustomerAccessModuleRoutes \} = require\('\.\.\/customerAccess\/customerAccessRouteRegistry'\);/);
  assert.match(source, /registerCustomerAccessRoutesWithOptions\(appRouter, options\.customerAccess\);/);
});

test('customer access route wires middleware before controller on GET case path', () => {
  const source = read(FILES.route);
  const specifiers = requireSpecifiers(source);

  assert.equal(source.includes("const CUSTOMER_ACCESS_ROUTE_PATH = '/customer-access/:caseId';"), true);
  assert.match(source, /router\.get\(CUSTOMER_ACCESS_ROUTE_PATH, customerAccessContextMiddleware, handleCustomerAccessRequest\);/);
  assert.deepEqual(specifiers, [
    '../customerAccess/customerAccessDbAdapter',
    '../customerAccess/customerAccessContextMiddleware',
    '../controllers/customerAccessController',
  ]);
});

test('controller and service keep resolver and safe envelope as the customer-facing decision boundary', () => {
  const controller = read(FILES.controller);
  const service = read(FILES.service);

  assert.match(controller, /buildCustomerAccessHttpResponse/);
  assert.match(controller, /statusCodeForEnvelope/);
  assert.match(service, /const \{ resolveCustomerAccess \} = require\('\.\/customerAccessResolver'\);/);
  assert.match(service, /const \{ buildCustomerAccessEnvelope \} = require\('\.\/customerAccessResponseEnvelope'\);/);
});

test('runtime route chain does not import projection service migration provider AI or billing modules directly', () => {
  for (const file of [
    FILES.route,
    FILES.controller,
    FILES.middleware,
    FILES.service,
    FILES.resolver,
    FILES.envelope,
  ]) {
    const source = read(file);
    const specifiers = requireSpecifiers(source);
    const serializedSpecifiers = JSON.stringify(specifiers);

    assert.equal(serializedSpecifiers.includes('customerServiceReportProjection'), false, file);
    assert.equal(serializedSpecifiers.includes('migrations'), false, file);
    assert.equal(serializedSpecifiers.includes('provider'), false, file);
    assert.equal(serializedSpecifiers.includes('OpenAI'), false, file);
    assert.equal(serializedSpecifiers.includes('billing'), false, file);
    assert.doesNotMatch(source, /npm run db|psql|migration|provider sending|send(Line|Sms|SMS|Email|Webhook)|finalAppointmentId\s*=|publish\(/i, file);
  }
});

test('server runtime uses bootstrap boundary and does not directly import customer access DB internals', () => {
  const source = read(FILES.server);
  const specifiers = requireSpecifiers(source);

  assert.equal(specifiers.includes('./customerAccess/customerAccessServerBootstrapPlan'), true);
  assert.equal(specifiers.includes('./customerAccess/customerAccessAppBootstrapAdapter'), true);
  assert.equal(specifiers.includes('./customerAccess/customerAccessDbAdapter'), false);
  assert.equal(specifiers.includes('./customerAccess/customerAccessDbQueryExecutor'), false);
  assert.equal(specifiers.includes('./customerAccess/customerAccessReadOnlyRepository'), false);
  assert.match(source, /CUSTOMER_ACCESS_SAFE_ENV_FLAG_KEYS/);
  assert.doesNotMatch(source, /customerServiceReportProjection|npm run db|psql|migration 0?23|provider sending/i);
});
