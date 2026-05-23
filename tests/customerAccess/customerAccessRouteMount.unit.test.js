'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const routeIndexFile = 'src/routes/index.js';

const { router } = require('../../src/routes');

function readSource(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function routeLayers() {
  return router.stack.filter((layer) => layer.route);
}

function customerAccessRoutes() {
  return routeLayers().filter((layer) => layer.route.path === '/customer-access/:caseId');
}

function createSyntheticRes() {
  const calls = {
    status: [],
    json: [],
  };

  return {
    calls,
    status(code) {
      calls.status.push(code);
      return this;
    },
    json(body) {
      calls.json.push(body);
      return body;
    },
  };
}

function invokeMountedRoute(req) {
  const [route] = customerAccessRoutes();
  const handlers = route.route.stack.map((layer) => layer.handle);
  const res = createSyntheticRes();
  let nextCallCount = 0;

  handlers[0](req, res, () => {
    nextCallCount += 1;
  });
  const body = handlers[handlers.length - 1](req, res);

  return {
    body,
    nextCallCount,
    res,
  };
}

const forbiddenResponseValues = [
  '0912-345-678',
  '台北市信義區測試路1號',
  'U1234567890abcdef',
  'MISSING_ORGANIZATION_SCOPE',
  'UNVERIFIED_CUSTOMER_IDENTITY',
  'MISSING_CASE_LINKAGE',
  'PUBLICATION_NOT_ALLOWED',
  'CUSTOMER_VISIBLE_POLICY_FAILED',
];

test('src/routes/index.js still exports central router', () => {
  assert.equal(typeof router, 'function');
  assert.equal(Array.isArray(router.stack), true);
});

test('customer access route is mounted once on the central router', () => {
  const routes = customerAccessRoutes();

  assert.equal(routes.length, 1);
});

test('mounted customer access route path and method are stable', () => {
  const [route] = customerAccessRoutes();

  assert.equal(route.route.path, '/customer-access/:caseId');
  assert.equal(route.route.methods.get, true);
  assert.equal(route.route.methods.post, undefined);
});

test('mounted customer access handler returns generic safe-deny without middleware context', () => {
  const { body, nextCallCount, res } = invokeMountedRoute({ params: { caseId: 'case-synthetic' } });

  assert.equal(nextCallCount, 1);
  assert.deepEqual(res.calls.status, [404]);
  assert.equal(body.status, 'deny');
  assert.equal(body.messageKey, 'customerAccess.unavailable');
  assert.equal(body.customerVisible, false);
  assert.deepEqual(body.error, {
    messageKey: 'customerAccess.unavailable',
  });
});

test('mounted customer access handler does not expose internal reason or raw identity fields', () => {
  const { body } = invokeMountedRoute(
    {
      params: { caseId: 'case-synthetic' },
      auth: { organizationId: 'org-synthetic' },
      channel: { lineUserId: 'U1234567890abcdef' },
      rawPhone: '0912-345-678',
      rawAddress: '台北市信義區測試路1號',
    },
  );
  const serialized = JSON.stringify(body);

  for (const value of forbiddenResponseValues) {
    assert.equal(serialized.includes(value), false, `route response leaked forbidden value: ${value}`);
  }
});

test('route index mounts customer access through registry only', () => {
  const source = readSource(routeIndexFile);

  assert.match(
    source,
    /require\(['"]\.\.\/customerAccess\/customerAccessRouteRegistry['"]\)/,
    'route index should import the customer access route registry',
  );
  assert.match(source, /registerCustomerAccessModuleRoutes\(appRouter\)/);
  assert.match(source, /registerCustomerAccessRoutesWithOptions\(appRouter, options\.customerAccess\)/);
  assert.doesNotMatch(source, /require\(['"]\.\.\/controllers\/customerAccessController['"]\)/);
});

test('route index does not import customer access DB, repository, provider, or server listen layer', () => {
  const source = readSource(routeIndexFile);

  assert.doesNotMatch(source, /customerAccess.*repositories?/i);
  assert.doesNotMatch(source, /customerAccess.*providers?/i);
  assert.doesNotMatch(source, /customerAccess.*db/i);
  assert.doesNotMatch(source, /require\(['"]\.\.\/server['"]\)/);
  assert.doesNotMatch(source, /app\.listen\(/);
});
