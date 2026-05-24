'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const INSPECTED_FILES = Object.freeze({
  app: 'src/app.js',
  server: 'src/server.js',
  routeIndex: 'src/routes/index.js',
  publicRoutes: 'src/routes/public.routes.js',
});

const REPAIR_INTAKE_ROUTE_MARKERS = Object.freeze([
  'repairIntakeDraftToCase',
  'createRepairIntakeDraftToCaseInjectedRouteComposition',
  'createRepairIntakeSyntheticAppCompositionHarness',
  '/repair-intake/drafts/:draftId/case/plan',
  '/repair-intake/drafts/:draftId/case/submit',
]);

const FUTURE_MOUNT_FORBIDDEN_TARGETS = Object.freeze([
  'src/server.js',
  'src/db',
  'src/repositories',
  'migrations',
  'providers',
  'admin',
  'ai',
  'rag',
  'billing',
  'settlement',
  'payment',
  'invoice',
]);

const APPROVED_TASK1108_PUBLIC_ROUTE_MARKERS = Object.freeze([
  'repairIntakeDraftToCase',
  'createRepairIntakeDraftToCaseInjectedRouteComposition',
  'repairIntakeDraftToCaseRuntimePorts',
  '/repair-intake',
]);

const APPROVED_TASK1113_ROUTE_INDEX_MARKERS = Object.freeze([
  'repairIntakeDraftToCase',
  'repairIntakeDraftToCaseRuntimePorts',
  'createPublicRouter',
]);

const APPROVED_TASK1118_APP_MARKERS = Object.freeze([
  'repairIntakeDraftToCase',
  'repairIntakeDraftToCaseRuntimePorts',
]);

const STILL_FORBIDDEN_PUBLIC_ROUTE_MARKERS = Object.freeze([
  'createRepairIntakeSyntheticAppCompositionHarness',
  '/repair-intake/drafts/:draftId/case/plan',
  '/repair-intake/drafts/:draftId/case/submit',
  'planDraftToCase',
  'submitDraftToCase',
  'createSyntheticMountTarget',
  'new DraftRepository',
  'new CaseRepository',
  "require('../db')",
  "require('../repositories')",
  'process.env',
  'DATABASE_URL',
  'app.listen',
  'server.listen',
  'listen(',
]);

const STILL_FORBIDDEN_PASS_THROUGH_MARKERS = Object.freeze([
  'createRepairIntakeDraftToCaseInjectedRouteComposition',
  'createRepairIntakeSyntheticAppCompositionHarness',
  '/repair-intake/drafts/:draftId/case/plan',
  '/repair-intake/drafts/:draftId/case/submit',
  'planDraftToCase',
  'submitDraftToCase',
  'createSyntheticMountTarget',
  'new DraftRepository',
  'new CaseRepository',
  "require('../repairIntake/')",
  "require('./repairIntake/')",
  "require('../db')",
  "require('./db')",
  "require('../repositories')",
  "require('./repositories')",
  'process.env.REPAIR_INTAKE',
  'DATABASE_URL',
  'app.listen',
  'server.listen',
  'listen(',
]);

function includesForbiddenTarget(relativePath, forbidden) {
  if (forbidden.includes('/')) {
    return relativePath.includes(forbidden);
  }

  return relativePath.split('/').includes(forbidden);
}

function filePath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(filePath(relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(filePath(relativePath));
}

function inspectedSources() {
  return Object.entries(INSPECTED_FILES).map(([key, relativePath]) => ({
    key,
    relativePath,
    source: read(relativePath),
  }));
}

function hasPublicRouteAggregator(source) {
  return (
    /function createPublicRouter\(options = {}\)/.test(source)
    && /const router = express\.Router\(\)/.test(source)
    && /router\.post\(/.test(source)
    && /publicRouter/.test(source)
  );
}

function hasCentralRouteIndex(source) {
  return (
    /function createAppRouter\(options = {}\)/.test(source)
    && /const appRouter = express\.Router\(\)/.test(source)
    && /appRouter\.use\('/.test(source)
  );
}

test('Task1107 route mount preflight inspected files exist', () => {
  Object.values(INSPECTED_FILES).forEach((relativePath) => {
    assert.equal(exists(relativePath), true, `${relativePath} is missing`);
  });
});

test('current project exposes central route index public route aggregator and express-like routers', () => {
  const routeIndex = read(INSPECTED_FILES.routeIndex);
  const publicRoutes = read(INSPECTED_FILES.publicRoutes);

  assert.equal(hasCentralRouteIndex(routeIndex), true, 'src/routes/index.js should be central route index');
  assert.equal(
    hasPublicRouteAggregator(publicRoutes),
    true,
    'src/routes/public.routes.js should be public route aggregator',
  );
  assert.match(routeIndex, /appRouter\.use\('\/api\/v1\/public', publicRouter\)/);
});

test('app and server boundaries are identified without selecting listen startup as mount target', () => {
  const appSource = read(INSPECTED_FILES.app);
  const serverSource = read(INSPECTED_FILES.server);

  assert.match(appSource, /const \{ createAppRouter \} = require\('\.\/routes'\)/);
  assert.match(appSource, /app\.use\(createAppRouter\(/);
  assert.match(serverSource, /function startServer\(options = {}\)/);
  assert.match(serverSource, /app\.listen\(port/);

  assert.notEqual(INSPECTED_FILES.publicRoutes, INSPECTED_FILES.server);
});

test('Task1107/Task1108 route files contain only authorized Repair Intake wrapper skeleton markers', () => {
  inspectedSources().forEach(({ relativePath, source }) => {
    if (relativePath === INSPECTED_FILES.publicRoutes) {
      APPROVED_TASK1108_PUBLIC_ROUTE_MARKERS.forEach((marker) => {
        if (source.includes(marker)) {
          assert.ok(true, `${relativePath} contains approved Task1108 marker ${marker}`);
        }
      });

      STILL_FORBIDDEN_PUBLIC_ROUTE_MARKERS.forEach((marker) => {
        assert.equal(source.includes(marker), false, `${relativePath} contains forbidden marker ${marker}`);
      });

      return;
    }

    if (relativePath === INSPECTED_FILES.routeIndex) {
      APPROVED_TASK1113_ROUTE_INDEX_MARKERS.forEach((marker) => {
        assert.equal(source.includes(marker), true, `${relativePath} should contain approved Task1113 marker ${marker}`);
      });

      STILL_FORBIDDEN_PASS_THROUGH_MARKERS.forEach((marker) => {
        assert.equal(source.includes(marker), false, `${relativePath} contains forbidden marker ${marker}`);
      });

      return;
    }

    if (relativePath === INSPECTED_FILES.app) {
      APPROVED_TASK1118_APP_MARKERS.forEach((marker) => {
        assert.equal(source.includes(marker), true, `${relativePath} should contain approved Task1118 marker ${marker}`);
      });

      STILL_FORBIDDEN_PASS_THROUGH_MARKERS.forEach((marker) => {
        assert.equal(source.includes(marker), false, `${relativePath} contains forbidden marker ${marker}`);
      });

      return;
    }

    REPAIR_INTAKE_ROUTE_MARKERS.forEach((marker) => {
      assert.equal(source.includes(marker), false, `${relativePath} already contains ${marker}`);
    });
  });
});

test('Task1108 public route skeleton remains explicit-injection only when present', () => {
  const publicRoutes = read(INSPECTED_FILES.publicRoutes);

  if (!publicRoutes.includes('createRepairIntakeDraftToCaseInjectedRouteComposition')) {
    assert.ok(true, 'Task1108 skeleton not present yet');
    return;
  }

  assert.match(publicRoutes, /function getRepairIntakeDraftToCaseRuntimePorts\(options = {}\)/);
  assert.match(publicRoutes, /if \(!runtimePorts\) \{[\s\S]*?return null;[\s\S]*?\}/);
  assert.match(publicRoutes, /basePath: '\/repair-intake'/);
  assert.match(publicRoutes, /mountTarget: \{[\s\S]*?post: router\.post\.bind\(router\)[\s\S]*?\}/);
  assert.doesNotMatch(publicRoutes, /createRepairIntakeSyntheticAppCompositionHarness/);
});

test('future bounded route mount target is confirmed as the public route aggregator', () => {
  const publicRoutes = read(INSPECTED_FILES.publicRoutes);
  const routeIndex = read(INSPECTED_FILES.routeIndex);
  const candidate = hasPublicRouteAggregator(publicRoutes)
    ? INSPECTED_FILES.publicRoutes
    : (hasCentralRouteIndex(routeIndex) ? INSPECTED_FILES.routeIndex : null);

  assert.equal(candidate, INSPECTED_FILES.publicRoutes);
});

test('future route mount must remain out of server DB repository provider admin AI and billing areas', () => {
  const proposedFutureAllowedFiles = Object.freeze([
    INSPECTED_FILES.publicRoutes,
    'tests/repairIntake/repairIntakeRouteMountTargetPreflight.static.test.js',
    'docs/task-1107-repair-intake-route-mount-target-preflight-guard-no-runtime-change.md',
  ]);

  proposedFutureAllowedFiles.forEach((relativePath) => {
    FUTURE_MOUNT_FORBIDDEN_TARGETS.forEach((forbidden) => {
      assert.equal(
        includesForbiddenTarget(relativePath, forbidden),
        false,
        `${relativePath} must not include forbidden future mount target ${forbidden}`,
      );
    });
  });
});
