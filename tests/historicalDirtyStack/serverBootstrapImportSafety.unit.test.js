'use strict';

const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SERVER_PATH = path.join(REPO_ROOT, 'src/server.js');

function createSyntheticApp(label, calls) {
  return {
    label,
    listen(...args) {
      calls.listen.push({ label, args });

      return {
        close(callback) {
          calls.close.push({ label });
          if (typeof callback === 'function') {
            callback();
          }
        },
      };
    },
  };
}

function createHarness() {
  const calls = {
    appFactory: [],
    close: [],
    dbPoolRequire: [],
    listen: [],
    processOn: [],
  };
  const defaultApp = createSyntheticApp('default-app', calls);
  const createdApp = createSyntheticApp('created-app', calls);

  return {
    calls,
    modules: {
      './app': {
        app: defaultApp,
        createApp(options = {}) {
          calls.appFactory.push({ options });

          return createdApp;
        },
      },
      './config/env': {
        env: {
          port: 'synthetic-import-safety-port',
        },
      },
      './customerAccess/customerAccessAppBootstrapAdapter': {
        createCustomerAccessEnabledApp(options = {}) {
          if (options && typeof options.createApp === 'function') {
            return options.createApp(options.appFactoryOptions || {});
          }

          return createdApp;
        },
      },
      './customerAccess/customerAccessBootstrapComposer': {
        composeCustomerAccessBootstrap(input = {}) {
          return {
            customerAccessBootstrap: {
              enabled: input.enabled === true,
              customerAccess: input.customerAccess || {},
            },
          };
        },
      },
      './customerAccess/customerAccessEnvBoundary': {
        buildCustomerAccessBootstrapInputFromEnv() {
          return {
            enabled: false,
            customerAccess: {},
          };
        },
      },
      './customerAccess/customerAccessServerBootstrapPlan': {
        buildCustomerAccessServerBootstrapPlan(input = {}) {
          return {
            enabled: input.enabled === true,
            shouldCreateCustomerAccessEnabledApp: input.enabled === true,
            appFactoryOptions: {},
          };
        },
      },
      './db/pool': {
        pool: {
          async end() {
            calls.dbPoolRequire.push({ method: 'pool.end' });
          },
        },
      },
    },
  };
}

async function withImportedServer(run) {
  const harness = createHarness();
  const originalLoad = Module._load;
  const originalProcessOn = process.on;

  delete require.cache[SERVER_PATH];

  Module._load = function patchedLoad(request, parent, isMain) {
    if (parent && parent.filename === SERVER_PATH && Object.prototype.hasOwnProperty.call(harness.modules, request)) {
      if (request === './db/pool') {
        harness.calls.dbPoolRequire.push({ request });
      }

      return harness.modules[request];
    }

    return originalLoad.apply(this, [request, parent, isMain]);
  };

  process.on = function patchedProcessOn(eventName, listener) {
    if (eventName === 'SIGINT' || eventName === 'SIGTERM') {
      harness.calls.processOn.push({ eventName, listenerType: typeof listener });

      return this;
    }

    return originalProcessOn.apply(this, arguments);
  };

  try {
    const serverModule = require(SERVER_PATH);

    return await run({ harness, serverModule });
  } finally {
    process.on = originalProcessOn;
    Module._load = originalLoad;
    delete require.cache[SERVER_PATH];
  }
}

test('Task1289 imports src/server.js without calling listen or registering shutdown signals', async () => {
  await withImportedServer(async ({ harness, serverModule }) => {
    assert.equal(typeof serverModule, 'object');
    assert.deepEqual(harness.calls.listen, []);
    assert.deepEqual(harness.calls.processOn, []);
    assert.deepEqual(harness.calls.dbPoolRequire, []);
  });
});
test('Task1289 import exposes expected bootstrap functions', async () => {
  await withImportedServer(async ({ serverModule }) => {
    for (const exportName of [
      'createServerBootstrap',
      'startServer',
      'resolveServerApp',
    ]) {
      assert.equal(typeof serverModule[exportName], 'function', `${exportName} should be exported`);
    }
  });
});

test('Task1289 resolveServerApp returns a synthetic app without starting it', async () => {
  await withImportedServer(async ({ harness, serverModule }) => {
    const syntheticApp = createSyntheticApp('direct-option-app', harness.calls);
    const resolvedApp = serverModule.resolveServerApp({ app: syntheticApp });

    assert.equal(resolvedApp, syntheticApp);
    assert.deepEqual(harness.calls.listen, []);
    assert.deepEqual(harness.calls.processOn, []);
  });
});

test('Task1289 createServerBootstrap does not listen until its start delegate is called', async () => {
  await withImportedServer(async ({ harness, serverModule }) => {
    const syntheticApp = createSyntheticApp('bootstrap-option-app', harness.calls);
    const bootstrap = serverModule.createServerBootstrap({
      app: syntheticApp,
      port: 'synthetic-bootstrap-port',
    });

    assert.equal(bootstrap.app, syntheticApp);
    assert.equal(bootstrap.port, 'synthetic-bootstrap-port');
    assert.equal(typeof bootstrap.start, 'function');
    assert.deepEqual(harness.calls.listen, []);
    assert.deepEqual(harness.calls.processOn, []);
    assert.deepEqual(harness.calls.dbPoolRequire, []);
  });
});
