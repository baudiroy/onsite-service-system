'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createApp,
} = require('../../src/app');
const {
  REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH,
} = require('../../src/routes/repairIntakeDraftToCase.routes');

const repoRoot = path.resolve(__dirname, '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function createFakeDbClient() {
  return {
    calls: [],
    async query(text, params) {
      this.calls.push({ text, params });

      return {
        rowCount: 1,
        rows: [],
      };
    },
  };
}

function createRuntimePorts() {
  return {
    draftRepository: {
      findDraftForConversion: async () => null,
    },
    idempotencyStore: {
      findExistingDraftToCaseResult: async () => null,
      recordDraftToCaseResult: async () => ({ ok: true }),
    },
    planningPolicy: {
      planCaseFromDraft: async () => ({ status: 'planned', candidate: {} }),
    },
    caseCreationPort: {
      createCaseFromDraft: async () => ({ status: 'created' }),
    },
    auditPort: {
      recordDraftToCaseDecision: async () => ({ ok: true }),
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

test('factory-backed app options mount protected admin route when flag and dependencies are injected', () => {
  const dbClient = createFakeDbClient();
  const app = createApp({
    repairIntakeDraftToCaseRoutesEnabled: true,
    repairIntakeDraftToCase: {
      dbClient,
      idGenerator: () => 'id_app_factory_runtime_ports_001',
      caseNumberGenerator: () => 'CASE_APP_FACTORY_RUNTIME_PORTS_001',
      clock: () => '2026-05-26T00:00:00.000Z',
    },
  });

  assert.ok(findRoute(app, 'post', REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH));
  assert.equal(findRoute(app, 'post', '/api/v1/admin/repair-intake/drafts/:draftId/case/plan'), undefined);
  assert.equal(dbClient.calls.length, 0, 'factory wiring must not query during app creation');
});

test('flag off keeps factory dependencies inert and mounts no protected admin route', () => {
  const dbClient = createFakeDbClient();
  const app = createApp({
    repairIntakeDraftToCase: {
      dbClient,
      idGenerator: () => 'id_should_not_mount',
      caseNumberGenerator: () => 'CASE_SHOULD_NOT_MOUNT',
    },
  });

  assert.equal(findRoute(app, 'post', REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH), undefined);
  assert.equal(dbClient.calls.length, 0);
});

test('flag on without factory dependencies mounts no protected admin route', () => {
  const app = createApp({
    repairIntakeDraftToCaseRoutesEnabled: true,
    repairIntakeDraftToCase: {},
  });

  assert.equal(findRoute(app, 'post', REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH), undefined);
});

test('explicit runtimePorts remain supported for app-level admin route wiring', () => {
  const app = createApp({
    repairIntakeDraftToCaseRoutesEnabled: true,
    repairIntakeDraftToCaseRuntimePorts: createRuntimePorts(),
  });

  assert.ok(findRoute(app, 'post', REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH));
});

test('app factory source keeps server DB pool migration and provider boundaries', () => {
  const appSource = read('src/app.js');
  const serverSource = read('src/server.js');

  assert.match(appSource, /repairIntakeDraftToCaseRuntimePorts: options\.repairIntakeDraftToCaseRuntimePorts/);
  assert.match(appSource, /repairIntakeDraftToCase: options\.repairIntakeDraftToCase/);
  assert.equal(serverSource.includes('repairIntakeDraftToCaseRuntimePorts'), false);
  assert.equal(serverSource.includes('repairIntakeDraftToCaseRuntimePortsFactory'), false);

  [
    'DATABASE_URL',
    "require('pg')",
    'new Pool',
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
    assert.equal(appSource.includes(marker), false, `forbidden app factory marker ${marker}`);
  });
});
