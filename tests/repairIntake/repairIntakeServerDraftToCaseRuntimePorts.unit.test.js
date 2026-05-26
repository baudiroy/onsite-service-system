'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  resolveServerApp,
} = require('../../src/server');
const {
  REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH,
} = require('../../src/routes/repairIntakeDraftToCase.routes');

const repoRoot = path.resolve(__dirname, '../..');
const optionRootKey = ['repair', 'Intake', 'Draft', 'To', 'Case'].join('');
const routesEnabledOptionKey = `${optionRootKey}RoutesEnabled`;
const idGeneratorOptionKey = `${optionRootKey}IdGenerator`;
const caseNumberGeneratorOptionKey = `${optionRootKey}CaseNumberGenerator`;

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function createFakePool() {
  return {
    calls: [],
    async query(text, params) {
      this.calls.push({ text, params });

      throw new Error('fake pool query should not run during server app resolution');
    },
  };
}

function routeLayers(layerContainer) {
  const stack = Array.isArray(layerContainer && layerContainer.stack)
    ? layerContainer.stack
    : [];
  const layers = [];

  for (const layer of stack) {
    if (layer && layer.route) {
      layers.push(layer);
      continue;
    }

    if (layer && layer.handle && Array.isArray(layer.handle.stack)) {
      layers.push(...routeLayers(layer.handle));
    }
  }

  return layers;
}

function findRoute(app, method, pathname) {
  return routeLayers(app._router).find((layer) => (
    layer.route
    && layer.route.path === pathname
    && layer.route.methods[method.toLowerCase()]
  ));
}

test('server env flag wires injected pool and generators into app route mount', () => {
  const pool = createFakePool();
  const app = resolveServerApp({
    env: {
      REPAIR_INTAKE_DRAFT_TO_CASE_ROUTES_ENABLED: 'true',
    },
    pool,
    [idGeneratorOptionKey]: () => 'id_server_runtime_ports_001',
    [caseNumberGeneratorOptionKey]: () => 'CASE_SERVER_RUNTIME_PORTS_001',
  });

  assert.ok(findRoute(app, 'post', REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH));
  assert.equal(pool.calls.length, 0, 'server wiring must not query during app resolution');
});

test('server flag off keeps injected pool and generators inert', () => {
  const pool = createFakePool();
  const app = resolveServerApp({
    [routesEnabledOptionKey]: false,
    pool,
    [idGeneratorOptionKey]: () => 'id_server_should_not_mount',
    [caseNumberGeneratorOptionKey]: () => 'CASE_SERVER_SHOULD_NOT_MOUNT',
  });

  assert.equal(findRoute(app, 'post', REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH), undefined);
  assert.equal(pool.calls.length, 0);
});

test('server option flag wires nested fake client without requiring default DB pool', () => {
  const pool = createFakePool();
  const app = resolveServerApp({
    [routesEnabledOptionKey]: true,
    [optionRootKey]: {
      dbClient: pool,
      idGenerator: () => 'id_server_nested_runtime_ports_001',
      caseNumberGenerator: () => 'CASE_SERVER_NESTED_RUNTIME_PORTS_001',
    },
  });

  assert.ok(findRoute(app, 'post', REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH));
  assert.equal(pool.calls.length, 0);
});

test('server source keeps startup wiring bounded away from listen migration and provider work', () => {
  const serverSource = read('src/server.js');

  assert.match(serverSource, /REPAIR_INTAKE_DRAFT_TO_CASE_ROUTES_ENABLED/);
  assert.match(serverSource, /function resolveServerApp\(options = \{\}\) \{/);
  assert.match(serverSource, /function startServer\(options = \{\}\) \{/);
  assert.equal(serverSource.includes('repairIntakeDraftToCaseRuntimePorts'), false);
  assert.equal(serverSource.includes('repairIntakeDraftToCaseRuntimePortsFactory'), false);

  [
    'process.env.REPAIR_INTAKE',
    'DATABASE_URL',
    'db:migrate',
    'admin/src',
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
  ].forEach((marker) => {
    assert.equal(serverSource.includes(marker), false, `forbidden server marker ${marker}`);
  });
});
